import { NextResponse } from 'next/server'
import { getServices } from '@/lib/data/public'

export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get('businessSlug') || 'kral-barber'
    return NextResponse.json(await getServices(slug))
  } catch (error) {
    console.error('GET /api/services', error)
    return NextResponse.json({ success: false, error: 'Xidmətlər yüklənmədi.' }, { status: 500 })
  }
}
