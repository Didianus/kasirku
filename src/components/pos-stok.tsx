'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Minus,
  Warehouse,
  AlertTriangle,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Product {
  id: string
  name: string
  barcode: string | null
  stock: number
  minStock: number
  unit: string
  price: number
  active: boolean
  category: {
    id: string
    name: string
  }
}

interface PosStokProps {
  user: User
}

type StockStatus = 'all' | 'low' | 'empty' | 'safe'

function getStockStatus(stock: number, minStock: number): 'safe' | 'low' | 'empty' {
  if (stock === 0) return 'empty'
  if (stock <= minStock) return 'low'
  return 'safe'
}

function getStatusBadge(status: 'safe' | 'low' | 'empty') {
  switch (status) {
    case 'safe':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 border-0">
          Aman
        </Badge>
      )
    case 'low':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 border-0">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Peringatan
        </Badge>
      )
    case 'empty':
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 border-0">
          Habis
        </Badge>
      )
  }
}

export function PosStok({ user }: PosStokProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StockStatus>('all')
  const [adjustingId, setAdjustingId] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/products?limit=1000')
      if (!res.ok) throw new Error('Gagal memuat produk')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error(error)
      toast.error('Gagal memuat data produk')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()))

    if (!matchesSearch) return false

    if (statusFilter === 'all') return true
    const status = getStockStatus(p.stock, p.minStock)
    return status === statusFilter
  })

  // Summary counts
  const safeCount = products.filter((p) => getStockStatus(p.stock, p.minStock) === 'safe').length
  const lowCount = products.filter((p) => getStockStatus(p.stock, p.minStock) === 'low').length
  const emptyCount = products.filter((p) => getStockStatus(p.stock, p.minStock) === 'empty').length

  // Stock adjustment
  const handleStockAdjust = useCallback(
    async (productId: string, currentStock: number, delta: number) => {
      const newStock = currentStock + delta
      if (newStock < 0) {
        toast.error('Stok tidak boleh kurang dari 0')
        return
      }

      setAdjustingId(productId)
      try {
        const res = await fetch('/api/stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            type: 'adjustment',
            quantity: newStock,
            note: `Penyesuaian stok manual: ${currentStock} → ${newStock} (${delta > 0 ? '+' : ''}${delta})`,
            userId: user.id,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Gagal menyesuaikan stok')
          return
        }
        // Update local state
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, stock: newStock } : p
          )
        )
        toast.success(`Stok berhasil diperbarui (${newStock})`)
      } catch (error) {
        console.error(error)
        toast.error('Gagal menyesuaikan stok')
      } finally {
        setAdjustingId(null)
      }
    },
    [user.id]
  )

  // Loading state
  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-primary" />
            Manajemen Stok
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pantau dan kelola stok produk toko Anda
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-900/20">
                <Warehouse className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Produk</p>
                <p className="text-xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <Warehouse className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stok Aman</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{safeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Peringatan</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{lowCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Habis</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{emptyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama produk atau barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as StockStatus)}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="safe">Aman</SelectItem>
            <SelectItem value="low">Peringatan</SelectItem>
            <SelectItem value="empty">Habis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Daftar Stok Produk ({filteredProducts.length} item)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <Warehouse className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Tidak Ada Produk</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                {search || statusFilter !== 'all'
                  ? 'Tidak ditemukan produk dengan filter yang dipilih'
                  : 'Belum ada produk yang terdaftar'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Produk</TableHead>
                    <TableHead className="hidden sm:table-cell">Kategori</TableHead>
                    <TableHead className="text-center">Stok</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">Min. Stok</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center pr-4">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const status = getStockStatus(product.stock, product.minStock)
                    const isAdjusting = adjustingId === product.id

                    return (
                      <TableRow key={product.id} className={status === 'empty' ? 'bg-red-50/50 dark:bg-red-900/5' : status === 'low' ? 'bg-amber-50/50 dark:bg-amber-900/5' : ''}>
                        <TableCell className="pl-4">
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            {product.barcode && (
                              <p className="text-xs text-muted-foreground font-mono">{product.barcode}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {product.category.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-semibold text-sm ${
                            status === 'empty' ? 'text-red-600 dark:text-red-400' :
                            status === 'low' ? 'text-amber-600 dark:text-amber-400' :
                            'text-foreground'
                          }`}>
                            {product.stock}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">{product.unit}</span>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <span className="text-sm text-muted-foreground">{product.minStock}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(status)}
                        </TableCell>
                        <TableCell className="text-center pr-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleStockAdjust(product.id, product.stock, -1)}
                              disabled={isAdjusting || product.stock <= 0}
                            >
                              <Minus className="h-3 w-3" />
                              <span className="sr-only">Kurangi stok</span>
                            </Button>
                            <span className={`w-10 text-center text-sm font-semibold tabular-nums ${
                              status === 'empty' ? 'text-red-600 dark:text-red-400' :
                              status === 'low' ? 'text-amber-600 dark:text-amber-400' : ''
                            }`}>
                              {isAdjusting ? '...' : product.stock}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleStockAdjust(product.id, product.stock, 1)}
                              disabled={isAdjusting}
                            >
                              <Plus className="h-3 w-3" />
                              <span className="sr-only">Tambah stok</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
