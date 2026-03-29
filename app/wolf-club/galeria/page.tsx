'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Navigation from '@/components/Navigation'
import GallerySection from '@/components/wolf-club/GallerySection'

export default function GaleriaPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <main className="relative min-h-[100dvh] bg-[#0a0a0a]">
      <Navigation />
      <div className="pt-24">
        <GallerySection />
      </div>
    </main>
  )
}
