'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import type { ChatMessage } from '@/lib/supabase'

export default function ChatSection() {
  const { user, fanProfile } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fanNames = useRef<Map<string, string>>(new Map())
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Seed own name into cache immediately
  useEffect(() => {
    if (user && fanProfile) {
      fanNames.current.set(user.id, fanProfile.display_name)
    }
  }, [user, fanProfile])

  // Initial load
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

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime subscription
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
    if (!input.trim() || !user || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    await supabase.from('chat_messages').insert({ fan_id: user.id, content })
    setSending(false)
  }, [input, user, sending])

  const deleteMessage = async (id: string) => {
    await supabase.from('chat_messages').delete().eq('id', id)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="px-8 md:px-16 py-6 border-b border-[#1f1f1f] flex items-center justify-between shrink-0">
        <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] leading-none tracking-[0.05em] text-[#f2f2f2]">
          CHAT
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4a9a6a] animate-pulse" />
          <span className="font-tour text-[9px] tracking-[0.2em] uppercase text-[#4a4a4a]">En vivo</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 md:px-16 py-6 flex flex-col gap-4">
        {loading ? (
          <p className="font-tour text-[10px] tracking-[0.2em] uppercase text-[#3a3a3a]">Cargando...</p>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-tour text-[10px] tracking-[0.2em] uppercase text-[#2e2e2e]">
              Sé el primero en escribir
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isOwn = msg.fan_id === user?.id
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
                  <div className={`relative group px-4 py-2.5 border ${isOwn ? 'bg-[#161616] border-[#2a2a2a]' : 'bg-[#111111] border-[#1f1f1f]'}`}>
                    <p className="font-tour text-[11px] tracking-[0.05em] text-[#f2f2f2] leading-relaxed">
                      {msg.content}
                    </p>
                    {isOwn && (
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[#f2f2f2]/30 hover:text-red-400/70 font-tour text-[8px]"
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

      {/* Input */}
      <div className="shrink-0 border-t border-[#1f1f1f] px-8 md:px-16 py-4 flex items-end gap-4">
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
          disabled={!input.trim() || sending}
          className="shrink-0 border border-[#2a2a2a] hover:border-[#f2f2f2]/20 disabled:opacity-20 disabled:cursor-not-allowed px-5 py-2.5 font-tour text-[10px] tracking-[0.2em] uppercase text-[#f2f2f2] transition-all duration-200"
        >
          Enviar
        </button>
      </div>
    </div>
  )
}
