import { desc, eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getBusinessBySlug } from '@/lib/auth'
import { barbers, businessSettings, customers, reviews, services } from '@/lib/schema'

async function resolveBusiness(slug: string) {
  const [business] = await getBusinessBySlug(slug)
  return business ?? null
}

export async function getServices(businessSlug = 'kral-barber') {
  const business = await resolveBusiness(businessSlug)
  if (!business) return []
  return db.select({ id: services.id, name: services.name, price: services.price, duration: services.duration, category: services.category, description: services.description })
    .from(services)
    .where(and(eq(services.businessId, business.id), eq(services.status, 'active')))
    .orderBy(services.name)
}

export async function getActiveBarbers(businessSlug = 'kral-barber') {
  const business = await resolveBusiness(businessSlug)
  if (!business) return []
  return db.select({ id: barbers.id, name: barbers.name, image: barbers.image, specialty: barbers.specialty, experience: barbers.experience })
    .from(barbers)
    .where(and(eq(barbers.businessId, business.id), eq(barbers.status, 'active')))
    .orderBy(barbers.createdAt)
}

export async function getReviews(businessSlug = 'kral-barber') {
  const business = await resolveBusiness(businessSlug)
  if (!business) return []
  return db.select({
    id: reviews.id,
    name: customers.name,
    text: reviews.comment,
    rating: reviews.rating,
    createdAt: reviews.createdAt,
  }).from(reviews)
    .innerJoin(customers, and(eq(reviews.customerId, customers.id), eq(customers.businessId, business.id)))
    .where(eq(reviews.businessId, business.id))
    .orderBy(desc(reviews.createdAt))
}

export async function getBusinessSettings(businessSlug = 'kral-barber') {
  const business = await resolveBusiness(businessSlug)
  if (!business) return {}
  const rows = await db.select({ key: businessSettings.key, value: businessSettings.value }).from(businessSettings).where(eq(businessSettings.businessId, business.id))
  return Object.fromEntries(rows.map((row) => [row.key, row.value]))
}
