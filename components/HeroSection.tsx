'use client'

import dynamic from 'next/dynamic'
import { motion, useScroll, useTransform } from 'framer-motion'

const Scene3D = dynamic(() => import('./Scene3D'), { ssr: false })

export default function HeroSection() {
  const { scrollY } = useScroll()
  // Hero canvas fades out as user scrolls down
  const heroCanvasOpacity = useTransform(scrollY, [0, 480], [1, 0])

  return (
    <section className="relative min-h-[100dvh] overflow-hidden flex flex-col">
      {/* ── Video background ── */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      >
        <source src="https://res.cloudinary.com/dy0mpdwnw/video/upload/v1774820858/0328_jldi1l.mov" type="video/quicktime" />
        <source src="https://res.cloudinary.com/dy0mpdwnw/video/upload/v1774820858/0328_jldi1l.mov" type="video/mp4" />
      </video>

      {/* ── Dark gradient overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 1,
          background:
            'linear-gradient(to bottom, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.35) 40%, rgba(10,10,10,0.65) 80%, rgba(10,10,10,0.75) 100%)',
        }}
      />

      {/* ── Three.js Canvas — fades out on scroll ── */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 2, opacity: heroCanvasOpacity }}
      >
        <Scene3D />
      </motion.div>

    </section>
  )
}
