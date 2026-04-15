-- Run once on existing V2 databases (Supabase SQL editor).
-- Adds condition-specific memo column; independent from training_sessions.note.

alter table public.conditions
  add column if not exists note text not null default '';
