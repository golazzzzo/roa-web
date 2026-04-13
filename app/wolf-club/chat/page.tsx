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
    <main className="h-[100dvh] flex flex-col overflow-hidden relative">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/roa-avatar.jpg)' }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/80" />

      <div className="relative z-10 flex flex-col h-full">
      <Navigation />

      <div className="flex flex-1 overflow-hidden pt-[72px]">

        {/* Sidebar */}
        <aside className="w-52 shrink-0 bg-black/40 backdrop-blur-md border-r border-white/10 flex flex-col overflow-y-auto">
          <div className="px-4 pt-5 pb-3 border-b border-white/10">
            <p className="font-ui text-[10px] font-semibold tracking-[0.2em] uppercase text-[#555]">
              Comunidad
            </p>
          </div>

          <nav className="flex flex-col gap-0.5 px-2 pt-3">
            {CHANNELS.map(ch => {
              const isActive = active === ch.id
              return (
                <button
                  key={ch.id}
                  onClick={() => setActive(ch.id)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-all duration-150 rounded-md ${
                    isActive
                      ? 'bg-white/10 text-[#f0f0f0]'
                      : 'text-[#666] hover:text-[#bbb] hover:bg-white/5'
                  }`}
                >
                  <span className={`font-ui text-[11px] font-medium ${isActive ? 'text-white/40' : 'text-[#333]'}`}>#</span>
                  <span className="font-ui text-[12px] font-medium tracking-[0.01em]">{ch.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-transparent">

          {/* Channel header */}
          <div className="shrink-0 border-b border-white/10 px-6 h-11 flex items-center gap-3 bg-black/30 backdrop-blur-md">
            <span className="font-ui text-[12px] font-medium text-[#555]">#</span>
            <span className="font-ui text-[13px] font-semibold text-[#e8e8e8] tracking-[-0.01em]">
              {activeChannel.label}
            </span>
            <div className="w-px h-3.5 bg-[#2a2a30]" />
            <span className="font-ui text-[11px] text-[#444]">
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
      </div>
    </main>
  )
}
