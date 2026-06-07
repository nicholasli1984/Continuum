// ─────────────────────────────────────────────────────────────────────────
// Server-importable lounge-access engine.
//
// Pure data + functions (no React, no browser APIs) so the flight cron can
// compute "which lounges can this user get into at airport X" using the same
// rules the in-app lounge screen uses. The cron has only a flight number and
// two airport codes to work from, so this module also maps an airline's IATA
// code → loyalty program id and resolves whether a route is international.
//
// Accuracy bias: proactive push must not over-promise. So:
//   • Card-based access always applies (mostly flight-independent).
//   • Elite/alliance access is included ONLY on confirmed international routes
//     (the universally valid case — domestic US carve-outs make alliance
//     lounge access unreliable, so we leave it out rather than risk a wrong
//     promise). Cabin-conditional entitlements are skipped (cabin is unknown
//     server-side), as are dedicated First-class lounges via alliance status.
// ─────────────────────────────────────────────────────────────────────────

import {
  LOUNGE_DATABASE,
  CARD_LOUNGE_ACCESS,
  ELITE_LOUNGE_ACCESS,
  ELITE_ALLIANCE_MAP,
  AIRLINE_ALLIANCE,
  ALLIANCE_LOUNGE_ACCESS,
} from "./lounges.js";

// IATA airline code (the prefix of a flight number) → loyalty program id used
// in the access maps above. Only carriers that confer lounge access need an
// entry; anything missing simply yields no elite/alliance grants.
export const AIRLINE_IATA_TO_PROGRAM = {
  // oneworld
  AA: "aa", BA: "ba_avios", CX: "cathay_mp", QF: "qantas_ff", AS: "atmos",
  JL: "jal", IB: "iberia", AY: "finnair", QR: "qatar", MH: "malaysia",
  WY: "oman_air", EI: "aer_lingus",
  // Star Alliance
  UA: "ua", AC: "aeroplan", NH: "ana", SQ: "singapore_kf", LH: "lufthansa",
  LX: "swiss", OS: "austrian", TK: "turkish_miles", TG: "thai", OZ: "asiana",
  BR: "eva_air", CA: "air_china", AI: "air_india", NZ: "air_nz", CM: "copa",
  SN: "brussels", LO: "lot", TP: "tap", A3: "aegean",
  // SkyTeam
  DL: "dl", AF: "flying_blue", KL: "flying_blue", KE: "korean_air",
  AM: "aeromexico", SV: "saudia", VN: "vietnam_air", GA: "garuda",
  MU: "china_eastern", AZ: "ita_airways", VS: "virgin_fc", SK: "sas",
  // Non-alliance carriers with their own flagship lounges
  EK: "emirates_skywards",
};

// Pull the loyalty-program id from a flight number ("BR51" → "eva_air").
export function airlineIdFromFn(fn) {
  const m = String(fn || "").toUpperCase().match(/^([0-9A-Z]{2})\s*\d/);
  return m ? (AIRLINE_IATA_TO_PROGRAM[m[1]] || null) : null;
}

