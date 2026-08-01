-- =====================================================================
-- Ambit: Reparatur für Setup Teil 2
-- Ersetzt eine alte «blocks»-Tabelle mit falschen Spaltennamen und legt
-- alles aus setup2-plaene.sql sauber an. Kann gefahrlos mehrmals
-- ausgeführt werden. Danach: setup3-erstellen.sql ausführen.
-- =====================================================================

-- 1) Verifiziert-Feld (falls noch nicht vorhanden)
alter table profiles add column if not exists verified boolean default false;

-- 2) Alte Blockier-Tabelle entfernen (sie ist leer — die Funktion
--    gab es in der App noch nie) und richtig neu anlegen
drop table if exists blocks cascade;

create table blocks (
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

-- 3) Hilfsfunktion: Sind zwei Personen (in irgendeiner Richtung) blockiert?
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

-- 4) Die Pläne-Tabelle (falls noch nicht vorhanden)
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references profiles (id) on delete cascade,
  category text not null,
  text text not null check (char_length(text) <= 200),
  when_text text,
  is_flexible boolean default false,
  spots int not null default 2 check (spots between 1 and 10),
  taken int not null default 0,
  age_min int,
  age_max int,
  gender_filter text not null default 'all',
  verified_only boolean not null default false,
  created_at timestamptz default now()
);

alter table plans enable row level security;

-- 5) Sichtbarkeits-Regeln: erst alte Versionen entfernen (falls
--    vorhanden), dann sauber anlegen — so ist das Skript wiederholbar
drop policy if exists "Sichtbare Plaene lesen" on plans;
drop policy if exists "Eigene Plaene erstellen" on plans;
drop policy if exists "Eigene Plaene aendern" on plans;
drop policy if exists "Eigene Plaene loeschen" on plans;

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
