import { NextResponse } from 'next/server'
import { getActiveBarbers } from '@/lib/data/public'

export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get('businessSlug') || 'kral-barber'
    return NextResponse.json(await getActiveBarbers(slug))
  } catch (error) {
    console.error('GET /api/barbers', error)
    return NextResponse.json({ success: false, error: 'Ustalar yüklənmədi.' }, { status: 500 })
  }
}
