import { useState, useEffect, useCallback, useMemo } from "react";

// ============================================================
// LOGO COMPONENT — Geometric travel icon in Neuron brand style
// Rounded container, arrow/compass motif, orange gradient
// ============================================================
const AirplaneLogo = ({ size = 40, color = "#F26B3A", className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F5944E" />
        <stop offset="100%" stopColor="#E05A2B" />
      </linearGradient>
    </defs>
    {/* Rounded square container */}
    <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#brandGrad)" />
    {/* Abstract airplane/arrow — white on orange */}
    <path d="M44 20 L28 36 L18 32 L16 35 L26 38 L22 48 L25 49 L30 40 L34 38 L48 22 L44 20Z" 
      fill="#fff" opacity="0.95" />
    {/* Compass dot accent */}
    <circle cx="46" cy="18" r="2.5" fill="#fff" opacity="0.7" />
    {/* Subtle inner border */}
    <rect x="4" y="4" width="56" height="56" rx="16" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.15" />
  </svg>
);

const LogoMark = ({ size = 40 }) => (
  <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <AirplaneLogo size={size} />
  </div>
);

// Atmospheric travel background with animated elements
const TravelAtmosphere = () => (
  <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
    {/* Deep sky gradient */}
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse 120% 80% at 20% 10%, rgba(242,107,58,0.08) 0%, transparent 50%), radial-gradient(ellipse 100% 60% at 80% 90%, rgba(242,107,58,0.06) 0%, transparent 50%), radial-gradient(ellipse 80% 80% at 50% 50%, rgba(229,90,43,0.04) 0%, transparent 60%)",
    }} />
    {/* Aurora band */}
    <div style={{
      position: "absolute", top: 0, left: "-50%", right: "-50%", height: 400,
      background: "linear-gradient(90deg, transparent, rgba(242,107,58,0.04), rgba(242,107,58,0.03), rgba(229,90,43,0.04), transparent)",
      backgroundSize: "200% 100%", animation: "aurora 20s ease-in-out infinite", transform: "skewY(-3deg)", transformOrigin: "top left",
    }} />
    {/* Scattered stars */}
    {[
      { x: "10%", y: "15%", d: "0s", s: 2 }, { x: "25%", y: "8%", d: "1.5s", s: 1.5 }, { x: "45%", y: "20%", d: "3s", s: 1 },
      { x: "60%", y: "5%", d: "0.8s", s: 2 }, { x: "75%", y: "18%", d: "2.2s", s: 1.5 }, { x: "90%", y: "12%", d: "4s", s: 1 },
      { x: "15%", y: "85%", d: "1s", s: 1 }, { x: "35%", y: "75%", d: "2.5s", s: 1.5 }, { x: "55%", y: "90%", d: "3.5s", s: 2 },
      { x: "80%", y: "80%", d: "0.5s", s: 1 }, { x: "95%", y: "70%", d: "1.8s", s: 1.5 }, { x: "5%", y: "50%", d: "2.8s", s: 1 },
      { x: "70%", y: "45%", d: "4.2s", s: 1.5 }, { x: "40%", y: "55%", d: "1.2s", s: 1 }, { x: "85%", y: "35%", d: "3.8s", s: 2 },
    ].map((star, i) => (
      <div key={i} style={{
        position: "absolute", left: star.x, top: star.y, width: star.s, height: star.s, borderRadius: "50%",
        background: "#F7A86A", animation: `twinkle ${3 + (i % 3)}s ease-in-out ${star.d} infinite`,
      }} />
    ))}
    {/* Floating cloud wisps */}
    <div style={{
      position: "absolute", top: "30%", left: 0, right: 0, height: 2,
      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 20%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 80%, transparent 100%)",
      animation: "drift 60s linear infinite",
    }} />
    <div style={{
      position: "absolute", top: "60%", left: 0, right: 0, height: 1,
      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.015) 30%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.015) 70%, transparent 100%)",
      animation: "drift 80s linear 10s infinite",
    }} />
    {/* Globe grid pattern in bottom right */}
    <svg style={{ position: "absolute", bottom: -60, right: -60, width: 400, height: 400, opacity: 0.025, animation: "globe-rotate 120s linear infinite" }} viewBox="0 0 400 400">
      <circle cx="200" cy="200" r="180" stroke="#F7A86A" strokeWidth="0.5" fill="none" />
      <circle cx="200" cy="200" r="140" stroke="#F7A86A" strokeWidth="0.5" fill="none" />
      <circle cx="200" cy="200" r="100" stroke="#F7A86A" strokeWidth="0.5" fill="none" />
      <ellipse cx="200" cy="200" rx="60" ry="180" stroke="#F7A86A" strokeWidth="0.5" fill="none" />
      <ellipse cx="200" cy="200" rx="120" ry="180" stroke="#F7A86A" strokeWidth="0.5" fill="none" />
      <line x1="20" y1="200" x2="380" y2="200" stroke="#F7A86A" strokeWidth="0.5" />
      <line x1="200" y1="20" x2="200" y2="380" stroke="#F7A86A" strokeWidth="0.5" />
      <line x1="20" y1="140" x2="380" y2="140" stroke="#F7A86A" strokeWidth="0.3" />
      <line x1="20" y1="260" x2="380" y2="260" stroke="#F7A86A" strokeWidth="0.3" />
    </svg>
    {/* Runway lights along bottom */}
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, display: "flex", justifyContent: "center", gap: 40 }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          width: 2, height: 2, borderRadius: "50%", background: i % 3 === 0 ? "#F7A86A" : "#f59e0b",
          animation: `runway-light 2s ease-in-out ${i * 0.15}s infinite`, opacity: 0.3,
        }} />
      ))}
    </div>
  </div>
);

// Decorative flight path SVG for cards
const FlightPath = ({ color = "#F7A86A", style = {} }) => (
  <svg viewBox="0 0 200 40" style={{ position: "absolute", opacity: 0.06, ...style }} fill="none">
    <path d="M0 30 Q50 5, 100 20 T200 10" stroke={color} strokeWidth="1" strokeDasharray="4 4" />
    <circle cx="200" cy="10" r="3" fill={color} />
  </svg>
);

// Per-page hero banner with travel photography
const PAGE_HEROES = {
  dashboard: {
    img: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=1400&q=80&auto=format&fit=crop",
    alt: "Airplane wing above clouds at golden hour",
    accent: "#F5944E",
  },
  programs: {
    img: "https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=1400&q=80&auto=format&fit=crop",
    alt: "Airport departure board and terminal",
    accent: "#F26B3A",
  },
  trips: {
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=80&auto=format&fit=crop",
    alt: "Tropical beach with turquoise water",
    accent: "#34d399",
  },
  expenses: {
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=80&auto=format&fit=crop",
    alt: "Luxury resort pool at dusk",
    accent: "#f59e0b",
  },
  optimizer: {
    img: "https://images.unsplash.com/photo-1540339832862-474599807836?w=1400&q=80&auto=format&fit=crop",
    alt: "Business class airplane cabin",
    accent: "#8b5cf6",
  },
  reports: {
    img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=80&auto=format&fit=crop",
    alt: "Lake surrounded by mountains from above",
    accent: "#F26B3A",
  },
  premium: {
    img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1400&q=80&auto=format&fit=crop",
    alt: "Infinity pool overlooking ocean at sunset",
    accent: "#f59e0b",
  },
};

const PageHeroBanner = ({ view, title, subtitle }) => {
  const hero = PAGE_HEROES[view];
  if (!hero) return null;
  return (
    <div style={{
      position: "relative", width: "100%", height: 180, borderRadius: 20, overflow: "hidden", marginBottom: 24,
      boxShadow: `0 8px 40px rgba(0,0,0,0.4), 0 0 80px ${hero.accent}08`,
    }}>
      <img src={hero.img} alt={hero.alt} loading="eager" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%",
        animation: "hero-fade-in 1.2s ease-out forwards",
      }} />
      {/* Dark gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(135deg, rgba(4,11,24,0.82) 0%, rgba(4,11,24,0.45) 40%, rgba(4,11,24,0.25) 60%, ${hero.accent}08 100%)`,
      }} />
      {/* Bottom fade to page bg */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
        background: "linear-gradient(to top, rgba(4,11,24,0.95), transparent)",
      }} />
      {/* Subtle scan lines texture */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 3px)",
      }} />
      {/* Accent glow line at bottom */}
      <div style={{
        position: "absolute", bottom: 0, left: "10%", right: "10%", height: 1,
        background: `linear-gradient(90deg, transparent, ${hero.accent}30, transparent)`,
      }} />
      {/* Title overlay */}
      {title && (
        <div style={{ position: "absolute", bottom: 20, left: 28, right: 28, zIndex: 2 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "Plus Jakarta Sans", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 12, color: `${hero.accent}cc`, fontFamily: "Space Grotesk", marginTop: 4, textShadow: "0 1px 10px rgba(0,0,0,0.5)" }}>{subtitle}</p>}
        </div>
      )}
    </div>
  );
};

// ============================================================
// DATA & CONSTANTS
// ============================================================

