'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { NewsPost } from '@/lib/supabase'

export default function NoticiasSection() {
  const [posts, setPosts] = useState<NewsPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('news_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPosts((data as NewsPost[]) ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="px-8 md:px-16 py-20 max-w-3xl">
      <div className="mb-12">
        <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-[0.05em] text-[#f2f2f2]">
          NOTICIAS
        </h2>
      </div>

      {loading ? (
        <p className="font-tour text-[10px] tracking-[0.2em] uppercase text-[#3a3a3a]">Cargando...</p>
      ) : posts.length === 0 ? (
        <div className="border border-dashed border-[#1f1f1f] h-40 flex items-center justify-center">
          <p className="font-tour text-[10px] tracking-[0.2em] uppercase text-[#2e2e2e]">
            Pronto — anuncios del club
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {posts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="border-b border-[#1f1f1f] py-10 first:border-t"
            >
              <p className="font-tour text-[9px] tracking-[0.25em] uppercase text-[#4a4a4a] mb-3">
                {new Date(post.created_at).toLocaleDateString('es', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
              <h3 className="font-display text-[clamp(1.5rem,3vw,2.5rem)] leading-tight tracking-[0.05em] text-[#f2f2f2] mb-4">
                {post.title}
              </h3>
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full max-h-80 object-cover mb-6 opacity-80"
                />
              )}
              <p className="font-tour text-[11px] tracking-[0.08em] text-[#8a8a8a] leading-relaxed whitespace-pre-line">
                {post.body}
              </p>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  )
}
