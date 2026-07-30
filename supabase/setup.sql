-- =====================================================================
-- Ambit: Datenbank-Setup für Profile und Fotos
-- Dieses Skript einmalig in Supabase ausführen:
-- Dashboard → SQL Editor → New query → alles einfügen → Run
-- =====================================================================

-- 1) Die Profil-Tabelle: eine Zeile pro Nutzer
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,                                   -- nur Vorname
  age int check (age >= 18),                   -- Ambit ist ab 18
  gender text,                                 -- woman / man / nonbinary
  photo_urls text[] default '{}',              -- Links zu den Fotos (Bucket "photos")
  about text check (char_length(about) <= 150),
  prompts jsonb default '[]',                  -- Liste von {id, answer}
  languages text[] default '{}',               -- Sprachen (de, ch, en, … oder frei)
  home_area text,                              -- Quartier/Ort/PLZ — nie eine Adresse
  home_lat double precision,                   -- ungefähre Koordinaten des Orts
  home_lng double precision,
  rhythm text[] default '{}',                  -- morning / evening / weekend
  categories text[] default '{}',              -- sport / kaffee / essen / ausgang
  seeks text[] default '{}',                   -- friendship / dating
  meet_pref text[] default '{}',               -- group / pair
  smoking text,                                -- no / sometimes / yes (optional)
  orientation text,                            -- women / men / all — NIE öffentlich
  rel_model text,                              -- single / open (optional)
  pref_show_open_rel boolean default true,     -- offene Beziehungen anzeigen?
  radius_km int default 10 check (radius_km between 1 and 50),
  onboarding_done boolean default false,       -- Onboarding abgeschlossen?
  created_at timestamptz default now()
);

-- 2) Sicherheit: Jeder darf NUR sein eigenes Profil lesen und ändern
alter table profiles enable row level security;

create policy "Eigenes Profil lesen"
  on profiles for select using (auth.uid() = id);

create policy "Eigenes Profil anlegen"
  on profiles for insert with check (auth.uid() = id);

create policy "Eigenes Profil aendern"
  on profiles for update using (auth.uid() = id);

-- 3) Öffentliche Sicht auf fremde Profile: NUR die erlaubten Felder.
--    (orientation, Koordinaten usw. bleiben privat — Privatsphäre-Regel!)
create or replace view public_profiles as
  select id, name, age, home_area, languages, rhythm,
         photo_urls, about, prompts, categories, rel_model
  from profiles
  where onboarding_done = true;

-- Nur eingeloggte Nutzer dürfen diese Sicht lesen
revoke all on public_profiles from anon;
grant select on public_profiles to authenticated;

-- 4) Foto-Speicher: Bucket "photos" (öffentlich lesbar, damit Fotos
--    im Profil angezeigt werden können)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Jeder darf Fotos ansehen, aber nur eigene hochladen/löschen
-- (jeder Nutzer hat seinen eigenen Ordner mit seiner Nutzer-ID)
create policy "Fotos sind oeffentlich lesbar"
  on storage.objects for select using (bucket_id = 'photos');

create policy "Eigene Fotos hochladen"
  on storage.objects for insert
  with check (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Eigene Fotos loeschen"
  on storage.objects for delete
  using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);
