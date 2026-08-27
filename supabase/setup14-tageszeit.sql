-- =====================================================================
-- Ambit: Setup Teil 14 — Grobe Tageszeit statt genauer Uhrzeit bei
-- fixen Plänen (Stalking-Schutz). Die genaue Uhrzeit wird erst im
-- Plan-Chat festgelegt, sobald jemand angenommen wurde.
-- Ausführen: Dashboard → SQL Editor → New query → einfügen → Run
-- =====================================================================

alter table plans add column if not exists daypart text
  check (daypart in ('morning', 'midday', 'afternoon', 'evening'));
