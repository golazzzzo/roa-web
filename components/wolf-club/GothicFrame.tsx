'use client'

import { useLayoutEffect, useRef, useState } from 'react'

// Neotribal ornament drawn at the top/bottom edges of the message frame.
// cx/cy = center of the edge line, v = direction (−1 up, +1 down), w = frame width.
function TribalEdge({
  cx, cy, color, v, frameW,
}: {
  cx: number; cy: number; color: string; v: 1 | -1; frameW: number;
}) {
  // Scale ornament so it never overflows narrow messages
  const scale = Math.min(1, (frameW - 16) / 110)

  // All y-offsets are multiplied by v: v=-1 goes up, v=1 goes down
  const y = (n: number) => cy + v * n * scale
  const x = (n: number) => cx + n * scale

  return (
    <g>
      {/* Horizontal connecting lines from frame edge to ornament base */}
      <line x1={0} y1={cy} x2={x(-22)} y2={cy} stroke={color} strokeWidth="0.6" />
      <line x1={x(22)} y1={cy} x2={frameW} y2={cy} stroke={color} strokeWidth="0.6" />

      {/* ── Central blade (pointed teardrop going up/down) ── */}
      <path
        d={`M ${cx} ${cy}
            C ${x(-3)} ${y(5)} ${x(-5)} ${y(12)} ${cx} ${y(17)}
            C ${x(5)} ${y(12)} ${x(3)} ${y(5)} ${cx} ${cy} Z`}
        fill={color}
      />

      {/* ── Left filled lobe ── */}
      <path
        d={`M ${x(-4)} ${y(4)}
            C ${x(-13)} ${y(13)} ${x(-21)} ${y(8)} ${x(-16)} ${y(2)}
            C ${x(-14)} ${y(-1)} ${x(-8)} ${y(0)} ${x(-5)} ${y(3)} Z`}
        fill={color}
      />
      {/* Left lobe inner cutout (hollow effect) */}
      <path
        d={`M ${x(-7)} ${y(3)}
            C ${x(-11)} ${y(8)} ${x(-15)} ${y(7)} ${x(-13)} ${y(3)}
            C ${x(-12)} ${y(1)} ${x(-9)} ${y(1)} ${x(-7)} ${y(3)} Z`}
        fill="#0a0a0a"
      />

      {/* ── Right filled lobe ── */}
      <path
        d={`M ${x(4)} ${y(4)}
            C ${x(13)} ${y(13)} ${x(21)} ${y(8)} ${x(16)} ${y(2)}
            C ${x(14)} ${y(-1)} ${x(8)} ${y(0)} ${x(5)} ${y(3)} Z`}
        fill={color}
      />
      {/* Right lobe inner cutout */}
      <path
        d={`M ${x(7)} ${y(3)}
            C ${x(11)} ${y(8)} ${x(15)} ${y(7)} ${x(13)} ${y(3)}
            C ${x(12)} ${y(1)} ${x(9)} ${y(1)} ${x(7)} ${y(3)} Z`}
        fill="#0a0a0a"
      />

      {/* ── Left swept arm ── */}
      <path
        d={`M ${x(-16)} ${y(2)}
            C ${x(-25)} ${y(11)} ${x(-35)} ${y(6)} ${x(-30)} ${y(-2)}`}
        fill="none" stroke={color} strokeWidth={1.4 * scale} strokeLinecap="round"
      />
      {/* Left outer blade (thin, tapers to point) */}
      <path
        d={`M ${x(-30)} ${y(-2)}
            C ${x(-38)} ${y(5)} ${x(-47)} ${y(0)} ${x(-43)} ${y(-8)}`}
        fill="none" stroke={color} strokeWidth={0.8 * scale} strokeLinecap="round"
      />
      {/* Left small inner loop on arm */}
      <path
        d={`M ${x(-19)} ${y(4)}
            C ${x(-22)} ${y(8)} ${x(-26)} ${y(7)} ${x(-24)} ${y(4)}
            C ${x(-23)} ${y(2)} ${x(-20)} ${y(2)} ${x(-19)} ${y(4)} Z`}
        fill={color}
      />

      {/* ── Right swept arm ── */}
      <path
        d={`M ${x(16)} ${y(2)}
            C ${x(25)} ${y(11)} ${x(35)} ${y(6)} ${x(30)} ${y(-2)}`}
        fill="none" stroke={color} strokeWidth={1.4 * scale} strokeLinecap="round"
      />
      {/* Right outer blade */}
      <path
        d={`M ${x(30)} ${y(-2)}
            C ${x(38)} ${y(5)} ${x(47)} ${y(0)} ${x(43)} ${y(-8)}`}
        fill="none" stroke={color} strokeWidth={0.8 * scale} strokeLinecap="round"
      />
      {/* Right small inner loop on arm */}
      <path
        d={`M ${x(19)} ${y(4)}
            C ${x(22)} ${y(8)} ${x(26)} ${y(7)} ${x(24)} ${y(4)}
            C ${x(23)} ${y(2)} ${x(20)} ${y(2)} ${x(19)} ${y(4)} Z`}
        fill={color}
      />
    </g>
  )
}

export default function GothicFrame({
  children,
  color = '#c41e1e',
}: {
  children: React.ReactNode
  color?: string
}) {
  const innerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = innerRef.current
    if (!el) return
    const ro = new ResizeObserver(() =>
      setSize({ w: el.offsetWidth, h: el.offsetHeight })
    )
    ro.observe(el)
    setSize({ w: el.offsetWidth, h: el.offsetHeight })
    return () => ro.disconnect()
  }, [])

  const { w, h } = size
  const ornH = 22 // how far ornament protrudes beyond content edge

  return (
    <div style={{ paddingTop: ornH + 4, paddingBottom: ornH + 4 }}>
      <div ref={innerRef} style={{ padding: '10px 18px', position: 'relative' }}>
        {w > 0 && (
          <svg
            width={w}
            height={h}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              overflow: 'visible',
              pointerEvents: 'none',
            }}
          >
            {/* Top tribal ornament */}
            <TribalEdge cx={w / 2} cy={0} color={color} v={-1} frameW={w} />
            {/* Bottom tribal ornament */}
            <TribalEdge cx={w / 2} cy={h} color={color} v={1} frameW={w} />
            {/* Left vertical line */}
            <line x1={0} y1={0} x2={0} y2={h} stroke={color} strokeWidth="0.6" />
            {/* Right vertical line */}
            <line x1={w} y1={0} x2={w} y2={h} stroke={color} strokeWidth="0.6" />
          </svg>
        )}
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </div>
    </div>
  )
}
