-- MatchDay v0.10.0 — run this once in Supabase before deploying.
-- Supabase → project "Picture Day Cal" → SQL Editor → paste → Run.
-- Safe to run more than once; safe to run while phones are using the app.

-- v0.9.1: deleting a subject leaves a tombstone so other phones remove them
-- instead of syncing them back (you may already have run this one).
alter table md_subjects add column if not exists deleted boolean default false;

-- v0.10.0: absent / no-longer-there marks, with the time they were made
-- so the newest mark wins between phones.
alter table md_subjects add column if not exists flag text default '';
alter table md_subjects add column if not exists flag_ts bigint default 0;
