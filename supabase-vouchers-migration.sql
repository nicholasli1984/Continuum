-- Vouchers & Free Nights for Continuum
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  source_card_id TEXT,
  source_program_id TEXT,
  issued_date DATE,
  expiry_date DATE,
  value_estimate NUMERIC,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_vouchers_user_idx ON user_vouchers(user_id);
CREATE INDEX IF NOT EXISTS user_vouchers_expiry_idx ON user_vouchers(user_id, expiry_date) WHERE status = 'active';

ALTER TABLE user_vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_vouchers_owner_select ON user_vouchers;
CREATE POLICY user_vouchers_owner_select ON user_vouchers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_vouchers_owner_insert ON user_vouchers;
CREATE POLICY user_vouchers_owner_insert ON user_vouchers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_vouchers_owner_update ON user_vouchers;
CREATE POLICY user_vouchers_owner_update ON user_vouchers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_vouchers_owner_delete ON user_vouchers;
CREATE POLICY user_vouchers_owner_delete ON user_vouchers
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
