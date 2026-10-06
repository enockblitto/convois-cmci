import { AnimatePresence, motion } from 'framer-motion'
import { Bus, CalendarClock, CreditCard, FileText, Hash, Ticket, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PAIEMENT_METHODES, PAIEMENT_STATUTS, RESERVATION_STATUTS, ROLES, toOptions } from '../../core/constants'
import { formatDateTime, formatFCFA, fullName } from '../../core/format'
import Badge, { StatusBadge } from '../../shared/ui/Badge'
import Button from '../../shared/ui/Button'
import { Field, Input, Select } from '../../shared/ui/Field'
import Modal from '../../shared/ui/Modal'
import { Card, EmptyState, ErrorBox, PageHeader } from '../../shared/ui/misc'
import { Skeleton } from '../../shared/ui/Spinner'
import { useToast } from '../../shared/ui/Toast'
import { useAsync } from '../../shared/useAsync'
import { fadeUp } from '../../shared/animations/motion'
import { useAuth } from '../auth/AuthProvider'
import { paiementService } from '../paiements/paiementService'
import { reservationService } from './reservationService'

function PaiementModal({ reservation, onClose, onDone }) {
  const { user, profile } = useAuth()
  const notify = useToast()
  const [form, setForm] = useState({ methode: 'orange_money', reference: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await paiementService.declarer(reservation.id, form, { ...profile, id: user.id })
      notify('Paiement envoyé. Un responsable va le vérifier.')
      onDone()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={!!reservation} onClose={onClose} title="Payer ma réservation">
      {reservation && (
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-2xl bg-brand-50 p-4">
            <p className="text-sm text-brand-800">Montant à régler</p>
            <p className="text-2xl font-extrabold text-brand-900">{formatFCFA(reservation.montant)}</p>
            <p className="mt-1 text-xs text-brand-700">Réservation {reservation.code} · {reservation.nombre_places} place(s)</p>
          </div>
          <Field label="Moyen de paiement">
            <Select value={form.methode} onChange={(e) => setForm({ ...form, methode: e.target.value })} options={toOptions(PAIEMENT_METHODES)} />
          </Field>
          {form.methode === 'especes' ? (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              Remettez le montant au responsable du convoi ({reservation.convoi?.contact_telephone ?? 'contact sur la fiche du convoi'}). Il validera votre paiement.
            </p>
          ) : (
            <>
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                Envoyez le montant au numéro du convoi <b>{reservation.convoi?.contact_telephone ?? ''}</b>, puis saisissez l’identifiant de transaction reçu par SMS.
              </p>
              <Field label="Référence de la transaction">
                <Input required placeholder="Ex. MP240612.1530.A12345" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
              </Field>
            </>
          )}
          <ErrorBox error={error} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
            <Button type="submit" loading={busy} icon={CreditCard}>Envoyer le paiement</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

function ReservationCard({ r, i, onPay, onCancel }) {
  const pendingPayment = r.paiements.some((p) => p.statut === 'en_attente')
  const rejected = !pendingPayment && r.statut === 'en_attente' && r.paiement?.statut === 'rejete'
  return (
    <motion.div layout variants={fadeUp} custom={i} initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.95 }}>
      <Card className="relative overflow-hidden">
        <div className={`absolute inset-y-0 left-0 w-1.5 ${r.statut === 'confirmee' ? 'bg-emerald-500' : r.statut === 'annulee' ? 'bg-red-400' : 'bg-amber-400'}`} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{r.convoi?.croisade?.titre}</p>
            <h3 className="mt-1 text-lg font-bold">{r.convoi?.point_depart} → {r.convoi?.destination ?? r.convoi?.croisade?.ville}</h3>
          </div>
          <StatusBadge map={RESERVATION_STATUTS} value={r.statut} />
        </div>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <p className="flex items-center gap-2"><Hash className="h-4 w-4 text-brand-500" /> Code <b className="font-mono">{r.code}</b></p>
          <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-brand-500" /> {formatDateTime(r.convoi?.date_depart)}</p>
          <p className="flex items-center gap-2"><Ticket className="h-4 w-4 text-brand-500" /> {r.nombre_places} place(s) · {formatFCFA(r.montant)}</p>
          <p className="flex items-center gap-2"><Bus className="h-4 w-4 text-brand-500" /> {r.convoi?.vehicule ? `${r.convoi.vehicule.marque} · ${r.convoi.vehicule.immatriculation}` : 'Véhicule à confirmer'}</p>
        </div>
        {r.paiement && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Paiement : <StatusBadge map={PAIEMENT_STATUTS} value={r.paiement.statut} /> {PAIEMENT_METHODES[r.paiement.methode]}
            {r.paiement.reference && <span className="font-mono">· {r.paiement.reference}</span>}
          </div>
        )}
        {rejected && <p className="mt-3 text-xs font-medium text-red-600">Votre dernier paiement a été rejeté. Vérifiez la référence et réessayez.</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          {r.statut === 'en_attente' && !pendingPayment && <Button size="sm" icon={CreditCard} onClick={() => onPay(r)}>Payer</Button>}
          {r.statut === 'en_attente' && pendingPayment && <Badge tone="blue">Paiement en cours de vérification</Badge>}
          {r.statut === 'confirmee' && <Button as={Link} to={`/recu/${r.id}`} size="sm" variant="success" icon={FileText}>Voir mon reçu</Button>}
          {r.statut === 'en_attente' && <Button size="sm" variant="ghost" icon={XCircle} onClick={() => onCancel(r)}>Annuler</Button>}
        </div>
      </Card>
    </motion.div>
  )
}

export default function MonEspacePage() {
  const { user, profile } = useAuth()
  const notify = useToast()
  const [paying, setPaying] = useState(null)
  const { data, loading, error, reload } = useAsync(() => reservationService.mine(user), [user?.id])
  const reservations = data ?? []
  const actives = reservations.filter((r) => r.statut !== 'annulee')

  const cancel = async (r) => {
    if (!confirm(`Annuler la réservation ${r.code} ?`)) return
    try {
      await reservationService.annuler(r.id, { ...profile, id: user.id })
      notify('Réservation annulée.')
      reload()
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  return (
    <div className="container-app pb-20">
      <PageHeader
        title={`Bonjour ${profile?.prenom ?? ''}`}
        subtitle={`${ROLES[profile?.role] ?? ''} · ${fullName(profile)} · ${profile?.telephone ?? ''}`}
        actions={<Button as={Link} to="/convois" icon={Ticket}>Nouvelle réservation</Button>}
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Réservations actives', value: actives.length },
          { label: 'Confirmées', value: actives.filter((r) => r.statut === 'confirmee').length },
          { label: 'En attente de paiement', value: actives.filter((r) => r.statut === 'en_attente').length },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">{loading ? '—' : s.value}</p>
          </Card>
        ))}
      </div>
      <ErrorBox error={error} />
      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-56" />)}</div>
      ) : reservations.length ? (
        <motion.div layout className="grid gap-5 lg:grid-cols-2">
          <AnimatePresence>
            {reservations.map((r, i) => <ReservationCard key={r.id} r={r} i={i} onPay={setPaying} onCancel={cancel} />)}
          </AnimatePresence>
        </motion.div>
      ) : (
        <EmptyState title="Aucune réservation" text="Choisissez un convoi pour réserver votre première place." action={<Button as={Link} to="/convois">Voir les convois</Button>} />
      )}
      <PaiementModal
        reservation={paying}
        onClose={() => setPaying(null)}
        onDone={() => {
          setPaying(null)
          reload()
        }}
      />
    </div>
  )
}
