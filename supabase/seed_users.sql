-- Idempotent: ensure logical user ids exist for V2 FK (conditions, training_*).
-- Run in Supabase SQL editor if PUT /api/v2/state fails with FK to public.users.
insert into public.users (id)
values ('totzyu'), ('totzyu_dev')
on conflict (id) do nothing;
