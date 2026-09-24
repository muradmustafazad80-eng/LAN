'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

export function GoogleAuthButton({ label = 'GOOGLE İLƏ DAXİL OL', adminOnly = false }: { label?: string; adminOnly?: boolean }) {
  const shellRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const element = shellRef.current
    if (!element) return
    const ctx = gsap.context(() => {
      gsap.fromTo(element, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' })
    }, element)
    return () => ctx.revert()
  }, [])

  function go() {
    if (busy) return
    setBusy(true)
    const element = shellRef.current
    if (element) {
      gsap.to(element, { y: -2, scale: 0.985, duration: 0.12, ease: 'power2.out', yoyo: true, repeat: 1 })
    }
    window.setTimeout(() => { window.location.assign(`/api/auth/google/start${adminOnly ? '?admin=1' : ''}`) }, 150)
  }

  return (
    <div ref={shellRef} className="overflow-hidden rounded-sm">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        aria-label={label}
        className="group flex w-full items-center justify-center gap-3 rounded-sm border border-border/70 bg-background px-6 py-3.5 text-sm tracking-wide transition-all duration-300 hover:border-primary/70 hover:bg-primary/[0.04] hover:shadow-[0_0_28px_rgba(212,175,55,0.08)] disabled:cursor-wait disabled:opacity-70"
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] font-bold text-[#4285F4] shadow-sm">G</span>
        <span>{busy ? 'GOOGLE-A KEÇİD EDİLİR...' : label}</span>
      </button>
    </div>
  )
}
