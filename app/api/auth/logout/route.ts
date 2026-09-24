import { NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth'

export async function POST() {
  try {
    await destroySession()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/auth/logout', error)
    return NextResponse.json({ success: false, error: 'Çıxış zamanı xəta baş verdi.' }, { status: 500 })
  }
}
