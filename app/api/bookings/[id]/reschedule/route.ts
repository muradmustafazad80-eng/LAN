import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { barbers, bookings, businesses, services } from '@/lib/schema'
import { getCurrentUser, isValidUuid } from '@/lib/auth'
import { getSetting, hasBookingConflict, validateBookingWindow } from '@/lib/booking-rules'
import { localDateTimeToDate } from '@/lib/time'

const schema = z.object({ dateTime: z.string().datetime({ local: true }), barberId: z.string().uuid() })

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Giriş tələb olunur.' }, { status: 401 })
  if (user.role !== 'customer' || !user.customerId) return NextResponse.json({ success: false, error: 'Bu əməliyyata icazəniz yoxdur.' }, { status: 403 })
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Sorğu məlumatı düzgün deyil.' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Yeni vaxt düzgün deyil.' }, { status: 400 })
  const { id } = await params
  if (!isValidUuid(id)) return NextResponse.json({ success: false, error: 'Rezervasiya nömrəsi düzgün deyil.' }, { status: 400 })
  const [business] = await db.select({ timezone: businesses.timezone }).from(businesses).where(eq(businesses.id, user.businessId)).limit(1)
  if (!business) return NextResponse.json({ success: false, error: 'Biznes tapılmadı.' }, { status: 404 })
  const start = localDateTimeToDate(parsed.data.dateTime, business.timezone)
  if (!start || start <= new Date()) return NextResponse.json({ success: false, error: 'Yeni vaxt gələcəkdə olmalıdır.' }, { status: 400 })
  const [booking] = await db.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.businessId, user.businessId), eq(bookings.customerId, user.customerId))).limit(1)
  if (!booking) return NextResponse.json({ success: false, error: 'Rezervasiya tapılmadı.' }, { status: 404 })
  if (!['pending', 'confirmed'].includes(booking.status)) return NextResponse.json({ success: false, error: 'Bu rezervasiya dəyişdirilə bilməz.' }, { status: 409 })
  const windowMinutes = Number(await getSetting(user.businessId, 'reschedule_window_minutes', '120'))
  if (booking.dateTime.getTime() - Date.now() < windowMinutes * 60_000) return NextResponse.json({ success: false, error: 'Bu rezervasiyanı artıq dəyişdirmək mümkün deyil.' }, { status: 409 })

  const [service] = await db.select({ duration: services.duration }).from(services).where(and(eq(services.id, booking.serviceId), eq(services.businessId, user.businessId), eq(services.status, 'active'))).limit(1)
  const [barber] = await db.select({ id: barbers.id }).from(barbers).where(and(eq(barbers.id, parsed.data.barberId), eq(barbers.businessId, user.businessId), eq(barbers.status, 'active'))).limit(1)
  if (!service || !barber) return NextResponse.json({ success: false, error: 'Seçilmiş xidmət və ya usta artıq mövcud deyil.' }, { status: 409 })
  const windowCheck = await validateBookingWindow({ businessId: user.businessId, barberId: barber.id, serviceDuration: service.duration, start })
  if (!windowCheck.ok) return NextResponse.json({ success: false, error: windowCheck.reason }, { status: 409 })
  if (await hasBookingConflict(user.businessId, barber.id, start, windowCheck.end, booking.id)) return NextResponse.json({ success: false, error: 'Bu yeni vaxt artıq tutulub.' }, { status: 409 })

  try {
    await db.update(bookings).set({ barberId: barber.id, dateTime: start, endDateTime: windowCheck.end }).where(and(eq(bookings.id, booking.id), eq(bookings.businessId, user.businessId), eq(bookings.customerId, user.customerId)))
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23P01') return NextResponse.json({ success: false, error: 'Bu yeni vaxt artıq tutulub.' }, { status: 409 })
    console.error('POST /api/bookings/[id]/reschedule', error)
    return NextResponse.json({ success: false, error: 'Rezervasiya dəyişdirilə bilmədi.' }, { status: 500 })
  }
}
