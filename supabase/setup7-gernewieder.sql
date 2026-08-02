-- =====================================================================
-- Ambit: Setup Teil 7 — «Gerne wieder» (in Kontakt bleiben nach dem Treffen)
-- Ausführen: Dashboard → SQL Editor → New query → einfügen → Run
-- =====================================================================

-- 1) Wer hat nach einem Treffen «Gerne wieder» getippt?
drop table if exists keeps cascade;

create table keeps (
  plan_id uuid not null references plans (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz default now(),
  primary key (plan_id, user_id)
);

-- 2) Gibt es eine Übereinstimmung? (mindestens zwei Personen getippt,
--    und diese Person ist eine davon)
create or replace function is_keeper_match(p_plan uuid, p_user uuid)
returns boolean
language sql security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from keeps k where k.plan_id = p_plan and k.user_id = p_user)
     and (select count(*) from keeps k where k.plan_id = p_plan) >= 2;
$$;

-- 3) Zugriff auf die «Gerne wieder»-Einträge:
--    Man sieht IMMER nur den eigenen — die der anderen erst, wenn es passt.
--    So erfährt niemand, wer getippt hat und wer nicht.
alter table keeps enable row level security;

create policy "Eigenes Gerne-wieder sehen"
  on keeps for select using (
    user_id = auth.uid() or is_keeper_match(plan_id, auth.uid())
  );

-- Tippen: nur für sich selbst, nur als Teilnehmende, nur bis 7 Tage
-- nach dem Treffen (deutlich länger als der Chat offen ist)
create policy "Gerne wieder tippen"
  on keeps for insert with check (
    user_id = auth.uid()
    and is_plan_participant(plan_id, auth.uid())
    and exists (
      select 1 from plans p
      where p.id = plan_id
        and (p.when_at is null or p.when_at > now() - interval '7 days')
    )
  );

-- «Verbindung lösen» = den eigenen Eintrag entfernen. Sinkt die Zahl
-- dadurch unter zwei, endet der Kontakt still für alle Beteiligten.
create policy "Verbindung loesen"
  on keeps for delete using (user_id = auth.uid());

-- 4) Chat-Regeln neu: Lesen bis 7 Tage nach dem Treffen — oder
--    unbefristet, wenn «Gerne wieder» beidseitig war.
--    Schreiben bis 48 Stunden danach — oder unbefristet bei Kontakt.
drop policy if exists "Chat lesen" on messages;
drop policy if exists "Chat schreiben" on messages;

create policy "Chat lesen"
  on messages for select using (
    is_plan_participant(plan_id, auth.uid())
    and (
      is_keeper_match(plan_id, auth.uid())
      or exists (
        select 1 from plans p
        where p.id = plan_id
          and (p.when_at is null or p.when_at > now() - interval '7 days')
      )
    )
  );

create policy "Chat schreiben"
  on messages for insert with check (
    is_plan_participant(plan_id, auth.uid())
    and (
      (kind = 'user' and sender = auth.uid())
      or (kind = 'system' and sender is null)
    )
    and (
      is_keeper_match(plan_id, auth.uid())
      or exists (
        select 1 from plans p
        where p.id = plan_id
          and (p.when_at is null or p.when_at > now() - interval '48 hours')
      )
    )
  );
