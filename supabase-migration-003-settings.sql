-- Settings table (key-value store for app config)
create table if not exists settings (
  key text primary key,
  value text not null default ''
);

-- Seed default farm name
insert into settings (key, value) values ('farm_name', 'Thottam') on conflict do nothing;

-- RLS
alter table settings enable row level security;

create policy "auth_settings_select" on settings for select to authenticated using (true);
create policy "auth_settings_update" on settings for update to authenticated using (true);
