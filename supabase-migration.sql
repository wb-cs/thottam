-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Workers table
create table workers (
  id bigint generated always as identity primary key,
  name text not null,
  phone text default '',
  role text default '',
  daily_rate numeric not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now()
);

-- Work days table
create table work_days (
  id bigint generated always as identity primary key,
  worker_id bigint not null references workers(id) on delete cascade,
  date date not null,
  attendance text not null check (attendance in ('present', 'half-day', 'absent')),
  overtime_hours numeric default 0,
  notes text default '',
  unique(worker_id, date)
);

-- Tasks table
create table tasks (
  id bigint generated always as identity primary key,
  date date not null,
  title text not null,
  description text default '',
  status text not null default 'pending' check (status in ('pending', 'done')),
  is_contract boolean not null default false,
  contract_amount numeric not null default 0,
  contract_type text not null default 'per-worker' check (contract_type in ('per-worker', 'split'))
);

-- Work day tasks join table
create table work_day_tasks (
  id bigint generated always as identity primary key,
  work_day_id bigint not null references work_days(id) on delete cascade,
  task_id bigint not null references tasks(id) on delete cascade,
  unique(work_day_id, task_id)
);

-- Enable Row Level Security
alter table workers enable row level security;
alter table work_days enable row level security;
alter table tasks enable row level security;
alter table work_day_tasks enable row level security;

-- Policies: only authenticated users can access
create policy "auth_workers_select" on workers for select to authenticated using (true);
create policy "auth_workers_insert" on workers for insert to authenticated with check (true);
create policy "auth_workers_update" on workers for update to authenticated using (true);
create policy "auth_workers_delete" on workers for delete to authenticated using (true);

create policy "auth_work_days_select" on work_days for select to authenticated using (true);
create policy "auth_work_days_insert" on work_days for insert to authenticated with check (true);
create policy "auth_work_days_update" on work_days for update to authenticated using (true);
create policy "auth_work_days_delete" on work_days for delete to authenticated using (true);

create policy "auth_tasks_select" on tasks for select to authenticated using (true);
create policy "auth_tasks_insert" on tasks for insert to authenticated with check (true);
create policy "auth_tasks_update" on tasks for update to authenticated using (true);
create policy "auth_tasks_delete" on tasks for delete to authenticated using (true);

create policy "auth_work_day_tasks_select" on work_day_tasks for select to authenticated using (true);
create policy "auth_work_day_tasks_insert" on work_day_tasks for insert to authenticated with check (true);
create policy "auth_work_day_tasks_update" on work_day_tasks for update to authenticated using (true);
create policy "auth_work_day_tasks_delete" on work_day_tasks for delete to authenticated using (true);
