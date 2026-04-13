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
  { id: 'noticias', label: 'noticias',  description: 'Anuncios del club' },
  { id: 'general',  label: 'general',   description: 'Chat entre fans'  },
  { id: 'canal',    label: 'canal-roa', description: 'Mensajes de ROA'  },
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

        {/* Sidebar — slightly darker to separate from content */}
        <aside className="w-52 shrink-0 bg-[#080808] border-r border-[#161616] flex flex-col overflow-y-auto">
          <div className="px-4 pt-5 pb-3 border-b border-[#161616]">
            <p className="font-ui text-[10px] font-semibold tracking-[0.2em] uppercase text-[#3a3a3a]">
              Comunidad
            </p>
          </div>

          <nav className="flex flex-col gap-px px-2 pt-3">
            {CHANNELS.map(ch => {
              const isActive = active === ch.id
              return (
                <button
                  key={ch.id}
                  onClick={() => setActive(ch.id)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-all duration-150 rounded-sm ${
                    isActive
                      ? 'bg-[#1a1a1a] text-[#f0f0f0]'
                      : 'text-[#4a4a4a] hover:text-[#9a9a9a] hover:bg-[#111]'
                  }`}
                >
                  <span className={`font-ui text-[11px] font-medium ${isActive ? 'text-[#6a6a6a]' : 'text-[#2e2e2e]'}`}>#</span>
                  <span className="font-ui text-[12px] font-medium tracking-[0.01em]">{ch.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">

          {/* Channel header */}
          <div className="shrink-0 border-b border-[#161616] px-6 h-11 flex items-center gap-3 bg-[#0a0a0a]">
            <span className="font-ui text-[12px] font-medium text-[#5a5a5a]">#</span>
            <span className="font-ui text-[13px] font-semibold text-[#e8e8e8] tracking-[-0.01em]">
              {activeChannel.label}
            </span>
            <div className="w-px h-3.5 bg-[#222]" />
            <span className="font-ui text-[11px] text-[#3a3a3a]">
              {activeChannel.description}
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
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
