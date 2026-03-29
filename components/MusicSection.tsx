'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'

const VIDEOS = [
  { id: 'NujWQcMiANI' },
  { id: 'RpksoUzYchQ' },
  { id: 'vLcAjCYz6go' },
  { id: 'vch3Pr4IMyo' },
  { id: '1wCW8JbWr0U' },
]

export default function MusicSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-80px' })
  const spotifyRef = useRef<HTMLDivElement>(null)
  const spotifyInView = useInView(spotifyRef, { once: true, margin: '-80px' })

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const videoY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  /* ── track which slide is centred ── */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const maxScroll = scrollWidth - clientWidth
    if (maxScroll <= 0) return
    const progress = scrollLeft / maxScroll
    const idx = Math.round(progress * (VIDEOS.length - 1))
    const clamped = Math.max(0, Math.min(VIDEOS.length - 1, idx))
    setActiveIndex(clamped)
    setCanPrev(scrollLeft > 8)
    setCanNext(scrollLeft < maxScroll - 8)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  /* ── dot / arrow navigation ── */
  const scrollToIndex = (index: number) => {
    const el = scrollRef.current
    if (!el) return
    const slides = el.querySelectorAll<HTMLElement>('.video-slide')
    const target = slides[index]
    if (!target) return
    // centre the slide inside the scroll container
    const slideLeft = target.offsetLeft
    const slideWidth = target.offsetWidth
    const containerWidth = el.clientWidth
    el.scrollTo({ left: slideLeft - (containerWidth - slideWidth) / 2, behavior: 'smooth' })
  }

  const handlePrev = () => scrollToIndex(Math.max(0, activeIndex - 1))
  const handleNext = () => scrollToIndex(Math.min(VIDEOS.length - 1, activeIndex + 1))

  return (
    <section id="music" ref={sectionRef} className="relative pt-28 pb-24">

      {/* Video container — isolated overflow-hidden so it doesn't clip the carousel */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <motion.video
          autoPlay
          loop
          muted
          playsInline
          style={{ y: videoY }}
          className="absolute inset-0 w-full h-full object-cover scale-110"
        >
          <source src="https://res.cloudinary.com/dy0mpdwnw/video/upload/v1774820856/video_3_zxzidr.mov" type="video/quicktime" />
          <source src="https://res.cloudinary.com/dy0mpdwnw/video/upload/v1774820856/video_3_zxzidr.mov" type="video/mp4" />
        </motion.video>

        {/* Dark overlay */}
        <div className="absolute inset-0" style={{ background: 'rgba(8,8,8,0.78)' }} />

      </div>

      {/* ── Content ── */}
      <div className="relative" style={{ zIndex: 3 }}>

      {/* ── Header ── */}
      <div ref={headerRef} className="px-8 md:px-16 mb-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="overflow-hidden">
            <motion.h2
              initial={{ y: '110%' }}
              animate={headerInView ? { y: '0%' } : {}}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-[clamp(3rem,8vw,6rem)] leading-none tracking-[0.05em] text-[#f2f2f2]"
            >
              MÚSICA
            </motion.h2>
          </div>
        </motion.div>
      </div>

      {/* ── Horizontal Video Carousel ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={headerInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.35 }}
        className="relative"
      >
        {/* scroll track */}
        <div
          ref={scrollRef}
          className="no-scrollbar flex overflow-x-scroll gap-3 md:gap-5 px-8 md:px-16 pb-4 select-none"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >

          {VIDEOS.map((video, i) => (
            <motion.div
              key={video.id}
              className="video-slide flex-shrink-0 relative overflow-hidden"
              style={{
                width: 'min(82vw, 900px)',
                aspectRatio: '16 / 9',
                scrollSnapAlign: 'center',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={headerInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.4 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1&color=white&iv_load_policy=3`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                className="w-full h-full"
                style={{ border: 'none', display: 'block' }}
              />
            </motion.div>
          ))}

          {/* trailing spacer so last slide can centre */}
          <div className="flex-shrink-0 w-[calc(50vw-min(41vw,450px)-2rem)]" aria-hidden />
        </div>

        {/* ── Arrow controls ── */}
        <div className="hidden md:flex absolute inset-y-0 left-0 items-center pointer-events-none pl-4">
          <button
            onClick={handlePrev}
            disabled={!canPrev}
            className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full border border-[#2a2a2a] bg-[#0a0a0a]/80 backdrop-blur text-[#f2f2f2] hover:border-[#f2f2f2] transition-all duration-200 disabled:opacity-20 disabled:cursor-default"
            aria-label="Anterior"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="hidden md:flex absolute inset-y-0 right-0 items-center pointer-events-none pr-4">
          <button
            onClick={handleNext}
            disabled={!canNext}
            className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full border border-[#2a2a2a] bg-[#0a0a0a]/80 backdrop-blur text-[#f2f2f2] hover:border-[#f2f2f2] transition-all duration-200 disabled:opacity-20 disabled:cursor-default"
            aria-label="Siguiente"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* ── Dot indicators ── */}
        <div className="flex justify-center gap-2 mt-6 px-8">
          {VIDEOS.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              aria-label={`Video ${i + 1}`}
              className="h-[3px] rounded-full transition-all duration-400 ease-out"
              style={{
                width: i === activeIndex ? '28px' : '8px',
                backgroundColor: i === activeIndex ? '#f2f2f2' : '#2e2e2e',
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* ── Spotify embed ── */}
      <motion.div
        ref={spotifyRef}
        initial={{ opacity: 0, y: 28 }}
        animate={spotifyInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="mt-20 px-8 md:px-16"
      >
        <iframe
          src="https://open.spotify.com/embed/artist/4cYbf45YbZptNISnhay0xH?utm_source=generator&theme=0"
          width="100%"
          height="360"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          style={{ border: '1px solid #1a1a1a', display: 'block' }}
        />
      </motion.div>

      </div>{/* end content */}
    </section>
  )
}
