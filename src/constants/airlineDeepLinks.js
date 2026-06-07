// ─────────────────────────────────────────────────────────────────────────
// Airline "Manage My Booking" deep links.
//
// The strategy: Continuum doesn't run flight tracking anymore. Instead, when
// a user adds a flight, we surface a one-tap button that opens the airline's
// own app (or website) with the PNR + last name pre-filled. The airline then
// loads the booking into the user's "My Trips" view, and from that point on
// the AIRLINE'S native notifications handle gate changes / boarding / etc.
//
// Each entry returns the URL to launch. On iOS, a universal link will open
// the airline's app if installed; otherwise it falls through to the web.
//
// The lookup forms aren't standardised — every airline puts the PNR field
// somewhere different (recordLocator vs confirmationNumber vs PNR vs
// reservationCode). When we don't know the exact query-param shape, we link
// to the generic "Find your reservation" page and the user types the two
// fields once. Better imperfect coverage than a button that 404s.
// ─────────────────────────────────────────────────────────────────────────

// `pnr` = 6-character confirmation / record locator. `lastName` = surname only.
// Helper to URL-encode each fragment. Some airlines uppercase the PNR — we
// upper before passing in.
const enc = (s) => encodeURIComponent(String(s || "").trim());

// One entry per airline. `build({pnr, lastName})` returns the launch URL.
// `name` is shown on the button label ("Track in {name} app").
// `confidence` flags how sure we are the pre-fill works:
//   "high"     → verified pattern with both params honoured
//   "medium"   → pattern guessed from public booking-engine URLs; param names
//                might be slightly off (page still loads, user re-types if so)
//   "low"      → only the generic landing page; user types both fields
// We start optimistic and downgrade as the user reports any that don't work.
const AIRLINES = {
  // ── User's regulars ─────────────────────────────────────────────────────
  AA: {
    name: "American",
    confidence: "high",
    build: ({ pnr, lastName }) =>
      `https://www.aa.com/reservation/view/find-your-reservation?recordLocator=${enc(pnr).toUpperCase()}&lastName=${enc(lastName)}`,
  },
  UA: {
    name: "United",
    confidence: "medium",
    build: ({ pnr, lastName }) =>
      `https://www.united.com/en/us/manageres/lookup?confirmationNumber=${enc(pnr).toUpperCase()}&lastName=${enc(lastName)}`,
  },
  DL: {
    name: "Delta",
    confidence: "medium",
    build: ({ pnr, lastName }) =>
      `https://www.delta.com/mytrips/findReservation?confirmationNumber=${enc(pnr).toUpperCase()}&lastName=${enc(lastName)}`,
  },
  BA: {
    name: "British Airways",
    confidence: "medium",
    build: ({ pnr, lastName }) =>
      `https://www.britishairways.com/travel/managebooking/public/en_gb?bookingReference=${enc(pnr).toUpperCase()}&lastName=${enc(lastName)}`,
  },
  CX: {
    name: "Cathay Pacific",
    confidence: "medium",
    build: ({ pnr, lastName }) =>
      `https://www.cathaypacific.com/cx/en_HK/manage-booking.html?recordLocator=${enc(pnr).toUpperCase()}&lastName=${enc(lastName)}`,
  },
  JL: {
    name: "Japan Airlines",
    confidence: "low",
    build: () => `https://www.jal.co.jp/en/booking/manage/`,
  },
  NH: {
    name: "ANA",
    confidence: "low",
    build: () => `https://www.ana.co.jp/en/us/book-plan/manage-booking/`,
  },
  AC: {
    name: "Air Canada",
    confidence: "medium",
    build: ({ pnr, lastName }) =>
      `https://www.aircanada.com/ca/en/aco/home/book/manage-booking.html?bookingReference=${enc(pnr).toUpperCase()}&lastName=${enc(lastName)}`,
  },

  // ── Major US carriers ──────────────────────────────────────────────────
  WN: {
    name: "Southwest",
    confidence: "medium",
    build: ({ pnr, lastName }) =>
      `https://www.southwest.com/air/manage-reservation/?confirmationNumber=${enc(pnr).toUpperCase()}&passengerLastName=${enc(lastName)}`,
  },
  AS: {
    name: "Alaska",
    confidence: "medium",
    build: ({ pnr, lastName }) =>
      `https://www.alaskaair.com/booking/reservation-lookup?confirmationCode=${enc(pnr).toUpperCase()}&lastName=${enc(lastName)}`,
  },
  B6: {
    name: "JetBlue",
    confidence: "medium",
    build: ({ pnr, lastName }) =>
      `https://www.jetblue.com/manage-trips?recordLocator=${enc(pnr).toUpperCase()}&lastName=${enc(lastName)}`,
  },
  HA: {
    name: "Hawaiian",
    confidence: "low",
    build: () => `https://www.hawaiianairlines.com/manage`,
  },

  // ── European & Middle East ─────────────────────────────────────────────
  AF: {
    name: "Air France",
    confidence: "low",
    build: () => `https://www.airfrance.us/manage-booking`,
  },
  KL: {
    name: "KLM",
    confidence: "low",
    build: () => `https://www.klm.com/en/manage-booking`,
  },
  LH: {
    name: "Lufthansa",
    confidence: "low",
    build: () => `https://www.lufthansa.com/us/en/your-booking`,
  },
  LX: { name: "Swiss", confidence: "low", build: () => `https://www.swiss.com/us/en/manage-my-booking` },
  IB: { name: "Iberia", confidence: "low", build: () => `https://www.iberia.com/us/manage-booking/` },
  EI: { name: "Aer Lingus", confidence: "low", build: () => `https://www.aerlingus.com/manage-booking/` },
  EK: { name: "Emirates", confidence: "low", build: () => `https://www.emirates.com/us/english/manage-booking/` },
  QR: { name: "Qatar Airways", confidence: "low", build: () => `https://www.qatarairways.com/en-us/manage-booking.html` },
  EY: { name: "Etihad", confidence: "low", build: () => `https://www.etihad.com/en-us/manage` },
  TK: { name: "Turkish", confidence: "low", build: () => `https://www.turkishairlines.com/en-us/flights/manage-booking/` },
  VS: { name: "Virgin Atlantic", confidence: "low", build: () => `https://www.virginatlantic.com/manage-my-booking` },

  // ── Asia / Pacific ─────────────────────────────────────────────────────
  SQ: { name: "Singapore Airlines", confidence: "low", build: () => `https://www.singaporeair.com/en_UK/us/plan-travel/manage-booking/` },
  QF: { name: "Qantas", confidence: "low", build: () => `https://www.qantas.com/us/en/manage-booking.html` },
  NZ: { name: "Air New Zealand", confidence: "low", build: () => `https://www.airnewzealand.com/manage-booking` },
  KE: { name: "Korean Air", confidence: "low", build: () => `https://www.koreanair.com/us/en/booking/manage-reservations` },
  OZ: { name: "Asiana", confidence: "low", build: () => `https://flyasiana.com/C/US/EN/customer/mytrip/list` },
  TG: { name: "Thai Airways", confidence: "low", build: () => `https://www.thaiairways.com/en_US/manage/manage_booking.page` },
  MH: { name: "Malaysia Airlines", confidence: "low", build: () => `https://www.malaysiaairlines.com/us/en/manage-book.html` },
  PR: { name: "Philippine Airlines", confidence: "low", build: () => `https://www.philippineairlines.com/manage-booking` },
  GA: { name: "Garuda Indonesia", confidence: "low", build: () => `https://www.garuda-indonesia.com/us/en/garuda-indonesia-experience/manage-your-trip/` },
  CI: { name: "China Airlines", confidence: "low", build: () => `https://www.china-airlines.com/us/en/booking/manage-my-booking` },
  BR: { name: "EVA Air", confidence: "low", build: () => `https://www.evaair.com/en-us/manage-my-trip/` },
  CA: { name: "Air China", confidence: "low", build: () => `https://www.airchina.us/US/GB/manage-booking` },
};

