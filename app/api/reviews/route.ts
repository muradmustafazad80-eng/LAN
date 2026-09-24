import { NextResponse } from 'next/server'
import { getReviews } from '@/lib/data/public'

export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get('businessSlug') || 'kral-barber'
    return NextResponse.json(await getReviews(slug))
  } catch (error) {
    console.error('GET /api/reviews', error)
    return NextResponse.json({ success: false, error: 'Rəylər yüklənmədi.' }, { status: 500 })
  }
}
