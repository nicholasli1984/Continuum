-- Split expenses — keep the receipt image with the expense.
-- Run this in your Supabase SQL Editor. Safe to re-run.
--
-- The split expense form has always offered "Snap receipt", but there was
-- nowhere to put the result: split_expenses had no receipt column and the
-- insert never sent one, so the image was discarded the moment the expense
-- saved. This adds the column; the app now stores the receipt on create and
-- lets you add, replace or remove one when editing an existing expense.
--
-- Stored as a data URL (image/jpeg), downscaled client-side before saving so a
-- phone photo doesn't bloat the row. Matches how the main expenses table keeps
-- its receipt_image.

ALTER TABLE split_expenses ADD COLUMN IF NOT EXISTS receipt_image TEXT;