// Resolve a flight number like "AA170" / "AA 170" / "BA7" / "JL 99" to its
// 2-letter carrier code. We strip leading whitespace, take the first letters
// (most IATA codes are 2 alphabetic), and special-case 3-character alphanumeric
// codes (e.g. 9W Jet Airways, J2 Azal). The regex grabs the prefix until the
// first digit.
export function carrierFromFlightNumber(fn) {
  if (!fn) return null;
  const m = String(fn).trim().toUpperCase().match(/^([A-Z0-9]{2,3})\s*\d/);
  return m ? m[1] : null;
}

// Returns { name, url, confidence } if we have a known airline; `null` if not.
// `lastName` is optional — if missing we still return the generic URL so the
// user can at least be taken to the airline's lookup page.
export function airlineDeepLink({ flightNumber, pnr, lastName }) {
  const code = carrierFromFlightNumber(flightNumber);
  if (!code) return null;
  const entry = AIRLINES[code];
  if (!entry) return null;
  // `build` is allowed to return a URL that ignores pnr/lastName (the "low"
  // confidence entries do this — they just send the user to the lookup page).
  const url = entry.build({ pnr: pnr || "", lastName: lastName || "" });
  return { code, name: entry.name, url, confidence: entry.confidence };
}

// Reverse map carrier code → display name. Used by UI surfaces that need to
// show the name without knowing the deep link.
export function airlineName(flightNumber) {
  const code = carrierFromFlightNumber(flightNumber);
  return (code && AIRLINES[code]?.name) || null;
}
