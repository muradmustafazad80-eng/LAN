import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { createSession, getBusinessBySlug, normalizeEmail, verifyPassword } from '@/lib/auth'
import { consumeRateLimit } from '@/lib/rate-limit'

const schema = z.object({ email: z.string().trim().email().max(160), password: z.string().min(1).max(128), businessSlug: z.string().trim().min(2).max(80).optional(), adminOnly: z.boolean().optional() })

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ success: false, error: 'E-poçt və şifrə düzgün daxil edilməyib.', code: 'VALIDATION_ERROR' }, { status: 400 })
    const email = normalizeEmail(parsed.data.email)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const [business] = await getBusinessBySlug(parsed.data.businessSlug || 'kral-barber')
    if (!business) return NextResponse.json({ success: false, error: 'Biznes tapılmadı.', code: 'NOT_FOUND' }, { status: 404 })
    if (!(await consumeRateLimit(`login:${ip}`, 10)) || !(await consumeRateLimit(`login:${business.id}:${email}`, 8))) {
      return NextResponse.json({ success: false, error: 'Çox sayda giriş cəhdi edildi. Bir az sonra yenidən yoxlayın.', code: 'RATE_LIMITED' }, { status: 429 })
    }

    const rows = await db.select({ id: users.id, businessId: users.businessId, passwordHash: users.passwordHash, role: users.role }).from(users).where(and(eq(users.email, email), eq(users.businessId, business.id))).limit(1)
    const user = rows[0]
    if (!user || !['customer', 'barber', 'admin'].includes(user.role) || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ success: false, error: 'E-poçt və ya şifrə yanlışdır.', code: 'INVALID_CREDENTIALS' }, { status: 401 })
    }
    if (parsed.data.adminOnly && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Bu giriş yalnız idarəçi hesabı üçündür.', code: 'ADMIN_REQUIRED' }, { status: 403 })
    }

    await createSession(user.id, user.businessId)
    return NextResponse.json({ success: true, user: { email, role: user.role } })
  } catch (error) {
    console.error('POST /api/auth/login', error)
    return NextResponse.json({ success: false, error: 'Giriş zamanı xəta baş verdi.', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
