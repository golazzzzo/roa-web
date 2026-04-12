'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import type { NewsPost } from '@/lib/supabase'

export default function NoticiasSection() {
  const { fanProfile } = useAuth()
  const isAdmin = fanProfile?.is_admin === true

  const [posts, setPosts] = useState<NewsPost[]>([])
  const [loading, setLoading] = useState(true)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    supabase
      .from('news_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPosts((data as NewsPost[]) ?? [])
        setLoading(false)
      })
  }, [])

  const publish = async () => {
    if (!title.trim() || !body.trim() || sending) return
    setSending(true)
    const { data } = await supabase
      .from('news_posts')
      .insert({ title: title.trim(), body: body.trim(), image_url: null })
      .select()
      .single()
    if (data) setPosts(prev => [data as NewsPost, ...prev])
    setTitle(''); setBody('')
    if (bodyRef.current) bodyRef.current.style.height = 'auto'
    setSending(false)
  }

  const handleBodyInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const deletePost = async (id: string) => {
    await supabase.from('news_posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Posts */}
      <div className="flex-1 overflow-y-auto px-8 md:px-16 py-8">
        {loading ? (
          <p className="font-tour text-[10px] tracking-[0.2em] uppercase text-[#3a3a3a]">Cargando...</p>
        ) : posts.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="font-tour text-[10px] tracking-[0.2em] uppercase text-[#2e2e2e]">
              Pronto — anuncios del club
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {posts.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="relative group border-b border-[#1f1f1f] py-10 first:border-t"
              >
                {isAdmin && (
                  <button
                    onClick={() => deletePost(post.id)}
                    className="absolute top-10 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-tour text-[9px] tracking-[0.1em] text-[#4a4a4a] hover:text-red-400/70"
                  >
                    Eliminar
                  </button>
                )}
                <p className="font-tour text-[9px] tracking-[0.25em] uppercase text-[#4a4a4a] mb-3">
                  {new Date(post.created_at).toLocaleDateString('es', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
                <h3 className="font-display text-[clamp(1.5rem,3vw,2.5rem)] leading-tight tracking-[0.05em] text-[#f2f2f2] mb-4">
                  {post.title}
                </h3>
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full max-h-80 object-cover mb-6 opacity-80"
                  />
                )}
                <p className="font-tour text-[11px] tracking-[0.08em] text-[#8a8a8a] leading-relaxed whitespace-pre-line">
                  {post.body}
                </p>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {/* Admin input */}
      {isAdmin && (
        <div className="shrink-0 border-t border-[#1f1f1f] px-8 md:px-16 py-4 flex flex-col gap-2">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título..."
            className="bg-transparent border border-[#1f1f1f] focus:border-[#3a3a3a] outline-none px-4 py-2 font-tour text-[11px] tracking-[0.05em] text-[#f2f2f2] placeholder:text-[#3a3a3a] transition-colors duration-200"
          />
          <div className="flex items-end gap-4">
            <textarea
              ref={bodyRef}
              value={body}
              onChange={handleBodyInput}
              placeholder="Escribe la noticia..."
              maxLength={2000}
              rows={1}
              className="flex-1 bg-transparent border border-[#1f1f1f] focus:border-[#3a3a3a] outline-none resize-none px-4 py-2.5 font-tour text-[11px] tracking-[0.05em] text-[#f2f2f2] placeholder:text-[#3a3a3a] transition-colors duration-200"
              style={{ lineHeight: '1.6' }}
            />
            <button
              onClick={publish}
              disabled={!title.trim() || !body.trim() || sending}
              className="shrink-0 border border-[#2a2a2a] hover:border-[#f2f2f2]/20 disabled:opacity-20 disabled:cursor-not-allowed px-5 py-2.5 font-tour text-[10px] tracking-[0.2em] uppercase text-[#f2f2f2] transition-all duration-200"
            >
              Publicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
