-- =====================================================================
-- Ambit: Setup Teil 11 — Umkreis-Filter für Pläne + automatisches
-- Aufräumen abgelaufener Pläne
-- Ausführen: Dashboard → SQL Editor → New query → einfügen → Run
--
-- WICHTIG: Für den zweiten Teil (automatisches Löschen) muss zuerst
-- die Erweiterung "pg_cron" eingeschaltet sein:
-- Dashboard → Database → Extensions → nach "pg_cron" suchen → aktivieren.
-- Erst danach dieses ganze Skript ausführen.
-- =====================================================================

-- 1) Umkreis neu bis 300 km (vorher 100) — reicht damit auch für
--    Nachbarländer, statt komplett grenzenlos zu sein
alter table profiles drop constraint if exists profiles_radius_km_check;
alter table profiles add constraint profiles_radius_km_check
  check (radius_km between 1 and 300);

-- 2) Entfernung zwischen zwei Orten berechnen (in Kilometern).
--    Rechnet serverseitig — die genauen Koordinaten verlassen die
--    Datenbank nie, nur "passt in den Umkreis oder nicht" zählt.
create or replace function distance_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision
language sql immutable
as $$
  select case
    when lat1 is null or lng1 is null or lat2 is null or lng2 is null then 0
    else 6371 * acos(
      greatest(-1, least(1,
        cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2) - radians(lng1))
        + sin(radians(lat1)) * sin(radians(lat2))
      ))
    )
  end;
$$;

-- 3) Sichtbarkeits-Regel für Pläne neu — jetzt zusätzlich mit
--    Umkreis-Filter. Der Ferien-Standort (current_lat/lng) zählt,
--    falls gesetzt, sonst der Wohnort.
drop policy if exists "Sichtbare Plaene lesen" on plans;

create policy "Sichtbare Plaene lesen"
  on plans for select using (
    owner = auth.uid()
    or (
      not is_blocked(auth.uid(), owner)
      and exists (
        select 1 from profiles me
        join profiles host on host.id = plans.owner
        where me.id = auth.uid()
          and (age_min is null or me.age >= age_min)
          and (age_max is null or me.age <= age_max)
          and (gender_filter = 'all'
               or (gender_filter = 'women' and me.gender = 'woman')
               or (gender_filter = 'men' and me.gender = 'man'))
          and (not verified_only or me.is_verified = true)
          and distance_km(
                coalesce(host.current_lat, host.home_lat),
                coalesce(host.current_lng, host.home_lng),
                coalesce(me.current_lat, me.home_lat),
                coalesce(me.current_lng, me.home_lng)
              ) <= coalesce(me.radius_km, 10)
      )
    )
  );

-- 4) Automatisches Aufräumen: Pläne, deren Termin vorbei ist und bei
--    denen NIEMAND angenommen wurde, verschwinden von selbst — auch
--    beim Host unter «Meine». Pläne mit mindestens einer angenommenen
--    Person bleiben immer (sonst würde der Chat kaputtgehen).
--    Flexible Pläne ohne Termin räumen nach 10 Tagen auf, falls
--    ebenfalls niemand angenommen wurde.
create or replace function cleanup_expired_plans() returns void
language sql security definer
set search_path = public, pg_temp
as $$
  delete from plans
  where (
    (is_flexible = false and when_at is not null and when_at < now() - interval '24 hours')
    or (is_flexible = true and created_at < now() - interval '10 days')
  )
  and not exists (
    select 1 from requests r where r.plan_id = plans.id and r.status = 'accepted'
  );
$$;

-- Stündlich ausführen (überschreibt einen bestehenden Zeitplan gleichen Namens)
do $$ begin
  perform cron.unschedule('cleanup-expired-plans');
exception when others then null;
end $$;

select cron.schedule('cleanup-expired-plans', '0 * * * *', 'select cleanup_expired_plans();');
