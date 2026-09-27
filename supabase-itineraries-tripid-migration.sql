-- Itineraries — record which trip absorbed a forwarded booking.
-- Run this in your Supabase SQL Editor. Safe to re-run.
--
-- The inbox UI has always written `trip_id` when you file a booking into an
-- existing trip, but the column was never created: PostgREST rejected the whole
-- UPDATE with "column trip_id does not exist", so `status` stayed 'pending' and
-- the booking came back the next time the inbox was read. The app now falls
-- back to a status-only update when this column is missing, and records the
-- trip when it exists.

ALTER TABLE itineraries
  ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS itineraries_trip_idx ON itineraries (trip_id);
