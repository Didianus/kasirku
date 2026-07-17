import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/categories - List all categories with product count
export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    })

    const categoriesWithCount = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      productCount: cat._count.products,
    }))

    return NextResponse.json({ categories: categoriesWithCount })
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, icon, color } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nama kategori wajib diisi' },
        { status: 400 }
      )
    }

    // Check uniqueness
    const existing = await db.category.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json(
        { error: 'Nama kategori sudah digunakan' },
        { status: 400 }
      )
    }

    const category = await db.category.create({
      data: {
        name,
        icon: icon || null,
        color: color || null,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
