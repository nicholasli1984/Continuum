-- Add itemization to expenses.
--
-- An itemized expense splits its `amount` into a list of line items
-- (e.g. a restaurant receipt with main course + drinks + tip). The parent
-- row keeps `amount` as the rolled-up total; the breakdown lives in this
-- new `items` JSONB array, shape:
--
--   [
--     { "id": "uuid", "description": "Main course", "amount": 30.00 },
--     { "id": "uuid", "description": "Drinks", "amount": 15.00 },
--     { "id": "uuid", "description": "Tip", "amount": 8.00 }
--   ]
--
-- Default is an empty array so existing rows render unchanged. The UI shows
-- the itemized list inline in the expense detail view; reports surface the
-- breakdown when present.
--
-- Run once in the Supabase SQL editor:

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
