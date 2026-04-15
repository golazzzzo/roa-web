'use client'

import { ReactNode, useLayoutEffect, useRef, useState } from 'react'

export type CyberFrameVariant = 'own' | 'other' | 'broadcast'

const COLOR: Record<CyberFrameVariant, string> = {
  own:       'rgba(220,220,220,0.95)',
  other:     'rgba(130,130,130,0.45)',
  broadcast: 'rgba(195,195,195,0.78)',
}

const ARM  = 18   // arm length
const TICK = 5    // perpendicular end-tick half-length
const DOT  = 1.5  // vertex dot radius
const PAD  = 2    // how many px the SVG overshoots the div

interface CornerProps {
  x: number; y: number
  hDir: 1 | -1   // +1 = arm points right, -1 = left
  vDir: 1 | -1   // +1 = arm points down,  -1 = up
  color: string
}

function Corner({ x, y, hDir, vDir, color }: CornerProps) {
  const hEnd = x + hDir * ARM
  const vEnd = y + vDir * ARM

  return (
    <g stroke={color} strokeLinecap="square" fill="none">
      {/* Horizontal arm */}
      <line strokeWidth={0.9} x1={x} y1={y} x2={hEnd} y2={y} />
      {/* End-tick perpendicular to horizontal arm (inward toward content center) */}
      <line strokeWidth={0.75}
        x1={hEnd} y1={y - TICK * 0.4}
        x2={hEnd} y2={y + vDir * TICK}
      />

      {/* Vertical arm */}
      <line strokeWidth={0.9} x1={x} y1={y} x2={x} y2={vEnd} />
      {/* End-tick perpendicular to vertical arm (inward toward content center) */}
      <line strokeWidth={0.75}
        x1={x - TICK * 0.4} y1={vEnd}
        x2={x + hDir * TICK} y2={vEnd}
      />

      {/* Vertex dot */}
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
      const r = el.getBoundingClientRect()
      setSize({ w: r.width, h: r.height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const color = COLOR[variant]
  const svgW = size ? size.w + PAD * 2 : 0
  const svgH = size ? size.h + PAD * 2 : 0

  return (
    <div
      ref={divRef}
      className={className}
      style={{ position: 'relative', padding: '10px 16px' }}
    >
      {size && size.w > 0 && size.h > 0 && (
        <svg
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -PAD, left: -PAD,
            width: svgW, height: svgH,
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          <Corner x={PAD}        y={PAD}        hDir={1}  vDir={1}  color={color} />
          <Corner x={svgW - PAD} y={PAD}        hDir={-1} vDir={1}  color={color} />
          <Corner x={PAD}        y={svgH - PAD} hDir={1}  vDir={-1} color={color} />
          <Corner x={svgW - PAD} y={svgH - PAD} hDir={-1} vDir={-1} color={color} />
        </svg>
      )}
      {children}
    </div>
  )
}
