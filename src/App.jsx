import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";
import { supabase } from "./supabase";

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
const AIRPORT_COORDS = {
  // North America
  ATL:[-84.428,33.637],BOS:[-71.005,42.365],CLT:[-80.943,35.214],DEN:[-104.674,39.856],DFW:[-97.038,32.897],
  DTW:[-83.353,42.212],EWR:[-74.169,40.689],FLL:[-80.153,26.073],HNL:[-157.922,21.319],IAD:[-77.456,38.945],
  IAH:[-95.341,29.984],JFK:[-73.779,40.640],LAX:[-118.408,33.943],LGA:[-73.872,40.777],MCO:[-81.309,28.429],
  MDW:[-87.752,41.786],MIA:[-80.290,25.796],MSP:[-93.222,44.883],ORD:[-87.904,41.980],PDX:[-122.598,45.589],
  PHL:[-75.241,39.872],PHX:[-112.012,33.435],SAN:[-117.190,32.734],SEA:[-122.309,47.450],SFO:[-122.375,37.619],
  SJC:[-121.929,37.363],SLC:[-111.978,40.789],TPA:[-82.533,27.976],YUL:[-73.741,45.470],YVR:[-123.184,49.195],
  YYZ:[-79.631,43.677],YYC:[-114.020,51.131],YOW:[-75.669,45.323],YHZ:[-63.510,44.880],
  BDA:[-64.679,32.364],NAS:[-77.466,25.039],MBJ:[-77.913,18.504],KIN:[-76.788,17.936],
  POS:[-61.337,10.595],BGI:[-59.493,13.075],SJU:[-66.002,18.439],STT:[-64.973,18.337],
  PTY:[-79.384,9.072],SXM:[-63.109,18.041],ANU:[-61.793,17.137],GCM:[-81.358,19.293],
  MEX:[-99.072,19.436],CUN:[-86.877,21.037],GRU:[-46.473,-23.432],
  GIG:[-43.244,-22.810],BOG:[-74.149,4.702],LIM:[-77.115,-12.022],SCL:[-70.787,-33.393],EZE:[-58.535,-34.822],
  // Europe
  AMS:[4.764,52.310],ARN:[17.919,59.652],ATH:[23.944,37.937],BCN:[2.078,41.297],BRU:[4.484,50.901],
  CDG:[2.550,49.013],CPH:[12.656,55.618],DUB:[-6.270,53.421],DUS:[6.757,51.290],EDI:[-3.373,55.950],
  FCO:[12.252,41.800],FRA:[8.571,50.026],GVA:[6.109,46.238],HAM:[9.988,53.630],HEL:[24.963,60.317],
  IST:[28.820,40.976],LHR:[-0.461,51.477],LIS:[-9.136,38.774],MAD:[-3.567,40.472],MAN:[-2.275,53.354],
  MUC:[11.786,48.354],OSL:[11.100,60.197],PRG:[14.260,50.100],SVO:[37.415,55.973],VIE:[16.570,48.110],
  ZRH:[8.549,47.458],WAW:[14.162,52.166],BUD:[19.256,47.437],LYS:[5.081,45.726],NCE:[7.215,43.658],
  // Asia Pacific
  BKK:[100.747,13.681],CAN:[113.299,23.392],CGK:[106.656,-6.126],CJU:[126.493,33.511],CTU:[103.947,30.578],
  DEL:[77.103,28.556],DPS:[115.167,-8.748],GMP:[126.791,37.559],HAN:[105.807,21.221],HKG:[113.915,22.309],
  ICN:[126.451,37.463],KIX:[135.244,34.427],KUL:[101.710,2.743],MNL:[121.020,14.509],NRT:[140.386,35.765],
  PEK:[116.585,40.080],PVG:[121.805,31.143],RGN:[96.133,16.907],SGN:[106.652,10.819],SIN:[103.994,1.350],
  SZX:[113.811,22.639],TPE:[121.233,25.077],XIY:[108.752,34.447],XMN:[118.128,24.544],HND:[139.781,35.549],
  KHH:[120.350,22.577],OKA:[127.646,26.196],CKG:[106.642,29.720],WUH:[114.208,30.784],
  // Middle East & Africa
  AUH:[54.651,24.433],CAI:[31.400,30.122],CMN:[-7.590,33.368],DOH:[51.608,25.261],DXB:[55.364,25.253],
  JED:[39.157,21.680],JNB:[28.246,-26.133],KWI:[47.969,29.227],LOS:[3.321,6.577],NBO:[36.925,-1.319],
  RUH:[46.699,24.958],ADD:[38.799,8.978],CPT:[18.602,-33.965],
  // Oceania
  AKL:[174.792,-37.008],BNE:[153.117,-27.384],CBR:[149.195,-35.307],MEL:[144.843,-37.673],
  PER:[115.967,-31.940],SYD:[151.177,-33.946],CHC:[172.532,-43.490],
};

// ── Airport → City name mapping ──
const AIRPORT_CITY = {
  ATL:"Atlanta",BOS:"Boston",CLT:"Charlotte",DEN:"Denver",DFW:"Dallas",DTW:"Detroit",EWR:"New York",FLL:"Fort Lauderdale",
  HNL:"Honolulu",IAD:"Washington DC",IAH:"Houston",JFK:"New York",LAX:"Los Angeles",LGA:"New York",MCO:"Orlando",
  MIA:"Miami",MSP:"Minneapolis",ORD:"Chicago",PDX:"Portland",PHL:"Philadelphia",PHX:"Phoenix",SAN:"San Diego",
  SEA:"Seattle",SFO:"San Francisco",SJC:"San Jose",SLC:"Salt Lake City",TPA:"Tampa",YUL:"Montreal",YVR:"Vancouver",
  YYZ:"Toronto",YYC:"Calgary",BDA:"Bermuda",NAS:"Nassau",MBJ:"Montego Bay",SJU:"San Juan",
  MEX:"Mexico City",CUN:"Cancun",GRU:"São Paulo",GIG:"Rio de Janeiro",BOG:"Bogota",LIM:"Lima",SCL:"Santiago",EZE:"Buenos Aires",
  AMS:"Amsterdam",ARN:"Stockholm",ATH:"Athens",BCN:"Barcelona",BRU:"Brussels",CDG:"Paris",CPH:"Copenhagen",DUB:"Dublin",
  EDI:"Edinburgh",FCO:"Rome",FRA:"Frankfurt",GVA:"Geneva",HEL:"Helsinki",IST:"Istanbul",LHR:"London",LIS:"Lisbon",
  MAD:"Madrid",MAN:"Manchester",MUC:"Munich",OSL:"Oslo",PRG:"Prague",VIE:"Vienna",ZRH:"Zurich",WAW:"Warsaw",BUD:"Budapest",NCE:"Nice",
  BKK:"Bangkok",CGK:"Jakarta",DEL:"Delhi",DPS:"Bali",HKG:"Hong Kong",ICN:"Seoul",KIX:"Osaka",KUL:"Kuala Lumpur",
  MNL:"Manila",NRT:"Tokyo",PEK:"Beijing",PVG:"Shanghai",SGN:"Ho Chi Minh City",SIN:"Singapore",TPE:"Taipei",HND:"Tokyo",
  OKA:"Okinawa",AUH:"Abu Dhabi",CAI:"Cairo",DOH:"Doha",DXB:"Dubai",JNB:"Johannesburg",NBO:"Nairobi",CPT:"Cape Town",
  AKL:"Auckland",BNE:"Brisbane",MEL:"Melbourne",SYD:"Sydney",PER:"Perth",
};

// ── City gradient themes — warm/cool palettes per destination ──
const CITY_THEMES = {
  "Tokyo":     { g1: "#1a0a2e", g2: "#16213e", g3: "#e94560", accent: "#e94560" },
  "Osaka":     { g1: "#1a0a2e", g2: "#2d1b4e", g3: "#f97316", accent: "#f97316" },
  "Kyoto":     { g1: "#1a0a2e", g2: "#1e3a2f", g3: "#a3c4a3", accent: "#8fbc8f" },
  "Paris":     { g1: "#1a1a2e", g2: "#2d2b55", g3: "#c4a35a", accent: "#c4a35a" },
  "London":    { g1: "#0f1923", g2: "#1a2a3a", g3: "#4a7c8c", accent: "#5d9eaf" },
  "New York":  { g1: "#0a0a14", g2: "#1a1a2e", g3: "#ff6b35", accent: "#ff6b35" },
  "Hong Kong": { g1: "#0a0a1a", g2: "#1a0f2e", g3: "#e040fb", accent: "#e040fb" },
  "Singapore": { g1: "#0a1628", g2: "#1a2e4a", g3: "#00bfa5", accent: "#00bfa5" },
  "Dubai":     { g1: "#1a1008", g2: "#2e1a0a", g3: "#d4a84b", accent: "#d4a84b" },
  "Bangkok":   { g1: "#1a0f08", g2: "#2e1e14", g3: "#f59e0b", accent: "#f59e0b" },
  "Sydney":    { g1: "#0a1628", g2: "#142e4a", g3: "#3b82f6", accent: "#3b82f6" },
  "Rome":      { g1: "#1a1008", g2: "#2e1a0e", g3: "#c2956a", accent: "#c2956a" },
  "Barcelona": { g1: "#1a0a14", g2: "#2e1428", g3: "#e85d75", accent: "#e85d75" },
  "Amsterdam": { g1: "#0a1418", g2: "#142832", g3: "#ff8c42", accent: "#ff8c42" },
  "Seoul":     { g1: "#0f0a1e", g2: "#1a1436", g3: "#7c3aed", accent: "#7c3aed" },
  "Istanbul":  { g1: "#1a0f14", g2: "#2e1a28", g3: "#dc626b", accent: "#dc626b" },
  "Lisbon":    { g1: "#1a1410", g2: "#2e2418", g3: "#f0c040", accent: "#f0c040" },
  "Miami":     { g1: "#0a141e", g2: "#0e2838", g3: "#06d6a0", accent: "#06d6a0" },
  "San Francisco":{ g1: "#1a0a14", g2: "#2e1428", g3: "#ff6b6b", accent: "#ff6b6b" },
  "Los Angeles":{ g1: "#1a1008", g2: "#2e1e14", g3: "#fbbf24", accent: "#fbbf24" },
  "Toronto":   { g1: "#0a0f1a", g2: "#141e2e", g3: "#ef4444", accent: "#ef4444" },
  "Vancouver": { g1: "#0a1418", g2: "#14282e", g3: "#10b981", accent: "#10b981" },
  "Bermuda":   { g1: "#0a1a1e", g2: "#0e2e38", g3: "#22d3ee", accent: "#22d3ee" },
  "Taipei":    { g1: "#0f0a1e", g2: "#1a1436", g3: "#818cf8", accent: "#818cf8" },
  "Shanghai":  { g1: "#0a0a14", g2: "#14142e", g3: "#f43f5e", accent: "#f43f5e" },
  "Bali":      { g1: "#0a1a14", g2: "#142e24", g3: "#34d399", accent: "#34d399" },
  "Prague":    { g1: "#0f0a14", g2: "#1e142e", g3: "#a78bfa", accent: "#a78bfa" },
  "Budapest":  { g1: "#0f0a14", g2: "#1e142e", g3: "#c084fc", accent: "#c084fc" },
  "Vienna":    { g1: "#14100a", g2: "#281e14", g3: "#d4a84b", accent: "#d4a84b" },
  "Athens":    { g1: "#0a1420", g2: "#142838", g3: "#38bdf8", accent: "#38bdf8" },
  "Honolulu":  { g1: "#0a1a1e", g2: "#0e2e3a", g3: "#2dd4bf", accent: "#2dd4bf" },
  "Doha":      { g1: "#1a1408", g2: "#2e240e", g3: "#eab308", accent: "#eab308" },
  _fallback:   { g1: "#0a0a14", g2: "#141428", g3: "#D4742D", accent: "#D4742D" },
};

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

const PROGRAM_DIRECTORY = {
  airlines: [
    { id: "aa", name: "American Airlines AAdvantage", logo: "—", color: "#0078D2", accent: "#C8102E", unit: "Loyalty Points", loginUrl: "https://www.aa.com/loyalty/login", tiers: [
      { name: "Gold", threshold: 40000, perks: "Priority boarding, free checked bag, 40% bonus miles" },
      { name: "Platinum", threshold: 75000, perks: "Upgrades, 60% bonus, Admiral's Club day passes" },
      { name: "Platinum Pro", threshold: 125000, perks: "Premium upgrades, 80% bonus, complimentary MCE" },
      { name: "Executive Platinum", threshold: 200000, perks: "Systemwide upgrades, 120% bonus, ConciergeKey eligible" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "dl", name: "Delta SkyMiles", logo: "🔺", color: "#003366", accent: "#C8102E", unit: "MQDs ($)", loginUrl: "https://www.delta.com/myprofile/personal-details", tiers: [
      { name: "Silver Medallion", threshold: 5000, perks: "Unlimited upgrades, 40% bonus miles, Sky Priority" },
      { name: "Gold Medallion", threshold: 10000, perks: "SkyTeam Elite Plus, 60% bonus, Sky Priority" },
      { name: "Platinum Medallion", threshold: 15000, perks: "Choice Benefits, 80% bonus, waived fees" },
      { name: "Diamond Medallion", threshold: 28000, perks: "Global upgrades, 120% bonus, Delta ONE access" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "ua", name: "United MileagePlus", logo: "🌐", color: "#002244", accent: "#0066CC", unit: "PQPs", loginUrl: "https://www.united.com/en/us/mileageplus", tiers: [
      { name: "Premier Silver", threshold: 5000, perks: "Economy Plus, priority boarding, 1 bag free" },
      { name: "Premier Gold", threshold: 10000, perks: "Star Alliance Gold, United Club passes" },
      { name: "Premier Platinum", threshold: 15000, perks: "Regional upgrades, 2 GPUs" },
      { name: "Premier 1K", threshold: 22000, perks: "Global upgrades, PlusPoints, Premier Access" },
    ], earnRate: { domestic: 5, international: 11, premium: 22 } },
    { id: "sw", name: "Southwest Rapid Rewards", logo: "❤️", color: "#304CB2", accent: "#FFBF27", unit: "Points", loginUrl: "https://www.southwest.com/rapid-rewards/myaccount", tiers: [
      { name: "A-List", threshold: 35000, perks: "Priority boarding, same-day standby, 25% bonus" },
      { name: "A-List Preferred", threshold: 70000, perks: "Free WiFi, 100% bonus points, all A-List perks" },
      { name: "Companion Pass", threshold: 135000, perks: "Designated companion flies free on every flight" },
    ], earnRate: { domestic: 6, international: 6, premium: 12 } },
    { id: "b6", name: "JetBlue TrueBlue", logo: "💙", color: "#003876", accent: "#0033A0", unit: "Tiles", loginUrl: "https://trueblue.jetblue.com/", tiers: [
      { name: "Mosaic 1", threshold: 50, perks: "Free checked bags, Even More Space, early boarding ($5,000 JetBlue spend)" },
      { name: "Mosaic 2", threshold: 100, perks: "All Mosaic 1 + free same-day changes, Mint upgrades ($10,000 spend)" },
      { name: "Mosaic 3", threshold: 150, perks: "Guaranteed Even More Space, complimentary Mint upgrades ($15,000 spend)" },
      { name: "Mosaic 4", threshold: 250, perks: "Highest upgrade priority, 4 guest passes per year ($25,000 spend)" },
    ], earnRate: { domestic: 5, international: 6, premium: 10 } },
    { id: "atmos", name: "Alaska Airlines Mileage Plan", logo: "🏔️", color: "#01426A", accent: "#64CCC9", unit: "EQMs", loginUrl: "https://www.alaskaair.com/account/overview", tiers: [
      { name: "MVP", threshold: 20000, perks: "Priority boarding, upgrade eligibility, 50% bonus miles" },
      { name: "MVP Gold", threshold: 40000, perks: "Lounge passes, upgrades, 100% bonus miles" },
      { name: "MVP Gold 75K", threshold: 75000, perks: "4 complimentary upgrades, lounge membership, 125% bonus miles" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "frontier", name: "Frontier Miles", logo: "🦅", color: "#006845", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.flyfrontier.com/myfrontier/my-account/", tiers: [
      { name: "Elite 20K", threshold: 20000, perks: "Free carry-on, seat selection, shortcut boarding" },
      { name: "Elite 50K", threshold: 50000, perks: "Free checked bag, priority boarding, buddy pass" },
      { name: "Elite 100K", threshold: 100000, perks: "Unlimited buddy passes, fee waivers, all perks" },
    ], earnRate: { domestic: 5, international: 5, premium: 10 } },
    { id: "spirit", name: "Spirit Airlines", logo: "💛", color: "#FFD700", accent: "#000000", unit: "Points", loginUrl: "https://www.spirit.com/account", tiers: [
      { name: "Silver", threshold: 2000, perks: "Shortcut boarding, free seat selection" },
      { name: "Gold", threshold: 5000, perks: "Free checked bag, zone 2 boarding" },
    ], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "flying_blue", name: "Air France/KLM Flying Blue", logo: "🔵", color: "#002157", accent: "#00A1E0", unit: "XP", loginUrl: "https://www.flyingblue.com/en/account/login", tiers: [
      { name: "Silver", threshold: 100, perks: "SkyTeam Elite, priority boarding, extra baggage" },
      { name: "Gold", threshold: 180, perks: "SkyTeam Elite Plus, lounge access, priority everything" },
      { name: "Platinum", threshold: 300, perks: "Guaranteed seats, companion lounge, 100% bonus" },
      { name: "Ultimate", threshold: 450, perks: "La Première access, dedicated hotline, all Platinum perks" },
    ], earnRate: { domestic: 4, international: 8, premium: 16 } },
    { id: "ba_avios", name: "British Airways Executive Club", logo: "🇬🇧", color: "#075AAA", accent: "#EB2226", unit: "Tier Points", loginUrl: "https://www.britishairways.com/travel/loginr/public/en_us", tiers: [
      { name: "Bronze", threshold: 300, perks: "Priority standby, bonus Avios" },
      { name: "Silver", threshold: 600, perks: "Lounge access, extra baggage, priority boarding" },
      { name: "Gold", threshold: 1500, perks: "First class lounge, guaranteed seat, concierge" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "aeroplan", name: "Air Canada Aeroplan", logo: "🍁", color: "#F01428", accent: "#000000", unit: "SQM", loginUrl: "https://www.aircanada.com/aeroplan/member/profile", tiers: [
      { name: "25K", threshold: 25000, perks: "Priority check-in, eUpgrades, Star Alliance Silver" },
      { name: "35K", threshold: 35000, perks: "Maple Leaf Lounge, priority everything" },
      { name: "50K", threshold: 50000, perks: "Star Alliance Gold, intl lounges, priority rebooking" },
      { name: "75K", threshold: 75000, perks: "Super eUpgrades, preferred seats, concierge" },
      { name: "100K", threshold: 100000, perks: "Priority rewards, global lounge, all benefits" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "emirates_skywards", name: "Emirates Skywards", logo: "🕌", color: "#D71A21", accent: "#9B8860", unit: "Tier Miles", loginUrl: "https://www.emirates.com/account/english/login/", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority check-in, extra baggage, bonus miles" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, guaranteed seats, upgrades" },
      { name: "Platinum", threshold: 150000, perks: "First class lounge, chauffeur, companion tickets" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "turkish_miles", name: "Turkish Airlines Miles&Smiles", logo: "🌙", color: "#C8102E", accent: "#003876", unit: "Miles", loginUrl: "https://www.turkishairlines.com/en-us/miles-and-smiles/account/", tiers: [
      { name: "Classic Plus", threshold: 25000, perks: "Priority check-in, extra baggage" },
      { name: "Elite", threshold: 40000, perks: "Star Alliance Gold, lounge, upgrades" },
      { name: "Elite Plus", threshold: 80000, perks: "Priority everything, guaranteed economy, CIP lounge" },
    ], earnRate: { domestic: 5, international: 10, premium: 15 } },
    { id: "qantas_ff", name: "Qantas Frequent Flyer", logo: "🦘", color: "#E0001B", accent: "#1A1F36", unit: "Status Credits", loginUrl: "https://www.qantas.com/fflyer/do/login/myaccount", tiers: [
      { name: "Silver", threshold: 300, perks: "Priority boarding, bonus points, oneworld Ruby" },
      { name: "Gold", threshold: 700, perks: "Qantas Club, upgrades, oneworld Sapphire" },
      { name: "Platinum", threshold: 1400, perks: "First lounges, complimentary upgrades, oneworld Emerald" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "singapore_kf", name: "Singapore KrisFlyer", logo: "🦁", color: "#FDB813", accent: "#003876", unit: "Elite Miles", loginUrl: "https://www.singaporeair.com/en_UK/ppsclub-krisflyer/my-profile/", tiers: [
      { name: "Elite Silver", threshold: 25000, perks: "Priority check-in, Star Alliance Silver" },
      { name: "Elite Gold", threshold: 50000, perks: "Lounge access, Star Alliance Gold, upgrades" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "etihad_guest", name: "Etihad Guest", logo: "🏛️", color: "#BD8B13", accent: "#1A1F36", unit: "Tier Miles", loginUrl: "https://www.etihadguest.com/en/login.html", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority check-in, bonus miles" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, extra baggage" },
      { name: "Platinum", threshold: 125000, perks: "First class lounges, companion ticket, chauffeur" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "virgin_fc", name: "Virgin Atlantic Flying Club", logo: "❤️‍🔥", color: "#E50000", accent: "#660000", unit: "Tier Points", loginUrl: "https://www.virginatlantic.com/mytrips/en/gb/login", tiers: [
      { name: "Silver", threshold: 400, perks: "Priority boarding, extra bag, seat selection" },
      { name: "Gold", threshold: 800, perks: "Clubhouse access, premium check-in, upgrades" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "cathay_mp", name: "Cathay Pacific Asia Miles", logo: "🌏", color: "#006564", accent: "#A6815B", unit: "Status Points", loginUrl: "https://www.cathaypacific.com/cx/en_US/sign-in.html", tiers: [
      { name: "Silver", threshold: 300, perks: "Priority check-in, lounge access, extra baggage" },
      { name: "Gold", threshold: 600, perks: "First lounges, upgrades, oneworld Sapphire" },
      { name: "Diamond", threshold: 1200, perks: "Premium lounges, highest priority, oneworld Emerald" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    // ── Asia-Pacific ──
    { id: "jal", name: "Japan Airlines JAL Mileage Bank", logo: "🗾", color: "#C8102E", accent: "#1A1F36", unit: "FLY ON Points", loginUrl: "https://www.jal.co.jp/en/mileage/", tiers: [
      { name: "Crystal", threshold: 30000, perks: "Priority boarding, bonus miles, oneworld Ruby" },
      { name: "Sapphire", threshold: 50000, perks: "Lounge access, upgrades, oneworld Sapphire" },
      { name: "JGC Premier", threshold: 80000, perks: "First class lounges, guaranteed seats, oneworld Emerald" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "ana", name: "ANA Mileage Club", logo: "🏯", color: "#003A6D", accent: "#9DC3E6", unit: "Premium Points", loginUrl: "https://www.ana.co.jp/en/us/amc/", tiers: [
      { name: "Bronze", threshold: 30000, perks: "Priority boarding, bonus miles, Star Alliance Silver" },
      { name: "Platinum", threshold: 50000, perks: "Lounges, upgrades, Star Alliance Gold" },
      { name: "Diamond", threshold: 100000, perks: "ANA Suite, guaranteed seats, all Platinum perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "eva_air", name: "EVA Air Infinity MileageLands", logo: "🟢", color: "#007D40", accent: "#C8A951", unit: "Mileage Credits", loginUrl: "https://www.evaair.com/en-global/member/", tiers: [
      { name: "Silver", threshold: 30000, perks: "Priority boarding, extra baggage, Star Alliance Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Star Alliance Gold" },
      { name: "Diamond", threshold: 100000, perks: "Premium lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "korean_air", name: "Korean Air SKYPASS", logo: "🇰🇷", color: "#003087", accent: "#C8102E", unit: "Miles", loginUrl: "https://www.koreanair.com/content/koreanair/en/skypass/login.html", tiers: [
      { name: "Morning Calm", threshold: 30000, perks: "Priority boarding, extra bag, bonus miles" },
      { name: "Morning Calm Premium", threshold: 50000, perks: "Lounge access, upgrades, SkyTeam Elite Plus" },
      { name: "Million Miler", threshold: 1000000, perks: "Lifetime status, top tier lounge, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "asiana", name: "Asiana Airlines Asiana Club", logo: "🌸", color: "#1A3668", accent: "#C8102E", unit: "Miles", loginUrl: "https://flyasiana.com/C/US/EN/member/memberLogin", tiers: [
      { name: "Silver", threshold: 20000, perks: "Priority boarding, extra baggage, bonus miles" },
      { name: "Gold", threshold: 40000, perks: "Lounge access, upgrades, SkyTeam Elite" },
      { name: "Diamond", threshold: 80000, perks: "First lounge, guaranteed availability, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "hk_airlines", name: "Hong Kong Airlines Fortune Wings Club", logo: "🐉", color: "#CC0000", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.hkairlines.com/en_HK/fortune-wings-club/", tiers: [
      { name: "Silver", threshold: 20000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 40000, perks: "Lounge access, upgrades, priority check-in" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "hk_express", name: "HK Express MegaHub", logo: "🟠", color: "#FF6600", accent: "#1A1F36", unit: "Points", loginUrl: "https://www.hkexpress.com/en-hk/member/", tiers: [], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "air_china", name: "Air China PhoenixMiles", logo: "🐦", color: "#CC0000", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.airchina.us/US/GB/member/login/", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra bag, Star Alliance Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Star Alliance Gold" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, guaranteed seats, highest priority" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "china_eastern", name: "China Eastern Eastern Miles", logo: "🔴", color: "#CC0000", accent: "#003876", unit: "Miles", loginUrl: "https://us.ceair.com/newCEAir/member/login.html", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, bonus miles, SkyTeam Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, SkyTeam Elite Plus" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "china_southern", name: "China Southern Sky Pearl", logo: "🌺", color: "#003876", accent: "#C8102E", unit: "Miles", loginUrl: "https://www.csair.com/en/", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades" },
      { name: "Platinum", threshold: 100000, perks: "First class lounge, highest priority" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "thai", name: "Thai Airways Royal Orchid Plus", logo: "🌷", color: "#4B0082", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.thaiairways.com/en_TH/rop/rop.page", tiers: [
      { name: "Silver", threshold: 20000, perks: "Priority boarding, extra bag, Star Alliance Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Star Alliance Gold" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, guaranteed availability, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "malaysia", name: "Malaysia Airlines Enrich", logo: "🌙", color: "#003876", accent: "#CC0000", unit: "Miles", loginUrl: "https://www.malaysiaairlines.com/my/en/enrich.html", tiers: [
      { name: "Blue", threshold: 0, perks: "Base tier, earn miles on flights" },
      { name: "Silver", threshold: 35000, perks: "Priority boarding, bonus miles, oneworld Ruby" },
      { name: "Gold", threshold: 75000, perks: "Lounge access, upgrades, oneworld Sapphire" },
      { name: "Platinum", threshold: 150000, perks: "First lounge, highest priority, oneworld Emerald" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "garuda", name: "Garuda Indonesia GarudaMiles", logo: "🦅", color: "#003876", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.garudaindonesia.com/id/id/informasi/mygaruda", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Sky Team Elite" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "philippines_air", name: "Philippine Airlines Mabuhay Miles", logo: "🌅", color: "#003876", accent: "#CC0000", unit: "Miles", loginUrl: "https://www.philippineairlines.com/en/ph/home/mabuhay-miles", tiers: [
      { name: "Elite", threshold: 25000, perks: "Priority boarding, extra bag, lounge access" },
      { name: "Elite Plus", threshold: 75000, perks: "Guaranteed upgrades, highest priority" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "vietnam_air", name: "Vietnam Airlines Lotusmiles", logo: "🌸", color: "#CC0000", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.vietnamairlines.com/us/en/member/lotusmiles", tiers: [
      { name: "Silver", threshold: 20000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 40000, perks: "Lounge access, upgrades, SkyTeam Elite Plus" },
      { name: "Platinum", threshold: 80000, perks: "First lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "air_india", name: "Air India Flying Returns", logo: "🇮🇳", color: "#FF6600", accent: "#003876", unit: "Miles", loginUrl: "https://www.airindia.com/flying-returns.htm", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra baggage, Star Alliance Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Star Alliance Gold" },
      { name: "Maharajah", threshold: 100000, perks: "First class lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "airasia", name: "AirAsia BIG Loyalty", logo: "🔴", color: "#CC0000", accent: "#FFD700", unit: "BIG Points", loginUrl: "https://www.biglife.com/", tiers: [
      { name: "BIG Xtra", threshold: 10000, perks: "Priority boarding, seat discount, extra bag" },
    ], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "scoot", name: "Scoot Scoot Mates", logo: "—", color: "#FFD700", accent: "#003876", unit: "Points", loginUrl: "https://www.flyscoot.com/en/plan/discover-scoot/scoot-mates", tiers: [], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "air_nz", name: "Air New Zealand Airpoints", logo: "🥝", color: "#003876", accent: "#C8102E", unit: "Airpoints Dollars", loginUrl: "https://www.airnewzealand.com/airpoints", tiers: [
      { name: "Silver", threshold: 250, perks: "Priority boarding, lounge access, Star Alliance Silver" },
      { name: "Gold", threshold: 500, perks: "Koru lounge, upgrades, Star Alliance Gold" },
      { name: "Elite", threshold: 1000, perks: "Highest priority, guaranteed seat, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "jetstar", name: "Jetstar Frequent Flyer", logo: "⭐", color: "#FF6600", accent: "#003876", unit: "Points", loginUrl: "https://www.jetstar.com/au/en/deals/jetstar-frequent-flyer", tiers: [], earnRate: { domestic: 4, international: 4, premium: 8 } },
    // ── Middle East ──
    { id: "qatar", name: "Qatar Airways Privilege Club", logo: "🐪", color: "#5C0632", accent: "#8D734A", unit: "Qmiles", loginUrl: "https://www.qatarairways.com/en-us/privilege-club.html", tiers: [
      { name: "Burgundy", threshold: 0, perks: "Base tier, earn Qmiles on flights" },
      { name: "Silver", threshold: 200, perks: "Priority boarding, extra bag, oneworld Ruby" },
      { name: "Gold", threshold: 500, perks: "Al Mourjan lounge, upgrades, oneworld Sapphire" },
      { name: "Platinum", threshold: 1200, perks: "First class lounge, guaranteed seats, oneworld Emerald" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "oman_air", name: "Oman Air Sindbad", logo: "🌊", color: "#C8102E", accent: "#003876", unit: "Miles", loginUrl: "https://www.omanair.com/en/sindbad", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, highest priority" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "gulf_air", name: "Gulf Air Falconflyer", logo: "🦅", color: "#CC0000", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.gulfair.com/falconflyer", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, highest priority" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "saudia", name: "Saudia Al-Fursan", logo: "🕌", color: "#006400", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.saudia.com/fly/loyality-program", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra baggage, SkyTeam Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, SkyTeam Elite Plus" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "flynas", name: "Flynas naSmiles", logo: "🌙", color: "#FF6600", accent: "#003876", unit: "Points", loginUrl: "https://www.flynas.com/en/nasmiles", tiers: [], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "flydubai", name: "flydubai OPEN", logo: "🏙️", color: "#CC0000", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.flydubai.com/en/loyalty/open/", tiers: [], earnRate: { domestic: 4, international: 4, premium: 8 } },
    // ── Europe ──
    { id: "lufthansa", name: "Lufthansa Miles & More", logo: "🦅", color: "#003876", accent: "#FFCC00", unit: "Award Miles", loginUrl: "https://www.miles-and-more.com/row/en/login.html", tiers: [
      { name: "Frequent Traveller", threshold: 35000, perks: "Star Alliance Silver, lounge with guest, extra bag" },
      { name: "Senator", threshold: 100000, perks: "Lounge anytime, upgrades, Star Alliance Gold" },
      { name: "HON Circle", threshold: 600000, perks: "HON Circle lounge, First class lounge, guaranteed First" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "swiss", name: "Swiss SWISS Miles & More", logo: "🇨🇭", color: "#CC0000", accent: "#003876", unit: "Award Miles", loginUrl: "https://www.swiss.com/ch/en/fly/miles-and-more", tiers: [
      { name: "Frequent Traveller", threshold: 35000, perks: "Star Alliance Silver, lounge access" },
      { name: "Senator", threshold: 100000, perks: "Lounge, upgrades, Star Alliance Gold" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "austrian", name: "Austrian Airlines Miles & More", logo: "🇦🇹", color: "#CC0000", accent: "#003876", unit: "Award Miles", loginUrl: "https://www.austrian.com/us/en/miles-and-more", tiers: [
      { name: "Frequent Traveller", threshold: 35000, perks: "Star Alliance Silver, priority boarding" },
      { name: "Senator", threshold: 100000, perks: "Lounge, upgrades, Star Alliance Gold" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "iberia", name: "Iberia Plus", logo: "🇪🇸", color: "#CC0000", accent: "#FFD700", unit: "Avios", loginUrl: "https://www.iberia.com/us/iberia-plus/", tiers: [
      { name: "Uno", threshold: 20000, perks: "Priority boarding, extra baggage, oneworld Ruby" },
      { name: "Dos", threshold: 50000, perks: "Lounge access, upgrades, oneworld Sapphire" },
      { name: "Cuatro", threshold: 100000, perks: "First lounge, guaranteed seats, oneworld Emerald" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "finnair", name: "Finnair Plus", logo: "🇫🇮", color: "#003876", accent: "#C8102E", unit: "Tier Points", loginUrl: "https://www.finnair.com/int/gb/finnair-plus", tiers: [
      { name: "Silver", threshold: 200, perks: "Priority boarding, extra bag, oneworld Ruby" },
      { name: "Gold", threshold: 600, perks: "Lounge access, upgrades, oneworld Sapphire" },
      { name: "Platinum", threshold: 2000, perks: "First lounge, highest priority, oneworld Emerald" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "sas", name: "SAS EuroBonus", logo: "🇸🇪", color: "#003876", accent: "#C8102E", unit: "Points", loginUrl: "https://www.flysas.com/en/us/sas-eurobonus/", tiers: [
      { name: "Silver", threshold: 20000, perks: "Priority boarding, extra bag, Star Alliance Silver" },
      { name: "Gold", threshold: 45000, perks: "Lounge access, upgrades, Star Alliance Gold" },
      { name: "Diamond", threshold: 90000, perks: "SAS Gold Lounge, guaranteed seat, highest priority" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "tap", name: "TAP Air Portugal Miles&Go", logo: "🇵🇹", color: "#003876", accent: "#CC0000", unit: "Miles", loginUrl: "https://www.tapairportugal.com/en/miles-go", tiers: [
      { name: "Silver", threshold: 10000, perks: "Priority boarding, extra bag, Star Alliance Silver" },
      { name: "Gold", threshold: 25000, perks: "Lounge access, upgrades, Star Alliance Gold" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "azores", name: "Azores Airlines SATA Miles", logo: "🌋", color: "#003876", accent: "#009900", unit: "Miles", loginUrl: "https://www.azoresairlines.pt/en", tiers: [
      { name: "Silver", threshold: 10000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 25000, perks: "Lounge access, seat upgrades" },
    ], earnRate: { domestic: 5, international: 10, premium: 15 } },
    { id: "aer_lingus", name: "Aer Lingus AerClub", logo: "🍀", color: "#003876", accent: "#009900", unit: "Avios", loginUrl: "https://www.aerlingus.com/travel-information/aerclub/aerclub-home/", tiers: [
      { name: "Bronze", threshold: 0, perks: "Earn Avios on flights" },
      { name: "Silver", threshold: 450, perks: "Priority boarding, extra bag, oneworld Ruby" },
      { name: "Gold", threshold: 900, perks: "Lounge access, upgrades, oneworld Sapphire" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "lot", name: "LOT Polish Airlines Miles & More", logo: "🇵🇱", color: "#003876", accent: "#CC0000", unit: "Miles", loginUrl: "https://www.lot.com/us/en/miles-more", tiers: [
      { name: "Frequent Traveller", threshold: 35000, perks: "Star Alliance Silver, priority boarding" },
      { name: "Senator", threshold: 100000, perks: "Lounge, upgrades, Star Alliance Gold" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "aegean", name: "Aegean Airlines Miles+Bonus", logo: "🇬🇷", color: "#003876", accent: "#C8102E", unit: "Miles", loginUrl: "https://www.aegeanair.com/en/milesandbonus/", tiers: [
      { name: "Silver", threshold: 20000, perks: "Priority boarding, extra bag, Star Alliance Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Star Alliance Gold" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "pegasus", name: "Pegasus Airlines BolBol", logo: "🐎", color: "#FF6600", accent: "#003876", unit: "Points", loginUrl: "https://www.flypgs.com/en/bolbol", tiers: [
      { name: "Standard", threshold: 0, perks: "Earn points on flights and partners" },
    ], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "ita_airways", name: "ITA Airways Volare", logo: "🇮🇹", color: "#009246", accent: "#003876", unit: "Points", loginUrl: "https://www.ita-airways.com/en_us/fly-ita/volare.html", tiers: [
      { name: "Executive", threshold: 20000, perks: "Priority boarding, extra bag, SkyTeam Silver" },
      { name: "Premium Executive", threshold: 50000, perks: "Lounge access, upgrades, SkyTeam Elite Plus" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "norwegian", name: "Norwegian Reward", logo: "🇳🇴", color: "#CC0000", accent: "#003876", unit: "CashPoints", loginUrl: "https://www.norwegian.com/en/frequent-flyer/", tiers: [], earnRate: { domestic: 5, international: 5, premium: 10 } },
    { id: "easyjet", name: "easyJet Flight Club", logo: "🟠", color: "#FF6600", accent: "#003876", unit: "Points", loginUrl: "https://www.easyjet.com/en/cheap-flights/flight-club", tiers: [
      { name: "Standard", threshold: 0, perks: "Speedy boarding, seat selection discounts" },
    ], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "vueling", name: "Vueling Club", logo: "💛", color: "#FFD700", accent: "#003876", unit: "Points", loginUrl: "https://www.vueling.com/en/vueling-services/vueling-club", tiers: [
      { name: "Silver", threshold: 10000, perks: "Priority boarding, extra bag, oneworld Ruby" },
      { name: "Gold", threshold: 25000, perks: "Lounge access, upgrades, oneworld Sapphire" },
    ], earnRate: { domestic: 5, international: 8, premium: 15 } },
    { id: "brussels", name: "Brussels Airlines Miles & More", logo: "🇧🇪", color: "#003876", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.brusselsairlines.com/en-gb/special-pages/miles-more.aspx", tiers: [
      { name: "Frequent Traveller", threshold: 35000, perks: "Star Alliance Silver, priority boarding" },
      { name: "Senator", threshold: 100000, perks: "Lounge, upgrades, Star Alliance Gold" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    // ── Africa ──
    { id: "ethiopian", name: "Ethiopian Airlines ShebaMiles", logo: "🦁", color: "#009A44", accent: "#FFCD00", unit: "Miles", loginUrl: "https://www.ethiopianairlines.com/en/shebamiles", tiers: [
      { name: "Silver", threshold: 30000, perks: "Priority boarding, extra baggage, Star Alliance Silver" },
      { name: "Gold", threshold: 60000, perks: "Lounge access, upgrades, Star Alliance Gold" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "kenya_airways", name: "Kenya Airways Asante Rewards", logo: "🦒", color: "#CC0000", accent: "#003876", unit: "Points", loginUrl: "https://www.kenya-airways.com/en/flying-with-us/asante/", tiers: [
      { name: "Silver", threshold: 20000, perks: "Priority boarding, extra bag, SkyTeam Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, SkyTeam Elite Plus" },
    ], earnRate: { domestic: 5, international: 10, premium: 15 } },
    { id: "south_african", name: "South African Airways Voyager", logo: "🇿🇦", color: "#003876", accent: "#009A44", unit: "Miles", loginUrl: "https://www.flysaa.com/us/en/book-and-manage/saa-voyager", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra bag, Star Alliance Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Star Alliance Gold" },
    ], earnRate: { domestic: 5, international: 10, premium: 15 } },
    { id: "egyptair", name: "EgyptAir EGYPTAIR Plus", logo: "🦅", color: "#003876", accent: "#CC0000", unit: "Miles", loginUrl: "https://www.egyptair.com/en/air/eap/", tiers: [
      { name: "Silver", threshold: 20000, perks: "Priority boarding, extra baggage, Star Alliance Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Star Alliance Gold" },
    ], earnRate: { domestic: 5, international: 10, premium: 15 } },
    // ── South America ──
    { id: "latam", name: "LATAM Airlines LATAM Pass", logo: "🌎", color: "#CC0000", accent: "#003876", unit: "Points", loginUrl: "https://www.latamairlines.com/us/en/account/login", tiers: [
      { name: "Silver", threshold: 50, perks: "Priority boarding, extra bag, oneworld Ruby" },
      { name: "Gold", threshold: 130, perks: "Lounge access, upgrades, oneworld Sapphire" },
      { name: "Platinum", threshold: 250, perks: "First lounge, guaranteed seats, oneworld Emerald" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "gol", name: "GOL Airlines Smiles", logo: "🇧🇷", color: "#FF6600", accent: "#003876", unit: "Miles", loginUrl: "https://www.voegol.com.br/en/smiles", tiers: [
      { name: "Silver", threshold: 10000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 25000, perks: "Lounge access, upgrades" },
      { name: "Diamond", threshold: 60000, perks: "Highest priority, guaranteed seats" },
    ], earnRate: { domestic: 5, international: 10, premium: 15 } },
    { id: "azul", name: "Azul Brazilian Airlines TudoAzul", logo: "💙", color: "#003876", accent: "#FF6600", unit: "Points", loginUrl: "https://www.voeazul.com.br/en/todo-azul", tiers: [
      { name: "Safira", threshold: 10000, perks: "Priority boarding, extra bag" },
      { name: "Diamante", threshold: 30000, perks: "Lounge access, upgrades, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 15 } },
    { id: "avianca", name: "Avianca LifeMiles", logo: "🌺", color: "#CC0000", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.lifemiles.com/eng/mem/memberlogin.aspx", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra bag, Star Alliance Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Star Alliance Gold" },
      { name: "Diamond", threshold: 100000, perks: "First lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "copa", name: "Copa Airlines ConnectMiles", logo: "🌉", color: "#003876", accent: "#CC0000", unit: "Miles", loginUrl: "https://www.copaair.com/en/web/gs/connectmiles", tiers: [
      { name: "Silver", threshold: 30000, perks: "Priority boarding, extra bag, Star Alliance Silver" },
      { name: "Gold", threshold: 60000, perks: "Lounge access, upgrades, Star Alliance Gold" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "aeromexico", name: "Aeromexico Club Premier", logo: "🦅", color: "#003876", accent: "#CC0000", unit: "Miles", loginUrl: "https://www.aeromexico.com/en-us/club-premier", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra bag, SkyTeam Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, SkyTeam Elite Plus" },
      { name: "Titanium", threshold: 100000, perks: "First lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    // ── North America (additional) ──
    { id: "westjet", name: "WestJet Rewards", logo: "🇨🇦", color: "#003876", accent: "#009A44", unit: "WestJet dollars", loginUrl: "https://www.westjet.com/en-ca/rewards", tiers: [
      { name: "Silver", threshold: 1000, perks: "Priority boarding, extra bag" },
      { name: "Gold", threshold: 2000, perks: "Lounge access, upgrades, priority check-in" },
      { name: "Platinum", threshold: 4000, perks: "Highest priority, guaranteed upgrades, all perks" },
    ], earnRate: { domestic: 5, international: 5, premium: 10 } },
    { id: "air_transat", name: "Air Transat Club Transat", logo: "🍁", color: "#CC0000", accent: "#003876", unit: "Points", loginUrl: "https://www.airtransat.com/en-CA/Club-Transat/Overview", tiers: [
      { name: "Distinction", threshold: 40000, perks: "Priority boarding, bonus points" },
      { name: "Prestige", threshold: 100000, perks: "Priority everything, upgrades" },
    ], earnRate: { domestic: 5, international: 5, premium: 10 } },
    { id: "caribbean", name: "Caribbean Airlines Caribbean Miles", logo: "🌴", color: "#003876", accent: "#CC0000", unit: "Miles", loginUrl: "https://www.caribbean-airlines.com/en/frequent-flyer", tiers: [
      { name: "Silver", threshold: 15000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 35000, perks: "Lounge access, upgrades" },
    ], earnRate: { domestic: 5, international: 10, premium: 15 } },
    { id: "bermudair", name: "BermudAir Frequent Flyer", logo: "🏝️", color: "#003876", accent: "#FF6600", unit: "Points", loginUrl: "https://www.bermudair.com/", tiers: [], earnRate: { domestic: 5, international: 5, premium: 10 } },
    { id: "breeze", name: "Breeze Airways Breezy Rewards", logo: "🌬️", color: "#00B2E3", accent: "#003876", unit: "BreezePoints", loginUrl: "https://www.flybreeze.com/rewards", tiers: [], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "sun_country", name: "Sun Country Airlines Sun Country Rewards", logo: "☀️", color: "#003876", accent: "#FFD700", unit: "Points", loginUrl: "https://www.suncountry.com/rewards", tiers: [], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "allegiant", name: "Allegiant Air Allways Rewards", logo: "🔶", color: "#FF6600", accent: "#003876", unit: "Points", loginUrl: "https://www.allegiantair.com/allways-rewards", tiers: [], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "contour", name: "Contour Airlines Rewards", logo: "—", color: "#003876", accent: "#FF6600", unit: "Points", loginUrl: "https://contourairlines.com/", tiers: [], earnRate: { domestic: 5, international: 5, premium: 10 } },
  ],
  hotels: [
    { id: "marriott", name: "Marriott Bonvoy", logo: "—", color: "#7C2529", accent: "#B5985A", unit: "Nights", loginUrl: "https://www.marriott.com/loyalty/myAccount/default.mi", tiers: [
      { name: "Silver Elite", threshold: 10, perks: "10% bonus points, priority late checkout" },
      { name: "Gold Elite", threshold: 25, perks: "25% bonus, room upgrade, 2pm checkout" },
      { name: "Platinum Elite", threshold: 50, perks: "50% bonus, suite upgrade, lounge access" },
      { name: "Titanium Elite", threshold: 75, perks: "75% bonus, United Silver, 48hr guarantee" },
      { name: "Ambassador Elite", threshold: 100, perks: "Your24, ambassador service, all Titanium perks" },
    ], earnRate: { standard: 10, premium: 15, luxury: 25 } },
    { id: "hilton", name: "Hilton Honors", logo: "🌟", color: "#003B5C", accent: "#0099CC", unit: "Nights", loginUrl: "https://www.hilton.com/en/hilton-honors/guest/my-account/", tiers: [
      { name: "Silver", threshold: 10, perks: "20% bonus, 5th night free on rewards" },
      { name: "Gold", threshold: 40, perks: "80% bonus, room upgrade, free breakfast" },
      { name: "Diamond", threshold: 60, perks: "100% bonus, space-available upgrade, exec lounge" },
      { name: "Diamond Reserve", threshold: 80, perks: "All Diamond perks + enhanced suite upgrades, premium WiFi" },
    ], earnRate: { standard: 10, premium: 15, luxury: 20 } },
    { id: "ihg", name: "IHG One Rewards", logo: "🔑", color: "#2E1A47", accent: "#6B3FA0", unit: "Nights", loginUrl: "https://www.ihg.com/rewardsclub/us/en/account/home", tiers: [
      { name: "Silver Elite", threshold: 10, perks: "20% bonus, late checkout" },
      { name: "Gold Elite", threshold: 20, perks: "40% bonus, room upgrade" },
      { name: "Platinum Elite", threshold: 40, perks: "60% bonus, guaranteed availability" },
      { name: "Diamond Elite", threshold: 70, perks: "100% bonus, suite upgrade, amenity" },
    ], earnRate: { standard: 10, premium: 15, luxury: 20 } },
    { id: "hyatt", name: "World of Hyatt", logo: "🏛️", color: "#1C4B82", accent: "#D4A553", unit: "Nights", loginUrl: "https://www.hyatt.com/en-US/member/overview", tiers: [
      { name: "Discoverist", threshold: 10, perks: "Bottled water, priority late checkout" },
      { name: "Explorist", threshold: 30, perks: "Room upgrade, 2pm checkout, club lounge" },
      { name: "Globalist", threshold: 60, perks: "Suite upgrades, free breakfast, parking, waived resort fees" },
    ], earnRate: { standard: 5, premium: 10, luxury: 15 } },
    { id: "choice", name: "Choice Privileges", logo: "🏠", color: "#003F87", accent: "#FFB81C", unit: "Nights", loginUrl: "https://www.choicehotels.com/choice-privileges/account", tiers: [
      { name: "Gold", threshold: 10, perks: "Room upgrade, early check-in, late checkout" },
      { name: "Platinum", threshold: 20, perks: "Best room guarantee, bonus points" },
      { name: "Diamond", threshold: 40, perks: "Suite upgrade, guaranteed availability, amenity" },
    ], earnRate: { standard: 10, premium: 12, luxury: 15 } },
    { id: "wyndham", name: "Wyndham Rewards", logo: "🌀", color: "#0066B3", accent: "#FF6600", unit: "Nights", loginUrl: "https://www.wyndhamhotels.com/wyndham-rewards/member/dashboard", tiers: [
      { name: "Blue", threshold: 0, perks: "Member rates, free WiFi" },
      { name: "Gold", threshold: 5, perks: "1,000 bonus points per stay, late checkout" },
      { name: "Platinum", threshold: 15, perks: "Best room guarantee, welcome amenity" },
      { name: "Diamond", threshold: 40, perks: "Suite upgrade, early check-in/late checkout, bonus" },
    ], earnRate: { standard: 10, premium: 12, luxury: 15 } },
    { id: "accor", name: "ALL – Accor Live Limitless", logo: "🇫🇷", color: "#1B3160", accent: "#C4A769", unit: "Nights", loginUrl: "https://all.accor.com/loyalty-program/index.en.shtml", tiers: [
      { name: "Silver", threshold: 10, perks: "Late checkout, welcome drink" },
      { name: "Gold", threshold: 30, perks: "Room upgrade, early check-in, late checkout" },
      { name: "Platinum", threshold: 60, perks: "Suite upgrade, breakfast, lounge access" },
      { name: "Diamond", threshold: 100, perks: "Guaranteed room, premium suite, all perks" },
    ], earnRate: { standard: 10, premium: 15, luxury: 25 } },
    { id: "bestwestern", name: "Best Western Rewards", logo: "👑", color: "#003876", accent: "#FFD700", unit: "Nights", loginUrl: "https://www.bestwestern.com/en_US/rewards/member-profile.html", tiers: [
      { name: "Blue", threshold: 0, perks: "Member rates, points never expire" },
      { name: "Gold", threshold: 5, perks: "10% bonus, late checkout" },
      { name: "Platinum", threshold: 7, perks: "15% bonus, room upgrade" },
      { name: "Diamond", threshold: 15, perks: "30% bonus, suite when available, amenity" },
      { name: "Diamond Select", threshold: 25, perks: "50% bonus, best room guarantee" },
    ], earnRate: { standard: 10, premium: 12, luxury: 15 } },
    { id: "radisson", name: "Radisson Rewards", logo: "🔶", color: "#0C2340", accent: "#D4A553", unit: "Nights", loginUrl: "https://www.radissonhotels.com/en-us/rewards/my-account", tiers: [
      { name: "Club", threshold: 0, perks: "Member rates, free WiFi" },
      { name: "Premium", threshold: 5, perks: "Priority check-in, room upgrade" },
      { name: "VIP", threshold: 30, perks: "Suite upgrade, welcome amenity, guaranteed room" },
    ], earnRate: { standard: 10, premium: 12, luxury: 15 } },
    { id: "sonesta", name: "Sonesta Travel Pass", logo: "🌅", color: "#A3238E", accent: "#F7B538", unit: "Nights", loginUrl: "https://www.sonesta.com/sonesta-travel-pass/dashboard", tiers: [
      { name: "Adventurer", threshold: 0, perks: "Member rates, bonus points" },
      { name: "Explorer", threshold: 10, perks: "Room upgrade, late checkout, welcome amenity" },
      { name: "Trailblazer", threshold: 20, perks: "Suite upgrade, free breakfast, priority" },
    ], earnRate: { standard: 10, premium: 12, luxury: 15 } },
    { id: "omni", name: "Omni Select Guest", logo: "🎩", color: "#1A1F36", accent: "#C4A769", unit: "Nights", loginUrl: "https://www.omnihotels.com/loyalty", tiers: [
      { name: "Select Guest", threshold: 0, perks: "Complimentary WiFi, welcome amenity" },
      { name: "Platinum", threshold: 15, perks: "Room upgrade, late checkout, bonus points" },
      { name: "Black", threshold: 40, perks: "Suite upgrade, guaranteed room, premium amenity" },
    ], earnRate: { standard: 10, premium: 12, luxury: 15 } },
    { id: "airbnb", name: "Airbnb", logo: "🏠", color: "#FF5A5F", accent: "#00A699", unit: "Stays", loginUrl: "https://www.airbnb.com/login", tiers: [], earnRate: { standard: 0, premium: 0, luxury: 0 } },
    { id: "vrbo", name: "VRBO", logo: "🏡", color: "#1B4CC4", accent: "#FF6600", unit: "Stays", loginUrl: "https://www.vrbo.com/account/login", tiers: [], earnRate: { standard: 0, premium: 0, luxury: 0 } },
  ],
  rentals: [
    { id: "hertz", name: "Hertz Gold Plus Rewards", logo: "—", color: "#FFD700", accent: "#000000", unit: "Rentals", loginUrl: "https://www.hertz.com/rentacar/member/enrollment", tiers: [
      { name: "Gold", threshold: 0, perks: "Skip the counter, choose your car" },
      { name: "Five Star", threshold: 10, perks: "Guaranteed upgrades, priority service" },
      { name: "President's Circle", threshold: 15, perks: "Premium vehicles, dedicated line" },
    ], earnRate: { standard: 1, premium: 1.5 } },
    { id: "national", name: "National Emerald Club", logo: "🟢", color: "#006845", accent: "#2ECC71", unit: "Rentals", loginUrl: "https://www.nationalcar.com/en/loyalty.html", tiers: [
      { name: "Emerald Club", threshold: 0, perks: "Choose any midsize+, bypass counter" },
      { name: "Emerald Club Executive", threshold: 12, perks: "Free upgrades, guaranteed one-class" },
      { name: "Emerald Club Executive Elite", threshold: 25, perks: "Premium aisle access, priority" },
    ], earnRate: { standard: 1, premium: 1.5 } },
    { id: "avis", name: "Avis Preferred", logo: "🅰️", color: "#D0021B", accent: "#1A1F36", unit: "Rentals", loginUrl: "https://www.avis.com/en/loyalty-profile", tiers: [
      { name: "Preferred", threshold: 0, perks: "Skip the counter, choose your car" },
      { name: "Preferred Plus", threshold: 10, perks: "Free upgrade, priority service" },
      { name: "President's Club", threshold: 20, perks: "Premium vehicles, dedicated line, best rates" },
    ], earnRate: { standard: 1, premium: 1.5 } },
    { id: "enterprise", name: "Enterprise Plus", logo: "🚙", color: "#006845", accent: "#FFD700", unit: "Rentals", loginUrl: "https://www.enterprise.com/en/enterprise-plus.html", tiers: [
      { name: "Plus", threshold: 0, perks: "Earn points on rentals, free days" },
      { name: "Silver", threshold: 6, perks: "Free upgrade, priority service" },
      { name: "Gold", threshold: 12, perks: "Free class upgrade, premium service" },
      { name: "Platinum", threshold: 24, perks: "Top tier service, guaranteed upgrades, dedicated line" },
    ], earnRate: { standard: 1, premium: 1.5 } },
    { id: "budget", name: "Budget Fastbreak", logo: "🅱️", color: "#F57C21", accent: "#1A1F36", unit: "Rentals", loginUrl: "https://www.budget.com/en/fast-break", tiers: [
      { name: "Fastbreak", threshold: 0, perks: "Skip the counter, faster pickup" },
    ], earnRate: { standard: 1, premium: 1 } },
    { id: "sixt", name: "Sixt Loyalty", logo: "🔶", color: "#FF6600", accent: "#000000", unit: "Status Points", loginUrl: "https://www.sixt.com/mysixt/", tiers: [
      { name: "Gold", threshold: 500, perks: "Free upgrade, priority pick-up" },
      { name: "Platinum", threshold: 2000, perks: "Guaranteed upgrade, VIP service" },
      { name: "Diamond", threshold: 7000, perks: "Premium fleet, personal manager" },
    ], earnRate: { standard: 1, premium: 2 } },
    { id: "turo", name: "Turo", logo: "🔑", color: "#1D3557", accent: "#E63946", unit: "Trips", loginUrl: "https://turo.com/us/en/signin", tiers: [], earnRate: { standard: 1, premium: 1 } },
  ],
  creditCards: [
    { id: "amex_plat", name: "Amex Platinum", logo: "💳", color: "#B4B4B4", accent: "#006FCF", unit: "Membership Rewards", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "5x flights, Marriott/Hilton Gold, Centurion Lounge, $200 airline credit", annualFee: 695, bonusCategories: { flights: 5, hotels: 5, dining: 1, other: 1 } },
    { id: "amex_gold", name: "Amex Gold", logo: "✨", color: "#C5993C", accent: "#006FCF", unit: "Membership Rewards", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "4x dining & groceries, $120 dining credit, $120 Uber credit", annualFee: 325, bonusCategories: { flights: 3, dining: 4, other: 1 } },
    { id: "amex_green", name: "Amex Green", logo: "🌿", color: "#006845", accent: "#006FCF", unit: "Membership Rewards", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "3x travel & transit, LoungeBuddy credit, Global Entry credit", annualFee: 150, bonusCategories: { flights: 3, dining: 3, other: 1 } },
    { id: "chase_sapphire", name: "Chase Sapphire Reserve", logo: "💎", color: "#1A1F36", accent: "#004977", unit: "Ultimate Rewards", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "3x travel/dining, $300 travel credit, Priority Pass, DoorDash", annualFee: 550, bonusCategories: { flights: 3, hotels: 3, dining: 3, other: 1 } },
    { id: "chase_sapphire_pref", name: "Chase Sapphire Preferred", logo: "💠", color: "#004977", accent: "#1A1F36", unit: "Ultimate Rewards", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "5x travel via Chase, 3x dining/streaming, $50 hotel credit", annualFee: 95, bonusCategories: { flights: 2, hotels: 5, dining: 3, other: 1 } },
    { id: "cap1_venturex", name: "Capital One Venture X", logo: "🚀", color: "#D03027", accent: "#1A1F36", unit: "Miles", loginUrl: "https://myaccounts.capitalone.com/", perks: "2x everything, 10x hotels/cars via Capital One, $300 travel credit", annualFee: 395, bonusCategories: { flights: 2, hotels: 10, dining: 2, other: 2 } },
    { id: "cap1_venture", name: "Capital One Venture", logo: "🗺️", color: "#D03027", accent: "#FFFFFF", unit: "Miles", loginUrl: "https://myaccounts.capitalone.com/", perks: "2x on every purchase, transfer to 15+ partners", annualFee: 95, bonusCategories: { flights: 2, hotels: 2, dining: 2, other: 2 } },
    { id: "citi_premier", name: "Citi Premier", logo: "🏦", color: "#003B70", accent: "#0066CC", unit: "ThankYou Points", loginUrl: "https://www.citi.com/login", perks: "3x travel/gas/restaurants/supermarkets, transfer to AA", annualFee: 95, bonusCategories: { flights: 3, hotels: 3, dining: 3, other: 1 } },
    { id: "bilt", name: "Bilt Mastercard", logo: "🏠", color: "#000000", accent: "#E0E0E0", unit: "Bilt Points", loginUrl: "https://app.biltrewards.com/", perks: "Points on rent, 3x dining, 2x travel, Hyatt/AA transfers", annualFee: 0, bonusCategories: { flights: 2, hotels: 2, dining: 3, other: 1 } },
    { id: "delta_reserve", name: "Delta Reserve Amex", logo: "🔺", color: "#003366", accent: "#B4B4B4", unit: "SkyMiles", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "3x Delta, Sky Club access, companion cert, Medallion boost", annualFee: 650, bonusCategories: { flights: 3, dining: 1, other: 1 } },
    { id: "delta_gold", name: "Delta Gold Amex", logo: "🔺", color: "#C5993C", accent: "#003366", unit: "SkyMiles", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "2x Delta/restaurants, free checked bag, priority boarding", annualFee: 150, bonusCategories: { flights: 2, dining: 2, other: 1 } },
    { id: "united_club", name: "United Club Infinite Card", logo: "🌐", color: "#002244", accent: "#B4B4B4", unit: "MileagePlus Miles", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "4x United, 2x travel/dining, United Club membership, free bags", annualFee: 525, bonusCategories: { flights: 4, dining: 2, other: 1 } },
    { id: "united_explorer", name: "United Explorer Card", logo: "🌐", color: "#0066CC", accent: "#002244", unit: "MileagePlus Miles", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "2x United/dining/hotels, free checked bag, priority boarding", annualFee: 95, bonusCategories: { flights: 2, dining: 2, other: 1 } },
    { id: "aa_exec", name: "Citi AAdvantage Executive", logo: "—", color: "#0078D2", accent: "#003B70", unit: "AAdvantage Miles", loginUrl: "https://www.citi.com/login", perks: "Admirals Club, 4x AA/hotels, companion cert, Global Entry", annualFee: 595, bonusCategories: { flights: 4, hotels: 4, dining: 1, other: 1 } },
    { id: "marriott_boundless", name: "Marriott Bonvoy Boundless", logo: "—", color: "#7C2529", accent: "#B5985A", unit: "Bonvoy Points", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "6x Marriott, free night award annually, auto Silver Elite", annualFee: 95, bonusCategories: { flights: 2, hotels: 6, dining: 2, other: 1 } },
    { id: "hilton_aspire", name: "Hilton Honors Aspire", logo: "🌟", color: "#003B5C", accent: "#FFD700", unit: "Hilton Honors Points", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "14x Hilton, auto Diamond, $250 resort credit, free night", annualFee: 550, bonusCategories: { flights: 7, hotels: 14, dining: 7, other: 3 } },
    { id: "hilton_surpass", name: "Hilton Honors Surpass", logo: "🌟", color: "#0099CC", accent: "#003B5C", unit: "Hilton Honors Points", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "12x Hilton, auto Gold, free night after $15k spend", annualFee: 150, bonusCategories: { flights: 6, hotels: 12, dining: 6, other: 3 } },
    { id: "hyatt_card", name: "World of Hyatt Credit Card", logo: "🏛️", color: "#1C4B82", accent: "#D4A553", unit: "World of Hyatt Points", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "4x Hyatt, auto Discoverist, free night annually, bonus nights", annualFee: 95, bonusCategories: { flights: 2, hotels: 4, dining: 2, other: 1 } },
    { id: "ihg_premier", name: "IHG One Rewards Premier", logo: "🔑", color: "#2E1A47", accent: "#B4B4B4", unit: "IHG Points", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "10x IHG, 4th night free, auto Platinum, Global Entry", annualFee: 99, bonusCategories: { flights: 2, hotels: 10, dining: 2, other: 1 } },
    { id: "sw_priority", name: "Southwest Priority Card", logo: "❤️", color: "#304CB2", accent: "#FFBF27", unit: "Rapid Rewards Points", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "3x Southwest, $75 travel credit, 7,500 anniversary points", annualFee: 149, bonusCategories: { flights: 3, dining: 2, other: 1 } },
    { id: "atmos_summit", name: "Atmos Rewards Summit Visa Infinite", logo: "🏔️", color: "#01426A", accent: "#64CCC9", unit: "Atmos Points", loginUrl: "https://www.alaskaair.com/account/overview", perks: "3x Alaska/Hawaiian, Global Companion Award, status boost", annualFee: 250, bonusCategories: { flights: 3, dining: 2, other: 1 } },
  ],
};

const CABIN_LABELS = {
  basic_economy: "Basic Economy",
  economy: "Economy",
  premium_economy: "Premium Economy",
  business_first: "Business / First",
};

// Per-airline booking class → cabin mapping (codes vary by carrier)
const AIRLINE_BOOKING_CLASS_MAP = {
  aa:  { F:"business_first",A:"business_first",P:"business_first", J:"business_first",D:"business_first",R:"business_first",I:"business_first",C:"business_first", W:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",O:"economy", G:"basic_economy" },
  dl:  { J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first", W:"premium_economy",P:"premium_economy", Y:"economy",B:"economy",M:"economy",H:"economy",Q:"economy",K:"economy",L:"economy",U:"economy",T:"economy",X:"economy",V:"economy",S:"economy", E:"basic_economy",N:"basic_economy" },
  ua:  { J:"business_first",C:"business_first",D:"business_first",Z:"business_first",P:"business_first", A:"premium_economy", Y:"economy",B:"economy",M:"economy",E:"economy",U:"economy",H:"economy",Q:"economy",V:"economy",W:"economy",S:"economy",T:"economy",K:"economy",L:"economy",G:"economy",X:"economy", N:"basic_economy" },
  sw:  { A:"business_first",B:"business_first", Y:"economy",K:"economy",L:"economy",M:"economy",N:"economy",Q:"economy",S:"economy",T:"economy",V:"economy",W:"economy",X:"economy" },
  b6:  { J:"business_first",C:"business_first",D:"business_first", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",Q:"economy",T:"economy",N:"economy", G:"basic_economy",O:"basic_economy" },
  atmos: { F:"business_first",A:"business_first",C:"business_first",J:"business_first",D:"business_first", P:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",L:"economy",M:"economy",O:"economy",S:"economy",Q:"economy",G:"economy",T:"economy",X:"economy",E:"economy",N:"economy",V:"economy",U:"economy",W:"economy" },
  ba_avios: { F:"business_first",A:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",R:"business_first",U:"business_first", W:"premium_economy",T:"premium_economy",P:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",O:"economy",G:"economy" },
  aeroplan: { J:"business_first",C:"business_first",D:"business_first",Z:"business_first",P:"business_first", W:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",Q:"economy",T:"economy", E:"basic_economy",G:"basic_economy",N:"basic_economy" },
  singapore_kf: { F:"business_first",A:"business_first",P:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first",U:"business_first", W:"premium_economy",E:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",Q:"economy", N:"basic_economy",G:"basic_economy" },
  cathay_mp: { F:"business_first",A:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",R:"business_first",P:"business_first", W:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",T:"economy",X:"economy",E:"economy",G:"economy",O:"economy" },
  emirates_skywards: { F:"business_first",A:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first", W:"premium_economy",P:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",T:"economy",X:"economy",G:"economy",O:"economy" },
  flying_blue: { F:"business_first",A:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first", W:"premium_economy",P:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",T:"economy",X:"economy",E:"economy",G:"economy" },
  turkish_miles: { F:"business_first",A:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first", W:"premium_economy",P:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",T:"economy",X:"economy",E:"economy",G:"economy" },
  qantas_ff: { F:"business_first",A:"business_first",P:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first",U:"business_first", W:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",O:"economy",G:"economy" },
  etihad_guest: { F:"business_first",A:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first", W:"premium_economy",P:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",T:"economy",X:"economy",E:"economy",G:"economy" },
  virgin_fc: { F:"business_first",A:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first",U:"business_first", W:"premium_economy",P:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",T:"economy",X:"economy",G:"economy" },
  frontier: { J:"business_first",C:"business_first", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",Q:"economy", G:"basic_economy",O:"basic_economy" },
  spirit:   { J:"business_first", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",Q:"economy", G:"basic_economy",O:"basic_economy" },
};
// Generic fallback map for airlines not listed above
const BOOKING_CLASS_MAP_GENERIC = { G:"basic_economy",O:"basic_economy",E:"basic_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",Q:"economy",T:"economy",X:"economy",U:"economy",N:"economy", W:"premium_economy", J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first",R:"business_first",F:"business_first",A:"business_first",P:"business_first" };

const getBookingClassCabin = (programId, code) => {
  if (!code) return null;
  const map = AIRLINE_BOOKING_CLASS_MAP[programId] || BOOKING_CLASS_MAP_GENERIC;
  return map[code.toUpperCase()] || null;
};

// Per-program per-booking-class status earning rates (per $ spent)
const BOOKING_CLASS_RATES = {
  aa:  { F:11,A:11,P:11, J:11,D:11,R:11,I:11,C:11, W:7, Y:5,B:5,H:5,K:5,M:5,L:5,V:5,S:5,N:5,Q:5,O:5, G:0 },
  dl:  { J:1.5,C:1.5,D:1.5,I:1.5,Z:1.5, P:1.25,W:1.25, Y:1,B:1,M:1,H:1,Q:1,K:1,L:1,U:1,T:1,X:1,V:1,S:1, E:0,N:0 },
  ua:  { J:2,C:2,D:2,Z:2,P:2,F:2,A:2, W:1.5, Y:1,B:1,M:1,E:1,U:1,H:1,Q:1,V:1,S:1,T:1,K:1,L:1,G:1,X:1, N:0 },
  sw:  { A:12,B:12, Y:6,K:6,L:6,M:6,N:6,Q:6,S:6,T:6,V:6,W:6,X:6 },
  b6:  { J:7,C:7,D:7, Y:3,B:3,H:3,K:3,M:3,L:3,V:3,S:3,Q:3,T:3,N:3, G:0,O:0 },
  atmos: { F:3,A:3,C:3,J:3,D:3, P:2, Y:1,B:1,H:1,K:1,L:1,M:1,O:1,S:1,Q:1,G:1,T:1,X:1,E:1,N:1,V:1,U:1,W:1 },
  ba_avios: { F:4,A:4, J:3,C:3,D:3,I:3,R:3,U:3, W:2,T:2,P:2, Y:1.25,B:1.25,H:1.25,K:1.25,M:1.25, L:1,V:1,S:1,N:1, Q:0.5, O:0,G:0 },
  aeroplan: { J:2,C:2,D:2,Z:2,P:2, W:1.5, Y:1,B:1,H:1,K:1,M:1,L:1,V:1,S:1,Q:1,T:1, E:0,G:0,N:0 },
  singapore_kf: { F:2,A:2,P:2, J:2,C:2,D:2,Z:2,U:2, W:1.5,E:1.5, Y:1,B:1,H:1,K:1,M:1,L:1,V:1,S:1,Q:1, N:0,G:0 },
  cathay_mp: { F:2,A:2, J:2,C:2,D:2,I:2,R:2,P:2, W:1.5, Y:1,B:1,H:1,K:1,M:1,L:1,V:1,S:1,N:1,Q:1,T:1,X:1,E:0.5,G:0,O:0 },
  emirates_skywards: { F:2,A:2, J:2,C:2,D:2,I:2,Z:2, W:1.5,P:1.5, Y:1,B:1,H:1,K:1,M:1,L:1,V:1,S:1,N:1,Q:1,T:1,X:1, G:0,O:0 },
  flying_blue: { F:2,A:2, J:2,C:2,D:2,I:2,Z:2, W:1.5,P:1.5, Y:1,B:1,H:1,K:1,M:1,L:1,V:1,S:1,N:0.5,Q:0.5, T:0,X:0,E:0,G:0 },
  qantas_ff: { F:2,A:2,P:2, J:2,C:2,D:2,I:2,Z:2,U:2, W:1.5, Y:1,B:1,H:1,K:1,M:1,L:1,V:1,S:1,N:0,Q:0,O:0,G:0 },
};

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
const PARTNER_CLASS_RATES = {
  aa: { // AA partner earning by specific booking class (verified from official sources)
    // BA/Iberia: REVENUE-BASED since Oct 2023 — 5 LP/$1 for premium cabins, 0 for economy
    // (handled by _type "fare" override below, not class rates)
    // Cathay Pacific → AA: DISTANCE-BASED (from wheretocredit.com / FlyerTalk)
    cathay_mp:{ F:150,A:150, J:125,C:125,D:125,I:125,P:125, W:110,R:110,E:110, Y:100,B:150,H:100,K:100, G:0,L:0,M:0,N:0,O:0,Q:0,S:0,V:0 },
    // Qantas → AA: DISTANCE-BASED
    qantas_ff:{ F:150,A:150, J:125,C:125,D:125,I:125, W:110,T:100,R:100, Y:100,B:100, K:50,L:50,M:50,V:50, G:25,N:25,O:25,Q:25,S:25, H:0 },
    // Other oneworld partners: generic distance-based
    atmos:    { F:150,A:150, J:125,C:125,D:125, P:110, Y:100,B:100,H:100,K:100,M:100, L:50,V:50,S:50,N:50,Q:50, G:0 },
  },
  ba_avios: { // BA Tier Points from partner flights by booking class (TP per 100mi approx)
    aa: { F:3.5,A:3.5, J:2.8,C:2.5,D:2.5,R:2.0,I:2.0, W:1.4, Y:0.7,B:0.7,H:0.7,K:0.6,M:0.6, L:0.4,V:0.4,S:0.4,N:0.4, G:0 },
    cathay_mp:{ F:3.5,A:3.5, J:2.8,C:2.5,D:2.5,I:2.0,R:2.0, W:1.4, Y:0.7,B:0.7,H:0.7,K:0.6,M:0.6, L:0.4,V:0.4, G:0 },
    qantas_ff:{ F:3.5,A:3.5, J:2.8,C:2.5,D:2.5,I:2.0, W:1.4, Y:0.7,B:0.7,H:0.7,K:0.6,M:0.6, L:0.4,V:0.4, G:0 },
  },
  cathay_mp: { // Cathay Status Points from partner flights (SP per 100mi approx)
    aa: { F:1.8,A:1.8, J:1.5,C:1.2,D:1.2,R:0.8,I:0.8, W:0.6, Y:0.3,B:0.3,H:0.25,K:0.25,M:0.2, L:0.1,V:0.1, G:0 },
    ba_avios:{ F:1.8,A:1.8, J:1.5,C:1.2,D:1.2,R:0.8,I:0.8, W:0.6, Y:0.3,B:0.3,H:0.25,K:0.25,M:0.2, G:0 },
  },
};

const PARTNER_EARN_RATES = {
  aa: { // AAdvantage Loyalty Points
    // Own-metal: FARE-BASED. 5 LP/$1 base (Gold 7, Plat 8, Plat Pro 9, EP 11 — modeled via elite bonus).
    // BA/Iberia: REVENUE-BASED since Oct 2023 (5 LP/$1 for premium cabins F/A/J/C/D/R/I/W/E/T; 0 for economy).
    // Cathay/Qantas/other oneworld: DISTANCE-BASED by booking class.
    _type: "fare_own",
    _own:         { business_first: 5, premium_economy: 5, economy: 5, basic_economy: 0 },
    // BA → AA: REVENUE-BASED (same rate as own-metal, 5 LP/$1 for premium cabins, 0 for economy)
    ba_avios:     { _fare: true, business_first: 5, premium_economy: 5, economy: 0, basic_economy: 0 },
    // Cathay → AA: DISTANCE-BASED (from official AA/wheretocredit: F/A 150%, J/C/D/I/P 125%, W/R/E 110%)
    cathay_mp:    { business_first: 138, premium_economy: 110, economy: 100, basic_economy: 0 },
    // Qantas → AA: DISTANCE-BASED (F/A 150%, J/C/D/I 125%, W 110%, Y/B 100%, K-V 50%, G-S 25%)
    qantas_ff:    { business_first: 138, premium_economy: 105, economy: 75, basic_economy: 0 },
    atmos:        { business_first: 138, premium_economy: 110, economy: 100, basic_economy: 0 },
    flying_blue:  { business_first: 125, premium_economy: 100, economy: 50, basic_economy: 0 },
    _default:     { business_first: 125, premium_economy: 100, economy: 75, basic_economy: 0 },
  },
  dl: { // Delta MQDs — since 2024, ONLY MQDs qualify (MQMs eliminated)
    // Own-metal: $1 = 1 MQD (no cabin multiplier). Basic Economy excluded.
    // Partner: distance × fare class % (reduced rates since 2024)
    // NO elite tier bonus on MQDs.
    _type: "revenue",
    _own:         { business_first: 1, premium_economy: 1, economy: 1, basic_economy: 0 },
    flying_blue:  { business_first: 150, premium_economy: 100, economy: 75, basic_economy: 0 },
    aeroplan:     { business_first: 125, premium_economy: 100, economy: 75, basic_economy: 0 },
    _default:     { business_first: 125, premium_economy: 100, economy: 75, basic_economy: 0 },
  },
  ua: { // United PQPs
    // Own-metal: $1 = 1 PQP (no cabin multiplier). Basic Economy excluded.
    // Partner: PQP derived from miles earned ÷ 5 (preferred) or ÷ 6 (others), with caps.
    // Simplified here as % of distance (approximation of miles÷5).
    // NO elite tier bonus on PQPs.
    _type: "revenue",
    _own:         { business_first: 1, premium_economy: 1, economy: 1, basic_economy: 0 },
    aeroplan:     { business_first: 40, premium_economy: 25, economy: 20, basic_economy: 0 }, // ~miles÷5
    singapore_kf: { business_first: 40, premium_economy: 25, economy: 20, basic_economy: 0 },
    turkish_miles:{ business_first: 33, premium_economy: 20, economy: 17, basic_economy: 0 }, // ~miles÷6
    _default:     { business_first: 33, premium_economy: 20, economy: 17, basic_economy: 0 },
  },
  ba_avios: { // BA Tier Points
    // From April 2025 (own-metal BA/AA/Iberia): 1 TP per GBP 1 of eligible spend + bonus TPs per leg.
    // Bonus per leg: Long-haul Club World (J) = 400 TP, World Traveller Plus (W) = 275 TP,
    //   World Traveller (Y) = 150 TP, First = 550 TP. Short-haul: Club Europe = 175, Euro Trav = 75.
    // Total TP ≈ (fare in GBP × 1) + (legs × cabin bonus). We model as fare-based for own-metal.
    // For GBP→USD approx: ~0.8 TP per $1 spent. Plus bonus per segment (modeled by adding ~100 TP/seg via rate).
    // Partner flights: fixed TP per segment by distance band + cabin (NOT revenue).
    // NO elite tier bonus on Tier Points.
    _type: "fare_own",
    _own:         { business_first: 0.8, premium_economy: 0.8, economy: 0.8, basic_economy: 0.3 }, // ~TP per $ (GBP conversion)
    // Partners: distance-band based, modeled as TP per 100mi (approximate fixed-TP-per-segment)
    aa:           { business_first: 2.5, premium_economy: 1.4, economy: 0.7, basic_economy: 0 },
    cathay_mp:    { business_first: 2.5, premium_economy: 1.4, economy: 0.7, basic_economy: 0 },
    qantas_ff:    { business_first: 2.5, premium_economy: 1.4, economy: 0.7, basic_economy: 0 },
    _default:     { business_first: 2.2, premium_economy: 1.2, economy: 0.6, basic_economy: 0 },
  },
  cathay_mp: { // Cathay Status Points — SEGMENT-BASED (fixed SP per distance band + cabin)
    // Simplified as % of distance for calculator (approximate)
    // NO elite tier bonus.
    _type: "segment",
    _own:         { business_first: 1.5, premium_economy: 0.8, economy: 0.3, basic_economy: 0.1 }, // SP per 100mi (approx)
    aa:           { business_first: 1.2, premium_economy: 0.6, economy: 0.25, basic_economy: 0 },
    ba_avios:     { business_first: 1.2, premium_economy: 0.6, economy: 0.25, basic_economy: 0 },
    _default:     { business_first: 1.0, premium_economy: 0.5, economy: 0.2, basic_economy: 0 },
  },
  qantas_ff: { // Qantas Status Credits — SEGMENT-BASED (fixed SC per route zone + fare)
    // Simplified as approx SC per 100mi for calculator
    // NO elite tier bonus on SCs.
    _type: "segment",
    _own:         { business_first: 2.0, premium_economy: 1.2, economy: 0.6, basic_economy: 0 },
    aa:           { business_first: 1.5, premium_economy: 1.0, economy: 0.5, basic_economy: 0 },
    cathay_mp:    { business_first: 1.5, premium_economy: 1.0, economy: 0.5, basic_economy: 0 },
    ba_avios:     { business_first: 1.5, premium_economy: 1.0, economy: 0.5, basic_economy: 0 },
    _default:     { business_first: 1.2, premium_economy: 0.8, economy: 0.4, basic_economy: 0 },
  },
  aeroplan: { // Air Canada SQM (Status Qualifying Miles) — DISTANCE-BASED
    // Also requires SQD ($1=1 on AC metal), but calculator shows SQM only.
    // NO elite tier bonus.
    _own:         { business_first: 150, premium_economy: 115, economy: 100, basic_economy: 0 },
    ua:           { business_first: 150, premium_economy: 100, economy: 100, basic_economy: 0 },
    _default:     { business_first: 125, premium_economy: 100, economy: 75, basic_economy: 0 },
  },
  singapore_kf: { // Singapore KrisFlyer Elite Miles — DISTANCE-BASED by booking class
    // F/A: 200%, J/C/Z: 150%, D/U: 125%, Economy varies 50-100%
    // NO elite tier bonus.
    _own:         { business_first: 175, premium_economy: 125, economy: 75, basic_economy: 0 },
    ua:           { business_first: 150, premium_economy: 100, economy: 75, basic_economy: 0 },
    _default:     { business_first: 125, premium_economy: 100, economy: 50, basic_economy: 0 },
  },
  emirates_skywards: { // Emirates Tier Miles — DISTANCE-BASED (route-specific, approx values)
    // Rates vary by specific route; these are median approximations.
    // Elite bonus on redeemable Skywards Miles only (Silver +30%, Gold +75%, Plat +100%), NOT on Tier Miles.
    _own:         { business_first: 200, premium_economy: 125, economy: 60, basic_economy: 25 },
    qantas_ff:    { business_first: 150, premium_economy: 100, economy: 50, basic_economy: 0 },
    _default:     { business_first: 125, premium_economy: 75, economy: 50, basic_economy: 0 },
  },
  flying_blue: { // Flying Blue XP — SEGMENT-BASED (fixed XP per distance band + cabin)
    // Biz ~3x Economy, First ~3x Business. Approx XP per 1000mi for calculator.
    // NO elite tier bonus on XP.
    _type: "segment",
    _own:         { business_first: 5.0, premium_economy: 2.5, economy: 1.7, basic_economy: 0.7 }, // XP per 1000mi
    dl:           { business_first: 4.5, premium_economy: 2.0, economy: 1.5, basic_economy: 0 },
    _default:     { business_first: 4.0, premium_economy: 2.0, economy: 1.2, basic_economy: 0 },
  },
  turkish_miles: { // Turkish Status Miles — DISTANCE-BASED
    // ~100-225% by fare class. Elite/Elite Plus get +25% on Business only.
    _own:         { business_first: 200, premium_economy: 150, economy: 100, basic_economy: 25 },
    ua:           { business_first: 175, premium_economy: 125, economy: 100, basic_economy: 0 },
    _default:     { business_first: 150, premium_economy: 100, economy: 75, basic_economy: 0 },
  },
  atmos: { // Alaska Mileage Plan EQMs — DISTANCE-BASED
    // Own-metal: 100% of distance (min 500 EQM). Partner: varies by cabin + booking channel.
    // Rates below assume booked on AlaskaAir.com (higher rates).
    // Elite bonus: MVP +25%, Gold +50%, Gold 75K +50%.
    _own:         { business_first: 100, premium_economy: 100, economy: 100, basic_economy: 50 },
    aa:           { business_first: 250, premium_economy: 150, economy: 100, basic_economy: 25 },
    cathay_mp:    { business_first: 250, premium_economy: 150, economy: 100, basic_economy: 25 },
    ba_avios:     { business_first: 250, premium_economy: 150, economy: 100, basic_economy: 25 },
    _default:     { business_first: 125, premium_economy: 100, economy: 50, basic_economy: 25 },
  },
};

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
const ELITE_BONUS_PCT = {
  aa: { "Gold": 40, "Platinum": 60, "Platinum Pro": 80, "Executive Platinum": 120 },
  atmos: { "MVP": 25, "MVP Gold": 50, "MVP Gold 75K": 50 },
  // Programs with NO elite bonus on status credits:
  dl: { "Silver Medallion": 0, "Gold Medallion": 0, "Platinum Medallion": 0, "Diamond Medallion": 0 },
  ua: { "Premier Silver": 0, "Premier Gold": 0, "Premier Platinum": 0, "Premier 1K": 0 },
  ba_avios: { "Bronze": 0, "Silver": 0, "Gold": 0 },
  cathay_mp: { "Green": 0, "Silver": 0, "Gold": 0, "Diamond": 0 },
  aeroplan: { "25K": 0, "35K": 0, "50K": 0, "75K": 0, "Super Elite 100K": 0 },
  qantas_ff: { "Silver": 0, "Gold": 0, "Platinum": 0 },
  singapore_kf: { "Elite Silver": 0, "Elite Gold": 0 },
  emirates_skywards: { "Silver": 0, "Gold": 0, "Platinum": 0 },
  flying_blue: { "Silver": 0, "Gold": 0, "Platinum": 0, "Ultimate": 0 },
  turkish_miles: { "Classic Plus": 0, "Elite": 0, "Elite Plus": 0 },
};

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
const LOYALTY_PROGRAMS = {
  airlines: [...PROGRAM_DIRECTORY.airlines].sort((a, b) => a.name.localeCompare(b.name)),
  hotels: [...PROGRAM_DIRECTORY.hotels].sort((a, b) => a.name.localeCompare(b.name)),
  rentals: [...PROGRAM_DIRECTORY.rentals].sort((a, b) => a.name.localeCompare(b.name)),
  creditCards: [...PROGRAM_DIRECTORY.creditCards].sort((a, b) => a.name.localeCompare(b.name)),
};

// Clearbit logo domains keyed by program id
const PROGRAM_LOGO_DOMAINS = {
  // Airlines
  aa: "aa.com", dl: "delta.com", ua: "united.com", sw: "southwest.com",
  b6: "jetblue.com", atmos: "alaskaair.com", frontier: "flyfrontier.com",
  spirit: "spirit.com", flying_blue: "airfranceklm.com", ba_avios: "britishairways.com",
  aeroplan: "aircanada.com", emirates_skywards: "emirates.com",
  turkish_miles: "turkishairlines.com", qantas_ff: "qantas.com",
  singapore_kf: "singaporeair.com", etihad_guest: "etihad.com",
  virgin_fc: "virginatlantic.com", cathay_mp: "cathaypacific.com",
  // Hotels
  marriott: "marriott.com", hilton: "hilton.com", ihg: "ihg.com",
  hyatt: "hyatt.com", choice: "choicehotels.com", wyndham: "wyndhamhotels.com",
  accor: "accor.com", bestwestern: "bestwestern.com", radisson: "radissonhotels.com",
  sonesta: "sonesta.com", omni: "omnihotels.com",
  // Rentals
  hertz: "hertz.com", national: "nationalcar.com", avis: "avis.com",
  enterprise: "enterprise.com", budget: "budget.com", sixt: "sixt.com",
  // Credit cards
  amex_plat: "americanexpress.com", amex_gold: "americanexpress.com",
  amex_green: "americanexpress.com", chase_sapphire: "chase.com",
  chase_sapphire_pref: "chase.com", cap1_venturex: "capitalone.com",
  cap1_venture: "capitalone.com", citi_premier: "citi.com",
  bilt: "biltrewards.com", delta_reserve: "delta.com", delta_gold: "delta.com",
  united_club: "united.com", united_explorer: "united.com", aa_exec: "aa.com",
  marriott_boundless: "marriott.com", hilton_aspire: "hilton.com",
  hilton_surpass: "hilton.com", hyatt_card: "hyatt.com", ihg_premier: "ihg.com",
  sw_priority: "southwest.com", atmos_summit: "alaskaair.com",
};

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
const AIRLINE_CS = {
  aa: { name: "American Airlines", phone: "1-800-433-7300", manage: "https://www.aa.com/reservation/view/find-your-trip" },
  dl: { name: "Delta Air Lines", phone: "1-800-221-1212", manage: "https://www.delta.com/mytrips/" },
  ua: { name: "United Airlines", phone: "1-800-864-8331", manage: "https://www.united.com/en/us/managereservation" },
  sw: { name: "Southwest Airlines", phone: "1-800-435-9792", manage: "https://www.southwest.com/air/manage-reservation/" },
  b6: { name: "JetBlue", phone: "1-800-538-2583", manage: "https://www.jetblue.com/manage-trips" },
  atmos: { name: "Alaska Airlines", phone: "1-800-252-7522", manage: "https://www.alaskaair.com/booking/manage-trip" },
  frontier: { name: "Frontier Airlines", phone: "1-801-401-9000", manage: "https://www.flyfrontier.com/manage-trip/" },
  spirit: { name: "Spirit Airlines", phone: "1-855-728-3555", manage: "https://www.spirit.com/my-trips" },
  flying_blue: { name: "Air France / KLM", phone: "1-800-237-2747", manage: "https://www.airfrance.us/FR/en/local/process/standardbookingretrieve/RetrieveBookingAction.do" },
  ba_avios: { name: "British Airways", phone: "1-800-247-9297", manage: "https://www.britishairways.com/travel/managebooking/public/en_us" },
  aeroplan: { name: "Air Canada", phone: "1-888-247-2262", manage: "https://www.aircanada.com/ca/en/aco/home/book/manage-bookings.html" },
  emirates_skywards: { name: "Emirates", phone: "1-800-777-3999", manage: "https://www.emirates.com/us/english/manage-booking/" },
  turkish_miles: { name: "Turkish Airlines", phone: "1-800-874-8875", manage: "https://www.turkishairlines.com/en-int/any-content/manage-booking/" },
  qantas_ff: { name: "Qantas", phone: "1-800-227-4500", manage: "https://www.qantas.com/au/en/manage-booking.html" },
  singapore_kf: { name: "Singapore Airlines", phone: "1-800-742-3333", manage: "https://www.singaporeair.com/en_UK/ppsclub-krisflyer/manage-booking/" },
  cathay_mp: { name: "Cathay Pacific", phone: "1-800-233-2742", manage: "https://www.cathaypacific.com/cx/en_US/manage-trip/manage-booking.html" },
};
const OTA_CS = {
  expedia: { name: "Expedia", phone: "1-866-310-5768", manage: "https://www.expedia.com/trips" },
  booking: { name: "Booking.com", phone: "1-888-850-3958", manage: "https://secure.booking.com/mysettings.html" },
  kayak: { name: "Kayak", phone: "1-855-529-2501", manage: "https://www.kayak.com/trips" },
  google_flights: { name: "Google Flights", phone: null, manage: null },
  hopper: { name: "Hopper", phone: "1-833-933-4674", manage: null },
  priceline: { name: "Priceline", phone: "1-877-477-5807", manage: "https://www.priceline.com/account/trips" },
  orbitz: { name: "Orbitz", phone: "1-844-674-4891", manage: "https://www.orbitz.com/trips" },
  travelocity: { name: "Travelocity", phone: "1-888-709-5983", manage: "https://www.travelocity.com/trips" },
  cheapoair: { name: "CheapOair", phone: "1-800-566-2345", manage: "https://www.cheapoair.com/myaccount/mytrips" },
  tripcom: { name: "Trip.com", phone: "1-833-896-0077", manage: "https://www.trip.com/account/manage" },
};
// Common aircraft types for display
const AIRCRAFT_TYPES = {
  "738": "Boeing 737-800", "73H": "Boeing 737-800", "739": "Boeing 737-900",
  "7M8": "Boeing 737 MAX 8", "7M9": "Boeing 737 MAX 9",
  "319": "Airbus A319", "320": "Airbus A320", "321": "Airbus A321", "32Q": "Airbus A321neo",
  "332": "Airbus A330-200", "333": "Airbus A330-300", "339": "Airbus A330-900neo",
  "359": "Airbus A350-900", "35K": "Airbus A350-1000",
  "772": "Boeing 777-200", "77W": "Boeing 777-300ER", "789": "Boeing 787-9", "788": "Boeing 787-8",
  "E75": "Embraer E175", "E90": "Embraer E190", "CR9": "Bombardier CRJ-900", "CRJ": "Bombardier CRJ",
};

// ============================================================
// CREDIT CARD TRANSFER PARTNERS & SPENDING CATEGORIES
// ============================================================
const CC_SPENDING_CATS = [
  { id: "dining",    label: "Dining",         icon: "🍽️" },
  { id: "flights",   label: "Flights",        icon: "—" },
  { id: "hotels",    label: "Hotels",         icon: "—" },
  { id: "groceries", label: "Groceries",      icon: "🛒" },
  { id: "gas",       label: "Gas / Transit",  icon: "⛽" },
  { id: "streaming", label: "Streaming",      icon: "📺" },
  { id: "rent",      label: "Rent",           icon: "🏠" },
  { id: "other",     label: "Everything Else", icon: "💳" },
];
// Transfer partner mapping: card currency → airline/hotel programs (1:1 unless noted)
const CC_TRANSFER_PARTNERS = {
  amex_plat:        { currency: "Membership Rewards", partners: ["dl","ba_avios","flying_blue","aeroplan","singapore_kf","emirates_skywards","cathay_mp","virgin_fc","marriott","hilton"] },
  amex_gold:        { currency: "Membership Rewards", partners: ["dl","ba_avios","flying_blue","aeroplan","singapore_kf","emirates_skywards","cathay_mp","virgin_fc","marriott","hilton"] },
  amex_green:       { currency: "Membership Rewards", partners: ["dl","ba_avios","flying_blue","aeroplan","singapore_kf","emirates_skywards","cathay_mp","virgin_fc","marriott","hilton"] },
  chase_sapphire:   { currency: "Ultimate Rewards", partners: ["ua","sw","ba_avios","flying_blue","aeroplan","singapore_kf","emirates_skywards","virgin_fc","marriott","hyatt","ihg"] },
  chase_sapphire_pref: { currency: "Ultimate Rewards", partners: ["ua","sw","ba_avios","flying_blue","aeroplan","singapore_kf","emirates_skywards","virgin_fc","marriott","hyatt","ihg"] },
  cap1_venturex:    { currency: "Capital One Miles", partners: ["aa","dl","ua","b6","ba_avios","flying_blue","aeroplan","singapore_kf","emirates_skywards","turkish_miles","qantas_ff","cathay_mp","virgin_fc"] },
  cap1_venture:     { currency: "Capital One Miles", partners: ["aa","dl","ua","b6","ba_avios","flying_blue","aeroplan","singapore_kf","emirates_skywards","turkish_miles","qantas_ff","cathay_mp","virgin_fc"] },
  citi_premier:     { currency: "ThankYou Points", partners: ["aa","b6","flying_blue","singapore_kf","turkish_miles","qantas_ff","cathay_mp","virgin_fc"] },
  bilt:             { currency: "Bilt Points", partners: ["aa","ua","ba_avios","flying_blue","aeroplan","turkish_miles","cathay_mp","virgin_fc","marriott","hyatt","ihg"] },
  // Co-brand cards earn directly into the program, no transfer
  delta_reserve:    { currency: "SkyMiles", directProgram: "dl" },
  delta_gold:       { currency: "SkyMiles", directProgram: "dl" },
  united_club:      { currency: "MileagePlus Miles", directProgram: "ua" },
  united_explorer:  { currency: "MileagePlus Miles", directProgram: "ua" },
  aa_exec:          { currency: "AAdvantage Miles", directProgram: "aa" },
  marriott_boundless: { currency: "Bonvoy Points", directProgram: "marriott" },
  hilton_aspire:    { currency: "Hilton Points", directProgram: "hilton" },
  hilton_surpass:   { currency: "Hilton Points", directProgram: "hilton" },
  hyatt_card:       { currency: "Hyatt Points", directProgram: "hyatt" },
  ihg_premier:      { currency: "IHG Points", directProgram: "ihg" },
  sw_priority:      { currency: "Rapid Rewards Points", directProgram: "sw" },
  atmos_summit:     { currency: "Atmos Points", directProgram: "atmos" },
};
// Expanded bonus categories — values are either a number (same direct & portal)
// or { d: directRate, p: portalRate } when portal booking earns a higher multiplier.
// Rates per each issuer's official benefits page as of early 2025.
const CC_BONUS_EXPANDED = {
  // Amex Platinum: 5x on flights booked directly with airlines OR via amextravel.com (no portal uplift for flights).
  // Hotels: 1x direct, 5x prepaid via Amex Travel portal.
  amex_plat:        { dining: 1, flights: 5, hotels: { d: 1, p: 5 }, groceries: 1, gas: 1, streaming: 1, rent: 0, other: 1 },
  // Amex Gold: 3x on flights booked directly with airlines OR via amextravel.com (same either way).
  amex_gold:        { dining: 4, flights: 3, hotels: 1, groceries: 4, gas: 1, streaming: 1, rent: 0, other: 1 },
  // Amex Green: 3x on travel & transit (flights, hotels, Uber, etc.) regardless of booking method.
  amex_green:       { dining: 3, flights: 3, hotels: 3, groceries: 1, gas: 3, streaming: 1, rent: 0, other: 1 },
  // Chase Sapphire Reserve: 3x direct travel & dining. Via Chase Travel portal: 8x flights, 10x hotels & cars.
  chase_sapphire:   { dining: 3, flights: { d: 3, p: 8 }, hotels: { d: 3, p: 10 }, groceries: 1, gas: 1, streaming: 1, rent: 0, other: 1 },
  // Chase Sapphire Preferred: 2x direct travel. Via Chase Travel: 5x flights & hotels.
  chase_sapphire_pref: { dining: 3, flights: { d: 2, p: 5 }, hotels: { d: 2, p: 5 }, groceries: 1, gas: 1, streaming: 3, rent: 0, other: 1 },
  // Capital One Venture X: 2x base. Via Capital One Travel portal: 5x flights, 10x hotels & car rentals.
  cap1_venturex:    { dining: 2, flights: { d: 2, p: 5 }, hotels: { d: 2, p: 10 }, groceries: 2, gas: 2, streaming: 2, rent: 2, other: 2 },
  // Capital One Venture (regular): 2x base everywhere. Via Capital One Travel: 5x hotels & cars only — flights stay 2x.
  cap1_venture:     { dining: 2, flights: 2, hotels: { d: 2, p: 5 }, groceries: 2, gas: 2, streaming: 2, rent: 2, other: 2 },
  // Citi Premier: flat 3x on flights, hotels, dining, groceries, gas. No issuer travel portal bonus.
  citi_premier:     { dining: 3, flights: 3, hotels: 3, groceries: 3, gas: 3, streaming: 1, rent: 0, other: 1 },
  // Bilt: 3x dining, 2x travel (flights & hotels), 1x rent & other. On Rent Day first of month: 6x/4x/2x.
  bilt:             { dining: 3, flights: 2, hotels: 2, groceries: 1, gas: 1, streaming: 1, rent: 1, other: 1 },
  // Delta Reserve Amex: 3x Delta purchases, 2x dining & U.S. supermarkets, 1x other. No hotel portal bonus.
  delta_reserve:    { dining: 2, flights: 3, hotels: 1, groceries: 2, gas: 1, streaming: 1, rent: 0, other: 1 },
  // Delta Gold Amex: 2x Delta & restaurants & U.S. supermarkets, 1x other.
  delta_gold:       { dining: 2, flights: 2, hotels: 1, groceries: 2, gas: 1, streaming: 1, rent: 0, other: 1 },
  // United Club Infinite: 4x United, 2x all other travel & dining, 1x other.
  united_club:      { dining: 2, flights: 4, hotels: 2, groceries: 1, gas: 1, streaming: 1, rent: 0, other: 1 },
  // United Explorer: 2x United, hotels & dining, 1x other.
  united_explorer:  { dining: 2, flights: 2, hotels: 2, groceries: 1, gas: 1, streaming: 1, rent: 0, other: 1 },
  // Citi AAdvantage Executive: 10x AA (includes base miles), 4x hotel & car, 1x other.
  aa_exec:          { dining: 1, flights: 4, hotels: 4, groceries: 1, gas: 1, streaming: 1, rent: 0, other: 1 },
  // Marriott Boundless: 6x Marriott hotels, 3x dining & gas, 2x everything else.
  marriott_boundless: { dining: 3, flights: 2, hotels: 6, groceries: 1, gas: 3, streaming: 1, rent: 0, other: 2 },
  // Hilton Aspire: 14x Hilton, 7x flights, dining & car rentals, 3x everything else.
  hilton_aspire:    { dining: 7, flights: 7, hotels: 14, groceries: 3, gas: 3, streaming: 3, rent: 0, other: 3 },
  // Hilton Surpass: 12x Hilton, 6x U.S. restaurants, groceries & gas, 3x everything else.
  hilton_surpass:   { dining: 6, flights: 3, hotels: 12, groceries: 6, gas: 6, streaming: 3, rent: 0, other: 3 },
  // World of Hyatt Card: 4x Hyatt, 2x dining, airline tickets & local transit, 1x other.
  hyatt_card:       { dining: 2, flights: 2, hotels: 4, groceries: 1, gas: 1, streaming: 1, rent: 0, other: 1 },
  // IHG Premier: 10x at IHG hotels (direct co-brand rate, no separate portal uplift), 2x dining & travel, 1x other.
  ihg_premier:      { dining: 2, flights: 2, hotels: 10, groceries: 1, gas: 1, streaming: 1, rent: 0, other: 1 },
  // Southwest Priority: 3x Southwest flights, 2x hotel & car rental partners & dining, 1x other.
  sw_priority:      { dining: 2, flights: 3, hotels: 2, groceries: 1, gas: 1, streaming: 1, rent: 0, other: 1 },
  // Alaska/Atmos Summit Visa Infinite: 3x Alaska & Hawaiian flights, 2x dining & gas, 1x other.
  atmos_summit:     { dining: 2, flights: 3, hotels: 1, groceries: 1, gas: 2, streaming: 1, rent: 0, other: 1 },
};
// Helper: resolve a bonus entry to a number given booking mode ("direct" or "portal")
const _ccRate = (entry, mode) => {
  if (typeof entry === "number") return entry;
  if (entry && typeof entry === "object") return mode === "portal" ? (entry.p || entry.d || 0) : (entry.d || 0);
  return 0;
};
const _ccHasPortalBonus = (entry) => typeof entry === "object" && entry.p > entry.d;

// ============================================================
// AIRLINE ALLIANCES DATA
// ============================================================
const ALLIANCE_MBR = {
  ua:           { alliance:"star",     color:"#002244", tierMap:{ Silver:"sa_silver", Gold:"sa_gold", Platinum:"sa_gold", "1K":"sa_gold" }},
  aeroplan:     { alliance:"star",     color:"#F01428", tierMap:{ "25K":"sa_silver","35K":"sa_gold","50K":"sa_gold","75K":"sa_gold","100K":"sa_gold" }},
  singapore_kf: { alliance:"star",     color:"#003876", tierMap:{ "Elite Silver":"sa_silver","Elite Gold":"sa_gold" }},
  turkish_miles:{ alliance:"star",     color:"#C8102E", tierMap:{ "Classic Plus":"sa_silver","Elite":"sa_gold","Elite Plus":"sa_gold" }},
  aa:           { alliance:"oneworld", color:"#0078D2", tierMap:{ Gold:"ow_ruby",Platinum:"ow_sapphire","Platinum Pro":"ow_sapphire","Executive Platinum":"ow_emerald" }},
  ba_avios:     { alliance:"oneworld", color:"#075AAA", tierMap:{ Bronze:"ow_ruby",Silver:"ow_sapphire",Gold:"ow_emerald" }},
  qantas_ff:    { alliance:"oneworld", color:"#E0001B", tierMap:{ Silver:"ow_ruby",Gold:"ow_sapphire",Platinum:"ow_emerald" }},
  cathay_mp:    { alliance:"oneworld", color:"#006564", tierMap:{ Silver:"ow_ruby",Gold:"ow_sapphire",Diamond:"ow_emerald" }},
  dl:           { alliance:"skyteam",  color:"#003366", tierMap:{ "Silver Medallion":"st_elite","Gold Medallion":"st_elite_plus","Platinum Medallion":"st_elite_plus","Diamond Medallion":"st_elite_plus" }},
  flying_blue:  { alliance:"skyteam",  color:"#002157", tierMap:{ Silver:"st_elite",Gold:"st_elite_plus",Platinum:"st_elite_plus",Ultimate:"st_elite_plus" }},
};
const ALLIANCE_LABELS = {
  star:"Star Alliance", oneworld:"Oneworld", skyteam:"SkyTeam",
};
const ALLIANCE_TIER_LABELS = {
  sa_silver:"Star Alliance Silver", sa_gold:"Star Alliance Gold",
  ow_ruby:"Oneworld Ruby", ow_sapphire:"Oneworld Sapphire", ow_emerald:"Oneworld Emerald",
  st_elite:"SkyTeam Elite", st_elite_plus:"SkyTeam Elite Plus",
};
const ALLIANCE_TIER_COLORS = {
  sa_silver:"#C0C0C0", sa_gold:"#C9A84C",
  ow_ruby:"#9B2335", ow_sapphire:"#0057A8", ow_emerald:"#006341",
  st_elite:"#00B0F0", st_elite_plus:"#004A97",
};

// Benefit row definitions
const BENEFIT_ROWS = [
  { id:"free_bags",      cat:"Baggage",              label:"Free Checked Bags",          sub:"Number of free pieces in economy" },
  { id:"bag_weight",     cat:"Baggage",              label:"Weight Per Bag",             sub:"kg / lbs max per piece" },
  { id:"car_seat",       cat:"Baggage",              label:"Child Car Seat",             sub:"Is a child safety seat free & uncounted?" },
  { id:"stroller",       cat:"Baggage",              label:"Stroller / Pram",            sub:"Collapsible stroller check-in policy" },
  { id:"ski_bag",        cat:"Baggage",              label:"Ski / Snowboard Bag",        sub:"Is ski or snowboard bag free or at reduced fee?" },
  { id:"golf_bag",       cat:"Baggage",              label:"Golf Bag",                   sub:"Golf equipment policy" },
  { id:"sport_equip",    cat:"Baggage",              label:"Oversized Sports Equipment", sub:"Bicycles, surfboards, etc." },
  { id:"overweight_fee", cat:"Baggage",              label:"Overweight Fee Waiver",      sub:"Is the overweight surcharge waived?" },
  { id:"checkin",        cat:"Check-in & Boarding",  label:"Priority Check-in",          sub:"Dedicated counter or business class lane" },
  { id:"security",       cat:"Check-in & Boarding",  label:"Priority Security",          sub:"Expedited security screening lane" },
  { id:"boarding",       cat:"Check-in & Boarding",  label:"Boarding Group",             sub:"When in the boarding sequence" },
  { id:"preboard",       cat:"Check-in & Boarding",  label:"Pre-Boarding",               sub:"Board before general boarding begins" },
  { id:"seat_sel",       cat:"Seating",              label:"Free Seat Selection",        sub:"Choose seat at booking at no charge" },
  { id:"exit_row",       cat:"Seating",              label:"Exit Row / Extra Legroom",   sub:"Complimentary access to exit row seats" },
  { id:"lounge",         cat:"Lounge",               label:"Lounge Access",              sub:"Partner lounge when flying in economy" },
  { id:"lounge_guest",   cat:"Lounge",               label:"Guest Lounge Pass",          sub:"Complimentary guest access" },
  { id:"priority_bags",  cat:"In-flight & Other",    label:"Priority Baggage Delivery",  sub:"Bags arrive on belt before other passengers" },
  { id:"upgrade",        cat:"In-flight & Other",    label:"Upgrade Eligibility",        sub:"Complimentary or discounted cabin upgrade" },
  { id:"miles_bonus",    cat:"In-flight & Other",    label:"Miles / Points Bonus",       sub:"Earning bonus % on base miles" },
  { id:"fee_waiver",     cat:"In-flight & Other",    label:"Change / Cancel Fee Waiver", sub:"Standard ticket modification fees waived" },
];

// b = {v: display, d: detail note, ok: true = positive highlight}
const _b = (v, d, ok) => ({ v, d, ok: !!ok });

// Home airline benefits: HOME_BENEFITS[programId][tierName][rowId]
const HOME_BENEFITS = {
  aa: {
    Gold: {
      free_bags:_b("1 free","1st bag free on domestic US flights"),
      bag_weight:_b("23 kg / 50 lbs","Standard economy weight per piece"),
      car_seat:_b("Free – uncounted","Car seat does not count toward allowance",true),
      stroller:_b("Free","Gate-check or check-in, free of charge",true),
      ski_bag:_b("Counts as bag","Uses 1 free piece if within 23 kg / 50 lbs"),
      golf_bag:_b("Counts as bag","Uses 1 free piece if within weight"),
      sport_equip:_b("Fees apply","Oversized items ~$150+ per leg"),
      overweight_fee:_b("Not waived","Overweight/oversize fees still apply"),
      checkin:_b("Priority counter","Dedicated priority check-in lane",true),
      security:_b("Priority lane","Priority security at most AA hubs",true),
      boarding:_b("Group 4","Boards in Group 4, after ExPlat, Plat Pro, and Platinum"),
      preboard:_b("No","No pre-boarding; Group 4 is after general elite groups"),
      seat_sel:_b("Yes","Free preferred seat selection at booking",true),
      exit_row:_b("Yes – MCE","Free Main Cabin Extra seats incl. exit rows",true),
      lounge:_b("No","No Admiral's Club in economy ticket"),
      lounge_guest:_b("No","N/A"),
      priority_bags:_b("Yes","Priority baggage tag, arrives first",true),
      upgrade:_b("Comp. upgrades","Complimentary upgrades to F on AA metal",true),
      miles_bonus:_b("40% bonus","40% bonus on Loyalty Points earned",true),
      fee_waiver:_b("Yes","Same-day flight changes free",true),
    },
    Platinum: {
      free_bags:_b("2 free","1st & 2nd bag free",true),
      bag_weight:_b("23 kg / 50 lbs","Standard economy weight"),
      car_seat:_b("Free – uncounted","Does not count toward allowance",true),
      stroller:_b("Free","Gate or check-in, free",true),
      ski_bag:_b("Counts as bag","Uses 1 of your 2 free pieces"),
      golf_bag:_b("Counts as bag","Uses 1 of your 2 free pieces"),
      sport_equip:_b("Fees apply","~$150+ per leg"),
      overweight_fee:_b("Not waived","Oversize/overweight fees still apply"),
      checkin:_b("Priority counter","Dedicated priority counter",true),
      security:_b("Priority + Flagship","Flagship Access lanes at key hubs",true),
      boarding:_b("Group 3","Boards in Group 3, after Executive Platinum and Platinum Pro",true),
      preboard:_b("Yes","Boards before general cabin groups",true),
      seat_sel:_b("Yes","Free preferred seat at booking",true),
      exit_row:_b("Yes – MCE","Free Main Cabin Extra + exit rows",true),
      lounge:_b("No","No Admiral's Club (must buy or use credit card benefit)"),
      lounge_guest:_b("No","N/A"),
      priority_bags:_b("Yes","Priority baggage, arrives first",true),
      upgrade:_b("Comp. upgrades","Higher priority than Gold; system upgrades",true),
      miles_bonus:_b("60% bonus","60% bonus on Loyalty Points earned",true),
      fee_waiver:_b("Yes","Same-day standby free; standard fee waivers",true),
    },
    "Platinum Pro": {
      free_bags:_b("2 free","1st & 2nd bag free",true),
      bag_weight:_b("32 kg / 70 lbs","Upgraded weight allowance",true),
      car_seat:_b("Free – uncounted","Does not count toward allowance",true),
      stroller:_b("Free","Gate or check-in, free",true),
      ski_bag:_b("Free","Within 32 kg / 70 lbs weight limit",true),
      golf_bag:_b("Free","Within weight limit",true),
      sport_equip:_b("Often waived","Most standard sports equipment fees waived",true),
      overweight_fee:_b("Waived ≤70 lbs","Overweight fee waived up to 70 lbs",true),
      checkin:_b("Flagship check-in","Flagship First check-in at hubs",true),
      security:_b("Flagship Access","Dedicated Flagship Access lanes at hubs",true),
      boarding:_b("Group 2","Boards in Group 2, after Executive Platinum only",true),
      preboard:_b("Yes","Boards well ahead of general cabin groups",true),
      seat_sel:_b("Yes – full","Full seat selection incl. MCE",true),
      exit_row:_b("Yes – MCE","All MCE and exit row seats free",true),
      lounge:_b("No","No Admiral's Club with economy ticket"),
      lounge_guest:_b("No","N/A"),
      priority_bags:_b("Yes","Priority baggage, first off belt",true),
      upgrade:_b("Priority upgrades","Higher priority; instant upgrades on select fares",true),
      miles_bonus:_b("80% bonus","80% bonus on Loyalty Points",true),
      fee_waiver:_b("Full waiver","All standard change/cancel fees waived",true),
    },
    "Executive Platinum": {
      free_bags:_b("3 free","1st, 2nd & 3rd bag free",true),
      bag_weight:_b("32 kg / 70 lbs","Per bag",true),
      car_seat:_b("Free – uncounted","Does not count toward allowance",true),
      stroller:_b("Free","Gate or check-in, free",true),
      ski_bag:_b("Free","Free within 32 kg / 70 lbs",true),
      golf_bag:_b("Free","Free within weight limit",true),
      sport_equip:_b("Waived","Standard sports equipment fees waived",true),
      overweight_fee:_b("Waived ≤70 lbs","Overweight fee waived to 70 lbs",true),
      checkin:_b("Flagship First","Flagship First check-in line at all AA hubs",true),
      security:_b("Flagship Access","Dedicated lanes at all AA hubs",true),
      boarding:_b("Group 1 (first)","First among Group 1 after F/J pre-board",true),
      preboard:_b("Yes","Boards with First Class cabin",true),
      seat_sel:_b("Yes – full","Any seat incl. premium on upgrade",true),
      exit_row:_b("Yes – all MCE","All MCE & exit rows free at booking",true),
      lounge:_b("Flagship Lounge (SWU)","Access via Systemwide Upgrade cert.",true),
      lounge_guest:_b("With upgrade","Lounge access accompanies SWU upgrade"),
      priority_bags:_b("Yes – first off","First class priority baggage delivery",true),
      upgrade:_b("Systemwide upgrades","SWUs to Business/Flagship on most itineraries",true),
      miles_bonus:_b("120% bonus","120% bonus on Loyalty Points",true),
      fee_waiver:_b("Full waiver","All fees waived; last-seat award access",true),
    },
  },
  dl: {
    "Silver Medallion": {
      free_bags:_b("1 free","1st bag free"),
      bag_weight:_b("23 kg / 50 lbs","Standard economy weight"),
      car_seat:_b("Free – uncounted","Does not count toward allowance",true),
      stroller:_b("Free","Gate or check-in, free",true),
      ski_bag:_b("Counts as bag","Uses 1 free piece if within weight"),
      golf_bag:_b("Counts as bag","Uses 1 free piece"),
      sport_equip:_b("Fees apply","~$150+ per leg"),
      overweight_fee:_b("Not waived","Oversize/overweight fees apply"),
      checkin:_b("Priority counter","Priority check-in access",true),
      security:_b("Priority lane","Priority security at most hubs",true),
      boarding:_b("Zone 1","Boards after First/Delta One",true),
      preboard:_b("Yes","Pre-boards before general zones",true),
      seat_sel:_b("Yes – Comfort+","Free Comfort+ seat selection",true),
      exit_row:_b("Yes – Comfort+","Exit row Comfort+ seats included",true),
      lounge:_b("No","No Sky Club access in economy"),
      lounge_guest:_b("No","N/A"),
      priority_bags:_b("Yes","Priority baggage tag",true),
      upgrade:_b("Waitlist","Upgrade waitlist for Comfort+ / First",true),
      miles_bonus:_b("40% bonus","40% bonus on base MQMs",true),
      fee_waiver:_b("Yes","Same-day standby changes free",true),
    },
    "Gold Medallion": {
      free_bags:_b("2 free","1st & 2nd bag free",true),
      bag_weight:_b("23 kg / 50 lbs","Standard economy weight"),
      car_seat:_b("Free – uncounted","Does not count toward allowance",true),
      stroller:_b("Free","Gate or check-in, free",true),
      ski_bag:_b("Counts as bag","Uses 1 of your free pieces"),
      golf_bag:_b("Counts as bag","Uses 1 of your free pieces"),
      sport_equip:_b("Fees apply","~$150+ per leg"),
      overweight_fee:_b("Not waived","Oversize fees still apply"),
      checkin:_b("Priority counter","Priority check-in with Delta",true),
      security:_b("Priority lane","Priority security lane",true),
      boarding:_b("Zone 1 (early)","First Zone 1 boarders with Medallion priority",true),
      preboard:_b("Yes","Pre-boarding before Zone 1 opens",true),
      seat_sel:_b("Yes – Comfort+","Free Comfort+ at booking",true),
      exit_row:_b("Yes – Comfort+","Free Comfort+ exit rows",true),
      lounge:_b("No","No Sky Club without card/upgrade benefit"),
      lounge_guest:_b("No","N/A"),
      priority_bags:_b("Yes","Priority tag, arrives first",true),
      upgrade:_b("Comp. upgrades","Complimentary upgrades to First Class",true),
      miles_bonus:_b("60% bonus","60% bonus MQMs",true),
      fee_waiver:_b("Yes","Same-day confirmed changes free",true),
    },
    "Platinum Medallion": {
      free_bags:_b("2 free","1st & 2nd bag free",true),
      bag_weight:_b("32 kg / 70 lbs","Upgraded weight",true),
      car_seat:_b("Free – uncounted","Does not count toward allowance",true),
      stroller:_b("Free","Gate or check-in, free",true),
      ski_bag:_b("Free","Free within 32 kg / 70 lbs",true),
      golf_bag:_b("Free","Free within weight allowance",true),
      sport_equip:_b("Often waived","Standard sports equipment fees reduced/waived",true),
      overweight_fee:_b("Waived ≤70 lbs","Overweight waived up to 70 lbs",true),
      checkin:_b("Priority counter","Priority check-in and kiosk",true),
      security:_b("Priority lane","Delta Premium Select security lanes",true),
      boarding:_b("Zone 1 (priority)","First Zone 1 boarding call",true),
      preboard:_b("Yes","Boards with DL One at select airports"),
      seat_sel:_b("Yes – Comfort+","Free Comfort+ & preferred seats",true),
      exit_row:_b("Yes – Comfort+","Full Comfort+ incl. exit rows",true),
      lounge:_b("Choice Benefit","Sky Club access selectable as Platinum Choice Benefit"),
      lounge_guest:_b("With benefit","If Sky Club benefit is chosen"),
      priority_bags:_b("Yes","Priority baggage, first off belt",true),
      upgrade:_b("Comp. upgrades","Complimentary upgrades, higher priority",true),
      miles_bonus:_b("80% bonus","80% bonus MQMs",true),
      fee_waiver:_b("Yes","All standard fees waived",true),
    },
    "Diamond Medallion": {
      free_bags:_b("3 free","1st, 2nd & 3rd bag free",true),
      bag_weight:_b("32 kg / 70 lbs","Per bag",true),
      car_seat:_b("Free – uncounted","Does not count toward allowance",true),
      stroller:_b("Free","Gate or check-in, free",true),
      ski_bag:_b("Free","Free within 32 kg / 70 lbs",true),
      golf_bag:_b("Free","Free within weight allowance",true),
      sport_equip:_b("Waived","Sports equipment fees waived",true),
      overweight_fee:_b("Waived ≤70 lbs","Overweight waived to 70 lbs",true),
      checkin:_b("Dedicated counter","Diamond counter at major hubs",true),
      security:_b("Fastest lane","Dedicated fastest lanes at all Delta hubs",true),
      boarding:_b("Zone 1 (first)","First Diamond boarding call",true),
      preboard:_b("Yes","Boards with Delta One/First Class cabin",true),
      seat_sel:_b("Yes – full","Any seat incl. Delta One on upgrade",true),
      exit_row:_b("Yes – full","All premium seats access",true),
      lounge:_b("Sky Club included","Complimentary Sky Club + Delta One Lounge",true),
      lounge_guest:_b("3 guest passes/yr","Annual Sky Club guest passes",true),
      priority_bags:_b("Yes – first off","Diamond priority tag, first off belt",true),
      upgrade:_b("Global Upgrade Certs","Delta One GUCs included annually",true),
      miles_bonus:_b("120% bonus","120% bonus MQMs",true),
      fee_waiver:_b("Full waiver","All fees waived; confirmed same-day changes",true),
    },
  },
  ua: {
    Silver: {
      free_bags:_b("1 free","1st bag free"),
      bag_weight:_b("23 kg / 50 lbs","Standard economy weight"),
      car_seat:_b("Free – uncounted","Does not count toward allowance",true),
      stroller:_b("Free","Gate or check-in, free",true),
      ski_bag:_b("Counts as bag","Uses 1 free piece"),
      golf_bag:_b("Counts as bag","Uses 1 free piece"),
      sport_equip:_b("Fees apply","Oversized/overweight fees apply"),
      overweight_fee:_b("Not waived","Oversize fees still apply"),
      checkin:_b("Priority counter","Priority check-in counter",true),
      security:_b("Premier Access lane","At most United airports",true),
      boarding:_b("Group 2","Boards after Group 1 Premier Access"),
      preboard:_b("Yes","Before general boarding groups",true),
      seat_sel:_b("At T−48h","Economy Plus at 48-hour check-in window",true),
      exit_row:_b("At T−48h","Economy Plus exit rows at T-48h"),
      lounge:_b("No","No United Club in economy"),
      lounge_guest:_b("No","N/A"),
      priority_bags:_b("Yes","Premier priority baggage",true),
      upgrade:_b("Waitlist","Complimentary space-available upgrades waitlist"),
      miles_bonus:_b("0%","No bonus miles for Silver"),
      fee_waiver:_b("Partial","Award ticket change fee waived"),
    },
    Gold: {
      free_bags:_b("2 free","1st & 2nd bag free",true),
      bag_weight:_b("23 kg / 50 lbs","Standard economy weight"),
      car_seat:_b("Free – uncounted","Does not count toward allowance",true),
      stroller:_b("Free","Gate or check-in, free",true),
      ski_bag:_b("Counts as bag","Uses 1 of your free pieces"),
      golf_bag:_b("Counts as bag","Uses 1 of your free pieces"),
      sport_equip:_b("Fees apply","Oversized/overweight fees apply"),
      overweight_fee:_b("Not waived","Oversize fees apply"),
      checkin:_b("Premier Access","Premier Access counter",true),
      security:_b("Premier Access","Premier Access lane at all airports",true),
      boarding:_b("Group 2","Premier Access boarding group"),
      preboard:_b("Yes","Premier Access pre-boarding",true),
      seat_sel:_b("Yes","Economy Plus free at booking",true),
      exit_row:_b("Yes","Economy Plus exit rows at booking",true),
      lounge:_b("No","No United Club without card benefit"),
      lounge_guest:_b("No","N/A"),
      priority_bags:_b("Yes","Premier priority baggage handling",true),
      upgrade:_b("Comp. upgrades","Complimentary space-available upgrades on UA metal",true),
      miles_bonus:_b("25% bonus","25% bonus PQPs",true),
      fee_waiver:_b("Yes","Standard ticket change fees waived",true),
    },
    Platinum: {
      free_bags:_b("2 free","1st & 2nd bag free",true),
      bag_weight:_b("32 kg / 70 lbs","Upgraded weight",true),
      car_seat:_b("Free – uncounted","Does not count toward allowance",true),
      stroller:_b("Free","Gate or check-in, free",true),
      ski_bag:_b("Free","Within 32 kg / 70 lbs",true),
      golf_bag:_b("Free","Within weight limit",true),
      sport_equip:_b("Often waived","Standard sports fees frequently waived",true),
      overweight_fee:_b("Waived ≤70 lbs","Overweight waived to 70 lbs",true),
      checkin:_b("Premier Access","Premier Access counter",true),
      security:_b("Premier Access + Pre✓","Premier Access + TSA PreCheck lanes",true),
      boarding:_b("Group 1","First Group 1 Premier boarding",true),
      preboard:_b("Yes","Pre-board with Polaris at some airports"),
      seat_sel:_b("Yes","Economy Plus at booking",true),
      exit_row:_b("Yes","Economy Plus + UPP access when space avail"),
      lounge:_b("2 passes/yr","2 United Club one-time passes per year"),
      lounge_guest:_b("No","Passes are for member only"),
      priority_bags:_b("Yes","Priority baggage, first off belt",true),
      upgrade:_b("Comp. + 2 GPUs","Comp. upgrades + 2 Global Premier Upgrades/yr",true),
      miles_bonus:_b("50% bonus","50% bonus PQPs",true),
      fee_waiver:_b("Yes","All standard ticket fees waived",true),
    },
    "1K": {
      free_bags:_b("3 free","1st, 2nd & 3rd bag free",true),
      bag_weight:_b("32 kg / 70 lbs","Per bag",true),
      car_seat:_b("Free – uncounted","Does not count toward allowance",true),
      stroller:_b("Free","Gate or check-in, free",true),
      ski_bag:_b("Free","Within weight allowance",true),
      golf_bag:_b("Free","Within weight allowance",true),
      sport_equip:_b("Waived","Standard sports equipment fees waived",true),
      overweight_fee:_b("Waived ≤70 lbs","Overweight waived to 70 lbs",true),
      checkin:_b("Dedicated 1K counter","Dedicated 1K counter at all United airports",true),
      security:_b("Fastest lanes","Premier Access + dedicated 1K security lanes",true),
      boarding:_b("Group 1 (first)","First 1K boarding, before other Premiers",true),
      preboard:_b("Yes","Boards with Polaris cabin passengers",true),
      seat_sel:_b("Yes – full","Economy Plus + Polaris on upgrade",true),
      exit_row:_b("Yes","Full Economy Plus at booking",true),
      lounge:_b("United Club member","Complimentary United Club membership",true),
      lounge_guest:_b("2 guests/visit","2 comp. United Club guest passes per visit",true),
      priority_bags:_b("Yes – first off","Premier 1K priority, first off belt",true),
      upgrade:_b("PlusPoints + GPUs","PlusPoints for confirmed Polaris + GPUs",true),
      miles_bonus:_b("100% bonus","100% bonus PQPs (double earn)",true),
      fee_waiver:_b("Full waiver","All fees waived; last-seat partner award access",true),
    },
  },
};

// Reciprocal benefits received as a visiting elite at any partner airline
const RECIP_BENEFITS = {
  sa_silver: {
    free_bags:_b("1 free bag","1 checked bag free; standard economy weight limit",true),
    bag_weight:_b("23 kg / 50 lbs","Standard economy weight"),
    car_seat:_b("Per carrier policy","Typically free; verify with operating carrier"),
    stroller:_b("Free","Most SA carriers allow 1 stroller free",true),
    ski_bag:_b("Counts as free bag","Uses your 1 free bag allowance"),
    golf_bag:_b("Counts as free bag","Uses your 1 free bag allowance"),
    sport_equip:_b("Fees apply","Alliance status does not waive sports equipment fees"),
    overweight_fee:_b("Not waived","Standard oversize/overweight fees apply"),
    checkin:_b("Priority counter","Priority check-in at all SA partner airports",true),
    security:_b("Where available","Priority security where partner offers the lane"),
    boarding:_b("Priority boarding","Board before general passengers",true),
    preboard:_b("Yes","Priority boarding ahead of general zones",true),
    seat_sel:_b("Partner policy","Varies by operating carrier"),
    exit_row:_b("No guarantee","Exit row at partner's discretion"),
    lounge:_b("No","Lounge access not included for SA Silver"),
    lounge_guest:_b("No","N/A"),
    priority_bags:_b("No","Priority baggage not included for SA Silver"),
    upgrade:_b("No","Comp. upgrades not included"),
    miles_bonus:_b("Per partner chart","Per partner's published elite earning rates"),
    fee_waiver:_b("No","Fee waivers not part of SA Silver reciprocal benefits"),
  },
  sa_gold: {
    free_bags:_b("1 free bag","1 checked bag at business-class weight limit",true),
    bag_weight:_b("Up to 32 kg / 70 lbs","Business class weight allowance",true),
    car_seat:_b("Per carrier policy","Typically free; verify with operating carrier"),
    stroller:_b("Free","Most SA carriers allow stroller free",true),
    ski_bag:_b("Varies by carrier","May count as your free bag; confirm with carrier"),
    golf_bag:_b("Varies by carrier","May count as your free bag; confirm with carrier"),
    sport_equip:_b("Fees usually apply","Not universally waived by alliance status"),
    overweight_fee:_b("Waived ≤70 lbs","Overweight waived within business-class weight",true),
    checkin:_b("Business class counter","Business class check-in at all SA partners",true),
    security:_b("Priority lane","Priority security at most SA partner airports",true),
    boarding:_b("Priority – first group","Typically first boarding group",true),
    preboard:_b("Yes","Pre-boards ahead of general boarding",true),
    seat_sel:_b("Many partners offer","Premium seat selection at many SA Gold partners"),
    exit_row:_b("Varies by partner","Exit row at partner's discretion"),
    lounge:_b("Business class lounge","Business class lounge access at partner airports",true),
    lounge_guest:_b("No","Guest not typically included for visiting SA Gold"),
    priority_bags:_b("Yes","Priority baggage delivery at most SA partners",true),
    upgrade:_b("No","Complimentary upgrades not included for visiting SA Gold"),
    miles_bonus:_b("Per partner chart","Per partner's published SA Gold earning rates"),
    fee_waiver:_b("No","Fee waivers not part of SA Gold reciprocal benefits"),
  },
  ow_ruby: {
    free_bags:_b("1 free bag","1 checked bag free; standard economy weight limit",true),
    bag_weight:_b("23 kg / 50 lbs","Standard economy weight"),
    car_seat:_b("Per carrier policy","Most oneworld carriers allow car seat free"),
    stroller:_b("Free","Stroller/pram free at all oneworld carriers",true),
    ski_bag:_b("Counts as free bag","Uses your 1 free bag allowance"),
    golf_bag:_b("Counts as free bag","Uses your 1 free bag allowance"),
    sport_equip:_b("Fees apply","Not waived as Ruby"),
    overweight_fee:_b("Not waived","Standard fees apply"),
    checkin:_b("Priority counter","Priority check-in at oneworld partner airports",true),
    security:_b("Where available","Priority security where partner provides lane"),
    boarding:_b("Priority boarding","Board before general passengers",true),
    preboard:_b("Yes","Priority boarding ahead of general boarding",true),
    seat_sel:_b("Partner policy","Varies by partner airline"),
    exit_row:_b("No guarantee","At partner's discretion"),
    lounge:_b("No","No lounge access as Ruby visiting elite"),
    lounge_guest:_b("No","N/A"),
    priority_bags:_b("No","Priority bags not included for Ruby"),
    upgrade:_b("No","Not included"),
    miles_bonus:_b("Per partner chart","Per partner's published Ruby earning rates"),
    fee_waiver:_b("No","Not included"),
  },
  ow_sapphire: {
    free_bags:_b("2 free bags","Business class baggage allowance: 2 bags at 32 kg each",true),
    bag_weight:_b("32 kg / 70 lbs","Business class weight per bag",true),
    car_seat:_b("Per carrier policy","Most oneworld carriers allow car seat free"),
    stroller:_b("Free","Stroller free at all oneworld carriers",true),
    ski_bag:_b("Varies by partner","May count as 1 of your 2 free bags; confirm with carrier"),
    golf_bag:_b("Varies by partner","May count as 1 of your 2 free bags; confirm with carrier"),
    sport_equip:_b("Varies by carrier","Some Sapphire carriers waive standard sports fees"),
    overweight_fee:_b("Waived ≤70 lbs","Overweight waived within business-class weight",true),
    checkin:_b("Business class counter","Business class check-in at all OW partners",true),
    security:_b("Priority lane","Priority security at most oneworld airports",true),
    boarding:_b("Early priority group","Early priority boarding group",true),
    preboard:_b("Yes","Pre-boards ahead of general boarding",true),
    seat_sel:_b("Many partners","Preferred seats at many OW partners at no charge"),
    exit_row:_b("Many partners","Exit row / premium economy at some partners"),
    lounge:_b("Business lounge + 1 guest","Business class lounge access + 1 guest",true),
    lounge_guest:_b("1 guest","1 accompanying guest admitted to business lounge",true),
    priority_bags:_b("Yes","Priority baggage delivery at most OW partners",true),
    upgrade:_b("No","Not included for visiting Sapphire"),
    miles_bonus:_b("Per partner chart","Per partner's published Sapphire earning rates"),
    fee_waiver:_b("No","Not typically included for visiting Sapphire"),
  },
  ow_emerald: {
    free_bags:_b("3 free bags","First/Business class allowance: 3 bags at 32 kg each",true),
    bag_weight:_b("32 kg / 70 lbs","First/Business class weight per bag",true),
    car_seat:_b("Free – uncounted","Car seat free, does not count against allowance",true),
    stroller:_b("Free","Stroller free, does not count against allowance",true),
    ski_bag:_b("Counts as 1 bag","Uses 1 of your 3 free bags (within weight limit)"),
    golf_bag:_b("Counts as 1 bag","Uses 1 of your 3 free bags (within weight limit)"),
    sport_equip:_b("Often waived","Standard sports fees frequently waived at Emerald level",true),
    overweight_fee:_b("Waived ≤70 lbs","Overweight waived within First/Business weight",true),
    checkin:_b("First class counter","First class check-in counter at all OW partners",true),
    security:_b("Priority lane","Priority security at all OW partner airports",true),
    boarding:_b("First to board","Boards immediately after special needs passengers",true),
    preboard:_b("Yes – First class","Boards with First Class cabin passengers",true),
    seat_sel:_b("Yes","Premium economy / preferred seats free; F/J on upgrade",true),
    exit_row:_b("Yes","Complimentary preferred & exit row seats",true),
    lounge:_b("First class lounges + 1 guest","Access to First & business lounges + 1 guest",true),
    lounge_guest:_b("1 guest","1 accompanying guest to First class lounge",true),
    priority_bags:_b("Yes – first off","Priority baggage at all OW partners",true),
    upgrade:_b("Varies by partner","Some OW partners offer comp. upgrades to Emerald elites"),
    miles_bonus:_b("Per partner chart","Top-tier earning rates at all OW partners"),
    fee_waiver:_b("Many partners","Many OW partners waive standard fees for Emerald",true),
  },
  st_elite: {
    free_bags:_b("1 free bag","1 checked bag free; standard economy weight limit",true),
    bag_weight:_b("23 kg / 50 lbs","Standard economy weight"),
    car_seat:_b("Per carrier policy","Typically free at most SkyTeam carriers"),
    stroller:_b("Free","Stroller free at most SkyTeam carriers",true),
    ski_bag:_b("Counts as free bag","Uses your 1 free bag allowance"),
    golf_bag:_b("Counts as free bag","Uses your 1 free bag allowance"),
    sport_equip:_b("Fees apply","Sports equipment fees not waived"),
    overweight_fee:_b("Not waived","Standard oversize fees apply"),
    checkin:_b("Priority counter","Priority check-in at SkyTeam partner airports",true),
    security:_b("Where available","Where partner airline provides priority lane"),
    boarding:_b("Priority boarding","Board before general passengers",true),
    preboard:_b("Yes","Priority boarding",true),
    seat_sel:_b("Partner policy","Varies by partner"),
    exit_row:_b("No guarantee","At partner's discretion"),
    lounge:_b("No","No lounge access as SkyTeam Elite"),
    lounge_guest:_b("No","N/A"),
    priority_bags:_b("No","Not included for SkyTeam Elite"),
    upgrade:_b("No","Not included"),
    miles_bonus:_b("Per partner chart","Per partner's published elite earning chart"),
    fee_waiver:_b("No","Not included"),
  },
  st_elite_plus: {
    free_bags:_b("2 free bags","Business class allowance: 2 bags at 32 kg each",true),
    bag_weight:_b("32 kg / 70 lbs","Business class weight per bag",true),
    car_seat:_b("Per carrier policy","Typically free; verify with carrier"),
    stroller:_b("Free","Stroller free at all SkyTeam carriers",true),
    ski_bag:_b("Varies by carrier","May count as 1 of your 2 free bags; confirm with carrier"),
    golf_bag:_b("Varies by carrier","May count as 1 of your 2 free bags; confirm with carrier"),
    sport_equip:_b("Varies by carrier","Some Elite Plus carriers waive sports fees"),
    overweight_fee:_b("Waived ≤70 lbs","Overweight waived within business-class weight",true),
    checkin:_b("Business class counter","Business class check-in at all ST partners",true),
    security:_b("Priority lane","Priority security at most SkyTeam airports",true),
    boarding:_b("Early priority group","Early priority boarding group",true),
    preboard:_b("Yes","Pre-boards ahead of general boarding",true),
    seat_sel:_b("Many partners","Preferred/extra legroom seats at many ST partners"),
    exit_row:_b("Many partners","Exit row at some SkyTeam partners"),
    lounge:_b("Business lounge + 1 guest","Business class lounge + 1 guest at ST partners",true),
    lounge_guest:_b("1 guest","1 accompanying guest to business lounge",true),
    priority_bags:_b("Yes","Priority baggage at SkyTeam partners",true),
    upgrade:_b("No","Not universally included"),
    miles_bonus:_b("Per partner chart","Per partner's published Elite Plus earning rates"),
    fee_waiver:_b("Some partners","Fee waivers at select SkyTeam partners"),
  },
};

const SAMPLE_USER = {
  name: "Nicholas Li",
  email: "alex@example.com",
  avatar: "NL",
  tier: "premium",
  linkedAccounts: {
    aa: { memberId: "****4829", currentPoints: 68500, tierCredits: 68500 },
    dl: { memberId: "****7712", currentPoints: 32000, tierCredits: 32000 },
    ua: { memberId: "****2201", currentPoints: 18, tierCredits: 4200 },
    marriott: { memberId: "****5590", currentNights: 38, bonvoyPoints: 142000 },
    hilton: { memberId: "****3301", currentNights: 22, hhPoints: 98000 },
    ihg: { memberId: "****9102", currentNights: 8, ihgPoints: 41000 },
    hertz: { memberId: "****6610", currentRentals: 6 },
    national: { memberId: "****4455", currentRentals: 3 },
    amex_plat: { last4: "1234", pointsBalance: 145000 },
    chase_sapphire: { last4: "5678", pointsBalance: 88000 },
  },
  upcomingTrips: [
    { id: 1, type: "flight", program: "aa", route: "JFK → LAX", date: "2026-03-15", class: "premium", estimatedPoints: 4200, status: "confirmed", tripName: "LA Business Trip" },
    { id: 2, type: "hotel", program: "marriott", property: "JW Marriott LA Live", date: "2026-03-15", nights: 3, estimatedNights: 3, status: "confirmed", tripName: "LA Business Trip" },
    { id: 3, type: "flight", program: "dl", route: "LAX → ATL", date: "2026-03-18", class: "domestic", estimatedPoints: 2800, status: "confirmed", tripName: "Atlanta Connecting" },
    { id: 4, type: "flight", program: "aa", route: "DFW → LHR", date: "2026-04-10", class: "international", estimatedPoints: 9200, status: "planned", tripName: "London Spring Getaway" },
    { id: 5, type: "hotel", program: "hilton", property: "Waldorf Astoria London", date: "2026-04-10", nights: 5, estimatedNights: 5, status: "planned", tripName: "London Spring Getaway" },
    { id: 6, type: "rental", program: "hertz", location: "London Heathrow", date: "2026-04-10", days: 3, estimatedRentals: 1, status: "planned", tripName: "London Spring Getaway" },
    { id: 7, type: "flight", program: "ua", route: "SFO → NRT", date: "2026-06-20", class: "premium", estimatedPoints: 8800, status: "planned", tripName: "Tokyo Anniversary" },
    { id: 8, type: "hotel", program: "marriott", property: "Ritz-Carlton Tokyo", date: "2026-06-20", nights: 7, estimatedNights: 7, status: "planned", tripName: "Tokyo Anniversary" },
    { id: 9, type: "flight", program: "dl", route: "JFK → CDG", date: "2026-08-05", class: "international", estimatedPoints: 7500, status: "wishlist", tripName: "Paris Summer Dream" },
    { id: 10, type: "hotel", program: "ihg", property: "InterContinental Paris", date: "2026-08-05", nights: 4, estimatedNights: 4, status: "wishlist", tripName: "Paris Summer Dream" },
  ],
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CREDIT_CARD_OFFERS = [
  { name: "Amex Platinum", bonus: "150,000 pts", spend: "$6k/6mo", fee: "$695/yr", color: "#B4B4B4", tags: ["Best for Lounges", "Hotel Status"] },
  { name: "Chase Sapphire Reserve", bonus: "60,000 pts", spend: "$4k/3mo", fee: "$550/yr", color: "#004977", tags: ["Best for Dining", "Travel Credit"] },
  { name: "Capital One Venture X", bonus: "75,000 mi", spend: "$4k/3mo", fee: "$395/yr", color: "#D03027", tags: ["Best Value", "Transfer Partners"] },
  { name: "Citi AAdvantage Exec", bonus: "70,000 mi", spend: "$7k/4mo", fee: "$595/yr", color: "#003B70", tags: ["AA Loyalty", "Admirals Club"] },
  { name: "Delta Reserve Amex", bonus: "90,000 mi", spend: "$6k/6mo", fee: "$650/yr", color: "#003366", tags: ["Delta Sky Club", "Companion Cert"] },
];

// ============================================================
// INSIGHTS DATA
// ============================================================
const EXPIRATION_RULES = {
  aa:               { months: 18, note: "Any earning or redemption activity resets the clock", neverExpire: false },
  dl:               { months: 0,  note: "SkyMiles never expire", neverExpire: true },
  ua:               { months: 18, note: "Account activity (earning or redeeming) resets clock", neverExpire: false },
  sw:               { months: 24, note: "Any Rapid Rewards activity resets the clock", neverExpire: false },
  b6:               { months: 12, note: "Any TrueBlue earning or redemption activity", neverExpire: false },
  atmos:            { months: 24, note: "Any earning or redemption activity", neverExpire: false },
  flying_blue:      { months: 24, note: "Any earning or redemption activity", neverExpire: false },
  ba_avios:         { months: 36, note: "Any Avios activity in the account within 36 months", neverExpire: false },
  aeroplan:         { months: 12, note: "Any earning or redemption activity", neverExpire: false },
  singapore_kf:     { months: 36, note: "Miles expire 3 years from date earned", neverExpire: false },
  emirates_skywards:{ months: 36, note: "Miles expire after 3 years of inactivity", neverExpire: false },
  marriott:         { months: 24, note: "Any qualifying stay or points-earning activity", neverExpire: false },
  hilton:           { months: 24, note: "Any qualifying earning or redemption activity", neverExpire: false },
  ihg:              { months: 12, note: "Any points-earning or redemption activity", neverExpire: false },
  hyatt:            { months: 24, note: "Any qualifying activity (stay, purchase, transfer)", neverExpire: false },
  amex_plat:        { months: 0,  note: "Points never expire while card is open", neverExpire: true },
  amex_gold:        { months: 0,  note: "Points never expire while card is open", neverExpire: true },
  chase_sapphire:   { months: 0,  note: "Points never expire while card is open", neverExpire: true },
  chase_sapphire_pref: { months: 0, note: "Points never expire while card is open", neverExpire: true },
  cap1_venturex:    { months: 0,  note: "Miles never expire while card is open", neverExpire: true },
  bilt:             { months: 0,  note: "Points never expire while card is open", neverExpire: true },
};

const REDEMPTION_VALUES = {
  aa:             { cpp: 1.5, best: "Business/First class intl awards via partner airlines (Cathay, JAL)", avoid: "Short domestic economy (dynamic pricing)", partners: ["ba_avios","cathay_mp","aeroplan","singapore_kf"] },
  dl:             { cpp: 1.2, best: "Delta One transcontinental, select partner awards", avoid: "Last-minute domestic (heavily inflated pricing)", partners: ["flying_blue","virgin_fc","korean_air"] },
  ua:             { cpp: 1.5, best: "Star Alliance Saver awards (ANA, Singapore, Lufthansa)", avoid: "United revenue redemptions at face value", partners: ["singapore_kf","aeroplan","turkish_miles"] },
  sw:             { cpp: 1.5, best: "Business Select fares, Companion Pass activation travel", avoid: "Wanna Get Away fares under $100 (low value)", partners: [] },
  marriott:       { cpp: 0.7, best: "Peak award nights at Category 8 properties, Points+Cash", avoid: "Low-category properties (cash rates are often cheaper)", partners: ["ua","dl","aa","ba_avios"] },
  hilton:         { cpp: 0.5, best: "Aspirational luxury properties, 5th night free on 5-night stays", avoid: "Mid-range properties (cash rates similar or better)", partners: [] },
  ihg:            { cpp: 0.5, best: "Flagship InterContinental hotels, PointBreaks sales", avoid: "Budget Holiday Inn / Staybridge (poor redemption value)", partners: [] },
  hyatt:          { cpp: 1.7, best: "Category 7–8 luxury (Park Hyatt, Alila), Points+Cash deals", avoid: "Low-category standard rooms at limited-service properties", partners: ["amex_plat","chase_sapphire","bilt"] },
  amex_plat:      { cpp: 2.0, best: "Transfer to Aeroplan/Singapore for biz class, or Virgin for PE", avoid: "Statement credits (0.6¢/pt) or gift cards", partners: ["dl","ba_avios","flying_blue","aeroplan","singapore_kf","emirates_skywards","cathay_mp","virgin_fc","marriott","hilton"] },
  chase_sapphire: { cpp: 2.0, best: "Transfer to Hyatt for luxury hotels, or Aeroplan for biz class", avoid: "Cash back via Pay Yourself Back (1–1.5¢/pt max)", partners: ["ua","sw","ba_avios","flying_blue","aeroplan","singapore_kf","emirates_skywards","virgin_fc","marriott","hyatt","ihg"] },
};

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
  const [flightType, setFlightType] = useState("roundtrip"); // "oneway", "roundtrip", "multicity"
  const [editingSegIdx, setEditingSegIdx] = useState(null); // index of segment being edited within a trip
  const [tempUnit, setTempUnit] = useState(() => localStorage.getItem("continuum_temp_unit") || "F");
  const [weatherCache, setWeatherCache] = useState({}); // { "cityKey": { high, low, code, date } }
  const weatherLoading = useRef({}); // track in-flight fetches without re-render
  const [hotelSectionOpen, setHotelSectionOpen] = useState(false);
  const [expandedItinId, setExpandedItinId] = useState(null); // expanded booking inbox item
  const [viewExpenseId, setViewExpenseId] = useState(null); // expense detail view modal
  const [sharedTrips, setSharedTrips] = useState([]); // trips shared with me
  const [showShareModal, setShowShareModal] = useState(null); // trip ID to share
  const [shareEmail, setShareEmail] = useState("");
  const [shareStatus, setShareStatus] = useState(""); // "sent" | "error" | "already" | ""
  const [dashSubTab, setDashSubTab] = useState("overview"); // overview | timeline | reports | activity
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
  const [settingsForm, setSettingsForm] = useState({ firstName: "", lastName: "", email: "", currentPassword: "", newPassword: "", confirmPassword: "", homeAirport: "", defaultCurrency: "USD", notifications: { statusMilestones: true, expiringMiles: true, newPrograms: false } });
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
  const [tripDetailSegIdx, setTripDetailSegIdx] = useState(0); // which segment is active in detail view
  const [tripSummaryId, setTripSummaryId] = useState(null); // trip summary popup from dashboard

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

    return () => subscription.unsubscribe();
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
    const { data: tripRows } = await supabase.from("trips").select("*").in("id", tripIds);
    if (tripRows) {
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
  const loadForwardingAddress = async (userId, userEmail) => {
    const { data } = await supabase.from("user_forwarding_addresses").select("*").eq("user_id", userId).single();
    if (data) {
      setUserForwardingAddress(data.forwarding_address || "");
    } else {
      // Generate a unique forwarding token: firstname.randomhex
      const firstName = (user?.user_metadata?.first_name || user?.user_metadata?.name?.split(" ")[0] || "user").toLowerCase().replace(/[^a-z]/g, "");
      const token = `${firstName}.${crypto.randomUUID().slice(0, 6)}`;
      const { data: newData } = await supabase.from("user_forwarding_addresses").insert({
        user_id: userId,
        email: userEmail || "",
        forwarding_address: token,
        verified: true,
      }).select().single();
      if (newData) setUserForwardingAddress(newData.forwarding_address);
    }
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
    await supabase.auth.signOut();
    setActiveView("dashboard");
    setPublicPage("login");
  };

  const openSettings = () => {
    setSettingsForm(f => ({
      ...f,
      firstName: user?.user_metadata?.first_name || "",
      lastName: user?.user_metadata?.last_name || "",
      email: user?.email || "",
      homeAirport: user?.user_metadata?.home_airport || "",
      defaultCurrency: user?.user_metadata?.default_currency || "USD",
      notifications: user?.user_metadata?.notifications || { statusMilestones: true, expiringMiles: true, newPrograms: false },
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
    const { data, error } = await supabase.auth.updateUser({ data: { home_airport: settingsForm.homeAirport.toUpperCase().trim(), default_currency: settingsForm.defaultCurrency, notifications: settingsForm.notifications } });
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
      const flight = Array.isArray(data) ? data[0] : data;
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
      setMsg(`✓ Found: ${depIata} → ${arrIata}${flight.aircraft?.model ? ` · ${flight.aircraft.model}` : ""}`);
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
        const airports = (seg.route || "").split("→").map(s => s.trim());
        const resolvedArr = resolveArrivalDate(seg);
        // If the flight departs on or before this date and arrives on or before this date
        if (airports.length >= 2) {
          if (seg.date <= dateStr) currentAirport = airports[0]; // departed from here
          if (resolvedArr && resolvedArr <= dateStr) {
            currentAirport = airports[airports.length - 1]; // arrived here
            currentCity = "";
          }
        }
      } else if (seg.type === "hotel" || seg.type === "accommodation") {
        if (seg.date <= dateStr) {
          const checkout = seg.checkoutDate || "";
          if (!checkout || checkout > dateStr) {
            currentCity = seg.location || seg.property || "";
            if (!currentAirport) currentAirport = "";
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
    if (weatherCache[cacheKey]) return weatherCache[cacheKey];
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
        const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`);
        wxData = await wxRes.json();
      }
      if (!wxData?.daily?.time?.length) {
        // Use historical API — same dates from last year as typical weather
        isHistorical = true;
        const targetDate = new Date(dateStr + "T12:00:00");
        const lastYear = new Date(targetDate);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        const histDate = lastYear.toISOString().slice(0, 10);
        const wxRes = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&start_date=${histDate}&end_date=${histDate}`);
        wxData = await wxRes.json();
      }
      if (!wxData?.daily?.time?.length) return null;
      const result = {
        high: wxData.daily.temperature_2m_max[0],
        low: wxData.daily.temperature_2m_min[0],
        code: wxData.daily.weathercode[0],
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
      const flight = Array.isArray(data) ? data[0] : data;
      if (!flight) { setFlightLegs(l => l.map((g, i) => i === legIdx ? { ...g, lookupMsg: "No data" } : g)); return; }
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
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;
    const realSegs = (trip.segments || []).filter(s => !s._isMeta);
    const metaSegs = (trip.segments || []).filter(s => s._isMeta);
    const updated = [...metaSegs, ...realSegs.filter((_, i) => i !== segIdx)];
    if (user) {
      await supabase.from("trips").update({ segments: updated }).eq("id", tripId).eq("user_id", user.id);
      setTrips(prev => prev.map(t => t.id === tripId ? { ...t, segments: updated } : t));
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
      if (user) {
        const { error } = await supabase.from("trips").update(payload).eq("id", editingTripId).eq("user_id", user.id);
        if (error) { setAddTripError(error.message || "Failed to update trip."); return; }
      }
      setTrips(prev => prev.map(t => t.id === editingTripId ? { ...t, ...newTrip, segments, estimatedPoints: totalPoints, estimatedNights: totalNights, tripName: newTrip.tripName, status: newTrip.status, date: firstDate, id: editingTripId } : t));
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

  const removeTrip = async (id) => {
    setTrips(prev => prev.filter(t => t.id !== id));
    if (user) await supabase.from("trips").delete().eq("id", id).eq("user_id", user.id);
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
      route: s.route || "",
      date: s.date || "",
      // Flight
      flightNumber: s.flightNumber || "",
      departureTime: s.departureTime || "",
      arrivalTime: s.arrivalTime || "",
      departureTerminal: s.departureTerminal || "",
      arrivalTerminal: s.arrivalTerminal || "",
      fareClass: s.fareClass || "economy",
      bookingClass: s.bookingClass || "",
      seat: s.seat || "",
      aircraft: s.aircraft || "",
      class: s.class || "domestic",
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
  const dismissItinerary = async (id) => {
    if (user) {
      await supabase.from("itineraries").update({ status: "dismissed" }).eq("id", id);
      setSavedItineraries(prev => prev.filter(i => i.id !== id));
    }
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

  const handleAddExpense = async () => {
    const parsed = {
      ...newExpense,
      amount: parseFloat(newExpense.amount) || 0,
      fxRate: newExpense.currency === "USD" ? 1 : (parseFloat(newExpense.fxRate) || 1),
      usdReimbursement: newExpense.currency === "USD" ? parseFloat(newExpense.amount) || 0 : (parseFloat(newExpense.usdReimbursement) || 0),
    };
    const tripId = showAddExpense === "_inbox" ? null : showAddExpense;
    if (editExpenseId) {
      if (user) {
        await supabase.from("expenses").update({
          category: parsed.category, description: parsed.description, amount: parsed.amount,
          currency: parsed.currency, fx_rate: parsed.fxRate, date: parsed.date || null,
          payment_method: parsed.paymentMethod, receipt: parsed.receipt,
          receipt_image: parsed.receiptImage || null, notes: parsed.notes,
          individuals: parsed.individuals || "Self",
          usd_reimbursement: parsed.usdReimbursement || null,
        }).eq("id", editExpenseId).eq("user_id", user.id);
      }
      setExpenses(prev => prev.map(e => e.id === editExpenseId ? { ...parsed, id: editExpenseId, tripId: e.tripId } : e));
      setEditExpenseId(null);
    } else {
      if (user) {
        const { data, error } = await supabase.from("expenses").insert({
          user_id: user.id, trip_id: tripId,
          category: parsed.category, description: parsed.description, amount: parsed.amount,
          currency: parsed.currency, fx_rate: parsed.fxRate, date: parsed.date || null,
          payment_method: parsed.paymentMethod, receipt: parsed.receipt,
          receipt_image: parsed.receiptImage || null, notes: parsed.notes,
          individuals: parsed.individuals || "Self",
          usd_reimbursement: parsed.usdReimbursement || null,
        }).select().single();
        if (!error && data) {
          setExpenses(prev => [...prev, { ...parsed, id: data.id, tripId }]);
        }
      } else {
        setExpenses(prev => [...prev, { ...parsed, id: Date.now(), tripId }]);
      }
    }
    setShowAddExpense(null);
    setNewExpense(BLANK_EXPENSE);
  };

  const removeExpense = async (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (user) await supabase.from("expenses").delete().eq("id", id).eq("user_id", user.id);
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
      permission: "read",
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

  const handleUnlinkAccount = async (programId) => {
    if (!window.confirm(`Unlink this program? Your saved stats will be removed.`)) return;
    if (user) {
      await supabase.from("linked_accounts").delete().eq("user_id", user.id).eq("program_id", programId);
    }
    setLinkedAccounts(prev => {
      const next = { ...prev };
      delete next[programId];
      return next;
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
                  () => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: import.meta.env.VITE_APP_URL || window.location.origin } })
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
  const pastTripsFiltered = filteredTrips.filter(t => { const end = getTripEndDate(t); return end && end < todayStr; }).sort((a, b) => b.date.localeCompare(a.date));

  const renderDashboard = () => {
    // Dashboard uses shared css palette
    const lp = {
      ...css,
      bg: css.bg, surface: css.surface, surface2: css.surface2,
      border: css.border, border2: D ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
      text: css.text, text2: css.text2, dim: css.text3,
      teal: css.accent, tealDim: css.accentBg, tealBord: css.accentBorder,
      red: D ? "#ef4444" : "#dc2626", green: css.success,
      mono: "'Geist Mono', 'JetBrains Mono', ui-monospace, monospace",
      sans: "inherit",
    };

    const airlineStatuses = LOYALTY_PROGRAMS.airlines.map(p => ({ ...p, status: getProjectedStatus(p.id) })).filter(p => p.status);
    const hotelStatuses = LOYALTY_PROGRAMS.hotels.map(p => ({ ...p, status: getProjectedStatus(p.id) })).filter(p => p.status);
    const totalTrips = trips.length;
    const confirmedTrips = trips.filter(t => t.status === "confirmed").length;
    const willAdvanceCount = [...airlineStatuses, ...hotelStatuses].filter(p => p.status?.willAdvance).length;
    const today = new Date().toISOString().slice(0, 10);
    const nextTrip = trips.filter(t => t.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
    const daysToNext = nextTrip ? Math.max(0, Math.ceil((new Date(nextTrip.date + "T12:00:00") - new Date()) / (1000 * 60 * 60 * 24))) : null;
    const totalPointsValue = Object.entries(linkedAccounts).reduce((sum, [, acc]) => sum + (acc.pointsBalance || acc.currentPoints || acc.bonvoyPoints || acc.hhPoints || acc.ihgPoints || 0), 0);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    // Shared styles
    const box = { background: css.surface, borderRadius: css.radius, boxShadow: css.shadow };
    const SectionLabel = ({ children, action, actionLabel }) => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", color: css.text }}>{children}</span>
        {action && (
          <button onClick={action} style={{ background: "none", border: "none", color: css.text3, fontSize: 13, fontWeight: 500, cursor: "pointer", padding: 0, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = css.accent} onMouseLeave={e => e.currentTarget.style.color = css.text3}>
            {actionLabel} →
          </button>
        )}
      </div>
    );

    return (
      <div style={{ fontFamily: lp.sans, color: lp.text }}>

        {/* ── Header: greeting + add trip + date ── */}
        <div style={{ padding: "8px 0 24px", marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div>
                <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: css.text, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  {greeting}, {user?.user_metadata?.first_name || user?.user_metadata?.name?.split(" ")[0] || "Traveler"}
                </h1>
              </div>
              <button onClick={() => setShowCreateTrip(true)} style={{
                padding: "10px 24px", border: "none", background: css.accent, color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: "pointer", borderRadius: 24,
                transition: "all 0.15s ease", whiteSpace: "nowrap",
              }} onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; }} onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                + Add Trip
              </button>
            </div>
            <div style={{ fontSize: 13, color: css.text3, fontWeight: 500 }}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
            </div>
          </div>
        </div>

        {/* ── Upcoming Trips — first thing the user sees ── */}
        <div className="c-a1">
          <SectionLabel action={() => setActiveView("trips")} actionLabel="View all">Upcoming Trips</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcomingTripsFiltered.slice(0, 6).map(trip => {
              const prog = allPrograms.find(p => p.id === trip.program);
              const sColor = trip.status === "confirmed" ? lp.green : trip.status === "planned" ? "#F59E0B" : lp.teal;
              const sBg = trip.status === "confirmed" ? "rgba(34,197,94,0.10)" : trip.status === "planned" ? "rgba(245,158,11,0.10)" : "rgba(14,165,160,0.10)";
              const tripStart = trip.date || (trip.segments && trip.segments.map(s => s.date).filter(Boolean).sort()[0]) || "";
              const daysAway = tripStart ? Math.max(0, Math.ceil((new Date(tripStart + "T12:00:00") - new Date()) / 86400000)) : null;
              // Get confirmation code from trip or its segments
              const confCode = trip.confirmationCode || trip.confirmation_code
                || (trip.segments && trip.segments.map(s => s.confirmationCode).filter(Boolean)[0])
                || (trip.bookingSource?.confirmation) || "";
              // Determine the segment types present
              const realSegs = (trip.segments || []).filter(s => !s._isMeta);
              const hasFlights = realSegs.some(s => s.type === "flight");
              const hasHotels = realSegs.some(s => s.type === "hotel" || s.type === "accommodation");
              const hasActivities = realSegs.some(s => s.type === "activity" || s.type === "restaurant");
              const segIconType = realSegs.length === 0 ? "pin" : hasFlights ? "flight" : hasHotels ? "hotel" : hasActivities ? "activity" : "pin";
              const tripColor = lp.teal;
              return (
                <div key={trip.id} onClick={() => { setTripDetailId(trip.id); setTripDetailSegIdx(0); setActiveView("trips"); }}
                  style={{ padding: "16px 20px", borderRadius: css.radius, background: css.surface, border: `1px solid ${css.border}`, boxShadow: css.shadow, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, transition: "all 0.15s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = css.shadowHover; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = css.shadow; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 0, background: `${tripColor}15`, border: `1px solid ${tripColor}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <SegIcon type={segIconType} size={18} color={tripColor} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: lp.text, fontFamily: lp.sans, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{trip.tripName || trip.trip_name || trip.route || trip.property || trip.location}</div>
                      <div style={{ fontSize: 11, color: lp.dim, marginTop: 2, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <span>{formatTripDates(trip)}</span>
                        {trip.location && <span>· {trip.location}</span>}
                        {confCode && <span style={{ fontFamily: lp.mono, fontWeight: 600, color: lp.text2, fontSize: 10 }}>· {confCode}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {daysAway !== null && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: daysAway <= 7 ? lp.teal : lp.text2, fontFamily: lp.mono }}>
                        {daysAway === 0 ? "Today" : daysAway === 1 ? "Tomorrow" : `${daysAway}d`}
                      </span>
                    )}
                    <span style={{ fontSize: 9, fontWeight: 700, color: sColor, background: sBg, padding: "4px 10px", borderRadius: 0, textTransform: "uppercase", letterSpacing: "0.06em", border: `1px solid ${sColor}30` }}>{trip.status}</span>
                  </div>
                </div>
              );
            })}
            {upcomingTripsFiltered.length === 0 && (
              <div style={{ padding: "40px 20px", textAlign: "center", borderRadius: 14, background: lp.surface, border: `1px solid ${lp.border}` }}>
                <p style={{ fontSize: 13, color: lp.dim, marginBottom: 12 }}>No upcoming trips</p>
                <button onClick={() => setShowCreateTrip(true)} style={{ background: lp.teal, border: "none", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: lp.sans, padding: "10px 22px", borderRadius: 10 }}>+ Add your first trip</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Booking Inbox — parsed itineraries from forwarded emails or paste ── */}
        <div className="c-a2" style={{ marginTop: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: css.text, margin: 0, letterSpacing: "-0.01em" }}>Booking Inbox</h3>
              {savedItineraries.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: lp.teal, borderRadius: 10, padding: "2px 8px", minWidth: 18, textAlign: "center" }}>{savedItineraries.length}</span>
              )}
            </div>
            <button onClick={() => setShowPasteItinerary(true)} style={{
              padding: "8px 16px", border: `1px solid ${lp.teal}`, background: "transparent", color: lp.teal,
              fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: lp.sans, borderRadius: 0,
              transition: "all 0.12s ease", textTransform: "uppercase", letterSpacing: "0.04em",
            }} onMouseEnter={e => { e.currentTarget.style.background = lp.teal; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = lp.teal; }}>
              + Add Booking
            </button>
          </div>
          {/* Forwarding address */}
          {userForwardingAddress && (
            <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: lp.surface, border: `1px solid ${lp.border}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={lp.dim} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span style={{ fontSize: 11, color: lp.dim }}>Forward bookings to:</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: lp.teal, fontFamily: lp.mono, cursor: "pointer", wordBreak: "break-all" }}
                onClick={() => { navigator.clipboard?.writeText(`${userForwardingAddress}@trips.gocontinuum.app`); }}
                title="Click to copy">
                {userForwardingAddress}@trips.gocontinuum.app
              </span>
              <span style={{ fontSize: 10, color: lp.dim }}>tap to copy</span>
            </div>
          )}

          {savedItineraries.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {savedItineraries.map(itin => {
                const segs = itin.parsed_segments || [];
                const flights = segs.filter(s => s.type === "flight");
                const hotels = segs.filter(s => s.type === "hotel");
                const isHotel = hotels.length > 0 && flights.length === 0;
                const firstDate = segs.map(s => s.date).filter(Boolean).sort()[0];
                const isExpanded = expandedItinId === itin.id;
                const updateItinSeg = (segIdx, updates) => {
                  setSavedItineraries(prev => prev.map(it => it.id !== itin.id ? it : {
                    ...it, parsed_segments: it.parsed_segments.map((s, i) => i === segIdx ? { ...s, ...updates } : s),
                  }));
                };
                return (
                  <div key={itin.id} style={{ borderRadius: 12, background: lp.surface, border: `1px solid ${lp.border}`, overflow: "hidden", transition: "all 0.2s ease" }}>
                    {/* Header row */}
                    <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, cursor: "pointer" }}
                      onClick={() => setExpandedItinId(isExpanded ? null : itin.id)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <SegIcon type={isHotel ? "hotel" : "flight"} size={16} color={lp.teal} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: lp.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {isHotel ? (hotels[0]?.property || itin.subject || "Hotel") : (itin.subject || "Booking")}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: lp.dim, display: "flex", gap: 10, flexWrap: "wrap" }}>
                          {itin.confirmation_code && <span style={{ fontFamily: lp.mono, fontWeight: 600, color: lp.text2 }}>{itin.confirmation_code}</span>}
                          {isHotel && hotels[0]?.date && <span>{new Date(hotels[0].date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {hotels[0].checkoutDate ? new Date(hotels[0].checkoutDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>}
                          {isHotel && hotels[0]?.nights && <span>{hotels[0].nights} night{hotels[0].nights > 1 ? "s" : ""}</span>}
                          {flights.length > 0 && <span>{flights.length} flight{flights.length > 1 ? "s" : ""}</span>}
                          {firstDate && !isHotel && <span>{new Date(firstDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                          <path d="M4 6l4 4 4-4" stroke={lp.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                    {/* Expanded detail + edit */}
                    {isExpanded && (
                      <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${lp.border}` }}>
                        {segs.map((seg, segIdx) => (
                          <div key={segIdx} style={{ padding: "12px 0", borderBottom: segIdx < segs.length - 1 ? `1px solid ${lp.border}` : "none" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: lp.teal, textTransform: "uppercase", marginBottom: 8 }}>{seg.type === "hotel" ? "Hotel" : "Flight"}</div>
                            {seg.type === "hotel" ? (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                {[
                                  { key: "property", label: "Property" },
                                  { key: "location", label: "Address" },
                                  { key: "date", label: "Check-in", type: "date" },
                                  { key: "checkoutDate", label: "Check-out", type: "date" },
                                  { key: "roomType", label: "Room Type" },
                                  { key: "nights", label: "Nights", type: "number" },
                                  { key: "confirmationCode", label: "Confirmation" },
                                  { key: "totalCost", label: "Total Cost" },
                                ].map(f => (
                                  <div key={f.key}>
                                    <label style={{ fontSize: 9, fontWeight: 700, color: lp.dim, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</label>
                                    <input type={f.type || "text"} value={seg[f.key] || ""} onChange={e => updateItinSeg(segIdx, { [f.key]: e.target.value })}
                                      style={{ display: "block", width: "100%", padding: "6px 8px", background: D ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${lp.border}`, borderRadius: 6, color: lp.text, fontSize: 12, fontFamily: f.key === "confirmationCode" ? lp.mono : "inherit", outline: "none", boxSizing: "border-box", marginTop: 2 }} />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                {[
                                  { key: "flightNumber", label: "Flight #" },
                                  { key: "route", label: "Route" },
                                  { key: "date", label: "Date", type: "date" },
                                  { key: "confirmationCode", label: "Confirmation" },
                                  { key: "departureTime", label: "Departs", type: "time" },
                                  { key: "arrivalTime", label: "Arrives", type: "time" },
                                ].map(f => (
                                  <div key={f.key}>
                                    <label style={{ fontSize: 9, fontWeight: 700, color: lp.dim, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</label>
                                    <input type={f.type || "text"} value={seg[f.key] || ""} onChange={e => updateItinSeg(segIdx, { [f.key]: e.target.value })}
                                      style={{ display: "block", width: "100%", padding: "6px 8px", background: D ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${lp.border}`, borderRadius: 6, color: lp.text, fontSize: 12, fontFamily: f.key === "confirmationCode" || f.key === "flightNumber" ? lp.mono : "inherit", outline: "none", boxSizing: "border-box", marginTop: 2 }} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                          <button onClick={() => addTripFromItinerary(itin)} style={{
                            padding: "8px 16px", borderRadius: 8, border: "none",
                            background: lp.teal, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer",
                          }}>Create New Trip</button>
                          {trips.length > 0 && (
                            <select onChange={async e => {
                              const tripId = e.target.value;
                              if (!tripId) return;
                              const trip = trips.find(t => t.id === tripId);
                              if (!trip) return;
                              const newSegs = (itin.parsed_segments || []).map(s => ({
                                ...defaultSegment(), _id: crypto.randomUUID(),
                                type: s.type || "flight",
                                property: s.property || "", location: s.location || "",
                                date: s.date || "", checkoutDate: s.checkoutDate || "",
                                nights: s.nights || 1, roomType: s.roomType || "",
                                totalCost: s.totalCost || "", confirmationCode: s.confirmationCode || "",
                                route: s.route || "", flightNumber: s.flightNumber || "",
                                departureTime: s.departureTime || "", arrivalTime: s.arrivalTime || "",
                                fareClass: s.fareClass || "", bookingClass: s.bookingClass || "",
                                seat: s.seat || "", class: s.class || "",
                              }));
                              const existingSegs = trip.segments && trip.segments.length > 0 ? trip.segments : [];
                              const mergedSegs = [...existingSegs, ...newSegs].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
                              if (user) {
                                await supabase.from("trips").update({ segments: mergedSegs }).eq("id", tripId).eq("user_id", user.id);
                                await supabase.from("itineraries").update({ status: "added", trip_id: tripId }).eq("id", itin.id);
                                loadTrips(user.id);
                                setSavedItineraries(prev => prev.filter(i => i.id !== itin.id));
                                setExpandedItinId(null);
                              }
                              e.target.value = "";
                            }} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${lp.border2}`, background: "transparent", color: lp.dim, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                              <option value="">Add to existing trip...</option>
                              {trips.slice(0, 20).map(t => <option key={t.id} value={t.id}>{t.tripName || t.trip_name || t.route || t.property || "Trip"}</option>)}
                            </select>
                          )}
                          <button onClick={() => dismissItinerary(itin.id)} style={{
                            padding: "8px 12px", borderRadius: 8, border: `1px solid ${lp.border2}`,
                            background: "transparent", color: lp.dim, fontSize: 11, fontWeight: 500, cursor: "pointer",
                          }}>Dismiss</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "32px 20px", textAlign: "center", borderRadius: css.radius, background: css.surface, boxShadow: css.shadow }}>
              <p style={{ fontSize: 13, color: css.text3, margin: "0 0 4px" }}>No bookings in inbox</p>
              <p style={{ fontSize: 12, color: css.text3, margin: 0 }}>Forward a confirmation email to trips@gocontinuum.app</p>
            </div>
          )}
        </div>

        {/* ── Expense Inbox — unassigned expenses ── */}
        {(() => {
          const inboxExpenses = expenses.filter(e => !e.tripId);
          return (
            <div className="c-a2" style={{ marginTop: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: css.text, margin: 0, letterSpacing: "-0.01em" }}>Expense Inbox</h3>
                  {inboxExpenses.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: lp.teal, background: lp.tealDim, padding: "2px 8px", borderRadius: 10 }}>{inboxExpenses.length}</span>}
                </div>
                <button onClick={() => { setShowAddExpense("_inbox"); setNewExpense(BLANK_EXPENSE); setEditExpenseId(null); }} style={{
                  padding: "8px 16px", border: `1px solid ${lp.teal}`, background: "transparent", color: lp.teal,
                  fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: lp.sans, borderRadius: 0,
                  transition: "all 0.12s ease", textTransform: "uppercase", letterSpacing: "0.04em",
                }} onMouseEnter={e => { e.currentTarget.style.background = lp.teal; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = lp.teal; }}>
                  + Add Expense
                </button>
              </div>
              {inboxExpenses.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {inboxExpenses.map(exp => {
                    const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                    return (
                      <div key={exp.id} style={{ background: lp.surface, border: `1px solid ${lp.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            {cat && <span style={{ fontSize: 10, fontWeight: 700, color: cat.color, background: `${cat.color}15`, padding: "2px 8px", borderRadius: 6 }}>{cat.label}</span>}
                            <span style={{ fontSize: 13, fontWeight: 600, color: lp.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description || "Expense"}</span>
                          </div>
                          <div style={{ fontSize: 11, color: lp.dim, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {exp.date && <span>{new Date(exp.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                            {exp.individuals && exp.individuals !== "Self" && <span>{exp.individuals}</span>}
                            {exp.receipt && <span style={{ color: "#22c55e" }}>Receipt</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: lp.text, fontFamily: lp.mono }}>{exp.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {exp.currency || "USD"}</div>
                          {exp.currency !== "USD" && exp.usdReimbursement && <div style={{ fontSize: 10, color: lp.dim }}>{parseFloat(exp.usdReimbursement).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</div>}
                        </div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          {trips.length > 0 && (
                            <select onChange={async e => {
                              const tripId = e.target.value; if (!tripId) return;
                              if (user) await supabase.from("expenses").update({ trip_id: tripId }).eq("id", exp.id).eq("user_id", user.id);
                              setExpenses(prev => prev.map(ex => ex.id === exp.id ? { ...ex, tripId } : ex));
                              e.target.value = "";
                            }} style={{ padding: "5px 8px", borderRadius: 6, border: `1px solid ${lp.border}`, background: "transparent", color: lp.dim, fontSize: 10, cursor: "pointer" }}>
                              <option value="">Assign...</option>
                              {trips.map(t => <option key={t.id} value={t.id}>{t.tripName || t.location || "Trip"}</option>)}
                            </select>
                          )}
                          <button onClick={() => { setEditExpenseId(exp.id); setShowAddExpense("_inbox"); setNewExpense({ ...exp, fxRate: exp.fxRate || 1 }); }} style={{ padding: "5px 8px", borderRadius: 6, border: `1px solid ${lp.border}`, background: "transparent", color: lp.dim, fontSize: 10, cursor: "pointer" }}>Edit</button>
                          <button onClick={() => removeExpense(exp.id)} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#ef4444", fontSize: 10, cursor: "pointer" }}>x</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "24px 20px", textAlign: "center", borderRadius: 14, background: lp.surface, border: `1px solid ${lp.border}` }}>
                  <p style={{ fontSize: 13, color: lp.dim, margin: "0 0 4px" }}>No unassigned expenses</p>
                  <p style={{ fontSize: 11, color: lp.dim, margin: 0 }}>Add receipts here and assign them to trips later</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Elite Status section removed — focus on trips + expenses */}
        {false && (
          <div className="c-a2" style={{ marginTop: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: lp.text, margin: 0, fontFamily: lp.sans }}>Elite Status</h3>
              <button onClick={() => setActiveView("programs")} style={{ background: "none", border: "none", color: lp.dim, cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: lp.sans, transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = lp.text} onMouseLeave={e => e.currentTarget.style.color = lp.dim}>View all →</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...airlineStatuses, ...hotelStatuses].map(p => {
                const s = p.status;
                const pct = s.nextTier ? Math.min((s.projected / s.nextTier.threshold) * 100, 100) : 100;
                const isHotel = LOYALTY_PROGRAMS.hotels.some(h => h.id === p.id);
                return (
                  <div key={p.id} onClick={() => { setSelectedProgram(p.id); setActiveView("programs"); }}
                    style={{
                      padding: "14px 18px", borderRadius: 12, background: lp.surface, border: `1px solid ${lp.border}`,
                      cursor: "pointer", transition: "all 0.2s ease",
                      display: "flex", alignItems: "center", gap: 14,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = D ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = lp.border; e.currentTarget.style.transform = "none"; }}>
                    {/* Mini progress ring */}
                    <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
                      <svg width="40" height="40" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="20" cy="20" r="16" fill="none" stroke={lp.border2} strokeWidth="3" />
                        <circle cx="20" cy="20" r="16" fill="none" stroke={p.color} strokeWidth="3"
                          strokeDasharray={2 * Math.PI * 16} strokeDashoffset={2 * Math.PI * 16 - (2 * Math.PI * 16 * pct / 100)}
                          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: lp.text, fontFamily: lp.mono }}>
                        {s.nextTier ? `${Math.round(pct)}%` : "✓"}
                      </div>
                    </div>
                    {/* Program info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <ProgramLogo prog={p} size={16} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: lp.text }}>{p.name.split(" ").slice(-1)[0]}</span>
                        <span style={{ fontSize: 11, color: p.color, fontWeight: 600 }}>{s.currentTier?.name || "Member"}</span>
                        {s.willAdvance && <span style={{ fontSize: 9, color: lp.green, fontWeight: 600 }}>↑</span>}
                      </div>
                      {/* Inline progress bar */}
                      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 4, borderRadius: 2, background: lp.border2, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: p.color, transition: "width 0.8s ease" }} />
                        </div>
                        <span style={{ fontSize: 10, color: lp.dim, fontFamily: lp.mono, flexShrink: 0 }}>
                          {s.nextTier ? `${s.projected.toLocaleString()} / ${s.nextTier.threshold.toLocaleString()}${isHotel ? " nts" : ""}` : "Max"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPrograms = (_previewSub = null) => {
    // _previewSub is used by the nav dropdown live preview to force a specific sub-view
    const _subView = _previewSub || programSubView;
    // Delegate alliance benefits sub-view to renderAlliances
    if (_subView === "alliances") return renderAlliances();

    const customByCategory = {
      airline: customPrograms.filter(p => p.category === "airline"),
      hotel: customPrograms.filter(p => p.category === "hotel"),
      rental: customPrograms.filter(p => p.category === "rental"),
      card: customPrograms.filter(p => p.category === "card"),
    };

    const SUB_TABS = [
      { id: "airlines",     label: "Airlines",                 programs: [...LOYALTY_PROGRAMS.airlines, ...customByCategory.airline],   isCard: false },
      { id: "hotels",       label: "Hotels",                   programs: [...LOYALTY_PROGRAMS.hotels, ...customByCategory.hotel],       isCard: false },
      { id: "credit_cards", label: "Credit Cards",             programs: [...LOYALTY_PROGRAMS.creditCards, ...customByCategory.card],   isCard: true  },
      { id: "rentals",      label: "Car Rental Programs",      programs: [...LOYALTY_PROGRAMS.rentals, ...customByCategory.rental],     isCard: false },
      { id: "alliances",    label: "Airline Alliance Benefits", programs: [],                                                           isCard: false },
    ];
    const activeSub = SUB_TABS.find(t => t.id === _subView) || SUB_TABS[0];
    const linkedCount = Object.keys(linkedAccounts).length;

    return (
      <div>
        {/* Page header */}
        <div className="c-a1" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>Loyalty Portfolio</div>
            <h2 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: isMobile ? 28 : 36, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>{activeSub.label}</h2>
            <p style={{ color: css.text2, fontSize: 13, margin: "8px 0 0", fontFamily: "'Instrument Sans', 'Outfit', sans-serif" }}>
              {linkedCount} linked · {Object.values(customByCategory).flat().length} custom programs
            </p>
          </div>
          <button onClick={() => setShowAddProgram(true)} className="c-btn-primary" style={{
            padding: "10px 22px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: css.accent, color: "#fff", flexShrink: 0, fontFamily: "'Instrument Sans', 'Outfit', sans-serif",
          }}>+ Add Program</button>
        </div>

        {/* Sub-tabs — desktop only (mobile uses nav row) */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: `1px solid ${css.border}` }}>
            {SUB_TABS.map(tab => (
              <button key={tab.id} onClick={() => setProgramSubView(tab.id)} style={{
                padding: "9px 20px", border: "none", cursor: "pointer", background: "transparent",
                borderBottom: _subView === tab.id ? `2px solid ${css.accent}` : "2px solid transparent",
                color: _subView === tab.id ? css.accent : css.text3,
                fontSize: 13, fontWeight: _subView === tab.id ? 600 : 400,
                fontFamily: "'Instrument Sans', 'Outfit', sans-serif", transition: "all 0.15s",
              }}>{tab.label}</button>
            ))}
          </div>
        )}

        {/* Program grid for active sub-tab */}
        {(() => {
          const cat = activeSub;
          return (
          <div style={{ marginBottom: 40 }}>
            {/* Count row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${css.border}` }}>
              <span style={{ fontSize: 11, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>
                {cat.programs.filter(p => linkedAccounts[p.id]).length}/{cat.programs.length} linked
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {cat.programs.map(prog => {
                const isLinked = !!linkedAccounts[prog.id];
                const status = isLinked ? getProjectedStatus(prog.id) : null;
                const isCard = cat.isCard;

                return (
                  <div key={prog.id} className="c-card" style={{
                    background: css.surface, border: `1px solid ${isLinked ? prog.color + "40" : css.border}`,
                    borderTop: isLinked ? `3px solid ${prog.color}` : `3px solid transparent`,
                    borderRadius: 14, padding: "20px 22px", transition: "all 0.2s",
                    boxShadow: D ? "none" : "0 1px 4px rgba(26,21,18,0.05)",
                  }}>
                    {/* Card header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <ProgramLogo prog={prog} size={32} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: css.text, lineHeight: 1.3 }}>{prog.name}</div>
                          {isLinked && !isCard && (
                            <div style={{ fontSize: 10, color: css.text3, fontFamily: "'Geist Mono', monospace", marginTop: 2 }}>
                              #{linkedAccounts[prog.id].memberId}
                            </div>
                          )}
                          {isCard && prog.annualFee && (
                            <div style={{ fontSize: 10, color: css.text3, marginTop: 2 }}>${prog.annualFee}/yr</div>
                          )}
                        </div>
                      </div>
                      {isLinked ? (
                        <span style={{ fontSize: 10, fontWeight: 700, color: css.success, background: css.successBg, border: `1px solid ${css.success}30`, borderRadius: 20, padding: "3px 9px", flexShrink: 0 }}>Linked</span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 600, color: css.text3, background: css.surface2, borderRadius: 20, padding: "3px 9px", flexShrink: 0 }}>Not linked</span>
                      )}
                    </div>

                    {/* Tier scroll strip for airline/hotel */}
                    {isLinked && status && !isCard && prog.tiers?.length > 0 && (() => {
                      const tiers = prog.tiers;
                      const current = status.projected;
                      const activeIdx = tierScrollIdx[prog.id] ?? Math.max(0, tiers.findIndex(t => current < t.threshold));
                      const safIdx = Math.min(Math.max(activeIdx, 0), tiers.length - 1);
                      const tier = tiers[safIdx];
                      const prevThreshold = safIdx > 0 ? tiers[safIdx - 1].threshold : 0;
                      const achieved = current >= tier.threshold;
                      const pct = achieved ? 100 : Math.min(((current - prevThreshold) / (tier.threshold - prevThreshold)) * 100, 100);
                      const toGo = Math.max(tier.threshold - current, 0);

                      return (
                        <div style={{ marginBottom: 14 }}>
                          {/* Tier nav: arrows + dots */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <button
                              onClick={() => setTierScrollIdx(p => ({ ...p, [prog.id]: Math.max(safIdx - 1, 0) }))}
                              disabled={safIdx === 0}
                              style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${css.border}`, background: "transparent", cursor: safIdx === 0 ? "default" : "pointer", color: safIdx === 0 ? css.border : css.text2, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                            >‹</button>
                            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                              {tiers.map((t, i) => {
                                const tierAchieved = current >= t.threshold;
                                return (
                                  <button key={i} onClick={() => setTierScrollIdx(p => ({ ...p, [prog.id]: i }))} style={{
                                    width: i === safIdx ? 20 : 6, height: 6, borderRadius: 3,
                                    border: "none", cursor: "pointer", padding: 0, transition: "all 0.2s",
                                    background: tierAchieved ? prog.color : i === safIdx ? prog.color : css.border,
                                    opacity: i === safIdx ? 1 : 0.5,
                                  }} />
                                );
                              })}
                            </div>
                            <button
                              onClick={() => setTierScrollIdx(p => ({ ...p, [prog.id]: Math.min(safIdx + 1, tiers.length - 1) }))}
                              disabled={safIdx === tiers.length - 1}
                              style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${css.border}`, background: "transparent", cursor: safIdx === tiers.length - 1 ? "default" : "pointer", color: safIdx === tiers.length - 1 ? css.border : css.text2, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                            >›</button>
                          </div>

                          {/* Tier card */}
                          <div style={{ padding: "12px 14px", borderRadius: 10, background: achieved ? `${prog.color}12` : css.surface2, border: `1px solid ${achieved ? prog.color + "40" : css.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: achieved ? prog.color : css.text, fontFamily: "'Inter Tight', Inter, sans-serif" }}>{tier.name}</div>
                                <div style={{ fontSize: 10, color: css.text3, fontFamily: "Inter, sans-serif", marginTop: 2 }}>{tier.threshold.toLocaleString()} {prog.unit?.split(" ")[0]} required</div>
                              </div>
                              {achieved
                                ? <span style={{ fontSize: 10, fontWeight: 700, color: prog.color, background: `${prog.color}15`, border: `1px solid ${prog.color}40`, borderRadius: 20, padding: "3px 9px", flexShrink: 0 }}>✓ Achieved</span>
                                : <span style={{ fontSize: 10, color: css.text3, fontFamily: "'Geist Mono', monospace", flexShrink: 0 }}>{toGo.toLocaleString()} to go</span>
                              }
                            </div>
                            <div style={{ width: "100%", height: 5, borderRadius: 3, background: D ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)", overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: prog.color, transition: "width 0.6s ease" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: css.text3, marginTop: 5, fontFamily: "'Geist Mono', monospace" }}>
                              <span>{current.toLocaleString()} {prog.unit?.split(" ")[0]}</span>
                              <span style={{ color: css.text3 }}>{tier.threshold.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Card balance */}
                    {isCard && isLinked && (
                      <div style={{ marginBottom: 14, padding: "10px 14px", background: css.surface2, borderRadius: 8 }}>
                        <div style={{ fontSize: 20, fontWeight: 600, color: css.text, fontFamily: "'Geist Mono', monospace" }}>
                          {(linkedAccounts[prog.id]?.pointsBalance || 0).toLocaleString()}
                          <span style={{ fontSize: 12, fontWeight: 400, color: css.text2, marginLeft: 4 }}>pts</span>
                        </div>
                        {prog.perks && <div style={{ fontSize: 10, color: css.text3, marginTop: 4 }}>{prog.perks}</div>}
                      </div>
                    )}

                    {/* Tier badges — only shown for unlinked programs */}
                    {!isCard && prog.tiers && !isLinked && (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
                        {prog.tiers.map((tier, ti) => (
                          <span key={ti} style={{
                            fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                            background: css.surface2, color: css.text3, border: `1px solid ${css.border}`,
                          }}>{tier.name}</span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    {isLinked ? (
                      <div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                          <button onClick={() => {
                            const existing = linkedAccounts[prog.id];
                            const isHotelProg = LOYALTY_PROGRAMS.hotels.some(p => p.id === prog.id);
                            const isRentalProg = LOYALTY_PROGRAMS.rentals.some(p => p.id === prog.id);
                            setLinkForm({
                              memberId: existing?.memberId || "",
                              pointsBalance: existing?.pointsBalance ? String(existing.pointsBalance) : "",
                              tierCredits: isHotelProg || isRentalProg ? "" : existing?.tierCredits ? String(existing.tierCredits) : "",
                              currentNights: isHotelProg ? (existing?.currentNights ? String(existing.currentNights) : "") : "",
                              currentRentals: isRentalProg ? (existing?.currentRentals ? String(existing.currentRentals) : "") : "",
                              currentTier: existing?.currentTier || "",
                            });
                            setLinkError("");
                            setShowLinkModal(prog.id);
                          }} style={{
                            flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${css.border}`,
                            background: css.surface2, color: css.text2,
                            fontSize: 11, fontWeight: 600, cursor: "pointer",
                          }}>↺ Update Stats</button>
                          {prog.loginUrl && (
                            <a href={prog.loginUrl} target="_blank" rel="noopener noreferrer" style={{
                              padding: "8px 14px", borderRadius: 8, border: `1px solid ${prog.color}40`,
                              background: `${prog.color}12`, color: css.text, textDecoration: "none",
                              fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4,
                            }}>View ↗</a>
                          )}
                          <button onClick={() => handleUnlinkAccount(prog.id)} style={{
                            padding: "8px 10px", borderRadius: 8, border: `1px solid rgba(239,68,68,0.3)`,
                            background: "transparent", color: "#ef4444",
                            fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                          }} title="Unlink program">✕</button>
                        </div>
                        {linkedAccounts[prog.id]?.updatedAt && (
                          <div style={{ fontSize: 10, color: css.text3, fontFamily: "'Geist Mono', monospace", textAlign: "center" }}>
                            Updated {(() => {
                              const diff = Math.floor((Date.now() - new Date(linkedAccounts[prog.id].updatedAt)) / 1000);
                              if (diff < 60) return "just now";
                              if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
                              if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
                              return `${Math.floor(diff/86400)}d ago`;
                            })()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => {
                        const existing = linkedAccounts[prog.id];
                        setLinkForm({
                          memberId: existing?.memberId || "",
                          pointsBalance: existing?.pointsBalance ? String(existing.pointsBalance) : "",
                          tierCredits: existing?.tierCredits ? String(existing.tierCredits) : "",
                          currentNights: existing?.currentNights ? String(existing.currentNights) : "",
                          currentRentals: existing?.currentRentals ? String(existing.currentRentals) : "",
                          currentTier: existing?.currentTier || "",
                        });
                        setLinkError("");
                        setShowLinkModal(prog.id);
                      }} style={{
                        width: "100%", padding: "9px 0", borderRadius: 8, border: `1px solid ${css.accentBorder}`,
                        background: css.accentBg, color: css.accent,
                        fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                      }}>Link Account →</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
        })()}
      </div>
    );
  };

  const renderTrips = () => {
    const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);

    // ── Trip Detail View — Full-screen timeline layout ──
    if (tripDetailId) {
      const trip = trips.find(t => t.id === tripDetailId);
      if (!trip) { setTripDetailId(null); return null; }
      const prog = allPrograms.find(p => p.id === trip.program);
      const sColor = trip.status === "confirmed" ? css.success : trip.status === "planned" ? css.warning : css.accent;
      const sBg = trip.status === "confirmed" ? css.successBg : trip.status === "planned" ? css.warningBg : css.accentBg;
      const tripExps = expenses.filter(e => e.tripId === trip.id);
      const tripTotal = tripExps.reduce((s, e) => s + e.amount, 0);
      const csInfo = trip.bookingSource || trip.airlineCS || (AIRLINE_CS[trip.program] ? { ...AIRLINE_CS[trip.program], type: "airline" } : null);
      const manageUrl = trip.bookingSource?.manage || trip.airlineCS?.manage || AIRLINE_CS[trip.program]?.manage || null;

      // Group segments by date for day-by-day timeline
      const realSegs = (trip.segments || []).filter(s => !s._isMeta);
      const segsByDate = {};
      realSegs.forEach(seg => {
        const d = seg.date || "undated";
        if (!segsByDate[d]) segsByDate[d] = [];
        segsByDate[d].push(seg);
      });
      // Sort each day's segments by time
      Object.values(segsByDate).forEach(segs => segs.sort((a, b) => (a.departureTime || a.startTime || a.time || a.checkinTime || a.pickupTime || "99:99").localeCompare(b.departureTime || b.startTime || b.time || b.checkinTime || b.pickupTime || "99:99")));
      const sortedDates = Object.keys(segsByDate).sort();
      const tripStartDate = trip.date || sortedDates[0] || "";

      // Segment type styling
      const segTypeInfo = (type) => {
        const map = { flight: { color: "#3b82f6", label: "Flight" }, hotel: { color: "#8b5cf6", label: "Hotel" }, accommodation: { color: "#8b5cf6", label: "Accommodation" }, activity: { color: "#22c55e", label: "Activity" }, train: { color: "#f59e0b", label: "Train" }, rental: { color: "#ef4444", label: "Rental Car" }, cruise: { color: "#06b6d4", label: "Cruise" }, ferry: { color: "#0ea5e9", label: "Ferry" }, restaurant: { color: "#f97316", label: "Restaurant" }, transfer: { color: "#a855f7", label: "Transfer" }, lounge: { color: "#c9a84c", label: "Lounge" } };
        return map[type] || { color: css.accent, label: type || "Item" };
      };

      // Get the main display info for a segment
      const segTitle = (s) => s.property || s.activityName || s.restaurantName || s.loungeName || s.flightNumber || s.trainNumber || s.cruiseLine || s.operator || s.company || s.provider || s.route || s.location || segTypeInfo(s.type).label;
      const segSubtitle = (s) => {
        if (s.type === "flight") return [s.route, s.fareClass === "business_first" ? "Business" : s.fareClass === "premium_economy" ? "Premium" : s.fareClass === "economy" ? "Economy" : "", s.seat ? `Seat ${s.seat}` : ""].filter(Boolean).join(" · ");
        if (s.type === "hotel" || s.type === "accommodation") return [s.location, s.roomType, s.nights ? `${s.nights} night${s.nights > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · ");
        if (s.type === "restaurant") return [s.location, s.cuisine, s.partySize ? `Party of ${s.partySize}` : ""].filter(Boolean).join(" · ");
        if (s.type === "train") return [s.departureStation && s.arrivalStation ? `${s.departureStation} → ${s.arrivalStation}` : "", s.fareClass].filter(Boolean).join(" · ");
        if (s.type === "rental") return [s.pickupLocation, s.vehicleType].filter(Boolean).join(" · ");
        if (s.type === "transfer") return [s.pickupLocation, s.dropoffLocation].filter(Boolean).join(" → ");
        if (s.type === "lounge") return [s.airport, s.terminal, s.accessMethod].filter(Boolean).join(" · ");
        if (s.type === "cruise") return [s.shipName, s.cabinType].filter(Boolean).join(" · ");
        if (s.type === "ferry") return [s.departurePort, s.arrivalPort].filter(Boolean).join(" → ");
        return s.location || s.notes || "";
      };
      const segTime = (s) => s.departureTime || s.startTime || s.time || s.checkinTime || s.pickupTime || "";
      // Get the location string from a segment for Google Maps linking
      const segLocation = (s) => s.location || s.pickupLocation || s.airport || s.departureStation || s.departurePort || "";
      const mapsUrl = (loc) => loc ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}` : null;
      const LocationLink = ({ location, children }) => {
        if (!location) return children || null;
        return <a href={mapsUrl(location)} target="_blank" rel="noopener noreferrer" style={{ color: css.accent, textDecoration: "none", borderBottom: `1px dashed ${css.accent}40`, transition: "border-color 0.12s" }} onMouseEnter={e => e.currentTarget.style.borderColor = css.accent} onMouseLeave={e => e.currentTarget.style.borderColor = `${css.accent}40`}>{children || location}</a>;
      };

      const DetailRow = ({ label, value, mono, accent, link }) => {
        if (!value) return null;
        return (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${css.border}` }}>
            <span style={{ fontSize: 12, color: css.text3, fontWeight: 500 }}>{label}</span>
            {link ? (
              <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: css.accent, textDecoration: "none", fontFamily: mono ? "'Geist Mono', monospace" : "inherit" }}>{value} ↗</a>
            ) : (
              <span style={{ fontSize: 13, fontWeight: 600, color: accent ? css.accent : css.text, fontFamily: mono ? "'Geist Mono', monospace" : "inherit" }}>{value}</span>
            )}
          </div>
        );
      };

      return (
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {/* Back button */}
          <button onClick={() => setTripDetailId(null)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 0", marginBottom: 16,
            background: "none", border: "none", color: css.accent, cursor: "pointer", fontSize: 13, fontWeight: 700,
          }}>
            <span style={{ fontSize: 16 }}>←</span> Back to Trips
          </button>

          {/* Trip header card */}
          <div style={{
            background: css.surface, border: `1px solid ${css.border}`, borderRadius: 0, padding: "24px 28px", marginBottom: 20,
            borderLeft: `3px solid ${css.accent}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div>
                {trip.tripName && <div style={{ fontSize: 12, fontWeight: 700, color: css.accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{trip.tripName}</div>}
                <div style={{ fontSize: 22, fontWeight: 800, color: css.text, fontFamily: "'Instrument Sans', sans-serif", letterSpacing: "-0.02em" }}>{trip.location || trip.route || "Trip"}</div>
                <div style={{ fontSize: 12, color: css.text3, marginTop: 6, fontFamily: "'Geist Mono', monospace" }}>
                  {formatTripDates(trip)}{trip.location && trip.route ? ` · ${trip.route}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {trip.estimatedPoints > 0 && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: css.gold, fontFamily: "'Geist Mono', monospace" }}>+{trip.estimatedPoints.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: css.text3 }}>est. points</div>
                  </div>
                )}
                <span style={{ fontSize: 9, fontWeight: 700, color: sColor, background: sBg, border: `1px solid ${sColor}30`, padding: "4px 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{trip.status}</span>
                {!trip._shared && <button onClick={() => openEditTrip(trip)} style={{
                  padding: "6px 14px", border: `1px solid ${css.border}`, background: "transparent",
                  color: css.text3, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  textTransform: "uppercase", letterSpacing: "0.04em", transition: "all 0.12s",
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = css.accent; e.currentTarget.style.color = css.accent; }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = css.border; e.currentTarget.style.color = css.text3; }}>
                  Edit
                </button>}
                {!trip._shared && <button onClick={() => { setShowShareModal(trip.id); setShareEmail(""); setShareStatus(""); }} style={{
                  padding: "6px 14px", border: `1px solid ${css.border}`, background: "transparent",
                  color: css.text3, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  textTransform: "uppercase", letterSpacing: "0.04em", transition: "all 0.12s",
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#3b82f6"; }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = css.border; e.currentTarget.style.color = css.text3; }}>
                  Share
                </button>}
                {trip._shared && <span style={{ fontSize: 10, fontWeight: 600, color: "#3b82f6", background: "rgba(59,130,246,0.1)", padding: "4px 10px", border: "1px solid rgba(59,130,246,0.2)" }}>Shared by {trip._sharedBy}</span>}
              </div>
            </div>
          </div>

          {/* Add to Trip button — hidden for shared trips */}
          {!trip._shared && <button onClick={() => { if (trip.date) lastDateRef.current = trip.date; setShowAddSegment(trip.id); }} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
            padding: "12px 0", border: `1px dashed ${css.border}`, background: "transparent",
            color: css.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 24,
            transition: "all 0.12s",
          }} onMouseEnter={e => { e.currentTarget.style.borderColor = css.accent; e.currentTarget.style.background = css.accentBg; }}
             onMouseLeave={e => { e.currentTarget.style.borderColor = css.border; e.currentTarget.style.background = "transparent"; }}>
            + Add Flight, Hotel, Activity...
          </button>}

          {/* ── Day-by-day Timeline ── */}
          {realSegs.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <div style={{ display: "inline-flex", border: `1px solid ${css.border}`, overflow: "hidden" }}>
                {["F", "C"].map(u => (
                  <button key={u} onClick={() => setTempUnit(u)} style={{
                    padding: "4px 12px", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Geist Mono', monospace", transition: "all 0.12s",
                    background: tempUnit === u ? css.accent : "transparent",
                    color: tempUnit === u ? "#fff" : css.text3,
                  }}>°{u}</button>
                ))}
              </div>
            </div>
          )}
          {realSegs.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", background: css.surface, border: `1px solid ${css.border}` }}>
              <p style={{ fontSize: 15, color: css.text3, margin: "0 0 8px" }}>No itinerary items yet</p>
              <p style={{ fontSize: 12, color: css.text3, margin: 0 }}>Add flights, hotels, restaurants and more to build your day-by-day plan</p>
            </div>
          ) : (
            <div>
              {/* Collapsible Hotel Bookings section */}
              {(() => {
                const hotelSegs = realSegs.filter(s => s.type === "hotel" || s.type === "accommodation");
                if (hotelSegs.length === 0) return null;
                const info = segTypeInfo("hotel");
                return (
                  <div style={{ marginBottom: 20, border: `1px solid ${css.border}`, background: css.surface }}>
                    <button onClick={() => setHotelSectionOpen(!hotelSectionOpen)} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                      padding: "14px 20px", border: "none", background: "transparent", cursor: "pointer", color: css.text,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: `${info.color}12`, border: `1px solid ${info.color}25` }}><SegIcon type="hotel" size={15} color={info.color} /></div>
                        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.02em" }}>Hotel Bookings</span>
                        <span style={{ fontSize: 11, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>{hotelSegs.length}</span>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: hotelSectionOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                        <path d="M4 6l4 4 4-4" stroke={css.text3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {hotelSectionOpen && (
                      <div style={{ padding: "0 20px 16px", borderTop: `1px solid ${css.border}` }}>
                        {hotelSegs.map((seg, i) => {
                          const checkin = seg.date ? new Date(seg.date + "T12:00:00") : null;
                          const checkout = seg.checkoutDate ? new Date(seg.checkoutDate + "T12:00:00") : (checkin && seg.nights ? new Date(checkin.getTime() + (parseInt(seg.nights) || 1) * 86400000) : null);
                          const nights = (checkin && checkout) ? Math.round((checkout - checkin) / 86400000) : (parseInt(seg.nights) || 0);
                          const fmt = d => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          return (
                            <div key={`hotel-${i}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < hotelSegs.length - 1 ? `1px solid ${css.border}` : "none" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: css.text }}>{seg.property || "Accommodation"}</div>
                                <div style={{ fontSize: 11, color: css.text3, marginTop: 3, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                                  {checkin && checkout && <span>{fmt(checkin)} – {fmt(checkout)}</span>}
                                  {nights > 0 && <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 600 }}>· {nights} night{nights > 1 ? "s" : ""}</span>}
                                  {seg.roomType && <span>· {seg.roomType}</span>}
                                </div>
                                {seg.location && <div style={{ fontSize: 11, color: css.text3, marginTop: 2 }}><LocationLink location={`${seg.property || ""} ${seg.location}`}>{seg.location}</LocationLink></div>}
                              </div>
                              {seg.confirmationCode && (
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                  <div style={{ fontSize: 9, color: css.text3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Conf</div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: css.accent, fontFamily: "'Geist Mono', monospace" }}>{seg.confirmationCode}</div>
                                </div>
                              )}
                              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                <button onClick={(e) => { e.stopPropagation(); editSegment(trip.id, realSegs.indexOf(seg)); }} style={{ padding: "3px 8px", border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                                <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete?")) deleteSegment(trip.id, realSegs.indexOf(seg)); }} style={{ padding: "3px 8px", border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#ef4444", fontSize: 10, fontWeight: 600, cursor: "pointer", opacity: 0.6 }}>Delete</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Day-by-day timeline with layover connectors */}
              {(() => {
                // Build flat sorted list of all non-hotel segments with layover info
                const allTimeline = realSegs.filter(s => s.type !== "hotel" && s.type !== "accommodation");
                // Group by date for day headers
                const byDate = {};
                allTimeline.forEach(seg => { const d = seg.date || "undated"; if (!byDate[d]) byDate[d] = []; byDate[d].push(seg); });
                Object.values(byDate).forEach(segs => segs.sort((a, b) => (a.departureTime || a.startTime || a.time || "99:99").localeCompare(b.departureTime || b.startTime || b.time || "99:99")));
                const dates = Object.keys(byDate).sort();

                // Pre-calculate layovers — ONLY between legs of the same multi-city booking
                // Legs are linked by sharing the same _bookingGroup ID (set during multi-city creation)
                const flatFlights = allTimeline.filter(s => s.type === "flight").sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.departureTime || "").localeCompare(b.departureTime || ""));
                const layoverMap = new Map();
                for (let i = 0; i < flatFlights.length - 1; i++) {
                  const curr = flatFlights[i];
                  const next = flatFlights[i + 1];
                  // Only show layover if both legs share the same booking group (multi-city)
                  if (!curr._bookingGroup || !next._bookingGroup || curr._bookingGroup !== next._bookingGroup) continue;
                  const resolvedArrDate = resolveArrivalDate(curr);
                  if (curr.date && next.date && curr.arrivalTime && resolvedArrDate) {
                    // Use resolved arrival date (explicit, or inferred from time comparison)
                    const arrDate = new Date(`${resolvedArrDate}T${curr.arrivalTime}:00`);
                    const depDate = new Date(`${next.date}T${next.departureTime || "00:00"}:00`);
                    const diffMs = depDate - arrDate;
                    if (diffMs > 0) {
                      const totalMins = Math.round(diffMs / 60000);
                      const days = Math.floor(totalMins / 1440);
                      const hrs = Math.floor((totalMins % 1440) / 60);
                      const mins = totalMins % 60;
                      let durText = "";
                      if (days > 0) durText += `${days}d `;
                      if (hrs > 0) durText += `${hrs}h `;
                      if (mins > 0 && days === 0) durText += `${mins}m`;
                      const airports = (curr.route || "").split("→").map(s => s.trim());
                      const layoverAirport = airports[airports.length - 1] || "?";
                      layoverMap.set(curr, { duration: durText.trim(), airport: layoverAirport, arrivalTime: curr.arrivalTime });
                    }
                  }
                }

                return dates.map((dateStr, dayIdx) => {
                const daySegs = byDate[dateStr];
                if (!daySegs || daySegs.length === 0) return null;
                const dayDate = dateStr !== "undated" ? new Date(dateStr + "T12:00:00") : null;
                const dayNum = dayDate && tripStartDate ? Math.floor((dayDate - new Date(tripStartDate + "T12:00:00")) / 86400000) + 1 : dayIdx + 1;
                const dayLabel = dayDate ? dayDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }).toUpperCase() : "UNDATED";
                // Resolve hotel for this night, then fall back to city/airport
                const dayHotel = dateStr !== "undated" ? resolveHotelForDate(realSegs, dateStr) : null;
                const dayCity = dateStr !== "undated" ? resolveCityForDate(realSegs, dateStr) : { city: "", airportCode: "" };
                // Weather key: hotel location → hotel property name → city → airport code
                const weatherLookup = dayHotel?.location || dayHotel?.name || dayCity.city || dayCity.airportCode || "";
                const wxKey = `${weatherLookup}_${dateStr}`;
                const wx = weatherCache[wxKey] || null;
                if (weatherLookup && dateStr !== "undated" && !wx && !weatherLoading.current[wxKey]) {
                  weatherLoading.current[wxKey] = true;
                  fetchWeather(weatherLookup, dateStr);
                }
                const toF = (c) => Math.round(c * 9 / 5 + 32);
                const fmtTemp = (c) => tempUnit === "F" ? `${toF(c)}°` : `${Math.round(c)}°`;
                // Display label: hotel name if staying somewhere, otherwise city/airport
                const dayLocationLabel = dayHotel?.name || "";

                return (
                  <div key={dateStr} style={{ marginBottom: 32 }}>
                    {/* Day header: Day X — Date — Hotel Name ... weather on far right */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: `2px solid ${css.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: css.text, letterSpacing: "-0.01em", flexShrink: 0 }}>DAY {dayNum}</span>
                        <span style={{ fontSize: 12, color: css.text3, fontWeight: 600, letterSpacing: "0.02em", flexShrink: 0 }}>— {dayLabel}</span>
                        {dayLocationLabel && <span style={{ fontSize: 11, fontWeight: 600, color: css.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>· {dayLocationLabel}</span>}
                      </div>
                      {wx && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "'Geist Mono', monospace", color: css.text2, flexShrink: 0 }} title={wx.isHistorical ? "Typical weather (last year)" : "Forecast"}>
                          <span style={{ fontSize: 15 }}>{weatherIcon(wx.code).icon}</span>
                          <span style={{ fontWeight: 700 }}>{fmtTemp(wx.high)}</span>
                          <span style={{ color: css.text3, fontWeight: 500 }}>{fmtTemp(wx.low)}</span>
                          {wx.isHistorical && <span style={{ fontSize: 9, color: css.text3, fontWeight: 500 }}>typ.</span>}
                        </div>
                      )}
                    </div>

                    {/* Timeline items */}
                    {daySegs.map((seg, segIdx) => {
                      const info = segTypeInfo(seg.type);
                      const time = segTime(seg);
                      const title = segTitle(seg);
                      const subtitle = segSubtitle(seg);
                      const isLast = segIdx === daySegs.length - 1;

                      return (
                        <React.Fragment key={segIdx}>
                        <div style={{ display: "flex", gap: 16, marginLeft: 8 }}>
                          {/* Timeline column */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 52, flexShrink: 0 }}>
                            {time && <div style={{ fontSize: 12, fontWeight: 600, color: css.text2, fontFamily: "'Geist Mono', monospace", marginBottom: 4, width: "100%", textAlign: "right", paddingRight: 12 }}>{time}</div>}
                            {!time && <div style={{ height: 18 }} />}
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: info.color, flexShrink: 0 }} />
                            {!isLast && <div style={{ width: 2, flex: 1, background: css.border, minHeight: 40 }} />}
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, paddingBottom: isLast && !layoverMap.has(seg) ? 0 : 16, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                              <div style={{ fontSize: 16, fontWeight: 700, color: css.text, marginBottom: 4, lineHeight: 1.3 }}>{title}</div>
                              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                <button onClick={() => editSegment(trip.id, realSegs.indexOf(seg))} style={{ padding: "3px 8px", border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 10, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor = css.accent; e.currentTarget.style.color = css.accent; }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor = css.border; e.currentTarget.style.color = css.text3; }}>Edit</button>
                                <button onClick={() => { if (confirm("Delete this item?")) deleteSegment(trip.id, realSegs.indexOf(seg)); }} style={{ padding: "3px 8px", border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#ef4444", fontSize: 10, fontWeight: 600, cursor: "pointer", opacity: 0.6, transition: "opacity 0.12s" }}
                                  onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}>Delete</button>
                              </div>
                            </div>
                            {subtitle && <div style={{ fontSize: 13, color: css.text3, marginBottom: 4, lineHeight: 1.5 }}>
                              {segLocation(seg) ? (
                                <>{subtitle.split(segLocation(seg)).map((part, pi, arr) => (
                                  <React.Fragment key={pi}>
                                    {part}
                                    {pi < arr.length - 1 && <LocationLink location={`${seg.property || seg.activityName || seg.restaurantName || ""} ${segLocation(seg)}`}>{segLocation(seg)}</LocationLink>}
                                  </React.Fragment>
                                ))}</>
                              ) : subtitle}
                            </div>}
                            {/* Arrival time for flights */}
                            {seg.type === "flight" && seg.arrivalTime && (
                              <div style={{ fontSize: 12, color: css.text2, fontFamily: "'Geist Mono', monospace", marginBottom: 6 }}>
                                Arrives {seg.arrivalTime}{seg.arrivalTerminal ? ` · Terminal ${seg.arrivalTerminal}` : ""}
                              </div>
                            )}
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                              <span style={{ fontSize: 10, fontWeight: 600, color: info.color, background: `${info.color}12`, border: `1px solid ${info.color}25`, padding: "2px 8px" }}>{info.label}</span>
                              {seg.confirmationCode && <span style={{ fontSize: 10, fontWeight: 600, color: css.text2, background: css.surface2, padding: "2px 8px", fontFamily: "'Geist Mono', monospace" }}>{seg.confirmationCode}</span>}
                              {(seg.cost || seg.totalCost || seg.ticketPrice) && <span style={{ fontSize: 10, fontWeight: 600, color: css.text3, padding: "2px 8px" }}>{parseFloat(seg.cost || seg.totalCost || seg.ticketPrice || 0).toLocaleString()} {seg.currency || "USD"}</span>}
                            </div>
                          </div>
                        </div>
                        {/* Layover connector between flights */}
                        {layoverMap.has(seg) && (() => {
                          const lo = layoverMap.get(seg);
                          return (
                            <div style={{ display: "flex", gap: 16, marginLeft: 8, marginBottom: 8 }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 52, flexShrink: 0 }}>
                                <div style={{ width: 0, borderLeft: `2px dashed ${css.warning}40`, flex: 1, minHeight: 32 }} />
                              </div>
                              <div style={{ flex: 1, padding: "8px 14px", background: `${css.warning}08`, border: `1px dashed ${css.warning}30`, display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 6, height: 6, background: css.warning, borderRadius: "50%", flexShrink: 0 }} />
                                <div style={{ fontSize: 12, fontWeight: 600, color: css.warning }}>
                                  {lo.duration} layover at <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 800 }}>{lo.airport}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        </React.Fragment>
                      );
                    })}
                  </div>
                );
              });
              })()}
            </div>
          )}


          {/* Booking Management — built from segments */}
          {realSegs.length > 0 && (() => {
            // Collect unique bookings from segments
            const bookings = [];
            const seenConf = new Set();
            // Airlines — match by airline name or flight number prefix
            // Build airline lookup — match by full name or flight number prefix (e.g. BA → British Airways)
            const airlineByName = {};
            const airlineByCode = {};
            Object.entries(AIRLINE_CS).forEach(([k, v]) => { airlineByName[v.name.toLowerCase()] = { ...v, key: k }; });
            // Map 2-letter IATA codes to AIRLINE_CS entries
            const codeMap = { AA: "aa", DL: "dl", UA: "ua", WN: "sw", B6: "b6", AS: "atmos", F9: "frontier", NK: "spirit", AF: "flying_blue", KL: "flying_blue", BA: "ba_avios", AC: "aeroplan", EK: "emirates_skywards", TK: "turkish_miles", QF: "qantas_ff", SQ: "singapore_kf", CX: "cathay_mp" };
            realSegs.forEach(seg => {
              if (seg.type === "flight") {
                const airlineName = seg.airline || "";
                // Try exact name match first, then flight number prefix
                const exactMatch = Object.entries(airlineByName).find(([name]) => airlineName.toLowerCase() === name);
                const fnCode = (seg.flightNumber || "").slice(0, 2).toUpperCase();
                const codeKey = codeMap[fnCode];
                const cs = exactMatch ? exactMatch[1] : (codeKey && AIRLINE_CS[codeKey] ? { ...AIRLINE_CS[codeKey], key: codeKey } : null);
                const conf = seg.confirmationCode || "";
                const label = cs?.name || airlineName || seg.flightNumber || "Flight";
                // Dedup by airline name — merge confirmation codes
                const existing = bookings.find(b => b.type === "flight" && b.label === label);
                if (existing) {
                  if (conf && !existing.conf) existing.conf = conf;
                  return;
                }
                if (conf && seenConf.has(conf)) return;
                if (conf) seenConf.add(conf);
                if (airlineName || conf || seg.flightNumber) bookings.push({ type: "flight", label, conf, phone: cs?.phone || "", manage: cs?.manage || "", color: "#3b82f6" });
              } else if (seg.type === "hotel" || seg.type === "accommodation") {
                const conf = seg.confirmationCode || "";
                if (conf && seenConf.has(conf)) return;
                if (conf) seenConf.add(conf);
                if (seg.property || conf) bookings.push({ type: "hotel", label: seg.property || "Hotel", conf, phone: "", manage: "", color: "#8b5cf6" });
              } else if (seg.confirmationCode) {
                if (seenConf.has(seg.confirmationCode)) return;
                seenConf.add(seg.confirmationCode);
                const segInfo = segTypeInfo(seg.type);
                bookings.push({ type: seg.type, label: seg.activityName || seg.restaurantName || seg.operator || seg.company || seg.loungeName || segInfo.label, conf: seg.confirmationCode, phone: "", manage: "", color: segInfo.color });
              }
            });
            if (bookings.length === 0) return null;
            return (
              <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 0, padding: "20px 24px", marginBottom: 20, borderLeft: `3px solid ${css.accent}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: css.text, marginBottom: 14 }}>Booking Management</div>
                {bookings.map((b, i) => (
                  <div key={i} style={{ padding: "10px 0", borderBottom: i < bookings.length - 1 ? `1px solid ${css.border}` : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: b.color, background: `${b.color}15`, padding: "2px 6px" }}>{b.type === "flight" ? "Flight" : b.type === "hotel" ? "Hotel" : b.type}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{b.label}</span>
                      </div>
                      {b.conf && <span style={{ fontSize: 12, fontWeight: 700, color: css.accent, fontFamily: "'Geist Mono', monospace", flexShrink: 0 }}>{b.conf}</span>}
                    </div>
                    {(b.phone || b.manage) && (
                      <div style={{ display: "flex", gap: 12, marginTop: 6, paddingLeft: 2 }}>
                        {b.phone && <span style={{ fontSize: 11, color: css.text2 }}>{b.phone}</span>}
                        {b.manage && <a href={b.manage} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: css.accent, textDecoration: "none" }}>Manage Booking ↗</a>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Expenses for this trip */}
          {tripExps.length > 0 && (
            <div style={{
              background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "20px 24px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: css.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15 }}>—</span> Expenses · <span style={{ fontFamily: "'Geist Mono', monospace", color: css.accent }}>${tripTotal.toLocaleString()}</span>
              </div>
              {tripExps.map(exp => {
                const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                return (
                  <div key={exp.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${css.border}` }}>
                    {cat && <span style={{ fontSize: 9, fontWeight: 700, color: cat.color, background: `${cat.color}15`, padding: "2px 6px", flexShrink: 0 }}>{cat.label}</span>}
                    <span style={{ fontSize: 12, color: css.text2, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description || exp.category}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: css.text, fontFamily: "'Geist Mono', monospace", flexShrink: 0 }}>{exp.amount?.toLocaleString()} {exp.currency || "USD"}</span>
                    <button onClick={() => setViewExpenseId(exp.id)} style={{ padding: "3px 8px", border: `1px solid ${css.accent}30`, background: "transparent", color: css.accent, fontSize: 10, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>View</button>
                    <button onClick={() => { setEditExpenseId(exp.id); setShowAddExpense(trip.id); setNewExpense({ ...exp, fxRate: exp.fxRate || 1 }); }} style={{ padding: "3px 8px", border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 10, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Edit</button>
                    <button onClick={() => removeExpense(exp.id)} style={{ padding: "3px 8px", border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#ef4444", fontSize: 10, fontWeight: 600, cursor: "pointer", flexShrink: 0, opacity: 0.6 }}>Delete</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
    <div>
      {/* Page header */}
      <div className="c-a1" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>2026 Travel Plan</div>
          <h2 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: isMobile ? 28 : 36, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>Your Trips</h2>
          <p style={{ color: css.text2, fontSize: 13, margin: "8px 0 0" }}>
            {trips.length} trips · {trips.filter(t => t.status === "confirmed").length} confirmed
            {grandTotal > 0 && <span style={{ marginLeft: 10, color: css.accent, fontFamily: "'Geist Mono', monospace" }}>${grandTotal.toLocaleString()} total spend</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Export Month PDF button */}
          <div style={{ position: "relative" }}>
            <button onClick={() => document.getElementById("cal-month-picker").showPicker?.()} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: css.surface2, border: `1px solid ${css.border}`, color: css.text2, transition: "all 0.15s",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
              Export PDF
            </button>
            <input id="cal-month-picker" type="month" defaultValue={new Date().toISOString().slice(0, 7)}
              onChange={e => { if (e.target.value) exportMonthPDF(e.target.value); }}
              style={{ position: "absolute", top: 0, left: 0, opacity: 0, pointerEvents: "none", width: "100%", height: "100%" }}
            />
          </div>
          {/* View toggle */}
          <div style={{ display: "flex", background: css.surface2, border: `1px solid ${css.border}`, borderRadius: 8, padding: 3, gap: 2 }}>
            {[{ v: "list", icon: "≡" }, { v: "calendar", icon: "▦" }].map(({ v, icon }) => (
              <button key={v} onClick={() => setTripsView(v)} style={{
                padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: tripsView === v ? css.surface : "transparent",
                color: tripsView === v ? css.text : css.text3,
                boxShadow: tripsView === v ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.15s",
              }}>{icon}</button>
            ))}
          </div>
          <button onClick={() => setShowImportItinerary(true)} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
            background: css.accentBg, border: `1px solid ${css.accentBorder}`, color: css.accent, transition: "all 0.15s",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            Import Itinerary
          </button>
          <button onClick={() => setShowCreateTrip(true)} className="c-btn-primary" style={{
            padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: css.accent, color: "#fff",
          }}>+ Add Trip</button>
        </div>
      </div>

      {/* Flighty instructions banner */}

      {/* Calendar view */}
      {tripsView === "calendar" && (() => {
        const pad = (n) => String(n).padStart(2, "0");
        const { year, month } = calViewMonth;
        const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);
        const today = new Date();
        const isToday = (d) => d && year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
        const getTripsForDay = (d) => {
          if (!d) return [];
          const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
          return trips.filter(t => {
            const segs = (t.segments && t.segments.length > 0) ? t.segments : (t.date ? [{ type: t.type, date: t.date, checkoutDate: t.checkoutDate, dropoffDate: t.dropoffDate, nights: t.nights }] : []);
            return segs.some(seg => {
              if (!seg.date) return false;
              if (seg.date === dateStr) return true;
              // Hotels span check-in through checkout
              if (seg.type === "hotel") {
                const checkout = seg.checkoutDate || (seg.nights > 1 ? (() => { const e = new Date(seg.date + "T12:00:00"); e.setDate(e.getDate() + seg.nights); return e.toISOString().slice(0,10); })() : null);
                if (checkout && dateStr > seg.date && dateStr < checkout) return true;
              }
              // Car rentals span pickup through dropoff
              if (seg.type === "car" && seg.dropoffDate && dateStr > seg.date && dateStr <= seg.dropoffDate) return true;
              return false;
            });
          });
        };
        const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return (
          <div>
            {/* Month navigator */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <button onClick={() => setCalViewMonth(p => { const d = new Date(p.year, p.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${css.border}`, background: css.surface, color: css.text, fontSize: 16, cursor: "pointer" }}>‹</button>
              <span style={{ fontSize: 16, fontWeight: 700, color: css.text, fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.02em" }}>{monthLabel}</span>
              <button onClick={() => setCalViewMonth(p => { const d = new Date(p.year, p.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${css.border}`, background: css.surface, color: css.text, fontSize: 16, cursor: "pointer" }}>›</button>
            </div>
            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 2 }}>
              {DAY_LABELS.map(d => (
                <div key={d} style={{ textAlign: "center", padding: "6px 0", fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.1em" }}>{d}</div>
              ))}
            </div>
            {/* Day grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isMobile ? 1 : 2 }}>
              {cells.map((d, i) => {
                const dayTrips = getTripsForDay(d);
                const dateStr = d ? `${year}-${pad(month + 1)}-${pad(d)}` : "";
                if (isMobile) {
                  // Compact single-page mobile view: date number + colored dots only
                  return (
                    <div key={i} onClick={() => {
                      if (d && dayTrips.length > 0) { setTripDetailId(dayTrips[0].id); setTripDetailSegIdx(0); }
                    }} style={{
                      background: d ? css.surface : "transparent",
                      border: `1px solid ${d ? (dayTrips.length > 0 ? css.accentBorder : css.border) : "transparent"}`,
                      borderRadius: 6, padding: "5px 2px 6px", textAlign: "center",
                      cursor: d && dayTrips.length > 0 ? "pointer" : "default",
                      minHeight: 44,
                    }}>
                      {d && <>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: isToday(d) ? 700 : 400, background: isToday(d) ? css.accent : "transparent", color: isToday(d) ? "#fff" : css.text2, margin: "0 auto 4px" }}>{d}</div>
                        <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                          {dayTrips.slice(0, 3).map((trip, ti) => {
                            const prog = allPrograms.find(p => p.id === trip.program);
                            const color = prog?.color || css.accent;
                            const allSegs = (trip.segments && trip.segments.length > 0) ? trip.segments : [{ type: trip.type, date: trip.date }];
                            const seg = allSegs.find(s => s.date === dateStr) || allSegs[0];
                            const segType = seg?.type || trip.type;
                            const dotIcon = "●";
                            return <div key={ti} style={{ width: 14, height: 14, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#fff" }}>{dotIcon}</div>;
                          })}
                          {dayTrips.length > 3 && <div style={{ fontSize: 7, color: css.text3, lineHeight: "14px" }}>+{dayTrips.length - 3}</div>}
                        </div>
                      </>}
                    </div>
                  );
                }
                return (
                  <div key={i} style={{ background: d ? css.surface : "transparent", border: `1px solid ${d ? css.border : "transparent"}`, borderRadius: 8, minHeight: 120, padding: "6px 6px 5px" }}>
                    {d && (
                      <>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: isToday(d) ? 700 : 400, background: isToday(d) ? css.accent : "transparent", color: isToday(d) ? "#fff" : css.text2, marginBottom: 4 }}>{d}</div>
                        {dayTrips.slice(0, 3).map((trip, ti) => {
                          const prog = allPrograms.find(p => p.id === trip.program);
                          const color = prog?.color || css.accent;
                          const allSegs = (trip.segments && trip.segments.length > 0) ? trip.segments : [{ type: trip.type, date: trip.date, route: trip.route, flightNumber: trip.flightNumber, departureTime: trip.departureTime, arrivalTime: trip.arrivalTime, property: trip.property, location: trip.location, nights: trip.nights, checkoutDate: trip.checkoutDate, dropoffDate: trip.dropoffDate }];
                          const daySegs = allSegs.filter(seg => {
                            if (!seg.date) return false;
                            if (seg.date === dateStr) return true;
                            if (seg.type === "hotel") { const co = seg.checkoutDate || null; if (co && dateStr > seg.date && dateStr < co) return true; }
                            if (seg.type === "car" && seg.dropoffDate && dateStr > seg.date && dateStr <= seg.dropoffDate) return true;
                            return false;
                          });
                          const seg = daySegs[0] || allSegs[0];
                          const segType = seg?.type || trip.type;
                          const icon = "";
                          const routeDisplay = segType === "flight"
                            ? (seg?.route ? seg.route.replace(/\s*[→>]\s*/g, " - ").replace(/\s*[–—]+\s*/g, " - ") : seg?.flightNumber || trip.route || "Flight")
                            : segType === "hotel" ? (seg?.property || seg?.location || trip.property || "Hotel")
                            : (seg?.pickupLocation || trip.location || "Car");
                          const flightNum = (() => { const fn = seg?.flightNumber || ""; const m = fn.match(/^([A-Z]{1,3})\s*(\d+)$/); return m ? `${m[1]} ${m[2]}` : fn; })();
                          const timeRange = [seg?.departureTime, seg?.arrivalTime].filter(Boolean).join(" - ");
                          const hotelNights = (() => { const co = seg?.checkoutDate; return (co && seg?.date) ? Math.round((new Date(co) - new Date(seg.date)) / 86400000) : (seg?.nights || 0); })();
                          const subtext = segType === "flight" ? [flightNum, timeRange].filter(Boolean).join(" · ") : segType === "hotel" && hotelNights ? `${hotelNights} nights` : "";
                          const segIdx = daySegs[0] ? allSegs.indexOf(daySegs[0]) : 0;
                          return (
                            <div key={ti} onClick={() => { setTripDetailId(trip.id); setTripDetailSegIdx(Math.max(0, segIdx)); }}
                              title={[seg?.route || seg?.property, seg?.flightNumber, seg?.departureTime, seg?.arrivalTime].filter(Boolean).join(" · ")}
                              style={{ background: `${color}18`, borderLeft: `2px solid ${color}`, borderRadius: 3, padding: "3px 6px", marginBottom: 3, cursor: "pointer" }}>
                              <div style={{ fontSize: 9, fontWeight: 600, color: css.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{icon} {routeDisplay}</div>
                              {subtext && <div style={{ fontSize: 8, color: css.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{subtext}</div>}
                            </div>
                          );
                        })}
                        {dayTrips.length > 3 && <div style={{ fontSize: 9, color: css.text3, paddingLeft: 3 }}>+{dayTrips.length - 3} more</div>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Filters + List (only in list view) */}
      {tripsView === "list" && <>
      <div className="c-a2" style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search trips..."
          style={{
            padding: "8px 14px", background: css.surface, border: `1px solid ${css.border}`,
            borderRadius: 8, color: css.text, fontSize: 12, outline: "none", flex: 1, minWidth: 160,
            fontFamily: "'Instrument Sans', 'Outfit', sans-serif",
          }} />
        {["all", "confirmed", "planned", "wishlist"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: "8px 14px", borderRadius: 8, border: `1px solid ${filterStatus === s ? css.accentBorder : css.border}`,
            cursor: "pointer", fontSize: 11, fontWeight: 600,
            background: filterStatus === s ? css.accentBg : css.surface,
            color: filterStatus === s ? css.accent : css.text2, textTransform: "capitalize",
          }}>{s}</button>
        ))}
      </div>

      {/* Trip Cards — Upcoming */}
      {upcomingTripsFiltered.length > 0 && (
        <div style={{ fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'Geist Mono', monospace", marginBottom: 8 }}>
          Upcoming · {upcomingTripsFiltered.length}
        </div>
      )}
      <div className="c-a3" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: pastTripsFiltered.length > 0 ? 28 : 0 }}>
        {upcomingTripsFiltered.map(trip => {
          const prog = allPrograms.find(p => p.id === trip.program);
          const sColor = trip.status === "confirmed" ? css.success : trip.status === "planned" ? css.warning : css.accent;
          const sBg = trip.status === "confirmed" ? css.successBg : trip.status === "planned" ? css.warningBg : css.accentBg;
          const tripExps = getTripExpenses(trip.id);
          const tripTotal = getTripTotal(trip.id);
          const isExpanded = expenseViewTrip === trip.id;
          const catBreakdown = EXPENSE_CATEGORIES.map(cat => ({
            ...cat, total: tripExps.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
          })).filter(c => c.total > 0);

          return (
            <div key={trip.id} style={{
              background: css.surface, border: `1px solid ${isExpanded ? css.accentBorder : css.border}`,
              borderRadius: 14, overflow: "hidden",
              boxShadow: D ? "none" : isExpanded ? "0 4px 20px rgba(212,116,45,0.1)" : "0 1px 4px rgba(26,21,18,0.04)",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}>
              {/* Trip header row */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap",
                gap: 12, padding: "16px 20px", cursor: "pointer",
              }} onClick={() => setExpenseViewTrip(isExpanded ? null : trip.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", flex: 1, minWidth: 0 }} onClick={e => { e.stopPropagation(); setTripDetailId(trip.id); setTripDetailSegIdx(0); }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${css.accent}15`, border: `1px solid ${css.accent}25`,
                    flexShrink: 0,
                  }}>
                    <SegIcon type={(() => { const segs = (trip.segments || []).filter(s => !s._isMeta); if (segs.length === 0) return "pin"; if (segs.some(s => s.type === "flight")) return "flight"; if (segs.some(s => s.type === "hotel" || s.type === "accommodation")) return "hotel"; return "pin"; })()} size={20} color={css.accent} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    {trip.tripName && <div style={{ fontSize: 11, fontWeight: 600, color: css.accent, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{trip.tripName}</div>}
                    <div style={{ fontSize: 14, fontWeight: 600, color: css.text }}>{trip.location || trip.tripName || trip.trip_name || "Trip"}</div>
                    <div style={{ fontSize: 11, color: css.text3, marginTop: 2, fontFamily: "'Geist Mono', monospace" }}>
                      {formatTripDates(trip)}
                    </div>
                    {trip._shared && <div style={{ fontSize: 10, fontWeight: 600, color: "#3b82f6", marginTop: 3 }}>Shared by {trip._sharedBy}</div>}
                  </div>
                  <span style={{ fontSize: 10, color: css.accent, fontWeight: 600, opacity: 0.6, flexShrink: 0 }}>View →</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 10, flexShrink: 0 }}>
                  {/* Expense total — desktop only */}
                  {!isMobile && tripTotal > 0 && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>${tripTotal.toLocaleString()}</div>
                      <div style={{ fontSize: 9, color: css.text3 }}>{tripExps.length} exp.</div>
                    </div>
                  )}
                  {/* Points — desktop only */}
                  {!isMobile && trip.estimatedPoints > 0 && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: css.gold, fontFamily: "'Geist Mono', monospace" }}>+{trip.estimatedPoints.toLocaleString()}</div>
                      <div style={{ fontSize: 9, color: css.text3 }}>pts</div>
                    </div>
                  )}
                  <span style={{ fontSize: 10, fontWeight: 600, color: sColor, background: sBg, border: `1px solid ${sColor}30`, borderRadius: 20, padding: "3px 10px", textTransform: "capitalize" }}>{trip.status}</span>
                  {/* Add Expense */}
                  <button onClick={e => { e.stopPropagation(); setShowAddExpense(trip.id); }} style={{
                    padding: "5px 11px", borderRadius: 8, border: `1px solid ${css.accentBorder}`,
                    background: css.accentBg, color: css.accent, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}>+ Exp</button>
                  {/* Chevron expand */}
                  <span style={{ color: css.text3, fontSize: 12, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
                  {/* Desktop-only: Calendar, Edit, Delete */}
                  {!isMobile && <>
                    <button onClick={e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setCalendarPopover(calendarPopover?.id === trip.id ? null : { id: trip.id, top: r.bottom + 6, right: window.innerWidth - r.right }); }} style={{
                      padding: "5px 10px", borderRadius: 8, border: `1px solid ${css.border}`,
                      background: calendarPopover?.id === trip.id ? css.surface2 : "transparent",
                      color: css.text2, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Calendar
                    </button>
                    <button onClick={e => { e.stopPropagation(); openEditTrip(trip); }} style={{
                      width: 28, height: 28, borderRadius: 8, border: `1px solid ${css.border}`,
                      background: "rgba(255,255,255,0.04)", color: css.text2,
                      fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }} title="Edit trip">✎</button>
                    <button onClick={e => { e.stopPropagation(); removeTrip(trip.id); }} style={{
                      width: 28, height: 28, borderRadius: 8, border: `1px solid ${D ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)"}`,
                      background: "rgba(239,68,68,0.06)", color: "#ef4444",
                      fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }} title="Delete trip">×</button>
                  </>}
                </div>
              </div>

              {/* Expense drawer — expands inline */}
              {isExpanded && (
                <div style={{ borderTop: `1px solid ${css.border}`, background: css.surface2 }}>
                  {/* Drawer header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: css.text2 }}>
                      {tripExps.length > 0
                        ? <><span style={{ color: css.text, fontFamily: "'Geist Mono', monospace" }}>${tripTotal.toLocaleString()}</span> · {tripExps.length} expense{tripExps.length !== 1 ? "s" : ""}</>
                        : "No expenses yet"}
                      {isMobile && trip.estimatedPoints > 0 && <span style={{ marginLeft: 8, color: css.gold, fontFamily: "'Geist Mono', monospace" }}>· +{trip.estimatedPoints.toLocaleString()} pts</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button onClick={e => { e.stopPropagation(); setShowExpenseReport(trip.id); }} style={{
                        padding: "5px 12px", borderRadius: 7, border: `1px solid ${css.border}`,
                        background: "transparent", color: css.text2, fontSize: 11, fontWeight: 600, cursor: "pointer",
                      }}>Export Report ↗</button>
                      {isMobile && <>
                        <button onClick={e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setCalendarPopover(calendarPopover?.id === trip.id ? null : { id: trip.id, top: r.bottom + 6, right: window.innerWidth - r.right }); }} style={{
                          width: 30, height: 30, borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }} title="Add to calendar">📅</button>
                        <button onClick={e => { e.stopPropagation(); openEditTrip(trip); }} style={{
                          width: 30, height: 30, borderRadius: 8, border: `1px solid ${css.border}`, background: "rgba(255,255,255,0.04)", color: css.text2, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }} title="Edit trip">✎</button>
                        <button onClick={e => { e.stopPropagation(); removeTrip(trip.id); }} style={{
                          width: 30, height: 30, borderRadius: 8, border: `1px solid rgba(239,68,68,0.2)`, background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }} title="Delete trip">×</button>
                      </>}
                    </div>
                  </div>

                  {/* Category breakdown bar */}
                  {tripTotal > 0 && (
                    <div style={{ padding: "0 20px 10px" }}>
                      <div style={{ display: "flex", height: 5, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                        {catBreakdown.map((cat, i) => (
                          <div key={i} style={{ width: `${(cat.total / tripTotal) * 100}%`, background: cat.color }} title={`${cat.label}: $${cat.total}`} />
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {catBreakdown.map((cat, i) => (
                          <span key={i} style={{ fontSize: 10, color: css.text3, display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cat.color, flexShrink: 0, display: "inline-block" }} />
                            {cat.label} <span style={{ fontFamily: "'Geist Mono', monospace", color: css.text2 }}>${cat.total.toLocaleString()}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expense rows */}
                  <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {tripExps.sort((a, b) => new Date(a.date) - new Date(b.date)).map(exp => {
                      const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                      const usdAmt = exp.amount * (exp.fxRate || 1);
                      const isForeign = exp.currency && exp.currency !== "USD";
                      return (
                        <div key={exp.id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
                          background: css.surface, borderRadius: 8, padding: "9px 12px", border: `1px solid ${css.border}`,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 15, flexShrink: 0 }}>{cat?.icon || "•"}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 500, color: css.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description}</div>
                              <div style={{ fontSize: 10, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>
                                {exp.date}{exp.paymentMethod ? ` · ${exp.paymentMethod}` : ""}{exp.receipt ? " · 🧾" : ""}
                                {isForeign ? ` · ${exp.currency} @ ${exp.fxRate}` : ""}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: usdAmt === 0 ? css.success : css.text, fontFamily: "'Geist Mono', monospace" }}>
                                {usdAmt === 0 ? "Free" : `$${usdAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                              </div>
                              {isForeign && (
                                <div style={{ fontSize: 9, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>
                                  {exp.amount.toLocaleString()} {exp.currency}
                                </div>
                              )}
                            </div>
                            <button onClick={() => {
                              setNewExpense({ ...exp, amount: String(exp.amount), fxRate: exp.fxRate || 1 });
                              setEditExpenseId(exp.id);
                              setShowAddExpense(exp.tripId);
                            }} style={{
                              width: 22, height: 22, borderRadius: 6, border: "none",
                              background: css.accentBg, color: css.accent,
                              fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            }}>✎</button>
                            <button onClick={() => removeExpense(exp.id)} style={{
                              width: 22, height: 22, borderRadius: 6, border: "none",
                              background: "rgba(239,68,68,0.08)", color: "#ef4444",
                              fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            }}>×</button>
                          </div>
                        </div>
                      );
                    })}
                    {/* Add expense CTA in drawer */}
                    <button onClick={e => { e.stopPropagation(); setShowAddExpense(trip.id); }} style={{
                      width: "100%", padding: "8px 0", borderRadius: 8, border: `1px dashed ${css.border}`,
                      background: "transparent", color: css.text3, fontSize: 12, cursor: "pointer", marginTop: 4,
                    }}>+ Add expense</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {upcomingTripsFiltered.length === 0 && pastTripsFiltered.length === 0 && (
          <div style={{ textAlign: "center", padding: "56px 20px", color: css.text3, fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>—</div>
            {trips.length === 0 ? (
              <><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: css.text2, marginBottom: 8 }}>No trips yet</div>
              <button onClick={() => setShowCreateTrip(true)} style={{ background: "none", border: "none", color: css.accent, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Add your first trip →</button></>
            ) : "No trips match your filters"}
          </div>
        )}
      </div>

      {/* Past Trips Section */}
      {pastTripsFiltered.length > 0 && (
        <div>
          <button onClick={() => setPastTripsExpanded(p => !p)} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            background: "none", border: "none", cursor: "pointer", padding: "4px 0", marginBottom: 12, textAlign: "left",
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'Geist Mono', monospace" }}>
              Past Trips · {pastTripsFiltered.length}
            </span>
            <span style={{ fontSize: 12, color: css.text3, transform: pastTripsExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block", marginLeft: "auto" }}>▾</span>
          </button>
          {pastTripsExpanded && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pastTripsFiltered.map(trip => {
                const prog = allPrograms.find(p => p.id === trip.program);
                const sColor = trip.status === "confirmed" ? css.success : trip.status === "planned" ? css.warning : css.accent;
                const sBg = trip.status === "confirmed" ? css.successBg : trip.status === "planned" ? css.warningBg : css.accentBg;
                const tripExps = getTripExpenses(trip.id);
                const tripTotal = getTripTotal(trip.id);
                const isExpanded = expenseViewTrip === trip.id;
                const catBreakdown = EXPENSE_CATEGORIES.map(cat => ({
                  ...cat, total: tripExps.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
                })).filter(c => c.total > 0);
                return (
                  <div key={trip.id} style={{
                    background: css.surface, border: `1px solid ${isExpanded ? css.accentBorder : css.border}`,
                    borderRadius: 14, overflow: "hidden", opacity: 0.85,
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap",
                      gap: 12, padding: "16px 20px", cursor: "pointer",
                    }} onClick={() => setExpenseViewTrip(isExpanded ? null : trip.id)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", flex: 1, minWidth: 0 }} onClick={e => { e.stopPropagation(); setTripDetailId(trip.id); setTripDetailSegIdx(0); }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                          background: prog ? `${prog.color}15` : css.surface2, border: `1px solid ${prog ? prog.color + "25" : css.border}`,
                          flexShrink: 0,
                        }}>
                          {(() => { const segs = trip.segments; if (segs && segs.length > 1) return ""; const t = (segs && segs[0]?.type) || trip.type; return ""; })()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          {trip.tripName && <div style={{ fontSize: 11, fontWeight: 600, color: css.accent, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{trip.tripName}</div>}
                          <div style={{ fontSize: 14, fontWeight: 600, color: css.text }}>{trip.location || trip.route || trip.property || trip.tripName || trip.trip_name || "Trip"}</div>
                          <div style={{ fontSize: 11, color: css.text3, marginTop: 2, fontFamily: "'Geist Mono', monospace" }}>
                            {formatTripDates(trip)}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, color: css.accent, fontWeight: 600, opacity: 0.6, flexShrink: 0 }}>View →</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 10, flexShrink: 0 }}>
                        {!isMobile && tripTotal > 0 && (
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>${tripTotal.toLocaleString()}</div>
                            <div style={{ fontSize: 9, color: css.text3 }}>{tripExps.length} exp.</div>
                          </div>
                        )}
                        {!isMobile && trip.estimatedPoints > 0 && (
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: css.gold, fontFamily: "'Geist Mono', monospace" }}>+{trip.estimatedPoints.toLocaleString()}</div>
                            <div style={{ fontSize: 9, color: css.text3 }}>pts</div>
                          </div>
                        )}
                        <span style={{ fontSize: 10, fontWeight: 600, color: sColor, background: sBg, border: `1px solid ${sColor}30`, borderRadius: 20, padding: "3px 10px", textTransform: "capitalize" }}>{trip.status}</span>
                        <button onClick={e => { e.stopPropagation(); setShowAddExpense(trip.id); }} style={{
                          padding: "5px 11px", borderRadius: 8, border: `1px solid ${css.accentBorder}`,
                          background: css.accentBg, color: css.accent, fontSize: 11, fontWeight: 600, cursor: "pointer",
                        }}>+ Exp</button>
                        <span style={{ color: css.text3, fontSize: 12, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
                        {!isMobile && <>
                          <button onClick={e => { e.stopPropagation(); openEditTrip(trip); }} style={{
                            width: 28, height: 28, borderRadius: 8, border: `1px solid ${css.border}`,
                            background: "rgba(255,255,255,0.04)", color: css.text2,
                            fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }} title="Edit trip">✎</button>
                          <button onClick={e => { e.stopPropagation(); removeTrip(trip.id); }} style={{
                            width: 28, height: 28, borderRadius: 8, border: `1px solid ${D ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)"}`,
                            background: "rgba(239,68,68,0.06)", color: "#ef4444",
                            fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }} title="Delete trip">×</button>
                        </>}
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ borderTop: `1px solid ${css.border}`, background: css.surface2 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", gap: 10, flexWrap: "wrap" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: css.text2 }}>
                            {tripExps.length > 0
                              ? <><span style={{ color: css.text, fontFamily: "'Geist Mono', monospace" }}>${tripTotal.toLocaleString()}</span> · {tripExps.length} expense{tripExps.length !== 1 ? "s" : ""}</>
                              : "No expenses yet"}
                            {isMobile && trip.estimatedPoints > 0 && <span style={{ marginLeft: 8, color: css.gold, fontFamily: "'Geist Mono', monospace" }}>· +{trip.estimatedPoints.toLocaleString()} pts</span>}
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button onClick={e => { e.stopPropagation(); setShowExpenseReport(trip.id); }} style={{
                              padding: "5px 12px", borderRadius: 7, border: `1px solid ${css.border}`,
                              background: "transparent", color: css.text2, fontSize: 11, fontWeight: 600, cursor: "pointer",
                            }}>Export Report ↗</button>
                            {isMobile && <>
                              <button onClick={e => { e.stopPropagation(); openEditTrip(trip); }} style={{
                                width: 30, height: 30, borderRadius: 8, border: `1px solid ${css.border}`, background: "rgba(255,255,255,0.04)", color: css.text2, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              }} title="Edit trip">✎</button>
                              <button onClick={e => { e.stopPropagation(); removeTrip(trip.id); }} style={{
                                width: 30, height: 30, borderRadius: 8, border: `1px solid rgba(239,68,68,0.2)`, background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              }} title="Delete trip">×</button>
                            </>}
                          </div>
                        </div>
                        {tripTotal > 0 && (
                          <div style={{ padding: "0 20px 10px" }}>
                            <div style={{ display: "flex", height: 5, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                              {catBreakdown.map((cat, i) => (
                                <div key={i} style={{ width: `${(cat.total / tripTotal) * 100}%`, background: cat.color }} title={`${cat.label}: $${cat.total}`} />
                              ))}
                            </div>
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                              {catBreakdown.map((cat, i) => (
                                <span key={i} style={{ fontSize: 10, color: css.text3, display: "flex", alignItems: "center", gap: 4 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: cat.color, flexShrink: 0, display: "inline-block" }} />
                                  {cat.label} <span style={{ fontFamily: "'Geist Mono', monospace", color: css.text2 }}>${cat.total.toLocaleString()}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                          {tripExps.sort((a, b) => new Date(a.date) - new Date(b.date)).map(exp => {
                            const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                            const usdAmt = exp.amount * (exp.fxRate || 1);
                            const isForeign = exp.currency && exp.currency !== "USD";
                            return (
                              <div key={exp.id} style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
                                background: css.surface, borderRadius: 8, padding: "9px 12px", border: `1px solid ${css.border}`,
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                                  <span style={{ fontSize: 15, flexShrink: 0 }}>{cat?.icon || "•"}</span>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: css.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description}</div>
                                    <div style={{ fontSize: 10, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>
                                      {exp.date}{exp.paymentMethod ? ` · ${exp.paymentMethod}` : ""}{exp.receipt ? " · 🧾" : ""}
                                      {isForeign ? ` · ${exp.currency} @ ${exp.fxRate}` : ""}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                  <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: usdAmt === 0 ? css.success : css.text, fontFamily: "'Geist Mono', monospace" }}>
                                      {usdAmt === 0 ? "Free" : `$${usdAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    </div>
                                    {isForeign && <div style={{ fontSize: 9, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>{exp.amount.toLocaleString()} {exp.currency}</div>}
                                  </div>
                                  <button onClick={() => { setNewExpense({ ...exp, amount: String(exp.amount), fxRate: exp.fxRate || 1 }); setEditExpenseId(exp.id); setShowAddExpense(exp.tripId); }} style={{
                                    width: 22, height: 22, borderRadius: 6, border: "none",
                                    background: css.accentBg, color: css.accent,
                                    fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>✎</button>
                                  <button onClick={() => removeExpense(exp.id)} style={{
                                    width: 22, height: 22, borderRadius: 6, border: "none",
                                    background: "rgba(239,68,68,0.08)", color: "#ef4444",
                                    fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>×</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </>}

      {/* Global calendar popover — fixed position so it escapes overflow:hidden cards */}
      {calendarPopover && (() => {
        const trip = trips.find(t => t.id === calendarPopover.id);
        if (!trip) return null;
        return (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 199 }} />
            <div style={{ position: "fixed", top: calendarPopover.top, right: calendarPopover.right, zIndex: 200, background: css.surface, border: `1px solid ${css.border}`, borderRadius: 10, padding: 6, minWidth: 175, boxShadow: "0 8px 28px rgba(0,0,0,0.35)" }}>
              <a href={getTripGoogleCalUrl(trip)} target="_blank" rel="noopener noreferrer" onClick={() => setCalendarPopover(null)}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 7, fontSize: 12, fontWeight: 500, color: css.text, textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.background = css.surface2}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <svg width="14" height="14" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M43.6 20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/>
                  <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z"/>
                  <path fill="#FBBC05" d="M24 44c5.2 0 9.9-1.8 13.6-4.7l-6.3-5.2C29.4 35.7 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.7 39.6 16.4 44 24 44z"/>
                  <path fill="#EA4335" d="M43.6 20H24v8h11.3c-.7 2.1-2 3.9-3.7 5.1l6.3 5.2C41.4 34.9 44 29.8 44 24c0-1.3-.1-2.7-.4-4z"/>
                </svg>
                Google Calendar
              </a>
              <a href={getTripOutlookUrl(trip)} target="_blank" rel="noopener noreferrer" onClick={() => setCalendarPopover(null)}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 7, fontSize: 12, fontWeight: 500, color: css.text, textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.background = css.surface2}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <svg width="14" height="14" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                  <rect width="48" height="48" rx="4" fill="#0078D4"/>
                  <rect x="6" y="10" width="22" height="28" rx="2" fill="white" opacity="0.95"/>
                  <rect x="28" y="18" width="14" height="20" rx="1" fill="white" opacity="0.7"/>
                  <line x1="10" y1="18" x2="24" y2="18" stroke="#0078D4" strokeWidth="2"/>
                  <line x1="10" y1="23" x2="24" y2="23" stroke="#0078D4" strokeWidth="2"/>
                  <line x1="10" y1="28" x2="24" y2="28" stroke="#0078D4" strokeWidth="2"/>
                </svg>
                Outlook
              </a>
              <div style={{ height: 1, background: css.border, margin: "4px 6px" }} />
              <button onClick={() => { downloadTripICS(trip); setCalendarPopover(null); }}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 7, fontSize: 12, fontWeight: 500, color: css.text, width: "100%", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                onMouseEnter={e => e.currentTarget.style.background = css.surface2}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download .ics
              </button>
            </div>
          </>
        );
      })()}
    </div>
  );
  };

  const renderExpenses = () => { setActiveView("trips"); return null; };


  const renderOptimizer = (_previewTab = null) => {
    const _tab = _previewTab || optimizerTab;
    const flightTrips = trips.filter(t => t.type === "flight");
    const airlines = LOYALTY_PROGRAMS.airlines;

    // Helper: estimate points a trip would earn if credited to a given airline
    const estimatePts = (trip, airline) => {
      const rate = airline.earnRate || {};
      const cls = trip.class || "domestic";
      const perMile = rate[cls] || rate.domestic || 5;
      // Use estimatedPoints as base proxy for "miles flown × base rate" of original airline
      const origAirline = airlines.find(a => a.id === trip.program);
      const origRate = origAirline?.earnRate?.[cls] || origAirline?.earnRate?.domestic || 5;
      const baseMiles = origRate > 0 ? (trip.estimatedPoints || 0) / origRate : 0;
      return Math.round(baseMiles * perMile);
    };

    // Helper: given a program and total points, find current tier, next tier, % to next
    const tierProgress = (airline, totalPts) => {
      let currentTier = null, nextTier = null;
      for (const tier of airline.tiers) {
        if (totalPts >= tier.threshold) currentTier = tier;
      }
      nextTier = airline.tiers.find(t => t.threshold > totalPts) || null;
      const topTier = airline.tiers[airline.tiers.length - 1];
      const pctToNext = nextTier ? Math.min(100, Math.round((totalPts / nextTier.threshold) * 100)) : 100;
      return { currentTier, nextTier, topTier, pctToNext, totalPts };
    };

    // ── SECTION 1: Global optimizer — credit ALL trips to one program ──
    const globalResults = airlines.map(airline => {
      const account = linkedAccounts[airline.id];
      const existingPts = account?.currentPoints || account?.tierCredits || 0;
      const totalFromTrips = flightTrips.reduce((sum, t) => sum + estimatePts(t, airline), 0);
      const total = existingPts + totalFromTrips;
      const prog = tierProgress(airline, total);
      return { airline, existingPts, totalFromTrips, total, ...prog };
    }).sort((a, b) => {
      // Sort by: reached highest tier first, then by % to next tier
      const aTierIdx = a.airline.tiers.indexOf(a.currentTier);
      const bTierIdx = b.airline.tiers.indexOf(b.currentTier);
      if (aTierIdx !== bTierIdx) return bTierIdx - aTierIdx;
      return b.pctToNext - a.pctToNext;
    });
    const bestGlobal = globalResults[0];

    // ── SECTION 2: Trip-by-trip comparison ──
    const selectedTrip = flightTrips.find(t => t.id === optimizerTripId) || flightTrips[0];
    const tripResults = selectedTrip ? airlines.map(airline => {
      const account = linkedAccounts[airline.id];
      const existingPts = account?.currentPoints || account?.tierCredits || 0;
      const ptsFromTrip = estimatePts(selectedTrip, airline);
      const beforeProg = tierProgress(airline, existingPts);
      const afterProg = tierProgress(airline, existingPts + ptsFromTrip);
      return { airline, ptsFromTrip, existingPts, before: beforeProg, after: afterProg };
    }).filter(r => r.ptsFromTrip > 0).sort((a, b) => {
      // Sort by biggest % jump
      const aJump = a.after.pctToNext - a.before.pctToNext;
      const bJump = b.after.pctToNext - b.before.pctToNext;
      return bJump - aJump;
    }) : [];

    // ── SECTION 3: Alliance goal optimizer ──
    // Map alliance tier keys to the airline programs that can reach them
    const GOAL_OPTIONS = [
      { key: "sa_silver", label: "Star Alliance Silver" },
      { key: "sa_gold", label: "Star Alliance Gold" },
      { key: "ow_ruby", label: "Oneworld Ruby" },
      { key: "ow_sapphire", label: "Oneworld Sapphire" },
      { key: "ow_emerald", label: "Oneworld Emerald" },
      { key: "st_elite", label: "SkyTeam Elite" },
      { key: "st_elite_plus", label: "SkyTeam Elite Plus" },
    ];
    const goalResults = (() => {
      const goal = allianceGoal;
      // Find all airline programs that map to this alliance tier
      const candidates = Object.entries(ALLIANCE_MBR).map(([progId, meta]) => {
        const airline = airlines.find(a => a.id === progId);
        if (!airline) return null;
        // Find the tier name in this program that maps to the goal alliance tier
        const tierName = Object.entries(meta.tierMap).find(([, v]) => v === goal)?.[0];
        if (!tierName) return null;
        const tier = airline.tiers.find(t => t.name === tierName);
        if (!tier) return null;
        const account = linkedAccounts[progId];
        const existingPts = account?.currentPoints || account?.tierCredits || 0;
        const totalFromTrips = flightTrips.reduce((sum, t) => sum + estimatePts(t, airline), 0);
        const total = existingPts + totalFromTrips;
        const remaining = Math.max(0, tier.threshold - total);
        const pct = Math.min(100, Math.round((total / tier.threshold) * 100));
        const reached = total >= tier.threshold;
        return { airline, tierName, threshold: tier.threshold, existingPts, totalFromTrips, total, remaining, pct, reached, color: meta.color };
      }).filter(Boolean);
      return candidates.sort((a, b) => a.remaining - b.remaining);
    })();

    const OPT_TAB_LABELS = { itinerary: "Elite Status Calculator", global: "Global Status Optimizer", trip: "Trip-by-Trip Comparison", alliance: "Alliance Goal Optimizer", cards: "Credit Card Optimizer" };

    const BarFill = ({ pct, color }) => (
      <div style={{ width: "100%", height: 6, borderRadius: 3, background: css.surface2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.6s ease" }} />
      </div>
    );

    // ── Itinerary Calculator helpers ──
    const updateItinSeg = (id, field, value) => {
      setItinSegments(segs => segs.map(s => s.id === id ? { ...s, [field]: value } : s));
    };
    const addItinSeg = () => {
      const last = itinSegments[itinSegments.length - 1];
      setItinSegments(segs => [...segs, { id: crypto.randomUUID(), origin: last?.destination || "", destination: "", operatingAirline: last?.operatingAirline || "", marketingAirline: last?.marketingAirline || "", bookingClass: "", distance: "" }]);
    };
    const removeItinSeg = (id) => {
      if (itinSegments.length <= 1) return;
      setItinSegments(segs => segs.filter(s => s.id !== id));
    };

    // Calculate results for all airlines
    const calcItinResults = () => {
      // Eligible fare for LP/status earning = base fare + airline surcharges (YQ/YR) only.
      // Government taxes and other fees do NOT count toward revenue-based earning.
      const eligibleFare = (parseFloat(itinFare.baseFare) || 0) + (parseFloat(itinFare.airlineFees) || 0);
      const totalFare = eligibleFare; // used for earning calculation
      const segments = itinSegments.map(seg => {
        const dist = parseInt(seg.distance) || greatCircleMiles(seg.origin.toUpperCase().trim(), seg.destination.toUpperCase().trim());
        const opAirline = seg.operatingAirline;
        const cabin = getBookingClassCabin(opAirline, seg.bookingClass) || "economy";
        return { ...seg, distanceMiles: dist, cabin };
      });
      const totalDistance = segments.reduce((s, seg) => s + seg.distanceMiles, 0);
      const perSegFare = segments.length > 0 ? totalFare / segments.length : 0;

      // Calculate for each airline program, applying elite bonus if it's the selected crediting airline
      const results = airlines.filter(a => a.tiers && a.tiers.length > 0).map(airline => {
        // Look up elite bonus: only apply if this is the selected credit airline AND user has a current tier set
        const bonusMap = ELITE_BONUS_PCT[airline.id] || {};
        const eliteBonus = (airline.id === itinCreditAirline && itinCurrentTier) ? (bonusMap[itinCurrentTier] || 0) : 0;
        let totalCredits = 0;
        const segDetails = segments.map(seg => {
          const credits = calcSegmentCredits(airline.id, seg.operatingAirline, seg.cabin, seg.distanceMiles, perSegFare, eliteBonus, seg.bookingClass || "");
          totalCredits += credits;
          return { ...seg, credits };
        });
        const account = linkedAccounts[airline.id];
        const existingPts = account?.currentPoints || account?.tierCredits || 0;
        const projTotal = existingPts + totalCredits;
        const prog = tierProgress(airline, projTotal);
        return { airline, totalCredits, segDetails, existingPts, projTotal, totalDistance, totalFare, eliteBonus, ...prog };
      }).filter(r => r.totalCredits > 0).sort((a, b) => {
        const aIdx = a.airline.tiers.indexOf(a.currentTier);
        const bIdx = b.airline.tiers.indexOf(b.currentTier);
        if (aIdx !== bIdx) return bIdx - aIdx;
        return b.pctToNext - a.pctToNext;
      });
      return results;
    };

    const itinCalcResults = (_tab === "itinerary" && itinSegments.some(s => s.origin && s.destination)) ? calcItinResults() : [];

    // Tier journey bar component
    const TierJourneyBar = ({ airline, totalPts, color }) => {
      if (!airline.tiers || airline.tiers.length === 0) return null;
      const maxThreshold = airline.tiers[airline.tiers.length - 1].threshold;
      return (
        <div style={{ position: "relative", marginTop: 8 }}>
          <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", background: css.surface2, border: `1px solid ${css.border}` }}>
            {airline.tiers.map((tier, i) => {
              const prevThreshold = i > 0 ? airline.tiers[i - 1].threshold : 0;
              const width = ((tier.threshold - prevThreshold) / maxThreshold) * 100;
              const filled = Math.min(100, Math.max(0, ((totalPts - prevThreshold) / (tier.threshold - prevThreshold)) * 100));
              return (
                <div key={tier.name} style={{ width: `${width}%`, position: "relative", borderRight: i < airline.tiers.length - 1 ? `1px solid ${css.border}` : "none" }}>
                  <div style={{ width: `${filled}%`, height: "100%", background: color, transition: "width 0.8s ease" }} />
                </div>
              );
            })}
          </div>
          {/* Tier labels below */}
          <div style={{ display: "flex", position: "relative", marginTop: 4 }}>
            {airline.tiers.map((tier, i) => {
              const pos = (tier.threshold / maxThreshold) * 100;
              const reached = totalPts >= tier.threshold;
              return (
                <div key={tier.name} style={{ position: "absolute", left: `${pos}%`, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
                  <div style={{ fontSize: 8, fontWeight: reached ? 700 : 500, color: reached ? color : css.text3, fontFamily: "'Geist Mono', monospace" }}>
                    {tier.name}
                  </div>
                  <div style={{ fontSize: 7, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>
                    {tier.threshold >= 1000 ? `${Math.round(tier.threshold / 1000)}K` : tier.threshold}
                  </div>
                </div>
              );
            })}
            {/* Current position marker */}
            {totalPts > 0 && (
              <div style={{ position: "absolute", left: `${Math.min(100, (totalPts / maxThreshold) * 100)}%`, top: -14, transform: "translateX(-50%)" }}>
                <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `5px solid ${color}` }} />
              </div>
            )}
          </div>
        </div>
      );
    };

    const fieldStyle = { display: "block", width: "100%", padding: "8px 10px", background: css.surface2, border: `1px solid ${css.border}`, borderRadius: 7, color: css.text, fontSize: 12, fontFamily: "'Instrument Sans', 'Outfit', sans-serif", outline: "none", boxSizing: "border-box" };
    const labelStyle = { fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, display: "block" };

    return (
      <div>
        {/* Header */}
        <div className="c-a1" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>Strategy Engine</div>
          <h2 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: isMobile ? 28 : 36, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>{OPT_TAB_LABELS[_tab] || "Trip Optimizer"}</h2>
          <p style={{ color: css.text2, fontSize: 13, margin: "8px 0 0" }}>
            {_tab === "itinerary" ? "Enter your itinerary to see exactly where each flight puts you on every airline's elite status ladder" : `Credit flights strategically to accelerate elite status across ${airlines.length} airline programs`}
          </p>
        </div>

        {/* ── Itinerary Calculator Tab ── */}
        {_tab === "itinerary" && (
          <div>
            {/* Segment builder */}
            <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: isMobile ? "16px" : "24px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: css.text, marginBottom: 16 }}>Flight Segments</div>
              {itinSegments.map((seg, idx) => (
                <div key={seg.id} style={{ marginBottom: 16, padding: 16, background: css.surface2, border: `1px solid ${css.border}`, borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: css.accent }}>Segment {idx + 1}</div>
                    {itinSegments.length > 1 && (
                      <button onClick={() => removeItinSeg(seg.id)} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid rgba(239,68,68,0.2)`, background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    )}
                  </div>
                  {/* Route */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={labelStyle}>Origin (IATA)</label>
                      <input value={seg.origin} onChange={e => updateItinSeg(seg.id, "origin", e.target.value.toUpperCase().slice(0, 3))} placeholder="YYZ" maxLength={3} style={{ ...fieldStyle, textTransform: "uppercase", fontFamily: "'Geist Mono', monospace" }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Destination</label>
                      <input value={seg.destination} onChange={e => updateItinSeg(seg.id, "destination", e.target.value.toUpperCase().slice(0, 3))} placeholder="HKG" maxLength={3} style={{ ...fieldStyle, textTransform: "uppercase", fontFamily: "'Geist Mono', monospace" }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Distance (mi)</label>
                      <input type="number" value={seg.distance || ""} onChange={e => updateItinSeg(seg.id, "distance", e.target.value)}
                        placeholder={greatCircleMiles(seg.origin.toUpperCase().trim(), seg.destination.toUpperCase().trim()) || "auto"}
                        style={{ ...fieldStyle, fontFamily: "'Geist Mono', monospace" }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Booking Class</label>
                      <input value={seg.bookingClass} onChange={e => updateItinSeg(seg.id, "bookingClass", e.target.value.toUpperCase().slice(0, 1))} placeholder="J" maxLength={1} style={{ ...fieldStyle, textTransform: "uppercase", fontFamily: "'Geist Mono', monospace", textAlign: "center" }} />
                    </div>
                  </div>
                  {/* Airlines */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Operating Airline</label>
                      <select value={seg.operatingAirline} onChange={e => updateItinSeg(seg.id, "operatingAirline", e.target.value)} style={fieldStyle}>
                        <option value="">— Select —</option>
                        {airlines.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Marketing / Ticketing Airline</label>
                      <select value={seg.marketingAirline} onChange={e => updateItinSeg(seg.id, "marketingAirline", e.target.value)} style={fieldStyle}>
                        <option value="">— Same as operating —</option>
                        {airlines.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Auto distance + cabin display */}
                  {seg.origin && seg.destination && (
                    <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {(() => {
                        const dist = parseInt(seg.distance) || greatCircleMiles(seg.origin.toUpperCase().trim(), seg.destination.toUpperCase().trim());
                        const cabin = seg.bookingClass ? (getBookingClassCabin(seg.operatingAirline, seg.bookingClass) || "economy") : null;
                        return (<>
                          {dist > 0 && <span style={{ fontSize: 10, color: css.text3, fontFamily: "'Geist Mono', monospace", background: css.surface, padding: "3px 8px", borderRadius: 4 }}>📏 {dist.toLocaleString()} mi</span>}
                          {cabin && <span style={{ fontSize: 10, color: css.accent, fontFamily: "'Geist Mono', monospace", background: css.accentBg, padding: "3px 8px", borderRadius: 4 }}>{cabin.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>}
                        </>);
                      })()}
                    </div>
                  )}
                </div>
              ))}
              <button onClick={addItinSeg} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${css.accentBorder}`, background: css.accentBg, color: css.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Segment</button>
            </div>

            {/* Fare breakdown */}
            <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: isMobile ? "16px" : "24px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: css.text, marginBottom: 16 }}>Fare Breakdown</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Base Fare ✓</label>
                  <input type="number" value={itinFare.baseFare} onChange={e => setItinFare(f => ({ ...f, baseFare: e.target.value }))} placeholder="0.00" style={{ ...fieldStyle, fontFamily: "'Geist Mono', monospace", borderColor: itinFare.baseFare ? "rgba(14,165,160,0.3)" : undefined }} />
                </div>
                <div>
                  <label style={labelStyle}>Gov. Taxes</label>
                  <input type="number" value={itinFare.taxes} onChange={e => setItinFare(f => ({ ...f, taxes: e.target.value }))} placeholder="0.00" style={{ ...fieldStyle, fontFamily: "'Geist Mono', monospace", opacity: 0.7 }} />
                </div>
                <div>
                  <label style={labelStyle}>Carrier Surcharges (YQ/YR) ✓</label>
                  <input type="number" value={itinFare.airlineFees} onChange={e => setItinFare(f => ({ ...f, airlineFees: e.target.value }))} placeholder="0.00" style={{ ...fieldStyle, fontFamily: "'Geist Mono', monospace", borderColor: itinFare.airlineFees ? "rgba(14,165,160,0.3)" : undefined }} />
                </div>
                <div>
                  <label style={labelStyle}>Other Fees</label>
                  <input type="number" value={itinFare.otherFees} onChange={e => setItinFare(f => ({ ...f, otherFees: e.target.value }))} placeholder="0.00" style={{ ...fieldStyle, fontFamily: "'Geist Mono', monospace", opacity: 0.7 }} />
                </div>
              </div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>
                  Total: ${((parseFloat(itinFare.baseFare) || 0) + (parseFloat(itinFare.taxes) || 0) + (parseFloat(itinFare.airlineFees) || 0) + (parseFloat(itinFare.otherFees) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} {itinFare.currency}
                </div>
                <div style={{ fontSize: 10, color: css.accent, fontFamily: "'Geist Mono', monospace" }}>
                  Eligible for earning: ${((parseFloat(itinFare.baseFare) || 0) + (parseFloat(itinFare.airlineFees) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} (base + airline fees)
                </div>
              </div>
            </div>

            {/* Itinerary summary */}
            {itinSegments.some(s => s.origin && s.destination) && (
              <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "12px 20px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>ROUTE:</span>
                  {itinSegments.filter(s => s.origin && s.destination).map((s, i) => (
                    <span key={s.id} style={{ fontSize: 12, fontWeight: 600, color: css.text, fontFamily: "'Geist Mono', monospace" }}>
                      {i > 0 && <span style={{ color: css.text3, margin: "0 4px" }}>→</span>}
                      {s.origin} → {s.destination}
                    </span>
                  ))}
                  <span style={{ fontSize: 10, color: css.text3, fontFamily: "'Geist Mono', monospace", marginLeft: 8 }}>
                    {itinSegments.reduce((s, seg) => s + (parseInt(seg.distance) || greatCircleMiles(seg.origin.toUpperCase().trim(), seg.destination.toUpperCase().trim())), 0).toLocaleString()} total miles
                  </span>
                </div>
              </div>
            )}

            {/* Credit to which program? */}
            <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: isMobile ? "16px" : "24px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: css.text, marginBottom: 16 }}>Credit To Program</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Elite Status Program</label>
                  <select value={itinCreditAirline} onChange={e => setItinCreditAirline(e.target.value)} style={fieldStyle}>
                    <option value="">— Select Program —</option>
                    {airlines.filter(a => a.tiers && a.tiers.length > 0).map(a => <option key={a.id} value={a.id}>{a.name} ({a.unit})</option>)}
                  </select>
                </div>
                {itinCreditAirline && (() => {
                  const prog = airlines.find(a => a.id === itinCreditAirline);
                  if (!prog) return null;
                  const bonusMap = ELITE_BONUS_PCT[itinCreditAirline] || {};
                  const bonusPct = bonusMap[itinCurrentTier] || 0;
                  return (
                    <div>
                      <label style={labelStyle}>Current Elite Tier (prior year status — determines earning bonus)</label>
                      <select value={itinCurrentTier} onChange={e => setItinCurrentTier(e.target.value)} style={fieldStyle}>
                        <option value="">Base Member (no bonus)</option>
                        {prog.tiers.map(t => {
                          const b = bonusMap[t.name];
                          return <option key={t.name} value={t.name}>{t.name}{b ? ` (+${b}% bonus)` : ""}</option>;
                        })}
                      </select>
                      {bonusPct > 0 && (
                        <div style={{ fontSize: 10, color: css.accent, marginTop: 4, fontWeight: 600, fontFamily: "'Geist Mono', monospace" }}>
                          {itinCurrentTier}: +{bonusPct}% earning bonus applied to all segments
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              {itinCreditAirline && (() => {
                const prog = airlines.find(a => a.id === itinCreditAirline);
                if (!prog) return null;
                const account = linkedAccounts[itinCreditAirline];
                const existingPts = account?.currentPoints || account?.tierCredits || 0;
                return (
                  <div style={{ marginTop: 12, padding: "12px 16px", background: css.surface2, borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: css.text3 }}>Current year {prog.unit} (from Programs tab)</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>{existingPts.toLocaleString()}</span>
                    </div>
                    {existingPts === 0 && (
                      <div style={{ fontSize: 10, color: css.text3, marginTop: 6, lineHeight: 1.4 }}>
                        Enter your current year's {prog.unit} balance in the <button onClick={() => { setActiveView("programs"); }} style={{ background: "none", border: "none", color: css.accent, cursor: "pointer", fontSize: 10, fontWeight: 600, padding: 0, fontFamily: "inherit" }}>Programs tab →</button> and it will be reflected here.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Results: Single selected program detail */}
            {(() => {
              const r = itinCreditAirline ? itinCalcResults.find(r => r.airline.id === itinCreditAirline) : null;
              if (!r) {
                if (itinCreditAirline && itinSegments.some(s => s.origin && s.destination)) {
                  return (
                    <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "28px 24px", textAlign: "center" }}>
                      <div style={{ fontSize: 13, color: css.text2 }}>Add an operating airline and booking class to each segment to see earning projections.</div>
                    </div>
                  );
                }
                if (!itinCreditAirline && itinSegments.some(s => s.origin && s.destination)) {
                  return (
                    <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "28px 24px", textAlign: "center" }}>
                      <div style={{ fontSize: 13, color: css.text2 }}>Select a crediting program above to see your elite status earning projection.</div>
                    </div>
                  );
                }
                return null;
              }
              return (
                <div style={{ background: css.surface, border: `1px solid ${r.airline.color}40`, borderLeft: `4px solid ${r.airline.color}`, borderRadius: 14, padding: isMobile ? "16px" : "24px" }}>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <ProgramLogo prog={r.airline} size={28} />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: css.text }}>{r.airline.name}</div>
                        <div style={{ fontSize: 11, color: css.text3 }}>
                          {r.airline.unit}
                          {r.eliteBonus > 0 && <span style={{ color: css.accent, fontWeight: 600 }}> (+{r.eliteBonus}% elite bonus)</span>}
                          {" · "}
                          {(() => {
                            const rates = PARTNER_EARN_RATES[r.airline.id];
                            const isOwn = r.airline.id === (r.segDetails[0]?.operatingAirline || "");
                            const pEntry = rates?.[r.segDetails[0]?.operatingAirline] || {};
                            if (isOwn && (rates?._type === "fare_own" || rates?._type === "revenue")) return "Revenue-based (per $ spent)";
                            if (pEntry._fare) return "Revenue-based (per $ spent)";
                            if (rates?._type === "segment" || rates?._type === "fare_own") return "Distance-based (approx)";
                            return "Distance-based (% of miles flown)";
                          })()}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: r.airline.color, fontFamily: "'Geist Mono', monospace" }}>+{r.totalCredits.toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: css.text3 }}>{r.airline.unit} from this itinerary</div>
                    </div>
                  </div>

                  {/* Tier journey bar — large */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Elite Status Journey</div>
                    <TierJourneyBar airline={r.airline} totalPts={r.projTotal} color={r.airline.color} />
                  </div>

                  {/* Summary stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 24, marginBottom: 16 }}>
                    <div style={{ background: css.surface2, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>{r.existingPts.toLocaleString()}</div>
                      <div style={{ fontSize: 9, color: css.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Existing</div>
                    </div>
                    <div style={{ background: `${r.airline.color}12`, border: `1px solid ${r.airline.color}25`, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: r.airline.color, fontFamily: "'Geist Mono', monospace" }}>+{r.totalCredits.toLocaleString()}</div>
                      <div style={{ fontSize: 9, color: css.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>This Trip</div>
                    </div>
                    <div style={{ background: css.surface2, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>{r.projTotal.toLocaleString()}</div>
                      <div style={{ fontSize: 9, color: css.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Projected</div>
                    </div>
                  </div>

                  {/* Current / Next tier */}
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Projected Tier</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: r.currentTier ? r.airline.color : css.text3 }}>{r.currentTier?.name || "Base Member"}</div>
                      {r.currentTier?.perks && <div style={{ fontSize: 10, color: css.text2, marginTop: 2, lineHeight: 1.4 }}>{r.currentTier.perks}</div>}
                    </div>
                    {r.nextTier && (
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Next Tier</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: css.text2 }}>{r.nextTier.name}</div>
                        <div style={{ fontSize: 11, color: css.accent, fontWeight: 600, fontFamily: "'Geist Mono', monospace", marginTop: 2 }}>{(r.nextTier.threshold - r.projTotal).toLocaleString()} {r.airline.unit} remaining ({r.pctToNext}%)</div>
                      </div>
                    )}
                    {!r.nextTier && r.currentTier && (
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: css.success, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Top Tier Reached</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: css.success }}>Maximum Status</div>
                      </div>
                    )}
                  </div>

                  {/* Per-segment breakdown */}
                  <div style={{ borderTop: `1px solid ${css.border}`, paddingTop: 12 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Segment Breakdown</div>
                    {r.segDetails.map((sd, si) => {
                      const rates = PARTNER_EARN_RATES[r.airline.id];
                      const segIsOwn = r.airline.id === sd.operatingAirline;
                      const partnerEntry = rates?.[sd.operatingAirline] || rates?._default || {};
                      const useFare = (segIsOwn && (rates?._type === "fare_own" || rates?._type === "revenue")) || partnerEntry._fare;
                      // Resolve actual rate used (per-class if available, else cabin fallback)
                      const bc = (sd.bookingClass || "").toUpperCase();
                      let segRate = 0;
                      let rateLabel = "";
                      if (!segIsOwn && bc && PARTNER_CLASS_RATES[r.airline.id]?.[sd.operatingAirline]?.[bc] !== undefined) {
                        segRate = PARTNER_CLASS_RATES[r.airline.id][sd.operatingAirline][bc];
                        rateLabel = `class ${bc}: ${segRate}%`;
                      } else {
                        const segRates = rates?.[segIsOwn ? "_own" : sd.operatingAirline] || rates?._default || {};
                        segRate = segRates[sd.cabin] || 0;
                        rateLabel = useFare ? `${segRate}/$` : `${segRate}%`;
                      }
                      return (
                        <div key={si} style={{ padding: "6px 0", borderBottom: si < r.segDetails.length - 1 ? `1px solid ${css.border}` : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>{sd.origin} → {sd.destination}</span>
                              <span style={{ fontSize: 9, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>{sd.distanceMiles.toLocaleString()} mi</span>
                              <span style={{ fontSize: 9, color: css.accent, background: css.accentBg, padding: "1px 6px", borderRadius: 4 }}>{sd.cabin.replace(/_/g, " ")}{bc ? ` (${bc})` : ""}</span>
                            </div>
                            <span style={{ fontWeight: 700, color: r.airline.color, fontFamily: "'Geist Mono', monospace" }}>+{sd.credits.toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: 9, color: css.text3, fontFamily: "'Geist Mono', monospace", marginTop: 2 }}>
                            {useFare
                              ? `$${(r.totalFare / r.segDetails.length).toLocaleString(undefined, {minimumFractionDigits: 0})} × ${rateLabel} = ${Math.round((r.totalFare / r.segDetails.length) * segRate).toLocaleString()}`
                              : `${sd.distanceMiles.toLocaleString()} mi × ${rateLabel} = ${Math.round(sd.distanceMiles * segRate / 100).toLocaleString()}`}
                            {r.eliteBonus > 0 && ` × ${(1 + r.eliteBonus / 100).toFixed(1)} (${r.eliteBonus}% bonus)`}
                            {` = ${sd.credits.toLocaleString()}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Save to History button */}
            {itinSegments.some(s => s.origin && s.destination) && (
              <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => {
                  const route = itinSegments.filter(s => s.origin && s.destination).map(s => `${s.origin}→${s.destination}`).join(", ");
                  const totalFare = (parseFloat(itinFare.baseFare) || 0) + (parseFloat(itinFare.taxes) || 0) + (parseFloat(itinFare.airlineFees) || 0) + (parseFloat(itinFare.otherFees) || 0);
                  const creditProg = airlines.find(a => a.id === itinCreditAirline);
                  const r = itinCalcResults.find(r => r.airline.id === itinCreditAirline);
                  const entry = {
                    id: crypto.randomUUID(),
                    savedAt: new Date().toISOString(),
                    route,
                    segments: itinSegments.filter(s => s.origin && s.destination).map(s => ({ ...s })),
                    fare: { ...itinFare },
                    totalFare,
                    creditAirline: itinCreditAirline,
                    creditProgramName: creditProg?.name || "",
                    currentTier: itinCurrentTier,
                    totalCredits: r?.totalCredits || 0,
                    projectedTier: r?.currentTier?.name || "Base Member",
                    unit: creditProg?.unit || "",
                  };
                  const updated = [entry, ...itinHistory].slice(0, 50);
                  setItinHistory(updated);
                  localStorage.setItem("continuum_itin_history", JSON.stringify(updated));
                }} style={{
                  padding: "10px 20px", borderRadius: 8, border: `1px solid ${css.accentBorder}`,
                  background: css.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>Save to History</button>
                <button onClick={() => {
                  setItinSegments([{ id: crypto.randomUUID(), origin: "", destination: "", operatingAirline: "", marketingAirline: "", bookingClass: "", distance: "" }]);
                  setItinFare({ baseFare: "", taxes: "", airlineFees: "", otherFees: "", currency: "USD" });
                  setItinCreditAirline("");
                }} style={{
                  padding: "10px 20px", borderRadius: 8, border: `1px solid ${css.border}`,
                  background: "transparent", color: css.text3, fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>Clear Form</button>
              </div>
            )}

            {/* Saved History */}
            {itinHistory.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <button onClick={() => setShowItinHistory(h => !h)} style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: "12px 0", border: "none", cursor: "pointer", background: "transparent",
                  color: css.text2, fontSize: 13, fontWeight: 600, fontFamily: "'Instrument Sans', 'Outfit', sans-serif",
                }}>
                  <span style={{ transform: showItinHistory ? "rotate(90deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▸</span>
                  Saved Calculations ({itinHistory.length})
                </button>
                {showItinHistory && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                    {itinHistory.map(h => {
                      const creditProg = airlines.find(a => a.id === h.creditAirline);
                      return (
                        <div key={h.id} style={{
                          background: css.surface, border: `1px solid ${css.border}`, borderRadius: 10,
                          padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
                          gap: 12, flexWrap: "wrap",
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.route}</div>
                            <div style={{ fontSize: 10, color: css.text3, marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <span>{new Date(h.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                              {h.creditProgramName && <span style={{ color: creditProg?.color || css.accent }}>→ {h.creditProgramName}</span>}
                              {h.totalCredits > 0 && <span style={{ fontWeight: 600, fontFamily: "'Geist Mono', monospace" }}>+{h.totalCredits.toLocaleString()} {h.unit}</span>}
                              {h.totalFare > 0 && <span>${h.totalFare.toLocaleString()}</span>}
                              {h.projectedTier && h.projectedTier !== "Base Member" && <span style={{ color: creditProg?.color || css.text2, fontWeight: 600 }}>→ {h.projectedTier}</span>}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <button onClick={() => {
                              setItinSegments(h.segments.map(s => ({ ...s, id: crypto.randomUUID() })));
                              setItinFare(h.fare || { baseFare: "", taxes: "", airlineFees: "", otherFees: "", currency: "USD" });
                              setItinCreditAirline(h.creditAirline || "");
                            }} style={{
                              padding: "5px 12px", borderRadius: 6, border: `1px solid ${css.accentBorder}`,
                              background: css.accentBg, color: css.accent, fontSize: 10, fontWeight: 600, cursor: "pointer",
                            }}>Load</button>
                            <button onClick={() => {
                              const updated = itinHistory.filter(x => x.id !== h.id);
                              setItinHistory(updated);
                              localStorage.setItem("continuum_itin_history", JSON.stringify(updated));
                            }} style={{
                              padding: "5px 10px", borderRadius: 6, border: `1px solid rgba(239,68,68,0.2)`,
                              background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 10, fontWeight: 600, cursor: "pointer",
                            }}>×</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {flightTrips.length === 0 && _tab !== "itinerary" && (
          <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "28px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: css.text2 }}>No flight trips found. Add flights in the Trips tab to use the optimizer.</div>
          </div>
        )}

        {/* ── Tab: Global Status Optimizer ── */}
        {_tab === "global" && flightTrips.length > 0 && (
          <div>
            {/* Recommendation banner */}
            {bestGlobal && (
              <div style={{
                background: css.surface, border: `1px solid ${css.accentBorder}`, borderLeft: `4px solid ${css.accent}`,
                borderRadius: 14, padding: "18px 22px", marginBottom: 20,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: css.accent, marginBottom: 6 }}>Recommended</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: css.text }}>
                  Credit all {flightTrips.length} flights to <span style={{ color: bestGlobal.airline.color }}>{bestGlobal.airline.name}</span>
                </div>
                <div style={{ fontSize: 12, color: css.text2, marginTop: 4 }}>
                  {bestGlobal.currentTier ? `Projected: ${bestGlobal.currentTier.name}` : "Projected: Base Member"}
                  {bestGlobal.nextTier && ` — ${bestGlobal.pctToNext}% toward ${bestGlobal.nextTier.name}`}
                  {!bestGlobal.nextTier && bestGlobal.currentTier && ` — Top tier reached!`}
                  {` · ${bestGlobal.totalFromTrips.toLocaleString()} ${bestGlobal.airline.unit} from trips + ${bestGlobal.existingPts.toLocaleString()} existing`}
                </div>
              </div>
            )}

            {/* All airlines ranked */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {globalResults.map((r, i) => {
                const isBest = i === 0;
                return (
                  <div key={r.airline.id} style={{
                    background: css.surface, border: `1px solid ${isBest ? r.airline.color + "50" : css.border}`,
                    borderLeft: `3px solid ${r.airline.color}`, borderRadius: 12, padding: "16px 20px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isBest ? css.accent : css.text3, fontFamily: "'Geist Mono', monospace", width: 20 }}>#{i + 1}</span>
                        <ProgramLogo prog={r.airline} size={24} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{r.airline.name}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {r.currentTier && <span style={{ fontSize: 10, fontWeight: 600, color: r.airline.color, background: `${r.airline.color}15`, padding: "2px 8px", borderRadius: 12 }}>{r.currentTier.name}</span>}
                        {!r.nextTier && r.currentTier && <span style={{ fontSize: 10, fontWeight: 700, color: css.success, background: css.successBg, padding: "2px 8px", borderRadius: 12 }}>MAX</span>}
                      </div>
                    </div>
                    <BarFill pct={r.pctToNext} color={r.airline.color} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: css.text3, marginTop: 5, fontFamily: "'Geist Mono', monospace" }}>
                      <span>{r.total.toLocaleString()} {r.airline.unit} total ({r.existingPts.toLocaleString()} existing + {r.totalFromTrips.toLocaleString()} from trips)</span>
                      {r.nextTier && <span>{r.pctToNext}% → {r.nextTier.name} ({r.nextTier.threshold.toLocaleString()})</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab 2: Trip-by-Trip Comparison ── */}
        {_tab === "trip" && flightTrips.length > 0 && (
          <div>
            {/* Trip selector */}
            <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>Select a Flight</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {flightTrips.map(t => (
                  <button key={t.id} onClick={() => setOptimizerTripId(t.id)} style={{
                    padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                    border: `1px solid ${(selectedTrip?.id === t.id) ? css.accent : css.border}`,
                    background: (selectedTrip?.id === t.id) ? css.accentBg : css.surface2,
                    color: (selectedTrip?.id === t.id) ? css.accent : css.text,
                    fontSize: 12, fontWeight: (selectedTrip?.id === t.id) ? 600 : 400,
                  }}>
                    {t.route} · {t.class} · {t.date}
                  </button>
                ))}
              </div>
            </div>

            {selectedTrip && (
              <>
                <div style={{ fontSize: 12, color: css.text2, marginBottom: 14 }}>
                  Showing how <strong style={{ color: css.text }}>{selectedTrip.route}</strong> ({selectedTrip.class}, {(selectedTrip.estimatedPoints || 0).toLocaleString()} base pts) would affect status on each airline:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tripResults.map((r, i) => {
                    const jump = r.after.pctToNext - r.before.pctToNext;
                    const advanced = r.after.currentTier?.name !== r.before.currentTier?.name;
                    return (
                      <div key={r.airline.id} style={{
                        background: css.surface, border: `1px solid ${advanced ? css.success + "50" : css.border}`,
                        borderLeft: `3px solid ${r.airline.color}`, borderRadius: 12, padding: "14px 18px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <ProgramLogo prog={r.airline} size={22} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{r.airline.name}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'Geist Mono', monospace", color: r.airline.color }}>+{r.ptsFromTrip.toLocaleString()} {r.airline.unit}</span>
                            {advanced && <span style={{ fontSize: 10, fontWeight: 700, color: css.success, background: css.successBg, padding: "2px 8px", borderRadius: 12 }}>TIER UP</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: css.text3, width: 40, flexShrink: 0, fontFamily: "'Geist Mono', monospace" }}>{r.before.pctToNext}%</span>
                          <BarFill pct={r.before.pctToNext} color={css.border} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 10, color: css.accent, width: 40, flexShrink: 0, fontFamily: "'Geist Mono', monospace", fontWeight: 700 }}>{r.after.pctToNext}%</span>
                          <BarFill pct={r.after.pctToNext} color={r.airline.color} />
                        </div>
                        <div style={{ fontSize: 10, color: css.text3, marginTop: 5, fontFamily: "'Geist Mono', monospace" }}>
                          {r.before.currentTier?.name || "Base"} → {r.after.currentTier?.name || "Base"}
                          {r.after.nextTier && (() => { const gap = r.after.nextTier.threshold - r.existingPts - r.ptsFromTrip; return ` · ${gap > 0 ? gap.toLocaleString() + " to " + r.after.nextTier.name : r.after.nextTier.name + " reached!"}`; })()}
                          {jump > 0 && <span style={{ color: css.accent, fontWeight: 600 }}> (+{jump}% jump)</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Tab 3: Alliance Goal Optimizer ── */}
        {_tab === "alliance" && flightTrips.length > 0 && (
          <div>
            {/* Goal selector */}
            <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>Target Alliance Status</div>
              <select value={allianceGoal} onChange={e => setAllianceGoal(e.target.value)} style={{
                width: "100%", maxWidth: 340, background: css.surface2, border: `1px solid ${css.border}`,
                color: css.text, padding: "8px 12px", borderRadius: 8, fontSize: 13, fontFamily: "'Instrument Sans', 'Outfit', sans-serif",
              }}>
                {GOAL_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
              </select>
              <div style={{ fontSize: 12, color: css.text2, marginTop: 8 }}>
                Which airline program should you credit to in order to reach <strong style={{ color: ALLIANCE_TIER_COLORS[allianceGoal] }}>{ALLIANCE_TIER_LABELS[allianceGoal]}</strong>?
              </div>
            </div>

            {/* Recommendation */}
            {goalResults.length > 0 && goalResults[0].reached && (
              <div style={{
                background: css.surface, border: `1px solid ${css.success}40`, borderLeft: `4px solid ${css.success}`,
                borderRadius: 14, padding: "16px 20px", marginBottom: 16,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: css.success }}>
                  You can reach {ALLIANCE_TIER_LABELS[allianceGoal]} by crediting to {goalResults[0].airline.name}!
                </div>
                <div style={{ fontSize: 12, color: css.text2, marginTop: 4 }}>
                  Credit all trips to earn {goalResults[0].tierName} status ({goalResults[0].total.toLocaleString()} / {goalResults[0].threshold.toLocaleString()} {goalResults[0].airline.unit}).
                </div>
              </div>
            )}
            {goalResults.length > 0 && !goalResults[0].reached && (
              <div style={{
                background: css.surface, border: `1px solid ${css.warning}40`, borderLeft: `4px solid ${css.warning}`,
                borderRadius: 14, padding: "16px 20px", marginBottom: 16,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: css.warning }}>
                  Closest path to {ALLIANCE_TIER_LABELS[allianceGoal]}: credit to {goalResults[0].airline.name}
                </div>
                <div style={{ fontSize: 12, color: css.text2, marginTop: 4 }}>
                  You'd reach {goalResults[0].pct}% of {goalResults[0].tierName} ({goalResults[0].total.toLocaleString()} / {goalResults[0].threshold.toLocaleString()} {goalResults[0].airline.unit}) — {goalResults[0].remaining.toLocaleString()} more needed.
                </div>
              </div>
            )}
            {goalResults.length === 0 && (
              <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "20px", textAlign: "center", fontSize: 13, color: css.text3 }}>
                No airline programs in the system map to this alliance tier.
              </div>
            )}

            {/* All candidates */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {goalResults.map((r, i) => (
                <div key={r.airline.id} style={{
                  background: css.surface, border: `1px solid ${r.reached ? css.success + "40" : css.border}`,
                  borderLeft: `3px solid ${r.color}`, borderRadius: 12, padding: "16px 20px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? css.accent : css.text3, fontFamily: "'Geist Mono', monospace", width: 20 }}>#{i + 1}</span>
                      <ProgramLogo prog={r.airline} size={24} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{r.airline.name}</div>
                        <div style={{ fontSize: 10, color: css.text3 }}>Target: {r.tierName} ({r.threshold.toLocaleString()} {r.airline.unit})</div>
                      </div>
                    </div>
                    <div>
                      {r.reached ? (
                        <span style={{ fontSize: 10, fontWeight: 700, color: css.success, background: css.successBg, padding: "3px 10px", borderRadius: 12 }}>ACHIEVED</span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'Geist Mono', monospace", color: css.warning }}>{r.remaining.toLocaleString()} short</span>
                      )}
                    </div>
                  </div>
                  <BarFill pct={r.pct} color={r.reached ? css.success : r.color} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: css.text3, marginTop: 5, fontFamily: "'Geist Mono', monospace" }}>
                    <span>{r.existingPts.toLocaleString()} existing + {r.totalFromTrips.toLocaleString()} from trips = {r.total.toLocaleString()}</span>
                    <span>{r.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION 4: Credit Card Optimizer ── */}
        {_tab === "cards" && (() => {
          const allCards = LOYALTY_PROGRAMS.creditCards;
          const linkedCards = allCards.filter(c => linkedAccounts[c.id]);
          const cards = linkedCards.length > 0 ? linkedCards : allCards;
          const usingAll = linkedCards.length === 0;

          // Build target options: "max_points", plus all airline & hotel programs reachable via transfer
          const targetOptions = [
            { id: "max_points", label: "Highest Points (Any Program)", group: "General" },
          ];
          const airlineTargets = LOYALTY_PROGRAMS.airlines.map(a => ({ id: a.id, label: `${a.name} (${a.unit})`, group: "Airlines" }));
          const hotelTargets = LOYALTY_PROGRAMS.hotels.map(h => ({ id: h.id, label: `${h.name} (${h.unit})`, group: "Hotels" }));
          targetOptions.push(...airlineTargets, ...hotelTargets);

          // For a given card and category, calculate effective points toward target
          const getEffectiveRate = (cardId, catId) => {
            const bonus = CC_BONUS_EXPANDED[cardId] || {};
            const entry = bonus[catId] !== undefined ? bonus[catId] : (bonus.other || 1);
            const rate = _ccRate(entry, ccBookingMode);
            if (ccOptTarget === "max_points") return rate;
            const tp = CC_TRANSFER_PARTNERS[cardId];
            if (!tp) return 0;
            if (tp.directProgram === ccOptTarget) return rate;
            if (tp.partners && tp.partners.includes(ccOptTarget)) return rate;
            return 0;
          };
          // Check if a card/category combo has a portal bonus
          const hasPortalBonus = (cardId, catId) => {
            const bonus = CC_BONUS_EXPANDED[cardId] || {};
            const entry = bonus[catId];
            return _ccHasPortalBonus(entry);
          };

          // For each spending category, find the best card
          const categoryResults = CC_SPENDING_CATS.map(cat => {
            const cardRanking = cards.map(card => {
              const rate = getEffectiveRate(card.id, cat.id);
              const portalBonus = hasPortalBonus(card.id, cat.id);
              const bonus = CC_BONUS_EXPANDED[card.id] || {};
              const entry = bonus[cat.id];
              const directRate = _ccRate(entry, "direct");
              const portalRate = _ccRate(entry, "portal");
              return {
                card, rate, directRate, portalRate, portalBonus,
                currency: CC_TRANSFER_PARTNERS[card.id]?.currency || card.unit,
                canReachTarget: ccOptTarget === "max_points" || (() => {
                  const tp = CC_TRANSFER_PARTNERS[card.id];
                  if (!tp) return false;
                  if (tp.directProgram === ccOptTarget) return true;
                  return tp.partners && tp.partners.includes(ccOptTarget);
                })(),
              };
            }).filter(r => r.rate > 0).sort((a, b) => b.rate - a.rate);
            return { ...cat, ranking: cardRanking, best: cardRanking[0] || null };
          });

          // Overall summary: which card is best across all categories
          const cardWins = {};
          categoryResults.forEach(cat => {
            if (cat.best) {
              cardWins[cat.best.card.id] = (cardWins[cat.best.card.id] || 0) + 1;
            }
          });
          const topCardId = Object.entries(cardWins).sort((a, b) => b[1] - a[1])[0]?.[0];
          const topCard = cards.find(c => c.id === topCardId);

          // Target program info
          const targetProg = ccOptTarget !== "max_points" ? [...LOYALTY_PROGRAMS.airlines, ...LOYALTY_PROGRAMS.hotels].find(p => p.id === ccOptTarget) : null;

          // Sign-up bonus / min spend tracker (for linked cards)
          const purchaseAmt = parseFloat(ccOptAmount) || 100;

          return (
            <div>
              {/* Target selector */}
              <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "18px 22px", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <label style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: css.text3, marginBottom: 6 }}>Optimize For</div>
                    <select value={ccOptTarget} onChange={e => setCcOptTarget(e.target.value)} style={{
                      width: "100%", background: css.surface2, border: `1px solid ${css.border}`,
                      color: css.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, fontFamily: "'Instrument Sans', 'Outfit', sans-serif",
                    }}>
                      <optgroup label="General">
                        <option value="max_points">Highest Points (Any Program)</option>
                      </optgroup>
                      <optgroup label="Airline Miles">
                        {airlineTargets.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </optgroup>
                      <optgroup label="Hotel Points">
                        {hotelTargets.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </optgroup>
                    </select>
                  </label>
                  <label style={{ width: 140 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: css.text3, marginBottom: 6 }}>Purchase Amount</div>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: css.text3, fontSize: 13 }}>$</span>
                      <input type="number" value={ccOptAmount} onChange={e => setCcOptAmount(e.target.value)} min="1" style={{
                        width: "100%", background: css.surface2, border: `1px solid ${css.border}`,
                        color: css.text, padding: "9px 12px 9px 22px", borderRadius: 8, fontSize: 13,
                        fontFamily: "'Geist Mono', monospace", boxSizing: "border-box", outline: "none",
                      }} />
                    </div>
                  </label>
                </div>

                {/* Booking mode toggle */}
                <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: css.text3 }}>Booking Method</div>
                  <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${css.border}` }}>
                    {[
                      { id: "direct", label: "Book Direct", desc: "Book on airline/hotel website" },
                      { id: "portal", label: "Card Travel Portal", desc: "Book via card issuer portal" },
                    ].map(mode => (
                      <button key={mode.id} onClick={() => setCcBookingMode(mode.id)} style={{
                        padding: "7px 16px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                        background: ccBookingMode === mode.id ? css.accentBg : css.surface2,
                        color: ccBookingMode === mode.id ? css.accent : css.text3,
                        borderRight: mode.id === "direct" ? `1px solid ${css.border}` : "none",
                      }}>{mode.label}</button>
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: css.text3, fontStyle: "italic" }}>
                    {ccBookingMode === "portal" ? "Rates reflect booking through Chase Travel, Amex Travel, Capital One Travel, etc." : "Rates reflect paying directly on airline/hotel websites with your card."}
                  </span>
                </div>

                {targetProg && (
                  <div style={{ fontSize: 12, color: css.text2, marginTop: 10 }}>
                    Showing which card earns the most <strong style={{ color: targetProg.color }}>{targetProg.name}</strong> {targetProg.unit} via direct earning or transfer partners.
                  </div>
                )}
                {usingAll && (
                  <div style={{ fontSize: 11, color: css.warning, marginTop: 8 }}>
                    No cards linked yet — showing all cards. Link your credit cards in Programs to personalize results.
                  </div>
                )}
              </div>

              {/* Top recommendation */}
              {topCard && (
                <div style={{
                  background: css.surface, border: `1px solid ${css.accent}40`, borderLeft: `4px solid ${css.accent}`,
                  borderRadius: 14, padding: "16px 20px", marginBottom: 20,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Top Card Overall</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <ProgramLogo prog={topCard} size={28} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: css.text }}>{topCard.name}</div>
                      <div style={{ fontSize: 11, color: css.text2 }}>Best card for {cardWins[topCardId]} of {CC_SPENDING_CATS.length} spending categories{ccOptTarget !== "max_points" && targetProg ? ` toward ${targetProg.name}` : ""}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Category-by-category breakdown */}
              <div style={{ fontSize: 13, fontWeight: 700, color: css.text, marginBottom: 12 }}>Best Card by Spending Category</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {categoryResults.map(cat => (
                  <div key={cat.id} style={{
                    background: css.surface, border: `1px solid ${css.border}`, borderRadius: 12, padding: "14px 18px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: cat.ranking.length > 1 ? 10 : 0, flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{cat.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{cat.label}</div>
                          {cat.best ? (
                            <div style={{ fontSize: 11, color: css.text3 }}>
                              Use <strong style={{ color: css.accent }}>{cat.best.card.name}</strong> — <span style={{ fontFamily: "'Geist Mono', monospace", color: css.gold }}>{cat.best.rate}x</span> {cat.best.currency}
                              {cat.best.portalBonus && ccBookingMode === "portal" && <span style={{ fontSize: 9, fontWeight: 700, color: css.warning, background: css.warningBg, padding: "1px 6px", borderRadius: 6, marginLeft: 6, border: `1px solid ${css.warning}30` }}>PORTAL RATE</span>}
                              {cat.best.portalBonus && ccBookingMode === "direct" && <span style={{ fontSize: 9, color: css.text3, marginLeft: 6 }}>({cat.best.portalRate}x via portal)</span>}
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: css.text3 }}>No linked card earns toward this target</div>
                          )}
                        </div>
                      </div>
                      {cat.best && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: css.gold, fontFamily: "'Geist Mono', monospace" }}>
                            {(cat.best.rate * purchaseAmt).toLocaleString()}
                          </div>
                          <div style={{ fontSize: 9, color: css.text3 }}>pts per ${purchaseAmt.toLocaleString()}</div>
                        </div>
                      )}
                    </div>

                    {/* Runner-ups */}
                    {cat.ranking.length > 1 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {cat.ranking.map((r, i) => (
                          <div key={r.card.id} style={{
                            display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8,
                            background: i === 0 ? css.accentBg : css.surface2, border: `1px solid ${i === 0 ? css.accentBorder : css.border}`,
                            fontSize: 11, color: i === 0 ? css.accent : css.text2,
                          }}>
                            <ProgramLogo prog={r.card} size={14} />
                            <span style={{ fontWeight: i === 0 ? 600 : 400 }}>{r.card.name.split(" ")[0]}</span>
                            <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 600, color: i === 0 ? css.accent : css.text3 }}>{r.rate}x</span>
                            {r.portalBonus && ccBookingMode === "portal" && <span style={{ fontSize: 8, color: css.warning, fontWeight: 700 }}>P</span>}
                            {r.portalBonus && ccBookingMode === "direct" && r.portalRate > r.directRate && <span style={{ fontSize: 8, color: css.text3 }}>({r.portalRate}x P)</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Transfer partner awareness panel */}
              {ccOptTarget !== "max_points" && targetProg && (
                <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "18px 22px", marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: css.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15 }}>🔄</span> Cards That Transfer to {targetProg.name}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {cards.filter(c => {
                      const tp = CC_TRANSFER_PARTNERS[c.id];
                      if (!tp) return false;
                      if (tp.directProgram === ccOptTarget) return true;
                      return tp.partners && tp.partners.includes(ccOptTarget);
                    }).map(card => {
                      const tp = CC_TRANSFER_PARTNERS[card.id];
                      const isDirect = tp?.directProgram === ccOptTarget;
                      return (
                        <div key={card.id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px",
                          background: css.surface2, borderRadius: 10, border: `1px solid ${css.border}`,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <ProgramLogo prog={card} size={22} />
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: css.text }}>{card.name}</div>
                              <div style={{ fontSize: 10, color: css.text3 }}>{tp?.currency}</div>
                            </div>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 10,
                            background: isDirect ? css.successBg : css.accentBg,
                            color: isDirect ? css.success : css.accent,
                            border: `1px solid ${isDirect ? css.success : css.accent}30`,
                          }}>{isDirect ? "Direct Earn" : "1:1 Transfer"}</span>
                        </div>
                      );
                    })}
                    {cards.filter(c => {
                      const tp = CC_TRANSFER_PARTNERS[c.id];
                      if (!tp) return false;
                      return tp.directProgram === ccOptTarget || (tp.partners && tp.partners.includes(ccOptTarget));
                    }).length === 0 && (
                      <div style={{ textAlign: "center", padding: "20px", color: css.text3, fontSize: 12 }}>
                        None of your {usingAll ? "" : "linked "}cards transfer to {targetProg.name}.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Full card comparison table */}
              <div style={{ fontSize: 13, fontWeight: 700, color: css.text, marginBottom: 12 }}>Full Earn Rate Comparison</div>
              <div style={{ overflowX: "auto", borderRadius: 14, border: `1px solid ${css.border}` }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: css.surface, fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: css.surface2 }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: css.text3, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", position: "sticky", left: 0, background: css.surface2, zIndex: 1 }}>Card</th>
                      {CC_SPENDING_CATS.map(cat => (
                        <th key={cat.id} style={{ padding: "10px 8px", textAlign: "center", color: css.text3, fontWeight: 600, fontSize: 10, whiteSpace: "nowrap" }}>
                          <div>{cat.icon}</div>{cat.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map(card => (
                      <tr key={card.id} style={{ borderTop: `1px solid ${css.border}` }}>
                        <td style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 6, position: "sticky", left: 0, background: css.surface, zIndex: 1, whiteSpace: "nowrap" }}>
                          <ProgramLogo prog={card} size={16} />
                          <span style={{ fontWeight: 500, color: css.text, fontSize: 11 }}>{card.name.length > 18 ? card.name.slice(0, 16) + ".." : card.name}</span>
                        </td>
                        {CC_SPENDING_CATS.map(cat => {
                          const rate = getEffectiveRate(card.id, cat.id);
                          const isBest = categoryResults.find(c => c.id === cat.id)?.best?.card.id === card.id;
                          const isPortal = hasPortalBonus(card.id, cat.id);
                          return (
                            <td key={cat.id} style={{
                              padding: "8px", textAlign: "center", fontFamily: "'Geist Mono', monospace",
                              fontWeight: isBest ? 700 : 400,
                              color: rate === 0 ? css.text3 + "60" : isBest ? css.accent : css.text,
                              background: isBest ? css.accentBg : "transparent",
                              position: "relative",
                            }}>
                              {rate === 0 ? "—" : `${rate}x`}
                              {isPortal && ccBookingMode === "portal" && rate > 0 && <span style={{ position: "absolute", top: 2, right: 2, fontSize: 7, color: css.warning, fontWeight: 700 }}>P</span>}
                              {isPortal && ccBookingMode === "direct" && rate > 0 && (() => {
                                const bonus = CC_BONUS_EXPANDED[card.id] || {};
                                const pRate = _ccRate(bonus[cat.id], "portal");
                                return pRate > rate ? <div style={{ fontSize: 8, color: css.text3, fontWeight: 400 }}>{pRate}x via P</div> : null;
                              })()}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  // ── helper shared with both report types ──
  const buildPrintReport = async (title, expsForReport) => {
    const CURRENCY_SYMBOLS = { USD:"$",EUR:"€",GBP:"£",CAD:"CA$",AUD:"A$",JPY:"¥",CHF:"Fr",CNY:"¥",HKD:"HK$",SGD:"S$",MXN:"MX$",BRL:"R$",INR:"₹",KRW:"₩",AED:"د.إ",THB:"฿",NOK:"kr",SEK:"kr",DKK:"kr",NZD:"NZ$" };
    const symFor = (cur) => CURRENCY_SYMBOLS[cur] || (cur + " ");
    const fmtAmt = (n, cur) => n === 0 ? "Free" : `${symFor(cur)}${n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    const toUSD = (e) => e.amount * (e.fxRate || 1);
    const tripTotalUSD = expsForReport.reduce((s, e) => s + toUSD(e), 0);
    const receiptCount = expsForReport.filter(e => e.receipt).length;
    const catSummary = EXPENSE_CATEGORIES.map(cat => ({
      ...cat,
      totalUSD: expsForReport.filter(e => e.category === cat.id).reduce((s,e) => s + toUSD(e), 0),
      count: expsForReport.filter(e => e.category === cat.id).length,
    })).filter(c => c.totalUSD > 0);
    const expensesWithReceipts = expsForReport.filter(e => e.receiptImage?.data);
    const pdfPageImages = {};
    for (const exp of expensesWithReceipts) {
      if (exp.receiptImage.type === "application/pdf") {
        try { pdfPageImages[exp.id] = await renderPdfToImages(exp.receiptImage.data); } catch(e) { pdfPageImages[exp.id] = []; }
      }
    }

    const catRows = catSummary.map(cat => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #2a2640;"><span style="font-size:16px;margin-right:8px;">${cat.icon}</span><span style="font-size:13px;color:#d0d6e0;">${cat.label} (${cat.count})</span></td>
        <td style="padding:10px 0;border-bottom:1px solid #2a2640;"><div style="background:#2a2640;border-radius:4px;height:6px;width:120px;overflow:hidden;"><div style="width:${tripTotalUSD>0?Math.round((cat.totalUSD/tripTotalUSD)*100):0}%;height:100%;background:${cat.color};border-radius:4px;"></div></div></td>
        <td style="padding:10px 0;border-bottom:1px solid #2a2640;text-align:right;font-size:13px;font-weight:700;color:#f7f8f8;">$${cat.totalUSD.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      </tr>`).join("");

    const lineRows = expsForReport.map((exp, i) => {
      const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
      const cur = exp.currency || "USD";
      const usdAmt = toUSD(exp);
      const isForeign = cur !== "USD";
      const tripName = exp.tripId ? (trips.find(t => t.id === exp.tripId)?.tripName || trips.find(t => t.id === exp.tripId)?.route || "Trip") : "Custom";
      const receiptIdx = expensesWithReceipts.findIndex(e => e.id === exp.id);
      return `<tr>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2640;vertical-align:top;">
          <div style="font-size:13px;color:#f7f8f8;">${cat?.icon||""} ${exp.description}</div>
          <div style="font-size:10px;color:#62666d;margin-top:2px;">${tripName}${exp.notes ? " · " + exp.notes : ""}</div>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2640;font-size:12px;color:#8a8f98;white-space:nowrap;">${exp.date?.slice(5)||""}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2640;font-size:12px;color:#8a8f98;">${exp.paymentMethod||"—"}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2640;text-align:right;">
          <div style="font-size:13px;font-weight:700;color:${exp.amount===0?"#34d399":"#fff"};">${fmtAmt(exp.amount,cur)}</div>
          ${isForeign?`<div style="font-size:10px;color:#62666d;">$${usdAmt.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} USD</div>`:""}
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2640;text-align:center;font-size:13px;color:${exp.receipt?"#34d399":"#62666d"};">
          ${exp.receipt?(receiptIdx>=0?`<span style="font-size:10px;color:#0EA5A0;">p.${receiptIdx+2}</span>`:"✓"):"—"}
        </td>
      </tr>`;
    }).join("");

    const receiptPages = expensesWithReceipts.map((exp, i) => {
      const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
      const cur = exp.currency || "USD";
      const isPdf = exp.receiptImage.type === "application/pdf";
      const pages = isPdf ? (pdfPageImages[exp.id] || []) : [exp.receiptImage.data];
      return pages.map((src, pi) => `
        <div style="page-break-before:always;padding:48px;background:#13111C;min-height:100vh;box-sizing:border-box;">
          ${pi === 0 ? `
            <div style="color:#8a8f98;font-size:11px;font-family:monospace;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.1em;">Receipt ${i+1} of ${expensesWithReceipts.length}${isPdf && pages.length > 1 ? ` — Page 1 of ${pages.length}` : ""}</div>
            <div style="font-size:16px;font-weight:700;color:#f7f8f8;margin-bottom:4px;">${cat?.icon||""} ${exp.description}</div>
            <div style="font-size:12px;color:#8a8f98;margin-bottom:32px;">${exp.date||""} · ${exp.paymentMethod||""} · ${fmtAmt(exp.amount,cur)}</div>
          ` : `
            <div style="color:#8a8f98;font-size:11px;font-family:monospace;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.1em;">Receipt ${i+1} — Page ${pi+1} of ${pages.length} · ${exp.description}</div>
          `}
          <img src="${src}" alt="Receipt${isPdf ? ` page ${pi+1}` : ""}" style="width:100%;border-radius:8px;border:1px solid #2a2640;display:block;" />
        </div>
      `).join("");
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
      <style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#13111C;color:#f7f8f8;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}@media print{body{background:#13111C!important;}@page{margin:16mm 18mm;size:A4;}}table{border-collapse:collapse;width:100%;}</style>
    </head><body>
      <div style="padding:48px 48px 40px;background:#13111C;min-height:100vh;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;">
          <div>
            <img src="${window.location.origin}/continuum-travel-logo.svg" alt="Continuum" style="height:80px;display:block;margin-bottom:12px;" />
            <div style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;">${title}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;color:#8a8f98;">Generated ${new Date().toLocaleDateString()}</div>
            <div style="font-size:11px;color:#62666d;">Report #${Date.now().toString(36).slice(-6)}</div>
            <div style="margin-top:6px;font-size:11px;font-weight:700;color:#0EA5A0;">Total in USD</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:28px;">
          <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:16px;text-align:center;"><div style="font-size:22px;font-weight:800;color:#0EA5A0;">$${tripTotalUSD.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div style="font-size:10px;color:#8a8f98;margin-top:4px;">Total (USD)</div></div>
          <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:16px;text-align:center;"><div style="font-size:22px;font-weight:700;color:#fff;">${expsForReport.length}</div><div style="font-size:10px;color:#8a8f98;margin-top:4px;">Items</div></div>
          <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:16px;text-align:center;"><div style="font-size:22px;font-weight:800;color:#34d399;">${receiptCount}/${expsForReport.length}</div><div style="font-size:10px;color:#8a8f98;margin-top:4px;">Receipts</div></div>
        </div>
        <div style="margin-bottom:28px;">
          <div style="font-size:11px;font-weight:700;color:#8a8f98;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Breakdown by Category</div>
          <table><tbody>${catRows}</tbody></table>
        </div>
        <div style="margin-bottom:32px;">
          <div style="font-size:11px;font-weight:700;color:#8a8f98;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Line Items</div>
          <div style="background:#1a1725;border-radius:8px;overflow:hidden;border:1px solid #2a2640;">
            <table>
              <thead><tr style="background:rgba(255,255,255,0.04);">
                <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Description</th>
                <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Date</th>
                <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Payment</th>
                <th style="padding:10px 14px;text-align:right;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Amount</th>
                <th style="padding:10px 14px;text-align:center;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">🧾</th>
              </tr></thead>
              <tbody>${lineRows}</tbody>
              <tfoot><tr style="background:rgba(14,165,160,0.08);">
                <td colspan="3" style="padding:14px;font-size:13px;font-weight:700;color:#0EA5A0;border-top:2px solid rgba(14,165,160,0.3);">TOTAL (USD)</td>
                <td style="padding:14px;text-align:right;font-size:15px;font-weight:800;color:#0EA5A0;border-top:2px solid rgba(14,165,160,0.3);">$${tripTotalUSD.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                <td style="border-top:2px solid rgba(14,165,160,0.3);"></td>
              </tr></tfoot>
            </table>
          </div>
        </div>
        <div style="text-align:center;color:#62666d;font-size:10px;border-top:1px solid #2a2640;padding-top:16px;">
          Generated by Continuum — Elevate Every Journey · ${new Date().toLocaleString()}${expensesWithReceipts.length>0?` · ${expensesWithReceipts.length} receipt${expensesWithReceipts.length!==1?"s":""} attached`:""}
        </div>
      </div>
      ${receiptPages}
    </body></html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    const imgs = w.document.images;
    if (imgs.length === 0) { setTimeout(() => { w.focus(); w.print(); }, 300); return; }
    let loaded = 0;
    const tryPrint = () => { loaded++; if (loaded >= imgs.length) setTimeout(() => { w.focus(); w.print(); }, 300); };
    Array.from(imgs).forEach(img => { if (img.complete) tryPrint(); else { img.onload = tryPrint; img.onerror = tryPrint; } });
  };

  const renderExpenseReports = () => {
    const openBuilder = (report = null, type = "reimbursement") => {
      if (report) {
        setEditingReportId(report.id);
        setReportBuilder({ title: report.title, selectedTripIds: report.selectedTripIds, excludedExpenseIds: report.excludedExpenseIds, customExpenses: report.customExpenses, reportType: report.reportType || "reimbursement" });
      } else {
        setEditingReportId(null);
        setReportBuilder({ title: "", selectedTripIds: [], excludedExpenseIds: [], customExpenses: [], reportType: type });
      }
      setShowReportBuilder(true);
    };

    const saveReport = async () => {
      if (!reportBuilder.title.trim()) return;
      const payload = {
        title: reportBuilder.title,
        selected_trip_ids: reportBuilder.selectedTripIds,
        excluded_expense_ids: reportBuilder.excludedExpenseIds,
        custom_expenses: reportBuilder.customExpenses,
        updated_at: new Date().toISOString(),
      };
      if (editingReportId) {
        if (user) await supabase.from("expense_reports").update(payload).eq("id", editingReportId).eq("user_id", user.id);
        setStandaloneReports(prev => prev.map(r => r.id === editingReportId ? { ...r, ...reportBuilder, id: editingReportId } : r));
      } else {
        if (user) {
          const { data, error } = await supabase.from("expense_reports").insert({ ...payload, user_id: user.id }).select().single();
          if (!error && data) {
            setStandaloneReports(prev => [{ ...reportBuilder, id: data.id, createdAt: data.created_at?.slice(0, 10) }, ...prev]);
          }
        } else {
          setStandaloneReports(prev => [{ ...reportBuilder, id: crypto.randomUUID(), createdAt: new Date().toISOString().slice(0, 10) }, ...prev]);
        }
      }
      setShowReportBuilder(false);
    };

    const deleteReport = async (id) => {
      setStandaloneReports(prev => prev.filter(r => r.id !== id));
      if (user) await supabase.from("expense_reports").delete().eq("id", id).eq("user_id", user.id);
    };

    const getReportExpenses = (report) => {
      if (report.reportType === "trip_cost") {
        // Trip cost report — pull from segment costs
        const segCosts = (report.selectedTripIds || []).flatMap(tripId => {
          const trip = trips.find(t => t.id === tripId);
          if (!trip?.segments) return [];
          return trip.segments.filter(s => !s._isMeta && (s.ticketPrice || s.totalCost || s.cost)).map(s => {
            const amount = parseFloat(s.ticketPrice || s.totalCost || s.cost || 0);
            const label = s.type === "flight" ? `${s.flightNumber || ""} ${s.route || "Flight"}`.trim()
              : s.type === "hotel" || s.type === "accommodation" ? s.property || "Hotel"
              : s.activityName || s.restaurantName || s.operator || s.company || s.loungeName || s.type || "Item";
            return { id: `seg_${tripId}_${s._id || label}`, description: label, amount, currency: s.currency || "USD", fxRate: 1, date: s.date || "", category: s.type, _fromSegment: true };
          });
        });
        const custom = (report.customExpenses || []).map(e => ({ ...e, tripId: null }));
        return [...segCosts, ...custom].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
      }
      // Reimbursement report — pull from expense inbox items
      const tripExps = expenses.filter(e => report.selectedTripIds.includes(e.tripId) && !report.excludedExpenseIds.includes(e.id));
      const custom = (report.customExpenses || []).map(e => ({ ...e, tripId: null }));
      return [...tripExps, ...custom].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    };

    const toggleTripId = (tripId) => setReportBuilder(p => ({
      ...p,
      selectedTripIds: p.selectedTripIds.includes(tripId) ? p.selectedTripIds.filter(id => id !== tripId) : [...p.selectedTripIds, tripId],
      excludedExpenseIds: p.excludedExpenseIds.filter(eid => !expenses.filter(e => e.tripId === tripId).map(e => e.id).includes(eid)),
    }));

    const toggleExpenseId = (expId) => setReportBuilder(p => ({
      ...p,
      excludedExpenseIds: p.excludedExpenseIds.includes(expId) ? p.excludedExpenseIds.filter(id => id !== expId) : [...p.excludedExpenseIds, expId],
    }));

    const addCustomExpense = () => {
      const parsed = { ...reportBuilderCustom, id: crypto.randomUUID(), amount: parseFloat(reportBuilderCustom.amount) || 0, fxRate: parseFloat(reportBuilderCustom.fxRate) || 1, receipt: false };
      setReportBuilder(p => ({ ...p, customExpenses: [...p.customExpenses, parsed] }));
      setReportBuilderCustom({ category: "flight", description: "", amount: "", currency: "USD", fxRate: 1, date: "", paymentMethod: "", notes: "" });
      setShowReportCustomExpense(false);
    };

    const removeCustomExpense = (id) => setReportBuilder(p => ({ ...p, customExpenses: p.customExpenses.filter(e => e.id !== id) }));

    // Live totals for builder preview
    // Reimbursement report: only expense inbox items assigned to trips
    const builderTripExps = expenses.filter(e => reportBuilder.selectedTripIds.includes(e.tripId) && !reportBuilder.excludedExpenseIds.includes(e.id));
    // Trip cost report: auto-generate from segment costs (flights, hotels, etc.)
    const builderSegmentCosts = reportBuilder.selectedTripIds.flatMap(tripId => {
      const trip = trips.find(t => t.id === tripId);
      if (!trip?.segments) return [];
      return trip.segments.filter(s => !s._isMeta && (s.ticketPrice || s.totalCost || s.cost)).map(s => {
        const amount = parseFloat(s.ticketPrice || s.totalCost || s.cost || 0);
        const label = s.type === "flight" ? `${s.flightNumber || ""} ${s.route || "Flight"}`.trim()
          : s.type === "hotel" || s.type === "accommodation" ? s.property || "Hotel"
          : s.activityName || s.restaurantName || s.operator || s.company || s.loungeName || s.type || "Item";
        return { id: `seg_${trip.id}_${s._id || label}`, description: label, amount, currency: s.currency || "USD", fxRate: 1, date: s.date || "", category: s.type, _fromSegment: true };
      });
    });
    // Report type determines what's included
    const isReimbursement = reportBuilder.reportType !== "trip_cost";
    const builderAllExps = isReimbursement
      ? [...builderTripExps, ...reportBuilder.customExpenses]
      : [...builderSegmentCosts, ...reportBuilder.customExpenses];
    const builderTotal = builderAllExps.reduce((s, e) => s + e.amount * (e.fxRate || 1), 0);

    const inputStyle = { display: "block", width: "100%", marginTop: 5, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: `1px solid ${css.border}`, borderRadius: 7, color: css.text, fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" };
    const labelStyle = { fontSize: 10, fontWeight: 600, color: css.text3, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" };

    return (
      <div>
        {/* Header */}
        <div className="c-a1" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>Finance</div>
            <h2 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: isMobile ? 26 : 32, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>Expense Reports</h2>
            <p style={{ color: css.text2, fontSize: 13, margin: "8px 0 0" }}>Build consolidated reports across multiple trips</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => openBuilder(null, "reimbursement")} style={{
              padding: "10px 16px", borderRadius: 8, border: "none", background: css.accent,
              color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>+ Reimbursement Report</button>
            <button onClick={() => openBuilder(null, "trip_cost")} style={{
              padding: "10px 16px", borderRadius: 8, border: `1px solid ${css.accent}`, background: "transparent",
              color: css.accent, fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>+ Trip Cost Report</button>
          </div>
        </div>

        {/* Saved reports list */}
        {standaloneReports.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: css.text3 }}>
            <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.4 }}>—</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: css.text2, marginBottom: 8 }}>No expense reports yet</div>
            <div style={{ fontSize: 13, color: css.text3, marginBottom: 20 }}>Create a report to combine expenses from multiple trips with custom line items</div>
            <button onClick={() => openBuilder()} style={{ background: "none", border: "none", color: css.accent, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Create your first report →</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {standaloneReports.map(report => {
              const exps = getReportExpenses(report);
              const total = exps.reduce((s, e) => s + e.amount * (e.fxRate || 1), 0);
              return (
                <div key={report.id} style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: css.text }}>{report.title}</div>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.04em", background: report.reportType === "trip_cost" ? "rgba(59,130,246,0.12)" : `${css.accent}15`, color: report.reportType === "trip_cost" ? "#3b82f6" : css.accent }}>{report.reportType === "trip_cost" ? "Trip Cost" : "Reimbursement"}</span>
                      </div>
                      <div style={{ fontSize: 11, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>
                        {report.createdAt} · {report.selectedTripIds.length} trip{report.selectedTripIds.length !== 1 ? "s" : ""} · {exps.length} items
                        {report.customExpenses?.length > 0 ? ` · ${report.customExpenses.length} custom` : ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: css.gold, fontFamily: "'Geist Mono', monospace" }}>${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div style={{ fontSize: 9, color: css.text3, marginBottom: 8 }}>USD</div>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={async () => await buildPrintReport(report.title, exps)} style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: css.accent, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Print</button>
                        <button onClick={() => openBuilder(report)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                        <button onClick={() => deleteReport(report.id)} style={{ width: 26, height: 26, borderRadius: 8, border: `1px solid rgba(239,68,68,0.2)`, background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Report Builder Modal */}
        {showReportBuilder && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
            <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: 28, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Title */}
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: css.text, margin: "0 0 4px", fontFamily: "'Inter Tight', Inter, sans-serif" }}>{editingReportId ? "Edit Report" : isReimbursement ? "New Reimbursement Report" : "New Trip Cost Report"}</h3>
                <p style={{ fontSize: 12, color: css.text3, margin: "0 0 16px" }}>{isReimbursement ? "Expense items you want to claim for reimbursement" : "Total costs from your trip itinerary (flights, hotels, etc.)"}</p>
                <label>
                  <span style={labelStyle}>Report Title</span>
                  <input value={reportBuilder.title} onChange={e => setReportBuilder(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Q1 2026 Business Expenses" style={inputStyle} />
                </label>
              </div>

              {/* Trip selector */}
              <div>
                <div style={{ ...labelStyle, display: "block", marginBottom: 10 }}>Select Trips to Include</div>
                {trips.length === 0 ? (
                  <div style={{ fontSize: 12, color: css.text3 }}>No trips added yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {trips.map(trip => {
                      const selected = reportBuilder.selectedTripIds.includes(trip.id);
                      const tripExps = expenses.filter(e => e.tripId === trip.id);
                      const excludedCount = reportBuilder.excludedExpenseIds.filter(eid => tripExps.some(e => e.id === eid)).length;
                      return (
                        <div key={trip.id}>
                          <div onClick={() => toggleTripId(trip.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: `1px solid ${selected ? css.accentBorder : css.border}`, background: selected ? css.accentBg : "transparent", cursor: "pointer" }}>
                            <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${selected ? css.accent : css.text3}`, background: selected ? css.accent : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {selected && <span style={{ fontSize: 10, color: "#fff", lineHeight: 1 }}>✓</span>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: css.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.tripName || trip.route || "Trip"}</div>
                              <div style={{ fontSize: 10, color: css.text3 }}>{trip.date} · {tripExps.length} expense{tripExps.length !== 1 ? "s" : ""}
                                {selected && excludedCount > 0 ? ` · ${excludedCount} excluded` : ""}
                              </div>
                            </div>
                          </div>

                          {/* Individual expense toggles when trip is selected */}
                          {selected && tripExps.length > 0 && (
                            <div style={{ marginLeft: 26, marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
                              {tripExps.map(exp => {
                                const excluded = reportBuilder.excludedExpenseIds.includes(exp.id);
                                const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                                return (
                                  <div key={exp.id} onClick={() => toggleExpenseId(exp.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, background: excluded ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.02)", cursor: "pointer", opacity: excluded ? 0.5 : 1 }}>
                                    <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${excluded ? "#ef4444" : css.text3}`, background: excluded ? "rgba(239,68,68,0.2)" : "transparent", flexShrink: 0 }} />
                                    <span style={{ fontSize: 12 }}>{cat?.icon}</span>
                                    <span style={{ fontSize: 12, color: css.text2, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description}</span>
                                    <span style={{ fontSize: 11, color: css.text3, fontFamily: "'Geist Mono', monospace", flexShrink: 0 }}>${(exp.amount * (exp.fxRate || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    <span style={{ fontSize: 10, color: excluded ? "#ef4444" : css.text3, flexShrink: 0 }}>{excluded ? "excluded" : "included"}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Custom expenses */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={labelStyle}>Custom Expenses (not tied to a trip)</span>
                  <button onClick={() => setShowReportCustomExpense(p => !p)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${css.accentBorder}`, background: css.accentBg, color: css.accent, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ Add</button>
                </div>

                {showReportCustomExpense && (
                  <div style={{ background: css.surface2, border: `1px solid ${css.border}`, borderRadius: 10, padding: 16, marginBottom: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <button key={cat.id} onClick={() => setReportBuilderCustom(p => ({ ...p, category: cat.id }))} style={{ padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: reportBuilderCustom.category === cat.id ? `${cat.color}25` : "rgba(255,255,255,0.04)", color: reportBuilderCustom.category === cat.id ? cat.color : css.text3 }}>{cat.icon} {cat.label}</button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <label style={{ flex: 2 }}><span style={labelStyle}>Description</span><input value={reportBuilderCustom.description} onChange={e => setReportBuilderCustom(p => ({ ...p, description: e.target.value }))} placeholder="Description" style={inputStyle} /></label>
                      <label style={{ flex: 1 }}><span style={labelStyle}>Amount</span><input type="number" min="0" step="0.01" value={reportBuilderCustom.amount} onChange={e => setReportBuilderCustom(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" style={inputStyle} /></label>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <label style={{ flex: 1 }}><span style={labelStyle}>Date</span><input type="date" value={reportBuilderCustom.date} onChange={e => setReportBuilderCustom(p => ({ ...p, date: e.target.value }))} style={inputStyle} /></label>
                      <label style={{ flex: 1 }}><span style={labelStyle}>Payment</span><input value={reportBuilderCustom.paymentMethod} onChange={e => setReportBuilderCustom(p => ({ ...p, paymentMethod: e.target.value }))} placeholder="Card, Cash…" style={inputStyle} /></label>
                    </div>
                    <label><span style={labelStyle}>Notes</span><input value={reportBuilderCustom.notes} onChange={e => setReportBuilderCustom(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" style={inputStyle} /></label>
                    <button onClick={addCustomExpense} disabled={!reportBuilderCustom.description || !reportBuilderCustom.amount} style={{ alignSelf: "flex-end", padding: "8px 18px", borderRadius: 8, border: "none", background: css.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Add Line Item</button>
                  </div>
                )}

                {reportBuilder.customExpenses.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {reportBuilder.customExpenses.map(exp => {
                      const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                      return (
                        <div key={exp.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, background: "rgba(255,255,255,0.03)", border: `1px solid ${css.border}` }}>
                          <span style={{ fontSize: 13 }}>{cat?.icon}</span>
                          <span style={{ flex: 1, fontSize: 12, color: css.text2 }}>{exp.description}</span>
                          <span style={{ fontSize: 12, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>{exp.date}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>${(exp.amount * (exp.fxRate || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <button onClick={() => removeCustomExpense(exp.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Running total with currency breakdown */}
              {builderAllExps.length > 0 && (() => {
                const byCurrency = {};
                builderAllExps.forEach(e => {
                  const cur = e.currency || "USD";
                  byCurrency[cur] = (byCurrency[cur] || 0) + (e.amount * (e.fxRate || 1));
                });
                const currencies = Object.entries(byCurrency).sort((a, b) => b[1] - a[1]);
                return (
                  <div style={{ background: css.accentBg, border: `1px solid ${css.accentBorder}`, borderRadius: 10, padding: "14px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: currencies.length > 1 ? 8 : 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: css.text2 }}>{builderAllExps.length} item{builderAllExps.length !== 1 ? "s" : ""}</div>
                      {currencies.length === 1 ? (
                        <div style={{ fontSize: 18, fontWeight: 800, color: css.accent, fontFamily: "'Geist Mono', monospace" }}>{currencies[0][1].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencies[0][0]}</div>
                      ) : (
                        <div style={{ fontSize: 13, fontWeight: 700, color: css.accent, fontFamily: "'Geist Mono', monospace" }}>Multi-currency</div>
                      )}
                    </div>
                    {currencies.length > 1 && (
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {currencies.map(([cur, amt]) => (
                          <div key={cur} style={{ fontSize: 12, fontWeight: 700, color: css.text2, fontFamily: "'Geist Mono', monospace" }}>
                            {amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ color: css.text3, fontWeight: 500 }}>{cur}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowReportBuilder(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={saveReport} disabled={!reportBuilder.title.trim() || builderAllExps.length === 0} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "none", background: !reportBuilder.title.trim() || builderAllExps.length === 0 ? css.surface2 : css.accent, color: !reportBuilder.title.trim() || builderAllExps.length === 0 ? css.text3 : "#fff", fontSize: 13, fontWeight: 700, cursor: !reportBuilder.title.trim() || builderAllExps.length === 0 ? "not-allowed" : "pointer" }}>Save Report</button>
                {builderAllExps.length > 0 && reportBuilder.title.trim() && (
                  <button onClick={async () => { await saveReport(); await buildPrintReport(reportBuilder.title, builderAllExps); }} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "none", background: "#1a3a2a", color: "#34d399", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🖨️ Save & Print</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReports = () => {
    const monthlyData = MONTHS.map((month, i) => {
      const monthTrips = trips.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === i;
      });
      return {
        month,
        flights: monthTrips.filter(t => t.type === "flight").length,
        hotels: monthTrips.filter(t => t.type === "hotel").reduce((s, t) => s + (t.nights || t.estimatedNights || 0), 0),
        points: monthTrips.reduce((s, t) => s + (t.estimatedPoints || 0), 0),
      };
    });
    const maxPts = Math.max(...monthlyData.map(d => d.points), 1);
    const totalPoints = trips.reduce((s, t) => s + (t.estimatedPoints || 0), 0);
    const totalNights = trips.reduce((s, t) => s + (t.estimatedNights || t.nights || 0), 0);
    const totalFlights = trips.filter(t => t.type === "flight").length;

    // Flight paths + mileage from route strings
    const flightPaths = [];
    trips.forEach(t => {
      const segs = t.segments && t.segments.length > 0 ? t.segments : (t.type === "flight" && t.route ? [{ type: "flight", route: t.route, status: t.status }] : []);
      segs.filter(s => s.type === "flight" && s.route).forEach(s => {
        const codes = parseRoute(s.route);
        if (codes.length < 2) return;
        const from = AIRPORT_COORDS[codes[0]];
        const to   = AIRPORT_COORDS[codes[codes.length - 1]];
        const dist = haversineDistance(from, to);
        flightPaths.push({ from, to, fromCode: codes[0], toCode: codes[codes.length - 1], dist, id: t.id + "_" + codes.join(""), status: t.status });
      });
    });

    const totalMiles = Math.round(flightPaths.reduce((s, p) => s + p.dist, 0));
    const totalHours = totalMiles > 0 ? (totalMiles / 550) : 0; // ~550 mph avg cruising speed
    const visitedAirports = [...new Set(flightPaths.flatMap(p => [p.fromCode, p.toCode]))];
    const currentYear = new Date().getFullYear();

    return (
      <div>
        {/* Header */}
        <div className="c-a1" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>Analytics</div>
            <h2 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: isMobile ? 28 : 36, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>Annual Reports</h2>
            <p style={{ color: css.text2, fontSize: 13, margin: "8px 0 0" }}>Your 2026 travel year at a glance</p>
          </div>
          <button onClick={() => setShowUpgrade(true)} style={{
            padding: "9px 16px", borderRadius: 8, border: `1px solid ${css.goldBg}`,
            background: css.goldBg, color: css.gold, fontSize: 12, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>★ Export PDF — Premium</button>
        </div>

        {/* Summary stats */}
        <div className="c-a2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Miles Flown", value: totalMiles > 0 ? totalMiles.toLocaleString() : "—", sub: `${currentYear} year to date`, color: "#38bdf8" },
            { label: "Flight Hours", value: totalHours > 0 ? `${Math.floor(totalHours)}h ${Math.round((totalHours % 1) * 60)}m` : "—", sub: `${currentYear} year to date`, color: "#a78bfa" },
            { label: "Flights", value: totalFlights, sub: "planned / confirmed", color: css.success },
            { label: "Hotel Nights", value: totalNights, sub: "qualifying", color: css.accent },
            { label: "Points Earned", value: totalPoints.toLocaleString(), sub: "loyalty pts", color: css.gold },
          ].map((stat, i) => (
            <div key={i} style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "18px 20px", boxShadow: D ? "none" : "0 1px 4px rgba(26,21,18,0.05)" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: stat.color, fontFamily: "'Geist Mono', monospace", lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: css.text, margin: "6px 0 2px" }}>{stat.label}</div>
              <div style={{ fontSize: 10, color: css.text3 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* World Map */}
        <div className="c-a2b" style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 16, padding: "20px 22px", marginBottom: 24, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <div>
              <h4 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: 20, fontWeight: 500, color: css.text, margin: "0 0 4px" }}>Flight Map</h4>
              <div style={{ fontSize: 11, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>
                {visitedAirports.length} airports · {flightPaths.length} routes · {totalMiles.toLocaleString()} mi
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 10, color: css.text3, fontFamily: "Inter, sans-serif" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 16, height: 2, background: "#0EA5A0", display: "inline-block", borderRadius: 1 }}></span>Confirmed</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 16, height: 2, background: "#8a8f98", display: "inline-block", borderRadius: 1, opacity: 0.6 }}></span>Planned</span>
            </div>
          </div>
          <div style={{ borderRadius: 10, overflow: "hidden", background: D ? "#0d0b14" : "#0f172a" }}>
            <ComposableMap
              projectionConfig={{ scale: 147, center: [10, 10] }}
              style={{ width: "100%", height: "auto" }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={D ? "#1e1a2e" : "#1e293b"}
                      stroke={D ? "#2a2640" : "#334155"}
                      strokeWidth={0.4}
                      style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }}
                    />
                  ))
                }
              </Geographies>

              {/* Flight path arcs */}
              {flightPaths.map((path, i) => path.from && path.to && (
                <Line
                  key={i}
                  from={path.from}
                  to={path.to}
                  stroke={path.status === "confirmed" ? "#0EA5A0" : "#8a8f98"}
                  strokeWidth={path.status === "confirmed" ? 1.2 : 0.8}
                  strokeOpacity={path.status === "confirmed" ? 0.8 : 0.45}
                  strokeLinecap="round"
                />
              ))}

              {/* Airport dots */}
              {visitedAirports.map(code => {
                const coords = AIRPORT_COORDS[code];
                if (!coords) return null;
                return (
                  <Marker key={code} coordinates={coords}>
                    <circle r={2.5} fill="#0EA5A0" fillOpacity={0.9} stroke="#fff" strokeWidth={0.6} />
                  </Marker>
                );
              })}
            </ComposableMap>
          </div>
          {flightPaths.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: css.text3, fontSize: 13 }}>
              Add flights with routes (e.g. JFK → LAX) to see your flight map
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="c-a3" style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 16, padding: "20px 22px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
            <h4 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: 20, fontWeight: 500, color: css.text, margin: 0 }}>Points by Month</h4>
            <span style={{ fontSize: 11, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>2026</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: isMobile ? 4 : 8, height: 140 }}>
            {monthlyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                {d.points > 0 && (
                  <div style={{ fontSize: 8, color: css.accent, fontWeight: 700, fontFamily: "'Geist Mono', monospace" }}>
                    {(d.points / 1000).toFixed(0)}k
                  </div>
                )}
                <div style={{
                  width: "100%", maxWidth: 28, height: `${Math.max((d.points / maxPts) * 110, 4)}px`, minHeight: 4,
                  borderRadius: "4px 4px 0 0",
                  background: d.points > 0
                    ? `linear-gradient(180deg, ${css.accent}, ${css.accent}80)`
                    : css.surface2,
                  border: `1px solid ${d.points > 0 ? css.accentBorder : css.border}`,
                  transition: "height 0.8s ease",
                }} />
                <span style={{ fontSize: 8, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>{d.month.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Forecast */}
        <div className="c-a4" style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 16, padding: "20px 22px" }}>
          <h4 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: 20, fontWeight: 500, color: css.text, margin: "0 0 16px" }}>Year-End Status Forecast</h4>
          {allPrograms.filter(p => linkedAccounts[p.id] && p.tiers).length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: css.text3, fontSize: 13 }}>
              Link programs to see your status forecast
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {allPrograms.filter(p => linkedAccounts[p.id] && p.tiers).map(prog => {
                const status = getProjectedStatus(prog.id);
                if (!status) return null;
                const pct = Math.min((status.projected / (status.nextTier?.threshold || status.projected)) * 100, 100);
                return (
                  <div key={prog.id} className="c-row-hover" style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                    background: css.surface2, borderRadius: 10, border: `1px solid ${css.border}`,
                  }}>
                    <ProgramLogo prog={prog} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: css.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prog.name}</div>
                        <div style={{ fontSize: 10, color: status.willAdvance ? css.success : css.text3, flexShrink: 0, marginLeft: 8, fontFamily: "'Geist Mono', monospace" }}>
                          {status.projectedTier?.name || "Member"}{status.willAdvance ? " ↑" : ""}
                        </div>
                      </div>
                      <div style={{ width: "100%", height: 4, borderRadius: 2, background: css.border, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: status.willAdvance ? css.success : prog.color, transition: "width 1s ease" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAlliances = () => {
    const lp = {
      bg: "#08090a", surface: "#0f1012", surface2: "#17191d",
      border: "#1e2028", border2: "#2a2640",
      text: "#f7f8f8", text2: "#d0d6e0", dim: "#8a8f98",
      teal: "#0EA5A0", tealDim: "rgba(14,165,160,0.10)", tealBord: "rgba(14,165,160,0.22)",
      mono: "'Space Mono','JetBrains Mono',monospace", sans: "'DM Sans','Outfit',sans-serif",
      red: "#e05252", green: "#3ecf8e", yellow: "#f5a623",
    };
    const st = { color: lp.text, fontFamily: lp.sans };

    // Determine user's elite tier from selected program via projected status, with manual override
    const myStatus = getProjectedStatus(allianceMyProgram);
    const myEliteLevel = allianceMyTierOverride || myStatus?.currentTier?.name || null;
    const myAllianceMeta = ALLIANCE_MBR[allianceMyProgram];
    const myAllianceTierKey = myAllianceMeta && myEliteLevel ? myAllianceMeta.tierMap[myEliteLevel] : null;
    const availableTiers = Object.keys(myAllianceMeta?.tierMap || {});
    const myHomeBenefits = HOME_BENEFITS[allianceMyProgram]?.[myEliteLevel] || null;

    // Compare program — only show reciprocal benefits if same alliance
    const cmpAllianceMeta = ALLIANCE_MBR[allianceCompare];
    const myAlliance = myAllianceMeta?.alliance;
    const cmpAlliance = cmpAllianceMeta?.alliance;
    const sameAlliance = !!(myAlliance && cmpAlliance && myAlliance === cmpAlliance);
    const cmpTierKey = sameAlliance ? myAllianceTierKey : null;
    const cmpRecipBenefits = cmpTierKey ? RECIP_BENEFITS[cmpTierKey] : null;

    const compareOptions = Object.entries(ALLIANCE_MBR)
      .filter(([id]) => id !== allianceMyProgram)
      .map(([id, meta]) => ({ id, meta }));

    // Program display names
    const PROG_NAMES = {
      aa: "American Airlines AAdvantage", ua: "United MileagePlus", dl: "Delta SkyMiles",
      aeroplan: "Air Canada Aeroplan", singapore_kf: "Singapore KrisFlyer",
      turkish_miles: "Turkish Miles&Smiles", ba_avios: "British Airways Avios",
      qantas_ff: "Qantas Frequent Flyer", cathay_mp: "Cathay Pacific Marco Polo",
      flying_blue: "Air France/KLM Flying Blue",
    };

    // Group BENEFIT_ROWS by category
    const cats = [...new Set(BENEFIT_ROWS.map(r => r.cat))];

    const Cell = ({ ben }) => {
      if (!ben) return (
        <td style={{ padding: "10px 14px", borderBottom: `1px solid ${lp.border}`, color: lp.dim, fontFamily: lp.mono, fontSize: 12 }}>—</td>
      );
      return (
        <td style={{ padding: "10px 14px", borderBottom: `1px solid ${lp.border}`, verticalAlign: "top" }}>
          <div style={{ fontFamily: lp.mono, fontSize: 12, fontWeight: 700, color: ben.ok ? lp.green : lp.text2 }}>{ben.v}</div>
          {ben.d && <div style={{ fontFamily: lp.sans, fontSize: 11, color: lp.dim, marginTop: 3, lineHeight: 1.4 }}>{ben.d}</div>}
        </td>
      );
    };

    const noStatus = !myHomeBenefits;

    return (
      <div style={{ ...st }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: lp.mono, fontSize: 11, letterSpacing: 2, color: lp.teal, marginBottom: 8, textTransform: "uppercase" }}>Airline Alliances</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: lp.text, letterSpacing: -0.5 }}>Elite Status Comparison</h1>
          <p style={{ margin: "6px 0 0", color: lp.dim, fontSize: 14 }}>Compare your current home-carrier benefits against reciprocal benefits on a partner airline.</p>
        </div>

        {/* Selectors row */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
          {/* My Program */}
          <div style={{ flex: 1, minWidth: 220, background: lp.surface, border: `1px solid ${lp.border}`, padding: "16px 20px" }}>
            <div style={{ fontFamily: lp.mono, fontSize: 10, letterSpacing: 1.5, color: lp.teal, marginBottom: 8, textTransform: "uppercase" }}>My Program</div>
            <select
              value={allianceMyProgram}
              onChange={e => { setAllianceMyProgram(e.target.value); setAllianceMyTierOverride(null); }}
              style={{ width: "100%", background: lp.surface2, border: `1px solid ${lp.border2}`, color: lp.text, padding: "8px 10px", fontFamily: lp.mono, fontSize: 12, outline: "none" }}
            >
              {Object.entries(PROG_NAMES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            {availableTiers.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontFamily: lp.mono, fontSize: 10, letterSpacing: 1, color: lp.dim, marginBottom: 5, textTransform: "uppercase" }}>Membership Tier</div>
                <select
                  value={allianceMyTierOverride || (myStatus?.currentTier?.name || "")}
                  onChange={e => setAllianceMyTierOverride(e.target.value || null)}
                  style={{ width: "100%", background: lp.surface2, border: `1px solid ${lp.border2}`, color: lp.text, padding: "8px 10px", fontFamily: lp.mono, fontSize: 12, outline: "none" }}
                >
                  <option value="">— Select tier —</option>
                  {availableTiers.map(tier => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
              </div>
            )}
            {myEliteLevel && myAllianceTierKey && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, background: ALLIANCE_TIER_COLORS[myAllianceTierKey] }} />
                <span style={{ fontFamily: lp.mono, fontSize: 11, color: lp.text2 }}>{myEliteLevel} → {ALLIANCE_TIER_LABELS[myAllianceTierKey]}</span>
              </div>
            )}
            {myEliteLevel && !myAllianceTierKey && (
              <div style={{ marginTop: 10, fontFamily: lp.mono, fontSize: 11, color: lp.yellow }}>No alliance tier mapped for "{myEliteLevel}"</div>
            )}
            {!myEliteLevel && (
              <div style={{ marginTop: 10, fontFamily: lp.mono, fontSize: 11, color: lp.dim }}>No elite status on file for this program</div>
            )}
          </div>

          {/* Compare airline */}
          <div style={{ flex: 1, minWidth: 220, background: lp.surface, border: `1px solid ${lp.border}`, padding: "16px 20px" }}>
            <div style={{ fontFamily: lp.mono, fontSize: 10, letterSpacing: 1.5, color: lp.teal, marginBottom: 8, textTransform: "uppercase" }}>Compare Partner Airline</div>
            <select
              value={allianceCompare}
              onChange={e => setAllianceCompare(e.target.value)}
              style={{ width: "100%", background: lp.surface2, border: `1px solid ${lp.border2}`, color: lp.text, padding: "8px 10px", fontFamily: lp.mono, fontSize: 12, outline: "none" }}
            >
              {compareOptions.map(({ id }) => (
                <option key={id} value={id}>{PROG_NAMES[id] || id}</option>
              ))}
            </select>
            {cmpAllianceMeta && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, background: cmpAllianceMeta.color }} />
                <span style={{ fontFamily: lp.mono, fontSize: 11, color: lp.text2 }}>{ALLIANCE_LABELS[cmpAllianceMeta.alliance] || cmpAllianceMeta.alliance}</span>
              </div>
            )}
          </div>

          {/* Alliance status badge */}
          {myAllianceTierKey && (
            <div style={{
              flex: 1, minWidth: 220, background: lp.surface, padding: "16px 20px",
              border: `1px solid ${sameAlliance ? lp.tealBord : lp.border}`,
              borderLeft: `3px solid ${sameAlliance ? ALLIANCE_TIER_COLORS[myAllianceTierKey] : lp.red}`,
            }}>
              <div style={{ fontFamily: lp.mono, fontSize: 10, letterSpacing: 1.5, color: sameAlliance ? lp.teal : lp.red, marginBottom: 8, textTransform: "uppercase" }}>
                {sameAlliance ? "Reciprocal Tier" : "No Reciprocal Benefits"}
              </div>
              {sameAlliance ? (
                <>
                  <div style={{ fontFamily: lp.mono, fontSize: 14, fontWeight: 700, color: ALLIANCE_TIER_COLORS[myAllianceTierKey] }}>{ALLIANCE_TIER_LABELS[myAllianceTierKey]}</div>
                  <div style={{ fontFamily: lp.sans, fontSize: 12, color: lp.dim, marginTop: 4 }}>
                    {PROG_NAMES[allianceCompare] || allianceCompare} will recognize you as <strong style={{ color: lp.text2 }}>{ALLIANCE_TIER_LABELS[myAllianceTierKey]}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: lp.mono, fontSize: 13, fontWeight: 700, color: lp.red }}>
                    {ALLIANCE_LABELS[myAlliance]} ≠ {ALLIANCE_LABELS[cmpAlliance] || cmpAlliance}
                  </div>
                  <div style={{ fontFamily: lp.sans, fontSize: 12, color: lp.dim, marginTop: 4 }}>
                    Your {ALLIANCE_LABELS[myAlliance]} status earns no reciprocal benefits on {PROG_NAMES[allianceCompare] || allianceCompare}. Select a {ALLIANCE_LABELS[myAlliance]} partner to see benefits.
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {noStatus && (
          <div style={{ background: lp.surface, border: `1px solid ${lp.border}`, padding: "20px 24px", marginBottom: 24, fontFamily: lp.mono, fontSize: 13, color: lp.yellow }}>
            No home benefits found for this program/tier combination. Link your loyalty account with an elite status level to see full comparison.
          </div>
        )}

        {/* Different alliance — no reciprocal benefits panel */}
        {!sameAlliance && myAlliance && cmpAlliance && (
          <div style={{ background: lp.surface, border: `1px solid ${lp.border}`, borderLeft: `4px solid ${lp.red}`, padding: "28px 32px", textAlign: "center" }}>
            <div style={{ fontFamily: lp.mono, fontSize: 28, marginBottom: 16 }}>✗</div>
            <div style={{ fontFamily: lp.mono, fontSize: 15, fontWeight: 700, color: lp.text, marginBottom: 10 }}>
              No Reciprocal Benefits
            </div>
            <div style={{ fontFamily: lp.sans, fontSize: 14, color: lp.dim, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
              <strong style={{ color: lp.text2 }}>{PROG_NAMES[allianceMyProgram]}</strong> is a <strong style={{ color: ALLIANCE_TIER_COLORS[myAllianceTierKey] || lp.teal }}>{ALLIANCE_LABELS[myAlliance]}</strong> member.
              {" "}<strong style={{ color: lp.text2 }}>{PROG_NAMES[allianceCompare]}</strong> is a <strong style={{ color: lp.yellow }}>{ALLIANCE_LABELS[cmpAlliance]}</strong> member.
            </div>
            <div style={{ fontFamily: lp.sans, fontSize: 13, color: lp.dim, marginTop: 12, lineHeight: 1.6 }}>
              Your {myEliteLevel} status on {ALLIANCE_LABELS[myAlliance]} does not grant any reciprocal elite benefits when flying {PROG_NAMES[allianceCompare]}.
              To see reciprocal benefits, select a <strong style={{ color: lp.text2 }}>{ALLIANCE_LABELS[myAlliance]}</strong> partner airline.
            </div>
            {/* Show which programs ARE valid partners */}
            <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              <span style={{ fontFamily: lp.mono, fontSize: 10, color: lp.dim, alignSelf: "center", letterSpacing: 1 }}>{ALLIANCE_LABELS[myAlliance]} PARTNERS:</span>
              {Object.entries(ALLIANCE_MBR)
                .filter(([id, meta]) => id !== allianceMyProgram && meta.alliance === myAlliance)
                .map(([id]) => (
                  <button key={id} onClick={() => setAllianceCompare(id)} style={{
                    padding: "5px 12px", fontFamily: lp.mono, fontSize: 11, cursor: "pointer",
                    background: lp.surface2, border: `1px solid ${lp.border2}`, color: lp.text2,
                  }}>
                    {PROG_NAMES[id] || id}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Benefit table — only when same alliance */}
        {sameAlliance && (
        <div style={{ background: lp.surface, border: `1px solid ${lp.border}`, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ background: lp.surface2, borderBottom: `2px solid ${lp.teal}` }}>
                <th style={{ padding: "12px 14px", textAlign: "left", fontFamily: lp.mono, fontSize: 11, letterSpacing: 1, color: lp.dim, fontWeight: 600, width: "28%" }}>Benefit</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontFamily: lp.mono, fontSize: 11, letterSpacing: 1, color: lp.teal, fontWeight: 700 }}>
                  Your Status ({myEliteLevel || "—"})<br />
                  <span style={{ color: lp.dim, fontWeight: 400, fontSize: 10 }}>{PROG_NAMES[allianceMyProgram] || allianceMyProgram}</span>
                </th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontFamily: lp.mono, fontSize: 11, letterSpacing: 1, color: lp.yellow, fontWeight: 700 }}>
                  As {ALLIANCE_TIER_LABELS[cmpTierKey]} on {PROG_NAMES[allianceCompare] || allianceCompare}<br />
                  <span style={{ color: ALLIANCE_TIER_COLORS[cmpTierKey], fontWeight: 600, fontSize: 10 }}>{ALLIANCE_LABELS[myAlliance]} Reciprocal</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {cats.map(cat => {
                const rows = BENEFIT_ROWS.filter(r => r.cat === cat);
                return [
                  <tr key={`cat-${cat}`}>
                    <td colSpan={3} style={{ padding: "8px 14px 4px", background: lp.bg, fontFamily: lp.mono, fontSize: 10, letterSpacing: 2, color: lp.teal, fontWeight: 700, textTransform: "uppercase", borderBottom: `1px solid ${lp.border}` }}>{cat}</td>
                  </tr>,
                  ...rows.map(row => (
                    <tr key={row.id} style={{ background: lp.surface }}>
                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${lp.border}`, verticalAlign: "top" }}>
                        <div style={{ fontFamily: lp.sans, fontSize: 13, fontWeight: 600, color: lp.text2 }}>{row.label}</div>
                        <div style={{ fontFamily: lp.sans, fontSize: 11, color: lp.dim, marginTop: 2 }}>{row.sub}</div>
                      </td>
                      <Cell ben={myHomeBenefits?.[row.id]} />
                      <Cell ben={cmpRecipBenefits?.[row.id]} />
                    </tr>
                  ))
                ];
              })}
            </tbody>
          </table>
        </div>
        )}

        {/* Footer note */}
        <div style={{ marginTop: 16, padding: "12px 16px", background: lp.surface, border: `1px solid ${lp.border}`, fontFamily: lp.sans, fontSize: 12, color: lp.dim, lineHeight: 1.6 }}>
          <strong style={{ color: lp.text2 }}>Disclaimer:</strong> Benefits shown are based on published alliance standards and typical carrier implementations. Actual benefits may vary by route, fare class, and carrier. Always verify with the operating carrier before travel.
        </div>
      </div>
    );
  };

  const renderInsights = (_previewTab = null) => {
    const INSIGHT_TABS = [
      { id: "countdown",  label: "Status Countdown", tier: "free" },
      { id: "expiration", label: "Expiration Tracker", tier: "free" },
      { id: "redemption", label: "Redemption Value",   tier: "free" },
      { id: "transfer",   label: "Transfer Matrix",    tier: "free" },
      { id: "annual_fee", label: "Annual Fee Calc",    tier: "free" },
    ];
    const isPremium = true; // All features free for now

    // ── Helpers ──────────────────────────────────────────────────
    const allPrograms = [
      ...LOYALTY_PROGRAMS.airlines,
      ...LOYALTY_PROGRAMS.hotels,
      ...LOYALTY_PROGRAMS.creditCards,
    ];
    const findProg = (id) => allPrograms.find(p => p.id === id);

    // Infer last-activity date from trips
    const lastActivityByProg = {};
    const allTrips = [...(user?.upcomingTrips || []), ...trips];
    allTrips.forEach(t => {
      const d = t.date ? new Date(t.date) : null;
      if (!d || isNaN(d)) return;
      if (!lastActivityByProg[t.program] || d > lastActivityByProg[t.program]) {
        lastActivityByProg[t.program] = d;
      }
    });

    const today = new Date("2026-03-08");
    const daysBetween = (a, b) => Math.round((b - a) / 86400000);

    // ── Sub-tab: Status Countdown ─────────────────────────────────
    const renderCountdown = () => {
      const progsSorted = Object.entries(linkedAccounts)
        .map(([id, acct]) => {
          const prog = findProg(id);
          if (!prog || !prog.tiers) return null;
          const current = acct.tierCredits ?? acct.currentNights ?? acct.currentRentals ?? 0;
          const nextTier = prog.tiers.find(t => t.threshold > current);
          const currentTierObj = [...prog.tiers].reverse().find(t => t.threshold <= current);
          const deficit = nextTier ? nextTier.threshold - current : 0;
          const pct = nextTier ? Math.min((current / nextTier.threshold) * 100, 100) : 100;
          const yearEnd = new Date("2026-12-31");
          const daysLeft = daysBetween(today, yearEnd);
          return { id, prog, acct, current, nextTier, currentTierObj, deficit, pct, daysLeft };
        })
        .filter(Boolean);

      if (progsSorted.length === 0) {
        return (
          <div style={{ textAlign: "center", padding: "60px 20px", color: css.text3 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>No linked accounts yet</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Link your loyalty programs in the Programs tab to see your status countdown.</div>
          </div>
        );
      }

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 13, color: css.text3, marginBottom: 4 }}>
            Qualification year ends <strong style={{ color: css.text }}>Dec 31, 2026</strong> · {Math.round(daysBetween(today, new Date("2026-12-31")) / 30.5)} months remaining
          </div>
          {progsSorted.map(({ id, prog, current, nextTier, currentTierObj, deficit, pct, daysLeft }) => (
            <div key={id} className="c-card" style={{ background: css.surface, border: `1px solid ${css.border}`, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ProgramLogo prog={prog} size={28} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: css.text }}>{prog.name}</div>
                    <div style={{ fontSize: 12, color: css.text3 }}>
                      {currentTierObj ? <span style={{ color: css.gold, fontWeight: 600 }}>{currentTierObj.name}</span> : "No status yet"}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {nextTier ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 700, color: css.accent }}>{deficit.toLocaleString()} to go</div>
                      <div style={{ fontSize: 11, color: css.text3 }}>for {nextTier.name}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, fontWeight: 700, color: css.success }}>Top tier ✓</div>
                  )}
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ position: "relative", height: 6, background: css.surface3, borderRadius: 0 }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ position: "absolute", top: 0, left: 0, height: "100%", background: pct >= 100 ? css.success : css.accent, borderRadius: 0 }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: css.text3 }}>
                <span>{current.toLocaleString()} {prog.unit}</span>
                {nextTier && <span>{nextTier.threshold.toLocaleString()} {prog.unit}</span>}
              </div>
              {nextTier && (
                <div style={{ fontSize: 12, color: css.text3, background: css.surface2, padding: "8px 12px", borderLeft: `2px solid ${css.accentBorder}` }}>
                  At current pace: <strong style={{ color: css.text }}>{Math.round(deficit / (daysLeft / 30.5))}</strong> {prog.unit}/month needed in {daysLeft} days remaining
                </div>
              )}
            </div>
          ))}
        </div>
      );
    };

    // ── Sub-tab: Expiration Tracker ───────────────────────────────
    const renderExpiration = () => {
      const rows = Object.entries(linkedAccounts).map(([id, acct]) => {
        const prog = findProg(id);
        if (!prog) return null;
        const rule = EXPIRATION_RULES[id];
        if (!rule) return null;
        const balance = acct.currentPoints ?? acct.bonvoyPoints ?? acct.hhPoints ?? acct.ihgPoints ?? acct.pointsBalance ?? acct.currentNights ?? 0;
        const lastActivity = lastActivityByProg[id];
        let expiresIn = null, risk = "safe";
        if (!rule.neverExpire && rule.months > 0) {
          const expirationDate = lastActivity ? new Date(lastActivity.getTime() + rule.months * 30.5 * 86400000) : null;
          expiresIn = expirationDate ? daysBetween(today, expirationDate) : null;
          if (expiresIn !== null) {
            if (expiresIn < 90) risk = "high";
            else if (expiresIn < 180) risk = "medium";
            else risk = "safe";
          } else {
            risk = "unknown";
          }
        }
        return { id, prog, acct, rule, balance, expiresIn, risk };
      }).filter(Boolean);

      const riskColor = { safe: css.success, medium: css.warning, high: "#ef4444", unknown: css.text3 };
      const riskLabel = { safe: "Safe", medium: "Monitor", high: "At Risk", unknown: "Unknown" };

      if (rows.length === 0) {
        return (
          <div style={{ textAlign: "center", padding: "60px 20px", color: css.text3 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏱️</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>No linked accounts</div>
          </div>
        );
      }

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.sort((a, b) => {
            const order = { high: 0, medium: 1, unknown: 2, safe: 3 };
            return order[a.risk] - order[b.risk];
          }).map(({ id, prog, rule, balance, expiresIn, risk }) => (
            <div key={id} className="c-card" style={{ background: css.surface, border: `1px solid ${css.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <ProgramLogo prog={prog} size={26} />
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: css.text }}>{prog.name}</div>
                <div style={{ fontSize: 11, color: css.text3, marginTop: 2 }}>{balance.toLocaleString()} {prog.unit}</div>
              </div>
              <div style={{ flex: 2, minWidth: 160 }}>
                {rule.neverExpire ? (
                  <div style={{ fontSize: 12, color: css.success }}>✓ Never expire</div>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: css.text2 }}>
                      {expiresIn !== null
                        ? expiresIn > 0
                          ? `Expires in ${expiresIn} days`
                          : "⚠️ May have expired"
                        : "No recent activity found"}
                    </div>
                    <div style={{ fontSize: 11, color: css.text3, marginTop: 2 }}>{rule.note}</div>
                  </>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: riskColor[risk] }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: riskColor[risk] }}>
                  {rule.neverExpire ? "Safe" : riskLabel[risk]}
                </span>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: css.text3, marginTop: 4, paddingLeft: 2 }}>
            * Activity dates inferred from logged trips. Link your accounts for real-time data.
          </div>
        </div>
      );
    };

    // ── Sub-tab: Redemption Value Engine ─────────────────────────
    const renderRedemption = () => {
      if (!isPremium) {
        return (
          <div className="c-a1" style={{ textAlign: "center", padding: "60px 20px", background: css.surface, border: `1px solid ${css.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>💎</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: css.gold, marginBottom: 8 }}>Premium Feature</div>
            <h3 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: 28, fontWeight: 600, color: css.text, margin: "0 0 12px" }}>Redemption Value Engine</h3>
            <p style={{ color: css.text2, fontSize: 14, maxWidth: 380, margin: "0 auto 24px", lineHeight: 1.6 }}>See the real dollar value of your miles and points, plus where to get the most out of each balance.</p>
            <button onClick={() => setActiveView("premium")} className="c-btn-primary" style={{ padding: "10px 24px", background: css.accent, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, borderRadius: 0 }}>Upgrade to Premium</button>
          </div>
        );
      }

      const entries = Object.entries(linkedAccounts).map(([id, acct]) => {
        const prog = findProg(id);
        const rdv = REDEMPTION_VALUES[id];
        if (!prog || !rdv) return null;
        const balance = acct.currentPoints ?? acct.bonvoyPoints ?? acct.hhPoints ?? acct.ihgPoints ?? acct.pointsBalance ?? 0;
        const dollarValue = (balance * rdv.cpp / 100).toFixed(0);
        return { id, prog, rdv, balance, dollarValue };
      }).filter(Boolean).sort((a, b) => b.dollarValue - a.dollarValue);

      const totalValue = entries.reduce((s, e) => s + parseFloat(e.dollarValue), 0);

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Total value banner */}
          <div style={{ background: css.accentBg, border: `1px solid ${css.accentBorder}`, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: css.accent, marginBottom: 4 }}>Portfolio Value (at peak redemption)</div>
              <div style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: 42, fontWeight: 600, color: css.text, lineHeight: 1 }}>
                ${totalValue.toLocaleString()}
              </div>
            </div>
            <div style={{ fontSize: 12, color: css.text2, maxWidth: 240, lineHeight: 1.5 }}>
              Based on best achievable cents-per-point (CPP) values, not average. Actual value depends on how you redeem.
            </div>
          </div>

          {entries.map(({ id, prog, rdv, balance, dollarValue }) => (
            <div key={id} className="c-card" style={{ background: css.surface, border: `1px solid ${css.border}`, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ProgramLogo prog={prog} size={28} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: css.text }}>{prog.name}</div>
                    <div style={{ fontSize: 12, color: css.text3 }}>{balance.toLocaleString()} {prog.unit} · <span style={{ color: css.accent, fontWeight: 700 }}>{rdv.cpp}¢/pt peak CPP</span></div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: 28, fontWeight: 600, color: css.text }}>${parseFloat(dollarValue).toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: css.text3 }}>peak value</div>
                </div>
              </div>
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: css.surface2, padding: "10px 12px", borderLeft: `2px solid ${css.success}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: css.success, marginBottom: 4 }}>Best Use</div>
                  <div style={{ fontSize: 12, color: css.text2, lineHeight: 1.4 }}>{rdv.best}</div>
                </div>
                <div style={{ background: css.surface2, padding: "10px 12px", borderLeft: `2px solid #ef4444` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#ef4444", marginBottom: 4 }}>Avoid</div>
                  <div style={{ fontSize: 12, color: css.text2, lineHeight: 1.4 }}>{rdv.avoid}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    };

    // ── Sub-tab: Transfer Partner Matrix ─────────────────────────
    const renderTransfer = () => {
      if (!isPremium) {
        return (
          <div className="c-a1" style={{ textAlign: "center", padding: "60px 20px", background: css.surface, border: `1px solid ${css.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🔀</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: css.gold, marginBottom: 8 }}>Premium Feature</div>
            <h3 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: 28, fontWeight: 600, color: css.text, margin: "0 0 12px" }}>Transfer Partner Matrix</h3>
            <p style={{ color: css.text2, fontSize: 14, maxWidth: 380, margin: "0 auto 24px", lineHeight: 1.6 }}>Explore which credit card currencies can reach your target airline or hotel program, and chart the optimal transfer path.</p>
            <button onClick={() => setActiveView("premium")} className="c-btn-primary" style={{ padding: "10px 24px", background: css.accent, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, borderRadius: 0 }}>Upgrade to Premium</button>
          </div>
        );
      }

      // Build matrix: all linked credit cards that have transfer partners
      const linkedCards = Object.keys(linkedAccounts).filter(id => CC_TRANSFER_PARTNERS[id]?.partners);
      const allTargets = [...new Set(linkedCards.flatMap(id => CC_TRANSFER_PARTNERS[id].partners))];

      // Goal finder
      const goalMatches = transferGoal
        ? linkedCards.filter(id => CC_TRANSFER_PARTNERS[id]?.partners?.includes(transferGoal))
        : [];

      const targetProg = transferGoal ? findProg(transferGoal) : null;

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Goal finder */}
          <div style={{ background: css.surface, border: `1px solid ${css.border}`, padding: "20px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: css.text3, marginBottom: 12 }}>Transfer Path Advisor</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 12, color: css.text2, marginBottom: 6 }}>I want to earn points in...</div>
                <select
                  value={transferGoal}
                  onChange={e => setTransferGoal(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 13, borderRadius: 0, cursor: "pointer" }}
                >
                  <option value="">Select a target program</option>
                  {allTargets.map(tid => {
                    const tp = findProg(tid);
                    return tp ? <option key={tid} value={tid}>{tp.name}</option> : null;
                  })}
                </select>
              </div>
            </div>
            {transferGoal && (
              <div style={{ marginTop: 16 }}>
                {goalMatches.length > 0 ? (
                  <>
                    <div style={{ fontSize: 12, color: css.success, fontWeight: 600, marginBottom: 10 }}>
                      ✓ {goalMatches.length} card{goalMatches.length > 1 ? "s" : ""} can transfer to {targetProg?.name}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {goalMatches.map(cardId => {
                        const cardProg = findProg(cardId);
                        const tp = CC_TRANSFER_PARTNERS[cardId];
                        const balance = linkedAccounts[cardId]?.pointsBalance ?? 0;
                        return (
                          <div key={cardId} style={{ display: "flex", alignItems: "center", gap: 12, background: css.surface2, padding: "10px 14px", borderLeft: `2px solid ${css.accent}` }}>
                            <ProgramLogo prog={cardProg} size={22} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{cardProg?.name}</div>
                              <div style={{ fontSize: 11, color: css.text3 }}>{tp.currency}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: css.accent }}>{balance.toLocaleString()} pts</div>
                              <div style={{ fontSize: 11, color: css.text3 }}>available to transfer</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: "#ef4444" }}>
                    None of your linked cards can transfer to {targetProg?.name}. Consider adding a card that does.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Full matrix */}
          <div style={{ background: css.surface, border: `1px solid ${css.border}`, padding: "20px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: css.text3, marginBottom: 16 }}>Your Transfer Matrix</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {linkedCards.map(cardId => {
                const cardProg = findProg(cardId);
                const tp = CC_TRANSFER_PARTNERS[cardId];
                const balance = linkedAccounts[cardId]?.pointsBalance ?? 0;
                return (
                  <div key={cardId}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <ProgramLogo prog={cardProg} size={22} />
                      <div style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{cardProg?.name}</div>
                      <div style={{ fontSize: 11, color: css.accent, fontWeight: 600, marginLeft: "auto" }}>{balance.toLocaleString()} {tp.currency}</div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 32 }}>
                      {tp.partners.map(pid => {
                        const pp = findProg(pid);
                        const isGoal = pid === transferGoal;
                        return pp ? (
                          <button
                            key={pid}
                            onClick={() => setTransferGoal(pid)}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "4px 10px", border: `1px solid ${isGoal ? css.accent : css.border}`,
                              background: isGoal ? css.accentBg : "transparent",
                              color: isGoal ? css.accent : css.text2,
                              fontSize: 11, fontWeight: isGoal ? 600 : 400, cursor: "pointer", borderRadius: 0,
                            }}
                          >
                            <ProgramLogo prog={pp} size={14} />
                            {pp.name.split(" ")[0]}
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    };

    // ── Sub-tab: Annual Fee Calculator ────────────────────────────
    const renderAnnualFee = () => {
      if (!isPremium) {
        return (
          <div className="c-a1" style={{ textAlign: "center", padding: "60px 20px", background: css.surface, border: `1px solid ${css.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🧮</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: css.gold, marginBottom: 8 }}>Premium Feature</div>
            <h3 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: 28, fontWeight: 600, color: css.text, margin: "0 0 12px" }}>Annual Fee Calculator</h3>
            <p style={{ color: css.text2, fontSize: 14, maxWidth: 380, margin: "0 auto 24px", lineHeight: 1.6 }}>Tally the dollar value of benefits you actually use and see whether your card is truly worth the fee.</p>
            <button onClick={() => setActiveView("premium")} className="c-btn-primary" style={{ padding: "10px 24px", background: css.accent, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, borderRadius: 0 }}>Upgrade to Premium</button>
          </div>
        );
      }

      const cardData = CARD_BENEFITS_DATA[annualFeeCard];
      const catColors = { travel: css.accent, lifestyle: css.gold, lounge: "#8B6CF6", status: css.success, rewards: css.text2 };

      const getEffectiveValue = (b) => {
        const key = `${annualFeeCard}:${b.id}`;
        const custom = customBenefitValues[key];
        return (custom !== undefined && custom !== "") ? Number(custom) : b.value;
      };
      const usedValue = cardData
        ? cardData.benefits.reduce((sum, b) => {
            const key = `${annualFeeCard}:${b.id}`;
            return sum + (checkedBenefits[key] ? getEffectiveValue(b) : 0);
          }, 0)
        : 0;
      const netValue = usedValue - (cardData?.annualFee || 0);

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Card selector */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.keys(CARD_BENEFITS_DATA).map(cid => {
              const cp = findProg(cid);
              return (
                <button
                  key={cid}
                  onClick={() => setAnnualFeeCard(cid)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 14px", border: `1px solid ${annualFeeCard === cid ? css.accent : css.border}`,
                    background: annualFeeCard === cid ? css.accentBg : css.surface,
                    color: annualFeeCard === cid ? css.accent : css.text2,
                    fontSize: 12, fontWeight: annualFeeCard === cid ? 700 : 400,
                    cursor: "pointer", borderRadius: 0,
                  }}
                >
                  {cp && <ProgramLogo prog={cp} size={16} />}
                  {cp?.name || cid}
                </button>
              );
            })}
          </div>

          {cardData && (
            <>
              {/* Net value summary */}
              <div style={{ background: netValue >= 0 ? css.successBg : css.warningBg, border: `1px solid ${netValue >= 0 ? css.success : css.warning}`, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: netValue >= 0 ? css.success : css.warning, marginBottom: 6 }}>
                    {netValue >= 0 ? "Card is paying for itself" : "Card is costing you"}
                  </div>
                  <div style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: 38, fontWeight: 600, color: css.text, lineHeight: 1 }}>
                    {netValue >= 0 ? "+" : ""}{netValue < 0 ? `-$${Math.abs(netValue).toLocaleString()}` : `$${netValue.toLocaleString()}`}
                    <span style={{ fontSize: 16, color: css.text3, marginLeft: 8, fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontWeight: 400 }}>net value</span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: css.text2, textAlign: "right" }}>
                  <div>Benefits used: <strong style={{ color: css.text }}>${usedValue.toLocaleString()}</strong></div>
                  <div>Annual fee: <strong style={{ color: css.text }}>−${cardData.annualFee.toLocaleString()}</strong></div>
                </div>
              </div>

              {/* Benefits checklist */}
              <div style={{ background: css.surface, border: `1px solid ${css.border}`, padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: css.text3 }}>
                    Check off benefits you use · edit value to match what you actually get
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {cardData.benefits.map(benefit => {
                    const key = `${annualFeeCard}:${benefit.id}`;
                    const checked = !!checkedBenefits[key];
                    const customVal = customBenefitValues[key];
                    const isCustomized = customVal !== undefined && customVal !== "" && Number(customVal) !== benefit.value;
                    return (
                      <div
                        key={benefit.id}
                        className="c-row-hover"
                        onClick={() => setCheckedBenefits(prev => ({ ...prev, [key]: !prev[key] }))}
                        style={{
                          display: "flex", alignItems: "center", gap: 14, padding: "12px 10px",
                          cursor: "pointer", borderBottom: `1px solid ${css.surface2}`,
                          background: checked ? (D ? "rgba(61,184,122,0.05)" : "rgba(61,184,122,0.04)") : "transparent",
                        }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: 18, height: 18, border: `2px solid ${checked ? css.success : css.border}`,
                          background: checked ? css.success : "transparent", display: "flex",
                          alignItems: "center", justifyContent: "center", flexShrink: 0,
                          transition: "all 0.15s ease",
                        }}>
                          {checked && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</span>}
                        </div>
                        {/* Label + note */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: css.text }}>{benefit.name}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: catColors[benefit.cat] || css.text3, opacity: 0.8 }}>{benefit.cat}</span>
                          </div>
                          <div style={{ fontSize: 11, color: css.text3, marginTop: 2, lineHeight: 1.4 }}>{benefit.note}</div>
                        </div>
                        {/* Editable value */}
                        <div
                          onClick={e => e.stopPropagation()}
                          style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, gap: 2 }}
                        >
                          <div style={{ display: "flex", alignItems: "center", border: `1px solid ${isCustomized ? css.accent : css.border}`, background: css.surface2, transition: "border-color 0.15s" }}>
                            <span style={{ padding: "4px 0 4px 8px", fontSize: 13, fontWeight: 600, color: checked ? css.success : css.text3 }}>$</span>
                            <input
                              type="number"
                              min="0"
                              value={customVal !== undefined ? customVal : benefit.value}
                              onChange={e => setCustomBenefitValues(prev => ({ ...prev, [key]: e.target.value }))}
                              style={{
                                width: 64, padding: "4px 8px 4px 2px", border: "none", outline: "none",
                                background: "transparent", fontSize: 13, fontWeight: 600,
                                color: checked ? css.success : css.text3,
                                fontFamily: "'Instrument Sans', 'Outfit', sans-serif", textAlign: "right",
                              }}
                            />
                          </div>
                          {isCustomized && (
                            <button
                              onClick={() => setCustomBenefitValues(prev => { const n = { ...prev }; delete n[key]; return n; })}
                              style={{ fontSize: 10, color: css.text3, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Instrument Sans', 'Outfit', sans-serif", lineHeight: 1 }}
                            >
                              reset (${benefit.value})
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${css.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    onClick={() => {
                      const allKeys = cardData.benefits.reduce((acc, b) => {
                        acc[`${annualFeeCard}:${b.id}`] = true;
                        return acc;
                      }, {});
                      setCheckedBenefits(prev => ({ ...prev, ...allKeys }));
                    }}
                    style={{ fontSize: 12, color: css.accent, background: "none", border: "none", cursor: "pointer", fontFamily: "'Instrument Sans', 'Outfit', sans-serif", padding: 0 }}
                  >
                    Check all
                  </button>
                  <button
                    onClick={() => {
                      const cleared = cardData.benefits.reduce((acc, b) => {
                        acc[`${annualFeeCard}:${b.id}`] = false;
                        return acc;
                      }, {});
                      setCheckedBenefits(prev => ({ ...prev, ...cleared }));
                    }}
                    style={{ fontSize: 12, color: css.text3, background: "none", border: "none", cursor: "pointer", fontFamily: "'Instrument Sans', 'Outfit', sans-serif", padding: 0 }}
                  >
                    Clear all
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      );
    };

    // ── Main Insights layout ──────────────────────────────────────
    const activeTab = _previewTab ?? insightTab;
    const subContent =
      activeTab === "countdown"  ? renderCountdown()  :
      activeTab === "expiration" ? renderExpiration() :
      activeTab === "redemption" ? renderRedemption() :
      activeTab === "transfer"   ? renderTransfer()   :
                                   renderAnnualFee();

    // Preview mode: return raw sub-content for nav thumbnail
    if (_previewTab !== null) return subContent;

    return (
      <div>
        {/* Header */}
        <div className="c-a1" style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: css.accent, marginBottom: 8 }}>Intelligence Layer</div>
          <h2 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: isMobile ? 28 : 38, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>Insights</h2>
          <p style={{ color: css.text2, fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>Track your qualification runway, protect expiring miles, and maximize every point you have.</p>
        </div>

        {/* Sub-tab bar — desktop only (mobile uses header strip) */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${css.border}`, marginBottom: 24 }}>
            {INSIGHT_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setInsightTab(tab.id)}
                style={{
                  padding: "10px 18px", border: "none", cursor: "pointer", background: "transparent",
                  borderBottom: activeTab === tab.id ? `2px solid ${css.accent}` : "2px solid transparent",
                  color: activeTab === tab.id ? css.accent : css.text3,
                  fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
                  fontFamily: "'Instrument Sans', 'Outfit', sans-serif",
                  display: "flex", alignItems: "center", gap: 6, marginBottom: -1,
                }}
              >
                {tab.label}
                {tab.tier === "premium" && !isPremium && (
                  <span style={{ fontSize: 9, background: css.goldBg, color: css.gold, padding: "1px 5px", fontWeight: 700, border: `1px solid ${D ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.3)"}` }}>PRO</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="c-a2">
          {subContent}
        </div>
      </div>
    );
  };

  const renderPremium = () => (
    <div>
      {/* Hero */}
      <div className="c-a1" style={{ textAlign: "center", marginBottom: 40, paddingTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <img src="/continuum-travel-logo.svg" alt="Continuum" style={{ height: 160, display: "block", filter: D ? "brightness(0.9) saturate(0.9)" : "brightness(0.6) sepia(1) hue-rotate(-15deg) saturate(2.5)" }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: css.gold, marginBottom: 10 }}>Unlock the Full Journey</div>
        <h2 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: isMobile ? 32 : 44, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>Continuum Premium</h2>
        <p style={{ color: css.text2, fontSize: 15, marginTop: 10, lineHeight: 1.6 }}>Maximize every mile, every night, every point.</p>
      </div>

      {/* Pricing cards */}
      <div className="c-a2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 40 }}>
        {[
          {
            name: "Free", price: "$0", period: "forever",
            accent: css.text3, accentBg: css.surface2, border: css.border,
            features: ["3 linked programs", "Basic dashboard", "Manual trip entry", "Annual summary", "Community support"],
            cta: "Current Plan", ctaStyle: { background: css.surface2, color: css.text2, border: `1px solid ${css.border}` },
          },
          {
            name: "Premium", price: "$9.99", period: "/month", popular: true,
            accent: css.accent, accentBg: css.accentBg, border: css.accentBorder,
            features: ["Unlimited programs", "Trip Optimizer AI", "Status match alerts", "PDF reports & exports", "Card recommendations", "Mileage expiration alerts", "Flighty sync export", "Ad-free experience"],
            cta: "Upgrade Now", ctaStyle: { background: css.accent, color: "#fff", border: "none" },
          },
          {
            name: "Pro", price: "$24.99", period: "/month",
            accent: css.gold, accentBg: css.goldBg, border: `${css.gold}40`,
            features: ["Everything in Premium", "API access & integrations", "Multi-year status tracking", "Tax deduction reports", "Team/family accounts", "White-label option", "Dedicated account manager", "Custom analytics"],
            cta: "Upgrade Now", ctaStyle: { background: css.gold, color: "#1A1200", border: "none" },
          },
        ].map((plan, i) => (
          <div key={i} className="c-card" style={{
            background: css.surface, border: `1px solid ${plan.border}`,
            borderTop: plan.popular ? `3px solid ${plan.accent}` : `3px solid transparent`,
            borderRadius: 16, padding: 28, position: "relative",
            boxShadow: plan.popular ? (D ? "0 4px 24px rgba(212,116,45,0.15)" : "0 4px 24px rgba(212,116,45,0.12)") : (D ? "none" : "0 1px 4px rgba(26,21,18,0.05)"),
          }}>
            {plan.popular && (
              <div style={{
                position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)",
                background: plan.accent, color: "#fff", fontSize: 9, fontWeight: 700,
                padding: "3px 14px", borderRadius: "0 0 8px 8px", letterSpacing: "0.1em",
              }}>MOST POPULAR</div>
            )}
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: plan.accent, letterSpacing: "0.06em", textTransform: "uppercase" }}>{plan.name}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
              <span style={{ fontSize: 38, fontWeight: 700, color: css.text, fontFamily: "'Instrument Sans', 'Outfit', sans-serif", lineHeight: 1 }}>{plan.price}</span>
              <span style={{ fontSize: 12, color: css.text3 }}>{plan.period}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 24 }}>
              {plan.features.map((f, fi) => (
                <div key={fi} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12, color: css.text2 }}>
                  <span style={{ color: plan.accent, fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <button onClick={() => plan.cta !== "Current Plan" && setShowUpgrade(true)} style={{
              width: "100%", padding: "12px 0", borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: plan.cta === "Current Plan" ? "default" : "pointer",
              transition: "all 0.15s", ...plan.ctaStyle,
            }}>{plan.cta}</button>
          </div>
        ))}
      </div>

      {/* Feature highlights grid */}
      <div className="c-a3" style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 16, padding: "24px 22px" }}>
        <h3 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: 24, fontWeight: 500, color: css.text, margin: "0 0 20px" }}>Why upgrade?</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          {[
            { icon: "🧠", title: "AI Trip Optimizer", desc: "Credit every flight to the right program for maximum status acceleration" },
            { icon: "🔔", title: "Status Match Alerts", desc: "Get notified when airlines offer challenges that match your profile" },
            { icon: "📊", title: "Advanced Analytics", desc: "Multi-year tracking, spend analysis, and loyalty ROI reporting" },
            { icon: "💳", title: "Card Advisor", desc: "Personalized card recommendations based on your real travel patterns" },
            { icon: "📄", title: "Tax Reports", desc: "Export categorized travel expenses for business deductions" },
            { icon: "👨‍👩‍👧", title: "Family Accounts", desc: "Track the whole household and optimize your combined loyalty strategy" },
          ].map((f, i) => (
            <div key={i} style={{ padding: "16px 14px", borderRadius: 10, background: css.surface2, border: `1px solid ${css.border}` }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: css.text, marginBottom: 5 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: css.text2, lineHeight: 1.55 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================================
  // NEWS FEED
  // ============================================================
  const renderNews = () => {
    const filtered = newsSourceFilter === "all" ? newsArticles : newsArticles.filter(a => a.source === newsSourceFilter);
    return (
      <div>
        <div className="c-a1" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>Points & Travel</div>
            <h2 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: isMobile ? 28 : 36, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>News & Deals</h2>
            <p style={{ color: css.text2, fontSize: 13, margin: "8px 0 0" }}>Latest posts from top travel & points blogs</p>
          </div>
          <button onClick={fetchNews} disabled={newsLoading} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8,
            border: `1px solid ${css.border}`, background: css.surface, color: css.text2,
            fontSize: 12, fontWeight: 600, cursor: newsLoading ? "default" : "pointer", opacity: newsLoading ? 0.6 : 1,
          }}>
            {newsLoading ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>

        {/* Source filter pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
          {[{ id: "all", name: "All Sources", color: css.accent }, ...NEWS_SOURCES].map(src => {
            const active = newsSourceFilter === src.id;
            return (
              <button key={src.id} onClick={() => setNewsSourceFilter(src.id)} style={{
                padding: "5px 12px", borderRadius: 20, border: `1px solid ${active ? src.color : css.border}`,
                background: active ? `${src.color}18` : css.surface, color: active ? src.color : css.text3,
                fontSize: 11, fontWeight: active ? 700 : 500, cursor: "pointer", transition: "all 0.15s",
              }}>{src.name}</button>
            );
          })}
        </div>

        {/* Loading skeleton */}
        {newsLoading && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ height: 160, background: css.surface2, animation: "pulse 1.5s infinite" }} />
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ height: 10, width: "40%", background: css.surface2, borderRadius: 4, marginBottom: 10 }} />
                  <div style={{ height: 14, width: "90%", background: css.surface2, borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ height: 14, width: "70%", background: css.surface2, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Articles grid */}
        {!newsLoading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: css.text3, fontSize: 14 }}>
            {newsFetched ? "No articles found for this source." : "Loading news…"}
          </div>
        )}

        {!newsLoading && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filtered.map(article => (
              <a key={article.id} href={article.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div style={{
                  background: css.surface, border: `1px solid ${css.border}`, borderRadius: 12, overflow: "hidden",
                  transition: "transform 0.15s, box-shadow 0.15s", cursor: "pointer", height: "100%", display: "flex", flexDirection: "column",
                  borderTop: `3px solid ${article.sourceColor}`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${article.sourceColor}20`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {article.thumbnail && (
                    <div style={{ height: 160, overflow: "hidden", background: css.surface2 }}>
                      <img src={article.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { e.currentTarget.parentElement.style.display = "none"; }} />
                    </div>
                  )}
                  <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                        color: article.sourceColor, fontFamily: "'Geist Mono', monospace",
                        background: `${article.sourceColor}15`, padding: "2px 7px", borderRadius: 4,
                      }}>{article.sourceName}</span>
                      <span style={{ fontSize: 10, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>
                        {new Date(article.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: css.text, lineHeight: 1.4, marginBottom: 8, fontFamily: "'Instrument Sans', 'Outfit', sans-serif" }}>
                      {article.title}
                    </div>
                    <div style={{ fontSize: 12, color: css.text3, lineHeight: 1.5, flex: 1 }}>
                      {article.description}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 11, color: article.sourceColor, fontWeight: 600 }}>Read more →</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
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
  ];

  const viewRenderers = { dashboard: renderDashboard, programs: renderPrograms, trips: renderTrips, expensereports: renderExpenseReports, expenses: renderExpenses, optimizer: renderOptimizer, insights: renderInsights, reports: renderReports, alliances: renderAlliances, news: renderNews, premium: renderPremium };

  // ============================================================
  // MAIN LAYOUT — Warm Editorial Design System
  // ============================================================
  const D = darkMode;
  const css = {
    bg: D ? "#0f0f0f" : "#f7f7f7",
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
      height: "100vh", overflow: "hidden", background: css.bg, display: "flex", flexDirection: "column",
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <img src="/continuum-travel-logo.svg" alt="Continuum" style={{ height: isMobile ? 50 : 80, display: "block", filter: D ? "brightness(0.85)" : "brightness(0.55) sepia(1) hue-rotate(-15deg) saturate(3)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <button onClick={() => setDarkMode(m => !m)} style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <NavIcon d={D ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></> : <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>} size={16} />
            </button>
            <button onClick={openSettings} style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <NavIcon d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>} size={16} />
            </button>
            <div onClick={handleLogout} title="Sign out" style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, cursor: "pointer", background: `linear-gradient(135deg, ${css.accent}, #C9A84C)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
              {(user?.user_metadata?.first_name?.[0] || user?.user_metadata?.name?.[0] || "U").toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* ── Fixed background image (dashboard only) ── */}
      {activeView === "dashboard" && (
        <div style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=85&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center 30%", backgroundAttachment: "fixed" }} />
          <div style={{ position: "absolute", inset: 0, background: D
            ? "linear-gradient(180deg, rgba(15,15,15,0.4) 0%, rgba(15,15,15,0.85) 30%, rgba(15,15,15,0.97) 60%)"
            : "linear-gradient(180deg, rgba(247,247,247,0.3) 0%, rgba(247,247,247,0.8) 25%, rgba(247,247,247,0.96) 50%, rgba(247,247,247,1) 70%)"
          }} />
        </div>
      )}

      {/* ── Sub-navigation bar (dashboard) ── */}
      {activeView === "dashboard" && (
        <div style={{ borderBottom: `1px solid ${css.border}`, background: css.surface, flexShrink: 0 }}>
          <div style={{ maxWidth: 1600, margin: "0 auto", display: "flex", alignItems: "center", padding: isMobile ? "0 8px" : "0 32px", gap: 0, overflowX: "auto" }}>
            {[{ id: "overview", label: "Overview", icon: <NavIcon d={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="14" y="11" width="7" height="10" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>} size={18} /> },
              { id: "timeline", label: "Timeline", icon: <NavIcon d={<><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></>} size={18} /> },
              { id: "reports", label: "Reports", icon: <NavIcon d={<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>} size={18} /> },
              { id: "activity", label: "Activity", icon: <NavIcon d={<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>} size={18} /> },
            ].map(tab => {
              const isActive = dashSubTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setDashSubTab(tab.id)} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  padding: isMobile ? "10px 16px" : "12px 24px", border: "none", cursor: "pointer",
                  background: "transparent", color: isActive ? css.text : css.text3,
                  fontSize: 12, fontWeight: isActive ? 600 : 400, position: "relative", transition: "color 0.15s",
                  borderBottom: isActive ? `2px solid ${css.accent}` : "2px solid transparent",
                  marginBottom: -1, whiteSpace: "nowrap",
                }}>
                  <span style={{ opacity: isActive ? 1 : 0.5 }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "20px 16px 120px" : "32px 48px 120px" }}>
          {viewRenderers[activeView]?.()}
        </div>
      </main>

      {/* ── Floating Bottom Navigation Bar ── */}
      <div style={{
        position: "fixed", bottom: isMobile ? 16 : 20, left: "50%", transform: "translateX(-50%)", zIndex: 150,
        background: D ? "rgba(20,20,20,0.92)" : "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderRadius: 50, border: `1px solid ${D ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
        display: "flex", alignItems: "stretch",
        boxShadow: D ? "0 4px 24px rgba(0,0,0,0.5)" : "0 4px 24px rgba(0,0,0,0.12)",
        padding: "4px 8px",
      }}>
        {navItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button key={item.id} onClick={() => setActiveView(item.id)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 2, padding: isMobile ? "8px 16px" : "8px 24px", border: "none", cursor: "pointer",
              background: isActive ? (D ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)") : "transparent",
              borderRadius: 40, color: isActive ? css.accent : css.text3,
              transition: "all 0.15s",
            }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</span>
              <span style={{ fontSize: 9, fontWeight: isActive ? 600 : 400 }}>
                {item.label === "Expense Reports" ? "Expenses" : item.label}
              </span>
            </button>
          );
        })}
      </div>

            {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

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
                      {leg.lookupMsg && <div style={{ fontSize: 10, color: leg.lookupMsg.startsWith("Found") ? css.success : css.text3, fontFamily: "'Geist Mono', monospace", marginBottom: 8 }}>{leg.lookupMsg}</div>}
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
        if (!trip) { setTripSummaryId(null); return null; }
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
      {showShareModal && (() => {
        const trip = allTripsWithShared.find(t => t.id === showShareModal);
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ width: "100%", maxWidth: 440, background: D ? "#141414" : "#fff", border: `2px solid ${D ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, padding: 32, position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: css.text, margin: 0 }}>Share Trip</h2>
                <button onClick={() => { setShowShareModal(null); setShareStatus(""); }} style={{ width: 36, height: 36, border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
              {trip && <div style={{ fontSize: 13, fontWeight: 600, color: css.text2, marginBottom: 16 }}>{trip.tripName || trip.location || "Trip"}</div>}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Recipient's Email</label>
                <input type="email" value={shareEmail} onChange={e => { setShareEmail(e.target.value); setShareStatus(""); }} placeholder="e.g. jane@example.com"
                  style={{ display: "block", width: "100%", padding: "12px 16px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                <div style={{ fontSize: 10, color: css.text3, marginTop: 4 }}>They'll see this trip next time they open Continuum</div>
              </div>
              {shareStatus === "sent" && <div style={{ padding: "10px 14px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", fontSize: 12, fontWeight: 600, marginBottom: 16 }}>Trip shared successfully!</div>}
              {shareStatus === "already" && <div style={{ padding: "10px 14px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", fontSize: 12, fontWeight: 600, marginBottom: 16 }}>This trip is already shared with that email</div>}
              {shareStatus === "error" && <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 12, fontWeight: 600, marginBottom: 16 }}>Failed to share. Please try again.</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setShowShareModal(null); setShareStatus(""); }} style={{ flex: 1, padding: "12px 0", border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleShareTrip} disabled={!shareEmail.trim()} style={{ flex: 1, padding: "12px 0", border: "none", background: shareEmail.trim() ? "#3b82f6" : css.surface2, color: shareEmail.trim() ? "#fff" : css.text3, fontSize: 13, fontWeight: 700, cursor: shareEmail.trim() ? "pointer" : "not-allowed" }}>Share</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Expense Detail View Modal */}
      {viewExpenseId && (() => {
        const exp = expenses.find(e => e.id === viewExpenseId);
        if (!exp) { setViewExpenseId(null); return null; }
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
                    <img src={exp.receiptImage.data} alt="Receipt" style={{ width: "100%", maxHeight: 500, objectFit: "contain", border: `1px solid ${css.border}`, background: D ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }} />
                  ) : exp.receiptImage.type === "application/pdf" ? (
                    <div style={{ padding: "20px", border: `1px solid ${css.border}`, background: D ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", textAlign: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: css.text2, marginBottom: 8 }}>{exp.receiptImage.name}</div>
                      <div style={{ fontSize: 11, color: css.text3 }}>{(exp.receiptImage.size / 1024).toFixed(0)} KB · PDF</div>
                      <a href={exp.receiptImage.data} download={exp.receiptImage.name} style={{ display: "inline-block", marginTop: 10, padding: "8px 16px", border: `1px solid ${css.accent}`, color: css.accent, fontSize: 11, fontWeight: 700, textDecoration: "none", cursor: "pointer" }}>Download PDF</a>
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

            {/* Receipt Upload / Camera */}
            <div style={{ marginBottom: 20 }}>
              <span style={{ ...eLbl, marginBottom: 8 }}>Receipt</span>
              
              {!newExpense.receiptImage ? (
                <div style={{ display: "flex", gap: 10 }}>
                  {/* Upload file button */}
                  <label style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
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
          const catRows = catSummary.map(cat => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #2a2640;">
                <span style="font-size:16px;margin-right:8px;">${cat.icon}</span>
                <span style="font-size:13px;color:#d0d6e0;">${cat.label} (${cat.count})</span>
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #2a2640;">
                <div style="background:#2a2640;border-radius:4px;height:6px;width:120px;overflow:hidden;">
                  <div style="width:${tripTotalUSD > 0 ? Math.round((cat.totalUSD/tripTotalUSD)*100) : 0}%;height:100%;background:${cat.color};border-radius:4px;"></div>
                </div>
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #2a2640;text-align:right;font-size:13px;font-weight:700;color:#f7f8f8;">$${cat.totalUSD.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            </tr>`).join("");
          const lineRows = tripExps.map((exp, i) => {
            const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
            const cur = exp.currency || "USD";
            const usdAmt = toUSD(exp);
            const isForeign = cur !== "USD";
            const receiptIdx = expensesWithReceipts.findIndex(e => e.id === exp.id);
            return `
            <tr>
              <td style="padding:10px 14px;border-bottom:1px solid #2a2640;vertical-align:top;">
                <div style="font-size:13px;color:#f7f8f8;">${cat?.icon || ""} ${exp.description}</div>
                ${exp.notes ? `<div style="font-size:10px;color:#62666d;margin-top:2px;">${exp.notes}</div>` : ""}
              </td>
              <td style="padding:10px 14px;border-bottom:1px solid #2a2640;font-size:12px;color:#8a8f98;white-space:nowrap;">${exp.date?.slice(5) || ""}</td>
              <td style="padding:10px 14px;border-bottom:1px solid #2a2640;font-size:12px;color:#8a8f98;">${exp.paymentMethod || "—"}</td>
              <td style="padding:10px 14px;border-bottom:1px solid #2a2640;text-align:right;">
                <div style="font-size:13px;font-weight:700;color:${exp.amount===0?"#34d399":"#ffffff"};">${fmtAmt(exp.amount, cur)}</div>
                ${isForeign ? `<div style="font-size:10px;color:#62666d;">$${usdAmt.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} USD</div>` : ""}
              </td>
              <td style="padding:10px 14px;border-bottom:1px solid #2a2640;text-align:center;font-size:13px;color:${exp.receipt?"#34d399":"#62666d"};">
                ${exp.receipt ? (receiptIdx >= 0 ? `<a href="#receipt-${receiptIdx+1}" style="color:#0EA5A0;font-size:10px;">p.${receiptIdx+1+1}</a>` : "✓") : "—"}
              </td>
            </tr>`;
          }).join("");
          const receiptPages = expensesWithReceipts.map((exp, i) => {
            const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
            const cur = exp.currency || "USD";
            const isPdf = exp.receiptImage.type === "application/pdf";
            const pages = isPdf ? (pdfPageImages[exp.id] || []) : [exp.receiptImage.data];
            return pages.map((src, pi) => `
              <div id="${pi === 0 ? `receipt-${i+1}` : ""}" style="page-break-before:always;padding:48px;background:#13111C;min-height:100vh;box-sizing:border-box;">
                ${pi === 0 ? `
                  <div style="color:#8a8f98;font-size:11px;font-family:monospace;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.1em;">Receipt ${i+1} of ${expensesWithReceipts.length}${isPdf && pages.length > 1 ? ` — Page 1 of ${pages.length}` : ""}</div>
                  <div style="font-size:16px;font-weight:700;color:#f7f8f8;margin-bottom:4px;">${cat?.icon||""} ${exp.description}</div>
                  <div style="font-size:12px;color:#8a8f98;margin-bottom:32px;">${exp.date||""} · ${exp.paymentMethod||""} · ${fmtAmt(exp.amount,cur)}</div>
                ` : `
                  <div style="color:#8a8f98;font-size:11px;font-family:monospace;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.1em;">Receipt ${i+1} — Page ${pi+1} of ${pages.length} · ${exp.description}</div>
                `}
                <img src="${src}" alt="Receipt${isPdf ? ` page ${pi+1}` : ""}" style="width:100%;border-radius:8px;border:1px solid #2a2640;display:block;" />
              </div>
            `).join("");
          }).join("");
          const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
            <title>Expense Report — ${getTripName(trip)}</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { background: #13111C; color: #f7f8f8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @media print {
                body { background: #13111C !important; }
                @page { margin: 16mm 18mm; size: A4; }
              }
              table { border-collapse: collapse; width: 100%; }
            </style>
          </head><body>
            <div style="padding:48px 48px 40px;background:#13111C;min-height:100vh;">
              <!-- Header -->
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;">
                <div>
                  <img src="${window.location.origin}/continuum-travel-logo.svg" alt="Continuum" style="height:80px;display:block;margin-bottom:12px;" />
                  <div style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Expense Report</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:11px;color:#8a8f98;">Generated ${new Date().toLocaleDateString()}</div>
                  <div style="font-size:11px;color:#62666d;">Report #${trip.id}-${Date.now().toString(36).slice(-4)}</div>
                  <div style="margin-top:6px;font-size:11px;font-weight:700;color:#0EA5A0;">Total in USD</div>
                </div>
              </div>
              <!-- Trip -->
              <div style="background:rgba(14,165,160,0.08);border:1px solid rgba(14,165,160,0.2);border-radius:10px;padding:20px;margin-bottom:28px;">
                <div style="font-size:18px;font-weight:700;color:#f7f8f8;margin-bottom:6px;">${trip.type==="flight"?"—":trip.type==="hotel"?"—":"—"} ${getTripName(trip)}</div>
                <div style="font-size:13px;color:#8a8f98;">${trip.date||""} · ${prog?.name||"Unknown"} · ${trip.status||""}</div>
              </div>
              <!-- Stats -->
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:28px;">
                <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:#0EA5A0;">$${tripTotalUSD.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                  <div style="font-size:10px;color:#8a8f98;margin-top:4px;">Total (USD)</div>
                </div>
                <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:700;color:#fff;">${tripExps.length}</div>
                  <div style="font-size:10px;color:#8a8f98;margin-top:4px;">Items</div>
                </div>
                <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:#34d399;">${receiptCount}/${tripExps.length}</div>
                  <div style="font-size:10px;color:#8a8f98;margin-top:4px;">Receipts</div>
                </div>
              </div>
              <!-- Category Breakdown -->
              <div style="margin-bottom:28px;">
                <div style="font-size:11px;font-weight:700;color:#8a8f98;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Breakdown by Category</div>
                <table><tbody>${catRows}</tbody></table>
              </div>
              <!-- Line Items -->
              <div style="margin-bottom:32px;">
                <div style="font-size:11px;font-weight:700;color:#8a8f98;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Line Items</div>
                <div style="background:#1a1725;border-radius:8px;overflow:hidden;border:1px solid #2a2640;">
                  <table>
                    <thead>
                      <tr style="background:rgba(255,255,255,0.04);">
                        <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Description</th>
                        <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Date</th>
                        <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Payment</th>
                        <th style="padding:10px 14px;text-align:right;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Amount</th>
                        <th style="padding:10px 14px;text-align:center;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">🧾</th>
                      </tr>
                    </thead>
                    <tbody>${lineRows}</tbody>
                    <tfoot>
                      <tr style="background:rgba(14,165,160,0.08);">
                        <td colspan="3" style="padding:14px;font-size:13px;font-weight:700;color:#0EA5A0;border-top:2px solid rgba(14,165,160,0.3);">TOTAL (USD)</td>
                        <td style="padding:14px;text-align:right;font-size:15px;font-weight:800;color:#0EA5A0;border-top:2px solid rgba(14,165,160,0.3);">$${tripTotalUSD.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                        <td style="border-top:2px solid rgba(14,165,160,0.3);"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <!-- Footer -->
              <div style="text-align:center;color:#62666d;font-size:10px;border-top:1px solid #2a2640;padding-top:16px;">
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
                    return (
                      <div key={exp.id} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 80px" : "1fr 80px 90px 90px 28px", gap: 8, padding: "10px 14px", borderBottom: i < tripExps.length - 1 ? "1px solid rgba(0,0,0,0.02)" : "none", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: 12, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{cat?.icon} {exp.description}</span>
                          {exp.notes && <div style={{ fontSize: 10, color: "#62666d", marginTop: 1 }}>{exp.notes}</div>}
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
