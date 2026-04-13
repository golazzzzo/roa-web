'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import type { ChatMessage } from '@/lib/supabase'

type Attachment = { file: File; preview: string; type: 'image' | 'video' }

async function uploadMedia(file: File): Promise<{ url: string; type: 'image' | 'video' }> {
  const ext = file.name.split('.').pop()
  const path = `chat/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data } = await supabase.storage.from('wolf-club-media').upload(path, file)
  const { data: { publicUrl } } = supabase.storage.from('wolf-club-media').getPublicUrl(data!.path)
  return { url: publicUrl, type: file.type.startsWith('video/') ? 'video' : 'image' }
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-7 h-7 rounded-full bg-[#1f1f1f] border border-[#2a2a2a] flex items-center justify-center shrink-0">
      <span className="font-tour text-[9px] text-[#6a6a6a] uppercase">{name[0]}</span>
    </div>
  )
}

export default function ChatSection() {
  const { user, fanProfile } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fanNames = useRef<Map<string, string>>(new Map())
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user && fanProfile) fanNames.current.set(user.id, fanProfile.display_name)
  }, [user, fanProfile])

  useEffect(() => {
    supabase
      .from('chat_messages')
      .select('*, fans(display_name)')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        const msgs = (data as ChatMessage[]) ?? []
        msgs.forEach(m => {
          if (m.fans?.display_name) fanNames.current.set(m.fan_id, m.fans.display_name)
        })
        setMessages(msgs)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [loading])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel('wolf-club-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
        const row = payload.new as Omit<ChatMessage, 'fans'>
        // skip if already in state (optimistic)
        setMessages(prev => {
          if (prev.some(m => m.id === row.id)) return prev
          let displayName = fanNames.current.get(row.fan_id) ?? 'Fan'
          return [...prev, { ...row, fans: { display_name: displayName } }]
        })
        // fetch name if not cached
        if (!fanNames.current.has(row.fan_id)) {
          const { data } = await supabase.from('fans').select('display_name').eq('id', row.fan_id).single()
          const name = (data?.display_name ?? 'Fan') as string
          fanNames.current.set(row.fan_id, name)
          setMessages(prev => prev.map(m => m.id === row.id ? { ...m, fans: { display_name: name } } : m))
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== (payload.old as ChatMessage).id))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const sendMessage = useCallback(async () => {
    if ((!input.trim() && !attachment) || !user || sending) return
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

    // optimistic: add instantly with a temp id
    const tempId = `temp-${Date.now()}`
    const tempMsg: ChatMessage = {
      id: tempId,
      fan_id: user.id,
      content: content || ' ',
      media_url: mediaUrl,
      media_type: mediaType,
      created_at: new Date().toISOString(),
      fans: { display_name: fanProfile?.display_name ?? 'Tú' },
    }
    setMessages(prev => [...prev, tempMsg])
    setSending(false)

    // sync to db and replace temp with real
    const { data } = await supabase
      .from('chat_messages')
      .insert({ fan_id: user.id, content: content || ' ', media_url: mediaUrl, media_type: mediaType })
      .select('*, fans(display_name)')
      .single()

    if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? data as ChatMessage : m))
    }
  }, [input, attachment, user, fanProfile, sending])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachment({ file, preview: URL.createObjectURL(file), type: file.type.startsWith('video/') ? 'video' : 'image' })
    e.target.value = ''
  }

  const removeAttachment = () => {
    if (attachment) URL.revokeObjectURL(attachment.preview)
    setAttachment(null)
  }

  const deleteMessage = async (id: string) => {
    await supabase.from('chat_messages').delete().eq('id', id)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })

  // group consecutive messages from same sender
  const grouped = messages.reduce<Array<{ fan_id: string; msgs: ChatMessage[] }>>((acc, msg) => {
    const last = acc[acc.length - 1]
    if (last && last.fan_id === msg.fan_id) { last.msgs.push(msg); return acc }
    return [...acc, { fan_id: msg.fan_id, msgs: [msg] }]
  }, [])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {loading ? (
          <p className="font-ui text-[12px] text-[#3a3a3a] m-auto">Cargando...</p>
        ) : messages.length === 0 ? (
          <p className="font-ui text-[12px] text-[#3a3a3a] m-auto">Sé el primero en escribir</p>
        ) : (
          <AnimatePresence initial={false}>
            {grouped.map((group) => {
              const isOwn = group.fan_id === user?.id
              const name = group.msgs[0].fans?.display_name ?? 'Fan'
              return (
                <motion.div
                  key={group.msgs[0].id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex flex-col gap-0.5 max-w-[68%] ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <div className={`flex items-center gap-1.5 px-1 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className="font-ui text-[11px] font-semibold text-[#6a6a6a]">
                      {isOwn ? 'Tú' : name}
                    </span>
                    <span className="font-ui text-[10px] text-[#2e2e2e]">
                      {formatTime(group.msgs[group.msgs.length - 1].created_at)}
                    </span>
                  </div>

                  {group.msgs.map((msg, i) => {
                    const hasText = msg.content?.trim() && msg.content.trim() !== ' '
                    const isLast = i === group.msgs.length - 1
                    return (
                      <div key={msg.id} className="relative group">
                        {/* ── OPTION A — Indigo (cool, modern) ── */}
                        {/* own: bg-[#1e1b35] border-[#2d2850] | others: bg-[#161616] border-[#222] */}

                        {/* ── OPTION B — Warm amber (matches site palette) ── */}
                        {/* own: bg-[#1e1508] border-[#2e2010] | others: bg-[#161616] border-[#222] */}

                        {/* ── OPTION C — Deep green (dark forest) ── */}
                        {/* own: bg-[#0e1e14] border-[#162b1e] | others: bg-[#161616] border-[#222] */}

                        <div className={`overflow-hidden ${
                          isOwn
                            ? `bg-[#2d2860] border border-[#3d3778] rounded-2xl ${isLast ? 'rounded-br-sm' : ''}`
                            : `bg-[#1e1e28] border border-[#2e2e3a] rounded-2xl ${isLast ? 'rounded-bl-sm' : ''}`
                        }`}>
                          {msg.media_url && msg.media_type === 'image' && (
                            <img src={msg.media_url} alt="" className="max-w-[260px] max-h-[300px] w-full object-cover block" />
                          )}
                          {msg.media_url && msg.media_type === 'video' && (
                            <video src={msg.media_url} className="max-w-[260px] block" controls />
                          )}
                          {hasText && (
                            <p className={`font-ui text-[13px] leading-snug px-3.5 py-2.5 ${isOwn ? 'text-[#d8d4ff]' : 'text-[#d8d8e0]'}`}>
                              {msg.content}
                            </p>
                          )}
                        </div>
                        {isOwn && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="absolute top-1/2 -translate-y-1/2 -left-5 opacity-0 group-hover:opacity-100 transition-opacity font-ui text-[10px] text-[#3a3a3a] hover:text-red-400/60"
                          >✕</button>
                        )}
                      </div>
                    )
                  })}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {attachment && (
        <div className="shrink-0 px-5 pt-2">
          <div className="relative inline-block">
            {attachment.type === 'image'
              ? <img src={attachment.preview} className="h-16 max-w-[120px] object-cover border border-[#2a2a2a]" alt="" />
              : <div className="h-16 w-28 bg-[#141414] border border-[#2a2a2a] flex items-center justify-center">
                  <span className="font-ui text-[11px] text-[#4a4a4a]">VIDEO</span>
                </div>
            }
            <button onClick={removeAttachment} className="absolute -top-1 -right-1 w-4 h-4 bg-[#0a0a0a] border border-[#2a2a2a] flex items-center justify-center font-ui text-[9px] text-[#4a4a4a] hover:text-red-400/60">✕</button>
          </div>
        </div>
      )}

      <div className="shrink-0 border-t border-[#1e1e28] px-5 py-3 flex items-end gap-2.5">
        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 w-8 h-8 flex items-center justify-center border border-[#202020] hover:border-[#3a3a3a] text-[#3a3a3a] hover:text-[#aaa] transition-all duration-200 font-ui text-lg leading-none"
        >+</button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Mensaje..."
          maxLength={500}
          rows={1}
          className="flex-1 bg-[#1a1a24] border border-[#2a2a38] focus:border-[#3a3a50] outline-none resize-none px-3.5 py-2 font-ui text-[13px] text-[#e0e0e0] placeholder:text-[#444] transition-colors duration-200"
          style={{ lineHeight: '1.5' }}
        />
        <button
          onClick={sendMessage}
          disabled={(!input.trim() && !attachment) || sending}
          className="shrink-0 bg-[#2d2860] hover:bg-[#3a3478] border border-[#3d3778] disabled:opacity-20 disabled:cursor-not-allowed px-4 py-2 font-ui text-[12px] font-medium text-[#d8d4ff] transition-all duration-200"
        >
          {sending ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}
