'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Grid3x3,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  createdAt: string
  updatedAt: string
  productCount: number
}

interface PosKategoriProps {
  user: User
}

const defaultColors = [
  '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6',
  '#6366f1', '#84cc16',
]

export function PosKategori({ user }: PosKategoriProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('')
  const [formColor, setFormColor] = useState('#10b981')

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Gagal memuat kategori')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error(error)
      toast.error('Gagal memuat data kategori')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Filter categories by search
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  )

  // Reset form
  const resetForm = useCallback(() => {
    setFormName('')
    setFormIcon('')
    setFormColor('#10b981')
  }, [])

  // Open add dialog
  const handleAdd = useCallback(() => {
    resetForm()
    setAddOpen(true)
  }, [resetForm])

  // Open edit dialog
  const handleEdit = useCallback((cat: Category) => {
    setSelectedCategory(cat)
    setFormName(cat.name)
    setFormIcon(cat.icon || '')
    setFormColor(cat.color || '#10b981')
    setEditOpen(true)
  }, [])

  // Open delete dialog
  const handleDelete = useCallback((cat: Category) => {
    setSelectedCategory(cat)
    setDeleteOpen(true)
  }, [])

  // Save new category
  const handleSaveAdd = useCallback(async () => {
    if (!formName.trim()) {
      toast.error('Nama kategori wajib diisi')
      return
    }
    try {
      setSaving(true)
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          icon: formIcon.trim() || null,
          color: formColor,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal membuat kategori')
        return
      }
      toast.success(`Kategori "${formName.trim()}" berhasil ditambahkan`)
      setAddOpen(false)
      resetForm()
      fetchCategories()
    } catch (error) {
      console.error(error)
      toast.error('Gagal membuat kategori')
    } finally {
      setSaving(false)
    }
  }, [formName, formIcon, formColor, resetForm, fetchCategories])

  // Save edit category
  const handleSaveEdit = useCallback(async () => {
    if (!selectedCategory || !formName.trim()) {
      toast.error('Nama kategori wajib diisi')
      return
    }
    try {
      setSaving(true)
      const res = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          icon: formIcon.trim() || null,
          color: formColor,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal mengupdate kategori')
        return
      }
      toast.success(`Kategori "${formName.trim()}" berhasil diperbarui`)
      setEditOpen(false)
      resetForm()
      setSelectedCategory(null)
      fetchCategories()
    } catch (error) {
      console.error(error)
      toast.error('Gagal mengupdate kategori')
    } finally {
      setSaving(false)
    }
  }, [selectedCategory, formName, formIcon, formColor, resetForm, fetchCategories])

  // Confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedCategory) return
    try {
      setSaving(true)
      const res = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal menghapus kategori')
        return
      }
      toast.success(`Kategori "${selectedCategory.name}" berhasil dihapus`)
      setDeleteOpen(false)
      setSelectedCategory(null)
      fetchCategories()
    } catch (error) {
      console.error(error)
      toast.error('Gagal menghapus kategori')
    } finally {
      setSaving(false)
    }
  }, [selectedCategory, fetchCategories])

  // Loading state
  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Grid3x3 className="h-6 w-6 text-primary" />
            Kategori
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola kategori produk toko Anda
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <Grid3x3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Tidak Ada Kategori</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            {search
              ? `Tidak ditemukan kategori dengan nama "${search}"`
              : 'Belum ada kategori. Klik "Tambah Kategori" untuk menambahkan.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => {
            const displayColor = cat.color || '#6b7280'
            const displayLetter = cat.icon?.charAt(0).toUpperCase() || cat.name.charAt(0).toUpperCase()

            return (
              <Card
                key={cat.id}
                className="hover:shadow-md transition-shadow group"
              >
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon circle */}
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: displayColor }}
                    >
                      {displayLetter}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">
                        {cat.name}
                      </h3>
                      {cat.icon && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {cat.icon}
                        </p>
                      )}
                      <Badge
                        variant="secondary"
                        className="mt-2 text-xs h-5"
                      >
                        {cat.productCount} {cat.productCount === 1 ? 'produk' : 'produk'}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleEdit(cat)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(cat)}
                        disabled={cat.productCount > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Hapus</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Category Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kategori Baru</DialogTitle>
            <DialogDescription>
              Masukkan informasi kategori produk baru.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Nama Kategori *</Label>
              <Input
                id="add-name"
                placeholder="Contoh: Minuman"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-icon">Ikon (opsional)</Label>
              <Input
                id="add-icon"
                placeholder="Contoh: 🥤 atau Minuman"
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Huruf pertama akan ditampilkan di lingkaran ikon
              </p>
            </div>
            <div className="space-y-2">
              <Label>Warna</Label>
              <div className="flex items-center gap-3">
                <div className="flex flex-wrap gap-2">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded-full border-2 transition-all hover:scale-110 ${
                        formColor === color
                          ? 'border-foreground scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormColor(color)}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="w-10 h-8 p-0 border-0 cursor-pointer"
                />
              </div>
            </div>
            {/* Preview */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold"
                style={{ backgroundColor: formColor }}
              >
                {formIcon?.charAt(0).toUpperCase() || formName?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-medium text-sm">{formName || 'Nama Kategori'}</p>
                <p className="text-xs text-muted-foreground">0 produk</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSaveAdd} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kategori</DialogTitle>
            <DialogDescription>
              Perbarui informasi kategori.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Kategori *</Label>
              <Input
                id="edit-name"
                placeholder="Contoh: Minuman"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-icon">Ikon (opsional)</Label>
              <Input
                id="edit-icon"
                placeholder="Contoh: 🥤 atau Minuman"
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Huruf pertama akan ditampilkan di lingkaran ikon
              </p>
            </div>
            <div className="space-y-2">
              <Label>Warna</Label>
              <div className="flex items-center gap-3">
                <div className="flex flex-wrap gap-2">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded-full border-2 transition-all hover:scale-110 ${
                        formColor === color
                          ? 'border-foreground scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormColor(color)}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="w-10 h-8 p-0 border-0 cursor-pointer"
                />
              </div>
            </div>
            {/* Preview */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold"
                style={{ backgroundColor: formColor }}
              >
                {formIcon?.charAt(0).toUpperCase() || formName?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-medium text-sm">{formName || 'Nama Kategori'}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedCategory?.productCount || 0} produk
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Perbarui'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kategori &quot;{selectedCategory?.name}&quot;?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
