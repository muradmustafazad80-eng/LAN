import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { finishGoogleLogin } from '@/lib/google-auth'

const STATE_COOKIE = 'kral_google_state'
const NONCE_COOKIE = 'kral_google_nonce'
const BUSINESS_COOKIE = 'kral_google_business'
const ADMIN_COOKIE = 'kral_google_admin'

function errorCode(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  if (message === 'BUSINESS_NOT_FOUND') return 'business_not_found'
  if (message === 'GOOGLE_EMAIL_LINK_CONFLICT') return 'account_link_conflict'
  if (message === 'ADMIN_REQUIRED') return 'admin_required'
  if (message === 'GOOGLE_OAUTH_NOT_CONFIGURED') return 'not_configured'
  if (message.includes('GOOGLE_ID_TOKEN') || message.includes('GOOGLE_IDENTITY')) return 'google_identity_invalid'
  return 'callback_failed'
}

export async function GET(request: Request) {
  const store = await cookies()
  const headers = request.headers
  const forwardedHost = headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const forwardedProto = headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https'
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(request.url).origin
  const redirectToLogin = (code: string, adminOnly = false) => NextResponse.redirect(new URL(`/${adminOnly ? 'admin/login' : 'login'}?google_error=${encodeURIComponent(code)}`, `${origin}/`))

  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const expectedState = store.get(STATE_COOKIE)?.value
    const expectedNonce = store.get(NONCE_COOKIE)?.value
    const businessSlug = store.get(BUSINESS_COOKIE)?.value || 'kral-barber'
    const adminOnly = store.get(ADMIN_COOKIE)?.value === '1'

    store.delete(STATE_COOKIE)
    store.delete(NONCE_COOKIE)
    store.delete(BUSINESS_COOKIE)
    store.delete(ADMIN_COOKIE)

    if (url.searchParams.get('error')) return redirectToLogin('google_cancelled', adminOnly)
    if (!code || !state || !expectedState || !expectedNonce || state !== expectedState) return redirectToLogin('state_invalid', adminOnly)

    const result = await finishGoogleLogin({ code, expectedNonce, businessSlug, request, requiredRole: adminOnly ? 'admin' : undefined })
    const destination = result.role === 'admin' ? '/admin' : result.role === 'barber' ? '/barber' : '/account'
    const response = NextResponse.redirect(new URL(destination, `${origin}/`))
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch (error) {
    console.error('GET /api/auth/google/callback', error)
    const code = errorCode(error)
    return NextResponse.redirect(new URL(`/${code === 'admin_required' ? 'admin/login' : 'login'}?google_error=${encodeURIComponent(code)}`, `${origin}/`))
  }
}
