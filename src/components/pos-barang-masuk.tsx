'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ArrowDownToLine,
  Search,
  Package,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

interface Product {
  id: string
  name: string
  barcode: string | null
  price: number
  stock: number
  unit: string
  category: { name: string }
}

interface StockLog {
  id: string
  productId: string
  type: string
  quantity: number
  note: string | null
  createdAt: string
  product: { id: string; name: string; unit: string }
  user: { id: string; name: string }
}

export function PosBarangMasuk({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [quantity, setQuantity] = useState<number>(1)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [logs, setLogs] = useState<StockLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [logsPage, setLogsPage] = useState(1)
  const [logsTotal, setLogsTotal] = useState(0)
  const logsPerPage = 10

  // Fetch products for dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?active=true&limit=100')
        if (!res.ok) throw new Error('Gagal memuat produk')
        const data = await res.json()
        setProducts(data.products || [])
      } catch (err) {
        console.error(err)
        toast.error('Gagal memuat daftar produk')
      } finally {
        setProductsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Fetch stock-in logs
  const fetchLogs = useCallback(async () => {
    try {
      setLogsLoading(true)
      const res = await fetch(
        `/api/stock?type=in&page=${logsPage}&limit=${logsPerPage}`
      )
      if (!res.ok) throw new Error('Gagal memuat riwayat')
      const data = await res.json()
      setLogs(data.logs || [])
      setLogsTotal(data.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLogsLoading(false)
    }
  }, [logsPage])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.barcode && p.barcode.includes(productSearch))
  )

  const handleSubmit = async () => {
    if (!selectedProduct) {
      toast.error('Pilih produk terlebih dahulu')
      return
    }
    if (!quantity || quantity < 1) {
      toast.error('Jumlah harus minimal 1')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: 'in',
          quantity,
          note: note || null,
          userId: user.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menambah stok')
      }
      toast.success(
        `Stok ${selectedProduct.name} berhasil ditambah +${quantity} (${selectedProduct.unit})`
      )
      setSelectedProduct(null)
      setQuantity(1)
      setNote('')
      setProductSearch('')
      fetchLogs()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menambah stok'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const totalLogPages = Math.ceil(logsTotal / logsPerPage)

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <ArrowDownToLine className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Barang Masuk</h1>
          <p className="text-muted-foreground text-sm">
            Tambahkan stok produk yang masuk ke toko
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Tambah Stok Masuk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Product Selector */}
            <div className="space-y-2 lg:col-span-2">
              <Label>Pilih Produk</Label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 font-normal h-10"
                    disabled={productsLoading}
                  >
                    {productsLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memuat...
                      </>
                    ) : selectedProduct ? (
                      <>
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{selectedProduct.name}</span>
                        <Badge variant="secondary" className="text-[10px] h-5 ml-auto">
                          Stok: {selectedProduct.stock} {selectedProduct.unit}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Cari produk...</span>
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Cari nama atau barcode..."
                      value={productSearch}
                      onValueChange={setProductSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Produk tidak ditemukan</CommandEmpty>
                      <CommandGroup>
                        {filteredProducts.map((product) => (
                          <CommandItem
                            key={product.id}
                            value={product.id}
                            onSelect={() => {
                              setSelectedProduct(product)
                              setComboboxOpen(false)
                              setProductSearch('')
                            }}
                          >
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {product.barcode || '-'} • {formatRupiah(product.price)}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                              {product.stock} {product.unit}
                            </Badge>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label>Jumlah</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="1"
                className="h-10"
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Restock dari supplier"
                className="h-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedProduct}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowDownToLine className="h-4 w-4" />
              )}
              {submitting ? 'Menyimpan...' : 'Tambah Stok Masuk'}
            </Button>
            {selectedProduct && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>
                  {selectedProduct.name} • Stok saat ini: {selectedProduct.stock}{' '}
                  {selectedProduct.unit}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Riwayat Stok Masuk
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {logsTotal} entri
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {logsLoading && logs.length === 0 ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ArrowDownToLine className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Belum ada riwayat stok masuk</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead>Oleh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium text-sm">
                              {log.product.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                            +{log.quantity} {log.product.unit}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {log.note || '-'}
                        </TableCell>
                        <TableCell className="text-sm">{log.user.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalLogPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Halaman {logsPage} dari {totalLogPages} ({logsTotal} entri)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={logsPage <= 1}
                      onClick={() => setLogsPage((p) => p - 1)}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={logsPage >= totalLogPages}
                      onClick={() => setLogsPage((p) => p + 1)}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
