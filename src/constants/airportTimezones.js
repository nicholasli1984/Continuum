// Airport (IATA) → IANA timezone, plus a small city-name fallback. Used by the
// trip-detail hourly timeline to show two clocks (the city you departed from and
// the city you're in) and to convert non-flight event times between them.
//
// We only show a converted/secondary time when the zone is KNOWN here — unknown
// airports degrade gracefully (we show the single local time, never a guess).
// Flight cards never need this map: their departure/arrival times are already
// stored in each endpoint's own local time.

export const AIRPORT_TZ = {
  // ── United States ──
  JFK: "America/New_York", LGA: "America/New_York", EWR: "America/New_York",
  BOS: "America/New_York", DCA: "America/New_York", IAD: "America/New_York",
  PHL: "America/New_York", BWI: "America/New_York", PIT: "America/New_York",
  CLE: "America/New_York", DTW: "America/New_York", CMH: "America/New_York",
  IND: "America/New_York", BUF: "America/New_York", MIA: "America/New_York",
  FLL: "America/New_York", MCO: "America/New_York", TPA: "America/New_York",
  ATL: "America/New_York", CLT: "America/New_York", RDU: "America/New_York",
  JAX: "America/New_York", PBI: "America/New_York", RIC: "America/New_York",
  ORF: "America/New_York", RSW: "America/New_York",
  ORD: "America/Chicago", MDW: "America/Chicago", DFW: "America/Chicago",
  DAL: "America/Chicago", IAH: "America/Chicago", HOU: "America/Chicago",
  AUS: "America/Chicago", SAT: "America/Chicago", MSP: "America/Chicago",
  STL: "America/Chicago", MSY: "America/Chicago", BNA: "America/Chicago",
  MCI: "America/Chicago", OKC: "America/Chicago", OMA: "America/Chicago",
  MEM: "America/Chicago", MKE: "America/Chicago",
  DEN: "America/Denver", SLC: "America/Denver", ABQ: "America/Denver",
  BOI: "America/Denver",
  PHX: "America/Phoenix", TUS: "America/Phoenix",
  LAX: "America/Los_Angeles", SFO: "America/Los_Angeles", SAN: "America/Los_Angeles",
  SJC: "America/Los_Angeles", OAK: "America/Los_Angeles", SMF: "America/Los_Angeles",
  SNA: "America/Los_Angeles", BUR: "America/Los_Angeles", ONT: "America/Los_Angeles",
  SEA: "America/Los_Angeles", PDX: "America/Los_Angeles", LAS: "America/Los_Angeles",
  RNO: "America/Los_Angeles", PSP: "America/Los_Angeles",
  ANC: "America/Anchorage",
  HNL: "Pacific/Honolulu", OGG: "Pacific/Honolulu", KOA: "Pacific/Honolulu", LIH: "Pacific/Honolulu",
  GUM: "Pacific/Guam",

  // ── Canada ──
  YYZ: "America/Toronto", YOW: "America/Toronto", YUL: "America/Toronto",
  YHZ: "America/Halifax",
  YVR: "America/Vancouver",
  YYC: "America/Edmonton", YEG: "America/Edmonton",
  YWG: "America/Winnipeg",

  // ── Bermuda / Caribbean / Mexico / Latin America ──
  BDA: "Atlantic/Bermuda",
  NAS: "America/Nassau", MBJ: "America/Jamaica", KIN: "America/Jamaica",
  SJU: "America/Puerto_Rico", AUA: "America/Aruba", CUR: "America/Curacao",
  SXM: "America/Lower_Princes", BGI: "America/Barbados", PUJ: "America/Santo_Domingo",
  SDQ: "America/Santo_Domingo", POS: "America/Port_of_Spain",
  MEX: "America/Mexico_City", GDL: "America/Mexico_City", MTY: "America/Monterrey",
  CUN: "America/Cancun", SJD: "America/Mazatlan", PVR: "America/Mexico_City", TIJ: "America/Tijuana",
  GRU: "America/Sao_Paulo", GIG: "America/Sao_Paulo", BSB: "America/Sao_Paulo",
  EZE: "America/Argentina/Buenos_Aires", SCL: "America/Santiago",
  BOG: "America/Bogota", LIM: "America/Lima", PTY: "America/Panama",
  UIO: "America/Guayaquil", GYE: "America/Guayaquil", MVD: "America/Montevideo",
  CCS: "America/Caracas", SJO: "America/Costa_Rica",

  // ── United Kingdom / Ireland / Europe ──
  LHR: "Europe/London", LGW: "Europe/London", LCY: "Europe/London", STN: "Europe/London",
  MAN: "Europe/London", EDI: "Europe/London", BHX: "Europe/London", GLA: "Europe/London",
  DUB: "Europe/Dublin",
  CDG: "Europe/Paris", ORY: "Europe/Paris", NCE: "Europe/Paris", LYS: "Europe/Paris",
  MRS: "Europe/Paris", TLS: "Europe/Paris",
  AMS: "Europe/Amsterdam", BRU: "Europe/Brussels",
  FRA: "Europe/Berlin", MUC: "Europe/Berlin", BER: "Europe/Berlin", DUS: "Europe/Berlin",
  HAM: "Europe/Berlin", CGN: "Europe/Berlin", STR: "Europe/Berlin",
  ZRH: "Europe/Zurich", GVA: "Europe/Zurich",
  VIE: "Europe/Vienna",
  FCO: "Europe/Rome", MXP: "Europe/Rome", LIN: "Europe/Rome", VCE: "Europe/Rome",
  NAP: "Europe/Rome", BLQ: "Europe/Rome",
  MAD: "Europe/Madrid", BCN: "Europe/Madrid", AGP: "Europe/Madrid", PMI: "Europe/Madrid",
  VLC: "Europe/Madrid", SVQ: "Europe/Madrid",
  LIS: "Europe/Lisbon", OPO: "Europe/Lisbon",
  CPH: "Europe/Copenhagen", ARN: "Europe/Stockholm", GOT: "Europe/Stockholm",
  OSL: "Europe/Oslo", HEL: "Europe/Helsinki",
  WAW: "Europe/Warsaw", KRK: "Europe/Warsaw", GDN: "Europe/Warsaw",
  PRG: "Europe/Prague", BUD: "Europe/Budapest",
  ATH: "Europe/Athens", SKG: "Europe/Athens",
  IST: "Europe/Istanbul", SAW: "Europe/Istanbul",
  SVO: "Europe/Moscow", DME: "Europe/Moscow", LED: "Europe/Moscow",
  OTP: "Europe/Bucharest", SOF: "Europe/Sofia", BEG: "Europe/Belgrade",
  ZAG: "Europe/Zagreb", LJU: "Europe/Ljubljana", RIX: "Europe/Riga",
  TLL: "Europe/Tallinn", VNO: "Europe/Vilnius", KEF: "Atlantic/Reykjavik",
  MLA: "Europe/Malta",

  // ── Middle East / Africa ──
  DXB: "Asia/Dubai", AUH: "Asia/Dubai", SHJ: "Asia/Dubai",
  DOH: "Asia/Qatar", BAH: "Asia/Bahrain", KWI: "Asia/Kuwait",
  RUH: "Asia/Riyadh", JED: "Asia/Riyadh", DMM: "Asia/Riyadh", MED: "Asia/Riyadh",
  MCT: "Asia/Muscat", AMM: "Asia/Amman", BEY: "Asia/Beirut", TLV: "Asia/Jerusalem",
  CAI: "Africa/Cairo", CMN: "Africa/Casablanca", TUN: "Africa/Tunis", ALG: "Africa/Algiers",
  JNB: "Africa/Johannesburg", CPT: "Africa/Johannesburg", DUR: "Africa/Johannesburg",
  NBO: "Africa/Nairobi", DAR: "Africa/Dar_es_Salaam", ADD: "Africa/Addis_Ababa",
  LOS: "Africa/Lagos", ABV: "Africa/Lagos", ACC: "Africa/Accra", DKR: "Africa/Dakar",
  MRU: "Indian/Mauritius", SEZ: "Indian/Mahe",

  // ── Asia ──
  HND: "Asia/Tokyo", NRT: "Asia/Tokyo", KIX: "Asia/Tokyo", NGO: "Asia/Tokyo",
  FUK: "Asia/Tokyo", CTS: "Asia/Tokyo", OKA: "Asia/Tokyo",
  ICN: "Asia/Seoul", GMP: "Asia/Seoul", PUS: "Asia/Seoul",
  PVG: "Asia/Shanghai", SHA: "Asia/Shanghai", PEK: "Asia/Shanghai", PKX: "Asia/Shanghai",
  CAN: "Asia/Shanghai", SZX: "Asia/Shanghai", CTU: "Asia/Shanghai", CKG: "Asia/Shanghai",
  HGH: "Asia/Shanghai", XIY: "Asia/Shanghai", KMG: "Asia/Shanghai", DLC: "Asia/Shanghai",
  TAO: "Asia/Shanghai", NKG: "Asia/Shanghai",
  HKG: "Asia/Hong_Kong", MFM: "Asia/Macau",
  TPE: "Asia/Taipei", KHH: "Asia/Taipei",
  SIN: "Asia/Singapore",
  BKK: "Asia/Bangkok", DMK: "Asia/Bangkok", HKT: "Asia/Bangkok", CNX: "Asia/Bangkok",
  KUL: "Asia/Kuala_Lumpur", PEN: "Asia/Kuala_Lumpur", BKI: "Asia/Kuala_Lumpur",
  MNL: "Asia/Manila", CEB: "Asia/Manila",
  CGK: "Asia/Jakarta", SUB: "Asia/Jakarta",
  DPS: "Asia/Makassar", UPG: "Asia/Makassar", BPN: "Asia/Makassar",
  SGN: "Asia/Ho_Chi_Minh", HAN: "Asia/Ho_Chi_Minh", DAD: "Asia/Ho_Chi_Minh",
  PNH: "Asia/Phnom_Penh", REP: "Asia/Phnom_Penh", RGN: "Asia/Yangon", VTE: "Asia/Vientiane",
  DEL: "Asia/Kolkata", BOM: "Asia/Kolkata", BLR: "Asia/Kolkata", MAA: "Asia/Kolkata",
  HYD: "Asia/Kolkata", CCU: "Asia/Kolkata", COK: "Asia/Kolkata", AMD: "Asia/Kolkata",
  CMB: "Asia/Colombo", DAC: "Asia/Dhaka", KTM: "Asia/Kathmandu",
  KHI: "Asia/Karachi", LHE: "Asia/Karachi", ISB: "Asia/Karachi",
  ALA: "Asia/Almaty", NQZ: "Asia/Almaty", TAS: "Asia/Tashkent", MLE: "Indian/Maldives",

  // ── Oceania ──
  SYD: "Australia/Sydney", CBR: "Australia/Sydney", OOL: "Australia/Brisbane",
  MEL: "Australia/Melbourne", BNE: "Australia/Brisbane", PER: "Australia/Perth",
  ADL: "Australia/Adelaide", CNS: "Australia/Brisbane",
  AKL: "Pacific/Auckland", CHC: "Pacific/Auckland", WLG: "Pacific/Auckland", ZQN: "Pacific/Auckland",
  NAN: "Pacific/Fiji", PPT: "Pacific/Tahiti",
};

