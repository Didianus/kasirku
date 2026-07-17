'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Receipt,
  Search,
  CalendarDays,
  Filter,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  Package,
  User,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRightLeft,
  Loader2,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

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

const paymentMethodLabels: Record<string, string> = {
  cash: 'Tunai',
  card: 'Kartu',
  qris: 'QRIS',
  transfer: 'Transfer',
}

const paymentMethodColors: Record<string, string> = {
  cash: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  card: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  qris: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  transfer: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

const paymentMethodIcons: Record<string, React.ElementType> = {
  cash: Banknote,
  card: CreditCard,
  qris: QrCode,
  transfer: ArrowRightLeft,
}

const statusLabels: Record<string, string> = {
  completed: 'Selesai',
  voided: 'Dibatalkan',
}

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  voided: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

interface TransactionItem {
  id: string
  productId: string
  productName: string
  price: number
  quantity: number
  subtotal: number
}

interface Transaction {
  id: string
  invoiceNumber: string
  customerName: string | null
  subtotal: number
  discount: number
  discountType: string
  tax: number
  total: number
  paid: number
  change: number
  paymentMethod: string
  status: string
  notes: string | null
  createdAt: string
  user: { id: string; name: string }
  items: TransactionItem[]
}

export function PosRiwayat({ user }: { user: User }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const perPage = 10

  // Filters
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [dateFromOpen, setDateFromOpen] = useState(false)
  const [dateToOpen, setDateToOpen] = useState(false)

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString().split('T')[0])
      if (dateTo) params.set('dateTo', dateTo.toISOString().split('T')[0])
      if (status) params.set('status', status)
      if (paymentMethod) params.set('paymentMethod', paymentMethod)
      params.set('page', page.toString())
      params.set('limit', perPage.toString())

      const res = await fetch(`/api/transactions?${params.toString()}`)
      if (!res.ok) throw new Error('Gagal memuat transaksi')
      const data = await res.json()
      setTransactions(data.transactions || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat riwayat transaksi')
    } finally {
      setLoading(false)
    }
  }, [search, dateFrom, dateTo, status, paymentMethod, page])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearFilters = () => {
    setSearch('')
    setSearchInput('')
    setDateFrom(undefined)
    setDateTo(undefined)
    setPaymentMethod('')
    setStatus('')
    setPage(1)
  }

  const hasActiveFilters = search || dateFrom || dateTo || paymentMethod || status

  const openDetail = async (transactionId: string) => {
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/transactions/${transactionId}`)
      if (!res.ok) throw new Error('Gagal memuat detail')
      const data = await res.json()
      setDetailTransaction(data.transaction)
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat detail transaksi')
    } finally {
      setDetailLoading(false)
    }
  }

  const totalPages = Math.ceil(total / perPage)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const PaymentIcon = ({ method }: { method: string }) => {
    const Icon = paymentMethodIcons[method] || Banknote
    return <Icon className="h-3.5 w-3.5" />
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
          <Receipt className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>
          <p className="text-muted-foreground text-sm">
            Lihat semua transaksi yang pernah dilakukan
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Cari Invoice / Pelanggan</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Cari nomor invoice atau nama..."
                    className="pl-9 h-9"
                  />
                </div>
                <Button size="sm" onClick={handleSearch} className="h-9 px-3">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Date From */}
            <div className="space-y-1.5">
              <Label className="text-xs">Dari Tanggal</Label>
              <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-9 justify-start gap-2 text-xs font-normal"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    {dateFrom
                      ? dateFrom.toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Pilih tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(d) => {
                      setDateFrom(d)
                      setDateFromOpen(false)
                      setPage(1)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-1.5">
              <Label className="text-xs">Sampai Tanggal</Label>
              <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-9 justify-start gap-2 text-xs font-normal"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    {dateTo
                      ? dateTo.toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Pilih tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(d) => {
                      setDateTo(d)
                      setDateToOpen(false)
                      setPage(1)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Payment Method & Status row */}
            <div className="space-y-1.5">
              <Label className="text-xs">Pembayaran</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => {
                  setPaymentMethod(v === 'all' ? '' : v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Metode</SelectItem>
                  <SelectItem value="cash">Tunai</SelectItem>
                  <SelectItem value="card">Kartu</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status filter + Clear */}
          <div className="flex flex-wrap items-end gap-3 mt-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v === 'all' ? '' : v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-9 text-xs w-[160px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="voided">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Reset Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Daftar Transaksi
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {total} transaksi
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && transactions.length === 0 ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Belum ada riwayat transaksi</p>
              {hasActiveFilters && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-2"
                >
                  Reset filter
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Pelanggan</TableHead>
                      <TableHead>Kasir</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">Diskon</TableHead>
                      <TableHead className="text-right">Pajak</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Pembayaran</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow
                        key={t.id}
                        className="cursor-pointer"
                        onClick={() => openDetail(t.id)}
                      >
                        <TableCell>
                          <span className="font-mono text-xs font-semibold">
                            {t.invoiceNumber}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDate(t.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {t.customerName || (
                            <span className="text-muted-foreground">Umum</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{t.user.name}</TableCell>
                        <TableCell className="text-right text-xs">
                          {formatRupiah(t.subtotal)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {t.discount > 0 ? (
                            <span className="text-red-600 dark:text-red-400">
                              -{formatRupiah(t.discount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {t.tax > 0 ? formatRupiah(t.tax) : '-'}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold">
                          {formatRupiah(t.total)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] h-5 gap-1 ${
                              paymentMethodColors[t.paymentMethod] || ''
                            }`}
                          >
                            <PaymentIcon method={t.paymentMethod} />
                            {paymentMethodLabels[t.paymentMethod] || t.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] h-5 ${
                              statusColors[t.status] || ''
                            }`}
                          >
                            {statusLabels[t.status] || t.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              openDetail(t.id)
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Halaman {page} dari {totalPages} ({total} transaksi)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Sebelumnya</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="gap-1"
                    >
                      <span className="hidden sm:inline">Selanjutnya</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Detail Transaksi
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detail transaksi
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-4 py-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : detailTransaction ? (
            <div className="space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Invoice
                  </p>
                  <p className="font-mono font-bold text-sm">
                    {detailTransaction.invoiceNumber}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Tanggal
                  </p>
                  <p className="text-sm">{formatDate(detailTransaction.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Pelanggan
                  </p>
                  <p className="text-sm">
                    {detailTransaction.customerName || 'Umum'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Kasir
                  </p>
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-sm">{detailTransaction.user.name}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Pembayaran
                  </p>
                  <Badge
                    variant="secondary"
                    className={`text-xs h-6 gap-1 ${
                      paymentMethodColors[detailTransaction.paymentMethod] || ''
                    }`}
                  >
                    <PaymentIcon method={detailTransaction.paymentMethod} />
                    {paymentMethodLabels[detailTransaction.paymentMethod] ||
                      detailTransaction.paymentMethod}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Status
                  </p>
                  <Badge
                    variant="secondary"
                    className={`text-xs h-6 ${
                      statusColors[detailTransaction.status] || ''
                    }`}
                  >
                    {statusLabels[detailTransaction.status] ||
                      detailTransaction.status}
                  </Badge>
                </div>
              </div>

              {detailTransaction.notes && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Catatan
                  </p>
                  <p className="text-sm bg-muted/50 rounded-md p-2">
                    {detailTransaction.notes}
                  </p>
                </div>
              )}

              <Separator />

              {/* Items */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Item Transaksi
                </h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-right">Harga</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailTransaction.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm font-medium">
                            {item.productName}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {formatRupiah(item.price)}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {formatRupiah(item.subtotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator />

              {/* Payment Summary */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Ringkasan Pembayaran
                </h4>
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatRupiah(detailTransaction.subtotal)}</span>
                  </div>
                  {detailTransaction.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Diskon
                        {detailTransaction.discountType === 'percent' && ' (%)'}
                      </span>
                      <span className="text-red-600 dark:text-red-400">
                        -{formatRupiah(detailTransaction.discount)}
                      </span>
                    </div>
                  )}
                  {detailTransaction.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pajak</span>
                      <span>{formatRupiah(detailTransaction.tax)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatRupiah(detailTransaction.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dibayar</span>
                    <span>{formatRupiah(detailTransaction.paid)}</span>
                  </div>
                  {detailTransaction.paymentMethod === 'cash' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Kembalian</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(detailTransaction.change)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">Transaksi tidak ditemukan</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
