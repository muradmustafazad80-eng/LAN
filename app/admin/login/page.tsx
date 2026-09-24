import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { LoginForm } from '@/components/auth-form'

export default async function AdminLoginPage() {
  const user = await getCurrentUser()
  if (user) {
    if (user.role === 'admin') redirect('/admin')
    if (user.role === 'barber') redirect('/barber')
    redirect('/account')
  }

  return (
    <main className="min-h-screen bg-background px-4 py-20">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <p className="text-xs tracking-[0.35em] text-primary">KRAL BARBER</p>
          <h1 className="mt-4 font-serif text-5xl font-semibold tracking-tight">İdarəçi girişi.</h1>
          <p className="mt-5 max-w-xl text-muted-foreground">Bu giriş yalnız ADMIN rolu üçün açıqdır. Adi müştəri və usta hesabları idarəçi bölməsinə daxil ola bilməz.</p>
          <a href="/login" className="mt-8 inline-flex text-sm text-primary hover:underline">Adi girişə qayıt</a>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-8 md:p-10">
          <LoginForm adminOnly />
        </div>
      </div>
    </main>
  )
}
