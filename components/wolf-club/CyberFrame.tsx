'use client'

import { ReactNode, useLayoutEffect, useRef, useState } from 'react'

export type CyberFrameVariant = 'own' | 'other' | 'broadcast'

const COLOR: Record<CyberFrameVariant, string> = {
  own: 'rgba(210,210,210,0.95)',
  other: 'rgba(130,130,130,0.4)',
  broadcast: 'rgba(190,190,190,0.75)',
}

// arm length, diagonal cut length, dot radius, overshoot outside div
const ARM = 16
const CUT = 4
const DOT = 1.5
const OVER = 2 // px the frame extends outside the div bounds

interface CornerProps {
  x: number
  y: number
  // which direction each arm goes: hDir +1=right, -1=left; vDir +1=down, -1=up
  hDir: 1 | -1
  vDir: 1 | -1
  color: string
}

function Corner({ x, y, hDir, vDir, color }: CornerProps) {
  // Horizontal arm: vertex → x+hDir*ARM, then diagonal cut ↗/↘ direction
  // The diagonal cut goes +hDir*CUT horizontally and -vDir*CUT vertically (outward away from content)
  const hEndX = x + hDir * ARM
  const hCutX = hEndX + hDir * CUT
  const hCutY = y - vDir * CUT

  // Vertical arm: vertex → y+vDir*ARM, then diagonal cut
  const vEndY = y + vDir * ARM
  const vCutX = x + hDir * CUT
  const vCutY = vEndY + vDir * CUT

  return (
    <g stroke={color} strokeWidth="1" fill="none" strokeLinecap="round">
      {/* Horizontal arm + diagonal cut */}
      <line x1={x} y1={y} x2={hEndX} y2={y} />
      <line x1={hEndX} y1={y} x2={hCutX} y2={hCutY} />
      {/* Vertical arm + diagonal cut */}
      <line x1={x} y1={y} x2={x} y2={vEndY} />
      <line x1={x} y1={vEndY} x2={vCutX} y2={vCutY} />
      {/* Dot at vertex */}
      <circle cx={x} cy={y} r={DOT} fill={color} stroke="none" />
    </g>
  )
}

interface Props {
  variant?: CyberFrameVariant
  children: ReactNode
  className?: string
}

export default function CyberFrame({ variant = 'other', children, className = '' }: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  useLayoutEffect(() => {
    const el = divRef.current
    if (!el) return

    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      setSize({ w: width, h: height })
    }

    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const color = COLOR[variant]

  // SVG viewport: slightly larger than the div so corners extend OVER px outside
  const svgW = size ? size.w + OVER * 2 : 0
  const svgH = size ? size.h + OVER * 2 : 0

  // Corner anchor positions inside the SVG coordinate space
  // top-left:     (OVER, OVER)
  // top-right:    (svgW-OVER, OVER)
  // bottom-left:  (OVER, svgH-OVER)
  // bottom-right: (svgW-OVER, svgH-OVER)

  return (
    <div
      ref={divRef}
      className={className}
      style={{
        position: 'relative',
        padding: '10px 16px',
      }}
    >
      {size && size.w > 0 && size.h > 0 && (
        <svg
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: -OVER,
            width: svgW,
            height: svgH,
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          {/* top-left: arms go right and down */}
          <Corner x={OVER} y={OVER} hDir={1} vDir={1} color={color} />
          {/* top-right: arms go left and down */}
          <Corner x={svgW - OVER} y={OVER} hDir={-1} vDir={1} color={color} />
          {/* bottom-left: arms go right and up */}
          <Corner x={OVER} y={svgH - OVER} hDir={1} vDir={-1} color={color} />
          {/* bottom-right: arms go left and up */}
          <Corner x={svgW - OVER} y={svgH - OVER} hDir={-1} vDir={-1} color={color} />
        </svg>
      )}
      {children}
    </div>
  )
}
