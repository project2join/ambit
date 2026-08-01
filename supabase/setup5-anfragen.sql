-- =====================================================================
-- Ambit: Setup Teil 5 — Anfragen (Mitkommen bei Plänen)
-- Ausführen: Dashboard → SQL Editor → New query → einfügen → Run
-- =====================================================================

-- 1) Pläne bekommen einen Status: offen oder voll
alter table plans add column if not exists status text not null default 'open'
  check (status in ('open', 'full'));

-- 2) Die Anfragen-Tabelle: wer möchte bei welchem Plan mitkommen
create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans (id) on delete cascade,
  requester uuid not null references profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  available_days text[] not null default '{}',  -- bei flexiblen Plänen: welche Tage gehen
  needs_reconfirm boolean not null default false, -- Termin wurde neu festgelegt → bitte zusagen
  created_at timestamptz default now(),
  unique (plan_id, requester)                    -- pro Person nur eine Anfrage pro Plan
);

alter table requests enable row level security;

-- Sehen: Anfragende sehen ihre eigenen Anfragen,
-- der Host sieht alle Anfragen zu seinen Plänen
create policy "Anfragen sehen"
  on requests for select using (
    requester = auth.uid()
    or exists (select 1 from plans p where p.id = plan_id and p.owner = auth.uid())
  );

-- Stellen: nur für sich selbst, nie beim eigenen Plan, nur bei offenen Plänen —
-- und nur bei Plänen, die man überhaupt sehen darf (Sichtbarkeits-Regeln greifen)
create policy "Anfrage stellen"
  on requests for insert with check (
    requester = auth.uid()
    and exists (
      select 1 from plans p
      where p.id = plan_id and p.owner <> auth.uid() and p.status = 'open'
    )
  );

-- Ändern: der Host darf (annehmen/ablehnen), Anfragende dürfen
-- (absagen, Tage anpassen, zusagen)
create policy "Anfrage aendern als Host"
  on requests for update using (
    exists (select 1 from plans p where p.id = plan_id and p.owner = auth.uid())
  );

create policy "Anfrage aendern als Anfragende"
  on requests for update using (requester = auth.uid());

-- 3) Automatik: Belegte Plätze und der offen/voll-Status pflegen sich selbst.
--    Annehmen belegt einen Platz; Absagen oder Zurücknehmen gibt ihn frei.
create or replace function sync_plan_spots() returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if old.status <> 'accepted' and new.status = 'accepted' then
    update plans set taken = taken + 1 where id = new.plan_id;
    update plans set status = 'full' where id = new.plan_id and taken >= spots;
  elsif old.status = 'accepted' and new.status <> 'accepted' then
    update plans set taken = greatest(taken - 1, 0), status = 'open'
    where id = new.plan_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_sync_plan_spots on requests;
create trigger trg_sync_plan_spots
  after update on requests
  for each row execute function sync_plan_spots();