// Airport → ISO-2 country, used only to decide domestic vs international. Covers
// every airport in LOUNGE_DATABASE (one endpoint of any lounge alert is always
// one of these) plus the busiest other endpoints. Unknown → treated as same
// country as its pair only when both resolve, so missing data is conservative.
export const AIRPORT_COUNTRY = {
  // ── Global rollout additions (2026-05) ──
  ABV: "NG", ACC: "GH", ALA: "KZ", ALG: "DZ", AMD: "IN", ASU: "PY", BAH: "BH", BAQ: "CO",
  BEG: "RS", BEY: "LB", BLQ: "IT", BSB: "BR", CBR: "AU", CCS: "VE", CCU: "IN", CGN: "DE",
  CKG: "CN", CLO: "CO", CMN: "MA", CNF: "BR", CNS: "AU", CNX: "TH", COK: "IN", CTG: "CO",
  CTS: "JP", CUR: "CW", CWB: "BR", DAD: "VN", DAR: "TZ", DKR: "SN", DLC: "CN", DMM: "SA",
  DUR: "ZA", EBB: "UG", FOR: "BR", GBE: "BW", GDN: "PL", GUA: "GT", GYE: "EC", HGH: "CN",
  HKT: "TH", HRE: "ZW", ISB: "PK", KEF: "IS", KGL: "RW", KHI: "PK", KIN: "JM", KMG: "CN",
  KWI: "KW", LCA: "CY", LHE: "PK", LJU: "SI", LUN: "ZM", LYS: "FR", MCT: "OM", MDE: "CO",
  MED: "SA", MGA: "NI", MLA: "MT", MPM: "MZ", MRS: "FR", MRU: "MU", NAP: "IT", NQZ: "KZ",
  OKA: "JP", OOL: "AU", OTP: "RO", POA: "BR", POS: "TT", PPT: "PF", PUJ: "DO", PUS: "KR",
  REC: "BR", RIX: "LV", SAL: "SV", SAP: "HN", SEZ: "SC", SHJ: "AE", SJO: "CR", SKG: "GR",
  SOF: "BG", SSA: "BR", STR: "DE", SVQ: "ES", SXM: "SX", TAO: "CN", TAS: "UZ", TGU: "HN",
  TIJ: "MX", TLL: "EE", TLS: "FR", TNR: "MG", TUN: "TN", VLC: "ES", VNO: "LT", VTE: "LA",
  VVI: "BO", WDH: "NA", XIY: "CN", YHZ: "CA", YWG: "CA", ZAG: "HR", ZQN: "NZ",

  // ── United States ──
  DFW: "US", JFK: "US", LAX: "US", ORD: "US", SFO: "US", MIA: "US", ATL: "US",
  BOS: "US", SEA: "US", DEN: "US", LGA: "US", EWR: "US", IAH: "US", PHX: "US",
  MSP: "US", DTW: "US", CLT: "US", MCO: "US", FLL: "US", SAN: "US", PDX: "US",
  HNL: "US", SJU: "US", LAS: "US", PHL: "US", IAD: "US", DCA: "US", TPA: "US",
  MSY: "US", RDU: "US", BNA: "US", AUS: "US", SLC: "US", STL: "US", PIT: "US",
  MKE: "US", CLE: "US", IND: "US", CMH: "US", OAK: "US", SJC: "US", SMF: "US",
  JAX: "US", RSW: "US",
  // additional common US endpoints (not lounge airports, but frequent pairs)
  MDW: "US", SNA: "US", BUR: "US", ONT: "US", SAT: "US", ABQ: "US", OMA: "US",
  MEM: "US", BWI: "US", BUF: "US", ANC: "US", BOI: "US", TUS: "US", OKC: "US",
  RNO: "US", PBI: "US", ELP: "US", ORF: "US", RIC: "US", GRR: "US", DAL: "US",
  HOU: "US", CVG: "US", KOA: "US", OGG: "US", LIH: "US", GUM: "US",
  // ── Canada ──
  YYZ: "CA", YVR: "CA", YUL: "CA", YYC: "CA", YOW: "CA", YEG: "CA",
  // ── Mexico / Latin America / Caribbean ──
  MEX: "MX", CUN: "MX", GDL: "MX", MTY: "MX", SJD: "MX", PVR: "MX",
  GRU: "BR", GIG: "BR", EZE: "AR", BOG: "CO", SCL: "CL", PTY: "PA", LIM: "PE",
  UIO: "EC", MVD: "UY", SDQ: "DO", NAS: "BS", MBJ: "JM", AUA: "AW", BGI: "BB",
  BDA: "BM",
  // ── United Kingdom / Ireland ──
  LHR: "GB", LGW: "GB", EDI: "GB", MAN: "GB", BHX: "GB", GLA: "GB", DUB: "IE",
  // ── Europe ──
  CDG: "FR", ORY: "FR", NCE: "FR", AMS: "NL", FRA: "DE", MUC: "DE", BER: "DE",
  DUS: "DE", HAM: "DE", ZRH: "CH", GVA: "CH", FCO: "IT", MXP: "IT", VCE: "IT",
  BCN: "ES", MAD: "ES", AGP: "ES", PMI: "ES", LIS: "PT", OPO: "PT", CPH: "DK",
  ARN: "SE", GOT: "SE", HEL: "FI", OSL: "NO", BRU: "BE", WAW: "PL", KRK: "PL",
  PRG: "CZ", BUD: "HU", VIE: "AT", ATH: "GR", IST: "TR", SAW: "TR", LIN: "IT",
  // ── Middle East / Africa ──
  DXB: "AE", AUH: "AE", DOH: "QA", JED: "SA", RUH: "SA", CAI: "EG", JNB: "ZA",
  CPT: "ZA", ADD: "ET", NBO: "KE", LOS: "NG", TLV: "IL", AMM: "JO",
  // ── Asia ──
  NRT: "JP", HND: "JP", KIX: "JP", NGO: "JP", FUK: "JP", HKG: "HK", SIN: "SG",
  ICN: "KR", GMP: "KR", BKK: "TH", DMK: "TH", TPE: "TW", KHH: "TW", KUL: "MY",
  BKI: "MY", PEN: "MY", MNL: "PH", CEB: "PH", DEL: "IN", BOM: "IN", BLR: "IN",
  MAA: "IN", HYD: "IN", PVG: "CN", PEK: "CN", PKX: "CN", CAN: "CN", SHA: "CN",
  CTU: "CN", SZX: "CN", HAN: "VN", SGN: "VN", DPS: "ID", CGK: "ID", SUB: "ID",
  PNH: "KH", REP: "KH", RGN: "MM", CMB: "LK", MLE: "MV", DAC: "BD", KTM: "NP",
  // ── Oceania ──
  SYD: "AU", MEL: "AU", BNE: "AU", PER: "AU", ADL: "AU", AKL: "NZ", CHC: "NZ",
  WLG: "NZ", NAN: "FJ",
};

