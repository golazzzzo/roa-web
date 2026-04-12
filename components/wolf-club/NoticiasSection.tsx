'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import type { NewsPost } from '@/lib/supabase'

type Attachment = { file: File; preview: string; type: 'image' | 'video' }

async function uploadMedia(file: File): Promise<{ url: string; type: 'image' | 'video' }> {
  const ext = file.name.split('.').pop()
  const path = `noticias/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data } = await supabase.storage.from('wolf-club-media').upload(path, file)
  const { data: { publicUrl } } = supabase.storage.from('wolf-club-media').getPublicUrl(data!.path)
  return { url: publicUrl, type: file.type.startsWith('video/') ? 'video' : 'image' }
}

export default function NoticiasSection() {
  const { fanProfile } = useAuth()
  const isAdmin = fanProfile?.is_admin === true

  const [posts, setPosts] = useState<NewsPost[]>([])
  const [loading, setLoading] = useState(true)

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    if ((!input.trim() && !attachment) || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    let mediaUrl: string | null = null
    let mediaType: 'image' | 'video' | null = null
    if (attachment) {
      const result = await uploadMedia(attachment.file)
      mediaUrl = result.url
      mediaType = result.type
      URL.revokeObjectURL(attachment.preview)
      setAttachment(null)
    }

    const { data } = await supabase
      .from('news_posts')
      .insert({ title: null, body: content || ' ', image_url: null, media_url: mediaUrl, media_type: mediaType })
      .select().single()
    if (data) setPosts(prev => [data as NewsPost, ...prev])
    setSending(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const type = file.type.startsWith('video/') ? 'video' : 'image'
    setAttachment({ file, preview: URL.createObjectURL(file), type })
    e.target.value = ''
  }

  const removeAttachment = () => {
    if (attachment) URL.revokeObjectURL(attachment.preview)
    setAttachment(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); publish() }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const deletePost = async (id: string) => {
    await supabase.from('news_posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Posts */}
      <div className="flex-1 overflow-y-auto px-8 md:px-16 py-8">
        {loading ? (
          <p className="font-tour text-[10px] tracking-[0.2em] uppercase text-[#3a3a3a]">Cargando...</p>
        ) : posts.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="font-tour text-[10px] tracking-[0.2em] uppercase text-[#2e2e2e]">Pronto — anuncios del club</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {posts.map((post, i) => {
              const hasText = post.body && post.body.trim() && post.body.trim() !== ' '
              return (
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
                  <div className="flex items-center gap-3 mb-5">
                    <img src="/roa-symbol.png" className="w-5 h-5 object-contain opacity-60" alt="" />
                    <span className="font-tour text-[9px] tracking-[0.25em] uppercase text-[#4a4a4a]">ROA</span>
                    <span className="font-tour text-[9px] text-[#2e2e2e]">·</span>
                    <span className="font-tour text-[9px] tracking-[0.1em] text-[#3a3a3a]">{formatDate(post.created_at)}</span>
                  </div>
                  {post.media_url && post.media_type === 'image' && (
                    <img src={post.media_url} alt="" className="w-full max-h-[500px] object-cover mb-5 opacity-90" />
                  )}
                  {post.media_url && post.media_type === 'video' && (
                    <video src={post.media_url} className="w-full max-h-[500px] mb-5" controls />
                  )}
                  {post.image_url && !post.media_url && (
                    <img src={post.image_url} alt="" className="w-full max-h-[500px] object-cover mb-5 opacity-90" />
                  )}
                  {hasText && (
                    <p className="font-tour text-[12px] tracking-[0.06em] text-[#c4bdb0] leading-relaxed whitespace-pre-line">
                      {post.body}
                    </p>
                  )}
                  {post.title && (
                    <h3 className="font-display text-[clamp(1.2rem,2vw,1.8rem)] leading-tight tracking-[0.05em] text-[#f2f2f2] mt-3">
                      {post.title}
                    </h3>
                  )}
                </motion.article>
              )
            })}
          </div>
        )}
      </div>

      {/* Admin input */}
      {isAdmin && (
        <>
          {attachment && (
            <div className="shrink-0 px-8 md:px-16 pt-3">
              <div className="relative inline-block">
                {attachment.type === 'image'
                  ? <img src={attachment.preview} className="h-20 max-w-[140px] object-cover border border-[#2a2a2a]" alt="" />
                  : <div className="h-20 w-32 bg-[#111] border border-[#2a2a2a] flex items-center justify-center">
                      <span className="font-tour text-[9px] text-[#4a4a4a] tracking-[0.1em]">VIDEO</span>
                    </div>
                }
                <button
                  onClick={removeAttachment}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#0a0a0a] border border-[#2a2a2a] flex items-center justify-center text-[#f2f2f2]/40 hover:text-red-400/70 font-tour text-[8px]"
                >✕</button>
              </div>
            </div>
          )}
          <div className="shrink-0 border-t border-[#1f1f1f] px-8 md:px-16 py-4 flex items-end gap-3">
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 w-8 h-8 flex items-center justify-center border border-[#1f1f1f] hover:border-[#3a3a3a] text-[#4a4a4a] hover:text-[#f2f2f2] transition-all duration-200 font-tour text-lg leading-none pb-0.5"
            >
              +
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un anuncio..."
              maxLength={2000}
              rows={1}
              className="flex-1 bg-transparent border border-[#1f1f1f] focus:border-[#3a3a3a] outline-none resize-none px-4 py-2.5 font-tour text-[11px] tracking-[0.05em] text-[#f2f2f2] placeholder:text-[#3a3a3a] transition-colors duration-200"
              style={{ lineHeight: '1.6' }}
            />
            <button
              onClick={publish}
              disabled={(!input.trim() && !attachment) || sending}
              className="shrink-0 border border-[#2a2a2a] hover:border-[#f2f2f2]/20 disabled:opacity-20 disabled:cursor-not-allowed px-5 py-2.5 font-tour text-[10px] tracking-[0.2em] uppercase text-[#f2f2f2] transition-all duration-200"
            >
              {sending ? '...' : 'Publicar'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
