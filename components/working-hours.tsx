'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { getDefaultBusinessHours } from '@/lib/business-hours'

type WorkingHoursState = {
  isOpen: boolean
  startTime: string
  endTime: string
  loading: boolean
}

function getBakuNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Baku',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    weekday: weekdayMap[String(values.weekday)] ?? 1,
    minutes: Number(values.hour) * 60 + Number(values.minute),
  }
}

function getFallbackState(): WorkingHoursState {
  const now = getBakuNow()
  const schedule = getDefaultBusinessHours(now.weekday)
  const start = schedule.startTime.split(':').map(Number)
  const end = schedule.endTime.split(':').map(Number)
  const startMinutes = start[0] * 60 + start[1]
  const endMinutes = end[0] * 60 + end[1]
  return {
    isOpen: schedule.isOpen && now.minutes >= startMinutes && now.minutes < endMinutes,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    loading: true,
  }
}

export default function WorkingHours() {
  const [hours, setHours] = useState<WorkingHoursState>(() => getFallbackState())
  const [liveConnected, setLiveConnected] = useState(false)

  const statusText = useMemo(() => hours.isOpen ? 'HAZIRDA AÇIQ' : 'HAZIRDA BAĞLI', [hours.isOpen])

  useEffect(() => {
    let active = true

    async function loadHours() {
      setHours(getFallbackState())
      try {
        const response = await fetch('/api/business-hours?businessSlug=kral-barber', {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error('BUSINESS_HOURS_REQUEST_FAILED')
        const data = await response.json()
        if (!active || !data?.success) throw new Error('BUSINESS_HOURS_RESPONSE_INVALID')

        setHours({
          isOpen: Boolean(data.isOpen),
          startTime: typeof data.startTime === 'string' ? data.startTime : hours.startTime,
          endTime: typeof data.endTime === 'string' ? data.endTime : hours.endTime,
          loading: false,
        })
        setLiveConnected(true)
      } catch {
        if (!active) return
        setHours((current) => ({ ...current, loading: false }))
        setLiveConnected(false)
      }
    }

    loadHours()
    const interval = window.setInterval(loadHours, 60_000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
      className="absolute top-24 right-4 md:top-28 md:right-8 z-50 hidden sm:block select-none pointer-events-auto group"
      aria-live="polite"
    >
      <div style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
        <div
          style={{
            transform: 'rotateY(-20deg) rotateX(4deg)',
            transformStyle: 'preserve-3d',
            background: 'linear-gradient(135deg, rgba(15, 15, 15, 0.96) 0%, rgba(5, 5, 5, 0.98) 100%)',
          }}
          className="w-[220px] p-3.5 md:w-[280px] md:p-5 rounded-xl md:rounded-2xl border border-amber-500/10 flex items-center justify-start gap-3 md:gap-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] transition-all duration-500 group-hover:scale-105 group-hover:border-amber-500/30 relative overflow-hidden"
        >
          <div className="absolute -inset-[200%] bg-[conic-gradient(from_0deg,transparent_40%,#d97706_50%,#3b82f6_60%,transparent_70%)] animate-spin opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" style={{ animationDuration: '4s' }} />
          <div className="absolute inset-[1px] bg-neutral-950 rounded-[inherit] -z-10 transition-colors duration-300 group-hover:bg-neutral-900" />

          <div className="relative flex h-2.5 w-2.5 md:h-3 md:w-3 shrink-0 items-center justify-center">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${hours.isOpen ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 ${hours.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          </div>

          <div className="flex flex-col text-left space-y-0.5 md:space-y-1 min-w-0">
            <span className="text-[8px] md:text-[10px] tracking-[0.25em] md:tracking-[0.35em] text-zinc-400 font-bold uppercase leading-none">
              {statusText}
            </span>
            <span className="text-[13px] md:text-[16px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-100 to-amber-500 font-mono tracking-wide leading-none mt-0.5 whitespace-nowrap">
              {hours.startTime} – {hours.endTime}
            </span>
            <span className="text-[8px] text-zinc-500 leading-none pt-1">
              {liveConnected ? 'Canlı iş saatları' : hours.loading ? 'Canlı məlumat alınır' : 'Saxlanmış iş saatları'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
