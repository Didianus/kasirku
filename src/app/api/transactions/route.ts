import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/transactions - List transactions with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const status = searchParams.get('status') || ''
    const paymentMethod = searchParams.get('paymentMethod') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customerName: { contains: search } },
      ]
    }

    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {}
      if (dateFrom) createdAt.gte = new Date(dateFrom)
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        createdAt.lte = toDate
      }
      where.createdAt = createdAt
    }

    if (status) {
      where.status = status
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          items: true,
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.transaction.count({ where }),
    ])

    return NextResponse.json({
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Transactions GET error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST /api/transactions - Create transaction (POS checkout)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      customerName,
      items,
      discount,
      discountType,
      paymentMethod,
      paid,
      notes,
    } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User wajib diisi' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Item transaksi wajib diisi' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 400 }
      )
    }

    // Validate all products exist and have enough stock
    const productIds = items.map((item: { productId: string }) => item.productId)
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    })

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) {
        return NextResponse.json(
          { error: `Produk dengan ID ${item.productId} tidak ditemukan` },
          { status: 400 }
        )
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stok ${product.name} tidak cukup (sisa: ${product.stock})` },
          { status: 400 }
        )
      }
    }

    // Calculate subtotal from items
    const transactionItems = items.map((item: { productId: string; quantity: number; price?: number }) => {
      const product = products.find((p) => p.id === item.productId)!
      const price = item.price || product.price
      const subtotal = price * item.quantity
      return {
        productId: item.productId,
        productName: product.name,
        price,
        quantity: item.quantity,
        subtotal,
      }
    })

    const subtotal = transactionItems.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0)

    // Apply discount
    let discountAmount = 0
    if (discount && discount > 0) {
      if (discountType === 'percent') {
        discountAmount = Math.round(subtotal * (discount / 100))
      } else {
        discountAmount = discount
      }
    }

    // Get store config for tax
    const storeConfig = await db.storeConfig.findFirst()
    const taxRate = storeConfig?.taxRate || 0

    // Calculate tax on (subtotal - discount)
    const afterDiscount = subtotal - discountAmount
    const taxAmount = Math.round(afterDiscount * (taxRate / 100))

    // Calculate total
    const total = afterDiscount + taxAmount

    // Calculate change
    const paidAmount = paid || 0
    const changeAmount = paidAmount - total

    if (paidAmount < total && paymentMethod === 'cash') {
      return NextResponse.json(
        { error: 'Jumlah bayar kurang dari total' },
        { status: 400 }
      )
    }

    // Generate invoice number: INV-YYYYMMDD-sequence
    const now = new Date()
    const dateStr = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0')

    // Count today's transactions for sequence
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayTransactionCount = await db.transaction.count({
      where: { createdAt: { gte: todayStart } },
    })
    const sequence = String(todayTransactionCount + 1).padStart(4, '0')
    const invoiceNumber = `INV-${dateStr}-${sequence}`

    // Create transaction with items in a single operation
    const transaction = await db.transaction.create({
      data: {
        invoiceNumber,
        userId,
        customerName: customerName || null,
        subtotal,
        discount: discountAmount,
        discountType: discountType || 'nominal',
        tax: taxAmount,
        total,
        paid: paidAmount,
        change: changeAmount,
        paymentMethod: paymentMethod || 'cash',
        status: 'completed',
        notes: notes || null,
        items: {
          create: transactionItems,
        },
      },
      include: {
        items: true,
        user: { select: { id: true, name: true } },
      },
    })

    // Decrement product stock and deactivate if stock reaches 0
    for (const item of transactionItems) {
      const product = products.find((p) => p.id === item.productId)!
      const newStock = product.stock - item.quantity

      await db.product.update({
        where: { id: item.productId },
        data: {
          stock: newStock,
          ...(newStock <= 0 ? { active: false } : {}),
        },
      })
    }

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('Transactions POST error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
