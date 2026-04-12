'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import Navigation from '@/components/Navigation'
import { supabase } from '@/lib/supabase'

type Tab = 'noticias' | 'canal'

export default function AdminPage() {
  const { user, fanProfile, loading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('canal')

  // Noticias form
  const [nTitle, setNTitle] = useState('')
  const [nBody, setNBody]   = useState('')
  const [nImage, setNImage] = useState('')
  const [nSending, setNSending] = useState(false)
  const [nDone, setNDone] = useState(false)

  // Canal form
  const [cBody, setCBody]   = useState('')
  const [cMedia, setCMedia] = useState('')
  const [cType, setCType]   = useState<'image' | 'video' | ''>('')
  const [cSending, setCSending] = useState(false)
  const [cDone, setCDone] = useState(false)

  useEffect(() => {
    if (!loading && (!user || !fanProfile?.is_admin)) router.replace('/wolf-club')
  }, [user, fanProfile, loading, router])

  if (loading || !user || !fanProfile?.is_admin) return null

  const postNoticias = async () => {
    if (!nTitle.trim() || !nBody.trim() || nSending) return
    setNSending(true)
    await supabase.from('news_posts').insert({
      title: nTitle.trim(),
      body: nBody.trim(),
      image_url: nImage.trim() || null,
    })
    setNTitle(''); setNBody(''); setNImage('')
    setNSending(false); setNDone(true)
    setTimeout(() => setNDone(false), 2500)
  }

  const postCanal = async () => {
    if (!cBody.trim() || cSending) return
    setCSending(true)
    await supabase.from('canal_posts').insert({
      body: cBody.trim(),
      media_url: cMedia.trim() || null,
      media_type: cType || null,
    })
    setCBody(''); setCMedia(''); setCType('')
    setCSending(false); setCDone(true)
    setTimeout(() => setCDone(false), 2500)
  }

  return (
    <main className="min-h-[100dvh] bg-[#0a0a0a]">
      <Navigation />

      <div className="pt-28 px-8 md:px-16 pb-20 max-w-2xl">
        <div className="mb-10">
          <p className="font-tour text-[8px] tracking-[0.3em] uppercase text-[#3a3a3a] mb-2">Wolf Club</p>
          <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-[0.05em] text-[#f2f2f2]">
            ADMIN
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-[#1a1a1a] mb-10">
          {(['canal', 'noticias'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 font-tour text-[10px] tracking-[0.2em] uppercase transition-colors duration-200 border-b-2 -mb-px ${
                tab === t ? 'border-[#f2f2f2] text-[#f2f2f2]' : 'border-transparent text-[#4a4a4a] hover:text-[#8a8a8a]'
              }`}
            >
              {t === 'canal' ? 'Canal ROA' : 'Noticias'}
            </button>
          ))}
        </div>

        {/* Canal form */}
        {tab === 'canal' && (
          <motion.div
            key="canal"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <label className="font-tour text-[9px] tracking-[0.2em] uppercase text-[#4a4a4a]">Mensaje</label>
              <textarea
                value={cBody}
                onChange={e => setCBody(e.target.value)}
                rows={5}
                placeholder="Escribe tu mensaje..."
                className="bg-transparent border border-[#1f1f1f] focus:border-[#3a3a3a] outline-none resize-none px-4 py-3 font-tour text-[11px] tracking-[0.05em] text-[#f2f2f2] placeholder:text-[#2e2e2e] transition-colors duration-200"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-tour text-[9px] tracking-[0.2em] uppercase text-[#4a4a4a]">URL de media <span className="text-[#2e2e2e] normal-case tracking-normal">(opcional)</span></label>
              <input
                value={cMedia}
                onChange={e => setCMedia(e.target.value)}
                placeholder="https://..."
                className="bg-transparent border border-[#1f1f1f] focus:border-[#3a3a3a] outline-none px-4 py-2.5 font-tour text-[11px] tracking-[0.05em] text-[#f2f2f2] placeholder:text-[#2e2e2e] transition-colors duration-200"
              />
            </div>

            {cMedia.trim() && (
              <div className="flex gap-3">
                {(['image', 'video'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setCType(type)}
                    className={`px-4 py-2 border font-tour text-[9px] tracking-[0.15em] uppercase transition-all duration-200 ${
                      cType === type ? 'border-[#f2f2f2]/30 bg-[#f2f2f2]/5 text-[#f2f2f2]' : 'border-[#1f1f1f] text-[#4a4a4a] hover:border-[#2e2e2e]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={postCanal}
              disabled={!cBody.trim() || cSending}
              className="self-start border border-[#2a2a2a] hover:border-[#f2f2f2]/20 disabled:opacity-20 disabled:cursor-not-allowed px-6 py-3 font-tour text-[10px] tracking-[0.2em] uppercase text-[#f2f2f2] transition-all duration-200"
            >
              {cSending ? 'Publicando...' : cDone ? 'Publicado ✓' : 'Publicar en Canal'}
            </button>
          </motion.div>
        )}

        {/* Noticias form */}
        {tab === 'noticias' && (
          <motion.div
            key="noticias"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <label className="font-tour text-[9px] tracking-[0.2em] uppercase text-[#4a4a4a]">Título</label>
              <input
                value={nTitle}
                onChange={e => setNTitle(e.target.value)}
                placeholder="Título de la noticia"
                className="bg-transparent border border-[#1f1f1f] focus:border-[#3a3a3a] outline-none px-4 py-2.5 font-tour text-[11px] tracking-[0.05em] text-[#f2f2f2] placeholder:text-[#2e2e2e] transition-colors duration-200"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-tour text-[9px] tracking-[0.2em] uppercase text-[#4a4a4a]">Contenido</label>
              <textarea
                value={nBody}
                onChange={e => setNBody(e.target.value)}
                rows={6}
                placeholder="Escribe la noticia..."
                className="bg-transparent border border-[#1f1f1f] focus:border-[#3a3a3a] outline-none resize-none px-4 py-3 font-tour text-[11px] tracking-[0.05em] text-[#f2f2f2] placeholder:text-[#2e2e2e] transition-colors duration-200"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-tour text-[9px] tracking-[0.2em] uppercase text-[#4a4a4a]">URL de imagen <span className="text-[#2e2e2e] normal-case tracking-normal">(opcional)</span></label>
              <input
                value={nImage}
                onChange={e => setNImage(e.target.value)}
                placeholder="https://..."
                className="bg-transparent border border-[#1f1f1f] focus:border-[#3a3a3a] outline-none px-4 py-2.5 font-tour text-[11px] tracking-[0.05em] text-[#f2f2f2] placeholder:text-[#2e2e2e] transition-colors duration-200"
              />
            </div>

            <button
              onClick={postNoticias}
              disabled={!nTitle.trim() || !nBody.trim() || nSending}
              className="self-start border border-[#2a2a2a] hover:border-[#f2f2f2]/20 disabled:opacity-20 disabled:cursor-not-allowed px-6 py-3 font-tour text-[10px] tracking-[0.2em] uppercase text-[#f2f2f2] transition-all duration-200"
            >
              {nSending ? 'Publicando...' : nDone ? 'Publicado ✓' : 'Publicar Noticia'}
            </button>
          </motion.div>
        )}
      </div>
    </main>
  )
}
