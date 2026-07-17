import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

function getPeriodFilter(period: string): Date | null {
  const now = new Date()
  switch (period) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return start
    }
    case 'week': {
      const start = new Date(now)
      start.setDate(now.getDate() - 7)
      start.setHours(0, 0, 0, 0)
      return start
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return start
    }
    case 'all':
      return null
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today'
    const periodStart = getPeriodFilter(period)
    const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

    const periodWhere = periodStart
      ? { status: 'completed', createdAt: { gte: periodStart } }
      : { status: 'completed' }

    const todayWhere = {
      status: 'completed' as const,
      createdAt: { gte: todayStart },
    }

    // Run parallel queries for efficiency
    const [
      totalRevenueResult,
      totalTransactions,
      totalProducts,
      totalStockResult,
      lowStockProducts,
      todayRevenueResult,
      todayTransactions,
      recentTransactions,
      topProductsRaw,
    ] = await Promise.all([
      db.transaction.aggregate({
        _sum: { total: true },
        where: periodWhere,
      }),
      db.transaction.count({ where: periodWhere }),
      db.product.count({ where: { active: true } }),
      db.product.aggregate({
        _sum: { stock: true },
        where: { active: true },
      }),
      Promise.resolve([]), // placeholder for lowStock - computed below
      db.transaction.aggregate({
        _sum: { total: true },
        where: todayWhere,
      }),
      db.transaction.count({ where: todayWhere }),
      db.transaction.findMany({
        where: { status: 'completed' },
        include: {
          items: true,
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.transactionItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ])

    // Low stock products - need to filter where stock <= minStock
    const lowStockProductsList = await db.product.findMany({
      where: { active: true },
      include: { category: true },
    })
    const filteredLowStock = lowStockProductsList
      .filter((p) => p.stock <= p.minStock)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10)

    // Get top products with names
    const topProductIds = topProductsRaw.map((tp) => tp.productId)
    const topProductInfo = await db.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, category: true },
    })

    const topProducts = topProductsRaw.map((tp) => {
      const info = topProductInfo.find((p) => p.id === tp.productId)
      return {
        productId: tp.productId,
        productName: info?.name || 'Unknown',
        category: info?.category || null,
        quantitySold: tp._sum.quantity || 0,
        revenue: tp._sum.subtotal || 0,
      }
    })

    // Daily sales for last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const dailyTransactions = await db.transaction.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    })

    const dailySalesMap = new Map<string, { revenue: number; transactions: number }>()
    for (const t of dailyTransactions) {
      const dateKey = t.createdAt.toISOString().split('T')[0]
      const existing = dailySalesMap.get(dateKey) || { revenue: 0, transactions: 0 }
      existing.revenue += t.total
      existing.transactions += 1
      dailySalesMap.set(dateKey, existing)
    }

    // Fill in missing days
    const dailySales: Array<{ date: string; revenue: number; transactions: number }> = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateKey = d.toISOString().split('T')[0]
      const data = dailySalesMap.get(dateKey) || { revenue: 0, transactions: 0 }
      dailySales.push({ date: dateKey, ...data })
    }

    // Monthly sales for last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const monthlyTransactions = await db.transaction.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: sixMonthsAgo },
      },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    })

    const monthlySalesMap = new Map<string, { revenue: number; transactions: number }>()
    for (const t of monthlyTransactions) {
      const monthKey = t.createdAt.toISOString().substring(0, 7)
      const existing = monthlySalesMap.get(monthKey) || { revenue: 0, transactions: 0 }
      existing.revenue += t.total
      existing.transactions += 1
      monthlySalesMap.set(monthKey, existing)
    }

    const monthlySales: Array<{ month: string; revenue: number; transactions: number }> = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthKey = d.toISOString().substring(0, 7)
      const data = monthlySalesMap.get(monthKey) || { revenue: 0, transactions: 0 }
      monthlySales.push({ month: monthKey, ...data })
    }

    return NextResponse.json({
      totalRevenue: totalRevenueResult._sum.total || 0,
      totalTransactions,
      totalProducts,
      totalStock: totalStockResult._sum.stock || 0,
      lowStockProducts: filteredLowStock,
      todayRevenue: todayRevenueResult._sum.total || 0,
      todayTransactions,
      recentTransactions,
      topProducts,
      dailySales,
      monthlySales,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
