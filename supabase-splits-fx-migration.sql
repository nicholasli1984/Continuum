-- Adds per-expense FX rate to split_expenses so each expense can be
-- in any currency and converts back to the group's home currency.
-- Run this in your Supabase SQL Editor.

ALTER TABLE split_expenses
  ADD COLUMN IF NOT EXISTS fx_rate NUMERIC NOT NULL DEFAULT 1;

-- Backfill existing rows (already 1 by default; this is a no-op safety net).
UPDATE split_expenses SET fx_rate = 1 WHERE fx_rate IS NULL;
