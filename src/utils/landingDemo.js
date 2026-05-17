// Landing-page demo overrides.
//
// Activated by visiting any route with `?demo=1` (or `?demo=landing`).
// While active, three data sources are swapped for generic content so
// the marketing screenshots in /public/Platform*.jpeg can be retaken
// without exposing the real user's name, trips, or companions:
//
//   - First-name greeting     (Dashboard, ExpenseSplit, etc.)
//   - Trips list              (loaded in App.jsx via loadTrips)
//   - Address-book contacts   (loaded in ExpenseSplit via loadContacts)
//
// The flag is read live from window.location.search on every call so a
// developer can flip it on/off mid-session by editing the URL.

export const isLandingDemo = () => {
  if (typeof window === "undefined") return false;
  const v = new URLSearchParams(window.location.search).get("demo");
  return v === "1" || v === "landing" || v === "true";
};

export const DEMO_FIRST_NAME = "Alex";

// ── Trip templates ──────────────────────────────────────────────────────
// Each template is a destination pair + a 3-flight, 2-hotel skeleton.
// Cities are intentionally varied (and non-Bermuda, non-Tokyo) so the
// generated screenshots don't echo the real owner's travel patterns.

const TRIP_TEMPLATES = [
  {
    tripName: "Iberian Coast Escape",
    location: "Lisbon, Porto",
    homeIATA: "JFK",
    legs: [
      { from: "JFK", to: "LIS", carrier: "TAP Air Portugal", code: "TP", flightNo: "TP202",  time: "21:55" },
      { from: "LIS", to: "OPO", carrier: "TAP Air Portugal", code: "TP", flightNo: "TP1944", time: "10:20" },
      { from: "OPO", to: "JFK", carrier: "TAP Air Portugal", code: "TP", flightNo: "TP201",  time: "13:40" },
    ],
    hotels: [
      { property: "Bairro Alto Hotel, Lisbon", nights: 4 },
      { property: "The Yeatman, Porto",        nights: 3 },
    ],
  },
  {
    tripName: "Central Europe Loop",
    location: "Vienna, Prague",
    homeIATA: "JFK",
    legs: [
      { from: "JFK", to: "VIE", carrier: "Austrian Airlines", code: "OS", flightNo: "OS90",  time: "17:25" },
      { from: "VIE", to: "PRG", carrier: "Austrian Airlines", code: "OS", flightNo: "OS705", time: "09:10" },
      { from: "PRG", to: "JFK", carrier: "Czech Airlines",    code: "OK", flightNo: "OK002", time: "12:55" },
    ],
    hotels: [
      { property: "Hotel Sacher, Vienna",       nights: 4 },
      { property: "Augustine, Prague",          nights: 3 },
    ],
  },
  {
    tripName: "Morocco Two-City",
    location: "Marrakech, Fes",
    homeIATA: "JFK",
    legs: [
      { from: "JFK", to: "CMN", carrier: "Royal Air Maroc", code: "AT", flightNo: "AT201", time: "20:45" },
      { from: "CMN", to: "RAK", carrier: "Royal Air Maroc", code: "AT", flightNo: "AT440", time: "11:30" },
      { from: "FEZ", to: "JFK", carrier: "Royal Air Maroc", code: "AT", flightNo: "AT200", time: "15:10" },
    ],
    hotels: [
      { property: "Royal Mansour, Marrakech",  nights: 4 },
      { property: "Riad Fes, Fes",             nights: 3 },
    ],
  },
  {
    tripName: "Southeast Asia Sweep",
    location: "Singapore, Penang",
    homeIATA: "JFK",
    legs: [
      { from: "JFK", to: "SIN", carrier: "Singapore Airlines", code: "SQ", flightNo: "SQ23",  time: "22:55" },
      { from: "SIN", to: "PEN", carrier: "Singapore Airlines", code: "SQ", flightNo: "SQ134", time: "08:40" },
      { from: "PEN", to: "JFK", carrier: "Singapore Airlines", code: "SQ", flightNo: "SQ24",  time: "10:25" },
    ],
    hotels: [
      { property: "Raffles, Singapore",            nights: 4 },
      { property: "Eastern & Oriental, Penang",    nights: 3 },
    ],
  },
  {
    tripName: "Patagonia Detour",
    location: "Buenos Aires, Mendoza",
    homeIATA: "JFK",
    legs: [
      { from: "JFK", to: "EZE", carrier: "LATAM Airlines",   code: "LA", flightNo: "LA533", time: "22:10" },
      { from: "EZE", to: "MDZ", carrier: "Aerolíneas Argentinas", code: "AR", flightNo: "AR1402", time: "07:50" },
      { from: "MDZ", to: "JFK", carrier: "LATAM Airlines",   code: "LA", flightNo: "LA532", time: "19:15" },
    ],
    hotels: [
      { property: "Palacio Duhau, Buenos Aires", nights: 4 },
      { property: "Cavas Wine Lodge, Mendoza",   nights: 3 },
    ],
  },
];

