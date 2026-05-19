-- Expense Split tables for Continuum
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS split_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  currency TEXT DEFAULT 'USD',
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS split_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES split_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  display_name TEXT,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, email)
);

CREATE TABLE IF NOT EXISTS split_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES split_groups(id) ON DELETE CASCADE,
  paid_by_email TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  category TEXT,
  date DATE DEFAULT CURRENT_DATE,
  split_type TEXT DEFAULT 'equal',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS split_expense_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES split_expenses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  settled BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS split_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES split_groups(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  date DATE DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE split_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_expense_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_settlements ENABLE ROW LEVEL SECURITY;

-- Policies: allow all authenticated users (simplified)
CREATE POLICY split_groups_all ON split_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY split_group_members_all ON split_group_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY split_expenses_all ON split_expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY split_expense_shares_all ON split_expense_shares FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY split_settlements_all ON split_settlements FOR ALL TO authenticated USING (true) WITH CHECK (true);
