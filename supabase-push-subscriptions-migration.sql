-- ─────────────────────────────────────────────────────────────────────────
-- Web-push subscriptions. The /api/push-notify?action=subscribe endpoint
-- upserts here (onConflict: user_id). This table was referenced in code but
-- never had a migration — without it, every subscribe silently failed to save.
-- Run this in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists push_subscriptions (
  user_id      uuid primary key,            -- one subscription per user (onConflict key)
  subscription text not null,               -- stringified PushSubscription JSON
  updated_at   timestamptz default now()
);

-- Only the service role (the push API + flight cron) touches this. Enable RLS
-- with no public policies; the service-role key used server-side bypasses RLS.
alter table push_subscriptions enable row level security;
