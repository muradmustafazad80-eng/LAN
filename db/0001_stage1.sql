CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "User" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL UNIQUE,
  "role" text NOT NULL DEFAULT 'customer',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "Customer" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid UNIQUE,
  "name" text NOT NULL,
  "phone" text NOT NULL UNIQUE,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Barber" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid UNIQUE,
  "name" text NOT NULL,
  "image" text NOT NULL,
  "specialty" text NOT NULL,
  "experience" text NOT NULL DEFAULT '',
  "status" text NOT NULL DEFAULT 'active',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "Barber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Service" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL UNIQUE,
  "price" numeric(10,2) NOT NULL CHECK ("price" >= 0),
  "duration" integer NOT NULL CHECK ("duration" > 0),
  "category" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "Booking" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" uuid NOT NULL REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "barberId" uuid NOT NULL REFERENCES "Barber"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "serviceId" uuid NOT NULL REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "dateTime" timestamp NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  CHECK ("status" IN ('pending','confirmed','completed','cancelled'))
);
CREATE TABLE IF NOT EXISTS "Review" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" uuid NOT NULL REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "barberId" uuid NOT NULL REFERENCES "Barber"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "rating" integer NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
  "comment" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "Payment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "bookingId" uuid NOT NULL UNIQUE REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "amount" numeric(10,2) NOT NULL CHECK ("amount" >= 0),
  "status" text NOT NULL DEFAULT 'unpaid',
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "Loyalty" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" uuid NOT NULL UNIQUE REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "points" integer NOT NULL DEFAULT 0 CHECK ("points" >= 0),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "Campaign" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "description" text NOT NULL,
  "discountPct" integer NOT NULL CHECK ("discountPct" BETWEEN 0 AND 100),
  "isActive" boolean NOT NULL DEFAULT true,
  "endDate" timestamp NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "BusinessSetting" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" text NOT NULL UNIQUE,
  "value" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Customer_userId_idx" ON "Customer" ("userId");
CREATE INDEX IF NOT EXISTS "Barber_status_idx" ON "Barber" ("status");
CREATE INDEX IF NOT EXISTS "Booking_customerId_idx" ON "Booking" ("customerId");
CREATE INDEX IF NOT EXISTS "Booking_barberDateTime_idx" ON "Booking" ("barberId", "dateTime");
CREATE INDEX IF NOT EXISTS "Booking_serviceId_idx" ON "Booking" ("serviceId");
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking" ("status");
CREATE INDEX IF NOT EXISTS "Review_barberId_idx" ON "Review" ("barberId");
CREATE INDEX IF NOT EXISTS "Review_createdAt_idx" ON "Review" ("createdAt");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment" ("status");
CREATE INDEX IF NOT EXISTS "Campaign_active_endDate_idx" ON "Campaign" ("isActive", "endDate");

ALTER TABLE "Barber" ADD COLUMN IF NOT EXISTS "experience" text NOT NULL DEFAULT '';
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "description" text NOT NULL DEFAULT '';

ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "createdAt" timestamp NOT NULL DEFAULT now();
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT now();
ALTER TABLE "BusinessSetting" ADD COLUMN IF NOT EXISTS "createdAt" timestamp NOT NULL DEFAULT now();
ALTER TABLE "BusinessSetting" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS "Service_name_key" ON "Service" ("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Barber_name_key" ON "Barber" ("name");
