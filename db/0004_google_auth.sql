-- Google OAuth identity binding for existing tenant-scoped users.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleSubject" text;
CREATE UNIQUE INDEX IF NOT EXISTS "User_businessGoogleSubject_key" ON "User" ("businessId", "googleSubject") WHERE "googleSubject" IS NOT NULL;
