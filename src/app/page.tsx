'use client'

import dynamic from 'next/dynamic'

const PosApp = dynamic(
  () => import('@/components/pos-app').then((mod) => mod.PosApp),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm font-medium">Memuat KasirKu...</p>
        </div>
      </div>
    ),
  }
)

export default function Home() {
  return <PosApp />
}
