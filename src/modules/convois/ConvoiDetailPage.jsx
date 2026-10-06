import { motion } from 'framer-motion'
import { ArrowLeft, Bus, CalendarClock, CalendarCheck, MapPin, Minus, Phone, Plus, Ticket } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import busSunset from '../../assets/images/bus-sunset.webp'
import { CONVOI_STATUTS } from '../../core/constants'
import { formatDate, formatDateTime, formatFCFA } from '../../core/format'
import { StatusBadge } from '../../shared/ui/Badge'
import Button from '../../shared/ui/Button'
import { Card, ErrorBox, SeatBar } from '../../shared/ui/misc'
import { FullPageLoader } from '../../shared/ui/Spinner'
import { useToast } from '../../shared/ui/Toast'
import { useAsync } from '../../shared/useAsync'
import { ease } from '../../shared/animations/motion'
import { useAuth } from '../auth/AuthProvider'
import { reservationService } from '../reservations/reservationService'
import { convoiService } from './convoiService'

export default function ConvoiDetailPage() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const notify = useToast()
  const navigate = useNavigate()
  const [places, setPlaces] = useState(1)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const { data: convoi, loading, error, reload } = useAsync(() => convoiService.get(id), [id])

  if (loading) return <FullPageLoader />
  if (error || !convoi) return <div className="container-app"><ErrorBox error={error ?? new Error('Convoi introuvable.')} /></div>

  const max = Math.min(10, convoi.places_restantes)
  const reserver = async () => {
    if (!user) return navigate('/connexion', { state: { from: `/convois/${id}` } })
    setBusy(true)
    setErr(null)
    try {
      await reservationService.reserver(convoi.id, places, { ...profile, id: user.id })
      notify('Réservation enregistrée ! Finalisez votre paiement dans votre espace.')
      navigate('/mon-espace')
    } catch (e) {
      setErr(e)
      reload()
    } finally {
      setBusy(false)
    }
  }

  const infos = [
    { icon: CalendarClock, label: 'Départ', value: formatDateTime(convoi.date_depart) },
    { icon: CalendarCheck, label: 'Retour prévu', value: formatDateTime(convoi.date_retour) },
    { icon: MapPin, label: 'Lieu de la croisade', value: `${convoi.croisade?.lieu ?? ''}, ${convoi.croisade?.ville ?? ''}` },
    { icon: Bus, label: 'Véhicule', value: convoi.vehicule ? `${convoi.vehicule.marque} ${convoi.vehicule.modele} · ${convoi.vehicule.immatriculation}` : 'À confirmer' },
    { icon: Phone, label: 'Contact du convoi', value: convoi.contact_telephone ?? '—' },
  ]

  return (
    <div className="container-app pb-20">
      <Link to="/convois" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Retour aux convois
      </Link>
      <motion.div
        className="relative mb-8 overflow-hidden rounded-[2rem] bg-navy p-8 text-white sm:p-12"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
      >
        <img src={busSunset} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-transparent" />
        <div className="relative max-w-2xl">
          <StatusBadge map={CONVOI_STATUTS} value={convoi.statut} />
          <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-brand-300">{convoi.croisade?.titre}</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-5xl">{convoi.point_depart} → {convoi.destination ?? convoi.croisade?.ville}</h1>
          <p className="mt-3 text-slate-300">Croisade du {formatDate(convoi.croisade?.date_debut)} au {formatDate(convoi.croisade?.date_fin)}</p>
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <Card>
          <h2 className="mb-6 text-lg font-bold">Informations du convoi</h2>
          <dl className="grid gap-5 sm:grid-cols-2">
            {infos.map((info, i) => (
              <motion.div key={info.label} className="flex gap-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                <span className="h-fit rounded-xl bg-brand-50 p-2.5 text-brand-600"><info.icon className="h-5 w-5" /></span>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{info.label}</dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">{info.value}</dd>
                </div>
              </motion.div>
            ))}
          </dl>
          {convoi.croisade?.description && <p className="mt-8 rounded-2xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">{convoi.croisade.description}</p>}
        </Card>

        <Card className="h-fit lg:sticky lg:top-24">
          <p className="text-sm text-slate-500">Prix par place</p>
          <p className="text-3xl font-extrabold">{Number(convoi.prix) ? formatFCFA(convoi.prix) : 'Gratuit'}</p>
          <div className="my-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-500">Places restantes</span>
              <span className="font-bold text-brand-700">{convoi.places_restantes} / {convoi.places_totales}</span>
            </div>
            <SeatBar value={convoi.places_reservees} total={convoi.places_totales} />
          </div>
          {convoi.statut === 'ouvert' && max > 0 ? (
            <>
              <div className="mb-5 flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                <span className="text-sm font-medium text-slate-600">Nombre de places</span>
                <div className="flex items-center gap-3">
                  <button className="rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-slate-200 disabled:opacity-40" disabled={places <= 1} onClick={() => setPlaces((p) => p - 1)} aria-label="Moins"><Minus className="h-4 w-4" /></button>
                  <motion.span key={places} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-6 text-center font-bold">{places}</motion.span>
                  <button className="rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-slate-200 disabled:opacity-40" disabled={places >= max} onClick={() => setPlaces((p) => p + 1)} aria-label="Plus"><Plus className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mb-5 flex justify-between border-t border-dashed border-slate-200 pt-4 font-semibold">
                <span>Total</span>
                <span>{formatFCFA(Number(convoi.prix) * places)}</span>
              </div>
              <ErrorBox error={err} />
              <Button className="mt-3 w-full" size="lg" icon={Ticket} loading={busy} onClick={reserver}>
                {user ? 'Réserver maintenant' : 'Se connecter pour réserver'}
              </Button>
            </>
          ) : (
            <p className="rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-700">Ce convoi n’accepte plus de réservations.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
