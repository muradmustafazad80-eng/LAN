// Keep the legacy callback path available for deployments and older OAuth clients.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export { GET } from '@/app/api/auth/callback/google/route'
