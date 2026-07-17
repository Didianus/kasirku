import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/products - List products with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const active = searchParams.get('active')
    const lowStock = searchParams.get('lowStock')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { barcode: { contains: search } },
        { description: { contains: search } },
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (active !== null && active !== '') {
      where.active = active === 'true'
    }

    if (lowStock === 'true') {
      where.stock = { lte: 5 } // Will filter properly below
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ])

    // If lowStock filter, refine results where stock <= minStock
    const filteredProducts = lowStock === 'true'
      ? products.filter((p) => p.stock <= p.minStock)
      : products

    return NextResponse.json({
      products: filteredProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      barcode,
      name,
      description,
      price,
      costPrice,
      stock,
      minStock,
      unit,
      categoryId,
      image,
    } = body

    if (!name || price === undefined || price === null || !categoryId) {
      return NextResponse.json(
        { error: 'Nama, harga, dan kategori wajib diisi' },
        { status: 400 }
      )
    }

    // Check if barcode already exists
    if (barcode) {
      const existing = await db.product.findUnique({ where: { barcode } })
      if (existing) {
        return NextResponse.json(
          { error: 'Barcode sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // Verify category exists
    const category = await db.category.findUnique({ where: { id: categoryId } })
    if (!category) {
      return NextResponse.json(
        { error: 'Kategori tidak ditemukan' },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: {
        barcode: barcode || null,
        name,
        description: description || null,
        price: parseInt(String(price)),
        costPrice: parseInt(String(costPrice || 0)),
        stock: parseInt(String(stock || 0)),
        minStock: parseInt(String(minStock || 5)),
        unit: unit || 'pcs',
        categoryId,
        image: image || null,
      },
      include: { category: true },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Products POST error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
