-- =====================================================================
-- Ambit: Setup Teil 4 — grösserer Umkreis + vorübergehender Standort
-- Ausführen: Dashboard → SQL Editor → New query → einfügen → Run
-- =====================================================================

-- 1) Umkreis neu bis 100 km (vorher 50)
alter table profiles drop constraint if exists profiles_radius_km_check;
alter table profiles add constraint profiles_radius_km_check
  check (radius_km between 1 and 100);

-- 2) Vorübergehender Standort (z. B. Ferien) — gilt statt des Wohnorts,
--    solange er gesetzt ist; der Wohnort bleibt gespeichert
alter table profiles add column if not exists current_area text;
alter table profiles add column if not exists current_lat double precision;
alter table profiles add column if not exists current_lng double precision;
