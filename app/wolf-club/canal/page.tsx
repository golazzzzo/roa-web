'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Navigation from '@/components/Navigation'
import CanalSection from '@/components/wolf-club/CanalSection'

export default function CanalPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <main className="relative min-h-[100dvh] bg-[#0a0a0a]">
      <Navigation />
      <div className="pt-24">
        <CanalSection />
      </div>
    </main>
  )
}
