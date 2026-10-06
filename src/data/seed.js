const day = 24 * 3600 * 1000
const at = (days, hour = 6) => {
  const d = new Date(Date.now() + days * day)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const DEMO_ACCOUNTS = [
  { email: 'admin@cmci.ci', password: 'admin123', role: 'admin' },
  { email: 'fidele@cmci.ci', password: 'demo123', role: 'participant' },
]

export function buildSeed() {
  const ids = {
    admin: 'u-admin',
    fidele: 'u-fidele',
    c1: 'cr-1',
    c2: 'cr-2',
    c3: 'cr-3',
    v1: 've-1',
    v2: 've-2',
    v3: 've-3',
    v4: 've-4',
    d1: 'co-1',
    d2: 'co-2',
    d3: 'co-3',
    d4: 'co-4',
  }
  const now = new Date().toISOString()
  return {
    auth_users: DEMO_ACCOUNTS.map((a, i) => ({
      id: [ids.admin, ids.fidele][i],
      email: a.email,
      password: a.password,
    })),
    profiles: [
      { id: ids.admin, email: 'admin@cmci.ci', nom: 'Kouassi', prenom: 'Emmanuel', telephone: '07 07 00 00 01', role: 'admin', created_at: now },
      { id: ids.fidele, email: 'fidele@cmci.ci', nom: 'Koné', prenom: 'Samuel', telephone: '01 01 00 00 03', role: 'participant', created_at: now },
    ],
    croisades: [
      { id: ids.c1, titre: 'Grande Croisade de Bouaké', description: 'Trois jours de louange, d’enseignement et de prière pour la région du Gbêkê.', lieu: 'Stade de la Paix', ville: 'Bouaké', date_debut: at(18, 0), date_fin: at(20, 0), statut: 'planifiee', created_at: now },
      { id: ids.c2, titre: 'Croisade de San-Pédro', description: 'Évangélisation et guérison sur la côte ouest.', lieu: 'Place de la Mairie', ville: 'San-Pédro', date_debut: at(40, 0), date_fin: at(42, 0), statut: 'planifiee', created_at: now },
      { id: ids.c3, titre: 'Croisade de Yamoussoukro', description: 'Rassemblement national des communautés CMCI.', lieu: 'Fondation Félix Houphouët-Boigny', ville: 'Yamoussoukro', date_debut: at(-30, 0), date_fin: at(-28, 0), statut: 'terminee', created_at: now },
    ],
    vehicules: [
      { id: ids.v1, immatriculation: '1461 AK 05', marque: 'Sunlong', modele: 'SLK6128', capacite: 55, statut: 'disponible', created_at: now },
      { id: ids.v2, immatriculation: '2280 GH 01', marque: 'Hyundai', modele: 'Universe', capacite: 45, statut: 'disponible', created_at: now },
      { id: ids.v3, immatriculation: '0934 FT 01', marque: 'Marcopolo', modele: 'Paradiso', capacite: 50, statut: 'disponible', created_at: now },
      { id: ids.v4, immatriculation: '7712 BD 02', marque: 'Toyota', modele: 'Coaster', capacite: 30, statut: 'maintenance', created_at: now },
    ],
    conducteurs: [
      { id: ids.d1, nom: 'Traoré', prenom: 'Moussa', telephone: '07 48 12 33 90', numero_permis: 'CI-D-554120', statut: 'actif', created_at: now },
      { id: ids.d2, nom: 'Bamba', prenom: 'Ibrahim', telephone: '05 66 41 20 11', numero_permis: 'CI-D-883012', statut: 'actif', created_at: now },
      { id: ids.d3, nom: 'N’Guessan', prenom: 'Paul', telephone: '01 23 45 67 89', numero_permis: 'CI-D-120456', statut: 'actif', created_at: now },
      { id: ids.d4, nom: 'Coulibaly', prenom: 'Adama', telephone: '07 11 22 33 44', numero_permis: 'CI-D-778899', statut: 'inactif', created_at: now },
    ],
    convois: [
      { id: 'cv-1', croisade_id: ids.c1, vehicule_id: ids.v1, conducteur_id: ids.d1, responsable_id: ids.admin, point_depart: 'Abidjan — Gare d’Adjamé', destination: 'Bouaké', date_depart: at(18, 5), date_retour: at(20, 18), prix: 7000, places_totales: 55, places_reservees: 41, contact_telephone: '07 07 00 00 01', statut: 'ouvert', created_at: now },
      { id: 'cv-2', croisade_id: ids.c1, vehicule_id: ids.v2, conducteur_id: ids.d2, responsable_id: ids.admin, point_depart: 'Abidjan — Yopougon Siporex', destination: 'Bouaké', date_depart: at(18, 6), date_retour: at(20, 18), prix: 7000, places_totales: 45, places_reservees: 12, contact_telephone: '07 07 00 00 01', statut: 'ouvert', created_at: now },
      { id: 'cv-3', croisade_id: ids.c1, vehicule_id: ids.v3, conducteur_id: ids.d3, responsable_id: null, point_depart: 'Yamoussoukro — Gare UTB', destination: 'Bouaké', date_depart: at(18, 7), date_retour: at(20, 17), prix: 3500, places_totales: 50, places_reservees: 50, contact_telephone: '07 07 00 00 01', statut: 'complet', created_at: now },
      { id: 'cv-4', croisade_id: ids.c2, vehicule_id: ids.v2, conducteur_id: ids.d2, responsable_id: ids.admin, point_depart: 'Abidjan — Cocody Riviera', destination: 'San-Pédro', date_depart: at(40, 5), date_retour: at(42, 18), prix: 8000, places_totales: 45, places_reservees: 3, contact_telephone: '07 07 00 00 01', statut: 'ouvert', created_at: now },
    ],
    reservations: [],
    paiements: [],
    counters: { recu: 0 },
  }
}
