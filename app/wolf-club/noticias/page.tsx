'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Navigation from '@/components/Navigation'
import NoticiasSection from '@/components/wolf-club/NoticiasSection'

export default function NoticiasPage() {
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
        <NoticiasSection />
      </div>
    </main>
  )
}
