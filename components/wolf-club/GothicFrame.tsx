'use client'

import { useLayoutEffect, useRef, useState } from 'react'

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
    const ro = new ResizeObserver(() => setSize({ w: el.offsetWidth, h: el.offsetHeight }))
    ro.observe(el)
    setSize({ w: el.offsetWidth, h: el.offsetHeight })
    return () => ro.disconnect()
  }, [])

  const { w, h } = size
  const notch = 7
  const cut = 14
  const deco = 10

  const framePath = w > 0 ? [
    `M ${cut} 0`,
    `L ${w / 2 - notch} 0`,
    `L ${w / 2} ${-notch}`,
    `L ${w / 2 + notch} 0`,
    `L ${w - cut} 0`,
    `L ${w} ${cut}`,
    `L ${w} ${h - cut}`,
    `L ${w - cut} ${h}`,
    `L ${w / 2 + notch} ${h}`,
    `L ${w / 2} ${h + notch}`,
    `L ${w / 2 - notch} ${h}`,
    `L ${cut} ${h}`,
    `L 0 ${h - cut}`,
    `L 0 ${cut}`,
    `Z`,
  ].join(' ') : ''

  const mid = h / 2
  const leftDeco = `M -3 ${mid} L 0 ${mid - deco} L 3 ${mid} L 0 ${mid + deco} Z M -6 ${mid} L 0 ${mid - deco - 4} L 6 ${mid} L 0 ${mid + deco + 4} Z`
  const rightDeco = `M ${w + 3} ${mid} L ${w} ${mid - deco} L ${w - 3} ${mid} L ${w} ${mid + deco} Z M ${w + 6} ${mid} L ${w} ${mid - deco - 4} L ${w - 6} ${mid} L ${w} ${mid + deco + 4} Z`

  return (
    <div style={{ paddingTop: notch + 2, paddingBottom: notch + 2 }}>
      <div ref={innerRef} className="px-5 py-3" style={{ position: 'relative' }}>
        {w > 0 && (
          <svg
            width={w} height={h}
            style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}
          >
            <path d={framePath} fill="none" stroke={color} strokeWidth="1" />
            <path d={leftDeco} fill="none" stroke={color} strokeWidth="0.75" />
            <path d={rightDeco} fill="none" stroke={color} strokeWidth="0.75" />
          </svg>
        )}
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </div>
    </div>
  )
}
