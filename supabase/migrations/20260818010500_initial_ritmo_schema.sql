create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  theme text not null default 'light' check (theme in ('light', 'dark')),
  budget numeric(14, 2) not null default 0 check (budget >= 0),
  card_limit numeric(14, 2) not null default 0 check (card_limit >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pillars (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create unique index pillars_user_name_uidx on public.pillars (user_id, lower(name));
create index pillars_user_id_idx on public.pillars (user_id);

create table public.routine_blocks (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  pillar_id bigint not null,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  weekday smallint not null check (weekday between 0 and 6),
  time_label text not null check (char_length(btrim(time_label)) between 1 and 80),
  requires_practice boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (pillar_id, user_id)
    references public.pillars(id, user_id) on delete cascade
);
create index routine_blocks_user_id_idx on public.routine_blocks (user_id);
create index routine_blocks_pillar_id_idx on public.routine_blocks (pillar_id);

create table public.routine_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_block_id text not null,
  completed_on date not null,
  practice_note text,
  created_at timestamptz not null default now(),
  primary key (user_id, routine_block_id, completed_on),
  foreign key (user_id, routine_block_id)
    references public.routine_blocks(user_id, id) on delete cascade
);
create index routine_completions_user_date_idx
  on public.routine_completions (user_id, completed_on desc);

create table public.finance_groups (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  color text not null check (color in ('violet', 'orange', 'slate', 'blue', 'rose', 'cyan', 'amber', 'emerald')),
  kind text not null check (kind in ('income', 'expense')),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);
create unique index finance_groups_user_name_kind_uidx
  on public.finance_groups (user_id, lower(name), kind);
create index finance_groups_user_id_idx on public.finance_groups (user_id);

create table public.financial_entries (
  id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  finance_group_id text not null,
  description text not null check (char_length(btrim(description)) between 1 and 200),
  category text not null check (char_length(btrim(category)) between 1 and 80),
  payment_method text not null check (char_length(btrim(payment_method)) between 1 and 80),
  amount numeric(14, 2) not null check (amount >= 0),
  entry_date date not null,
  kind text not null check (kind in ('income', 'expense')),
  series_id bigint,
  installment_current integer check (installment_current is null or installment_current > 0),
  installments_total integer check (installments_total is null or installments_total > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, finance_group_id)
    references public.finance_groups(user_id, id) on delete cascade,
  check (
    (installment_current is null and installments_total is null)
    or (installment_current <= installments_total)
  )
);
create index financial_entries_user_date_idx
  on public.financial_entries (user_id, entry_date desc);
create index financial_entries_group_idx
  on public.financial_entries (user_id, finance_group_id);
create index financial_entries_series_idx
  on public.financial_entries (user_id, series_id)
  where series_id is not null;

create table public.projects (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  created_at timestamptz not null default now()
);
create index projects_user_id_idx on public.projects (user_id);

create table public.project_updates (
  id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id bigint references public.projects(id) on delete cascade,
  note text not null check (char_length(btrim(note)) between 1 and 5000),
  update_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index project_updates_user_date_idx
  on public.project_updates (user_id, update_date desc);
create index project_updates_project_id_idx on public.project_updates (project_id);

create table public.ideas (
  id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text not null default '',
  status text not null check (status in ('Caixa de entrada', 'Explorando', 'Priorizada')),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index ideas_user_id_idx on public.ideas (user_id);

alter table public.profiles enable row level security;
alter table public.pillars enable row level security;
alter table public.routine_blocks enable row level security;
alter table public.routine_completions enable row level security;
alter table public.finance_groups enable row level security;
alter table public.financial_entries enable row level security;
alter table public.projects enable row level security;
alter table public.project_updates enable row level security;
alter table public.ideas enable row level security;

create policy profiles_owner_all on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy pillars_owner_all on public.pillars
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy routine_blocks_owner_all on public.routine_blocks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy routine_completions_owner_all on public.routine_completions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy finance_groups_owner_all on public.finance_groups
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy financial_entries_owner_all on public.financial_entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy projects_owner_all on public.projects
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy project_updates_owner_all on public.project_updates
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy ideas_owner_all on public.ideas
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on public.profiles, public.pillars,
  public.routine_blocks, public.routine_completions, public.finance_groups,
  public.financial_entries, public.projects, public.project_updates, public.ideas
  to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

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

  insert into public.project_updates (id, user_id, note, update_date)
  select n.id, v_user_id, n.text, n.date
  from jsonb_to_recordset(coalesce(v_state -> 'projectNotes', '[]'::jsonb))
    as n(id bigint, text text, date date);
end;
$$;

revoke execute on function public.load_ritmo_state() from public, anon;
revoke execute on function public.save_ritmo_state(jsonb) from public, anon;
grant execute on function public.load_ritmo_state() to authenticated;
grant execute on function public.save_ritmo_state(jsonb) to authenticated;
