-- ============================================================
-- Daybook — ONE script that brings your existing database up to date
-- (matches the manager-by-name setup: manager_emails.manager_name)
-- Supabase → SQL Editor → New query → paste ALL of this → Run
-- Safe to run more than once. It does NOT delete any data.
-- ============================================================

-- 1. Manager list: each manager's display name (you already have this column)
alter table manager_emails add column if not exists manager_name text;

-- 2. Profiles: who each person reports to is stored by manager NAME
alter table profiles add column if not exists email text;
alter table profiles add column if not exists manager_name text;

-- 3. Daily reports: which manager (name) each report went to
alter table daily_reports add column if not exists manager_name text;

-- Needed so saving the same day twice updates instead of failing
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.daily_reports'::regclass and contype in ('u','p')
      and array_length(conkey,1) = 2
      and conkey @> (select array_agg(attnum) from pg_attribute
                     where attrelid='public.daily_reports'::regclass and attname in ('employee_id','report_date'))
  ) then
    alter table daily_reports add constraint daily_reports_emp_date_key unique (employee_id, report_date);
  end if;
end $$;

-- 4. Tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references auth.users(id) on delete cascade,
  employee_id uuid not null references auth.users(id) on delete cascade,
  employee_name text not null,
  title text not null,
  description text,
  due_date date,
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table tasks enable row level security;

drop policy if exists "assignee or assigner can view a task" on tasks;
create policy "assignee or assigner can view a task" on tasks for select to authenticated
  using (auth.uid() = employee_id or auth.uid() = manager_id);

drop policy if exists "managers can assign tasks only to their own direct reports" on tasks;
create policy "managers can assign tasks only to their own direct reports" on tasks for insert to authenticated
  with check (
    auth.uid() = manager_id
    and exists (
      select 1
      from profiles p
      join manager_emails m on lower(m.email) = lower(auth.jwt() ->> 'email')
      where p.id = employee_id and p.manager_name = m.manager_name
    )
  );

drop policy if exists "assignee or assigner can update a task" on tasks;
create policy "assignee or assigner can update a task" on tasks for update to authenticated
  using (auth.uid() = employee_id or auth.uid() = manager_id);

drop policy if exists "only the assigning manager can delete a task" on tasks;
create policy "only the assigning manager can delete a task" on tasks for delete to authenticated
  using (auth.uid() = manager_id);

-- 5. Holidays
create table if not exists holidays (
  holiday_date date primary key,
  name text not null,
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);
alter table holidays enable row level security;

drop policy if exists "everyone signed in can see holidays" on holidays;
create policy "everyone signed in can see holidays" on holidays for select to authenticated using (true);

drop policy if exists "managers can add holidays" on holidays;
create policy "managers can add holidays" on holidays for insert to authenticated
  with check (exists (select 1 from manager_emails m where lower(m.email) = lower(auth.jwt() ->> 'email')));

drop policy if exists "managers can update holidays" on holidays;
create policy "managers can update holidays" on holidays for update to authenticated
  using (exists (select 1 from manager_emails m where lower(m.email) = lower(auth.jwt() ->> 'email')))
  with check (exists (select 1 from manager_emails m where lower(m.email) = lower(auth.jwt() ->> 'email')));

drop policy if exists "managers can delete holidays" on holidays;
create policy "managers can delete holidays" on holidays for delete to authenticated
  using (exists (select 1 from manager_emails m where lower(m.email) = lower(auth.jwt() ->> 'email')));

-- Make the app see the new columns right away
notify pgrst, 'reload schema';
