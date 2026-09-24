import { NextResponse } from 'next/server'
import { createBooking } from '@/app/actions/bookings'

export async function POST(request: Request) {
  try {
    const result = await createBooking(await request.json())
    const status = result.success ? 201 : result.code === 'VALIDATION_ERROR' ? 400 : result.code === 'UNAVAILABLE' || result.code === 'CONFLICT' ? 409 : result.code === 'NOT_FOUND' ? 404 : result.code === 'UNAUTHORIZED' ? 401 : result.code === 'FORBIDDEN' ? 403 : result.code === 'RATE_LIMITED' ? 429 : 500
    return NextResponse.json(result, { status })
  } catch (error) {
    console.error('POST /api/bookings', error)
    return NextResponse.json({ success: false, error: 'Sorğu düzgün deyil.', code: 'VALIDATION_ERROR' }, { status: 400 })
  }
}
