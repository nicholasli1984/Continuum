-- Split expenses — keep receipt images with the expense.
-- Run this in your Supabase SQL Editor. Safe to re-run.
--
-- The split expense form has always offered "Snap receipt", but there was
-- nowhere to put the result: split_expenses had no receipt column and the
-- insert never sent one, so the image was discarded the moment the expense
-- saved. This adds the storage; the app now keeps receipts on create and lets
-- you add, replace or remove them when editing an existing expense.
--
-- Two columns, because an expense can have several receipts (a meal split
-- across two cards, a hotel folio plus its incidentals):
--
--   receipt_images — the list, as JSONB: ["data:image/jpeg;base64,…", …]
--   receipt_image  — the first of them, kept in step so an older client that
--                    only knows about the single column still shows something.
--
-- Images are stored as data URLs (image/jpeg), downscaled client-side before
-- saving so a phone photo doesn't bloat the row. Matches how the main expenses
-- table keeps its receipt_image.

ALTER TABLE split_expenses ADD COLUMN IF NOT EXISTS receipt_image  TEXT;
ALTER TABLE split_expenses ADD COLUMN IF NOT EXISTS receipt_images JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Carry any single receipt saved before this change into the list.
UPDATE split_expenses
   SET receipt_images = jsonb_build_array(receipt_image)
 WHERE receipt_image IS NOT NULL
   AND receipt_images = '[]'::jsonb;
