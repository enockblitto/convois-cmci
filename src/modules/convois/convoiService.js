import { createRepository } from '../../data/repository'
import { croisadeService } from '../croisades/croisadeService'
import { vehiculeService } from '../vehicules/vehiculeService'
import { conducteurService } from '../conducteurs/conducteurService'
import { utilisateurService } from '../utilisateurs/utilisateurService'

const repo = createRepository('convois', { orderBy: 'date_depart', ascending: true })

const safe = (p) => p.catch(() => [])
const byId = (rows) => Object.fromEntries(rows.map((r) => [r.id, r]))

async function enrich(convois, { withStaffData = false } = {}) {
  const [croisades, vehicules, conducteurs, profils] = await Promise.all([
    croisadeService.list(),
    vehiculeService.list(),
    withStaffData ? safe(conducteurService.list()) : [],
    withStaffData ? utilisateurService.listSafe() : [],
  ])
  const c = byId(croisades)
  const v = byId(vehicules)
  const d = byId(conducteurs)
  const p = byId(profils)
  return convois.map((cv) => ({
    ...cv,
    places_restantes: Math.max(0, cv.places_totales - cv.places_reservees),
    taux_remplissage: cv.places_totales ? Math.round((cv.places_reservees / cv.places_totales) * 100) : 0,
    croisade: c[cv.croisade_id] ?? null,
    vehicule: v[cv.vehicule_id] ?? null,
    conducteur: d[cv.conducteur_id] ?? null,
    responsable: p[cv.responsable_id] ?? null,
  }))
}

export const convoiService = {
  async list(filters = {}, opts) {
    return enrich(await repo.list(filters), opts)
  },
  async get(id, opts) {
    const row = await repo.get(id)
    return row ? (await enrich([row], opts))[0] : null
  },
  remove: (id) => repo.remove(id),
  async save(values) {
    const placesTotales = Number(values.places_totales)
    const prix = Number(values.prix)
    if (!values.croisade_id) throw new Error('Choisissez une croisade.')
    if (!values.point_depart?.trim()) throw new Error('Le point de départ est obligatoire.')
    if (!values.date_depart) throw new Error('La date de départ est obligatoire.')
    if (!Number.isInteger(placesTotales) || placesTotales < 1) throw new Error('Le nombre de places doit être positif.')
    if (Number.isNaN(prix) || prix < 0) throw new Error('Le prix est invalide.')

    if (values.vehicule_id) {
      const vehicules = await vehiculeService.list()
      const vehicule = vehicules.find((v) => v.id === values.vehicule_id)
      if (vehicule && placesTotales > vehicule.capacite)
        throw new Error(`Le véhicule ${vehicule.immatriculation} n’a que ${vehicule.capacite} places.`)
    }
    if (values.id) {
      const current = await repo.get(values.id)
      if (current && placesTotales < current.places_reservees)
        throw new Error(`${current.places_reservees} places sont déjà réservées sur ce convoi.`)
    }

    const data = {
      croisade_id: values.croisade_id,
      vehicule_id: values.vehicule_id || null,
      conducteur_id: values.conducteur_id || null,
      responsable_id: values.responsable_id || null,
      point_depart: values.point_depart.trim(),
      destination: values.destination?.trim() || null,
      date_depart: new Date(values.date_depart).toISOString(),
      date_retour: values.date_retour ? new Date(values.date_retour).toISOString() : null,
      prix,
      places_totales: placesTotales,
      contact_telephone: values.contact_telephone || null,
      statut: values.statut || 'ouvert',
    }
    return values.id ? repo.update(values.id, data) : repo.create({ ...data, places_reservees: 0 })
  },
}
