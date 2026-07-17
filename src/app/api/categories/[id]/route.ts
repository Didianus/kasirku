import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/categories/[id] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Kategori tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check name uniqueness if changing
    if (body.name && body.name !== existing.name) {
      const nameExists = await db.category.findUnique({
        where: { name: body.name },
      })
      if (nameExists) {
        return NextResponse.json(
          { error: 'Nama kategori sudah digunakan' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.icon !== undefined) updateData.icon = body.icon || null
    if (body.color !== undefined) updateData.color = body.color || null

    const category = await db.category.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { products: true } } },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Category PUT error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Delete category (only if no products)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Kategori tidak ditemukan' },
        { status: 404 }
      )
    }

    if (existing._count.products > 0) {
      return NextResponse.json(
        { error: 'Kategori tidak dapat dihapus karena masih memiliki produk' },
        { status: 400 }
      )
    }

    await db.category.delete({ where: { id } })

    return NextResponse.json({ message: 'Kategori berhasil dihapus' })
  } catch (error) {
    console.error('Category DELETE error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
