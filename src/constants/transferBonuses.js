// Transfer bonus tracker
//
// Active transfer bonuses from credit card points → airline/hotel partners.
// Refreshed weekly via Vercel cron (api/news.js?action=refresh-transfer-bonuses)
// which scrapes Frequent Miler's transfer-bonus page via Claude Haiku and writes
// the parsed JSON to Supabase table `transfer_bonuses`.
//
// The frontend hook (useTransferBonuses) reads from Supabase first; this file is
// the seed/fallback if Supabase is empty or unreachable.

export const SEED_TRANSFER_BONUSES = {
  lastUpdated: null, // ISO date — null means "never refreshed, using seed"
  source: "Frequent Miler",
  bonuses: [
    // {
    //   from: "Amex Membership Rewards",
    //   to: "Virgin Atlantic Flying Club",
    //   bonusPct: 30,            // e.g. 30 means 30% extra (1k MR → 1.3k Virgin pts)
    //   endDate: "2026-04-30",   // YYYY-MM-DD
    //   url: "https://...",      // optional — link to the offer
    //   notes: "First-time transfers only" // optional
    // },
  ],
};

// Map "from" currency strings to the same currency IDs we use in pointValues.js
// so the banner can highlight bonuses on points the user actually holds.
export const TRANSFER_FROM_TO_CURRENCY_ID = {
  "Amex Membership Rewards": "amex_mr",
  "American Express Membership Rewards": "amex_mr",
  "Chase Ultimate Rewards": "chase_ur",
  "Capital One Miles": "capital_one",
  "Capital One Venture Miles": "capital_one",
  "Citi ThankYou Points": "citi_ty",
  "Citi ThankYou": "citi_ty",
  "Bilt Rewards": "bilt",
  "Marriott Bonvoy": "marriott_bonvoy",
  "World of Hyatt": "hyatt",
  "Hilton Honors": "hilton",
  "IHG One Rewards": "ihg",
};

// Filter helpers
export function isActive(bonus, now = new Date()) {
  if (!bonus?.endDate) return true;
  const end = new Date(bonus.endDate + "T23:59:59");
  return end >= now;
}

export function activeBonuses(data, now = new Date()) {
  return (data?.bonuses || []).filter(b => isActive(b, now));
}

export function bonusesForUserCurrencies(data, userCurrencyIds, now = new Date()) {
  const set = new Set(userCurrencyIds || []);
  return activeBonuses(data, now).filter(b => {
    const cur = TRANSFER_FROM_TO_CURRENCY_ID[b.from];
    return cur && set.has(cur);
  });
}

export function daysRemaining(bonus, now = new Date()) {
  if (!bonus?.endDate) return null;
  const end = new Date(bonus.endDate + "T23:59:59");
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}
