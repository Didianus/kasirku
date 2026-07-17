'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Store,
  Save,
  Upload,
  Percent,
  Phone,
  MapPin,
  FileText,
  ImageIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface StoreConfigData {
  id: string
  storeName: string
  logo: string | null
  address: string | null
  phone: string | null
  taxRate: number
  receiptFooter: string | null
}

export function PosPengaturan({ user }: { user: User }) {
  const [config, setConfig] = useState<StoreConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [storeName, setStoreName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [receiptFooter, setReceiptFooter] = useState('')
  const [logo, setLogo] = useState('')

  useEffect(() => {
    fetch('/api/store-config')
      .then((r) => r.json())
      .then((data) => {
        const c = data.config || data
        setConfig(c)
        setStoreName(c.storeName || '')
        setAddress(c.address || '')
        setPhone(c.phone || '')
        setTaxRate(c.taxRate || 0)
        setReceiptFooter(c.receiptFooter || '')
        setLogo(c.logo || '')
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    try {
      const res = await fetch('/api/store-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          address,
          phone,
          taxRate,
          receiptFooter,
          logo,
        }),
      })
      if (res.ok) {
        toast.success('Pengaturan berhasil disimpan')
        const data = await res.json()
        const c = data.config || data
        setConfig(c)
      } else {
        toast.error('Gagal menyimpan pengaturan')
      }
    } catch {
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-4">
                <div className="h-6 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Pengaturan
        </h1>
        <p className="text-muted-foreground text-sm">
          Kelola pengaturan toko dan sistem
        </p>
      </div>

      {/* Admin Only Notice */}
      {user.role !== 'admin' && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Hanya admin yang dapat mengubah pengaturan toko.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Info */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Informasi Toko
            </CardTitle>
            <CardDescription>Data toko yang akan tampil di struk dan laporan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName" className="text-xs font-medium">
                Nama Toko
              </Label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="pl-9"
                  disabled={user.role !== 'admin'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs font-medium">
                Alamat
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-9 min-h-[80px]"
                  disabled={user.role !== 'admin'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-medium">
                Nomor Telepon
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9"
                  disabled={user.role !== 'admin'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo" className="text-xs font-medium">
                Logo URL
              </Label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="logo"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="pl-9"
                  placeholder="https://..."
                  disabled={user.role !== 'admin'}
                />
              </div>
              {logo && (
                <div className="mt-2 p-2 border rounded-lg inline-block">
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-12 w-12 object-contain"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Receipt & Tax Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Struk & Pajak
            </CardTitle>
            <CardDescription>Pengaturan struk belanja dan pajak</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taxRate" className="text-xs font-medium">
                Tarif Pajak (%)
              </Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="pl-9"
                  disabled={user.role !== 'admin'}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Set 0 untuk menonaktifkan pajak. Pajak dihitung dari subtotal setelah diskon.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="receiptFooter" className="text-xs font-medium">
                Footer Struk
              </Label>
              <Textarea
                id="receiptFooter"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="min-h-[80px]"
                placeholder="Terima kasih atas kunjungan Anda!"
                disabled={user.role !== 'admin'}
              />
            </div>

            <Separator />

            {/* Preview Receipt */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Preview Struk</Label>
              <div className="bg-white dark:bg-gray-900 border rounded-lg p-4 text-center font-mono text-xs space-y-1">
                {logo && (
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-8 mx-auto object-contain mb-2"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
                <p className="font-bold text-sm">{storeName || 'Nama Toko'}</p>
                <p className="text-gray-500">{address || 'Alamat toko'}</p>
                <p className="text-gray-500">{phone || 'No. Telepon'}</p>
                <div className="border-t border-dashed my-2" />
                <p className="text-left">Invoice: INV-001</p>
                <p className="text-left">Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
                <div className="border-t border-dashed my-2" />
                <p className="text-left">Contoh Produk x1</p>
                <p className="text-right">Rp 10.000</p>
                <div className="border-t border-dashed my-2" />
                <p className="text-left">Subtotal: Rp 10.000</p>
                {taxRate > 0 && (
                  <p className="text-left">Pajak ({taxRate}%): Rp {Math.round(10000 * taxRate / 100).toLocaleString('id-ID')}</p>
                )}
                <p className="font-bold text-left">Total: Rp {taxRate > 0 ? (10000 + Math.round(10000 * taxRate / 100)).toLocaleString('id-ID') : '10.000'}</p>
                <div className="border-t border-dashed my-2" />
                <p className="text-gray-500">{receiptFooter || 'Terima kasih!'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      {user.role === 'admin' && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="min-w-[160px]">
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Simpan Pengaturan
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
