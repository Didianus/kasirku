'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  FileText,
  Download,
  CalendarDays,
  TrendingUp,
  Package,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
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

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg p-3 text-sm shadow-lg">
        <p className="font-medium text-foreground">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-emerald-600 dark:text-emerald-400">
            {entry.name === 'transactions'
              ? `${entry.value} transaksi`
              : formatRupiah(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function PosLaporan({ user: _user }: { user: User }) {
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'product'>('daily')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [data, setData] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    totalItems: 0,
    avgTransaction: 0,
  })

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: reportType,
        dateFrom,
        dateTo,
      })
      const res = await fetch(`/api/reports?${params}`)
      if (res.ok) {
        const result = await res.json()
        const reportData = result.data || result
        setData(Array.isArray(reportData) ? reportData : [])

        // Calculate summary
        const revenue = Array.isArray(reportData)
          ? reportData.reduce((sum: number, d: Record<string, unknown>) => sum + (Number(d.revenue) || 0), 0)
          : 0
        const transactions = Array.isArray(reportData)
          ? reportData.reduce((sum: number, d: Record<string, unknown>) => sum + (Number(d.transactions) || Number(d.quantitySold) || 0), 0)
          : 0
        const items = Array.isArray(reportData)
          ? reportData.reduce((sum: number, d: Record<string, unknown>) => sum + (Number(d.items) || Number(d.quantitySold) || 0), 0)
          : 0
        setSummary({
          totalRevenue: revenue,
          totalTransactions: transactions,
          totalItems: items,
          avgTransaction: transactions > 0 ? Math.round(revenue / transactions) : 0,
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [reportType])

  const exportPDF = async () => {
    try {
      const jsPDFModule = await import('jspdf')
      const autoTableModule = await import('jspdf-autotable')
      const jsPDF = jsPDFModule.default
      const autoTable = autoTableModule.default

      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('Laporan Penjualan', 14, 20)
      doc.setFontSize(10)
      doc.text(`Periode: ${dateFrom} s/d ${dateTo}`, 14, 28)
      doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 34)

      if (reportType === 'product') {
        autoTable(doc, {
          startY: 40,
          head: [['Produk', 'Qty Terjual', 'Pendapatan']],
          body: data.map((d) => [
            String(d.productName || ''),
            String(d.quantitySold || 0),
            formatRupiah(Number(d.revenue) || 0),
          ]),
        })
      } else {
        autoTable(doc, {
          startY: 40,
          head: [['Periode', 'Transaksi', 'Pendapatan']],
          body: data.map((d) => [
            String(d.date || d.month || ''),
            String(d.transactions || 0),
            formatRupiah(Number(d.revenue) || 0),
          ]),
        })
      }

      doc.save(`laporan-${reportType}-${dateFrom}-${dateTo}.pdf`)
    } catch (err) {
      console.error(err)
    }
  }

  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx')
      const exportData = data.map((d) => {
        if (reportType === 'product') {
          return {
            Produk: String(d.productName || ''),
            'Qty Terjual': Number(d.quantitySold || 0),
            Pendapatan: Number(d.revenue || 0),
          }
        }
        return {
          Periode: String(d.date || d.month || ''),
          Transaksi: Number(d.transactions || 0),
          Pendapatan: Number(d.revenue || 0),
        }
      })
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan')
      XLSX.writeFile(wb, `laporan-${reportType}-${dateFrom}-${dateTo}.xlsx`)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Laporan
          </h1>
          <p className="text-muted-foreground text-sm">
            Analisis dan laporan penjualan toko
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <FileText className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <Download className="h-4 w-4 mr-1" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 min-w-0">
              <Label className="text-xs font-medium">Tipe Laporan</Label>
              <Select value={reportType} onValueChange={(v: 'daily' | 'monthly' | 'product') => setReportType(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Harian</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="product">Per Produk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-0">
              <Label className="text-xs font-medium">Dari Tanggal</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-0">
              <Label className="text-xs font-medium">Sampai Tanggal</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={fetchReport} disabled={loading}>
              <Filter className="h-4 w-4 mr-1" />
              Tampilkan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Pendapatan</p>
                <p className="text-lg font-bold">{formatRupiah(summary.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-900/20">
                <CalendarDays className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Transaksi</p>
                <p className="text-lg font-bold">{summary.totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-900/20">
                <Package className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Item</p>
                <p className="text-lg font-bold">{summary.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rata-rata/Transaksi</p>
                <p className="text-lg font-bold">{formatRupiah(summary.avgTransaction)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart & Table */}
      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">Grafik</TabsTrigger>
          <TabsTrigger value="table">Tabel</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                {reportType === 'daily'
                  ? 'Grafik Penjualan Harian'
                  : reportType === 'monthly'
                  ? 'Grafik Penjualan Bulanan'
                  : 'Grafik Produk Terlaris'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : data.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Tidak ada data untuk periode ini
                  </div>
                ) : reportType === 'product' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => (v / 1000) + 'k'} />
                      <YAxis
                        dataKey="productName"
                        type="category"
                        tick={{ fontSize: 11 }}
                        width={120}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : reportType === 'daily' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: string) => {
                          const d = new Date(v)
                          return d.getDate() + '/' + (d.getMonth() + 1)
                        }}
                      />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => (v / 1000) + 'k'} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => (v / 1000000) + 'jt'} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card className="glass-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {reportType === 'product' ? (
                        <>
                          <th className="text-left p-3 font-medium">Produk</th>
                          <th className="text-right p-3 font-medium">Qty Terjual</th>
                          <th className="text-right p-3 font-medium">Pendapatan</th>
                        </>
                      ) : (
                        <>
                          <th className="text-left p-3 font-medium">
                            {reportType === 'daily' ? 'Tanggal' : 'Bulan'}
                          </th>
                          <th className="text-right p-3 font-medium">Transaksi</th>
                          <th className="text-right p-3 font-medium">Pendapatan</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-muted-foreground">
                          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                        </td>
                      </tr>
                    ) : data.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-muted-foreground">
                          Tidak ada data
                        </td>
                      </tr>
                    ) : (
                      data.map((row, i) => (
                        <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                          {reportType === 'product' ? (
                            <>
                              <td className="p-3 font-medium">{String(row.productName || '')}</td>
                              <td className="p-3 text-right">
                                <Badge variant="secondary">{Number(row.quantitySold || 0)}</Badge>
                              </td>
                              <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatRupiah(Number(row.revenue) || 0)}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 font-medium">
                                {String(row.date || row.month || '')}
                              </td>
                              <td className="p-3 text-right">
                                <Badge variant="secondary">{Number(row.transactions || 0)}</Badge>
                              </td>
                              <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatRupiah(Number(row.revenue) || 0)}
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
