'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import Navigation from '@/components/Navigation'
import NoticiasSection from '@/components/wolf-club/NoticiasSection'
import ChatSection from '@/components/wolf-club/ChatSection'
import CanalSection from '@/components/wolf-club/CanalSection'

type Channel = 'noticias' | 'general' | 'canal'

const CHANNELS: { id: Channel; label: string; sub: string }[] = [
  { id: 'noticias', label: 'NOTICIAS',  sub: 'Anuncios del club' },
  { id: 'general',  label: 'GENERAL',   sub: 'Chat entre fans'  },
  { id: 'canal',    label: 'CANAL ROA', sub: 'Mensajes de ROA'  },
]

export default function ComunidadPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [active, setActive] = useState<Channel>('general')

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  if (loading || !user) return null

  const activeChannel = CHANNELS.find(c => c.id === active)!

  return (
    <main className="bg-[#0a0a0a] h-[100dvh] flex flex-col overflow-hidden">
      <Navigation />

      <div className="flex flex-1 overflow-hidden pt-[72px]">

        {/* Sidebar */}
        <aside className="w-52 shrink-0 border-r border-[#141414] flex flex-col overflow-y-auto">
          <div className="px-6 pt-8 pb-6 border-b border-[#141414]">
            <p className="font-tour text-[7px] tracking-[0.35em] uppercase text-[#2e2e2e] mb-1">Wolf Club</p>
            <h2 className="font-display text-[1.6rem] leading-none tracking-[0.06em] text-[#f2f2f2]">
              COMUNIDAD
            </h2>
          </div>

          <nav className="flex flex-col pt-4 pb-6">
            {CHANNELS.map(ch => {
              const isActive = active === ch.id
              return (
                <button
                  key={ch.id}
                  onClick={() => setActive(ch.id)}
                  className={`w-full text-left px-6 py-3 flex flex-col gap-0.5 transition-all duration-200 border-l-2 ${
                    isActive
                      ? 'border-l-[#c4bdb0]/50 text-[#f2f2f2]'
                      : 'border-l-transparent text-[#3a3a3a] hover:text-[#6a6a6a] hover:border-l-[#2a2a2a]'
                  }`}
                >
                  <span className="font-display text-[1rem] leading-none tracking-[0.08em]">{ch.label}</span>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-tour text-[8px] tracking-[0.15em] text-[#4a4a4a]"
                    >
                      {ch.sub}
                    </motion.span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Bottom decoration */}
          <div className="mt-auto px-6 pb-6">
            <img src="/roa-symbol.png" className="w-8 h-8 object-contain opacity-10" alt="" />
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Channel header */}
          <div className="shrink-0 border-b border-[#141414] px-8 h-14 flex items-center gap-4">
            <h3 className="font-display text-[1.2rem] leading-none tracking-[0.08em] text-[#f2f2f2]">
              {activeChannel.label}
            </h3>
            <div className="w-px h-3 bg-[#2a2a2a]" />
            <span className="font-tour text-[9px] tracking-[0.15em] text-[#3a3a3a]">
              {activeChannel.sub}
            </span>
          </div>

          {/* Section content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {active === 'noticias' && <NoticiasSection />}
                {active === 'general'  && <ChatSection />}
                {active === 'canal'    && <CanalSection />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  )
}
