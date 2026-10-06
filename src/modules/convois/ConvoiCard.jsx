import { motion } from 'framer-motion'
import { ArrowRight, Bus, CalendarClock, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CONVOI_STATUTS } from '../../core/constants'
import { formatDateTime, formatFCFA } from '../../core/format'
import { StatusBadge } from '../../shared/ui/Badge'
import { SeatBar } from '../../shared/ui/misc'
import { fadeUp } from '../../shared/animations/motion'

export default function ConvoiCard({ convoi, i = 0 }) {
  return (
    <motion.div variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
      <Link
        to={`/convois/${convoi.id}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white p-6 shadow-card ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-brand-200"
      >
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-50 transition-transform duration-500 group-hover:scale-150" />
        <div className="relative mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{convoi.croisade?.titre ?? 'Croisade'}</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">
              {convoi.point_depart} → {convoi.destination ?? convoi.croisade?.ville}
            </h3>
          </div>
          <StatusBadge map={CONVOI_STATUTS} value={convoi.statut} />
        </div>
        <div className="relative space-y-2 text-sm text-slate-600">
          <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-brand-500" /> {formatDateTime(convoi.date_depart)}</p>
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-500" /> {convoi.croisade?.lieu}, {convoi.croisade?.ville}</p>
          {convoi.vehicule && (
            <p className="flex items-center gap-2"><Bus className="h-4 w-4 text-brand-500" /> {convoi.vehicule.marque} {convoi.vehicule.modele}</p>
          )}
        </div>
        <div className="relative mt-5">
          <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-500">
            <span>{convoi.places_reservees}/{convoi.places_totales} places réservées</span>
            <span className={convoi.places_restantes ? 'text-brand-700' : 'text-amber-600'}>
              {convoi.places_restantes ? `${convoi.places_restantes} restantes` : 'Complet'}
            </span>
          </div>
          <SeatBar value={convoi.places_reservees} total={convoi.places_totales} />
        </div>
        <div className="relative mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xl font-extrabold text-slate-900">{Number(convoi.prix) ? formatFCFA(convoi.prix) : 'Gratuit'}</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-brand-600">
            Détails <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.div>
  )
}
