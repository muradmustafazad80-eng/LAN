# KRAL BARBER — Stage 1

Stage 1 adds the real PostgreSQL data foundation without redesigning the existing premium UI.

## Setup

1. Install dependencies with the project's package manager.
2. Create `.env` (or `.env.local`) and set `DATABASE_URL` to your Neon connection string.
3. Run the SQL migration:
   `npm run db:migrate`
4. Seed development/demo data:
   `npm run db:seed`
5. Start the app:
   `npm run dev`

The seed uses upserts and does not wipe the database, so existing business records are not intentionally deleted.

## Stage 1 scope

Database-backed Services, Barbers, Reviews and Business Settings are exposed through server-side API routes. Booking creation validates IDs and basic customer/date input on the server and reads the service from the database, so client-supplied prices are never trusted.

Authentication, roles, full availability, duplicate-booking prevention, cancellation/rescheduling, admin/CRM, loyalty/campaign execution, advanced analytics, messaging and AI are intentionally not implemented here.
