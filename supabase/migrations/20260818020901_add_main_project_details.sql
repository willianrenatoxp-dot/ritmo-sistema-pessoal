alter table public.projects
  add column description text not null default '',
  add column deadline date,
  add column next_action text not null default '';

create unique index projects_user_id_uidx on public.projects (user_id);

create or replace function public.load_ritmo_state()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'theme', coalesce((select p.theme from public.profiles p where p.id = (select auth.uid())), 'light'),
    'state', jsonb_build_object(
      'completed', coalesce((
        select jsonb_object_agg(c.completed_on::text || '::' || c.routine_block_id, true)
        from public.routine_completions c
        where c.user_id = (select auth.uid())
      ), '{}'::jsonb),
      'practiceNotes', coalesce((
        select jsonb_object_agg(c.completed_on::text || '::' || c.routine_block_id, c.practice_note)
        from public.routine_completions c
        where c.user_id = (select auth.uid()) and c.practice_note is not null
      ), '{}'::jsonb),
      'customActivities', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', b.id, 'pillar', p.name, 'title', b.title,
          'day', b.weekday, 'time', b.time_label, 'practice', b.requires_practice
        ) order by b.created_at)
        from public.routine_blocks b
        join public.pillars p on p.id = b.pillar_id and p.user_id = b.user_id
        where b.user_id = (select auth.uid())
      ), '[]'::jsonb),
      'activityOverrides', '{}'::jsonb,
      'deletedActivityIds', '[]'::jsonb,
      'deletedPillars', '[]'::jsonb,
      'customPillars', coalesce((
        select jsonb_agg(p.name order by p.created_at)
        from public.pillars p where p.user_id = (select auth.uid())
      ), '[]'::jsonb),
      'customFinanceGroups', coalesce((
        select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'color', g.color, 'kind', g.kind) order by g.created_at)
        from public.finance_groups g where g.user_id = (select auth.uid())
      ), '[]'::jsonb),
      'deletedFinanceGroupIds', '[]'::jsonb,
      'expenses', coalesce((
        select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
          'id', e.id, 'description', e.description, 'category', e.category,
          'method', e.payment_method, 'amount', e.amount, 'date', e.entry_date,
          'kind', e.kind, 'account', g.name, 'seriesId', e.series_id,
          'installmentCurrent', e.installment_current, 'installmentsTotal', e.installments_total
        )) order by e.entry_date desc, e.id desc)
        from public.financial_entries e
        join public.finance_groups g on g.user_id = e.user_id and g.id = e.finance_group_id
        where e.user_id = (select auth.uid())
      ), '[]'::jsonb),
      'ideas', coalesce((
        select jsonb_agg(jsonb_build_object('id', i.id, 'title', i.title, 'description', i.description, 'status', i.status) order by i.created_at desc)
        from public.ideas i where i.user_id = (select auth.uid())
      ), '[]'::jsonb),
      'project', (
        select jsonb_build_object(
          'name', p.name,
          'description', p.description,
          'deadline', p.deadline,
          'nextAction', p.next_action
        )
        from public.projects p
        where p.user_id = (select auth.uid())
        limit 1
      ),
      'projectNotes', coalesce((
        select jsonb_agg(jsonb_build_object('id', u.id, 'text', u.note, 'date', u.update_date) order by u.update_date desc, u.id desc)
        from public.project_updates u where u.user_id = (select auth.uid())
      ), '[]'::jsonb),
      'budget', coalesce((select p.budget from public.profiles p where p.id = (select auth.uid())), 0),
      'cardLimit', coalesce((select p.card_limit from public.profiles p where p.id = (select auth.uid())), 0)
    )
  );
$$;

