import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/reports - Generate reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'daily'
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const where: Record<string, unknown> = { status: 'completed' }

    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {}
      if (dateFrom) createdAt.gte = new Date(dateFrom)
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        createdAt.lte = toDate
      }
      where.createdAt = createdAt
    } else {
      // Default: last 30 days for daily, last 12 months for monthly
      const defaultStart = new Date()
      if (type === 'daily') {
        defaultStart.setDate(defaultStart.getDate() - 30)
      } else if (type === 'monthly') {
        defaultStart.setMonth(defaultStart.getMonth() - 12)
      } else {
        defaultStart.setDate(defaultStart.getDate() - 30)
      }
      defaultStart.setHours(0, 0, 0, 0)
      where.createdAt = { gte: defaultStart }
    }

    if (type === 'product') {
      // Product report: group by product
      const items = await db.transactionItem.findMany({
        where: {
          transaction: { status: 'completed', ...(where.createdAt ? { createdAt: where.createdAt } : {}) },
        },
        include: {
          product: { select: { id: true, name: true } },
        },
      })

      const productMap = new Map<string, { productId: string; productName: string; quantitySold: number; revenue: number }>()
      for (const item of items) {
        const existing = productMap.get(item.productId) || {
          productId: item.productId,
          productName: item.productName,
          quantitySold: 0,
          revenue: 0,
        }
        existing.quantitySold += item.quantity
        existing.revenue += item.subtotal
        productMap.set(item.productId, existing)
      }

      const productReport = Array.from(productMap.values()).sort(
        (a, b) => b.revenue - a.revenue
      )

      return NextResponse.json({
        type: 'product',
        data: productReport,
      })
    }

    // Daily or Monthly report
    const transactions = await db.transaction.findMany({
      where,
      select: {
        createdAt: true,
        total: true,
        items: { select: { quantity: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    if (type === 'daily') {
      const dailyMap = new Map<string, { date: string; revenue: number; transactions: number; items: number }>()
      for (const t of transactions) {
        const dateKey = t.createdAt.toISOString().split('T')[0]
        const existing = dailyMap.get(dateKey) || {
          date: dateKey,
          revenue: 0,
          transactions: 0,
          items: 0,
        }
        existing.revenue += t.total
        existing.transactions += 1
        existing.items += t.items.reduce((sum, item) => sum + item.quantity, 0)
        dailyMap.set(dateKey, existing)
      }

      const dailyReport = Array.from(dailyMap.values()).sort(
        (a, b) => a.date.localeCompare(b.date)
      )

      return NextResponse.json({
        type: 'daily',
        data: dailyReport,
      })
    }

    if (type === 'monthly') {
      const monthlyMap = new Map<string, { month: string; revenue: number; transactions: number; items: number }>()
      for (const t of transactions) {
        const monthKey = t.createdAt.toISOString().substring(0, 7)
        const existing = monthlyMap.get(monthKey) || {
          month: monthKey,
          revenue: 0,
          transactions: 0,
          items: 0,
        }
        existing.revenue += t.total
        existing.transactions += 1
        existing.items += t.items.reduce((sum, item) => sum + item.quantity, 0)
        monthlyMap.set(monthKey, existing)
      }

      const monthlyReport = Array.from(monthlyMap.values()).sort(
        (a, b) => a.month.localeCompare(b.month)
      )

      return NextResponse.json({
        type: 'monthly',
        data: monthlyReport,
      })
    }

    return NextResponse.json(
      { error: 'Tipe report tidak valid. Gunakan: daily, monthly, product' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Reports GET error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
