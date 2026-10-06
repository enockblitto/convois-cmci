import { CONDUCTEUR_STATUTS, CONVOI_STATUTS, CROISADE_STATUTS, VEHICULE_STATUTS, toOptions } from '../../core/constants'
import { formatDate, formatDateTime, formatFCFA, fullName, toInputDateTime } from '../../core/format'
import { StatusBadge } from '../../shared/ui/Badge'
import { SeatBar } from '../../shared/ui/misc'
import { conducteurService } from '../conducteurs/conducteurService'
import { convoiService } from '../convois/convoiService'
import { croisadeService } from '../croisades/croisadeService'
import { utilisateurService } from '../utilisateurs/utilisateurService'
import { vehiculeService } from '../vehicules/vehiculeService'
import ResourcePage from './ResourcePage'

const toDate = (v) => (v ? String(v).slice(0, 10) : '')

export function CroisadesAdmin() {
  return (
    <ResourcePage
      title="Croisades"
      subtitle="Planifiez les croisades auxquelles les convois sont rattachés."
      load={() => croisadeService.list()}
      save={croisadeService.save}
      remove={croisadeService.remove}
      defaults={{ statut: 'planifiee' }}
      searchText={(r) => `${r.titre} ${r.ville} ${r.lieu}`}
      columns={[
        { label: 'Titre', render: (r) => <span className="font-semibold text-slate-900">{r.titre}</span> },
        { label: 'Lieu', render: (r) => `${r.lieu ?? ''}, ${r.ville ?? ''}` },
        { label: 'Dates', render: (r) => `${formatDate(r.date_debut, { month: 'short' })} → ${formatDate(r.date_fin, { month: 'short' })}` },
        { label: 'Statut', render: (r) => <StatusBadge map={CROISADE_STATUTS} value={r.statut} /> },
      ]}
      fields={[
        { name: 'titre', label: 'Titre', required: true, full: true },
        { name: 'lieu', label: 'Lieu' },
        { name: 'ville', label: 'Ville', required: true },
        { name: 'date_debut', label: 'Date de début', type: 'date', required: true, toInput: toDate },
        { name: 'date_fin', label: 'Date de fin', type: 'date', required: true, toInput: toDate },
        { name: 'statut', label: 'Statut', type: 'select', options: toOptions(CROISADE_STATUTS), required: true },
        { name: 'image_url', label: 'Image (URL, optionnel)' },
        { name: 'description', label: 'Description', type: 'textarea', full: true },
      ]}
    />
  )
}

export function VehiculesAdmin() {
  return (
    <ResourcePage
      title="Véhicules"
      subtitle="Le parc de cars utilisé pour les convois."
      load={() => vehiculeService.list()}
      save={vehiculeService.save}
      remove={vehiculeService.remove}
      defaults={{ statut: 'disponible' }}
      searchText={(r) => `${r.immatriculation} ${r.marque} ${r.modele}`}
      columns={[
        { label: 'Immatriculation', render: (r) => <span className="font-mono font-semibold text-slate-900">{r.immatriculation}</span> },
        { label: 'Modèle', render: (r) => `${r.marque} ${r.modele ?? ''}` },
        { label: 'Capacité', render: (r) => `${r.capacite} places` },
        { label: 'Statut', render: (r) => <StatusBadge map={VEHICULE_STATUTS} value={r.statut} /> },
      ]}
      fields={[
        { name: 'immatriculation', label: 'Immatriculation', required: true },
        { name: 'marque', label: 'Marque', required: true },
        { name: 'modele', label: 'Modèle' },
        { name: 'capacite', label: 'Capacité (places)', type: 'number', min: 1, required: true },
        { name: 'statut', label: 'Statut', type: 'select', options: toOptions(VEHICULE_STATUTS), required: true },
      ]}
    />
  )
}

export function ConducteursAdmin() {
  return (
    <ResourcePage
      title="Conducteurs"
      subtitle="Les chauffeurs affectés aux convois."
      load={() => conducteurService.list()}
      save={conducteurService.save}
      remove={conducteurService.remove}
      defaults={{ statut: 'actif' }}
      searchText={(r) => `${r.nom} ${r.prenom} ${r.telephone}`}
      columns={[
        { label: 'Nom', render: (r) => <span className="font-semibold text-slate-900">{r.prenom} {r.nom}</span> },
        { label: 'Téléphone', key: 'telephone' },
        { label: 'Permis', render: (r) => <span className="font-mono">{r.numero_permis}</span> },
        { label: 'Statut', render: (r) => <StatusBadge map={CONDUCTEUR_STATUTS} value={r.statut} /> },
      ]}
      fields={[
        { name: 'prenom', label: 'Prénom', required: true },
        { name: 'nom', label: 'Nom', required: true },
        { name: 'telephone', label: 'Téléphone', type: 'tel', required: true },
        { name: 'numero_permis', label: 'N° de permis' },
        { name: 'statut', label: 'Statut', type: 'select', options: toOptions(CONDUCTEUR_STATUTS), required: true },
      ]}
    />
  )
}

