export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getBusinessSettings } from '@/lib/data/public'

export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get('businessSlug') || 'kral-barber'
    return NextResponse.json(await getBusinessSettings(slug))
  } catch (error) {
    console.error('GET /api/business-settings', error)
    return NextResponse.json({ success: false, error: 'Biznes məlumatları yüklənmədi.' }, { status: 500 })
  }
}
