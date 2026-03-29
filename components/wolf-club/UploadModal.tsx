'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

export default function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleFile = (f: File) => {
    if (f.size > 100 * 1024 * 1024) { setError('Máximo 100MB'); return }
    setFile(f)
    setError(null)
    setPreview(URL.createObjectURL(f))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleUpload = async () => {
    if (!file || !user) return
    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: storageError } = await supabase.storage
      .from('gallery')
      .upload(path, file, { upsert: false })

    if (storageError) {
      setError(storageError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(path)

    const { error: dbError } = await supabase.from('gallery_posts').insert({
      fan_id: user.id,
      file_url: publicUrl,
      caption: caption.trim() || null,
    })

    if (dbError) {
      setError(dbError.message)
      setUploading(false)
      return
    }

    setUploading(false)
    onUploaded()
    onClose()
  }

  const isVideo = file?.type.startsWith('video/')

  return (
    <motion.div
      className="fixed inset-0 z-[9000] flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-sm" />

      <motion.div
        className="relative w-full max-w-md border border-[#1f1f1f] bg-[#0d0d0d] p-8"
        initial={{ opacity: 0, scale: 0.93, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-5 right-5 text-[#3a3a3a] hover:text-[#f2f2f2] transition-colors duration-200">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>

        <p className="font-tour text-[10px] tracking-[0.3em] uppercase text-[#4a4a4a] mb-1">Wolf Club</p>
        <h3 className="font-display text-2xl tracking-[0.1em] text-[#f2f2f2] mb-8">SUBIR</h3>

        {/* Drop zone */}
        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border border-dashed border-[#2a2a2a] hover:border-[#4a4a4a] transition-colors duration-300 h-48 flex flex-col items-center justify-center cursor-pointer gap-3"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" strokeWidth="1.2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="font-tour text-[10px] tracking-[0.2em] uppercase text-[#3a3a3a]">Arrastra o haz clic</p>
            <p className="font-tour text-[9px] tracking-[0.1em] text-[#2a2a2a]">Imagen o video · Máx 100MB</p>
          </div>
        ) : (
          <div className="relative mb-4">
            {isVideo ? (
              <video src={preview} className="w-full max-h-48 object-cover" controls />
            ) : (
              <img src={preview} alt="" className="w-full max-h-48 object-cover" />
            )}
            <button
              onClick={() => { setFile(null); setPreview(null) }}
              className="absolute top-2 right-2 bg-[#0a0a0a]/80 text-[#f2f2f2] p-1 hover:bg-[#1a1a1a] transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />

        {/* Caption */}
        <input
          type="text"
          placeholder="Caption (opcional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={120}
          className="w-full bg-transparent border-b border-[#2a2a2a] focus:border-[#f2f2f2]/30 outline-none py-3 mt-6 font-tour text-xs tracking-[0.15em] text-[#f2f2f2] placeholder:text-[#3a3a3a] transition-colors duration-300"
        />

        {error && <p className="font-tour text-[10px] text-red-400/70 mt-3">{error}</p>}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-8 w-full border border-[#2a2a2a] hover:border-[#f2f2f2]/30 py-3 font-tour text-[10px] tracking-[0.3em] uppercase text-[#f2f2f2]/60 hover:text-[#f2f2f2] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {uploading ? 'Subiendo...' : 'Publicar'}
        </button>
      </motion.div>
    </motion.div>
  )
}