export function ConvoisAdmin() {
  return (
    <ResourcePage
      title="Convois"
      subtitle="Créez les convois, affectez véhicule, conducteur et administrateur référent."
      load={() => convoiService.list({}, { withStaffData: true })}
      extraData={async () => {
        const [croisades, vehicules, conducteurs, profils] = await Promise.all([
          croisadeService.list(),
          vehiculeService.list(),
          conducteurService.list(),
          utilisateurService.listSafe(),
        ])
        return { croisades, vehicules, conducteurs, administrateurs: profils.filter((p) => p.role === 'admin') }
      }}
      save={convoiService.save}
      remove={convoiService.remove}
      defaults={{ statut: 'ouvert', prix: 0 }}
      searchText={(r) => `${r.point_depart} ${r.destination} ${r.croisade?.titre}`}
      columns={[
        {
          label: 'Trajet',
          render: (r) => (
            <div>
              <p className="font-semibold text-slate-900">{r.point_depart} → {r.destination ?? r.croisade?.ville}</p>
              <p className="text-xs text-slate-500">{r.croisade?.titre}</p>
            </div>
          ),
        },
        { label: 'Départ', render: (r) => formatDateTime(r.date_depart) },
        { label: 'Équipe', render: (r) => <div className="text-xs"><p>{r.vehicule?.immatriculation ?? '—'}</p><p className="text-slate-500">{r.conducteur ? `${r.conducteur.prenom} ${r.conducteur.nom}` : 'Sans conducteur'} · {r.responsable ? fullName(r.responsable) : 'Sans responsable'}</p></div> },
        { label: 'Places', render: (r) => <div className="w-32"><p className="mb-1 text-xs">{r.places_reservees}/{r.places_totales}</p><SeatBar value={r.places_reservees} total={r.places_totales} /></div> },
        { label: 'Prix', render: (r) => formatFCFA(r.prix) },
        { label: 'Statut', render: (r) => <StatusBadge map={CONVOI_STATUTS} value={r.statut} /> },
      ]}
      fields={(extra) => [
        { name: 'croisade_id', label: 'Croisade', type: 'select', required: true, full: true, placeholder: 'Choisir…', options: (extra?.croisades ?? []).map((c) => ({ value: c.id, label: c.titre })) },
        { name: 'point_depart', label: 'Point de départ', required: true },
        { name: 'destination', label: 'Destination' },
        { name: 'date_depart', label: 'Date et heure de départ', type: 'datetime-local', required: true, toInput: toInputDateTime },
        { name: 'date_retour', label: 'Retour prévu', type: 'datetime-local', toInput: toInputDateTime },
        { name: 'vehicule_id', label: 'Véhicule', type: 'select', options: (extra?.vehicules ?? []).map((v) => ({ value: v.id, label: `${v.immatriculation} — ${v.marque} (${v.capacite} pl.)${v.statut !== 'disponible' ? ' · indisponible' : ''}` })) },
        { name: 'conducteur_id', label: 'Conducteur', type: 'select', options: (extra?.conducteurs ?? []).filter((c) => c.statut === 'actif').map((c) => ({ value: c.id, label: `${c.prenom} ${c.nom}` })) },
        { name: 'responsable_id', label: 'Administrateur référent', type: 'select', options: (extra?.administrateurs ?? []).map((p) => ({ value: p.id, label: fullName(p) })) },
        { name: 'contact_telephone', label: 'Téléphone de contact / paiement', type: 'tel' },
        { name: 'places_totales', label: 'Places disponibles', type: 'number', min: 1, required: true, hint: 'Ne peut pas dépasser la capacité du véhicule.' },
        { name: 'prix', label: 'Prix par place (FCFA)', type: 'number', min: 0, step: 100, required: true },
        { name: 'statut', label: 'Statut', type: 'select', options: toOptions(CONVOI_STATUTS), required: true },
      ]}
    />
  )
}
