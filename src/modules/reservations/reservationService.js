import { createRepository } from '../../data/repository'
import { operations } from '../../data/operations'
import { convoiService } from '../convois/convoiService'
import { utilisateurService } from '../utilisateurs/utilisateurService'

const repo = createRepository('reservations')
const paiementsRepo = createRepository('paiements')

const byId = (rows) => Object.fromEntries(rows.map((r) => [r.id, r]))

async function enrich(reservations, { withStaffData = false } = {}) {
  const [convois, paiements, profils] = await Promise.all([
    convoiService.list({}, { withStaffData }),
    paiementsRepo.list(),
    withStaffData ? utilisateurService.listSafe() : [],
  ])
  const c = byId(convois)
  const p = byId(profils)
  return reservations.map((r) => {
    const pays = paiements.filter((x) => x.reservation_id === r.id)
    return {
      ...r,
      convoi: c[r.convoi_id] ?? null,
      participant: p[r.participant_id] ?? null,
      paiements: pays,
      paiement: pays.find((x) => x.statut === 'valide') ?? pays.find((x) => x.statut === 'en_attente') ?? pays[0] ?? null,
    }
  })
}

export const reservationService = {
  async mine(user) {
    return enrich(await repo.list({ participant_id: user.id }))
  },
  async get(id, opts) {
    const row = await repo.get(id)
    return row ? (await enrich([row], opts))[0] : null
  },
  /** Réservations visibles par l'administrateur. */
  async forStaff(profile) {
    const all = await enrich(await repo.list(), { withStaffData: true })
    return profile.role === 'admin' ? all : []
  },
  reserver: (convoiId, places, user) => operations.reserverPlace({ convoiId, places: Number(places), user }),
  annuler: (reservationId, user) => operations.annulerReservation({ reservationId, user }),
}
