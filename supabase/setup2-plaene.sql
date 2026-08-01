-- =====================================================================
-- Ambit: Setup Teil 2 — Pläne, Blockierungen, Verifiziert-Feld
-- Voraussetzung: setup.sql wurde schon ausgeführt.
-- Ausführen: Dashboard → SQL Editor → New query → einfügen → Run
-- =====================================================================

-- 1) Profile bekommen ein Verifiziert-Feld (für den «nur verifiziert»-Filter)
alter table profiles add column if not exists verified boolean default false;

-- 2) Die Pläne-Tabelle: ein «Ich geh eh …»-Plan pro Zeile
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references profiles (id) on delete cascade,
  category text not null,                       -- sport / kaffee / essen / ausgang
  text text not null check (char_length(text) <= 200),
  when_text text,                               -- z. B. «Do · 19:00»
  flexible boolean default false,               -- Datum noch offen?
  spots int not null default 2 check (spots between 1 and 10),
  taken int not null default 0,                 -- belegte Plätze
  age_min int,                                  -- Sichtbarkeits-Filter (optional)
  age_max int,
  gender_filter text not null default 'all',    -- all / women / men
  verified_only boolean not null default false,
  created_at timestamptz default now()
);

-- 3) Blockierungen: wer wen blockiert hat (gegenseitig unsichtbar)
create table if not exists blocks (
  blocker uuid not null references profiles (id) on delete cascade,
  blocked uuid not null references profiles (id) on delete cascade,
  primary key (blocker, blocked)
);

alter table blocks enable row level security;

create policy "Eigene Blockierungen sehen"
  on blocks for select using (auth.uid() = blocker);

create policy "Blockieren"
  on blocks for insert with check (auth.uid() = blocker);

create policy "Blockierung aufheben"
  on blocks for delete using (auth.uid() = blocker);

-- Hilfsfunktion: Sind zwei Personen (in irgendeiner Richtung) blockiert?
-- «security definer»: darf beide Richtungen prüfen, ohne sie offenzulegen.
create or replace function is_blocked(person_a uuid, person_b uuid)
returns boolean
language sql security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from blocks
    where (blocker = person_a and blocked = person_b)
       or (blocker = person_b and blocked = person_a)
  );
$$;

-- 4) Sichtbarkeits-Logik — DIE Kernregel aus CLAUDE.md.
--    Sie läuft in der Datenbank selbst: Wer nicht passt, bekommt den
--    Plan gar nie geschickt. Eigene Pläne sieht man immer.
alter table plans enable row level security;

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
          and (not verified_only or me.verified = true)
      )
    )
  );

create policy "Eigene Plaene erstellen"
  on plans for insert with check (auth.uid() = owner);

create policy "Eigene Plaene aendern"
  on plans for update using (auth.uid() = owner);

create policy "Eigene Plaene loeschen"
  on plans for delete using (auth.uid() = owner);
