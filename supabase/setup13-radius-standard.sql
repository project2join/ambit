-- =====================================================================
-- Ambit: Setup Teil 13 — Standard-Umkreis von 10 km auf 50 km erhöht
-- Ausführen: Dashboard → SQL Editor → New query → einfügen → Run
-- =====================================================================

-- 1) Neue Profile starten künftig mit 50 km statt 10 km
alter table profiles alter column radius_km set default 50;

-- 2) Bestehende Profile, die den Regler nie angefasst haben (noch bei
--    10 km), auf den neuen Standard anheben. Wer selbst schon einen
--    anderen Wert gewählt hat, bleibt unverändert.
update profiles set radius_km = 50 where radius_km = 10;

-- 3) Die Sichtbarkeits-Regel für Pläne neu — gleiche Logik wie zuvor,
--    nur der Rückfallwert (falls radius_km einmal leer wäre) auf 50.
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
              ) <= coalesce(me.radius_km, 50)
      )
    )
  );
