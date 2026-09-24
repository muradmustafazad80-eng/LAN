import crypto from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { businesses, customers, users } from '@/lib/schema'
import { createSession, getBusinessBySlug, hashPassword, normalizeEmail } from '@/lib/auth'

const GOOGLE_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com'])
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

type GoogleClaims = {
  iss: string
  aud: string
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
  exp?: number
  iat?: number
  nonce?: string
}

type GoogleJwks = {
  keys: Array<Record<string, unknown>>
}

function base64urlDecode(value: string) {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4), 'base64')
}

function base64urlEncode(value: Buffer) {
  return value.toString('base64url')
}

function randomString(bytes = 32) {
  return base64urlEncode(crypto.randomBytes(bytes))
}


function getPublicOrigin(request: Request) {
  const headers = request.headers
  const forwardedHost = headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const forwardedProto = headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  if (forwardedHost) {
    const protocol = forwardedProto || 'https'
    return `${protocol}://${forwardedHost}`
  }
  return new URL(request.url).origin
}

function getGoogleConfig(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || new URL('/api/auth/google/callback', `${getPublicOrigin(request)}/`).toString()
  if (!clientId || !clientSecret) throw new Error('GOOGLE_OAUTH_NOT_CONFIGURED')
  return { clientId, clientSecret, redirectUri }
}

export function createGoogleAuthorizationUrl(request: Request, businessSlug: string) {
  const { clientId, redirectUri } = getGoogleConfig(request)
  const state = randomString()
  const nonce = randomString()
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('state', state)
  url.searchParams.set('nonce', nonce)
  url.searchParams.set('prompt', 'select_account')
  url.searchParams.set('access_type', 'online')
  url.searchParams.set('include_granted_scopes', 'true')
  return { url, state, nonce, businessSlug }
}

async function exchangeCode(code: string, request: Request) {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig(request)
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('GOOGLE_TOKEN_EXCHANGE_FAILED')
  const data = await response.json() as { id_token?: string }
  if (!data.id_token) throw new Error('GOOGLE_ID_TOKEN_MISSING')
  return data.id_token
}

async function fetchGoogleJwks() {
  const response = await fetch(GOOGLE_JWKS_URL, { cache: 'no-store' })
  if (!response.ok) throw new Error('GOOGLE_JWKS_FETCH_FAILED')
  return await response.json() as GoogleJwks
}

async function verifyGoogleIdToken(idToken: string, expectedNonce: string, request: Request) {
  const { clientId } = getGoogleConfig(request)
  const [headerPart, payloadPart, signaturePart] = idToken.split('.')
  if (!headerPart || !payloadPart || !signaturePart) throw new Error('GOOGLE_ID_TOKEN_INVALID')

  const header = JSON.parse(base64urlDecode(headerPart).toString('utf8')) as { alg?: string; kid?: string; typ?: string }
  const claims = JSON.parse(base64urlDecode(payloadPart).toString('utf8')) as GoogleClaims
  if (header.alg !== 'RS256' || !header.kid) throw new Error('GOOGLE_ID_TOKEN_ALG_INVALID')
  if (!GOOGLE_ISSUERS.has(claims.iss)) throw new Error('GOOGLE_ID_TOKEN_ISSUER_INVALID')
  if (claims.aud !== clientId) throw new Error('GOOGLE_ID_TOKEN_AUDIENCE_INVALID')
  if (claims.nonce !== expectedNonce) throw new Error('GOOGLE_ID_TOKEN_NONCE_INVALID')
  if (!claims.sub || !claims.email || claims.email_verified !== true) throw new Error('GOOGLE_IDENTITY_NOT_VERIFIED')
  if (!claims.exp || claims.exp * 1000 <= Date.now()) throw new Error('GOOGLE_ID_TOKEN_EXPIRED')

  const jwks = await fetchGoogleJwks()
  const jwk = jwks.keys.find((key) => key.kid === header.kid)
  if (!jwk) throw new Error('GOOGLE_SIGNING_KEY_NOT_FOUND')
  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' })
  const verified = crypto.verify(
    'RSA-SHA256',
    Buffer.from(`${headerPart}.${payloadPart}`),
    publicKey,
    base64urlDecode(signaturePart),
  )
  if (!verified) throw new Error('GOOGLE_ID_TOKEN_SIGNATURE_INVALID')

  return claims
}

export async function finishGoogleLogin({ code, expectedNonce, businessSlug, request, requiredRole }: { code: string; expectedNonce: string; businessSlug: string; request: Request; requiredRole?: 'admin' }) {
  const [business] = await getBusinessBySlug(businessSlug)
  if (!business) throw new Error('BUSINESS_NOT_FOUND')

  const idToken = await exchangeCode(code, request)
  const claims = await verifyGoogleIdToken(idToken, expectedNonce, request)
  const email = normalizeEmail(claims.email!)

  const existingByGoogle = await db.select({ id: users.id, businessId: users.businessId, role: users.role }).from(users)
    .where(and(eq(users.businessId, business.id), eq(users.googleSubject, claims.sub))).limit(1)

  let user = existingByGoogle[0]
  if (!user) {
    const existingByEmail = await db.select({ id: users.id, businessId: users.businessId, role: users.role, googleSubject: users.googleSubject })
      .from(users).where(and(eq(users.businessId, business.id), eq(users.email, email))).limit(1)

    if (existingByEmail[0]) {
      user = existingByEmail[0]
      if (requiredRole && user.role !== requiredRole) throw new Error('ADMIN_REQUIRED')
      if (existingByEmail[0].googleSubject && existingByEmail[0].googleSubject !== claims.sub) throw new Error('GOOGLE_EMAIL_LINK_CONFLICT')
      await db.update(users).set({ googleSubject: claims.sub, updatedAt: new Date() }).where(and(eq(users.id, user.id), eq(users.businessId, business.id)))
    } else {
      if (requiredRole) throw new Error('ADMIN_REQUIRED')
      const passwordHash = await hashPassword(randomString(48))
      const name = (claims.name || email.split('@')[0]).trim().slice(0, 100) || 'Google istifadəçisi'
      user = await db.transaction(async (tx) => {
        const created = await tx.insert(users).values({
          businessId: business.id,
          email,
          passwordHash,
          googleSubject: claims.sub,
          role: 'customer',
        }).returning({ id: users.id, businessId: users.businessId, role: users.role })
        if (!created[0]) throw new Error('USER_CREATE_FAILED')
        await tx.insert(customers).values({
          businessId: business.id,
          userId: created[0].id,
          name,
          phone: `google:${claims.sub}`,
        })
        return created[0]
      })
    }
  }

  if (!['customer', 'barber', 'admin'].includes(user.role)) throw new Error('INVALID_ROLE')
  if (requiredRole && user.role !== requiredRole) throw new Error('ADMIN_REQUIRED')
  await createSession(user.id, user.businessId)
  return { role: user.role as 'customer' | 'barber' | 'admin' }
}

export function isGoogleAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim())
}
