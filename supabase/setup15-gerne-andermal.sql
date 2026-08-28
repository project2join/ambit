-- =====================================================================
-- Ambit: Setup Teil 15 — «Gerne ein andermal»
-- Wer an einem Plan interessiert ist, aber am Termin nicht kann, kann
-- das dem Host sichtbar mitteilen — ohne einen Platz zu belegen und
-- ohne versteckten Match-Mechanismus (siehe TODO.md für die Überlegung
-- dazu: der Host hätte sonst keinen Anlass, das je zu sehen).
-- Ausführen: Dashboard → SQL Editor → New query → einfügen → Run
-- =====================================================================

alter table requests drop constraint if exists requests_status_check;
alter table requests add constraint requests_status_check
  check (status in ('pending', 'accepted', 'declined', 'cancelled', 'interested_later'));
