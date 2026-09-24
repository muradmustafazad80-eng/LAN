import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bookings } from '@/lib/schema'
import { getCurrentUser, isValidUuid } from '@/lib/auth'
import { getSetting } from '@/lib/booking-rules'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Giriş tələb olunur.' }, { status: 401 })
  if (user.role !== 'customer' || !user.customerId) return NextResponse.json({ success: false, error: 'Bu əməliyyata icazəniz yoxdur.' }, { status: 403 })
  const { id } = await params
  if (!isValidUuid(id)) return NextResponse.json({ success: false, error: 'Rezervasiya nömrəsi düzgün deyil.' }, { status: 400 })
  const [booking] = await db.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.businessId, user.businessId), eq(bookings.customerId, user.customerId))).limit(1)
  if (!booking) return NextResponse.json({ success: false, error: 'Rezervasiya tapılmadı.' }, { status: 404 })
  if (!['pending', 'confirmed'].includes(booking.status)) return NextResponse.json({ success: false, error: 'Bu rezervasiya artıq dəyişdirilə və ya ləğv edilə bilməz.' }, { status: 409 })
  const windowMinutes = Number(await getSetting(user.businessId, 'cancellation_window_minutes', '120'))
  if (booking.dateTime.getTime() - Date.now() < windowMinutes * 60_000) return NextResponse.json({ success: false, error: 'Rezervasiyanı bu vaxta qədər ləğv etmək artıq mümkün deyil.' }, { status: 409 })
  await db.update(bookings).set({ status: 'cancelled' }).where(and(eq(bookings.id, booking.id), eq(bookings.businessId, user.businessId), eq(bookings.customerId, user.customerId)))
  return NextResponse.json({ success: true })
}
