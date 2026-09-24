'use server'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { barbers, bookings, customers, services } from '@/lib/schema'
import { getCurrentUser, normalizePhone } from '@/lib/auth'
import { consumeRateLimit } from '@/lib/rate-limit'
import { hasBookingConflict, validateBookingWindow } from '@/lib/booking-rules'
import { localDateTimeToDate } from '@/lib/time'

const bookingSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/),
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
    if (!user) return { success: false, error: 'Rezervasiya etmək üçün əvvəlcə hesabınıza daxil olun.', code: 'UNAUTHORIZED' }
    if (user.role !== 'customer' || !user.customerId) return { success: false, error: 'Rezervasiyanı yalnız müştəri hesabı ilə yaratmaq olar.', code: 'FORBIDDEN' }
    if (user.businessId !== business.id) return { success: false, error: 'Bu biznes üçün girişiniz yoxdur.', code: 'FORBIDDEN' }

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
    const customerId = user.customerId
    if (!customerId) return { success: false, error: 'Müştəri profili tapılmadı.', code: 'FORBIDDEN' }

    try {
      const created = await db.transaction(async (tx) => {
        try {
          await tx.update(customers).set({ name: parsed.data.customerName, phone: normalizedPhone }).where(and(eq(customers.id, customerId), eq(customers.businessId, business.id)))
        } catch (error) {
          if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505') throw new Error('BOOKING_PHONE_CONFLICT')
          throw error
        }

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
      if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23P01') return { success: false, error: 'Bu vaxt artıq tutulub. Başqa vaxt seçin.', code: 'CONFLICT' }
      throw error
    }
  } catch (error) {
    console.error('createBooking', error)
    return { success: false, error: 'Rezervasiya qeyd edilərkən server xətası baş verdi.', code: 'SERVER_ERROR' }
  }
}
