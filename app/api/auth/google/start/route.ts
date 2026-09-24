import { NextResponse } from 'next/server'
import { createGoogleAuthorizationUrl, isGoogleAuthConfigured } from '@/lib/google-auth'
import { getBusinessBySlug } from '@/lib/auth'
import { cookies } from 'next/headers'

const STATE_COOKIE = 'kral_google_state'
const NONCE_COOKIE = 'kral_google_nonce'
const BUSINESS_COOKIE = 'kral_google_business'
const ADMIN_COOKIE = 'kral_google_admin'

export async function GET(request: Request) {
  try {
    if (!isGoogleAuthConfigured()) {
      return NextResponse.redirect(new URL('/login?google_error=not_configured', request.url))
    }
    const url = new URL(request.url)
    const businessSlug = url.searchParams.get('business')?.trim() || 'kral-barber'
    const adminOnly = url.searchParams.get('admin') === '1'
    const [business] = await getBusinessBySlug(businessSlug)
    if (!business) return NextResponse.redirect(new URL('/login?google_error=business_not_found', request.url))

    const auth = createGoogleAuthorizationUrl(request, business.slug)
    const response = NextResponse.redirect(auth.url)
    const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 10 * 60 }
    response.cookies.set(STATE_COOKIE, auth.state, cookieOptions)
    response.cookies.set(NONCE_COOKIE, auth.nonce, cookieOptions)
    response.cookies.set(BUSINESS_COOKIE, auth.businessSlug, cookieOptions)
    response.cookies.set(ADMIN_COOKIE, adminOnly ? '1' : '0', cookieOptions)
    return response
  } catch (error) {
    console.error('GET /api/auth/google/start', error)
    return NextResponse.redirect(new URL('/login?google_error=start_failed', request.url))
  }
}
