-- ─────────────────────────────────────────────────────────────────────────
-- Native push device tokens (APNs for iOS, FCM later for Android).
--
-- The Capacitor native app registers an OS-level device token, NOT a web-push
-- subscription, so it can't go in push_subscriptions. One row per device token
-- (a user can have multiple devices). The flight cron sends to every token a
-- user has, in addition to their web-push subscription.
--
-- Run this in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists device_push_tokens (
  token      text primary key,            -- APNs/FCM device token (unique per device install)
  user_id    uuid not null,               -- owning user
  platform   text default 'ios',          -- 'ios' (APNs) | 'android' (FCM)
  updated_at timestamptz default now()
);

create index if not exists device_push_tokens_user_idx on device_push_tokens (user_id);

-- Only the service role (push API + flight cron) touches this. Enable RLS with
-- no public policies; the service-role key used server-side bypasses RLS.
alter table device_push_tokens enable row level security;
