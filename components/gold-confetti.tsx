'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export function GoldConfetti() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      canvas.width = window.innerWidth * DPR
      canvas.height = window.innerHeight * DPR
    }
    resize()

    const colors = ['#d4af37', '#f5d97a', '#b8860b', '#fff4cf', '#e6be5a']
    const parts = Array.from({ length: 170 }, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height * 0.4,
      w: (5 + Math.random() * 8) * DPR,
      h: (8 + Math.random() * 10) * DPR,
      vx: (-1 + Math.random() * 2) * DPR,
      vy: (2 + Math.random() * 4.5) * DPR,
      rot: Math.random() * Math.PI,
      vr: -0.25 + Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))

    const start = performance.now()
    let raf = 0
    const frame = (t: number) => {
      const elapsed = t - start
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of parts) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05 * DPR
        p.rot += p.vr
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = Math.max(0, 1 - elapsed / 3600)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }
      if (elapsed < 3900) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}
