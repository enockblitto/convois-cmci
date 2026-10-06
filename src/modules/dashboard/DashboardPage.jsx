import { motion } from 'framer-motion'
import { ArrowRight, Banknote, Bus, CalendarHeart, Clock, Route, Ticket, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CONVOI_STATUTS, RESERVATION_STATUTS } from '../../core/constants'
import { formatDateTime, formatFCFA, fullName } from '../../core/format'
import { StatusBadge } from '../../shared/ui/Badge'
import CountUp from '../../shared/animations/CountUp'
import { Card, ErrorBox, PageHeader, SeatBar } from '../../shared/ui/misc'
import { Skeleton } from '../../shared/ui/Spinner'
import { useAsync } from '../../shared/useAsync'
import { fadeUp } from '../../shared/animations/motion'
import { useAuth } from '../auth/AuthProvider'
import { dashboardService } from './dashboardService'

function StatCard({ icon: Icon, label, value, format, tone = 'from-brand-500 to-brand-700', i, to }) {
  const body = (
    <motion.div variants={fadeUp} custom={i} initial="hidden" animate="show" whileHover={{ y: -4 }} className="relative h-full overflow-hidden rounded-3xl bg-white p-5 shadow-card ring-1 ring-slate-100">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${tone} opacity-10`} />
      <span className={`inline-flex rounded-2xl bg-gradient-to-br ${tone} p-2.5 text-white shadow-lg`}><Icon className="h-5 w-5" /></span>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-900"><CountUp value={value} format={format} /></p>
    </motion.div>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

function Donut({ pct }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#eef6ff" strokeWidth="12" />
        <motion.circle
          cx="60" cy="60" r={r} fill="none" stroke="url(#dg)" strokeWidth="12" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (c * pct) / 100 }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs><linearGradient id="dg"><stop offset="0%" stopColor="#59a2ff" /><stop offset="100%" stopColor="#134ade" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold"><CountUp value={pct} />%</span>
        <span className="text-xs text-slate-500">remplissage</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { profile, isAdmin } = useAuth()
  const { data: s, loading, error } = useAsync(() => dashboardService.stats(profile), [profile?.id])

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle="Vue d’ensemble de tous les convois." />
      <ErrorBox error={error} />
      {loading || !s ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard i={0} icon={Route} label="Convois ouverts" value={s.convoisOuverts} to={isAdmin ? '/admin/convois' : undefined} />
            <StatCard i={1} icon={Ticket} label="Réservations actives" value={s.reservationsActives} tone="from-sky-400 to-brand-600" to="/admin/reservations" />
            <StatCard i={2} icon={Clock} label="Paiements à vérifier" value={s.paiementsAVerifier} tone="from-amber-400 to-orange-500" to="/admin/paiements" />
            <StatCard i={3} icon={Banknote} label="Montant encaissé" value={s.montantEncaisse} format={(n) => formatFCFA(Math.round(n))} tone="from-emerald-400 to-emerald-600" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
            <Card className="flex flex-col items-center justify-center text-center">
              <Donut pct={s.tauxRemplissage} />
              <div className="mt-5 grid w-full grid-cols-3 gap-2 text-center text-xs">
                <div><p className="text-lg font-bold text-slate-900">{s.totalPlaces}</p><p className="text-slate-500">places</p></div>
                <div><p className="text-lg font-bold text-brand-700">{s.placesReservees}</p><p className="text-slate-500">réservées</p></div>
                <div><p className="text-lg font-bold text-emerald-600">{s.placesRestantes}</p><p className="text-slate-500">libres</p></div>
              </div>
              <div className="mt-5 flex w-full justify-around border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><CalendarHeart className="h-4 w-4 text-brand-500" /> {s.croisadesAVenir} croisade(s) à venir</span>
                <span className="flex items-center gap-1"><Bus className="h-4 w-4 text-brand-500" /> {s.vehiculesDisponibles} cars dispo.</span>
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold">Remplissage par convoi</h2>
                {isAdmin && <Link to="/admin/convois" className="flex items-center gap-1 text-sm font-semibold text-brand-600">Gérer <ArrowRight className="h-4 w-4" /></Link>}
              </div>
              <div className="space-y-4">
                {s.convois.length === 0 && <p className="text-sm text-slate-500">Aucun convoi.</p>}
                {s.convois.map((c) => (
                  <div key={c.id} className="grid items-center gap-3 sm:grid-cols-[1fr_180px_90px]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{c.point_depart} → {c.destination ?? c.croisade?.ville}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(c.date_depart)} · {c.croisade?.titre}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-right text-xs text-slate-500">{c.places_reservees}/{c.places_totales}</p>
                      <SeatBar value={c.places_reservees} total={c.places_totales} />
                    </div>
                    <div className="sm:text-right"><StatusBadge map={CONVOI_STATUTS} value={c.statut} /></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold"><Users className="h-5 w-5 text-brand-600" /> Dernières réservations</h2>
              <Link to="/admin/reservations" className="flex items-center gap-1 text-sm font-semibold text-brand-600">Tout voir <ArrowRight className="h-4 w-4" /></Link>
            </div>
            {s.dernieresReservations.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune réservation pour le moment.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {s.dernieresReservations.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span><b>{fullName(r.participant)}</b> <span className="text-slate-500">· {r.convoi?.point_depart} · {r.nombre_places} pl.</span></span>
                    <StatusBadge map={RESERVATION_STATUTS} value={r.statut} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </>
  )
}
