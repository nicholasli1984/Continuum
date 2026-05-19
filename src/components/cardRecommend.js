// Best-card-for-this-purchase recommendation engine.
//
// Given an expense category + amount + the user's linked credit cards,
// returns a ranked list of Direct and Portal redemption options, valued in
// USD using shared per-currency point valuations (with optional user overrides).
//
// Source data: CC_BONUS_EXPANDED in constants/airline-data.js, point values in
// constants/pointValues.js.
import { CC_BONUS_EXPANDED } from "../constants/airline-data";
import { LOYALTY_PROGRAMS } from "../constants/programs";
import { CARD_TO_CURRENCY, getEffectiveValuations } from "../constants/pointValues";

// Map expense-category IDs (EXPENSE_CATEGORIES in App.jsx) to credit-card
// bonus-category IDs (CC_SPENDING_CATS).
const EXPENSE_TO_CC_CATEGORY = {
  flight: "flights",
  lodging: "hotels",
  hotel: "hotels",
  taxi: "gas",
  transport: "gas",
  meals: "dining",
  biz_meals: "dining",
  dining: "dining",
  groceries: "groceries",
  conferences: "other",
  supplies: "other",
  prof_dues: "other",
  mobile: "streaming",
  travel_fees: "flights",
  shopping: "other",
  tips: "other",
  lounge: "other",
  other: "other",
};

const CARD_NAMES = {};
LOYALTY_PROGRAMS.creditCards.forEach((c) => { CARD_NAMES[c.id] = c.name; });

/**
 * Compute every (card, redemption-path) option for the given category/amount,
 * ranked by USD value descending. Each option includes the math.
 *
 * @param {Object} args
 * @param {string} args.expenseCategory - id from EXPENSE_CATEGORIES
 * @param {number} args.amount - amount in USD
 * @param {Object} args.linkedAccounts - keys are card ids the user has linked
 * @param {Object} [args.valueOverrides] - optional { [currencyId]: usdPerPoint }
 * @returns {{ best, direct, portal, alternatives, reasoning, ccCategory, valuations }}
 *          or null if no recommendation possible.
 */
export function recommendCard({ expenseCategory, amount, linkedAccounts, valueOverrides }) {
  const ccCategory = EXPENSE_TO_CC_CATEGORY[expenseCategory] || "other";
  const linkedCardIds = Object.keys(linkedAccounts || {}).filter((id) => CC_BONUS_EXPANDED[id]);
  if (linkedCardIds.length === 0) return null;

  const valuations = getEffectiveValuations(valueOverrides);

  const options = [];
  linkedCardIds.forEach((cardId) => {
    const entry = CC_BONUS_EXPANDED[cardId][ccCategory];
    if (entry == null) return;

    const currencyId = CARD_TO_CURRENCY[cardId];
    const ptValue = valuations[currencyId]?.value || 0.01;
    const cardName = CARD_NAMES[cardId] || cardId;

    if (typeof entry === "number") {
      // Single rate
      const points = (amount || 0) * entry;
      options.push({
        cardId, cardName, currencyId, currencyName: valuations[currencyId]?.name || "",
        path: "direct", rate: entry, points, valueUSD: points * ptValue, ptValue,
      });
    } else {
      // Object: {d: directRate, p: portalRate}
      if (entry.d != null) {
        const points = (amount || 0) * entry.d;
        options.push({
          cardId, cardName, currencyId, currencyName: valuations[currencyId]?.name || "",
          path: "direct", rate: entry.d, points, valueUSD: points * ptValue, ptValue,
        });
      }
      if (entry.p != null && entry.p > 0) {
        const points = (amount || 0) * entry.p;
        options.push({
          cardId, cardName, currencyId, currencyName: valuations[currencyId]?.name || "",
          path: "portal", rate: entry.p, points, valueUSD: points * ptValue, ptValue,
        });
      }
    }
  });

  if (options.length === 0) return null;

  // Sort by USD value (which is the real expected value), then by raw rate.
  options.sort((a, b) => b.valueUSD - a.valueUSD || b.rate - a.rate);

  // Best Direct option (regardless of portal)
  const directOptions = options.filter((o) => o.path === "direct");
  const portalOptions = options.filter((o) => o.path === "portal");
  const bestDirect = directOptions[0] || null;
  const bestPortal = portalOptions[0] || null;
  const best = options[0];

  // Build a one-line reasoning for the top option
  const ccCatLabel = ccCategory === "other" ? "general spend" : ccCategory;
  const pathLabel = best.path === "portal" ? " via the issuer travel portal" : "";
  let reasoning = `${best.rate}× on ${ccCatLabel}${pathLabel} · valued at ${(best.ptValue * 100).toFixed(2)}¢/pt`;

  // Alternatives = next 3 options that aren't the same card+path as best
  const alternatives = options
    .filter((o) => !(o.cardId === best.cardId && o.path === best.path))
    .slice(0, 3);

  return {
    best,
    bestDirect,
    bestPortal,
    direct: directOptions,
    portal: portalOptions,
    alternatives,
    reasoning,
    ccCategory,
    valuations,
  };
}
