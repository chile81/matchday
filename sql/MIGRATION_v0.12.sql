-- MatchDay v0.12.0 — run once in Supabase before (or after) deploying.
-- Supabase → project "Picture Day Cal" → SQL Editor → paste → Run.
-- Safe to run more than once; safe while phones are using the app.

-- Archiving a finished job hides it on EVERY device; this column carries that fact.
alter table md_shoots add column if not exists archived boolean default false;
