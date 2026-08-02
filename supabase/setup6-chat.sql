-- =====================================================================
-- Ambit: Setup Teil 6 — Plan-Chat (Gruppenchat pro Plan, live)
-- Ausführen: Dashboard → SQL Editor → New query → einfügen → Run
-- =====================================================================

-- 0) Allfällige alte Tabelle aus früheren Versuchen entfernen
drop table if exists messages cascade;

-- 1) Die Nachrichten-Tabelle
--    kind = 'user'   → von einer Person geschrieben (sender gesetzt)
--    kind = 'system' → der Eisbrecher der App (sender leer, payload gefüllt)
create table messages (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans (id) on delete cascade,
  sender uuid references profiles (id) on delete set null,
  kind text not null default 'user' check (kind in ('user', 'system')),
  text text check (char_length(text) <= 1000),
  payload jsonb,                                  -- Daten für den Eisbrecher
  created_at timestamptz default now()
);

create index messages_plan_idx on messages (plan_id, created_at);

-- Pro Plan nur EIN Eisbrecher
create unique index ein_eisbrecher_pro_plan
  on messages (plan_id) where kind = 'system';

-- 2) Wer gehört zum Chat? Der Host und alle Angenommenen —
--    und erst, sobald mindestens eine Anfrage angenommen wurde.
create or replace function is_plan_participant(p_plan uuid, p_user uuid)
returns boolean
language sql security definer
set search_path = public, pg_temp
as $$
  select exists (
      select 1 from requests r where r.plan_id = p_plan and r.status = 'accepted'
    )
    and (
      exists (select 1 from plans p where p.id = p_plan and p.owner = p_user)
      or exists (
        select 1 from requests r
        where r.plan_id = p_plan and r.requester = p_user and r.status = 'accepted'
      )
    );
$$;

-- 3) Zugriff: NUR Teilnehmende — alle anderen sehen gar nichts
alter table messages enable row level security;

create policy "Chat lesen"
  on messages for select using (is_plan_participant(plan_id, auth.uid()));

-- Schreiben: nur Teilnehmende, nur im eigenen Namen — und nur solange
-- der Plan keine 48 Stunden vorbei ist (danach ist der Chat ein Archiv)
create policy "Chat schreiben"
  on messages for insert with check (
    is_plan_participant(plan_id, auth.uid())
    and (
      (kind = 'user' and sender = auth.uid())
      or (kind = 'system' and sender is null)
    )
    and exists (
      select 1 from plans p
      where p.id = plan_id
        and (p.when_at is null or p.when_at > now() - interval '48 hours')
    )
  );

-- 4) Realtime einschalten: neue Nachrichten erscheinen ohne Neuladen
do $$ begin
  alter publication supabase_realtime add table messages;
exception when duplicate_object then null;
end $$;