// True only when both endpoints resolve to different countries. Unknown data
// resolves to NOT international (so we never over-promise intl-only lounges).
export function isInternational(depIata, arrIata) {
  const a = AIRPORT_COUNTRY[String(depIata || "").toUpperCase()];
  const b = AIRPORT_COUNTRY[String(arrIata || "").toUpperCase()];
  if (!a || !b) return false;
  return a !== b;
}

// Core engine. `accounts` is { programId: { currentTier } } per the user's
// linked_accounts rows. Returns the accessible lounge objects (from the DB)
// each tagged with the access source(s) that opened it.
export function computeLoungeAccess({ airport, flyingAirlineId, alliance, isIntl, accounts }) {
  const lounges = LOUNGE_DATABASE[String(airport || "").toUpperCase()] || [];
  const accts = accounts || {};
  const out = [];

  for (const lounge of lounges) {
    const network = lounge.network;
    const grants = [];

    // 1. Card access — applies regardless of route, honoring the few
    //    airline-specific conditions we can verify from the flight number.
    for (const cardId of Object.keys(accts)) {
      const rules = CARD_LOUNGE_ACCESS[cardId];
      if (!rules) continue;
      for (const rule of rules) {
        if (rule.network !== network) continue;
        if (rule.condition === "flying_delta" && flyingAirlineId !== "dl") continue;
        if (rule.condition === "flying_united" && flyingAirlineId !== "ua") continue;
        if (rule.condition === "flying_aa" && flyingAirlineId !== "aa") continue;
        grants.push({ source: "card", id: cardId });
      }
    }

    // Elite + alliance access only on a confirmed international route.
    if (isIntl) {
      // 2. Direct airline elite access (e.g. AA EP → Admirals on intl oneworld).
      for (const [progId, acct] of Object.entries(accts)) {
        if (!acct.currentTier) continue;
        const airline = ELITE_LOUNGE_ACCESS[progId];
        const tier = airline?.tiers?.[acct.currentTier];
        if (!tier) continue;
        for (const rule of tier.lounges) {
          if (rule.network !== network) continue;
          const c = rule.condition;
          // Skip cabin-conditional entitlements — cabin is unknown server-side.
          if (c === "intl_aa_first_cabin" || c === "intl_ua_polaris_cabin" ||
              c === "intl_premium_cabin" || c === "intl_first_cabin" || c === "intl_or_transcon") continue;
          if (c === "intl_oneworld" && alliance !== "oneworld") continue;
          if (c === "intl_aa_oneworld" && alliance !== "oneworld") continue;
          if (c === "intl_aa_or_ba" && flyingAirlineId !== "aa" && flyingAirlineId !== "ba_avios") continue;
          if (c === "intl_ua_or_star" && flyingAirlineId !== "ua" && alliance !== "star") continue;
          if (c === "same_day_ua" && flyingAirlineId !== "ua") continue;
          if (c === "same_day_dl" && flyingAirlineId !== "dl") continue;
          if (c === "same_day_ac_or_star" && alliance !== "star") continue;
          // Carrier flagship First lounges — require flying that specific carrier.
          if (c === "intl_ba" && flyingAirlineId !== "ba_avios") continue;
          if (c === "intl_ana" && flyingAirlineId !== "ana") continue;
          if (c === "intl_emirates" && flyingAirlineId !== "emirates_skywards") continue;
          if (c === "intl_af" && flyingAirlineId !== "flying_blue") continue;
          if (c === "intl_lh" && flyingAirlineId !== "lufthansa") continue;
          // intl_only and no-condition rules pass through (route already intl).
          grants.push({ source: "elite", id: progId, tier: acct.currentTier });
        }
      }

      // 3. Alliance lounges — only when flying an airline in the same alliance
      //    as the user's status. Top-tier status (oneworld Emerald, Star Gold,
      //    SkyTeam Elite Plus) opens First & Business lounges regardless of
      //    cabin; only oneworld Sapphire is business-only. Mirrors the in-app
      //    lounge screen so push and app agree.
      if (alliance && lounge.alliance && lounge.alliance !== "none") {
        const seen = new Set();
        for (const [progId, acct] of Object.entries(accts)) {
          if (!acct.currentTier) continue;
          const mapping = ELITE_ALLIANCE_MAP[progId];
          const allianceLevel = mapping?.tiers?.[acct.currentTier];
          if (!mapping || !allianceLevel) continue;
          if (mapping.alliance !== alliance) continue;
          if (lounge.alliance !== mapping.alliance) continue;
          // First-class lounges: oneworld Emerald is the one alliance status that
          // explicitly opens them on a same-day oneworld flight REGARDLESS of
          // cabin (the headline Emerald perk — JAL First at HND, Cathay First
          // at HKG, Qantas First at LAX, etc). Star Gold and SkyTeam Elite Plus
          // don't have that benefit — their alliance rules cap status access at
          // business lounges; First requires a First/HON cabin ticket — so we
          // still skip First for them.
          //
          // Cabin-only carrier flagship lounges (BA Concorde Room ba_concorde,
          // AA Chelsea chelsea_lounge, AA Flagship First Dining flagship-first)
          // are NOT accidentally let through by this exception: their network
          // names aren't in oneworld Emerald's networkTypes whitelist, so the
          // `r.networkTypes.includes(network)` check below filters them out.
          if (lounge.tier === "first") {
            const isOneworldEmerald = mapping.alliance === "oneworld" && allianceLevel === "Emerald";
            if (!isOneworldEmerald) continue;
          }
          const key = `${mapping.alliance}_${allianceLevel}`;
          if (seen.has(key)) continue;
          const allianceRules = ALLIANCE_LOUNGE_ACCESS[mapping.alliance]?.[allianceLevel];
          if (!allianceRules) continue;
          const matches = allianceRules.lounges.some(r => r.networkTypes.includes(network));
          if (!matches) continue;
          seen.add(key);
          grants.push({ source: "alliance", alliance: mapping.alliance, level: allianceLevel });
        }
      }
    }

    if (grants.length) out.push({ lounge, grants });
  }

  return out;
}

