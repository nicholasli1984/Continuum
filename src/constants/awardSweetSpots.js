// Curated library of "sweet spot" award redemptions — places where points
// punch above their weight. Currency IDs match POINT_CURRENCIES in
// pointValues.js so we can highlight spots on points the user actually holds.
//
// Cents-per-point (cpp) is the spot's effective value. For comparison:
//  - Standard valuations sit around 1.5–2.0¢ (see pointValues.js).
//  - 4¢+ is "very good." 7¢+ is "outsized."
//  - Aspirational first-class redemptions can show 10¢+, but availability is
//    the real story — we surface those caveats in the notes.
//
// All redemptions assume the user routes points through the partner program
// listed under `via`. Transfer ratios (1:1 or noted otherwise) reflect current
// program rules as of mid-2026.

export const SWEET_SPOTS = [
  // ── Amex Membership Rewards ─────────────────────────────────────────────
  {
    id: "anain_first_via_ana",
    currency: "amex_mr",
    title: "ANA First Class · The Suite",
    route: "USA ↔ Tokyo (round-trip)",
    cabin: "first",
    points: { value: 150000, label: "150–200k round-trip" },
    cashValue: { low: 15000, high: 22000 },
    cppLabel: "10–15¢/pt",
    partner: "ANA Mileage Club",
    via: "Transfer Amex MR → ANA at 1:1",
    category: "aspirational",
    notes: "Routinely ranked the world's best US-Asia first product. Round-trip pricing is the trick — one-way isn't an option through ANA. Low fuel surcharges out of the US.",
    availability: "Bookable ~355 days out, very limited",
  },
  {
    id: "cathay_first_via_asia_miles",
    currency: "amex_mr",
    title: "Cathay Pacific First Class",
    route: "USA ↔ Hong Kong",
    cabin: "first",
    points: { value: 125000, label: "125k each way" },
    cashValue: { low: 14000, high: 20000 },
    cppLabel: "11–16¢/pt",
    partner: "Cathay Asia Miles",
    via: "Transfer Amex MR → Asia Miles at 1:1",
    category: "aspirational",
    notes: "The Pier First lounge at HKG is part of the experience. Availability is famously thin — set alerts and pounce.",
    availability: "Released in waves, often last-minute",
  },
  {
    id: "aer_lingus_business_via_avios",
    currency: "amex_mr",
    title: "Aer Lingus Business · transatlantic",
    route: "Boston / JFK ↔ Dublin",
    cabin: "business",
    points: { value: 60000, label: "50–75k each way" },
    cashValue: { low: 3500, high: 5500 },
    cppLabel: "5–9¢/pt",
    partner: "British Airways / Iberia / Aer Lingus Avios",
    via: "Transfer Amex MR → BA or Iberia at 1:1",
    category: "best_value",
    notes: "Avios go further on Aer Lingus than on BA — no London passenger duty, and surcharges are a fraction of what BA charges through LHR.",
    availability: "Generally good, especially shoulder season",
  },

  // ── Chase Ultimate Rewards ─────────────────────────────────────────────
  {
    id: "park_hyatt_tokyo",
    currency: "chase_ur",
    title: "Park Hyatt Tokyo",
    route: "Hotel · Tokyo, Japan",
    cabin: "hotel",
    points: { value: 30000, label: "30k / night (Cat 7 std)" },
    cashValue: { low: 800, high: 1400 },
    cppLabel: "3–5¢/pt",
    partner: "World of Hyatt",
    via: "Transfer Chase UR → Hyatt at 1:1",
    category: "hotel",
    notes: "The Lost in Translation hotel. UR → Hyatt is the strongest 1:1 transfer in the Chase ecosystem. Globalist members get suite upgrade space (when available) plus complimentary breakfast.",
    availability: "Year-round; peak (cherry blossom, autumn) jumps to Cat 8",
  },
  {
    id: "park_hyatt_maldives",
    currency: "chase_ur",
    title: "Park Hyatt Maldives Hadahaa",
    route: "Hotel · Maldives",
    cabin: "hotel",
    points: { value: 35000, label: "35k / night" },
    cashValue: { low: 1500, high: 2800 },
    cppLabel: "4–8¢/pt",
    partner: "World of Hyatt",
    via: "Transfer Chase UR → Hyatt at 1:1",
    category: "hotel",
    notes: "Among the most consistently outsized Hyatt redemptions. Pair with Globalist for free breakfast (huge in the Maldives) and confirmed suite upgrades.",
    availability: "Best value off-peak; book 6+ months out",
  },
  {
    id: "singapore_suites_via_krisflyer",
    currency: "chase_ur",
    title: "Singapore Airlines Suites",
    route: "JFK ↔ Frankfurt ↔ Singapore",
    cabin: "first",
    points: { value: 86000, label: "86k each way (Saver)" },
    cashValue: { low: 12000, high: 25000 },
    cppLabel: "14–29¢/pt",
    partner: "Singapore KrisFlyer",
    via: "Transfer Chase UR → KrisFlyer at 1:1",
    category: "aspirational",
    notes: "The A380 Suites are the gold standard of commercial aviation. Singapore reserves Suites award space for KrisFlyer members only — no other partner can book it.",
    availability: "Released in tranches, hardest in the calendar",
  },

  // ── Capital One Miles ──────────────────────────────────────────────────
  {
    id: "turkish_business_via_miles_smiles",
    currency: "cap1",
    title: "Star Alliance Business · transatlantic",
    route: "USA ↔ Europe (one-way)",
    cabin: "business",
    points: { value: 45000, label: "45k each way" },
    cashValue: { low: 2500, high: 5000 },
    cppLabel: "5–11¢/pt",
    partner: "Turkish Miles&Smiles",
    via: "Transfer Capital One Miles → Turkish at 1:1",
    category: "best_value",
    notes: "Turkish prices Star Alliance Business at a flat 45k one-way to Europe. The catch: you can only book online for select partners — the rest needs a phone call (sometimes patient ones).",
    availability: "Solid for United/Lufthansa metal; quirkier for others",
  },
  {
    id: "lh_first_via_lifemiles",
    currency: "cap1",
    title: "Lufthansa First Class",
    route: "USA ↔ Frankfurt / Munich",
    cabin: "first",
    points: { value: 87000, label: "87k each way" },
    cashValue: { low: 10000, high: 16000 },
    cppLabel: "11–18¢/pt",
    partner: "Avianca LifeMiles",
    via: "Transfer Capital One Miles → LifeMiles at 1:1",
    category: "aspirational",
    notes: "Lufthansa releases First class space to partners only ~14 days out. LifeMiles charges no fuel surcharges, making this one of the cheapest paths to LH First.",
    availability: "Mostly opens inside 14 days; set alerts",
  },
  {
    id: "wyndham_caesars",
    currency: "cap1",
    title: "Caesars Vegas resorts",
    route: "Hotel · Las Vegas",
    cabin: "hotel",
    points: { value: 7500, label: "7.5k–15k / night" },
    cashValue: { low: 200, high: 600 },
    cppLabel: "3–8¢/pt",
    partner: "Wyndham Rewards",
    via: "Transfer Capital One Miles → Wyndham at 1:1",
    category: "hotel",
    notes: "Wyndham took over Caesars award redemptions — Caesars Palace, The Cromwell, Paris Las Vegas all bookable for 15k pts/night flat. Resort fees still apply.",
    availability: "Year-round",
  },

  // ── Citi ThankYou ──────────────────────────────────────────────────────
  {
    id: "turkish_us_domestic_via_miles_smiles",
    currency: "citi_ty",
    title: "United Domestic Business",
    route: "HNL ↔ LAX / SFO (one-way)",
    cabin: "business",
    points: { value: 7500, label: "7.5k each way" },
    cashValue: { low: 600, high: 1200 },
    cppLabel: "8–16¢/pt",
    partner: "Turkish Miles&Smiles",
    via: "Transfer Citi TY → Turkish at 1:1",
    category: "best_value",
    notes: "Turkish prices intra-North America Business at a flat 7.5k one-way. Hawaii Business class for ~$0 in surcharges is one of the loudest sweet spots in points.",
    availability: "Strong year-round on United metal",
  },
  {
    id: "flying_blue_promo",
    currency: "citi_ty",
    title: "Air France/KLM Business · Promo",
    route: "USA ↔ Europe",
    cabin: "business",
    points: { value: 27500, label: "22–37k when on sale" },
    cashValue: { low: 2200, high: 4500 },
    cppLabel: "6–12¢/pt",
    partner: "Air France-KLM Flying Blue",
    via: "Transfer Citi TY → Flying Blue at 1:1",
    category: "best_value",
    notes: "Flying Blue runs monthly Promo Awards (~25–50% off select routes). Subscribe to their alerts and pounce — discounted Business to Europe routinely shows.",
    availability: "Promotions rotate monthly",
  },

  // ── Bilt Rewards ───────────────────────────────────────────────────────
  {
    id: "alaska_jal_business_via_bilt",
    currency: "bilt",
    title: "JAL Business · USA ↔ Tokyo",
    route: "USA ↔ Tokyo",
    cabin: "business",
    points: { value: 60000, label: "60k each way" },
    cashValue: { low: 4500, high: 8000 },
    cppLabel: "7–13¢/pt",
    partner: "Alaska Mileage Plan",
    via: "Transfer Bilt → Alaska at 1:1",
    category: "best_value",
    notes: "Alaska's JAL chart is the strongest US-Asia Business value going. Free stopover on round-trip awards. Bilt is one of the few transferable currencies that goes to Alaska.",
    availability: "JAL releases space to partners; peak holidays tough",
  },
  {
    id: "hyatt_via_bilt",
    currency: "bilt",
    title: "Park Hyatt Tokyo (via Bilt)",
    route: "Hotel · Tokyo",
    cabin: "hotel",
    points: { value: 30000, label: "30k / night" },
    cashValue: { low: 800, high: 1400 },
    cppLabel: "3–5¢/pt",
    partner: "World of Hyatt",
    via: "Transfer Bilt → Hyatt at 1:1",
    category: "hotel",
    notes: "Bilt's Hyatt transfer matches Chase UR. Use it for any of the Hyatt sweet spots — Tokyo, Maldives, Vienna, Mendoza.",
    availability: "Year-round",
  },

  // ── World of Hyatt (direct) ─────────────────────────────────────────────
  {
    id: "alila_ventana_big_sur",
    currency: "hyatt",
    title: "Alila Ventana Big Sur",
    route: "Hotel · Big Sur, California",
    cabin: "hotel",
    points: { value: 40000, label: "40k / night (Cat 7)" },
    cashValue: { low: 1200, high: 2000 },
    cppLabel: "3–5¢/pt",
    partner: "World of Hyatt",
    via: "Direct redemption",
    category: "hotel",
    notes: "All-inclusive Alila property — daily $150 resort credit, breakfast, evening hosted hour, all free even on award nights. Globalist suite upgrades land regularly.",
    availability: "Tight on weekends; mid-week bookable",
  },

  // ── Marriott Bonvoy ─────────────────────────────────────────────────────
  {
    id: "ritz_reserve",
    currency: "marriott",
    title: "Ritz-Carlton Reserve · Dorado Beach",
    route: "Hotel · Puerto Rico",
    cabin: "hotel",
    points: { value: 120000, label: "100–135k / night" },
    cashValue: { low: 1800, high: 3500 },
    cppLabel: "1.5–3¢/pt",
    partner: "Marriott Bonvoy",
    via: "Direct redemption",
    category: "hotel",
    notes: "The Reserve collection is Marriott's quietly luxurious top tier. Award rates dwarf the Bonvoy average (0.8¢/pt) — it's one of the few reliable ways to get 2–3¢ from Bonvoy points.",
    availability: "Off-peak best value",
  },

  // ── Hilton Honors ───────────────────────────────────────────────────────
  {
    id: "conrad_maldives",
    currency: "hilton",
    title: "Conrad Maldives Rangali Island",
    route: "Hotel · Maldives",
    cabin: "hotel",
    points: { value: 95000, label: "95–120k / night off-peak" },
    cashValue: { low: 1500, high: 3000 },
    cppLabel: "1.5–3¢/pt",
    partner: "Hilton Honors",
    via: "Direct redemption",
    category: "hotel",
    notes: "Hilton's standard 0.5¢/pt valuation gets dwarfed at the Conrad Maldives. The 5th night free perk on award stays makes a 5-night honeymoon outsized.",
    availability: "Off-peak (May, Sep–Nov) best value",
  },

  // ── American AAdvantage ─────────────────────────────────────────────────
  {
    id: "qatar_qsuite_aa",
    currency: "aa",
    title: "Qatar Qsuite Business",
    route: "USA ↔ Doha",
    cabin: "business",
    points: { value: 70000, label: "70k each way" },
    cashValue: { low: 5000, high: 9000 },
    cppLabel: "7–13¢/pt",
    partner: "American AAdvantage",
    via: "Direct redemption (oneworld partner)",
    category: "aspirational",
    notes: "Qsuite is widely considered the best business class product in the sky — privacy doors, quad seats. Qatar releases generous space to AAdvantage 11 months out.",
    availability: "Strong availability when calendar opens",
  },
  {
    id: "jal_first_aa",
    currency: "aa",
    title: "JAL First Class",
    route: "USA ↔ Tokyo",
    cabin: "first",
    points: { value: 80000, label: "80k each way" },
    cashValue: { low: 10000, high: 18000 },
    cppLabel: "12–22¢/pt",
    partner: "American AAdvantage",
    via: "Direct redemption (oneworld partner)",
    category: "aspirational",
    notes: "JAL's Suite First product (Sky Suite III) is a serious rival to ANA. Award space released ~330 days out, then again ~30 days out for unsold inventory.",
    availability: "Bookable on the day calendar opens",
  },

  // ── United MileagePlus ──────────────────────────────────────────────────
  {
    id: "lh_first_via_united",
    currency: "united",
    title: "Lufthansa First Class",
    route: "USA ↔ Frankfurt / Munich",
    cabin: "first",
    points: { value: 110000, label: "110k each way (saver)" },
    cashValue: { low: 10000, high: 16000 },
    cppLabel: "9–14¢/pt",
    partner: "United MileagePlus",
    via: "Direct redemption (Star Alliance)",
    category: "aspirational",
    notes: "United's chart still prices Star Alliance F sensibly, and Lufthansa First includes the Frankfurt First Class Terminal (a champagne experience even if you don't fly that day).",
    availability: "Released ~14 days out; partner-only",
  },
];

// ── Categories ──────────────────────────────────────────────────────────
export const SWEET_SPOT_CATEGORIES = [
  { id: "aspirational",  label: "Aspirational",   note: "International First / Suites" },
  { id: "best_value",    label: "Best value",     note: "Outsized cents-per-point" },
  { id: "hotel",         label: "Hotel",          note: "Premium hotel redemptions" },
];

// ── Filter helpers ──────────────────────────────────────────────────────
export function spotsForCurrencies(currencyIds) {
  if (!currencyIds || currencyIds.length === 0) return SWEET_SPOTS;
  const set = new Set(currencyIds);
  return SWEET_SPOTS.filter(s => set.has(s.currency));
}

export function spotsByCategory(spots) {
  const groups = {};
  for (const s of spots) {
    (groups[s.category] = groups[s.category] || []).push(s);
  }
  return groups;
}
