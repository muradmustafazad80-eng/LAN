'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function BarberBookingActions({ bookingId, status }: { bookingId: string; status: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const target = status === 'pending' ? 'confirmed' : status === 'confirmed' ? 'completed' : ''
  if (!target) return null
  return <div className="flex items-center gap-2"><button disabled={busy} onClick={async () => { setBusy(true); setError(''); try { const res = await fetch(`/api/bookings/${bookingId}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: target }) }); const data = await res.json(); if (!res.ok || !data.success) setError(data.error || 'Əməliyyat alınmadı.'); else router.refresh() } catch { setError('Serverlə əlaqə qurmaq mümkün olmadı.') } finally { setBusy(false) } }} className="rounded-sm border border-primary/40 px-3 py-2 text-xs text-primary hover:border-primary disabled:opacity-50">{busy ? '...' : target === 'confirmed' ? 'Təsdiqlə' : 'Tamamla'}</button>{status !== 'completed' && <button disabled={busy} onClick={async () => { setBusy(true); setError(''); try { const res = await fetch(`/api/bookings/${bookingId}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) }); const data = await res.json(); if (!res.ok || !data.success) setError(data.error || 'Əməliyyat alınmadı.'); else router.refresh() } catch { setError('Serverlə əlaqə qurmaq mümkün olmadı.') } finally { setBusy(false) } }} className="rounded-sm border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">Ləğv et</button>}{error && <span className="max-w-40 text-xs text-destructive">{error}</span>}</div>
}
