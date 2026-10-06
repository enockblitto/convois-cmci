-- Donnees initiales CMCI Convois
-- A executer dans Supabase > SQL Editor apres schema.sql.
-- Le script peut etre relance sans creer de doublons.

insert into public.croisades (titre, description, lieu, ville, date_debut, date_fin, statut)
select 'Grande Croisade de Bouaké',
       'Trois jours de louange, d’enseignement et de prière pour la région du Gbêkê.',
       'Stade de la Paix', 'Bouaké', current_date + 18, current_date + 20, 'planifiee'
where not exists (
  select 1 from public.croisades where titre = 'Grande Croisade de Bouaké'
);

insert into public.croisades (titre, description, lieu, ville, date_debut, date_fin, statut)
select 'Croisade de San-Pédro',
       'Évangélisation et guérison sur la côte ouest.',
       'Place de la Mairie', 'San-Pédro', current_date + 40, current_date + 42, 'planifiee'
where not exists (
  select 1 from public.croisades where titre = 'Croisade de San-Pédro'
);

insert into public.croisades (titre, description, lieu, ville, date_debut, date_fin, statut)
select 'Croisade de Yamoussoukro',
      'Rassemblement national des communautés CMCI.',
      'Fondation Félix Houphouët-Boigny', 'Yamoussoukro', current_date - 30, current_date - 28, 'terminee'
where not exists (
  select 1 from public.croisades where titre = 'Croisade de Yamoussoukro'
);

insert into public.vehicules (immatriculation, marque, modele, capacite, statut)
values
  ('1461 AK 05', 'Sunlong', 'SLK6128', 55, 'disponible'),
  ('2280 GH 01', 'Hyundai', 'Universe', 45, 'disponible'),
  ('0934 FT 01', 'Marcopolo', 'Paradiso', 50, 'disponible'),
  ('7712 BD 02', 'Toyota', 'Coaster', 30, 'maintenance')
on conflict (immatriculation) do nothing;

insert into public.conducteurs (nom, prenom, telephone, numero_permis, statut)
select seed.nom, seed.prenom, seed.telephone, seed.numero_permis, seed.statut
from (values
  ('Traoré', 'Moussa', '07 48 12 33 90', 'CI-D-554120', 'actif'),
  ('Bamba', 'Ibrahim', '05 66 41 20 11', 'CI-D-883012', 'actif'),
  ('N’Guessan', 'Paul', '01 23 45 67 89', 'CI-D-120456', 'actif'),
  ('Coulibaly', 'Adama', '07 11 22 33 44', 'CI-D-778899', 'inactif')
) as seed(nom, prenom, telephone, numero_permis, statut)
where not exists (
  select 1 from public.conducteurs existing where existing.telephone = seed.telephone
);

insert into public.convois (
  croisade_id, vehicule_id, conducteur_id, point_depart, destination,
  date_depart, date_retour, prix, places_totales, places_reservees,
  contact_telephone, statut
)
select croisade.id,
       vehicule.id,
       conducteur.id,
       seed.point_depart,
       seed.destination,
       croisade.date_debut + seed.heure_depart,
       croisade.date_fin + seed.heure_retour,
       seed.prix,
       seed.places_totales,
       0,
       seed.contact_telephone,
       'ouvert'
from (values
  ('Grande Croisade de Bouaké', '1461 AK 05', '07 48 12 33 90', 'Abidjan — Gare d’Adjamé', 'Bouaké', time '05:00', time '18:00', 7000, 55, '05 05 00 00 02'),
  ('Grande Croisade de Bouaké', '2280 GH 01', '05 66 41 20 11', 'Abidjan — Yopougon Siporex', 'Bouaké', time '06:00', time '18:00', 7000, 45, '05 05 00 00 02'),
  ('Grande Croisade de Bouaké', '0934 FT 01', '01 23 45 67 89', 'Yamoussoukro — Gare UTB', 'Bouaké', time '07:00', time '17:00', 3500, 50, '07 07 00 00 01'),
  ('Croisade de San-Pédro', '2280 GH 01', '05 66 41 20 11', 'Abidjan — Cocody Riviera', 'San-Pédro', time '05:00', time '18:00', 8000, 45, '05 05 00 00 02')
) as seed(croisade_titre, immatriculation, conducteur_telephone, point_depart, destination, heure_depart, heure_retour, prix, places_totales, contact_telephone)
join public.croisades croisade on croisade.titre = seed.croisade_titre
join public.vehicules vehicule on vehicule.immatriculation = seed.immatriculation
join public.conducteurs conducteur on conducteur.telephone = seed.conducteur_telephone
where not exists (
  select 1
  from public.convois existing
  where existing.croisade_id = croisade.id
    and existing.point_depart = seed.point_depart
);