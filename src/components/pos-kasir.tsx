'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Trash2,
  Banknote,
  CreditCard,
  QrCode,
  ArrowRightLeft,
  ShoppingBag,
  CheckCircle2,
  Receipt,
  RefreshCw,
  Tag,
  Percent,
  ChevronDown,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PosKasirProps {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

type CartItem = {
  productId: string
  productName: string
  price: number
  quantity: number
  stock: number
}

type Product = {
  id: string
  name: string
  barcode: string | null
  description: string | null
  price: number
  stock: number
  minStock: number
  unit: string
  categoryId: string
  image: string | null
  active: boolean
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

type StoreConfig = {
  id: string
  storeName: string
  taxRate: number
  address: string | null
  phone: string | null
  receiptFooter: string | null
}

type PaymentMethod = 'cash' | 'card' | 'qris' | 'transfer'
type DiscountType = 'nominal' | 'percent'

// ─── Helper ──────────────────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PosKasir({ user }: PosKasirProps) {
  const { toast } = useToast()
  const isMobile = useIsMobile()

  // ── State ────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false) // mobile sheet

  const [discountEnabled, setDiscountEnabled] = useState(false)
  const [discountType, setDiscountType] = useState<DiscountType>('nominal')
  const [discountValue, setDiscountValue] = useState<string>('0')

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [paidAmount, setPaidAmount] = useState<string>('')

  const [processing, setProcessing] = useState(false)
  const [successDialog, setSuccessDialog] = useState(false)
  const [lastTransaction, setLastTransaction] = useState<{
    invoiceNumber: string
    total: number
    paymentMethod: string
    change: number
  } | null>(null)

  // ── Fetch Data ───────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products?active=true&limit=100')
      if (!res.ok) throw new Error('Gagal memuat produk')
      const data = await res.json()
      setProducts(data.products || [])
    } catch {
      toast({
        title: 'Error',
        description: 'Gagal memuat data produk',
        variant: 'destructive',
      })
    }
  }, [toast])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Gagal memuat kategori')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch {
      toast({
        title: 'Error',
        description: 'Gagal memuat data kategori',
        variant: 'destructive',
      })
    }
  }, [toast])

  const fetchStoreConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/store-config')
      if (!res.ok) throw new Error('Gagal memuat konfigurasi toko')
      const data = await res.json()
      setStoreConfig(data.config)
    } catch {
      // Default tax rate if fetch fails
      setStoreConfig({ id: '', storeName: 'KasirKu POS', taxRate: 0, address: null, phone: null, receiptFooter: null })
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchProducts(), fetchCategories(), fetchStoreConfig()])
      setLoading(false)
    }
    loadData()
  }, [fetchProducts, fetchCategories, fetchStoreConfig])

  // ── Computed Values ──────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let filtered = products

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.categoryId === selectedCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      )
    }

    return filtered
  }, [products, selectedCategory, searchQuery])

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  )

  const discountAmount = useMemo(() => {
    if (!discountEnabled) return 0
    const val = parseFloat(discountValue) || 0
    if (val <= 0) return 0
    if (discountType === 'percent') {
      return Math.round(subtotal * (val / 100))
    }
    return Math.min(val, subtotal) // cap at subtotal
  }, [discountEnabled, discountType, discountValue, subtotal])

  const afterDiscount = subtotal - discountAmount

  const taxRate = storeConfig?.taxRate || 0
  const taxAmount = useMemo(
    () => Math.round(afterDiscount * (taxRate / 100)),
    [afterDiscount, taxRate]
  )

  const total = afterDiscount + taxAmount

  const paid = parseFloat(paidAmount) || 0
  const change = paymentMethod === 'cash' ? paid - total : 0

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const paymentMethodLabel: Record<PaymentMethod, string> = {
    cash: 'Tunai',
    card: 'Kartu',
    qris: 'QRIS',
    transfer: 'Transfer',
  }

  // ── Cart Actions ─────────────────────────────────────────────────────────
  const addToCart = useCallback(
    (product: Product) => {
      if (product.stock <= 0) return

      setCart((prev) => {
        const existing = prev.find((item) => item.productId === product.id)
        if (existing) {
          if (existing.quantity >= product.stock) {
            toast({
              title: 'Stok Tidak Cukup',
              description: `Stok ${product.name} hanya tersisa ${product.stock}`,
              variant: 'destructive',
            })
            return prev
          }
          return prev.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: 1,
            stock: product.stock,
          },
        ]
      })
    },
    [toast]
  )

  const updateQuantity = useCallback(
    (productId: string, delta: number) => {
      setCart((prev) =>
        prev
          .map((item) => {
            if (item.productId !== productId) return item
            const newQty = item.quantity + delta
            if (newQty <= 0) return item // don't go below 1, use remove instead
            if (newQty > item.stock) {
              toast({
                title: 'Stok Tidak Cukup',
                description: `Stok ${item.productName} hanya tersisa ${item.stock}`,
                variant: 'destructive',
              })
              return item
            }
            return { ...item, quantity: newQty }
          })
          .filter((item) => item.quantity > 0)
      )
    },
    [toast]
  )

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setDiscountEnabled(false)
    setDiscountValue('0')
    setPaidAmount('')
    setPaymentMethod('cash')
  }, [])

  const getCartQuantity = useCallback(
    (productId: string) => {
      const item = cart.find((i) => i.productId === productId)
      return item?.quantity || 0
    },
    [cart]
  )

  // ── Payment ──────────────────────────────────────────────────────────────
  const isPaymentValid = useMemo(() => {
    if (cart.length === 0) return false
    if (paymentMethod === 'cash' && paid < total) return false
    return true
  }, [cart, paymentMethod, paid, total])

  const handlePayment = async () => {
    if (!isPaymentValid || processing) return
    setProcessing(true)

    try {
      const payload = {
        userId: user.id,
        customerName: null,
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
        discount: discountAmount,
        discountType,
        discountValue: parseFloat(discountValue) || 0,
        paymentMethod,
        paid: paymentMethod === 'cash' ? paid : total,
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal memproses transaksi')
      }

      const data = await res.json()
      const txn = data.transaction

      setLastTransaction({
        invoiceNumber: txn.invoiceNumber,
        total: txn.total,
        paymentMethod: txn.paymentMethod,
        change: txn.change,
      })

      // Show success dialog
      setSuccessDialog(true)

      // Clear cart
      clearCart()

      // Re-fetch products (stock changed)
      fetchProducts()
    } catch (err) {
      toast({
        title: 'Transaksi Gagal',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleNewTransaction = () => {
    setSuccessDialog(false)
    setLastTransaction(null)
  }

  const handlePrintReceipt = () => {
    console.log('Cetak Struk:', lastTransaction?.invoiceNumber)
    toast({ title: 'Struk', description: 'Fitur cetak struk akan segera tersedia' })
  }

  // ── Stock Color Indicator ────────────────────────────────────────────────
  const getStockColor = (stock: number, minStock: number) => {
    if (stock <= 0) return 'text-red-500'
    if (stock <= minStock) return 'text-red-500'
    if (stock <= minStock * 2) return 'text-amber-500'
    return 'text-emerald-600'
  }

  const getStockBgColor = (stock: number, minStock: number) => {
    if (stock <= 0) return 'bg-red-50 dark:bg-red-950/30'
    if (stock <= minStock) return 'bg-red-50 dark:bg-red-950/30'
    if (stock <= minStock * 2) return 'bg-amber-50 dark:bg-amber-950/30'
    return 'bg-emerald-50 dark:bg-emerald-950/30'
  }

  // ─── Cart Content (shared between desktop & mobile) ──────────────────────
  const cartContent = (
    <div className="flex flex-col h-full">
      {/* Cart Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-emerald-600" />
          <h2 className="font-semibold text-lg">Keranjang Belanja</h2>
          {cartItemCount > 0 && (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 ml-1">
              {cartItemCount}
            </Badge>
          )}
        </div>
        {cart.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Hapus
          </Button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-hidden">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
            <ShoppingBag className="h-16 w-16 mb-3 opacity-30" />
            <p className="text-sm font-medium">Keranjang kosong</p>
            <p className="text-xs mt-1">Klik produk untuk menambahkan</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRupiah(item.price)} / item
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-lg"
                        onClick={() => updateQuantity(item.productId, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-lg"
                        onClick={() => updateQuantity(item.productId, 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">
                      {formatRupiah(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Cart Summary & Payment */}
      <div className="border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="p-4 space-y-3">
          {/* Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatRupiah(subtotal)}</span>
            </div>

            {/* Discount Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={discountEnabled}
                    onCheckedChange={setDiscountEnabled}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                  <Label className="text-sm text-muted-foreground">Diskon</Label>
                </div>
              </div>
              {discountEnabled && (
                <div className="flex items-center gap-2 ml-7">
                  <Select
                    value={discountType}
                    onValueChange={(v) => {
                      setDiscountType(v as DiscountType)
                      setDiscountValue('0')
                    }}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nominal">
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          Nominal
                        </div>
                      </SelectItem>
                      <SelectItem value="percent">
                        <div className="flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          Persen
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="0"
                    className="h-8 text-xs w-24"
                  />
                  {discountAmount > 0 && (
                    <span className="text-xs text-red-500 font-medium whitespace-nowrap">
                      -{formatRupiah(discountAmount)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tax */}
            {taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Pajak ({taxRate}%)
                </span>
                <span className="font-medium">{formatRupiah(taxAmount)}</span>
              </div>
            )}

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="font-semibold text-base">Total</span>
              <span className="font-bold text-xl text-emerald-700 dark:text-emerald-400">
                {formatRupiah(total)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Metode Pembayaran</Label>
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'flex flex-col items-center gap-1 h-auto py-2 rounded-xl',
                  paymentMethod === 'cash'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                )}
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote className="h-4 w-4" />
                <span className="text-[10px]">Tunai</span>
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'flex flex-col items-center gap-1 h-auto py-2 rounded-xl',
                  paymentMethod === 'card'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                )}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard className="h-4 w-4" />
                <span className="text-[10px]">Kartu</span>
              </Button>
              <Button
                variant={paymentMethod === 'qris' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'flex flex-col items-center gap-1 h-auto py-2 rounded-xl',
                  paymentMethod === 'qris'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                )}
                onClick={() => setPaymentMethod('qris')}
              >
                <QrCode className="h-4 w-4" />
                <span className="text-[10px]">QRIS</span>
              </Button>
              <Button
                variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'flex flex-col items-center gap-1 h-auto py-2 rounded-xl',
                  paymentMethod === 'transfer'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                )}
                onClick={() => setPaymentMethod('transfer')}
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span className="text-[10px]">Transfer</span>
              </Button>
            </div>
          </div>

          {/* Cash Payment */}
          {paymentMethod === 'cash' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Uang Bayar</Label>
              <Input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="Masukkan jumlah bayar"
                className="h-10 text-base font-semibold"
              />
              {paid > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Kembalian</span>
                  <span
                    className={cn(
                      'font-bold text-base',
                      change < 0
                        ? 'text-red-500'
                        : 'text-emerald-600 dark:text-emerald-400'
                    )}
                  >
                    {change < 0 ? `-${formatRupiah(Math.abs(change))}` : formatRupiah(change)}
                  </span>
                </div>
              )}
              {/* Quick Cash Buttons */}
              {total > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {[total, Math.ceil(total / 10000) * 10000, Math.ceil(total / 50000) * 50000, Math.ceil(total / 100000) * 100000]
                    .filter((v, i, arr) => arr.indexOf(v) === i && v >= total)
                    .slice(0, 4)
                    .map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs rounded-lg"
                        onClick={() => setPaidAmount(String(amount))}
                      >
                        {formatRupiah(amount)}
                      </Button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Pay Button */}
          <Button
            className={cn(
              'w-full h-12 text-base font-bold rounded-xl shadow-lg transition-all',
              isPaymentValid && !processing
                ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
                : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
            )}
            disabled={!isPaymentValid || processing}
            onClick={handlePayment}
          >
            {processing ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                Memproses...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Bayar {formatRupiah(total)}
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  )

  // ─── Product Card ────────────────────────────────────────────────────────
  const ProductCard = ({ product }: { product: Product }) => {
    const cartQty = getCartQuantity(product.id)
    const isOutOfStock = product.stock <= 0
    const stockColor = getStockColor(product.stock, product.minStock)
    const stockBg = getStockBgColor(product.stock, product.minStock)

    return (
      <Card
        className={cn(
          'relative group cursor-pointer transition-all duration-200 overflow-hidden',
          'border border-slate-200/60 dark:border-slate-700/60',
          'bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm',
          isOutOfStock
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:shadow-md hover:border-emerald-300/50 dark:hover:border-emerald-600/50 hover:-translate-y-0.5 active:scale-[0.98]',
          cartQty > 0 && 'ring-2 ring-emerald-500 border-emerald-300 dark:border-emerald-700'
        )}
        onClick={() => !isOutOfStock && addToCart(product)}
      >
        <CardContent className="p-3 sm:p-4 flex flex-col gap-2">
          {/* Product Image */}
          <div className="relative w-full h-24 rounded-lg overflow-hidden bg-muted/30">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const placeholder = target.nextElementSibling as HTMLElement
                  if (placeholder) placeholder.classList.remove('hidden')
                }}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center bg-muted/50 ${product.image ? 'hidden' : ''}`}>
              <Package className="h-8 w-8 text-muted-foreground/40" />
            </div>
            {/* Category Badge overlay */}
            <Badge
              variant="secondary"
              className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0 h-5 rounded-md bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 backdrop-blur-sm"
            >
              {product.category?.name || 'Lainnya'}
            </Badge>
            {/* Cart Badge overlay */}
            {cartQty > 0 && (
              <Badge className="absolute top-1.5 right-1.5 bg-emerald-600 text-white h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] font-bold">
                {cartQty}
              </Badge>
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Price */}
          <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
            {formatRupiah(product.price)}
          </p>

          {/* Stock */}
          <div className={cn('flex items-center gap-1 rounded-lg px-2 py-1 w-fit', stockBg)}>
            <div
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                product.stock <= 0
                  ? 'bg-red-500'
                  : product.stock <= product.minStock
                  ? 'bg-red-500'
                  : product.stock <= product.minStock * 2
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              )}
            />
            <span className={cn('text-[10px] font-medium', stockColor)}>
              {product.stock <= 0 ? 'Habis' : `Stok: ${product.stock}`}
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ─── Product Grid Skeleton ───────────────────────────────────────────────
  const ProductGridSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-20 rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // ─── Success Dialog ──────────────────────────────────────────────────────
  const SuccessDialog = () => (
    <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
      <DialogContent className="sm:max-w-md text-center" showCloseButton={false}>
        <DialogHeader className="items-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            Transaksi Berhasil!
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Pembayaran telah berhasil diproses
          </DialogDescription>
        </DialogHeader>

        {lastTransaction && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2 my-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">No. Invoice</span>
              <span className="font-mono font-semibold">{lastTransaction.invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {formatRupiah(lastTransaction.total)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Metode</span>
              <span className="font-medium">
                {paymentMethodLabel[lastTransaction.paymentMethod as PaymentMethod] || lastTransaction.paymentMethod}
              </span>
            </div>
            {lastTransaction.paymentMethod === 'cash' && lastTransaction.change > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kembalian</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {formatRupiah(lastTransaction.change)}
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={handlePrintReceipt}
          >
            <Receipt className="h-4 w-4 mr-2" />
            Cetak Struk
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            onClick={handleNewTransaction}
          >
            Transaksi Baru
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // ─── Mobile Floating Cart Button ─────────────────────────────────────────
  const MobileCartButton = () => (
    <Button
      className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all"
      size="icon"
      onClick={() => setCartOpen(true)}
    >
      <ShoppingCart className="h-6 w-6" />
      {cartItemCount > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-white dark:border-slate-900">
          {cartItemCount}
        </Badge>
      )}
    </Button>
  )

  // ─── Mobile Cart Sheet ───────────────────────────────────────────────────
  const MobileCartSheet = () => (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="sr-only">
          <SheetTitle>Keranjang Belanja</SheetTitle>
          <SheetDescription>Keranjang belanja Anda</SheetDescription>
        </SheetHeader>
        {cartContent}
      </SheetContent>
    </Sheet>
  )

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-950">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Product Selection */}
        <div className={cn(
          'flex flex-col h-full overflow-hidden',
          isMobile ? 'w-full' : 'w-[60%]'
        )}>
          {/* Search & Filter Bar */}
          <div className="p-3 sm:p-4 space-y-3 border-b bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari produk atau barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60 focus:border-emerald-400 focus:ring-emerald-400/20"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'rounded-full whitespace-nowrap px-4 h-8 text-xs font-medium shrink-0 transition-all',
                  selectedCategory === 'all'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-slate-200/60 dark:border-slate-700/60'
                )}
                onClick={() => setSelectedCategory('all')}
              >
                Semua
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'rounded-full whitespace-nowrap px-4 h-8 text-xs font-medium shrink-0 transition-all',
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-slate-200/60 dark:border-slate-700/60'
                  )}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                  <span className="ml-1 opacity-70">({cat.productCount})</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-auto p-3 sm:p-4">
            {loading ? (
              <ProductGridSkeleton />
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                <Search className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Produk tidak ditemukan</p>
                <p className="text-xs mt-1">
                  Coba ubah kata kunci atau kategori pencarian
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Cart (Desktop Only) */}
        {!isMobile && (
          <div className="w-[40%] h-full border-l border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex flex-col">
            {cartContent}
          </div>
        )}
      </div>

      {/* Mobile Cart Button & Sheet */}
      {isMobile && <MobileCartButton />}
      {isMobile && <MobileCartSheet />}

      {/* Success Dialog */}
      <SuccessDialog />
    </div>
  )
}
