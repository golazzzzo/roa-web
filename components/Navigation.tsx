'use client'

import { useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/auth-context'
import WolfClubModal from './WolfClubModal'

const NavScene3D = dynamic(() => import('./NavScene3D'), { ssr: false })
const Wolf2Scene3D = dynamic(() => import('./Wolf2Scene3D'), { ssr: false })

const NAV_LINKS = [
  { label: 'Tour', href: '#tour' },
  { label: 'Música', href: '#music' },
]

const WOLF_LINKS = [
  { label: 'Comunidad', href: '/wolf-club/chat'    },
  { label: 'Galería',   href: '/wolf-club/galeria' },
]

export default function Navigation() {
  const { scrollY } = useScroll()
  const navModelOpacity = useTransform(scrollY, [80, 480], [0, 1])
  const [wolfHovered, setWolfHovered] = useState(false)
  const [centerHovered, setCenterHovered] = useState(false)
  const centerLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onCenterEnter = () => {
    if (centerLeaveTimer.current) clearTimeout(centerLeaveTimer.current)
    setCenterHovered(true)
  }
  const onCenterLeave = () => {
    centerLeaveTimer.current = setTimeout(() => setCenterHovered(false), 150)
  }
  const [modalOpen, setModalOpen] = useState(false)
  const { user, fanProfile, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isWolfClub = pathname.startsWith('/wolf-club')
  const isWolfClubLanding = pathname === '/wolf-club'

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-16 py-4 bg-transparent"
      >
        {/* Left: wolf icon */}
        <div
          className="flex-1 flex items-center gap-3 cursor-pointer select-none relative"
          onClick={() => isWolfClub ? signOut() : setModalOpen(true)}
          onMouseEnter={() => setWolfHovered(true)}
          onMouseLeave={() => setWolfHovered(false)}
        >
          <div className="relative">
            <motion.img
              src="/roa-symbol.png"
              alt=""
              className="w-16 h-16 object-contain opacity-90 shrink-0"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            {user && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#f2f2f2]/70"
              />
            )}
          </div>

          <motion.span
            animate={{ opacity: wolfHovered ? 1 : 0, x: wolfHovered ? 0 : -10 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="font-tour text-[10px] tracking-[0.22em] uppercase text-[#f2f2f2]/80 whitespace-nowrap pointer-events-none"
          >
            {isWolfClub ? 'Cerrar Sesión' : user && fanProfile ? fanProfile.display_name : 'Wolf Club'}
          </motion.span>
        </div>

        {/* Center: 3D model */}
        {isWolfClubLanding ? (
          <div className="w-24 h-24 shrink-0 opacity-0 pointer-events-none" />
        ) : isWolfClub ? (
          <div className="relative shrink-0 w-24 h-24">
            <Wolf2Scene3D />
            {/* Overlay to catch clicks (canvas consumes pointer events) */}
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={() => router.push('/wolf-club')}
            />
          </div>
        ) : (
          <motion.div style={{ opacity: navModelOpacity }} className="w-24 h-24 shrink-0">
            <NavScene3D />
          </motion.div>
        )}

        {/* Right: nav links */}
        <div className="flex-1 flex items-center justify-end gap-6 md:gap-8">
          {isWolfClub && !isWolfClubLanding
            ? WOLF_LINKS.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -2 }}
                  className={`font-tour text-[10px] tracking-[0.2em] uppercase transition-colors duration-200 ${
                    pathname === link.href ? 'text-[#f2f2f2]' : 'text-[#4a4a4a] hover:text-[#f2f2f2]'
                  }`}
                >
                  {link.label}
                </motion.a>
              ))
            : !isWolfClub && NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -2 }}
                  className="font-body text-xs tracking-[0.25em] uppercase text-[#f2f2f2] transition-colors duration-200"
                >
                  {link.label}
                </motion.a>
              ))
          }
        </div>
      </motion.nav>

      {/* Wolf club nav dropdown */}

      <AnimatePresence>
        {modalOpen && <WolfClubModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
