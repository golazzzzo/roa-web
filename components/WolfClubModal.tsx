'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'

export default function WolfClubModal({ onClose }: { onClose: () => void }) {
  const { signIn, signUp } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error)
        setIsSubmitting(false)
        return
      }
    } else {
      if (!name.trim()) {
        setError('Escribe tu nombre')
        setIsSubmitting(false)
        return
      }
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres')
        setIsSubmitting(false)
        return
      }
      const { error } = await signUp(email, password, name.trim(), location)
      if (error) {
        setError(error)
        setIsSubmitting(false)
        return
      }
    }

    setIsSubmitting(false)
    onClose()
    router.push('/wolf-club')
  }

  const inputClass =
    'w-full bg-transparent border-b border-[#2a2a2a] focus:border-[#f2f2f2]/40 outline-none py-3 font-tour text-xs tracking-[0.15em] text-[#f2f2f2] placeholder:text-[#3a3a3a] transition-colors duration-300'

  return (
    <motion.div
      className="fixed inset-0 z-[9000] flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[#0a0a0a]/85 backdrop-blur-sm" />

      <motion.div
        className="relative w-full max-w-sm border border-[#1f1f1f] bg-[#0d0d0d] p-8"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#3a3a3a] hover:text-[#f2f2f2] transition-colors duration-200"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <img src="/roa-symbol.png" alt="" className="w-10 h-10 object-contain opacity-80 mb-4" />
          <h2 className="font-display text-2xl tracking-[0.2em] text-[#f2f2f2]">WOLF CLUB</h2>
        </div>

        {/* Tabs */}
        <div className="flex mb-8 border-b border-[#1a1a1a]">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null) }}
              className={`flex-1 pb-3 font-tour text-[10px] tracking-[0.25em] uppercase transition-colors duration-300 border-b -mb-px ${
                mode === m
                  ? 'text-[#f2f2f2] border-[#f2f2f2]/40'
                  : 'text-[#3a3a3a] border-transparent hover:text-[#6b6b6b]'
              }`}
            >
              {m === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              {mode === 'register' && (
                <>
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    autoComplete="name"
                    required
                  />
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-transparent border-b border-[#2a2a2a] focus:border-[#f2f2f2]/40 outline-none py-3 font-tour text-xs tracking-[0.15em] text-[#f2f2f2] transition-colors duration-300 appearance-none cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="" disabled className="bg-[#0d0d0d]">País</option>
                    <option value="Puerto Rico" className="bg-[#0d0d0d]">Puerto Rico</option>
                    <option value="México" className="bg-[#0d0d0d]">México</option>
                    <option value="Colombia" className="bg-[#0d0d0d]">Colombia</option>
                    <option value="Venezuela" className="bg-[#0d0d0d]">Venezuela</option>
                    <option value="Perú" className="bg-[#0d0d0d]">Perú</option>
                    <option value="Argentina" className="bg-[#0d0d0d]">Argentina</option>
                    <option value="Chile" className="bg-[#0d0d0d]">Chile</option>
                    <option value="Ecuador" className="bg-[#0d0d0d]">Ecuador</option>
                    <option value="Bolivia" className="bg-[#0d0d0d]">Bolivia</option>
                    <option value="Paraguay" className="bg-[#0d0d0d]">Paraguay</option>
                    <option value="Uruguay" className="bg-[#0d0d0d]">Uruguay</option>
                    <option value="Costa Rica" className="bg-[#0d0d0d]">Costa Rica</option>
                    <option value="Guatemala" className="bg-[#0d0d0d]">Guatemala</option>
                    <option value="Honduras" className="bg-[#0d0d0d]">Honduras</option>
                    <option value="El Salvador" className="bg-[#0d0d0d]">El Salvador</option>
                    <option value="Nicaragua" className="bg-[#0d0d0d]">Nicaragua</option>
                    <option value="Panamá" className="bg-[#0d0d0d]">Panamá</option>
                    <option value="República Dominicana" className="bg-[#0d0d0d]">República Dominicana</option>
                    <option value="Cuba" className="bg-[#0d0d0d]">Cuba</option>
                    <option value="España" className="bg-[#0d0d0d]">España</option>
                    <option value="Estados Unidos" className="bg-[#0d0d0d]">Estados Unidos</option>
                    <option value="Otro" className="bg-[#0d0d0d]">Otro</option>
                  </select>
                </>
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="font-tour text-[10px] tracking-[0.1em] text-red-400/70 mt-4"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-8 w-full border border-[#2a2a2a] hover:border-[#f2f2f2]/30 py-3 font-tour text-[10px] tracking-[0.3em] uppercase text-[#f2f2f2]/60 hover:text-[#f2f2f2] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? '...'
              : mode === 'login' ? 'Entrar' : 'Unirse'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}
