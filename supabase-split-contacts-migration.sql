-- Personal address book for Expense Split.
-- Each row is a contact owned by one user. Contacts persist across groups
-- so you can pick from them when creating a new trip.
-- Run in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS split_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- One contact per (owner, email), case-insensitive.
CREATE UNIQUE INDEX IF NOT EXISTS split_contacts_owner_email_unique
  ON split_contacts (owner_id, lower(email));

CREATE INDEX IF NOT EXISTS split_contacts_owner_idx
  ON split_contacts (owner_id);

ALTER TABLE split_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads own contacts" ON split_contacts;
CREATE POLICY "Owner reads own contacts"
  ON split_contacts FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owner manages own contacts" ON split_contacts;
CREATE POLICY "Owner manages own contacts"
  ON split_contacts FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
