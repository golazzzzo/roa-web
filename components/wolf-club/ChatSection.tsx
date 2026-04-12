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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel('wolf-club-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
        const row = payload.new as Omit<ChatMessage, 'fans'>
        let displayName = fanNames.current.get(row.fan_id)
        if (!displayName) {
          const { data } = await supabase.from('fans').select('display_name').eq('id', row.fan_id).single()
          displayName = (data?.display_name ?? 'Fan') as string
          fanNames.current.set(row.fan_id, displayName)
        }
        setMessages(prev => [...prev, { ...row, fans: { display_name: displayName! } }])
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

    await supabase.from('chat_messages').insert({
      fan_id: user.id,
      content: content || ' ',
      media_url: mediaUrl,
      media_type: mediaType,
    })
    setSending(false)
  }, [input, attachment, user, sending])

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

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 md:px-16 py-6 flex flex-col gap-4">
        {loading ? (
          <p className="font-tour text-[10px] tracking-[0.2em] uppercase text-[#3a3a3a]">Cargando...</p>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-tour text-[10px] tracking-[0.2em] uppercase text-[#2e2e2e]">Sé el primero en escribir</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isOwn = msg.fan_id === user?.id
              const hasText = msg.content && msg.content.trim() && msg.content.trim() !== ' '
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex flex-col max-w-[70%] ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  {!isOwn && (
                    <span className="font-tour text-[9px] tracking-[0.2em] uppercase text-[#4a4a4a] mb-1 px-1">
                      {msg.fans?.display_name ?? 'Fan'}
                    </span>
                  )}
                  <div className={`relative group border ${isOwn ? 'bg-[#161616] border-[#2a2a2a]' : 'bg-[#111111] border-[#1f1f1f]'}`}>
                    {msg.media_url && msg.media_type === 'image' && (
                      <img src={msg.media_url} alt="" className="max-w-[280px] max-h-[320px] object-cover block" />
                    )}
                    {msg.media_url && msg.media_type === 'video' && (
                      <video src={msg.media_url} className="max-w-[280px] max-h-[320px] block" controls />
                    )}
                    {hasText && (
                      <p className="font-tour text-[11px] tracking-[0.05em] text-[#f2f2f2] leading-relaxed px-4 py-2.5">
                        {msg.content}
                      </p>
                    )}
                    {isOwn && (
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[#f2f2f2]/30 hover:text-red-400/70 font-tour text-[8px] bg-[#0a0a0a] border border-[#2a2a2a]"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <span className="font-tour text-[8px] tracking-[0.1em] text-[#3a3a3a] mt-1 px-1">
                    {formatTime(msg.created_at)}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Attachment preview */}
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

      {/* Input */}
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
          placeholder="Escribe algo..."
          maxLength={500}
          rows={1}
          className="flex-1 bg-transparent border border-[#1f1f1f] focus:border-[#3a3a3a] outline-none resize-none px-4 py-2.5 font-tour text-[11px] tracking-[0.05em] text-[#f2f2f2] placeholder:text-[#3a3a3a] transition-colors duration-200"
          style={{ lineHeight: '1.6' }}
        />
        <button
          onClick={sendMessage}
          disabled={(!input.trim() && !attachment) || sending}
          className="shrink-0 border border-[#2a2a2a] hover:border-[#f2f2f2]/20 disabled:opacity-20 disabled:cursor-not-allowed px-5 py-2.5 font-tour text-[10px] tracking-[0.2em] uppercase text-[#f2f2f2] transition-all duration-200"
        >
          Enviar
        </button>
      </div>
    </div>
  )
}
