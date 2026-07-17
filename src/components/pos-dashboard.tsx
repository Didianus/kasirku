'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  Receipt,
  Package,
  Warehouse,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

interface User {
  id: string
  name: string
  email: string
  role: string
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

interface DashboardData {
  todayRevenue: number
  todayTransactions: number
  totalProducts: number
  totalStock: number
  totalRevenue: number
  totalTransactions: number
  lowStockProducts: Array<{
    id: string
    name: string
    stock: number
    minStock: number
    category: { name: string }
  }>
  dailySales: Array<{ date: string; revenue: number; transactions: number }>
  monthlySales: Array<{ month: string; revenue: number; transactions: number }>
  topProducts: Array<{
    productId: string
    productName: string
    quantitySold: number
    revenue: number
  }>
  recentTransactions: Array<{
    id: string
    invoiceNumber: string
    customerName: string | null
    total: number
    paymentMethod: string
    status: string
    createdAt: string
    user: { name: string }
  }>
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg p-3 text-sm shadow-lg">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-emerald-600 dark:text-emerald-400">
          {formatRupiah(payload[0].value)}
        </p>
        {payload[1] && (
          <p className="text-muted-foreground text-xs">
            {payload[1].value} transaksi
          </p>
        )}
      </div>
    )
  }
  return null
}

const paymentMethodColors: Record<string, string> = {
  cash: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  card: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  qris: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  transfer: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Tunai',
  card: 'Kartu',
  qris: 'QRIS',
  transfer: 'Transfer',
}

export function PosDashboard({ user }: { user: User }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-64 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const stats = [
    {
      title: 'Pendapatan Hari Ini',
      value: formatRupiah(data.todayRevenue),
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      change: data.todayRevenue > 0,
    },
    {
      title: 'Transaksi Hari Ini',
      value: data.todayTransactions.toString(),
      icon: Receipt,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-900/20',
      change: data.todayTransactions > 0,
    },
    {
      title: 'Total Produk',
      value: data.totalProducts.toString(),
      icon: Package,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      change: true,
    },
    {
      title: 'Total Stok',
      value: data.totalStock.toString(),
      icon: Warehouse,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      change: true,
    },
  ]

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Selamat datang, {user.name}! Berikut ringkasan toko Anda.
          </p>
        </div>
        <Badge variant="outline" className="hidden sm:flex gap-1">
          <Clock className="h-3 w-3" />
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="glass-card hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className="text-xl lg:text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              {stat.change && (
                <div className="flex items-center gap-1 mt-3">
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    Aktif
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Low Stock Warning */}
      {data.lowStockProducts.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Stok Hampir Habis ({data.lowStockProducts.length} produk)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-32">
              <div className="flex flex-wrap gap-2">
                {data.lowStockProducts.map((p) => (
                  <Badge
                    key={p.id}
                    variant="outline"
                    className={`text-xs ${
                      p.stock === 0
                        ? 'border-red-300 text-red-600 dark:border-red-700 dark:text-red-400'
                        : 'border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {p.name}: {p.stock}/{p.minStock}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Grafik Penjualan Harian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailySales}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) =>
                      new Date(v).getDate() + '/' + (new Date(v).getMonth() + 1)
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => (v / 1000) + 'k'}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky-500" />
              Grafik Penjualan Bulanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => (v / 1000000) + 'jt'}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="revenue"
                    fill="#0ea5e9"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              🏆 Produk Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada data penjualan
                </p>
              ) : (
                data.topProducts.map((p, i) => (
                  <div
                    key={p.productId}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : i === 1
                          ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          : i === 2
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {p.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.quantitySold} terjual
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(p.revenue)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              📋 Transaksi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[320px]">
              <div className="space-y-2">
                {data.recentTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Belum ada transaksi
                  </p>
                ) : (
                  data.recentTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono font-medium">
                            {t.invoiceNumber}
                          </p>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] h-5 ${
                              paymentMethodColors[t.paymentMethod] || ''
                            }`}
                          >
                            {paymentMethodLabels[t.paymentMethod] ||
                              t.paymentMethod}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t.customerName || 'Umum'} • {t.user.name} •{' '}
                          {new Date(t.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <p className="text-sm font-semibold whitespace-nowrap">
                        {formatRupiah(t.total)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
