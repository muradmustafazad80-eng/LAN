import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { LogoutButton } from '@/components/logout-button'

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  if (user.role !== 'admin') redirect(user.role === 'customer' ? '/account' : '/barber')
  return <main className="min-h-screen bg-background px-4 py-16 md:px-6"><div className="mx-auto max-w-5xl"><div className="flex items-center justify-between gap-4"><a href="/" className="font-serif text-xl tracking-[0.2em]">KRAL<span className="text-primary">BARBER</span></a><LogoutButton /></div><div className="mt-12 rounded-xl border border-primary/20 bg-card p-8"><p className="text-xs tracking-[0.25em] text-primary">İDARƏÇİ GİRİŞİ</p><h1 className="mt-2 font-serif text-4xl font-semibold">KRAL BARBER idarəetmə əsası</h1><p className="mt-4 max-w-2xl text-muted-foreground">Bu səhifə Stage 2-də yalnız qorunan idarəçi girişini saxlayır. Ətraflı idarəetmə paneli Stage 3-də veriləcək.</p></div></div></main>
}
