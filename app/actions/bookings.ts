'use server'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { barbers, bookings, customers, services } from '@/lib/schema'
import { getCurrentUser, isValidAzerbaijaniPhone, normalizePhone } from '@/lib/auth'
import { consumeRateLimit } from '@/lib/rate-limit'
import { hasBookingConflict, validateBookingWindow } from '@/lib/booking-rules'
import { localDateTimeToDate } from '@/lib/time'

const bookingSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim().refine(isValidAzerbaijaniPhone, 'Düzgün Azərbaycan mobil nömrəsi daxil edin.'),
  barberId: z.string().uuid(),
  serviceId: z.string().uuid(),
  dateTime: z.string().datetime({ local: true }),
  businessSlug: z.string().trim().min(2).max(80).default('kral-barber'),
})

export type CreateBookingInput = z.infer<typeof bookingSchema>
type BookingResult = { success: true; bookingId: string } | { success: false; error: string; code: string }

export async function createBooking(input: CreateBookingInput): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Rezervasiya məlumatları düzgün deyil.', code: 'VALIDATION_ERROR' }
  try {
    const user = await getCurrentUser()
    if (user?.role === 'customer' && !(await consumeRateLimit(`booking:user:${user.id}`, 6))) return { success: false, error: 'Çox sayda rezervasiya cəhdi edildi. Bir az sonra yenidən yoxlayın.', code: 'RATE_LIMITED' }

    const business = await db.query.businesses.findFirst({ where: (t, { and, eq }) => and(eq(t.slug, parsed.data.businessSlug), eq(t.status, 'active')) })
    if (!business) return { success: false, error: 'Biznes tapılmadı.', code: 'NOT_FOUND' }

    const start = localDateTimeToDate(parsed.data.dateTime, business.timezone)
    if (!start || start <= new Date()) return { success: false, error: 'Rezervasiya vaxtı keçmiş tarix ola bilməz.', code: 'VALIDATION_ERROR' }
    if (user && (user.role !== 'customer' || user.businessId !== business.id)) return { success: false, error: 'Bu biznes üçün rezervasiya etməyə icazəniz yoxdur.', code: 'FORBIDDEN' }

    const serviceRows = await db.select({ id: services.id, name: services.name, price: services.price, duration: services.duration }).from(services).where(and(eq(services.id, parsed.data.serviceId), eq(services.businessId, business.id), eq(services.status, 'active'))).limit(1)
    const barberRows = await db.select({ id: barbers.id, name: barbers.name }).from(barbers).where(and(eq(barbers.id, parsed.data.barberId), eq(barbers.businessId, business.id), eq(barbers.status, 'active'))).limit(1)
    const service = serviceRows[0]
    const barber = barberRows[0]
    if (!service) return { success: false, error: 'Seçilmiş xidmət tapılmadı.', code: 'NOT_FOUND' }
    if (!barber) return { success: false, error: 'Seçilmiş usta tapılmadı.', code: 'NOT_FOUND' }

    const windowCheck = await validateBookingWindow({ businessId: business.id, barberId: barber.id, serviceDuration: service.duration, start })
    if (!windowCheck.ok) return { success: false, error: windowCheck.reason, code: 'UNAVAILABLE' }
    if (await hasBookingConflict(business.id, barber.id, start, windowCheck.end)) return { success: false, error: 'Bu vaxt artıq tutulub. Başqa vaxt seçin.', code: 'CONFLICT' }

    const normalizedPhone = normalizePhone(parsed.data.customerPhone)
    if (!(await consumeRateLimit(`booking:phone:${business.id}:${normalizedPhone}`, 6))) return { success: false, error: 'Bu telefon nömrəsi ilə çox sayda rezervasiya cəhdi edildi. Bir az sonra yenidən yoxlayın.', code: 'RATE_LIMITED' }
    try {
      const created = await db.transaction(async (tx) => {
        let customerId = user?.customerId || null
        if (customerId) {
          try {
            await tx.update(customers).set({ name: parsed.data.customerName, phone: normalizedPhone }).where(and(eq(customers.id, customerId), eq(customers.businessId, business.id)))
          } catch (error) {
            if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505') throw new Error('BOOKING_PHONE_CONFLICT')
            throw error
          }
        } else {
          const existing = await tx.select({ id: customers.id }).from(customers).where(and(eq(customers.businessId, business.id), eq(customers.phone, normalizedPhone))).limit(1)
          customerId = existing[0]?.id || null
          if (!customerId) {
            const insertedCustomer = await tx.insert(customers).values({ businessId: business.id, name: parsed.data.customerName, phone: normalizedPhone }).returning({ id: customers.id })
            customerId = insertedCustomer[0]?.id || null
          }
        }
        if (!customerId) throw new Error('BOOKING_CUSTOMER_FAILED')

        const inserted = await tx.insert(bookings).values({
          businessId: business.id,
          customerId,
          barberId: barber.id,
          serviceId: service.id,
          dateTime: start,
          endDateTime: windowCheck.end,
          price: service.price,
          status: 'pending',
        }).returning({ id: bookings.id })
        if (!inserted[0]) throw new Error('BOOKING_CREATE_FAILED')
        return inserted[0]
      })
      return { success: true, bookingId: created.id }
    } catch (error) {
      if (error instanceof Error && error.message === 'BOOKING_PHONE_CONFLICT') return { success: false, error: 'Bu telefon nömrəsi başqa müştəriyə bağlıdır.', code: 'CONFLICT' }
      if (error instanceof Error && 'code' in error) {
        const code = String((error as { code?: unknown }).code)
        if (code === '23P01') return { success: false, error: 'Bu vaxt artıq tutulub. Başqa vaxt seçin.', code: 'CONFLICT' }
        if (code === '42P01' || code === '42703') return { success: false, error: 'Rezervasiya bazası hazır deyil. Sistem administratoru bazanı yeniləməlidir.', code: 'DATABASE_NOT_READY' }
      }
      throw error
    }
  } catch (error) {
    const databaseCode = error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code)
      : ''
    console.error('createBooking', { code: databaseCode, error })
    if (databaseCode === '23P01' || databaseCode === '23505') {
      return { success: false, error: 'Bu vaxt artıq tutulub. Başqa vaxt seçin.', code: 'CONFLICT' }
    }
    if (databaseCode === '42P01' || databaseCode === '42703') {
      return { success: false, error: 'Rezervasiya bazası hazır deyil. Sistem administratoru bazanı yeniləməlidir.', code: 'DATABASE_NOT_READY' }
    }
    if (databaseCode === '23503' || databaseCode === '23514' || databaseCode === '23502' || databaseCode === '22P02') {
      return { success: false, error: 'Rezervasiya məlumatları bazanın qaydalarına uyğun deyil. Seçimləri yeniləyib yenidən yoxlayın.', code: 'VALIDATION_ERROR' }
    }
    return { success: false, error: 'Rezervasiya qeyd edilərkən server xətası baş verdi.', code: 'SERVER_ERROR' }
  }
}