const pad2 = (n) => String(n).padStart(2, "0");
const toIso = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// Deterministic-per-page-load: pick once, reuse so different consumers
// (Dashboard, Trips, etc.) see the same trip during one screenshot session.
let _cachedTrip = null;

const buildTrip = () => {
  const tpl = TRIP_TEMPLATES[Math.floor(Math.random() * TRIP_TEMPLATES.length)];
  const startDays = 14 + Math.floor(Math.random() * 7); // 14–20 days out
  const start = addDays(new Date(), startDays);
  const totalNights = tpl.hotels.reduce((s, h) => s + h.nights, 0);

  // Build segments in chronological order:
  //   leg[0] (outbound) → hotel[0] → leg[1] (inter-city) → hotel[1] → leg[2] (return)
  const segments = [];
  let cursor = new Date(start);

  // Outbound flight
  segments.push({
    id: 1, type: "flight", program: "aa",
    flightNumber: tpl.legs[0].flightNo,
    route: `${tpl.legs[0].from} → ${tpl.legs[0].to}`,
    airline: tpl.legs[0].carrier,
    airlineCode: tpl.legs[0].code,
    date: toIso(cursor),
    departureTime: tpl.legs[0].time,
    class: "business", status: "confirmed",
  });

  // Hotel 1
  segments.push({
    id: 2, type: "hotel", program: "marriott",
    property: tpl.hotels[0].property,
    nights: tpl.hotels[0].nights,
    date: toIso(cursor),
    status: "confirmed",
  });
  cursor = addDays(cursor, tpl.hotels[0].nights);

  // Inter-city flight
  segments.push({
    id: 3, type: "flight", program: "aa",
    flightNumber: tpl.legs[1].flightNo,
    route: `${tpl.legs[1].from} → ${tpl.legs[1].to}`,
    airline: tpl.legs[1].carrier,
    airlineCode: tpl.legs[1].code,
    date: toIso(cursor),
    departureTime: tpl.legs[1].time,
    class: "business", status: "confirmed",
  });

  // Hotel 2
  segments.push({
    id: 4, type: "hotel", program: "marriott",
    property: tpl.hotels[1].property,
    nights: tpl.hotels[1].nights,
    date: toIso(cursor),
    status: "confirmed",
  });
  cursor = addDays(cursor, tpl.hotels[1].nights);

  // Return flight
  segments.push({
    id: 5, type: "flight", program: "aa",
    flightNumber: tpl.legs[2].flightNo,
    route: `${tpl.legs[2].from} → ${tpl.legs[2].to}`,
    airline: tpl.legs[2].carrier,
    airlineCode: tpl.legs[2].code,
    date: toIso(cursor),
    departureTime: tpl.legs[2].time,
    class: "business", status: "confirmed",
  });

  return {
    id: "demo-trip",
    type: "flight",
    program: "aa",
    route: `${tpl.legs[0].from} → ${tpl.legs[0].to}`,
    date: toIso(start),
    status: "confirmed",
    tripName: tpl.tripName,
    location: tpl.location,
    estimatedPoints: 0,
    estimatedNights: totalNights,
    segments,
  };
};

export const getDemoTrip = () => {
  if (!_cachedTrip) _cachedTrip = buildTrip();
  return _cachedTrip;
};

// Two generic companions for the ExpenseSplit address book. Shape matches
// rows from the `split_contacts` table so the downstream UI doesn't care.
export const getDemoContacts = (ownerId) => ([
  { id: "demo-contact-1", owner_id: ownerId, email: "sam.reyes@example.com",   display_name: "Sam Reyes" },
  { id: "demo-contact-2", owner_id: ownerId, email: "jordan.patel@example.com", display_name: "Jordan Patel" },
]);
