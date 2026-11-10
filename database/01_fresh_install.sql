-- ============================================================
-- Daybook — FRESH INSTALL (a brand-new, empty Supabase project)
-- Supabase → SQL Editor → New query → paste ALL of this → Run
-- Safe to run twice; it never deletes anything.
--
-- Already have a running Daybook database? Use
-- 02_upgrade_existing_database.sql instead.
-- ============================================================

-- 1. Managers. Admin adds one row per manager (Table Editor → manager_emails → Insert row).
--    A person can only sign up as "Manager" if their email is in this table,
--    and employees pick their reporting manager from the names in it.
create table if not exists manager_emails (
  email        text primary key,
  manager_name text
);
alter table manager_emails enable row level security;

drop policy if exists "signed-in users can read the manager list" on manager_emails;
create policy "signed-in users can read the manager list"
  on manager_emails for select to authenticated using (true);

-- 2. Profiles: one row per person who has signed in.
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text not null,
  role         text not null check (role in ('employee','manager')),
  manager_name text,
  created_at   timestamptz not null default now()
);
alter table profiles enable row level security;

drop policy if exists "signed-in users can view all profiles" on profiles;
create policy "signed-in users can view all profiles"
  on profiles for select to authenticated using (true);

drop policy if exists "users can create their own profile" on profiles;
create policy "users can create their own profile"
  on profiles for insert to authenticated
  with check (
    auth.uid() = id
    and (role = 'employee'
         or (role = 'manager' and exists (
              select 1 from manager_emails m
              where lower(m.email) = lower(auth.jwt() ->> 'email'))))
  );

drop policy if exists "users can update their own profile" on profiles;
create policy "users can update their own profile"
  on profiles for update to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and (role = 'employee'
         or (role = 'manager' and exists (
              select 1 from manager_emails m
              where lower(m.email) = lower(auth.jwt() ->> 'email'))))
  );

-- 3. Daily reports: anyone signed in can read; people can only write their OWN row.
create table if not exists daily_reports (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references auth.users(id) on delete cascade,
  employee_name text not null,
  manager_name  text,
  report_date   date not null,
  status        text not null check (status in ('office','wfh','leave')),
  entries       jsonb,
  leave_type    text,
  leave_reason  text,
  submitted_at  timestamptz not null default now(),
  unique (employee_id, report_date)
);
alter table daily_reports enable row level security;

drop policy if exists "signed-in users can view all reports" on daily_reports;
create policy "signed-in users can view all reports"
  on daily_reports for select to authenticated using (true);

drop policy if exists "users can submit only their own reports" on daily_reports;
create policy "users can submit only their own reports"
  on daily_reports for insert to authenticated with check (auth.uid() = employee_id);

drop policy if exists "users can edit only their own reports" on daily_reports;
create policy "users can edit only their own reports"
  on daily_reports for update to authenticated using (auth.uid() = employee_id);

-- 4. Tasks
create table if not exists tasks (
  id            uuid primary key default gen_random_uuid(),
  manager_id    uuid not null references auth.users(id) on delete cascade,
  employee_id   uuid not null references auth.users(id) on delete cascade,
  employee_name text not null,
  title         text not null,
  description   text,
  due_date      date,
  status        text not null default 'todo' check (status in ('todo','in_progress','done')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
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

-- 5. Company holidays (only people in manager_emails can change them)
create table if not exists holidays (
  holiday_date date primary key,
  name         text not null,
  created_by   uuid default auth.uid(),
  created_at   timestamptz default now()
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

notify pgrst, 'reload schema';

-- ------------------------------------------------------------
-- Done. Next: Table Editor → manager_emails → Insert row → add your own
-- email and name (and every other manager). Without this, nobody
-- can sign up as a Manager.
-- ------------------------------------------------------------
