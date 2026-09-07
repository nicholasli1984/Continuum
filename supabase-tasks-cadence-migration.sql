-- Household Tasks — recurring cadence + per-occurrence completion log.
-- Run this in your Supabase SQL Editor after supabase-tasks-migration.sql.
--
-- `cadence`     — how often a recurring task comes round: daily / weekly /
--                 monthly / yearly. Ignored for one-time tasks.
-- `completions` — the log of individual occurrences, newest last:
--                   [{ "on": "2026-09-07", "by": "<task_people.id>" }, …]
--                 One entry per completed occurrence. This is what makes a
--                 mis-tapped completion removable: the entry is deleted rather
--                 than a counter being decremented. done_count / last_done_at /
--                 last_done_by are kept in sync as a rollup of this array.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS cadence     TEXT  NOT NULL DEFAULT 'weekly';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completions JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Only the four rhythms the UI offers.
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_cadence_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_cadence_check
  CHECK (cadence IN ('daily', 'weekly', 'monthly', 'yearly'));

-- Backfill: an existing recurring task with a recorded completion becomes a
-- one-entry log, so its history survives the upgrade.
UPDATE tasks
   SET completions = jsonb_build_array(
         jsonb_build_object('on', to_char(last_done_at, 'YYYY-MM-DD'),
                            'by', last_done_by)
       )
 WHERE recurring
   AND last_done_at IS NOT NULL
   AND completions = '[]'::jsonb;
