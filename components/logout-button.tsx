'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LogoutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  return <button type="button" disabled={busy} onClick={async () => { setBusy(true); try { await fetch('/api/auth/logout', { method: 'POST' }) } finally { router.push('/'); router.refresh() } }} className="text-sm text-muted-foreground hover:text-primary disabled:opacity-50">{busy ? 'Çıxılır...' : 'Çıxış'}</button>
}
