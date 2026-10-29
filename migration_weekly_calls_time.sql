-- Migration: Add calling_time column to weekly_calls table
ALTER TABLE public.weekly_calls ADD COLUMN IF NOT EXISTS calling_time text null;

COMMENT ON COLUMN public.weekly_calls.calling_time IS 'Scheduled time for weekly call (e.g. 10:30, 14:00)';
