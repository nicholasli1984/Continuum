// Single source of truth for converting any expense row to its USD value.
// Priority order:
//   1. Explicit `usdReimbursement` (user-entered or from email parsing)
//   2. `amount × fxRate` when fxRate > 0
//   3. `amount` when currency is USD (or absent)
//   4. `amount` as-is (best-effort fallback, see caveat)
//
// CAVEAT on #4: returning the raw foreign-currency amount as a USD value
// double-counts at the totals level (¥10,000 with no FX rate showing up as
// $10,000 in the report total). Callers that aggregate across mixed
// currencies should use `groupExpenseTotals` below — it splits genuinely-
// convertible expenses from those without an FX rate so the UI can show
// each currency separately instead of pretending they're all dollars.
// `expenseUSD` keeps its existing return shape for legacy callers (sorting,
// per-row display) that need a single numeric value.
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

// True when we can confidently express this expense as a USD value.
// Returns false for foreign-currency expenses missing both an explicit
// usdReimbursement override and an fxRate.
export function hasUsdConversion(e) {
  if (!e) return false;
  const explicit = Number(e.usdReimbursement);
  if (explicit && explicit > 0) return true;
  const cur = (e.currency || "USD").toString().toUpperCase();
  if (cur === "USD") return true;
  const rate = Number(e.fxRate) || 0;
  return rate > 0;
}

// Bucket a list of expenses into a USD subtotal (convertible) plus a
// per-currency map of raw foreign-currency subtotals (unconverted). UI
// surfaces showing report totals should display each bucket separately
// when `byCurrency` is non-empty so the user isn't told ¥10,000 = $10,000.
//
// Returns { usd, byCurrency, hasUnconverted, currencyCount }.
//   usd            — number, USD equivalents of convertible rows
//   byCurrency     — { JPY: 12345, EUR: 67.8, … } in source units
//   hasUnconverted — true when at least one bucket exists in byCurrency
//   currencyCount  — total distinct currencies in this set (including USD
//                    if any convertible row exists)
export function groupExpenseTotals(expenses) {
  const out = { usd: 0, byCurrency: {}, hasUnconverted: false, currencyCount: 0 };
  let anyUsd = false;
  for (const e of expenses || []) {
    if (hasUsdConversion(e)) {
      out.usd += expenseUSD(e);
      anyUsd = true;
      continue;
    }
    const cur = (e.currency || "USD").toString().toUpperCase();
    const amt = Number(e.amount) || 0;
    out.byCurrency[cur] = (out.byCurrency[cur] || 0) + amt;
    out.hasUnconverted = true;
  }
  out.currencyCount = Object.keys(out.byCurrency).length + (anyUsd ? 1 : 0);
  return out;
}

// Format an amount in a given currency with the right number of decimal
// places per ISO 4217 (JPY/KRW/VND/IDR are zero-decimal). Falls back to a
// plain "CCY 12.34" rendering if Intl can't resolve the code.
export function formatCurrencyAmount(amount, currency) {
  const cur = String(currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: ["JPY", "KRW", "VND", "IDR", "CLP"].includes(cur) ? 0 : 2,
    }).format(Number(amount) || 0);
  } catch {
    const n = (Number(amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return `${cur} ${n}`;
  }
}
