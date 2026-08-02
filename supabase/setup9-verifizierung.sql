-- =====================================================================
-- Ambit: Setup Teil 9 — Verifizierung mit Selfie in der App
-- Ausführen: Dashboard → SQL Editor → New query → einfügen → Run
-- =====================================================================

-- 1) Privater Speicher für die Selfies.
--    «public = false»: Diese Bilder sind über keine Adresse abrufbar —
--    nur der Betreiber sieht sie im Supabase-Dashboard.
insert into storage.buckets (id, name, public)
values ('verification', 'verification', false)
on conflict (id) do nothing;

drop policy if exists "Verifizierungs-Selfie hochladen" on storage.objects;

create policy "Verifizierungs-Selfie hochladen"
  on storage.objects for insert
  with check (
    bucket_id = 'verification'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
-- Absichtlich KEINE Leserechte: Niemand kann fremde Selfies abrufen.

-- 2) Die Prüf-Anfragen
drop table if exists verification_requests cascade;

create table verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  gesture text not null,                  -- ear / peace / thumb
  photo_path text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

-- Pro Person nur eine offene Prüfung gleichzeitig
create unique index eine_offene_pruefung_pro_person
  on verification_requests (user_id) where status = 'pending';

alter table verification_requests enable row level security;

create policy "Eigene Pruefung sehen"
  on verification_requests for select using (user_id = auth.uid());

create policy "Pruefung anfragen"
  on verification_requests for insert with check (user_id = auth.uid());
-- Ändern darf nur der Betreiber (über das Supabase-Dashboard).

-- 3) Automatik beim Prüfen: Setzt du den Status auf «approved»,
--    bekommt die Person ihr Häkchen. In beiden Fällen wird das
--    Selfie sofort gelöscht — es wird nie aufbewahrt.
create or replace function apply_verification()
returns trigger
language plpgsql security definer
set search_path = public, storage, pg_temp
as $$
begin
  if new.status is distinct from old.status
     and new.status in ('approved', 'rejected') then
    new.reviewed_at := now();

    if new.status = 'approved' then
      update profiles set is_verified = true where id = new.user_id;
    end if;

    delete from storage.objects
    where bucket_id = 'verification' and name = new.photo_path;
  end if;
  return new;
end $$;

drop trigger if exists trg_apply_verification on verification_requests;
create trigger trg_apply_verification
  before update on verification_requests
  for each row execute function apply_verification();
