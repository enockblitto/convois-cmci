import { IS_DEMO } from '../core/config'
import { callRpc } from './repository'
import { demoDb, latency } from './demoStore'

/**
 * Opérations métier critiques. En production elles sont exécutées côté serveur
 * (fonctions PostgreSQL dans supabase/schema.sql) pour garantir l'intégrité des places.
 * En mode démo, elles sont reproduites ici avec exactement les mêmes règles.
 */

const code = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

const placesRestantes = (c) => c.places_totales - c.places_reservees

const demo = {
  async reserverPlace({ convoiId, places, user }) {
    await latency(400)
    if (!user) throw new Error('Vous devez être connecté.')
    if (!Number.isInteger(places) || places < 1 || places > 10) throw new Error('Nombre de places invalide (1 à 10).')
    const convoi = demoDb.find('convois', convoiId)
    if (!convoi) throw new Error('Convoi introuvable.')
    if (convoi.statut !== 'ouvert') throw new Error('Ce convoi n’accepte plus de réservations.')
    const deja = demoDb
      .all('reservations')
      .some((r) => r.convoi_id === convoiId && r.participant_id === user.id && r.statut !== 'annulee')
    if (deja) throw new Error('Vous avez déjà une réservation active sur ce convoi.')
    if (placesRestantes(convoi) < places) throw new Error(`Il ne reste que ${placesRestantes(convoi)} place(s).`)

    const reservees = convoi.places_reservees + places
    demoDb.update('convois', convoiId, {
      places_reservees: reservees,
      statut: reservees >= convoi.places_totales ? 'complet' : convoi.statut,
    })
    return demoDb.insert('reservations', {
      convoi_id: convoiId,
      participant_id: user.id,
      nombre_places: places,
      montant: Number(convoi.prix) * places,
      statut: Number(convoi.prix) === 0 ? 'confirmee' : 'en_attente',
      code: code('CV'),
    })
  },

  async annulerReservation({ reservationId, user }) {
    await latency(300)
    const r = demoDb.find('reservations', reservationId)
    if (!r) throw new Error('Réservation introuvable.')
    const convoi = demoDb.find('convois', r.convoi_id)
    const isOwner = r.participant_id === user.id
    const isStaff = user.role === 'admin'
    if (!isOwner && !isStaff) throw new Error('Action non autorisée.')
    if (r.statut === 'annulee') return r
    if (isOwner && !isStaff && r.statut === 'confirmee') throw new Error('Une réservation payée doit être annulée par un administrateur.')
    const reservees = Math.max(0, convoi.places_reservees - r.nombre_places)
    demoDb.update('convois', convoi.id, {
      places_reservees: reservees,
      statut: convoi.statut === 'complet' && reservees < convoi.places_totales ? 'ouvert' : convoi.statut,
    })
    demoDb.all('paiements')
      .filter((p) => p.reservation_id === r.id && p.statut === 'en_attente')
      .forEach((p) => demoDb.update('paiements', p.id, { statut: 'rejete' }))
    return demoDb.update('reservations', r.id, { statut: 'annulee' })
  },

  async declarerPaiement({ reservationId, methode, reference, user }) {
    await latency(400)
    const r = demoDb.find('reservations', reservationId)
    if (!r || r.participant_id !== user.id) throw new Error('Réservation introuvable.')
    if (r.statut !== 'en_attente') throw new Error('Cette réservation n’attend pas de paiement.')
    const enCours = demoDb.all('paiements').some((p) => p.reservation_id === r.id && p.statut === 'en_attente')
    if (enCours) throw new Error('Un paiement est déjà en cours de vérification.')
    if (methode !== 'especes' && !reference?.trim()) throw new Error('La référence de transaction est obligatoire.')
    return demoDb.insert('paiements', {
      reservation_id: r.id,
      participant_id: user.id,
      montant: r.montant,
      methode,
      reference: reference?.trim() || null,
      statut: 'en_attente',
    })
  },

  async validerPaiement({ paiementId, accepte, user }) {
    await latency(300)
    const p = demoDb.find('paiements', paiementId)
    if (!p) throw new Error('Paiement introuvable.')
    const r = demoDb.find('reservations', p.reservation_id)
    const allowed = user.role === 'admin'
    if (!allowed) throw new Error('Action non autorisée.')
    if (p.statut !== 'en_attente') throw new Error('Ce paiement a déjà été traité.')
    if (!accepte) return demoDb.update('paiements', p.id, { statut: 'rejete', valide_par: user.id, valide_le: new Date().toISOString() })
    const n = demoDb.nextCounter('recu')
    demoDb.update('reservations', r.id, { statut: 'confirmee' })
    return demoDb.update('paiements', p.id, {
      statut: 'valide',
      numero_recu: `REC-${new Date().getFullYear()}-${String(n).padStart(6, '0')}`,
      valide_par: user.id,
      valide_le: new Date().toISOString(),
    })
  },
}

const server = {
  reserverPlace: ({ convoiId, places }) => callRpc('reserver_place', { p_convoi_id: convoiId, p_places: places }),
  annulerReservation: ({ reservationId }) => callRpc('annuler_reservation', { p_reservation_id: reservationId }),
  declarerPaiement: ({ reservationId, methode, reference }) =>
    callRpc('declarer_paiement', { p_reservation_id: reservationId, p_methode: methode, p_reference: reference || null }),
  validerPaiement: ({ paiementId, accepte }) => callRpc('valider_paiement', { p_paiement_id: paiementId, p_accepte: accepte }),
}

export const operations = IS_DEMO ? demo : server
