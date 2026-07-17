'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  Column,
} from '@tanstack/react-table'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Filter,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PosProdukProps {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

type Product = {
  id: string
  name: string
  barcode: string | null
  description: string | null
  price: number
  costPrice: number
  stock: number
  minStock: number
  unit: string
  categoryId: string
  image: string | null
  active: boolean
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    icon: string | null
    color: string | null
  }
}

type Category = {
  id: string
  name: string
  icon: string | null
  color: string | null
  productCount: number
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const productFormSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  barcode: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive('Harga harus lebih dari 0'),
  costPrice: z.coerce.number().min(0, 'Modal tidak boleh negatif').optional(),
  stock: z.coerce.number().int().min(0, 'Stok tidak boleh negatif').optional(),
  minStock: z.coerce.number().int().min(0, 'Min stok tidak boleh negatif').optional(),
  unit: z.string().min(1, 'Satuan wajib diisi').optional(),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  image: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productFormSchema>

// ─── Sort Header Component ──────────────────────────────────────────────────

function SortableHeader({ column, children }: { column: Column<Product, unknown>; children: React.ReactNode }) {
  const isSorted = column.getIsSorted()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {children}
      {isSorted === 'asc' ? (
        <ChevronUp className="ml-1 h-4 w-4" />
      ) : isSorted === 'desc' ? (
        <ChevronDown className="ml-1 h-4 w-4" />
      ) : (
        <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
      )}
    </Button>
  )
}

// ─── Stock Badge ─────────────────────────────────────────────────────────────

function StockBadge({ stock, minStock }: { stock: number; minStock: number }) {
  if (stock === 0) {
    return <Badge variant="destructive" className="text-xs">Habis</Badge>
  }
  if (stock <= minStock) {
    return (
      <Badge className="text-xs bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/25 hover:bg-yellow-500/25">
        Rendah
      </Badge>
    )
  }
  return (
    <Badge className="text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25">
      Normal
    </Badge>
  )
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <Badge className="text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25">
        Aktif
      </Badge>
    )
  }
  return (
    <Badge variant="destructive" className="text-xs">
      Nonaktif
    </Badge>
  )
}

// ─── Product Form Dialog ────────────────────────────────────────────────────

