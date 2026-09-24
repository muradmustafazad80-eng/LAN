CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS "Business" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "timezone" text NOT NULL DEFAULT 'Asia/Baku',
  "status" text NOT NULL DEFAULT 'active',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

INSERT INTO "Business" ("name", "slug", "timezone", "status")
SELECT 'KRAL BARBER', 'kral-barber', 'Asia/Baku', 'active'
WHERE NOT EXISTS (SELECT 1 FROM "Business" WHERE "slug" = 'kral-barber');

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "businessId" uuid;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" text;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "businessId" uuid;
ALTER TABLE "Barber" ADD COLUMN IF NOT EXISTS "businessId" uuid;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "businessId" uuid;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "businessId" uuid;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "endDateTime" timestamp;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "price" numeric(10,2);
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "businessId" uuid;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "businessId" uuid;
ALTER TABLE "Loyalty" ADD COLUMN IF NOT EXISTS "businessId" uuid;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "businessId" uuid;
ALTER TABLE "BusinessSetting" ADD COLUMN IF NOT EXISTS "businessId" uuid;

UPDATE "User" SET "businessId" = (SELECT "id" FROM "Business" WHERE "slug" = 'kral-barber') WHERE "businessId" IS NULL;
UPDATE "Customer" SET "businessId" = (SELECT "id" FROM "Business" WHERE "slug" = 'kral-barber') WHERE "businessId" IS NULL;
UPDATE "Barber" SET "businessId" = (SELECT "id" FROM "Business" WHERE "slug" = 'kral-barber') WHERE "businessId" IS NULL;
UPDATE "Service" SET "businessId" = (SELECT "id" FROM "Business" WHERE "slug" = 'kral-barber') WHERE "businessId" IS NULL;
UPDATE "Booking" b SET "businessId" = COALESCE(b."businessId", (SELECT c."businessId" FROM "Customer" c WHERE c."id" = b."customerId"), (SELECT "id" FROM "Business" WHERE "slug" = 'kral-barber'));
UPDATE "Review" SET "businessId" = (SELECT "id" FROM "Business" WHERE "slug" = 'kral-barber') WHERE "businessId" IS NULL;
UPDATE "Payment" p SET "businessId" = COALESCE(p."businessId", (SELECT b."businessId" FROM "Booking" b WHERE b."id" = p."bookingId"), (SELECT "id" FROM "Business" WHERE "slug" = 'kral-barber'));
UPDATE "Loyalty" SET "businessId" = (SELECT "id" FROM "Business" WHERE "slug" = 'kral-barber') WHERE "businessId" IS NULL;
UPDATE "Campaign" SET "businessId" = (SELECT "id" FROM "Business" WHERE "slug" = 'kral-barber') WHERE "businessId" IS NULL;
UPDATE "BusinessSetting" SET "businessId" = (SELECT "id" FROM "Business" WHERE "slug" = 'kral-barber') WHERE "businessId" IS NULL;

UPDATE "Booking" b
SET "endDateTime" = b."dateTime" + make_interval(mins => COALESCE(s."duration", 30)),
    "price" = COALESCE(b."price", s."price", 0)
FROM "Service" s
WHERE s."id" = b."serviceId" AND (b."endDateTime" IS NULL OR b."price" IS NULL);

ALTER TABLE "User" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET DEFAULT '';
UPDATE "User" SET "passwordHash" = 'legacy-no-password' WHERE "passwordHash" IS NULL OR "passwordHash" = '';
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Barber" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Service" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "endDateTime" SET NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "price" SET NOT NULL;
ALTER TABLE "Review" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Loyalty" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Campaign" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "BusinessSetting" ALTER COLUMN "businessId" SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_businessId_fkey') THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Customer_businessId_fkey') THEN
    ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Barber_businessId_fkey') THEN
    ALTER TABLE "Barber" ADD CONSTRAINT "Barber_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Service_businessId_fkey') THEN
    ALTER TABLE "Service" ADD CONSTRAINT "Service_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Booking_businessId_fkey') THEN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Review_businessId_fkey') THEN
    ALTER TABLE "Review" ADD CONSTRAINT "Review_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_businessId_fkey') THEN
    ALTER TABLE "Payment" ADD CONSTRAINT "Payment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Loyalty_businessId_fkey') THEN
    ALTER TABLE "Loyalty" ADD CONSTRAINT "Loyalty_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Campaign_businessId_fkey') THEN
    ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BusinessSetting_businessId_fkey') THEN
    ALTER TABLE "BusinessSetting" ADD CONSTRAINT "BusinessSetting_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DROP INDEX IF EXISTS "Customer_phone_key";
