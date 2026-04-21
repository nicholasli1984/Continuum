import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";
import { supabase } from "./supabase";

// Extracted data constants
import { AIRPORT_COORDS, AIRPORT_CITY, CITY_THEMES } from "./constants/airline-data";
import { CABIN_LABELS, AIRLINE_BOOKING_CLASS_MAP, BOOKING_CLASS_MAP_GENERIC, BOOKING_CLASS_RATES, PARTNER_CLASS_RATES, PARTNER_EARN_RATES, ELITE_BONUS_PCT, AIRLINE_CS, HOTEL_CS, OTA_CS, AIRCRAFT_TYPES, CC_SPENDING_CATS, CC_TRANSFER_PARTNERS, CC_BONUS_EXPANDED, LANDMARK_FALLBACK_PHOTOS } from "./constants/airline-data";
import { PROGRAM_DIRECTORY, LOYALTY_PROGRAMS, PROGRAM_LOGO_DOMAINS } from "./constants/programs";
import { LOUNGE_DATABASE, CARD_LOUNGE_ACCESS, ELITE_LOUNGE_ACCESS, ELITE_ALLIANCE_MAP, AIRLINE_ALLIANCE, ALLIANCE_LOUNGE_ACCESS, AMENITY_ICONS, AMENITY_LABELS } from "./constants/lounges";
import { ALLIANCE_MBR, ALLIANCE_LABELS, ALLIANCE_TIER_LABELS, ALLIANCE_TIER_COLORS, BENEFIT_ROWS, HOME_BENEFITS, RECIP_BENEFITS, SAMPLE_USER, CREDIT_CARD_OFFERS, EXPIRATION_RULES, REDEMPTION_VALUES } from "./constants/benefits";
import { renderOptimizer as renderOptimizerPage } from "./pages/Optimizer";
import { renderTrips as renderTripsPage } from "./pages/Trips";
import { renderDashboard as renderDashboardPage } from "./pages/Dashboard";
import { renderInsights as renderInsightsPage } from "./pages/Insights";
import { renderExpenseReports as renderExpenseReportsPage } from "./pages/ExpenseReports";
import { renderLounges as renderLoungesPage } from "./pages/Lounges";
import { renderPrograms as renderProgramsPage } from "./pages/Programs";
import { renderAlliances as renderAlliancesPage } from "./pages/Alliances";
import { renderReports as renderReportsPage } from "./pages/Reports";
import { renderNews as renderNewsPage } from "./pages/News";
import { renderPremium as renderPremiumPage } from "./pages/Premium";

// ============================================================
// LOGO COMPONENT — Geometric travel icon in Neuron brand style
// Rounded container, arrow/compass motif, orange gradient
// ============================================================
const AirplaneLogo = ({ size = 40, color = "#0EA5A0", className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="2" width="60" height="60" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="0.8" />
    <rect x="2" y="2" width="15" height="15" fill="#0EA5A0" />
    <path d="M38 20 L24 20 L24 44 L38 44" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="square" />
  </svg>
);

const LogoMark = ({ size = 40 }) => (
  <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <AirplaneLogo size={size} />
  </div>
);


// hle.io-inspired atmosphere — ultra clean dark, minimal structure
const TravelAtmosphere = () => (
  <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden", background: "#08090a" }}>
    <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.03)" }} />
  </div>
);
// Decorative speed line for cards
const FlightPath = ({ color = "#0EA5A0", style = {} }) => (
  <svg viewBox="0 0 200 40" style={{ position: "absolute", opacity: 0.1, ...style }} fill="none">
    <line x1="0" y1="20" x2="180" y2="20" stroke={color} strokeWidth="0.8" />
    <line x1="160" y1="12" x2="200" y2="20" stroke={color} strokeWidth="0.8" />
    <line x1="160" y1="28" x2="200" y2="20" stroke={color} strokeWidth="0.8" />
  </svg>
);

// Live clock component — yinger-style monospace time readout
const LiveClock = () => {
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  const h = time.getHours() % 12 || 12;
  const m = time.getMinutes();
  const ampm = time.getHours() >= 12 ? "pm" : "am";
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 2, fontFamily: "Space Mono, monospace" }}>
      <span style={{ fontSize: "clamp(1.2rem, 3vw, 2rem)", color: "#8a8f98", letterSpacing: -1, fontWeight: 400 }}>
        {pad(h)}:{pad(m)}
      </span>
      <span style={{ fontSize: "clamp(0.6rem, 1vw, 0.8rem)", color: "#62666d", marginLeft: 4 }}>{ampm}</span>
    </div>
  );
};

// World Map Paint-Reveal — KidSuper-inspired interactive canvas
// Uses uploaded painted world map image as the hidden layer
// Dark charcoal cover with medium paintbrush eraser
// Per-page hero banner with travel photography
// Hero banners removed — clean cosmic dashboard

// ============================================================
// DATA & CONSTANTS
// ============================================================

// Comprehensive program directory with login/status URLs
// ── Airport coordinates (IATA → [lng, lat]) ──────────────────

// ── Airport → City name mapping ──

// ── City gradient themes — warm/cool palettes per destination ──

// Haversine great-circle distance in miles
const haversineDistance = (c1, c2) => {
  if (!c1 || !c2) return 0;
  const R = 3958.8;
  const dLat = (c2[1] - c1[1]) * Math.PI / 180;
  const dLon = (c2[0] - c1[0]) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(c1[1]*Math.PI/180) * Math.cos(c2[1]*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// Parse "JFK → LAX" → ["JFK","LAX"]
const parseRoute = (route) => {
  if (!route) return [];
  return route.split(/→|->|-|\//).map(s => s.trim().toUpperCase()).filter(s => s.length === 3);
};

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const defaultSegment = () => ({
  _id: Math.random().toString(36).slice(2),
  type: "flight",
  program: "aa",
  creditProgram: "", // which loyalty program to credit elite status to
  route: "",
  date: "",
  class: "domestic",
  fareClass: "economy",
  bookingClass: "",
  ticketPrice: "",
  nights: 1,
  flightNumber: "",
  departureTime: "",
  arrivalTime: "",
  departureTerminal: "",
  arrivalTerminal: "",
  property: "",
  location: "",
  pickupLocation: "",
  dropoffLocation: "",
  dropoffDate: "",
  customProgramName: "",
});



// Per-airline booking class → cabin mapping (codes vary by carrier)
// Generic fallback map for airlines not listed above

const getBookingClassCabin = (programId, code) => {
  if (!code) return null;
  const map = AIRLINE_BOOKING_CLASS_MAP[programId] || BOOKING_CLASS_MAP_GENERIC;
  return map[code.toUpperCase()] || null;
};

// Per-program per-booking-class status earning rates (per $ spent)

// Great-circle distance helper using existing AIRPORT_COORDS + haversineDistance
const greatCircleMiles = (a, b) => {
  const c1 = AIRPORT_COORDS[a], c2 = AIRPORT_COORDS[b];
  if (!c1 || !c2) return 0;
  return Math.round(haversineDistance(c1, c2));
};

// ── Partner earning rates (% of flown distance → elite-qualifying credits) ──
// Based on published airline partner earning charts (2024-2025).
// AA own-metal uses fare-based (per $ spent); partners use distance-based.
// UA own-metal uses fare-based (PQP per $ spent); partners use distance-based.
// All other programs: distance × cabin % ÷ 100.
// EARNING METHODOLOGY KEY (verified 2024-2025):
// _type "fare_own" = own-metal fare-based ($×rate), partner flights distance-based (%×distance)
// _type "revenue"  = own-metal $1=1 unit (no cabin multiplier), partner distance-based
// _type "segment"  = fixed credits per segment by distance band (simplified as % for calculator)
// no _type         = all flights distance-based (% of distance flown)
//
// Own-metal rates: for "fare_own"/"revenue" = multiplier per $ spent; for distance = % of miles
// Partner rates: always % of distance flown (even for revenue-based own-metal programs)
// ── Per-booking-class earning rates (% of distance) for partner flights ──
// Used when we have the specific booking class letter; falls back to cabin-level rates otherwise.
// Format: { creditAirline: { operatingAirline: { bookingClassLetter: earnPct } } }


// ── Elite status bonus multipliers (applied on top of base earning) ──
// Maps program ID → tier name → bonus % (e.g., 120 = 120% bonus, so total = base × 2.2)
// For partner flights crediting to these programs, redeemable miles include the bonus,
// and all redeemable miles count as Loyalty Points / elite credits.
// Elite status bonus on STATUS CREDITS (not redeemable miles).
// Most programs do NOT give elite bonuses on status-qualifying credits.
// AA: LP earning on own-metal is tier-based (5/7/8/9/11 per $); on partners, the elite bonus
//     applies to redeemable miles which count as LP. This is the partner-flight bonus.
// Alaska: MVP +25%, Gold +50%, Gold 75K +50% on EQMs.
// All others: 0% bonus on status credits (bonuses apply to redeemable miles only).

// Calculate elite credits for a segment, optionally with elite status bonus
// bookingClass param is the single-letter class code (J, D, Y, etc.) for per-class lookup
const calcSegmentCredits = (creditAirlineId, operatingAirlineId, cabin, distanceMiles, totalFare, eliteBonusPct = 0, bookingClass = "") => {
  const rates = PARTNER_EARN_RATES[creditAirlineId];
  if (!rates) {
    const mults = { business_first: 150, premium_economy: 110, economy: 100, basic_economy: 0 };
    return Math.round(distanceMiles * (mults[cabin] || 100) / 100);
  }
  const isOwn = creditAirlineId === operatingAirlineId;
  const type = rates._type;

  // ── Revenue-based own-metal: $1 = rate units
  if (isOwn && (type === "fare_own" || type === "revenue")) {
    const partnerRates = rates._own || {};
    const rate = partnerRates[cabin] || 0;
    const base = Math.round((totalFare || 0) * rate);
    return Math.round(base * (1 + eliteBonusPct / 100));
  }

  // ── Check if this specific partner is revenue-based (e.g., BA → AA since Oct 2023)
  const partnerEntry = rates[operatingAirlineId] || rates._default || {};
  if (partnerEntry._fare) {
    const rate = partnerEntry[cabin] || 0;
    const base = Math.round((totalFare || 0) * rate);
    return Math.round(base * (1 + eliteBonusPct / 100));
  }

  // ── For partner flights: try per-booking-class rate first, then fall back to cabin rate
  let rate = 0;
  const bc = bookingClass.toUpperCase();
  if (!isOwn && bc) {
    const classRates = PARTNER_CLASS_RATES[creditAirlineId]?.[operatingAirlineId];
    if (classRates && classRates[bc] !== undefined) {
      rate = classRates[bc];
    }
  }
  // Fall back to cabin-level rate if no per-class rate found
  if (rate === 0 && !(bc && PARTNER_CLASS_RATES[creditAirlineId]?.[operatingAirlineId]?.[bc] === 0)) {
    const partnerRates = rates[isOwn ? "_own" : operatingAirlineId] || rates._default || {};
    rate = partnerRates[cabin] || 0;
  }

  // ── Segment-based (Cathay SP, Qantas SC, Flying Blue XP): rate is units per 100mi
  if (type === "segment") {
    const base = Math.round(distanceMiles * rate / 100);
    return Math.round(base * (1 + eliteBonusPct / 100));
  }

  // ── Distance-based: rate = % of distance flown
  const base = Math.round(distanceMiles * rate / 100);
  return Math.round(base * (1 + eliteBonusPct / 100));
};

// Build the same shape used by the rest of the app

// Clearbit logo domains keyed by program id

const ProgramLogo = ({ prog, size = 32 }) => {
  const [err, setErr] = useState(false);
  const domain = PROGRAM_LOGO_DOMAINS[prog?.id];
  if (domain && !err) {
    return (
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
        alt={prog.name}
        onError={() => setErr(true)}
        style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }}
      />
    );
  }
  return <span style={{ fontSize: size * 0.7, flexShrink: 0 }}>{prog?.logo || "🔗"}</span>;
};

// ============================================================
// AIRLINE & OTA CUSTOMER SERVICE DATA
// ============================================================
// Common aircraft types for display

// ============================================================
// CREDIT CARD TRANSFER PARTNERS & SPENDING CATEGORIES
// ============================================================
// Transfer partner mapping: card currency → airline/hotel programs (1:1 unless noted)
// Expanded bonus categories — values are either a number (same direct & portal)
// or { d: directRate, p: portalRate } when portal booking earns a higher multiplier.
// Rates per each issuer's official benefits page as of early 2025.

// ── Lounge Database ──



// Alliance status mapping — which elite tier gives which alliance level

// Airline → alliance membership (for flight context checking)

// Alliance level → lounge access rules



// Helper: resolve a bonus entry to a number given booking mode ("direct" or "portal")
const _ccRate = (entry, mode) => {
  if (typeof entry === "number") return entry;
  if (entry && typeof entry === "object") return mode === "portal" ? (entry.p || entry.d || 0) : (entry.d || 0);
  return 0;
};
const _ccHasPortalBonus = (entry) => typeof entry === "object" && entry.p > entry.d;

// Benefit row definitions

// b = {v: display, d: detail note, ok: true = positive highlight}
const _b = (v, d, ok) => ({ v, d, ok: !!ok });

// Home airline benefits: HOME_BENEFITS[programId][tierName][rowId]

// Reciprocal benefits received as a visiting elite at any partner airline


const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ============================================================


const CARD_BENEFITS_DATA = {
  amex_plat: {
    annualFee: 695,
    benefits: [
      { id: "airline_fee",    name: "$200 Airline Fee Credit",        value: 200, cat: "travel",    note: "Incidental fees on one selected U.S. airline" },
      { id: "hotel_credit",   name: "$200 Fine Hotels & Resorts",     value: 200, cat: "travel",    note: "Via Amex Travel on eligible bookings" },
      { id: "entertainment",  name: "$240 Digital Entertainment",     value: 240, cat: "lifestyle", note: "Peacock, Disney+, ESPN+, Hulu, NYT ($20/mo)" },
      { id: "walmart",        name: "$155 Walmart+ Credit",           value: 155, cat: "lifestyle", note: "Monthly $12.95 Walmart+ membership" },
      { id: "uber",           name: "$200 Uber Cash",                 value: 200, cat: "lifestyle", note: "$15/month + $35 in December" },
      { id: "equinox",        name: "$300 Equinox Credit",            value: 300, cat: "lifestyle", note: "Equinox gym or digital Equinox+ membership" },
      { id: "clear",          name: "$189 CLEAR Plus Credit",         value: 189, cat: "travel",    note: "Annual CLEAR airport biometric membership" },
      { id: "global_entry",   name: "Global Entry / TSA PreCheck",    value: 100, cat: "travel",    note: "One application fee credit every 4.5 years" },
      { id: "marriott_gold",  name: "Marriott Bonvoy Gold Status",    value: 150, cat: "status",    note: "Automatic Gold Elite without stays" },
      { id: "hilton_gold",    name: "Hilton Honors Gold Status",      value: 150, cat: "status",    note: "Automatic Gold status without nights" },
      { id: "centurion",      name: "Centurion Lounge Access",        value: 500, cat: "lounge",    note: "Unlimited visits (guest fees apply over 2)" },
      { id: "priority_pass",  name: "Priority Pass Select",           value: 450, cat: "lounge",    note: "1,300+ lounges worldwide (no guest fee limit)" },
    ],
  },
  chase_sapphire: {
    annualFee: 550,
    benefits: [
      { id: "travel_credit",  name: "$300 Annual Travel Credit",      value: 300, cat: "travel",    note: "Auto-applied to all travel category purchases" },
      { id: "priority_pass",  name: "Priority Pass Select",           value: 429, cat: "lounge",    note: "1,300+ lounges + $35/person restaurant credit" },
      { id: "global_entry",   name: "Global Entry / TSA PreCheck",    value: 100, cat: "travel",    note: "Application fee credit every 4 years" },
      { id: "dashpass",       name: "DashPass by DoorDash",           value: 96,  cat: "lifestyle", note: "$0 delivery fees + 5%+ off eligible orders" },
      { id: "lyft_pink",      name: "Lyft Pink All Access",           value: 99,  cat: "lifestyle", note: "15% off Lyft rides + complimentary upgrades" },
    ],
  },
  cap1_venturex: {
    annualFee: 395,
    benefits: [
      { id: "travel_credit",  name: "$300 Capital One Travel Credit", value: 300, cat: "travel",    note: "Bookings via Capital One Travel portal only" },
      { id: "anniversary",    name: "10,000 Anniversary Bonus Miles", value: 100, cat: "rewards",   note: "Awarded each year on card anniversary (~$100 in travel)" },
      { id: "priority_pass",  name: "Priority Pass (Unlimited Guests)",value: 450, cat: "lounge",   note: "Unlimited guest access included at no extra charge" },
      { id: "capital_lounge", name: "Capital One Lounge Access",      value: 200, cat: "lounge",    note: "DFW, DEN, IAD Capital One proprietary lounges" },
      { id: "global_entry",   name: "Global Entry / TSA PreCheck",    value: 100, cat: "travel",    note: "Application fee credit every 4 years" },
    ],
  },
  amex_gold: {
    annualFee: 325,
    benefits: [
      { id: "dining",         name: "$120 Dining Credit",             value: 120, cat: "lifestyle", note: "$10/mo at Grubhub, Cheesecake Factory, Goldbelly, Wine.com" },
      { id: "uber",           name: "$120 Uber Cash",                 value: 120, cat: "lifestyle", note: "$10/month in Uber Cash for rides and Uber Eats" },
      { id: "resy",           name: "$100 Resy Credit",               value: 100, cat: "lifestyle", note: "$50 semi-annually on dining via Resy" },
      { id: "dunkin",         name: "$84 Dunkin' Credit",             value: 84,  cat: "lifestyle", note: "$7/month at participating U.S. Dunkin' locations" },
    ],
  },
  bilt: {
    annualFee: 0,
    benefits: [
      { id: "rent_points",    name: "Points on Rent (no transaction fee)", value: 120, cat: "rewards", note: "Earn 1x on rent up to $50k/year — unique to Bilt" },
      { id: "transfer",       name: "Transfer to 14+ Travel Partners",     value: 200, cat: "rewards", note: "Hyatt, AA, United, Alaska, Air Canada at 1:1" },
      { id: "rent_day",       name: "Double Points on Rent Day (1st)",     value: 60,  cat: "rewards", note: "2x on all categories (except rent) on the 1st of every month" },
    ],
  },
};

// ============================================================
// UTILITY COMPONENTS
// ============================================================
const ProgressRing = ({ progress, size = 80, stroke = 6, color = "#0EA5A0", label, sublabel }) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(14,165,160,0.1)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.2, fontWeight: 700, color: "#f7f8f8" }}>{label}</span>
        {sublabel && <span style={{ fontSize: size * 0.12, color: "#8a8f98", marginTop: 1 }}>{sublabel}</span>}
      </div>
    </div>
  );
};


const IconBtn = ({ icon, label, active, onClick, badge }) => (
  <button onClick={onClick} title={label} style={{
    position: "relative", width: 44, height: 44, borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
    background: active ? "rgba(14,165,160,0.15)" : "transparent", color: active ? "#0EA5A0" : "rgba(0,0,0,0.35)", transition: "all 0.2s",
  }}>
    {icon}
    {badge && <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />}
  </button>
);

// ── PDF-to-images renderer using PDF.js CDN ──
const renderPdfToImages = async (pdfDataUrl) => {
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve();
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const pdf = await window.pdfjsLib.getDocument(pdfDataUrl).promise;
  const images = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    images.push(canvas.toDataURL("image/png"));
  }
  return images;
};

// ── Expense localStorage helpers (module-level, no closure issues) ──
const EXPENSES_STORAGE_KEY = (uid) => `continuum_expenses_${uid}`;
const saveExpensesToStorage = (uid, exps) => {
  try {
    localStorage.setItem(EXPENSES_STORAGE_KEY(uid), JSON.stringify(exps));
  } catch (e) {
    // If storage full (large receipt images), retry stripping image binary data
    try {
      const slim = exps.map(e => e.receiptImage?.data
        ? { ...e, receiptImage: { name: e.receiptImage.name, type: e.receiptImage.type, size: e.receiptImage.size } }
        : e);
      localStorage.setItem(EXPENSES_STORAGE_KEY(uid), JSON.stringify(slim));
    } catch (_) {}
  }
};
const loadExpensesFromStorage = (uid) => {
  try {
    const raw = localStorage.getItem(EXPENSES_STORAGE_KEY(uid));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

// ============================================================
// GOOGLE PLACES AUTOCOMPLETE COMPONENT
// ============================================================
let googleMapsLoadPromise = null;
const loadGoogleMaps = () => {
  if (window.google?.maps?.places) return Promise.resolve();
  if (googleMapsLoadPromise) return googleMapsLoadPromise;
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject("No API key");
  googleMapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return googleMapsLoadPromise;
};

const PlacesAutocomplete = ({ value, onChange, onPlaceSelect, placeholder, style, placesType }) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const skipNextChange = useRef(false);

  // Sync external value → DOM input (only when not actively using autocomplete)
  useEffect(() => {
    if (inputRef.current && inputRef.current !== document.activeElement) {
      inputRef.current.value = value || "";
    }
  }, [value]);

  // Set initial value on mount
  useEffect(() => {
    if (inputRef.current) inputRef.current.value = value || "";
  }, []);

  // Load Google Maps and attach autocomplete
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then(() => {
      if (cancelled || !inputRef.current || autocompleteRef.current) return;
      if (!window.google?.maps?.places) return;
      const options = { fields: ["formatted_address", "name", "geometry"] };
      if (placesType === "establishment") options.types = ["establishment"];
      const ac = new window.google.maps.places.Autocomplete(inputRef.current, options);
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (!place) return;
        const val = placesType === "establishment"
          ? (place.name || place.formatted_address || "")
          : (place.formatted_address || place.name || "");
        if (val) {
          skipNextChange.current = true;
          if (inputRef.current) inputRef.current.value = val;
          onChange(val);
        }
        // Pass full place data back for auto-filling related fields
        if (onPlaceSelect) onPlaceSelect({ name: place.name || "", address: place.formatted_address || "" });
      });
      autocompleteRef.current = ac;
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={value || ""}
      onChange={e => {
        if (skipNextChange.current) { skipNextChange.current = false; return; }
        onChange(e.target.value);
      }}
      placeholder={placeholder || ""}
      style={style}
      autoComplete="off"
    />
  );
};

// ============================================================
// ── Trip City Background — gradient + typographic city name ──
const TripCityBackground = ({ theme, cityName, darkMode }) => {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, -80]);
  const textY = useTransform(scrollY, [0, 400], [0, -60]);
  const textOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const textScale = useTransform(scrollY, [0, 400], [1, 1.15]);
  if (!theme) return null;
  const { g1, g2, g3 } = theme;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "100vh", zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* Mesh gradient background */}
      <motion.div style={{
        position: "absolute", inset: "-20%",
        background: darkMode
          ? `radial-gradient(ellipse 80% 60% at 20% 10%, ${g3}25 0%, transparent 60%),
             radial-gradient(ellipse 60% 80% at 80% 20%, ${g3}18 0%, transparent 50%),
             radial-gradient(ellipse 90% 50% at 50% 80%, ${g2} 0%, transparent 70%),
             linear-gradient(180deg, ${g1} 0%, ${g2} 50%, #0a0a0a 100%)`
          : `radial-gradient(ellipse 80% 60% at 20% 10%, ${g3}20 0%, transparent 60%),
             radial-gradient(ellipse 60% 80% at 80% 20%, ${g3}15 0%, transparent 50%),
             linear-gradient(180deg, #f5f5f0 0%, #eae8e3 50%, #f5f5f0 100%)`,
        y: bgY,
      }} />
      {/* Subtle noise texture overlay */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: darkMode ? 0.03 : 0.02,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "128px 128px",
      }} />
      {/* Large city name watermark */}
      {cityName && (
        <motion.div style={{
          position: "absolute", top: "8vh", left: 0, right: 0,
          textAlign: "center", y: textY, opacity: textOpacity, scale: textScale,
        }}>
          <div style={{
            fontSize: "clamp(48px, 10vw, 120px)", fontWeight: 800, lineHeight: 0.9,
            fontFamily: "'Instrument Sans', sans-serif", letterSpacing: "-0.04em",
            color: darkMode ? `${g3}12` : `${g3}10`,
            textTransform: "uppercase", userSelect: "none",
          }}>{cityName}</div>
        </motion.div>
      )}
      {/* Bottom fade to content bg */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "60vh",
        background: darkMode
          ? "linear-gradient(180deg, transparent 0%, rgba(10,10,10,0.6) 40%, #0a0a0a 100%)"
          : "linear-gradient(180deg, transparent 0%, rgba(245,245,240,0.6) 40%, #f5f5f0 100%)",
      }} />
    </div>
  );
};

// MAIN APP
// ============================================================
export default function EliteStatusTracker() {
  const [darkMode, setDarkMode] = useState(false);
  // Check if there's a stored Supabase session to avoid login flash
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      // Supabase v2 stores session under this key pattern
      const projectRef = import.meta.env.VITE_SUPABASE_URL?.split("//")[1]?.split(".")[0] || "";
      const keys = [`sb-${projectRef}-auth-token`, `sb-${projectRef}-auth-token-code-verifier`];
      for (const key of keys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.access_token || parsed?.refresh_token) return true;
        }
      }
      // Also check all localStorage keys for any supabase session
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("sb-") && key?.includes("auth")) {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed?.access_token || parsed?.refresh_token) return true;
            } catch {}
          }
        }
      }
      return false;
    } catch { return false; }
  });
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredInstallEvent, setDeferredInstallEvent] = useState(null);
  const [publicPage, setPublicPage] = useState("login");
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  // Redirect expenses view to trips (expenses is rendered within trips)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [newTrip, setNewTrip] = useState({ tripName: "", status: "planned", segments: [defaultSegment()] });
  // New simplified trip creation
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [createTripForm, setCreateTripForm] = useState({ name: "", destination: "", startDate: "", endDate: "", status: "planned" });
  const [showAddSegment, setShowAddSegment] = useState(null); // trip ID to add segment to
  const [addSegmentType, setAddSegmentType] = useState(null); // which segment type form is open
  const [segmentForm, setSegmentForm] = useState({});
  const [flightLegs, setFlightLegs] = useState([{ id: 1, flightNumber: "", date: "", arrivalDate: "", departureTime: "", arrivalTime: "", departureAirport: "", arrivalAirport: "", departureTerminal: "", arrivalTerminal: "", airline: "", aircraft: "", lookupMsg: "" }]);
  const [flightRouteOptions, setFlightRouteOptions] = useState({}); // { legIdx: [{ dep, arr, depTime, arrTime, aircraft, raw }] }
  const [flightType, setFlightType] = useState("roundtrip"); // "oneway", "roundtrip", "multicity"
  const [editingSegIdx, setEditingSegIdx] = useState(null); // index of segment being edited within a trip
  const [tempUnit, setTempUnit] = useState(() => localStorage.getItem("continuum_temp_unit") || "F");
  const [weatherCache, setWeatherCache] = useState({}); // { "cityKey": { high, low, code, date } }
  const [flightStatusCache, setFlightStatusCache] = useState({}); // { "BA158_2026-05-31": { status, departureDelay, ... } }

  // ── Packing list state ──
  // ── Visa check state ──
  const [visaCache, setVisaCache] = useState(() => {
    try { return JSON.parse(localStorage.getItem("continuum_visa_cache") || "{}"); } catch { return {}; }
  });
  const [visaLoading, setVisaLoading] = useState({});
  const checkVisa = async (passportCode, destCountry, destCity) => {
    const key = `${passportCode}_${destCountry}`;
    if (visaCache[key]) return;
    setVisaLoading(prev => ({ ...prev, [key]: true }));
    try {
      const resp = await fetch("/api/visa-check", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passportCountry: passportCode, destinationCountry: destCountry, destinationCity: destCity }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (!data.error) {
          setVisaCache(prev => {
            const next = { ...prev, [key]: data };
            try { localStorage.setItem("continuum_visa_cache", JSON.stringify(next)); } catch {}
            return next;
          });
        }
      }
    } catch {}
    setVisaLoading(prev => ({ ...prev, [key]: false }));
  };

  const [packingLists, setPackingLists] = useState(() => {
    try { return JSON.parse(localStorage.getItem("continuum_packing_lists") || "{}"); } catch { return {}; }
  });
  const [packExpanded, setPackExpanded] = useState(null); // which packing category is open
  const [customPackItems, setCustomPackItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("continuum_custom_pack_items") || "{}"); } catch { return {}; }
  });
  const savePackingLists = (next) => {
    setPackingLists(next);
    try { localStorage.setItem("continuum_packing_lists", JSON.stringify(next)); } catch {}
  };
  const togglePackItem = (tripId, itemId) => {
    savePackingLists({ ...packingLists, [tripId]: { ...(packingLists[tripId] || {}), [itemId]: !packingLists[tripId]?.[itemId] } });
  };
  const PACKING_TEMPLATES = {
    documents: {
      label: "Documents",
      icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z",
      items: [
        { id: "passport", label: "Passport", always: true },
        { id: "visa", label: "Visa / Entry permit", intl: true },
        { id: "boarding_pass", label: "Boarding passes", flight: true },
        { id: "hotel_conf", label: "Hotel confirmations", hotel: true },
        { id: "travel_insurance", label: "Travel insurance docs", intl: true },
        { id: "global_entry", label: "Global Entry / NEXUS card" },
        { id: "drivers_license", label: "Driver's license" },
        { id: "credit_cards", label: "Credit cards + backup" },
        { id: "cash_currency", label: "Local currency / cash", intl: true },
        { id: "covid_docs", label: "Health / vaccination records", intl: true },
        { id: "itinerary_print", label: "Printed itinerary backup" },
      ],
    },
    electronics: {
      label: "Electronics",
      icon: "M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z",
      items: [
        { id: "phone_charger", label: "Phone + charger", always: true },
        { id: "power_adapter", label: "Power adapter / converter", intl: true },
        { id: "laptop", label: "Laptop + charger", business: true },
        { id: "headphones", label: "Headphones / earbuds", always: true },
        { id: "power_bank", label: "Portable power bank" },
        { id: "camera", label: "Camera + SD cards" },
        { id: "kindle", label: "E-reader / Kindle" },
      ],
    },
    clothing: {
      label: "Clothing",
      icon: "M20.38 3.46L16 2 12 5 8 2 3.62 3.46a1 1 0 00-.76.95V22h18V4.41a1 1 0 00-.48-.95z",
      items: [
        { id: "underwear", label: "Underwear", always: true, perDay: true },
        { id: "socks", label: "Socks", always: true, perDay: true },
        { id: "tshirts", label: "T-shirts / tops", always: true, perDay: true },
        { id: "pants", label: "Pants / shorts", always: true },
        { id: "jacket", label: "Jacket / coat", cold: true },
        { id: "rain_jacket", label: "Rain jacket / umbrella", rain: true },
        { id: "sleepwear", label: "Sleepwear", always: true },
        { id: "swimwear", label: "Swimwear", beach: true },
        { id: "formal", label: "Formal wear / suit", business: true },
        { id: "dress_shoes", label: "Dress shoes", business: true },
        { id: "walking_shoes", label: "Walking shoes / sneakers", always: true },
        { id: "sandals", label: "Sandals / flip-flops", beach: true },
        { id: "hat_sunglasses", label: "Hat + sunglasses", warm: true },
        { id: "scarf_gloves", label: "Scarf + gloves", cold: true },
      ],
    },
    toiletries: {
      label: "Toiletries",
      icon: "M12 2v20M2 12h20",
      items: [
        { id: "toothbrush", label: "Toothbrush + toothpaste", always: true },
        { id: "deodorant", label: "Deodorant", always: true },
        { id: "shampoo", label: "Shampoo + conditioner" },
        { id: "sunscreen", label: "Sunscreen", warm: true },
        { id: "medications", label: "Medications / prescriptions" },
        { id: "first_aid", label: "First aid basics" },
        { id: "skincare", label: "Skincare / moisturizer" },
        { id: "razor", label: "Razor + shaving kit" },
        { id: "contacts", label: "Contact lenses + solution" },
      ],
    },
    misc: {
      label: "Miscellaneous",
      icon: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
      items: [
        { id: "luggage_lock", label: "Luggage lock + tags", always: true },
        { id: "travel_pillow", label: "Travel pillow + eye mask", flight: true },
        { id: "water_bottle", label: "Reusable water bottle" },
        { id: "snacks", label: "Snacks for travel" },
        { id: "laundry_bag", label: "Laundry bag" },
        { id: "packing_cubes", label: "Packing cubes" },
        { id: "guidebook", label: "Guidebook / phrasebook", intl: true },
        { id: "gifts", label: "Gifts / souvenirs space" },
      ],
    },
  };
  const getPackingItems = (trip) => {
    const segs = (trip.segments || []).filter(s => !s._isMeta);
    const hasFlight = segs.some(s => s.type === "flight");
    const hasHotel = segs.some(s => s.type === "hotel" || s.type === "accommodation");
    const isBusiness = (trip.tripName || "").toLowerCase().includes("business");
    const locations = (trip.location || "").toLowerCase();
    const isIntl = segs.some(s => s.type === "flight" && s.fareClass && s.fareClass !== "domestic") || !/usa|united states|domestic/i.test(locations);
    // Estimate weather from destination
    const beachKeywords = /bermuda|hawaii|cancun|bahamas|caribbean|maldives|bali|phuket|fiji|tahiti|beach/i;
    const coldKeywords = /iceland|norway|finland|sweden|alaska|hokkaido|switzerland|aspen|whistler|ski/i;
    const isBeach = beachKeywords.test(locations) || beachKeywords.test(trip.tripName || "");
    const isCold = coldKeywords.test(locations) || coldKeywords.test(trip.tripName || "");
    const isWarm = isBeach || /dubai|singapore|bangkok|miami|mexico|brazil|india|thailand|vietnam/i.test(locations);
    const tripDays = (() => {
      const dates = segs.map(s => s.date).filter(Boolean).sort();
      if (dates.length < 2) return 5;
      return Math.max(1, Math.ceil((new Date(dates[dates.length - 1]) - new Date(dates[0])) / 86400000)) + 1;
    })();

    const result = {};
    Object.entries(PACKING_TEMPLATES).forEach(([catKey, cat]) => {
      const filtered = cat.items.filter(item => {
        if (item.intl && !isIntl) return false;
        if (item.flight && !hasFlight) return false;
        if (item.hotel && !hasHotel) return false;
        if (item.business && !isBusiness) return false;
        if (item.beach && !isBeach) return false;
        if (item.cold && !isCold) return false;
        if (item.warm && !isWarm) return false;
        if (item.rain && isCold) return true;
        if (item.rain && !isWarm) return true;
        return item.always || !item.intl;
      });
      if (filtered.length > 0) {
        result[catKey] = {
          label: cat.label,
          icon: cat.icon,
          items: filtered.map(item => ({
            ...item,
            label: item.perDay ? `${item.label} (${tripDays} days)` : item.label,
          })),
        };
      }
    });
    return result;
  };
  const flightStatusFetchedRef = useRef(new Set());
  const pushSubRef = useRef(null); // current push subscription
  const prevFlightStatusRef = useRef({}); // previous status for change detection
  const weatherLoading = useRef({}); // track in-flight fetches without re-render
  const [hotelSectionOpen, setHotelSectionOpen] = useState(false);
  const [expandedItinId, setExpandedItinId] = useState(null); // expanded booking inbox item
  const [viewExpenseId, setViewExpenseId] = useState(null); // expense detail view modal
  const [cropExpenseId, setCropExpenseId] = useState(null); // expense id being cropped
  const [cropRect, setCropRect] = useState(null); // {left, top, width, height} for display
  const cropDragRef = useRef(false);
  const cropStartRef = useRef(null);
  const cropEndRef = useRef(null);
  const cropImgRef = useRef(null);
  const cropContainerRef = useRef(null);
  const cropScrollVel = useRef({ x: 0, y: 0 });
  const cropScrollRaf = useRef(null);
  const cropLastClient = useRef({ x: 0, y: 0 });
  const [sharedTrips, setSharedTrips] = useState([]); // trips shared with me
  const [confirmModal, setConfirmModal] = useState(null); // { message, onConfirm }
  const showConfirm = (message, onConfirm) => {
    // Use custom in-app modal (reliable across PWA/mobile/desktop)
    setConfirmModal({ message, onConfirm });
  };
  const [showShareModal, setShowShareModal] = useState(null); // trip ID to share
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("read"); // "read" | "edit"
  const [shareStatus, setShareStatus] = useState(""); // "sent" | "error" | "already" | ""
  const [dashSubTab, setDashSubTab] = useState("overview"); // overview | timeline | reports | activity
  const [landmarkPhotos, setLandmarkPhotos] = useState({}); // cache: "Landmark, City" -> photoUrl
  const landmarkFetchedRef = useRef(new Set()); // track which landmarks we've already tried to fetch

  // ── Receipt QR + Snap Receipt state ──
  const [showReceiptQR, setShowReceiptQR] = useState(false);
  const [snapReceiptProcessing, setSnapReceiptProcessing] = useState(false);
  const snapReceiptInputRef = useRef(null);

  const handleSnapReceipt = async (file) => {
    if (!file || !userForwardingAddress) return;
    if (file.size > 5 * 1024 * 1024) { alert("Photo must be under 5MB"); return; }
    setSnapReceiptProcessing(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const resp = await fetch(`/api/receipt?t=${userForwardingAddress}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ocr", imageData: dataUrl, mediaType: file.type || "image/jpeg" }),
      });
      const result = await resp.json();
      if (result.parsed) {
        const p = result.parsed;
        const receiptImage = { name: file.name, size: file.size, type: file.type, data: dataUrl };
        const noteLines = [];
        if (p.items?.length > 0) { noteLines.push("Items:"); p.items.forEach(i => noteLines.push(`  ${i.desc} — ${(p.currency || "USD")} ${Number(i.amount).toFixed(2)}`)); }
        if (p.subtotal) noteLines.push(`Subtotal: ${Number(p.subtotal).toFixed(2)}`);
        if (p.tax) noteLines.push(`Tax: ${Number(p.tax).toFixed(2)}`);
        if (p.tip) noteLines.push(`Tip: ${Number(p.tip).toFixed(2)}`);
        if (p.paymentMethod) noteLines.push(`Payment: ${p.paymentMethod}`);
        noteLines.push("Auto-read via Snap Receipt");
        setNewExpense({
          ...BLANK_EXPENSE,
          category: "biz_meals",
          description: p.restaurantName || "Receipt",
          amount: String(p.total || ""),
          currency: (p.currency || "USD").toUpperCase(),
          date: p.date || new Date().toISOString().slice(0, 10),
          receipt: true,
          receiptImage,
          notes: noteLines.join("\n"),
        });
        setShowAddExpense("_inbox");
        setEditExpenseId(null);
      } else {
        // OCR failed — open manual form with photo attached
        setNewExpense({
          ...BLANK_EXPENSE,
          category: "biz_meals",
          receipt: true,
          receiptImage: { name: file.name, size: file.size, type: file.type, data: dataUrl },
          date: new Date().toISOString().slice(0, 10),
        });
        setShowAddExpense("_inbox");
        setEditExpenseId(null);
      }
    } catch (err) {
      console.error("Snap receipt error:", err);
    }
    setSnapReceiptProcessing(false);
    if (snapReceiptInputRef.current) snapReceiptInputRef.current.value = "";
  };
  const [receiptQRDataUrl, setReceiptQRDataUrl] = useState("");

  // ── Programs tab state ──
  const [progAddType, setProgAddType] = useState("airline");
  const [progAddId, setProgAddId] = useState("");
  const [progAddTier, setProgAddTier] = useState("");

  // ── Lounge tab state ──
  const [loungeSearchCode, setLoungeSearchCode] = useState("");
  const [loungeDropdownOpen, setLoungeDropdownOpen] = useState(false);
  const [loungeAirport, setLoungeAirport] = useState(null);
  const [loungeSubTab, setLoungeSubTab] = useState("directory");
  const [loungePhotos, setLoungePhotos] = useState({});
  const [loungeExpandedId, setLoungeExpandedId] = useState(null);
  const [loungeVisits, setLoungeVisits] = useState(() => { try { return JSON.parse(localStorage.getItem("continuum_lounge_visits") || "[]"); } catch { return []; } });
  const [loungeAccessAirline, setLoungeAccessAirline] = useState(""); // kept for backward compat
  const [loungeAccessTier, setLoungeAccessTier] = useState(""); // kept for backward compat
  const [loungeFlightAirline, setLoungeFlightAirline] = useState("");
  const [loungeFlightClass, setLoungeFlightClass] = useState("economy");
  const [loungeAccessRoute, setLoungeAccessRoute] = useState("domestic");
  const loungePhotoFetched = useRef(new Set());
  const landmarkPhotosFetchedOnce = useRef(false);

  // Fetch a Google Places photo for a landmark
  const fetchLandmarkPhoto = useCallback((landmarkName, city) => {
    const key = `${landmarkName}, ${city}`;
    if (landmarkFetchedRef.current.has(key)) return;
    landmarkFetchedRef.current.add(key);
    loadGoogleMaps().then(() => {
      if (!window.google?.maps?.places) return;
      const svc = new window.google.maps.places.PlacesService(document.createElement("div"));
      svc.findPlaceFromQuery({ query: `${landmarkName} ${city}`, fields: ["photos"] }, (results, status) => {
        if (status === "OK" && results?.[0]?.photos?.[0]) {
          const url = results[0].photos[0].getUrl({ maxWidth: 600 });
          if (url) setLandmarkPhotos(prev => ({ ...prev, [key]: url }));
        }
      });
    }).catch(() => {});
  }, []);

  const lastDateRef = useRef(""); // tracks last selected date for calendar month persistence
  // Date input helper — remembers last used month so calendar opens there
  const dateInputProps = (value, onChange, extraProps = {}) => ({
    type: "date",
    value: value || "",
    onChange: (e) => { if (e.target.value) lastDateRef.current = e.target.value; onChange(e); },
    onFocus: (e) => { if (!e.target.value && lastDateRef.current) { onChange({ target: { value: lastDateRef.current } }); } },
    ...extraProps,
  });

  // Segment type SVG icons — clean stroke icons, no emojis
  const SegIcon = ({ type, size = 18, color = "currentColor" }) => {
    const icons = {
      flight: <><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1L11 12l-2 3H6l-2 2 4-1 4-1 2 7.5 2-2v-3l-3-2 4.8-7.3"/></>,
      accommodation: <><path d="M3 21V7c0-1.1.9-2 2-2h14a2 2 0 012 2v14"/><path d="M3 11h18"/><path d="M7 11V7"/><path d="M12 11V7"/><path d="M17 11V7"/></>,
      hotel: <><path d="M3 21V7c0-1.1.9-2 2-2h14a2 2 0 012 2v14"/><path d="M3 11h18"/><path d="M7 11V7"/><path d="M12 11V7"/><path d="M17 11V7"/></>,
      activity: <><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></>,
      train: <><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="M8 19l-2 3"/><path d="M16 19l2 3"/></>,
      rental: <><path d="M5 17h14v-5H5z"/><path d="M19 12l-1.5-4.5A2 2 0 0015.6 6H8.4a2 2 0 00-1.9 1.5L5 12"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/></>,
      cruise: <><path d="M2 20a7 7 0 0010 0 7 7 0 0010 0"/><path d="M12 4v12"/><path d="M5 8l7-4 7 4"/></>,
      ferry: <><path d="M2 20a7 7 0 0010 0 7 7 0 0010 0"/><path d="M4 16l2-8h12l2 8"/><path d="M12 4v4"/></>,
      restaurant: <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3"/><path d="M18 22V15"/></>,
      transfer: <><rect x="1" y="6" width="15" height="12" rx="2"/><path d="M16 10h4a2 2 0 012 2v6h-3"/><circle cx="7" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M16 6V4h4l3 4"/></>,
      lounge: <><path d="M4 12V6a2 2 0 012-2h12a2 2 0 012 2v6"/><path d="M2 14h20v4H2z"/><path d="M4 18v2"/><path d="M20 18v2"/></>,
      pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
    };
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {icons[type] || icons.pin}
      </svg>
    );
  };

  // Segment type definitions
  const SEGMENT_TYPES = [
    { id: "flight", label: "Flight", color: "#3b82f6" },
    { id: "accommodation", label: "Accommodation", color: "#8b5cf6" },
    { id: "activity", label: "Activity", color: "#22c55e" },
    { id: "train", label: "Train", color: "#f59e0b" },
    { id: "rental", label: "Rental Car", color: "#ef4444" },
    { id: "cruise", label: "Cruise", color: "#06b6d4" },
    { id: "ferry", label: "Ferry", color: "#0ea5e9" },
    { id: "restaurant", label: "Restaurant", color: "#f97316" },
    { id: "transfer", label: "Transfer", color: "#a855f7" },
    { id: "lounge", label: "Lounge", color: "#c9a84c" },
  ];

  // Common currencies for cost fields
  const CURRENCIES = [["USD","USD"],["EUR","EUR"],["GBP","GBP"],["JPY","JPY"],["HKD","HKD"],["CAD","CAD"],["AUD","AUD"],["SGD","SGD"],["CHF","CHF"],["CNY","CNY"],["KRW","KRW"],["THB","THB"],["TWD","TWD"],["NZD","NZD"],["MXN","MXN"],["BRL","BRL"],["AED","AED"],["BMD","BMD"],["INR","INR"],["MYR","MYR"],["PHP","PHP"],["IDR","IDR"],["SEK","SEK"],["NOK","NOK"],["DKK","DKK"],["ZAR","ZAR"]];

  // Segment field definitions per type
  const SEGMENT_FIELDS = {
    flight: "CUSTOM_FLIGHT_FORM",
    accommodation: [
      { key: "property", label: "Property Name", type: "text", placeholder: "e.g. Park Hyatt Tokyo", places: "establishment", fillsAddress: "location" },
      { key: "location", label: "Address / Location", type: "text", placeholder: "e.g. Shinjuku, Tokyo", places: true },
      { key: "date", label: "Check-in Date", type: "date" },
      { key: "checkoutDate", label: "Check-out Date", type: "date" },
      { key: "checkinTime", label: "Check-in Time", type: "time" },
      { key: "checkoutTime", label: "Check-out Time", type: "time" },
      { key: "roomType", label: "Room Type", type: "text", placeholder: "e.g. Deluxe King, Suite" },
      { key: "confirmationCode", label: "Confirmation Number", type: "text", mono: true },
      { key: "totalCost", label: "Total Cost", type: "number", placeholder: "0.00" },
      { key: "currency", label: "Currency", type: "select", options: CURRENCIES },
      { key: "cancellationPolicy", label: "Cancellation Policy", type: "text", placeholder: "e.g. Free until Jun 25" },
      { key: "notes", label: "Notes", type: "textarea", placeholder: "Special requests, meal plan..." },
    ],
    activity: [
      { key: "activityName", label: "Activity Name", type: "text", placeholder: "e.g. Tokyo Tower, teamLab Borderless", places: "establishment", fillsAddress: "location" },
      { key: "location", label: "Location / Address", type: "text", placeholder: "e.g. Hakone, Japan", places: true },
      { key: "date", label: "Date", type: "date" },
      { key: "startTime", label: "Start Time", type: "time" },
      { key: "endTime", label: "End Time", type: "time" },
      { key: "confirmationCode", label: "Confirmation Number", type: "text", mono: true },
      { key: "cost", label: "Cost", type: "number", placeholder: "0.00" },
      { key: "currency", label: "Currency", type: "select", options: CURRENCIES },
      { key: "notes", label: "Notes", type: "textarea", placeholder: "What to bring, meeting point..." },
    ],
    train: [
      { key: "operator", label: "Operator", type: "text", placeholder: "e.g. JR East, Eurostar, Amtrak" },
      { key: "trainNumber", label: "Train Number", type: "text", placeholder: "e.g. Shinkansen 123", mono: true },
      { key: "departureStation", label: "Departure Station", type: "text", placeholder: "e.g. Tokyo Station", places: "establishment" },
      { key: "arrivalStation", label: "Arrival Station", type: "text", placeholder: "e.g. Kyoto Station", places: "establishment" },
      { key: "date", label: "Date", type: "date" },
      { key: "departureTime", label: "Departure Time", type: "time" },
      { key: "arrivalTime", label: "Arrival Time", type: "time" },
      { key: "fareClass", label: "Class", type: "text", placeholder: "e.g. Green Car, Standard" },
      { key: "seat", label: "Seat / Car", type: "text", placeholder: "e.g. Car 7, Seat 3A", mono: true },
      { key: "confirmationCode", label: "Confirmation Number", type: "text", mono: true },
      { key: "cost", label: "Cost", type: "number", placeholder: "0.00" },
      { key: "currency", label: "Currency", type: "select", options: CURRENCIES },
    ],
    rental: [
      { key: "company", label: "Company", type: "text", placeholder: "e.g. Hertz, Toyota Rent-a-Car" },
      { key: "pickupLocation", label: "Pickup Location", type: "text", placeholder: "e.g. NRT Airport", places: true },
      { key: "dropoffLocation", label: "Dropoff Location", type: "text", placeholder: "e.g. KIX Airport", places: true },
      { key: "date", label: "Pickup Date", type: "date" },
      { key: "pickupTime", label: "Pickup Time", type: "time" },
      { key: "dropoffDate", label: "Dropoff Date", type: "date" },
      { key: "dropoffTime", label: "Dropoff Time", type: "time" },
      { key: "vehicleType", label: "Vehicle Type", type: "text", placeholder: "e.g. Compact SUV" },
      { key: "confirmationCode", label: "Confirmation Number", type: "text", mono: true },
      { key: "cost", label: "Cost", type: "number", placeholder: "0.00" },
      { key: "currency", label: "Currency", type: "select", options: CURRENCIES },
    ],
    cruise: [
      { key: "cruiseLine", label: "Cruise Line", type: "text", placeholder: "e.g. Royal Caribbean" },
      { key: "shipName", label: "Ship Name", type: "text", placeholder: "e.g. Symphony of the Seas" },
      { key: "departurePort", label: "Departure Port", type: "text" },
      { key: "arrivalPort", label: "Arrival Port", type: "text" },
      { key: "date", label: "Embark Date", type: "date" },
      { key: "disembarkDate", label: "Disembark Date", type: "date" },
      { key: "cabinType", label: "Cabin Type / Number", type: "text", placeholder: "e.g. Balcony 8234" },
      { key: "confirmationCode", label: "Confirmation Number", type: "text", mono: true },
      { key: "cost", label: "Cost", type: "number", placeholder: "0.00" },
      { key: "currency", label: "Currency", type: "select", options: CURRENCIES },
    ],
    ferry: [
      { key: "operator", label: "Operator", type: "text", placeholder: "e.g. Star Ferry, BC Ferries" },
      { key: "departurePort", label: "Departure Port", type: "text" },
      { key: "arrivalPort", label: "Arrival Port", type: "text" },
      { key: "date", label: "Date", type: "date" },
      { key: "departureTime", label: "Departure Time", type: "time" },
      { key: "arrivalTime", label: "Arrival Time", type: "time" },
      { key: "fareClass", label: "Class", type: "text", placeholder: "e.g. Standard, Premium" },
      { key: "confirmationCode", label: "Confirmation Number", type: "text", mono: true },
      { key: "cost", label: "Cost", type: "number", placeholder: "0.00" },
      { key: "currency", label: "Currency", type: "select", options: CURRENCIES },
    ],
    restaurant: [
      { key: "restaurantName", label: "Restaurant Name", type: "text", placeholder: "e.g. Sukiyabashi Jiro", places: "establishment", fillsAddress: "location" },
      { key: "location", label: "Address", type: "text", placeholder: "e.g. Ginza, Tokyo", places: true },
      { key: "date", label: "Date", type: "date" },
      { key: "time", label: "Reservation Time", type: "time" },
      { key: "partySize", label: "Party Size", type: "number", placeholder: "2" },
      { key: "cuisine", label: "Cuisine Type", type: "text", placeholder: "e.g. Omakase, Italian" },
      { key: "confirmationCode", label: "Confirmation Number", type: "text", mono: true },
      { key: "cost", label: "Est. Cost", type: "number", placeholder: "0.00" },
      { key: "currency", label: "Currency", type: "select", options: CURRENCIES },
      { key: "notes", label: "Notes", type: "textarea", placeholder: "Dietary restrictions, dress code..." },
    ],
    transfer: [
      { key: "transferType", label: "Type", type: "select", options: [["taxi","Taxi"],["shuttle","Shuttle"],["private_car","Private Car"],["rideshare","Rideshare"],["bus","Bus"]] },
      { key: "pickupLocation", label: "Pickup Location", type: "text", placeholder: "e.g. Narita Airport T1", places: true },
      { key: "dropoffLocation", label: "Dropoff Location", type: "text", placeholder: "e.g. Park Hyatt Tokyo", places: true },
      { key: "date", label: "Date", type: "date" },
      { key: "pickupTime", label: "Pickup Time", type: "time" },
      { key: "provider", label: "Provider", type: "text", placeholder: "e.g. Uber, Blacklane" },
      { key: "confirmationCode", label: "Confirmation Number", type: "text", mono: true },
      { key: "cost", label: "Cost", type: "number", placeholder: "0.00" },
      { key: "currency", label: "Currency", type: "select", options: CURRENCIES },
    ],
    lounge: [
      { key: "loungeName", label: "Lounge Name", type: "text", placeholder: "e.g. Cathay Pacific First Lounge" },
      { key: "airport", label: "Airport", type: "text", placeholder: "e.g. HKG" },
      { key: "terminal", label: "Terminal", type: "text", placeholder: "e.g. Terminal 1" },
      { key: "date", label: "Date", type: "date" },
      { key: "time", label: "Time", type: "time" },
      { key: "accessMethod", label: "Access Method", type: "text", placeholder: "e.g. Priority Pass, AA EP status" },
      { key: "notes", label: "Notes", type: "textarea", placeholder: "Shower available, dining options..." },
    ],
  };
  const [trips, setTrips] = useState([]);
  const [linkedAccounts, setLinkedAccounts] = useState({});
  const [cardBenefitValues, setCardBenefitValues] = useState(() => {
    try { return JSON.parse(localStorage.getItem("continuum_card_benefit_values") || "{}"); } catch { return {}; }
  });
  const [cardCustomBenefits, setCardCustomBenefits] = useState(() => {
    try { return JSON.parse(localStorage.getItem("continuum_card_custom_benefits") || "{}"); } catch { return {}; }
  });
  const [expandedCardId, setExpandedCardId] = useState(null);

  // Sync benefit data to Supabase via linked_accounts.member_id (credit cards don't use member IDs)
  const benefitSyncTimers = useRef({});
  const syncCardBenefitsToSupabase = (cardId, benefitVals, customBens) => {
    if (!user) return;
    clearTimeout(benefitSyncTimers.current[cardId]);
    benefitSyncTimers.current[cardId] = setTimeout(() => {
      const payload = JSON.stringify({ _cb: true, b: benefitVals || {}, c: customBens || [] });
      supabase.from("linked_accounts").update({ member_id: payload, updated_at: new Date().toISOString() })
        .eq("user_id", user.id).eq("program_id", cardId).then();
    }, 800);
  };

  const setCardBenefitValue = (cardId, benefitId, value) => {
    setCardBenefitValues(prev => {
      const next = { ...prev, [cardId]: { ...(prev[cardId] || {}), [benefitId]: value } };
      try { localStorage.setItem("continuum_card_benefit_values", JSON.stringify(next)); } catch {}
      syncCardBenefitsToSupabase(cardId, next[cardId], cardCustomBenefits[cardId] || []);
      return next;
    });
  };
  const persistCustomBenefits = (cardId, next) => {
    try { localStorage.setItem("continuum_card_custom_benefits", JSON.stringify(next)); } catch {}
    syncCardBenefitsToSupabase(cardId, cardBenefitValues[cardId] || {}, next[cardId] || []);
  };
  const addCustomBenefit = (cardId) => {
    setCardCustomBenefits(prev => {
      const list = prev[cardId] || [];
      const next = { ...prev, [cardId]: [...list, { id: `custom_${Date.now()}`, label: "", value: "" }] };
      persistCustomBenefits(cardId, next);
      return next;
    });
  };
  const updateCustomBenefit = (cardId, benefitId, patch) => {
    setCardCustomBenefits(prev => {
      const list = (prev[cardId] || []).map(b => b.id === benefitId ? { ...b, ...patch } : b);
      const next = { ...prev, [cardId]: list };
      persistCustomBenefits(cardId, next);
      return next;
    });
  };
  const removeCustomBenefit = (cardId, benefitId) => {
    setCardCustomBenefits(prev => {
      const list = (prev[cardId] || []).filter(b => b.id !== benefitId);
      const next = { ...prev, [cardId]: list };
      persistCustomBenefits(cardId, next);
      return next;
    });
  };
  const getCardNetValue = (cardId) => {
    const card = LOYALTY_PROGRAMS.creditCards.find(c => c.id === cardId);
    if (!card) return { total: 0, fee: 0, net: 0 };
    const values = cardBenefitValues[cardId] || {};
    const standard = (card.benefits || []).reduce((s, b) => s + (Number(values[b.id]) || 0), 0);
    const custom = (cardCustomBenefits[cardId] || []).reduce((s, b) => s + (Number(b.value) || 0), 0);
    const total = standard + custom;
    const fee = card.annualFee || 0;
    return { total, fee, net: total - fee };
  };
  const [showLinkModal, setShowLinkModal] = useState(null);
  const [linkForm, setLinkForm] = useState({ memberId: "", pointsBalance: "", tierCredits: "", currentNights: "", currentRentals: "", currentTier: "" });
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [pastTripsExpanded, setPastTripsExpanded] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [expenses, setExpenses] = useState([]);

  // Fallback: persist expenses to localStorage for non-logged-in use
  useEffect(() => {
    if (!user?.id && expenses.length > 0) {
      saveExpensesToStorage("guest", expenses);
    }
  }, [expenses, user?.id]);

  const [showAddExpense, setShowAddExpense] = useState(null); // null or tripId
  const [editExpenseId, setEditExpenseId] = useState(null); // null or expense id being edited
  const [newExpense, setNewExpense] = useState({ category: "flight", description: "", amount: "", currency: "USD", fxRate: 1, date: "", paymentMethod: "", receipt: false, receiptImage: null, notes: "" });
  const [expenseViewTrip, setExpenseViewTrip] = useState(null); // null = overview, tripId = detail
  const [showExpenseReport, setShowExpenseReport] = useState(null); // tripId for report modal
  const [forwardReportId, setForwardReportId] = useState(null); // report id to forward
  const [forwardEmail, setForwardEmail] = useState("");
  const [forwardStatus, setForwardStatus] = useState(""); // "" | "sending" | "sent" | "error"
  const [allianceMyProgram, setAllianceMyProgram] = useState("aa");
  const [allianceMyTierOverride, setAllianceMyTierOverride] = useState(null);
  const [allianceCompare, setAllianceCompare] = useState("ua");
  const [programSubView, setProgramSubView] = useState("airlines");
  const [programsHover, setProgramsHover] = useState(false);
  const [optimizerTab, setOptimizerTab] = useState("itinerary");
  const [optimizerTripId, setOptimizerTripId] = useState(null);
  const [allianceGoal, setAllianceGoal] = useState("sa_gold");
  const [itinSegments, setItinSegments] = useState([{ id: crypto.randomUUID(), origin: "", destination: "", operatingAirline: "", marketingAirline: "", bookingClass: "", distance: "" }]);
  const [itinFare, setItinFare] = useState({ baseFare: "", taxes: "", airlineFees: "", otherFees: "", currency: "USD" });
  const [itinCreditAirline, setItinCreditAirline] = useState("");
  const [itinResults, setItinResults] = useState(null);
  const [itinHistory, setItinHistory] = useState(() => { try { return JSON.parse(localStorage.getItem("continuum_itin_history") || "[]"); } catch { return []; } });
  const [showItinHistory, setShowItinHistory] = useState(false);
  const [itinCurrentTier, setItinCurrentTier] = useState(""); // prior-year elite tier (determines earning bonus)
  const [optimizerHover, setOptimizerHover] = useState(false);
  const [progDropItem, setProgDropItem] = useState("airlines");   // sub-item currently previewed in Programs dropdown
  const [optDropItem, setOptDropItem] = useState("global");        // sub-item currently previewed in Optimizer dropdown
  const [insDropItem, setInsDropItem] = useState("countdown");     // sub-item currently previewed in Insights dropdown
  const [insightsHover, setInsightsHover] = useState(false);
  const [navCursor, setNavCursor] = useState(null);               // slide-tabs animated cursor position
  const [ccOptTarget, setCcOptTarget] = useState("max_points"); // "max_points" | airline/hotel program id
  const [ccOptAmount, setCcOptAmount] = useState("100"); // purchase amount for illustration
  const [ccBookingMode, setCcBookingMode] = useState("direct"); // "direct" | "portal"
  const [customPrograms, setCustomPrograms] = useState([]);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [newProgram, setNewProgram] = useState({ name: "", category: "airline", logo: "—", color: "#0EA5A0", memberId: "", unit: "Points", tiers: "", selectedId: "", search: "" });
  const [conciergeProgram, setConciergeProgram] = useState(null); // program object for AI concierge
  const [conciergeMessages, setConciergeMessages] = useState([]); // { role, content }
  const [conciergeInput, setConciergeInput] = useState("");
  const [conciergeLoading, setConciergeLoading] = useState(false);
  const [conciergeSpeaking, setConciergeSpeaking] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileSetupForm, setProfileSetupForm] = useState({ firstName: "", lastName: "" });
  const [profileSetupLoading, setProfileSetupLoading] = useState(false);
  const [profileSetupError, setProfileSetupError] = useState("");

  // ── PA announcement state (top-level so mute button works on all pages) ──
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [showChime, setShowChime] = useState(false);
  const [paMuted, setPaMuted] = useState(false);
  const [paEnded, setPaEnded] = useState(false);
  const audioCtxRef = React.useRef(null);
  const paPlayedRef = React.useRef(false);
  const [cockpitSection, setCockpitSection] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [insightTab, setInsightTab] = useState("countdown");
  const [annualFeeCard, setAnnualFeeCard] = useState("amex_plat");
  const [checkedBenefits, setCheckedBenefits] = useState({});
  const [customBenefitValues, setCustomBenefitValues] = useState({}); // { "cardId:benefitId": number }
  const [transferGoal, setTransferGoal] = useState("");
  const [calendarPopover, setCalendarPopover] = useState(null); // { id, top, right } for fixed-position dropdown
  const [tripsView, setTripsView] = useState("list"); // "list" | "calendar"
  const [calViewMonth, setCalViewMonth] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }));

  const [tierScrollIdx, setTierScrollIdx] = useState({}); // { [programId]: activeIndex }

  // ── Settings state ──
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState("profile");
  const [settingsForm, setSettingsForm] = useState({ firstName: "", lastName: "", email: "", currentPassword: "", newPassword: "", confirmPassword: "", homeAirport: "", passportCountry: "", defaultCurrency: "USD", notifications: { statusMilestones: true, expiringMiles: true, newPrograms: false } });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState({ type: "", text: "" }); // {type: "success"|"error", text}

  // ── Itinerary import & inbox state ──
  const [showImportItinerary, setShowImportItinerary] = useState(false);
  const [itineraryText, setItineraryText] = useState("");
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [userForwardingAddress, setUserForwardingAddress] = useState("");
  const [showPasteItinerary, setShowPasteItinerary] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteLabel, setPasteLabel] = useState("");

  // Receipt QR code generation
  useEffect(() => {
    if (showReceiptQR && userForwardingAddress) {
      const receiptUrl = `${window.location.origin}/api/receipt?t=${userForwardingAddress}`;
      setReceiptQRDataUrl(`/api/qrcode?data=${encodeURIComponent(receiptUrl)}`);
    }
  }, [showReceiptQR, userForwardingAddress]);

  // Handle Web Share Target — detect ?share=1 on app open
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("share") === "1") {
      const sharedText = params.get("text") || "";
      const sharedTitle = params.get("title") || "";
      if (sharedText || sharedTitle) {
        setPasteText(sharedText);
        setPasteLabel(sharedTitle);
        setShowPasteItinerary(true);
      }
      // Clean URL
      window.history.replaceState({}, "", "/");
    }
  }, []);
  const [tripDetailId, setTripDetailId] = useState(null); // trip id to show detail view
  useEffect(() => { if (tripDetailId && ![...trips, ...sharedTrips].find(t => t.id === tripDetailId)) setTripDetailId(null); }, [tripDetailId, trips, sharedTrips]);
  const [tripDetailSegIdx, setTripDetailSegIdx] = useState(0); // which segment is active in detail view
  const [tripSummaryId, setTripSummaryId] = useState(null); // trip summary popup from dashboard

  // Fetch weather for all days when trip detail opens — uses server-side API
  useEffect(() => {
    if (!tripDetailId) return;
    const trip = [...trips, ...sharedTrips].find(t => t.id === tripDetailId);
    if (!trip) return;
    const segs = (trip.segments || []).filter(s => !s._isMeta);
    const dates = [...new Set(segs.map(s => s.date).filter(Boolean))].sort();
    if (dates.length === 0) return;
    const fallbackCity = trip.location?.split(",")[0]?.trim() || "";
    let cancelled = false;

    const doFetch = async () => {
      for (const date of dates) {
        if (cancelled) break;
        const dayCity = resolveCityForDate(segs, date);
        const city = dayCity.airportCode || dayCity.city || fallbackCity;
        if (!city) continue;
        const cacheKey = `${city}_${date}`;
        if (weatherLoading.current[cacheKey]) continue;
        weatherLoading.current[cacheKey] = true;
        try {
          const resp = await fetch(`/api/weather?city=${encodeURIComponent(city)}&date=${date}`);
          if (resp.ok && !cancelled) {
            const data = await resp.json();
            if (data.high !== undefined) {
              setWeatherCache(prev => ({ ...prev, [cacheKey]: data }));
            }
          }
        } catch {}
      }
    };

    setTimeout(doFetch, 300);
    return () => { cancelled = true; };
  }, [tripDetailId, trips, sharedTrips]);

  // ── Standalone Expense Reports ──
  const [standaloneReports, setStandaloneReports] = useState([]);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [editingReportId, setEditingReportId] = useState(null);
  const [reportBuilder, setReportBuilder] = useState({
    title: "", selectedTripIds: [], excludedExpenseIds: [], customExpenses: [],
  });
  const [reportBuilderCustom, setReportBuilderCustom] = useState({ category: "flight", description: "", amount: "", currency: "USD", fxRate: 1, date: "", paymentMethod: "", notes: "" });
  const [showReportCustomExpense, setShowReportCustomExpense] = useState(false);
  const [newsArticles, setNewsArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsFetched, setNewsFetched] = useState(false);
  const [newsSourceFilter, setNewsSourceFilter] = useState("all");

  // ── Mobile detection ──
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => { setTimeout(() => setAnimateIn(true), 100); }, []);

  // PWA install prompt — capture Android/Chrome event; show iOS guide after 3s if not already installed
  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (isStandalone) return; // already installed, don't show
    const dismissed = sessionStorage.getItem("pwa-prompt-dismissed");
    if (dismissed) return;

    // Android/Chrome: capture the deferred install event
    const handler = (e) => { e.preventDefault(); setDeferredInstallEvent(e); setShowInstallPrompt(true); };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: show our guided prompt after a short delay
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIOS && isSafari) {
      const t = setTimeout(() => setShowInstallPrompt(true), 3000);
      return () => { clearTimeout(t); window.removeEventListener("beforeinstallprompt", handler); };
    }
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // PA plays once per session (sessionStorage guards against StrictMode double-invoke)
  const playPA = useCallback(() => {
    if (paPlayedRef.current || sessionStorage.getItem('pa_played')) return;
    paPlayedRef.current = true;
    sessionStorage.setItem('pa_played', '1');
    setAudioPlayed(true);
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const chime = (t) => {
        [880, 660].forEach((f, i) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = "sine"; o.frequency.value = f;
          g.gain.setValueAtTime(0.3, t + i * 0.18);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.18 + 1);
          o.connect(g); g.connect(ctx.destination);
          o.start(t + i * 0.18); o.stop(t + i * 0.18 + 1);
        });
      };
      chime(ctx.currentTime);
      setShowChime(true); setTimeout(() => setShowChime(false), 2500);
      const msg = "Good evening Ladies and Gentlemen, Welcome onboard Continuum Flight CTM2026 en route to your favourite destination. Just a reminder, once the seatbelt sign turns off, please feel free to roam and explore the many features of this tool. It's built for you to get to those elite status levels quickly and to maximize your hard earned dollars. If you require any assistance throughout the journey, please press on the passenger call button and we will be with you shortly. Safe travels and thank you for choosing Continuum.";
      setTimeout(() => {
        try {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(msg);
            u.rate = 0.88; u.pitch = 1.05; u.volume = 0.9;
            const pick = () => {
              const v = window.speechSynthesis.getVoices();
              const au = v.find(x => /karen/i.test(x.name))
                || v.find(x => /natasha/i.test(x.name))
                || v.find(x => /google australian english/i.test(x.name))
                || v.find(x => /australian english/i.test(x.name))
                || v.find(x => /catherine|matilda|zoe/i.test(x.name))
                || v.find(x => /en[-_]au/i.test(x.lang))
                || v.find(x => /en/i.test(x.lang) && x.name.toLowerCase().includes('female'))
                || v.find(x => /en/i.test(x.lang));
              if (au) u.voice = au;
              u.onend = () => { setPaEnded(true); };
              window.speechSynthesis.speak(u);
            };
            if (window.speechSynthesis.getVoices().length > 0) pick();
            else {
              window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.onvoiceschanged = null;
                pick();
              };
            }
          }
        } catch(e) {}
      }, 1200);
    } catch(e) {}
  }, []);

  // ── Supabase auth listener + trip loader ──
  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setIsLoggedIn(true);
        loadTrips(session.user.id);
        loadSharedTrips(session.user.id, session.user.email);
        // Resolve pending share invites to this user's ID
        supabase.from("trip_shares").update({ shared_with_id: session.user.id }).eq("shared_with_email", session.user.email).is("shared_with_id", null);
        loadLinkedAccounts(session.user.id);
        loadExpenses(session.user.id);
        loadExpenseReports(session.user.id);
        loadItineraries(session.user.id);
        loadForwardingAddress(session.user.id, session.user.email);
        if (!session.user.user_metadata?.first_name) setShowProfileSetup(true);
      } else {
        // No session — try to refresh using stored refresh token
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (refreshData?.session?.user) {
          setUser(refreshData.session.user);
          setIsLoggedIn(true);
          loadTrips(refreshData.session.user.id);
          loadSharedTrips(refreshData.session.user.id, refreshData.session.user.email);
          loadLinkedAccounts(refreshData.session.user.id);
          loadExpenses(refreshData.session.user.id);
          loadExpenseReports(refreshData.session.user.id);
          loadItineraries(refreshData.session.user.id);
        } else {
          setIsLoggedIn(false);
        }
      }
    });

    // Re-check session when app comes back to foreground (mobile PWA)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            setUser(session.user);
            setIsLoggedIn(true);
          }
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Don't sign out on INITIAL_SESSION with no session — getSession above handles that
      if (event === "INITIAL_SESSION") return;
      if (session?.user) {
        setUser(session.user);
        setIsLoggedIn(true);
        // Only reload data on SIGNED_IN, not on TOKEN_REFRESHED (avoids unnecessary refetches)
        if (event === "SIGNED_IN") {
          loadTrips(session.user.id);
          loadSharedTrips(session.user.id, session.user.email);
          loadLinkedAccounts(session.user.id);
          loadExpenses(session.user.id);
          loadExpenseReports(session.user.id);
          loadItineraries(session.user.id);
          loadForwardingAddress(session.user.id, session.user.email);
          if (!session.user.user_metadata?.first_name) setShowProfileSetup(true);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setIsLoggedIn(false);
        setTrips([]);
        setExpenses([]);
        setStandaloneReports([]);
        setLinkedAccounts({});
      }
    });

    return () => { subscription.unsubscribe(); document.removeEventListener("visibilitychange", handleVisibility); };
  }, []);

  const loadLinkedAccounts = async (userId) => {
    const { data, error } = await supabase
      .from("linked_accounts")
      .select("*")
      .eq("user_id", userId);
    if (!error && data) {
      const map = {};
      data.forEach(row => {
        map[row.program_id] = {
          memberId: row.member_id,
          currentPoints: row.current_points || 0,
          tierCredits: row.tier_credits || 0,
          currentNights: row.current_nights || 0,
          currentRentals: row.current_rentals || 0,
          pointsBalance: row.points_balance || 0,
          currentTier: row.current_tier || "",
          updatedAt: row.updated_at || null,
        };
      });
      setLinkedAccounts(map);
      // Restore card benefit values from Supabase (stored as JSON in member_id for credit cards)
      const benefitVals = {};
      const customBens = {};
      const creditCardIds = new Set(LOYALTY_PROGRAMS.creditCards.map(c => c.id));
      data.forEach(row => {
        if (!creditCardIds.has(row.program_id)) return;
        const mid = row.member_id || "";
        if (mid.startsWith("{")) {
          try {
            const parsed = JSON.parse(mid);
            if (parsed._cb) {
              if (parsed.b) benefitVals[row.program_id] = parsed.b;
              if (parsed.c) customBens[row.program_id] = parsed.c;
            }
          } catch {}
        }
      });
      // Merge: Supabase data overrides localStorage (newer wins)
      if (Object.keys(benefitVals).length > 0 || Object.keys(customBens).length > 0) {
        setCardBenefitValues(prev => {
          const merged = { ...prev, ...benefitVals };
          try { localStorage.setItem("continuum_card_benefit_values", JSON.stringify(merged)); } catch {}
          return merged;
        });
        setCardCustomBenefits(prev => {
          const merged = { ...prev, ...customBens };
          try { localStorage.setItem("continuum_card_custom_benefits", JSON.stringify(merged)); } catch {}
          return merged;
        });
      }
    }
  };

  const loadTrips = async (userId) => {
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true });
    if (!error && data) {
      setTrips(data.map(row => ({
        id: row.id,
        type: row.type,
        program: row.program,
        route: row.route,
        date: row.date,
        class: row.class,
        nights: row.nights,
        status: row.status,
        tripName: row.trip_name,
        property: row.property,
        location: row.location,
        flightNumber: row.flight_number,
        departureTime: row.departure_time,
        arrivalTime: row.arrival_time,
        departureTerminal: row.departure_terminal,
        arrivalTerminal: row.arrival_terminal,
        estimatedPoints: row.estimated_points,
        estimatedNights: row.estimated_nights,
        fareClass: row.fare_class,
        bookingClass: row.booking_class,
        segments: row.segments || null,
      })));
    }
  };

  const loadSharedTrips = async (userId, userEmail) => {
    const { data: shares } = await supabase
      .from("trip_shares")
      .select("trip_id, owner_name, permission")
      .or(`shared_with_id.eq.${userId},shared_with_email.eq.${userEmail}`);
    if (!shares || shares.length === 0) { setSharedTrips([]); return; }
    const tripIds = shares.map(s => s.trip_id);
    // Try fetching trips directly first
    let { data: tripRows } = await supabase.from("trips").select("*").in("id", tripIds);
    // If RLS blocks direct access, fetch via API with service role
    if (!tripRows || tripRows.length === 0) {
      try {
        const resp = await fetch(`/api/shared-trips`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tripIds }),
        });
        if (resp.ok) {
          const data = await resp.json();
          tripRows = data.trips || [];
        }
      } catch {}
    }
    if (tripRows && tripRows.length > 0) {
      setSharedTrips(tripRows.map(row => {
        const share = shares.find(s => s.trip_id === row.id);
        return {
          id: row.id, type: row.type, program: row.program, route: row.route, date: row.date,
          status: row.status, tripName: row.trip_name, location: row.location,
          segments: row.segments || [], estimatedPoints: row.estimated_points,
          confirmationCode: row.confirmation_code,
          _shared: true, _sharedBy: share?.owner_name || "Someone", _permission: share?.permission || "read",
        };
      }));
    }
  };

  const loadExpenses = async (userId) => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true });
    if (!error && data) {
      setExpenses(data.map(row => ({
        id: row.id,
        tripId: row.trip_id,
        category: row.category,
        description: row.description,
        amount: row.amount,
        currency: row.currency || "USD",
        fxRate: row.fx_rate || 1,
        usdReimbursement: row.usd_reimbursement || null,
        individuals: row.individuals || "Self",
        date: row.date,
        paymentMethod: row.payment_method,
        receipt: row.receipt,
        receiptImage: row.receipt_image || null,
        notes: row.notes,
      })));
    }
  };

  const loadExpenseReports = async (userId) => {
    const { data, error } = await supabase
      .from("expense_reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setStandaloneReports(data.map(row => ({
        id: row.id,
        title: row.title,
        selectedTripIds: row.selected_trip_ids || [],
        excludedExpenseIds: row.excluded_expense_ids || [],
        customExpenses: row.custom_expenses || [],
        createdAt: row.created_at?.slice(0, 10),
      })));
    }
  };

  const loadItineraries = async (userId) => {
    const { data } = await supabase
      .from("itineraries")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["pending", "reviewed"])
      .order("received_at", { ascending: false });
    if (data) setSavedItineraries(data);
  };

  // Load or create user forwarding address
  // Note: a user may have multiple rows (primary + additional emails), all sharing the
  // same forwarding_address token. Don't use .single() — it errors when rows > 1.
  const loadForwardingAddress = async (userId, userEmail) => {
    const { data } = await supabase
      .from("user_forwarding_addresses")
      .select("*")
      .eq("user_id", userId);
    const rows = data || [];
    // Prefer the row matching the primary email; otherwise the first row with a token
    const primary = rows.find(r => (r.email || "").toLowerCase() === (userEmail || "").toLowerCase())
      || rows.find(r => r.forwarding_address)
      || null;
    if (primary) {
      setUserForwardingAddress(primary.forwarding_address || "");
      return;
    }
    // No row yet — create the primary row
    const firstName = (user?.user_metadata?.first_name || user?.user_metadata?.name?.split(" ")[0] || "user").toLowerCase().replace(/[^a-z]/g, "");
    const token = `${firstName}.${crypto.randomUUID().slice(0, 6)}`;
    const { data: newData } = await supabase.from("user_forwarding_addresses").insert({
      user_id: userId,
      email: (userEmail || "").toLowerCase(),
      forwarding_address: token,
      verified: true,
    }).select();
    if (newData && newData[0]) setUserForwardingAddress(newData[0].forwarding_address);
  };

  // Trigger PA on first click/touch anywhere while on the landing page
  useEffect(() => {
    if (isLoggedIn || publicPage !== "landing") return;
    const h = () => {
      playPA();
      document.removeEventListener("click", h);
      document.removeEventListener("touchstart", h);
    };
    document.addEventListener("click", h);
    document.addEventListener("touchstart", h);
    return () => {
      document.removeEventListener("click", h);
      document.removeEventListener("touchstart", h);
    };
  }, [playPA, isLoggedIn, publicPage]);

  // ── News sources + fetch (defined here so the useEffect below can reference fetchNews) ──
  const NEWS_SOURCES = [
    { id: "tpg",    name: "The Points Guy",     color: "#C8102E", url: "https://thepointsguy.com/feed/" },
    { id: "prince", name: "Prince of Travel",   color: "#1A3668", url: "https://princeoftravel.com/feed/" },
    { id: "sebby",  name: "Ask Sebby",           color: "#FF6600", url: "https://asksebby.com/feed/" },
    { id: "omaat",  name: "One Mile at a Time",  color: "#003876", url: "https://onemileatatime.com/feed/" },
    { id: "vftw",   name: "View from the Wing",  color: "#006564", url: "https://viewfromthewing.com/feed/" },
    { id: "doc",    name: "Doctor of Credit",    color: "#2E1A47", url: "https://www.doctorofcredit.com/feed/" },
    { id: "fm",     name: "Frequent Miler",      color: "#006845", url: "https://frequentmiler.com/feed/" },
    { id: "up",     name: "Upgraded Points",     color: "#0078D2", url: "https://upgradedpoints.com/feed/" },
    { id: "ll",     name: "Loyalty Lobby",       color: "#7C2529", url: "https://loyaltylobby.com/feed/" },
    { id: "gsp",    name: "God Save The Points", color: "#8B008B", url: "https://godsavethepoints.com/feed/" },
  ];

  const fetchNews = async () => {
    setNewsLoading(true);
    const results = await Promise.allSettled(
      NEWS_SOURCES.map(src =>
        fetch(`/api/news?url=${encodeURIComponent(src.url)}`)
          .then(r => r.json())
          .then(data => (data.items || []).map(item => ({
            id: item.guid || item.link,
            source: src.id,
            sourceName: src.name,
            sourceColor: src.color,
            title: item.title,
            link: item.link,
            date: item.pubDate,
            thumbnail: item.thumbnail || null,
            description: item.description || "",
          })))
      )
    );
    const all = results.flatMap(r => r.status === "fulfilled" ? r.value : []);
    all.sort((a, b) => new Date(b.date) - new Date(a.date));
    setNewsArticles(all);
    setNewsLoading(false);
    setNewsFetched(true);
  };

  // Fetch news when News tab is opened for the first time
  useEffect(() => {
    if (activeView === "news" && !newsFetched && !newsLoading) {
      fetchNews();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  // AI Concierge — Diverse voice profiles mapped to airline/hotel nationality
  const VOICE_PROFILES = {
    aa: { lang: "en-US", gender: "male", pitch: 0.95, rate: 0.92, accent: "American" },
    dl: { lang: "en-US", gender: "female", pitch: 1.05, rate: 0.94, accent: "Southern American" },
    ua: { lang: "en-US", gender: "male", pitch: 0.9, rate: 0.9, accent: "American" },
    sw: { lang: "en-US", gender: "female", pitch: 1.1, rate: 0.96, accent: "Texan" },
    b6: { lang: "en-US", gender: "male", pitch: 1.0, rate: 0.93, accent: "New York" },
    atmos: { lang: "en-US", gender: "female", pitch: 1.05, rate: 0.88, accent: "Pacific Northwest" },
    frontier: { lang: "en-US", gender: "male", pitch: 0.88, rate: 0.95, accent: "Midwestern" },
    spirit: { lang: "en-US", gender: "female", pitch: 1.08, rate: 0.97, accent: "Miami" },
    flying_blue: { lang: "fr-FR", gender: "female", pitch: 1.1, rate: 0.85, accent: "French" },
    ba_avios: { lang: "en-GB", gender: "male", pitch: 0.85, rate: 0.88, accent: "British" },
    aeroplan: { lang: "en-CA", gender: "female", pitch: 1.0, rate: 0.9, accent: "Canadian" },
    emirates_skywards: { lang: "en-GB", gender: "male", pitch: 0.82, rate: 0.85, accent: "refined British" },
    turkish_miles: { lang: "en-GB", gender: "male", pitch: 0.9, rate: 0.82, accent: "Turkish" },
    qantas_ff: { lang: "en-AU", gender: "female", pitch: 1.05, rate: 0.92, accent: "Australian" },
    singapore_kf: { lang: "en-SG", gender: "female", pitch: 1.08, rate: 0.88, accent: "Singaporean" },
    etihad_guest: { lang: "en-GB", gender: "male", pitch: 0.88, rate: 0.84, accent: "Abu Dhabi" },
    virgin_fc: { lang: "en-GB", gender: "female", pitch: 1.12, rate: 0.93, accent: "British" },
    cathay_mp: { lang: "en-GB", gender: "female", pitch: 1.06, rate: 0.86, accent: "Hong Kong" },
    marriott: { lang: "en-US", gender: "male", pitch: 0.92, rate: 0.88, accent: "American" },
    hilton: { lang: "en-US", gender: "female", pitch: 1.05, rate: 0.9, accent: "American" },
    ihg: { lang: "en-GB", gender: "male", pitch: 0.88, rate: 0.87, accent: "British" },
    hyatt: { lang: "en-US", gender: "female", pitch: 1.02, rate: 0.91, accent: "American" },
    choice: { lang: "en-US", gender: "male", pitch: 0.95, rate: 0.93, accent: "Midwestern" },
    wyndham: { lang: "en-US", gender: "female", pitch: 1.08, rate: 0.92, accent: "Southern" },
    accor: { lang: "fr-FR", gender: "female", pitch: 1.1, rate: 0.84, accent: "French" },
    bestwestern: { lang: "en-US", gender: "male", pitch: 0.9, rate: 0.9, accent: "American" },
    radisson: { lang: "en-GB", gender: "male", pitch: 0.92, rate: 0.86, accent: "Scandinavian" },
    sonesta: { lang: "en-US", gender: "female", pitch: 1.04, rate: 0.91, accent: "American" },
    omni: { lang: "en-US", gender: "male", pitch: 0.88, rate: 0.89, accent: "American" },
    hertz: { lang: "en-US", gender: "male", pitch: 0.95, rate: 0.91, accent: "American" },
    sixt: { lang: "de-DE", gender: "male", pitch: 0.88, rate: 0.85, accent: "German" },
  };

  const speakText = useCallback((text, programId) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const profile = VOICE_PROFILES[programId] || { lang: "en-US", gender: "male", pitch: 1.0, rate: 0.9 };
    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) { setTimeout(trySpeak, 100); return; }
      // Break into sentences for natural delivery with micro-pauses
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      setConciergeSpeaking(true);
      let totalUtterances = sentences.length;
      let completed = 0;
      sentences.forEach((sentence, idx) => {
        const utter = new SpeechSynthesisUtterance(sentence.trim());
        // Natural pitch/rate variation per sentence
        utter.pitch = Math.max(0.1, Math.min(2, profile.pitch + (Math.random() * 0.12 - 0.06)));
        utter.rate = Math.max(0.5, Math.min(1.2, profile.rate + (Math.random() * 0.08 - 0.04)));
        utter.volume = 1;
        // Smart voice selection: match language, then gender, prefer high-quality voices
        const langBase = profile.lang.split("-")[0];
        const langVoices = voices.filter(v => v.lang.startsWith(langBase));
        const femaleHints = ["female", "woman", "Samantha", "Karen", "Fiona", "Victoria", "Tessa", "Amelie", "Nicky", "Zira", "Susan", "Hazel", "Google UK English Female"];
        const maleHints = ["male", "man", "Daniel", "Alex", "Thomas", "James", "Fred", "David", "Mark", "Google UK English Male", "Oliver", "Arthur"];
        const genderHints = profile.gender === "female" ? femaleHints : maleHints;
        // Priority: exact lang match + gender + neural/premium, then lang match + gender, then any lang match, then English fallback
        let voice = langVoices.find(v => genderHints.some(h => v.name.toLowerCase().includes(h.toLowerCase())) && (v.name.includes("Neural") || v.name.includes("Natural") || v.name.includes("Premium")));
        if (!voice) voice = langVoices.find(v => genderHints.some(h => v.name.toLowerCase().includes(h.toLowerCase())));
        if (!voice) voice = langVoices.find(v => v.name.includes("Google") || v.name.includes("Microsoft") || v.name.includes("Natural"));
        if (!voice && langBase !== "en") {
          // Fallback: try English voices with the gender preference for non-English programs
          const enVoices = voices.filter(v => v.lang.startsWith("en"));
          voice = enVoices.find(v => genderHints.some(h => v.name.toLowerCase().includes(h.toLowerCase())));
          if (!voice) voice = enVoices[0];
        }
        if (!voice) voice = langVoices[0] || voices.find(v => v.lang.startsWith("en")) || voices[0];
        if (voice) utter.voice = voice;
        utter.onend = () => { completed++; if (completed >= totalUtterances) setConciergeSpeaking(false); };
        utter.onerror = () => { completed++; if (completed >= totalUtterances) setConciergeSpeaking(false); };
        window.speechSynthesis.speak(utter);
      });
    };
    // Voices may load async — try immediately, retry if empty
    if (window.speechSynthesis.getVoices().length > 0) trySpeak();
    else { window.speechSynthesis.onvoiceschanged = trySpeak; setTimeout(trySpeak, 200); }
  }, []);

  const openConcierge = useCallback(async (program, type) => {
    window.speechSynthesis?.cancel();
    setConciergeProgram({ ...program, type });
    setConciergeMessages([]);
    setConciergeInput("");
    setConciergeLoading(true);
    setConciergeSpeaking(false);
    const tierInfo = (program.tiers || []).map(t => `${t.name}: requires ${t.threshold} ${program.unit}, perks: ${t.perks}`).join("\n");
    const vp = VOICE_PROFILES[program.id] || { accent: "professional", gender: "male" };
    const charRole = type === "hotel"
      ? (vp.gender === "female" ? "a warm, welcoming female hotel front desk concierge" : "a distinguished male hotel concierge")
      : (vp.gender === "female" ? "a confident, friendly female senior flight attendant" : "an experienced, charismatic male airline captain");
    const sysPrompt = `You are ${charRole} who is an expert on the ${program.name} loyalty program. Your personality reflects a ${vp.accent} background — use natural speech patterns, warmth, and occasional personality that fits your character. Your responses will be read aloud, so write in a natural spoken style: use contractions, conversational phrasing, and avoid bullet points or special characters. Keep responses concise (3-5 sentences max).

Program details:
- Name: ${program.name}
- Unit: ${program.unit}
- Tiers:\n${tierInfo}
${program.earnRate ? `- Earn rates: Domestic ${program.earnRate.domestic}x, International ${program.earnRate.international}x, Premium ${program.earnRate.premium}x` : ""}

Start by introducing yourself briefly in-character with personality, and give an engaging spoken overview of the program — what makes it special, the tier structure, and one insider tip. Write as you would naturally speak. Keep it under 5 sentences.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-5-20250929", max_tokens: 1000, system: sysPrompt, messages: [{ role: "user", content: "Please introduce yourself and give me an overview of this loyalty program." }] }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "Welcome! I'd be happy to tell you about this program.";
      setConciergeMessages([{ role: "assistant", content: text }]);
      speakText(text, program.id);
    } catch (e) {
      const fallback = `Welcome aboard! I'm your ${program.name} expert. This program has ${(program.tiers||[]).length} elite tiers earning ${program.unit}. The top tier, ${(program.tiers||[])[(program.tiers||[]).length-1]?.name}, offers incredible perks like ${(program.tiers||[])[(program.tiers||[]).length-1]?.perks}. Ask me anything about earning status, redeeming rewards, or maximizing your benefits!`;
      setConciergeMessages([{ role: "assistant", content: fallback }]);
      speakText(fallback, program.id);
    }
    setConciergeLoading(false);
  }, [speakText]);

  const sendConciergeMessage = useCallback(async () => {
    if (!conciergeInput.trim() || conciergeLoading || !conciergeProgram) return;
    const userMsg = conciergeInput.trim();
    setConciergeInput("");
    setConciergeMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setConciergeLoading(true);
    const prog = conciergeProgram;
    const tierInfo = (prog.tiers || []).map(t => `${t.name}: requires ${t.threshold} ${prog.unit}, perks: ${t.perks}`).join("\n");
    const vp2 = VOICE_PROFILES[prog.id] || { accent: "professional", gender: "male" };
    const role2 = prog.type === "hotel" ? (vp2.gender === "female" ? "a warm female hotel concierge" : "a distinguished male hotel concierge") : (vp2.gender === "female" ? "a friendly female flight attendant" : "an experienced male airline captain");
    const sysPrompt = `You are ${role2} expert on ${prog.name} with a ${vp2.accent} personality. Your responses will be read aloud, so write naturally as spoken word — use contractions, conversational phrasing, no bullet points or special characters. Be warm, concise (3-5 sentences), stay in character. Program: ${prog.name}, Unit: ${prog.unit}. Tiers:\n${tierInfo}\n${prog.earnRate ? `Earn rates: Dom ${prog.earnRate.domestic}x, Intl ${prog.earnRate.international}x, Prem ${prog.earnRate.premium}x` : ""}`;
    const history = [...conciergeMessages, { role: "user", content: userMsg }].map(m => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-5-20250929", max_tokens: 1000, system: sysPrompt, messages: history }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "I'd be happy to help with that!";
      setConciergeMessages(prev => [...prev, { role: "assistant", content: text }]);
      speakText(text, prog.id);
    } catch (e) {
      const fallback = "I'm having trouble connecting right now. Please try again in a moment!";
      setConciergeMessages(prev => [...prev, { role: "assistant", content: fallback }]);
      speakText(fallback, prog.id);
    }
    setConciergeLoading(false);
  }, [conciergeInput, conciergeLoading, conciergeProgram, conciergeMessages, speakText]);

  const EXPENSE_CATEGORIES = [
    { id: "flight", label: "Flights", icon: "—", color: "#3b82f6" },
    { id: "lodging", label: "Lodging", icon: "—", color: "#8b5cf6" },
    { id: "taxi", label: "Taxi", icon: "—", color: "#f59e0b" },
    { id: "biz_meals", label: "Biz Dev Meals", icon: "—", color: "#ef4444" },
    { id: "meals", label: "Meals", icon: "—", color: "#f97316" },
    { id: "conferences", label: "Conferences", icon: "—", color: "#0EA5A0" },
    { id: "supplies", label: "Supplies", icon: "—", color: "#10b981" },
    { id: "groceries", label: "Groceries", icon: "—", color: "#22c55e" },
    { id: "prof_dues", label: "Professional Dues", icon: "—", color: "#6366f1" },
    { id: "mobile", label: "Mobile/Data", icon: "—", color: "#8b5cf6" },
    { id: "travel_fees", label: "Travel Fees", icon: "—", color: "#06b6d4" },
    { id: "other", label: "Other", icon: "—", color: "#6b7280" },
  ];

  const SAMPLE_EXPENSES = [
    { id: 101, tripId: 1, category: "flight", description: "JFK→LAX Business Class", amount: 1850, currency: "USD", date: "2026-03-15", paymentMethod: "Amex Platinum", receipt: true, notes: "" },
    { id: 102, tripId: 2, category: "hotel", description: "JW Marriott LA Live — 3 nights", amount: 1290, currency: "USD", date: "2026-03-15", paymentMethod: "Chase Sapphire", receipt: true, notes: "Suite upgrade applied" },
    { id: 103, tripId: 1, category: "lounge", description: "Centurion Lounge JFK", amount: 0, currency: "USD", date: "2026-03-15", paymentMethod: "Amex Platinum", receipt: false, notes: "Complimentary" },
    { id: 104, tripId: 2, category: "dining", description: "Nobu Los Angeles", amount: 285, currency: "USD", date: "2026-03-16", paymentMethod: "Amex Platinum", receipt: true, notes: "Client dinner" },
    { id: 105, tripId: 2, category: "transport", description: "Uber LAX → Hotel", amount: 42, currency: "USD", date: "2026-03-15", paymentMethod: "Chase Sapphire", receipt: true, notes: "" },
    { id: 106, tripId: 2, category: "tips", description: "Hotel staff tips", amount: 60, currency: "USD", date: "2026-03-18", paymentMethod: "Cash", receipt: false, notes: "" },
    { id: 107, tripId: 4, category: "flight", description: "DFW→LHR First Class", amount: 4200, currency: "USD", date: "2026-04-10", paymentMethod: "Amex Platinum", receipt: true, notes: "Systemwide upgrade used" },
    { id: 108, tripId: 5, category: "hotel", description: "Waldorf Astoria London — 5 nights", amount: 3750, currency: "USD", date: "2026-04-10", paymentMethod: "Amex Platinum", receipt: true, notes: "" },
    { id: 109, tripId: 5, category: "dining", description: "Restaurant Gordon Ramsay", amount: 420, currency: "USD", date: "2026-04-12", paymentMethod: "Chase Sapphire", receipt: true, notes: "Business meal" },
    { id: 110, tripId: 6, category: "rental", description: "Hertz Premium SUV — 3 days", amount: 385, currency: "USD", date: "2026-04-10", paymentMethod: "Amex Platinum", receipt: true, notes: "" },
    { id: 111, tripId: 5, category: "transport", description: "Heathrow Express", amount: 55, currency: "USD", date: "2026-04-10", paymentMethod: "Chase Sapphire", receipt: true, notes: "" },
    { id: 112, tripId: 5, category: "shopping", description: "Harrods gifts", amount: 320, currency: "USD", date: "2026-04-13", paymentMethod: "Amex Platinum", receipt: true, notes: "Personal" },
  ];

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });
    setAuthLoading(false);
    if (error) { setAuthError(error.message); return; }
    setActiveView("dashboard");
    setPublicPage("app");
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    const { error } = await supabase.auth.signUp({
      email: registerForm.email,
      password: registerForm.password,
      options: { data: { name: registerForm.name } },
    });
    setAuthLoading(false);
    if (error) { setAuthError(error.message); return; }
    setAuthError("Check your email for a confirmation link, then sign in.");
  };

  const handleProfileSetup = async (e) => {
    if (e) e.preventDefault();
    const { firstName, lastName } = profileSetupForm;
    if (!firstName.trim() || !lastName.trim()) {
      setProfileSetupError("Please enter both your first and last name.");
      return;
    }
    setProfileSetupLoading(true);
    setProfileSetupError("");
    const { data, error } = await supabase.auth.updateUser({
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
      },
    });
    setProfileSetupLoading(false);
    if (error) { setProfileSetupError(error.message); return; }
    if (data?.user) setUser(data.user);
    setShowProfileSetup(false);
  };

  const handleLogout = async () => {
    // Set logged out state BEFORE signOut to prevent intermediate render with null user
    setIsLoggedIn(false);
    setUser(null);
    setTrips([]);
    setSharedTrips([]);
    setExpenses([]);
    setLinkedAccounts({});
    setShowSettings(false);
    setActiveView("dashboard");
    setPublicPage("login");
    await supabase.auth.signOut();
  };

  const openSettings = async () => {
    // Load additional forwarding emails
    let additionalEmails = [];
    if (user) {
      const { data } = await supabase.from("user_forwarding_addresses").select("email").eq("user_id", user.id);
      if (data) {
        additionalEmails = data.map(r => r.email).filter(e => e && e !== user.email);
      }
    }
    setSettingsForm(f => ({
      ...f,
      firstName: user?.user_metadata?.first_name || "",
      lastName: user?.user_metadata?.last_name || "",
      email: user?.email || "",
      homeAirport: user?.user_metadata?.home_airport || "",
      passportCountry: user?.user_metadata?.passport_country || "",
      defaultCurrency: user?.user_metadata?.default_currency || "USD",
      notifications: user?.user_metadata?.notifications || { statusMilestones: true, expiringMiles: true, newPrograms: false },
      additionalEmails,
    }));
    setSettingsMsg({ type: "", text: "" });
    setSettingsTab("profile");
    setShowSettings(true);
  };

  const saveProfile = async () => {
    setSettingsSaving(true); setSettingsMsg({ type: "", text: "" });
    const { data, error } = await supabase.auth.updateUser({ data: { first_name: settingsForm.firstName.trim(), last_name: settingsForm.lastName.trim(), name: `${settingsForm.firstName.trim()} ${settingsForm.lastName.trim()}` } });
    setSettingsSaving(false);
    if (error) { setSettingsMsg({ type: "error", text: error.message }); return; }
    if (data?.user) setUser(data.user);
    setSettingsMsg({ type: "success", text: "Profile updated." });
  };

  const saveEmail = async () => {
    setSettingsSaving(true); setSettingsMsg({ type: "", text: "" });
    const { error } = await supabase.auth.updateUser({ email: settingsForm.email.trim() });
    setSettingsSaving(false);
    if (error) { setSettingsMsg({ type: "error", text: error.message }); return; }
    setSettingsMsg({ type: "success", text: "Confirmation sent to new email — check your inbox." });
  };

  const savePassword = async () => {
    if (settingsForm.newPassword !== settingsForm.confirmPassword) { setSettingsMsg({ type: "error", text: "Passwords don't match." }); return; }
    if (settingsForm.newPassword.length < 6) { setSettingsMsg({ type: "error", text: "Password must be at least 6 characters." }); return; }
    setSettingsSaving(true); setSettingsMsg({ type: "", text: "" });
    const { error } = await supabase.auth.updateUser({ password: settingsForm.newPassword });
    setSettingsSaving(false);
    if (error) { setSettingsMsg({ type: "error", text: error.message }); return; }
    setSettingsForm(f => ({ ...f, newPassword: "", confirmPassword: "" }));
    setSettingsMsg({ type: "success", text: "Password updated." });
  };

  const savePreferences = async () => {
    setSettingsSaving(true); setSettingsMsg({ type: "", text: "" });
    const { data, error } = await supabase.auth.updateUser({ data: { home_airport: settingsForm.homeAirport.toUpperCase().trim(), passport_country: settingsForm.passportCountry.trim(), default_currency: settingsForm.defaultCurrency, notifications: settingsForm.notifications } });
    setSettingsSaving(false);
    if (error) { setSettingsMsg({ type: "error", text: error.message }); return; }
    if (data?.user) setUser(data.user);
    setSettingsMsg({ type: "success", text: "Preferences saved." });
  };

  // ── Earning calculation engine ──
  // Returns { statusCredits, redeemable, statusLabel, redeemLabel, breakdown }
  const calcTripEarnings = (trip) => {
    if (trip.type === "hotel") {
      const nights = parseInt(trip.nights) || 1;
      const hotelPointsPerNight = { marriott: 1000, hilton: 1500, hyatt: 500, ihg: 700, wyndham: 600, radisson: 400, bestwestern: 300, accor: 800, choice: 300 };
      const ptsPerNight = hotelPointsPerNight[trip.program] || 800;
      return { statusCredits: nights, redeemable: nights * ptsPerNight, statusLabel: `${nights} qualifying night${nights !== 1 ? "s" : ""}`, redeemLabel: `~${(nights * ptsPerNight).toLocaleString()} points`, breakdown: `${nights} nights × ${ptsPerNight.toLocaleString()} pts/night (avg rate)` };
    }
    if (trip.type === "rental") {
      return { statusCredits: 1, redeemable: 250, statusLabel: "1 qualifying rental", redeemLabel: "~250 pts", breakdown: "1 rental" };
    }

    // Flight earning — uses the same calcSegmentCredits engine as the Elite Status Calculator
    const operatingAirline = trip.program; // the airline operating the flight
    const creditAirline = trip.creditProgram || trip.program; // who we're crediting to
    const creditProg = LOYALTY_PROGRAMS.airlines.find(p => p.id === creditAirline);
    const price = parseFloat(trip.ticketPrice) || 0;
    const bc = trip.bookingClass ? trip.bookingClass.toUpperCase() : "";
    const cabin = (bc && getBookingClassCabin(operatingAirline, bc)) || trip.fareClass || "economy";

    // Calculate distance from route
    const airports = parseRoute(trip.route);
    const dist = airports.length >= 2 ? greatCircleMiles(airports[0], airports[airports.length - 1]) : 0;

    // Use calcSegmentCredits (same engine as Calculator tab)
    const credits = calcSegmentCredits(creditAirline, operatingAirline, cabin, dist, price, 0, bc);

    // Determine method label for breakdown
    const rates = PARTNER_EARN_RATES[creditAirline];
    const isOwn = creditAirline === operatingAirline;
    const partnerEntry = rates?.[operatingAirline] || {};
    const isFareBased = (isOwn && (rates?._type === "fare_own" || rates?._type === "revenue")) || partnerEntry._fare;
    const unit = creditProg?.unit || "miles";

    let breakdown = "";
    if (isFareBased) {
      breakdown = price > 0 ? `$${price.toLocaleString()} fare-based` : "Enter ticket price for calculation";
    } else if (dist > 0) {
      breakdown = `${dist.toLocaleString()} mi × ${cabin.replace(/_/g, " ")}${bc ? ` (${bc})` : ""}`;
    } else {
      breakdown = "Enter route for distance calculation";
    }

    const statusLabel = credits > 0 ? `~${credits.toLocaleString()} ${unit}` : (price === 0 && isFareBased ? "Enter fare" : dist === 0 ? "Enter route" : `0 ${unit}`);

    return { statusCredits: credits, redeemable: credits, statusLabel, redeemLabel: statusLabel, breakdown };
  };

  const [addTripError, setAddTripError] = useState("");
  const [editingTripId, setEditingTripId] = useState(null);
  const [segLookupState, setSegLookupState] = useState({}); // { [segIdx]: { loading, msg } }

  const lookupFlight = async (segIdx) => {
    const seg = newTrip.segments[segIdx];
    if (!seg) return;
    const fn = (seg.flightNumber || "").replace(/\s+/g, "").toUpperCase();
    const date = seg.date;
    const setMsg = (msg, loading = false) => setSegLookupState(p => ({ ...p, [segIdx]: { loading, msg } }));
    if (!fn) { setMsg("Enter a flight number first."); return; }
    if (!date) { setMsg("Enter the flight date first."); return; }
    const apiKey = import.meta.env.VITE_AERODATABOX_API_KEY;
    if (!apiKey || apiKey === "your_rapidapi_key_here") { setMsg("API key not configured."); return; }
    setSegLookupState(p => ({ ...p, [segIdx]: { loading: true, msg: "" } }));
    try {
      const res = await fetch(`https://aerodatabox.p.rapidapi.com/flights/number/${fn}/${date}`, {
        headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com" },
      });
      if (!res.ok) { setMsg(res.status === 404 ? "Flight not found. Check number and date." : `Lookup failed (${res.status}).`); return; }
      const data = await res.json();
      let flight = null;
      if (Array.isArray(data) && data.length > 0) {
        // Match by user-entered airports if available
        const userRoute = (seg.route || "").toUpperCase();
        const routeParts = userRoute.split(/[→\-–>\/]/).map(s => s.trim()).filter(s => /^[A-Z]{3}$/.test(s));
        const userDep = routeParts[0] || "";
        const userArr = routeParts[1] || "";
        if (userDep || userArr) {
          flight = data.find(f => {
            const fDep = (f.departure?.airport?.iata || "").toUpperCase();
            const fArr = (f.arrival?.airport?.iata || "").toUpperCase();
            if (userDep && userArr) return fDep === userDep && fArr === userArr;
            if (userDep) return fDep === userDep;
            if (userArr) return fArr === userArr;
            return false;
          });
        }
        if (!flight) flight = data[0];
        if (data.length > 1 && !flight) {
          setMsg(`Found ${data.length} routes for ${fn} — enter route to pick the right one`);
        }
      } else {
        flight = data;
      }
      if (!flight) { setMsg("No data returned for this flight."); return; }
      const dep = flight.departure || {};
      const arr = flight.arrival || {};
      const depIata = dep.airport?.iata || "";
      const arrIata = arr.airport?.iata || "";
      const depTime = dep.scheduledTime?.local?.slice(11, 16) || "";
      const arrTime = arr.scheduledTime?.local?.slice(11, 16) || "";
      const isIntl = depIata && arrIata && (dep.airport?.countryCode !== arr.airport?.countryCode);
      setNewTrip(p => ({
        ...p,
        segments: p.segments.map((s, i) => i !== segIdx ? s : {
          ...s,
          route: depIata && arrIata ? `${depIata} → ${arrIata}` : s.route,
          departureTime: depTime || s.departureTime,
          arrivalTime: arrTime || s.arrivalTime,
          departureTerminal: dep.terminal || s.departureTerminal,
          arrivalTerminal: arr.terminal || s.arrivalTerminal,
          class: isIntl ? "international" : s.class,
        }),
      }));
      const routeInfo = data.length > 1 ? ` (${data.length} routes found)` : "";
      setMsg(`Found: ${depIata} → ${arrIata}${flight.aircraft?.model ? ` · ${flight.aircraft.model}` : ""}${routeInfo}`);
    } catch (e) {
      setMsg("Lookup failed. Check your API key or try again.");
    }
  };

  // Resolve the effective arrival date for a flight leg.
  // Uses explicit arrivalDate if set (from API or manual entry).
  // Otherwise infers: if arrivalTime < departureTime, assume +1 day arrival.
  const resolveArrivalDate = (leg) => {
    if (leg.arrivalDate) return leg.arrivalDate;
    if (!leg.date) return "";
    if (leg.departureTime && leg.arrivalTime && leg.arrivalTime < leg.departureTime) {
      // Arrival time is before departure time → next-day arrival
      const d = new Date(leg.date + "T12:00:00");
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    }
    return leg.date; // same-day arrival
  };

  // Persist temp unit
  useEffect(() => { localStorage.setItem("continuum_temp_unit", tempUnit); }, [tempUnit]);

  // Weather code → { icon, label } — Open-Meteo WMO weather codes
  const weatherIcon = (code) => {
    if (code === 0) return { icon: "☀", label: "Clear" };
    if (code <= 3) return { icon: "⛅", label: "Cloudy" };
    if (code <= 48) return { icon: "🌫", label: "Fog" };
    if (code <= 55) return { icon: "🌦", label: "Drizzle" };
    if (code <= 65) return { icon: "🌧", label: "Rain" };
    if (code <= 75) return { icon: "🌨", label: "Snow" };
    if (code <= 82) return { icon: "🌧", label: "Showers" };
    if (code <= 99) return { icon: "⛈", label: "Storms" };
    return { icon: "—", label: "" };
  };

  // Resolve city for a given date in a trip's segments
  // Returns { city, airportCode } by tracking the traveler's location chronologically
  const resolveCityForDate = (allSegs, dateStr) => {
    // Sort all segments chronologically
    const sorted = [...allSegs].filter(s => !s._isMeta && s.date).sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.departureTime || a.startTime || "").localeCompare(b.departureTime || b.startTime || ""));
    let currentCity = "";
    let currentAirport = "";
    for (const seg of sorted) {
      if (seg.date > dateStr) break; // future segments don't affect this date
      if (seg.type === "flight") {
        const airports = (seg.route || "").split(/[→\-–>]/).map(s => s.trim()).filter(s => s.length >= 2);
        const depApt = seg.departureAirport || airports[0] || "";
        const arrApt = seg.arrivalAirport || airports[airports.length - 1] || "";
        const resolvedArr = resolveArrivalDate(seg);
        if (depApt || arrApt) {
          if (seg.date <= dateStr && depApt) currentAirport = depApt;
          if (resolvedArr && resolvedArr <= dateStr && arrApt) {
            currentAirport = arrApt;
            currentCity = "";
          } else if (!resolvedArr && seg.date <= dateStr && arrApt) {
            currentAirport = arrApt;
            currentCity = "";
          }
        }
      } else if (seg.type === "hotel" || seg.type === "accommodation") {
        if (seg.date <= dateStr) {
          const checkout = seg.checkoutDate || "";
          if (!checkout || checkout > dateStr) {
            currentCity = (seg.location ? seg.location.split(",")[0].trim() : "") || (seg.property ? seg.property.replace(/^(Grand |The |Hotel |Sheraton |Hyatt |Marriott |Hilton |Ritz-Carlton |Four Seasons |W |St\. Regis |Residence Inn |Courtyard |Hampton Inn |Holiday Inn |Fairfield |SpringHill |TownePlace )/i, "").split(/\s+by\s+/i)[0].trim() : "") || "";
          }
        }
      } else {
        if (seg.date === dateStr && (seg.location || seg.activityName)) {
          currentCity = seg.location || seg.city || "";
        }
      }
    }
    return { city: currentCity, airportCode: currentAirport };
  };

  // Resolve which hotel the user is staying at on a given date
  const resolveHotelForDate = (allSegs, dateStr) => {
    const hotels = allSegs.filter(s => (s.type === "hotel" || s.type === "accommodation") && s.date);
    for (const seg of hotels) {
      const checkin = seg.date;
      const checkinDate = new Date(checkin + "T12:00:00");
      const checkout = seg.checkoutDate || (() => {
        const n = parseInt(seg.nights) || 1;
        const d = new Date(checkinDate.getTime() + n * 86400000);
        return d.toISOString().slice(0, 10);
      })();
      // Guest is at the hotel from check-in date up to (but not including) checkout date
      if (dateStr >= checkin && dateStr < checkout) {
        return { name: seg.property || "Hotel", location: seg.location || "", seg };
      }
    }
    return null;
  };

  // Determine the primary city for a trip (where the most days are spent)
  // Determine the primary city and its theme for a trip
  const getPrimaryCityTheme = (trip) => {
    const realSegs = (trip?.segments || []).filter(s => !s._isMeta);
    if (realSegs.length === 0) {
      const loc = trip?.location || "";
      const match = Object.keys(CITY_THEMES).find(c => c !== "_fallback" && loc.toLowerCase().includes(c.toLowerCase()));
      return { theme: CITY_THEMES[match] || CITY_THEMES._fallback, city: match || loc || "" };
    }
    const dates = realSegs.map(s => s.date).filter(Boolean).sort();
    const endDates = realSegs.map(s => s.checkoutDate || s.date).filter(Boolean).sort();
    const startStr = dates[0];
    const endStr = endDates[endDates.length - 1] || dates[dates.length - 1];
    if (!startStr) return { theme: CITY_THEMES._fallback, city: "" };
    const cityDays = {};
    const d = new Date(startStr + "T12:00:00");
    const end = new Date(endStr + "T12:00:00");
    let safety = 0;
    while (d <= end && safety < 365) {
      const ds = d.toISOString().slice(0, 10);
      const hotel = resolveHotelForDate(realSegs, ds);
      const city = resolveCityForDate(realSegs, ds);
      let key = "";
      if (hotel?.location) key = hotel.location;
      else if (city.airportCode && AIRPORT_CITY[city.airportCode]) key = AIRPORT_CITY[city.airportCode];
      else if (city.city) key = city.city;
      if (key) {
        const match = Object.keys(CITY_THEMES).find(c => c !== "_fallback" && key.toLowerCase().includes(c.toLowerCase()));
        if (match) cityDays[match] = (cityDays[match] || 0) + 1;
        else cityDays[key] = (cityDays[key] || 0) + 1;
      }
      d.setDate(d.getDate() + 1);
      safety++;
    }
    const top = Object.entries(cityDays).sort((a, b) => b[1] - a[1])[0];
    if (top) return { theme: CITY_THEMES[top[0]] || CITY_THEMES._fallback, city: top[0] };
    return { theme: CITY_THEMES._fallback, city: trip?.location || "" };
  };

  // Fetch weather for a city/airport — uses Open-Meteo (free, no key)
  // For dates >14 days out, uses historical data from same dates last year as approximation
  const fetchWeather = async (cityOrAirport, dateStr) => {
    const cacheKey = `${cityOrAirport}_${dateStr}`;
    try {
      // Geocode — try multiple query strategies for best match
      const queries = [];
      if (cityOrAirport.length === 3 && cityOrAirport === cityOrAirport.toUpperCase()) {
        queries.push(`${cityOrAirport} airport`);
      } else {
        // Try as-is first, then strip common hotel brand prefixes to extract city
        queries.push(cityOrAirport);
        const stripped = cityOrAirport.replace(/^(Grand |The |Hotel |Sheraton |Hyatt |Marriott |Hilton |Ritz-Carlton |Four Seasons |W |St\. Regis |Mandarin Oriental |Peninsula |Fairmont |Westin |Conrad |Intercontinental |Shangri-La |Regent |Novotel |Sofitel |Park Hyatt |Andaz |Aloft |Courtyard |Residence Inn )/i, "").trim();
        if (stripped !== cityOrAirport) queries.push(stripped);
      }
      let geoData = null;
      for (const query of queries) {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en`);
        geoData = await geoRes.json();
        if (geoData.results?.length > 0) break;
      }
      if (!geoData?.results?.length) return null;
      const { latitude, longitude, name } = geoData.results[0];
      // Check if date is within forecast range (~14 days)
      const daysOut = Math.ceil((new Date(dateStr + "T12:00:00") - new Date()) / 86400000);
      let wxData;
      let isHistorical = false;
      if (daysOut <= 14 && daysOut >= -1) {
        // Use forecast API
        const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`);
        wxData = await wxRes.json();
      }
      if (!wxData?.daily?.time?.length) {
        // Use historical API — same dates from last year as typical weather
        isHistorical = true;
        const targetDate = new Date(dateStr + "T12:00:00");
        const lastYear = new Date(targetDate);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        const histDate = lastYear.toISOString().slice(0, 10);
        const wxRes = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&start_date=${histDate}&end_date=${histDate}`);
        wxData = await wxRes.json();
      }
      if (!wxData?.daily?.time?.length) return null;
      const result = {
        high: wxData.daily.temperature_2m_max[0],
        low: wxData.daily.temperature_2m_min[0],
        code: wxData.daily.weather_code?.[0] ?? wxData.daily.weathercode?.[0] ?? 0,
        cityName: name,
        isHistorical,
      };
      setWeatherCache(prev => ({ ...prev, [cacheKey]: result }));
      return result;
    } catch {
      return null;
    }
  };

  // Flight leg lookup
  const lookupFlightLeg = async (legIdx) => {
    const leg = flightLegs[legIdx];
    if (!leg) return;
    const fn = (leg.flightNumber || "").replace(/\s+/g, "").toUpperCase();
    const date = leg.date;
    if (!fn) { setFlightLegs(l => l.map((g, i) => i === legIdx ? { ...g, lookupMsg: "Enter flight number" } : g)); return; }
    if (!date) { setFlightLegs(l => l.map((g, i) => i === legIdx ? { ...g, lookupMsg: "Enter date first" } : g)); return; }
    const apiKey = import.meta.env.VITE_AERODATABOX_API_KEY;
    if (!apiKey) { setFlightLegs(l => l.map((g, i) => i === legIdx ? { ...g, lookupMsg: "API key not configured" } : g)); return; }
    setFlightLegs(l => l.map((g, i) => i === legIdx ? { ...g, lookupMsg: "Looking up..." } : g));
    try {
      const res = await fetch(`https://aerodatabox.p.rapidapi.com/flights/number/${fn}/${date}`, {
        headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com" },
      });
      if (!res.ok) { setFlightLegs(l => l.map((g, i) => i === legIdx ? { ...g, lookupMsg: res.status === 404 ? "Not found" : `Error ${res.status}` } : g)); return; }
      const data = await res.json();
      let flight = null;
      if (Array.isArray(data) && data.length > 0) {
        const userDep = (leg.departureAirport || "").toUpperCase();
        const userArr = (leg.arrivalAirport || "").toUpperCase();
        // Try exact match first
        if (userDep || userArr) {
          flight = data.find(f => {
            const fDep = (f.departure?.airport?.iata || "").toUpperCase();
            const fArr = (f.arrival?.airport?.iata || "").toUpperCase();
            if (userDep && userArr) return fDep === userDep && fArr === userArr;
            if (userDep) return fDep === userDep;
            if (userArr) return fArr === userArr;
            return false;
          });
        }
        // If multiple routes and no exact match, show selector
        if (!flight && data.length > 1) {
          const options = data.map(f => ({
            dep: f.departure?.airport?.iata || "?",
            arr: f.arrival?.airport?.iata || "?",
            depTime: (f.departure?.scheduledTime?.local || "").slice(11, 16),
            arrTime: (f.arrival?.scheduledTime?.local || "").slice(11, 16),
            aircraft: f.aircraft?.model || "",
            raw: f,
          }));
          setFlightRouteOptions(prev => ({ ...prev, [legIdx]: options }));
          setFlightLegs(l => l.map((g, i) => i === legIdx ? { ...g, lookupMsg: `${data.length} routes found — select yours below` } : g));
          return;
        }
        if (!flight) flight = data[0];
      } else {
        flight = data;
      }
      if (!flight) { setFlightLegs(l => l.map((g, i) => i === legIdx ? { ...g, lookupMsg: "No data" } : g)); return; }
      setFlightRouteOptions(prev => { const n = { ...prev }; delete n[legIdx]; return n; });
      const dep = flight.departure || {};
      const arr = flight.arrival || {};
      // Parse local times for display
      const depLocal = dep.scheduledTime?.local || "";
      const arrLocal = arr.scheduledTime?.local || "";
      const depUtcStr = dep.scheduledTime?.utc || "";
      const arrUtcStr = arr.scheduledTime?.utc || "";
      const parseLocalTime = (s) => s ? s.replace("T", " ").slice(11, 16) : "";
      const arrTimeStr = parseLocalTime(arrLocal);
      const depTimeStr = parseLocalTime(depLocal);

      // Compute correct arrival date using UTC arrival time + local arrival time
      // Since timezone offsets are bounded (-12h to +14h), there is exactly one valid
      // candidate date where (candidateDate + arrLocalTime) - arrUTC is a valid offset.
      let arrDateStr = "";
      if (arrUtcStr && arrTimeStr) {
        const parseUtc = (s) => new Date(s.replace(" ", "T").replace(/([^Z])$/, "$1Z").replace(/TZ$/, "T00:00Z"));
        const arrUtcDate = parseUtc(arrUtcStr);
        const arrUtcMs = arrUtcDate.getTime();
        if (!isNaN(arrUtcMs)) {
          // Try candidate dates: same as UTC date, +1 day, -1 day
          for (const dayOff of [0, 1, -1]) {
            const candidate = new Date(arrUtcDate);
            candidate.setUTCDate(candidate.getUTCDate() + dayOff);
            const candidateDateStr = candidate.toISOString().slice(0, 10);
            // What would the timezone offset be if arrival local date were this candidate?
            const candidateLocalMs = new Date(`${candidateDateStr}T${arrTimeStr}:00Z`).getTime();
            const offsetHours = (candidateLocalMs - arrUtcMs) / 3600000;
            // Valid timezone offset range: UTC-12 to UTC+14
            if (offsetHours >= -12 && offsetHours <= 14) {
              arrDateStr = candidateDateStr;
              break;
            }
          }
        }
      }
      // Fallback: use local string date or departure date if nothing computed
      if (!arrDateStr) {
        arrDateStr = (arrLocal ? arrLocal.replace("T", " ").slice(0, 10) : "") || leg.date || "";
      }
      // FINAL SAFETY: if arrival time < departure time, this is an overnight flight.
      // Regardless of what UTC computation or API returned, if arrDateStr is still
      // the same as departure date, it MUST be wrong — force +1 day.
      if (depTimeStr && arrTimeStr && arrTimeStr < depTimeStr && arrDateStr === leg.date) {
        const nextDay = new Date(leg.date + "T12:00:00");
        nextDay.setDate(nextDay.getDate() + 1);
        arrDateStr = nextDay.toISOString().slice(0, 10);
      }
      console.log("[FlightLookup] depUTC:", depUtcStr, "arrUTC:", arrUtcStr, "depTime:", depTimeStr, "arrTime:", arrTimeStr, "→ arrDateStr:", arrDateStr);
      setFlightLegs(l => l.map((g, i) => i === legIdx ? {
        ...g,
        departureAirport: dep.airport?.iata || g.departureAirport,
        arrivalAirport: arr.airport?.iata || g.arrivalAirport,
        departureTime: depTimeStr || g.departureTime,
        arrivalTime: arrTimeStr || g.arrivalTime,
        arrivalDate: arrDateStr || g.arrivalDate || "",
        departureTerminal: dep.terminal || g.departureTerminal,
        arrivalTerminal: arr.terminal || g.arrivalTerminal,
        airline: flight.airline?.name || g.airline,
        aircraft: flight.aircraft?.model || g.aircraft,
        lookupMsg: `Found: ${dep.airport?.iata || "?"} → ${arr.airport?.iata || "?"}${flight.aircraft?.model ? ` · ${flight.aircraft.model}` : ""}`,
      } : g));
    } catch {
      setFlightLegs(l => l.map((g, i) => i === legIdx ? { ...g, lookupMsg: "Lookup failed" } : g));
    }
  };

  // Apply a selected route from the multi-route picker
  const applyFlightRouteOption = (legIdx, option) => {
    const flight = option.raw;
    const dep = flight.departure || {};
    const arr = flight.arrival || {};
    const depLocal = dep.scheduledTime?.local || "";
    const arrLocal = arr.scheduledTime?.local || "";
    const depUtcStr = dep.scheduledTime?.utc || "";
    const arrUtcStr = arr.scheduledTime?.utc || "";
    const parseLocalTime = (s) => s ? s.replace("T", " ").slice(11, 16) : "";
    const arrTimeStr = parseLocalTime(arrLocal);
    const depTimeStr = parseLocalTime(depLocal);
    let arrDateStr = "";
    if (arrUtcStr && arrTimeStr) {
      const parseUtc = (s) => new Date(s.replace(" ", "T").replace(/([^Z])$/, "$1Z").replace(/TZ$/, "T00:00Z"));
      const arrUtcDate = parseUtc(arrUtcStr);
      const arrUtcMs = arrUtcDate.getTime();
      if (!isNaN(arrUtcMs)) {
        for (const dayOff of [0, 1, -1]) {
          const candidate = new Date(arrUtcDate);
          candidate.setUTCDate(candidate.getUTCDate() + dayOff);
          const candidateDateStr = candidate.toISOString().slice(0, 10);
          const candidateLocalMs = new Date(`${candidateDateStr}T${arrTimeStr}:00Z`).getTime();
          const offsetHours = (candidateLocalMs - arrUtcMs) / 3600000;
          if (offsetHours >= -12 && offsetHours <= 14) { arrDateStr = candidateDateStr; break; }
        }
      }
    }
    if (!arrDateStr) arrDateStr = (arrLocal ? arrLocal.slice(0, 10) : "") || flightLegs[legIdx]?.date || "";
    if (depTimeStr && arrTimeStr && arrTimeStr < depTimeStr && arrDateStr === flightLegs[legIdx]?.date) {
      const nextDay = new Date(flightLegs[legIdx].date + "T12:00:00");
      nextDay.setDate(nextDay.getDate() + 1);
      arrDateStr = nextDay.toISOString().slice(0, 10);
    }
    setFlightLegs(l => l.map((g, i) => i === legIdx ? {
      ...g,
      departureAirport: dep.airport?.iata || g.departureAirport,
      arrivalAirport: arr.airport?.iata || g.arrivalAirport,
      departureTime: depTimeStr || g.departureTime,
      arrivalTime: arrTimeStr || g.arrivalTime,
      arrivalDate: arrDateStr || g.arrivalDate,
      departureTerminal: dep.terminal || g.departureTerminal,
      arrivalTerminal: arr.terminal || g.arrivalTerminal,
      airline: flight.airline?.name || g.airline,
      aircraft: flight.aircraft?.model || g.aircraft,
      lookupMsg: `Selected: ${dep.airport?.iata || "?"} → ${arr.airport?.iata || "?"}`,
    } : g));
    setFlightRouteOptions(prev => { const n = { ...prev }; delete n[legIdx]; return n; });
  };

  const openEditTrip = (trip) => {
    setEditingTripId(trip.id);
    // Get end date from metadata
    const meta = trip.segments?.find(s => s._isMeta);
    const endDate = meta?._endDate || trip._endDate || "";
    setCreateTripForm({
      name: trip.tripName || trip.trip_name || "",
      destination: trip.location || trip.route || "",
      startDate: trip.date || "",
      endDate: endDate,
      status: trip.status || "planned",
    });
    setShowCreateTrip(true);
  };

  const resetTripModal = () => {
    setShowAddTrip(false);
    setAddTripError("");
    setEditingTripId(null);
    setSegLookupState({});
    setNewTrip({ tripName: "", status: "planned", segments: [defaultSegment()] });
  };

  // ── New simplified trip creation ──
  const handleCreateTrip = async () => {
    if (!createTripForm.name.trim()) return;
    const payload = {
      trip_name: createTripForm.name.trim(),
      status: createTripForm.status || "planned",
      date: createTripForm.startDate || new Date().toISOString().slice(0, 10),
      location: createTripForm.destination || "",
    };

    // Store end_date in segments metadata
    const tripMeta = { _endDate: createTripForm.endDate || "" };

    if (user && editingTripId) {
      // EDIT existing trip — preserve existing segments, add/update metadata
      const existingTrip = trips.find(t => t.id === editingTripId);
      const existingSegs = existingTrip?.segments || [];
      const updatedSegs = existingSegs.filter(s => !s._isMeta);
      updatedSegs.unshift({ _isMeta: true, ...tripMeta });
      console.log("[EditTrip] Updating trip:", editingTripId, "payload:", payload, "segs:", updatedSegs.length);
      const { error, data: updateData } = await supabase.from("trips").update({ ...payload, segments: updatedSegs }).eq("id", editingTripId).eq("user_id", user.id).select();
      console.log("[EditTrip] Result:", error, updateData);
      if (!error) {
        setTrips(prev => prev.map(t => t.id === editingTripId ? { ...t, tripName: payload.trip_name, status: payload.status, date: payload.date, location: payload.location, segments: updatedSegs, _endDate: createTripForm.endDate } : t));
        setShowCreateTrip(false);
        setEditingTripId(null);
        setCreateTripForm({ name: "", destination: "", startDate: "", endDate: "", status: "planned" });
      }
    } else if (user) {
      // CREATE new trip
      const { data, error } = await supabase.from("trips").insert({ user_id: user.id, type: "flight", program: "aa", route: payload.location, segments: [{ _isMeta: true, ...tripMeta }], estimated_points: 0, ...payload }).select().single();
      if (error) console.error("Create trip error:", error);
      if (!error && data) {
        const trip = { id: data.id, tripName: data.trip_name, status: data.status, date: data.date, type: data.type, program: data.program, route: data.route, location: data.location, segments: data.segments || [], estimatedPoints: data.estimated_points || 0 };
        setTrips(prev => [...prev, trip]);
        setShowCreateTrip(false);
        setEditingTripId(null);
        setCreateTripForm({ name: "", destination: "", startDate: "", endDate: "", status: "planned" });
        setTripDetailId(data.id);
        setTripDetailSegIdx(0);
        setActiveView("trips");
      }
    } else {
      const localTrip = { id: crypto.randomUUID(), tripName: createTripForm.name.trim(), status: createTripForm.status, date: createTripForm.startDate || new Date().toISOString().slice(0, 10), location: createTripForm.destination, segments: [] };
      setTrips(prev => [...prev, localTrip]);
      setShowCreateTrip(false);
      setEditingTripId(null);
      setCreateTripForm({ name: "", destination: "", startDate: "", endDate: "", status: "planned" });
      setTripDetailId(localTrip.id);
      setActiveView("trips");
    }
  };

  // ── Add segment to existing trip ──
  const handleAddSegmentToTrip = async (tripId) => {
    if (!addSegmentType) return;
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    let newSegs = [];

    if (addSegmentType === "flight") {
      // Multi-leg flight — each leg becomes a segment
      // Only multi-city legs get a shared _bookingGroup for layover display
      const validLegs = flightLegs.filter(l => l.flightNumber || l.departureAirport);
      const bookingGroup = flightType === "multicity" && validLegs.length > 1 ? crypto.randomUUID() : null;
      validLegs.forEach((leg, i) => {
        const nextLeg = validLegs[i + 1];
        let layoverInfo = "";
        if (flightType === "multicity" && nextLeg && leg.arrivalTime && nextLeg.departureTime) {
          const arrDateStr = resolveArrivalDate(leg);
          const depDateStr = nextLeg.date;
          if (arrDateStr && depDateStr) {
            const arrDt = new Date(`${arrDateStr}T${leg.arrivalTime}:00`);
            const depDt = new Date(`${depDateStr}T${nextLeg.departureTime}:00`);
            const diffMs = depDt - arrDt;
            if (diffMs > 0) {
              const totalMins = Math.round(diffMs / 60000);
              const days = Math.floor(totalMins / 1440);
              const hrs = Math.floor((totalMins % 1440) / 60);
              const mins = totalMins % 60;
              let dur = "";
              if (days > 0) dur += `${days}d `;
              if (hrs > 0) dur += `${hrs}h `;
              if (mins > 0 && days === 0) dur += `${mins}m`;
              layoverInfo = `${dur.trim()} layover at ${leg.arrivalAirport || "?"}`;
            }
          }
        }
        newSegs.push({
          ...defaultSegment(),
          _id: crypto.randomUUID(),
          type: "flight",
          flightNumber: leg.flightNumber,
          route: `${leg.departureAirport || "?"} → ${leg.arrivalAirport || "?"}`,
          date: leg.date,
          arrivalDate: leg.arrivalDate || "",
          departureTime: leg.departureTime,
          arrivalTime: leg.arrivalTime,
          departureTerminal: leg.departureTerminal,
          arrivalTerminal: leg.arrivalTerminal,
          airline: leg.airline,
          aircraft: leg.aircraft,
          fareClass: segmentForm.fareClass || "",
          bookingClass: segmentForm.bookingClass || "",
          seat: segmentForm.seat || "",
          confirmationCode: segmentForm.confirmationCode || "",
          ticketPrice: segmentForm.ticketPrice || "",
          currency: segmentForm.currency || "USD",
          notes: segmentForm.notes || "",
          _bookingGroup: bookingGroup,
        });
      });
    } else {
      // Non-flight segment
      // Calculate nights for accommodation — always derive from dates if available
      let nights = 1;
      if ((addSegmentType === "accommodation") && segmentForm.date && segmentForm.checkoutDate) {
        const ci = new Date(segmentForm.date + "T12:00:00");
        const co = new Date(segmentForm.checkoutDate + "T12:00:00");
        const diff = Math.round((co - ci) / 86400000);
        if (diff > 0) nights = diff;
      } else if (segmentForm.nights) {
        nights = parseInt(segmentForm.nights) || 1;
      }
      newSegs.push({
        ...defaultSegment(),
        _id: crypto.randomUUID(),
        type: addSegmentType === "accommodation" ? "hotel" : addSegmentType,
        ...segmentForm,
        nights: nights || segmentForm.nights || 1,
        property: segmentForm.property || segmentForm.restaurantName || segmentForm.loungeName || segmentForm.activityName || "",
        route: segmentForm.route || (segmentForm.departureStation && segmentForm.arrivalStation ? `${segmentForm.departureStation} → ${segmentForm.arrivalStation}` : "") || (segmentForm.departurePort && segmentForm.arrivalPort ? `${segmentForm.departurePort} → ${segmentForm.arrivalPort}` : "") || "",
        location: segmentForm.location || segmentForm.pickupLocation || segmentForm.airport || "",
        flightNumber: segmentForm.trainNumber || "",
      });
    }

    const existingSegs = trip.segments && trip.segments.length > 0 ? [...trip.segments] : [];
    let mergedSegs;
    if (editingSegIdx !== null) {
      // Replace the edited segment(s)
      const realSegs = existingSegs.filter(s => !s._isMeta);
      const metaSegs = existingSegs.filter(s => s._isMeta);
      realSegs.splice(editingSegIdx, 1, ...newSegs);
      mergedSegs = [...metaSegs, ...realSegs].sort((a, b) => {
        if (a._isMeta) return -1; if (b._isMeta) return 1;
        return (a.date || "9999").localeCompare(b.date || "9999");
      });
    } else {
      mergedSegs = [...existingSegs, ...newSegs].sort((a, b) => {
        if (a._isMeta) return -1; if (b._isMeta) return 1;
        return (a.date || "9999").localeCompare(b.date || "9999");
      });
    }
    if (user) {
      await supabase.from("trips").update({ segments: mergedSegs }).eq("id", tripId).eq("user_id", user.id);
      setTrips(prev => prev.map(t => t.id === tripId ? { ...t, segments: mergedSegs } : t));
    }
    setShowAddSegment(null);
    setAddSegmentType(null);
    setSegmentForm({});
    setFlightLegs([{ id: 1, flightNumber: "", date: "", arrivalDate: "", departureTime: "", arrivalTime: "", departureAirport: "", arrivalAirport: "", departureTerminal: "", arrivalTerminal: "", airline: "", aircraft: "", lookupMsg: "" }]);
    setEditingSegIdx(null);
  };

  // Edit an existing segment — opens the add form pre-filled
  const editSegment = (tripId, segIdx) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;
    const realSegs = (trip.segments || []).filter(s => !s._isMeta);
    const seg = realSegs[segIdx];
    if (!seg) return;

    setShowAddSegment(tripId);
    setEditingSegIdx(segIdx);

    const segType = seg.type === "hotel" ? "accommodation" : seg.type || "flight";
    setAddSegmentType(segType);

    if (segType === "flight" || seg.type === "flight") {
      // Pre-fill flight leg
      const airports = (seg.route || "").split("→").map(s => s.trim());
      setFlightType("oneway");
      setFlightLegs([{
        id: 1, flightNumber: seg.flightNumber || "", date: seg.date || "",
        departureTime: seg.departureTime || "", arrivalTime: seg.arrivalTime || "",
        departureAirport: airports[0] || "", arrivalAirport: airports[1] || "",
        departureTerminal: seg.departureTerminal || "", arrivalTerminal: seg.arrivalTerminal || "",
        airline: seg.airline || "", aircraft: seg.aircraft || "", lookupMsg: "",
      }]);
      setSegmentForm({
        fareClass: seg.fareClass || "", bookingClass: seg.bookingClass || "",
        seat: seg.seat || "", confirmationCode: seg.confirmationCode || "",
        ticketPrice: seg.ticketPrice || seg.cost || "", notes: seg.notes || "",
      });
    } else {
      // Pre-fill non-flight segment
      setSegmentForm({ ...seg });
    }
  };

  // Delete a segment from a trip
  const deleteSegment = async (tripId, segIdx) => {
    const trip = [...trips, ...sharedTrips].find(t => t.id === tripId);
    if (!trip) return;
    const realSegs = (trip.segments || []).filter(s => !s._isMeta);
    const metaSegs = (trip.segments || []).filter(s => s._isMeta);
    const updated = [...metaSegs, ...realSegs.filter((_, i) => i !== segIdx)];
    if (trip._shared) {
      setSharedTrips(prev => prev.map(t => t.id === tripId ? { ...t, segments: updated } : t));
      if (user) fetch("/api/shared-trips", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, userId: user.id, userEmail: user.email, payload: { segments: updated } }),
      }).then();
    } else if (user) {
      setTrips(prev => prev.map(t => t.id === tripId ? { ...t, segments: updated } : t));
      supabase.from("trips").update({ segments: updated }).eq("id", tripId).eq("user_id", user.id).then();
    }
  };

  const handleAddTrip = async () => {
    setAddTripError("");
    const segments = newTrip.segments.map(seg => {
      let estimatedPoints = 0, estimatedNights = 0;
      if (seg.type === "flight") { const { statusCredits } = calcTripEarnings(seg); estimatedPoints = statusCredits; }
      else if (seg.type === "hotel") {
        const nights = (seg.checkoutDate && seg.date && seg.checkoutDate > seg.date)
          ? Math.round((new Date(seg.checkoutDate) - new Date(seg.date)) / 86400000)
          : parseInt(seg.nights) || 1;
        estimatedNights = nights;
      }
      return { ...seg, estimatedPoints, estimatedNights };
    }).sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
    const totalPoints = segments.reduce((s, seg) => s + (seg.estimatedPoints || 0), 0);
    const totalNights = segments.reduce((s, seg) => s + (seg.estimatedNights || 0), 0);
    const firstSeg = segments[0] || {};
    const firstDate = segments.map(s => s.date).filter(Boolean).sort()[0] || "";
    const payload = {
      trip_name: newTrip.tripName,
      status: newTrip.status,
      date: firstDate,
      type: firstSeg.type || "flight",
      program: firstSeg.program || "aa",
      route: firstSeg.route || null,
      class: firstSeg.class || null,
      nights: firstSeg.nights ? parseInt(firstSeg.nights) : null,
      property: firstSeg.property || null,
      location: firstSeg.location || null,
      flight_number: firstSeg.flightNumber || null,
      departure_time: firstSeg.departureTime || null,
      arrival_time: firstSeg.arrivalTime || null,
      departure_terminal: firstSeg.departureTerminal || null,
      arrival_terminal: firstSeg.arrivalTerminal || null,
      fare_class: firstSeg.fareClass || null,
      booking_class: firstSeg.bookingClass || null,
      ticket_price: firstSeg.ticketPrice ? parseFloat(firstSeg.ticketPrice) : null,
      estimated_points: totalPoints,
      estimated_nights: totalNights,
      segments: segments,
    };
    if (editingTripId) {
      // Check if this is a shared trip being edited
      const editingTrip = [...trips, ...sharedTrips].find(t => t.id === editingTripId);
      const isSharedEdit = editingTrip?._shared;
      if (isSharedEdit) {
        // Optimistic: update sharedTrips state
        setSharedTrips(prev => prev.map(t => t.id === editingTripId ? { ...t, ...newTrip, segments, estimatedPoints: totalPoints, estimatedNights: totalNights, tripName: newTrip.tripName, status: newTrip.status, date: firstDate } : t));
        // Persist via service-role API (RLS blocks direct writes for non-owners)
        if (user) fetch("/api/shared-trips", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tripId: editingTripId, userId: user.id, userEmail: user.email, payload }),
        }).then();
      } else {
        setTrips(prev => prev.map(t => t.id === editingTripId ? { ...t, ...newTrip, segments, estimatedPoints: totalPoints, estimatedNights: totalNights, tripName: newTrip.tripName, status: newTrip.status, date: firstDate, id: editingTripId } : t));
        if (user) supabase.from("trips").update(payload).eq("id", editingTripId).eq("user_id", user.id).then();
      }
    } else {
      if (user) {
        const { data, error } = await supabase.from("trips").insert({ user_id: user.id, ...payload }).select().single();
        if (error) { console.error("Add trip error:", error); setAddTripError(error.message || "Failed to save trip. Please try again."); return; }
        setTrips(prev => [...prev, { ...newTrip, segments, estimatedPoints: totalPoints, estimatedNights: totalNights, tripName: newTrip.tripName, status: newTrip.status, date: firstDate, id: data.id }]);
      } else {
        setTrips(prev => [...prev, { ...newTrip, segments, estimatedPoints: totalPoints, estimatedNights: totalNights, tripName: newTrip.tripName, status: newTrip.status, date: firstDate, id: Date.now() }]);
      }
    }
    resetTripModal();
  };

  const removeTrip = (id) => {
    showConfirm("Are you sure you want to delete this trip? This cannot be undone.", async () => {
      setTrips(prev => prev.filter(t => t.id !== id));
      if (user) await supabase.from("trips").delete().eq("id", id).eq("user_id", user.id);
    });
  };

  // ── Itinerary parser ──
  // Parse .eml MIME file — extract text/plain from base64-encoded MIME parts
  const parseEmlFile = (raw) => {
    // Find MIME boundary
    const boundaryMatch = raw.match(/boundary="?([^"\r\n]+)"?/i);
    if (!boundaryMatch) {
      return raw.replace(/=\r?\n/g, "").replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))).replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
    }

    const lines = raw.split(/\r?\n/);
    let textContent = "";

    // Scan for Content-Type: text/plain MIME section
    for (let i = 0; i < lines.length; i++) {
      if (!/Content-Type:\s*text\/plain/i.test(lines[i])) continue;
      // Check nearby lines for base64 encoding indicator
      const nearby = lines.slice(Math.max(0, i - 2), i + 3).join(" ");
      const isBase64 = /base64/i.test(nearby);
      // Skip to blank line (end of MIME part headers)
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== "") j++;
      j++; // skip the blank line
      // Collect body lines until next boundary or end
      const bodyLines = [];
      while (j < lines.length && !lines[j].startsWith("--")) {
        bodyLines.push(lines[j].trim());
        j++;
      }
      const bodyStr = bodyLines.join("");

      if (isBase64 && bodyStr.length > 10) {
        try {
          // Decode base64 → binary string → UTF-8 via Uint8Array + TextDecoder
          const bin = atob(bodyStr);
          const arr = new Uint8Array(bin.length);
          for (let k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k);
          textContent = new TextDecoder("utf-8").decode(arr);
        } catch (e) {
          // If atob fails, try removing any non-base64 chars
          try {
            const cleaned = bodyStr.replace(/[^A-Za-z0-9+/=]/g, "");
            const bin = atob(cleaned);
            const arr = new Uint8Array(bin.length);
            for (let k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k);
            textContent = new TextDecoder("utf-8").decode(arr);
          } catch { textContent = bodyLines.join("\n"); }
        }
      } else {
        textContent = bodyLines.join("\n").replace(/=\r?\n/g, "").replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      }
      if (textContent) break;
    }

    // Also try to find JSON-LD structured data (schema.org) in the HTML part
    // Many airlines embed FlightReservation / LodgingReservation as JSON-LD
    let jsonLdData = null;
    const htmlPart = (() => {
      for (let i = 0; i < lines.length; i++) {
        if (!/Content-Type:\s*text\/html/i.test(lines[i])) continue;
        const nearby = lines.slice(Math.max(0, i - 2), i + 3).join(" ");
        const isB64 = /base64/i.test(nearby);
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== "") j++;
        j++;
        const bLines = [];
        while (j < lines.length && !lines[j].startsWith("--")) { bLines.push(lines[j].trim()); j++; }
        let html = bLines.join("");
        if (isB64 && html.length > 10) {
          try { const bin = atob(html); const arr = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k); html = new TextDecoder("utf-8").decode(arr); } catch {}
        }
        return html;
      }
      return "";
    })();
    if (htmlPart) {
      // Extract JSON-LD blocks
      const jsonLdMatches = htmlPart.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (jsonLdMatches) {
        for (const m of jsonLdMatches) {
          try {
            const json = m.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
            const parsed = JSON.parse(json);
            if (parsed["@type"] || (Array.isArray(parsed) && parsed[0]?.["@type"])) {
              jsonLdData = Array.isArray(parsed) ? parsed : [parsed];
            }
          } catch {}
        }
      }
    }

    // Fallback: strip HTML for text
    if (!textContent) {
      textContent = (htmlPart || raw).replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&#\d+;/g, " ").replace(/&\w+;/g, " ");
    }

    // If we found JSON-LD, prepend structured markers to the text so the parser can use them
    if (jsonLdData) {
      const markers = jsonLdData.map(item => {
        const t = item["@type"] || "";
        if (t === "FlightReservation" || t.includes("Flight")) {
          const fl = item.reservationFor || {};
          return `[JSONLD:FLIGHT] ${fl.flightNumber || ""} ${fl.departureAirport?.iataCode || ""} → ${fl.arrivalAirport?.iataCode || ""} ${fl.departureTime || ""} ${fl.arrivalTime || ""} confirmation:${item.reservationNumber || ""} passenger:${item.underName?.name || ""}`;
        }
        if (t === "LodgingReservation" || t.includes("Lodging") || t.includes("Hotel")) {
          const h = item.reservationFor || {};
          return `[JSONLD:HOTEL] ${h.name || ""} checkin:${item.checkinTime || item.checkinDate || ""} checkout:${item.checkoutTime || item.checkoutDate || ""} confirmation:${item.reservationNumber || ""} guest:${item.underName?.name || ""} address:${h.address?.streetAddress || ""} ${h.address?.addressLocality || ""}`;
        }
        return "";
      }).filter(Boolean);
      if (markers.length > 0) textContent = markers.join("\n") + "\n" + textContent;
    }

    return textContent.replace(/\s+/g, " ").trim();
  };

  const parseItinerary = (text) => {
    const segments = [];
    let tripName = "";
    let bookingSource = null;
    let confirmationCode = "";

    // ── Check for JSON-LD structured markers (highest priority, most accurate) ──
    const jsonLdFlights = [...text.matchAll(/\[JSONLD:FLIGHT\]\s*(.*)/g)];
    const jsonLdHotels = [...text.matchAll(/\[JSONLD:HOTEL\]\s*(.*)/g)];
    if (jsonLdFlights.length > 0 || jsonLdHotels.length > 0) {
      const carrierToProgram = { AA: "aa", DL: "dl", UA: "ua", WN: "sw", B6: "b6", AS: "atmos", F9: "frontier", NK: "spirit", AF: "flying_blue", KL: "flying_blue", BA: "ba_avios", AC: "aeroplan", EK: "emirates_skywards", TK: "turkish_miles", QF: "qantas_ff", SQ: "singapore_kf", CX: "cathay_mp" };
      for (const m of jsonLdFlights) {
        const line = m[1];
        const fn = line.match(/^(\S+)/)?.[1] || "";
        const route = line.match(/([A-Z]{3})\s*→\s*([A-Z]{3})/);
        const conf = line.match(/confirmation:(\S+)/)?.[1] || "";
        const pax = line.match(/passenger:(.+?)(?:\s+\[|$)/)?.[1]?.trim() || "";
        const depTime = line.match(/(\d{4}-\d{2}-\d{2}T[\d:]+)/)?.[1] || "";
        const carrier = fn.replace(/\d+/g, "").toUpperCase();
        const programId = carrierToProgram[carrier] || "aa";
        if (!confirmationCode && conf) confirmationCode = conf;
        segments.push({
          id: Date.now() + segments.length, type: "flight", program: programId,
          route: route ? `${route[1]} → ${route[2]}` : fn,
          date: depTime ? depTime.slice(0, 10) : "", flightNumber: fn,
          departureTime: depTime ? depTime.slice(11, 16) : "",
          arrivalTime: "", class: "domestic", status: "confirmed",
          tripName: `Booking ${conf || fn}`, estimatedPoints: 0,
          confirmationCode: conf, guestName: pax,
        });
      }
      for (const m of jsonLdHotels) {
        const line = m[1];
        const name = line.match(/^(.+?)\s+checkin:/)?.[1]?.trim() || "Hotel";
        const checkin = line.match(/checkin:(\S+)/)?.[1] || "";
        const checkout = line.match(/checkout:(\S+)/)?.[1] || "";
        const conf = line.match(/confirmation:(\S+)/)?.[1] || "";
        const guest = line.match(/guest:(.+?)\s+address:/)?.[1]?.trim() || "";
        const addr = line.match(/address:(.+)/)?.[1]?.trim() || "";
        if (!confirmationCode && conf) confirmationCode = conf;
        const ciDate = checkin.slice(0, 10);
        const coDate = checkout.slice(0, 10);
        const nights = ciDate && coDate ? Math.max(1, Math.round((new Date(coDate) - new Date(ciDate)) / 86400000)) : 1;
        segments.push({
          id: Date.now() + segments.length, type: "hotel", program: "marriott",
          property: name, location: addr, route: "", date: ciDate,
          checkoutDate: coDate, nights, class: "domestic", status: "confirmed",
          tripName: name, estimatedPoints: 0, estimatedNights: nights,
          confirmationCode: conf, guestName: guest,
        });
      }
      if (segments.length > 0) return segments;
    }

    // Detect booking source (OTA or airline)
    const textLower = text.toLowerCase();
    for (const [key, ota] of Object.entries(OTA_CS)) {
      if (textLower.includes(ota.name.toLowerCase()) || textLower.includes(key)) {
        bookingSource = { type: "ota", key, ...ota };
        break;
      }
    }
    if (!bookingSource) {
      for (const [key, air] of Object.entries(AIRLINE_CS)) {
        if (textLower.includes(air.name.toLowerCase())) {
          bookingSource = { type: "airline", key, ...air };
          break;
        }
      }
    }

    // Extract confirmation / PNR code
    const confMatch = text.match(/(?:confirmation|booking|record locator|pnr|ref)[:\s#]*([A-Z0-9]{5,12})/i);
    if (confMatch) confirmationCode = confMatch[1].toUpperCase();

    // ── Early hotel detection — check BEFORE flight regex to avoid false positives ──
    const hotelKeywords = /(?:check.?in|check.?out|hotel|resort|ryokan|inn|lodge|hostel|your\s+(?:booking|reservation)\s+(?:at|in))/i;
    const flightKeywords = /(?:flight|boarding\s*pass|departure\s*gate|gate\s*\d|seat\s*\d+[A-K]|itinerary\s*receipt)/i;
    if (hotelKeywords.test(text) && !flightKeywords.test(text)) {
      // This is a hotel/accommodation booking, not a flight
      const propMatch = text.match(/(?:your\s+booking\s+(?:at|in)\s+|confirmed\s+at\s+|reservation\s+at\s+|stay\s+at\s+|expecting\s+you).*?(?:\n|$)/i);
      let property = "";
      // Try extracting from subject-like patterns or the booking name
      const propMatch2 = text.match(/(?:confirmed\s+at\s+|booking\s+(?:at|in)\s+)([^\n.!]+)/i)
        || text.match(/\b([\w\s-]+(?:hotel|resort|ryokan|inn|lodge|hostel|suites?|palace|villa|mansion|manor|chateau)[\w\s-]*)/i);
      if (propMatch2) property = propMatch2[1].trim().slice(0, 100);
      // Fallback: try the line after "is expecting you"
      if (!property) {
        const expectMatch = text.match(/([^\n]+?)(?:\s+is\s+expecting\s+you)/i);
        if (expectMatch) property = expectMatch[1].replace(/\[.*?\]/g, "").trim();
      }

      const checkinMatch = text.match(/check.?in[:\s]*(?:\w+day,?\s*)?(\w+\s+\d{1,2},?\s*\d{4}|\d{4}-\d{2}-\d{2})/i);
      const checkoutMatch = text.match(/check.?out[:\s]*(?:\w+day,?\s*)?(\w+\s+\d{1,2},?\s*\d{4}|\d{4}-\d{2}-\d{2})/i);
      const nightsMatch = text.match(/(\d+)\s*night/i);
      const locationMatch = text.match(/(?:location|address)[:\s]*\n?\s*([^\n]+)/i);
      const guestMatch = text.match(/(?:guest\s*name|booked\s*(?:for|by))[:\s]*\n?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
      const roomMatch = text.match(/(?:your\s+reservation|room\s*type)[:\s]*[^,]*,\s*([^\n]+)/i);
      const totalMatch = text.match(/total\s*price[:\s]*[^\d]*?([\d,]+(?:\.\d+)?)/i);

      const parseDate = (str) => { if (!str) return ""; const d = new Date(str); return !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : str; };
      const checkinDate = parseDate(checkinMatch?.[1]);
      const checkoutDate = parseDate(checkoutMatch?.[1]);
      const nights = nightsMatch ? parseInt(nightsMatch[1]) : (checkinDate && checkoutDate ? Math.round((new Date(checkoutDate) - new Date(checkinDate)) / 86400000) : 1);

      let hotelProgram = "marriott";
      if (/hilton/i.test(text)) hotelProgram = "hilton";
      else if (/hyatt/i.test(text)) hotelProgram = "hyatt";
      else if (/ihg|intercontinental|holiday\s*inn/i.test(text)) hotelProgram = "ihg";
      else if (/wyndham/i.test(text)) hotelProgram = "wyndham";
      else if (/accor|sofitel|novotel/i.test(text)) hotelProgram = "accor";

      segments.push({
        id: Date.now(),
        type: "hotel",
        program: hotelProgram,
        property: property || "Hotel",
        location: locationMatch?.[1]?.trim() || "",
        route: "",
        date: checkinDate,
        checkoutDate: checkoutDate,
        nights: nights,
        roomType: roomMatch?.[1]?.trim() || "",
        totalPrice: totalMatch?.[1] || "",
        class: "domestic",
        status: "confirmed",
        tripName: property || "Hotel Booking",
        estimatedPoints: 0,
        estimatedNights: nights,
        confirmationCode,
        bookingSource: bookingSource ? { name: bookingSource.name, phone: bookingSource.phone, manage: bookingSource.manage, type: bookingSource.type } : null,
        guestName: guestMatch?.[1] || "",
      });
      return segments;
    }

    // Extract flight segments: look for patterns like "AA 123", "DL 456", airport codes, dates, times
    const flightPattern = /(?:(?:flight|flt)[:\s]*)([A-Z]{2})\s*(\d{1,4})\b/gi;
    // Also try standalone airline code + number (but only known IATA carriers)
    const knownCarriers = new Set(["AA","DL","UA","WN","B6","AS","F9","NK","AF","KL","BA","AC","EK","TK","QF","SQ","CX","LH","OS","LX","NH","JL","QR","EY","AI","MH","GA","TG","OZ","CI","BR","JQ","VA","NZ","LA","AV","CM","TP","IB","AY","SK","SN","LO","RO","SU","HU","MU","CA","CZ","3U","HX"]);
    const carrierFlightPattern = /\b([A-Z]{2})\s*(\d{2,4})\b/g;
    const airportPattern = /\b([A-Z]{3})\s*(?:→|->|to|–|—|-)\s*([A-Z]{3})\b/g;
    const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w{3,9}\s+\d{1,2},?\s*\d{4}|\d{4}-\d{2}-\d{2})\b/gi;
    const timePattern = /\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\b/g;
    const seatPattern = /(?:seat|ste?)[:\s]*(\d{1,2}[A-K])/gi;
    const fareClassPattern = /(?:fare\s*(?:class|basis|code)|booking\s*class)[:\s]*([A-Z][A-Z0-9]{0,7})/gi;
    const aircraftPattern = /(?:aircraft|plane|equipment|acft)[:\s]*([A-Z0-9]{2,4}(?:\s*[-/]\s*\d{3,4})?)/gi;
    const durationPattern = /(?:duration|travel\s*time|flight\s*time)[:\s]*(\d+h\s*\d*m?|\d+\s*hr[s]?\s*\d*\s*min[s]?)/gi;
    const distancePattern = /(?:distance|miles)[:\s]*([\d,]+)\s*(?:mi|miles|km)/gi;
    const layoverPattern = /(?:layover|connection|stopover)[:\s]*(?:(\d+h\s*\d*m?)|([\d.]+)\s*(?:hr|hour))/gi;
    // Terminal patterns — "Terminal B", "Terminal 4", "Departs Terminal 2", "T3"
    const depTerminalPattern = /(?:dep(?:arture|arting|arts?)?\.?\s*terminal|terminal\s*(?:for\s*)?dep(?:arture)?)[:\s]*([A-Z]?\d+[A-Z]?|[A-Z]{1,2})(?=\b)/gi;
    const arrTerminalPattern = /(?:arr(?:ival|iving|ives?)?\.?\s*terminal|terminal\s*(?:for\s*)?arr(?:ival)?)[:\s]*([A-Z]?\d+[A-Z]?|[A-Z]{1,2})(?=\b)/gi;
    // Fallback: generic "Terminal X" ordered list when no dep/arr qualifier
    const genericTerminalPattern = /\bterminal[:\s]+([A-Z]?\d+[A-Z]?|[A-Z]{1,2})\b/gi;

    // Collect all dates and times
    const dates = [];
    let dm;
    while ((dm = datePattern.exec(text)) !== null) dates.push(dm[1]);
    const times = [];
    let tm;
    while ((tm = timePattern.exec(text)) !== null) times.push(tm[1]);

    // Collect flight numbers
    const flights = [];
    let fm;
    while ((fm = flightPattern.exec(text)) !== null) flights.push({ carrier: fm[1].toUpperCase(), number: fm[2] });
    // If no "flight" keyword matches, try known carrier codes
    if (flights.length === 0) {
      let cfm;
      while ((cfm = carrierFlightPattern.exec(text)) !== null) {
        if (knownCarriers.has(cfm[1].toUpperCase())) flights.push({ carrier: cfm[1].toUpperCase(), number: cfm[2] });
      }
    }

    // Collect routes
    const routes = [];
    let rm;
    while ((rm = airportPattern.exec(text)) !== null) routes.push({ from: rm[1], to: rm[2] });

    // Collect seats
    const seats = [];
    let sm;
    while ((sm = seatPattern.exec(text)) !== null) seats.push(sm[1].toUpperCase());

    // Collect fare class
    const fareClasses = [];
    let fcm;
    while ((fcm = fareClassPattern.exec(text)) !== null) fareClasses.push(fcm[1].toUpperCase());

    // Collect aircraft
    const aircrafts = [];
    let am;
    while ((am = aircraftPattern.exec(text)) !== null) {
      const code = am[1].trim().replace(/\s+/g, "");
      aircrafts.push(AIRCRAFT_TYPES[code] || code);
    }

    // Collect durations
    const durations = [];
    let drm;
    while ((drm = durationPattern.exec(text)) !== null) durations.push(drm[1]);

    // Collect distances
    const distances = [];
    let dim;
    while ((dim = distancePattern.exec(text)) !== null) distances.push(dim[1].replace(/,/g, ""));

    // Collect layovers
    const layovers = [];
    let lm;
    while ((lm = layoverPattern.exec(text)) !== null) layovers.push(lm[1] || lm[2] + "hr");

    // Collect terminals — try specific dep/arr patterns first, fall back to generic order
    const depTerminals = [];
    let dtm;
    while ((dtm = depTerminalPattern.exec(text)) !== null) depTerminals.push(dtm[1].toUpperCase());
    const arrTerminals = [];
    let atm;
    while ((atm = arrTerminalPattern.exec(text)) !== null) arrTerminals.push(atm[1].toUpperCase());
    // If no labeled terminals found, use generic "Terminal X" occurrences in order
    if (depTerminals.length === 0 && arrTerminals.length === 0) {
      const generic = [];
      let gtm;
      while ((gtm = genericTerminalPattern.exec(text)) !== null) generic.push(gtm[1].toUpperCase());
      if (generic.length >= 1) depTerminals.push(generic[0]);
      if (generic.length >= 2) arrTerminals.push(generic[1]);
    }

    // Determine airline program from flight carrier codes
    const carrierToProgram = { AA: "aa", DL: "dl", UA: "ua", WN: "sw", B6: "b6", AS: "atmos", F9: "frontier", NK: "spirit", AF: "flying_blue", KL: "flying_blue", BA: "ba_avios", AC: "aeroplan", EK: "emirates_skywards", TK: "turkish_miles", QF: "qantas_ff", SQ: "singapore_kf", CX: "cathay_mp" };

    // Build flight segments
    const numSegments = Math.max(1, routes.length, flights.length);
    for (let i = 0; i < numSegments; i++) {
      const route = routes[i];
      const flight = flights[i];
      const programId = flight ? (carrierToProgram[flight.carrier] || "aa") : (bookingSource?.type === "airline" ? bookingSource.key : "aa");
      const prog = LOYALTY_PROGRAMS.airlines.find(p => p.id === programId);

      // Determine fare class category
      let fareClass = fareClasses[i] || fareClasses[0] || "";
      let classCategory = "domestic";
      const fcUpper = fareClass.charAt(0);
      if ("FJAP".includes(fcUpper)) classCategory = "premium";
      else if ("CDIYZ".includes(fcUpper)) classCategory = "international";

      const routeStr = route ? `${route.from} → ${route.to}` : (flight ? `${flight.carrier}${flight.number}` : "Unknown Route");

      segments.push({
        id: Date.now() + i,
        type: "flight",
        program: programId,
        route: routeStr,
        date: dates[i] || dates[0] || new Date().toISOString().slice(0, 10),
        class: classCategory,
        status: "confirmed",
        tripName: tripName || (confirmationCode ? `Booking ${confirmationCode}` : "Imported Trip"),
        estimatedPoints: prog ? prog.earnRate[classCategory] * 500 : 3000,
        estimatedNights: 0,
        estimatedRentals: 0,
        // Extended fields
        flightNumber: flight ? `${flight.carrier}${flight.number}` : "",
        seat: seats[i] || seats[0] || "",
        fareClass: fareClass,
        aircraft: aircrafts[i] || aircrafts[0] || "",
        distance: distances[i] || distances[0] || "",
        travelTime: durations[i] || durations[0] || "",
        layover: layovers[i] || "",
        departureTime: times[i * 2] || times[0] || "",
        arrivalTime: times[i * 2 + 1] || times[1] || "",
        departureTerminal: depTerminals[i] || depTerminals[0] || "",
        arrivalTerminal: arrTerminals[i] || arrTerminals[0] || "",
        confirmationCode,
        bookingSource: bookingSource ? { name: bookingSource.name, phone: bookingSource.phone, manage: bookingSource.manage, type: bookingSource.type } : null,
        airlineCS: AIRLINE_CS[programId] || null,
      });
    }

    return segments;
  };

  // Parse pasted confirmation and save to Supabase itineraries table
  const handlePasteAndParse = async () => {
    if (!pasteText.trim()) return;
    const segments = parseItinerary(pasteText);
    const confirmCode = segments[0]?.confirmationCode || "";
    const bookingSrc = segments[0]?.bookingSource?.name || "";
    const paxName = pasteText.match(/(?:passenger|traveler|name)[:\s]*([A-Z][a-z]+\s+[A-Z][a-z]+)/i)?.[1] || "";

    // Convert segments to storable format
    const parsedSegs = segments.map(s => ({
      type: s.type || "flight",
      program: s.program,
      route: s.route || "",
      date: s.date,
      // Flight fields
      flightNumber: s.flightNumber || "",
      departureTime: s.departureTime || "",
      arrivalTime: s.arrivalTime || "",
      departureTerminal: s.departureTerminal || "",
      arrivalTerminal: s.arrivalTerminal || "",
      fareClass: s.fareClass || "",
      bookingClass: s.fareClass?.charAt(0) || "",
      seat: s.seat || "",
      aircraft: s.aircraft || "",
      class: s.class || "domestic",
      confirmationCode: s.confirmationCode || "",
      // Hotel fields
      property: s.property || "",
      location: s.location || "",
      nights: s.nights || 0,
      checkoutDate: s.checkoutDate || "",
      guestName: s.guestName || "",
    }));

    const itinData = {
      source: "paste",
      subject: pasteLabel || confirmCode || bookingSrc || "Pasted Booking",
      raw_text: pasteText.slice(0, 50000), // limit raw text size
      parsed_segments: parsedSegs,
      booking_source: bookingSrc,
      confirmation_code: confirmCode,
      passenger_name: paxName,
      parse_method: "regex",
      status: "pending",
    };
    if (user) {
      const { data, error } = await supabase.from("itineraries").insert({
        user_id: user.id,
        ...itinData,
      }).select().single();
      if (error) console.error("Itinerary save error:", error);
      if (!error && data) {
        setSavedItineraries(prev => [data, ...prev]);
      } else {
        // Fallback: add to local state even if DB save fails
        setSavedItineraries(prev => [{ id: crypto.randomUUID(), received_at: new Date().toISOString(), ...itinData }, ...prev]);
      }
    } else {
      // Not logged in — save locally only
      setSavedItineraries(prev => [{ id: crypto.randomUUID(), received_at: new Date().toISOString(), ...itinData }, ...prev]);
    }
    setShowPasteItinerary(false);
    setPasteText("");
    setPasteLabel("");
  };

  // Pre-fill the Add Trip modal from a saved itinerary
  const addTripFromItinerary = async (itinerary) => {
    const segs = (itinerary.parsed_segments || []).map(s => ({
      ...defaultSegment(),
      type: s.type || "flight",
      program: s.program || "aa",
      route: s.route || (s.departureAirport && s.arrivalAirport ? `${s.departureAirport} → ${s.arrivalAirport}` : ""),
      date: s.date || "",
      // Flight
      flightNumber: s.flightNumber || "",
      departureTime: s.departureTime || "",
      arrivalTime: s.arrivalTime || "",
      departureAirport: s.departureAirport || "",
      arrivalAirport: s.arrivalAirport || "",
      departureTerminal: s.departureTerminal || "",
      arrivalTerminal: s.arrivalTerminal || "",
      arrivalDate: s.arrivalDate || "",
      fareClass: s.fareClass || "economy",
      bookingClass: s.bookingClass || "",
      confirmationCode: s.confirmationCode || "",
      seat: s.seat || "",
      airline: s.airline || "",
      aircraft: s.aircraft || "",
      class: s.class || "international",
      stopoverAirport: s.stopoverAirport || "",
      stopoverDuration: s.stopoverDuration || "",
      // Hotel
      property: s.property || "",
      location: s.location || "",
      nights: s.nights || 1,
    }));
    setNewTrip({
      tripName: itinerary.subject || itinerary.confirmation_code || "Imported Trip",
      status: "confirmed",
      segments: segs.length > 0 ? segs : [defaultSegment()],
    });
    setShowCreateTrip(true);
    // Mark itinerary as added
    if (user) {
      await supabase.from("itineraries").update({ status: "added" }).eq("id", itinerary.id);
      setSavedItineraries(prev => prev.filter(i => i.id !== itinerary.id));
    }
  };

  // Dismiss an itinerary
  const dismissItinerary = (id) => {
    showConfirm("Dismiss this booking from your inbox?", async () => {
      if (user) {
        await supabase.from("itineraries").update({ status: "dismissed" }).eq("id", id);
        setSavedItineraries(prev => prev.filter(i => i.id !== id));
      }
    });
  };

  const handleImportItinerary = () => {
    if (!itineraryText.trim()) return;
    const segments = parseItinerary(itineraryText);
    if (segments.length > 0) {
      setTrips(prev => [...prev, ...segments]);
    }
    setShowImportItinerary(false);
    setItineraryText("");
  };

  const BLANK_EXPENSE = { category: "flight", description: "", amount: "", currency: "USD", usdReimbursement: "", individuals: "Self", date: "", paymentMethod: "", receipt: false, receiptImage: null, notes: "" };

  const handleAddExpense = () => {
    const parsed = {
      ...newExpense,
      amount: parseFloat(newExpense.amount) || 0,
      fxRate: newExpense.currency === "USD" ? 1 : (parseFloat(newExpense.fxRate) || 1),
      usdReimbursement: newExpense.currency === "USD" ? parseFloat(newExpense.amount) || 0 : (parseFloat(newExpense.usdReimbursement) || 0),
    };
    const tripId = showAddExpense === "_inbox" ? null : showAddExpense;
    const payload = {
      category: parsed.category, description: parsed.description, amount: parsed.amount,
      currency: parsed.currency, fx_rate: parsed.fxRate, date: parsed.date || null,
      payment_method: parsed.paymentMethod, receipt: parsed.receipt,
      receipt_image: parsed.receiptImage || null, notes: parsed.notes,
      individuals: parsed.individuals || "Self",
      usd_reimbursement: parsed.usdReimbursement || null,
    };

    // Optimistic: update UI immediately, persist in background
    if (editExpenseId) {
      setExpenses(prev => prev.map(e => e.id === editExpenseId ? { ...parsed, id: editExpenseId, tripId: e.tripId } : e));
      setEditExpenseId(null);
      if (user) supabase.from("expenses").update(payload).eq("id", editExpenseId).eq("user_id", user.id).then();
    } else {
      const tempId = `temp_${Date.now()}`;
      setExpenses(prev => [...prev, { ...parsed, id: tempId, tripId }]);
      if (user) {
        supabase.from("expenses").insert({ ...payload, user_id: user.id, trip_id: tripId })
          .select().single().then(({ data }) => {
            if (data) setExpenses(prev => prev.map(e => e.id === tempId ? { ...e, id: data.id } : e));
          });
      }
    }
    setShowAddExpense(null);
    setNewExpense(BLANK_EXPENSE);
  };

  const removeExpense = (id) => {
    showConfirm("Are you sure you want to delete this expense?", async () => {
      setExpenses(prev => prev.filter(e => e.id !== id));
      if (user) await supabase.from("expenses").delete().eq("id", id).eq("user_id", user.id);
    });
  };

  const getTripExpenses = (tripId) => expenses.filter(e => e.tripId === tripId);
  const getTripTotal = (tripId) => getTripExpenses(tripId).reduce((sum, e) => sum + e.amount * (e.fxRate || 1), 0);
  const getTripName = (trip) => trip.tripName || trip.route || trip.property || trip.location || "Trip";

  const handleShareTrip = async () => {
    if (!shareEmail.trim() || !showShareModal || !user) return;
    const ownerName = [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(" ") || user.email || "Someone";
    const { error } = await supabase.from("trip_shares").insert({
      trip_id: showShareModal,
      owner_id: user.id,
      shared_with_email: shareEmail.trim().toLowerCase(),
      owner_name: ownerName,
      permission: sharePermission,
    });
    if (error) {
      setShareStatus(error.code === "23505" ? "already" : "error");
    } else {
      setShareStatus("sent");
      setShareEmail("");
    }
  };

  // ── Flighty / Calendar ICS export ──────────────────────────────────────────
  const generateFlightyICS = () => {
    const flightTrips = trips.filter(t => t.type === "flight");
    if (flightTrips.length === 0) return null;

    const pad = (n) => String(n).padStart(2, "0");
    const toICSDate = (dateStr) => {
      // dateStr is "YYYY-MM-DD"
      const [y, m, d] = dateStr.split("-");
      return `${y}${pad(m)}${pad(d)}`;
    };
    const toICSDatePlusOne = (dateStr) => {
      const d = new Date(dateStr + "T12:00:00");
      d.setDate(d.getDate() + 1);
      return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    };
    const escapeICS = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    const foldLine = (line) => {
      // ICS lines max 75 octets; fold with CRLF + space
      const chunks = [];
      while (line.length > 75) { chunks.push(line.slice(0, 75)); line = " " + line.slice(75); }
      chunks.push(line);
      return chunks.join("\r\n");
    };

    const events = flightTrips.map(trip => {
      const prog = allPrograms.find(p => p.id === trip.program);
      const route = trip.route || "";
      // Parse "JFK → LAX" or "JFK - LAX"
      const [origin = "", dest = ""] = route.split(/\s*[→\-–—>]+\s*/);
      const summary = route ? `${route}${prog ? ` (${prog.name.split(" ")[0]})` : ""}` : getTripName(trip);
      const descParts = [
        prog ? `Airline: ${prog.name}` : "",
        trip.class ? `Class: ${trip.class.charAt(0).toUpperCase() + trip.class.slice(1)}` : "",
        trip.estimatedPoints ? `Est. Points: +${trip.estimatedPoints.toLocaleString()} ${prog?.unit || "pts"}` : "",
        `Status: ${trip.status}`,
        trip.tripName ? `Trip: ${trip.tripName}` : "",
        "",
        "Exported from Continuum — continuum.app",
        "Tip: Add your flight number in Flighty for full tracking.",
      ].filter(Boolean).join("\n");

      return [
        "BEGIN:VEVENT",
        foldLine(`UID:continuum-trip-${trip.id}@continuum.app`),
        foldLine(`DTSTART;VALUE=DATE:${toICSDate(trip.date)}`),
        foldLine(`DTEND;VALUE=DATE:${toICSDatePlusOne(trip.date)}`),
        foldLine(`SUMMARY:✈ ${escapeICS(summary)}`),
        foldLine(`DESCRIPTION:${escapeICS(descParts)}`),
        origin && dest ? foldLine(`LOCATION:${escapeICS(origin.trim())} to ${escapeICS(dest.trim())}`) : "",
        "CATEGORIES:TRAVEL,FLIGHT",
        `STATUS:${trip.status === "confirmed" ? "CONFIRMED" : "TENTATIVE"}`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
        "END:VEVENT",
      ].filter(Boolean).join("\r\n");
    });

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Continuum//FlightExport//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Continuum Flights",
      "X-WR-CALDESC:Flights exported from Continuum for Flighty import",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n");
  };

  const exportToFlighty = () => {
    // Premium check removed — all features free for now
    const ics = generateFlightyICS();
    if (!ics) { alert("No flight trips to export yet. Add some flights first!"); return; }
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "continuum-flights.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Calendar export helpers ──
  const buildTripICSEvent = (trip) => {
    const prog = allPrograms.find(p => p.id === trip.program);
    const name = trip.tripName || trip.route || trip.property || trip.location || "Trip";
    const icon = "";
    const desc = [
      prog ? `Program: ${prog.name}` : "",
      trip.class ? `Class: ${trip.class.charAt(0).toUpperCase() + trip.class.slice(1)}` : "",
      trip.estimatedPoints ? `Est. Points: +${trip.estimatedPoints.toLocaleString()} ${prog?.unit || "pts"}` : "",
      `Status: ${trip.status}`,
      "",
      "Exported from Continuum",
    ].filter(Boolean).join("\n");
    const pad = (n) => String(n).padStart(2, "0");
    const toDate = (dateStr) => { const [y, m, d] = dateStr.split("-"); return `${y}${pad(m)}${pad(d)}`; };
    const toDatePlusN = (dateStr, n) => {
      const d = new Date(dateStr + "T12:00:00");
      d.setDate(d.getDate() + (n || 1));
      return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    };
    const esc = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    return [
      "BEGIN:VEVENT",
      `UID:continuum-trip-${trip.id}@continuum.app`,
      `DTSTART;VALUE=DATE:${toDate(trip.date)}`,
      `DTEND;VALUE=DATE:${toDatePlusN(trip.date, trip.nights)}`,
      `SUMMARY:${esc(`${icon} ${name}`)}`,
      `DESCRIPTION:${esc(desc)}`,
      (trip.route || trip.location) ? `LOCATION:${esc(trip.route || trip.location)}` : "",
      "CATEGORIES:TRAVEL",
      `STATUS:${trip.status === "confirmed" ? "CONFIRMED" : "TENTATIVE"}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
      "END:VEVENT",
    ].filter(Boolean).join("\r\n");
  };

  const downloadTripICS = (trip) => {
    const event = buildTripICSEvent(trip);
    const name = trip.tripName || trip.route || trip.property || trip.location || "trip";
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Continuum//TripExport//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", event, "END:VCALENDAR"].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `continuum-${name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.ics`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTripGoogleCalUrl = (trip) => {
    const prog = allPrograms.find(p => p.id === trip.program);
    const name = trip.tripName || trip.route || trip.property || trip.location || "Trip";
    const icon = trip.type === "flight" ? "✈ " : trip.type === "hotel" ? "— " : "— ";
    const pad = (n) => String(n).padStart(2, "0");
    const [y, m, d] = trip.date.split("-");
    const start = `${y}${pad(m)}${pad(d)}`;
    const endDate = new Date(trip.date + "T12:00:00");
    endDate.setDate(endDate.getDate() + (trip.nights || 1));
    const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}`;
    const details = [
      prog ? `Program: ${prog.name}` : "",
      trip.class ? `Class: ${trip.class}` : "",
      trip.estimatedPoints ? `Est. Points: +${trip.estimatedPoints.toLocaleString()}` : "",
    ].filter(Boolean).join("\n");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(icon + name)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(trip.route || trip.location || "")}`;
  };

  const getTripOutlookUrl = (trip) => {
    const prog = allPrograms.find(p => p.id === trip.program);
    const name = trip.tripName || trip.route || trip.property || trip.location || "Trip";
    const icon = trip.type === "flight" ? "✈ " : trip.type === "hotel" ? "— " : "— ";
    const pad = (n) => String(n).padStart(2, "0");
    const [y, m, d] = trip.date.split("-");
    const endDate = new Date(trip.date + "T12:00:00");
    endDate.setDate(endDate.getDate() + (trip.nights || 1));
    const endStr = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`;
    const body = [prog ? `Program: ${prog.name}` : "", trip.class ? `Class: ${trip.class}` : ""].filter(Boolean).join("\n");
    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(icon + name)}&startdt=${y}-${m}-${d}&enddt=${endStr}&body=${encodeURIComponent(body)}&location=${encodeURIComponent(trip.route || trip.location || "")}&allday=true`;
  };

  const exportMonthICS = (monthStr) => {
    const monthTrips = trips.filter(t => t.date && t.date.startsWith(monthStr));
    if (monthTrips.length === 0) { alert(`No trips found for ${monthStr}.`); return; }
    const events = monthTrips.map(buildTripICSEvent);
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Continuum//MonthExport//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:Continuum Trips — ${monthStr}`, ...events, "END:VCALENDAR"].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `continuum-trips-${monthStr}.ics`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportMonthPDF = (monthStr) => {
    const [y, m] = monthStr.split("-");
    const monthName = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const monthTrips = trips.filter(t => t.date && t.date.startsWith(monthStr)).sort((a, b) => a.date.localeCompare(b.date));
    if (monthTrips.length === 0) { alert(`No trips found for ${monthName}.`); return; }
    const rows = monthTrips.map(trip => {
      const prog = allPrograms.find(p => p.id === trip.program);
      const name = trip.tripName || trip.route || trip.property || trip.location || "—";
      const icon = "";
      const statusColor = trip.status === "confirmed" ? "#22c55e" : trip.status === "planned" ? "#f59e0b" : "#E8883A";
      const nights = trip.nights ? `${trip.nights}n` : "—";
      return `<tr>
        <td>${trip.date}</td>
        <td>${icon} ${name}</td>
        <td>${prog?.name || "—"}</td>
        <td style="color:${statusColor};font-weight:600;text-transform:capitalize">${trip.status}</td>
        <td>${nights}</td>
        <td>${trip.estimatedPoints ? trip.estimatedPoints.toLocaleString() + " pts" : "—"}</td>
      </tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Continuum Trips — ${monthName}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; padding: 48px; background: #fff; }
      .logo { font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #999; margin-bottom: 32px; }
      h1 { font-size: 30px; font-weight: 700; margin-bottom: 4px; }
      .sub { color: #666; font-size: 14px; margin-bottom: 36px; }
      table { width: 100%; border-collapse: collapse; }
      th { text-align: left; padding: 10px 14px; background: #f5f5f5; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #666; border-bottom: 2px solid #e5e5e5; }
      td { padding: 13px 14px; font-size: 13px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
      tr:last-child td { border-bottom: none; }
      .footer { margin-top: 40px; font-size: 11px; color: #bbb; border-top: 1px solid #eee; padding-top: 16px; }
      @media print { body { padding: 24px; } }
    </style></head><body>
    <div class="logo">Continuum Travel Intelligence</div>
    <h1>${monthName}</h1>
    <div class="sub">${monthTrips.length} trip${monthTrips.length !== 1 ? "s" : ""} scheduled</div>
    <table>
      <thead><tr><th>Date</th><th>Trip</th><th>Program</th><th>Status</th><th>Nights</th><th>Est. Points</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">Exported from Continuum · ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
    </body></html>`;
    const win = window.open("", "_blank");
    if (!win) { alert("Please allow popups to export PDF."); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const handleLinkAccount = async (programId) => {
    setLinkError("");
    setLinkLoading(true);
    const now = new Date().toISOString();
    const payload = {
      user_id: user.id,
      program_id: programId,
      member_id: linkForm.memberId.trim(),
      points_balance: parseInt(linkForm.pointsBalance) || 0,
      current_points: parseInt(linkForm.tierCredits) || 0,
      tier_credits: parseInt(linkForm.tierCredits) || 0,
      current_nights: parseInt(linkForm.currentNights) || 0,
      current_rentals: parseInt(linkForm.currentRentals) || 0,
      current_tier: linkForm.currentTier.trim(),
      updated_at: now,
    };
    const { error } = await supabase
      .from("linked_accounts")
      .upsert(payload, { onConflict: "user_id,program_id" });
    setLinkLoading(false);
    if (error) { setLinkError(error.message); return; }
    setLinkedAccounts(prev => ({
      ...prev,
      [programId]: {
        memberId: payload.member_id,
        pointsBalance: payload.points_balance,
        currentPoints: payload.tier_credits,
        tierCredits: payload.tier_credits,
        currentNights: payload.current_nights,
        currentRentals: payload.current_rentals,
        currentTier: payload.current_tier,
        updatedAt: now,
      },
    }));
    setShowLinkModal(null);
    setLinkForm({ memberId: "", pointsBalance: "", tierCredits: "", currentNights: "", currentRentals: "", currentTier: "" });
  };

  const handleUnlinkAccount = (programId) => {
    showConfirm("Unlink this program? Your saved stats will be removed.", async () => {
      if (user) {
        await supabase.from("linked_accounts").delete().eq("user_id", user.id).eq("program_id", programId);
      }
      setLinkedAccounts(prev => {
        const next = { ...prev };
        delete next[programId];
        return next;
      });
    });
  };

  const getProjectedStatus = useCallback((programId) => {
    const account = linkedAccounts[programId];
    if (!account) return null;
    const allPrograms = [...LOYALTY_PROGRAMS.airlines, ...LOYALTY_PROGRAMS.hotels, ...LOYALTY_PROGRAMS.rentals];
    const program = allPrograms.find(p => p.id === programId);
    if (!program) return null;

    let current = account.currentPoints || account.tierCredits || account.currentNights || account.currentRentals || 0;
    const tripBoosts = trips.filter(t => t.program === programId).reduce((sum, t) => sum + (t.estimatedPoints || t.estimatedNights || t.estimatedRentals || 0), 0);
    const projected = current + tripBoosts;

    let currentTier = null, nextTier = null, projectedTier = null;
    for (const tier of program.tiers) {
      if (current >= tier.threshold) currentTier = tier;
      if (projected >= tier.threshold) projectedTier = tier;
    }
    nextTier = program.tiers.find(t => t.threshold > current) || program.tiers[program.tiers.length - 1];
    if (!projectedTier) projectedTier = currentTier;

    return { current, projected, tripBoosts, currentTier, nextTier, projectedTier, program, willAdvance: projectedTier && currentTier && projectedTier.name !== currentTier?.name };
  }, [linkedAccounts, trips]);

  const allPrograms = useMemo(() => [...LOYALTY_PROGRAMS.airlines, ...LOYALTY_PROGRAMS.hotels, ...LOYALTY_PROGRAMS.rentals, ...customPrograms], [customPrograms]);

  // Resolve display name for a segment — handles "other" with user-entered name
  const segProgName = (seg) => {
    if (seg.program === "other") return seg.customProgramName || "Other";
    return allPrograms.find(p => p.id === seg.program)?.name || seg.customProgramName || seg.program || "—";
  };

  // ── Push notification subscription ──
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    const checkPush = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;
      setPushSupported(true);
      if (Notification.permission === "granted") {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) { pushSubRef.current = sub.toJSON(); setPushEnabled(true); }
        } catch {}
      }
    };
    checkPush();
  }, [isLoggedIn]);

  const enablePushNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey });
      }
      pushSubRef.current = sub.toJSON();
      setPushEnabled(true);
      if (user) {
        fetch("/api/push-subscribe", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, subscription: sub.toJSON() }),
        }).catch(() => {});
      }
    } catch (e) {
      console.log("Push subscribe error:", e.message);
    }
  };

  // ── Live flight status polling for upcoming flights ──
  useEffect(() => {
    if (!isLoggedIn || trips.length === 0) return;
    const checkFlightStatus = async () => {
      const now = new Date();
      const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const flightsToCheck = [];
      trips.forEach(trip => {
        (trip.segments || []).filter(s => !s._isMeta && s.type === "flight" && s.flightNumber && s.date).forEach(seg => {
          const segDate = new Date(seg.date + "T12:00:00");
          if (segDate >= yesterday && segDate <= cutoff) {
            flightsToCheck.push({
              flightNumber: seg.flightNumber,
              date: seg.date,
              departureAirport: seg.departureAirport || "",
              arrivalAirport: seg.arrivalAirport || "",
            });
          }
        });
      });
      if (flightsToCheck.length === 0) return;
      try {
        const resp = await fetch("/api/flight-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flights: flightsToCheck }),
        });
        if (resp.ok) {
          const { results } = await resp.json();
          if (results) {
            // Detect changes and send push notifications
            const prev = prevFlightStatusRef.current;
            const sub = pushSubRef.current;
            Object.entries(results).forEach(([key, status]) => {
              if (!status || status.error) return;
              const old = prev[key];
              if (!old) { prev[key] = status; return; }
              const fn = key.split("_")[0];
              // Gate change
              if (status.departureGate && status.departureGate !== old.departureGate && sub) {
                fetch("/api/push-notify", { method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ subscription: sub, title: `Gate Assigned: ${fn}`, body: `Gate ${status.departureGate}${status.departureTerminal ? ` · Terminal ${status.departureTerminal}` : ""}`, data: { flightNumber: fn } }),
                }).catch(() => {});
              }
              // Delay
              if (status.departureDelay > 15 && (!old.departureDelay || old.departureDelay <= 15) && sub) {
                fetch("/api/push-notify", { method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ subscription: sub, title: `Flight Delayed: ${fn}`, body: `Delayed ${status.departureDelay} minutes${status.departureRevised ? ". New departure: " + status.departureRevised.split(" ").pop()?.replace(/[+-]\d{2}:\d{2}$/, "") : ""}`, data: { flightNumber: fn } }),
                }).catch(() => {});
              }
              // Cancellation
              if (status.status === "Canceled" && old.status !== "Canceled" && sub) {
                fetch("/api/push-notify", { method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ subscription: sub, title: `CANCELLED: ${fn}`, body: `Flight ${fn} has been cancelled. Contact your airline.`, data: { flightNumber: fn } }),
                }).catch(() => {});
              }
              // Landed
              if (status.status === "Landed" && old.status !== "Landed" && sub) {
                fetch("/api/push-notify", { method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ subscription: sub, title: `Landed: ${fn}`, body: `${status.arrivalAirport || ""}${status.baggageBelt ? " · Baggage belt " + status.baggageBelt : ""}`, data: { flightNumber: fn } }),
                }).catch(() => {});
              }
              prev[key] = status;
            });
            prevFlightStatusRef.current = prev;
            setFlightStatusCache(p => ({ ...p, ...results }));
          }
        }
      } catch {}
    };
    const initialTimer = setTimeout(checkFlightStatus, 3000);
    const interval = setInterval(checkFlightStatus, 5 * 60 * 1000);
    return () => { clearTimeout(initialTimer); clearInterval(interval); };
  }, [isLoggedIn, trips.length]);

  // Helper: get live status for a flight segment
  const getFlightLiveStatus = (seg) => {
    if (!seg?.flightNumber || !seg?.date) return null;
    const key = `${seg.flightNumber.replace(/\s+/g, "").toUpperCase()}_${seg.date}`;
    return flightStatusCache[key] || null;
  };

  // Fetch Google Places photos for all trip landmarks (delayed, batched, once)
  useEffect(() => {
    if (!isLoggedIn || trips.length === 0 || landmarkPhotosFetchedOnce.current || activeView !== "dashboard") return;
    landmarkPhotosFetchedOnce.current = true;
    const CITY_LANDMARKS_ALL = {
      "New York": ["Statue of Liberty", "Central Park", "Times Square", "Brooklyn Bridge", "Empire State Building"],
      "London": ["Big Ben", "Tower Bridge", "Buckingham Palace", "British Museum", "Hyde Park"],
      "Paris": ["Eiffel Tower", "Louvre Museum", "Arc de Triomphe", "Notre-Dame", "Montmartre"],
      "Tokyo": ["Shibuya Crossing", "Senso-ji Temple", "Tokyo Tower", "Meiji Shrine", "Tsukiji Market"],
      "Osaka": ["Osaka Castle", "Dotonbori", "Universal Studios", "Shinsekai", "Namba"],
      "Hong Kong": ["Victoria Peak", "Star Ferry", "Temple Street", "Tian Tan Buddha", "Mong Kok"],
      "Taipei": ["Taipei 101", "Jiufen Old Street", "Shilin Night Market", "National Palace Museum", "Elephant Mountain"],
      "Seoul": ["Gyeongbokgung Palace", "Bukchon Hanok Village", "Myeongdong", "N Seoul Tower", "Hongdae"],
      "Singapore": ["Marina Bay Sands", "Gardens by the Bay", "Sentosa Island", "Chinatown", "Orchard Road"],
      "Dubai": ["Burj Khalifa", "Palm Jumeirah", "Dubai Mall", "Gold Souk", "Dubai Marina"],
      "Rome": ["Colosseum", "Vatican City", "Trevi Fountain", "Pantheon", "Spanish Steps"],
      "Barcelona": ["Sagrada Familia", "Park Guell", "La Rambla", "Casa Batllo", "Gothic Quarter"],
      "Amsterdam": ["Anne Frank House", "Rijksmuseum", "Canal Cruise", "Vondelpark", "Dam Square"],
      "Istanbul": ["Hagia Sophia", "Blue Mosque", "Grand Bazaar", "Topkapi Palace", "Bosphorus Cruise"],
      "Bangkok": ["Grand Palace", "Wat Pho", "Chatuchak Market", "Khao San Road", "Jim Thompson House"],
      "Sydney": ["Opera House", "Harbour Bridge", "Bondi Beach", "Taronga Zoo", "The Rocks"],
      "Bermuda": ["Horseshoe Bay", "Crystal Caves", "Royal Naval Dockyard", "St George", "Gibbs Hill Lighthouse"],
      "Miami": ["South Beach", "Wynwood Walls", "Art Deco District", "Brickell", "Little Havana"],
      "Los Angeles": ["Hollywood Sign", "Santa Monica Pier", "Griffith Observatory", "Venice Beach", "Getty Center"],
      "San Francisco": ["Golden Gate Bridge", "Alcatraz Island", "Fishermans Wharf", "Chinatown", "Cable Cars"],
      "Chicago": ["Millennium Park", "Willis Tower", "Navy Pier", "Art Institute", "Magnificent Mile"],
      "Honolulu": ["Waikiki Beach", "Diamond Head", "Pearl Harbor", "North Shore", "Ala Moana"],
      "Cancun": ["Chichen Itza", "Isla Mujeres", "Xcaret Park", "Tulum Ruins", "Cenotes"],
      "Washington DC": ["Lincoln Memorial", "Capitol Building", "Smithsonian", "Georgetown", "National Mall"],
      "Boston": ["Freedom Trail", "Fenway Park", "Harvard Yard", "Boston Common", "Faneuil Hall"],
      "Seattle": ["Space Needle", "Pike Place Market", "Chihuly Garden", "Museum of Pop Culture", "Kerry Park"],
      "Toronto": ["CN Tower", "Royal Ontario Museum", "Distillery District", "Kensington Market", "Toronto Islands"],
      "Nassau": ["Atlantis Resort", "Cable Beach", "Fort Charlotte", "Blue Lagoon", "Junkanoo Beach"],
      "Vancouver": ["Stanley Park", "Granville Island", "Capilano Suspension Bridge", "Gastown", "English Bay"],
      "Montreal": ["Old Montreal", "Mount Royal", "Notre-Dame Basilica", "Jean-Talon Market", "Plateau"],
      "Nashville": ["Broadway", "Ryman Auditorium", "Parthenon", "Music Row", "Hot Chicken"],
      "Fort Lauderdale": ["Las Olas Boulevard", "Fort Lauderdale Beach", "Riverwalk", "Bonnet House", "Hugh Taylor Birch State Park"],
      "Jersey City": ["Liberty State Park", "Statue of Liberty View", "Exchange Place", "Newport Mall", "Hoboken Waterfront"],
    };
    // Collect all cities from upcoming trips
    const allCities = new Set();
    trips.slice(0, 6).forEach(trip => {
      const segs = (trip.segments || []).filter(s => !s._isMeta && s.type === "flight");
      segs.forEach(f => {
        [f.arrivalAirport, f.departureAirport].filter(Boolean).forEach(code => {
          const city = AIRPORT_CITY[code.toUpperCase()];
          if (city) allCities.add(city);
        });
        if (f.route) f.route.split(/[→\-–>\/]/).map(s => s.trim().toUpperCase()).filter(s => /^[A-Z]{3}$/.test(s)).forEach(code => {
          const city = AIRPORT_CITY[code]; if (city) allCities.add(city);
        });
      });
      if (trip.location) trip.location.split(/[,\/]/).map(s => s.trim()).filter(Boolean).forEach(l => allCities.add(l));
    });
    // Fire Places fetches immediately in parallel — cards already show fallback photos
    // so these are progressive upgrades, not blocking loads.
    let cityCount = 0;
    allCities.forEach(city => {
      if (cityCount >= 6) return;
      cityCount++;
      const lms = (CITY_LANDMARKS_ALL[city] || [`Visit ${city}`]).slice(0, 4);
      lms.forEach(lm => { fetchLandmarkPhoto(lm, city); });
    });
  }, [isLoggedIn, trips.length, activeView]);

  // ── Lounge helpers ──
  const fetchLoungePhoto = useCallback((loungeId, placeQuery) => {
    if (loungePhotoFetched.current.has(loungeId)) return;
    loungePhotoFetched.current.add(loungeId);
    loadGoogleMaps().then(() => {
      if (!window.google?.maps?.places) return;
      const svc = new window.google.maps.places.PlacesService(document.createElement("div"));
      svc.findPlaceFromQuery({ query: placeQuery, fields: ["photos"] }, (results, status) => {
        if (status === "OK" && results?.[0]?.photos?.[0]) {
          const url = results[0].photos[0].getUrl({ maxWidth: 600 });
          if (url) setLoungePhotos(prev => ({ ...prev, [loungeId]: url }));
        }
      });
    }).catch(() => {});
  }, []);

  // Fetch lounge photo when a lounge card is expanded
  useEffect(() => {
    if (!loungeExpandedId || !loungeAirport) return;
    const lounges = LOUNGE_DATABASE[loungeAirport] || [];
    const lounge = lounges.find(l => l.id === loungeExpandedId);
    if (lounge?.placeQuery) fetchLoungePhoto(loungeExpandedId, lounge.placeQuery);
  }, [loungeExpandedId, loungeAirport]);

  const getLoungeAccess = useCallback((network, lounge) => {
    const results = [];
    const flyingAlliance = loungeFlightAirline ? AIRLINE_ALLIANCE[loungeFlightAirline] : null;
    const flyingClass = loungeFlightClass || "economy";

    // 1. Card-based access — always available regardless of flight
    Object.keys(linkedAccounts).forEach(cardId => {
      const rules = CARD_LOUNGE_ACCESS[cardId];
      if (!rules) return;
      rules.forEach(rule => {
        if (rule.network === network) {
          const cardMeta = LOYALTY_PROGRAMS.creditCards.find(c => c.id === cardId);
          results.push({ source: "card", cardId, cardName: cardMeta?.name || cardId, guests: rule.guests, guestNote: rule.guestNote, condition: rule.condition });
        }
      });
    });

    // 2. Direct airline elite status access (e.g. AA EP → Admirals Club)
    const isIntl = loungeAccessRoute === "international";
    const flyingAaOrBa = loungeFlightAirline === "aa" || loungeFlightAirline === "ba_avios";
    const flyingPremium = flyingClass === "business" || flyingClass === "first";
    Object.entries(linkedAccounts).forEach(([progId, acct]) => {
      if (!acct.currentTier) return;
      const airline = ELITE_LOUNGE_ACCESS[progId];
      if (airline?.tiers?.[acct.currentTier]) {
        airline.tiers[acct.currentTier].lounges.forEach(rule => {
          if (rule.network !== network) return;
          // Route/cabin/airline condition checks
          const c = rule.condition;
          if (c === "intl_only" && !isIntl) return;
          if (c === "intl_oneworld" && (!isIntl || flyingAlliance !== "oneworld")) return;
          if (c === "intl_aa_oneworld" && (!isIntl || flyingAlliance !== "oneworld")) return;
          if (c === "intl_aa_or_ba" && (!isIntl || !flyingAaOrBa)) return;
          if (c === "intl_aa_first_cabin" && (!isIntl || loungeFlightAirline !== "aa" || flyingClass !== "first")) return;
          if (c === "intl_ua_or_star" && (!isIntl || (loungeFlightAirline !== "ua" && flyingAlliance !== "star"))) return;
          if (c === "intl_ua_polaris_cabin" && (!isIntl || loungeFlightAirline !== "ua" || !flyingPremium)) return;
          if (c === "same_day_ua" && loungeFlightAirline !== "ua") return;
          if (c === "same_day_dl" && loungeFlightAirline !== "dl") return;
          if (c === "same_day_ac_or_star" && flyingAlliance !== "star") return;
          if (c === "intl_premium_cabin" && (!isIntl || !flyingPremium)) return;
          if (c === "intl_first_cabin" && (!isIntl || flyingClass !== "first")) return;
          if (c === "intl_or_transcon" && !isIntl && !flyingPremium) return;
          results.push({ source: "elite", airlineName: airline.name, tier: acct.currentTier, guests: rule.guests, guestNote: rule.guestNote, condition: rule.condition });
        });
      }
    });

    // 3. Alliance-based access — ONLY when flying an airline in the SAME alliance
    if (flyingAlliance) {
      const checkedAlliances = new Set();
      Object.entries(linkedAccounts).forEach(([progId, acct]) => {
        if (!acct.currentTier) return;
        const mapping = ELITE_ALLIANCE_MAP[progId];
        if (!mapping || !mapping.tiers[acct.currentTier]) return;
        // Only grant alliance access if the user's status alliance matches the flying airline's alliance
        if (mapping.alliance !== flyingAlliance) return;
        const allianceLevel = mapping.tiers[acct.currentTier];
        const key = `${mapping.alliance}_${allianceLevel}`;
        if (checkedAlliances.has(key)) return;
        checkedAlliances.add(key);
        const allianceRules = ALLIANCE_LOUNGE_ACCESS[mapping.alliance]?.[allianceLevel];
        if (!allianceRules) return;
        allianceRules.lounges.forEach(rule => {
          if (!rule.networkTypes.includes(network)) return;
          // Only match if the lounge belongs to the same alliance
          if (lounge?.alliance && lounge.alliance !== "none" && lounge.alliance !== mapping.alliance) return;
          // Check cabin class requirement
          if (rule.class === "first_and_business" || rule.class === "business") {
            // Emerald gets first+business regardless of cabin; Sapphire/Gold need to be checked
            // For Emerald-level, access is regardless of cabin class
            // For lower levels, typically need business+ ticket unless status overrides
          }
          const allianceNames = { oneworld: "oneworld", star: "Star Alliance", skyteam: "SkyTeam" };
          results.push({ source: "alliance", airlineName: `${allianceNames[mapping.alliance]} ${allianceLevel}`, tier: acct.currentTier, guests: rule.guests, guestNote: rule.guestNote });
        });
      });
    }

    // 4. Cabin-class based access — flying business/first on the operating airline
    if ((flyingClass === "business" || flyingClass === "first") && loungeFlightAirline) {
      const airlineMeta = LOYALTY_PROGRAMS.airlines.find(a => a.id === loungeFlightAirline);
      const airlineName = airlineMeta?.name || loungeFlightAirline;

      // Flying business/first on the operating airline grants access to that airline's lounges
      const airlineNetworks = {
        cathay_mp: "cathay_lounge", qantas_ff: "qantas_lounge", singapore_kf: "singapore_lounge",
        ua: "united_club", dl: "delta_sky_club", aa: "admirals_club",
      };
      const operatingNetwork = airlineNetworks[loungeFlightAirline];
      if (operatingNetwork === network) {
        const alreadyHasAccess = results.length > 0;
        if (!alreadyHasAccess) {
          results.push({ source: "cabin", airlineName, tier: flyingClass === "first" ? "First Class ticket" : "Business Class ticket", guests: 0, guestNote: "Ticketed cabin access only" });
        }
      }

      const cabinLabel = flyingClass === "first" ? "First Class ticket" : "Business Class ticket";

      // oneworld: Flagship First Dining & Chelsea Lounge — AA/BA int'l First only
      if (isIntl && flyingClass === "first" && flyingAaOrBa) {
        if (network === "flagship" || network === "chelsea_lounge") {
          results.push({ source: "cabin", airlineName, tier: "First Class ticket", guests: 0, guestNote: `${network === "flagship" ? "Flagship First Dining" : "Chelsea Lounge"}: ticketed in int'l First Class on ${airlineName}` });
        }
      }

      // oneworld: Greenwich / Soho Lounge — AA/BA int'l premium cabin
      if (isIntl && flyingPremium && flyingAaOrBa) {
        if (network === "greenwich_lounge" || network === "soho_lounge") {
          const lName = network === "greenwich_lounge" ? "Greenwich Lounge" : "Soho Lounge";
          results.push({ source: "cabin", airlineName, tier: cabinLabel, guests: 0, guestNote: `${lName}: ticketed in int'l premium cabin on ${airlineName}` });
        }
      }

      // Star Alliance: United Polaris Lounge — UA int'l Polaris (business) only
      if (isIntl && flyingPremium && loungeFlightAirline === "ua" && network === "polaris") {
        results.push({ source: "cabin", airlineName, tier: "Polaris ticket", guests: 0, guestNote: `United Polaris Lounge: ticketed in int'l Polaris cabin on ${airlineName}` });
      }

      // Star Alliance: Lufthansa First Class Terminal / Lounge — LH/LX/OS int'l First only
      if (isIntl && flyingClass === "first" && (loungeFlightAirline === "lh" || loungeFlightAirline === "lx" || loungeFlightAirline === "os") && network === "lh_first") {
        results.push({ source: "cabin", airlineName, tier: "First Class ticket", guests: 0, guestNote: `Lufthansa First Class Terminal: ticketed in int'l First Class on ${airlineName}` });
      }

      // Star Alliance: ANA Suite Lounge — NH int'l First only
      if (isIntl && flyingClass === "first" && loungeFlightAirline === "ana_mc" && network === "ana_suite") {
        results.push({ source: "cabin", airlineName, tier: "First Class ticket", guests: 0, guestNote: `ANA Suite Lounge: ticketed in int'l First Class on ANA` });
      }

      // SkyTeam: Air France La Premiere — AF La Premiere (first) only
      if (isIntl && flyingClass === "first" && loungeFlightAirline === "flying_blue" && network === "af_la_premiere") {
        results.push({ source: "cabin", airlineName, tier: "La Premiere ticket", guests: 0, guestNote: `La Premiere: ticketed La Premiere on Air France int'l` });
      }
    }

    // 5. Final guard: premium cabin-gated lounges must never be granted by status alone.
    // Strip any results for these networks that didn't come from a card, ConciergeKey, or cabin source.
    const cabinGatedNetworks = new Set(["flagship", "chelsea_lounge", "polaris", "lh_first", "af_la_premiere", "ana_suite"]);
    if (cabinGatedNetworks.has(network)) {
      return results.filter(r => r.source === "card" || r.source === "cabin" || r.tier === "ConciergeKey" || r.tier === "Global Services");
    }

    return results;
  }, [linkedAccounts, loungeFlightAirline, loungeFlightClass, loungeAccessRoute]);

  // ============================================================
  // PUBLIC SITE — Landing, Content Pages, Login
  // ============================================================
  if (!isLoggedIn) {
    // Scroll-to-section helper
    const scrollTo = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth" }); };
    const navLinks = [
      { id: "features", label: "Features" },
      { id: "pricing", label: "Pricing" },
    ];
    const goTo = (page) => { setPublicPage(page); setCockpitSection(null); setSelectedPartner(null); window.scrollTo(0, 0); };
    const fontLink = <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />;

    // --- Top nav: Logo + Features + Pricing + Login ---
    const TopNav = () => (
      <nav style={{
        position: "sticky", top: 0, zIndex: 100, padding: isMobile ? "0 12px" : "0 32px", height: 56,
        background: "rgba(8,9,10,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid #2a2640",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button onClick={() => { goTo("landing"); }} style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: 0 }}>
          <img src="/continuum-travel-logo.svg" alt="Continuum" style={{ height: isMobile ? 40 : 112, display: "block" }} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {!isMobile && navLinks.map(n => (
            <button key={n.id} onClick={() => { if (publicPage === "landing") scrollTo(n.id); else { goTo("landing"); setTimeout(() => scrollTo(n.id), 100); }}} style={{
              padding: "18px 14px", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.03)",
              fontSize: 10.5, fontWeight: 600, fontFamily: "Space Mono, monospace", letterSpacing: 1.5, textTransform: "uppercase",
              color: "#8a8f98", transition: "all 0.25s cubic-bezier(0.175,0.885,0.32,1)",
            }}>{n.label}</button>
          ))}
          <button onClick={() => goTo("login")} style={{
            padding: isMobile ? "8px 16px" : "8px 22px", border: "1px solid #2a2640", cursor: "pointer", marginLeft: isMobile ? 0 : 16,
            fontSize: 10.5, fontWeight: 700, fontFamily: "Space Mono, monospace", letterSpacing: 1.5, textTransform: "uppercase",
            background: "#211e2e", color: "#f7f8f8", transition: "all 0.25s cubic-bezier(0.175,0.885,0.32,1)",
          }}>Log In</button>
        </div>
      </nav>
    );

    // --- Footer ---
    const Footer = () => (
      <footer style={{ position: "relative", zIndex: 1, padding: isMobile ? "32px 16px 24px" : "64px 32px 32px", borderTop: "1px solid #2a2640", background: "#08090a", marginTop: 0 }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", flexWrap: "wrap", gap: isMobile ? 32 : 48 }}>
          <div style={{ maxWidth: isMobile ? "100%" : 320 }}>
            <div style={{ marginBottom: 16 }}>
              <img src="/continuum-travel-logo.svg" alt="Continuum" style={{ height: isMobile ? 60 : 120, display: "block" }} />
            </div>
            <p style={{ fontSize: 13, color: "#8a8f98", fontFamily: "DM Sans, sans-serif", lineHeight: 1.7, fontWeight: 400 }}>
              Built by frequent flyers who got tired of spreadsheets. We track your status so you can focus on the journey.
            </p>
            <p style={{ fontSize: 11, color: "#62666d", fontFamily: "Space Mono, monospace", marginTop: 12 }}>Hamilton, Bermuda</p>
          </div>
          <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
            <div>
              <h4 style={{ fontSize: 9, fontWeight: 700, color: "#0EA5A0", textTransform: "uppercase", letterSpacing: 2, fontFamily: "Space Mono, monospace", marginBottom: 14 }}>Product</h4>
              {["Features", "Pricing", "How It Works"].map(l => (
                <button key={l} onClick={() => scrollTo(l.toLowerCase().replace(/ /g, "-"))} style={{ display: "block", background: "none", border: "none", color: "#62666d", fontSize: 12, fontFamily: "DM Sans, sans-serif", cursor: "pointer", padding: "4px 0", fontWeight: 400 }}>{l}</button>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: 9, fontWeight: 700, color: "#0EA5A0", textTransform: "uppercase", letterSpacing: 2, fontFamily: "Space Mono, monospace", marginBottom: 14 }}>Company</h4>
              {["About", "Contact", "Privacy"].map(l => (
                <button key={l} onClick={() => scrollTo("about")} style={{ display: "block", background: "none", border: "none", color: "#62666d", fontSize: 12, fontFamily: "DM Sans, sans-serif", cursor: "pointer", padding: "4px 0", fontWeight: 400 }}>{l}</button>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: 9, fontWeight: 700, color: "#0EA5A0", textTransform: "uppercase", letterSpacing: 2, fontFamily: "Space Mono, monospace", marginBottom: 14 }}>Connect</h4>
              {["Twitter / X", "LinkedIn", "Email Us"].map(l => (
                <span key={l} style={{ display: "block", color: "#62666d", fontSize: 12, fontFamily: "Inter, sans-serif", padding: "4px 0", fontWeight: 400, cursor: "pointer" }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1060, margin: "40px auto 0", paddingTop: 20, borderTop: "1px solid #2a2640", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 10, color: "#62666d", fontFamily: "Space Mono, monospace", letterSpacing: 1 }}>© 2026 CONTINUUM. ALL RIGHTS RESERVED.</p>
          <p style={{ fontSize: 10, color: "#62666d", fontFamily: "Space Mono, monospace" }}>BUILT IN BERMUDA 🇧🇲</p>
        </div>
      </footer>
    );

    // --- Shell ---
    const Shell = ({ children, showBg }) => (
      <div style={{ minHeight: "100vh", background: "#08090a", fontFamily: "Instrument Serif, DM Sans, Space Mono, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#f7f8f8", position: "relative" }}>
        <TravelAtmosphere />
        {fontLink}
        <TopNav />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
        <Footer />
      </div>
    );

    // Section label helper
    const SectionLabel = ({ label }) => (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <div style={{ width: 24, height: 2, background: "#0EA5A0" }} />
        <span style={{ fontSize: 9, fontFamily: "Space Mono, monospace", color: "#8a8f98", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>( {label} )</span>
      </div>
    );

    // ==================== COCKPIT LANDING PAGE ====================
    // Immersive full-screen cockpit with clickable instrument hotspots
    // Inspired by basement.studio's interactive canvas approach
    // ==================== COCKPIT LANDING — IMMERSIVE FLIGHT ====================
    if (publicPage === "landing") {
      const zones = [
        { id: "features", label: "Features", sub: "Flight Display", icon: "📊" },
        { id: "how-it-works", label: "How It Works", sub: "Navigation", icon: "🧭" },
        { id: "partners", label: "Partners", sub: "Comms Panel", icon: "📡" },
        { id: "about", label: "About", sub: "Autopilot", icon: "⚙️" },
        { id: "login", label: "Log In", sub: "Dashboard", icon: "—" },
      ];

      const renderSection = (id) => {
        if (id === "features") return (<div style={{ padding: "40px 0" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 2, background: "#2a2640" }}>{[{ icon: "📊", t: "Unified Dashboard", d: "Every airline, hotel, and rental car program in one live view." },{ icon: "🧠", t: "AI Status Optimizer", d: "The fastest, cheapest path to the next tier. Mileage runs included." },{ icon: "💳", t: "Credit Card Intel", d: "Match cards to spending patterns and status goals automatically." },{ icon: "📈", t: "Year-End Projections", d: "See where you'll land Dec 31 with trips and promos factored in." },{ icon: "🔔", t: "Status Alerts", d: "Notified when you're close to a tier or a mileage run deal appears." },{ icon: "🧾", t: "Expense Tracking", d: "Log expenses, snap receipts, export clean reports." }].map((f, i) => (<div key={i} style={{ background: "#1a1725", padding: "28px 24px", borderLeft: "2px solid rgba(14,165,160,0.3)" }}><span style={{ fontSize: 24 }}>{f.icon}</span><h3 style={{ fontSize: 15, fontWeight: 600, color: "#f7f8f8", margin: "12px 0 8px" }}>{f.t}</h3><p style={{ fontSize: 13, color: "#8a8f98", lineHeight: 1.65 }}>{f.d}</p></div>))}</div></div>);
        if (id === "how-it-works") return (<div style={{ padding: "40px 0" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2, background: "#2a2640" }}>{[{ s: "01", t: "Sign Up", d: "Free account in 30 seconds." },{ s: "02", t: "Import", d: "Connect loyalty accounts or enter manually." },{ s: "03", t: "AI Recs", d: "We analyze your patterns and show the path." },{ s: "04", t: "Hit Status", d: "Follow your roadmap. We track every mile." }].map((s, i) => (<div key={i} style={{ background: "#1a1725", padding: "28px 20px" }}><div style={{ fontSize: 32, fontFamily: "Space Mono, monospace", color: "#0EA5A0", fontWeight: 700, marginBottom: 12 }}>{s.s}</div><h3 style={{ fontSize: 15, fontWeight: 600, color: "#f7f8f8", margin: "0 0 8px" }}>{s.t}</h3><p style={{ fontSize: 13, color: "#8a8f98", lineHeight: 1.65 }}>{s.d}</p></div>))}</div></div>);
        if (id === "partners") {
          const partnerGroups = [
            { cat: "Airlines", items: [
              { n: "American Airlines", d: "aa.com", url: "https://www.aa.com", desc: "AAdvantage is one of the world's largest airline loyalty programs. Earn miles on American, oneworld, and partner flights plus everyday spending. Elite tiers — Gold, Platinum, Platinum Pro, and Executive Platinum — unlock systemwide upgrades, priority boarding, complimentary checked bags, and dedicated phone lines." },
              { n: "United Airlines", d: "united.com", url: "https://www.united.com", desc: "MileagePlus members earn miles on United, Star Alliance, and 40+ partners. Elite tiers — Silver, Gold, Platinum, and 1K — deliver priority boarding, upgrades, and dedicated customer service. 1K is among the most coveted domestic elite statuses, offering unlimited domestic upgrades and four global upgrades annually." },
              { n: "Delta Air Lines", d: "delta.com", url: "https://www.delta.com", desc: "SkyMiles never expire and can be earned on Delta, SkyTeam, and partner flights. Medallion tiers — Silver, Gold, Platinum, and Diamond — provide upgrade priority, Sky Club lounge access, and choice benefits. Diamond Medallion members receive a complimentary companion certificate and dedicated concierge support." },
              { n: "British Airways", d: "britishairways.com", url: "https://www.britishairways.com", desc: "Executive Club earns Avios on British Airways, Iberia, Aer Lingus, and all oneworld partners. Tiers — Blue, Bronze, Silver, and Gold — award bonus Avios, seat upgrades, and worldwide lounge access. Gold members benefit from confirmed upgrades and priority on every flight." },
              { n: "Cathay Pacific", d: "cathaypacific.com", url: "https://www.cathaypacific.com", desc: "Asia Miles is earned across oneworld, 30+ airline partners, hotels, and dining. Marco Polo Club tiers — Green, Silver, Gold, and Diamond — provide access to Cathay's award-winning lounges, seat upgrades, and bonus miles. Diamond members enjoy dedicated airport services and confirmed business class upgrades." },
              { n: "Japan Airlines", d: "jal.co.jp", url: "https://www.jal.co.jp", desc: "JAL Mileage Bank (JMB) rewards loyalty across JAL, oneworld, and dozens of global partners. JGC (JAL Global Club) membership grants permanent lounge access and elite privileges. JMB Diamond members receive the highest upgrade priority, exclusive ground services, and bonus mile multipliers." },
              { n: "Qantas", d: "qantas.com", url: "https://www.qantas.com", desc: "Qantas Frequent Flyer is Australia's most popular loyalty program with 15 million members. Points are earned on flights, Woolworths, and hundreds of partners. Elite tiers — Silver, Gold, Platinum, and Platinum One — offer lounge access, upgrade credits, and the ultra-exclusive Platinum One concierge." },
              { n: "Singapore Airlines", d: "singaporeair.com", url: "https://www.singaporeair.com", desc: "KrisFlyer miles are earned on Singapore Airlines, Scoot, and Star Alliance partners. KrisFlyer Elite Silver and Elite Gold tiers unlock priority check-in, extra baggage, and Silver or Gold Kris lounge access globally. Singapore Airlines is consistently rated among the world's finest for in-flight product." },
              { n: "Emirates", d: "emirates.com", url: "https://www.emirates.com", desc: "Skywards miles are earned on Emirates and flydubai flights, hotels, and retail partners. Tiers — Blue, Silver, Gold, and Platinum — deliver lounge access, upgrade awards, and bonus miles. Platinum members benefit from a dedicated relationship manager and unlimited first class upgrade opportunities." },
              { n: "Lufthansa", d: "lufthansa.com", url: "https://www.lufthansa.com", desc: "Miles & More is Europe's largest frequent flyer program, spanning Lufthansa Group and Star Alliance. Tiers — Frequent Traveller, Senator, and HON Circle — are invitation-only at the top level, making HON Circle one of aviation's most exclusive elite statuses, with just ~100,000 holders worldwide." },
              { n: "Air France", d: "airfrance.com", url: "https://www.airfrance.com", desc: "Flying Blue is the joint loyalty program of Air France and KLM, covering SkyTeam and 30+ partners. Tiers — Explorer, Silver, Gold, Platinum, and Ultimate — provide lounge access, upgrade vouchers, and bonus miles. Ultimate members enjoy dedicated account managers and unlimited upgrade confirmations." },
              { n: "Alaska Airlines", d: "alaskaair.com", url: "https://www.alaskaair.com", desc: "Mileage Plan is consistently rated North America's best airline loyalty program. Miles don't expire and the program partners with 13 airlines — including Emirates, Japan Airlines, and Cathay Pacific — for exceptional award redemption value. Elite tiers MVP, MVP Gold, and MVP Gold 75K reward loyalty with upgrades, lounge access, and companion fares." },
              { n: "ANA", d: "ana.co.jp", url: "https://www.ana.co.jp/en/us/", desc: "ANA Mileage Club is Japan's second-largest loyalty program, spanning ANA, Star Alliance, and dozens of partners. Elite tiers — Bronze, Platinum, and Super Flyers — deliver lounge access, upgrade priority, and bonus miles. Super Flyers Card membership grants permanent lounge access for life once the threshold is reached — one of aviation's most prized lifetime benefits." },
              { n: "EVA Air", d: "evaair.com", url: "https://www.evaair.com", desc: "Infinity MileageLands rewards loyalty across EVA Air, its subsidiary UNI Air, and Star Alliance partners. Elite tiers — Silver Card, Gold Card, and Diamond Card — provide lounge access, upgrade awards, and bonus miles. EVA Air is renowned for its Royal Laurel Class business product and consistent Skytrax five-star airline ratings." },
              { n: "Air Canada", d: "aircanada.com", url: "https://www.aircanada.com", desc: "Aeroplan is Canada's most popular loyalty program, rebuilt in 2020 with no blackout dates and dynamic award pricing. Miles are earned on Air Canada, Star Alliance, and 75+ partners. Elite tiers — 25K, 35K, 50K, 75K, and Super Elite 100K — provide Maple Leaf Lounge access, upgrade priority, and a dedicated Super Elite concierge line." },
              { n: "WestJet", d: "westjet.com", url: "https://www.westjet.com", desc: "WestJet Rewards is a simple cash-back style program where members earn WestJet dollars on every flight. Elite tiers — Silver, Gold, and Platinum — deliver bonus earnings, complimentary seat selection, and lounge access. Gold and Platinum members receive complimentary upgrades to Premium cabin when available at check-in." },
              { n: "KLM", d: "klm.com", url: "https://www.klm.com", desc: "Flying Blue is the joint loyalty program of KLM and Air France, covering SkyTeam and 30+ partners. Members earn Miles on KLM, Air France, Transavia, and hundreds of everyday partners. Tiers — Explorer, Silver, Gold, Platinum, and Ultimate — provide lounge access, upgrade vouchers, and bonus miles on every flight." },
              { n: "Air China", d: "airchina.com", url: "https://www.airchina.com", desc: "PhoenixMiles is Air China's loyalty program and one of the largest in Asia, spanning the Star Alliance network and dozens of Chinese domestic partners. Elite tiers — Silver, Gold, and Platinum — deliver lounge access, upgrade priority, and bonus mile multipliers. Platinum members enjoy confirmed upgrades and dedicated ground services at major Chinese hubs." },
              { n: "China Airlines", d: "china-airlines.com", url: "https://www.china-airlines.com", desc: "Dynasty Flyer rewards loyalty across China Airlines, Mandarin Airlines, and oneworld partners. Elite tiers — Silver Card, Gold Card, and Diamond Card — provide lounge access, upgrade awards, and priority services. China Airlines is a oneworld member and offers strong award redemptions to Asia-Pacific destinations, particularly Taiwan and greater China." },
              { n: "Etihad", d: "etihad.com", url: "https://www.etihad.com", desc: "Etihad Guest miles are earned on Etihad Airways and a broad network of airline, hotel, and retail partners. Elite tiers — Silver, Gold, and Platinum — deliver lounge access, upgrade credits, and bonus miles. Platinum members receive a dedicated relationship manager, confirmed First Suite upgrades, and access to the ultra-exclusive Al Fursan lounge at Abu Dhabi's Zayed International Airport." },
              { n: "Qatar Airways", d: "qatarairways.com", url: "https://www.qatarairways.com", desc: "Privilege Club miles are earned on Qatar Airways, oneworld partners, and 100+ everyday partners. Elite tiers — Burgundy, Silver, Gold, and Platinum — provide lounge access, upgrade awards, and bonus Qmiles. Qatar Airways has won the Skytrax World's Best Airline award multiple times and is widely considered to offer the finest business class product — Qsuite — in the sky." },
              { n: "Air India", d: "airindia.com", url: "https://www.airindia.com", desc: "Flying Returns is Air India's loyalty program, recently revamped following the airline's return to Tata Group ownership. Points are earned on Air India and Star Alliance flights, plus hotel and partner spending. Elite tiers — Silver, Gold, Platinum, and Maharaja — deliver lounge access, upgrade priority, and bonus point multipliers as Air India modernises its fleet and service." },
            ]},
            { cat: "Hotels", items: [
              { n: "Marriott Bonvoy", d: "marriott.com", url: "https://www.marriott.com", desc: "The world's largest hotel loyalty program spans 30+ brands and 8,000+ properties in 139 countries, from budget Fairfields to ultra-luxury Ritz-Carltons. Elite tiers — Silver, Gold, Platinum, Titanium, and Ambassador — unlock complimentary breakfast, suite upgrades, and lounge access. Ambassador Elite members receive a dedicated personal ambassador for 24/7 service." },
              { n: "Hilton Honors", d: "hilton.com", url: "https://www.hilton.com", desc: "Hilton Honors covers 7,000+ properties across 18 brands including Waldorf Astoria, Conrad, and Hampton Inn. Points never expire with activity, and members can pool points with family. Diamond status — the highest tier — delivers complimentary breakfast worldwide, executive lounge access, and confirmed room upgrades." },
              { n: "World of Hyatt", d: "hyatt.com", url: "https://www.hyatt.com", desc: "World of Hyatt is the preferred program for luxury and boutique hotel enthusiasts, covering 1,100+ properties including Park Hyatt, Grand Hyatt, and Alila. Globalist status — achieved at 60 nights — is considered the most rewarding hotel elite status available, offering confirmed suite upgrades, complimentary club lounge access, and guest of honor benefits." },
              { n: "IHG One Rewards", d: "ihg.com", url: "https://www.ihg.com", desc: "IHG One Rewards connects 6,000+ hotels across 18 brands — from Holiday Inn to InterContinental and Six Senses. Tiers — Club, Silver, Gold, Platinum, and Diamond Elite — provide bonus points, room upgrades, and early check-in. Diamond Elite members receive guaranteed room availability and confirmed upgrades at InterContinentals worldwide." },
              { n: "Accor Live Limitless", d: "accor.com", url: "https://all.accor.com", desc: "ALL (Accor Live Limitless) is Europe's leading hotel loyalty platform spanning 40+ brands and 5,500+ properties — from ibis to Fairmont and Raffles. Points are earned on stays, dining, spa, and partners. Platinum and Diamond members receive guaranteed late checkout, suite upgrades, and dedicated concierge service at luxury properties." },
              { n: "Wyndham Rewards", d: "wyndhamhotels.com", url: "https://www.wyndhamhotels.com", desc: "Wyndham Rewards covers 9,000+ hotels across 24 brands in 95 countries — the broadest network in the industry. The straightforward points system and fixed award night pricing make it easy to maximize. Diamond members receive complimentary upgrades, early check-in, late checkout, and priority customer care." },
            ]},
            { cat: "Credit Cards", items: [
              { n: "Amex Platinum", d: "americanexpress.com", url: "https://www.americanexpress.com", desc: "The American Express Platinum Card is the benchmark for premium travel rewards. Earn 5x Membership Rewards points on flights and prepaid hotels booked through Amex Travel. Perks include access to 1,400+ airport lounges (including exclusive Centurion Lounges), $200 airline fee credit, $200 hotel credit, TSA PreCheck/Global Entry, and elite status at Hilton and Marriott. Annual fee: $695." },
              { n: "Chase Sapphire Reserve", d: "chase.com", url: "https://www.chase.com", desc: "The Chase Sapphire Reserve earns 3x Ultimate Rewards points on travel and dining globally, with points worth 50% more when redeemed through Chase Travel. Access 1,300+ Priority Pass lounges worldwide. Points transfer at 1:1 to 14 airline and hotel partners including Hyatt, United, and British Airways. Comes with a $300 travel credit. Annual fee: $550." },
              { n: "Citi Premier", d: "citi.com", url: "https://www.citi.com", desc: "The Citi Strata Premier (formerly Citi Premier) is an underrated powerhouse, earning 3x ThankYou Points on air travel, hotels, restaurants, supermarkets, and gas stations. Points transfer to 18 airline partners including Turkish Miles&Smiles, Singapore KrisFlyer, and Flying Blue — ideal for international business class awards. Annual fee: $95." },
              { n: "Capital One Venture X", d: "capitalone.com", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Capital_One_logo.svg/512px-Capital_One_logo.svg.png", url: "https://www.capitalone.com", desc: "The Capital One Venture X earns 2x miles on all purchases, 5x on flights, and 10x on hotels booked through Capital One Travel. Access Capital One Lounges plus Priority Pass (1,300+ locations). Miles transfer to 15+ airline partners. The $300 travel credit and 10,000 annual bonus miles make it effectively free after the $395 annual fee." },
            ]},
          ];

          const PartnerLogo = ({ item, size = 36 }) => (
            <img
              src={item.logo || `https://logo.clearbit.com/${item.d}`}
              alt={item.n}
              style={{ width: size, height: size, objectFit: "contain" }}
              onError={e => {
                if (!e.target.dataset.fb) {
                  e.target.dataset.fb = "1";
                  e.target.src = `https://www.google.com/s2/favicons?domain=${item.d}&sz=64`;
                } else {
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML = `<span style="font-size:${Math.round(size*0.5)}px;font-weight:700;color:#0EA5A0;font-family:Space Mono,monospace">${item.n[0]}</span>`;
                }
              }}
            />
          );

          return (
            <>
              <div style={{ padding: "40px 0" }}>
                {partnerGroups.map(g => (
                  <div key={g.cat} style={{ marginBottom: 40 }}>
                    <h3 style={{ fontSize: 11, fontFamily: "Space Mono, monospace", color: "#0EA5A0", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>{g.cat}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                      {g.items.map(item => (
                        <div
                          key={item.n}
                          onClick={() => setSelectedPartner({ ...item, cat: g.cat })}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#211e2e", border: "1px solid #2a2640", borderRadius: 10, cursor: "pointer", transition: "border-color .2s, background .2s" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "#0EA5A0"; e.currentTarget.style.background = "#1a1c1f"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2640"; e.currentTarget.style.background = "#211e2e"; }}
                        >
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                            <PartnerLogo item={item} size={36} />
                          </div>
                          <span style={{ fontSize: 13, color: "#d0d6e0", fontWeight: 500 }}>{item.n}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Partner detail modal */}
              {selectedPartner && (
                <div
                  onClick={() => setSelectedPartner(null)}
                  style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(6px)" }}
                >
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{ background: "#211e2e", border: "1px solid #2e3138", borderRadius: 16, padding: 32, maxWidth: 500, width: "100%", position: "relative", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}
                  >
                    <button
                      onClick={() => setSelectedPartner(null)}
                      style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", cursor: "pointer", color: "#62666d", fontSize: 22, lineHeight: 1, padding: 4 }}
                    >×</button>

                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                        <PartnerLogo item={selectedPartner} size={48} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontFamily: "Space Mono, monospace", color: "#0EA5A0", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{selectedPartner.cat}</div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f7f8f8", margin: 0, lineHeight: 1.2 }}>{selectedPartner.n}</h2>
                      </div>
                    </div>

                    <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.75, marginBottom: 28, margin: "0 0 28px" }}>{selectedPartner.desc}</p>

                    <a
                      href={selectedPartner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0EA5A0", color: "#000", textDecoration: "none", borderRadius: 8, padding: "10px 20px", fontSize: 11, fontFamily: "Space Mono, monospace", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}
                    >
                      Visit Website ↗
                    </a>
                  </div>
                </div>
              )}
            </>
          );
        }
        if (id === "about") return (<div style={{ padding: "40px 0", maxWidth: 640 }}><p style={{ fontSize: 15, color: "#d0d6e0", lineHeight: 1.8, marginBottom: 20 }}>Continuum was born from frustration: tracking elite status across programs shouldn't require spreadsheets. We built the platform we wished existed.</p><p style={{ fontSize: 15, color: "#d0d6e0", lineHeight: 1.8, marginBottom: 28 }}>Based in Bermuda. Built by frequent flyers, reinsurance professionals, and travel obsessives.</p><div style={{ display: "flex", gap: 40 }}>{[{ v: "6", l: "Team" },{ v: "12M+", l: "Miles Tracked" },{ v: "2026", l: "Founded" }].map((s, i) => (<div key={i}><div style={{ fontSize: 24, fontFamily: "Space Mono, monospace", color: "#0EA5A0", fontWeight: 700 }}>{s.v}</div><div style={{ fontSize: 10, fontFamily: "Space Mono, monospace", color: "#62666d", letterSpacing: 1.5, marginTop: 2, textTransform: "uppercase" }}>{s.l}</div></div>))}</div></div>);
        if (id === "login") { goTo("login"); return null; }
        return null;
      };

      return (
        <div style={{ minHeight: "100vh", color: "#f7f8f8", fontFamily: "Inter, -apple-system, sans-serif", overflow: "hidden" }}>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
          {showChime && (<div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 300, background: "rgba(14,165,160,0.15)", border: "1px solid rgba(14,165,160,0.3)", borderRadius: 8, padding: "8px 20px", display: "flex", alignItems: "center", gap: 8 }}><span>🔔</span><span style={{ fontSize: 11, fontFamily: "Space Mono, monospace", color: "#0EA5A0", letterSpacing: 1 }}>FASTEN SEATBELT</span></div>)}

          {/* Global PA mute toggle — visible on all pages while announcement is active */}
          {audioPlayed && !paEnded && (
            <button
              onClick={() => { if (paMuted) { window.speechSynthesis?.resume(); setPaMuted(false); } else { window.speechSynthesis?.pause(); setPaMuted(true); } }}
              style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "rgba(8,8,12,0.88)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 10, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, backdropFilter: "blur(12px)", boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}
            >
              <span style={{ fontSize: 15 }}>{paMuted ? "🔊" : "🔇"}</span>
              <span style={{ fontSize: 9, fontFamily: "Space Mono, monospace", color: "#8a8f98", letterSpacing: 1 }}>{paMuted ? "RESUME PA" : "MUTE PA"}</span>
            </button>
          )}

          {!cockpitSection ? (
            <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
              {/* Background image */}
              <img src="/cockpit.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", pointerEvents: "none", userSelect: "none" }} />

              {/* Clickable zone overlay — SVG matches cover scaling of the image */}
              <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden", zIndex: 5 }} viewBox="0 0 1772 1181" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <style>{`
                    @keyframes cz-flash { 0%,100%{stroke:rgba(255,255,255,0.07);fill:rgba(255,255,255,0)} 50%{stroke:rgba(255,255,255,0.32);fill:rgba(255,255,255,0.03)} }
                    .cz{stroke-width:1.5;stroke-dasharray:8 5;cursor:pointer;animation:cz-flash 2.8s ease-in-out infinite;}
                    ${isMobile
                      ? `.czg:active .cz{fill:rgba(255,255,255,0.12);stroke:rgba(255,255,255,0.6);animation:none}.ctt{opacity:1;pointer-events:none}`
                      : `.czg:hover .cz{fill:rgba(255,255,255,0.07);stroke:rgba(255,255,255,0.5);animation:none;transition:fill .2s,stroke .2s}.ctt{opacity:0;pointer-events:none;transition:opacity .2s}.czg:hover .ctt{opacity:1}`
                    }
                  `}</style>
                </defs>
                {/* Orange → Partners  x=787 y=565 w=180 h=66 */}
                <g className="czg" onClick={() => setCockpitSection("partners")} style={{ cursor: "pointer" }}>
                  <rect className="cz" x={787} y={565} width={180} height={66} />
                  <g className="ctt">
                    <rect x={819} y={538} width={115} height={22} rx={4} fill="rgba(0,0,0,0.85)" />
                    <text x={876} y={553} fontSize={11} fill="#f0f0f0" textAnchor="middle" fontFamily="Space Mono, monospace" letterSpacing={2}>PARTNERS</text>
                  </g>
                </g>
                {/* Yellow → Features  x=13 y=645 w=198 h=290 */}
                <g className="czg" onClick={() => setCockpitSection("features")} style={{ cursor: "pointer" }}>
                  <rect className="cz" x={13} y={645} width={198} height={290} />
                  <g className="ctt">
                    <rect x={13} y={618} width={115} height={22} rx={4} fill="rgba(0,0,0,0.85)" />
                    <text x={70} y={633} fontSize={11} fill="#f0f0f0" textAnchor="middle" fontFamily="Space Mono, monospace" letterSpacing={2}>FEATURES</text>
                  </g>
                </g>
                {/* Green → About  x=1508 y=625 w=237 h=306 */}
                <g className="czg" onClick={() => setCockpitSection("about")} style={{ cursor: "pointer" }}>
                  <rect className="cz" x={1508} y={625} width={237} height={306} />
                  <g className="ctt">
                    <rect x={1567} y={598} width={85} height={22} rx={4} fill="rgba(0,0,0,0.85)" />
                    <text x={1609} y={613} fontSize={11} fill="#f0f0f0" textAnchor="middle" fontFamily="Space Mono, monospace" letterSpacing={2}>ABOUT</text>
                  </g>
                </g>
                {/* Red → How It Works  x=822 y=676 w=117 h=151 */}
                <g className="czg" onClick={() => setCockpitSection("how-it-works")} style={{ cursor: "pointer" }}>
                  <rect className="cz" x={822} y={676} width={117} height={151} />
                  <g className="ctt">
                    <rect x={800} y={649} width={160} height={22} rx={4} fill="rgba(0,0,0,0.85)" />
                    <text x={880} y={664} fontSize={11} fill="#f0f0f0" textAnchor="middle" fontFamily="Space Mono, monospace" letterSpacing={2}>HOW IT WORKS</text>
                  </g>
                </g>
              </svg>

              {/* Logo top-left */}
              <div style={{ position: "absolute", top: 0, left: 0, zIndex: 20 }}>
                <img src="/continuum-travel-logo.svg" alt="Continuum" style={{ height: isMobile ? 56 : 140, display: "block" }} />
              </div>

              {/* Top-right: flight code + log in */}
              <div style={{ position: "absolute", top: 16, right: 20, zIndex: 20, display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 9, fontFamily: "Space Mono, monospace", color: "#0EA5A0", letterSpacing: 2 }}>CTM-2026</span>
                <button onClick={() => goTo("login")} style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 9, fontFamily: "Space Mono, monospace", color: "rgba(255,255,255,0.6)",
                  letterSpacing: 2, textTransform: "uppercase", padding: 0,
                  transition: "color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "#E8883A"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                >Log In →</button>
              </div>

              {/* Bottom gradient + headline */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)", zIndex: 8, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: isMobile ? 80 : 64, left: "50%", transform: "translateX(-50%)", zIndex: 10, textAlign: "center", pointerEvents: "none", width: isMobile ? "90%" : "auto", whiteSpace: "nowrap" }}>
                <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.6rem)", fontFamily: "Instrument Serif, serif", fontWeight: 400, fontStyle: "italic", color: "#f0ece6", margin: 0, letterSpacing: "-0.01em" }}>
                  Your status.{" "}<span style={{ color: "#E8883A" }}>Your cockpit.</span>
                </h1>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "Space Mono, monospace" }}>
                  Elite status tracking, reimagined.
                </p>
              </div>


              {!audioPlayed && (
                <div style={{ position: "absolute", top: "55%", left: "50%", transform: "translateX(-50%)", zIndex: 10, pointerEvents: "none" }}>
                  <p style={{ fontSize: 10, fontFamily: "Space Mono, monospace", color: "#62666d", letterSpacing: 2, textTransform: "uppercase", animation: "float-precise 2s ease-in-out infinite" }}>Click to begin</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ minHeight: "100vh", background: "#08090a" }}>
              <div style={{ padding: isMobile ? "12px 16px" : "20px 32px", borderBottom: "1px solid #2a2640", display: "flex", alignItems: "center", gap: isMobile ? 10 : 16, flexWrap: isMobile ? "wrap" : "nowrap" }}>
                <button onClick={() => setCockpitSection(null)} style={{ background: "#211e2e", border: "1px solid #2a2640", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontFamily: "Space Mono, monospace", color: "#8a8f98" }}>← Cockpit</button>
                <div><h1 style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, color: "#f7f8f8", margin: 0 }}>{zones.find(z => z.id === cockpitSection)?.label}</h1></div>
                <div style={{ marginLeft: "auto" }}><button onClick={() => goTo("login")} style={{ background: "#0EA5A0", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 11, fontFamily: "Space Mono, monospace", fontWeight: 700, color: "#000", letterSpacing: 1, textTransform: "uppercase" }}>Log In →</button></div>
              </div>
              <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "0 16px" : "0 32px" }}>{renderSection(cockpitSection)}</div>
              <Footer />
            </div>
          )}
        </div>
      );
    }

    // ==================== LOGIN PAGE (Full-screen Paris BG + Centered Card) ====================
    const inputStyle = {
      display: "block", width: "100%", padding: isMobile ? "7px 10px" : "9px 12px", boxSizing: "border-box",
      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 8, color: "#f7f8f8", fontSize: isMobile ? 11 : 12, fontFamily: "Inter, DM Sans, sans-serif",
      outline: "none", transition: "border-color 0.2s",
    };
    const socialBtn = (icon, label, onClick, disabled = false) => (
      <button
        key={label}
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
        onMouseEnter={disabled ? undefined : (e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; })}
        onMouseLeave={disabled ? undefined : (e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; })}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? 6 : 8,
          width: "100%", padding: isMobile ? "6px 0" : "8px 0", border: `1px solid ${disabled ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.12)"}`,
          borderRadius: 8, background: "rgba(255,255,255,0.03)", cursor: disabled ? "not-allowed" : "pointer",
          fontSize: isMobile ? 11 : 12, fontWeight: 500, color: disabled ? "rgba(255,255,255,0.25)" : "#f0f0f0",
          fontFamily: "Inter, DM Sans, sans-serif", opacity: disabled ? 0.5 : 1,
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        {icon}
        <span>{label}</span>
        {disabled && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginLeft: 2 }}>coming soon</span>}
      </button>
    );

    return (
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", fontFamily: "Inter, DM Sans, sans-serif" }}>
        {fontLink}

        {/* Full-bleed cockpit background */}
        <img
          src="/cockpit.jpg"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: isMobile ? "center 30%" : "center", filter: isMobile ? "brightness(0.7) saturate(1.1) contrast(1.1)" : "brightness(0.55) saturate(1.05) contrast(1.05)" }}
        />
        {/* Vignette — on mobile, gradient from bottom to let cockpit show up top */}
        <div style={{ position: "absolute", inset: 0, background: isMobile
          ? "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.7) 68%, rgba(8,9,10,0.95) 85%)"
          : "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)"
        }} />

        {/* PA mute button */}
        {audioPlayed && !paEnded && (
          <button
            onClick={() => { if (paMuted) { window.speechSynthesis?.resume(); setPaMuted(false); } else { window.speechSynthesis?.pause(); setPaMuted(true); } }}
            style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "rgba(8,8,12,0.88)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 10, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, backdropFilter: "blur(12px)", boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}
          >
            <span style={{ fontSize: 15 }}>{paMuted ? "🔊" : "🔇"}</span>
            <span style={{ fontSize: 9, fontFamily: "Space Mono, monospace", color: "#8a8f98", letterSpacing: 1 }}>{paMuted ? "RESUME PA" : "MUTE PA"}</span>
          </button>
        )}


        {/* Centered logo at top */}
        <div style={{
          position: "absolute", top: isMobile ? 32 : 40, left: 0, right: 0, zIndex: 5,
          display: "flex", justifyContent: "center", pointerEvents: "none",
        }}>
          <img src="/continuum-travel-logo.svg" alt="Continuum" style={{ height: isMobile ? 120 : 150, filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.6))" }} />
        </div>

        {/* Login card */}
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: isMobile ? "flex-end" : "center",
          justifyContent: isMobile ? "center" : "flex-start",
          padding: isMobile ? "20px 20px calc(env(safe-area-inset-bottom, 0px) + 24px)" : "0 0 0 60px",
          overflowY: "auto",
        }}>
          <div style={{
            width: "100%", maxWidth: isMobile ? "100%" : 360,
            opacity: animateIn ? 1 : 0, transform: animateIn ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)",
          }}>

            {/* Card */}
            <div style={{
              background: "rgba(12,13,16,0.76)",
              backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: isMobile ? 14 : 16,
              padding: isMobile ? "14px 16px 12px" : "22px 24px 20px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}>
              {/* Heading */}
              <div style={{ marginBottom: isMobile ? 10 : 14 }}>
                <h1 style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, color: "#f7f8f8", margin: "0 0 2px", letterSpacing: -0.3, lineHeight: 1.2 }}>
                  {isRegistering ? "Create your account" : "Welcome back"}
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: isMobile ? 11 : 12, margin: 0 }}>
                  {isRegistering ? "Start tracking your elite status today" : "Sign in to continue your journey"}
                </p>
              </div>

              {/* Social login buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 5 : 7, marginBottom: isMobile ? 10 : 14 }}>
                {socialBtn(
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
                  "Continue with Google",
                  () => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: "https://gocontinuum.app" } })
                )}
                {socialBtn(
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.25)"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>,
                  "Continue with Apple",
                  null, true
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {socialBtn(
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.25)"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>,
                    "GitHub",
                    null, true
                  )}
                  {socialBtn(
                    <svg width="18" height="18" viewBox="0 0 24 24"><path d="M21.35 11.1H12.18V13.83H18.69C18.36 17.64 15.19 19.27 12.19 19.27C8.36 19.27 5 16.25 5 12C5 7.9 8.2 4.73 12.2 4.73C15.29 4.73 17.1 6.7 17.1 6.7L19 4.72C19 4.72 16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12C2.03 17.05 6.16 22 12.25 22C17.6 22 21.5 18.33 21.5 12.91C21.5 11.76 21.35 11.1 21.35 11.1Z" fill="rgba(66,133,244,0.4)"/></svg>,
                    "Microsoft",
                    null, true
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isMobile ? 8 : 14 }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                <span style={{ fontSize: isMobile ? 9 : 10, color: "rgba(255,255,255,0.35)", fontWeight: 500, letterSpacing: "0.05em" }}>or continue with email</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
              </div>

              {/* Form */}
              {!isRegistering ? (
                <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 6 : 8 }}>
                  <input
                    type="email" placeholder="Email address"
                    value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = "rgba(14,165,160,0.6)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                    style={inputStyle}
                  />
                  <div>
                    <input
                      type="password" placeholder="Password"
                      value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                      onFocus={e => e.target.style.borderColor = "rgba(14,165,160,0.6)"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                      style={inputStyle}
                    />
                    <div style={{ textAlign: "right", marginTop: 6 }}>
                      <button style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", padding: 0 }}>Forgot password?</button>
                    </div>
                  </div>
                  {authError && !isRegistering && (
                    <div style={{ fontSize: 11, color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 6, padding: "8px 12px", fontFamily: "Inter, sans-serif" }}>{authError}</div>
                  )}
                  <button
                    onClick={handleLogin}
                    disabled={authLoading}
                    onMouseEnter={e => e.currentTarget.style.background = "#0cb8b2"}
                    onMouseLeave={e => e.currentTarget.style.background = "#0EA5A0"}
                    style={{ width: "100%", padding: isMobile ? "8px 0" : "10px 0", border: "none", borderRadius: 8, cursor: authLoading ? "default" : "pointer", fontSize: isMobile ? 12 : 13, fontWeight: 600, fontFamily: "Inter, sans-serif", background: "#0EA5A0", color: "#fff", letterSpacing: 0.2, boxShadow: "0 4px 16px rgba(14,165,160,0.35)", transition: "background 0.2s", opacity: authLoading ? 0.7 : 1 }}
                  >
                    {authLoading ? "Signing in…" : "Sign in"}
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 6 : 8 }}>
                  <input
                    placeholder="Full name"
                    value={registerForm.name} onChange={e => setRegisterForm(p => ({ ...p, name: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = "rgba(14,165,160,0.6)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                    style={inputStyle}
                  />
                  <input
                    type="email" placeholder="Email address"
                    value={registerForm.email} onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = "rgba(14,165,160,0.6)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                    style={inputStyle}
                  />
                  <input
                    type="password" placeholder="Create a password"
                    value={registerForm.password} onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = "rgba(14,165,160,0.6)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                    style={inputStyle}
                  />
                  {authError && isRegistering && (
                    <div style={{ fontSize: 11, color: authError.startsWith("Check") ? "#34d399" : "#f87171", background: authError.startsWith("Check") ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${authError.startsWith("Check") ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`, borderRadius: 6, padding: "8px 12px", fontFamily: "Inter, sans-serif" }}>{authError}</div>
                  )}
                  <button
                    onClick={handleRegister}
                    disabled={authLoading}
                    onMouseEnter={e => e.currentTarget.style.background = "#0cb8b2"}
                    onMouseLeave={e => e.currentTarget.style.background = "#0EA5A0"}
                    style={{ width: "100%", padding: isMobile ? "8px 0" : "10px 0", border: "none", borderRadius: 8, cursor: authLoading ? "default" : "pointer", fontSize: isMobile ? 12 : 13, fontWeight: 600, fontFamily: "Inter, sans-serif", background: "#0EA5A0", color: "#fff", letterSpacing: 0.2, boxShadow: "0 4px 16px rgba(14,165,160,0.35)", transition: "background 0.2s", opacity: authLoading ? 0.7 : 1 }}
                  >
                    {authLoading ? "Creating account…" : "Create account"}
                  </button>
                </div>
              )}

              {/* Toggle sign in / register */}
              <p style={{ textAlign: "center", marginTop: isMobile ? 8 : 12, marginBottom: 0, fontSize: isMobile ? 10 : 11, color: "rgba(255,255,255,0.35)", fontFamily: "Inter, sans-serif" }}>
                {isRegistering ? "Already have an account? " : "Don't have an account? "}
                <button
                  onClick={() => { setIsRegistering(r => !r); setAuthError(""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#0EA5A0", fontWeight: 600, fontSize: isMobile ? 11 : 12, fontFamily: "Inter, sans-serif", padding: 0 }}
                >
                  {isRegistering ? "Sign in" : "Sign up"}
                </button>
              </p>
            </div>

            {/* Terms */}
            <p style={{ textAlign: "center", marginTop: isMobile ? 6 : 10, fontSize: isMobile ? 9 : 10, color: "rgba(255,255,255,0.25)", fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>
              By continuing, you agree to our{" "}
              <span style={{ color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>Terms of Service</span>
              {" "}and{" "}
              <span style={{ color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // VIEWS
  // ============================================================
  const todayStr = new Date().toISOString().slice(0, 10);
  // Get the latest date of a trip (last segment date, dropoff date, or checkout date)
  const getTripEndDate = (t) => {
    let latest = t._endDate || t.date || "";
    // Check metadata in segments
    if (t.segments && t.segments.length > 0) {
      const meta = t.segments.find(s => s._isMeta);
      if (meta?._endDate && meta._endDate > latest) latest = meta._endDate;
      for (const seg of t.segments) {
        if (seg._isMeta) continue;
        if (seg.date && seg.date > latest) latest = seg.date;
        if (seg.dropoffDate && seg.dropoffDate > latest) latest = seg.dropoffDate;
        // Hotel checkout: date + nights
        if (seg.type === "hotel" && seg.date && seg.nights) {
          const checkout = new Date(seg.date + "T12:00:00");
          checkout.setDate(checkout.getDate() + (parseInt(seg.nights) || 1));
          const checkoutStr = checkout.toISOString().slice(0, 10);
          if (checkoutStr > latest) latest = checkoutStr;
        }
      }
    }
    // Single-segment hotel
    if (t.type === "hotel" && t.date && t.nights) {
      const checkout = new Date(t.date + "T12:00:00");
      checkout.setDate(checkout.getDate() + (parseInt(t.nights) || 1));
      const checkoutStr = checkout.toISOString().slice(0, 10);
      if (checkoutStr > latest) latest = checkoutStr;
    }
    if (t.dropoffDate && t.dropoffDate > latest) latest = t.dropoffDate;
    return latest;
  };
  // Format trip date range: "Apr 5 – Apr 12" or "Apr 5" if no end date
  const formatTripDates = (trip) => {
    const start = trip.date;
    const end = getTripEndDate(trip);
    if (!start) return "No dates";
    const fmt = d => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (end && end !== start) return `${fmt(start)} – ${fmt(end)}`;
    return fmt(start);
  };

  const allTripsWithShared = [...trips, ...sharedTrips];
  const filteredTrips = allTripsWithShared.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (searchQuery && !JSON.stringify(t).toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  const upcomingTripsFiltered = filteredTrips.filter(t => { const end = getTripEndDate(t); return !end || end >= todayStr; }).sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  const pastTripsFiltered = filteredTrips.filter(t => { const end = getTripEndDate(t); return end && end < todayStr; }).sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const renderDashboard = () => renderDashboardPage({
    css, isMobile, user, trips, expenses, sharedTrips, darkMode,
    dashSubTab, setDashSubTab, savedItineraries, setSavedItineraries,
    setActiveView, setTripDetailId, setTripDetailSegIdx,
    setShowCreateTrip, setShowAddExpense, setNewExpense, setEditExpenseId,
    setShowReceiptQR, setShowPasteItinerary, setViewExpenseId,
    setExpandedItinId, expandedItinId,
    landmarkPhotos, userForwardingAddress,
    formatTripDates, getTripExpenses, getTripTotal, getTripName,
    getFlightLiveStatus, getPackingItems, packingLists, customPackItems,
    EXPENSE_CATEGORIES, SegIcon, SectionLabel,
    nextTrip, upcomingTripsFiltered, allTripsWithShared,
    pushSupported, pushEnabled, enablePushNotifications,
    addTripFromItinerary, dismissItinerary, updateItinSeg: (itinId, segIdx, updates) => {
      setSavedItineraries(prev => prev.map(it => it.id !== itinId ? it : { ...it, parsed_segments: it.parsed_segments.map((s, i) => i === segIdx ? { ...s, ...updates } : s) }));
    },
    snapReceiptProcessing, handleSnapReceipt, snapReceiptInputRef,
    BLANK_EXPENSE, AIRPORT_CITY,
    lp: { ...css, bg: css.bg, surface: css.surface, surface2: css.surface2, border: css.border, border2: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)", text: css.text, text2: css.text2, dim: css.text3, teal: css.accent, tealDim: css.accentBg, tealBord: css.accentBorder, red: darkMode ? "#ef4444" : "#dc2626", green: css.success, mono: "'Geist Mono', 'JetBrains Mono', ui-monospace, monospace", sans: "'Instrument Sans', 'Outfit', sans-serif" },
  });

  const renderPrograms = (_previewSub = null) => renderProgramsPage({ css, isMobile, darkMode, user, linkedAccounts, setLinkedAccounts, supabase, progAddType, setProgAddType, progAddId, setProgAddId, progAddTier, setProgAddTier, ProgramLogo, expandedCardId, setExpandedCardId, cardBenefitValues, setCardBenefitValue, cardCustomBenefits, addCustomBenefit, updateCustomBenefit, removeCustomBenefit, getCardNetValue, showConfirm }, _previewSub);
  const renderExpenses = () => {
    // Redirect handled by navItem click
    return null;
  };


  const renderOptimizer = (_previewTab = null) => renderOptimizerPage({
    css, isMobile, user, trips, linkedAccounts, allPrograms,
    calcSegmentCredits, calcTripEarnings, getBookingClassCabin, greatCircleMiles, segProgName,
    itinSegments, setItinSegments, itinCreditAirline, setItinCreditAirline, itinCurrentTier, setItinCurrentTier,
    itinFare, setItinFare, itinHistory, setItinHistory, showItinHistory, setShowItinHistory,
    optimizerTab, setOptimizerTab, optimizerTripId, setOptimizerTripId,
    ccOptTarget, setCcOptTarget, ccOptAmount, setCcOptAmount, ccBookingMode, setCcBookingMode,
    allianceGoal, setAllianceGoal, setActiveView, AIRPORT_COORDS, AIRPORT_CITY,
    formatTripDates,
  }, _previewTab);

  const renderExpenseReports = () => renderExpenseReportsPage({ css, isMobile, darkMode, user, trips, expenses, allPrograms, supabase, standaloneReports, setStandaloneReports, showReportBuilder, setShowReportBuilder, reportBuilder, setReportBuilder, editingReportId, setEditingReportId, reportBuilderCustom, setReportBuilderCustom, forwardReportId, setForwardReportId, forwardEmail, setForwardEmail, forwardStatus, setForwardStatus, EXPENSE_CATEGORIES, showConfirm, getTripExpenses, getTripTotal, getTripName, formatTripDates, getReportExpenses, buildPrintReport, openReportWindow });
  const renderReports = () => renderReportsPage({ css, isMobile, darkMode, user, trips, expenses, linkedAccounts, allPrograms, EXPENSE_CATEGORIES, AIRPORT_COORDS, AIRPORT_CITY, getTripExpenses, getTripTotal, getTripName, formatTripDates, haversineDistance, parseRoute, greatCircleMiles });
  const renderAlliances = () => renderAlliancesPage({ css, isMobile, darkMode, user, linkedAccounts, allPrograms, ProgramLogo });
  const renderInsights = (_previewTab = null) => renderInsightsPage({ css, isMobile, darkMode, user, trips, expenses, linkedAccounts, allPrograms, insightsTab, setInsightsTab, EXPENSE_CATEGORIES, formatTripDates, getTripExpenses, getTripTotal, getTripName, AIRPORT_CITY, setActiveView }, _previewTab);
  const renderPremium = () => renderPremiumPage({ css, isMobile, darkMode });
  const renderNews = () => renderNewsPage({ css, isMobile, darkMode, newsItems, newsLoading, newsError, fetchNews, NEWS_SOURCES });
  const renderLounges = () => renderLoungesPage({ css, isMobile, darkMode, user, linkedAccounts, loungeAirport, setLoungeAirport, loungeSearchCode, setLoungeSearchCode, loungeDropdownOpen, setLoungeDropdownOpen, loungeExpandedId, setLoungeExpandedId, loungeFlightAirline, setLoungeFlightAirline, loungeFlightClass, setLoungeFlightClass, loungeAccessRoute, setLoungeAccessRoute, loungePhotos, loungeVisits, setLoungeVisits, getLoungeAccess, saveLoungeVisit, removeLoungeVisit, fetchLoungePhoto, AIRPORT_CITY, showConfirm });
  // NAV CONFIG
  // ============================================================
  // SVG icon components for sidebar — clean, minimal stroke icons
  const NavIcon = ({ d, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{typeof d === "string" ? <path d={d} /> : d}</svg>
  );
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <NavIcon d={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="14" y="11" width="7" height="10" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>} /> },
    { id: "trips", label: "Trips", icon: <NavIcon d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1L11 12l-2 3H6l-2 2 4-1 4-1 2 7.5 2-2v-3l-3-2 4.8-7.3" /> },
    { id: "expensereports", label: "Expenses", icon: <NavIcon d={<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></>} /> },
    { id: "programs", label: "Programs", icon: <NavIcon d={<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>} /> },
    { id: "lounges", label: "Lounges", icon: <NavIcon d={<><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></>} /> },
  ];

  const viewRenderers = { dashboard: renderDashboard, programs: renderPrograms, trips: renderTrips, expensereports: renderExpenseReports, expenses: renderExpenses, optimizer: renderOptimizer, insights: renderInsights, reports: renderReports, alliances: renderAlliances, news: renderNews, premium: renderPremium, lounges: renderLounges };

  // ============================================================
  // MAIN LAYOUT — Warm Editorial Design System
  // ============================================================
  const D = darkMode;
  const css = {
    bg: D ? "#0f0f0f" : "#ffffff",
    surface: D ? "#1a1a1a" : "#ffffff",
    surface2: D ? "#222222" : "#f2f2f2",
    surface3: D ? "#2a2a2a" : "#e8e8e8",
    border: D ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
    text: D ? "#f5f5f5" : "#1a1a1a",
    text2: D ? "#c0c0c0" : "#4a4a4a",
    text3: D ? "#808080" : "#8a8a8a",
    accent: D ? "#E8883A" : "#D4742D",
    accentBg: D ? "rgba(232,136,58,0.10)" : "rgba(212,116,45,0.06)",
    accentBorder: D ? "rgba(232,136,58,0.20)" : "rgba(212,116,45,0.12)",
    gold: "#C9A84C",
    goldBg: D ? "rgba(201,168,76,0.08)" : "#FDF8EE",
    success: D ? "#22c55e" : "#16a34a",
    successBg: D ? "rgba(34,197,94,0.08)" : "rgba(22,163,74,0.06)",
    warning: D ? "#f59e0b" : "#d97706",
    warningBg: D ? "rgba(245,158,11,0.08)" : "rgba(217,119,6,0.06)",
    nav: D ? "rgba(15,15,15,0.97)" : "rgba(255,255,255,0.97)",
    shadow: D ? "0 1px 3px rgba(0,0,0,0.4)" : "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    shadowHover: D ? "0 4px 12px rgba(0,0,0,0.5)" : "0 4px 12px rgba(0,0,0,0.08)",
    radius: "12px",
  };

  // ── PWA Install Prompt ──
  const InstallPrompt = () => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const dismiss = () => { setShowInstallPrompt(false); sessionStorage.setItem("pwa-prompt-dismissed", "1"); };

    const handleAndroidInstall = async () => {
      if (!deferredInstallEvent) return;
      deferredInstallEvent.prompt();
      const { outcome } = await deferredInstallEvent.userChoice;
      if (outcome === "accepted") { setDeferredInstallEvent(null); setShowInstallPrompt(false); }
    };

    if (!showInstallPrompt) return null;

    return (
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
        padding: "0 12px 12px", paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
        pointerEvents: "none",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #1C1914 0%, #211e14 100%)",
          border: "1px solid rgba(201,168,76,0.25)",
          borderRadius: 14, padding: "12px 14px",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
          pointerEvents: "all", position: "relative",
        }}>
          {/* Close */}
          <button onClick={dismiss} style={{
            position: "absolute", top: 10, right: 10, width: 24, height: 24, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)", border: "none", color: "#8a8f98",
            fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1,
          }}>×</button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: deferredInstallEvent ? 10 : 8 }}>
            <img src="/apple-touch-icon-180x180.png" alt="Continuum" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f7f8f8", letterSpacing: "-0.2px" }}>Add to Home Screen</div>
              <div style={{ fontSize: 11, color: "#8a8f98", marginTop: 1 }}>Install Continuum as an app</div>
            </div>
          </div>

          {/* Android: one-tap button */}
          {deferredInstallEvent && (
            <button onClick={handleAndroidInstall} style={{
              width: "100%", padding: "9px 0", borderRadius: 9,
              background: "linear-gradient(135deg, #0EA5A0, #06D6A0)",
              border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", letterSpacing: "0.02em",
            }}>
              Install App
            </button>
          )}

          {/* iOS: compact step list */}
          {isIOS && !deferredInstallEvent && (
            <div>
              {[
                { step: "1", icon: "⬆️", text: "Tap the Share button in Safari" },
                { step: "2", icon: "➕", text: 'Tap "Add to Home Screen"' },
                { step: "3", icon: "✅", text: 'Tap "Add"' },
              ].map(({ step, icon, text }) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: step !== "3" ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(14,165,160,0.15)", border: "1px solid rgba(14,165,160,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "#0EA5A0", fontFamily: "monospace",
                  }}>{step}</div>
                  <div style={{ fontSize: 12, color: "#d0d6e0", lineHeight: 1.4 }}>{icon} {text}</div>
                </div>
              ))}
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <div style={{ fontSize: 18, animation: "bounce-down 1.2s ease-in-out infinite" }}>↓</div>
              </div>
            </div>
          )}
        </div>

        <style>{`@keyframes bounce-down { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }`}</style>
      </div>
    );
  };

  return (
    <div data-theme={D ? "dark" : "light"} style={{
      height: "100dvh", overflow: "hidden", background: css.bg, display: "flex", flexDirection: "column",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Instrument Sans', sans-serif", color: css.text, position: "relative",
      transition: "background 0.3s ease, color 0.3s ease",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-mono/style.min.css" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${D ? "#38302A" : "#D4C4B4"}; border-radius: 3px; }
        .c-card { transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.15s ease; }
        .c-card:hover { transform: translateY(-2px); box-shadow: ${D ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.08)"}; border-color: ${css.accent} !important; }
        .c-nav-btn { transition: all 0.15s ease; }
        .c-nav-btn:hover { background: ${D ? "rgba(240,232,223,0.06)" : "rgba(26,21,18,0.05)"} !important; }
        .c-row-hover { transition: background 0.12s ease; }
        .c-row-hover:hover { background: ${D ? "rgba(240,232,223,0.04)" : "rgba(212,116,45,0.04)"} !important; }
        .c-btn-primary { transition: all 0.15s ease; }
        .c-btn-primary:hover { background: ${D ? "#F09040" : "#C06425"} !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(212,116,45,0.3); }
        .c-tag { display:inline-flex; align-items:center; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
        @keyframes c-fade-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        @keyframes c-pulse { 0%,100% { opacity:0.6; transform:scale(1); } 50% { opacity:1; transform:scale(1.2); } }
        @keyframes c-shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
        .c-a1 { animation: c-fade-up 0.45s ease 0.05s backwards; }
        .c-a2 { animation: c-fade-up 0.45s ease 0.1s backwards; }
        .c-a3 { animation: c-fade-up 0.45s ease 0.15s backwards; }
        .c-a4 { animation: c-fade-up 0.45s ease 0.2s backwards; }
        .c-a5 { animation: c-fade-up 0.45s ease 0.25s backwards; }
        .c-a6 { animation: c-fade-up 0.45s ease 0.3s backwards; }
        .c-a7 { animation: c-fade-up 0.45s ease 0.35s backwards; }
        .c-sidebar-item { transition: background 0.15s ease, color 0.15s ease; }
        .c-sidebar-item:hover { background: ${D ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"} !important; }
      `}</style>

      {/* ── Top Header Bar ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 200, flexShrink: 0,
        background: css.nav, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        boxShadow: D ? "none" : "0 1px 0 rgba(0,0,0,0.06)",
      }}>
        <div style={{
          maxWidth: 1600, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: isMobile ? "0 16px" : "0 32px",
          height: isMobile ? 56 : 64,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, cursor: "pointer" }} onClick={() => { setActiveView("dashboard"); setDashSubTab("overview"); setTripDetailId(null); }}>
            <img src="/continuum-travel-logo.svg" alt="Continuum" style={{ height: isMobile ? 50 : 80, display: "block", filter: D ? "brightness(0.85)" : "brightness(0.55) sepia(1) hue-rotate(-15deg) saturate(3)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <button onClick={async () => { if ('serviceWorker' in navigator) { const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r => r.unregister())); } if ('caches' in window) { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); } window.location.reload(true); }} title="Refresh" style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <NavIcon d={<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>} size={16} />
            </button>
            <button onClick={() => setDarkMode(m => !m)} style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <NavIcon d={D ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></> : <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>} size={16} />
            </button>
            <button onClick={openSettings} style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <NavIcon d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>} size={16} />
            </button>
            <div onClick={openSettings} title="Settings" style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, cursor: "pointer", background: `linear-gradient(135deg, ${css.accent}, #C9A84C)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
              {(user?.user_metadata?.first_name?.[0] || user?.user_metadata?.name?.[0] || "U").toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Background image removed — hero image is now inline in dashboard */}

      {/* Sub-nav tabs moved into dashboard content area */}

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "20px 16px calc(90px + env(safe-area-inset-bottom))" : "32px 48px calc(90px + env(safe-area-inset-bottom))" }}>
          {viewRenderers[activeView]?.()}
        </div>
      </main>

      {/* ── Bottom Navigation Bar (full-width) ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 150,
        background: D ? "rgba(20,20,20,0.97)" : "rgba(255,255,255,0.97)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderTop: `1px solid ${css.border}`,
        display: "flex", alignItems: "stretch", justifyContent: "center",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {navItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button key={item.id} onClick={() => { setActiveView(item.id); if (item.id === "dashboard") setDashSubTab("overview"); }} style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 2, padding: isMobile ? "8px 0" : "10px 0", border: "none", cursor: "pointer",
              background: "transparent", flex: 1, maxWidth: 120,
              color: isActive ? css.accent : css.text3,
              transition: "all 0.15s", fontFamily: "inherit",
            }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>
                {item.label === "Expense Reports" ? "Expenses" : item.label}
              </span>
            </button>
          );
        })}
      </div>

            {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* ── Receipt Crop Modal ── */}
      {cropExpenseId && (() => {
        const exp = expenses.find(e => e.id === cropExpenseId);
        if (!exp?.receiptImage?.data) return null;

        const getPos = (clientX, clientY) => {
          const container = cropContainerRef.current;
          const img = cropImgRef.current;
          if (!container || !img) return { x: 0, y: 0 };
          const containerRect = container.getBoundingClientRect();
          const x = clientX - containerRect.left + container.scrollLeft;
          const y = clientY - containerRect.top + container.scrollTop;
          return { x: Math.max(0, Math.min(x, img.offsetWidth)), y: Math.max(0, Math.min(y, img.offsetHeight)) };
        };

        // Compute rect from refs and push to state (batched, no extra re-renders during drag)
        const updateRect = () => {
          const s = cropStartRef.current, e = cropEndRef.current;
          if (!s || !e) return;
          setCropRect({
            left: Math.min(s.x, e.x), top: Math.min(s.y, e.y),
            width: Math.abs(e.x - s.x), height: Math.abs(e.y - s.y),
          });
        };

        // Edge scroll tick — uses refs, no state dependency
        const edgeScrollTick = () => {
          const container = cropContainerRef.current;
          if (!container) { cropScrollRaf.current = null; return; }
          const { x: vx, y: vy } = cropScrollVel.current;
          if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) { cropScrollRaf.current = null; return; }
          container.scrollTop += vy;
          container.scrollLeft += vx;
          cropEndRef.current = getPos(cropLastClient.current.x, cropLastClient.current.y);
          updateRect();
          cropScrollRaf.current = requestAnimationFrame(edgeScrollTick);
        };

        const stopEdgeScroll = () => {
          if (cropScrollRaf.current) { cancelAnimationFrame(cropScrollRaf.current); cropScrollRaf.current = null; }
          cropScrollVel.current = { x: 0, y: 0 };
        };

        const updateEdgeScroll = (clientX, clientY) => {
          const container = cropContainerRef.current;
          if (!container) return;
          const rect = container.getBoundingClientRect();
          const edgeZone = 50;
          let vy = 0, vx = 0;
          if (clientY > rect.bottom - edgeZone) vy = Math.min(2.5, ((clientY - (rect.bottom - edgeZone)) / edgeZone) * 2.5);
          else if (clientY < rect.top + edgeZone) vy = -Math.min(2.5, (((rect.top + edgeZone) - clientY) / edgeZone) * 2.5);
          if (clientX > rect.right - edgeZone) vx = Math.min(2.5, ((clientX - (rect.right - edgeZone)) / edgeZone) * 2.5);
          else if (clientX < rect.left + edgeZone) vx = -Math.min(2.5, (((rect.left + edgeZone) - clientX) / edgeZone) * 2.5);
          cropScrollVel.current = { x: vx, y: vy };
          if ((vx !== 0 || vy !== 0) && !cropScrollRaf.current) cropScrollRaf.current = requestAnimationFrame(edgeScrollTick);
        };

        // All handlers use refs — no stale closure, no pause on re-render
        // Use a short cooldown after mouseUp to prevent click-to-mouseDown retrigger
        const dragEndTime = { current: 0 };

        const handleMouseDown = (e) => {
          // Ignore if this is a click event firing right after a drag ended
          if (Date.now() - dragEndTime.current < 150) return;
          const pos = getPos(e.clientX, e.clientY);
          cropStartRef.current = pos;
          cropEndRef.current = pos;
          cropDragRef.current = true;
          cropLastClient.current = { x: e.clientX, y: e.clientY };
          setCropRect({ left: pos.x, top: pos.y, width: 0, height: 0 });
          // Listen on document so mouseUp is captured even outside the container
          document.addEventListener("mousemove", handleMouseMove);
          document.addEventListener("mouseup", handleMouseUp);
          e.preventDefault();
        };
        const handleMouseMove = (e) => {
          if (!cropDragRef.current) return;
          cropLastClient.current = { x: e.clientX, y: e.clientY };
          cropEndRef.current = getPos(e.clientX, e.clientY);
          updateRect();
          updateEdgeScroll(e.clientX, e.clientY);
        };
        const handleMouseUp = () => {
          cropDragRef.current = false;
          dragEndTime.current = Date.now();
          stopEdgeScroll();
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };
        const handleTouchStart = (e) => {
          const t = e.touches[0]; const pos = getPos(t.clientX, t.clientY);
          cropStartRef.current = pos; cropEndRef.current = pos; cropDragRef.current = true;
          cropLastClient.current = { x: t.clientX, y: t.clientY };
          setCropRect({ left: pos.x, top: pos.y, width: 0, height: 0 });
          e.preventDefault();
        };
        const handleTouchMove = (e) => {
          if (!cropDragRef.current) return;
          const t = e.touches[0];
          cropLastClient.current = { x: t.clientX, y: t.clientY };
          cropEndRef.current = getPos(t.clientX, t.clientY);
          updateRect();
          updateEdgeScroll(t.clientX, t.clientY);
          e.preventDefault();
        };
        const handleTouchEnd = (e) => { cropDragRef.current = false; stopEdgeScroll(); e.preventDefault(); };

        const saveCrop = async () => {
          const s = cropStartRef.current, e = cropEndRef.current;
          if (!s || !e || !cropImgRef.current) return;
          const img = cropImgRef.current;
          const scaleX = img.naturalWidth / img.offsetWidth;
          const scaleY = img.naturalHeight / img.offsetHeight;
          const sx = Math.min(s.x, e.x) * scaleX;
          const sy = Math.min(s.y, e.y) * scaleY;
          const sw = Math.abs(e.x - s.x) * scaleX;
          const sh = Math.abs(e.y - s.y) * scaleY;
          if (sw < 10 || sh < 10) return;
          const canvas = document.createElement("canvas");
          canvas.width = sw; canvas.height = sh;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
          // Use lower quality JPEG to reduce size for Supabase storage
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          const croppedImage = { name: `cropped-receipt-${Date.now()}.jpg`, size: dataUrl.length, type: "image/jpeg", data: dataUrl };
          // Update local state immediately
          setExpenses(prev => prev.map(e => e.id === cropExpenseId ? { ...e, receipt: true, receiptImage: croppedImage } : e));
          // Save to Supabase and wait for confirmation
          if (user) {
            const { error } = await supabase.from("expenses").update({ receipt: true, receipt_image: croppedImage }).eq("id", cropExpenseId).eq("user_id", user.id);
            if (error) console.error("Failed to save cropped receipt:", error.message);
          }
          { setCropExpenseId(null); setCropRect(null); cropStartRef.current = null; cropEndRef.current = null; cropDragRef.current = false; };
          setCropRect(null);
        };

        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 9500, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: css.surface, borderRadius: 14, padding: "20px", maxWidth: 700, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: css.text }}>Crop Receipt</div>
                <button onClick={() => { setCropExpenseId(null); setCropRect(null); cropStartRef.current = null; cropEndRef.current = null; cropDragRef.current = false; }} style={{ width: 32, height: 32, border: "none", background: "transparent", color: css.text3, fontSize: 18, cursor: "pointer" }}>x</button>
              </div>
              <p style={{ fontSize: 12, color: css.text3, marginBottom: 12 }}>Click and drag to select the area you want to keep, then click Save.</p>
              <div ref={cropContainerRef} style={{ position: "relative", overflow: "auto", flex: 1, cursor: "crosshair", userSelect: "none", WebkitUserSelect: "none", touchAction: "none", WebkitTouchCallout: "none" }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                <img ref={cropImgRef} src={exp.receiptImage.data} alt="Receipt" style={{ width: "100%", height: "auto", display: "block", pointerEvents: "none" }} crossOrigin="anonymous" />
                {/* Darkened overlay outside crop area */}
                {cropRect && cropRect.width > 5 && cropRect.height > 5 && (
                  <>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: cropRect.top, background: "rgba(0,0,0,0.5)" }} />
                    <div style={{ position: "absolute", top: cropRect.top, left: 0, width: cropRect.left, height: cropRect.height, background: "rgba(0,0,0,0.5)" }} />
                    <div style={{ position: "absolute", top: cropRect.top, left: cropRect.left + cropRect.width, right: 0, height: cropRect.height, background: "rgba(0,0,0,0.5)" }} />
                    <div style={{ position: "absolute", top: cropRect.top + cropRect.height, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)" }} />
                    <div style={{ position: "absolute", top: cropRect.top, left: cropRect.left, width: cropRect.width, height: cropRect.height, border: "2px dashed #fff", boxSizing: "border-box" }} />
                  </>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
                <button onClick={() => { cropStartRef.current = null; cropEndRef.current = null; setCropRect(null); }} style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Reset</button>
                <button onClick={() => { setCropExpenseId(null); setCropRect(null); cropStartRef.current = null; cropEndRef.current = null; cropDragRef.current = false; }} style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={saveCrop} disabled={!cropRect || cropRect.width < 10 || cropRect.height < 10} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: (cropRect && cropRect.width >= 10) ? css.accent : css.surface2, color: (cropRect && cropRect.width >= 10) ? "#fff" : css.text3, fontSize: 13, fontWeight: 700, cursor: (cropRect && cropRect.width >= 10) ? "pointer" : "default" }}>Save Crop</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Receipt QR Code Modal ── */}
      {showReceiptQR && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setShowReceiptQR(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: 380, background: D ? "#141414" : "#fff", borderRadius: 20,
            border: `1px solid ${D ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, padding: "32px 24px", textAlign: "center",
          }}>
            <button onClick={() => setShowReceiptQR(false)} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, border: "none", background: "transparent", color: css.text3, fontSize: 20, cursor: "pointer" }}>x</button>
            <div style={{ fontSize: 18, fontWeight: 700, color: css.text, marginBottom: 8 }}>Receipt QR Code</div>
            <p style={{ fontSize: 13, color: css.text3, marginBottom: 20, lineHeight: 1.5 }}>Show this to your server. They scan it, enter the receipt details, and it appears in your Expense Inbox automatically.</p>
            {receiptQRDataUrl ? (
              <img src={receiptQRDataUrl} alt="Receipt QR Code" style={{ width: 240, height: 240, display: "block", margin: "0 auto 16px", borderRadius: 12, background: "#fff" }} />
            ) : userForwardingAddress ? (
              <div style={{ width: 240, height: 240, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", background: css.surface2, borderRadius: 12 }}>
                <span style={{ fontSize: 13, color: css.text3 }}>Generating...</span>
              </div>
            ) : (
              <div style={{ width: 240, height: 240, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", background: css.surface2, borderRadius: 12 }}>
                <span style={{ fontSize: 13, color: css.text3 }}>Loading account info...</span>
              </div>
            )}
            <p style={{ fontSize: 11, color: css.text3 }}>The QR code links to a simple form — no app or account needed for the server.</p>
          </div>
        </div>
      )}

      {/* ── Create Trip Modal (simplified) ── */}
      {showCreateTrip && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}>
          <div style={{
            width: "100%", maxWidth: 520, background: D ? "#141414" : "#fff", borderRadius: isMobile ? "0" : 0,
            border: `2px solid ${D ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, padding: "32px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: css.text, margin: 0, letterSpacing: "-0.02em" }}>{editingTripId ? "Edit Trip" : "Create Trip"}</h2>
              <button onClick={() => { setShowCreateTrip(false); setEditingTripId(null); setCreateTripForm({ name: "", destination: "", startDate: "", endDate: "", status: "planned" }); }} style={{ width: 36, height: 36, border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            {/* Trip Name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Trip Name</label>
              <input value={createTripForm.name} onChange={e => setCreateTripForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Japan Summer 2026, London Business Trip"
                style={{ display: "block", width: "100%", padding: "14px 16px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 16, fontWeight: 600, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                autoFocus />
            </div>

            {/* Destination */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Destination</label>
              <input value={createTripForm.destination} onChange={e => setCreateTripForm(f => ({ ...f, destination: e.target.value }))}
                placeholder="e.g. Tokyo, Japan"
                style={{ display: "block", width: "100%", padding: "14px 16px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Dates */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Start Date</label>
                <input type="date" value={createTripForm.startDate} onChange={e => { if (e.target.value) lastDateRef.current = e.target.value; setCreateTripForm(f => ({ ...f, startDate: e.target.value })); }}
                  onFocus={e => { if (!e.target.value && lastDateRef.current) setCreateTripForm(f => ({ ...f, startDate: lastDateRef.current })); }}
                  style={{ display: "block", width: "100%", padding: "12px 16px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 14, fontFamily: "'Geist Mono', monospace", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>End Date</label>
                <input type="date" value={createTripForm.endDate} onChange={e => { if (e.target.value) lastDateRef.current = e.target.value; setCreateTripForm(f => ({ ...f, endDate: e.target.value })); }}
                  onFocus={e => { if (!e.target.value && lastDateRef.current) setCreateTripForm(f => ({ ...f, endDate: lastDateRef.current })); }}
                  style={{ display: "block", width: "100%", padding: "12px 16px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 14, fontFamily: "'Geist Mono', monospace", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Status */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Status</label>
              <div style={{ display: "flex", gap: 0, border: `1px solid ${css.border}` }}>
                {[["planned","Planned"],["confirmed","Confirmed"],["wishlist","Wishlist"]].map(([val, label]) => (
                  <button key={val} onClick={() => setCreateTripForm(f => ({ ...f, status: val }))} style={{
                    flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                    background: createTripForm.status === val ? css.accent : "transparent",
                    color: createTripForm.status === val ? "#fff" : css.text3,
                    fontSize: 12, fontWeight: 700, fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.04em",
                    transition: "all 0.12s",
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {/* Create button */}
            <button onClick={handleCreateTrip} disabled={!createTripForm.name.trim()} style={{
              width: "100%", padding: "14px 0", border: "none",
              background: createTripForm.name.trim() ? css.accent : css.surface2,
              color: createTripForm.name.trim() ? "#fff" : css.text3,
              fontSize: 14, fontWeight: 800, cursor: createTripForm.name.trim() ? "pointer" : "default",
              fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.06em",
              transition: "all 0.12s",
            }}>{editingTripId ? "Save Changes" : "Create Trip"}</button>
          </div>
        </div>
      )}

      {/* ── Add Segment Modal ── */}
      {showAddSegment && addSegmentType && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}>
          <div style={{
            width: "100%", maxWidth: 560, maxHeight: isMobile ? "92vh" : "85vh", overflowY: "auto",
            background: D ? "#141414" : "#fff", border: `2px solid ${D ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            padding: "32px", position: "relative",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, position: "sticky", top: -32, zIndex: 10, background: D ? "#141414" : "#fff", margin: "-32px -32px 24px", padding: "20px 32px", borderBottom: `1px solid ${css.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <SegIcon type={addSegmentType} size={20} color={SEGMENT_TYPES.find(t => t.id === addSegmentType)?.color || css.accent} />
                <h2 style={{ fontSize: 18, fontWeight: 800, color: css.text, margin: 0, letterSpacing: "-0.01em" }}>
                  {editingSegIdx !== null ? "Edit" : "Add"} {SEGMENT_TYPES.find(t => t.id === addSegmentType)?.label}
                </h2>
              </div>
              <button onClick={() => { setAddSegmentType(null); setSegmentForm({}); setEditingSegIdx(null); }} style={{ width: 36, height: 36, border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            {/* Flight form — booking-style: One Way / Round Trip / Multi City */}
            {addSegmentType === "flight" && (
              <div>
                {/* Trip type selector */}
                <div style={{ display: "flex", gap: 0, border: `1px solid ${css.border}`, marginBottom: 20 }}>
                  {[["oneway", "One Way"], ["roundtrip", "Round Trip"], ["multicity", "Multi-City"]].map(([val, label]) => (
                    <button key={val} onClick={() => {
                      setFlightType(val);
                      if (val === "oneway") setFlightLegs(l => [l[0] || { id: 1, flightNumber: "", date: "", arrivalDate: "", departureTime: "", arrivalTime: "", departureAirport: "", arrivalAirport: "", departureTerminal: "", arrivalTerminal: "", airline: "", aircraft: "", lookupMsg: "" }]);
                      else if (val === "roundtrip") {
                        const first = flightLegs[0] || { id: 1, flightNumber: "", date: "", arrivalDate: "", departureTime: "", arrivalTime: "", departureAirport: "", arrivalAirport: "", departureTerminal: "", arrivalTerminal: "", airline: "", aircraft: "", lookupMsg: "" };
                        setFlightLegs([first, { id: 2, flightNumber: "", date: "", departureTime: "", arrivalTime: "", departureAirport: first.arrivalAirport, arrivalAirport: first.departureAirport, departureTerminal: "", arrivalTerminal: "", airline: first.airline, aircraft: "", lookupMsg: "" }]);
                      }
                    }} style={{
                      flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                      background: flightType === val ? css.accent : "transparent",
                      color: flightType === val ? "#fff" : css.text3,
                      fontSize: 12, fontWeight: 700, fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>{label}</button>
                  ))}
                </div>

                {/* Flight legs */}
                {flightLegs.map((leg, legIdx) => {
                  const updateLeg = (updates) => setFlightLegs(l => l.map((g, i) => i === legIdx ? { ...g, ...updates } : g));
                  const prevLeg = legIdx > 0 ? flightLegs[legIdx - 1] : null;
                  // Auto-calculate layover using resolved arrival date + time → next departure date + time
                  let layoverText = "";
                  if (prevLeg && prevLeg.arrivalTime && leg.departureTime && prevLeg.arrivalAirport) {
                    const arrDateStr = resolveArrivalDate(prevLeg);
                    const depDateStr = leg.date;
                    if (arrDateStr && depDateStr) {
                      const arrDt = new Date(`${arrDateStr}T${prevLeg.arrivalTime}:00`);
                      const depDt = new Date(`${depDateStr}T${leg.departureTime}:00`);
                      const diffMs = depDt - arrDt;
                      if (diffMs > 0) {
                        const totalMins = Math.round(diffMs / 60000);
                        const days = Math.floor(totalMins / 1440);
                        const hrs = Math.floor((totalMins % 1440) / 60);
                        const mins = totalMins % 60;
                        let dur = "";
                        if (days > 0) dur += `${days}d `;
                        if (hrs > 0) dur += `${hrs}h `;
                        if (mins > 0 && days === 0) dur += `${mins}m`;
                        layoverText = `${dur.trim()} layover at ${prevLeg.arrivalAirport}`;
                      }
                    }
                  }
                  const legLabel = flightType === "roundtrip" ? (legIdx === 0 ? "Outbound" : "Return") : `Flight ${legIdx + 1}`;
                  return (
                    <div key={leg.id} style={{ marginBottom: 16 }}>
                      {/* Layover banner */}
                      {layoverText && (
                        <div style={{ padding: "8px 12px", marginBottom: 10, background: `${css.warning}10`, border: `1px solid ${css.warning}25`, fontSize: 12, fontWeight: 600, color: css.warning, fontFamily: "'Geist Mono', monospace" }}>
                          {layoverText}
                        </div>
                      )}
                      {/* Leg header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: css.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>{legLabel}</span>
                        {flightType === "multicity" && flightLegs.length > 1 && (
                          <button onClick={() => setFlightLegs(l => l.filter((_, i) => i !== legIdx))} style={{ border: `1px solid rgba(239,68,68,0.3)`, background: "transparent", color: "#ef4444", fontSize: 10, fontWeight: 700, cursor: "pointer", padding: "3px 8px" }}>Remove</button>
                        )}
                      </div>
                      {/* From / To + Date */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>From</label>
                          <input value={leg.departureAirport} onChange={e => updateLeg({ departureAirport: e.target.value.toUpperCase().slice(0, 3) })} placeholder="BDA" maxLength={3} style={{ display: "block", width: "100%", padding: "10px 12px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 15, fontWeight: 700, fontFamily: "'Geist Mono', monospace", outline: "none", boxSizing: "border-box", textAlign: "center" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>To</label>
                          <input value={leg.arrivalAirport} onChange={e => updateLeg({ arrivalAirport: e.target.value.toUpperCase().slice(0, 3) })} placeholder="HKG" maxLength={3} style={{ display: "block", width: "100%", padding: "10px 12px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 15, fontWeight: 700, fontFamily: "'Geist Mono', monospace", outline: "none", boxSizing: "border-box", textAlign: "center" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>Date</label>
                          <input type="date" value={leg.date} onChange={e => { if (e.target.value) lastDateRef.current = e.target.value; updateLeg({ date: e.target.value }); }} onFocus={e => { if (!e.target.value && lastDateRef.current) updateLeg({ date: lastDateRef.current }); }} style={{ display: "block", width: "100%", padding: "10px 8px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 12, fontFamily: "'Geist Mono', monospace", outline: "none", boxSizing: "border-box" }} />
                        </div>
                      </div>
                      {/* Flight number + Lookup */}
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>Flight Number</label>
                          <input value={leg.flightNumber} onChange={e => updateLeg({ flightNumber: e.target.value.toUpperCase() })} placeholder="e.g. CX829" style={{ display: "block", width: "100%", padding: "10px 12px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 13, fontFamily: "'Geist Mono', monospace", outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-end" }}>
                          <button onClick={() => lookupFlightLeg(legIdx)} disabled={leg.lookupMsg === "Looking up..."} style={{ padding: "10px 14px", border: `1px solid ${css.accent}`, background: "transparent", color: css.accent, fontSize: 10, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", whiteSpace: "nowrap", transition: "all 0.12s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = css.accent; e.currentTarget.style.color = "#fff"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = css.accent; }}>
                            {leg.lookupMsg === "Looking up..." ? "..." : "Auto-Fill"}
                          </button>
                        </div>
                      </div>
                      {leg.lookupMsg && <div style={{ fontSize: 10, color: leg.lookupMsg.startsWith("Selected") || leg.lookupMsg.startsWith("Found") ? css.success : leg.lookupMsg.includes("routes found") ? css.accent : css.text3, fontFamily: "'Geist Mono', monospace", marginBottom: 8 }}>{leg.lookupMsg}</div>}
                      {/* Route selector when multiple routes found */}
                      {flightRouteOptions[legIdx] && (
                        <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                          {flightRouteOptions[legIdx].map((opt, oi) => (
                            <button key={oi} onClick={() => applyFlightRouteOption(legIdx, opt)} style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                              padding: "10px 14px", borderRadius: 8, border: `1px solid ${css.border}`,
                              background: css.surface, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                              transition: "all 0.15s",
                            }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = css.accent; e.currentTarget.style.background = css.accentBg; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = css.border; e.currentTarget.style.background = css.surface; }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>{opt.dep} → {opt.arr}</span>
                                {opt.depTime && <span style={{ fontSize: 11, color: css.text3 }}>{opt.depTime} — {opt.arrTime}</span>}
                              </div>
                              {opt.aircraft && <span style={{ fontSize: 10, color: css.text3 }}>{opt.aircraft}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Times + Terminals + Arrival Date */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                        {[
                          { key: "departureTime", label: "Departs", type: "time" },
                          { key: "departureTerminal", label: "Terminal", placeholder: "T5" },
                          { key: "arrivalTime", label: "Arrives", type: "time" },
                          { key: "arrivalTerminal", label: "Terminal", placeholder: "T3" },
                        ].map(f => (
                          <div key={f.key}>
                            <label style={{ fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>{f.label}</label>
                            <input type={f.type || "text"} value={leg[f.key] || ""} onChange={e => updateLeg({ [f.key]: e.target.value })} placeholder={f.placeholder || ""} style={{ display: "block", width: "100%", padding: "8px 6px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 12, fontFamily: "'Geist Mono', monospace", outline: "none", boxSizing: "border-box" }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                        <div>
                          <label style={{ fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>Arrival Date</label>
                          <input type="date" value={leg.arrivalDate || ""} onChange={e => updateLeg({ arrivalDate: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 6px", background: css.surface2, border: `1px solid ${css.border}`, color: leg.arrivalDate && leg.arrivalDate !== leg.date ? css.warning : css.text, fontSize: 12, fontFamily: "'Geist Mono', monospace", outline: "none", boxSizing: "border-box" }} />
                          {leg.arrivalDate && leg.arrivalDate !== leg.date && <span style={{ fontSize: 9, color: css.warning, fontWeight: 600 }}>+{Math.round((new Date(leg.arrivalDate) - new Date(leg.date)) / 86400000)}d next day</span>}
                        </div>
                        <div />
                      </div>
                      {/* Airline + Aircraft (compact) */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        <div>
                          <label style={{ fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>Airline</label>
                          <input value={leg.airline} onChange={e => updateLeg({ airline: e.target.value })} placeholder="Auto-filled" style={{ display: "block", width: "100%", padding: "8px 10px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>Aircraft</label>
                          <input value={leg.aircraft} onChange={e => updateLeg({ aircraft: e.target.value })} placeholder="Auto-filled" style={{ display: "block", width: "100%", padding: "8px 10px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                        </div>
                      </div>
                      {legIdx < flightLegs.length - 1 && <div style={{ borderBottom: `1px solid ${css.border}`, margin: "14px 0 0" }} />}
                    </div>
                  );
                })}

                {/* Add leg button — only for Multi-City */}
                {flightType === "multicity" && (
                  <button onClick={() => {
                    const lastLeg = flightLegs[flightLegs.length - 1];
                    setFlightLegs(l => [...l, { id: l.length + 1, flightNumber: "", date: lastLeg?.date || "", arrivalDate: "", departureTime: "", arrivalTime: "", departureAirport: lastLeg?.arrivalAirport || "", arrivalAirport: "", departureTerminal: "", arrivalTerminal: "", airline: lastLeg?.airline || "", aircraft: "", lookupMsg: "" }]);
                  }} style={{ width: "100%", padding: "10px 0", border: `1px dashed ${css.border}`, background: "transparent", color: css.text3, fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 16, transition: "all 0.12s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = css.accent; e.currentTarget.style.color = css.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = css.border; e.currentTarget.style.color = css.text3; }}>
                    + Add Another Flight
                  </button>
                )}

                {/* Booking details */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 14px" }}>
                  <div style={{ flex: 1, height: 1, background: css.border }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Booking Details</span>
                  <div style={{ flex: 1, height: 1, background: css.border }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>Class</label>
                    <select value={segmentForm.fareClass || ""} onChange={e => setSegmentForm(f => ({ ...f, fareClass: e.target.value }))} style={{ display: "block", width: "100%", padding: "10px 8px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}>
                      <option value="">Select</option>
                      <option value="economy">Economy</option>
                      <option value="premium_economy">Premium Econ</option>
                      <option value="business_first">Business / First</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>Booking Code</label>
                    <input value={segmentForm.bookingClass || ""} onChange={e => setSegmentForm(f => ({ ...f, bookingClass: e.target.value.toUpperCase().slice(0, 1) }))} placeholder="J" maxLength={1} style={{ display: "block", width: "100%", padding: "10px 8px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 13, fontFamily: "'Geist Mono', monospace", outline: "none", boxSizing: "border-box", textAlign: "center" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>Confirmation</label>
                    <input value={segmentForm.confirmationCode || ""} onChange={e => setSegmentForm(f => ({ ...f, confirmationCode: e.target.value.toUpperCase() }))} placeholder="ABC123" style={{ display: "block", width: "100%", padding: "10px 8px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 12, fontFamily: "'Geist Mono', monospace", outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>Total Cost</label>
                    <input type="number" value={segmentForm.ticketPrice || ""} onChange={e => setSegmentForm(f => ({ ...f, ticketPrice: e.target.value }))} placeholder="0.00" style={{ display: "block", width: "100%", padding: "10px 8px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 12, fontFamily: "'Geist Mono', monospace", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>Currency</label>
                    <select value={segmentForm.currency || "USD"} onChange={e => setSegmentForm(f => ({ ...f, currency: e.target.value }))} style={{ display: "block", width: "100%", padding: "10px 8px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 12, fontFamily: "'Geist Mono', monospace", outline: "none", boxSizing: "border-box" }}>
                      {CURRENCIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>Seat</label>
                    <input value={segmentForm.seat || ""} onChange={e => setSegmentForm(f => ({ ...f, seat: e.target.value.toUpperCase() }))} placeholder="14A" style={{ display: "block", width: "100%", padding: "10px 8px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 12, fontFamily: "'Geist Mono', monospace", outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic fields for non-flight segment types */}
            {addSegmentType !== "flight" && (SEGMENT_FIELDS[addSegmentType] || []).map(field => {
              // Divider
              if (field.type === "divider") {
                return (
                  <div key={field.key} style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 16px" }}>
                    <div style={{ flex: 1, height: 1, background: css.border }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em" }}>{field.label}</span>
                    <div style={{ flex: 1, height: 1, background: css.border }} />
                  </div>
                );
              }
              return (
                <div key={field.key} style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>{field.label}</label>
                  {field.type === "select" ? (
                    <select value={segmentForm[field.key] || ""} onChange={e => setSegmentForm(f => ({ ...f, [field.key]: e.target.value }))}
                      style={{ display: "block", width: "100%", padding: "12px 16px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}>
                      <option value="">Select...</option>
                      {field.options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea value={segmentForm[field.key] || ""} onChange={e => setSegmentForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder || ""} rows={3}
                      style={{ display: "block", width: "100%", padding: "12px 16px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
                  ) : field.places ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <PlacesAutocomplete
                        value={segmentForm[field.key] || ""}
                        onChange={val => setSegmentForm(f => ({ ...f, [field.key]: val }))}
                        onPlaceSelect={field.fillsAddress ? (place => {
                          setSegmentForm(f => ({ ...f, [field.fillsAddress]: place.address }));
                        }) : undefined}
                        placeholder={field.placeholder || ""}
                        placesType={field.places === "establishment" ? "establishment" : undefined}
                        style={{ display: "block", width: "100%", flex: 1, padding: "12px 16px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input type={field.type} value={segmentForm[field.key] || ""} onChange={e => {
                        const val = field.mono ? e.target.value.toUpperCase() : e.target.value;
                        if (field.type === "date" && val) lastDateRef.current = val;
                        setSegmentForm(f => ({ ...f, [field.key]: field.maxLength ? val.slice(0, field.maxLength) : val }));
                      }}
                        onFocus={field.type === "date" ? (e => { if (!e.target.value && lastDateRef.current) setSegmentForm(f => ({ ...f, [field.key]: lastDateRef.current })); }) : undefined}
                        placeholder={field.placeholder || ""} maxLength={field.maxLength}
                        style={{ display: "block", width: "100%", flex: 1, padding: "12px 16px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 14, fontFamily: field.mono ? "'Geist Mono', monospace" : "inherit", outline: "none", boxSizing: "border-box" }} />
                      {field.autoLookup && (
                        <button onClick={lookupFlightForSegForm} disabled={segFormLookup.loading} style={{
                          padding: "12px 16px", border: `1px solid ${css.accent}`, background: "transparent",
                          color: css.accent, fontSize: 11, fontWeight: 700, cursor: segFormLookup.loading ? "wait" : "pointer",
                          fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap",
                          transition: "all 0.12s",
                        }} onMouseEnter={e => { if (!segFormLookup.loading) { e.currentTarget.style.background = css.accent; e.currentTarget.style.color = "#fff"; } }}
                           onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = css.accent; }}>
                          {segFormLookup.loading ? "..." : "Lookup"}
                        </button>
                      )}
                    </div>
                  )}
                  {/* Lookup result message */}
                  {field.autoLookup && segFormLookup.msg && (
                    <div style={{ marginTop: 6, fontSize: 11, color: segFormLookup.msg.startsWith("Found") ? css.success : css.text3, fontFamily: "'Geist Mono', monospace" }}>
                      {segFormLookup.msg}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Save button */}
            <button onClick={() => handleAddSegmentToTrip(showAddSegment)} style={{
              width: "100%", padding: "14px 0", border: "none", marginTop: 8,
              background: css.accent, color: "#fff",
              fontSize: 14, fontWeight: 800, cursor: "pointer",
              fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.06em",
            }}>{editingSegIdx !== null ? "Save Changes" : `Save ${SEGMENT_TYPES.find(t => t.id === addSegmentType)?.label || ""}`}</button>
          </div>
        </div>
      )}

      {/* ── Segment Type Picker (shown when user clicks "Add" on a trip) ── */}
      {showAddSegment && !addSegmentType && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}>
          <div style={{
            width: "100%", maxWidth: 480, background: D ? "#141414" : "#fff",
            border: `2px solid ${D ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, padding: "32px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: css.text, margin: 0, letterSpacing: "-0.01em" }}>Add to Trip</h2>
              <button onClick={() => setShowAddSegment(null)} style={{ width: 36, height: 36, border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {SEGMENT_TYPES.map(type => (
                <button key={type.id} onClick={() => { setAddSegmentType(type.id); setSegmentForm({}); setFlightType("roundtrip"); setFlightLegs([{ id: 1, flightNumber: "", date: "", arrivalDate: "", departureTime: "", arrivalTime: "", departureAirport: "", arrivalAirport: "", departureTerminal: "", arrivalTerminal: "", airline: "", aircraft: "", lookupMsg: "" }]); }} style={{
                  padding: "16px", border: `1px solid ${css.border}`, background: "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                  transition: "all 0.12s", textAlign: "left",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = type.color; e.currentTarget.style.background = `${type.color}10`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = css.border; e.currentTarget.style.background = "transparent"; }}>
                  <span style={{ width: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><SegIcon type={type.id} size={20} color={type.color} /></span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: css.text, fontFamily: "inherit" }}>{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Booking Modal — paste, upload .eml, or share ── */}
      {showPasteItinerary && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}>
          <div style={{
            width: "100%", maxWidth: 560, maxHeight: isMobile ? "92vh" : "85vh", overflowY: "auto",
            background: D ? "#111113" : "#fff", borderRadius: isMobile ? "20px 20px 0 0" : 20,
            border: `1px solid ${D ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            boxShadow: "0 -8px 40px rgba(0,0,0,0.4)", padding: "24px", position: "relative",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, position: "sticky", top: -24, zIndex: 10, background: D ? "#111113" : "#fff", margin: "-24px -24px 16px", padding: "16px 24px", borderRadius: isMobile ? "20px 20px 0 0" : "20px 20px 0 0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: css.text, margin: 0 }}>Add Booking</h3>
              <button onClick={() => setShowPasteItinerary(false)} style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${css.border}`, background: D ? "#1a1a1e" : "#f0f0f0", color: css.text3, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            {/* Upload .eml file */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "24px 16px", borderRadius: 14,
                border: `2px dashed ${D ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}`,
                background: D ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                cursor: "pointer", transition: "all 0.2s",
              }}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#0EA5A0"; e.currentTarget.style.background = D ? "rgba(14,165,160,0.06)" : "rgba(14,165,160,0.04)"; }}
                onDragLeave={e => { e.currentTarget.style.borderColor = D ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"; e.currentTarget.style.background = D ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"; }}
                onDrop={e => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = D ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
                  const file = e.dataTransfer.files[0];
                  if (file) { const reader = new FileReader(); reader.onload = ev => { setPasteText(parseEmlFile(ev.target.result)); }; reader.readAsText(file); }
                }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={D ? "#71717a" : "#8a8a8a"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: css.text2 }}>Drop a file here or tap to upload</span>
                <span style={{ fontSize: 11, color: css.text3, marginTop: 4 }}>.eml, .txt, .html — from Gmail: ⋮ → Download message</span>
                <input type="file" accept=".eml,.txt,.html,.htm,.mhtml" style={{ display: "none" }} onChange={e => {
                  const file = e.target.files[0];
                  if (file) { const reader = new FileReader(); reader.onload = ev => { setPasteText(parseEmlFile(ev.target.result)); }; reader.readAsText(file); }
                }} />
              </label>
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: css.border }} />
              <span style={{ fontSize: 11, color: css.text3, fontWeight: 500 }}>or paste text</span>
              <div style={{ flex: 1, height: 1, background: css.border }} />
            </div>

            {/* Label */}
            <input
              value={pasteLabel} onChange={e => setPasteLabel(e.target.value)}
              placeholder="Label (optional — e.g., 'Summer Asia Trip')"
              style={{ display: "block", width: "100%", padding: "10px 12px", marginBottom: 10, background: D ? "#1a1a1e" : "#f5f5f5", border: `1px solid ${css.border}`, borderRadius: 10, color: css.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />

            {/* Paste area */}
            <textarea
              value={pasteText} onChange={e => setPasteText(e.target.value)}
              placeholder="Paste your booking confirmation email text here..."
              rows={8}
              style={{ display: "block", width: "100%", padding: "12px", background: D ? "#1a1a1e" : "#f5f5f5", border: `1px solid ${css.border}`, borderRadius: 10, color: css.text, fontSize: 12, fontFamily: "'Geist Mono', monospace", outline: "none", boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 }}
            />

            {/* Live preview */}
            {pasteText.trim() && (() => {
              const preview = parseItinerary(pasteText);
              if (preview.length === 0) return <p style={{ fontSize: 11, color: css.text3, marginTop: 8 }}>No bookings detected yet — try pasting more of the email or uploading the .eml file</p>;
              return (
                <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 10, background: D ? "rgba(14,165,160,0.08)" : "rgba(14,165,160,0.06)", border: `1px solid ${D ? "rgba(14,165,160,0.15)" : "rgba(14,165,160,0.12)"}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#0EA5A0", marginBottom: 6 }}>Preview: {preview.length} segment{preview.length > 1 ? "s" : ""} detected</div>
                  {preview.map((s, i) => (
                    <div key={i} style={{ fontSize: 11, color: css.text2, fontFamily: "'Geist Mono', monospace", padding: "2px 0" }}>
                      {s.type === "hotel" ? (
                        <><span style={{ fontWeight: 600, color: css.text }}>— {s.property || "Hotel"}</span>{s.date ? ` · ${s.date}` : ""}{s.nights ? ` · ${s.nights} night${s.nights > 1 ? "s" : ""}` : ""}{s.location ? ` · ${s.location}` : ""}</>
                      ) : (
                        <><span style={{ fontWeight: 600, color: css.text }}>{s.flightNumber || "—"} </span>{s.route}{s.date ? ` · ${s.date}` : ""}{s.departureTime ? ` · ${s.departureTime}` : ""}{s.seat ? ` · Seat ${s.seat}` : ""}</>
                      )}
                    </div>
                  ))}
                  {preview[0]?.confirmationCode && <div style={{ fontSize: 10, color: css.text3, marginTop: 4 }}>Confirmation: {preview[0].confirmationCode}</div>}
                </div>
              );
            })()}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={handlePasteAndParse} disabled={!pasteText.trim()} style={{
                flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
                background: pasteText.trim() ? "#0EA5A0" : css.surface2,
                color: pasteText.trim() ? "#fff" : css.text3,
                fontSize: 13, fontWeight: 600, cursor: pasteText.trim() ? "pointer" : "default",
                transition: "opacity 0.15s",
              }} onMouseEnter={e => { if (pasteText.trim()) e.currentTarget.style.opacity = "0.85"; }} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                Save to Inbox
              </button>
              <button onClick={() => { setShowPasteItinerary(false); setPasteText(""); setPasteLabel(""); }} style={{
                padding: "12px 18px", borderRadius: 10, border: `1px solid ${css.border}`,
                background: "transparent", color: css.text2, fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Trip Summary Popup (from Dashboard) ── */}
      {tripSummaryId && (() => {
        const trip = trips.find(t => t.id === tripSummaryId);
        if (!trip) return null;
        const allSegs = (trip.segments && trip.segments.length > 0) ? trip.segments : [{ ...trip, type: trip.type || "flight" }];
        const flightSegs = allSegs.filter(s => s.type === "flight");
        const hotelSegs = allSegs.filter(s => s.type === "hotel");
        const prog = LOYALTY_PROGRAMS.airlines.find(p => p.id === trip.program) || LOYALTY_PROGRAMS.hotels.find(p => p.id === trip.program);
        const sColor = trip.status === "confirmed" ? "#22c55e" : trip.status === "planned" ? "#F59E0B" : "#0EA5A0";
        const sBg = trip.status === "confirmed" ? "rgba(34,197,94,0.12)" : trip.status === "planned" ? "rgba(245,158,11,0.12)" : "rgba(14,165,160,0.12)";
        const firstDate = allSegs.map(s => s.date).filter(Boolean).sort()[0] || trip.date;
        const lastDate = allSegs.map(s => s.date).filter(Boolean).sort().pop() || trip.date;
        const daysUntil = firstDate ? Math.max(0, Math.ceil((new Date(firstDate + "T12:00:00") - new Date()) / 86400000)) : null;

        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{
              width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto",
              background: D ? "#111113" : "#fff", borderRadius: 20, border: `1px solid ${D ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              boxShadow: "0 24px 64px rgba(0,0,0,0.4)", padding: 0, position: "relative",
            }}>
              {/* Floating close button */}
              <button onClick={() => setTripSummaryId(null)} style={{ position: "sticky", top: 12, float: "right", marginRight: 12, marginTop: 12, zIndex: 10, width: 32, height: 32, borderRadius: 10, border: `1px solid ${css.border}`, background: D ? "#1a1a1e" : "#f0f0f0", color: css.text3, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>×</button>
              {/* Header */}
              <div style={{ padding: "24px 24px 16px", borderBottom: `1px solid ${D ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`, marginTop: -44 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, paddingRight: 36 }}>
                  <div style={{ flex: 1 }}>
                    {trip.tripName && <div style={{ fontSize: 11, fontWeight: 600, color: css.accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{trip.tripName}</div>}
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: css.text, margin: 0, fontFamily: "'Instrument Sans', sans-serif", lineHeight: 1.2 }}>
                      {trip.route || trip.property || trip.location || "Trip"}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: sColor, background: sBg, padding: "3px 10px", borderRadius: 20, textTransform: "capitalize" }}>{trip.status}</span>
                      {firstDate && <span style={{ fontSize: 11, color: css.text3 }}>{new Date(firstDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}{lastDate && lastDate !== firstDate ? ` – ${new Date(lastDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}</span>}
                      {daysUntil !== null && daysUntil >= 0 && <span style={{ fontSize: 11, color: "#0EA5A0", fontWeight: 600, fontFamily: "'Geist Mono', monospace" }}>{daysUntil === 0 ? "Today" : `${daysUntil}d away`}</span>}
                    </div>
                    {(() => {
                      const conf = trip.confirmationCode || trip.confirmation_code || allSegs.map(s => s.confirmationCode).filter(Boolean)[0];
                      return conf ? (
                        <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: D ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${D ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
                          <span style={{ fontSize: 10, color: css.text3 }}>Confirmation</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace", letterSpacing: "0.05em" }}>{conf}</span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>

              {/* Segments */}
              <div style={{ padding: "16px 24px" }}>
                {flightSegs.length > 0 && (
                  <div style={{ marginBottom: hotelSegs.length > 0 ? 16 : 0 }}>
                    {flightSegs.map((seg, i) => {
                      const segProg = LOYALTY_PROGRAMS.airlines.find(p => p.id === seg.program);
                      const airports = parseRoute(seg.route);
                      const cabin = seg.bookingClass ? (getBookingClassCabin(seg.program, seg.bookingClass) || seg.fareClass) : seg.fareClass;
                      const cabinLabel = cabin === "business_first" ? "Business" : cabin === "premium_economy" ? "Premium" : cabin === "basic_economy" ? "Basic" : "Economy";
                      const segIdx = allSegs.indexOf(seg);
                      const segConf = seg.confirmationCode || "";
                      return (
                        <div key={i} onClick={() => { setTripSummaryId(null); setTripDetailId(trip.id); setTripDetailSegIdx(Math.max(0, segIdx)); setActiveView("trips"); }}
                          style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < flightSegs.length - 1 ? `1px solid ${D ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` : "none", cursor: "pointer", borderRadius: 8, transition: "background 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.background = D ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          {/* Route column */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40, flexShrink: 0, paddingTop: 2 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: segProg?.color || "#0EA5A0", flexShrink: 0 }} />
                            {airports.length >= 2 && <div style={{ width: 1, flex: 1, background: D ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", margin: "4px 0" }} />}
                            {airports.length >= 2 && <div style={{ width: 8, height: 8, borderRadius: "50%", border: `2px solid ${segProg?.color || "#0EA5A0"}`, flexShrink: 0 }} />}
                          </div>
                          {/* Details */}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace", letterSpacing: "-0.02em" }}>{airports[0] || "—"}</span>
                              {seg.departureTime && <span style={{ fontSize: 12, color: css.text2, fontFamily: "'Geist Mono', monospace" }}>{seg.departureTime}</span>}
                            </div>
                            <div style={{ fontSize: 11, color: css.text3, margin: "6px 0", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                              {seg.flightNumber && <span style={{ fontWeight: 600, color: css.text2 }}>{seg.flightNumber}</span>}
                              {cabinLabel && <span style={{ color: css.accent, fontWeight: 500 }}>{cabinLabel}{seg.bookingClass ? ` (${seg.bookingClass})` : ""}</span>}
                              {segProg && <span>{segProg.name.split(" ")[0]}</span>}
                              {seg.date && <span>{new Date(seg.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                              {segConf && <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 600, color: css.text2, fontSize: 10 }}>{segConf}</span>}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace", letterSpacing: "-0.02em" }}>{airports[airports.length - 1] || "—"}</span>
                              {seg.arrivalTime && <span style={{ fontSize: 12, color: css.text2, fontFamily: "'Geist Mono', monospace" }}>{seg.arrivalTime}</span>}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", color: css.text3, fontSize: 12, flexShrink: 0, opacity: 0.5 }}>›</div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {hotelSegs.length > 0 && hotelSegs.map((seg, i) => {
                  const segIdx = allSegs.indexOf(seg);
                  const segConf = seg.confirmationCode || "";
                  return (
                  <div key={`h${i}`} onClick={() => { setTripSummaryId(null); setTripDetailId(trip.id); setTripDetailSegIdx(Math.max(0, segIdx)); setActiveView("trips"); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", cursor: "pointer", borderRadius: 8, transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = D ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 36, height: 36, borderRadius: 0, background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.20)", display: "flex", alignItems: "center", justifyContent: "center" }}><SegIcon type="hotel" size={16} color="#8b5cf6" /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{seg.property || seg.location || "Hotel"}</div>
                      <div style={{ fontSize: 11, color: css.text3, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span>{(() => {
                          const checkin = seg.date ? new Date(seg.date + "T12:00:00") : null;
                          const checkout = seg.checkoutDate ? new Date(seg.checkoutDate + "T12:00:00") : (checkin && seg.nights ? new Date(checkin.getTime() + (parseInt(seg.nights) || 1) * 86400000) : null);
                          const nights = (checkin && checkout) ? Math.round((checkout - checkin) / 86400000) : (parseInt(seg.nights) || 0);
                          const fmt = d => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          if (checkin && checkout) return `${fmt(checkin)} – ${fmt(checkout)} · ${nights} night${nights > 1 ? "s" : ""}`;
                          if (checkin) return fmt(checkin);
                          if (nights) return `${nights} night${nights > 1 ? "s" : ""}`;
                          return "";
                        })()}</span>
                        {segConf && <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 600, color: css.text2, fontSize: 10 }}>· {segConf}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", color: css.text3, fontSize: 12, flexShrink: 0, opacity: 0.5 }}>›</div>
                  </div>
                  );
                })}
              </div>

              {/* Footer actions */}
              <div style={{ padding: "16px 24px 24px", borderTop: `1px solid ${D ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`, display: "flex", gap: 10 }}>
                <button onClick={() => { setTripSummaryId(null); setTripDetailId(trip.id); setTripDetailSegIdx(0); setActiveView("trips"); }} style={{
                  flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
                  background: "#0EA5A0", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'Instrument Sans', sans-serif", transition: "opacity 0.15s",
                }} onMouseEnter={e => e.currentTarget.style.opacity = "0.85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                  View Full Itinerary
                </button>
                <button onClick={() => { setTripSummaryId(null); openEditTrip(trip); }} style={{
                  padding: "12px 18px", borderRadius: 10, border: `1px solid ${css.border}`,
                  background: "transparent", color: css.text2, fontSize: 13, fontWeight: 500, cursor: "pointer",
                  fontFamily: "'Instrument Sans', sans-serif",
                }}>Edit</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Settings Modal ── */}
      {showSettings && (() => {
        const sf = { display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: D ? "#13111C" : "#f4f4f8", border: `1px solid ${css.border}`, borderRadius: 6, color: css.text, fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" };
        const lbl = { fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "Inter, sans-serif" };
        const sectionHead = { fontSize: 13, fontWeight: 700, color: css.text, fontFamily: "'Inter Tight', Inter, sans-serif", marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${css.border}` };
        const tabs = [
          { id: "profile", label: "Profile", icon: "👤" },
          { id: "security", label: "Security", icon: "🔒" },
          { id: "preferences", label: "Preferences", icon: "🎛" },
          { id: "subscription", label: "Subscription", icon: "⭐" },
          { id: "account", label: "Account", icon: "⚠️" },
        ];
        const isPremium = user?.user_metadata?.subscription === "premium";
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 }}>
            <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 12, width: "100%", maxWidth: 620, maxHeight: "88vh", display: "flex", overflow: "hidden", position: "relative" }}>
              {/* Close button */}
              <button onClick={() => setShowSettings(false)} style={{ position: "absolute", top: 12, right: 12, zIndex: 10, width: 32, height: 32, borderRadius: 10, border: `1px solid ${css.border}`, background: D ? "#1a1a1e" : "#f0f0f0", color: css.text3, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>×</button>

              {/* Sidebar tabs */}
              <div style={{ width: 160, flexShrink: 0, background: D ? "#13111C" : "#f0f0f5", borderRight: `1px solid ${css.border}`, padding: "20px 0" }}>
                <div style={{ padding: "0 16px 16px", fontSize: 12, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Settings</div>
                {tabs.map(t => (
                  <button key={t.id} onClick={() => { setSettingsTab(t.id); setSettingsMsg({ type: "", text: "" }); }} style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 16px",
                    border: "none", background: settingsTab === t.id ? css.accentBg : "transparent",
                    color: settingsTab === t.id ? css.accent : css.text2, cursor: "pointer",
                    fontSize: 12, fontWeight: settingsTab === t.id ? 600 : 400, fontFamily: "Inter, sans-serif",
                    borderLeft: settingsTab === t.id ? `2px solid ${css.accent}` : "2px solid transparent",
                    textAlign: "left",
                  }}>{t.icon} {t.label}</button>
                ))}
              </div>

              {/* Content */}
              <div style={{ flex: 1, padding: 28, overflowY: "auto" }}>
                {settingsMsg.text && (
                  <div style={{ padding: "9px 12px", borderRadius: 6, marginBottom: 18, fontSize: 12, fontFamily: "Inter, sans-serif", background: settingsMsg.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: settingsMsg.type === "success" ? "#10b981" : "#ef4444", border: `1px solid ${settingsMsg.type === "success" ? "#10b98130" : "#ef444430"}` }}>
                    {settingsMsg.text}
                  </div>
                )}

                {/* PROFILE */}
                {settingsTab === "profile" && (
                  <div>
                    <div style={sectionHead}>Profile</div>
                    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                      <label style={{ flex: 1 }}><span style={lbl}>First Name</span><input value={settingsForm.firstName} onChange={e => setSettingsForm(f => ({ ...f, firstName: e.target.value }))} style={sf} /></label>
                      <label style={{ flex: 1 }}><span style={lbl}>Last Name</span><input value={settingsForm.lastName} onChange={e => setSettingsForm(f => ({ ...f, lastName: e.target.value }))} style={sf} /></label>
                    </div>
                    <button onClick={saveProfile} disabled={settingsSaving} style={{ padding: "9px 20px", borderRadius: 6, border: "none", background: css.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: settingsSaving ? 0.7 : 1, fontFamily: "Inter, sans-serif" }}>
                      {settingsSaving ? "Saving..." : "Save Name"}
                    </button>

                    {/* Authorized Forwarding Emails */}
                    <div style={{ ...sectionHead, marginTop: 28 }}>Forwarding Emails</div>
                    <p style={{ fontSize: 11, color: css.text3, marginBottom: 12, lineHeight: 1.5, fontFamily: "Inter, sans-serif" }}>
                      Add email addresses that can forward booking confirmations and expense receipts to your Continuum inbox. Forward to: <strong style={{ color: css.accent, fontFamily: "'Geist Mono', monospace" }}>{userForwardingAddress}@trips.gocontinuum.app</strong>
                    </p>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: D ? "#13111C" : "#f4f4f8", borderRadius: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: css.text, fontFamily: "Inter, sans-serif", flex: 1 }}>{user?.email}</span>
                        <span style={{ fontSize: 9, color: css.success, fontWeight: 700, textTransform: "uppercase" }}>Primary</span>
                      </div>
                      {(settingsForm.additionalEmails || []).map((email, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: D ? "#13111C" : "#f4f4f8", borderRadius: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: css.text, fontFamily: "Inter, sans-serif", flex: 1 }}>{email}</span>
                          <button onClick={async () => {
                            const updated = (settingsForm.additionalEmails || []).filter((_, i) => i !== idx);
                            setSettingsForm(f => ({ ...f, additionalEmails: updated }));
                            if (user) {
                              // Delete the additional row but never delete the primary user-email row
                              const primaryEmail = (user.email || "").toLowerCase();
                              if (email.toLowerCase() !== primaryEmail) {
                                await supabase.from("user_forwarding_addresses")
                                  .delete()
                                  .eq("user_id", user.id)
                                  .eq("email", email.toLowerCase());
                              }
                            }
                            setSettingsMsg({ type: "success", text: `Removed ${email}` });
                          }} style={{ border: "none", background: "transparent", color: "#ef4444", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Remove</button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input id="add-fwd-email" type="email" placeholder="Add another email..." style={{ ...sf, flex: 1, marginTop: 0 }} />
                      <button onClick={async () => {
                        const input = document.getElementById("add-fwd-email");
                        const email = input?.value?.trim().toLowerCase();
                        if (!email || !email.includes("@")) { setSettingsMsg({ type: "error", text: "Enter a valid email" }); return; }
                        if (email === user?.email?.toLowerCase()) { setSettingsMsg({ type: "error", text: "This is already your primary email" }); return; }
                        if ((settingsForm.additionalEmails || []).includes(email)) { setSettingsMsg({ type: "error", text: "Email already added" }); return; }
                        // Save to Supabase — query first, then insert only if missing,
                        // to avoid depending on a specific onConflict target constraint.
                        if (user) {
                          const { data: existing } = await supabase
                            .from("user_forwarding_addresses")
                            .select("id")
                            .eq("user_id", user.id)
                            .eq("email", email);
                          if (!existing || existing.length === 0) {
                            const { error: insErr } = await supabase
                              .from("user_forwarding_addresses")
                              .insert({
                                user_id: user.id,
                                email: email,
                                forwarding_address: userForwardingAddress,
                                verified: true,
                              });
                            if (insErr) {
                              setSettingsMsg({ type: "error", text: `Failed to add: ${insErr.message}` });
                              return;
                            }
                          }
                        }
                        setSettingsForm(f => ({ ...f, additionalEmails: [...(f.additionalEmails || []), email] }));
                        if (input) input.value = "";
                        setSettingsMsg({ type: "success", text: `Added ${email} — forwards will now be received` });
                      }} style={{ padding: "9px 16px", borderRadius: 6, border: "none", background: css.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", flexShrink: 0 }}>Add</button>
                    </div>
                  </div>
                )}

                {/* SECURITY */}
                {settingsTab === "security" && (
                  <div>
                    <div style={sectionHead}>Email Address</div>
                    <label style={{ display: "block", marginBottom: 14 }}><span style={lbl}>Email</span><input type="email" value={settingsForm.email} onChange={e => setSettingsForm(f => ({ ...f, email: e.target.value }))} style={sf} /></label>
                    <button onClick={saveEmail} disabled={settingsSaving} style={{ padding: "9px 20px", borderRadius: 6, border: "none", background: css.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: settingsSaving ? 0.7 : 1, fontFamily: "Inter, sans-serif", marginBottom: 28 }}>
                      {settingsSaving ? "Saving..." : "Update Email"}
                    </button>

                    <div style={sectionHead}>Change Password</div>
                    <label style={{ display: "block", marginBottom: 12 }}><span style={lbl}>New Password</span><input type="password" value={settingsForm.newPassword} onChange={e => setSettingsForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Min 6 characters" style={sf} /></label>
                    <label style={{ display: "block", marginBottom: 14 }}><span style={lbl}>Confirm Password</span><input type="password" value={settingsForm.confirmPassword} onChange={e => setSettingsForm(f => ({ ...f, confirmPassword: e.target.value }))} style={sf} /></label>
                    <button onClick={savePassword} disabled={settingsSaving} style={{ padding: "9px 20px", borderRadius: 6, border: "none", background: css.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: settingsSaving ? 0.7 : 1, fontFamily: "Inter, sans-serif" }}>
                      {settingsSaving ? "Saving..." : "Change Password"}
                    </button>
                  </div>
                )}

                {/* PREFERENCES */}
                {settingsTab === "preferences" && (
                  <div>
                    <div style={sectionHead}>Travel Preferences</div>
                    <label style={{ display: "block", marginBottom: 14 }}><span style={lbl}>Home Airport (IATA code)</span><input value={settingsForm.homeAirport} onChange={e => setSettingsForm(f => ({ ...f, homeAirport: e.target.value.toUpperCase().slice(0, 3) }))} placeholder="e.g. JFK, LAX, YYZ" style={sf} maxLength={3} /></label>
                    <label style={{ display: "block", marginBottom: 14 }}><span style={lbl}>Passport Country</span>
                      <select value={settingsForm.passportCountry} onChange={e => setSettingsForm(f => ({ ...f, passportCountry: e.target.value }))} style={{ ...sf, cursor: "pointer" }}>
                        <option value="">Select passport country...</option>
                        {[["US","United States"],["CA","Canada"],["GB","United Kingdom"],["AU","Australia"],["NZ","New Zealand"],["IE","Ireland"],["DE","Germany"],["FR","France"],["NL","Netherlands"],["IT","Italy"],["ES","Spain"],["PT","Portugal"],["CH","Switzerland"],["AT","Austria"],["BE","Belgium"],["SE","Sweden"],["NO","Norway"],["DK","Denmark"],["FI","Finland"],["JP","Japan"],["KR","South Korea"],["SG","Singapore"],["HK","Hong Kong SAR"],["TW","Taiwan"],["MY","Malaysia"],["TH","Thailand"],["PH","Philippines"],["IN","India"],["CN","China"],["BR","Brazil"],["MX","Mexico"],["AR","Argentina"],["CL","Chile"],["CO","Colombia"],["AE","UAE"],["SA","Saudi Arabia"],["IL","Israel"],["ZA","South Africa"],["NG","Nigeria"],["EG","Egypt"],["KE","Kenya"],["BM","Bermuda (British Overseas)"],["TT","Trinidad & Tobago"],["JM","Jamaica"],["BB","Barbados"]].map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                      </select>
                    </label>
                    <label style={{ display: "block", marginBottom: 20 }}><span style={lbl}>Default Currency</span>
                      <select value={settingsForm.defaultCurrency} onChange={e => setSettingsForm(f => ({ ...f, defaultCurrency: e.target.value }))} style={{ ...sf, cursor: "pointer" }}>
                        {["USD","CAD","GBP","EUR","AUD","JPY","SGD","HKD"].map(c => <option key={c} value={c} style={{ background: css.surface }}>{c}</option>)}
                      </select>
                    </label>

                    <div style={{ ...sectionHead, marginTop: 8 }}>Notifications</div>
                    {[
                      { key: "statusMilestones", label: "Status milestone alerts", desc: "Notify when you're close to reaching the next tier" },
                      { key: "expiringMiles", label: "Expiring miles/points alerts", desc: "Warn when points are about to expire" },
                      { key: "newPrograms", label: "New program announcements", desc: "Get notified when Continuum adds new loyalty programs" },
                    ].map(n => (
                      <div key={n.key} onClick={() => setSettingsForm(f => ({ ...f, notifications: { ...f.notifications, [n.key]: !f.notifications[n.key] } }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${css.border}`, cursor: "pointer" }}>
                        <div>
                          <div style={{ fontSize: 13, color: css.text, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>{n.label}</div>
                          <div style={{ fontSize: 11, color: css.text3, fontFamily: "Inter, sans-serif", marginTop: 2 }}>{n.desc}</div>
                        </div>
                        <div style={{ width: 36, height: 20, borderRadius: 10, background: settingsForm.notifications[n.key] ? css.accent : css.border, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                          <div style={{ position: "absolute", top: 2, left: settingsForm.notifications[n.key] ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                        </div>
                      </div>
                    ))}
                    <button onClick={savePreferences} disabled={settingsSaving} style={{ marginTop: 20, padding: "9px 20px", borderRadius: 6, border: "none", background: css.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: settingsSaving ? 0.7 : 1, fontFamily: "Inter, sans-serif" }}>
                      {settingsSaving ? "Saving..." : "Save Preferences"}
                    </button>
                  </div>
                )}

                {/* SUBSCRIPTION */}
                {settingsTab === "subscription" && (
                  <div>
                    <div style={sectionHead}>Subscription</div>
                    <div style={{ padding: "16px", borderRadius: 8, border: `1px solid ${isPremium ? css.accentBorder : css.border}`, background: isPremium ? css.accentBg : css.surface2, marginBottom: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: isPremium ? css.accent : css.text3, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif", marginBottom: 4 }}>Current Plan</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: css.text, fontFamily: "'Inter Tight', Inter, sans-serif" }}>{isPremium ? "Premium" : "Free"}</div>
                      {!isPremium && <div style={{ fontSize: 12, color: css.text3, marginTop: 4, fontFamily: "Inter, sans-serif" }}>Upgrade to unlock unlimited programs, AI concierge, and advanced insights.</div>}
                    </div>
                    {[
                      { label: "Linked Programs", free: "Up to 3", premium: "Unlimited" },
                      { label: "AI Travel Concierge", free: "—", premium: "✓" },
                      { label: "Status Optimizer", free: "Basic", premium: "Advanced" },
                      { label: "Expense Tracking", free: "✓", premium: "✓ + Export" },
                      { label: "Calendar Sync", free: "—", premium: "✓" },
                    ].map(r => (
                      <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${css.border}`, fontSize: 12, fontFamily: "Inter, sans-serif" }}>
                        <span style={{ color: css.text2 }}>{r.label}</span>
                        <span style={{ color: isPremium ? css.accent : css.text3, fontWeight: 600 }}>{isPremium ? r.premium : r.free}</span>
                      </div>
                    ))}
                    {!isPremium && (
                      <button onClick={() => { setShowSettings(false); setShowUpgrade(true); }} style={{ marginTop: 20, width: "100%", padding: "11px 0", borderRadius: 8, border: "none", background: css.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter Tight', Inter, sans-serif" }}>
                        Upgrade to Premium →
                      </button>
                    )}
                  </div>
                )}

                {/* ACCOUNT */}
                {settingsTab === "account" && (
                  <div>
                    <div style={sectionHead}>Account</div>
                    <div style={{ fontSize: 12, color: css.text3, fontFamily: "Inter, sans-serif", marginBottom: 6 }}>Signed in as</div>
                    <div style={{ fontSize: 14, color: css.text, fontFamily: "Inter, sans-serif", fontWeight: 500, marginBottom: 20 }}>{user?.email}</div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: css.text, fontFamily: "Inter, sans-serif", marginBottom: 6 }}>Export My Data</div>
                      <div style={{ fontSize: 12, color: css.text3, fontFamily: "Inter, sans-serif", marginBottom: 10 }}>Download a copy of all your trips and linked programs.</div>
                      <button onClick={() => {
                        const data = { trips, linkedAccounts, exportedAt: new Date().toISOString() };
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a"); a.href = url; a.download = "continuum-data.json"; a.click();
                        URL.revokeObjectURL(url);
                      }} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                        Download JSON
                      </button>
                    </div>

                    <div style={{ marginTop: 28, padding: "16px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#ef4444", fontFamily: "Inter, sans-serif", marginBottom: 4 }}>Danger Zone</div>
                      <div style={{ fontSize: 12, color: css.text3, fontFamily: "Inter, sans-serif", marginBottom: 12 }}>Signing out will clear your local session. Your data stays safe in your account.</div>
                      <button onClick={() => { setShowSettings(false); handleLogout(); }} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.4)", background: "transparent", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Profile Setup Modal */}
      {showProfileSetup && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20,
        }}>
          <div style={{
            background: "#1a1725", border: "1px solid #2a2640", borderRadius: 12, padding: 36, width: "100%", maxWidth: 400,
          }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#0EA5A0", fontFamily: "Space Mono, monospace", marginBottom: 8 }}>Welcome aboard</div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "'Inter Tight', Inter, sans-serif" }}>Set up your profile</h2>
              <p style={{ fontSize: 13, color: "#8a8f98", margin: "8px 0 0", fontFamily: "Inter, sans-serif" }}>Just your name — you can update this anytime.</p>
            </div>
            <form onSubmit={handleProfileSetup}>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <label style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontFamily: "Inter, sans-serif" }}>First Name</span>
                  <input
                    value={profileSetupForm.firstName}
                    onChange={e => setProfileSetupForm(p => ({ ...p, firstName: e.target.value }))}
                    placeholder="First"
                    autoFocus
                    style={{ width: "100%", background: "#13111C", border: "1px solid #2a2640", borderRadius: 6, padding: "10px 12px", color: "#fff", fontSize: 14, fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontFamily: "Inter, sans-serif" }}>Last Name</span>
                  <input
                    value={profileSetupForm.lastName}
                    onChange={e => setProfileSetupForm(p => ({ ...p, lastName: e.target.value }))}
                    placeholder="Last"
                    style={{ width: "100%", background: "#13111C", border: "1px solid #2a2640", borderRadius: 6, padding: "10px 12px", color: "#fff", fontSize: 14, fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}
                  />
                </label>
              </div>
              {profileSetupError && <div style={{ fontSize: 12, color: "#f87171", marginBottom: 12, fontFamily: "Inter, sans-serif" }}>{profileSetupError}</div>}
              <button type="submit" disabled={profileSetupLoading} style={{
                width: "100%", padding: "12px", background: "#0EA5A0", border: "none", borderRadius: 6,
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: profileSetupLoading ? "not-allowed" : "pointer",
                opacity: profileSetupLoading ? 0.7 : 1, fontFamily: "'Inter Tight', Inter, sans-serif",
              }}>
                {profileSetupLoading ? "Saving..." : "Continue"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Trip Modal */}
      {showAddTrip && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, overflowY: "auto",
        }}>
          <div style={{
            background: "#211e2e", border: "1px solid #2a2640", borderRadius: 8, padding: 28, width: "100%", maxWidth: 440, margin: "20px auto", position: "relative",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, position: "sticky", top: -8, zIndex: 10, background: "#211e2e", margin: "-28px -28px 20px", padding: "16px 28px", borderRadius: "8px 8px 0 0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "'Inter Tight', Inter, sans-serif" }}>{editingTripId ? "Edit Trip" : "Add Trip"}</h3>
              <button onClick={() => { setShowAddTrip(false); setEditingTripId(null); }} style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid #2a2640", background: "#2a2640", color: "#8a8f98", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            {/* Trip Name + Status */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <label style={{ flex: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Trip Name</span>
                <input value={newTrip.tripName} onChange={e => setNewTrip(p => ({ ...p, tripName: e.target.value }))}
                  placeholder="e.g. Tokyo Anniversary, London Getaway"
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
              </label>
              <label style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Status</span>
                <select value={newTrip.status} onChange={e => setNewTrip(p => ({ ...p, status: e.target.value }))} style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}>
                  <option value="confirmed" style={{ background: "#211e2e" }}>Confirmed</option>
                  <option value="planned" style={{ background: "#211e2e" }}>Planned</option>
                  <option value="wishlist" style={{ background: "#211e2e" }}>Wishlist</option>
                </select>
              </label>
            </div>

            {/* Segments */}
            {newTrip.segments.map((seg, segIdx) => {
              const lookup = segLookupState[segIdx] || {};
              const updateSeg = (updates) => setNewTrip(p => ({ ...p, segments: p.segments.map((s, i) => i === segIdx ? { ...s, ...updates } : s) }));
              return (
                <div key={seg._id || segIdx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #2a2640", borderRadius: 10, padding: "16px 16px 12px", marginBottom: 12, position: "relative" }}>
                  {/* Segment header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["flight", "hotel", "rental"].map(type => (
                        <button key={type} onClick={() => updateSeg({ type, program: type === "flight" ? "aa" : type === "hotel" ? "marriott" : "hertz" })} style={{
                          padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif",
                          background: seg.type === type ? "rgba(14,165,160,0.25)" : "rgba(255,255,255,0.05)",
                          color: seg.type === type ? "#0EA5A0" : "#8a8f98",
                        }}>{type === "flight" ? "— Flight" : type === "hotel" ? "— Hotel" : "— Rental"}</button>
                      ))}
                    </div>
                    {newTrip.segments.length > 1 && (
                      <button onClick={() => setNewTrip(p => ({ ...p, segments: p.segments.filter((_, i) => i !== segIdx) }))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, padding: "0 4px", lineHeight: 1 }} title="Remove segment">×</button>
                    )}
                  </div>

                  {/* Program */}
                  <label style={{ display: "block", marginBottom: seg.program === "other" ? 6 : 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>
                      {seg.type === "flight" ? "Airline" : seg.type === "hotel" ? "Hotel" : "Rental Company"}
                    </span>
                    <select value={seg.program} onChange={e => updateSeg({ program: e.target.value, customProgramName: e.target.value !== "other" ? "" : seg.customProgramName })} style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}>
                      {(seg.type === "flight" ? [...LOYALTY_PROGRAMS.airlines, ...customPrograms.filter(p => p.category === "airline")] : seg.type === "hotel" ? [...LOYALTY_PROGRAMS.hotels, ...customPrograms.filter(p => p.category === "hotel")] : [...LOYALTY_PROGRAMS.rentals, ...customPrograms.filter(p => p.category === "rental")]).map(p => (
                        <option key={p.id} value={p.id} style={{ background: "#211e2e" }}>{p.name}</option>
                      ))}
                      <option value="other" style={{ background: "#211e2e" }}>— Other —</option>
                    </select>
                  </label>
                  {seg.program === "other" && (
                    <input
                      value={seg.customProgramName || ""}
                      onChange={e => updateSeg({ customProgramName: e.target.value })}
                      placeholder={seg.type === "flight" ? "Enter airline name" : seg.type === "hotel" ? "Enter hotel name" : "Enter company name"}
                      style={{ display: "block", width: "100%", marginBottom: 10, padding: "8px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(14,165,160,0.4)", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
                      autoFocus
                    />
                  )}

                  {/* Route / Property / Location */}
                  {seg.type === "rental" ? (
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <label style={{ flex: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Pickup Location</span>
                        <input value={seg.pickupLocation || ""} onChange={e => updateSeg({ pickupLocation: e.target.value, location: e.target.value })}
                          placeholder="City or airport"
                          style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </label>
                      <label style={{ flex: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Dropoff Location</span>
                        <input value={seg.dropoffLocation || ""} onChange={e => updateSeg({ dropoffLocation: e.target.value })}
                          placeholder="City or airport"
                          style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </label>
                    </div>
                  ) : (
                  <label style={{ display: "block", marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>{seg.type === "flight" ? "Route" : "Property"}</span>
                    <input value={seg.route || seg.property || seg.location || ""} onChange={e => updateSeg({ route: e.target.value, property: e.target.value, location: e.target.value })}
                      placeholder={seg.type === "flight" ? "JFK → LAX" : "Hotel name"}
                      style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                  </label>
                  )}

                  {/* Flight-specific fields */}
                  {seg.type === "flight" && (<>
                    {/* Flight number + lookup */}
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Flight Number</span>
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        <input value={seg.flightNumber} onChange={e => { updateSeg({ flightNumber: e.target.value.toUpperCase() }); setSegLookupState(p => ({ ...p, [segIdx]: { loading: false, msg: "" } })); }}
                          placeholder="e.g. AA1289"
                          style={{ flex: 1, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                        <button onClick={() => lookupFlight(segIdx)} disabled={lookup.loading} style={{ padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(14,165,160,0.4)", background: "rgba(14,165,160,0.1)", color: "#0EA5A0", fontSize: 11, fontWeight: 700, cursor: lookup.loading ? "wait" : "pointer", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>
                          {lookup.loading ? "…" : "Auto-fill ✦"}
                        </button>
                      </div>
                      {lookup.msg && <div style={{ marginTop: 4, fontSize: 10, fontFamily: "Inter, sans-serif", color: lookup.msg.startsWith("✓") ? "#0EA5A0" : "#f87171" }}>{lookup.msg}</div>}
                    </div>
                    {/* Times */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <label style={{ flex: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Dep. Time</span>
                        <input type="time" value={seg.departureTime} onChange={e => updateSeg({ departureTime: e.target.value })} style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </label>
                      <label style={{ flex: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Arr. Time</span>
                        <input type="time" value={seg.arrivalTime} onChange={e => updateSeg({ arrivalTime: e.target.value })} style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </label>
                    </div>
                    {/* Terminals */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <label style={{ flex: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Dep. Terminal</span>
                        <input value={seg.departureTerminal} onChange={e => updateSeg({ departureTerminal: e.target.value.toUpperCase() })} placeholder="B, 4" style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </label>
                      <label style={{ flex: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Arr. Terminal</span>
                        <input value={seg.arrivalTerminal} onChange={e => updateSeg({ arrivalTerminal: e.target.value.toUpperCase() })} placeholder="C, 1" style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </label>
                    </div>
                  </>)}

                  {/* Date + Route Type / Nights / Rental dates */}
                  {seg.type === "rental" ? (
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <label style={{ flex: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Pickup Date</span>
                        <input type="date" value={seg.date} onChange={e => updateSeg({ date: e.target.value })} style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </label>
                      <label style={{ flex: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Dropoff Date</span>
                        <input type="date" value={seg.dropoffDate || ""} onChange={e => {
                          const dropoff = e.target.value;
                          const days = (seg.date && dropoff && dropoff > seg.date)
                            ? Math.round((new Date(dropoff) - new Date(seg.date)) / 86400000)
                            : seg.days || 1;
                          updateSeg({ dropoffDate: dropoff, days });
                        }} style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                        {seg.days > 0 && seg.dropoffDate && <div style={{ fontSize: 9, color: "#0EA5A0", marginTop: 3, fontFamily: "Inter, sans-serif" }}>{seg.days} day{seg.days !== 1 ? "s" : ""}</div>}
                      </label>
                    </div>
                  ) : (
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <label style={{ flex: 1 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Date</span>
                      <input type="date" value={seg.date} onChange={e => updateSeg({ date: e.target.value })} style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                    </label>
                    {seg.type === "flight" && (
                      <label style={{ flex: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Route Type</span>
                        <select value={seg.class} onChange={e => updateSeg({ class: e.target.value })} style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}>
                          <option value="domestic" style={{ background: "#211e2e" }}>Domestic</option>
                          <option value="international" style={{ background: "#211e2e" }}>International</option>
                        </select>
                      </label>
                    )}
                    {seg.type === "hotel" && (
                      <label style={{ flex: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Check-out Date</span>
                        <input type="date" value={seg.checkoutDate || ""} onChange={e => {
                          const checkout = e.target.value;
                          const nights = (seg.date && checkout && checkout > seg.date)
                            ? Math.round((new Date(checkout) - new Date(seg.date)) / 86400000)
                            : seg.nights || 1;
                          updateSeg({ checkoutDate: checkout, nights });
                        }} style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                        {seg.nights > 0 && seg.checkoutDate && <div style={{ fontSize: 9, color: "#0EA5A0", marginTop: 3, fontFamily: "Inter, sans-serif" }}>{seg.nights} night{seg.nights !== 1 ? "s" : ""}</div>}
                      </label>
                    )}
                  </div>
                  )}

                  {/* Fare class for flights */}
                  {seg.type === "flight" && (
                    <>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <label style={{ flex: 1 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Fare Class Code</span>
                          <input value={seg.bookingClass} onChange={e => { const bc = e.target.value.toUpperCase().slice(0, 1); const cabin = getBookingClassCabin(seg.program, bc) || seg.fareClass; updateSeg({ bookingClass: bc, fareClass: cabin }); }}
                            placeholder="Y, J, W…" maxLength={1}
                            style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 14, fontWeight: 700, fontFamily: "'Geist Mono', monospace", outline: "none", boxSizing: "border-box", textTransform: "uppercase", letterSpacing: 2 }} />
                          {seg.bookingClass && getBookingClassCabin(seg.program, seg.bookingClass) && <div style={{ fontSize: 9, color: "#0EA5A0", marginTop: 3, fontFamily: "Inter, sans-serif" }}>→ {CABIN_LABELS[getBookingClassCabin(seg.program, seg.bookingClass)]}</div>}
                        </label>
                        <label style={{ flex: 2 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Cabin Class</span>
                          <select value={seg.fareClass} onChange={e => updateSeg({ fareClass: e.target.value })} style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}>
                            <option value="basic_economy" style={{ background: "#211e2e" }}>Basic Economy</option>
                            <option value="economy" style={{ background: "#211e2e" }}>Economy</option>
                            <option value="premium_economy" style={{ background: "#211e2e" }}>Premium Economy</option>
                            <option value="business_first" style={{ background: "#211e2e" }}>Business / First</option>
                          </select>
                        </label>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <label style={{ flex: 1 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Ticket Price</span>
                          <input type="number" value={seg.ticketPrice} onChange={e => updateSeg({ ticketPrice: e.target.value })} placeholder="Optional" style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                        </label>
                        <label style={{ width: 90, flexShrink: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Currency</span>
                          <select value={seg.currency || "USD"} onChange={e => updateSeg({ currency: e.target.value })} style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}>
                            {CURRENCIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </label>
                        <label style={{ flex: 2 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Credit To Program</span>
                          <select value={seg.creditProgram || ""} onChange={e => updateSeg({ creditProgram: e.target.value })} style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 7, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}>
                            <option value="" style={{ background: "#211e2e" }}>— Same as operating airline —</option>
                            {LOYALTY_PROGRAMS.airlines.filter(a => a.tiers && a.tiers.length > 0).map(a => (
                              <option key={a.id} value={a.id} style={{ background: "#211e2e" }}>{a.name}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </>
                  )}

                  {/* Segment earnings preview */}
                  {seg.type === "flight" && (() => {
                    const earnings = calcTripEarnings(seg);
                    // If crediting to a different program, also show that earning
                    const creditProg = seg.creditProgram && seg.creditProgram !== seg.program ? LOYALTY_PROGRAMS.airlines.find(a => a.id === seg.creditProgram) : null;
                    let creditEarning = null;
                    if (creditProg && seg.route) {
                      const airports = seg.route.split(/→|->|-|\//).map(s => s.trim().toUpperCase()).filter(s => s.length === 3);
                      const dist = airports.length >= 2 ? greatCircleMiles(airports[0], airports[airports.length - 1]) : 0;
                      const cabin = (seg.bookingClass && getBookingClassCabin(seg.program, seg.bookingClass)) || seg.fareClass || "economy";
                      const price = parseFloat(seg.ticketPrice) || 0;
                      const credits = calcSegmentCredits(seg.creditProgram, seg.program, cabin, dist, price, 0, seg.bookingClass || "");
                      if (credits > 0) {
                        creditEarning = { credits, unit: creditProg.unit, name: creditProg.name, color: creditProg.color };
                      }
                    }
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ padding: "8px 10px", background: "rgba(14,165,160,0.05)", border: "1px solid rgba(14,165,160,0.15)", borderRadius: 7, fontSize: 11 }}>
                          <span style={{ color: "#0EA5A0", fontWeight: 700, fontFamily: "'Geist Mono', monospace" }}>{earnings.statusLabel}</span>
                          {earnings.redeemLabel !== earnings.statusLabel && <span style={{ color: "#8a8f98", marginLeft: 8, fontFamily: "'Geist Mono', monospace" }}>{earnings.redeemLabel}</span>}
                          <span style={{ color: "#62666d", marginLeft: 8, fontFamily: "Inter, sans-serif", fontSize: 10 }}>{earnings.breakdown}</span>
                        </div>
                        {creditEarning && (
                          <div style={{ padding: "8px 10px", background: `${creditEarning.color}08`, border: `1px solid ${creditEarning.color}25`, borderRadius: 7, fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 9, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>Credit to</span>
                            <span style={{ color: creditEarning.color, fontWeight: 700, fontFamily: "'Geist Mono', monospace" }}>~{creditEarning.credits.toLocaleString()} {creditEarning.unit}</span>
                            <span style={{ fontSize: 9, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>({creditEarning.name})</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}

            {/* Add Segment buttons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[["flight", "— Flight"], ["hotel", "— Hotel"], ["rental", "— Rental"]].map(([type, label]) => (
                <button key={type} onClick={() => setNewTrip(p => ({ ...p, segments: [...p.segments, { ...defaultSegment(), type, program: type === "flight" ? "aa" : type === "hotel" ? "marriott" : "hertz" }] }))} style={{
                  flex: 1, padding: "8px 0", borderRadius: 8, border: "1px dashed #2a2640", background: "transparent",
                  color: "#8a8f98", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}>+ {label}</button>
              ))}
            </div>

            {addTripError && (
              <div style={{ marginBottom: 12, padding: "10px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#f87171", fontSize: 12, fontFamily: "Inter, sans-serif" }}>
                {addTripError}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={resetTripModal} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid #2a2640", background: "rgba(255,255,255,0.03)", color: "#8a8f98", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
              <button onClick={handleAddTrip} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif", background: "#0EA5A0", color: "#f7f8f8" }}>{editingTripId ? "Save Changes" : "Save Trip"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Itinerary Modal */}
      {showImportItinerary && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={() => setShowImportItinerary(false)}>
          <div style={{
            background: "#211e2e", border: "1px solid #2a2640", borderRadius: 8, padding: 28, width: "100%", maxWidth: 560,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 6px", fontFamily: "'Inter Tight', Inter, sans-serif" }}>Import Itinerary</h3>
            <p style={{ fontSize: 12, color: "#8a8f98", margin: "0 0 20px", lineHeight: 1.6 }}>
              Paste your booking confirmation email below. We'll extract flight details, seat assignments, fare class, and more automatically.
            </p>

            {/* Example hint */}
            <div style={{
              padding: "10px 14px", marginBottom: 16, borderRadius: 8, border: "1px solid #2a2640",
              background: "rgba(14,165,160,0.05)", fontSize: 11, color: "#8a8f98", lineHeight: 1.7,
            }}>
              <strong style={{ color: "#0EA5A0" }}>Tip:</strong> Works with confirmations from airlines (AA, Delta, United, etc.) and OTAs (Expedia, Booking.com, etc.). Include the full email text for best results.
              <br /><strong style={{ color: "#0EA5A0" }}>Detected fields:</strong> Flight number, route, date, times, seat, fare class, aircraft, confirmation code, distance, layovers
            </div>

            <textarea
              value={itineraryText}
              onChange={e => setItineraryText(e.target.value)}
              placeholder={"Paste booking confirmation here...\n\nExample:\nConfirmation: ABCDEF\nAmerican Airlines\nAA 123  JFK → LAX\nMar 15, 2026  8:30 AM → 11:45 AM\nSeat: 12A  Fare Class: Y\nAircraft: 738  Distance: 2,475 miles\nDuration: 5h 15m"}
              rows={12}
              style={{
                display: "block", width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.03)",
                border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13,
                fontFamily: "'Geist Mono', monospace", outline: "none", resize: "vertical",
                boxSizing: "border-box", lineHeight: 1.6,
              }}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={() => { setShowImportItinerary(false); setItineraryText(""); }} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid #2a2640", background: "rgba(255,255,255,0.03)",
                color: "#8a8f98", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Cancel</button>
              <button onClick={handleImportItinerary} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif",
                background: itineraryText.trim() ? "#0EA5A0" : "rgba(14,165,160,0.3)", color: "#f7f8f8",
                opacity: itineraryText.trim() ? 1 : 0.6,
              }}>Import Flights</button>
            </div>
          </div>
        </div>
      )}

      {/* Link Account Modal */}
      {showLinkModal && (() => {
        const prog = allPrograms.find(p => p.id === showLinkModal);
        const isHotel = LOYALTY_PROGRAMS.hotels.some(p => p.id === showLinkModal);
        const isRental = LOYALTY_PROGRAMS.rentals.some(p => p.id === showLinkModal);

        const isUpdating = !!linkedAccounts[showLinkModal];

        // Program-specific field labels
        const balanceLabel = isHotel
          ? `${prog?.name?.split(" ")[0] || "Hotel"} Points Balance`
          : isRental
            ? "Points Balance"
            : `${prog?.name?.split(" ").slice(-1)[0] || "Miles"} Balance`;
        const balancePlaceholder = isHotel ? "e.g. 120000" : isRental ? "e.g. 5000" : "e.g. 45000";
        const statusLabel = isHotel
          ? "Qualifying Nights This Year"
          : isRental
            ? "Qualifying Rentals This Year"
            : `${prog?.unit || "Loyalty Points"} Toward Status`;
        const statusPlaceholder = isHotel ? "e.g. 18" : isRental ? "e.g. 5" : "e.g. 12500";
        const statusField = isHotel ? "currentNights" : isRental ? "currentRentals" : "tierCredits";

        const inputStyle = {
          display: "block", width: "100%", marginTop: 6, padding: "12px 14px",
          background: "#13111C", border: "1px solid #2a2640", borderRadius: 6,
          color: "#f7f8f8", fontSize: 15, fontFamily: "'Inter Tight', Inter, sans-serif",
          outline: "none", boxSizing: "border-box",
        };
        const labelStyle = { display: "block", marginBottom: 18 };
        const spanStyle = { fontSize: 10, fontWeight: 700, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "Inter, sans-serif" };

        return (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={() => { setShowLinkModal(null); setLinkError(""); }}>
          <div style={{
            background: "#1a1725", border: "1px solid #2a2640", borderRadius: 12, padding: 32, width: "100%", maxWidth: 400,
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${prog?.color || "#0EA5A0"}20`, border: `1px solid ${prog?.color || "#0EA5A0"}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {prog?.logo || "—"}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "'Inter Tight', Inter, sans-serif" }}>
                  {isUpdating ? "Update" : "Link"} {prog?.name?.split(" ").slice(0, 2).join(" ") || "Program"}
                </div>
                <div style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif", marginTop: 2 }}>
                  Enter your current numbers from your account
                </div>
              </div>
            </div>

            {/* Field 1: Balance */}
            <label style={labelStyle}>
              <span style={spanStyle}>{balanceLabel}</span>
              <input
                type="number"
                value={linkForm.pointsBalance}
                onChange={e => setLinkForm(p => ({ ...p, pointsBalance: e.target.value }))}
                placeholder={balancePlaceholder}
                style={inputStyle}
                autoFocus
              />
            </label>

            {/* Field 2: Status metric */}
            <label style={labelStyle}>
              <span style={spanStyle}>{statusLabel}</span>
              <input
                type="number"
                value={linkForm[statusField]}
                onChange={e => setLinkForm(p => ({ ...p, [statusField]: e.target.value }))}
                placeholder={statusPlaceholder}
                style={inputStyle}
              />
            </label>

            {/* Field 3: Current status tier */}
            {(prog?.tiers || []).length > 0 && (
              <label style={labelStyle}>
                <span style={spanStyle}>Current Elite Status</span>
                <select
                  value={linkForm.currentTier}
                  onChange={e => setLinkForm(p => ({ ...p, currentTier: e.target.value }))}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="" style={{ background: "#1a1725" }}>— No status / Base member —</option>
                  {(prog.tiers || []).map(t => (
                    <option key={t.name} value={t.name} style={{ background: "#1a1725" }}>{t.name}</option>
                  ))}
                </select>
              </label>
            )}

            {linkError && <div style={{ fontSize: 12, color: "#f87171", marginBottom: 14, fontFamily: "Inter, sans-serif" }}>{linkError}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowLinkModal(null); setLinkError(""); }} style={{
                flex: 1, padding: "12px 0", borderRadius: 8, border: "1px solid #2a2640", background: "transparent",
                color: "#8a8f98", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Cancel</button>
              <button onClick={() => handleLinkAccount(showLinkModal)} disabled={linkLoading} style={{
                flex: 2, padding: "12px 0", borderRadius: 8, border: "none", cursor: linkLoading ? "not-allowed" : "pointer",
                fontSize: 13, fontWeight: 700, fontFamily: "'Inter Tight', Inter, sans-serif",
                background: "#0EA5A0", color: "#fff", opacity: linkLoading ? 0.7 : 1,
              }}>{linkLoading ? "Saving..." : isUpdating ? "Update Stats" : "Link Account"}</button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Add Program Modal */}
      {showAddProgram && (() => {
        const cats = { airline: PROGRAM_DIRECTORY.airlines, hotel: PROGRAM_DIRECTORY.hotels, rental: PROGRAM_DIRECTORY.rentals, card: PROGRAM_DIRECTORY.creditCards };
        const available = cats[newProgram.category] || [];
        const selectedProg = available.find(p => p.id === newProgram.selectedId);
        const searchTerm = (newProgram.search || "").toLowerCase();
        const filtered = searchTerm ? available.filter(p => p.name.toLowerCase().includes(searchTerm)) : available;
        const alreadyLinked = Object.keys(linkedAccounts);
        return (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }}>
          <div style={{
            background: "#211e2e", border: "1px solid #2a2640", borderRadius: 8, padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto",
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 6px", fontFamily: "'Inter Tight', Inter, sans-serif" }}>Add Loyalty Program</h3>
            <p style={{ color: "#8a8f98", fontSize: 12, margin: "0 0 20px", fontFamily: "Inter, sans-serif" }}>Choose from {PROGRAM_DIRECTORY.airlines.length + PROGRAM_DIRECTORY.hotels.length + PROGRAM_DIRECTORY.rentals.length + PROGRAM_DIRECTORY.creditCards.length}+ programs or add a custom one</p>

            {/* Category Tabs */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { id: "airline", label: "Airlines", icon: "—", count: PROGRAM_DIRECTORY.airlines.length },
                  { id: "hotel", label: "Hotels", icon: "—", count: PROGRAM_DIRECTORY.hotels.length },
                  { id: "rental", label: "Rentals", icon: "—", count: PROGRAM_DIRECTORY.rentals.length },
                  { id: "card", label: "Cards", icon: "💳", count: PROGRAM_DIRECTORY.creditCards.length },
                ].map(cat => (
                  <button key={cat.id} onClick={() => setNewProgram(p => ({ ...p, category: cat.id, selectedId: "", search: "" }))} style={{
                    flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif",
                    background: newProgram.category === cat.id ? "rgba(14,165,160,0.2)" : "rgba(255,255,255,0.03)",
                    color: newProgram.category === cat.id ? "#0EA5A0" : "rgba(0,0,0,0.3)", transition: "all 0.2s",
                  }}>{cat.icon} {cat.label} ({cat.count})</button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                value={newProgram.search || ""}
                onChange={e => setNewProgram(p => ({ ...p, search: e.target.value, selectedId: "" }))}
                placeholder={`Search ${newProgram.category === "card" ? "credit cards" : newProgram.category + "s"}...`}
                style={{ display: "block", width: "100%", padding: "10px 12px 10px 36px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
              />
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.3 }}>🔍</span>
            </div>

            {/* Program List */}
            {!selectedProg && (
              <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 14, borderRadius: 8, border: "1px solid #2a2640" }}>
                {filtered.map(prog => {
                  const isLinked = alreadyLinked.includes(prog.id);
                  return (
                    <button key={prog.id} onClick={() => !isLinked && setNewProgram(p => ({ ...p, selectedId: prog.id, search: "" }))}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.03)",
                        border: "none", borderBottom: "1px solid rgba(0,0,0,0.02)", cursor: isLinked ? "default" : "pointer",
                        opacity: isLinked ? 0.4 : 1, transition: "background 0.15s", textAlign: "left",
                      }}
                      onMouseEnter={e => { if (!isLinked) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <ProgramLogo prog={prog} size={24} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#f7f8f8", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{prog.name}</div>
                        <div style={{ fontSize: 10, color: "#62666d", fontFamily: "Inter, sans-serif" }}>
                          {prog.tiers ? `${prog.tiers.length} tiers · ${prog.unit}` : prog.perks ? prog.perks.substring(0, 50) + "..." : prog.unit}
                        </div>
                      </div>
                      {isLinked ? (
                        <span style={{ fontSize: 10, color: "#0EA5A0", fontWeight: 600, fontFamily: "Inter, sans-serif" }}>Linked ✓</span>
                      ) : (
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: prog.color, flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <div style={{ padding: 20, textAlign: "center", color: "#62666d", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
                    No programs match your search
                  </div>
                )}
              </div>
            )}

            {/* Selected Program Detail */}
            {selectedProg && (
              <div style={{ marginBottom: 16 }}>
                {/* Program Card */}
                <div style={{
                  background: `linear-gradient(135deg, ${selectedProg.color}18, ${(selectedProg.accent || selectedProg.color)}10)`,
                  border: `1px solid ${selectedProg.color}30`, borderRadius: 8, padding: 16, marginBottom: 14,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <ProgramLogo prog={selectedProg} size={36} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{selectedProg.name}</div>
                      <div style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>
                        {selectedProg.tiers ? `${selectedProg.tiers.length} elite tiers · ${selectedProg.unit}` : `${selectedProg.unit} · $${selectedProg.annualFee}/yr`}
                      </div>
                    </div>
                    <button onClick={() => setNewProgram(p => ({ ...p, selectedId: "" }))} style={{
                      background: "#2a2640", border: "none", borderRadius: 8, width: 28, height: 28, color: "#8a8f98", cursor: "pointer", fontSize: 14,
                    }}>✕</button>
                  </div>
                  {/* Tier badges */}
                  {selectedProg.tiers && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      {selectedProg.tiers.map((t, i) => (
                        <span key={i} style={{
                          padding: "3px 8px", borderRadius: 8, fontSize: 10, fontWeight: 600, fontFamily: "Inter, sans-serif",
                          background: `${selectedProg.color}20`, color: selectedProg.color, border: `1px solid ${selectedProg.color}30`,
                        }}>{t.name}</span>
                      ))}
                    </div>
                  )}
                  {selectedProg.perks && (
                    <div style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>{selectedProg.perks}</div>
                  )}
                </div>

                {/* Connect Account CTA */}
                {selectedProg.loginUrl && (
                  <a href={selectedProg.loginUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderRadius: 8,
                    background: `linear-gradient(135deg, ${selectedProg.color}, ${selectedProg.accent || selectedProg.color})`,
                    color: "#f7f8f8", textDecoration: "none", fontWeight: 700, fontSize: 13, fontFamily: "Inter, sans-serif", marginBottom: 14,
                    boxShadow: `0 4px 15px ${selectedProg.color}40`, transition: "all 0.2s",
                  }}>
                    🔗 Connect to {selectedProg.name.split(" ")[0]} Account
                    <span style={{ fontSize: 11, opacity: 0.7 }}>↗</span>
                  </a>
                )}
                <p style={{ fontSize: 10, color: "#62666d", fontFamily: "Inter, sans-serif", textAlign: "center", margin: "0 0 12px" }}>
                  Opens {selectedProg.name.split(" ")[0]}'s website — log in to view your live status & points balance
                </p>

                {/* Member ID input */}
                <label style={{ display: "block", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Member / Account Number</span>
                  <input value={newProgram.memberId} onChange={e => setNewProgram(p => ({ ...p, memberId: e.target.value }))} placeholder="Enter your member number to link"
                    style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                </label>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowAddProgram(false); setNewProgram({ name: "", category: "airline", logo: "—", color: "#0EA5A0", memberId: "", unit: "Points", tiers: "", selectedId: "", search: "" }); }} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid #2a2640", background: "rgba(255,255,255,0.03)",
                color: "#8a8f98", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Cancel</button>
              {selectedProg ? (
                <button onClick={() => {
                  const prog = selectedProg;
                  if (!alreadyLinked.includes(prog.id)) {
                    setLinkedAccounts(prev => ({ ...prev, [prog.id]: { memberId: newProgram.memberId || "Pending", currentPoints: 0, currentNights: 0, currentRentals: 0 } }));
                  }
                  setShowAddProgram(false);
                  setNewProgram({ name: "", category: "airline", logo: "—", color: "#0EA5A0", memberId: "", unit: "Points", tiers: "", selectedId: "", search: "" });
                }} style={{
                  flex: 1, padding: "11px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif",
                  background: `linear-gradient(135deg, #0EA5A0, #0EA5A0)`, color: "#f7f8f8",
                }}>Link {selectedProg.name.split(" ")[0]}</button>
              ) : (
                <button onClick={() => {
                  if (!newProgram.name || !newProgram.name.trim()) return;
                  const id = "custom_" + Date.now();
                  const prog = {
                    id, name: newProgram.name, logo: newProgram.logo, color: newProgram.color, accent: newProgram.color,
                    unit: newProgram.unit || "Points", tiers: [], earnRate: {}, isCustom: true, category: newProgram.category,
                  };
                  setCustomPrograms(prev => [...prev, prog]);
                  if (newProgram.memberId) {
                    setLinkedAccounts(prev => ({ ...prev, [id]: { memberId: newProgram.memberId, currentPoints: 0, currentNights: 0, currentRentals: 0 } }));
                  }
                  setShowAddProgram(false);
                  setNewProgram({ name: "", category: "airline", logo: "—", color: "#0EA5A0", memberId: "", unit: "Points", tiers: "", selectedId: "", search: "" });
                }} style={{
                  flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid #2a2640", background: "rgba(255,255,255,0.03)",
                  color: "#8a8f98", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}>+ Add Custom</button>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }}>
          <div style={{
            background: "#211e2e", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: 32, width: "100%", maxWidth: 400, textAlign: "center",
          }}>
            <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}><img src="/continuum-travel-logo.svg" alt="Continuum" style={{ height: 220, display: "block" }} /></div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 8px", fontFamily: "'Inter Tight', Inter, sans-serif" }}>Upgrade to Premium</h3>
            <p style={{ color: "#8a8f98", fontSize: 13, fontFamily: "Inter, sans-serif", marginBottom: 24 }}>
              Unlock the Trip Optimizer, status match alerts, PDF exports, and more.
            </p>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#fff", fontFamily: "'Inter Tight', Inter, sans-serif", marginBottom: 4 }}>$9.99<span style={{ fontSize: 14, color: "#8a8f98" }}>/mo</span></div>
            <p style={{ fontSize: 11, color: "#62666d", fontFamily: "Inter, sans-serif", marginBottom: 24 }}>Cancel anytime. 7-day free trial.</p>
            <button onClick={() => { setUser(prev => ({ ...prev, tier: "premium" })); setShowUpgrade(false); }} style={{
              width: "100%", padding: "13px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Inter, sans-serif",
              background: "#f59e0b", color: "#fff", marginBottom: 10,
            }}>Start Free Trial</button>
            <button onClick={() => setShowUpgrade(false)} style={{
              width: "100%", padding: "11px 0", borderRadius: 8, border: "1px solid #2a2640", background: "rgba(255,255,255,0.03)",
              color: "#8a8f98", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>Maybe Later</button>
          </div>
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      {/* Share Trip Modal */}
      {/* Confirm Modal — replaces window.confirm for reliable cross-platform behavior */}
      {confirmModal && (
        <div onClick={e => { e.stopPropagation(); e.preventDefault(); }} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, touchAction: "none" }}>
          <div style={{ width: "100%", maxWidth: 380, background: D ? "#1a1a1a" : "#fff", border: `1px solid ${css.border}`, borderRadius: 14, padding: "28px 24px 20px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: css.text, marginBottom: 6 }}>Confirm</div>
            <div style={{ fontSize: 14, color: css.text2, marginBottom: 24, lineHeight: 1.6 }}>{confirmModal.message}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmModal(null)} style={{
                flex: 1, padding: "12px 0", borderRadius: 8, border: `1px solid ${css.border}`,
                background: "transparent", color: css.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>Cancel</button>
              <button onClick={() => { const cb = confirmModal.onConfirm; setConfirmModal(null); cb(); }} style={{
                flex: 1, padding: "12px 0", borderRadius: 8, border: "none",
                background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (() => {
        const trip = allTripsWithShared.find(t => t.id === showShareModal);
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ width: "100%", maxWidth: 440, background: D ? "#141414" : "#fff", border: `2px solid ${D ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, padding: 32, position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: css.text, margin: 0 }}>Share Trip</h2>
                <button onClick={() => { setShowShareModal(null); setShareStatus(""); setSharePermission("read"); }} style={{ width: 36, height: 36, border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
              {trip && <div style={{ fontSize: 13, fontWeight: 600, color: css.text2, marginBottom: 16 }}>{trip.tripName || trip.location || "Trip"}</div>}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Recipient's Email</label>
                <input type="email" value={shareEmail} onChange={e => { setShareEmail(e.target.value); setShareStatus(""); }} placeholder="e.g. jane@example.com"
                  style={{ display: "block", width: "100%", padding: "12px 16px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                <div style={{ fontSize: 10, color: css.text3, marginTop: 4 }}>They'll see this trip next time they open Continuum</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Permission Level</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setSharePermission("read")} style={{
                    flex: 1, padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s",
                    border: `1px solid ${sharePermission === "read" ? css.accent : css.border}`,
                    background: sharePermission === "read" ? (D ? "rgba(14,165,160,0.1)" : "rgba(14,165,160,0.06)") : "transparent",
                    color: sharePermission === "read" ? css.accent : css.text3,
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>View Only</div>
                    <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>Can view trips, receipts, and itineraries</div>
                  </button>
                  <button onClick={() => setSharePermission("edit")} style={{
                    flex: 1, padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s",
                    border: `1px solid ${sharePermission === "edit" ? "#3b82f6" : css.border}`,
                    background: sharePermission === "edit" ? (D ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.06)") : "transparent",
                    color: sharePermission === "edit" ? "#3b82f6" : css.text3,
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>Can Edit</div>
                    <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>Can edit trip details, segments, and expenses</div>
                  </button>
                </div>
              </div>
              {shareStatus === "sent" && <div style={{ padding: "10px 14px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", fontSize: 12, fontWeight: 600, marginBottom: 16 }}>Trip shared successfully!</div>}
              {shareStatus === "already" && <div style={{ padding: "10px 14px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", fontSize: 12, fontWeight: 600, marginBottom: 16 }}>This trip is already shared with that email</div>}
              {shareStatus === "error" && <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 12, fontWeight: 600, marginBottom: 16 }}>Failed to share. Please try again.</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setShowShareModal(null); setShareStatus(""); setSharePermission("read"); }} style={{ flex: 1, padding: "12px 0", border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleShareTrip} disabled={!shareEmail.trim()} style={{ flex: 1, padding: "12px 0", border: "none", background: shareEmail.trim() ? "#3b82f6" : css.surface2, color: shareEmail.trim() ? "#fff" : css.text3, fontSize: 13, fontWeight: 700, cursor: shareEmail.trim() ? "pointer" : "not-allowed" }}>Share</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Expense Detail View Modal */}
      {viewExpenseId && (() => {
        const exp = expenses.find(e => e.id === viewExpenseId);
        if (!exp) return null;
        const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
        const trip = trips.find(t => t.id === exp.tripId);
        const rows = [
          { label: "Expense Name", value: exp.description },
          { label: "Category", value: cat?.label || exp.category },
          { label: "Date", value: exp.date ? new Date(exp.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "" },
          { label: "Amount", value: exp.amount ? `${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${exp.currency || "USD"}` : "", mono: true },
          { label: "USD Reimbursement", value: exp.usdReimbursement ? `${parseFloat(exp.usdReimbursement).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD` : (exp.currency === "USD" && exp.amount ? `${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD` : ""), mono: true },
          { label: "Individuals", value: exp.individuals || "Self" },
          { label: "Payment Method", value: exp.paymentMethod },
          { label: "Trip", value: trip ? (trip.tripName || trip.location || "Trip") : "Unassigned" },
          { label: "Comments", value: exp.notes },
        ];
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}>
            <div style={{ width: "100%", maxWidth: 520, maxHeight: isMobile ? "92vh" : "85vh", overflowY: "auto", background: D ? "#141414" : "#fff", border: `2px solid ${D ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, padding: "32px", position: "relative" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, position: "sticky", top: -32, zIndex: 10, background: D ? "#141414" : "#fff", margin: "-32px -32px 24px", padding: "20px 32px", borderBottom: `1px solid ${css.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {cat && <span style={{ fontSize: 10, fontWeight: 700, color: cat.color, background: `${cat.color}15`, padding: "3px 10px" }}>{cat.label}</span>}
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: css.text, margin: 0 }}>Expense Detail</h2>
                </div>
                <button onClick={() => setViewExpenseId(null)} style={{ width: 36, height: 36, border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>

              {/* Fields */}
              {rows.filter(r => r.value).map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${css.border}` }}>
                  <span style={{ fontSize: 12, color: css.text3, fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: css.text, fontFamily: row.mono ? "'Geist Mono', monospace" : "inherit", textAlign: "right", maxWidth: "60%" }}>{row.value}</span>
                </div>
              ))}

              {/* Receipt preview */}
              {exp.receiptImage && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Receipt</div>
                  {exp.receiptImage.type?.startsWith("image/") ? (
                    <div>
                      <img src={exp.receiptImage.data} alt="Receipt" style={{ width: "100%", maxHeight: 500, objectFit: "contain", border: `1px solid ${css.border}`, background: D ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }} />
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button onClick={() => { setCropExpenseId(exp.id); setCropStart(null); setCropEnd(null); }} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 002 2h14"/><path d="M18 22V8a2 2 0 00-2-2H2"/></svg>
                          Crop
                        </button>
                      </div>
                    </div>
                  ) : exp.receiptImage.type === "application/pdf" ? (
                    <div style={{ padding: "20px", border: `1px solid ${css.border}`, background: D ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", textAlign: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: css.text2, marginBottom: 8 }}>{exp.receiptImage.name}</div>
                      <div style={{ fontSize: 11, color: css.text3 }}>{(exp.receiptImage.size / 1024).toFixed(0)} KB · PDF</div>
                      <a href={exp.receiptImage.data} download={exp.receiptImage.name} style={{ display: "inline-block", marginTop: 10, padding: "8px 16px", border: `1px solid ${css.accent}`, color: css.accent, fontSize: 11, fontWeight: 700, textDecoration: "none", cursor: "pointer" }}>Download PDF</a>
                    </div>
                  ) : exp.receiptImage.type === "text/html" ? (
                    <div style={{ border: `1px solid ${css.border}`, borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                      <iframe id={`receipt-iframe-${exp.id}`} srcDoc={exp.receiptImage.data?.startsWith("data:") ? atob(exp.receiptImage.data.split(",")[1] || "") : exp.receiptImage.data} style={{ width: "100%", height: 500, border: "none" }} title="Receipt" sandbox="allow-same-origin" />
                      <div style={{ padding: "8px 12px", borderTop: `1px solid ${css.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: css.text3 }}>Email Receipt</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={async () => {
                            // Auto-convert HTML to image and open crop
                            try {
                              const iframe = document.getElementById(`receipt-iframe-${exp.id}`);
                              if (!iframe?.contentDocument?.body) return;
                              const html2canvas = (await import("html2canvas")).default;
                              const canvas = await html2canvas(iframe.contentDocument.body, { useCORS: true, scale: 2, width: iframe.contentDocument.body.scrollWidth, height: iframe.contentDocument.body.scrollHeight, windowWidth: iframe.contentDocument.body.scrollWidth });
                              const dataUrl = canvas.toDataURL("image/png", 0.92);
                              const newImg = { name: `receipt-${Date.now()}.png`, size: dataUrl.length, type: "image/png", data: dataUrl };
                              setExpenses(prev => prev.map(ex => ex.id === exp.id ? { ...ex, receiptImage: newImg } : ex));
                              if (user) supabase.from("expenses").update({ receipt_image: newImg }).eq("id", exp.id).eq("user_id", user.id);
                              // Open crop modal
                              setTimeout(() => { setCropExpenseId(exp.id); setCropStart(null); setCropEnd(null); }, 100);
                            } catch (e) { console.error("Screenshot failed:", e); }
                          }} style={{ padding: "4px 12px", borderRadius: 4, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 10, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 002 2h14"/><path d="M18 22V8a2 2 0 00-2-2H2"/></svg>
                            Crop
                          </button>
                          <button onClick={() => { const w = window.open("", "_blank"); if (w) { w.document.write(exp.receiptImage.data?.startsWith("data:") ? atob(exp.receiptImage.data.split(",")[1] || "") : ""); w.document.close(); } }} style={{ padding: "4px 12px", borderRadius: 4, border: `1px solid ${css.accent}`, background: "transparent", color: css.accent, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Open Full Size</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "16px", border: `1px solid ${css.border}`, fontSize: 12, color: css.text3 }}>
                      {exp.receiptImage.name} · {(exp.receiptImage.size / 1024).toFixed(0)} KB
                    </div>
                  )}
                </div>
              )}
              {!exp.receiptImage && !exp.receipt && (
                <div style={{ marginTop: 20, padding: "16px", border: `1px dashed ${css.border}`, textAlign: "center" }}>
                  <span style={{ fontSize: 12, color: css.text3 }}>No receipt attached</span>
                </div>
              )}

              {/* Transfer to trip */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  {exp.tripId ? "Transfer to Another Trip" : "Assign to Trip"}
                </div>
                <select onChange={async e => {
                  const newTripId = e.target.value; if (!newTripId) return;
                  const actualTripId = newTripId === "_unassign" ? null : newTripId;
                  if (user) await supabase.from("expenses").update({ trip_id: actualTripId }).eq("id", exp.id).eq("user_id", user.id);
                  setExpenses(prev => prev.map(ex => ex.id === exp.id ? { ...ex, tripId: actualTripId } : ex));
                  e.target.value = "";
                }} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${css.border}`, background: css.surface2, color: css.text, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                  <option value="">{exp.tripId ? `Currently: ${trip?.tripName || trip?.location || "Trip"}` : "Select a trip..."}</option>
                  {exp.tripId && <option value="_unassign">Unassign (back to inbox)</option>}
                  {trips.filter(t => t.id !== exp.tripId).map(t => <option key={t.id} value={t.id}>{t.tripName || t.trip_name || t.location || "Trip"}</option>)}
                </select>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button onClick={() => { setViewExpenseId(null); setEditExpenseId(exp.id); setShowAddExpense(exp.tripId || "_inbox"); setNewExpense({ ...exp, fxRate: exp.fxRate || 1 }); }} style={{
                  flex: 1, padding: "12px 0", border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>Edit</button>
                <button onClick={() => setViewExpenseId(null)} style={{
                  flex: 1, padding: "12px 0", border: "none", background: css.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {showAddExpense && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20,
        }}>
          <div style={{
            width: "100%", maxWidth: 560, maxHeight: isMobile ? "92vh" : "85vh", overflowY: "auto",
            background: D ? "#141414" : "#fff", border: `2px solid ${D ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            padding: "32px", position: "relative",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, position: "sticky", top: -32, zIndex: 10, background: D ? "#141414" : "#fff", margin: "-32px -32px 24px", padding: "20px 32px", borderBottom: `1px solid ${css.border}` }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: css.text, margin: 0, letterSpacing: "-0.01em" }}>{editExpenseId ? "Edit Expense" : "Add Expense"}</h2>
              <button onClick={() => { setShowAddExpense(null); setEditExpenseId(null); setNewExpense(BLANK_EXPENSE); }} style={{ width: 36, height: 36, border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <p style={{ color: css.text3, fontSize: 12, margin: "0 0 20px" }}>
              {(() => { const t = trips.find(t => t.id === showAddExpense); return t ? `${t.type === "flight" ? "—" : t.type === "hotel" ? "—" : "—"} ${getTripName(t)}` : ""; })()}
            </p>

            {(() => {
              const eLbl = { fontSize: 11, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };
              const eInp = { display: "block", width: "100%", padding: "12px 16px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
              return (<>
            {/* Category selector */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ ...eLbl, marginBottom: 8 }}>Category</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {EXPENSE_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setNewExpense(p => ({ ...p, category: cat.id }))} style={{
                    padding: "6px 12px", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                    background: newExpense.category === cat.id ? `${cat.color}25` : css.surface2,
                    color: newExpense.category === cat.id ? cat.color : css.text3, transition: "all 0.15s",
                  }}>{cat.label}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={eLbl}>Expense Name</label>
              <input value={newExpense.description} onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Marriott 3 nights" style={eInp} />
            </div>

            {/* Date */}
            <div style={{ marginBottom: 16 }}>
              <label style={eLbl}>Date of Transaction</label>
              <input type="date" value={newExpense.date} onChange={e => { if (e.target.value) lastDateRef.current = e.target.value; setNewExpense(p => ({ ...p, date: e.target.value })); }}
                onFocus={e => { if (!e.target.value && lastDateRef.current) setNewExpense(p => ({ ...p, date: lastDateRef.current })); }}
                style={eInp} />
            </div>

            {/* Individuals */}
            <div style={{ marginBottom: 16 }}>
              <label style={eLbl}>Individuals Included</label>
              <input value={newExpense.individuals || "Self"} onChange={e => setNewExpense(p => ({ ...p, individuals: e.target.value }))} placeholder="Self" style={eInp} />
              <div style={{ fontSize: 9, color: css.text3, marginTop: 3 }}>Comma-separated, e.g. "Self, John Smith, Jane Doe"</div>
            </div>

            {/* Amount + Currency */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 16 }}>
              <div>
                <label style={eLbl}>Expense Amount</label>
                <input type="number" min="0" step="0.01" value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value, usdReimbursement: p.currency === "USD" ? e.target.value : p.usdReimbursement }))} placeholder="0.00" style={eInp} />
              </div>
              <div>
                <label style={eLbl}>Currency</label>
                <select value={newExpense.currency} onChange={e => setNewExpense(p => ({ ...p, currency: e.target.value, usdReimbursement: e.target.value === "USD" ? p.amount : p.usdReimbursement }))} style={eInp}>
                  {CURRENCIES.map(([v]) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            {/* USD Reimbursement */}
            <div style={{ marginBottom: 16 }}>
              <label style={eLbl}>USD Reimbursement Amount</label>
              {newExpense.currency === "USD" ? (
                <input type="number" value={newExpense.amount || ""} disabled style={{ ...eInp, color: css.text3, background: D ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }} />
              ) : (
                <input type="number" min="0" step="0.01" value={newExpense.usdReimbursement || ""} onChange={e => setNewExpense(p => ({ ...p, usdReimbursement: e.target.value }))} placeholder="Enter USD equivalent" style={eInp} />
              )}
              {newExpense.currency !== "USD" && <div style={{ fontSize: 9, color: css.text3, marginTop: 3 }}>Manual input — enter the USD equivalent for reimbursement</div>}
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom: 16 }}>
              <label style={eLbl}>Payment Method</label>
              <select value={newExpense.paymentMethod} onChange={e => setNewExpense(p => ({ ...p, paymentMethod: e.target.value }))} style={eInp}>
                <option value="">Select...</option>
                <option value="Amex Platinum">Amex Platinum</option>
                <option value="Cash">Cash</option>
                <option value="Chase Sapphire">Chase Sapphire Reserve</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Comments */}
            <div style={{ marginBottom: 16 }}>
              <label style={eLbl}>Comments (optional)</label>
              <input value={newExpense.notes} onChange={e => setNewExpense(p => ({ ...p, notes: e.target.value }))} placeholder="Business purpose, attendees, etc." style={eInp} />
            </div>

            {/* Receipt Upload / Camera / Paste */}
            <div style={{ marginBottom: 20 }} onPaste={e => {
              const items = e.clipboardData?.items;
              if (!items) return;
              for (const item of items) {
                if (item.type.startsWith("image/")) {
                  e.preventDefault();
                  const file = item.getAsFile();
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => setNewExpense(p => ({ ...p, receipt: true, receiptImage: { name: `pasted-receipt-${Date.now()}.png`, size: file.size, type: file.type, data: ev.target.result } }));
                  reader.readAsDataURL(file);
                  return;
                }
              }
            }}>
              <span style={{ ...eLbl, marginBottom: 8 }}>Receipt</span>

              {!newExpense.receiptImage ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {/* Paste from clipboard */}
                  <div onClick={() => {
                    navigator.clipboard?.read?.().then(items => {
                      for (const item of items) {
                        const imageType = item.types.find(t => t.startsWith("image/"));
                        if (imageType) {
                          item.getType(imageType).then(blob => {
                            const reader = new FileReader();
                            reader.onload = (ev) => setNewExpense(p => ({ ...p, receipt: true, receiptImage: { name: `pasted-receipt-${Date.now()}.png`, size: blob.size, type: blob.type, data: ev.target.result } }));
                            reader.readAsDataURL(blob);
                          });
                          return;
                        }
                      }
                    }).catch(() => {});
                  }} tabIndex={0} style={{
                    flex: 1, minWidth: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "18px 12px", border: `2px dashed ${css.accent}30`, background: `${css.accent}08`,
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={css.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    <span style={{ fontSize: 11, fontWeight: 600, color: css.accent }}>Paste</span>
                    <span style={{ fontSize: 9, color: css.text3 }}>Ctrl+V / Cmd+V</span>
                  </div>

                  {/* Upload file button */}
                  <label style={{
                    flex: 1, minWidth: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "18px 12px", border: `2px dashed ${css.accent}30`, background: `${css.accent}08`,
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: css.accent }}>Upload File</span>
                    <span style={{ fontSize: 9, color: css.text3 }}>JPG, PNG, PDF</span>
                    <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setNewExpense(p => ({ ...p, receipt: true, receiptImage: { name: file.name, size: file.size, type: file.type, data: ev.target.result } }));
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>

                  {/* Take photo button */}
                  <label style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "18px 12px", border: `2px dashed ${css.accent}30`, background: `${css.accent}08`,
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: css.accent }}>Take Photo</span>
                    <span style={{ fontSize: 9, color: css.text3 }}>Use camera</span>
                    <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setNewExpense(p => ({ ...p, receipt: true, receiptImage: { name: file.name, size: file.size, type: file.type, data: ev.target.result } }));
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>

                  {/* No receipt option */}
                  <button onClick={() => setNewExpense(p => ({ ...p, receipt: false, receiptImage: null }))} style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "18px 12px", border: `2px dashed ${css.border}`,
                    background: "transparent", cursor: "pointer",
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: css.text3 }}>No Receipt</span>
                    <span style={{ fontSize: 9, color: css.text3 }}>&nbsp;</span>
                  </button>
                </div>
              ) : (
                /* Receipt preview */
                <div style={{
                  borderRadius: 8, border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.06)", padding: 14,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  {newExpense.receiptImage.type?.startsWith("image/") ? (
                    <img src={newExpense.receiptImage.data} alt="Receipt" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: "1px solid #2a2640" }} />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: 8, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📄</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#34d399", fontFamily: "Inter, sans-serif" }}>✓ Receipt attached</div>
                    <div style={{ fontSize: 11, color: "#62666d", fontFamily: "Inter, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {newExpense.receiptImage.name} • {(newExpense.receiptImage.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                  <button onClick={() => setNewExpense(p => ({ ...p, receipt: false, receiptImage: null }))} style={{
                    width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444",
                    fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>×</button>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowAddExpense(null); setEditExpenseId(null); setNewExpense(BLANK_EXPENSE); }} style={{
                flex: 1, padding: "12px 0", border: `1px solid ${css.border}`, background: "transparent",
                color: css.text2, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>Cancel</button>
              <button onClick={handleAddExpense} style={{
                flex: 1, padding: "12px 0", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                background: css.accent, color: "#fff",
              }}>{editExpenseId ? "Save Changes" : "Add Expense"}</button>
            </div>
            </>); })()}
          </div>
        </div>
      )}

      {/* Expense Report Modal */}
      {showExpenseReport && (() => {
        const trip = trips.find(t => t.id === showExpenseReport);
        if (!trip) return null;
        const tripExps = getTripExpenses(trip.id).sort((a, b) => new Date(a.date) - new Date(b.date));
        const prog = allPrograms.find(p => p.id === trip.program);
        const receiptCount = tripExps.filter(e => e.receipt).length;

        // Per-expense: show in its own entered currency; total rolls up in USD
        const CURRENCY_SYMBOLS = { USD:"$", EUR:"€", GBP:"£", CAD:"CA$", AUD:"A$", JPY:"¥", CHF:"Fr", CNY:"¥", HKD:"HK$", SGD:"S$", MXN:"MX$", BRL:"R$", INR:"₹", KRW:"₩", AED:"د.إ", THB:"฿", NOK:"kr", SEK:"kr", DKK:"kr", NZD:"NZ$" };
        const symFor = (cur) => CURRENCY_SYMBOLS[cur] || (cur + " ");
        const fmtAmt = (n, cur) => n === 0 ? "Free" : `${symFor(cur)}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const toUSD = (exp) => exp.amount * (exp.fxRate || 1);

        // USD total (all expenses converted via their own fxRate)
        const tripTotalUSD = tripExps.reduce((s, e) => s + toUSD(e), 0);
        const catSummary = EXPENSE_CATEGORIES.map(cat => ({
          ...cat,
          totalUSD: tripExps.filter(e => e.category === cat.id).reduce((s, e) => s + toUSD(e), 0),
          count: tripExps.filter(e => e.category === cat.id).length,
        })).filter(c => c.totalUSD > 0);

        const printReport = async () => {
          const expensesWithReceipts = tripExps.filter(e => e.receiptImage?.data);
          const pdfPageImages = {};
          for (const exp of expensesWithReceipts) {
            if (exp.receiptImage.type === "application/pdf") {
              try { pdfPageImages[exp.id] = await renderPdfToImages(exp.receiptImage.data); } catch(e) { pdfPageImages[exp.id] = []; }
            }
          }
          // Light theme palette — ink-saving for print
          const PC = { bg: "#ffffff", text: "#111827", text2: "#374151", text3: "#6b7280", text4: "#9ca3af", border: "#e5e7eb", borderSoft: "#f3f4f6", rowAlt: "#f9fafb", accent: "#0EA5A0", accentBg: "rgba(14,165,160,0.06)", accentBorder: "rgba(14,165,160,0.25)", positive: "#059669", muted: "#9ca3af" };
          const fmtAttendees = (v) => { const s = (v || "").toString().trim(); return !s || s.toLowerCase() === "self" ? "Self" : s; };
          const catRows = catSummary.map(cat => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid ${PC.borderSoft};">
                <span style="font-size:13px;color:${PC.text2};">${cat.label} (${cat.count})</span>
              </td>
              <td style="padding:10px 0;border-bottom:1px solid ${PC.borderSoft};">
                <div style="background:${PC.borderSoft};border-radius:4px;height:6px;width:120px;overflow:hidden;">
                  <div style="width:${tripTotalUSD > 0 ? Math.round((cat.totalUSD/tripTotalUSD)*100) : 0}%;height:100%;background:${cat.color};border-radius:4px;"></div>
                </div>
              </td>
              <td style="padding:10px 0;border-bottom:1px solid ${PC.borderSoft};text-align:right;font-size:13px;font-weight:700;color:${PC.text};">$${cat.totalUSD.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            </tr>`).join("");
          const lineRows = tripExps.map((exp, i) => {
            const cur = exp.currency || "USD";
            const usdAmt = toUSD(exp);
            const isForeign = cur !== "USD";
            const receiptIdx = expensesWithReceipts.findIndex(e => e.id === exp.id);
            const attendees = fmtAttendees(exp.individuals);
            return `
            <tr>
              <td style="padding:10px 14px;border-bottom:1px solid ${PC.borderSoft};vertical-align:top;">
                <div style="font-size:13px;color:${PC.text};">${exp.description}</div>
                ${exp.notes ? `<div style="font-size:10px;color:${PC.text3};margin-top:2px;">${exp.notes}</div>` : ""}
              </td>
              <td style="padding:10px 14px;border-bottom:1px solid ${PC.borderSoft};font-size:12px;color:${PC.text2};white-space:nowrap;">${exp.date?.slice(5) || ""}</td>
              <td style="padding:10px 14px;border-bottom:1px solid ${PC.borderSoft};font-size:12px;color:${PC.text2};">${exp.paymentMethod || "—"}</td>
              <td style="padding:10px 14px;border-bottom:1px solid ${PC.borderSoft};font-size:12px;color:${attendees === "Self" ? PC.text3 : PC.text2};">${attendees}</td>
              <td style="padding:10px 14px;border-bottom:1px solid ${PC.borderSoft};text-align:right;">
                <div style="font-size:13px;font-weight:700;color:${exp.amount===0?PC.positive:PC.text};">${fmtAmt(exp.amount, cur)}</div>
                ${isForeign ? `<div style="font-size:10px;color:${PC.text3};">$${usdAmt.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} USD</div>` : ""}
              </td>
              <td style="padding:10px 14px;border-bottom:1px solid ${PC.borderSoft};text-align:center;font-size:11px;color:${exp.receipt?PC.accent:PC.muted};">
                ${exp.receipt ? (receiptIdx >= 0 ? `<a href="#receipt-${receiptIdx+1}" style="color:${PC.accent};font-size:10px;text-decoration:none;">p.${receiptIdx+1+1}</a>` : "✓") : "—"}
              </td>
            </tr>`;
          }).join("");
          const receiptPages = expensesWithReceipts.map((exp, i) => {
            const cur = exp.currency || "USD";
            const isPdf = exp.receiptImage.type === "application/pdf";
            const pages = isPdf ? (pdfPageImages[exp.id] || []) : [exp.receiptImage.data];
            return pages.map((src, pi) => `
              <div id="${pi === 0 ? `receipt-${i+1}` : ""}" style="page-break-before:always;padding:48px;background:${PC.bg};min-height:100vh;box-sizing:border-box;">
                ${pi === 0 ? `
                  <div style="color:${PC.text3};font-size:11px;font-family:monospace;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.1em;">Receipt ${i+1} of ${expensesWithReceipts.length}${isPdf && pages.length > 1 ? ` — Page 1 of ${pages.length}` : ""}</div>
                  <div style="font-size:16px;font-weight:700;color:${PC.text};margin-bottom:4px;">${exp.description}</div>
                  <div style="font-size:12px;color:${PC.text3};margin-bottom:32px;">${exp.date||""} · ${exp.paymentMethod||""} · ${fmtAmt(exp.amount,cur)}</div>
                ` : `
                  <div style="color:${PC.text3};font-size:11px;font-family:monospace;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.1em;">Receipt ${i+1} — Page ${pi+1} of ${pages.length} · ${exp.description}</div>
                `}
                <img src="${src}" alt="Receipt${isPdf ? ` page ${pi+1}` : ""}" style="width:100%;border-radius:8px;border:1px solid ${PC.border};display:block;" />
              </div>
            `).join("");
          }).join("");
          const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
            <title>Expense Report — ${getTripName(trip)}</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { background: ${PC.bg}; color: ${PC.text}; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @media print {
                body { background: ${PC.bg} !important; }
                @page { margin: 16mm 18mm; size: A4; }
              }
              table { border-collapse: collapse; width: 100%; }
              a { text-decoration: none; }
            </style>
          </head><body>
            <div style="padding:48px 48px 40px;background:${PC.bg};min-height:100vh;">
              <!-- Header -->
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;border-bottom:1px solid ${PC.border};padding-bottom:24px;">
                <div>
                  <img src="${window.location.origin}/continuum-travel-logo.svg" alt="Continuum" style="height:60px;display:block;margin-bottom:12px;filter:brightness(0);" />
                  <div style="font-size:26px;font-weight:800;color:${PC.text};letter-spacing:-0.5px;">Expense Report</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:11px;color:${PC.text3};">Generated ${new Date().toLocaleDateString()}</div>
                  <div style="font-size:11px;color:${PC.text4};">Report #${trip.id}-${Date.now().toString(36).slice(-4)}</div>
                  <div style="margin-top:6px;font-size:11px;font-weight:700;color:${PC.accent};">Total in USD</div>
                </div>
              </div>
              <!-- Trip -->
              <div style="background:${PC.accentBg};border:1px solid ${PC.accentBorder};border-radius:10px;padding:20px;margin-bottom:28px;">
                <div style="font-size:18px;font-weight:700;color:${PC.text};margin-bottom:6px;">${getTripName(trip)}</div>
                <div style="font-size:13px;color:${PC.text2};">${trip.date||""} · ${prog?.name||"Unknown"} · ${trip.status||""}</div>
              </div>
              <!-- Stats -->
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:28px;">
                <div style="background:${PC.rowAlt};border:1px solid ${PC.border};border-radius:8px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:${PC.accent};">$${tripTotalUSD.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                  <div style="font-size:10px;color:${PC.text3};margin-top:4px;text-transform:uppercase;letter-spacing:0.08em;">Total (USD)</div>
                </div>
                <div style="background:${PC.rowAlt};border:1px solid ${PC.border};border-radius:8px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:700;color:${PC.text};">${tripExps.length}</div>
                  <div style="font-size:10px;color:${PC.text3};margin-top:4px;text-transform:uppercase;letter-spacing:0.08em;">Items</div>
                </div>
                <div style="background:${PC.rowAlt};border:1px solid ${PC.border};border-radius:8px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:${PC.positive};">${receiptCount}/${tripExps.length}</div>
                  <div style="font-size:10px;color:${PC.text3};margin-top:4px;text-transform:uppercase;letter-spacing:0.08em;">Receipts</div>
                </div>
              </div>
              <!-- Category Breakdown -->
              <div style="margin-bottom:28px;">
                <div style="font-size:11px;font-weight:700;color:${PC.text3};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Breakdown by Category</div>
                <table><tbody>${catRows}</tbody></table>
              </div>
              <!-- Line Items -->
              <div style="margin-bottom:32px;">
                <div style="font-size:11px;font-weight:700;color:${PC.text3};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Line Items</div>
                <div style="background:${PC.bg};border-radius:8px;overflow:hidden;border:1px solid ${PC.border};">
                  <table>
                    <thead>
                      <tr style="background:${PC.rowAlt};">
                        <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:${PC.text3};text-transform:uppercase;border-bottom:1px solid ${PC.border};">Description</th>
                        <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:${PC.text3};text-transform:uppercase;border-bottom:1px solid ${PC.border};">Date</th>
                        <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:${PC.text3};text-transform:uppercase;border-bottom:1px solid ${PC.border};">Payment</th>
                        <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:${PC.text3};text-transform:uppercase;border-bottom:1px solid ${PC.border};">Attendees</th>
                        <th style="padding:10px 14px;text-align:right;font-size:10px;font-weight:700;color:${PC.text3};text-transform:uppercase;border-bottom:1px solid ${PC.border};">Amount</th>
                        <th style="padding:10px 14px;text-align:center;font-size:10px;font-weight:700;color:${PC.text3};text-transform:uppercase;border-bottom:1px solid ${PC.border};">Rcpt</th>
                      </tr>
                    </thead>
                    <tbody>${lineRows}</tbody>
                    <tfoot>
                      <tr style="background:${PC.accentBg};">
                        <td colspan="4" style="padding:14px;font-size:13px;font-weight:700;color:${PC.accent};border-top:2px solid ${PC.accentBorder};">TOTAL (USD)</td>
                        <td style="padding:14px;text-align:right;font-size:15px;font-weight:800;color:${PC.accent};border-top:2px solid ${PC.accentBorder};">$${tripTotalUSD.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                        <td style="border-top:2px solid ${PC.accentBorder};"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <!-- Footer -->
              <div style="text-align:center;color:${PC.text3};font-size:10px;border-top:1px solid ${PC.border};padding-top:16px;">
                Generated by Continuum — Elevate Every Journey · ${new Date().toLocaleString()}
                ${expensesWithReceipts.length > 0 ? ` · ${expensesWithReceipts.length} receipt${expensesWithReceipts.length!==1?"s":""} attached` : ""}
              </div>
            </div>
            ${receiptPages}
          </body></html>`;
          const w = window.open("", "_blank");
          if (!w) return;
          w.document.write(html);
          w.document.close();
          // Wait for images then print
          const imgs = w.document.images;
          if (imgs.length === 0) { setTimeout(() => { w.focus(); w.print(); }, 300); return; }
          let loaded = 0;
          const tryPrint = () => { loaded++; if (loaded >= imgs.length) { setTimeout(() => { w.focus(); w.print(); }, 300); } };
          Array.from(imgs).forEach(img => { if (img.complete) tryPrint(); else { img.onload = tryPrint; img.onerror = tryPrint; } });
        };

        return (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
          }}>
            <div style={{
              background: "#211e2e", border: "1px solid #2a2640", borderRadius: 8, padding: 32, width: "100%", maxWidth: 600,
              maxHeight: "85vh", overflowY: "auto",
            }}>

                {/* Report Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <div style={{ marginBottom: 6 }}>
                    <img src="/continuum-travel-logo.svg" alt="Continuum" style={{ height: 112, display: "block" }} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "'Inter Tight', Inter, sans-serif" }}>Expense Report</h3>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>Generated {new Date().toLocaleDateString()}</div>
                  <div style={{ fontSize: 11, color: "#62666d", fontFamily: "Inter, sans-serif" }}>Report #{trip.id}-{Date.now().toString(36).slice(-4)}</div>
                  <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: "#0EA5A0", fontFamily: "Inter, sans-serif" }}>Total in USD</div>
                </div>
              </div>

              {/* Trip Info */}
              <div style={{
                background: "rgba(14,165,160,0.06)", border: "1px solid rgba(14,165,160,0.15)", borderRadius: 8, padding: 18, marginBottom: 20,
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif", marginBottom: 4 }}>
                  {trip.type === "flight" ? "—" : trip.type === "hotel" ? "—" : "—"} {getTripName(trip)}
                </div>
                <div style={{ fontSize: 12, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>
                  {trip.date} • {prog?.name || "Unknown"} • {trip.status}
                </div>
              </div>

              {/* Summary Stats */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0EA5A0", fontFamily: "Inter, sans-serif" }}>${tripTotalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div style={{ fontSize: 10, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>Total (USD)</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "'Inter Tight', Inter, sans-serif" }}>{tripExps.length}</div>
                  <div style={{ fontSize: 10, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>Items</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#34d399", fontFamily: "Inter, sans-serif" }}>{receiptCount}/{tripExps.length}</div>
                  <div style={{ fontSize: 10, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>Receipts</div>
                </div>
              </div>

              {/* Category Summary */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#8a8f98", fontFamily: "Inter, sans-serif", marginBottom: 10 }}>BREAKDOWN BY CATEGORY</div>
                {catSummary.map((cat, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{cat.icon}</span>
                      <span style={{ fontSize: 12, color: "#d0d6e0", fontFamily: "Inter, sans-serif" }}>{cat.label} ({cat.count})</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 80, height: 5, borderRadius: 8, background: "#2a2640", overflow: "hidden" }}>
                        <div style={{ width: `${tripTotalUSD > 0 ? (cat.totalUSD / tripTotalUSD) * 100 : 0}%`, height: "100%", background: cat.color, borderRadius: 8 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif", minWidth: 80, textAlign: "right" }}>${cat.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Line Items */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#8a8f98", fontFamily: "Inter, sans-serif", marginBottom: 10 }}>LINE ITEMS</div>
                <div style={{ background: "#1a1725", borderRadius: 8, overflow: "hidden" }}>
                  {/* Header */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 80px" : "1fr 80px 90px 90px 28px", gap: 8, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#8a8f98", fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>Description</span>
                    {!isMobile && <span style={{ fontSize: 10, fontWeight: 700, color: "#8a8f98", fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>Date</span>}
                    {!isMobile && <span style={{ fontSize: 10, fontWeight: 700, color: "#8a8f98", fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>Payment</span>}
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#8a8f98", fontFamily: "Inter, sans-serif", textTransform: "uppercase", textAlign: "right" }}>Amount</span>
                    {!isMobile && <span style={{ fontSize: 10, fontWeight: 700, color: "#8a8f98", fontFamily: "Inter, sans-serif", textAlign: "center" }}>🧾</span>}
                  </div>
                  {/* Rows */}
                  {tripExps.map((exp, i) => {
                    const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                    const cur = exp.currency || "USD";
                    const isForeign = cur !== "USD";
                    const usdAmt = toUSD(exp);
                    const attendeesRaw = (exp.individuals || "").toString().trim();
                    const attendees = !attendeesRaw || attendeesRaw.toLowerCase() === "self" ? "Self" : attendeesRaw;
                    const attendeesColor = attendees === "Self" ? "#62666d" : "#b8c0cf";
                    return (
                      <div key={exp.id} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 80px" : "1fr 80px 90px 90px 28px", gap: 8, padding: "10px 14px", borderBottom: i < tripExps.length - 1 ? "1px solid rgba(0,0,0,0.02)" : "none", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: 12, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{cat?.icon} {exp.description}</span>
                          {exp.notes && <div style={{ fontSize: 10, color: "#62666d", marginTop: 1 }}>{exp.notes}</div>}
                          <div style={{ fontSize: 10, color: attendeesColor, marginTop: 1, fontFamily: "Inter, sans-serif" }}>Attendees: {attendees}</div>
                          {isMobile && <div style={{ fontSize: 10, color: "#62666d", marginTop: 1 }}>{exp.date?.slice(5)} {exp.receipt ? "🧾" : ""}</div>}
                        </div>
                        {!isMobile && <span style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>{exp.date?.slice(5)}</span>}
                        {!isMobile && <span style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.paymentMethod || "—"}</span>}
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: exp.amount === 0 ? "#34d399" : "#FFFFFF", fontFamily: "Inter, sans-serif" }}>
                            {fmtAmt(exp.amount, cur)}
                          </div>
                          {isForeign && (
                            <div style={{ fontSize: 9, color: "#62666d", fontFamily: "Inter, sans-serif", marginTop: 1 }}>
                              ${usdAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </div>
                          )}
                        </div>
                        {!isMobile && <span style={{ fontSize: 12, textAlign: "center" }}>{exp.receipt ? "✓" : "—"}</span>}
                      </div>
                    );
                  })}
                  {/* Total */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 8, padding: "12px 14px", background: "rgba(14,165,160,0.06)", borderTop: "2px solid rgba(14,165,160,0.2)" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0EA5A0", fontFamily: "Inter, sans-serif" }}>TOTAL (USD)</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#0EA5A0", fontFamily: "Inter, sans-serif", textAlign: "right" }}>${tripTotalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowExpenseReport(null)} style={{
                  flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid #2a2640", background: "rgba(255,255,255,0.03)",
                  color: "#8a8f98", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}>Close</button>
                <button onClick={printReport} style={{
                  flex: 1, padding: "11px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif",
                  background: "#0EA5A0", color: "#f7f8f8",
                }}>🖨️ Print / Save PDF</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

