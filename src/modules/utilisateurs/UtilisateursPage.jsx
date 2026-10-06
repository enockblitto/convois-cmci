import { useState } from 'react'
import { ROLES, toOptions } from '../../core/constants'
import { formatDate, fullName } from '../../core/format'
import Badge from '../../shared/ui/Badge'
import { Select } from '../../shared/ui/Field'
import { ErrorBox, PageHeader } from '../../shared/ui/misc'
import { Skeleton } from '../../shared/ui/Spinner'
import { useToast } from '../../shared/ui/Toast'
import { useAsync } from '../../shared/useAsync'
import { useAuth } from '../auth/AuthProvider'
import { utilisateurService } from './utilisateurService'

const tone = { admin: 'red', participant: 'slate' }

export default function UtilisateursPage() {
  const { user } = useAuth()
  const notify = useToast()
  const [q, setQ] = useState('')
  const { data, loading, error, reload } = useAsync(() => utilisateurService.list())
  const rows = (data ?? []).filter((p) => `${fullName(p)} ${p.email} ${p.telephone}`.toLowerCase().includes(q.toLowerCase()))

  const changeRole = async (p, role) => {
    try {
      await utilisateurService.setRole(p.id, role)
      notify(`${fullName(p)} est maintenant ${ROLES[role].toLowerCase()}.`)
      reload()
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  return (
    <>
      <PageHeader title="Utilisateurs & rôles" subtitle="Gérez les comptes administrateurs et participants." />
      <input className="input mb-4 max-w-sm" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
      <ErrorBox error={error} />
      {loading ? (
        <Skeleton className="h-72" />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white shadow-card ring-1 ring-slate-100">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>{['Nom', 'Contact', 'Inscrit le', 'Rôle', 'Modifier le rôle'].map((h) => <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">{fullName(p)}</td>
                  <td className="px-5 py-3.5"><p>{p.email}</p><p className="text-xs text-slate-500">{p.telephone}</p></td>
                  <td className="px-5 py-3.5">{formatDate(p.created_at, { month: 'short' })}</td>
                  <td className="px-5 py-3.5"><Badge tone={tone[p.role]}>{ROLES[p.role]}</Badge></td>
                  <td className="w-56 px-5 py-3.5">
                    <Select value={p.role} disabled={p.id === user.id} onChange={(e) => changeRole(p, e.target.value)} options={toOptions(ROLES)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
