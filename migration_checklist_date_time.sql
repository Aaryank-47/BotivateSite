-- ============================================================================
-- migration_checklist_date_time.sql
-- Add Date and Time fields to checklist_tasks (Checklist and Delegation)
--
-- Run once in the Supabase SQL Editor. Safe to re-run (if not exists).
-- ============================================================================

alter table public.checklist_tasks
  add column if not exists task_date date,
  add column if not exists task_time text;

comment on column public.checklist_tasks.task_date is 'Scheduled date for the checklist task (YYYY-MM-DD)';
comment on column public.checklist_tasks.task_time is 'Scheduled execution time for the checklist task (e.g. HH:MM / 10:30)';