// Rank a lounge: a First-class lounge the user can enter is the headline
// experience, so it dominates; rating breaks ties within a tier.
function rankScore(l) {
  return (l.tier === "first" ? 100 : 0) + (l.rating || 0);
}

// Group lounges by the operating carrier so the top-N picks don't burn slots
// on multiple lounges from the same airline at the same airport (JAL First +
// JAL Sakura at HND, ANA Suite + ANA Lounge at HND, etc.). Heuristic: skip
// leading articles, take the first remaining word of the lounge name. Works
// because lounge names start with their operator: "JAL First Class Lounge",
// "Cathay Pacific The Pier...", "British Airways Galleries Lounge". Returns
// the lounge name itself as a fallback so we never collapse unrelated lounges.
export function carrierKeyOf(loungeName) {
  const words = String(loungeName || "").trim().split(/\s+/);
  const skip = new Set(["the", "a", "an"]);
  for (const w of words) {
    if (!skip.has(w.toLowerCase())) return w.toLowerCase();
  }
  return String(loungeName || "").toLowerCase();
}

// Trim the noise suffix so a name fits a notification line.
//   "Cathay Pacific The Pier First Class Lounge" → "Cathay Pacific The Pier First"
//   "Amex Centurion Lounge" → "Amex Centurion"
function shortName(n) {
  return String(n || "").replace(/ Class Lounge$/, "").replace(/ Lounge$/, "");
}

