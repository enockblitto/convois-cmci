import { operations } from '../../data/operations'
import { reservationService } from '../reservations/reservationService'

export const paiementService = {
  declarer: (reservationId, { methode, reference }, user) =>
    operations.declarerPaiement({ reservationId, methode, reference, user }),
  valider: (paiementId, accepte, user) => operations.validerPaiement({ paiementId, accepte, user }),
  async forStaff(profile) {
    const reservations = await reservationService.forStaff(profile)
    return reservations
      .flatMap((r) => r.paiements.map((p) => ({ ...p, reservation: r })))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  },
}
