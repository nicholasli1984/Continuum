-- Adds `included_expense_ids` snapshot to expense_reports.
--
-- Before this change, an expense_report was a "live filter": all expenses on
-- selected_trip_ids minus excluded_expense_ids, plus included_unassigned_ids,
-- plus custom_expenses. Any expense the user added LATER to one of those
-- trips would silently join the report. Users complained about this — once
-- they file a report, new expenses should not retroactively change it.
--
-- The fix: at save time we snapshot the resolved list of real expense IDs
-- into `included_expense_ids`. The frontend prefers this snapshot when
-- present and falls back to the legacy live-filter logic for reports created
-- before this migration (i.e., rows where the column is NULL).
--
-- Editing a report still works: the builder UI saves a fresh snapshot, so a
-- user can intentionally pull in newly-added expenses by re-opening and
-- re-saving the report.

ALTER TABLE expense_reports
  ADD COLUMN IF NOT EXISTS included_expense_ids uuid[] DEFAULT NULL;

COMMENT ON COLUMN expense_reports.included_expense_ids IS
  'Snapshot of expense IDs included in this report at save time. NULL on legacy rows; frontend falls back to selected_trip_ids + excluded_expense_ids in that case.';
