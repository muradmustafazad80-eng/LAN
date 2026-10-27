import { NextResponse } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bookings, barbers, services } from '@/lib/schema'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Giriş tələb olunur.' }, { status: 401 })
    if (user.role !== 'customer' || !user.customerId) return NextResponse.json({ success: false, error: 'Bu bölməyə giriş icazəniz yoxdur.' }, { status: 403 })

    const rows = await db.select({
    id: bookings.id,
    dateTime: bookings.dateTime,
    endDateTime: bookings.endDateTime,
    status: bookings.status,
    price: bookings.price,
    barberName: barbers.name,
    barberId: bookings.barberId,
    serviceId: bookings.serviceId,
    serviceName: services.name,
    duration: services.duration,
  }).from(bookings)
    .leftJoin(barbers, and(eq(bookings.barberId, barbers.id), eq(barbers.businessId, user.businessId)))
    .leftJoin(services, and(eq(bookings.serviceId, services.id), eq(services.businessId, user.businessId)))
    .where(and(eq(bookings.businessId, user.businessId), eq(bookings.customerId, user.customerId)))
    .orderBy(desc(bookings.dateTime))

    return NextResponse.json({ success: true, bookings: rows })
  } catch (error) {
    console.error('GET /api/me/bookings', error)
    return NextResponse.json({ success: false, error: 'Rezervasiyalar yüklənə bilmədi.' }, { status: 500 })
  }
}
