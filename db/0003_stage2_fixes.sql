-- Stage 2 safety fixes: tenant-scoped email uniqueness and legacy-password lockout.
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_key";
DROP INDEX IF EXISTS "User_email_key";
CREATE UNIQUE INDEX IF NOT EXISTS "User_businessEmail_key" ON "User" ("businessId", "email");

-- A legacy placeholder password must never be usable for login.
UPDATE "User" SET "passwordHash" = '' WHERE "passwordHash" = 'legacy-no-password';
