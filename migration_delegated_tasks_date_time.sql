-- ============================================================================
-- migration_delegated_tasks_date_time.sql
-- Add target_time and new_target_time to delegated_tasks (Checklist and Delegation)
--
-- Run once in the Supabase SQL Editor. Safe to re-run (if not exists).
-- ============================================================================

alter table public.delegated_tasks
  add column if not exists target_time text,
  add column if not exists new_target_time text;

comment on column public.delegated_tasks.target_time is 'Target execution / due time for the delegated task (e.g. 10:30, 15:45)';
comment on column public.delegated_tasks.new_target_time is 'Extended target time if task was rescheduled';
