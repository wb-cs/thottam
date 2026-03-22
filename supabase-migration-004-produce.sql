-- Produce catalog
create table if not exists produce (
  id bigint generated always as identity primary key,
  name text not null,
  unit text not null default 'kg',
  category text not null default 'crop' check (category in ('crop', 'dairy', 'livestock', 'other')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now()
);

-- Harvest log
create table if not exists harvests (
  id bigint generated always as identity primary key,
  produce_id bigint not null references produce(id) on delete cascade,
  date date not null,
  quantity numeric not null default 0,
  notes text default ''
);

-- Sales log
create table if not exists sales (
  id bigint generated always as identity primary key,
  produce_id bigint not null references produce(id) on delete cascade,
  date date not null,
  quantity numeric not null default 0,
  price_per_unit numeric not null default 0,
  buyer text default '',
  notes text default ''
);

-- RLS
alter table produce enable row level security;
alter table harvests enable row level security;
alter table sales enable row level security;

create policy "auth_produce_select" on produce for select to authenticated using (true);
create policy "auth_produce_insert" on produce for insert to authenticated with check (true);
create policy "auth_produce_update" on produce for update to authenticated using (true);
create policy "auth_produce_delete" on produce for delete to authenticated using (true);

create policy "auth_harvests_select" on harvests for select to authenticated using (true);
create policy "auth_harvests_insert" on harvests for insert to authenticated with check (true);
create policy "auth_harvests_update" on harvests for update to authenticated using (true);
create policy "auth_harvests_delete" on harvests for delete to authenticated using (true);

create policy "auth_sales_select" on sales for select to authenticated using (true);
create policy "auth_sales_insert" on sales for insert to authenticated with check (true);
create policy "auth_sales_update" on sales for update to authenticated using (true);
create policy "auth_sales_delete" on sales for delete to authenticated using (true);
