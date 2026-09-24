import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { customers, users } from '@/lib/schema'
import { createSession, getBusinessBySlug, hashPassword, normalizeEmail, normalizePhone } from '@/lib/auth'
import { consumeRateLimit } from '@/lib/rate-limit'

const schema = z.object({
  name: z.string().trim().min(2, 'Ad, soyad ən azı 2 simvol olmalıdır.').max(100),
  email: z.string().trim().email('Düzgün e-poçt ünvanı daxil edin.').max(160),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,24}$/, 'Düzgün telefon nömrəsi daxil edin.'),
  password: z.string().min(8, 'Şifrə ən azı 8 simvol olmalıdır.').max(128),
  businessSlug: z.string().trim().min(2).max(80).optional(),
})

export async function POST(request: Request) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Göndərilən məlumat düzgün deyil.', code: 'INVALID_JSON' }, { status: 400 })
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Daxil etdiyiniz məlumatlar düzgün deyil.',
        code: 'VALIDATION_ERROR',
      }, { status: 400 })
    }

    const email = normalizeEmail(parsed.data.email)
    const phone = normalizePhone(parsed.data.phone)
    if (!phone || phone.length < 7) {
      return NextResponse.json({ success: false, error: 'Düzgün telefon nömrəsi daxil edin.', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const [business] = await getBusinessBySlug(parsed.data.businessSlug || 'kral-barber')
    if (!business) return NextResponse.json({ success: false, error: 'Biznes tapılmadı.', code: 'NOT_FOUND' }, { status: 404 })

    if (!(await consumeRateLimit(`register:${ip}`, 5)) || !(await consumeRateLimit(`register:${business.id}:${email}`, 5))) {
      return NextResponse.json({ success: false, error: 'Çox sayda cəhd edildi. Bir az sonra yenidən yoxlayın.', code: 'RATE_LIMITED' }, { status: 429 })
    }

    const existingUser = await db.select({ id: users.id, googleSubject: users.googleSubject }).from(users)
      .where(and(eq(users.email, email), eq(users.businessId, business.id))).limit(1)
    if (existingUser[0]) {
      return NextResponse.json({
        success: false,
        error: existingUser[0].googleSubject
          ? 'Bu e-poçt Google hesabı ilə artıq qeydiyyatdan keçib. Google ilə daxil olun.'
          : 'Bu e-poçt ilə hesab artıq mövcuddur.',
        code: 'CONFLICT',
      }, { status: 409 })
    }

    const existingCustomer = await db.select({ id: customers.id, userId: customers.userId })
      .from(customers)
      .where(and(eq(customers.businessId, business.id), eq(customers.phone, phone))).limit(1)
    if (existingCustomer[0]?.userId) {
      return NextResponse.json({ success: false, error: 'Bu telefon nömrəsi artıq başqa hesabla bağlıdır.', code: 'CONFLICT' }, { status: 409 })
    }

    const passwordHash = await hashPassword(parsed.data.password)
    const createdId = await db.transaction(async (tx) => {
      const created = await tx.insert(users).values({ businessId: business.id, email, passwordHash, role: 'customer' }).returning({ id: users.id })
      if (!created[0]) throw new Error('USER_CREATE_FAILED')

      if (existingCustomer[0]) {
        await tx.update(customers)
          .set({ userId: created[0].id, name: parsed.data.name })
          .where(and(eq(customers.id, existingCustomer[0].id), eq(customers.businessId, business.id)))
      } else {
        await tx.insert(customers).values({ businessId: business.id, userId: created[0].id, name: parsed.data.name, phone })
      }
      return created[0].id
    })

    await createSession(createdId, business.id)
    return NextResponse.json({ success: true, user: { email, role: 'customer' } }, { status: 201 })
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code) : ''
    if (code === '23505') return NextResponse.json({ success: false, error: 'Bu hesab və ya telefon nömrəsi artıq mövcuddur.', code: 'CONFLICT' }, { status: 409 })
    if (code === '42P01') return NextResponse.json({ success: false, error: 'Sistem verilənlər bazası yeniləməsini tamamlamayıb. Yenidən deploy edin.', code: 'DATABASE_NOT_READY' }, { status: 503 })
    console.error('POST /api/auth/register', error)
    return NextResponse.json({ success: false, error: 'Hesab yaradılarkən xəta baş verdi.', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
