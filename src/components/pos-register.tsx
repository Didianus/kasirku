'use client'

import { useState } from 'react'
import {
  Store,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  ShoppingCart,
  BarChart3,
  Package,
  Receipt,
  ShieldCheck,
  Zap,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PosRegisterProps {
  onSwitchToLogin: () => void
  onRegister: (user: { id: string; name: string; email: string; role: string }) => void
}

export function PosRegister({ onSwitchToLogin, onRegister }: PosRegisterProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Client-side validation
    if (!name || name.length < 2) {
      setError('Nama wajib diisi minimal 2 karakter')
      return
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email tidak valid')
      return
    }

    if (!password || password.length < 6) {
      setError('Password wajib diisi minimal 6 karakter')
      return
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registrasi gagal')
        return
      }

      localStorage.setItem('pos_user', JSON.stringify(data.user))
      onRegister(data.user)
    } catch {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: ShoppingCart, title: 'Kasir Modern', desc: 'Transaksi cepat & mudah' },
    { icon: Package, title: 'Manajemen Produk', desc: 'Kelola stok & produk' },
    { icon: BarChart3, title: 'Laporan Lengkap', desc: 'Analisis penjualan' },
    { icon: Receipt, title: 'Cetak Struk', desc: 'Struk digital & cetak' },
  ]

  return (
    <div className="min-h-screen login-bg flex flex-col lg:flex-row relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
        <div className="login-orb login-orb-4" />
        <div className="login-orb login-orb-5" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 login-grid" />

        {/* Glowing lines */}
        <div className="login-line login-line-1" />
        <div className="login-line login-line-2" />
        <div className="login-line login-line-3" />

        {/* Particle dots */}
        <div className="login-particle login-particle-1" />
        <div className="login-particle login-particle-2" />
        <div className="login-particle login-particle-3" />
        <div className="login-particle login-particle-4" />
        <div className="login-particle login-particle-5" />
        <div className="login-particle login-particle-6" />
        <div className="login-particle login-particle-7" />
        <div className="login-particle login-particle-8" />
        <div className="login-particle login-particle-9" />
        <div className="login-particle login-particle-10" />
        <div className="login-particle login-particle-11" />
        <div className="login-particle login-particle-12" />

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 320" className="w-full h-auto opacity-10" preserveAspectRatio="none">
            <path fill="white" d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,234.7C672,245,768,235,864,208C960,181,1056,139,1152,133.3C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          </svg>
        </div>

        {/* Top subtle glow */}
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-400/5 rounded-full blur-[100px]" />
      </div>

      {/* LEFT SIDE - Registration Form */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative z-10">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo (visible only on small screens) */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl login-icon-glow">
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">KasirKu</h1>
              <p className="text-xs text-emerald-200/60">Sistem Kasir Modern</p>
            </div>
          </div>

          {/* Register Card */}
          <div className="login-glass-card rounded-2xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Daftar Akun Baru</h2>
              <p className="text-sm text-emerald-200/60 mt-1">
                Buat akun untuk mulai menggunakan KasirKu
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/20 border border-red-400/30 p-3 text-sm text-red-200 animate-fade-in-up">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reg-name" className="text-emerald-100/80 text-xs font-medium">
                  Nama
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/50" />
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="Nama lengkap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-11 bg-white/10 border-emerald-400/20 text-white placeholder:text-emerald-200/30 focus:border-emerald-400/50 focus:ring-emerald-400/20"
                    required
                    minLength={2}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-emerald-100/80 text-xs font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/50" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="email@contoh.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-white/10 border-emerald-400/20 text-white placeholder:text-emerald-200/30 focus:border-emerald-400/50 focus:ring-emerald-400/20"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-emerald-100/80 text-xs font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/50" />
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-white/10 border-emerald-400/20 text-white placeholder:text-emerald-200/30 focus:border-emerald-400/50 focus:ring-emerald-400/20"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-confirm-password" className="text-emerald-100/80 text-xs font-medium">
                  Konfirmasi Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/50" />
                  <Input
                    id="reg-confirm-password"
                    type="password"
                    placeholder="Ulangi password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-11 bg-white/10 border-emerald-400/20 text-white placeholder:text-emerald-200/30 focus:border-emerald-400/50 focus:ring-emerald-400/20"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold bg-emerald-500 hover:bg-emerald-400 text-white border-0 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/30 transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Mendaftar...
                  </>
                ) : (
                  <>
                    Daftar
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-emerald-200/60 pt-2">
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                >
                  Masuk
                </button>
              </p>
            </form>
          </div>

          {/* Bottom text on mobile */}
          <p className="text-center text-xs text-emerald-200/30 mt-6 lg:hidden">
            © 2026 KasirKu POS. Sistem Kasir Modern.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Brand & Identity */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative z-10">
        <div className="max-w-lg text-center animate-fade-in-right">
          {/* Logo */}
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl login-icon-glow-large">
            <Store className="h-12 w-12 text-white" />
          </div>

          {/* App Name */}
          <h1 className="text-5xl font-extrabold text-white tracking-tight mb-3">
            Kasir<span className="text-emerald-400">Ku</span>
          </h1>

          {/* Tagline */}
          <p className="text-lg text-emerald-200/70 font-light mb-2">
            Bergabung dengan KasirKu
          </p>
          <p className="text-sm text-emerald-200/40 mb-10">
            Daftar sekarang dan kelola toko Anda dengan lebih efisien
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="login-feature-card rounded-xl p-5 text-left"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 mb-3">
                  <feature.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-emerald-200/50">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-emerald-400">
                <Zap className="h-4 w-4" />
                <span className="text-2xl font-bold">Cepat</span>
              </div>
              <p className="text-xs text-emerald-200/40 mt-1">Transaksi instan</p>
            </div>
            <div className="w-px h-10 bg-emerald-400/20" />
            <div>
              <div className="flex items-center justify-center gap-1 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-2xl font-bold">Aman</span>
              </div>
              <p className="text-xs text-emerald-200/40 mt-1">Data terlindungi</p>
            </div>
            <div className="w-px h-10 bg-emerald-400/20" />
            <div>
              <div className="flex items-center justify-center gap-1 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-2xl font-bold">Smart</span>
              </div>
              <p className="text-xs text-emerald-200/40 mt-1">Laporan cerdas</p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <p className="absolute bottom-6 text-xs text-emerald-200/25">
          © 2026 KasirKu POS. All rights reserved.
        </p>
      </div>
    </div>
  )
}