function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  categories: Category[]
  onSuccess: () => void
}) {
  const isEdit = !!product
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? '',
      barcode: product?.barcode ?? '',
      description: product?.description ?? '',
      price: product?.price ?? 0,
      costPrice: product?.costPrice ?? 0,
      stock: product?.stock ?? 0,
      minStock: product?.minStock ?? 5,
      unit: product?.unit ?? 'pcs',
      categoryId: product?.categoryId ?? '',
      image: product?.image ?? '',
    },
  })

  // Reset form when dialog opens or product changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: product?.name ?? '',
        barcode: product?.barcode ?? '',
        description: product?.description ?? '',
        price: product?.price ?? 0,
        costPrice: product?.costPrice ?? 0,
        stock: product?.stock ?? 0,
        minStock: product?.minStock ?? 5,
        unit: product?.unit ?? 'pcs',
        categoryId: product?.categoryId ?? '',
        image: product?.image ?? '',
      })
    }
  }, [open, product, form])

  const onSubmit = async (values: ProductFormValues) => {
    setSubmitting(true)
    try {
      const url = isEdit ? `/api/products/${product.id}` : '/api/products'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Terjadi kesalahan')
        return
      }

      toast.success(isEdit ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan')
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Perbarui informasi produk.' : 'Isi detail produk baru.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Produk *</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama produk" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Barcode & Category */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="Scan atau ketik barcode" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Input placeholder="Deskripsi produk (opsional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image URL */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gambar Produk</FormLabel>
                  <FormControl>
                    <Input placeholder="URL gambar produk (opsional)" {...field} />
                  </FormControl>
                  <FormMessage />
                  {field.value && (
                    <div className="mt-2">
                      <img
                        src={field.value}
                        alt="Preview"
                        className="h-16 w-16 rounded-lg object-cover border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* Price & Cost Price */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Jual *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Modal</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Stock, Min Stock, Unit */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stok</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Stok</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Satuan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'pcs'}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pcs">Pcs</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="liter">Liter</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="lusin">Lusin</SelectItem>
                        <SelectItem value="set">Set</SelectItem>
                        <SelectItem value="rim">Rim</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PosProduk({ user }: PosProdukProps) {
  // State
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  // Sorting
  const [sorting, setSorting] = useState<SortingState>([])

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch {
      // silent fail for categories
    }
  }, [])

  // Fetch products
  const fetchProducts = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterCategory && filterCategory !== 'all') params.set('categoryId', filterCategory)
      if (filterStatus && filterStatus !== 'all') params.set('active', filterStatus)
      params.set('page', String(currentPage))
      params.set('limit', String(pageSize))

      const res = await fetch(`/api/products?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
        setTotalProducts(data.total || 0)
        setTotalPages(data.totalPages || 1)
      }
    } catch {
      toast.error('Gagal memuat data produk')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [search, filterCategory, filterStatus, currentPage])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterCategory, filterStatus])

  // Delete handler
  const handleDelete = async () => {
    if (!deleteProduct) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${deleteProduct.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal menghapus produk')
        return
      }
      toast.success('Produk berhasil dinonaktifkan')
      setDeleteProduct(null)
      fetchProducts()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setDeleting(false)
    }
  }

  // Column definitions
  const columns = useMemo<ColumnDef<Product, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortableHeader column={column}>Nama Produk</SortableHeader>,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.image ? (
              <img
                src={row.original.image}
                alt={row.original.name}
                className="h-10 w-10 shrink-0 rounded-lg object-cover border border-border/50"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ${row.original.image ? 'hidden' : ''}`}>
              <Package className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate max-w-[200px]">{row.original.name}</p>
              {row.original.description && (
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {row.original.description}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'barcode',
        header: ({ column }) => <SortableHeader column={column}>Barcode</SortableHeader>,
        cell: ({ row }) => (
          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
            {row.original.barcode || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'categoryId',
        header: 'Kategori',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs font-normal">
            {row.original.category?.name || '-'}
          </Badge>
        ),
        filterFn: (row, _columnId, filterValue) => {
          if (!filterValue || filterValue === 'all') return true
          return row.original.categoryId === filterValue
        },
      },
      {
        accessorKey: 'price',
        header: ({ column }) => <SortableHeader column={column}>Harga</SortableHeader>,
        cell: ({ row }) => (
          <span className="font-medium text-sm">{formatRupiah(row.original.price)}</span>
        ),
      },
      {
        accessorKey: 'costPrice',
        header: ({ column }) => <SortableHeader column={column}>Modal</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatRupiah(row.original.costPrice)}
          </span>
        ),
      },
      {
        accessorKey: 'stock',
        header: ({ column }) => <SortableHeader column={column}>Stok</SortableHeader>,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span
              className={cn(
                'font-medium text-sm',
                row.original.stock === 0
                  ? 'text-red-600 dark:text-red-400'
                  : row.original.stock <= row.original.minStock
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {row.original.stock}
            </span>
            <StockBadge stock={row.original.stock} minStock={row.original.minStock} />
          </div>
        ),
      },
      {
        accessorKey: 'minStock',
        header: ({ column }) => <SortableHeader column={column}>Min Stok</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.minStock}</span>
        ),
      },
      {
        accessorKey: 'unit',
        header: 'Satuan',
        cell: ({ row }) => (
          <span className="text-xs bg-muted px-2 py-1 rounded">{row.original.unit}</span>
        ),
      },
      {
        accessorKey: 'active',
        header: 'Status',
        cell: ({ row }) => <StatusBadge active={row.original.active} />,
        filterFn: (row, _columnId, filterValue) => {
          if (!filterValue || filterValue === 'all') return true
          return String(row.original.active) === filterValue
        },
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => setEditProduct(row.original)}
              title="Edit produk"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteProduct(row.original)}
              title="Hapus produk"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  // React Table instance
  const table = useReactTable({
    data: products,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualFiltering: true,
    pageCount: totalPages,
  })

  // Stats
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length
  const outOfStockCount = products.filter((p) => p.stock === 0).length
  const activeCount = products.filter((p) => p.active).length

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Produk
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola daftar produk toko Anda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => toast.info('Fitur import sedang dikembangkan')}
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => toast.info('Fitur export sedang dikembangkan')}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Produk</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Aktif</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Stok Rendah</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{lowStockCount}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
                <Filter className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Stok Habis</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{outOfStockCount}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama, barcode, atau deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} ({cat.productCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Nonaktif</SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh */}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => fetchProducts(true)}
              disabled={refreshing}
              title="Refresh data"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            // Loading skeleton
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-[180px]" />
                  <Skeleton className="h-4 w-[100px] ml-auto" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[60px]" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Belum Ada Produk</h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-4">
                {search || filterCategory !== 'all' || filterStatus !== 'all'
                  ? 'Tidak ada produk yang cocok dengan filter. Coba ubah kriteria pencarian.'
                  : 'Mulai tambahkan produk pertama Anda untuk mengelola inventaris toko.'}
              </p>
              {!search && filterCategory === 'all' && filterStatus === 'all' && (
                <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tambah Produk Pertama
                </Button>
              )}
            </div>
          ) : (
            // Table
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="text-xs">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/40 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && products.length > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Menampilkan {products.length} dari {totalProducts} produk
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronsUpDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-3 text-xs font-medium">
                  Hal {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <ProductFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        categories={categories}
        onSuccess={() => fetchProducts()}
      />

      {/* Edit Product Dialog */}
      <ProductFormDialog
        open={!!editProduct}
        onOpenChange={(open) => {
          if (!open) setEditProduct(null)
        }}
        product={editProduct}
        categories={categories}
        onSuccess={() => fetchProducts()}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteProduct}
        onOpenChange={(open) => {
          if (!open) setDeleteProduct(null)
        }}
      >
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Nonaktifkan Produk
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menonaktifkan produk{' '}
              <strong className="text-foreground">&quot;{deleteProduct?.name}&quot;</strong>?
              Produk akan ditandai sebagai nonaktif dan tidak akan muncul di kasir.
              Tindakan ini dapat dibatalkan dengan mengedit produk.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Nonaktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