DROP INDEX IF EXISTS "Service_name_key";
DROP INDEX IF EXISTS "Barber_name_key";
DROP INDEX IF EXISTS "BusinessSetting_key_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_businessPhone_key" ON "Customer" ("businessId", "phone");
CREATE UNIQUE INDEX IF NOT EXISTS "Service_businessName_key" ON "Service" ("businessId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "BusinessSetting_businessKey_key" ON "BusinessSetting" ("businessId", "key");
CREATE INDEX IF NOT EXISTS "User_businessId_idx" ON "User" ("businessId");
CREATE INDEX IF NOT EXISTS "User_businessRole_idx" ON "User" ("businessId", "role");
CREATE INDEX IF NOT EXISTS "Customer_businessId_idx" ON "Customer" ("businessId");
CREATE INDEX IF NOT EXISTS "Barber_businessId_idx" ON "Barber" ("businessId");
CREATE INDEX IF NOT EXISTS "Service_businessId_idx" ON "Service" ("businessId");
CREATE INDEX IF NOT EXISTS "Booking_businessId_idx" ON "Booking" ("businessId");
CREATE INDEX IF NOT EXISTS "Review_businessId_idx" ON "Review" ("businessId");

CREATE TABLE IF NOT EXISTS "Session" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tokenHash" text NOT NULL UNIQUE,
  "userId" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "businessId" uuid NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "lastSeenAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session" ("userId");
CREATE INDEX IF NOT EXISTS "Session_businessId_idx" ON "Session" ("businessId");
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session" ("expiresAt");

CREATE TABLE IF NOT EXISTS "BarberSchedule" (
  "barberId" uuid NOT NULL REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "weekday" integer NOT NULL CHECK ("weekday" BETWEEN 0 AND 6),
  "startTime" time NOT NULL,
  "endTime" time NOT NULL,
  "isWorking" boolean NOT NULL DEFAULT true,
  PRIMARY KEY ("barberId", "weekday"),
  CHECK ("endTime" > "startTime")
);
CREATE INDEX IF NOT EXISTS "BarberSchedule_weekday_idx" ON "BarberSchedule" ("barberId", "weekday");

CREATE TABLE IF NOT EXISTS "BusinessHour" (
  "businessId" uuid NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "weekday" integer NOT NULL CHECK ("weekday" BETWEEN 0 AND 6),
  "startTime" time NOT NULL,
  "endTime" time NOT NULL,
  "isOpen" boolean NOT NULL DEFAULT true,
  PRIMARY KEY ("businessId", "weekday"),
  CHECK ("endTime" > "startTime")
);

CREATE TABLE IF NOT EXISTS "BarberBlockedPeriod" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "businessId" uuid NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "barberId" uuid NOT NULL REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "startsAt" timestamp NOT NULL,
  "endsAt" timestamp NOT NULL,
  "reason" text NOT NULL DEFAULT 'blocked',
  CHECK ("endsAt" > "startsAt")
);
CREATE INDEX IF NOT EXISTS "BarberBlocked_businessBarber_idx" ON "BarberBlockedPeriod" ("businessId", "barberId");
CREATE INDEX IF NOT EXISTS "BarberBlocked_range_idx" ON "BarberBlockedPeriod" ("barberId", "startsAt", "endsAt");