// Comprehensive program directory with login/status URLs
const PROGRAM_DIRECTORY = {
  airlines: [
    { id: "aa", name: "American Airlines AAdvantage", logo: "✈️", color: "#0078D2", accent: "#C8102E", unit: "Loyalty Points", loginUrl: "https://www.aa.com/loyalty/login", tiers: [
      { name: "Gold", threshold: 30000, perks: "Priority boarding, free checked bag, 40% bonus miles" },
      { name: "Platinum", threshold: 60000, perks: "Upgrades, 60% bonus, Admiral's Club day passes" },
      { name: "Platinum Pro", threshold: 90000, perks: "Premium upgrades, 80% bonus, complimentary MCE" },
      { name: "Executive Platinum", threshold: 120000, perks: "Systemwide upgrades, 120% bonus, ConciergeKey eligible" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "dl", name: "Delta SkyMiles", logo: "🔺", color: "#003366", accent: "#C8102E", unit: "MQMs", loginUrl: "https://www.delta.com/myprofile/personal-details", tiers: [
      { name: "Silver Medallion", threshold: 25000, perks: "Unlimited upgrades, 40% bonus miles" },
      { name: "Gold Medallion", threshold: 50000, perks: "SkyTeam Elite Plus, 60% bonus, Sky Priority" },
      { name: "Platinum Medallion", threshold: 75000, perks: "Choice Benefits, 80% bonus, waived fees" },
      { name: "Diamond Medallion", threshold: 125000, perks: "Global upgrades, 120% bonus, Delta ONE access" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "ua", name: "United MileagePlus", logo: "🌐", color: "#002244", accent: "#0066CC", unit: "PQPs", loginUrl: "https://www.united.com/en/us/mileageplus", tiers: [
      { name: "Silver", threshold: 12, perks: "Economy Plus, priority boarding, 1 bag free", isSegments: true },
      { name: "Gold", threshold: 24, perks: "Star Alliance Gold, United Club passes", isSegments: true },
      { name: "Platinum", threshold: 36, perks: "Regional upgrades, 2 GPUs", isSegments: true },
      { name: "1K", threshold: 54, perks: "Global upgrades, PlusPoints, Premier Access", isSegments: true },
    ], earnRate: { domestic: 5, international: 11, premium: 22 } },
    { id: "sw", name: "Southwest Rapid Rewards", logo: "❤️", color: "#304CB2", accent: "#FFBF27", unit: "Points", loginUrl: "https://www.southwest.com/rapid-rewards/myaccount", tiers: [
      { name: "A-List", threshold: 35000, perks: "Priority boarding, same-day standby, 25% bonus" },
      { name: "A-List Preferred", threshold: 70000, perks: "Free WiFi, 100% bonus points, all A-List perks" },
      { name: "Companion Pass", threshold: 135000, perks: "Designated companion flies free on every flight" },
    ], earnRate: { domestic: 6, international: 6, premium: 12 } },
    { id: "b6", name: "JetBlue TrueBlue", logo: "💙", color: "#003876", accent: "#0033A0", unit: "Points", loginUrl: "https://trueblue.jetblue.com/", tiers: [
      { name: "Mosaic 1", threshold: 15000, perks: "Free checked bags, Even More Space, early boarding" },
      { name: "Mosaic 2", threshold: 30000, perks: "All Mosaic 1 + free same-day changes, Mint upgrades" },
      { name: "Mosaic 3", threshold: 50000, perks: "Guaranteed Even More Space, complimentary Mint upgrades" },
      { name: "Mosaic 4", threshold: 75000, perks: "Highest upgrade priority, 4 guest passes per year" },
    ], earnRate: { domestic: 5, international: 6, premium: 10 } },
    { id: "atmos", name: "Atmos Rewards (Alaska/Hawaiian)", logo: "🏔️", color: "#01426A", accent: "#64CCC9", unit: "Points", loginUrl: "https://www.alaskaair.com/account/overview", tiers: [
      { name: "Atmos Silver", threshold: 20000, perks: "Free checked bag, preferred boarding, 50% bonus" },
      { name: "Atmos Gold", threshold: 40000, perks: "Upgrades, lounge passes, 100% bonus" },
      { name: "Atmos 75K", threshold: 75000, perks: "4 complimentary upgrades, Gold guest, 125% bonus" },
      { name: "Atmos 100K", threshold: 100000, perks: "Intl biz upgrades, lounge membership, 150% bonus" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "frontier", name: "Frontier Miles", logo: "🦅", color: "#006845", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.flyfrontier.com/myfrontier/my-account/", tiers: [
      { name: "Elite 20K", threshold: 20000, perks: "Free carry-on, seat selection, shortcut boarding" },
      { name: "Elite 50K", threshold: 50000, perks: "Free checked bag, priority boarding, buddy pass" },
      { name: "Elite 100K", threshold: 100000, perks: "Unlimited buddy passes, fee waivers, all perks" },
    ], earnRate: { domestic: 5, international: 5, premium: 10 } },
    { id: "spirit", name: "Free Spirit", logo: "💛", color: "#FFD700", accent: "#000000", unit: "Points", loginUrl: "https://www.spirit.com/account", tiers: [
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
  ],
  hotels: [
    { id: "marriott", name: "Marriott Bonvoy", logo: "🏨", color: "#7C2529", accent: "#B5985A", unit: "Nights", loginUrl: "https://www.marriott.com/loyalty/myAccount/default.mi", tiers: [
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
      { name: "Gold", threshold: 11, perks: "1,000 bonus points per stay, late checkout" },
      { name: "Platinum", threshold: 22, perks: "Best room guarantee, welcome amenity" },
      { name: "Diamond", threshold: 37, perks: "Suite upgrade, early check-in/late checkout, bonus" },
    ], earnRate: { standard: 10, premium: 12, luxury: 15 } },
    { id: "accor", name: "ALL – Accor Live Limitless", logo: "🇫🇷", color: "#1B3160", accent: "#C4A769", unit: "Nights", loginUrl: "https://all.accor.com/loyalty-program/index.en.shtml", tiers: [
      { name: "Silver", threshold: 10, perks: "Late checkout, welcome drink" },
      { name: "Gold", threshold: 30, perks: "Room upgrade, early check-in, late checkout" },
      { name: "Platinum", threshold: 60, perks: "Suite upgrade, breakfast, lounge access" },
      { name: "Diamond", threshold: 100, perks: "Guaranteed room, premium suite, all perks" },
    ], earnRate: { standard: 10, premium: 15, luxury: 25 } },
    { id: "bestwestern", name: "Best Western Rewards", logo: "👑", color: "#003876", accent: "#FFD700", unit: "Nights", loginUrl: "https://www.bestwestern.com/en_US/rewards/member-profile.html", tiers: [
      { name: "Blue", threshold: 0, perks: "Member rates, points never expire" },
      { name: "Gold", threshold: 10, perks: "10% bonus, late checkout" },
      { name: "Platinum", threshold: 15, perks: "15% bonus, room upgrade" },
      { name: "Diamond", threshold: 30, perks: "30% bonus, suite when available, amenity" },
      { name: "Diamond Select", threshold: 50, perks: "50% bonus, best room guarantee" },
    ], earnRate: { standard: 10, premium: 12, luxury: 15 } },
    { id: "radisson", name: "Radisson Rewards", logo: "🔶", color: "#0C2340", accent: "#D4A553", unit: "Nights", loginUrl: "https://www.radissonhotels.com/en-us/rewards/my-account", tiers: [
      { name: "Club", threshold: 0, perks: "Member rates, free WiFi" },
      { name: "Premium", threshold: 9, perks: "Priority check-in, room upgrade" },
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
  ],
  rentals: [
    { id: "hertz", name: "Hertz Gold Plus Rewards", logo: "🚗", color: "#FFD700", accent: "#000000", unit: "Rentals", loginUrl: "https://www.hertz.com/rentacar/member/enrollment", tiers: [
      { name: "Gold", threshold: 0, perks: "Skip the counter, choose your car" },
      { name: "Five Star", threshold: 10, perks: "Guaranteed upgrades, priority service" },
      { name: "President's Circle", threshold: 20, perks: "Premium vehicles, dedicated line" },
    ], earnRate: { standard: 1, premium: 1.5 } },
    { id: "national", name: "National Emerald Club", logo: "🟢", color: "#006845", accent: "#2ECC71", unit: "Rentals", loginUrl: "https://www.nationalcar.com/en/loyalty.html", tiers: [
      { name: "Emerald Club", threshold: 0, perks: "Choose any midsize+, bypass counter" },
      { name: "Emerald Club Executive", threshold: 12, perks: "Free upgrades, guaranteed one-class" },
      { name: "Emerald Club Executive Elite", threshold: 25, perks: "Premium aisle access, priority" },
    ], earnRate: { standard: 1, premium: 1.5 } },
    { id: "avis", name: "Avis Preferred", logo: "🅰️", color: "#D0021B", accent: "#1A1F36", unit: "Rentals", loginUrl: "https://www.avis.com/en/loyalty-profile", tiers: [
      { name: "Preferred", threshold: 0, perks: "Skip the counter, choose your car" },
      { name: "Preferred Plus", threshold: 12, perks: "Free upgrade, priority service" },
      { name: "Chairman's Club", threshold: 25, perks: "Premium vehicles, dedicated line, best rates" },
    ], earnRate: { standard: 1, premium: 1.5 } },
    { id: "enterprise", name: "Enterprise Plus", logo: "🚙", color: "#006845", accent: "#FFD700", unit: "Rentals", loginUrl: "https://www.enterprise.com/en/enterprise-plus.html", tiers: [
      { name: "Plus", threshold: 0, perks: "Earn points on rentals, free days" },
      { name: "Silver", threshold: 12, perks: "Free upgrade, priority service" },
      { name: "Gold", threshold: 25, perks: "Free class upgrade, premium service" },
    ], earnRate: { standard: 1, premium: 1.5 } },
    { id: "budget", name: "Budget Fastbreak", logo: "🅱️", color: "#F57C21", accent: "#1A1F36", unit: "Rentals", loginUrl: "https://www.budget.com/en/fast-break", tiers: [
      { name: "Fastbreak", threshold: 0, perks: "Skip the counter, faster pickup" },
    ], earnRate: { standard: 1, premium: 1 } },
    { id: "sixt", name: "Sixt Loyalty", logo: "🔶", color: "#FF6600", accent: "#000000", unit: "Status Points", loginUrl: "https://www.sixt.com/mysixt/", tiers: [
      { name: "Gold", threshold: 500, perks: "Free upgrade, priority pick-up" },
      { name: "Platinum", threshold: 2000, perks: "Guaranteed upgrade, VIP service" },
      { name: "Diamond", threshold: 7000, perks: "Premium fleet, personal manager" },
    ], earnRate: { standard: 1, premium: 2 } },
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
    { id: "aa_exec", name: "Citi AAdvantage Executive", logo: "✈️", color: "#0078D2", accent: "#003B70", unit: "AAdvantage Miles", loginUrl: "https://www.citi.com/login", perks: "Admirals Club, 4x AA/hotels, companion cert, Global Entry", annualFee: 595, bonusCategories: { flights: 4, hotels: 4, dining: 1, other: 1 } },
    { id: "marriott_boundless", name: "Marriott Bonvoy Boundless", logo: "🏨", color: "#7C2529", accent: "#B5985A", unit: "Bonvoy Points", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "6x Marriott, free night award annually, auto Silver Elite", annualFee: 95, bonusCategories: { flights: 2, hotels: 6, dining: 2, other: 1 } },
    { id: "hilton_aspire", name: "Hilton Honors Aspire", logo: "🌟", color: "#003B5C", accent: "#FFD700", unit: "Hilton Honors Points", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "14x Hilton, auto Diamond, $250 resort credit, free night", annualFee: 550, bonusCategories: { flights: 7, hotels: 14, dining: 7, other: 3 } },
    { id: "hilton_surpass", name: "Hilton Honors Surpass", logo: "🌟", color: "#0099CC", accent: "#003B5C", unit: "Hilton Honors Points", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "12x Hilton, auto Gold, free night after $15k spend", annualFee: 150, bonusCategories: { flights: 6, hotels: 12, dining: 6, other: 3 } },
    { id: "hyatt_card", name: "World of Hyatt Credit Card", logo: "🏛️", color: "#1C4B82", accent: "#D4A553", unit: "World of Hyatt Points", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "4x Hyatt, auto Discoverist, free night annually, bonus nights", annualFee: 95, bonusCategories: { flights: 2, hotels: 4, dining: 2, other: 1 } },
    { id: "ihg_premier", name: "IHG One Rewards Premier", logo: "🔑", color: "#2E1A47", accent: "#B4B4B4", unit: "IHG Points", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "10x IHG, 4th night free, auto Platinum, Global Entry", annualFee: 99, bonusCategories: { flights: 2, hotels: 10, dining: 2, other: 1 } },
    { id: "sw_priority", name: "Southwest Priority Card", logo: "❤️", color: "#304CB2", accent: "#FFBF27", unit: "Rapid Rewards Points", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "3x Southwest, $75 travel credit, 7,500 anniversary points", annualFee: 149, bonusCategories: { flights: 3, dining: 2, other: 1 } },
    { id: "atmos_summit", name: "Atmos Rewards Summit Visa Infinite", logo: "🏔️", color: "#01426A", accent: "#64CCC9", unit: "Atmos Points", loginUrl: "https://www.alaskaair.com/account/overview", perks: "3x Alaska/Hawaiian, Global Companion Award, status boost", annualFee: 250, bonusCategories: { flights: 3, dining: 2, other: 1 } },
  ],
};

// Build the same shape used by the rest of the app
const LOYALTY_PROGRAMS = {
  airlines: PROGRAM_DIRECTORY.airlines,
  hotels: PROGRAM_DIRECTORY.hotels,
  rentals: PROGRAM_DIRECTORY.rentals,
  creditCards: PROGRAM_DIRECTORY.creditCards,
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
// UTILITY COMPONENTS
// ============================================================
const ProgressRing = ({ progress, size = 80, stroke = 6, color = "#F26B3A", label, sublabel }) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.2, fontWeight: 700, color: "#fff" }}>{label}</span>
        {sublabel && <span style={{ fontSize: size * 0.12, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>{sublabel}</span>}
      </div>
    </div>
  );
};

const Badge = ({ children, color = "#F26B3A", small }) => (
  <span style={{
    display: "inline-block", padding: small ? "1px 6px" : "2px 10px", borderRadius: 20, fontSize: small ? 10 : 11,
    fontWeight: 600, background: `${color}22`, color: color, border: `1px solid ${color}33`, letterSpacing: 0.3,
  }}>{children}</span>
);

const MiniBar = ({ value, max, color, height = 6 }) => (
  <div style={{ width: "100%", height, borderRadius: height, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
    <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", borderRadius: height, background: `linear-gradient(90deg, ${color}, ${color}99)`, transition: "width 1s ease" }} />
  </div>
);

const IconBtn = ({ icon, label, active, onClick, badge }) => (
  <button onClick={onClick} title={label} style={{
    position: "relative", width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
    background: active ? "rgba(242,107,58,0.15)" : "transparent", color: active ? "#F7A86A" : "rgba(255,255,255,0.45)", transition: "all 0.2s",
  }}>
    {icon}
    {badge && <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />}
  </button>
);

// ============================================================
// MAIN APP
// ============================================================
export default function EliteStatusTracker() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [publicPage, setPublicPage] = useState("landing");
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [newTrip, setNewTrip] = useState({ type: "flight", program: "aa", route: "", date: "", class: "domestic", nights: 1, status: "planned", tripName: "" });
  const [trips, setTrips] = useState([]);
  const [linkedAccounts, setLinkedAccounts] = useState({});
  const [showLinkModal, setShowLinkModal] = useState(null);
  const [linkForm, setLinkForm] = useState({ memberId: "" });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [animateIn, setAnimateIn] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(null); // null or tripId
  const [newExpense, setNewExpense] = useState({ category: "flight", description: "", amount: "", currency: "USD", date: "", paymentMethod: "", receipt: false, receiptImage: null, notes: "" });
  const [expenseViewTrip, setExpenseViewTrip] = useState(null); // null = overview, tripId = detail
  const [showExpenseReport, setShowExpenseReport] = useState(null); // tripId for report modal
  const [customPrograms, setCustomPrograms] = useState([]);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [newProgram, setNewProgram] = useState({ name: "", category: "airline", logo: "✈️", color: "#F26B3A", memberId: "", unit: "Points", tiers: "", selectedId: "", search: "" });
  const [conciergeProgram, setConciergeProgram] = useState(null); // program object for AI concierge
  const [conciergeMessages, setConciergeMessages] = useState([]); // { role, content }
  const [conciergeInput, setConciergeInput] = useState("");
  const [conciergeLoading, setConciergeLoading] = useState(false);
  const [conciergeSpeaking, setConciergeSpeaking] = useState(false);

  useEffect(() => { setTimeout(() => setAnimateIn(true), 100); }, []);

  // AI Concierge functions
  const speakText = useCallback((text, isHotel) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = isHotel ? 0.95 : 1.05;
    utter.volume = 1;
    // Try to pick a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google")) || voices.find(v => v.lang.startsWith("en")) || voices[0];
    if (preferred) utter.voice = preferred;
    setConciergeSpeaking(true);
    utter.onend = () => setConciergeSpeaking(false);
    utter.onerror = () => setConciergeSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, []);

  const openConcierge = useCallback(async (program, type) => {
    window.speechSynthesis?.cancel();
    setConciergeProgram({ ...program, type });
    setConciergeMessages([]);
    setConciergeInput("");
    setConciergeLoading(true);
    setConciergeSpeaking(false);
    const tierInfo = (program.tiers || []).map(t => `${t.name}: requires ${t.threshold} ${program.unit}, perks: ${t.perks}`).join("\n");
    const role = type === "hotel" ? "a friendly hotel front desk concierge" : (Math.random() > 0.5 ? "a friendly airline pilot" : "a friendly airline flight attendant");
    const sysPrompt = `You are ${role} who is an expert on the ${program.name} loyalty program. You speak in a warm, professional, conversational tone as if greeting a guest or passenger. Keep responses concise (3-5 sentences max). Use your character's perspective naturally.

Program details:
- Name: ${program.name}
- Unit: ${program.unit}
- Tiers:\n${tierInfo}
${program.earnRate ? `- Earn rates: Domestic ${program.earnRate.domestic}x, International ${program.earnRate.international}x, Premium ${program.earnRate.premium}x` : ""}

Start by introducing yourself briefly in-character and giving an engaging overview of the program — what makes it special, the tier structure, and one insider tip. Keep it under 5 sentences.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-5-20250929", max_tokens: 1000, system: sysPrompt, messages: [{ role: "user", content: "Please introduce yourself and give me an overview of this loyalty program." }] }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "Welcome! I'd be happy to tell you about this program.";
      setConciergeMessages([{ role: "assistant", content: text }]);
      speakText(text, type === "hotel");
    } catch (e) {
      const fallback = `Welcome aboard! I'm your ${program.name} expert. This program has ${(program.tiers||[]).length} elite tiers earning ${program.unit}. The top tier, ${(program.tiers||[])[(program.tiers||[]).length-1]?.name}, offers incredible perks like ${(program.tiers||[])[(program.tiers||[]).length-1]?.perks}. Ask me anything about earning status, redeeming rewards, or maximizing your benefits!`;
      setConciergeMessages([{ role: "assistant", content: fallback }]);
      speakText(fallback, type === "hotel");
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
    const role = prog.type === "hotel" ? "a friendly hotel front desk concierge" : "a friendly airline crew member";
    const sysPrompt = `You are ${role} expert on ${prog.name}. Be warm, concise (3-5 sentences), stay in character. Program: ${prog.name}, Unit: ${prog.unit}. Tiers:\n${tierInfo}\n${prog.earnRate ? `Earn rates: Dom ${prog.earnRate.domestic}x, Intl ${prog.earnRate.international}x, Prem ${prog.earnRate.premium}x` : ""}`;
    const history = [...conciergeMessages, { role: "user", content: userMsg }].map(m => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-5-20250929", max_tokens: 1000, system: sysPrompt, messages: history }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "I'd be happy to help with that!";
      setConciergeMessages(prev => [...prev, { role: "assistant", content: text }]);
      speakText(text, prog.type === "hotel");
    } catch (e) {
      const fallback = "I'm having trouble connecting right now. Please try again in a moment!";
      setConciergeMessages(prev => [...prev, { role: "assistant", content: fallback }]);
      speakText(fallback, prog.type === "hotel");
    }
    setConciergeLoading(false);
  }, [conciergeInput, conciergeLoading, conciergeProgram, conciergeMessages, speakText]);

  const EXPENSE_CATEGORIES = [
    { id: "flight", label: "Flights", icon: "✈️", color: "#F26B3A" },
    { id: "hotel", label: "Hotels", icon: "🏨", color: "#8b5cf6" },
    { id: "rental", label: "Car Rental", icon: "🚗", color: "#f59e0b" },
    { id: "dining", label: "Dining", icon: "🍽️", color: "#ef4444" },
    { id: "transport", label: "Transport", icon: "🚕", color: "#10b981" },
    { id: "lounge", label: "Lounge", icon: "🛋️", color: "#6366f1" },
    { id: "shopping", label: "Shopping", icon: "🛍️", color: "#ec4899" },
    { id: "tips", label: "Tips", icon: "💵", color: "#14b8a6" },
    { id: "other", label: "Other", icon: "📎", color: "#6b7280" },
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

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setUser(SAMPLE_USER);
    setTrips(SAMPLE_USER.upcomingTrips);
    setLinkedAccounts(SAMPLE_USER.linkedAccounts);
    setExpenses(SAMPLE_EXPENSES);
    setIsLoggedIn(true);
  };

  const handleRegister = (e) => {
    if (e) e.preventDefault();
    setUser({ ...SAMPLE_USER, name: registerForm.name || "New User", email: registerForm.email });
    setTrips([]);
    setLinkedAccounts({});
    setIsLoggedIn(true);
  };

  const handleLogout = () => { setIsLoggedIn(false); setUser(null); setActiveView("dashboard"); setPublicPage("landing"); };

  const handleAddTrip = () => {
    const id = Date.now();
    let estimatedPoints = 0;
    let estimatedNights = 0;
    let estimatedRentals = 0;
    if (newTrip.type === "flight") {
      const prog = LOYALTY_PROGRAMS.airlines.find(p => p.id === newTrip.program);
      estimatedPoints = prog ? prog.earnRate[newTrip.class] * 500 : 3000;
    } else if (newTrip.type === "hotel") {
      estimatedNights = parseInt(newTrip.nights) || 1;
    } else {
      estimatedRentals = 1;
    }
    setTrips(prev => [...prev, { ...newTrip, id, estimatedPoints, estimatedNights, estimatedRentals }]);
    setShowAddTrip(false);
    setNewTrip({ type: "flight", program: "aa", route: "", date: "", class: "domestic", nights: 1, status: "planned", tripName: "" });
  };

  const removeTrip = (id) => setTrips(prev => prev.filter(t => t.id !== id));

  const handleAddExpense = () => {
    const id = Date.now();
    const exp = { ...newExpense, id, tripId: showAddExpense, amount: parseFloat(newExpense.amount) || 0 };
    setExpenses(prev => [...prev, exp]);
    setShowAddExpense(null);
    setNewExpense({ category: "flight", description: "", amount: "", currency: "USD", date: "", paymentMethod: "", receipt: false, receiptImage: null, notes: "" });
  };

  const removeExpense = (id) => setExpenses(prev => prev.filter(e => e.id !== id));

  const getTripExpenses = (tripId) => expenses.filter(e => e.tripId === tripId);
  const getTripTotal = (tripId) => getTripExpenses(tripId).reduce((sum, e) => sum + e.amount, 0);
  const getTripName = (trip) => trip.tripName || trip.route || trip.property || trip.location || "Trip";

  const handleLinkAccount = (programId) => {
    const existing = SAMPLE_USER.linkedAccounts[programId];
    setLinkedAccounts(prev => ({ ...prev, [programId]: existing || { memberId: linkForm.memberId || "****0000", currentPoints: 0, tierCredits: 0, currentNights: 0, currentRentals: 0 } }));
    setShowLinkModal(null);
    setLinkForm({ memberId: "" });
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

  // ============================================================
  // PUBLIC SITE — Landing, Content Pages, Login
  // ============================================================
  if (!isLoggedIn) {
    const navLinks = [
      { id: "landing", label: "Home" },
      { id: "about", label: "About Us" },
      { id: "partners", label: "Our Partners" },
      { id: "blogs", label: "Blogs" },
      { id: "airline-reviews", label: "Airline Reviews" },
      { id: "hotel-reviews", label: "Hotel Reviews" },
      { id: "forums", label: "Forums" },
    ];
    const goTo = (page) => { setPublicPage(page); window.scrollTo(0, 0); };
    const fontLink = <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />;

    // --- Shared top nav bar ---
    const TopNav = () => (
      <nav style={{
        position: "sticky", top: 0, zIndex: 100, padding: "12px 28px",
        background: "rgba(15,15,15,0.65)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(242,107,58,0.1)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <button onClick={() => goTo("landing")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
          <LogoMark size={28} />
          <span style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans", letterSpacing: -0.3 }}>Continuum</span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {navLinks.map(n => (
            <button key={n.id} onClick={() => goTo(n.id)} style={{
              padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 11.5, fontWeight: publicPage === n.id ? 700 : 500, fontFamily: "Space Grotesk",
              background: publicPage === n.id ? "rgba(242,107,58,0.15)" : "transparent",
              color: publicPage === n.id ? "#F7A86A" : "rgba(255,255,255,0.5)", transition: "all 0.2s",
            }}>{n.label}</button>
          ))}
          <button onClick={() => goTo("login")} style={{
            padding: "7px 18px", borderRadius: 10, border: "none", cursor: "pointer", marginLeft: 6,
            fontSize: 12, fontWeight: 700, fontFamily: "Plus Jakarta Sans",
            background: publicPage === "login" ? "#F26B3A" : "linear-gradient(135deg, #E05A2B, #F26B3A)", color: "#fff",
            boxShadow: "0 2px 12px rgba(229,90,43,0.25)",
          }}>Log In</button>
        </div>
      </nav>
    );

    // --- Shared footer ---
    const Footer = () => (
      <footer style={{ position: "relative", zIndex: 1, padding: "40px 28px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(15,15,15,0.92)", marginTop: 60 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><LogoMark size={22} /><span style={{ fontSize: 14, fontWeight: 800, fontFamily: "Plus Jakarta Sans", color: "#fff" }}>Continuum</span></div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "Space Grotesk", maxWidth: 260, lineHeight: 1.6 }}>The elite status intelligence platform. Track, optimize, and maximize every mile, point, and night.</p>
          </div>
          <div style={{ display: "flex", gap: 36, flexWrap: "wrap" }}>
            {[
              { title: "Product", items: [{ label: "Features", id: "landing" }, { label: "Premium", id: "landing" }] },
              { title: "Company", items: [{ label: "About Us", id: "about" }, { label: "Partners", id: "partners" }] },
              { title: "Community", items: [{ label: "Blogs", id: "blogs" }, { label: "Forums", id: "forums" }, { label: "Airline Reviews", id: "airline-reviews" }, { label: "Hotel Reviews", id: "hotel-reviews" }] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk", marginBottom: 10 }}>{col.title}</h4>
                {col.items.map(link => (
                  <button key={link.label} onClick={() => goTo(link.id)} style={{ display: "block", background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "Space Grotesk", cursor: "pointer", padding: "2px 0" }}>{link.label}</button>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 24, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", fontFamily: "Space Grotesk" }}>© 2026 Continuum. All rights reserved.</p>
        </div>
      </footer>
    );

    // --- Shared page shell (bermuda bg for landing, dark bg for content pages) ---
    const Shell = ({ children, showBg }) => (
      <div style={{ minHeight: "100vh", background: "#0F0F0F", fontFamily: "'Plus Jakarta Sans', 'Space Grotesk', system-ui, sans-serif", color: "#fff", position: "relative" }}>
        {showBg && (<>
          <img src="/bermuda-bg.webp" alt="" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%", zIndex: 0 }} />
          <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "linear-gradient(180deg, rgba(15,15,15,0.5) 0%, rgba(15,15,15,0.65) 35%, rgba(15,15,15,0.88) 65%, #0F0F0F 100%)" }} />
        </>)}
        <TravelAtmosphere />
        {fontLink}
        <TopNav />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
        <Footer />
      </div>
    );

    // --- Content page wrapper ---
    const PageSection = ({ icon, title, subtitle, children }) => (
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "44px 28px 0" }}>
        <div style={{ marginBottom: 32 }}>
          <span style={{ fontSize: 30 }}>{icon}</span>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans", margin: "8px 0 0" }}>{title}</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk", marginTop: 6 }}>{subtitle}</p>
          <div style={{ width: 50, height: 3, borderRadius: 2, background: "linear-gradient(90deg, #E05A2B, #F5944E)", marginTop: 14 }} />
        </div>
        {children}
      </div>
    );

    // Card helper
    const Card = ({ icon, title, desc, color, children, onClick, style: sx }) => (
      <div onClick={onClick} style={{
        background: `linear-gradient(135deg, ${color || "rgba(242,107,58)"}08, rgba(255,255,255,0.02))`,
        border: `1px solid ${color || "rgba(255,255,255)"}15`, borderRadius: 16, padding: 22,
        cursor: onClick ? "pointer" : "default", transition: "border-color 0.2s", ...sx,
      }}>
        {icon && <span style={{ fontSize: 22, display: "block", marginBottom: 8 }}>{icon}</span>}
        {title && <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans", margin: "0 0 5px" }}>{title}</h3>}
        {desc && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", fontFamily: "Space Grotesk", lineHeight: 1.6, margin: 0 }}>{desc}</p>}
        {children}
      </div>
    );

    // ==================== LANDING PAGE ====================
    if (publicPage === "landing") return (
      <Shell showBg>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 28px" }}>
          {/* Hero */}
          <div style={{ textAlign: "center", padding: "90px 0 70px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}><LogoMark size={68} /></div>
            <h1 style={{ fontSize: 48, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans", margin: 0, letterSpacing: -1, lineHeight: 1.1 }}>
              Track Every Mile.<br />
              <span style={{ background: "linear-gradient(135deg, #F5944E, #F26B3A, #E05A2B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Maximize Every Status.</span>
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", fontFamily: "Space Grotesk", marginTop: 18, maxWidth: 500, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
              All your airline, hotel, and credit card loyalty programs in one intelligent dashboard — never miss an upgrade, a tier, or a reward.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 32 }}>
              <button onClick={() => goTo("login")} style={{
                padding: "13px 34px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Plus Jakarta Sans",
                background: "linear-gradient(135deg, #E05A2B, #F26B3A, #F5944E)", color: "#fff", boxShadow: "0 6px 28px rgba(229,90,43,0.35)",
              }}>Get Started Free</button>
              <button onClick={() => goTo("about")} style={{
                padding: "13px 34px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "Space Grotesk",
                background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.65)", backdropFilter: "blur(10px)",
              }}>Learn More</button>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 52,
            padding: "24px 28px", borderRadius: 18, background: "rgba(15,15,15,0.55)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            {[{ v: "70+", l: "Loyalty Programs" }, { v: "18", l: "Airlines" }, { v: "12", l: "Hotel Chains" }, { v: "21", l: "Credit Cards" }].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#F7A86A", fontFamily: "Plus Jakarta Sans" }}>{s.v}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk", marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans", textAlign: "center", marginBottom: 24 }}>Everything You Need to Travel Smarter</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 52 }}>
            {[
              { icon: "📊", title: "Unified Dashboard", desc: "See all airline, hotel, and rental car elite status in one place with real-time projections." },
              { icon: "🧠", title: "Status Optimizer", desc: "AI-powered recommendations to reach the next tier with the fewest trips and lowest spend." },
              { icon: "🧾", title: "Expense Tracking", desc: "Log travel expenses, upload receipts, and generate professional reports." },
              { icon: "🔗", title: "Direct Account Links", desc: "Connect to 70+ loyalty program websites to view your live points and status." },
              { icon: "💳", title: "Credit Card Intel", desc: "Match the best travel credit cards to your spending patterns and loyalty goals." },
              { icon: "📈", title: "Status Projections", desc: "See exactly where you'll land at year-end with planned trips factored in." },
            ].map((f, i) => <Card key={i} {...f} />)}
          </div>

          {/* CTA */}
          <div style={{
            textAlign: "center", padding: "40px 28px", borderRadius: 22,
            background: "linear-gradient(135deg, rgba(242,107,58,0.1), rgba(245,148,78,0.04))",
            border: "1px solid rgba(242,107,58,0.12)",
          }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans", margin: "0 0 6px" }}>Ready to take control?</h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk", marginBottom: 20 }}>Join thousands of travelers who never miss an upgrade.</p>
            <button onClick={() => goTo("login")} style={{
              padding: "13px 36px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Plus Jakarta Sans",
              background: "linear-gradient(135deg, #E05A2B, #F26B3A, #F5944E)", color: "#fff", boxShadow: "0 6px 28px rgba(229,90,43,0.35)",
            }}>Sign Up Free →</button>
          </div>
        </div>
      </Shell>
    );

    // ==================== ABOUT US ====================
    if (publicPage === "about") return (
      <Shell>
        <PageSection icon="🏢" title="About Us" subtitle="The team behind Continuum and our mission to transform travel loyalty.">
          <div style={{ display: "grid", gap: 16 }}>
            <Card icon="🎯" title="Our Mission" desc="We believe every traveler deserves to maximize the value of their loyalty. Continuum eliminates the complexity of tracking elite status across dozens of programs, so you can focus on the journey." />
            <Card icon="🌍" title="Our Story" desc="Founded by frequent travelers frustrated with spreadsheets and fragmented dashboards, Continuum launched in 2026 with a simple goal: one platform for all your miles, points, and nights." />
            <Card icon="👥" title="Our Team" desc="Our team brings together expertise from the airline industry, fintech, and travel technology. We're passionate about making premium travel accessible to everyone." />
            <Card icon="📍" title="Based in Bermuda" desc="Headquartered in beautiful Bermuda, we bring an international perspective to travel loyalty — understanding the needs of global travelers from day one." />
          </div>
        </PageSection>
      </Shell>
    );

    // ==================== OUR PARTNERS ====================
    if (publicPage === "partners") return (
      <Shell>
        <PageSection icon="🤝" title="Our Partners" subtitle="We work with the world's leading airlines, hotels, and financial institutions.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 28 }}>
            {[...LOYALTY_PROGRAMS.airlines.slice(0, 8), ...LOYALTY_PROGRAMS.hotels.slice(0, 6)].map((p, i) => (
              <div key={i} style={{
                background: `linear-gradient(135deg, ${p.color}10, rgba(255,255,255,0.02))`, border: `1px solid ${p.color}20`,
                borderRadius: 14, padding: "16px 14px", display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 20 }}>{p.logo}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "Space Grotesk" }}>{p.name}</span>
              </div>
            ))}
          </div>
          <Card icon="🤝" title="Become a Partner" desc="Interested in integrating with Continuum? We're always looking to expand our network. Reach out to partnerships@continuum.travel to learn more." />
        </PageSection>
      </Shell>
    );

    // ==================== BLOGS ====================
    if (publicPage === "blogs") return (
      <Shell>
        <PageSection icon="📝" title="Blog" subtitle="Expert insights on travel loyalty, elite status strategies, and industry news.">
          <div style={{ display: "grid", gap: 14 }}>
            {[
              { title: "How to Earn Airline Elite Status in 2026", date: "Feb 20, 2026", tag: "Strategy", desc: "A comprehensive guide to earning top-tier status across the major US airlines this year." },
              { title: "The Best Credit Cards for Hotel Elite Status", date: "Feb 14, 2026", tag: "Credit Cards", desc: "Which credit cards give you automatic hotel elite status? We break down every option." },
              { title: "Marriott vs Hilton vs Hyatt: 2026 Showdown", date: "Feb 8, 2026", tag: "Hotels", desc: "We compare the three biggest hotel loyalty programs head to head." },
              { title: "5 Mistakes Costing You Elite Status", date: "Jan 30, 2026", tag: "Tips", desc: "Common errors that frequent travelers make when chasing status — and how to fix them." },
              { title: "The Rise of Credit Card Travel Lounges", date: "Jan 22, 2026", tag: "Lounges", desc: "Chase, Amex, and Capital One are all building lounge empires. What it means for you." },
            ].map((post, i) => (
              <div key={i} style={{
                background: "linear-gradient(135deg, rgba(242,107,58,0.03), rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 22, cursor: "pointer",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#F7A86A", background: "rgba(242,107,58,0.15)", padding: "2px 8px", borderRadius: 5, fontFamily: "Space Grotesk" }}>{post.tag}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "Space Grotesk" }}>{post.date}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans", margin: "0 0 4px" }}>{post.title}</h3>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", fontFamily: "Space Grotesk", lineHeight: 1.6, margin: 0 }}>{post.desc}</p>
              </div>
            ))}
          </div>
        </PageSection>
      </Shell>
    );

    // ==================== AI CONCIERGE MODAL (avatar-centric) ====================
    const conciergeModalJSX = conciergeProgram ? (() => {
      const p = conciergeProgram;
      const isHotel = p.type === "hotel";
      const characters = isHotel
        ? [{ emoji: "🛎️", title: "Front Desk Concierge", hat: "#8B0000", uniform: "#1a1a2e", skin: "#D4A574" },
           { emoji: "🧳", title: "Bell Captain", hat: "#4a0e0e", uniform: "#2d1b3d", skin: "#C68B59" }]
        : [{ emoji: "👨‍✈️", title: "Captain", hat: "#1a2744", uniform: "#0a1628", skin: "#D4A574" },
           { emoji: "💁‍♀️", title: "Senior Flight Attendant", hat: p.color, uniform: "#1a1a2e", skin: "#C68B59" }];
      const char = characters[Math.floor(p.name.length % characters.length)];
      const lastAssistantMsg = [...conciergeMessages].reverse().find(m => m.role === "assistant");
      const isTalking = conciergeSpeaking;
      return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 }}
          onClick={() => { window.speechSynthesis?.cancel(); setConciergeProgram(null); setConciergeMessages([]); setConciergeSpeaking(false); }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: 600, maxHeight: "90vh", borderRadius: 24,
            background: `linear-gradient(160deg, #0F0F0F, #141414, ${p.color}08)`,
            border: `1px solid ${p.color}25`,
            display: "flex", flexDirection: "column", overflow: "hidden",
            boxShadow: `0 40px 100px rgba(0,0,0,0.7), 0 0 80px ${p.color}08`,
          }}>
            {/* Header bar */}
            <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${p.color}15` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{p.logo}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>{p.name}</span>
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {isTalking && <span style={{ fontSize: 9, color: "#34d399", fontFamily: "Space Grotesk", fontWeight: 600 }}>🔊 Speaking...</span>}
                <button onClick={() => { window.speechSynthesis?.cancel(); setConciergeProgram(null); setConciergeMessages([]); setConciergeSpeaking(false); }} style={{
                  width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)",
                  cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
                }}>✕</button>
              </div>
            </div>

            {/* Avatar + Speech area */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              {/* Character Stage */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 24px 16px",
                background: `radial-gradient(ellipse at center bottom, ${p.color}10, transparent 70%)`,
              }}>
                {/* SVG Avatar Character */}
                <svg width="140" height="160" viewBox="0 0 140 160" style={{
                  animation: isTalking ? "none" : "avatar-breathe 3s ease-in-out infinite",
                  filter: `drop-shadow(0 8px 24px ${p.color}30)`,
                }}>
                  {/* Body / Uniform */}
                  <ellipse cx="70" cy="145" rx="45" ry="20" fill={char.uniform} opacity="0.6" />
                  <path d={isHotel ? "M35 100 Q35 70 70 65 Q105 70 105 100 L105 145 Q105 155 70 155 Q35 155 35 145 Z" : "M30 95 Q30 65 70 60 Q110 65 110 95 L108 145 Q108 158 70 158 Q32 158 32 145 Z"} fill={char.uniform} />
                  {/* Uniform details */}
                  <line x1="70" y1="70" x2="70" y2="145" stroke={p.color} strokeWidth="1.5" opacity="0.3" />
                  {isHotel ? (
                    <>{/* Lapels */}
                      <path d="M55 75 L70 90 L70 75" fill="none" stroke={p.color} strokeWidth="1" opacity="0.4" />
                      <path d="M85 75 L70 90 L70 75" fill="none" stroke={p.color} strokeWidth="1" opacity="0.4" />
                      {/* Name badge */}
                      <rect x="52" y="100" width="36" height="12" rx="3" fill={p.color} opacity="0.3" />
                      <line x1="56" y1="106" x2="84" y2="106" stroke="#fff" strokeWidth="1" opacity="0.5" />
                    </>
                  ) : (
                    <>{/* Pilot epaulettes */}
                      <rect x="32" y="68" width="18" height="6" rx="2" fill={p.color} opacity="0.5" />
                      <rect x="90" y="68" width="18" height="6" rx="2" fill={p.color} opacity="0.5" />
                      {/* Wings badge */}
                      <path d="M50 95 L70 90 L90 95 L70 100 Z" fill={p.color} opacity="0.25" />
                      <circle cx="70" cy="95" r="4" fill={p.color} opacity="0.4" />
                    </>
                  )}
                  {/* Neck */}
                  <rect x="60" y="48" width="20" height="18" rx="6" fill={char.skin} />
                  {/* Head */}
                  <ellipse cx="70" cy="36" rx="24" ry="28" fill={char.skin} />
                  {/* Eyes */}
                  <ellipse cx="60" cy="33" rx="3.5" ry="4" fill="#1a1a2e" />
                  <ellipse cx="80" cy="33" rx="3.5" ry="4" fill="#1a1a2e" />
                  <circle cx="61.5" cy="32" r="1.2" fill="#fff" />
                  <circle cx="81.5" cy="32" r="1.2" fill="#fff" />
                  {/* Eyebrows */}
                  <path d="M54 26 Q60 23 66 26" fill="none" stroke="#3d2b1f" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M74 26 Q80 23 86 26" fill="none" stroke="#3d2b1f" strokeWidth="1.5" strokeLinecap="round" />
                  {/* Smile / Mouth */}
                  <ellipse cx="70" cy="44" rx={isTalking ? "5" : "7"} ry={isTalking ? "4" : "2"} fill="#c0504d"
                    style={isTalking ? { animation: "avatar-talk 0.4s ease-in-out infinite" } : {}} />
                  {/* Nose */}
                  <ellipse cx="70" cy="38" rx="2.5" ry="2" fill={char.skin} style={{ filter: "brightness(0.92)" }} />
                  {/* Hair / Hat */}
                  {isHotel ? (
                    <>{/* Concierge style short hair */}
                      <path d="M46 30 Q46 8 70 8 Q94 8 94 30" fill="#2d1b1b" />
                      <path d="M46 28 Q46 10 70 10 Q94 10 94 28 Q94 22 70 20 Q46 22 46 28" fill="#3d2b1f" />
                    </>
                  ) : (
                    <>{/* Pilot cap */}
                      <path d="M42 28 Q42 12 70 12 Q98 12 98 28 L98 24 Q98 18 70 15 Q42 18 42 24 Z" fill={char.hat} />
                      <rect x="42" y="24" width="56" height="6" rx="2" fill={char.hat} style={{ filter: "brightness(0.8)" }} />
                      <rect x="55" y="22" width="30" height="4" rx="1" fill={p.color} opacity="0.6" />
                      {/* Cap badge */}
                      <circle cx="70" cy="19" r="4" fill={p.color} opacity="0.5" />
                    </>
                  )}
                  {/* Ears */}
                  <ellipse cx="46" cy="36" rx="4" ry="6" fill={char.skin} style={{ filter: "brightness(0.95)" }} />
                  <ellipse cx="94" cy="36" rx="4" ry="6" fill={char.skin} style={{ filter: "brightness(0.95)" }} />
                </svg>

                {/* Character name */}
                <div style={{ marginTop: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>{char.title}</div>
                  <div style={{ fontSize: 11, color: `${p.color}`, fontFamily: "Space Grotesk", marginTop: 2 }}>{p.name} Expert</div>
                </div>
              </div>

              {/* Speech Bubble — shows latest assistant message */}
              <div style={{ padding: "0 24px 16px" }}>
                {lastAssistantMsg && (
                  <div style={{
                    position: "relative", padding: "16px 20px", borderRadius: 18,
                    background: `linear-gradient(135deg, ${p.color}10, rgba(255,255,255,0.03))`,
                    border: `1px solid ${p.color}18`, animation: "speech-bubble-in 0.4s ease-out",
                  }}>
                    {/* Bubble arrow pointing up */}
                    <div style={{
                      position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
                      width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent",
                      borderBottom: `8px solid ${p.color}18`,
                    }} />
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: "Space Grotesk", lineHeight: 1.7, margin: 0 }}>{lastAssistantMsg.content}</p>
                    {isTalking && (
                      <div style={{ display: "flex", gap: 3, marginTop: 8, alignItems: "center" }}>
                        {[0,1,2,3,4].map(i => (
                          <div key={i} style={{
                            width: 3, background: p.color, borderRadius: 2, opacity: 0.6,
                            animation: `avatar-talk 0.5s ease-in-out ${i * 0.1}s infinite`,
                            height: 8 + Math.sin(i) * 6,
                          }} />
                        ))}
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk", marginLeft: 6 }}>Speaking aloud...</span>
                      </div>
                    )}
                  </div>
                )}
                {conciergeLoading && !lastAssistantMsg && (
                  <div style={{
                    padding: "16px 20px", borderRadius: 18, textAlign: "center",
                    background: `linear-gradient(135deg, ${p.color}08, rgba(255,255,255,0.02))`, border: `1px solid ${p.color}12`,
                  }}>
                    <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                      {[0,1,2].map(d => (
                        <div key={d} style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, opacity: 0.5, animation: `twinkle 1s ease-in-out ${d * 0.2}s infinite` }} />
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "Space Grotesk", marginTop: 8 }}>Preparing your briefing...</p>
                  </div>
                )}
              </div>

              {/* Conversation history (collapsed, scrollable) */}
              {conciergeMessages.length > 1 && (
                <div style={{ padding: "0 24px 12px" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.25)", fontFamily: "Space Grotesk", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Conversation</div>
                  <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                    {conciergeMessages.slice(0, -1).map((msg, i) => (
                      <div key={i} style={{
                        padding: "6px 10px", borderRadius: 10, fontSize: 11, fontFamily: "Space Grotesk", lineHeight: 1.5,
                        background: msg.role === "user" ? "rgba(242,107,58,0.12)" : "rgba(255,255,255,0.03)",
                        color: msg.role === "user" ? "#F7A86A" : "rgba(255,255,255,0.45)",
                        borderLeft: msg.role === "user" ? "2px solid #F26B3A" : `2px solid ${p.color}30`,
                      }}>{msg.role === "user" ? "You: " : ""}{msg.content.slice(0, 120)}{msg.content.length > 120 ? "..." : ""}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input bar */}
            <div style={{
              padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex", gap: 10, background: "rgba(0,0,0,0.25)",
            }}>
              <input
                value={conciergeInput}
                onChange={e => setConciergeInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendConciergeMessage(); } }}
                placeholder={`Ask ${char.title.toLowerCase()} a question...`}
                autoFocus
                style={{
                  flex: 1, padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, color: "#fff", fontSize: 13, fontFamily: "Space Grotesk", outline: "none",
                }}
              />
              <button onClick={sendConciergeMessage} disabled={conciergeLoading || !conciergeInput.trim()} style={{
                padding: "10px 20px", borderRadius: 12, border: "none", cursor: conciergeLoading ? "not-allowed" : "pointer",
                fontSize: 13, fontWeight: 700, fontFamily: "Plus Jakarta Sans",
                background: conciergeLoading || !conciergeInput.trim() ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, #E05A2B, #F26B3A)`,
                color: conciergeLoading || !conciergeInput.trim() ? "rgba(255,255,255,0.25)" : "#fff",
              }}>Ask</button>
            </div>
          </div>
        </div>
      );
    })() : null;

    // ==================== AIRLINE REVIEWS ====================
    if (publicPage === "airline-reviews") return (
      <Shell>
        <PageSection icon="✈️" title="Airline Reviews" subtitle="Click any program to chat with an AI crew member who'll explain everything about it.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 14 }}>
            {LOYALTY_PROGRAMS.airlines.slice(0, 12).map((a, i) => (
              <div key={i} onClick={() => openConcierge(a, "airline")} style={{
                background: `linear-gradient(135deg, ${a.color}10, rgba(255,255,255,0.02))`, border: `1px solid ${a.color}20`,
                borderRadius: 16, padding: 20, position: "relative", overflow: "hidden", cursor: "pointer",
                transition: "border-color 0.2s, transform 0.2s",
              }}>
                <FlightPath color={a.color} style={{ top: 4, right: 4, width: 90, height: 18 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 26 }}>{a.logo}</span>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans", margin: 0 }}>{a.name}</h3>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk", margin: "2px 0 0" }}>{a.tiers?.length || 0} tiers · {a.unit}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 8 }}>
                  {(a.tiers || []).map((t, ti) => (
                    <span key={ti} style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: `${a.color}12`, color: a.color, fontFamily: "Space Grotesk", border: `1px solid ${a.color}22` }}>{t.name}</span>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <span style={{ fontSize: 14 }}>👨‍✈️</span>
                  <span style={{ fontSize: 11, color: "#F7A86A", fontWeight: 600, fontFamily: "Space Grotesk" }}>Chat with AI Crew Member →</span>
                </div>
              </div>
            ))}
          </div>
        </PageSection>
        {conciergeModalJSX}
      </Shell>
    );

    // ==================== HOTEL REVIEWS ====================
    if (publicPage === "hotel-reviews") return (
      <Shell>
        <PageSection icon="🏨" title="Hotel Reviews" subtitle="Click any program to chat with an AI concierge who'll walk you through the details.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 14 }}>
            {LOYALTY_PROGRAMS.hotels.map((h, i) => (
              <div key={i} onClick={() => openConcierge(h, "hotel")} style={{
                background: `linear-gradient(135deg, ${h.color}10, rgba(255,255,255,0.02))`, border: `1px solid ${h.color}20`,
                borderRadius: 16, padding: 20, cursor: "pointer", transition: "border-color 0.2s, transform 0.2s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 26 }}>{h.logo}</span>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans", margin: 0 }}>{h.name}</h3>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk", margin: "2px 0 0" }}>{h.tiers?.length || 0} tiers · {h.unit}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 8 }}>
                  {(h.tiers || []).map((t, ti) => (
                    <span key={ti} style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: `${h.color}12`, color: h.color, fontFamily: "Space Grotesk", border: `1px solid ${h.color}22` }}>{t.name}</span>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <span style={{ fontSize: 14 }}>🛎️</span>
                  <span style={{ fontSize: 11, color: "#F7A86A", fontWeight: 600, fontFamily: "Space Grotesk" }}>Chat with AI Concierge →</span>
                </div>
              </div>
            ))}
          </div>
        </PageSection>
        {conciergeModalJSX}
      </Shell>
    );

    // ==================== FORUMS ====================
    if (publicPage === "forums") return (
      <Shell>
        <PageSection icon="💬" title="Forums" subtitle="Connect with fellow travelers. Share tips, ask questions, and learn from the community.">
          <div style={{ display: "grid", gap: 12 }}>
            {[
              { title: "General Discussion", icon: "🗣️", threads: 1240, desc: "Chat about anything travel and loyalty related." },
              { title: "Airline Status Talk", icon: "✈️", threads: 856, desc: "Strategies and experiences earning airline elite status." },
              { title: "Hotel Loyalty", icon: "🏨", threads: 634, desc: "Discuss hotel programs, suite upgrades, and point valuations." },
              { title: "Credit Card Strategies", icon: "💳", threads: 1102, desc: "Which cards to get, sign-up bonuses, and churning strategies." },
              { title: "Trip Reports", icon: "📸", threads: 478, desc: "Share your travel experiences, reviews, and photos." },
              { title: "Deals & Offers", icon: "🔥", threads: 921, desc: "The latest travel deals, mistake fares, and bonus promotions." },
            ].map((f, i) => (
              <div key={i} style={{
                background: "linear-gradient(135deg, rgba(242,107,58,0.03), rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 20px",
                display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
              }}>
                <span style={{ fontSize: 26, width: 40, textAlign: "center" }}>{f.icon}</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans", margin: 0 }}>{f.title}</h3>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk", margin: "2px 0 0" }}>{f.desc}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#F7A86A", fontFamily: "Plus Jakarta Sans" }}>{f.threads.toLocaleString()}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "Space Grotesk" }}>threads</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", fontFamily: "Space Grotesk", marginBottom: 12 }}>Sign up to start posting and engage with the community.</p>
            <button onClick={() => goTo("login")} style={{
              padding: "11px 28px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Plus Jakarta Sans",
              background: "linear-gradient(135deg, #E05A2B, #F26B3A)", color: "#fff",
            }}>Sign Up to Join →</button>
          </div>
        </PageSection>
      </Shell>
    );

    // ==================== LOGIN PAGE ====================
    return (
      <Shell showBg>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 200px)", padding: "36px 20px" }}>
          <div style={{
            width: "100%", maxWidth: 440, opacity: animateIn ? 1 : 0, transform: animateIn ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
          }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><LogoMark size={52} /></div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: -0.5, fontFamily: "Plus Jakarta Sans" }}>Welcome Back</h1>
              <p style={{ color: "rgba(247,168,106,0.6)", fontSize: 13, marginTop: 6, fontFamily: "Space Grotesk" }}>Sign in to your Continuum account</p>
            </div>
            <div style={{
              background: "linear-gradient(135deg, rgba(242,107,58,0.06), rgba(255,255,255,0.03), rgba(242,107,58,0.04))",
              border: "1px solid rgba(247,168,106,0.1)", borderRadius: 20, padding: 30,
              backdropFilter: "blur(40px)", boxShadow: "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(247,168,106,0.08)",
              position: "relative", overflow: "hidden",
            }}>
              <FlightPath style={{ top: 8, right: 8, width: 130, height: 28 }} />
              <div style={{ display: "flex", marginBottom: 24, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 3 }}>
                {["Sign In", "Register"].map((tab, i) => (
                  <button key={tab} onClick={() => setIsRegistering(i === 1)} style={{
                    flex: 1, padding: "9px 0", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "Space Grotesk",
                    background: (i === 0 ? !isRegistering : isRegistering) ? "rgba(242,107,58,0.2)" : "transparent",
                    color: (i === 0 ? !isRegistering : isRegistering) ? "#F7A86A" : "rgba(255,255,255,0.35)", transition: "all 0.3s",
                  }}>{tab}</button>
                ))}
              </div>

              {!isRegistering ? (
                <div>
                  <label style={{ display: "block", marginBottom: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Email</span>
                    <input type="email" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} placeholder="alex@example.com"
                      style={{ display: "block", width: "100%", marginTop: 6, padding: "11px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box" }} />
                  </label>
                  <label style={{ display: "block", marginBottom: 22 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Password</span>
                    <input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••"
                      style={{ display: "block", width: "100%", marginTop: 6, padding: "11px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box" }} />
                  </label>
                  <button onClick={handleLogin} style={{
                    width: "100%", padding: "12px 0", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Plus Jakarta Sans",
                    background: "linear-gradient(135deg, #E05A2B, #F26B3A, #F5944E)", color: "#fff", boxShadow: "0 4px 20px rgba(229,90,43,0.3)",
                  }}>Sign In</button>
                  <button onClick={() => { setLoginForm({ email: "alex@example.com", password: "demo" }); setTimeout(handleLogin, 100); }} style={{
                    width: "100%", padding: "10px 0", border: "1px solid rgba(242,107,58,0.2)", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "Space Grotesk",
                    background: "transparent", color: "#F7A86A", marginTop: 10,
                  }}>Try Demo Account →</button>
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Full Name</span>
                    <input value={registerForm.name} onChange={e => setRegisterForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name"
                      style={{ display: "block", width: "100%", marginTop: 6, padding: "11px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box" }} />
                  </label>
                  <label style={{ display: "block", marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Email</span>
                    <input type="email" value={registerForm.email} onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))} placeholder="you@email.com"
                      style={{ display: "block", width: "100%", marginTop: 6, padding: "11px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box" }} />
                  </label>
                  <label style={{ display: "block", marginBottom: 22 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Password</span>
                    <input type="password" value={registerForm.password} onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••"
                      style={{ display: "block", width: "100%", marginTop: 6, padding: "11px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box" }} />
                  </label>
                  <button onClick={handleRegister} style={{
                    width: "100%", padding: "12px 0", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Plus Jakarta Sans",
                    background: "linear-gradient(135deg, #E05A2B, #F26B3A, #F5944E)", color: "#fff", boxShadow: "0 4px 20px rgba(229,90,43,0.3)",
                  }}>Create Account</button>
                </div>
              )}

              <div style={{ textAlign: "center", marginTop: 18, padding: "12px 0 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "Space Grotesk", margin: 0 }}>By signing in, you agree to our Terms of Service</p>
              </div>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // ============================================================
  // VIEWS
  // ============================================================
  const filteredTrips = trips.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (searchQuery && !JSON.stringify(t).toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const renderDashboard = () => {
    const airlineStatuses = LOYALTY_PROGRAMS.airlines.map(p => ({ ...p, status: getProjectedStatus(p.id) })).filter(p => p.status);
    const hotelStatuses = LOYALTY_PROGRAMS.hotels.map(p => ({ ...p, status: getProjectedStatus(p.id) })).filter(p => p.status);
    const totalTrips = trips.length;
    const confirmedTrips = trips.filter(t => t.status === "confirmed").length;
    const willAdvanceCount = [...airlineStatuses, ...hotelStatuses].filter(p => p.status?.willAdvance).length;

    return (
      <div>
        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Linked Programs", value: Object.keys(linkedAccounts).length, icon: "🔗", color: "#F5944E" },
            { label: "Planned Trips", value: totalTrips, icon: "🗺️", color: "#34d399" },
            { label: "Confirmed", value: confirmedTrips, icon: "✅", color: "#fbbf24" },
            { label: "Status Advances", value: willAdvanceCount, icon: "🚀", color: "#f472b6" },
          ].map((stat, i) => (
            <div key={i} style={{
              background: `linear-gradient(135deg, ${stat.color}08, rgba(255,255,255,0.02))`,
              border: `1px solid ${stat.color}15`, borderRadius: 16, padding: "18px 20px",
              display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "hidden",
              boxShadow: `0 4px 20px ${stat.color}08`,
            }}>
              <FlightPath color={stat.color} style={{ bottom: 4, left: 20, width: 120, height: 24 }} />
              <div style={{ fontSize: 28, position: "relative" }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500, fontFamily: "Space Grotesk" }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Airline Status Cards */}
        {airlineStatuses.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 14, fontFamily: "Plus Jakarta Sans" }}>✈️ Airline Elite Status</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
              {airlineStatuses.map(p => {
                const s = p.status;
                const progress = s.nextTier ? (s.projected / s.nextTier.threshold) * 100 : 100;
                return (
                  <div key={p.id} onClick={() => { setSelectedProgram(p.id); setActiveView("programs"); }} style={{
                    background: `linear-gradient(135deg, ${p.color}15, ${p.accent}10)`, border: `1px solid ${p.color}30`,
                    borderRadius: 16, padding: 22, cursor: "pointer", transition: "all 0.3s",
                    boxShadow: `0 4px 25px ${p.color}10`, position: "relative", overflow: "hidden",
                  }}>
                    <FlightPath color={p.color} style={{ top: 6, right: 6, width: 100, height: 20 }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk", marginTop: 2 }}>
                          {s.currentTier ? s.currentTier.name : "Member"} → {s.nextTier?.name || "Top Tier"}
                        </div>
                      </div>
                      {s.willAdvance && <Badge color="#34d399" small>↑ Advancing!</Badge>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <ProgressRing progress={Math.min(progress, 100)} size={70} color={p.color} label={`${Math.round(progress)}%`} sublabel={p.unit} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4, fontFamily: "Space Grotesk" }}>
                          <span>{s.projected.toLocaleString()} {p.unit}</span>
                          <span>{s.nextTier?.threshold.toLocaleString()}</span>
                        </div>
                        <MiniBar value={s.projected} max={s.nextTier?.threshold || s.projected} color={p.color} height={8} />
                        {s.tripBoosts > 0 && (
                          <div style={{ fontSize: 10, color: "#34d399", marginTop: 6, fontFamily: "Space Grotesk" }}>+{s.tripBoosts.toLocaleString()} from upcoming trips</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hotel Status Cards */}
        {hotelStatuses.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 14, fontFamily: "Plus Jakarta Sans" }}>🏨 Hotel Elite Status</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
              {hotelStatuses.map(p => {
                const s = p.status;
                const progress = s.nextTier ? (s.projected / s.nextTier.threshold) * 100 : 100;
                return (
                  <div key={p.id} onClick={() => { setSelectedProgram(p.id); setActiveView("programs"); }} style={{
                    background: `linear-gradient(135deg, ${p.color}15, ${p.accent}10)`, border: `1px solid ${p.color}30`,
                    borderRadius: 16, padding: 22, cursor: "pointer", transition: "all 0.3s",
                    boxShadow: `0 4px 25px ${p.color}10`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk", marginTop: 2 }}>
                          {s.currentTier ? s.currentTier.name : "Member"} • {s.current} nights YTD
                        </div>
                      </div>
                      {s.willAdvance && <Badge color="#34d399" small>↑ Tier Up!</Badge>}
                    </div>
                    <MiniBar value={s.projected} max={s.nextTier?.threshold || s.projected} color={p.color} height={8} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 6, fontFamily: "Space Grotesk" }}>
                      <span>{s.projected} / {s.nextTier?.threshold || "MAX"} nights</span>
                      {s.tripBoosts > 0 && <span style={{ color: "#34d399" }}>+{s.tripBoosts} planned</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Trips Timeline */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: 0, fontFamily: "Plus Jakarta Sans" }}>📅 Upcoming Trips</h3>
            <button onClick={() => setActiveView("trips")} style={{
              background: "none", border: "none", color: "#F5944E", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Space Grotesk",
            }}>View All →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {trips.slice(0, 4).map(trip => {
              const prog = allPrograms.find(p => p.id === trip.program);
              return (
                <div key={trip.id} style={{
                  background: "linear-gradient(135deg, rgba(242,107,58,0.02), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 18px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{trip.type === "flight" ? "✈️" : trip.type === "hotel" ? "🏨" : "🚗"}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "Space Grotesk" }}>{trip.route || trip.property || trip.location}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk" }}>{trip.date} • {prog?.name}</div>
                    </div>
                  </div>
                  <Badge color={trip.status === "confirmed" ? "#34d399" : trip.status === "planned" ? "#fbbf24" : "#F5944E"} small>
                    {trip.status}
                  </Badge>
                </div>
              );
            })}
            {trips.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.25)", fontSize: 13, fontFamily: "Space Grotesk" }}>
                No trips yet. Add your first trip to start tracking! ✈️
              </div>
            )}
          </div>
        </div>

        {/* Credit Card Recommendations - Monetization */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: 0, fontFamily: "Plus Jakarta Sans" }}>💳 Recommended Cards</h3>
            <Badge color="#fbbf24" small>SPONSORED</Badge>
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
            {CREDIT_CARD_OFFERS.slice(0, 3).map((card, i) => (
              <div key={i} style={{
                minWidth: 220, background: `linear-gradient(135deg, ${card.color}20, ${card.color}08)`, border: `1px solid ${card.color}30`,
                borderRadius: 14, padding: 18, flex: "0 0 auto",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans", marginBottom: 6 }}>{card.name}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fbbf24", fontFamily: "Plus Jakarta Sans", marginBottom: 4 }}>{card.bonus}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk", marginBottom: 10 }}>Spend {card.spend} • {card.fee}</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {card.tags.map((tag, j) => <Badge key={j} color={card.color || "#F26B3A"} small>{tag}</Badge>)}
                </div>
                <button style={{
                  width: "100%", marginTop: 12, padding: "8px 0", borderRadius: 8, border: `1px solid ${card.color}40`, background: "transparent",
                  color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Space Grotesk",
                }}>Apply Now →</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPrograms = () => {
    const customByCategory = {
      airline: customPrograms.filter(p => p.category === "airline"),
      hotel: customPrograms.filter(p => p.category === "hotel"),
      rental: customPrograms.filter(p => p.category === "rental"),
      card: customPrograms.filter(p => p.category === "card"),
    };
    const categories = [
      { label: "Airlines", icon: "✈️", programs: [...LOYALTY_PROGRAMS.airlines, ...customByCategory.airline] },
      { label: "Hotels", icon: "🏨", programs: [...LOYALTY_PROGRAMS.hotels, ...customByCategory.hotel] },
      { label: "Rental Cars", icon: "🚗", programs: [...LOYALTY_PROGRAMS.rentals, ...customByCategory.rental] },
      { label: "Credit Cards", icon: "💳", programs: [...LOYALTY_PROGRAMS.creditCards, ...customByCategory.card] },
    ];

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "Plus Jakarta Sans" }}>Loyalty Programs</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "4px 0 0", fontFamily: "Space Grotesk" }}>Link and manage all your accounts</p>
          </div>
          <button onClick={() => setShowAddProgram(true)} style={{
            padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Plus Jakarta Sans",
            background: "linear-gradient(135deg, #E05A2B, #F26B3A)", color: "#fff", boxShadow: "0 4px 15px rgba(229,90,43,0.3)",
          }}>+ Add Program</button>
        </div>

        {categories.map((cat, ci) => (
          <div key={ci} style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 12, fontFamily: "Plus Jakarta Sans" }}>{cat.icon} {cat.label}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
              {cat.programs.map(prog => {
                const isLinked = !!linkedAccounts[prog.id];
                const status = isLinked ? getProjectedStatus(prog.id) : null;
                const isCard = cat.label === "Credit Cards";

                return (
                  <div key={prog.id} style={{
                    background: isLinked ? `linear-gradient(135deg, ${prog.color}12, ${prog.accent || prog.color}08)` : "rgba(255,255,255,0.015)",
                    border: `1px solid ${isLinked ? prog.color + "30" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 16, padding: 22, transition: "all 0.3s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 26 }}>{prog.logo}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>{prog.name}</div>
                          {isLinked && !isCard && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk" }}>
                            ID: {linkedAccounts[prog.id].memberId}
                          </div>}
                          {isCard && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk" }}>{prog.annualFee ? `$${prog.annualFee}/yr` : ""}</div>}
                        </div>
                      </div>
                      {isLinked ? <Badge color="#34d399" small>Linked</Badge> : <Badge color="rgba(255,255,255,0.3)" small>Not Linked</Badge>}
                    </div>

                    {isLinked && status && !isCard && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontFamily: "Space Grotesk" }}>
                          <span>Current: {status.currentTier?.name || "Member"}</span>
                          <span>Next: {status.nextTier?.name}</span>
                        </div>
                        <MiniBar value={status.projected} max={status.nextTier?.threshold || status.projected} color={prog.color} height={8} />
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4, fontFamily: "Space Grotesk" }}>
                          {status.projected.toLocaleString()} / {(status.nextTier?.threshold || status.projected).toLocaleString()} {prog.unit}
                          {status.willAdvance && <span style={{ color: "#34d399", marginLeft: 8 }}>🎉 On track to advance!</span>}
                        </div>
                      </div>
                    )}

                    {isCard && isLinked && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>
                          {(linkedAccounts[prog.id]?.pointsBalance || 0).toLocaleString()} pts
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk", marginTop: 2 }}>{prog.perks}</div>
                      </div>
                    )}

                    {!isCard && prog.tiers && (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
                        {prog.tiers.map((tier, ti) => (
                          <Badge key={ti} color={status?.currentTier?.name === tier.name ? prog.color : "rgba(255,255,255,0.15)"} small>
                            {tier.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {isLinked ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <span style={{
                          flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)",
                          fontSize: 12, fontWeight: 600, fontFamily: "Space Grotesk", textAlign: "center",
                        }}>✓ Connected</span>
                        {prog.loginUrl && (
                          <a href={prog.loginUrl} target="_blank" rel="noopener noreferrer" style={{
                            padding: "9px 14px", borderRadius: 10, border: `1px solid ${prog.color}40`,
                            background: `${prog.color}15`, color: "#fff", textDecoration: "none",
                            fontSize: 12, fontWeight: 600, fontFamily: "Space Grotesk", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4,
                          }}>View ↗</a>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => (setShowLinkModal(prog.id), setLinkForm({ memberId: "" }))} style={{
                        width: "100%", padding: "9px 0", borderRadius: 10, border: `1px solid ${prog.color + "40"}`,
                        background: `${prog.color}15`, color: "#fff",
                        fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Space Grotesk", transition: "all 0.3s",
                      }}>Link Account</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTrips = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "Plus Jakarta Sans" }}>Annual Travel Plan</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "4px 0 0", fontFamily: "Space Grotesk" }}>{trips.length} trips planned for 2026</p>
        </div>
        <button onClick={() => setShowAddTrip(true)} style={{
          padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Plus Jakarta Sans",
          background: "linear-gradient(135deg, #E05A2B, #F26B3A)", color: "#fff", boxShadow: "0 4px 15px rgba(229,90,43,0.3)",
        }}>+ Add Trip</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search trips..."
          style={{
            padding: "8px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, color: "#fff", fontSize: 12, fontFamily: "Space Grotesk", outline: "none", flex: 1, minWidth: 160,
          }} />
        {["all", "confirmed", "planned", "wishlist"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: "8px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "Space Grotesk",
            background: filterStatus === s ? "rgba(242,107,58,0.2)" : "rgba(255,255,255,0.04)",
            color: filterStatus === s ? "#F7A86A" : "rgba(255,255,255,0.4)", textTransform: "capitalize",
          }}>{s}</button>
        ))}
      </div>

      {/* Trip Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filteredTrips.map(trip => {
          const prog = allPrograms.find(p => p.id === trip.program);
          return (
            <div key={trip.id} style={{
              background: "linear-gradient(135deg, rgba(242,107,58,0.02), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 20px",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                  background: prog ? `${prog.color}15` : "rgba(255,255,255,0.04)",
                }}>{trip.type === "flight" ? "✈️" : trip.type === "hotel" ? "🏨" : "🚗"}</div>
                <div>
                  {trip.tripName && <div style={{ fontSize: 13, fontWeight: 700, color: "#F7A86A", fontFamily: "Plus Jakarta Sans", marginBottom: 2 }}>{trip.tripName}</div>}
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>{trip.route || trip.property || trip.location}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk", marginTop: 2 }}>
                    {trip.date} • {prog?.name || "Unknown"} {trip.nights ? `• ${trip.nights} nights` : ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {trip.estimatedPoints > 0 && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24", fontFamily: "Plus Jakarta Sans" }}>+{trip.estimatedPoints.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "Space Grotesk" }}>points</div>
                  </div>
                )}
                {trip.estimatedNights > 0 && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#34d399", fontFamily: "Plus Jakarta Sans" }}>+{trip.estimatedNights}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "Space Grotesk" }}>nights</div>
                  </div>
                )}
                <Badge color={trip.status === "confirmed" ? "#34d399" : trip.status === "planned" ? "#fbbf24" : "#F5944E"} small>{trip.status}</Badge>
                <button onClick={() => removeTrip(trip.id)} style={{
                  width: 28, height: 28, borderRadius: 8, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444",
                  fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>×</button>
              </div>
            </div>
          );
        })}
        {filteredTrips.length === 0 && (
          <div style={{ textAlign: "center", padding: 50, color: "rgba(255,255,255,0.25)", fontSize: 13, fontFamily: "Space Grotesk" }}>
            No trips match your filters
          </div>
        )}
      </div>
    </div>
  );

  const renderExpenses = () => {
    const tripsWithExpenses = trips.map(t => ({ ...t, expenses: getTripExpenses(t.id), total: getTripTotal(t.id) }));
    const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);
    const totalByCategory = EXPENSE_CATEGORIES.map(cat => ({
      ...cat, total: expenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

    // Per-trip detail view
    if (expenseViewTrip) {
      const trip = trips.find(t => t.id === expenseViewTrip);
      if (!trip) { setExpenseViewTrip(null); return null; }
      const tripExps = getTripExpenses(trip.id);
      const tripTotal = tripExps.reduce((s, e) => s + e.amount, 0);
      const prog = allPrograms.find(p => p.id === trip.program);
      const catBreakdown = EXPENSE_CATEGORIES.map(cat => ({
        ...cat, total: tripExps.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
        items: tripExps.filter(e => e.category === cat.id),
      })).filter(c => c.total > 0);

      return (
        <div>
          <button onClick={() => setExpenseViewTrip(null)} style={{
            background: "none", border: "none", color: "#F7A86A", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Space Grotesk", marginBottom: 16, padding: 0,
          }}>← Back to All Trips</button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "Plus Jakarta Sans" }}>
                {trip.type === "flight" ? "✈️" : trip.type === "hotel" ? "🏨" : "🚗"} {getTripName(trip)}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "4px 0 0", fontFamily: "Space Grotesk" }}>
                {trip.date} • {prog?.name} • {tripExps.length} expenses
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowExpenseReport(trip.id)} style={{
                padding: "9px 18px", borderRadius: 10, border: "1px solid rgba(229,90,43,0.3)", background: "rgba(229,90,43,0.08)",
                color: "#F5944E", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Space Grotesk",
              }}>📄 Generate Report</button>
              <button onClick={() => setShowAddExpense(trip.id)} style={{
                padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "Plus Jakarta Sans",
                background: "linear-gradient(135deg, #E05A2B, #F26B3A)", color: "#fff",
              }}>+ Add Expense</button>
            </div>
          </div>

          {/* Trip expense summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
            <div style={{ background: "rgba(229,90,43,0.08)", border: "1px solid rgba(229,90,43,0.2)", borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>${tripTotal.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk" }}>Total Spend</div>
            </div>
            <div style={{ background: "linear-gradient(135deg, rgba(242,107,58,0.02), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>{tripExps.length}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk" }}>Expenses</div>
            </div>
            <div style={{ background: "linear-gradient(135deg, rgba(242,107,58,0.02), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>{tripExps.filter(e => e.receipt).length}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk" }}>With Receipts</div>
            </div>
          </div>

          {/* Category breakdown bar */}
          {tripTotal > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", height: 10, borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
                {catBreakdown.map((cat, i) => (
                  <div key={i} style={{ width: `${(cat.total / tripTotal) * 100}%`, background: cat.color, transition: "width 0.5s ease" }} title={`${cat.label}: $${cat.total}`} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {catBreakdown.map((cat, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Space Grotesk" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                    {cat.label}: ${cat.total.toLocaleString()} ({Math.round((cat.total / tripTotal) * 100)}%)
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expense list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tripExps.sort((a, b) => new Date(a.date) - new Date(b.date)).map(exp => {
              const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
              return (
                <div key={exp.id} style={{
                  background: "linear-gradient(135deg, rgba(242,107,58,0.02), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 18px",
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, background: `${cat?.color || "#666"}15`, flexShrink: 0,
                    }}>{cat?.icon || "📎"}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "Space Grotesk", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk" }}>
                        {exp.date} • {exp.paymentMethod || "—"} {exp.receipt ? "• 🧾" : ""} {exp.notes ? `• ${exp.notes}` : ""}
                      </div>
                      {exp.receiptImage?.data && exp.receiptImage.type?.startsWith("image/") && (
                        <img src={exp.receiptImage.data} alt="Receipt" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4, marginTop: 4, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
                          onClick={(e) => { e.stopPropagation(); window.open(exp.receiptImage.data, "_blank"); }} title="Click to view full receipt" />
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: exp.amount === 0 ? "#34d399" : "#fff", fontFamily: "Plus Jakarta Sans" }}>
                      {exp.amount === 0 ? "Free" : `$${exp.amount.toLocaleString()}`}
                    </div>
                    <button onClick={() => removeExpense(exp.id)} style={{
                      width: 26, height: 26, borderRadius: 7, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444",
                      fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>×</button>
                  </div>
                </div>
              );
            })}
            {tripExps.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.25)", fontSize: 13, fontFamily: "Space Grotesk" }}>
                No expenses yet for this trip. Click "+ Add Expense" to start tracking.
              </div>
            )}
          </div>
        </div>
      );
    }

    // Overview: all trips with expense totals
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "Plus Jakarta Sans" }}>Trip Expenses</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "4px 0 0", fontFamily: "Space Grotesk" }}>Track spending across all your trips</p>
          </div>
        </div>

        {/* Grand total stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
          <div style={{ background: "rgba(229,90,43,0.08)", border: "1px solid rgba(229,90,43,0.2)", borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>${grandTotal.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk" }}>Total Across All Trips</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, rgba(242,107,58,0.02), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>{expenses.length}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk" }}>Total Expenses</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, rgba(242,107,58,0.02), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>{tripsWithExpenses.filter(t => t.total > 0).length}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk" }}>Trips With Expenses</div>
          </div>
        </div>

        {/* Spending by category */}
        {totalByCategory.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 12, fontFamily: "Plus Jakarta Sans" }}>Spending by Category</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {totalByCategory.map((cat, i) => (
                <div key={i} style={{ background: `${cat.color}10`, border: `1px solid ${cat.color}25`, borderRadius: 12, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{cat.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>${cat.total.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk" }}>{cat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trip-by-trip list */}
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 12, fontFamily: "Plus Jakarta Sans" }}>Expenses by Trip</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {trips.map(trip => {
            const tripExps = getTripExpenses(trip.id);
            const tripTotal = getTripTotal(trip.id);
            const prog = allPrograms.find(p => p.id === trip.program);
            return (
              <div key={trip.id} style={{
                background: "linear-gradient(135deg, rgba(242,107,58,0.02), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 20px",
                cursor: "pointer", transition: "all 0.2s",
              }} onClick={() => setExpenseViewTrip(trip.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                      background: prog ? `${prog.color}15` : "rgba(255,255,255,0.04)",
                    }}>{trip.type === "flight" ? "✈️" : trip.type === "hotel" ? "🏨" : "🚗"}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>{getTripName(trip)}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk" }}>
                        {trip.date} • {tripExps.length} expense{tripExps.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: tripTotal > 0 ? "#fff" : "rgba(255,255,255,0.25)", fontFamily: "Plus Jakarta Sans" }}>
                        {tripTotal > 0 ? `$${tripTotal.toLocaleString()}` : "—"}
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setShowAddExpense(trip.id); }} style={{
                      width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(229,90,43,0.2)", background: "rgba(229,90,43,0.06)",
                      color: "#F5944E", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>+</button>
                    <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 14 }}>→</span>
                  </div>
                </div>
              </div>
            );
          })}
          {trips.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.25)", fontSize: 13, fontFamily: "Space Grotesk" }}>
              Add trips first, then track expenses for each one.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOptimizer = () => {
    const scenarioTrips = trips.filter(t => t.type === "flight");
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "Plus Jakarta Sans" }}>Trip Optimizer</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "4px 0 0", fontFamily: "Space Grotesk" }}>See how crediting flights differently affects your status</p>
          </div>
          <Badge color="#f59e0b">★ PREMIUM</Badge>
        </div>

        {user?.tier !== "premium" ? (
          <div style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(242,107,58,0.08))", border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 20, padding: 40, textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans", margin: "0 0 8px" }}>Unlock Trip Optimizer</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "Space Grotesk", maxWidth: 400, margin: "0 auto 24px" }}>
              See the optimal way to credit each flight across your airline programs. Find hidden status shortcuts and maximize every trip.
            </p>
            <button onClick={() => setShowUpgrade(true)} style={{
              padding: "12px 32px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Plus Jakarta Sans",
              background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
            }}>Upgrade to Premium — $9.99/mo</button>
          </div>
        ) : (
          <div>
            <div style={{
              background: "linear-gradient(135deg, rgba(242,107,58,0.02), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 22, marginBottom: 20,
            }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans", marginBottom: 14 }}>Optimal Credit Strategy for 2026</h4>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Space Grotesk", marginBottom: 16 }}>
                Based on your {scenarioTrips.length} planned flights, here's the best way to allocate credits:
              </div>
              {LOYALTY_PROGRAMS.airlines.map(airline => {
                const airlineTrips = trips.filter(t => t.program === airline.id && t.type === "flight");
                const totalPts = airlineTrips.reduce((sum, t) => sum + (t.estimatedPoints || 0), 0);
                const status = getProjectedStatus(airline.id);
                return (
                  <div key={airline.id} style={{
                    background: `${airline.color}10`, border: `1px solid ${airline.color}20`, borderRadius: 12, padding: 16, marginBottom: 10,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>{airline.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk" }}>
                          {airlineTrips.length} flights • +{totalPts.toLocaleString()} pts projected
                        </div>
                      </div>
                      {status?.willAdvance && <Badge color="#34d399">Will advance to {status.projectedTier.name}!</Badge>}
                      {status && !status.willAdvance && status.nextTier && (
                        <div style={{ fontSize: 11, color: "#fbbf24", fontFamily: "Space Grotesk" }}>
                          Need {(status.nextTier.threshold - status.projected).toLocaleString()} more for {status.nextTier.name}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              background: "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(16,185,129,0.04))", border: "1px solid rgba(52,211,153,0.2)",
              borderRadius: 16, padding: 22,
            }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#34d399", fontFamily: "Plus Jakarta Sans", marginBottom: 10 }}>💡 Optimizer Recommendations</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Consider crediting your LAX→ATL flight to AA instead of Delta to push closer to Platinum Pro",
                  "Your Tokyo trip alone could earn 48 Marriott nights with the right booking strategy",
                  "Add one more Hilton stay (3+ nights) to lock in Diamond status for 2027",
                  "Your Amex Platinum earns 5x on flights — ensure all bookings use this card",
                ].map((tip, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", fontSize: 12,
                    color: "rgba(255,255,255,0.6)", fontFamily: "Space Grotesk", display: "flex", gap: 8,
                  }}>
                    <span style={{ color: "#34d399", fontWeight: 700, flexShrink: 0 }}>→</span> {tip}
                  </div>
                ))}
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

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "Plus Jakarta Sans" }}>Annual Reports</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "4px 0 0", fontFamily: "Space Grotesk" }}>Your 2026 travel year at a glance</p>
          </div>
          <button onClick={() => setShowUpgrade(true)} style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)",
            color: "#f59e0b", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Space Grotesk",
          }}>★ Export PDF — Premium</button>
        </div>

        {/* Bar Chart */}
        <div style={{ background: "linear-gradient(135deg, rgba(242,107,58,0.02), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 22, marginBottom: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans", marginBottom: 18 }}>Points Earned by Month</h4>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140 }}>
            {monthlyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 9, color: "#fbbf24", fontWeight: 600, fontFamily: "Space Grotesk" }}>
                  {d.points > 0 ? `${(d.points / 1000).toFixed(1)}k` : ""}
                </div>
                <div style={{
                  width: "100%", maxWidth: 32, height: `${Math.max((d.points / maxPts) * 100, 3)}%`, minHeight: 3,
                  borderRadius: "4px 4px 0 0", background: d.points > 0 ? "linear-gradient(180deg, #F5944E, #F26B3A)" : "rgba(255,255,255,0.04)",
                  transition: "height 1s ease",
                }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "Space Grotesk" }}>{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Total Points Projected", value: trips.reduce((s, t) => s + (t.estimatedPoints || 0), 0).toLocaleString(), icon: "⭐", color: "#fbbf24" },
            { label: "Hotel Nights Planned", value: trips.reduce((s, t) => s + (t.estimatedNights || t.nights || 0), 0), icon: "🌙", color: "#F5944E" },
            { label: "Flights Planned", value: trips.filter(t => t.type === "flight").length, icon: "✈️", color: "#34d399" },
            { label: "Est. Travel Spend", value: "$" + (trips.length * 850).toLocaleString(), icon: "💰", color: "#f472b6" },
          ].map((stat, i) => (
            <div key={i} style={{
              background: `${stat.color}08`, border: `1px solid ${stat.color}20`, borderRadius: 14, padding: 20,
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Status Forecast */}
        <div style={{ background: "linear-gradient(135deg, rgba(242,107,58,0.02), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 22 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans", marginBottom: 14 }}>Year-End Status Forecast</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 10 }}>
            {allPrograms.filter(p => linkedAccounts[p.id] && p.tiers).map(prog => {
              const status = getProjectedStatus(prog.id);
              if (!status) return null;
              return (
                <div key={prog.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(242,107,58,0.02), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <span style={{ fontSize: 20 }}>{prog.logo}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "Space Grotesk" }}>{prog.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk" }}>
                      {status.projectedTier?.name || "Member"} {status.willAdvance ? "🎉" : ""}
                    </div>
                  </div>
                  <MiniBar value={status.projected} max={status.nextTier?.threshold || status.projected} color={prog.color} height={5} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderPremium = () => (
    <div>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12, display: "flex", justifyContent: "center" }}><LogoMark size={64} /></div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "Plus Jakarta Sans" }}>Continuum Premium</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontFamily: "Space Grotesk", marginTop: 6 }}>Maximize every mile, every night, every point.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 36 }}>
        {[
          { name: "Free", price: "$0", period: "forever", color: "rgba(255,255,255,0.1)", features: ["3 linked programs", "Basic dashboard", "Manual trip entry", "Annual summary", "Community support"] },
          { name: "Premium", price: "$9.99", period: "/month", color: "#E05A2B", popular: true, features: ["Unlimited programs", "Trip Optimizer AI", "Status match alerts", "PDF reports & exports", "Credit card recommendations", "Mileage expiration alerts", "Priority support", "Ad-free experience"] },
          { name: "Pro", price: "$24.99", period: "/month", color: "#f59e0b", features: ["Everything in Premium", "API access & integrations", "Multi-year status tracking", "Tax deduction reports", "Team/family accounts", "White-label option", "Dedicated account manager", "Custom analytics"] },
        ].map((plan, i) => (
          <div key={i} style={{
            background: plan.popular ? `linear-gradient(135deg, ${plan.color}15, ${plan.color}08)` : "rgba(255,255,255,0.02)",
            border: `1px solid ${plan.popular ? plan.color + "40" : "rgba(255,255,255,0.06)"}`,
            borderRadius: 20, padding: 28, position: "relative", overflow: "hidden",
          }}>
            {plan.popular && (
              <div style={{
                position: "absolute", top: 14, right: -28, background: plan.color, color: "#fff", fontSize: 10, fontWeight: 700,
                padding: "4px 36px", transform: "rotate(45deg)", fontFamily: "Space Grotesk",
              }}>POPULAR</div>
            )}
            <div style={{ fontSize: 16, fontWeight: 700, color: plan.popular ? "#F7A86A" : "#fff", fontFamily: "Plus Jakarta Sans", marginBottom: 6 }}>{plan.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 18 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>{plan.price}</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk" }}>{plan.period}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
              {plan.features.map((f, fi) => (
                <div key={fi} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "Space Grotesk" }}>
                  <span style={{ color: plan.popular ? "#F7A86A" : "#34d399", fontSize: 13 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <button style={{
              width: "100%", padding: "12px 0", borderRadius: 12, border: plan.popular ? "none" : "1px solid rgba(255,255,255,0.1)",
              background: plan.popular ? `linear-gradient(135deg, #E05A2B, #F26B3A)` : "rgba(255,255,255,0.04)",
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Plus Jakarta Sans",
              boxShadow: plan.popular ? "0 4px 20px rgba(229,90,43,0.3)" : "none",
            }}>{plan.price === "$0" ? "Current Plan" : "Upgrade Now"}</button>
          </div>
        ))}
      </div>

      {/* Feature Highlights */}
      <div style={{
        background: "linear-gradient(135deg, rgba(242,107,58,0.02), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans", marginBottom: 16 }}>Why Go Premium?</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {[
            { icon: "🧠", title: "AI Trip Optimizer", desc: "Know exactly where to credit every flight for maximum status acceleration" },
            { icon: "🔔", title: "Status Match Alerts", desc: "Get notified when airlines offer status challenges that match your profile" },
            { icon: "📊", title: "Advanced Analytics", desc: "Multi-year tracking, spending analysis, and ROI on your loyalty investments" },
            { icon: "💳", title: "Card Advisor", desc: "Personalized credit card recommendations based on your actual travel patterns" },
            { icon: "📄", title: "Tax Reports", desc: "Export travel expenses for business deductions with categorized reports" },
            { icon: "👨‍👩‍👧‍👦", title: "Family Accounts", desc: "Track status for your whole family and optimize household loyalty strategy" },
          ].map((f, i) => (
            <div key={i} style={{
              background: "linear-gradient(135deg, rgba(242,107,58,0.02), rgba(255,255,255,0.02))", borderRadius: 12, padding: 16,
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans", marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================================
  // NAV CONFIG
  // ============================================================
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "programs", label: "Programs", icon: "🔗" },
    { id: "trips", label: "Trips", icon: "🗺️" },
    { id: "expenses", label: "Expenses", icon: "🧾" },
    { id: "optimizer", label: "Optimizer", icon: "🧠" },
    { id: "reports", label: "Reports", icon: "📈" },
    { id: "premium", label: "Premium", icon: "💎" },
  ];

  const viewRenderers = { dashboard: renderDashboard, programs: renderPrograms, trips: renderTrips, expenses: renderExpenses, optimizer: renderOptimizer, reports: renderReports, premium: renderPremium };

  // ============================================================
  // MAIN LAYOUT
  // ============================================================
  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(160deg, #0F0F0F 0%, #141414 25%, #1A1A1A 50%, #121212 75%, #0F0F0F 100%)",
      fontFamily: "'Plus Jakarta Sans', 'Space Grotesk', system-ui, sans-serif", color: "#fff", display: "flex", position: "relative",
    }}>
      <TravelAtmosphere />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <aside style={{
        width: 220, minHeight: "100vh",
        background: "linear-gradient(180deg, rgba(242,107,58,0.06) 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.35) 100%)",
        borderRight: "2px solid rgba(242,107,58,0.15)",
        padding: "20px 12px", display: "flex", flexDirection: "column", flexShrink: 0,
        position: "sticky", top: 0, height: "100vh", overflowY: "auto", boxSizing: "border-box",
        backdropFilter: "blur(20px)", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 28 }}>
          <LogoMark size={28} />
          <span style={{ fontSize: 17, fontWeight: 800, fontFamily: "Plus Jakarta Sans", letterSpacing: -0.3 }}>Continuum</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
              background: activeView === item.id ? "rgba(242,107,58,0.12)" : "transparent",
              color: activeView === item.id ? "#F7A86A" : "rgba(255,255,255,0.4)",
              fontSize: 13, fontWeight: activeView === item.id ? 600 : 500, fontFamily: "Space Grotesk", textAlign: "left", transition: "all 0.2s", width: "100%",
            }}>
              <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{item.icon}</span>
              {item.label}
              {item.id === "premium" && <span style={{ marginLeft: "auto", fontSize: 9, background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "1px 6px", borderRadius: 6, fontWeight: 700 }}>PRO</span>}
            </button>
          ))}
        </nav>

        {/* User Card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(242,107,58,0.08), rgba(255,255,255,0.03))",
          border: "1px solid rgba(247,168,106,0.08)", borderRadius: 12, padding: 14, marginTop: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #E05A2B, #F26B3A)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
            }}>{user?.avatar || "U"}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "Space Grotesk" }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "Space Grotesk" }}>{user?.tier === "premium" ? "Premium" : "Free Plan"}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: "100%", padding: "7px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "transparent",
            color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Space Grotesk",
          }}>Sign Out</button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "28px 40px", overflowY: "auto", minWidth: 0, position: "relative", zIndex: 1 }}>
        {/* Top Bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <IconBtn icon="🔔" label="Notifications" badge />
            <IconBtn icon="⚙️" label="Settings" />
          </div>
        </div>

        {/* Hero Banner */}
        <PageHeroBanner view={activeView}
          title={activeView === "dashboard" ? `Welcome back, ${user?.name?.split(" ")[0]}` : navItems.find(n => n.id === activeView)?.label}
          subtitle={
            activeView === "dashboard" ? `${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · ${Object.keys(linkedAccounts).length} programs tracked` :
            activeView === "programs" ? "Link and manage all your loyalty accounts" :
            activeView === "trips" ? "Plan, track, and optimize your upcoming travel" :
            activeView === "expenses" ? "Track spending and receipts across every trip" :
            activeView === "optimizer" ? "AI-powered recommendations to maximize your status" :
            activeView === "reports" ? "Insights and analytics across all programs" :
            activeView === "premium" ? "Unlock the full power of Continuum" : ""
          }
        />

        {/* View Content */}
        {viewRenderers[activeView]?.()}
      </main>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Add Trip Modal */}
      {showAddTrip && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={() => setShowAddTrip(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 440,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 20px", fontFamily: "Plus Jakarta Sans" }}>Add Trip</h3>

            {/* Trip Name */}
            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Trip Name</span>
              <input value={newTrip.tripName} onChange={e => setNewTrip(p => ({ ...p, tripName: e.target.value }))}
                placeholder="e.g. London Spring Getaway, Tokyo Anniversary"
                style={{
                  display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box",
                }} />
            </label>

            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {["flight", "hotel", "rental"].map(type => (
                <button key={type} onClick={() => setNewTrip(p => ({ ...p, type, program: type === "flight" ? "aa" : type === "hotel" ? "marriott" : "hertz" }))} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "Space Grotesk",
                  background: newTrip.type === type ? "rgba(242,107,58,0.2)" : "rgba(255,255,255,0.04)",
                  color: newTrip.type === type ? "#F7A86A" : "rgba(255,255,255,0.4)", textTransform: "capitalize",
                }}>{type === "flight" ? "✈️" : type === "hotel" ? "🏨" : "🚗"} {type}</button>
              ))}
            </div>

            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Program</span>
              <select value={newTrip.program} onChange={e => setNewTrip(p => ({ ...p, program: e.target.value }))} style={{
                display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box",
              }}>
                {(newTrip.type === "flight" ? [...LOYALTY_PROGRAMS.airlines, ...customPrograms.filter(p => p.category === "airline")] : newTrip.type === "hotel" ? [...LOYALTY_PROGRAMS.hotels, ...customPrograms.filter(p => p.category === "hotel")] : [...LOYALTY_PROGRAMS.rentals, ...customPrograms.filter(p => p.category === "rental")]).map(p => (
                  <option key={p.id} value={p.id} style={{ background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)" }}>{p.name}</option>
                ))}
              </select>
            </label>

            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>
                {newTrip.type === "flight" ? "Route" : newTrip.type === "hotel" ? "Property" : "Location"}
              </span>
              <input value={newTrip.route} onChange={e => setNewTrip(p => ({ ...p, route: e.target.value, property: e.target.value, location: e.target.value }))}
                placeholder={newTrip.type === "flight" ? "JFK → LAX" : newTrip.type === "hotel" ? "Hotel name" : "City"}
                style={{
                  display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box",
                }} />
            </label>

            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <label style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Date</span>
                <input type="date" value={newTrip.date} onChange={e => setNewTrip(p => ({ ...p, date: e.target.value }))} style={{
                  display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box",
                }} />
              </label>
              {newTrip.type === "flight" && (
                <label style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Class</span>
                  <select value={newTrip.class} onChange={e => setNewTrip(p => ({ ...p, class: e.target.value }))} style={{
                    display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box",
                  }}>
                    <option value="domestic" style={{ background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)" }}>Domestic Economy</option>
                    <option value="international" style={{ background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)" }}>International</option>
                    <option value="premium" style={{ background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)" }}>Premium / Business</option>
                  </select>
                </label>
              )}
              {newTrip.type === "hotel" && (
                <label style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Nights</span>
                  <input type="number" min={1} value={newTrip.nights} onChange={e => setNewTrip(p => ({ ...p, nights: parseInt(e.target.value) || 1 }))} style={{
                    display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box",
                  }} />
                </label>
              )}
            </div>

            <label style={{ display: "block", marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Status</span>
              <select value={newTrip.status} onChange={e => setNewTrip(p => ({ ...p, status: e.target.value }))} style={{
                display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box",
              }}>
                <option value="confirmed" style={{ background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)" }}>Confirmed</option>
                <option value="planned" style={{ background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)" }}>Planned</option>
                <option value="wishlist" style={{ background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)" }}>Wishlist</option>
              </select>
            </label>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAddTrip(false)} style={{
                flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
                color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Space Grotesk",
              }}>Cancel</button>
              <button onClick={handleAddTrip} style={{
                flex: 1, padding: "11px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Plus Jakarta Sans",
                background: "linear-gradient(135deg, #E05A2B, #F26B3A)", color: "#fff",
              }}>Add Trip</button>
            </div>
          </div>
        </div>
      )}

      {/* Link Account Modal */}
      {showLinkModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={() => setShowLinkModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 400,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 6px", fontFamily: "Plus Jakarta Sans" }}>Link Account</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 20px", fontFamily: "Space Grotesk" }}>
              Connect your {allPrograms.find(p => p.id === showLinkModal)?.name || "loyalty"} account
            </p>

            <label style={{ display: "block", marginBottom: 18 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Member ID</span>
              <input value={linkForm.memberId} onChange={e => setLinkForm(p => ({ ...p, memberId: e.target.value }))} placeholder="Enter your member number"
                style={{
                  display: "block", width: "100%", marginTop: 6, padding: "12px 14px", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box",
                }} />
            </label>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "Space Grotesk", marginBottom: 20 }}>
              In production, this would use OAuth to securely connect to the loyalty program's API. Demo mode uses sample data.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLinkModal(null)} style={{
                flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
                color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Space Grotesk",
              }}>Cancel</button>
              <button onClick={() => handleLinkAccount(showLinkModal)} style={{
                flex: 1, padding: "11px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Plus Jakarta Sans",
                background: "linear-gradient(135deg, #E05A2B, #F26B3A)", color: "#fff",
              }}>Link Account</button>
            </div>
          </div>
        </div>
      )}

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
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={() => setShowAddProgram(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto",
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 6px", fontFamily: "Plus Jakarta Sans" }}>Add Loyalty Program</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 20px", fontFamily: "Space Grotesk" }}>Choose from {PROGRAM_DIRECTORY.airlines.length + PROGRAM_DIRECTORY.hotels.length + PROGRAM_DIRECTORY.rentals.length + PROGRAM_DIRECTORY.creditCards.length}+ programs or add a custom one</p>

            {/* Category Tabs */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { id: "airline", label: "Airlines", icon: "✈️", count: PROGRAM_DIRECTORY.airlines.length },
                  { id: "hotel", label: "Hotels", icon: "🏨", count: PROGRAM_DIRECTORY.hotels.length },
                  { id: "rental", label: "Rentals", icon: "🚗", count: PROGRAM_DIRECTORY.rentals.length },
                  { id: "card", label: "Cards", icon: "💳", count: PROGRAM_DIRECTORY.creditCards.length },
                ].map(cat => (
                  <button key={cat.id} onClick={() => setNewProgram(p => ({ ...p, category: cat.id, selectedId: "", search: "" }))} style={{
                    flex: 1, padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "Space Grotesk",
                    background: newProgram.category === cat.id ? "rgba(242,107,58,0.2)" : "rgba(255,255,255,0.04)",
                    color: newProgram.category === cat.id ? "#F7A86A" : "rgba(255,255,255,0.4)", transition: "all 0.2s",
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
                style={{ display: "block", width: "100%", padding: "10px 12px 10px 36px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box" }}
              />
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.3 }}>🔍</span>
            </div>

            {/* Program List */}
            {!selectedProg && (
              <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                {filtered.map(prog => {
                  const isLinked = alreadyLinked.includes(prog.id);
                  return (
                    <button key={prog.id} onClick={() => !isLinked && setNewProgram(p => ({ ...p, selectedId: prog.id, search: "" }))}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent",
                        border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: isLinked ? "default" : "pointer",
                        opacity: isLinked ? 0.4 : 1, transition: "background 0.15s", textAlign: "left",
                      }}
                      onMouseEnter={e => { if (!isLinked) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{prog.logo}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "Space Grotesk", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{prog.name}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk" }}>
                          {prog.tiers ? `${prog.tiers.length} tiers · ${prog.unit}` : prog.perks ? prog.perks.substring(0, 50) + "..." : prog.unit}
                        </div>
                      </div>
                      {isLinked ? (
                        <span style={{ fontSize: 10, color: "#F5944E", fontWeight: 600, fontFamily: "Space Grotesk" }}>Linked ✓</span>
                      ) : (
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: prog.color, flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <div style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13, fontFamily: "Space Grotesk" }}>
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
                  border: `1px solid ${selectedProg.color}30`, borderRadius: 14, padding: 16, marginBottom: 14,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 28 }}>{selectedProg.logo}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>{selectedProg.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk" }}>
                        {selectedProg.tiers ? `${selectedProg.tiers.length} elite tiers · ${selectedProg.unit}` : `${selectedProg.unit} · $${selectedProg.annualFee}/yr`}
                      </div>
                    </div>
                    <button onClick={() => setNewProgram(p => ({ ...p, selectedId: "" }))} style={{
                      background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, width: 28, height: 28, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 14,
                    }}>✕</button>
                  </div>
                  {/* Tier badges */}
                  {selectedProg.tiers && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      {selectedProg.tiers.map((t, i) => (
                        <span key={i} style={{
                          padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, fontFamily: "Space Grotesk",
                          background: `${selectedProg.color}20`, color: selectedProg.color, border: `1px solid ${selectedProg.color}30`,
                        }}>{t.name}</span>
                      ))}
                    </div>
                  )}
                  {selectedProg.perks && (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Space Grotesk", lineHeight: 1.5 }}>{selectedProg.perks}</div>
                  )}
                </div>

                {/* Connect Account CTA */}
                {selectedProg.loginUrl && (
                  <a href={selectedProg.loginUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderRadius: 12,
                    background: `linear-gradient(135deg, ${selectedProg.color}, ${selectedProg.accent || selectedProg.color})`,
                    color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 13, fontFamily: "Plus Jakarta Sans", marginBottom: 14,
                    boxShadow: `0 4px 15px ${selectedProg.color}40`, transition: "all 0.2s",
                  }}>
                    🔗 Connect to {selectedProg.name.split(" ")[0]} Account
                    <span style={{ fontSize: 11, opacity: 0.7 }}>↗</span>
                  </a>
                )}
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "Space Grotesk", textAlign: "center", margin: "0 0 12px" }}>
                  Opens {selectedProg.name.split(" ")[0]}'s website — log in to view your live status & points balance
                </p>

                {/* Member ID input */}
                <label style={{ display: "block", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Member / Account Number</span>
                  <input value={newProgram.memberId} onChange={e => setNewProgram(p => ({ ...p, memberId: e.target.value }))} placeholder="Enter your member number to link"
                    style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box" }} />
                </label>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowAddProgram(false); setNewProgram({ name: "", category: "airline", logo: "✈️", color: "#F26B3A", memberId: "", unit: "Points", tiers: "", selectedId: "", search: "" }); }} style={{
                flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
                color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Space Grotesk",
              }}>Cancel</button>
              {selectedProg ? (
                <button onClick={() => {
                  const prog = selectedProg;
                  if (!alreadyLinked.includes(prog.id)) {
                    setLinkedAccounts(prev => ({ ...prev, [prog.id]: { memberId: newProgram.memberId || "Pending", currentPoints: 0, currentNights: 0, currentRentals: 0 } }));
                  }
                  setShowAddProgram(false);
                  setNewProgram({ name: "", category: "airline", logo: "✈️", color: "#F26B3A", memberId: "", unit: "Points", tiers: "", selectedId: "", search: "" });
                }} style={{
                  flex: 1, padding: "11px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Plus Jakarta Sans",
                  background: `linear-gradient(135deg, #E05A2B, #F26B3A)`, color: "#fff",
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
                  setNewProgram({ name: "", category: "airline", logo: "✈️", color: "#F26B3A", memberId: "", unit: "Points", tiers: "", selectedId: "", search: "" });
                }} style={{
                  flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Space Grotesk",
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
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={() => setShowUpgrade(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 400, textAlign: "center",
          }}>
            <div style={{ fontSize: 42, marginBottom: 12, display: "flex", justifyContent: "center" }}><LogoMark size={56} /></div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 8px", fontFamily: "Plus Jakarta Sans" }}>Upgrade to Premium</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "Space Grotesk", marginBottom: 24 }}>
              Unlock the Trip Optimizer, status match alerts, PDF exports, and more.
            </p>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans", marginBottom: 4 }}>$9.99<span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>/mo</span></div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "Space Grotesk", marginBottom: 24 }}>Cancel anytime. 7-day free trial.</p>
            <button onClick={() => { setUser(prev => ({ ...prev, tier: "premium" })); setShowUpgrade(false); }} style={{
              width: "100%", padding: "13px 0", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Plus Jakarta Sans",
              background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", boxShadow: "0 4px 20px rgba(245,158,11,0.3)", marginBottom: 10,
            }}>Start Free Trial</button>
            <button onClick={() => setShowUpgrade(false)} style={{
              width: "100%", padding: "11px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
              color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Space Grotesk",
            }}>Maybe Later</button>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={() => setShowAddExpense(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 480,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 6px", fontFamily: "Plus Jakarta Sans" }}>Add Expense</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 20px", fontFamily: "Space Grotesk" }}>
              {(() => { const t = trips.find(t => t.id === showAddExpense); return t ? `${t.type === "flight" ? "✈️" : t.type === "hotel" ? "🏨" : "🚗"} ${getTripName(t)}` : ""; })()}
            </p>

            {/* Category selector */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk", display: "block", marginBottom: 8 }}>Category</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {EXPENSE_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setNewExpense(p => ({ ...p, category: cat.id }))} style={{
                    padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "Space Grotesk",
                    background: newExpense.category === cat.id ? `${cat.color}25` : "rgba(255,255,255,0.04)",
                    color: newExpense.category === cat.id ? cat.color : "rgba(255,255,255,0.4)", transition: "all 0.2s",
                  }}>{cat.icon} {cat.label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <label style={{ flex: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Description</span>
                <input value={newExpense.description} onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Marriott 3 nights"
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box" }} />
              </label>
              <label style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Amount ($)</span>
                <input type="number" min="0" step="0.01" value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))} placeholder="0.00"
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box" }} />
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <label style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Date</span>
                <input type="date" value={newExpense.date} onChange={e => setNewExpense(p => ({ ...p, date: e.target.value }))}
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box" }} />
              </label>
              <label style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Payment Method</span>
                <select value={newExpense.paymentMethod} onChange={e => setNewExpense(p => ({ ...p, paymentMethod: e.target.value }))}
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box" }}>
                  <option value="" style={{ background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)" }}>Select...</option>
                  <option value="Amex Platinum" style={{ background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)" }}>Amex Platinum</option>
                  <option value="Chase Sapphire" style={{ background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)" }}>Chase Sapphire Reserve</option>
                  <option value="Cash" style={{ background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)" }}>Cash</option>
                  <option value="Debit Card" style={{ background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)" }}>Debit Card</option>
                  <option value="Other" style={{ background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)" }}>Other</option>
                </select>
              </label>
            </div>

            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk" }}>Notes (optional)</span>
              <input value={newExpense.notes} onChange={e => setNewExpense(p => ({ ...p, notes: e.target.value }))} placeholder="Business meal, personal, etc."
                style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "Space Grotesk", outline: "none", boxSizing: "border-box" }} />
            </label>

            {/* Receipt Upload / Camera */}
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Space Grotesk", display: "block", marginBottom: 8 }}>Receipt</span>
              
              {!newExpense.receiptImage ? (
                <div style={{ display: "flex", gap: 10 }}>
                  {/* Upload file button */}
                  <label style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "18px 12px", borderRadius: 12, border: "2px dashed rgba(229,90,43,0.25)", background: "rgba(229,90,43,0.04)",
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <span style={{ fontSize: 22 }}>📄</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#F5944E", fontFamily: "Space Grotesk" }}>Upload File</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "Space Grotesk" }}>JPG, PNG, PDF</span>
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
                    padding: "18px 12px", borderRadius: 12, border: "2px dashed rgba(229,90,43,0.25)", background: "rgba(229,90,43,0.04)",
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <span style={{ fontSize: 22 }}>📸</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#F5944E", fontFamily: "Space Grotesk" }}>Take Photo</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "Space Grotesk" }}>Use camera</span>
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
                    padding: "18px 12px", borderRadius: 12, border: `2px dashed ${!newExpense.receipt ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
                    background: !newExpense.receipt ? "rgba(255,255,255,0.03)" : "transparent", cursor: "pointer",
                  }}>
                    <span style={{ fontSize: 22 }}>⊘</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk" }}>No Receipt</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "Space Grotesk" }}>&nbsp;</span>
                  </button>
                </div>
              ) : (
                /* Receipt preview */
                <div style={{
                  borderRadius: 12, border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.06)", padding: 14,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  {newExpense.receiptImage.type?.startsWith("image/") ? (
                    <img src={newExpense.receiptImage.data} alt="Receipt" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }} />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: 8, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📄</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#34d399", fontFamily: "Space Grotesk" }}>✓ Receipt attached</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
              <button onClick={() => setShowAddExpense(null)} style={{
                flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
                color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Space Grotesk",
              }}>Cancel</button>
              <button onClick={handleAddExpense} style={{
                flex: 1, padding: "11px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Plus Jakarta Sans",
                background: "linear-gradient(135deg, #E05A2B, #F26B3A)", color: "#fff",
              }}>Add Expense</button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Report Modal */}
      {showExpenseReport && (() => {
        const trip = trips.find(t => t.id === showExpenseReport);
        if (!trip) return null;
        const tripExps = getTripExpenses(trip.id).sort((a, b) => new Date(a.date) - new Date(b.date));
        const tripTotal = tripExps.reduce((s, e) => s + e.amount, 0);
        const prog = allPrograms.find(p => p.id === trip.program);
        const catSummary = EXPENSE_CATEGORIES.map(cat => ({
          ...cat, total: tripExps.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
          count: tripExps.filter(e => e.category === cat.id).length,
        })).filter(c => c.total > 0);
        const receiptCount = tripExps.filter(e => e.receipt).length;

        return (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
          }} onClick={() => setShowExpenseReport(null)}>
            <div onClick={e => e.stopPropagation()} style={{
              background: "linear-gradient(135deg, #1A1A1A, #1E1E1E)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 600,
              maxHeight: "85vh", overflowY: "auto",
            }}>
              {/* Report Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <LogoMark size={24} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#F7A86A", fontFamily: "Plus Jakarta Sans" }}>Continuum</span>
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "Plus Jakarta Sans" }}>Expense Report</h3>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk" }}>Generated {new Date().toLocaleDateString()}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "Space Grotesk" }}>Report #{trip.id}-{Date.now().toString(36).slice(-4)}</div>
                </div>
              </div>

              {/* Trip Info */}
              <div style={{
                background: "rgba(229,90,43,0.06)", border: "1px solid rgba(229,90,43,0.15)", borderRadius: 14, padding: 18, marginBottom: 20,
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans", marginBottom: 4 }}>
                  {trip.type === "flight" ? "✈️" : trip.type === "hotel" ? "🏨" : "🚗"} {getTripName(trip)}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk" }}>
                  {trip.date} • {prog?.name || "Unknown"} • {trip.status}
                </div>
              </div>

              {/* Summary Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#F5944E", fontFamily: "Plus Jakarta Sans" }}>${tripTotal.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk" }}>Total</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "Plus Jakarta Sans" }}>{tripExps.length}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk" }}>Items</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#34d399", fontFamily: "Plus Jakarta Sans" }}>{receiptCount}/{tripExps.length}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk" }}>Receipts</div>
                </div>
              </div>

              {/* Category Summary */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: "Plus Jakarta Sans", marginBottom: 10 }}>BREAKDOWN BY CATEGORY</div>
                {catSummary.map((cat, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{cat.icon}</span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "Space Grotesk" }}>{cat.label} ({cat.count})</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 80, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        <div style={{ width: `${(cat.total / tripTotal) * 100}%`, height: "100%", background: cat.color, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Plus Jakarta Sans", minWidth: 70, textAlign: "right" }}>${cat.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Line Items */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: "Plus Jakarta Sans", marginBottom: 10 }}>LINE ITEMS</div>
                <div style={{ background: "linear-gradient(135deg, rgba(242,107,58,0.02), rgba(255,255,255,0.02))", borderRadius: 10, overflow: "hidden" }}>
                  {/* Header */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 70px 28px", gap: 8, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk", textTransform: "uppercase" }}>Description</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk", textTransform: "uppercase" }}>Date</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk", textTransform: "uppercase" }}>Payment</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk", textTransform: "uppercase", textAlign: "right" }}>Amount</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk", textAlign: "center" }}>🧾</span>
                  </div>
                  {/* Rows */}
                  {tripExps.map((exp, i) => {
                    const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                    return (
                      <div key={exp.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 70px 28px", gap: 8, padding: "10px 14px", borderBottom: i < tripExps.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: 12, color: "#fff", fontFamily: "Space Grotesk" }}>{cat?.icon} {exp.description}</span>
                          {exp.notes && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{exp.notes}</div>}
                        </div>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk" }}>{exp.date?.slice(5)}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.paymentMethod || "—"}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: exp.amount === 0 ? "#34d399" : "#fff", fontFamily: "Plus Jakarta Sans", textAlign: "right" }}>
                          {exp.amount === 0 ? "Free" : `$${exp.amount.toLocaleString()}`}
                        </span>
                        <span style={{ fontSize: 12, textAlign: "center" }}>{exp.receipt ? "✓" : "—"}</span>
                      </div>
                    );
                  })}
                  {/* Total */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 70px", gap: 8, padding: "12px 14px", background: "rgba(229,90,43,0.06)", borderTop: "2px solid rgba(229,90,43,0.2)" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#F7A86A", fontFamily: "Plus Jakarta Sans" }}>TOTAL</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#F5944E", fontFamily: "Plus Jakarta Sans", textAlign: "right" }}>${tripTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowExpenseReport(null)} style={{
                  flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
                  color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Space Grotesk",
                }}>Close</button>
                <button onClick={() => window.print()} style={{
                  flex: 1, padding: "11px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Plus Jakarta Sans",
                  background: "linear-gradient(135deg, #E05A2B, #F26B3A)", color: "#fff",
                }}>🖨️ Print / Save PDF</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
