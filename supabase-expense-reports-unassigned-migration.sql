-- Add included_unassigned_expense_ids to expense_reports so reports can
-- pull in orphan inbox receipts (expenses with tripId IS NULL) without
-- requiring them to be assigned to a trip first.
-- Run this in your Supabase SQL Editor.

ALTER TABLE expense_reports
  ADD COLUMN IF NOT EXISTS included_unassigned_expense_ids JSONB DEFAULT '[]'::jsonb;
