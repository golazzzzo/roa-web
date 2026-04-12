'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase, REACTION_EMOJIS } from '@/lib/supabase'
import type { CanalPost } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

type ReactionCounts = Record<string, Record<string, number>>
type Attachment = { file: File; preview: string; type: 'image' | 'video' }

async function uploadMedia(file: File): Promise<{ url: string; type: 'image' | 'video' }> {
  const ext = file.name.split('.').pop()
  const path = `canal/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data } = await supabase.storage.from('wolf-club-media').upload(path, file)
  const { data: { publicUrl } } = supabase.storage.from('wolf-club-media').getPublicUrl(data!.path)
  return { url: publicUrl, type: file.type.startsWith('video/') ? 'video' : 'image' }
}

export default function CanalSection() {
  const { user, fanProfile } = useAuth()
  const isAdmin = fanProfile?.is_admin === true

  const [posts, setPosts] = useState<CanalPost[]>([])
  const [loading, setLoading] = useState(true)
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>({})
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set())

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    const { data: postsData } = await supabase
      .from('canal_posts').select('*').order('created_at', { ascending: true })
    if (!postsData || postsData.length === 0) { setLoading(false); return }
    setPosts(postsData as CanalPost[])

    const postIds = postsData.map((p: CanalPost) => p.id)
    const { data: reactionsData } = await supabase
      .from('canal_reactions').select('post_id, fan_id, emoji').in('post_id', postIds)

    const counts: ReactionCounts = {}
    const mine = new Set<string>()
    for (const r of (reactionsData ?? [])) {
      if (!counts[r.post_id]) counts[r.post_id] = {}
      counts[r.post_id][r.emoji] = (counts[r.post_id][r.emoji] ?? 0) + 1
      if (r.fan_id === user?.id) mine.add(`${r.post_id}:${r.emoji}`)
    }
    setReactionCounts(counts)
    setMyReactions(mine)
    setLoading(false)
  }, [user?.id])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'instant' }) }, [loading])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [posts])

  useEffect(() => {
    const channel = supabase
      .channel('wolf-club-canal')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'canal_posts' }, (payload) => {
        const p = payload.new as CanalPost
        setPosts(prev => prev.some(x => x.id === p.id) ? prev : [...prev, p])
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'canal_posts' }, (payload) => {
        setPosts(prev => prev.filter(p => p.id !== (payload.old as CanalPost).id))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'canal_reactions' }, (payload) => {
        const { post_id, emoji, fan_id } = payload.new
        setReactionCounts(prev => ({ ...prev, [post_id]: { ...prev[post_id], [emoji]: (prev[post_id]?.[emoji] ?? 0) + 1 } }))
        if (fan_id === user?.id) setMyReactions(prev => new Set(prev).add(`${post_id}:${emoji}`))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'canal_reactions' }, (payload) => {
        const { post_id, emoji, fan_id } = payload.old
        setReactionCounts(prev => ({ ...prev, [post_id]: { ...prev[post_id], [emoji]: Math.max(0, (prev[post_id]?.[emoji] ?? 1) - 1) } }))
        if (fan_id === user?.id) setMyReactions(prev => { const n = new Set(prev); n.delete(`${post_id}:${emoji}`); return n })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  const publish = async () => {
    if ((!input.trim() && !attachment) || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    let mediaUrl: string | null = null
    let mediaType: 'image' | 'video' | null = null
    if (attachment) {
      const r = await uploadMedia(attachment.file)
      mediaUrl = r.url; mediaType = r.type
      URL.revokeObjectURL(attachment.preview); setAttachment(null)
    }

    const { data } = await supabase
      .from('canal_posts')
      .insert({ body: content || ' ', media_url: mediaUrl, media_type: mediaType })
      .select().single()
    if (data) setPosts(prev => prev.some(p => p.id === data.id) ? prev : [...prev, data as CanalPost])
    setSending(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachment({ file, preview: URL.createObjectURL(file), type: file.type.startsWith('video/') ? 'video' : 'image' })
    e.target.value = ''
  }

  const removeAttachment = () => { if (attachment) URL.revokeObjectURL(attachment.preview); setAttachment(null) }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); publish() }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const deletePost = async (id: string) => {
    await supabase.from('canal_posts').delete().eq('id', id)
  }

  const toggleReaction = async (postId: string, emoji: string) => {
    if (!user) return
    const key = `${postId}:${emoji}`
    if (myReactions.has(key)) {
      await supabase.from('canal_reactions').delete().eq('post_id', postId).eq('fan_id', user.id).eq('emoji', emoji)
    } else {
      await supabase.from('canal_reactions').insert({ post_id: postId, fan_id: user.id, emoji })
    }
  }

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'long' }) + ' · ' +
    new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6">
        {loading ? (
          <p className="font-tour text-[9px] tracking-[0.3em] uppercase text-[#2e2e2e] m-auto">Cargando...</p>
        ) : posts.length === 0 ? (
          <p className="font-tour text-[9px] tracking-[0.3em] uppercase text-[#2e2e2e] m-auto">Pronto — mensajes de ROA</p>
        ) : posts.map((post) => {
          const hasText = post.body?.trim() && post.body.trim() !== ' '
          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex gap-4 items-start group"
            >
              <img src="/roa-symbol.png" className="w-7 h-7 object-contain opacity-50 shrink-0 mt-1" alt="" />

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="font-display text-[1rem] leading-none tracking-[0.08em] text-[#f2f2f2]">ROA</span>
                  <span className="font-tour text-[8px] tracking-[0.15em] text-[#2e2e2e]">{formatDate(post.created_at)}</span>
                  {isAdmin && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity font-tour text-[8px] tracking-[0.1em] text-[#2e2e2e] hover:text-red-400/50"
                    >eliminar</button>
                  )}
                </div>

                <div className="border border-[#1a1a1a] bg-[#0d0d0d] overflow-hidden max-w-[520px]">
                  {post.media_url && post.media_type === 'image' && (
                    <img src={post.media_url} alt="" className="w-full max-h-[440px] object-cover" />
                  )}
                  {post.media_url && post.media_type === 'video' && (
                    <video src={post.media_url} className="w-full max-h-[440px]" controls />
                  )}
                  {hasText && (
                    <p className="font-tour text-[11px] tracking-[0.04em] text-[#c4bdb0] leading-relaxed px-5 py-4 whitespace-pre-line">
                      {post.body}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {REACTION_EMOJIS.map(emoji => {
                    const count = reactionCounts[post.id]?.[emoji] ?? 0
                    const isActive = myReactions.has(`${post.id}:${emoji}`)
                    return (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(post.id, emoji)}
                        className={`flex items-center gap-1.5 px-3 py-1 border transition-all duration-200 font-tour text-[11px] ${
                          isActive
                            ? 'border-[#c4bdb0]/20 bg-[#c4bdb0]/5 text-[#c4bdb0]'
                            : 'border-[#1a1a1a] hover:border-[#2a2a2a] text-[#3a3a3a] hover:text-[#6a6a6a]'
                        }`}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span className="text-[10px]">{count}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {isAdmin && (
        <>
          {attachment && (
            <div className="shrink-0 px-8 pt-2">
              <div className="relative inline-block">
                {attachment.type === 'image'
                  ? <img src={attachment.preview} className="h-16 max-w-[120px] object-cover border border-[#2a2a2a]" alt="" />
                  : <div className="h-16 w-28 bg-[#0d0d0d] border border-[#2a2a2a] flex items-center justify-center">
                      <span className="font-tour text-[9px] text-[#4a4a4a] tracking-[0.1em]">VIDEO</span>
                    </div>
                }
                <button onClick={removeAttachment} className="absolute -top-1 -right-1 w-4 h-4 bg-[#0a0a0a] border border-[#2a2a2a] flex items-center justify-center font-tour text-[8px] text-[#4a4a4a] hover:text-red-400/60">✕</button>
              </div>
            </div>
          )}
          <div className="shrink-0 border-t border-[#141414] px-8 py-4 flex items-end gap-3">
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 w-8 h-8 flex items-center justify-center border border-[#1f1f1f] hover:border-[#3a3a3a] text-[#3a3a3a] hover:text-[#f2f2f2] transition-all duration-200 font-tour text-base leading-none"
            >+</button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Escribe algo para tus fans..."
              maxLength={1000}
              rows={1}
              className="flex-1 bg-transparent border border-[#1a1a1a] focus:border-[#2e2e2e] outline-none resize-none px-4 py-2.5 font-tour text-[11px] tracking-[0.04em] text-[#c4bdb0] placeholder:text-[#2e2e2e] transition-colors duration-200"
              style={{ lineHeight: '1.6' }}
            />
            <button
              onClick={publish}
              disabled={(!input.trim() && !attachment) || sending}
              className="shrink-0 border border-[#1f1f1f] hover:border-[#3a3a3a] disabled:opacity-20 disabled:cursor-not-allowed px-4 py-2.5 font-tour text-[9px] tracking-[0.2em] uppercase text-[#f2f2f2] transition-all duration-200"
            >
              {sending ? '...' : 'Publicar'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