create or replace function public.save_ritmo_state(payload jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_state jsonb := coalesce(payload -> 'state', '{}'::jsonb);
  v_project_id bigint;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  insert into public.profiles (id, theme, budget, card_limit, updated_at)
  values (
    v_user_id,
    coalesce(payload ->> 'theme', 'light'),
    coalesce((v_state ->> 'budget')::numeric, 0),
    coalesce((v_state ->> 'cardLimit')::numeric, 0),
    now()
  )
  on conflict (id) do update set
    theme = excluded.theme,
    budget = excluded.budget,
    card_limit = excluded.card_limit,
    updated_at = now();

  delete from public.routine_completions where user_id = v_user_id;
  delete from public.routine_blocks where user_id = v_user_id;
  delete from public.pillars where user_id = v_user_id;
  delete from public.financial_entries where user_id = v_user_id;
  delete from public.finance_groups where user_id = v_user_id;
  delete from public.project_updates where user_id = v_user_id;
  delete from public.projects where user_id = v_user_id;
  delete from public.ideas where user_id = v_user_id;

  insert into public.pillars (user_id, name)
  select v_user_id, value
  from jsonb_array_elements_text(coalesce(v_state -> 'customPillars', '[]'::jsonb));

  insert into public.routine_blocks (id, user_id, pillar_id, title, weekday, time_label, requires_practice)
  select a.id, v_user_id, p.id, a.title, a.day, a.time, coalesce(a.practice, false)
  from jsonb_to_recordset(coalesce(v_state -> 'customActivities', '[]'::jsonb))
    as a(id text, pillar text, title text, day smallint, time text, practice boolean)
  join public.pillars p on p.user_id = v_user_id and p.name = a.pillar;

  insert into public.routine_completions (user_id, routine_block_id, completed_on, practice_note)
  select
    v_user_id,
    split_part(c.key, '::', 2),
    split_part(c.key, '::', 1)::date,
    v_state -> 'practiceNotes' ->> c.key
  from jsonb_each(coalesce(v_state -> 'completed', '{}'::jsonb)) c
  join public.routine_blocks b
    on b.user_id = v_user_id and b.id = split_part(c.key, '::', 2)
  where c.value = 'true'::jsonb;

  insert into public.finance_groups (id, user_id, name, color, kind)
  select g.id, v_user_id, g.name, g.color, g.kind
  from jsonb_to_recordset(coalesce(v_state -> 'customFinanceGroups', '[]'::jsonb))
    as g(id text, name text, color text, kind text);

  insert into public.financial_entries (
    id, user_id, finance_group_id, description, category, payment_method,
    amount, entry_date, kind, series_id, installment_current, installments_total
  )
  select
    e.id, v_user_id, g.id, e.description, e.category, e.method,
    e.amount, e.date, e.kind, e."seriesId", e."installmentCurrent", e."installmentsTotal"
  from jsonb_to_recordset(coalesce(v_state -> 'expenses', '[]'::jsonb))
    as e(
      id bigint, description text, category text, method text, amount numeric,
      date date, kind text, account text, card text, "seriesId" bigint,
      "installmentCurrent" integer, "installmentsTotal" integer
    )
  join public.finance_groups g
    on g.user_id = v_user_id
    and g.kind = e.kind
    and g.name = coalesce(e.account, e.card);

  insert into public.ideas (id, user_id, title, description, status)
  select i.id, v_user_id, i.title, coalesce(i.description, ''), i.status
  from jsonb_to_recordset(coalesce(v_state -> 'ideas', '[]'::jsonb))
    as i(id bigint, title text, description text, status text);

  if v_state -> 'project' is not null and v_state -> 'project' <> 'null'::jsonb then
    insert into public.projects (user_id, name, description, deadline, next_action)
    values (
      v_user_id,
      v_state -> 'project' ->> 'name',
      coalesce(v_state -> 'project' ->> 'description', ''),
      nullif(v_state -> 'project' ->> 'deadline', '')::date,
      coalesce(v_state -> 'project' ->> 'nextAction', '')
    )
    returning id into v_project_id;
  end if;

  insert into public.project_updates (id, user_id, project_id, note, update_date)
  select n.id, v_user_id, v_project_id, n.text, n.date
  from jsonb_to_recordset(coalesce(v_state -> 'projectNotes', '[]'::jsonb))
    as n(id bigint, text text, date date);
end;
$$;

revoke execute on function public.load_ritmo_state() from public, anon;
revoke execute on function public.save_ritmo_state(jsonb) from public, anon;
grant execute on function public.load_ritmo_state() to authenticated;
grant execute on function public.save_ritmo_state(jsonb) to authenticated;
