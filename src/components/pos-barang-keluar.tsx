'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ArrowUpFromLine,
  Search,
  Package,
  Minus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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

export function PosBarangKeluar({ user }: { user: User }) {
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

  // Fetch stock-out logs
  const fetchLogs = useCallback(async () => {
    try {
      setLogsLoading(true)
      const res = await fetch(
        `/api/stock?type=out&page=${logsPage}&limit=${logsPerPage}`
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

  // Validate quantity against current stock
  const maxQuantity = selectedProduct ? selectedProduct.stock : 0
  const quantityExceeds = selectedProduct && quantity > maxQuantity

  const handleSubmit = async () => {
    if (!selectedProduct) {
      toast.error('Pilih produk terlebih dahulu')
      return
    }
    if (!quantity || quantity < 1) {
      toast.error('Jumlah harus minimal 1')
      return
    }
    if (quantity > maxQuantity) {
      toast.error(`Jumlah melebihi stok saat ini (${maxQuantity} ${selectedProduct.unit})`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: 'out',
          quantity,
          note: note || null,
          userId: user.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengurangi stok')
      }
      toast.success(
        `Stok ${selectedProduct.name} berhasil dikurangi -${quantity} (${selectedProduct.unit})`
      )
      // Update local product stock from response
      if (data.newStock !== undefined) {
        setSelectedProduct((prev) =>
          prev ? { ...prev, stock: data.newStock } : null
        )
      }
      setSelectedProduct(null)
      setQuantity(1)
      setNote('')
      setProductSearch('')
      fetchLogs()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengurangi stok'
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
          <ArrowUpFromLine className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Barang Keluar</h1>
          <p className="text-muted-foreground text-sm">
            Catat stok keluar (rusak, kadaluarsa, dll)
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Minus className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            Catat Stok Keluar
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
                        <Badge
                          variant={selectedProduct.stock <= selectedProduct.minStock ? 'destructive' : 'secondary'}
                          className="text-[10px] h-5 ml-auto"
                        >
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
                              setQuantity(1)
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
                            <Badge
                              variant={product.stock <= 0 ? 'destructive' : 'outline'}
                              className="text-[10px] h-5 shrink-0"
                            >
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
              <Label>
                Jumlah{' '}
                {selectedProduct && (
                  <span className="text-muted-foreground font-normal">
                    (maks: {maxQuantity})
                  </span>
                )}
              </Label>
              <Input
                type="number"
                min={1}
                max={maxQuantity || undefined}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="1"
                className={`h-10 ${quantityExceeds ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {quantityExceeds && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Melebihi stok saat ini
                </p>
              )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Barang rusak / kadaluarsa"
                className="h-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedProduct || quantityExceeds}
              variant="destructive"
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpFromLine className="h-4 w-4" />
              )}
              {submitting ? 'Menyimpan...' : 'Catat Stok Keluar'}
            </Button>
            {selectedProduct && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-orange-500" />
                <span>
                  {selectedProduct.name} • Stok saat ini: {selectedProduct.stock}{' '}
                  {selectedProduct.unit}
                </span>
                {selectedProduct.stock === 0 && (
                  <Badge variant="destructive" className="text-[10px] h-5">
                    Stok habis
                  </Badge>
                )}
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
              Riwayat Stok Keluar
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
              <ArrowUpFromLine className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Belum ada riwayat stok keluar</p>
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
                          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs">
                            -{log.quantity} {log.product.unit}
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
