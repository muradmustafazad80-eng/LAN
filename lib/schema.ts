import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  index,
  uuid,
  time,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core'

export const businesses = pgTable('Business', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  timezone: text('timezone').notNull().default('Asia/Baku'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('createdAt', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: false }).notNull().defaultNow(),
}, (t) => [index('Business_status_idx').on(t.status)])

export const users = pgTable('User', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('businessId').notNull(),
  email: text('email').notNull(),
  passwordHash: text('passwordHash').notNull(),
  googleSubject: text('googleSubject'),
  role: text('role').notNull().default('customer'),
  createdAt: timestamp('createdAt', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: false }).notNull().defaultNow(),
}, (t) => [index('User_businessId_idx').on(t.businessId), index('User_businessRole_idx').on(t.businessId, t.role), uniqueIndex('User_businessEmail_key').on(t.businessId, t.email)])

export const customers = pgTable('Customer', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('businessId').notNull(),
  userId: uuid('userId').unique(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: false }).notNull().defaultNow(),
}, (t) => [
  index('Customer_businessId_idx').on(t.businessId),
  index('Customer_userId_idx').on(t.userId),
  uniqueIndex('Customer_businessPhone_key').on(t.businessId, t.phone),
])

export const barbers = pgTable('Barber', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('businessId').notNull(),
  userId: uuid('userId').unique(),
  name: text('name').notNull(),
  image: text('image').notNull(),
  specialty: text('specialty').notNull(),
  experience: text('experience').notNull().default(''),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('createdAt', { withTimezone: false }).notNull().defaultNow(),
}, (t) => [
  index('Barber_businessId_idx').on(t.businessId),
  index('Barber_status_idx').on(t.businessId, t.status),
  uniqueIndex('Barber_businessUser_key').on(t.businessId, t.userId),
  uniqueIndex('Barber_businessName_key').on(t.businessId, t.name),
])

export const services = pgTable('Service', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('businessId').notNull(),
  name: text('name').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  duration: integer('duration').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull().default(''),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('createdAt', { withTimezone: false }).notNull().defaultNow(),
}, (t) => [
  index('Service_businessId_idx').on(t.businessId),
  index('Service_status_idx').on(t.businessId, t.status),
  uniqueIndex('Service_businessName_key').on(t.businessId, t.name),
])

export const bookings = pgTable('Booking', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('businessId').notNull(),
  customerId: uuid('customerId').notNull(),
  barberId: uuid('barberId').notNull(),
  serviceId: uuid('serviceId').notNull(),
  dateTime: timestamp('dateTime', { withTimezone: false }).notNull(),
  endDateTime: timestamp('endDateTime', { withTimezone: false }).notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('createdAt', { withTimezone: false }).notNull().defaultNow(),
}, (t) => [
  index('Booking_businessId_idx').on(t.businessId),
  index('Booking_customerId_idx').on(t.businessId, t.customerId),
  index('Booking_barberDateTime_idx').on(t.businessId, t.barberId, t.dateTime),
  index('Booking_serviceId_idx').on(t.businessId, t.serviceId),
  index('Booking_status_idx').on(t.businessId, t.status),
])

export const reviews = pgTable('Review', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('businessId').notNull(),
  customerId: uuid('customerId').notNull(),
  barberId: uuid('barberId').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: false }).notNull().defaultNow(),
}, (t) => [index('Review_businessId_idx').on(t.businessId), index('Review_barberId_idx').on(t.businessId, t.barberId), index('Review_createdAt_idx').on(t.createdAt)])

export const payments = pgTable('Payment', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('businessId').notNull(),
  bookingId: uuid('bookingId').notNull().unique(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('unpaid'),
  createdAt: timestamp('createdAt', { withTimezone: false }).notNull().defaultNow(),
})

export const loyalty = pgTable('Loyalty', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('businessId').notNull(),
  customerId: uuid('customerId').notNull(),
  points: integer('points').notNull().default(0),
  updatedAt: timestamp('updatedAt', { withTimezone: false }).notNull().defaultNow(),
}, (t) => [index('Loyalty_businessId_idx').on(t.businessId), uniqueIndex('Loyalty_businessCustomer_key').on(t.businessId, t.customerId)])

export const campaigns = pgTable('Campaign', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('businessId').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  discountPct: integer('discountPct').notNull(),
  isActive: boolean('isActive').notNull().default(true),
  endDate: timestamp('endDate', { withTimezone: false }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: false }).notNull().defaultNow(),
})

export const businessSettings = pgTable('BusinessSetting', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('businessId').notNull(),
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: false }).notNull().defaultNow(),
}, (t) => [index('BusinessSetting_businessId_idx').on(t.businessId), uniqueIndex('BusinessSetting_businessKey_key').on(t.businessId, t.key)])

export const sessions = pgTable('Session', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenHash: text('tokenHash').notNull().unique(),
  userId: uuid('userId').notNull(),
  businessId: uuid('businessId').notNull(),
  expiresAt: timestamp('expiresAt', { withTimezone: false }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: false }).notNull().defaultNow(),
  lastSeenAt: timestamp('lastSeenAt', { withTimezone: false }).notNull().defaultNow(),
}, (t) => [index('Session_userId_idx').on(t.userId), index('Session_businessId_idx').on(t.businessId), index('Session_expiresAt_idx').on(t.expiresAt)])

