'use client'

import { useEffect, useMemo, useState } from 'react'

type Booking = {
  id: string
  dateTime: string
  status: string
  price: string
  barberName: string
  barberId: string
  serviceId: string
  serviceName: string
  duration: number
}

type Barber = { id: string; name: string; specialty: string }

type RescheduleState = { booking: Booking; date: string; barberId: string }

function getDateInTimezone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function AccountPanel({ initialUser }: { initialUser: { email: string; customerId: string | null; role: string; businessSlug: string; businessTimezone: string } }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState('')
  const [profile, setProfile] = useState<{ name: string; phone: string } | null>(null)
  const [reschedule, setReschedule] = useState<RescheduleState | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleBarberId, setRescheduleBarberId] = useState('')
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([])
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)

  const minDate = useMemo(() => getDateInTimezone(new Date(), initialUser.businessTimezone), [initialUser.businessTimezone])

  async function load() {
    const [bookingRes, barberRes, profileRes] = await Promise.all([fetch('/api/me/bookings', { cache: 'no-store' }), fetch(`/api/barbers?businessSlug=${encodeURIComponent(initialUser.businessSlug)}`, { cache: 'no-store' }), fetch('/api/me', { cache: 'no-store' })])
    const bookingData = await bookingRes.json()
    const barberData = await barberRes.json()
    const profileData = await profileRes.json()
    if (bookingData.success) setBookings(bookingData.bookings)
    if (Array.isArray(barberData)) setBarbers(barberData)
    if (profileData.success && profileData.profile) setProfile({ name: profileData.profile.name, phone: profileData.profile.phone })
  }

  useEffect(() => { load().catch(() => setMessage('Məlumatlar yüklənmədi.')) }, [])

  async function cancel(id: string) {
    setBusyId(id)
    setMessage('')
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: 'POST' })
      const data = await res.json()
      setMessage(data.success ? 'Rezervasiya ləğv edildi.' : data.error || 'Əməliyyat alınmadı.')
      if (data.success) await load()
    } catch {
      setMessage('Serverlə əlaqə qurmaq mümkün olmadı.')
    } finally {
      setBusyId('')
    }
  }

  async function openReschedule(booking: Booking) {
    setMessage('')
    const initialDate = getDateInTimezone(new Date(booking.dateTime), initialUser.businessTimezone)
    setReschedule({ booking, date: initialDate, barberId: booking.barberId })
    setRescheduleDate(initialDate < minDate ? minDate : initialDate)
    setRescheduleBarberId(booking.barberId)
    setRescheduleTime('')
    await loadRescheduleSlots(booking, initialDate < minDate ? minDate : initialDate, booking.barberId)
  }

  async function loadRescheduleSlots(booking: Booking, date: string, barberId: string) {
    setRescheduleSlots([])
    setRescheduleTime('')
    if (!date || !barberId) return
    setLoadingSlots(true)
    try {
      const params = new URLSearchParams({ barberId, serviceId: booking.serviceId, date, businessSlug: initialUser.businessSlug })
      const res = await fetch(`/api/availability?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data.success || !Array.isArray(data.slots)) throw new Error('AVAILABILITY_FAILED')
      setRescheduleSlots(data.slots)
    } catch {
      setMessage('Yeni boş vaxtlar yüklənmədi. Yenidən cəhd edin.')
    } finally {
      setLoadingSlots(false)
    }
  }


  async function rescheduleBooking() {
    if (!reschedule || !rescheduleDate || !rescheduleTime || !rescheduleBarberId) {
      setMessage('Yeni tarix, usta və boş vaxt seçin.')
      return
    }
    setBusyId(reschedule.booking.id)
    setMessage('')
    try {
      const res = await fetch(`/api/bookings/${reschedule.booking.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateTime: `${rescheduleDate}T${rescheduleTime}:00`, barberId: rescheduleBarberId }),
      })
      const data = await res.json()
      setMessage(data.success ? 'Rezervasiya dəyişdirildi.' : data.error || 'Əməliyyat alınmadı.')
      if (data.success) {
        setReschedule(null)
        await load()
      }
    } catch {
      setMessage('Serverlə əlaqə qurmaq mümkün olmadı.')
    } finally {
      setBusyId('')
    }
  }

  return <div className="space-y-8">
    <div className="rounded-xl border border-border/60 bg-card p-6"><p className="text-xs tracking-[0.25em] text-primary">HESAB</p><h2 className="mt-2 font-serif text-2xl font-semibold">{initialUser.email}</h2><p className="mt-2 text-sm text-muted-foreground">{profile?.name || 'Müştəri'} · {profile?.phone || 'Telefon məlumatı yoxdur'}</p><p className="mt-1 text-sm text-muted-foreground">Rezervasiyaları yalnız siz görə bilərsiniz.</p></div>
    {message && <p role="status" className="rounded-sm border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">{message}</p>}

    {reschedule && <div className="rounded-xl border border-primary/30 bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-xs tracking-[0.25em] text-primary">VAXTI DƏYİŞ</p><h3 className="mt-2 font-serif text-2xl font-semibold">Yeni vaxt seçin</h3><p className="mt-1 text-sm text-muted-foreground">{reschedule.booking.serviceName} · xidmət müddəti serverdən qorunur.</p></div>
        <button type="button" onClick={() => setReschedule(null)} className="text-sm text-muted-foreground hover:text-foreground">Bağla</button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <label className="text-sm"><span className="mb-2 block text-muted-foreground">Usta</span><select value={rescheduleBarberId} onChange={(e) => { setRescheduleBarberId(e.target.value); void loadRescheduleSlots(reschedule.booking, rescheduleDate, e.target.value) }} className="w-full rounded-sm border border-input bg-background px-3 py-2.5 outline-none focus:border-primary">{barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}</select></label>
        <label className="text-sm"><span className="mb-2 block text-muted-foreground">Tarix</span><input type="date" min={minDate} value={rescheduleDate} onChange={(e) => { setRescheduleDate(e.target.value); void loadRescheduleSlots(reschedule.booking, e.target.value, rescheduleBarberId) }} className="w-full rounded-sm border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" /></label>
        <label className="text-sm"><span className="mb-2 block text-muted-foreground">Boş vaxt</span><select value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} disabled={loadingSlots || rescheduleSlots.length === 0} className="w-full rounded-sm border border-input bg-background px-3 py-2.5 outline-none focus:border-primary"><option value="">{loadingSlots ? 'Yüklənir...' : rescheduleSlots.length ? 'Vaxt seçin' : 'Boş vaxt yoxdur'}</option>{rescheduleSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></label>
      </div>
      <div className="mt-5 flex gap-3"><button type="button" onClick={() => void rescheduleBooking()} disabled={busyId === reschedule.booking.id || loadingSlots || !rescheduleTime} className="rounded-sm bg-primary px-5 py-2.5 text-xs font-medium tracking-widest text-primary-foreground disabled:opacity-50">{busyId === reschedule.booking.id ? 'YÜKLƏNİR...' : 'TƏSDİQLƏ'}</button><button type="button" onClick={() => setReschedule(null)} className="rounded-sm border border-border px-5 py-2.5 text-xs text-muted-foreground">LƏĞV ET</button></div>
    </div>}

    <div><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs tracking-[0.25em] text-primary">REZERVASİYALAR</p><h2 className="mt-2 font-serif text-3xl font-semibold">Sizin görüşləriniz</h2></div><a href="/#rezervasiya" className="text-sm text-primary hover:underline">Yeni rezervasiya</a></div>{bookings.length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">Hələ rezervasiyanız yoxdur.</div> : <div className="grid gap-4">{bookings.map((booking) => <article key={booking.id} className="rounded-xl border border-border/60 bg-card p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="font-medium">{booking.serviceName}</p><p className="mt-1 text-sm text-muted-foreground">{booking.barberName} · {new Intl.DateTimeFormat('az-AZ', { dateStyle: 'medium', timeStyle: 'short', timeZone: initialUser.businessTimezone }).format(new Date(booking.dateTime))}</p><p className="mt-1 text-sm text-muted-foreground">{booking.price} AZN · {booking.status}</p></div>{['pending','confirmed'].includes(booking.status) && <div className="flex gap-2"><button onClick={() => void openReschedule(booking)} disabled={busyId === booking.id} className="rounded-sm border border-primary/40 px-4 py-2 text-xs text-primary hover:border-primary">Vaxtı dəyiş</button><button onClick={() => void cancel(booking.id)} disabled={busyId === booking.id} className="rounded-sm border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground">Ləğv et</button></div>}</div></article>)}</div>}</div>
  </div>
}
