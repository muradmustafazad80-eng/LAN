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

function getOrigin(request: Request) {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https'
  return forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(request.url).origin
}

export async function GET(request: Request) {
  const store = await cookies()
  const origin = getOrigin(request)
  const state = store.get(STATE_COOKIE)?.value
  const nonce = store.get(NONCE_COOKIE)?.value
  const businessSlug = store.get(BUSINESS_COOKIE)?.value || 'kral-barber'
  const adminOnly = store.get(ADMIN_COOKIE)?.value === '1'
  const loginPath = adminOnly ? '/admin/login' : '/login'

  const clearCookies = (response: NextResponse) => {
    for (const name of [STATE_COOKIE, NONCE_COOKIE, BUSINESS_COOKIE, ADMIN_COOKIE]) response.cookies.delete(name)
    response.headers.set('Cache-Control', 'no-store')
    return response
  }

  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const returnedState = url.searchParams.get('state')
    if (url.searchParams.get('error')) return clearCookies(NextResponse.redirect(new URL(`${loginPath}?google_error=google_cancelled`, origin)))
    if (!code || !returnedState || !state || !nonce || returnedState !== state) {
      return clearCookies(NextResponse.redirect(new URL(`${loginPath}?google_error=state_invalid`, origin)))
    }

    const result = await finishGoogleLogin({ code, expectedNonce: nonce, businessSlug, request, requiredRole: adminOnly ? 'admin' : undefined })
    const destination = result.role === 'admin' ? '/admin' : result.role === 'barber' ? '/barber' : '/account'
    return clearCookies(NextResponse.redirect(new URL(destination, origin)))
  } catch (error) {
    console.error('GET /api/auth/callback/google', error)
    const code = errorCode(error)
    return clearCookies(NextResponse.redirect(new URL(`${code === 'admin_required' ? '/admin/login' : '/login'}?google_error=${encodeURIComponent(code)}`, origin)))
  }
}
