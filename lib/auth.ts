import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { and, eq, gt, lt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { businesses, customers, sessions, users } from '@/lib/schema'

const SESSION_COOKIE = 'kral_session'
const SESSION_DAYS = 7

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export type AuthUser = {
  id: string
  businessId: string
  email: string
  role: 'customer' | 'barber' | 'admin'
  customerId: string | null
  barberId: string | null
  businessSlug: string
  businessName: string
  businessTimezone: string
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, key) => error ? reject(error) : resolve(key as Buffer))
  })
  return `scrypt$${salt}$${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'hex')
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, expected.length, { N: 16384, r: 8, p: 1 }, (error, key) => error ? reject(error) : resolve(key as Buffer))
  })
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived)
}

export async function createSession(userId: string, businessId: string) {
  const token = crypto.randomBytes(32).toString('base64url')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await db.insert(sessions).values({ tokenHash: hashToken(token), userId, businessId, expiresAt })
  const store = await cookies()
  store.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: expiresAt })
}

export async function destroySession() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)))
  store.delete(SESSION_COOKIE)
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const rows = await db.select({
    id: users.id,
    businessId: users.businessId,
    email: users.email,
    role: users.role,
    customerId: customers.id,
    barberId: users.id,
    businessSlug: businesses.slug,
    businessName: businesses.name,
    businessTimezone: businesses.timezone,
  })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .innerJoin(businesses, eq(sessions.businessId, businesses.id))
    .leftJoin(customers, and(eq(customers.userId, users.id), eq(customers.businessId, sessions.businessId)))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date()), eq(users.businessId, sessions.businessId), eq(businesses.status, 'active')))
    .limit(1)

  const row = rows[0]
  if (!row || !['customer', 'barber', 'admin'].includes(row.role)) {
    store.delete(SESSION_COOKIE)
    return null
  }

  await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.tokenHash, hashToken(token)))
  const barber = await db.query.barbers.findFirst({ where: (t, { and, eq }) => and(eq(t.userId, row.id), eq(t.businessId, row.businessId)) })
  return { ...row, role: row.role as AuthUser['role'], barberId: barber?.id ?? null }
}

export async function requireUser(role?: AuthUser['role']) {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  if (role && user.role !== role) throw new Error('FORBIDDEN')
  return user
}

export async function getBusinessBySlug(slug: string) {
  return db.select().from(businesses).where(and(eq(businesses.slug, slug), eq(businesses.status, 'active'))).limit(1)
}

export function normalizeEmail(email: string) { return email.trim().toLowerCase() }
export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('994')) return digits
  if (digits.startsWith('0') && digits.length === 10) return `994${digits.slice(1)}`
  return digits
}
export function isValidUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) }
