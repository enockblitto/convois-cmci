-- =====================================================================
-- CMCI Convois — schéma Supabase (PostgreSQL)
-- À exécuter dans Supabase > SQL Editor (projet gratuit).
-- Couches : tables -> fonctions utilitaires -> fonctions métier (RPC) -> RLS
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  nom text,
  prenom text,
  telephone text,
  role text not null default 'participant' check (role in ('admin', 'participant')),
  created_at timestamptz not null default now()
);

create table if not exists public.croisades (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text,
  lieu text,
  ville text not null,
  date_debut date not null,
  date_fin date not null,
  image_url text,
  statut text not null default 'planifiee' check (statut in ('planifiee', 'en_cours', 'terminee', 'annulee')),
  created_at timestamptz not null default now(),
  check (date_fin >= date_debut)
);

create table if not exists public.vehicules (
  id uuid primary key default gen_random_uuid(),
  immatriculation text not null unique,
  marque text not null,
  modele text,
  capacite int not null check (capacite > 0),
  statut text not null default 'disponible' check (statut in ('disponible', 'maintenance', 'indisponible')),
  created_at timestamptz not null default now()
);

create table if not exists public.conducteurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text,
  telephone text not null,
  numero_permis text,
  statut text not null default 'actif' check (statut in ('actif', 'inactif')),
  created_at timestamptz not null default now()
);

create table if not exists public.convois (
  id uuid primary key default gen_random_uuid(),
  croisade_id uuid not null references public.croisades (id) on delete restrict,
  vehicule_id uuid references public.vehicules (id) on delete set null,
  conducteur_id uuid references public.conducteurs (id) on delete set null,
  responsable_id uuid references public.profiles (id) on delete set null,
  point_depart text not null,
  destination text,
  date_depart timestamptz not null,
  date_retour timestamptz,
  prix numeric(10, 0) not null default 0 check (prix >= 0),
  places_totales int not null check (places_totales > 0),
  places_reservees int not null default 0 check (places_reservees >= 0),
  contact_telephone text,
  statut text not null default 'ouvert' check (statut in ('ouvert', 'complet', 'en_route', 'termine', 'annule')),
  created_at timestamptz not null default now(),
  check (places_reservees <= places_totales)
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  convoi_id uuid not null references public.convois (id) on delete restrict,
  participant_id uuid not null references public.profiles (id) on delete cascade,
  nombre_places int not null default 1 check (nombre_places between 1 and 10),
  montant numeric(10, 0) not null default 0,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'confirmee', 'annulee')),
  code text not null unique,
  created_at timestamptz not null default now()
);
-- Empêche les doublons : une seule réservation active par participant et par convoi
create unique index if not exists reservations_unique_active
  on public.reservations (convoi_id, participant_id) where statut <> 'annulee';

create sequence if not exists public.recu_seq;

create table if not exists public.paiements (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  participant_id uuid not null references public.profiles (id) on delete cascade,
  montant numeric(10, 0) not null,
  methode text not null check (methode in ('especes', 'orange_money', 'mtn_money', 'moov_money', 'wave')),
  reference text,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'valide', 'rejete')),
  numero_recu text unique,
  valide_par uuid references public.profiles (id),
  valide_le timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists convois_croisade_idx on public.convois (croisade_id);
create index if not exists reservations_convoi_idx on public.reservations (convoi_id);
create index if not exists reservations_participant_idx on public.reservations (participant_id);
create index if not exists paiements_reservation_idx on public.paiements (reservation_id);

-- ---------------------------------------------------------------------
-- Fonctions utilitaires (rôles)
-- ---------------------------------------------------------------------
create or replace function public.current_role_name() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() = 'admin', false)
$$;

