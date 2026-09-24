import { RegisterForm } from '@/components/auth-form'

export default function RegisterPage() {
  return <main className="min-h-screen bg-background px-4 py-20"><div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_420px] lg:items-center"><div><p className="text-xs tracking-[0.35em] text-primary">KRAL BARBER</p><h1 className="mt-4 font-serif text-5xl font-semibold tracking-tight">Yeni hesab yaradın.</h1><p className="mt-5 max-w-xl text-muted-foreground">Hesabınızla öz rezervasiyalarınızı idarə edə və sonrakı səfərlərinizə daha rahat keçə bilərsiniz.</p><a href="/" className="mt-8 inline-flex text-sm text-primary hover:underline">Ana səhifəyə qayıt</a></div><div className="rounded-xl border border-border/60 bg-card p-8 md:p-10"><RegisterForm /></div></div></main>
}
