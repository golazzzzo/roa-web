'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/auth-context'
import Navigation from '@/components/Navigation'

const Wolf2Scene3D = dynamic(() => import('@/components/Wolf2Scene3D'), { ssr: false })

export default function WolfClubPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [wolfHovered, setWolfHovered] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <main className="relative min-h-[100dvh] bg-[#0a0a0a]">
      <Navigation />

      <div className="relative min-h-[100dvh] overflow-hidden flex flex-col">
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        >
          <source src="https://res.cloudinary.com/dy0mpdwnw/video/upload/v1774820857/video_4_mhx6qu.mov" type="video/quicktime" />
          <source src="https://res.cloudinary.com/dy0mpdwnw/video/upload/v1774820857/video_4_mhx6qu.mov" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0"
          style={{ zIndex: 1, background: 'linear-gradient(to bottom, rgba(10,10,10,0.6) 0%, rgba(10,10,10,0.45) 50%, rgba(10,10,10,1) 100%)' }}
        />
        <div className="relative flex flex-col items-center justify-center flex-1 px-8 text-center" style={{ zIndex: 2 }}>
          <div className="overflow-hidden mb-4">
            <motion.p
              initial={{ y: '110%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}
              className="font-display text-[clamp(2.5rem,8vw,6rem)] leading-none tracking-[0.08em] uppercase text-[#f2f2f2]"
            >
              WOLF CLUB
            </motion.p>
          </div>
          <div
            className="relative w-[clamp(240px,50vw,520px)] h-[clamp(240px,50vw,520px)]"
            onMouseEnter={() => setWolfHovered(true)}
            onMouseLeave={() => setWolfHovered(false)}
          >
            <Wolf2Scene3D />
            <div className="absolute inset-0" />

            {/* Left link — Galería */}
            <AnimatePresence>
              {wolfHovered && (
                <motion.a
                  href="/wolf-club/galeria"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}
                  className="absolute top-1/2 -translate-y-1/2 right-full pr-8 font-display text-[clamp(1rem,2.5vw,1.8rem)] tracking-[0.12em] uppercase text-[#c4bdb0] hover:text-[#d8d2c8] transition-colors duration-200 whitespace-nowrap"
                >
                  Galería
                </motion.a>
              )}
            </AnimatePresence>

            {/* Right link — Snippets */}
            <AnimatePresence>
              {wolfHovered && (
                <motion.a
                  href="/wolf-club/snippets"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}
                  className="absolute top-1/2 -translate-y-1/2 left-full pl-8 font-display text-[clamp(1rem,2.5vw,1.8rem)] tracking-[0.12em] uppercase text-[#c4bdb0] hover:text-[#d8d2c8] transition-colors duration-200 whitespace-nowrap"
                >
                  Snippets
                </motion.a>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

    </main>
  )
}
