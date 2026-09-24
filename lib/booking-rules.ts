// @ts-nocheck
import { and, eq, gt, lt, ne, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { barberBlockedPeriods, barberSchedules, bookings, businessHours, businessSettings } from '@/lib/schema'
import { addMinutes, dateToLocalParts, getZonedDateAndTime, localDateTimeToDate, minutesFromTime } from '@/lib/time'

export async function getSetting(businessId: string, key: string, fallback: string) {
  const rows = await db.select({ value: businessSettings.value }).from(businessSettings).where(and(eq(businessSettings.businessId, businessId), eq(businessSettings.key, key))).limit(1)
  return rows[0]?.value ?? fallback
}

export async function getScheduleForDate(businessId: string, barberId: string, start: Date) {
  const business = await db.query.businesses.findFirst({ where: (t, { eq }) => eq(t.id, businessId) })
  if (!business) return { business: null, barber: null }
  const zoned = getZonedDateAndTime(start, business.timezone)
  const [businessHourRows, barberScheduleRows] = await Promise.all([
    db.select().from(businessHours).where(and(eq(businessHours.businessId, businessId), eq(businessHours.weekday, zoned.weekday))).limit(1),
    db.select().from(barberSchedules).where(and(eq(barberSchedules.barberId, barberId), eq(barberSchedules.weekday, zoned.weekday))).limit(1),
  ])
  const businessHour = businessHourRows[0] ?? null
  const barberSchedule = barberScheduleRows[0] ?? null
  return {
    business: businessHour ? { ...businessHour, timezone: business.timezone } : null,
    barber: barberSchedule,
    timezone: business.timezone,
  }
}

export async function validateBookingWindow(input: { businessId: string; barberId: string; serviceDuration: number; start: Date }) {
  const end = addMinutes(input.start, input.serviceDuration)

  const schedule = await getScheduleForDate(input.businessId, input.barberId, input.start)
  if (!schedule.business || !schedule.business.isOpen || !schedule.barber || !schedule.barber.isWorking) return { ok: false as const, reason: 'Bu gün üçün xidmət mümkün deyil.' }

  const startParts = getZonedDateAndTime(input.start, schedule.timezone)
  const endParts = getZonedDateAndTime(end, schedule.timezone)
  if (startParts.date !== endParts.date) return { ok: false as const, reason: 'Xidmət seçilmiş iş saatlarına sığmır.' }

  const startMinutes = minutesFromTime(startParts.time)
  const endMinutes = minutesFromTime(endParts.time)
  const businessStart = minutesFromTime(schedule.business.startTime)
  const businessEnd = minutesFromTime(schedule.business.endTime)
  const barberStart = minutesFromTime(schedule.barber.startTime)
  const barberEnd = minutesFromTime(schedule.barber.endTime)
  if (startMinutes < businessStart || endMinutes > businessEnd || startMinutes < barberStart || endMinutes > barberEnd) {
    return { ok: false as const, reason: 'Seçilmiş vaxt iş saatlarına uyğun deyil.' }
  }

  const blocked = await db.select({ id: barberBlockedPeriods.id }).from(barberBlockedPeriods).where(and(
    eq(barberBlockedPeriods.businessId, input.businessId),
    eq(barberBlockedPeriods.barberId, input.barberId),
    lt(barberBlockedPeriods.startsAt, end),
    gt(barberBlockedPeriods.endsAt, input.start),
  )).limit(1)
  if (blocked[0]) return { ok: false as const, reason: 'Seçilmiş vaxt bu usta üçün bağlıdır.' }

  return { ok: true as const, end, timezone: schedule.timezone }
}

export async function hasBookingConflict(businessId: string, barberId: string, start: Date, end: Date, excludeBookingId?: string) {
  const filters = [
    eq(bookings.businessId, businessId),
    eq(bookings.barberId, barberId),
    or(eq(bookings.status, 'pending'), eq(bookings.status, 'confirmed')),
    lt(bookings.dateTime, end),
    gt(bookings.endDateTime, start),
  ]
  if (excludeBookingId) filters.push(ne(bookings.id, excludeBookingId))
  const existing = await db.select({ id: bookings.id }).from(bookings).where(and(...filters)).limit(1)
  return Boolean(existing[0])
}

export async function getAvailableSlots(businessId: string, barberId: string, serviceDuration: number, dateString: string, slotInterval = 30) {
  const business = await db.query.businesses.findFirst({ where: (t, { eq }) => eq(t.id, businessId) })
  if (!business) return []
  const dayStart = localDateTimeToDate(`${dateString}T00:00:00`, business.timezone)
  if (!dayStart) return []

  const zonedDay = getZonedDateAndTime(dayStart, business.timezone)
  const { business: scheduleBusiness, barber } = await getScheduleForDate(businessId, barberId, dayStart)
  if (!scheduleBusiness || !scheduleBusiness.isOpen || !barber || !barber.isWorking) return []

  const startMinutes = Math.max(minutesFromTime(scheduleBusiness.startTime), minutesFromTime(barber.startTime))
  const endMinutes = Math.min(minutesFromTime(scheduleBusiness.endTime), minutesFromTime(barber.endTime))
  const windowStart = addMinutes(dayStart, startMinutes)
  const windowEnd = addMinutes(dayStart, endMinutes)
  const slots: string[] = []
  const existing = await db.select({ dateTime: bookings.dateTime, endDateTime: bookings.endDateTime }).from(bookings).where(and(
    eq(bookings.businessId, businessId),
    eq(bookings.barberId, barberId),
    or(eq(bookings.status, 'pending'), eq(bookings.status, 'confirmed')),
    lt(bookings.dateTime, windowEnd),
    gt(bookings.endDateTime, windowStart),
  ))
  const blocked = await db.select({ startsAt: barberBlockedPeriods.startsAt, endsAt: barberBlockedPeriods.endsAt }).from(barberBlockedPeriods).where(and(
    eq(barberBlockedPeriods.businessId, businessId),
    eq(barberBlockedPeriods.barberId, barberId),
    lt(barberBlockedPeriods.startsAt, windowEnd),
    gt(barberBlockedPeriods.endsAt, windowStart),
  ))

  const now = new Date()
  const safeInterval = Math.min(Math.max(Number.isFinite(slotInterval) ? Math.floor(slotInterval) : 30, 5), 60)
  for (let minute = startMinutes; minute + serviceDuration <= endMinutes; minute += safeInterval) {
    const localHour = Math.floor(minute / 60)
    const localMinute = minute % 60
    const hh = String(localHour).padStart(2, '0')
    const mm = String(localMinute).padStart(2, '0')
    const candidate = localDateTimeToDate(`${zonedDay.date}T${hh}:${mm}:00`, business.timezone)
    if (!candidate) continue
    const end = addMinutes(candidate, serviceDuration)
    if (candidate <= now) continue
    const conflict = existing.some((item) => item.dateTime < end && item.endDateTime > candidate) || blocked.some((item) => item.startsAt < end && item.endsAt > candidate)
    if (!conflict) slots.push(`${hh}:${mm}`)
  }
  return slots
}
