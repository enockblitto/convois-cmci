import { FileText, Search, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RESERVATION_STATUTS, toOptions } from '../../core/constants'
import { formatDateTime, formatFCFA, fullName } from '../../core/format'
import { StatusBadge } from '../../shared/ui/Badge'
import Button from '../../shared/ui/Button'
import { Select } from '../../shared/ui/Field'
import { EmptyState, ErrorBox, PageHeader } from '../../shared/ui/misc'
import { Skeleton } from '../../shared/ui/Spinner'
import { useToast } from '../../shared/ui/Toast'
import { useAsync } from '../../shared/useAsync'
import { useAuth } from '../auth/AuthProvider'
import { reservationService } from './reservationService'

export default function ReservationsAdminPage() {
  const { profile, user } = useAuth()
  const notify = useToast()
  const { data, loading, error, reload } = useAsync(() => reservationService.forStaff(profile), [profile?.id])
  const [q, setQ] = useState('')
  const [statut, setStatut] = useState('')
  const [convoi, setConvoi] = useState('')

  const all = useMemo(() => data ?? [], [data])
  const convois = [...new Map(all.filter((r) => r.convoi).map((r) => [r.convoi.id, r.convoi])).values()]
  const rows = all.filter(
    (r) =>
      (!statut || r.statut === statut) &&
      (!convoi || r.convoi_id === convoi) &&
      `${r.code} ${fullName(r.participant)} ${r.participant?.telephone}`.toLowerCase().includes(q.toLowerCase()),
  )

  const annuler = async (r) => {
    if (!confirm(`Annuler la réservation ${r.code} et libérer ${r.nombre_places} place(s) ?`)) return
    try {
      await reservationService.annuler(r.id, { ...profile, id: user.id })
      notify('Réservation annulée, places libérées.')
      reload()
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  const exportCsv = () => {
    const header = ['Code', 'Participant', 'Téléphone', 'Convoi', 'Départ', 'Places', 'Montant', 'Statut']
    const lines = rows.map((r) => [r.code, fullName(r.participant), r.participant?.telephone ?? '', `${r.convoi?.point_depart} → ${r.convoi?.destination ?? ''}`, formatDateTime(r.convoi?.date_depart), r.nombre_places, r.montant, RESERVATION_STATUTS[r.statut]?.label])
    const csv = [header, ...lines].map((l) => l.map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(';')).join('\n')
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'liste-passagers.csv' })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHeader title="Réservations" subtitle="Liste des passagers par convoi." actions={<Button variant="secondary" icon={FileText} onClick={exportCsv} disabled={!rows.length}>Exporter (CSV)</Button>} />
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_260px_220px]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Code, nom, téléphone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Select value={convoi} onChange={(e) => setConvoi(e.target.value)} placeholder="Tous les convois" options={convois.map((c) => ({ value: c.id, label: `${c.point_depart} — ${formatDateTime(c.date_depart)}` }))} />
        <Select value={statut} onChange={(e) => setStatut(e.target.value)} placeholder="Tous les statuts" options={toOptions(RESERVATION_STATUTS)} />
      </div>
      <ErrorBox error={error} />
      {loading ? (
        <Skeleton className="h-72" />
      ) : rows.length ? (
        <div className="overflow-x-auto rounded-3xl bg-white shadow-card ring-1 ring-slate-100">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>{['Code', 'Participant', 'Convoi', 'Places', 'Montant', 'Statut', ''].map((h) => <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-brand-50/40">
                  <td className="px-5 py-3.5 font-mono font-semibold">{r.code}</td>
                  <td className="px-5 py-3.5"><p className="font-semibold text-slate-900">{fullName(r.participant)}</p><p className="text-xs text-slate-500">{r.participant?.telephone}</p></td>
                  <td className="px-5 py-3.5"><p>{r.convoi?.point_depart} → {r.convoi?.destination ?? r.convoi?.croisade?.ville}</p><p className="text-xs text-slate-500">{formatDateTime(r.convoi?.date_depart)}</p></td>
                  <td className="px-5 py-3.5">{r.nombre_places}</td>
                  <td className="px-5 py-3.5">{formatFCFA(r.montant)}</td>
                  <td className="px-5 py-3.5"><StatusBadge map={RESERVATION_STATUTS} value={r.statut} /></td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">
                    {r.statut === 'confirmee' && <Link to={`/recu/${r.id}`} className="rounded-lg p-2 text-slate-400 hover:text-brand-600" title="Reçu"><FileText className="inline h-4 w-4" /></Link>}
                    {r.statut !== 'annulee' && <button onClick={() => annuler(r)} className="rounded-lg p-2 text-slate-400 hover:text-red-600" title="Annuler"><XCircle className="h-4 w-4" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Aucune réservation" />
      )}
    </>
  )
}
