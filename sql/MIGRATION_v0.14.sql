-- MatchDay v0.14.0 — provenance on subjects (who added a person, and when).
-- ALREADY RUN on "Picture Day Cal" 2026-09-11. Safe to re-run (IF NOT EXISTS).
-- Reconstructed 2026-10-22 from the project record; the original file was lost.
alter table public.md_subjects add column if not exists added_at timestamptz;
alter table public.md_subjects add column if not exists added_by text;
