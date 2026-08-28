-- =====================================================================
-- Ambit: Setup Teil 16 — Privater 1:1-Chat für «Gerne ein andermal»
-- Wenn der Host auf eine «Gerne ein andermal»-Notiz reagiert, öffnet
-- sich ein eigener Chat NUR zwischen Host und dieser einen Person —
-- kein Platz wird belegt, keine Vermischung mit dem echten
-- Gruppen-Chat der wirklich Teilnehmenden.
-- Ausführen: Dashboard → SQL Editor → New query → einfügen → Run
-- =====================================================================

-- 1) Markiert, dass der Host auf eine «Gerne ein andermal»-Notiz
--    reagiert hat — ab dann ist der private Chat offen.
alter table requests add column if not exists later_matched boolean not null default false;

-- 2) Nachrichten können jetzt entweder zum Gruppen-Chat gehören
--    (thread_with = null, wie bisher) oder zu einem privaten
--    Nur-zu-zweit-Chat (thread_with = die andere Person).
alter table messages add column if not exists thread_with uuid references profiles (id);

-- 3) Prüft, ob zwei Personen einen offenen privaten Chat zu einem
--    bestimmten Plan haben (beide müssen zustimmen: die eine per
--    «Gerne ein andermal», der Host per Reaktion darauf).
create or replace function is_side_thread_participant(
  p_plan uuid, p_thread_with uuid, p_user uuid
) returns boolean
language sql security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from requests r
    join plans p on p.id = r.plan_id
    where r.plan_id = p_plan
      and r.requester = p_thread_with
      and r.status = 'interested_later'
      and r.later_matched = true
      and (p_user = p_thread_with or p_user = p.owner)
  );
$$;

-- 4) Sichtbarkeits-Regeln für Nachrichten neu — mit einem zweiten Zweig
--    für den privaten Chat, zusätzlich zum bisherigen Gruppen-Chat.
drop policy if exists "Chat lesen" on messages;

create policy "Chat lesen"
  on messages for select using (
    (
      thread_with is null
      and is_plan_participant(plan_id, auth.uid())
      and (sender is null or not is_blocked(auth.uid(), sender))
      and not exists (
        select 1 from plans p
        where p.id = plan_id and is_blocked(auth.uid(), p.owner)
      )
      and (
        is_keeper_match(plan_id, auth.uid())
        or exists (
          select 1 from plans p
          where p.id = plan_id
            and (p.when_at is null or p.when_at > now() - interval '7 days')
        )
      )
    )
    or (
      thread_with is not null
      and is_side_thread_participant(plan_id, thread_with, auth.uid())
      and not is_blocked(auth.uid(), thread_with)
    )
  );

drop policy if exists "Chat schreiben" on messages;

create policy "Chat schreiben"
  on messages for insert with check (
    (
      (kind = 'user' and sender = auth.uid()) or (kind = 'system' and sender is null)
    )
    and (
      (
        thread_with is null
        and is_plan_participant(plan_id, auth.uid())
        and (
          is_keeper_match(plan_id, auth.uid())
          or exists (
            select 1 from plans p
            where p.id = plan_id
              and (p.when_at is null or p.when_at > now() - interval '48 hours')
          )
        )
      )
      or (
        thread_with is not null
        and kind = 'user'
        and is_side_thread_participant(plan_id, thread_with, auth.uid())
      )
    )
  );
