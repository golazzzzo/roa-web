'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type Snippet = {
  id: string
  title: string
  description: string | null
  file_url: string
  file_type: string
  created_at: string
}

export default function SnippetsSection() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<Snippet | null>(null)

  useEffect(() => {
    supabase
      .from('snippets')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSnippets((data as Snippet[]) ?? [])
        setLoading(false)
      })
  }, [])

  const isVideo = (type: string) => type === 'video'
  const isAudio = (type: string) => type === 'audio'

  return (
    <div className="px-8 md:px-16 pt-20 pb-4">
      {/* Header */}
      <div className="mb-12">
        <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-[0.05em] text-[#f2f2f2]">
          SNIPPETS
        </h2>
      </div>

      {loading ? (
        <p className="font-tour text-[10px] tracking-[0.2em] uppercase text-[#3a3a3a]">Cargando...</p>
      ) : snippets.length === 0 ? (
        <div className="border border-dashed border-[#1f1f1f] h-40 flex items-center justify-center">
          <p className="font-tour text-[10px] tracking-[0.2em] uppercase text-[#2e2e2e]">Pronto — contenido exclusivo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {snippets.map((snippet, i) => (
            <motion.div
              key={snippet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group border border-[#1f1f1f] hover:border-[#2e2e2e] transition-colors duration-300 cursor-pointer overflow-hidden"
              onClick={() => setActive(snippet)}
            >
              {/* Thumbnail / preview */}
              <div className="relative aspect-video bg-[#111111] overflow-hidden">
                {isVideo(snippet.file_type) ? (
                  <video
                    src={snippet.file_url}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
                    muted
                    playsInline
                  />
                ) : isAudio(snippet.file_type) ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" strokeWidth="1">
                      <path d="M9 18V5l12-2v13M9 18c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-2c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ) : (
                  <img src={snippet.file_url} alt={snippet.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                )}

                {/* Play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-10 h-10 border border-[#f2f2f2]/30 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="#f2f2f2">
                      <path d="M2 1l9 5-9 5V1z"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="font-tour text-[9px] tracking-[0.2em] uppercase text-[#3a3a3a] mb-1">
                  {snippet.file_type} · {new Date(snippet.created_at).toLocaleDateString('es', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="font-display text-base tracking-[0.06em] text-[#f2f2f2]">{snippet.title}</p>
                {snippet.description && (
                  <p className="font-tour text-[9px] tracking-[0.1em] text-[#4a4a4a] mt-1 leading-relaxed">{snippet.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {active && (
        <motion.div
          className="fixed inset-0 z-[9000] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setActive(null)}
        >
          <div className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-sm" />
          <motion.div
            className="relative w-full max-w-3xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setActive(null)} className="absolute -top-8 right-0 text-[#4a4a4a] hover:text-[#f2f2f2] transition-colors font-tour text-[10px] tracking-[0.2em] uppercase">
              Cerrar ✕
            </button>
            {isVideo(active.file_type) ? (
              <video src={active.file_url} className="w-full" controls autoPlay />
            ) : isAudio(active.file_type) ? (
              <div className="border border-[#1f1f1f] bg-[#0d0d0d] p-8">
                <p className="font-display text-xl tracking-[0.1em] text-[#f2f2f2] mb-4">{active.title}</p>
                <audio src={active.file_url} className="w-full" controls />
              </div>
            ) : (
              <img src={active.file_url} alt={active.title} className="w-full" />
            )}
            <div className="mt-4">
              <p className="font-display text-lg tracking-[0.08em] text-[#f2f2f2]">{active.title}</p>
              {active.description && <p className="font-tour text-[10px] tracking-[0.15em] text-[#4a4a4a] mt-1">{active.description}</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
