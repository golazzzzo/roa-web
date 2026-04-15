'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import UploadModal from './UploadModal'

type GalleryPost = {
  id: string
  fan_id: string
  file_url: string
  caption: string | null
  created_at: string
  fans: { display_name: string } | null
}

function VideoCard({ post, onDelete, isOwner }: {
  post: GalleryPost
  onDelete: (id: string) => void
  isOwner: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)

  const handleMouseEnter = () => {
    videoRef.current?.play().catch(() => {})
  }

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setMuted(videoRef.current.muted)
    }
  }

  return (
    <div
      className="relative w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={post.file_url}
        className="w-full object-cover"
        muted
        loop
        playsInline
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-[#0a0a0a]/0 group-hover:bg-[#0a0a0a]/60 transition-all duration-300 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100">
        {post.caption && (
          <p className="font-display text-[9px] tracking-[0.1em] text-[#f2f2f2] leading-relaxed mb-1">
            {post.caption}
          </p>
        )}
        <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#6b6b6b]">
          {post.fans?.display_name ?? 'Fan'}
        </p>

        {/* Mute toggle */}
        <button
          onClick={toggleMute}
          className="absolute bottom-2 right-2 text-[#f2f2f2]/50 hover:text-[#f2f2f2] transition-colors duration-200"
        >
          {muted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          )}
        </button>

        {isOwner && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(post.id) }}
            className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center text-[#f2f2f2]/0 group-hover:text-[#f2f2f2]/60 hover:!text-red-400 transition-colors duration-200 font-display text-[10px]"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

export default function GallerySection() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<GalleryPost[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from('gallery_posts')
      .select('*, fans(display_name)')
      .order('created_at', { ascending: false })
    setPosts((data as GalleryPost[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handleDelete = async (id: string) => {
    await supabase.from('gallery_posts').delete().eq('id', id)
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  const isVideo = (url: string) => /\.(mp4|mov|webm|ogg)$/i.test(url)

  return (
    <div className="px-8 md:px-16 py-20">
      {/* Header */}
      <div className="flex items-end justify-between mb-12">
        <div>
          <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-[0.05em] text-[#f2f2f2]">
            GALERÍA
          </h2>
        </div>
        {user && (
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => setUploadOpen(true)}
            className="border border-[#2a2a2a] hover:border-[#f2f2f2]/30 px-6 py-3 font-display text-[10px] tracking-[0.25em] uppercase text-[#f2f2f2]/60 hover:text-[#f2f2f2] transition-all duration-300"
          >
            + Subir
          </motion.button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#3a3a3a]">Cargando...</p>
      ) : posts.length === 0 ? (
        <div className="border border-dashed border-[#1f1f1f] h-48 flex items-center justify-center">
          <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#2e2e2e]">Sé el primero en subir algo</p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="break-inside-avoid group relative overflow-hidden"
            >
              {isVideo(post.file_url) ? (
                <VideoCard
                  post={post}
                  onDelete={handleDelete}
                  isOwner={user?.id === post.fan_id}
                />
              ) : (
                <>
                  <img src={post.file_url} alt={post.caption ?? ''} className="w-full object-cover" />
                  <div className="absolute inset-0 bg-[#0a0a0a]/0 group-hover:bg-[#0a0a0a]/60 transition-all duration-300 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100">
                    {post.caption && (
                      <p className="font-display text-[9px] tracking-[0.1em] text-[#f2f2f2] leading-relaxed mb-1">
                        {post.caption}
                      </p>
                    )}
                    <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#6b6b6b]">
                      {post.fans?.display_name ?? 'Fan'}
                    </p>
                  </div>
                  {user?.id === post.fan_id && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center text-[#f2f2f2]/0 group-hover:text-[#f2f2f2]/60 hover:!text-red-400 transition-colors duration-200 font-display text-[10px]"
                    >
                      ✕
                    </button>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {uploadOpen && (
          <UploadModal onClose={() => setUploadOpen(false)} onUploaded={fetchPosts} />
        )}
      </AnimatePresence>
    </div>
  )
}
