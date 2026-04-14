'use client'

import { ReactNode } from 'react'

export type SigilVariant = 'own' | 'other' | 'broadcast'

// Clip-path polygons — angular diagonal cuts at opposing corners,
// giving a carved/sigil feel while keeping the padded bubble shape.
const CLIP: Record<SigilVariant, string> = {
  // own: cut top-left + bottom-right
  own: 'polygon(11px 0%, 100% 0%, 100% calc(100% - 11px), calc(100% - 11px) 100%, 0% 100%, 0% 11px)',
  // other: cut top-right + bottom-left (mirror)
  other: 'polygon(0% 0%, calc(100% - 11px) 0%, 100% 11px, 100% 100%, 11px 100%, 0% calc(100% - 11px))',
  // broadcast: all 4 corners cut — feels like a rune tablet
  broadcast: 'polygon(13px 0%, calc(100% - 7px) 0%, 100% 7px, 100% calc(100% - 13px), calc(100% - 13px) 100%, 7px 100%, 0% calc(100% - 7px), 0% 13px)',
}

const BG: Record<SigilVariant, string> = {
  own: '#c41e1e',
  other: '#161616',
  broadcast: '#160404',
}

// drop-shadow follows the clip-path outline — acts as a thin glowing edge
const GLOW: Record<SigilVariant, string> = {
  own: 'drop-shadow(0 0 0.5px rgba(255,60,60,0.55)) drop-shadow(0 2px 8px rgba(196,30,30,0.2))',
  other: 'drop-shadow(0 0 0.5px rgba(90,90,90,0.5))',
  broadcast: 'drop-shadow(0 0 1px rgba(196,30,30,0.5)) drop-shadow(0 2px 12px rgba(196,30,30,0.15))',
}

const PADDING: Record<SigilVariant, string> = {
  own: '10px 14px',
  other: '10px 14px',
  broadcast: '14px 20px',
}

interface Props {
  variant?: SigilVariant
  children: ReactNode
  className?: string
}

export default function SigilBubble({ variant = 'other', children, className = '' }: Props) {
  return (
    <div
      className={className}
      style={{
        clipPath: CLIP[variant],
        background: BG[variant],
        filter: GLOW[variant],
        padding: PADDING[variant],
      }}
    >
      {children}
    </div>
  )
}
