import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { barbers, services, businessSettings } from '@/lib/schema'
import { getAvailableSlots } from '@/lib/booking-rules'
import { consumeRateLimit } from '@/lib/rate-limit'

const schema = z.object({ barberId: z.string().uuid(), serviceId: z.string().uuid(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), businessSlug: z.string().default('kral-barber') })

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams
    const parsed = schema.safeParse({ barberId: params.get('barberId'), serviceId: params.get('serviceId'), date: params.get('date'), businessSlug: params.get('businessSlug') || 'kral-barber' })
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Vaxt məlumatları düzgün deyil.' }, { status: 400 })
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!(await consumeRateLimit(`availability:${ip}`, 60))) return NextResponse.json({ success: false, error: 'Çox sayda sorğu göndərildi.' }, { status: 429 })

    const business = await db.query.businesses.findFirst({ where: (t, { and, eq }) => and(eq(t.slug, parsed.data.businessSlug), eq(t.status, 'active')) })
    if (!business) return NextResponse.json({ success: false, error: 'Biznes tapılmadı.' }, { status: 404 })
    const setting = await db.select({ value: businessSettings.value }).from(businessSettings).where(and(eq(businessSettings.businessId, business.id), eq(businessSettings.key, 'slot_interval_minutes'))).limit(1)
    const slotInterval = Number(setting[0]?.value || '30')
    const [barber] = await db.select({ id: barbers.id }).from(barbers).where(and(eq(barbers.id, parsed.data.barberId), eq(barbers.businessId, business.id), eq(barbers.status, 'active'))).limit(1)
    const [service] = await db.select({ duration: services.duration }).from(services).where(and(eq(services.id, parsed.data.serviceId), eq(services.businessId, business.id), eq(services.status, 'active'))).limit(1)
    if (!barber || !service) return NextResponse.json({ success: false, error: 'Usta və ya xidmət tapılmadı.' }, { status: 404 })

    return NextResponse.json({ success: true, date: parsed.data.date, slots: await getAvailableSlots(business.id, barber.id, service.duration, parsed.data.date, slotInterval) })
  } catch (error) {
    console.error('GET /api/availability', error)
    return NextResponse.json({ success: false, error: 'Boş vaxtlar yüklənmədi.' }, { status: 500 })
  }
}
