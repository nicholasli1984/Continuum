-- Household Tasks — a shared running ledger of responsibilities.
-- Single-owner model: "people" (Nick / Christine / …) are labels owned by one
-- account, not separate logins. Two owner-scoped tables with RLS, mirroring the
-- split_contacts pattern. Run this in your Supabase SQL Editor.

-- ── People (assignee labels) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_people (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#4f46e5',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_people_owner_idx ON task_people (owner_id);

ALTER TABLE task_people ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads own task_people" ON task_people;
CREATE POLICY "Owner reads own task_people"
  ON task_people FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owner manages own task_people" ON task_people;
CREATE POLICY "Owner manages own task_people"
  ON task_people FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ── Tasks (the ledger) ───────────────────────────────────────────────────
-- One-time task: `completed` is sticky, with completed_at / completed_by.
-- Recurring task: never persistently done — each completion bumps done_count
-- and stamps last_done_at / last_done_by, and the task stays open.
CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  recurring    BOOLEAN NOT NULL DEFAULT false,
  assignee_id  UUID REFERENCES task_people(id) ON DELETE SET NULL,
  completed    BOOLEAN NOT NULL DEFAULT false,
  completed_at DATE,
  completed_by UUID REFERENCES task_people(id) ON DELETE SET NULL,
  done_count   INTEGER NOT NULL DEFAULT 0,
  last_done_at DATE,
  last_done_by UUID REFERENCES task_people(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_owner_idx ON tasks (owner_id);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads own tasks" ON tasks;
CREATE POLICY "Owner reads own tasks"
  ON tasks FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owner manages own tasks" ON tasks;
CREATE POLICY "Owner manages own tasks"
  ON tasks FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
