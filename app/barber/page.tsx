import { redirect } from 'next/navigation'
import { desc, eq, and } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'
import { LogoutButton } from '@/components/logout-button'
import { BarberBookingActions } from '@/components/barber-booking-actions'
import { db } from '@/lib/db'
import { bookings, customers, services } from '@/lib/schema'

export default async function BarberPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'customer') redirect('/account')
  if (user.role === 'admin') redirect('/admin')
  if (!user.barberId) return <main className="min-h-screen p-10">Usta profili tapılmadı.</main>
  const rows = await db.select({ id: bookings.id, dateTime: bookings.dateTime, status: bookings.status, customer: customers.name, phone: customers.phone, service: services.name }).from(bookings).innerJoin(customers, and(eq(bookings.customerId, customers.id), eq(customers.businessId, user.businessId))).innerJoin(services, and(eq(bookings.serviceId, services.id), eq(services.businessId, user.businessId))).where(and(eq(bookings.businessId, user.businessId), eq(bookings.barberId, user.barberId))).orderBy(desc(bookings.dateTime)).limit(50)
  return <main className="min-h-screen bg-background px-4 py-16 md:px-6"><div className="mx-auto max-w-5xl"><div className="flex items-center justify-between gap-4"><a href="/" className="font-serif text-xl tracking-[0.2em]">KRAL<span className="text-primary">BARBER</span></a><LogoutButton /></div><div className="mt-12"><p className="text-xs tracking-[0.25em] text-primary">USTA BÖLMƏSİ</p><h1 className="mt-2 font-serif text-4xl font-semibold">Sizə aid rezervasiyalar</h1><p className="mt-3 text-muted-foreground">Başqa ustaların və başqa bizneslərin özəl məlumatları burada göstərilmir.</p><div className="mt-8 grid gap-3">{rows.length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">Rezervasiya yoxdur.</div> : rows.map((row) => <div key={row.id} className="rounded-xl border border-border/60 bg-card p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="font-medium">{row.service} · {row.customer}</p><p className="mt-1 text-sm text-muted-foreground">{row.phone} · {new Intl.DateTimeFormat('az-AZ', { dateStyle: 'medium', timeStyle: 'short', timeZone: user.businessTimezone }).format(row.dateTime)} · {row.status}</p></div><BarberBookingActions bookingId={row.id} status={row.status} /></div></div>)}</div></div></div></main>
}
