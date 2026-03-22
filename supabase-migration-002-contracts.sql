-- Run this if you already have the tasks table from the initial migration

alter table tasks add column if not exists is_contract boolean not null default false;
alter table tasks add column if not exists contract_amount numeric not null default 0;
alter table tasks add column if not exists contract_type text not null default 'per-worker' check (contract_type in ('per-worker', 'split'));
