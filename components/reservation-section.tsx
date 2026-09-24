'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Check, Crown } from 'lucide-react'
import { GoldConfetti } from '@/components/gold-confetti'
import { GlowButton } from '@/components/glow-button'

const BUSINESS_SLUG = 'kral-barber'

type Barber = {
  id: string
  name: string
  specialty: string
}

type Service = {
  id: string
  name: string
  price: string | number
  duration: number
  category: string
}

type Result = { done: boolean; gift: boolean; name: string }

function getBakuDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Baku',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function ReservationSection() {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [barberId, setBarberId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [result, setResult] = useState<Result>({ done: false, gift: false, name: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const minDate = useMemo(() => getBakuDate(), [])

  useEffect(() => {
    let active = true
    async function loadOptions() {
      setLoadingOptions(true)
      try {
        const [barberRes, serviceRes] = await Promise.all([
          fetch(`/api/barbers?businessSlug=${BUSINESS_SLUG}`, { cache: 'no-store' }),
          fetch(`/api/services?businessSlug=${BUSINESS_SLUG}`, { cache: 'no-store' }),
        ])
        const barberData = await barberRes.json()
        const serviceData = await serviceRes.json()
        if (!active) return
        if (!barberRes.ok || !Array.isArray(barberData)) throw new Error('BARBERS_FAILED')
        if (!serviceRes.ok || !Array.isArray(serviceData)) throw new Error('SERVICES_FAILED')
        setBarbers(barberData)
        setServices(serviceData)
        setBarberId((current) => current || barberData[0]?.id || '')
        setServiceId((current) => current || serviceData[0]?.id || '')
      } catch {
        if (active) setError('Usta və xidmət məlumatları yüklənmədi. Səhifəni yeniləyin.')
      } finally {
        if (active) setLoadingOptions(false)
      }
    }
    loadOptions()
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    async function loadSlots() {
      setTime('')
      setSlots([])
      setError('')
      if (!barberId || !serviceId || !date) return
      setLoadingSlots(true)
      try {
        const query = new URLSearchParams({ barberId, serviceId, date, businessSlug: BUSINESS_SLUG })
        const res = await fetch(`/api/availability?${query.toString()}`, { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok || !data.success || !Array.isArray(data.slots)) throw new Error('AVAILABILITY_FAILED')
        if (active) setSlots(data.slots)
      } catch {
        if (active) setError('Boş vaxtlar yüklənmədi. Yenidən cəhd edin.')
      } finally {
        if (active) setLoadingSlots(false)
      }
    }
    void loadSlots()
    return () => { active = false }
  }, [barberId, serviceId, date])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return

    const formData = new FormData(e.currentTarget)
    const name = String(formData.get('name') || '').trim()
    const phone = String(formData.get('phone') || '').trim()

    if (!name || !phone || !barberId || !serviceId || !date || !time) {
      setError('Zəhmət olmasa bütün məlumatları doldurun və boş vaxt seçin.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          barberId,
          serviceId,
          dateTime: `${date}T${time}:00`,
          businessSlug: BUSINESS_SLUG,
        }),
      })
      const bookingRes = await res.json()

      if (bookingRes.success) {
        setResult({ done: true, gift: false, name })
      } else if (res.status === 401) {
        setError('Rezervasiya üçün əvvəlcə hesabınıza daxil olun. Sonra yenidən cəhd edin.')
      } else {
        setError(bookingRes.error || 'Rezervasiya yaradıla bilmədi.')
      }
    } catch {
      setError('Serverlə əlaqə qurmaq mümkün olmadı.')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setResult({ done: false, gift: false, name: '' })
    setError('')
    setSubmitting(false)
    setTime('')
  }

  return (
    <section id="rezervasiya" className="scroll-mt-20 py-24 md:py-32">
      {result.gift && <GoldConfetti />}
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
          <div className="grid md:grid-cols-2">
            <div className="flex flex-col justify-center p-8 md:p-12">
              <span className="inline-flex w-fit items-center gap-2 text-xs font-medium tracking-[0.3em] text-primary">
                <CalendarCheck className="size-4" aria-hidden="true" />
                REZERVASİYA
              </span>
              <h2 className="mt-4 text-balance font-serif text-3xl font-semibold tracking-tight md:text-4xl">
                Yerinizi indi ayırın
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                Ustanı, xidməti, tarixi və yalnız həqiqətən boş olan vaxtı seçin.
              </p>
              <ul className="mt-8 space-y-3">
                {['Onlayn və sürətli qeydiyyat', 'Həqiqi boş vaxt seçimi', 'Təsdiq prosesi'].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Check className="size-4 text-primary" aria-hidden="true" />
                    {t}
                  </li>
                ))}
                <li className="flex items-center gap-3 text-sm text-primary">
                  <Crown className="size-4" aria-hidden="true" />
                  Premium KRAL xidməti
                </li>
              </ul>
            </div>

            <div className="border-t border-border/60 bg-card/60 p-8 md:border-l md:border-t-0 md:p-12">
              {result.done ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex size-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
                    <Check className="size-7" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 font-serif text-2xl font-semibold">Təşəkkür edirik, {result.name}!</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Rezervasiyanız uğurla qəbul edildi.</p>
                  <GlowButton
                    onClick={reset}
                    className="mt-8 border border-primary/50 bg-background/40 px-6 py-3 text-sm font-medium tracking-widest text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    YENİ REZERVASİYA
                  </GlowButton>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm text-muted-foreground">Ad, Soyad</label>
                    <input id="name" name="name" required placeholder="Adınızı daxil edin" className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm text-muted-foreground">Telefon</label>
                    <input id="phone" name="phone" type="tel" required placeholder="+994 __ ___ __ __" className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary" />
                  </div>

                  <div>
                    <label htmlFor="barber" className="mb-2 block text-sm text-muted-foreground">Usta</label>
                    <select id="barber" value={barberId} onChange={(e) => setBarberId(e.target.value)} disabled={loadingOptions} required className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary">
                      {barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name} — {barber.specialty}</option>)}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="service" className="mb-2 block text-sm text-muted-foreground">Xidmət</label>
                    <select id="service" value={serviceId} onChange={(e) => setServiceId(e.target.value)} disabled={loadingOptions} required className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary">
                      {services.map((service) => <option key={service.id} value={service.id}>{service.name} — {service.price} AZN / {service.duration} dəq.</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="date" className="mb-2 block text-sm text-muted-foreground">Tarix</label>
                      <input id="date" name="date" type="date" value={date} min={minDate} onChange={(e) => setDate(e.target.value)} required className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary" />
                    </div>
                    <div>
                      <label htmlFor="time" className="mb-2 block text-sm text-muted-foreground">Boş vaxt</label>
                      <select id="time" name="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={!date || loadingSlots || slots.length === 0} required className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary">
                        <option value="">{loadingSlots ? 'Yüklənir...' : !date ? 'Əvvəl tarix seçin' : slots.length ? 'Vaxt seçin' : 'Boş vaxt yoxdur'}</option>
                        {slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                      </select>
                    </div>
                  </div>

                  {error && <p role="alert" className="rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

                  <GlowButton type="submit" full disabled={submitting || loadingOptions || loadingSlots || !barberId || !serviceId || !date || !time} className="bg-primary px-6 py-3.5 text-sm font-medium tracking-widest text-primary-foreground transition-opacity hover:opacity-90">
                    {submitting ? 'GÖNDƏRİLİR...' : 'TƏSDİQ ET'}
                  </GlowButton>
                  <p className="text-center text-xs text-muted-foreground">Rezervasiya üçün hesabınıza daxil olmalısınız.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
