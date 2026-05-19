// Per-currency point valuations used by the Wallet decision engine.
//
// Defaults reflect industry-standard valuations (TPG / Frequent Miler / NerdWallet
// blended) for the major rewards programs as of mid-2026. Users can override
// any of these from the Wallet page; overrides persist in localStorage.

export const POINT_CURRENCIES = {
  // Transferable point currencies
  amex_mr:    { name: "Amex Membership Rewards", short: "MR",   defaultValue: 0.020 },
  chase_ur:   { name: "Chase Ultimate Rewards",  short: "UR",   defaultValue: 0.0205 },
  cap1:       { name: "Capital One Miles",        short: "C1",   defaultValue: 0.0185 },
  citi_ty:    { name: "Citi ThankYou",            short: "TY",   defaultValue: 0.018 },
  bilt:       { name: "Bilt Rewards",             short: "BILT", defaultValue: 0.0205 },
  // Direct airline / hotel currencies (co-brand cards earn into these)
  delta:      { name: "Delta SkyMiles",           short: "DL",   defaultValue: 0.0116 },
  united:     { name: "United MileagePlus",       short: "UA",   defaultValue: 0.0135 },
  aa:         { name: "American AAdvantage",      short: "AA",   defaultValue: 0.0155 },
  marriott:   { name: "Marriott Bonvoy",          short: "BVY",  defaultValue: 0.0081 },
  hilton:     { name: "Hilton Honors",            short: "HH",   defaultValue: 0.005 },
  hyatt:      { name: "World of Hyatt",           short: "WoH",  defaultValue: 0.017 },
  ihg:        { name: "IHG One Rewards",          short: "IHG",  defaultValue: 0.005 },
  southwest:  { name: "Southwest Rapid Rewards",  short: "SW",   defaultValue: 0.014 },
  atmos:      { name: "Alaska / Atmos",           short: "AS",   defaultValue: 0.0165 },
};

// Map each tracked credit card to the currency its points settle into.
// Keys MUST match LOYALTY_PROGRAMS.creditCards IDs.
export const CARD_TO_CURRENCY = {
  amex_plat:        "amex_mr",
  amex_gold:        "amex_mr",
  amex_green:       "amex_mr",
  chase_sapphire:   "chase_ur",
  chase_sapphire_pref: "chase_ur",
  cap1_venturex:    "cap1",
  cap1_venture:     "cap1",
  citi_premier:     "citi_ty",
  bilt:             "bilt",
  delta_reserve:    "delta",
  delta_gold:       "delta",
  united_club:      "united",
  united_explorer:  "united",
  aa_exec:          "aa",
  marriott_boundless: "marriott",
  hilton_aspire:    "hilton",
  hilton_surpass:   "hilton",
  hyatt_card:       "hyatt",
  ihg_premier:      "ihg",
  sw_priority:      "southwest",
  atmos_summit:     "atmos",
};

const OVERRIDE_KEY = "continuum:pointValueOverrides";

// Read user overrides ({ [currencyId]: cents-per-point } where the value is in
// dollars per point — e.g. 0.02 = 2¢/pt).
export function readPointValueOverrides() {
  try {
    const raw = window.localStorage.getItem(OVERRIDE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch { return {}; }
}

export function writePointValueOverrides(overrides) {
  try {
    window.localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides || {}));
  } catch {}
}

// Effective value (USD per point) for a currency, factoring in user overrides.
export function pointValueFor(currencyId, overrides) {
  const base = POINT_CURRENCIES[currencyId];
  if (!base) return 0.01; // safety fallback
  const ov = (overrides || readPointValueOverrides())[currencyId];
  return typeof ov === "number" && ov > 0 ? ov : base.defaultValue;
}

// Build the full effective valuations table once (avoids re-reading localStorage
// in hot loops). Returns { [currencyId]: { ...base, value, isOverride } }
export function getEffectiveValuations(overrides) {
  const ov = overrides || readPointValueOverrides();
  const out = {};
  Object.entries(POINT_CURRENCIES).forEach(([id, meta]) => {
    const value = typeof ov[id] === "number" && ov[id] > 0 ? ov[id] : meta.defaultValue;
    out[id] = { ...meta, value, isOverride: typeof ov[id] === "number" && ov[id] > 0 };
  });
  return out;
}