// The "where to go" hint shown in brackets. Prefer an actual gate from the
// lounge's location text; fall back to the terminal.
//   "Near Gate 65" → "Gate 65" · "Level 7 near Gate 1" → "Gate 1"
//   "Terminal 3" (no gate) → "T3" · terminal "D" → "Terminal D"
function shortGate(loc, terminal) {
  const m = String(loc || "").match(/gate\s+([A-Za-z]?\d+[A-Za-z]?)/i);
  if (m) return `Gate ${m[1].toUpperCase()}`;
  const t = String(terminal || "").trim();
  if (t) return (/^T\d/i.test(t) || t.length > 3) ? t : `Terminal ${t}`;
  const s = String(loc || "").trim();
  return s ? s.slice(0, 20) : "see app";
}

// Build the push body: the TOP 2 lounges only (notifications can't show more
// before truncating, which makes a long list useless), each with its gate in
// brackets, then a count of the rest pointing the user into the app.
// Returns { count, body, top:[{name,gate,full}] }.
export function loungeAccessSummary(args) {
  const accessible = computeLoungeAccess(args);
  if (!accessible.length) return { count: 0, body: "", top: [] };

  // Highest-ranked first, then dedupe by CARRIER so a user with multiple
  // lounges from the same operator at the same airport (JAL First + JAL Sakura
  // at HND, both grantable to oneworld Emerald) sees only the operator's best
  // option — and the second slot goes to a different airline instead. This
  // gave the right top-2 at HND: JAL First then Cathay, instead of JAL First
  // then JAL Sakura.
  const sorted = [...accessible].sort((a, b) => rankScore(b.lounge) - rankScore(a.lounge));
  const seen = new Set();
  const uniq = [];
  for (const item of sorted) {
    const key = carrierKeyOf(item.lounge.name);
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(item);
  }

  const top = uniq.slice(0, 2).map(({ lounge }) => ({
    name: shortName(lounge.name),
    gate: shortGate(lounge.location, lounge.terminal),
    full: lounge.name,
  }));
  let body = top.map(t => `${t.name} (${t.gate})`).join(", ");
  const extra = uniq.length - top.length;
  if (extra > 0) body += ` · +${extra} more in the app`;
  return { count: uniq.length, body, top };
}
