-- =====================================================================
-- Ambit: Setup Teil 8 — Sicherheit (Blockieren, Melden, Verifiziert,
-- Benachrichtigungs-Einstellungen, Konto löschen)
-- Ausführen: Dashboard → SQL Editor → New query → einfügen → Run
-- =====================================================================

-- 1) Verifiziert-Feld vereinheitlichen: es gilt «is_verified».
--    Die alte Spalte «verified» wird übernommen und entfernt.
alter table profiles add column if not exists is_verified boolean default false;

-- Die Sichtbarkeits-Regel hängt an der alten Spalte — zuerst lösen
drop policy if exists "Sichtbare Plaene lesen" on plans;

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'verified'
  ) then
    execute 'update profiles set is_verified = true where coalesce(verified, false)';
    execute 'alter table profiles drop column verified';
  end if;
end $$;

-- 2) Benachrichtigungs-Einstellungen am Profil
alter table profiles add column if not exists notify_requests boolean default true;
alter table profiles add column if not exists notify_messages boolean default true;

-- 3) Meldungen: Freitext-Grund, landet für den Betreiber in der Tabelle
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid not null references profiles (id) on delete cascade,
  reported_user uuid references profiles (id) on delete set null,
  plan_id uuid references plans (id) on delete set null,
  reason text not null check (char_length(reason) <= 1000),
  created_at timestamptz default now()
);

alter table reports enable row level security;

create policy "Melden"
  on reports for insert with check (reporter = auth.uid());

create policy "Eigene Meldungen sehen"
  on reports for select using (reporter = auth.uid());

-- 4) Blockieren wirkt überall — beidseitig und sofort.

-- a) Profile: Blockierte tauchen in der öffentlichen Sicht nicht mehr auf
drop view if exists public_profiles;

create view public_profiles as
  select id, name, age, home_area, languages, rhythm,
         photo_urls, about, prompts, categories, rel_model, is_verified
  from profiles
  where onboarding_done = true
    and not is_blocked(auth.uid(), id);

revoke all on public_profiles from anon;
grant select on public_profiles to authenticated;

-- b) Pläne: wie bisher — plus jetzt mit «is_verified»
create policy "Sichtbare Plaene lesen"
  on plans for select using (
    owner = auth.uid()
    or (
      not is_blocked(auth.uid(), owner)
      and exists (
        select 1 from profiles me
        where me.id = auth.uid()
          and (age_min is null or me.age >= age_min)
          and (age_max is null or me.age <= age_max)
          and (gender_filter = 'all'
               or (gender_filter = 'women' and me.gender = 'woman')
               or (gender_filter = 'men' and me.gender = 'man'))
          and (not verified_only or me.is_verified = true)
      )
    )
  );

-- c) Anfragen: zwischen blockierten Personen unsichtbar
drop policy if exists "Anfragen sehen" on requests;

create policy "Anfragen sehen"
  on requests for select using (
    (
      requester = auth.uid()
      or exists (select 1 from plans p where p.id = plan_id and p.owner = auth.uid())
    )
    and not is_blocked(auth.uid(), requester)
    and not exists (
      select 1 from plans p
      where p.id = plan_id and is_blocked(auth.uid(), p.owner)
    )
  );

-- d) Chat: Nachrichten blockierter Personen verschwinden
drop policy if exists "Chat lesen" on messages;

create policy "Chat lesen"
  on messages for select using (
    is_plan_participant(plan_id, auth.uid())
    and (sender is null or not is_blocked(auth.uid(), sender))
    and not exists (
      select 1 from plans p
      where p.id = plan_id and is_blocked(auth.uid(), p.owner)
    )
    and (
      is_keeper_match(plan_id, auth.uid())
      or exists (
        select 1 from plans p
        where p.id = plan_id
          and (p.when_at is null or p.when_at > now() - interval '7 days')
      )
    )
  );

-- 5) Konto löschen: entfernt alles unwiderruflich — Profil, Pläne,
--    Anfragen, Nachrichten und den Zugang selbst.
--    (Fotos löscht die App vorher aus dem Speicher.)
create or replace function delete_my_account()
returns void
language plpgsql security definer
set search_path = public, auth, pg_temp
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Nicht angemeldet';
  end if;

  delete from public.messages where sender = me;
  delete from public.profiles where id = me;  -- räumt Pläne, Anfragen usw. mit ab
  delete from auth.users where id = me;
end $$;

revoke execute on function delete_my_account() from anon;
grant execute on function delete_my_account() to authenticated;
