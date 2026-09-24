-- Stage 2 compatibility fix: the Stage 2 service queries use a tenant-scoped status field.
-- Add it for existing Stage 1 databases without touching existing service data.
ALTER TABLE "Service"
  ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS "Service_status_idx"
  ON "Service" ("businessId", "status");
