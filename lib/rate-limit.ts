import { lt, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { rateLimitEntries } from '@/lib/schema'

const WINDOW_MS = 60_000

export async function consumeRateLimit(key: string, limit: number) {
  const now = new Date()
  const windowStart = new Date(Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS)
  await db.delete(rateLimitEntries).where(lt(rateLimitEntries.updatedAt, new Date(now.getTime() - 10 * WINDOW_MS)))
  const rows = await db.insert(rateLimitEntries).values({ key, windowStart, count: 1, updatedAt: now }).onConflictDoUpdate({
    target: [rateLimitEntries.key, rateLimitEntries.windowStart],
    set: {
      count: sql`CASE WHEN ${rateLimitEntries.count} < ${limit} THEN ${rateLimitEntries.count} + 1 ELSE ${rateLimitEntries.count} END`,
      updatedAt: now,
    },
  }).returning({ count: rateLimitEntries.count })
  return (rows[0]?.count ?? limit + 1) <= limit
}
