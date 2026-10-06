import { useState } from 'react'
import { FlaskConical, X } from 'lucide-react'
import { IS_DEMO } from '../../core/config'
import { DEMO_ACCOUNTS } from '../../data/seed'
import { demoDb } from '../../data/demoStore'

export default function DemoBanner() {
  const [open, setOpen] = useState(() => !sessionStorage.getItem('cmci-demo-banner-closed'))
  if (!IS_DEMO || !open) return null
  const close = () => {
    sessionStorage.setItem('cmci-demo-banner-closed', '1')
    setOpen(false)
  }
  return (
    <div className="no-print fixed bottom-4 left-4 z-30 max-w-xs rounded-2xl bg-slate-900/95 p-4 text-xs text-slate-300 shadow-2xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 font-semibold text-white">
          <FlaskConical className="h-4 w-4 text-gold" /> Mode démo
        </span>
        <button onClick={close} aria-label="Fermer"><X className="h-4 w-4" /></button>
      </div>
      <p className="mb-2">Supabase non configuré : les données sont stockées dans ce navigateur.</p>
      <ul className="mb-2 space-y-0.5 font-mono text-[11px]">
        {DEMO_ACCOUNTS.map((a) => (
          <li key={a.email}>{a.email} / {a.password}</li>
        ))}
      </ul>
      <button
        className="text-brand-300 underline"
        onClick={() => {
          demoDb.reset()
          localStorage.removeItem('cmci-convois-demo-session')
          window.location.reload()
        }}
      >
        Réinitialiser les données
      </button>
    </div>
  )
}
