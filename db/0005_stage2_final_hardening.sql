-- Stage 2 final hardening: DB-level tenant consistency and required seed uniqueness.
CREATE UNIQUE INDEX IF NOT EXISTS "Barber_businessName_key" ON "Barber" ("businessId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "User_businessId_id_key" ON "User" ("businessId", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_businessId_id_key" ON "Customer" ("businessId", "id");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_valid_role') THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_valid_role" CHECK ("role" IN ('customer','barber','admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Customer_businessUser_fkey') THEN
    ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessUser_fkey"
      FOREIGN KEY ("businessId", "userId") REFERENCES "User"("businessId", "id")
      ON DELETE SET NULL ("userId") ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Barber_businessUser_fkey') THEN
    ALTER TABLE "Barber" ADD CONSTRAINT "Barber_businessUser_fkey"
      FOREIGN KEY ("businessId", "userId") REFERENCES "User"("businessId", "id")
      ON DELETE SET NULL ("userId") ON UPDATE CASCADE;
  END IF;
END $$;
