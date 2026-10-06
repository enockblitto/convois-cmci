import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader, EmptyState, ErrorBox } from '../../shared/ui/misc'
import { Select } from '../../shared/ui/Field'
import { Skeleton } from '../../shared/ui/Spinner'
import { useAsync } from '../../shared/useAsync'
import { croisadeService } from '../croisades/croisadeService'
import { convoiService } from './convoiService'
import ConvoiCard from './ConvoiCard'

export default function ConvoisPage() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [onlyOpen, setOnlyOpen] = useState(true)
  const croisadeId = params.get('croisade') ?? ''
  const { data, loading, error } = useAsync(() => Promise.all([convoiService.list(), croisadeService.list()]))
  const [convois, croisades] = data ?? [[], []]

  const filtered = useMemo(
    () =>
      convois.filter(
        (c) =>
          (!croisadeId || c.croisade_id === croisadeId) &&
          (!onlyOpen || c.statut === 'ouvert') &&
          `${c.point_depart} ${c.destination} ${c.croisade?.titre} ${c.croisade?.ville}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [convois, croisadeId, onlyOpen, q],
  )

  return (
    <div className="container-app pb-20">
      <PageHeader title="Convois disponibles" subtitle="Choisissez votre point de départ et réservez votre place." />
      <div className="mb-8 grid gap-3 rounded-3xl bg-white p-4 shadow-card ring-1 ring-slate-100 md:grid-cols-[1fr_280px_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Rechercher une ville, un point de départ…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Select
          value={croisadeId}
          onChange={(e) => setParams(e.target.value ? { croisade: e.target.value } : {})}
          placeholder="Toutes les croisades"
          options={croisades.map((c) => ({ value: c.id, label: c.titre }))}
        />
        <label className="flex items-center gap-2 px-2 text-sm font-medium text-slate-600">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
          Ouverts uniquement
        </label>
      </div>
      <ErrorBox error={error} />
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-80" />)}</div>
      ) : filtered.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => <ConvoiCard key={c.id} convoi={c} i={i % 3} />)}
        </div>
      ) : (
        <EmptyState title="Aucun convoi trouvé" text="Modifiez vos filtres ou revenez plus tard." />
      )}
    </div>
  )
}
