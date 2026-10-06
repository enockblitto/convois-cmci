import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { PAIEMENT_METHODES, PAIEMENT_STATUTS, toOptions } from '../../core/constants'
import { formatDateTime, formatFCFA, fullName } from '../../core/format'
import { StatusBadge } from '../../shared/ui/Badge'
import Button from '../../shared/ui/Button'
import { Select } from '../../shared/ui/Field'
import { EmptyState, ErrorBox, PageHeader } from '../../shared/ui/misc'
import { Skeleton } from '../../shared/ui/Spinner'
import { useToast } from '../../shared/ui/Toast'
import { useAsync } from '../../shared/useAsync'
import { useAuth } from '../auth/AuthProvider'
import { paiementService } from './paiementService'

export default function PaiementsAdminPage() {
  const { profile, user } = useAuth()
  const notify = useToast()
  const [statut, setStatut] = useState('en_attente')
  const [busy, setBusy] = useState(null)
  const { data, loading, error, reload } = useAsync(() => paiementService.forStaff(profile), [profile?.id])
  const rows = (data ?? []).filter((p) => !statut || p.statut === statut)

  const traiter = async (p, accepte) => {
    setBusy(p.id)
    try {
      await paiementService.valider(p.id, accepte, { ...profile, id: user.id })
      notify(accepte ? 'Paiement validé, reçu généré.' : 'Paiement rejeté.')
      reload()
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHeader title="Paiements" subtitle="Vérifiez les paiements déclarés puis validez-les pour générer le reçu." />
      <div className="mb-4 max-w-xs">
        <Select value={statut} onChange={(e) => setStatut(e.target.value)} placeholder="Tous" options={toOptions(PAIEMENT_STATUTS)} />
      </div>
      <ErrorBox error={error} />
      {loading ? (
        <Skeleton className="h-72" />
      ) : rows.length ? (
        <div className="overflow-x-auto rounded-3xl bg-white shadow-card ring-1 ring-slate-100">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>{['Date', 'Participant', 'Réservation', 'Moyen / Référence', 'Montant', 'Statut', ''].map((h) => <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-brand-50/40">
                  <td className="px-5 py-3.5 text-xs">{formatDateTime(p.created_at)}</td>
                  <td className="px-5 py-3.5"><p className="font-semibold">{fullName(p.reservation.participant)}</p><p className="text-xs text-slate-500">{p.reservation.participant?.telephone}</p></td>
                  <td className="px-5 py-3.5"><p className="font-mono">{p.reservation.code}</p><p className="text-xs text-slate-500">{p.reservation.convoi?.point_depart}</p></td>
                  <td className="px-5 py-3.5"><p>{PAIEMENT_METHODES[p.methode]}</p><p className="font-mono text-xs text-slate-500">{p.reference ?? '—'}</p></td>
                  <td className="px-5 py-3.5 font-semibold">{formatFCFA(p.montant)}</td>
                  <td className="px-5 py-3.5"><StatusBadge map={PAIEMENT_STATUTS} value={p.statut} />{p.numero_recu && <p className="mt-1 font-mono text-[11px] text-slate-500">{p.numero_recu}</p>}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">
                    {p.statut === 'en_attente' && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="success" icon={Check} loading={busy === p.id} onClick={() => traiter(p, true)}>Valider</Button>
                        <Button size="sm" variant="secondary" icon={X} disabled={busy === p.id} onClick={() => traiter(p, false)}>Rejeter</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Aucun paiement" text={statut === 'en_attente' ? 'Aucun paiement en attente de vérification.' : undefined} />
      )}
    </>
  )
}