export const barberSchedules = pgTable('BarberSchedule', {
  barberId: uuid('barberId').notNull(),
  weekday: integer('weekday').notNull(),
  startTime: time('startTime').notNull(),
  endTime: time('endTime').notNull(),
  isWorking: boolean('isWorking').notNull().default(true),
}, (t) => [primaryKey({ columns: [t.barberId, t.weekday] }), index('BarberSchedule_weekday_idx').on(t.barberId, t.weekday)])

export const businessHours = pgTable('BusinessHour', {
  businessId: uuid('businessId').notNull(),
  weekday: integer('weekday').notNull(),
  startTime: time('startTime').notNull(),
  endTime: time('endTime').notNull(),
  isOpen: boolean('isOpen').notNull().default(true),
}, (t) => [primaryKey({ columns: [t.businessId, t.weekday] })])

export const barberBlockedPeriods = pgTable('BarberBlockedPeriod', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('businessId').notNull(),
  barberId: uuid('barberId').notNull(),
  startsAt: timestamp('startsAt', { withTimezone: false }).notNull(),
  endsAt: timestamp('endsAt', { withTimezone: false }).notNull(),
  reason: text('reason').notNull().default('blocked'),
}, (t) => [index('BarberBlocked_businessBarber_idx').on(t.businessId, t.barberId), index('BarberBlocked_range_idx').on(t.barberId, t.startsAt, t.endsAt)])

export const rateLimitEntries = pgTable('RateLimitEntry', {
  key: text('key').notNull(),
  windowStart: timestamp('windowStart', { withTimezone: false }).notNull(),
  count: integer('count').notNull().default(0),
  updatedAt: timestamp('updatedAt', { withTimezone: false }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.key, t.windowStart] }), index('RateLimit_updatedAt_idx').on(t.updatedAt)])

export const businessesRelations = relations(businesses, ({ many }) => ({ users: many(users), customers: many(customers), barbers: many(barbers), services: many(services), bookings: many(bookings), reviews: many(reviews), payments: many(payments), loyalty: many(loyalty), campaigns: many(campaigns), settings: many(businessSettings), sessions: many(sessions), hours: many(businessHours), blockedPeriods: many(barberBlockedPeriods) }))

export const usersRelations = relations(users, ({ one, many }) => ({ business: one(businesses, { fields: [users.businessId], references: [businesses.id] }), customer: one(customers, { fields: [users.id], references: [customers.userId] }), barber: one(barbers, { fields: [users.id], references: [barbers.userId] }), sessions: many(sessions) }))
export const customersRelations = relations(customers, ({ many, one }) => ({ business: one(businesses, { fields: [customers.businessId], references: [businesses.id] }), user: one(users, { fields: [customers.userId], references: [users.id] }), bookings: many(bookings), reviews: many(reviews), loyalty: one(loyalty) }))
export const barbersRelations = relations(barbers, ({ many, one }) => ({ business: one(businesses, { fields: [barbers.businessId], references: [businesses.id] }), user: one(users, { fields: [barbers.userId], references: [users.id] }), bookings: many(bookings), reviews: many(reviews), schedules: many(barberSchedules), blockedPeriods: many(barberBlockedPeriods) }))
export const servicesRelations = relations(services, ({ many, one }) => ({ business: one(businesses, { fields: [services.businessId], references: [businesses.id] }), bookings: many(bookings) }))
export const bookingsRelations = relations(bookings, ({ one }) => ({ business: one(businesses, { fields: [bookings.businessId], references: [businesses.id] }), customer: one(customers, { fields: [bookings.customerId], references: [customers.id] }), barber: one(barbers, { fields: [bookings.barberId], references: [barbers.id] }), service: one(services, { fields: [bookings.serviceId], references: [services.id] }), payment: one(payments) }))
export const reviewsRelations = relations(reviews, ({ one }) => ({ business: one(businesses, { fields: [reviews.businessId], references: [businesses.id] }), customer: one(customers, { fields: [reviews.customerId], references: [customers.id] }), barber: one(barbers, { fields: [reviews.barberId], references: [barbers.id] }) }))
export const paymentsRelations = relations(payments, ({ one }) => ({ business: one(businesses, { fields: [payments.businessId], references: [businesses.id] }), booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }) }))
export const loyaltyRelations = relations(loyalty, ({ one }) => ({ business: one(businesses, { fields: [loyalty.businessId], references: [businesses.id] }), customer: one(customers, { fields: [loyalty.customerId], references: [customers.id] }) }))
export const campaignsRelations = relations(campaigns, ({ one }) => ({ business: one(businesses, { fields: [campaigns.businessId], references: [businesses.id] }) }))
export const businessSettingsRelations = relations(businessSettings, ({ one }) => ({ business: one(businesses, { fields: [businessSettings.businessId], references: [businesses.id] }) }))
export const sessionsRelations = relations(sessions, ({ one }) => ({ user: one(users, { fields: [sessions.userId], references: [users.id] }), business: one(businesses, { fields: [sessions.businessId], references: [businesses.id] }) }))
export const barberSchedulesRelations = relations(barberSchedules, ({ one }) => ({ barber: one(barbers, { fields: [barberSchedules.barberId], references: [barbers.id] }) }))
export const businessHoursRelations = relations(businessHours, ({ one }) => ({ business: one(businesses, { fields: [businessHours.businessId], references: [businesses.id] }) }))
export const barberBlockedPeriodsRelations = relations(barberBlockedPeriods, ({ one }) => ({ business: one(businesses, { fields: [barberBlockedPeriods.businessId], references: [businesses.id] }), barber: one(barbers, { fields: [barberBlockedPeriods.barberId], references: [barbers.id] }) }))
