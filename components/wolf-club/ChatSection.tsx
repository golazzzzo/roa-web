'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import type { ChatMessage } from '@/lib/supabase'
import SigilBubble from './SigilBubble'

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
      <span className="font-wc-label text-[9px] text-[#6a6a6a] uppercase">{name[0]}</span>
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
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        {loading ? (
          <p className="font-wc-label text-[10px] tracking-[0.15em] uppercase text-[#2a2a2a] m-auto">Cargando...</p>
        ) : messages.length === 0 ? (
          <p className="font-wc-label text-[10px] tracking-[0.15em] uppercase text-[#2a2a2a] m-auto">Sé el primero en escribir</p>
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
                  transition={{ duration: 0.15 }}
                  className={`flex flex-col gap-1 max-w-[65%] ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <div className={`flex items-center gap-2 px-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className={`font-wc-label text-[9px] tracking-[0.15em] uppercase ${isOwn ? 'text-[#a0a0a0]' : 'text-[#444]'}`}>
                      {isOwn ? 'Tú' : name}
                    </span>
                    <span className="font-wc-label text-[9px] text-[#252525]">
                      {formatTime(group.msgs[group.msgs.length - 1].created_at)}
                    </span>
                  </div>

                  {group.msgs.map((msg, i) => {
                    const hasText = msg.content?.trim() && msg.content.trim() !== ' '
                    const isLast = i === group.msgs.length - 1
                    return (
                      <div key={msg.id} className="relative group">
                        <SigilBubble variant={isOwn ? 'own' : 'other'}>
                          {msg.media_url && msg.media_type === 'image' && (
                            <img src={msg.media_url} alt="" className="max-w-[260px] max-h-[300px] w-full object-cover block mb-1" />
                          )}
                          {msg.media_url && msg.media_type === 'video' && (
                            <video src={msg.media_url} className="max-w-[260px] block mb-1" controls />
                          )}
                          {hasText && (
                            <p className={`font-wc text-[15px] leading-relaxed ${isOwn ? 'text-white' : 'text-[#d0d0d0]'}`}>
                              {msg.content}
                            </p>
                          )}
                        </SigilBubble>
                        {isOwn && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="absolute top-0 -right-5 opacity-0 group-hover:opacity-100 transition-opacity font-wc-label text-[9px] text-[#333] hover:text-[#a0a0a0]"
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
        <div className="shrink-0 px-6 pt-2">
          <div className="relative inline-block">
            {attachment.type === 'image'
              ? <img src={attachment.preview} className="h-16 max-w-[120px] object-cover border border-[#1a1a1a]" alt="" />
              : <div className="h-16 w-28 bg-[#111] border border-[#1a1a1a] flex items-center justify-center">
                  <span className="font-wc-label text-[9px] tracking-[0.1em] uppercase text-[#333]">Video</span>
                </div>
            }
            <button onClick={removeAttachment} className="absolute -top-1 -right-1 w-4 h-4 bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center font-wc-label text-[9px] text-[#333] hover:text-[#a0a0a0]">✕</button>
          </div>
        </div>
      )}

      <div className="shrink-0 border-t border-[#1a1a1a] bg-[#0a0a0a] px-6 py-3 flex items-end gap-3">
        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 w-7 h-7 flex items-center justify-center border border-[#1a1a1a] hover:border-[#a0a0a0] text-[#333] hover:text-[#a0a0a0] transition-all duration-200 font-wc-label text-base leading-none"
        >+</button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Mensaje..."
          maxLength={500}
          rows={1}
          className="flex-1 bg-transparent border-b border-[#1a1a1a] focus:border-[#a0a0a0] outline-none resize-none py-1.5 font-wc text-[15px] text-[#f2f2f2] placeholder:text-[#2a2a2a] transition-colors duration-200"
          style={{ lineHeight: '1.5' }}
        />
        <button
          onClick={sendMessage}
          disabled={(!input.trim() && !attachment) || sending}
          className="shrink-0 bg-[#a0a0a0] hover:bg-[#a01818] disabled:opacity-20 disabled:cursor-not-allowed px-4 py-1.5 font-wc-label text-[9px] tracking-[0.15em] uppercase text-[#f2f2f2] transition-all duration-200"
        >
          {sending ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}
