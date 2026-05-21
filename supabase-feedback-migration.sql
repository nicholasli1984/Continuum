-- ─────────────────────────────────────────────────────────────────────────
-- In-app feature suggestions / feedback. Private (only the owner reads these
-- via the service role); the /api/feedback endpoint inserts here and also emails
-- contact@gocontinuum.app. Not user-visible to other users, so it's NOT
-- App Store UGC (no moderation/reporting burden).
-- Run this in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid,
  email      text,
  category   text,
  message    text not null,
  created_at timestamptz default now()
);

create index if not exists feedback_created_idx on feedback (created_at desc);

-- Service-role only (the API writes; you read in the dashboard). RLS on, no
-- public policies.
alter table feedback enable row level security;
