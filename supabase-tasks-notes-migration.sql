-- Household Tasks — a free-text note under each task.
-- Run this in your Supabase SQL Editor. Safe to re-run.
--
-- `note` — an optional aside on a task: what the deposit is for, which shelf
--          the spare key is on, why a job is on hold. One note per task,
--          edited inline on the row. NULL or empty means no note.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS note TEXT;
