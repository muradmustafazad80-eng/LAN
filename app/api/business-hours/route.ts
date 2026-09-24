import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { businessHours } from '@/lib/schema'
import { getBusinessBySlug } from '@/lib/auth'
import { getZonedDateAndTime, minutesFromTime } from '@/lib/time'
import { getDefaultBusinessHours } from '@/lib/business-hours'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('businessSlug')?.trim() || 'kral-barber'

  try {
    const [business] = await getBusinessBySlug(slug)
    if (!business) {
      return NextResponse.json({ success: false, error: 'Biznes tapılmadı.' }, { status: 404 })
    }

    const zonedNow = getZonedDateAndTime(new Date(), business.timezone)
    const fallback = getDefaultBusinessHours(zonedNow.weekday)
    const [today] = await db
      .select({
        weekday: businessHours.weekday,
        startTime: businessHours.startTime,
        endTime: businessHours.endTime,
        isOpen: businessHours.isOpen,
      })
      .from(businessHours)
      .where(and(eq(businessHours.businessId, business.id), eq(businessHours.weekday, zonedNow.weekday)))
      .limit(1)

    const startTime = today?.startTime?.slice(0, 5) || fallback.startTime
    const endTime = today?.endTime?.slice(0, 5) || fallback.endTime
    const isScheduledOpen = today?.isOpen ?? fallback.isOpen
    const currentMinutes = minutesFromTime(zonedNow.time)
    const isOpenNow = isScheduledOpen && currentMinutes >= minutesFromTime(startTime) && currentMinutes < minutesFromTime(endTime)

    return NextResponse.json({
      success: true,
      isOpen: isOpenNow,
      startTime,
      endTime,
      timezone: business.timezone,
      weekday: zonedNow.weekday,
      live: Boolean(today),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('GET /api/business-hours', error)
    const zonedFallback = getZonedDateAndTime(new Date(), 'Asia/Baku')
    const weekday = zonedFallback.weekday
    const fallback = getDefaultBusinessHours(weekday)
    const nowMinutes = minutesFromTime(zonedFallback.time)
    const isOpen = fallback.isOpen && nowMinutes >= minutesFromTime(fallback.startTime) && nowMinutes < minutesFromTime(fallback.endTime)
    return NextResponse.json({
      success: true,
      isOpen,
      startTime: fallback.startTime,
      endTime: fallback.endTime,
      timezone: 'Asia/Baku',
      weekday,
      live: false,
      fallback: true,
    }, { headers: { 'Cache-Control': 'no-store' } })
  }
}
