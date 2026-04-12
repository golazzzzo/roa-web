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
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col gap-1">
        {loading ? (
          <p className="font-tour text-[10px] tracking-[0.2em] uppercase text-[#3a3a3a] m-auto">Cargando...</p>
        ) : messages.length === 0 ? (
          <p className="font-tour text-[10px] tracking-[0.2em] uppercase text-[#2e2e2e] m-auto">Sé el primero en escribir</p>
        ) : (
          <AnimatePresence initial={false}>
            {grouped.map((group) => {
              const isOwn = group.fan_id === user?.id
              const name = group.msgs[0].fans?.display_name ?? 'Fan'
              return (
                <motion.div
                  key={group.msgs[0].id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex gap-2 items-end mb-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isOwn && <Avatar name={name} />}

                  <div className={`flex flex-col gap-0.5 max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {!isOwn && (
                      <span className="font-tour text-[9px] tracking-[0.15em] uppercase text-[#4a4a4a] px-1 mb-1">
                        {name}
                      </span>
                    )}
                    {group.msgs.map((msg, i) => {
                      const hasText = msg.content?.trim() && msg.content.trim() !== ' '
                      const isFirst = i === 0
                      const isLast = i === group.msgs.length - 1
                      return (
                        <div key={msg.id} className="relative group">
                          <div className={`overflow-hidden ${
                            isOwn
                              ? `bg-[#1e1e1e] border border-[#2a2a2a] ${isFirst ? 'rounded-t-2xl rounded-bl-2xl' : ''} ${isLast ? 'rounded-b-2xl rounded-tl-2xl' : 'rounded-l-2xl'} rounded-tr-sm`
                              : `bg-[#161616] border border-[#1f1f1f] ${isFirst ? 'rounded-t-2xl rounded-br-2xl' : ''} ${isLast ? 'rounded-b-2xl rounded-tr-2xl' : 'rounded-r-2xl'} rounded-tl-sm`
                          }`}>
                            {msg.media_url && msg.media_type === 'image' && (
                              <img src={msg.media_url} alt="" className="max-w-[260px] max-h-[300px] w-full object-cover block" />
                            )}
                            {msg.media_url && msg.media_type === 'video' && (
                              <video src={msg.media_url} className="max-w-[260px] block" controls />
                            )}
                            {hasText && (
                              <p className="font-tour text-[11px] tracking-[0.04em] text-[#e8e8e8] leading-relaxed px-3.5 py-2">
                                {msg.content}
                              </p>
                            )}
                          </div>
                          {isOwn && (
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="absolute top-1/2 -translate-y-1/2 -left-5 opacity-0 group-hover:opacity-100 transition-opacity font-tour text-[8px] text-[#3a3a3a] hover:text-red-400/60"
                            >✕</button>
                          )}
                        </div>
                      )
                    })}
                    <span className="font-tour text-[8px] tracking-[0.1em] text-[#2e2e2e] px-1 mt-0.5">
                      {formatTime(group.msgs[group.msgs.length - 1].created_at)}
                    </span>
                  </div>

                  {isOwn && <div className="w-7 shrink-0" />}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {attachment && (
        <div className="shrink-0 px-4 md:px-8 pt-2">
          <div className="relative inline-block">
            {attachment.type === 'image'
              ? <img src={attachment.preview} className="h-16 max-w-[120px] object-cover rounded-xl border border-[#2a2a2a]" alt="" />
              : <div className="h-16 w-28 bg-[#111] border border-[#2a2a2a] rounded-xl flex items-center justify-center">
                  <span className="font-tour text-[9px] text-[#4a4a4a]">VIDEO</span>
                </div>
            }
            <button onClick={removeAttachment} className="absolute -top-1 -right-1 w-4 h-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-full flex items-center justify-center text-[#f2f2f2]/40 hover:text-red-400/70 font-tour text-[7px]">✕</button>
          </div>
        </div>
      )}

      <div className="shrink-0 border-t border-[#141414] px-4 md:px-8 py-3 flex items-end gap-2.5">
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
          placeholder="Mensaje..."
          maxLength={500}
          rows={1}
          className="flex-1 bg-[#111111] border border-[#1f1f1f] focus:border-[#2a2a2a] rounded-2xl outline-none resize-none px-4 py-2 font-tour text-[11px] tracking-[0.04em] text-[#f2f2f2] placeholder:text-[#3a3a3a] transition-colors duration-200"
          style={{ lineHeight: '1.6' }}
        />
        <button
          onClick={sendMessage}
          disabled={(!input.trim() && !attachment) || sending}
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[#f2f2f2]/5 border border-[#2a2a2a] hover:bg-[#f2f2f2]/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200 font-tour text-[#f2f2f2] text-sm"
        >↑</button>
      </div>
    </div>
  )
}
