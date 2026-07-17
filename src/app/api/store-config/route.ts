import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/store-config - Return store config (first record)
export async function GET() {
  try {
    let config = await db.storeConfig.findFirst()

    // Create default config if none exists
    if (!config) {
      config = await db.storeConfig.create({
        data: {
          storeName: 'KasirKu POS',
          taxRate: 0,
        },
      })
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('StoreConfig GET error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT /api/store-config - Update store config
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    let config = await db.storeConfig.findFirst()

    if (!config) {
      // Create if not exists
      config = await db.storeConfig.create({
        data: {
          storeName: body.storeName || 'KasirKu POS',
          logo: body.logo || null,
          address: body.address || null,
          phone: body.phone || null,
          taxRate: body.taxRate !== undefined ? parseFloat(String(body.taxRate)) : 0,
          receiptFooter: body.receiptFooter || null,
        },
      })
    } else {
      // Update existing
      const updateData: Record<string, unknown> = {}
      if (body.storeName !== undefined) updateData.storeName = body.storeName
      if (body.logo !== undefined) updateData.logo = body.logo || null
      if (body.address !== undefined) updateData.address = body.address || null
      if (body.phone !== undefined) updateData.phone = body.phone || null
      if (body.taxRate !== undefined) updateData.taxRate = parseFloat(String(body.taxRate))
      if (body.receiptFooter !== undefined) updateData.receiptFooter = body.receiptFooter || null

      config = await db.storeConfig.update({
        where: { id: config.id },
        data: updateData,
      })
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('StoreConfig PUT error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
