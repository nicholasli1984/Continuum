-- Cancellation / change / reminder support for forwarded emails.
-- The inbound-email.js API now classifies each email's bookingType.
-- For cancellations, we also try to match the email's confirmation_code
-- against existing trip segments and store the match in match_meta so
-- the user can one-click "Mark cancelled" from the inbox.
--
-- Run this in your Supabase SQL Editor.

ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS intent TEXT;
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS match_meta JSONB;

-- match_meta shape (when intent = 'cancellation'):
-- {
--   "matched": true | false,
--   "trip_id": "uuid or null",
--   "segment_indices": [0, 2],     -- indices into trip.segments array
--   "matched_by": "confirmation_code" | "route_date" | null
-- }
