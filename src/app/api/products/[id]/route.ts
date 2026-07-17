import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/products/[id] - Single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await db.product.findUnique({
      where: { id },
      include: { category: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Product GET error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check barcode uniqueness if being changed
    if (body.barcode && body.barcode !== existing.barcode) {
      const barcodeExists = await db.product.findUnique({
        where: { barcode: body.barcode },
      })
      if (barcodeExists) {
        return NextResponse.json(
          { error: 'Barcode sudah digunakan' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (body.barcode !== undefined) updateData.barcode = body.barcode || null
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.price !== undefined) updateData.price = parseInt(String(body.price))
    if (body.costPrice !== undefined) updateData.costPrice = parseInt(String(body.costPrice))
    if (body.stock !== undefined) updateData.stock = parseInt(String(body.stock))
    if (body.minStock !== undefined) updateData.minStock = parseInt(String(body.minStock))
    if (body.unit !== undefined) updateData.unit = body.unit
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.image !== undefined) updateData.image = body.image || null
    if (body.active !== undefined) updateData.active = body.active

    const product = await db.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Product PUT error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Soft delete (set active=false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    const product = await db.product.update({
      where: { id },
      data: { active: false },
      include: { category: true },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Product DELETE error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
