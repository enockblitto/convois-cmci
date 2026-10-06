import { convoiService } from '../convois/convoiService'
import { croisadeService } from '../croisades/croisadeService'
import { reservationService } from '../reservations/reservationService'
import { vehiculeService } from '../vehicules/vehiculeService'

export const dashboardService = {
  async stats(profile) {
    const [convois, croisades, reservations, vehicules] = await Promise.all([
      convoiService.list({}, { withStaffData: true }),
      croisadeService.list(),
      reservationService.forStaff(profile),
      vehiculeService.list(),
    ])
    const scope = profile.role === 'admin' ? convois : []
    const actives = reservations.filter((r) => r.statut !== 'annulee')
    const paiements = reservations.flatMap((r) => r.paiements)
    const totalPlaces = scope.reduce((s, c) => s + c.places_totales, 0)
    const reservees = scope.reduce((s, c) => s + c.places_reservees, 0)
    return {
      croisadesAVenir: croisades.filter((c) => c.statut === 'planifiee' || c.statut === 'en_cours').length,
      convoisOuverts: scope.filter((c) => c.statut === 'ouvert').length,
      totalConvois: scope.length,
      totalPlaces,
      placesReservees: reservees,
      placesRestantes: totalPlaces - reservees,
      tauxRemplissage: totalPlaces ? Math.round((reservees / totalPlaces) * 100) : 0,
      reservationsActives: actives.length,
      reservationsEnAttente: actives.filter((r) => r.statut === 'en_attente').length,
      paiementsAVerifier: paiements.filter((p) => p.statut === 'en_attente').length,
      montantEncaisse: paiements.filter((p) => p.statut === 'valide').reduce((s, p) => s + Number(p.montant), 0),
      vehiculesDisponibles: vehicules.filter((v) => v.statut === 'disponible').length,
      convois: scope,
      dernieresReservations: reservations.slice(0, 6),
    }
  },
}
