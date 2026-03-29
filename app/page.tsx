'use client'

import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'
import HeroSection from '@/components/HeroSection'
import TourSection from '@/components/TourSection'
import MusicSection from '@/components/MusicSection'
import PageLoader from '@/components/PageLoader'

export default function Home() {
  return (
    <main className="bg-[#0a0a0a]">
      <PageLoader />
      <Navigation />
      <HeroSection />
      <TourSection />
      <MusicSection />
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 1, ease: 'easeInOut' }}
        className="border-t border-[#1f1f1f] py-10 px-8 md:px-16 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <p className="font-tour text-[10px] text-[#3a3a3a] tracking-[0.2em] uppercase">
          © 2026 ROA. Todos los derechos reservados.
        </p>

        <div className="flex items-center gap-7">
          {/* Spotify */}
          <a
            href="https://open.spotify.com/artist/4cYbf45YbZptNISnhay0xH"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Spotify"
            className="text-[#4a4a4a] hover:text-[#f2f2f2] transition-colors duration-300"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.273a.75.75 0 01-1.032.25c-2.827-1.727-6.39-2.118-10.586-1.16a.75.75 0 11-.334-1.462c4.588-1.048 8.523-.597 11.7 1.34a.75.75 0 01.252 1.032zm1.472-3.275a.937.937 0 01-1.29.308c-3.232-1.987-8.164-2.563-11.986-1.403a.938.938 0 01-.542-1.794c4.37-1.325 9.8-.683 13.51 1.6a.937.937 0 01.308 1.29zm.127-3.408C15.37 8.39 9.386 8.187 5.98 9.215a1.125 1.125 0 11-.652-2.154c3.984-1.205 10.61-.972 14.795 1.7a1.125 1.125 0 01-1.008 2.009z"/>
            </svg>
          </a>

          {/* YouTube */}
          <a
            href="https://www.youtube.com/channel/UCBM0c0QSo3S-oxHMbExB0Cg"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="text-[#4a4a4a] hover:text-[#f2f2f2] transition-colors duration-300"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/roapr__/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-[#4a4a4a] hover:text-[#f2f2f2] transition-colors duration-300"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>

          {/* TikTok */}
          <a
            href="https://www.tiktok.com/@el.lobo.de.caperucita"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="text-[#4a4a4a] hover:text-[#f2f2f2] transition-colors duration-300"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
            </svg>
          </a>
        </div>
      </motion.footer>
    </main>
  )
}
