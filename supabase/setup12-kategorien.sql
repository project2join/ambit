-- =====================================================================
-- Ambit: Setup Teil 12 — Kategorien neu geordnet
-- Vorher: sport, kaffee, essen, ausgang
-- Neu:    sport, essen, ausgang, unterwegs (kaffee verschmilzt mit essen)
-- Ausführen: Dashboard → SQL Editor → New query → einfügen → Run
-- =====================================================================

-- Bestehende Pläne: "kaffee" wird zu "essen"
update plans set category = 'essen' where category = 'kaffee';

-- Bestehende Profile: "kaffee" in der Kategorien-Liste durch "essen"
-- ersetzen, dabei doppelte Einträge entfernen (falls essen schon da war)
update profiles
set categories = (
  select array_agg(distinct x) from unnest(
    array_replace(categories, 'kaffee', 'essen')
  ) as x
)
where 'kaffee' = any(categories);
