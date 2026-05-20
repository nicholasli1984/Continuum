-- ─────────────────────────────────────────────────────────────────────────
-- Server-side flight notification cron — tracking tables
-- Run this in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────

-- Per-flight status cache. Keyed by flight (NOT per user) so a flight shared
-- by several travelers is checked against AeroDataBox only once.
create table if not exists flight_status_tracking (
  flight_key       text primary key,            -- e.g. "BR51_2026-05-31"
  last_status      jsonb,                        -- last fetched status, for diffing
  last_checked_at  timestamptz,                  -- drives tiered polling
  reminded_users   jsonb default '[]'::jsonb,    -- user_ids already sent the 24h reminder
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Simple per-day AeroDataBox call counter so cost is visible at a glance.
create table if not exists api_usage_daily (
  day               date primary key,
  aerodatabox_calls int default 0,
  updated_at        timestamptz default now()
);

-- Only the service role (the cron) touches these. Enable RLS with no public
-- policies so they're inaccessible to anon/auth clients; the service-role key
-- used by the cron bypasses RLS.
alter table flight_status_tracking enable row level security;
alter table api_usage_daily enable row level security;
