-- Add source_benefit_id to user_vouchers so we can match auto-derived
-- vouchers (BA Travel Together from chase ba_visa, Aeroplan companion
-- from chase_aeroplan, etc.) to their originating card benefit.
-- Run this in your Supabase SQL Editor after the initial vouchers migration.

ALTER TABLE user_vouchers ADD COLUMN IF NOT EXISTS source_benefit_id TEXT;
