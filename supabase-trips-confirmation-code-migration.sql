-- Add confirmation_code column to trips so the create-trip flow can store
-- a top-level rollup of the booking reference (sourced from imported segments).
-- Without this column, "Create Trip" fails with:
--   "Could not find the 'confirmation_code' column of 'trips' in the schema cache"
--
-- Run this in your Supabase SQL Editor.

ALTER TABLE trips ADD COLUMN IF NOT EXISTS confirmation_code TEXT;
