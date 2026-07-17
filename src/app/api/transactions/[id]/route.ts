import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/transactions/[id] - Single transaction with items and user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Transaction GET error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
