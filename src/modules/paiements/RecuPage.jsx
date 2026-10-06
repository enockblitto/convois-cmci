import { motion } from 'framer-motion'
import { ArrowLeft, BadgeCheck, Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Link, useParams } from 'react-router-dom'
import logoFull from '../../assets/images/logo-cmci.webp'
import { PAIEMENT_METHODES } from '../../core/constants'
import { formatDate, formatDateTime, formatFCFA, fullName } from '../../core/format'
import Button from '../../shared/ui/Button'
import { ErrorBox } from '../../shared/ui/misc'
import { FullPageLoader } from '../../shared/ui/Spinner'
import { useAsync } from '../../shared/useAsync'
import { useAuth } from '../auth/AuthProvider'
import { reservationService } from '../reservations/reservationService'

export default function RecuPage() {
  const { id } = useParams()
  const { profile, isStaff } = useAuth()
  const { data: r, loading, error } = useAsync(() => reservationService.get(id, { withStaffData: isStaff }), [id, isStaff])

  if (loading) return <FullPageLoader />
  if (error || !r) return <div className="container-app"><ErrorBox error={error ?? new Error('Reçu introuvable.')} /></div>
  const paiement = r.paiements.find((p) => p.statut === 'valide')
  if (r.statut !== 'confirmee')
    return <div className="container-app"><ErrorBox error={new Error('Le reçu sera disponible après validation du paiement.')} /></div>

  const participant = r.participant ?? profile
  const rows = [
    ['Participant', fullName(participant)],
    ['Téléphone', participant?.telephone ?? '—'],
    ['Croisade', r.convoi?.croisade?.titre],
    ['Dates', `${formatDate(r.convoi?.croisade?.date_debut)} – ${formatDate(r.convoi?.croisade?.date_fin)}`],
    ['Trajet', `${r.convoi?.point_depart} → ${r.convoi?.destination ?? r.convoi?.croisade?.ville}`],
    ['Départ', formatDateTime(r.convoi?.date_depart)],
    ['Véhicule', r.convoi?.vehicule ? `${r.convoi.vehicule.marque} ${r.convoi.vehicule.modele} · ${r.convoi.vehicule.immatriculation}` : '—'],
    ['Places', r.nombre_places],
    ['Moyen de paiement', paiement ? PAIEMENT_METHODES[paiement.methode] : 'Gratuit'],
    ['Référence', paiement?.reference ?? '—'],
  ]

  return (
    <div className="container-app pb-20">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link to={isStaff ? '/admin/reservations' : '/mon-espace'} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <Button icon={Printer} onClick={() => window.print()}>Imprimer / PDF</Button>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-100"
      >
        <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-brand-700 to-brand-500 p-6 text-white">
          <div className="flex items-center gap-4">
            <img src={logoFull} alt="CMCI" className="h-16 w-16 rounded-2xl bg-white object-contain p-1" />
            <div>
              <p className="text-xs uppercase tracking-widest text-brand-100">Reçu de paiement</p>
              <p className="text-xl font-extrabold">{paiement?.numero_recu ?? r.code}</p>
            </div>
          </div>
          <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.5, type: 'spring' }} className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
            <BadgeCheck className="h-4 w-4" /> Payé
          </motion.span>
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto]">
          <dl className="space-y-2.5 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-dashed border-slate-100 pb-2">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right font-semibold text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
              <QRCodeSVG value={`CMCI-CONVOI|${r.code}|${paiement?.numero_recu ?? ''}`} size={140} fgColor="#132456" />
            </div>
            <p className="font-mono text-sm font-bold">{r.code}</p>
          </div>
        </div>
        <div className="flex items-center justify-between bg-slate-50 px-6 py-5">
          <div className="text-xs text-slate-500">
            <p>Validé le {formatDateTime(paiement?.valide_le)}</p>
            <p>CMCI Côte d’Ivoire — à présenter au responsable lors du départ.</p>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{formatFCFA(r.montant)}</p>
        </div>
      </motion.div>
    </div>
  )
}
