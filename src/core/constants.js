export const ROLES = {
  admin: 'Administrateur',
  participant: 'Participant',
}

export const CROISADE_STATUTS = {
  planifiee: { label: 'Planifiée', tone: 'blue' },
  en_cours: { label: 'En cours', tone: 'green' },
  terminee: { label: 'Terminée', tone: 'slate' },
  annulee: { label: 'Annulée', tone: 'red' },
}

export const CONVOI_STATUTS = {
  ouvert: { label: 'Ouvert', tone: 'green' },
  complet: { label: 'Complet', tone: 'amber' },
  en_route: { label: 'En route', tone: 'blue' },
  termine: { label: 'Terminé', tone: 'slate' },
  annule: { label: 'Annulé', tone: 'red' },
}

export const VEHICULE_STATUTS = {
  disponible: { label: 'Disponible', tone: 'green' },
  maintenance: { label: 'En maintenance', tone: 'amber' },
  indisponible: { label: 'Indisponible', tone: 'red' },
}

export const CONDUCTEUR_STATUTS = {
  actif: { label: 'Actif', tone: 'green' },
  inactif: { label: 'Inactif', tone: 'slate' },
}

export const RESERVATION_STATUTS = {
  en_attente: { label: 'En attente de paiement', tone: 'amber' },
  confirmee: { label: 'Confirmée', tone: 'green' },
  annulee: { label: 'Annulée', tone: 'red' },
}

export const PAIEMENT_STATUTS = {
  en_attente: { label: 'À vérifier', tone: 'amber' },
  valide: { label: 'Validé', tone: 'green' },
  rejete: { label: 'Rejeté', tone: 'red' },
}

export const PAIEMENT_METHODES = {
  especes: 'Espèces (auprès du responsable)',
  orange_money: 'Orange Money',
  mtn_money: 'MTN MoMo',
  moov_money: 'Moov Money',
  wave: 'Wave',
}

export const toOptions = (map) =>
  Object.entries(map).map(([value, v]) => ({ value, label: typeof v === 'string' ? v : v.label }))
