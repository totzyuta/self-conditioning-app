-- V2 normalized schema (multi logical users via user_id)
-- Execute in Supabase SQL editor (or via migration tooling).
-- Assumes Postgres.

-- Enable UUID generator
create extension if not exists "pgcrypto";

-- Users table (placeholder for future auth)
create table if not exists public.users (
  id text primary key,
  created_at timestamptz not null default now()
);

-- Logical sync accounts (whitelist matches API ALLOWED_SYNC_USERS)
insert into public.users (id)
values ('totzyu'), ('totzyu_dev')
on conflict (id) do nothing;

-- Conditions (1 per day)
create table if not exists public.conditions (
  user_id text not null references public.users(id) on delete cascade,
  date date not null,
  score numeric,
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create index if not exists idx_conditions_user_date on public.conditions(user_id, date);

-- Training session header (1 per day)
create table if not exists public.training_sessions (
  user_id text not null references public.users(id) on delete cascade,
  date date not null,
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create index if not exists idx_training_sessions_user_date on public.training_sessions(user_id, date);

-- Training items (0..N per day, main/sub)
create table if not exists public.training_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  date date not null,
  category text not null check (category in ('main','sub')),
  exercise_name text not null,
  weight text not null default '',
  reps text not null default '',
  sets int,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_training_items_user_date on public.training_items(user_id, date);
create index if not exists idx_training_items_user_date_cat on public.training_items(user_id, date, category);

-- Optional: keep updated_at fresh on updates
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_conditions_updated_at on public.conditions;
create trigger trg_conditions_updated_at
before update on public.conditions
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_training_sessions_updated_at on public.training_sessions;
create trigger trg_training_sessions_updated_at
before update on public.training_sessions
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_training_items_updated_at on public.training_items;
create trigger trg_training_items_updated_at
before update on public.training_items
for each row execute procedure public.set_updated_at();