create or replace function public.can_view_profile(p_profile_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_profile_id = auth.uid() or public.is_admin()
$$;

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, nom, prenom, telephone)
  values (
    new.id, new.email,
    new.raw_user_meta_data ->> 'nom',
    new.raw_user_meta_data ->> 'prenom',
    new.raw_user_meta_data ->> 'telephone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Un utilisateur ne peut pas changer son propre rôle (seul un admin le peut)
create or replace function public.protect_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() est nul depuis le SQL Editor (accès propriétaire) : autorisé
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Seul un administrateur peut modifier les rôles.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_role();

-- ---------------------------------------------------------------------
-- Fonctions métier (appelées via supabase.rpc)
-- Le verrou FOR UPDATE garantit qu'on ne vend jamais plus de places qu'il n'y en a.
-- ---------------------------------------------------------------------
create or replace function public.reserver_place(p_convoi_id uuid, p_places int default 1)
returns public.reservations
language plpgsql security definer set search_path = public as $$
declare
  v_convoi public.convois;
  v_res public.reservations;
begin
  if auth.uid() is null then raise exception 'Vous devez être connecté.'; end if;
  if p_places is null or p_places < 1 or p_places > 10 then raise exception 'Nombre de places invalide (1 à 10).'; end if;

  select * into v_convoi from public.convois where id = p_convoi_id for update;
  if not found then raise exception 'Convoi introuvable.'; end if;
  if v_convoi.statut <> 'ouvert' then raise exception 'Ce convoi n''accepte plus de réservations.'; end if;
  if exists (select 1 from public.reservations where convoi_id = p_convoi_id and participant_id = auth.uid() and statut <> 'annulee') then
    raise exception 'Vous avez déjà une réservation active sur ce convoi.';
  end if;
  if v_convoi.places_totales - v_convoi.places_reservees < p_places then
    raise exception 'Il ne reste que % place(s).', v_convoi.places_totales - v_convoi.places_reservees;
  end if;

  update public.convois
     set places_reservees = places_reservees + p_places,
         statut = case when places_reservees + p_places >= places_totales then 'complet' else statut end
   where id = p_convoi_id;

  insert into public.reservations (convoi_id, participant_id, nombre_places, montant, statut, code)
  values (
    p_convoi_id, auth.uid(), p_places, v_convoi.prix * p_places,
    case when v_convoi.prix = 0 then 'confirmee' else 'en_attente' end,
    'CV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  )
  returning * into v_res;
  return v_res;
end;
$$;

create or replace function public.annuler_reservation(p_reservation_id uuid)
returns public.reservations
language plpgsql security definer set search_path = public as $$
declare
  v_res public.reservations;
  v_admin boolean;
begin
  select * into v_res from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'Réservation introuvable.'; end if;
  v_admin := public.is_admin();
  if v_res.participant_id <> auth.uid() and not v_admin then raise exception 'Action non autorisée.'; end if;
  if v_res.statut = 'annulee' then return v_res; end if;
  if not v_admin and v_res.statut = 'confirmee' then
    raise exception 'Une réservation payée doit être annulée par un administrateur.';
  end if;

  update public.convois
     set places_reservees = greatest(0, places_reservees - v_res.nombre_places),
         statut = case when statut = 'complet' then 'ouvert' else statut end
   where id = v_res.convoi_id;
  update public.paiements set statut = 'rejete' where reservation_id = v_res.id and statut = 'en_attente';
  update public.reservations set statut = 'annulee' where id = v_res.id returning * into v_res;
  return v_res;
end;
$$;

create or replace function public.declarer_paiement(p_reservation_id uuid, p_methode text, p_reference text default null)
returns public.paiements
language plpgsql security definer set search_path = public as $$
declare
  v_res public.reservations;
  v_pay public.paiements;
begin
  select * into v_res from public.reservations where id = p_reservation_id and participant_id = auth.uid();
  if not found then raise exception 'Réservation introuvable.'; end if;
  if v_res.statut <> 'en_attente' then raise exception 'Cette réservation n''attend pas de paiement.'; end if;
  if exists (select 1 from public.paiements where reservation_id = v_res.id and statut = 'en_attente') then
    raise exception 'Un paiement est déjà en cours de vérification.';
  end if;
  if p_methode <> 'especes' and coalesce(trim(p_reference), '') = '' then
    raise exception 'La référence de transaction est obligatoire.';
  end if;
  insert into public.paiements (reservation_id, participant_id, montant, methode, reference)
  values (v_res.id, auth.uid(), v_res.montant, p_methode, nullif(trim(p_reference), ''))
  returning * into v_pay;
  return v_pay;
end;
$$;

create or replace function public.valider_paiement(p_paiement_id uuid, p_accepte boolean)
returns public.paiements
language plpgsql security definer set search_path = public as $$
declare
  v_pay public.paiements;
  v_res public.reservations;
begin
  select * into v_pay from public.paiements where id = p_paiement_id for update;
  if not found then raise exception 'Paiement introuvable.'; end if;
  select * into v_res from public.reservations where id = v_pay.reservation_id;
  if not public.is_admin() then raise exception 'Action non autorisée.'; end if;
  if v_pay.statut <> 'en_attente' then raise exception 'Ce paiement a déjà été traité.'; end if;

  if not p_accepte then
    update public.paiements set statut = 'rejete', valide_par = auth.uid(), valide_le = now()
     where id = v_pay.id returning * into v_pay;
    return v_pay;
  end if;

  update public.reservations set statut = 'confirmee' where id = v_res.id;
  update public.paiements
     set statut = 'valide', valide_par = auth.uid(), valide_le = now(),
         numero_recu = 'REC-' || extract(year from now())::int || '-' || lpad(nextval('public.recu_seq')::text, 6, '0')
   where id = v_pay.id
  returning * into v_pay;
  return v_pay;
end;
$$;

revoke execute on function public.reserver_place(uuid, int) from anon;
revoke execute on function public.annuler_reservation(uuid) from anon;
revoke execute on function public.declarer_paiement(uuid, text, text) from anon;
revoke execute on function public.valider_paiement(uuid, boolean) from anon;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.croisades enable row level security;
alter table public.vehicules enable row level security;
alter table public.conducteurs enable row level security;
alter table public.convois enable row level security;
alter table public.reservations enable row level security;
alter table public.paiements enable row level security;

-- profils
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (public.can_view_profile(id));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid() or public.is_admin());

-- données publiques (consultation) / écriture admin
drop policy if exists croisades_read on public.croisades;
create policy croisades_read on public.croisades for select using (true);
drop policy if exists croisades_write on public.croisades;
create policy croisades_write on public.croisades for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists vehicules_read on public.vehicules;
create policy vehicules_read on public.vehicules for select using (true);
drop policy if exists vehicules_write on public.vehicules;
create policy vehicules_write on public.vehicules for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists convois_read on public.convois;
create policy convois_read on public.convois for select using (true);
drop policy if exists convois_write on public.convois;
create policy convois_write on public.convois for all using (public.is_admin()) with check (public.is_admin());

-- conducteurs : visibles par l'équipe uniquement
drop policy if exists conducteurs_read on public.conducteurs;
create policy conducteurs_read on public.conducteurs for select using (public.is_admin());
drop policy if exists conducteurs_write on public.conducteurs;
create policy conducteurs_write on public.conducteurs for all using (public.is_admin()) with check (public.is_admin());

-- réservations / paiements : lecture par le participant ou un administrateur.
-- Les écritures passent exclusivement par les fonctions métier ci-dessus.
drop policy if exists reservations_read on public.reservations;
create policy reservations_read on public.reservations for select
  using (participant_id = auth.uid() or public.is_admin());

drop policy if exists paiements_read on public.paiements;
create policy paiements_read on public.paiements for select
  using (
    participant_id = auth.uid() or public.is_admin()
  );

-- ---------------------------------------------------------------------
-- Premier administrateur : après vous être inscrit dans l'application,
-- exécutez dans le SQL Editor (en remplaçant l'email) :
--   update public.profiles set role = 'admin' where email = 'votre-email@exemple.com';
-- ---------------------------------------------------------------------
