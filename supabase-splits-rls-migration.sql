-- Expense Split — real row-level security, scoped to group membership.
-- Run this in your Supabase SQL Editor. Safe to re-run.
--
-- The original policies were placeholders: every table was
--   USING (true) WITH CHECK (true) TO authenticated
-- which let any signed-in Continuum user read, edit and delete every group,
-- expense and settlement belonging to anyone. These replace them with:
--
--   * a group, its members, its expenses and its settlements are visible only
--     to that group's members;
--   * anyone in a group may add an expense to it;
--   * an expense may be edited or deleted only by the person who added it —
--     enforced here, not just hidden in the UI;
--   * membership and the group itself are managed by members, and the group
--     row can only be renamed or deleted by whoever created it.

-- ── Membership test ──────────────────────────────────────────────────────
-- SECURITY DEFINER so the policy on split_group_members can call it without
-- recursing through its own policy. Matches on the account id where the member
-- has been linked, and on email otherwise (members are keyed by address, and a
-- new account is linked on first sign-in).
CREATE OR REPLACE FUNCTION split_is_member(gid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM split_group_members m
     WHERE m.group_id = gid
       AND (m.user_id = auth.uid()
            OR lower(m.email) = lower(COALESCE(auth.jwt() ->> 'email', '')))
  ) OR EXISTS (
    SELECT 1 FROM split_groups g
     WHERE g.id = gid AND g.created_by = auth.uid()
  );
$$;

-- Expenses added before this migration may have no author recorded; without
-- one, the "only the author may edit" rule would lock them for everyone. Treat
-- the group's creator as the author of those.
UPDATE split_expenses e
   SET created_by = g.created_by
  FROM split_groups g
 WHERE e.group_id = g.id
   AND e.created_by IS NULL;

-- ── Groups ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS split_groups_all ON split_groups;
DROP POLICY IF EXISTS split_groups_select ON split_groups;
DROP POLICY IF EXISTS split_groups_insert ON split_groups;
DROP POLICY IF EXISTS split_groups_modify ON split_groups;
DROP POLICY IF EXISTS split_groups_delete ON split_groups;

CREATE POLICY split_groups_select ON split_groups FOR SELECT TO authenticated
  USING (split_is_member(id));
CREATE POLICY split_groups_insert ON split_groups FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY split_groups_modify ON split_groups FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY split_groups_delete ON split_groups FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- ── Members ──────────────────────────────────────────────────────────────
-- Any member may add or remove people; the INSERT check also lets the creator
-- seed the first row, before any membership exists to test against.
DROP POLICY IF EXISTS split_group_members_all ON split_group_members;
DROP POLICY IF EXISTS split_group_members_select ON split_group_members;
DROP POLICY IF EXISTS split_group_members_write ON split_group_members;

CREATE POLICY split_group_members_select ON split_group_members FOR SELECT TO authenticated
  USING (split_is_member(group_id));
CREATE POLICY split_group_members_write ON split_group_members FOR ALL TO authenticated
  USING (split_is_member(group_id))
  WITH CHECK (split_is_member(group_id));

-- ── Expenses ─────────────────────────────────────────────────────────────
-- Everyone in the group sees them and may add their own; only the author may
-- change or remove one.
DROP POLICY IF EXISTS split_expenses_all ON split_expenses;
DROP POLICY IF EXISTS split_expenses_select ON split_expenses;
DROP POLICY IF EXISTS split_expenses_insert ON split_expenses;
DROP POLICY IF EXISTS split_expenses_update ON split_expenses;
DROP POLICY IF EXISTS split_expenses_delete ON split_expenses;

CREATE POLICY split_expenses_select ON split_expenses FOR SELECT TO authenticated
  USING (split_is_member(group_id));
CREATE POLICY split_expenses_insert ON split_expenses FOR INSERT TO authenticated
  WITH CHECK (split_is_member(group_id) AND created_by = auth.uid());
CREATE POLICY split_expenses_update ON split_expenses FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY split_expenses_delete ON split_expenses FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- ── Shares (the per-person amounts on an expense) ────────────────────────
-- Readable by the group; writable only through an expense you added, since
-- they are rewritten whenever that expense is saved.
DROP POLICY IF EXISTS split_expense_shares_all ON split_expense_shares;
DROP POLICY IF EXISTS split_expense_shares_select ON split_expense_shares;
DROP POLICY IF EXISTS split_expense_shares_write ON split_expense_shares;

CREATE POLICY split_expense_shares_select ON split_expense_shares FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM split_expenses e
                  WHERE e.id = expense_id AND split_is_member(e.group_id)));
CREATE POLICY split_expense_shares_write ON split_expense_shares FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM split_expenses e
                  WHERE e.id = expense_id AND e.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM split_expenses e
                       WHERE e.id = expense_id AND e.created_by = auth.uid()));

-- ── Settlements ──────────────────────────────────────────────────────────
-- Any member may record a payment; only the person who recorded it (the payer)
-- or the group's creator may amend it.
DROP POLICY IF EXISTS split_settlements_all ON split_settlements;
DROP POLICY IF EXISTS split_settlements_select ON split_settlements;
DROP POLICY IF EXISTS split_settlements_insert ON split_settlements;
DROP POLICY IF EXISTS split_settlements_modify ON split_settlements;

CREATE POLICY split_settlements_select ON split_settlements FOR SELECT TO authenticated
  USING (split_is_member(group_id));
CREATE POLICY split_settlements_insert ON split_settlements FOR INSERT TO authenticated
  WITH CHECK (split_is_member(group_id));
CREATE POLICY split_settlements_modify ON split_settlements FOR ALL TO authenticated
  USING (
    lower(from_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    OR EXISTS (SELECT 1 FROM split_groups g WHERE g.id = group_id AND g.created_by = auth.uid())
  )
  WITH CHECK (split_is_member(group_id));