// City-name → IANA, a softer fallback for events that only carry a city string
// (hotels, dining, activities) when we can't resolve an airport code.
export const CITY_TZ = {
  "New York": "America/New_York", "Brooklyn": "America/New_York", "Manhattan": "America/New_York",
  "Boston": "America/New_York", "Washington": "America/New_York", "Miami": "America/New_York",
  "Orlando": "America/New_York", "Atlanta": "America/New_York", "Philadelphia": "America/New_York",
  "Chicago": "America/Chicago", "Dallas": "America/Chicago", "Houston": "America/Chicago",
  "Austin": "America/Chicago", "Denver": "America/Denver", "Phoenix": "America/Phoenix",
  "Los Angeles": "America/Los_Angeles", "San Francisco": "America/Los_Angeles",
  "San Diego": "America/Los_Angeles", "Seattle": "America/Los_Angeles",
  "Las Vegas": "America/Los_Angeles", "Portland": "America/Los_Angeles",
  "Honolulu": "Pacific/Honolulu",
  "Toronto": "America/Toronto", "Montreal": "America/Toronto", "Ottawa": "America/Toronto",
  "Vancouver": "America/Vancouver", "Calgary": "America/Edmonton",
  "Bermuda": "Atlantic/Bermuda", "Hamilton": "Atlantic/Bermuda",
  "Mexico City": "America/Mexico_City", "Cancun": "America/Cancun", "Cancún": "America/Cancun",
  "Nassau": "America/Nassau", "San Juan": "America/Puerto_Rico",
  "Sao Paulo": "America/Sao_Paulo", "São Paulo": "America/Sao_Paulo",
  "Rio de Janeiro": "America/Sao_Paulo", "Buenos Aires": "America/Argentina/Buenos_Aires",
  "Santiago": "America/Santiago", "Bogota": "America/Bogota", "Bogotá": "America/Bogota",
  "Lima": "America/Lima", "Panama City": "America/Panama",
  "London": "Europe/London", "Manchester": "Europe/London", "Edinburgh": "Europe/London",
  "Dublin": "Europe/Dublin", "Paris": "Europe/Paris", "Nice": "Europe/Paris",
  "Amsterdam": "Europe/Amsterdam", "Brussels": "Europe/Brussels",
  "Frankfurt": "Europe/Berlin", "Munich": "Europe/Berlin", "Berlin": "Europe/Berlin",
  "Zurich": "Europe/Zurich", "Geneva": "Europe/Zurich", "Vienna": "Europe/Vienna",
  "Rome": "Europe/Rome", "Milan": "Europe/Rome", "Venice": "Europe/Rome",
  "Madrid": "Europe/Madrid", "Barcelona": "Europe/Madrid", "Lisbon": "Europe/Lisbon",
  "Copenhagen": "Europe/Copenhagen", "Stockholm": "Europe/Stockholm", "Oslo": "Europe/Oslo",
  "Helsinki": "Europe/Helsinki", "Warsaw": "Europe/Warsaw", "Prague": "Europe/Prague",
  "Budapest": "Europe/Budapest", "Athens": "Europe/Athens", "Istanbul": "Europe/Istanbul",
  "Moscow": "Europe/Moscow", "Reykjavik": "Atlantic/Reykjavik",
  "Dubai": "Asia/Dubai", "Abu Dhabi": "Asia/Dubai", "Doha": "Asia/Qatar",
  "Riyadh": "Asia/Riyadh", "Jeddah": "Asia/Riyadh", "Tel Aviv": "Asia/Jerusalem",
  "Cairo": "Africa/Cairo", "Casablanca": "Africa/Casablanca",
  "Johannesburg": "Africa/Johannesburg", "Cape Town": "Africa/Johannesburg",
  "Nairobi": "Africa/Nairobi", "Lagos": "Africa/Lagos",
  "Tokyo": "Asia/Tokyo", "Osaka": "Asia/Tokyo", "Kyoto": "Asia/Tokyo",
  "Seoul": "Asia/Seoul", "Busan": "Asia/Seoul",
  "Shanghai": "Asia/Shanghai", "Beijing": "Asia/Shanghai", "Guangzhou": "Asia/Shanghai",
  "Hong Kong": "Asia/Hong_Kong", "Macau": "Asia/Macau",
  "Taipei": "Asia/Taipei", "Singapore": "Asia/Singapore",
  "Bangkok": "Asia/Bangkok", "Phuket": "Asia/Bangkok", "Kuala Lumpur": "Asia/Kuala_Lumpur",
  "Manila": "Asia/Manila", "Jakarta": "Asia/Jakarta", "Bali": "Asia/Makassar",
  "Denpasar": "Asia/Makassar", "Makassar": "Asia/Makassar",
  "Ho Chi Minh City": "Asia/Ho_Chi_Minh", "Hanoi": "Asia/Ho_Chi_Minh",
  "Delhi": "Asia/Kolkata", "Mumbai": "Asia/Kolkata", "Bangalore": "Asia/Kolkata",
  "Bengaluru": "Asia/Kolkata", "Colombo": "Asia/Colombo", "Kathmandu": "Asia/Kathmandu",
  "Sydney": "Australia/Sydney", "Melbourne": "Australia/Melbourne",
  "Brisbane": "Australia/Brisbane", "Perth": "Australia/Perth",
  "Auckland": "Pacific/Auckland", "Nadi": "Pacific/Fiji",
};

