// Single source of truth for converting any expense row to its USD value.
// Priority order:
//   1. Explicit `usdReimbursement` (user-entered or from email parsing)
//   2. `amount × fxRate` when fxRate > 0
//   3. `amount` when currency is USD (or absent)
//   4. `amount` as-is (best-effort fallback)
//
// Always returns a number.
export function expenseUSD(e) {
  if (!e) return 0;
  const amt = Number(e.amount) || 0;
  const explicit = Number(e.usdReimbursement);
  if (explicit && explicit > 0) return explicit;
  const cur = (e.currency || "USD").toString().toUpperCase();
  if (cur === "USD") return amt;
  const rate = Number(e.fxRate) || 0;
  if (rate > 0) return amt * rate;
  return amt;
}
