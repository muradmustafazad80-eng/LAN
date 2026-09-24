import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { bookings } from '@/lib/schema'
import { getCurrentUser, isValidUuid } from '@/lib/auth'

const schema = z.object({ status: z.enum(['confirmed', 'completed', 'cancelled']) })

const allowed: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Giriş tələb olunur.' }, { status: 401 })
  if (user.role !== 'admin' && user.role !== 'barber') return NextResponse.json({ success: false, error: 'Bu əməliyyata icazəniz yoxdur.' }, { status: 403 })
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Sorğu məlumatı düzgün deyil.' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Status düzgün deyil.' }, { status: 400 })
  const { id } = await params
  if (!isValidUuid(id)) return NextResponse.json({ success: false, error: 'Rezervasiya nömrəsi düzgün deyil.' }, { status: 400 })
  const filters = [eq(bookings.id, id), eq(bookings.businessId, user.businessId)]
  if (user.role === 'barber') {
    if (!user.barberId) return NextResponse.json({ success: false, error: 'Usta profili tapılmadı.' }, { status: 403 })
    filters.push(eq(bookings.barberId, user.barberId))
  }
  const [booking] = await db.select({ id: bookings.id, status: bookings.status }).from(bookings).where(and(...filters)).limit(1)
  if (!booking) return NextResponse.json({ success: false, error: 'Rezervasiya tapılmadı.' }, { status: 404 })
  if (!allowed[booking.status]?.includes(parsed.data.status)) return NextResponse.json({ success: false, error: 'Bu status dəyişikliyinə icazə verilmir.' }, { status: 409 })
  const updateFilters = [eq(bookings.id, id), eq(bookings.businessId, user.businessId)]
  if (user.role === 'barber' && user.barberId) updateFilters.push(eq(bookings.barberId, user.barberId))
  await db.update(bookings).set({ status: parsed.data.status }).where(and(...updateFilters))
  return NextResponse.json({ success: true, status: parsed.data.status })
}