export const tzForAirport = (iata) => AIRPORT_TZ[String(iata || "").toUpperCase().trim()] || null;
export const tzForCity = (name) => {
  if (!name) return null;
  const key = String(name).split(",")[0].trim();
  return CITY_TZ[key] || null;
};

// Offset (minutes) of `tz` at a given UTC instant. Returns null if tz unknown.
export function tzOffsetMin(instant, tz) {
  if (!tz) return null;
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const p = {};
    for (const part of dtf.formatToParts(instant)) p[part.type] = part.value;
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return Math.round((asUTC - instant.getTime()) / 60000);
  } catch { return null; }
}

// Convert a wall time (dateStr "YYYY-MM-DD", timeStr "HH:MM") in `fromTz` to the
// equivalent wall time in `toTz`. Returns { time:"HH:MM", dayDelta:-1|0|1 } or null.
export function convertWall(dateStr, timeStr, fromTz, toTz) {
  if (!dateStr || !timeStr || !fromTz || !toTz || fromTz === toTz) return null;
  const m = String(timeStr).match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = +m[1], min = +m[2];
  const guess = Date.UTC(+dateStr.slice(0, 4), +dateStr.slice(5, 7) - 1, +dateStr.slice(8, 10), h, min);
  const offFrom = tzOffsetMin(new Date(guess), fromTz);
  if (offFrom == null) return null;
  const trueUTC = guess - offFrom * 60000;
  const offTo = tzOffsetMin(new Date(trueUTC), toTz);
  if (offTo == null) return null;
  const local = new Date(trueUTC + offTo * 60000);
  const hh = String(local.getUTCHours()).padStart(2, "0");
  const mm = String(local.getUTCMinutes()).padStart(2, "0");
  const origDay = Date.UTC(+dateStr.slice(0, 4), +dateStr.slice(5, 7) - 1, +dateStr.slice(8, 10));
  const newDay = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  return { time: `${hh}:${mm}`, dayDelta: Math.round((newDay - origDay) / 86400000) };
}

