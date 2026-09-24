import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AccountPanel } from '@/components/account-panel'
import { LogoutButton } from '@/components/logout-button'

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'customer') redirect(user.role === 'admin' ? '/admin' : '/barber')
  return <main className="min-h-screen bg-background px-4 py-16 md:px-6"><div className="mx-auto max-w-5xl"><div className="flex items-center justify-between gap-4"><a href="/" className="font-serif text-xl tracking-[0.2em]">KRAL<span className="text-primary">BARBER</span></a><LogoutButton /></div><div className="mt-12"><AccountPanel initialUser={{ email: user.email, customerId: user.customerId, role: user.role, businessSlug: user.businessSlug, businessTimezone: user.businessTimezone }} /></div></div></main>
}