CREATE TABLE IF NOT EXISTS "RateLimitEntry" (
  "key" text NOT NULL,
  "windowStart" timestamp NOT NULL,
  "count" integer NOT NULL DEFAULT 0,
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("key", "windowStart")
);
CREATE INDEX IF NOT EXISTS "RateLimit_updatedAt_idx" ON "RateLimitEntry" ("updatedAt");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Booking_valid_status') THEN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_valid_status" CHECK ("status" IN ('pending','confirmed','completed','cancelled'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Booking_no_barber_overlap') THEN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_no_barber_overlap"
      EXCLUDE USING gist ("businessId" WITH =, "barberId" WITH =, tsrange("dateTime", "endDateTime", '[)') WITH &&)
      WHERE ("status" IN ('pending','confirmed'));
  END IF;
END $$;

INSERT INTO "BusinessHour" ("businessId", "weekday", "startTime", "endTime", "isOpen")
SELECT b."id", d.weekday,
       CASE WHEN d.weekday = 0 THEN '11:00'::time ELSE '10:00'::time END,
       CASE WHEN d.weekday = 0 THEN '20:00'::time ELSE '22:00'::time END,
       true
FROM "Business" b
CROSS JOIN (SELECT generate_series(0,6) AS weekday) d
WHERE b."slug" = 'kral-barber'
ON CONFLICT ("businessId", "weekday") DO NOTHING;

INSERT INTO "BarberSchedule" ("barberId", "weekday", "startTime", "endTime", "isWorking")
SELECT br."id", d.weekday,
       CASE WHEN d.weekday = 0 THEN '11:00'::time ELSE '10:00'::time END,
       CASE WHEN d.weekday = 0 THEN '20:00'::time ELSE '22:00'::time END,
       true
FROM "Barber" br
CROSS JOIN (SELECT generate_series(0,6) AS weekday) d
WHERE br."status" = 'active'
ON CONFLICT ("barberId", "weekday") DO NOTHING;

-- Tenant consistency: an entity can only point to records from the same business.
CREATE UNIQUE INDEX IF NOT EXISTS "User_businessId_id_key" ON "User" ("businessId", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_businessId_id_key" ON "Customer" ("businessId", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "Barber_businessId_id_key" ON "Barber" ("businessId", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "Service_businessId_id_key" ON "Service" ("businessId", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_businessId_id_key" ON "Booking" ("businessId", "id");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Booking_businessCustomer_fkey') THEN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_businessCustomer_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "Customer"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Booking_businessBarber_fkey') THEN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_businessBarber_fkey" FOREIGN KEY ("businessId", "barberId") REFERENCES "Barber"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Booking_businessService_fkey') THEN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_businessService_fkey" FOREIGN KEY ("businessId", "serviceId") REFERENCES "Service"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Review_businessCustomer_fkey') THEN
    ALTER TABLE "Review" ADD CONSTRAINT "Review_businessCustomer_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "Customer"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Review_businessBarber_fkey') THEN
    ALTER TABLE "Review" ADD CONSTRAINT "Review_businessBarber_fkey" FOREIGN KEY ("businessId", "barberId") REFERENCES "Barber"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_businessBooking_fkey') THEN
    ALTER TABLE "Payment" ADD CONSTRAINT "Payment_businessBooking_fkey" FOREIGN KEY ("businessId", "bookingId") REFERENCES "Booking"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Loyalty_businessCustomer_fkey') THEN
    ALTER TABLE "Loyalty" ADD CONSTRAINT "Loyalty_businessCustomer_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "Customer"("businessId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Blocked_businessBarber_fkey') THEN
    ALTER TABLE "BarberBlockedPeriod" ADD CONSTRAINT "Blocked_businessBarber_fkey" FOREIGN KEY ("businessId", "barberId") REFERENCES "Barber"("businessId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Session_businessUser_fkey') THEN
    ALTER TABLE "Session" ADD CONSTRAINT "Session_businessUser_fkey" FOREIGN KEY ("businessId", "userId") REFERENCES "User"("businessId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