// A wall time (dateStr "YYYY-MM-DD", timeStr "HH:MM") in `tz` → the real UTC
// instant (Date). Null if inputs/zone are unusable.
export function wallToUTC(dateStr, timeStr, tz) {
  if (!dateStr || !timeStr || !tz) return null;
  const m = String(timeStr).match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const guess = Date.UTC(+dateStr.slice(0, 4), +dateStr.slice(5, 7) - 1, +dateStr.slice(8, 10), +m[1], +m[2]);
  const off = tzOffsetMin(new Date(guess), tz);
  if (off == null) return null;
  return new Date(guess - off * 60000);
}

// Format a UTC instant as a clock time in `tz`. "" if unknown.
export function fmtInTz(utcDate, tz, opts) {
  if (!utcDate || !tz) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", ...(opts || {}) }).format(utcDate);
  } catch { return ""; }
}

// Current "HH:MM" in a zone (24h). "" if unknown.
export function nowInTz(tz) {
  if (!tz) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
  } catch { return ""; }
}

// Short zone abbreviation (e.g. "EST", "JST", "GMT+8"). "" if unknown.
export function tzAbbr(tz, date = new Date()) {
  if (!tz) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short", hour: "2-digit" }).formatToParts(date);
    return parts.find(p => p.type === "timeZoneName")?.value || "";
  } catch { return ""; }
}
