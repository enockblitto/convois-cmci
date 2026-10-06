-- Convertit les comptes responsables en administrateurs et limite les roles a admin/participant.
begin;

alter table public.profiles drop constraint if exists profiles_role_check;

update public.profiles
set role = 'admin'
where role = 'responsable';

alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'participant'));

create or replace function public.can_view_profile(p_profile_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_profile_id = auth.uid() or public.is_admin()
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

drop policy if exists conducteurs_read on public.conducteurs;
create policy conducteurs_read on public.conducteurs for select using (public.is_admin());

drop policy if exists reservations_read on public.reservations;
create policy reservations_read on public.reservations for select
  using (participant_id = auth.uid() or public.is_admin());

drop policy if exists paiements_read on public.paiements;
create policy paiements_read on public.paiements for select
  using (participant_id = auth.uid() or public.is_admin());

drop function if exists public.is_responsable_of(uuid);

commit;