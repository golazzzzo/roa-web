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

const CHANNELS: { id: Channel; label: string; description: string }[] = [
  { id: 'noticias', label: 'noticias', description: 'Anuncios del club' },
  { id: 'general',  label: 'general',  description: 'Chat entre fans' },
  { id: 'canal',    label: 'canal-roa', description: 'Mensajes de ROA' },
]

export default function ComunidadPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [active, setActive] = useState<Channel>('general')

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <main className="bg-[#0a0a0a] h-[100dvh] flex flex-col overflow-hidden">
      <Navigation />

      <div className="flex flex-1 overflow-hidden pt-[72px]">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-[#1a1a1a] flex flex-col py-6 overflow-y-auto">
          <p className="px-5 font-tour text-[8px] tracking-[0.3em] uppercase text-[#3a3a3a] mb-4">
            Comunidad
          </p>

          <nav className="flex flex-col gap-0.5 px-2">
            {CHANNELS.map(ch => (
              <button
                key={ch.id}
                onClick={() => setActive(ch.id)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors duration-150 ${
                  active === ch.id
                    ? 'bg-[#1a1a1a] text-[#f2f2f2]'
                    : 'text-[#4a4a4a] hover:text-[#8a8a8a] hover:bg-[#141414]'
                }`}
              >
                <span className="font-tour text-[10px] text-[#3a3a3a]">#</span>
                <span className="font-tour text-[10px] tracking-[0.1em]">{ch.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Channel header */}
          <div className="shrink-0 border-b border-[#1a1a1a] px-8 h-12 flex items-center gap-3">
            <span className="font-tour text-[10px] text-[#3a3a3a]">#</span>
            <span className="font-tour text-[10px] tracking-[0.15em] text-[#f2f2f2]">
              {CHANNELS.find(c => c.id === active)?.label}
            </span>
            <span className="font-tour text-[9px] text-[#2e2e2e]">—</span>
            <span className="font-tour text-[9px] tracking-[0.1em] text-[#3a3a3a]">
              {CHANNELS.find(c => c.id === active)?.description}
            </span>
          </div>

          {/* Section content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {active === 'noticias' && <div className="flex-1 overflow-y-auto"><NoticiasSection /></div>}
                {active === 'general'  && <ChatSection />}
                {active === 'canal'    && <div className="flex-1 overflow-y-auto"><CanalSection /></div>}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  )
}
