-- =====================================================================
-- Ambit: Setup Teil 10 — Feedback direkt in der App
-- Ausführen: Dashboard → SQL Editor → New query → einfügen → Run
-- =====================================================================

-- Rückmeldungen landen in der Datenbank, nicht per Mail —
-- so steht nirgends in der App eine Adresse des Betreibers.
drop table if exists feedback cascade;

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete set null,
  text text not null check (char_length(text) <= 2000),
  created_at timestamptz default now()
);

alter table feedback enable row level security;

create policy "Feedback schreiben"
  on feedback for insert with check (user_id = auth.uid());

create policy "Eigenes Feedback sehen"
  on feedback for select using (user_id = auth.uid());
