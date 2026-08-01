-- =====================================================================
-- Ambit: Setup Teil 3 — Plan erstellen (Zeitpunkt, Zeitfenster, Extras)
-- Voraussetzung: setup.sql und setup2-plaene.sql wurden schon ausgeführt.
-- Ausführen: Dashboard → SQL Editor → New query → einfügen → Run
-- =====================================================================

-- 1) Spalte «flexible» heisst neu «is_flexible» (klarerer Name)
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'plans' and column_name = 'flexible'
  ) then
    alter table plans rename column flexible to is_flexible;
  end if;
end $$;

-- 2) Neue Spalten für den Erstellen-Screen
alter table plans add column if not exists when_at timestamptz;     -- fixer Zeitpunkt
alter table plans add column if not exists time_window text         -- Zeitfenster (flexibel)
  check (time_window in ('this_week', 'weekend', 'next_week'));     -- alle max. 7 Tage
alter table plans add column if not exists alcohol_free boolean not null default false;

-- 3) Die alte Freitext-Spalte «when_text» braucht es nicht mehr
alter table plans drop column if exists when_text;

-- 4) Pro Person darf nur EIN flexibler Plan gleichzeitig aktiv sein.
--    Diese Regel setzt die Datenbank selbst durch.
create unique index if not exists ein_flexibler_plan_pro_person
  on plans (owner) where is_flexible;
