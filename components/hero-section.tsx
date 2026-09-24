'use client'

import { useEffect, useRef } from 'react'
import { Star } from 'lucide-react'
import gsap from 'gsap'
import { GlowButton } from '@/components/glow-button'
import WorkingHours from '@/components/working-hours'

export function HeroSection() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.hero-anim',
        { y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          stagger: 0.14,
          delay: 0.2,
        },
      )
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/images/hero-barber.png"
          alt="KRAL BARBER premium barbershop interyeri"
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
      </div>

      <div ref={root} className="relative mx-auto w-full max-w-6xl px-4 pt-28 md:px-6 md:pt-20">
        <div className="max-w-2xl">
          <div className="hero-anim mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 opacity-0">
            <span className="flex items-center gap-0.5 text-primary">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3.5 fill-current" aria-hidden="true" />
              ))}
            </span>
            <span className="text-xs tracking-widest text-primary">2012-DƏN BƏRİ BAKIDA</span>
          </div>

          <h1 className="hero-anim text-balance font-serif text-4xl font-semibold leading-tight tracking-tight opacity-0 sm:text-5xl md:text-7xl">
            Kişi üçün <span className="text-primary">əsl</span> qulluq sənəti
          </h1>

          <p className="hero-anim mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground opacity-0 md:text-lg">
            Klassik ustalıq, premium məhsullar və detallara diqqət. KRAL BARBER-də hər kəsim
            bir rituala çevrilir — sizə layiq olan görünüş üçün.
          </p>

          <div className="hero-anim mt-10 flex flex-col gap-4 opacity-0 sm:flex-row">
            <GlowButton
              href="#rezervasiya"
              className="bg-primary px-8 py-4 text-sm font-medium tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
            >
              REZERVASIYA ET
            </GlowButton>
            <GlowButton
              href="#xidmetler"
              className="border border-primary/50 bg-background/40 px-8 py-4 text-sm font-medium tracking-widest text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              XİDMƏTLƏRƏ BAX
            </GlowButton>
          </div>

          <dl className="hero-anim mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-border/60 pt-8 opacity-0">
            {[
              { n: '12+', l: 'İllik təcrübə' },
              { n: '8K+', l: 'Məmnun müştəri' },
              { n: '4.9', l: 'Orta reytinq' },
            ].map((s) => (
              <div key={s.l}>
                <dt className="font-serif text-3xl font-semibold text-primary">{s.n}</dt>
                <dd className="mt-1 text-xs tracking-wide text-muted-foreground">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
