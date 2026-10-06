import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import busStation from '../../assets/images/bus-station.webp'
import busGarage from '../../assets/images/bus-garage.webp'
import busFleet from '../../assets/images/bus-fleet.webp'
import { CROISADE_STATUTS } from '../../core/constants'
import { formatDate } from '../../core/format'
import { StatusBadge } from '../../shared/ui/Badge'
import { EmptyState, ErrorBox, PageHeader } from '../../shared/ui/misc'
import { Skeleton } from '../../shared/ui/Spinner'
import { useAsync } from '../../shared/useAsync'
import { fadeUp } from '../../shared/animations/motion'
import { croisadeService } from './croisadeService'

const covers = [busStation, busGarage, busFleet]

export default function CroisadesPage() {
  const { data, loading, error } = useAsync(() => croisadeService.list())
  const list = (data ?? []).filter((c) => c.statut !== 'annulee')
  return (
    <div className="container-app pb-20">
      <PageHeader title="Croisades" subtitle="Les prochains grands rassemblements et les convois associés." />
      <ErrorBox error={error} />
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-72" />)}</div>
      ) : list.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {list.map((c, i) => (
            <motion.article key={c.id} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} className="group overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-100">
              <div className="relative h-48 overflow-hidden">
                <img src={c.image_url || covers[i % covers.length]} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent" />
                <div className="absolute left-5 top-5"><StatusBadge map={CROISADE_STATUTS} value={c.statut} /></div>
                <h2 className="absolute bottom-4 left-5 right-5 text-2xl font-extrabold text-white">{c.titre}</h2>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-brand-500" />{formatDate(c.date_debut)} – {formatDate(c.date_fin)}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand-500" />{c.lieu}, {c.ville}</span>
                </div>
                {c.description && <p className="mt-3 text-sm text-slate-500">{c.description}</p>}
                {c.statut !== 'terminee' && (
                  <Link to={`/convois?croisade=${c.id}`} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                    Voir les convois <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucune croisade programmée" />
      )}
    </div>
  )
}
