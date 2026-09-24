'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlowButton } from '@/components/glow-button'
import { GoogleAuthButton } from '@/components/google-auth-button'

function googleErrorMessage(code: string | null) {
  switch (code) {
    case 'not_configured': return 'Google girişi hələ konfiqurasiya edilməyib.'
    case 'business_not_found': return 'Biznes tapılmadı.'
    case 'google_cancelled': return 'Google giriş prosesi ləğv edildi.'
    case 'state_invalid': return 'Google təhlükəsizlik yoxlaması keçmədi. Yenidən cəhd edin.'
    case 'account_link_conflict': return 'Bu Google hesabı ilə bağlı fərqli hesab artıq mövcuddur.'
    case 'admin_required': return 'Bu Google hesabı idarəçi hesabı deyil.'
    case 'google_identity_invalid': return 'Google hesabı təsdiqlənə bilmədi. Yenidən cəhd edin.'
    default: return code ? 'Google ilə giriş zamanı xəta baş verdi. Yenidən cəhd edin.' : ''
  }
}

type LoginFormProps = { adminOnly?: boolean }

export function LoginForm({ adminOnly = false }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const message = googleErrorMessage(params.get('google_error'))
    if (message) setError(message)
    if (params.has('google_error')) window.history.replaceState({}, '', adminOnly ? '/admin/login' : '/login')
  }, [adminOnly])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, adminOnly }) })
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error || 'Giriş mümkün olmadı.'); return }

      if (data.user.role === 'admin') router.push('/admin')
      else if (data.user.role === 'barber') router.push('/barber')
      else router.push('/account')
      router.refresh()
    } catch { setError('Serverlə əlaqə qurmaq mümkün olmadı.') } finally { setBusy(false) }
  }

  return <form onSubmit={submit} className="space-y-5">
    <div><label htmlFor="email" className="mb-2 block text-sm text-muted-foreground">E-poçt</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" /></div>
    <div><label htmlFor="password" className="mb-2 block text-sm text-muted-foreground">Şifrə</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" /></div>
    {error && <p role="alert" className="rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
    <GlowButton full disabled={busy} type="submit" className="bg-primary px-6 py-3.5 text-sm tracking-widest text-primary-foreground">{busy ? 'GİRİLİR...' : adminOnly ? 'İDARƏÇİ KİMİ DAXİL OL' : 'DAXİL OL'}</GlowButton>
    <div className="relative py-1"><div className="absolute inset-x-0 top-1/2 border-t border-border/60" /><span className="relative mx-auto block w-fit bg-card px-3 text-xs tracking-[0.2em] text-muted-foreground">VƏ YA</span></div>
    <GoogleAuthButton adminOnly={adminOnly} label={adminOnly ? 'GOOGLE İLƏ İDARƏÇİ GİRİŞİ' : 'GOOGLE İLƏ DAXİL OL'} />
    {!adminOnly && <><p className="text-center text-sm text-muted-foreground">Hesabınız yoxdur? <a href="/register" className="text-primary hover:underline">Qeydiyyatdan keçin</a></p><p className="text-center text-xs text-muted-foreground"><a href="/admin/login" className="hover:text-primary">İdarəçi girişi</a></p></>}
  </form>
}

export function RegisterForm() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error || 'Hesab yaratmaq mümkün olmadı.'); return }
      router.push('/account'); router.refresh()
    } catch { setError('Serverlə əlaqə qurmaq mümkün olmadı.') } finally { setBusy(false) }
  }

  return <form onSubmit={submit} className="space-y-5"><div><label htmlFor="name" className="mb-2 block text-sm text-muted-foreground">Ad, Soyad</label><input id="name" required minLength={2} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/10" /></div><div><label htmlFor="email" className="mb-2 block text-sm text-muted-foreground">E-poçt</label><input id="email" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/10" /></div><div><label htmlFor="phone" className="mb-2 block text-sm text-muted-foreground">Telefon</label><input id="phone" type="tel" required autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+994 50 123 45 67" className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/10" /></div><div><label htmlFor="password" className="mb-2 block text-sm text-muted-foreground">Şifrə</label><input id="password" type="password" minLength={8} required autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/10" /></div>{error && <p role="alert" className="rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}<GlowButton full disabled={busy} type="submit" className="bg-primary px-6 py-3.5 text-sm tracking-widest text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5">{busy ? 'YARADILIR...' : 'HESAB YARAT'}</GlowButton><div className="relative py-1"><div className="absolute inset-x-0 top-1/2 border-t border-border/60" /><span className="relative mx-auto block w-fit bg-card px-3 text-xs tracking-[0.2em] text-muted-foreground">VƏ YA</span></div><GoogleAuthButton label="GOOGLE İLƏ QEYDİYYAT / DAXİL OL" /><p className="text-center text-sm text-muted-foreground">Artıq hesabınız var? <a href="/login" className="text-primary hover:underline">Daxil olun</a></p></form>
}
