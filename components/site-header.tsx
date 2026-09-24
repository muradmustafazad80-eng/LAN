'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu, X, Scissors, Phone, UserRound, LogIn } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const links = [
  { id: 'xidmetler', label: 'Xidmətlər' },
  { id: 'qiymetler', label: 'Qiymətlər' },
  { id: 'ustalar', label: 'Ustalar' },
  { id: 'reyler', label: 'Rəylər' },
  { id: 'elaqe', label: 'Əlaqə' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 })
  const [session, setSession] = useState<{ role: string } | null>(null)

  const navRef = useRef<HTMLElement>(null)
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({})

  useEffect(() => {
    fetch('/api/me').then((res) => res.ok ? res.json() : null).then((data) => { if (data?.success) setSession(data.user) }).catch(() => setSession(null))
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )
    links.forEach((l) => {
      const el = document.getElementById(l.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const update = () => {
      const nav = navRef.current
      const el = linkRefs.current[active]
      if (nav && el) {
        const nr = nav.getBoundingClientRect()
        const r = el.getBoundingClientRect()
        setIndicator({ left: r.left - nr.left, width: r.width, opacity: 1 })
      } else {
        setIndicator((s) => ({ ...s, opacity: 0 }))
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [active])

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:h-20 md:px-6">
        <a href="#" className="flex items-center gap-2">
          <Scissors className="size-5 text-primary" aria-hidden="true" />
          <span className="font-serif text-lg font-semibold tracking-[0.2em] md:text-xl">
            KRAL<span className="text-primary">BARBER</span>
          </span>
        </a>

        <nav ref={navRef} className="relative hidden items-center gap-8 md:flex" aria-label="Əsas naviqasiya">
          {links.map((l) => {
            const isActive = active === l.id
            return (
              <a
                key={l.id}
                ref={(el) => {
                  linkRefs.current[l.id] = el
                }}
                href={`#${l.id}`}
                className={cn(
                  'text-sm tracking-wide transition-colors duration-300',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary',
                )}
                style={isActive ? { textShadow: '0 0 14px rgba(212, 175, 55, 0.65)' } : undefined}
                aria-current={isActive ? 'true' : undefined}
              >
                {l.label}
              </a>
            )
          })}
          {/* Framer Motion smooth sliding + glowing active underline */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-1 h-px bg-primary"
            animate={{
              left: indicator.left,
              width: indicator.width,
              opacity: indicator.opacity,
            }}
            transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.7 }}
            style={{ boxShadow: '0 0 12px 1px rgba(212, 175, 55, 0.9)' }}
          />
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {session ? <a href={session.role === 'admin' ? '/admin' : session.role === 'barber' ? '/barber' : '/account'} className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"><UserRound className="size-4" aria-hidden="true" />Hesabım</a> : <a href="/login" className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"><LogIn className="size-4" aria-hidden="true" />Daxil ol</a>}
        </div>

        <a
          href="#rezervasiya"
          className="hidden items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-medium tracking-wide text-primary-foreground transition-opacity hover:opacity-90 md:inline-flex"
        >
          <Phone className="size-4" aria-hidden="true" />
          Rezervasiya
        </a>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center rounded-sm border border-border text-foreground md:hidden"
          aria-label={open ? 'Menyunu bağla' : 'Menyunu aç'}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-4" aria-label="Mobil naviqasiya">
            {links.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={() => setOpen(false)}
                className={cn(
                  'border-b border-border/40 py-3 text-sm tracking-wide last:border-none hover:text-primary',
                  active === l.id ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {l.label}
              </a>
            ))}
            <a
              href="#rezervasiya"
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-medium tracking-wide text-primary-foreground"
            >
              <Phone className="size-4" aria-hidden="true" />
              Rezervasiya et
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
