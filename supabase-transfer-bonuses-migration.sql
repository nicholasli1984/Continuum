-- Transfer bonuses snapshot table.
-- Single-row table (id = 'current') holding the latest scrape result.
-- Written weekly by the Vercel cron job at /api/news?action=refresh-transfer-bonuses.
-- Read by the frontend hook useTransferBonuses().

create table if not exists public.transfer_bonuses (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

-- RLS: anyone can read the snapshot (it's public marketing data),
-- only the service role can write (the cron uses the service-role key).
alter table public.transfer_bonuses enable row level security;

drop policy if exists "transfer_bonuses_read" on public.transfer_bonuses;
create policy "transfer_bonuses_read" on public.transfer_bonuses
  for select using (true);
