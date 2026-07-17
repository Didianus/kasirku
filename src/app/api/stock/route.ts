import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/stock - List stock logs with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId') || ''
    const type = searchParams.get('type') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (productId) {
      where.productId = productId
    }

    if (type) {
      where.type = type
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

    const [logs, total] = await Promise.all([
      db.stockLog.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, unit: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.stockLog.count({ where }),
    ])

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Stock GET error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST /api/stock - Create stock log entry (barang masuk/keluar/adjustment)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, type, quantity, note, userId } = body

    if (!productId || !type || quantity === undefined || quantity === null || !userId) {
      return NextResponse.json(
        { error: 'Produk, tipe, jumlah, dan user wajib diisi' },
        { status: 400 }
      )
    }

    if (!['in', 'out', 'adjustment'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipe harus salah satu: in, out, adjustment' },
        { status: 400 }
      )
    }

    // Verify product exists
    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
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

    // Calculate new stock based on type
    let newStock: number
    switch (type) {
      case 'in':
        newStock = product.stock + quantity
        break
      case 'out':
        newStock = product.stock - quantity
        if (newStock < 0) {
          return NextResponse.json(
            { error: `Stok tidak cukup (sisa: ${product.stock})` },
            { status: 400 }
          )
        }
        break
      case 'adjustment':
        newStock = quantity
        break
      default:
        newStock = product.stock
    }

    // Create stock log and update product stock in transaction
    const [stockLog] = await db.$transaction([
      db.stockLog.create({
        data: {
          productId,
          type,
          quantity,
          note: note || null,
          userId,
        },
        include: {
          product: { select: { id: true, name: true, unit: true } },
          user: { select: { id: true, name: true } },
        },
      }),
    ])

    // Update product stock - reactivate if stock > 0 and was inactive
    const updateData: Record<string, unknown> = { stock: newStock }
    if (newStock > 0 && !product.active) {
      updateData.active = true
    }

    await db.product.update({
      where: { id: productId },
      data: updateData,
    })

    return NextResponse.json({ stockLog, newStock }, { status: 201 })
  } catch (error) {
    console.error('Stock POST error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
