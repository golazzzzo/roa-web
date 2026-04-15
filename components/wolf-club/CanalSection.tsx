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
      .from('canal_posts')
      .select('*')
      .order('created_at', { ascending: true })

    if (!postsData || postsData.length === 0) { setLoading(false); return }
    setPosts(postsData as CanalPost[])

    const postIds = postsData.map((p: CanalPost) => p.id)
    const { data: reactionsData } = await supabase
      .from('canal_reactions')
      .select('post_id, fan_id, emoji')
      .in('post_id', postIds)

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

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [loading])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [posts])

  useEffect(() => {
    const channel = supabase
      .channel('wolf-club-canal')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'canal_posts' }, (payload) => {
        const newPost = payload.new as CanalPost
        setPosts(prev => prev.some(p => p.id === newPost.id) ? prev : [...prev, newPost])
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
        if (fan_id === user?.id) setMyReactions(prev => { const next = new Set(prev); next.delete(`${post_id}:${emoji}`); return next })
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
      const result = await uploadMedia(attachment.file)
      mediaUrl = result.url; mediaType = result.type
      URL.revokeObjectURL(attachment.preview)
      setAttachment(null)
    }

    // optimistic: add instantly
    const tempId = `temp-${Date.now()}`
    const tempPost: CanalPost = {
      id: tempId,
      body: content || ' ',
      media_url: mediaUrl,
      media_type: mediaType,
      created_at: new Date().toISOString(),
    }
    setPosts(prev => [...prev, tempPost])
    setSending(false)

    // sync and replace temp
    const { data } = await supabase
      .from('canal_posts')
      .insert({ body: content || ' ', media_url: mediaUrl, media_type: mediaType })
      .select().single()
    if (data) setPosts(prev => prev.map(p => p.id === tempId ? data as CanalPost : p))
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

  const toggleReaction = (postId: string, emoji: string) => {
    if (!user) return
    const key = `${postId}:${emoji}`
    const isActive = myReactions.has(key)

    // optimistic update — instant
    setMyReactions(prev => {
      const next = new Set(prev)
      isActive ? next.delete(key) : next.add(key)
      return next
    })
    setReactionCounts(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        [emoji]: Math.max(0, (prev[postId]?.[emoji] ?? 0) + (isActive ? -1 : 1)),
      },
    }))

    // sync to supabase in background, revert on error
    if (isActive) {
      supabase.from('canal_reactions').delete()
        .eq('post_id', postId).eq('fan_id', user.id).eq('emoji', emoji)
        .then(({ error }) => {
          if (error) {
            setMyReactions(prev => new Set(prev).add(key))
            setReactionCounts(prev => ({ ...prev, [postId]: { ...prev[postId], [emoji]: (prev[postId]?.[emoji] ?? 0) + 1 } }))
          }
        })
    } else {
      supabase.from('canal_reactions').insert({ post_id: postId, fan_id: user.id, emoji })
        .then(({ error }) => {
          if (error) {
            setMyReactions(prev => { const next = new Set(prev); next.delete(key); return next })
            setReactionCounts(prev => ({ ...prev, [postId]: { ...prev[postId], [emoji]: Math.max(0, (prev[postId]?.[emoji] ?? 1) - 1) } }))
          }
        })
    }
  }

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'long' }) + ' · ' +
    new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col gap-3">
        {loading ? (
          <p className="font-wc-label text-[10px] tracking-[0.2em] uppercase text-[#3a3a3a] m-auto">Cargando...</p>
        ) : posts.length === 0 ? (
          <p className="font-wc-label text-[10px] tracking-[0.2em] uppercase text-[#2e2e2e] m-auto">Pronto — mensajes de ROA</p>
        ) : posts.map((post, i) => {
          const hasText = post.body?.trim() && post.body.trim() !== ' '
          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex gap-3 items-start group"
            >
              {/* ROA avatar */}
              <img src="/roa-avatar.jpg" className="w-8 h-8 rounded-full object-cover border border-[#1f1f1f] shrink-0 mt-0.5 opacity-80" alt="ROA" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-wc-label text-[10px] tracking-[0.2em] uppercase text-[#f2f2f2]">ROA</span>
                  <span className="font-wc-label text-[9px] text-[#2e2e2e]">{formatDate(post.created_at)}</span>
                  {isAdmin && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity font-wc-label text-[9px] text-[#3a3a3a] hover:text-red-400/60"
                    >Eliminar</button>
                  )}
                </div>

                <div className="max-w-[480px]">
                  <div className="rounded-2xl px-5 py-4" style={{ background: '#2a1212', border: '1px solid #3a1818' }}>
                    {post.media_url && post.media_type === 'image' && (
                      <img src={post.media_url} alt="" className="w-full max-h-[400px] object-cover mb-3 rounded-lg" />
                    )}
                    {post.media_url && post.media_type === 'video' && (
                      <video src={post.media_url} className="w-full max-h-[400px] mb-3 rounded-lg" controls />
                    )}
                    {hasText && (
                      <p className="font-wc text-[15px] text-[#e8e8e8] leading-relaxed whitespace-pre-line">
                        {post.body}
                      </p>
                    )}
                  </div>
                </div>

                {/* Reactions */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {REACTION_EMOJIS.map(emoji => {
                    const count = reactionCounts[post.id]?.[emoji] ?? 0
                    const isActive = myReactions.has(`${post.id}:${emoji}`)
                    return (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(post.id, emoji)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all duration-200 font-wc-label text-[11px] ${
                          isActive
                            ? 'border-[#f2f2f2]/20 bg-[#f2f2f2]/8 text-[#f2f2f2]'
                            : 'border-[#1a1a1a] hover:border-[#2a2a2a] text-[#4a4a4a] hover:text-[#8a8a8a]'
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
            <div className="shrink-0 px-4 md:px-8 pt-2">
              <div className="relative inline-block">
                {attachment.type === 'image'
                  ? <img src={attachment.preview} className="h-16 max-w-[120px] object-cover rounded-xl border border-[#2a2a2a]" alt="" />
                  : <div className="h-16 w-28 bg-[#111] border border-[#2a2a2a] rounded-xl flex items-center justify-center">
                      <span className="font-wc-label text-[9px] text-[#4a4a4a]">VIDEO</span>
                    </div>
                }
                <button onClick={removeAttachment} className="absolute -top-1 -right-1 w-4 h-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-full flex items-center justify-center text-[#f2f2f2]/40 hover:text-red-400/70 font-wc-label text-[7px]">✕</button>
              </div>
            </div>
          )}
          <div className="shrink-0 border-t border-[#1a1a1a] bg-[#0a0a0a] px-4 md:px-8 py-3 flex items-end gap-3">
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-[#1f1f1f] hover:border-[#3a3a3a] text-[#4a4a4a] hover:text-[#f2f2f2] transition-all duration-200 text-base leading-none"
            >+</button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Escribe algo para tus fans..."
              maxLength={1000}
              rows={1}
              className="flex-1 bg-transparent border-b border-[#1a1a1a] focus:border-[#a0a0a0] outline-none resize-none py-1.5 font-wc text-[15px] text-[#f2f2f2] placeholder:text-[#2a2a2a] transition-colors duration-200"
              style={{ lineHeight: '1.6' }}
            />
            <button
              onClick={publish}
              disabled={(!input.trim() && !attachment) || sending}
              className="shrink-0 bg-[#a0a0a0] hover:bg-[#a01818] disabled:opacity-20 disabled:cursor-not-allowed px-4 py-1.5 font-wc-label text-[9px] tracking-[0.15em] uppercase text-[#f2f2f2] transition-all duration-200"
            >↑</button>
          </div>
        </>
      )}
    </div>
  )
}
