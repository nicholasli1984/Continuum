import React, { useState, useEffect, useCallback, useMemo } from "react";

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

const Badge = ({ children, color = "#0EA5A0", small }) => (
  <span style={{
    display: "inline-block", padding: small ? "1px 6px" : "2px 10px", borderRadius: 8, fontSize: small ? 10 : 11,
    fontWeight: 600, background: `${color}22`, color: color, border: `1px solid ${color}33`, letterSpacing: 0.3,
  }}>{children}</span>
);

const MiniBar = ({ value, max, color, height = 6 }) => (
  <div style={{ width: "100%", height, borderRadius: height, background: "#23252a", overflow: "hidden" }}>
    <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", borderRadius: height, background: `linear-gradient(90deg, ${color}, ${color}99)`, transition: "width 1s ease" }} />
  </div>
);

const IconBtn = ({ icon, label, active, onClick, badge }) => (
  <button onClick={onClick} title={label} style={{
    position: "relative", width: 44, height: 44, borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
    background: active ? "rgba(14,165,160,0.15)" : "transparent", color: active ? "#0EA5A0" : "rgba(0,0,0,0.35)", transition: "all 0.2s",
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
  const [newProgram, setNewProgram] = useState({ name: "", category: "airline", logo: "✈️", color: "#0EA5A0", memberId: "", unit: "Points", tiers: "", selectedId: "", search: "" });
  const [conciergeProgram, setConciergeProgram] = useState(null); // program object for AI concierge
  const [conciergeMessages, setConciergeMessages] = useState([]); // { role, content }
  const [conciergeInput, setConciergeInput] = useState("");
  const [conciergeLoading, setConciergeLoading] = useState(false);
  const [conciergeSpeaking, setConciergeSpeaking] = useState(false);

  useEffect(() => { setTimeout(() => setAnimateIn(true), 100); }, []);

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
    { id: "flight", label: "Flights", icon: "✈️", color: "#0EA5A0" },
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
    // Scroll-to-section helper
    const scrollTo = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth" }); };
    const navLinks = [
      { id: "features", label: "Features" },
      { id: "pricing", label: "Pricing" },
    ];
    const goTo = (page) => { setPublicPage(page); window.scrollTo(0, 0); };
    const fontLink = <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />;

    // --- Top nav: Logo + Features + Pricing + Login ---
    const TopNav = () => (
      <nav style={{
        position: "sticky", top: 0, zIndex: 100, padding: "0 32px", height: 56,
        background: "rgba(8,9,10,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid #23252a",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button onClick={() => { goTo("landing"); }} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
          <LogoMark size={26} />
          <span style={{ fontSize: 16, fontWeight: 800, color: "#f7f8f8", fontFamily: "Instrument Serif, Georgia, serif", letterSpacing: -0.5 }}>CONTINUUM</span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {navLinks.map(n => (
            <button key={n.id} onClick={() => { if (publicPage === "landing") scrollTo(n.id); else { goTo("landing"); setTimeout(() => scrollTo(n.id), 100); }}} style={{
              padding: "18px 14px", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.03)",
              fontSize: 10.5, fontWeight: 600, fontFamily: "Space Mono, monospace", letterSpacing: 1.5, textTransform: "uppercase",
              color: "#8a8f98", transition: "all 0.25s cubic-bezier(0.175,0.885,0.32,1)",
            }}>{n.label}</button>
          ))}
          <button onClick={() => goTo("login")} style={{
            padding: "8px 22px", border: "1px solid #34343a", cursor: "pointer", marginLeft: 16,
            fontSize: 10.5, fontWeight: 700, fontFamily: "Space Mono, monospace", letterSpacing: 1.5, textTransform: "uppercase",
            background: "#141516", color: "#f7f8f8", border: "1px solid #23252a", transition: "all 0.25s cubic-bezier(0.175,0.885,0.32,1)",
          }}>Log In</button>
        </div>
      </nav>
    );

    // --- Footer ---
    const Footer = () => (
      <footer style={{ position: "relative", zIndex: 1, padding: "64px 32px 32px", borderTop: "1px solid #23252a", background: "#08090a", marginTop: 0 }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 48 }}>
          <div style={{ maxWidth: 320 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <LogoMark size={22} />
              <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "Inter, sans-serif", color: "#f7f8f8", letterSpacing: 1 }}>CONTINUUM</span>
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
        <div style={{ maxWidth: 1060, margin: "40px auto 0", paddingTop: 20, borderTop: "1px solid #23252a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
      const [cockpitSection, setCockpitSection] = React.useState(null);
      const [audioPlayed, setAudioPlayed] = React.useState(false);
      const [showChime, setShowChime] = React.useState(false);
      const [paMuted, setPaMuted] = React.useState(false);
      const audioCtxRef = React.useRef(null);
      const paPlayedGlobal = React.useRef(false);


      // PA — plays ONCE ever per page load
      const playPA = React.useCallback(() => {
        if (paPlayedGlobal.current) return;
        paPlayedGlobal.current = true;
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
                  // Australian female voices by platform:
                  // Chrome: "Google Australian English"
                  // macOS/iOS: "Karen"
                  // Windows 11: "Microsoft Natasha"
                  // Others: any en-AU locale
                  const au = v.find(x => /karen/i.test(x.name))
                    || v.find(x => /natasha/i.test(x.name))
                    || v.find(x => /google australian english/i.test(x.name))
                    || v.find(x => /australian english/i.test(x.name))
                    || v.find(x => /catherine|matilda|zoe/i.test(x.name))
                    || v.find(x => /en[-_]au/i.test(x.lang))
                    || v.find(x => /en/i.test(x.lang) && x.name.toLowerCase().includes('female'))
                    || v.find(x => /en/i.test(x.lang));
                  if (au) u.voice = au;
                  u.onend = () => { setPaMuted(true); };
                  window.speechSynthesis.speak(u);
                };
                if (window.speechSynthesis.getVoices().length > 0) pick();
                else window.speechSynthesis.onvoiceschanged = pick;
              }
            } catch(e) {}
          }, 1200);
        } catch(e) {}
      }, []);

      React.useEffect(() => {
        const h = () => { playPA(); document.removeEventListener("click", h); document.removeEventListener("touchstart", h); };
        document.addEventListener("click", h); document.addEventListener("touchstart", h);
        return () => { document.removeEventListener("click", h); document.removeEventListener("touchstart", h); };
      }, [playPA]);




      const zones = [
        { id: "features", label: "Features", sub: "Flight Display", icon: "📊" },
        { id: "how-it-works", label: "How It Works", sub: "Navigation", icon: "🧭" },
        { id: "partners", label: "Partners", sub: "Comms Panel", icon: "📡" },
        { id: "about", label: "About", sub: "Autopilot", icon: "⚙️" },
        { id: "login", label: "Log In", sub: "Dashboard", icon: "🛫" },
      ];

      const renderSection = (id) => {
        if (id === "features") return (<div style={{ padding: "40px 0" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 2, background: "#23252a" }}>{[{ icon: "📊", t: "Unified Dashboard", d: "Every airline, hotel, and rental car program in one live view." },{ icon: "🧠", t: "AI Status Optimizer", d: "The fastest, cheapest path to the next tier. Mileage runs included." },{ icon: "💳", t: "Credit Card Intel", d: "Match cards to spending patterns and status goals automatically." },{ icon: "📈", t: "Year-End Projections", d: "See where you'll land Dec 31 with trips and promos factored in." },{ icon: "🔔", t: "Status Alerts", d: "Notified when you're close to a tier or a mileage run deal appears." },{ icon: "🧾", t: "Expense Tracking", d: "Log expenses, snap receipts, export clean reports." }].map((f, i) => (<div key={i} style={{ background: "#0f1011", padding: "28px 24px", borderLeft: "2px solid rgba(14,165,160,0.3)" }}><span style={{ fontSize: 24 }}>{f.icon}</span><h3 style={{ fontSize: 15, fontWeight: 600, color: "#f7f8f8", margin: "12px 0 8px" }}>{f.t}</h3><p style={{ fontSize: 13, color: "#8a8f98", lineHeight: 1.65 }}>{f.d}</p></div>))}</div></div>);
        if (id === "how-it-works") return (<div style={{ padding: "40px 0" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2, background: "#23252a" }}>{[{ s: "01", t: "Sign Up", d: "Free account in 30 seconds." },{ s: "02", t: "Import", d: "Connect loyalty accounts or enter manually." },{ s: "03", t: "AI Recs", d: "We analyze your patterns and show the path." },{ s: "04", t: "Hit Status", d: "Follow your roadmap. We track every mile." }].map((s, i) => (<div key={i} style={{ background: "#0f1011", padding: "28px 20px" }}><div style={{ fontSize: 32, fontFamily: "Space Mono, monospace", color: "#0EA5A0", fontWeight: 700, marginBottom: 12 }}>{s.s}</div><h3 style={{ fontSize: 15, fontWeight: 600, color: "#f7f8f8", margin: "0 0 8px" }}>{s.t}</h3><p style={{ fontSize: 13, color: "#8a8f98", lineHeight: 1.65 }}>{s.d}</p></div>))}</div></div>);
        if (id === "partners") return (<div style={{ padding: "40px 0" }}>{[{ cat: "Airlines", items: [{ n: "American Airlines", d: "aa.com" },{ n: "United Airlines", d: "united.com" },{ n: "Delta Air Lines", d: "delta.com" },{ n: "British Airways", d: "britishairways.com" },{ n: "Cathay Pacific", d: "cathaypacific.com" },{ n: "Japan Airlines", d: "jal.co.jp" },{ n: "Qantas", d: "qantas.com" },{ n: "Singapore Airlines", d: "singaporeair.com" },{ n: "Emirates", d: "emirates.com" },{ n: "Lufthansa", d: "lufthansa.com" },{ n: "Air France", d: "airfrance.com" },{ n: "Alaska Airlines", d: "alaskaair.com" }]},{ cat: "Hotels", items: [{ n: "Marriott Bonvoy", d: "marriott.com" },{ n: "Hilton Honors", d: "hilton.com" },{ n: "World of Hyatt", d: "hyatt.com" },{ n: "IHG One Rewards", d: "ihg.com" },{ n: "Accor Live Limitless", d: "accor.com" },{ n: "Wyndham Rewards", d: "wyndham.com" }]},{ cat: "Credit Cards", items: [{ n: "Amex Platinum", d: "americanexpress.com" },{ n: "Chase Sapphire Reserve", d: "chase.com" },{ n: "Citi Premier", d: "citi.com" },{ n: "Capital One Venture X", d: "capitalone.com" }]}].map(g => (<div key={g.cat} style={{ marginBottom: 36 }}><h3 style={{ fontSize: 11, fontFamily: "Space Mono, monospace", color: "#0EA5A0", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>{g.cat}</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>{g.items.map(item => (<div key={item.n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#141516", border: "1px solid #23252a", borderRadius: 8 }}><img src={`https://logo.clearbit.com/${item.d}`} alt="" style={{ width: 22, height: 22, borderRadius: 4, background: "#fff" }} onError={e => { e.target.style.display = "none"; }} /><span style={{ fontSize: 12, color: "#d0d6e0" }}>{item.n}</span></div>))}</div></div>))}</div>);
        if (id === "about") return (<div style={{ padding: "40px 0", maxWidth: 640 }}><p style={{ fontSize: 15, color: "#d0d6e0", lineHeight: 1.8, marginBottom: 20 }}>Continuum was born from frustration: tracking elite status across programs shouldn't require spreadsheets. We built the platform we wished existed.</p><p style={{ fontSize: 15, color: "#d0d6e0", lineHeight: 1.8, marginBottom: 28 }}>Based in Bermuda. Built by frequent flyers, reinsurance professionals, and travel obsessives.</p><div style={{ display: "flex", gap: 40 }}>{[{ v: "6", l: "Team" },{ v: "12M+", l: "Miles Tracked" },{ v: "2026", l: "Founded" }].map((s, i) => (<div key={i}><div style={{ fontSize: 24, fontFamily: "Space Mono, monospace", color: "#0EA5A0", fontWeight: 700 }}>{s.v}</div><div style={{ fontSize: 10, fontFamily: "Space Mono, monospace", color: "#62666d", letterSpacing: 1.5, marginTop: 2, textTransform: "uppercase" }}>{s.l}</div></div>))}</div></div>);
        if (id === "login") { goTo("login"); return null; }
        return null;
      };

      return (
        <div style={{ minHeight: "100vh", color: "#f7f8f8", fontFamily: "Inter, -apple-system, sans-serif", overflow: "hidden" }}>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
          {showChime && (<div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 300, background: "rgba(14,165,160,0.15)", border: "1px solid rgba(14,165,160,0.3)", borderRadius: 8, padding: "8px 20px", display: "flex", alignItems: "center", gap: 8 }}><span>🔔</span><span style={{ fontSize: 11, fontFamily: "Space Mono, monospace", color: "#0EA5A0", letterSpacing: 1 }}>FASTEN SEATBELT</span></div>)}

          {!cockpitSection ? (
            <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
              {/* Background image */}
              <img src="/cockpit.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", pointerEvents: "none", userSelect: "none" }} />

              {/* Clickable zone overlay — SVG matches cover scaling of the image */}
              <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden", zIndex: 5 }} viewBox="0 0 1772 1181" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <style>{`.cz{fill:rgba(255,255,255,0);stroke:rgba(255,255,255,0);stroke-width:2;stroke-dasharray:8 5;cursor:pointer;transition:fill .25s,stroke .25s}.czg:hover .cz{fill:rgba(255,255,255,0.06);stroke:rgba(255,255,255,0.4)}.ctt{opacity:0;pointer-events:none;transition:opacity .2s}.czg:hover .ctt{opacity:1}`}</style>
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
                {/* Blue → Log In  keyboard section x=766 y=855 w=230 h=133 */}
                <g className="czg" onClick={() => goTo("login")} style={{ cursor: "pointer" }}>
                  <rect className="cz" x={766} y={855} width={230} height={133} />
                  <g className="ctt">
                    <rect x={824} y={828} width={85} height={22} rx={4} fill="rgba(0,0,0,0.85)" />
                    <text x={866} y={843} fontSize={11} fill="#f0f0f0" textAnchor="middle" fontFamily="Space Mono, monospace" letterSpacing={2}>LOG IN</text>
                  </g>
                </g>
              </svg>

              {/* Logo + mute stacked top-left */}
              <div style={{ position: "absolute", top: 16, left: 20, zIndex: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <LogoMark size={24} />
                  <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "Instrument Serif, serif" }}>CONTINUUM</span>
                </div>
                {audioPlayed && !paMuted && (
                  <button
                    onClick={() => { window.speechSynthesis && window.speechSynthesis.cancel(); setPaMuted(true); }}
                    style={{ background: "rgba(8,8,12,0.75)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, backdropFilter: "blur(8px)", alignSelf: "flex-start" }}
                  >
                    <span style={{ fontSize: 12 }}>🔇</span>
                    <span style={{ fontSize: 9, fontFamily: "Space Mono, monospace", color: "#8a8f98", letterSpacing: 1 }}>MUTE PA</span>
                  </button>
                )}
              </div>

              {/* Flight code */}
              <div style={{ position: "absolute", top: 16, right: 20, zIndex: 20 }}>
                <span style={{ fontSize: 9, fontFamily: "Space Mono, monospace", color: "#0EA5A0", letterSpacing: 2 }}>CTM-2026</span>
              </div>

              {/* Instructions */}
              <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", zIndex: 10, textAlign: "center", pointerEvents: "none" }}>
                <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2.4rem)", fontFamily: "Instrument Serif, serif", fontWeight: 400, fontStyle: "italic", textShadow: "0 2px 20px rgba(0,0,0,0.7)", margin: 0 }}>
                  Your status. <span style={{ color: "#0EA5A0" }}>Your cockpit.</span>
                </h1>
                <p style={{ fontSize: 11, color: "#8a8f98", marginTop: 8, textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>
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
              <div style={{ padding: "20px 32px", borderBottom: "1px solid #23252a", display: "flex", alignItems: "center", gap: 16 }}>
                <button onClick={() => setCockpitSection(null)} style={{ background: "#141516", border: "1px solid #23252a", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontFamily: "Space Mono, monospace", color: "#8a8f98" }}>← Cockpit</button>
                <div><h1 style={{ fontSize: 18, fontWeight: 700, color: "#f7f8f8", margin: 0 }}>{zones.find(z => z.id === cockpitSection)?.label}</h1></div>
                <div style={{ marginLeft: "auto" }}><button onClick={() => goTo("login")} style={{ background: "#0EA5A0", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 11, fontFamily: "Space Mono, monospace", fontWeight: 700, color: "#000", letterSpacing: 1, textTransform: "uppercase" }}>Log In →</button></div>
              </div>
              <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 32px" }}>{renderSection(cockpitSection)}</div>
              <Footer />
            </div>
          )}
        </div>
      );
    }

    // ==================== LOGIN PAGE ====================
    return (
      <Shell showBg>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 200px)", padding: "36px 20px" }}>
          <div style={{
            width: "100%", maxWidth: 440, opacity: animateIn ? 1 : 0, transform: animateIn ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
          }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><LogoMark size={52} /></div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f7f8f8", margin: 0, letterSpacing: -0.5, fontFamily: "Inter, sans-serif" }}>Welcome Back</h1>
              <p style={{ color: "rgba(14,165,160,0.6)", fontSize: 13, marginTop: 6, fontFamily: "Inter, sans-serif" }}>Sign in to your Continuum account</p>
            </div>
            <div style={{
              background: "linear-gradient(135deg, rgba(14,165,160,0.06), rgba(0,0,0,0.02), rgba(14,165,160,0.04))",
              border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, padding: 30,
              backdropFilter: "blur(40px)", boxShadow: "0 25px 60px rgba(44,36,24,0.2), inset 0 1px 0 rgba(14,165,160,0.08)",
              position: "relative", overflow: "hidden",
            }}>
              <FlightPath style={{ top: 8, right: 8, width: 130, height: 28 }} />
              <div style={{ display: "flex", marginBottom: 24, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 3 }}>
                {["Sign In", "Register"].map((tab, i) => (
                  <button key={tab} onClick={() => setIsRegistering(i === 1)} style={{
                    flex: 1, padding: "9px 0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif",
                    background: (i === 0 ? !isRegistering : isRegistering) ? "rgba(14,165,160,0.2)" : "transparent",
                    color: (i === 0 ? !isRegistering : isRegistering) ? "#0EA5A0" : "#62666d", transition: "all 0.3s",
                  }}>{tab}</button>
                ))}
              </div>

              {!isRegistering ? (
                <div>
                  <label style={{ display: "block", marginBottom: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Email</span>
                    <input type="email" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} placeholder="alex@example.com"
                      style={{ display: "block", width: "100%", marginTop: 6, padding: "11px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                  </label>
                  <label style={{ display: "block", marginBottom: 22 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Password</span>
                    <input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••"
                      style={{ display: "block", width: "100%", marginTop: 6, padding: "11px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                  </label>
                  <button onClick={handleLogin} style={{
                    width: "100%", padding: "12px 0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Inter, sans-serif",
                    background: "linear-gradient(135deg, #0EA5A0, #0EA5A0)", color: "#f7f8f8", boxShadow: "0 4px 20px rgba(14,165,160,0.3)",
                  }}>Sign In</button>
                  <button onClick={() => { setLoginForm({ email: "alex@example.com", password: "demo" }); setTimeout(handleLogin, 100); }} style={{
                    width: "100%", padding: "10px 0", border: "1px solid rgba(14,165,160,0.2)", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif",
                    background: "rgba(255,255,255,0.03)", color: "#0EA5A0", marginTop: 10,
                  }}>Try Demo Account →</button>
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Full Name</span>
                    <input value={registerForm.name} onChange={e => setRegisterForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name"
                      style={{ display: "block", width: "100%", marginTop: 6, padding: "11px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                  </label>
                  <label style={{ display: "block", marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Email</span>
                    <input type="email" value={registerForm.email} onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))} placeholder="you@email.com"
                      style={{ display: "block", width: "100%", marginTop: 6, padding: "11px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                  </label>
                  <label style={{ display: "block", marginBottom: 22 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Password</span>
                    <input type="password" value={registerForm.password} onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••"
                      style={{ display: "block", width: "100%", marginTop: 6, padding: "11px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                  </label>
                  <button onClick={handleRegister} style={{
                    width: "100%", padding: "12px 0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Inter, sans-serif",
                    background: "linear-gradient(135deg, #0EA5A0, #0EA5A0)", color: "#f7f8f8", boxShadow: "0 4px 20px rgba(14,165,160,0.3)",
                  }}>Create Account</button>
                </div>
              )}

              <div style={{ textAlign: "center", marginTop: 18, padding: "12px 0 0", borderTop: "1px solid rgba(0,0,0,0.02)" }}>
                <p style={{ color: "#62666d", fontSize: 11, fontFamily: "Inter, sans-serif", margin: 0 }}>By signing in, you agree to our Terms of Service</p>
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
            { label: "Linked Programs", value: Object.keys(linkedAccounts).length, icon: "🔗", color: "#0EA5A0" },
            { label: "Planned Trips", value: totalTrips, icon: "🗺️", color: "#34d399" },
            { label: "Confirmed", value: confirmedTrips, icon: "✅", color: "#fbbf24" },
            { label: "Status Advances", value: willAdvanceCount, icon: "🚀", color: "#f472b6" },
          ].map((stat, i) => (
            <div key={i} style={{
              background: `linear-gradient(135deg, ${stat.color}08, rgba(0,0,0,0.02))`,
              border: `1px solid ${stat.color}15`, borderRadius: 8, padding: "18px 20px",
              display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "hidden",
              boxShadow: `0 4px 20px ${stat.color}08`,
            }}>
              <FlightPath color={stat.color} style={{ bottom: 4, left: 20, width: 120, height: 24 }} />
              <div style={{ fontSize: 28, position: "relative" }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "#8a8f98", fontWeight: 500, fontFamily: "Inter, sans-serif" }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Airline Status Cards */}
        {airlineStatuses.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#d0d6e0", marginBottom: 14, fontFamily: "Inter, sans-serif" }}>✈️ Airline Elite Status</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
              {airlineStatuses.map(p => {
                const s = p.status;
                const progress = s.nextTier ? (s.projected / s.nextTier.threshold) * 100 : 100;
                return (
                  <div key={p.id} onClick={() => { setSelectedProgram(p.id); setActiveView("programs"); }} style={{
                    background: `linear-gradient(135deg, ${p.color}15, ${p.accent}10)`, border: `1px solid ${p.color}30`,
                    borderRadius: 8, padding: 22, cursor: "pointer", transition: "all 0.3s",
                    boxShadow: `0 4px 25px ${p.color}10`, position: "relative", overflow: "hidden",
                  }}>
                    <FlightPath color={p.color} style={{ top: 6, right: 6, width: 100, height: 20 }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif", marginTop: 2 }}>
                          {s.currentTier ? s.currentTier.name : "Member"} → {s.nextTier?.name || "Top Tier"}
                        </div>
                      </div>
                      {s.willAdvance && <Badge color="#34d399" small>↑ Advancing!</Badge>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <ProgressRing progress={Math.min(progress, 100)} size={70} color={p.color} label={`${Math.round(progress)}%`} sublabel={p.unit} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8a8f98", marginBottom: 4, fontFamily: "Inter, sans-serif" }}>
                          <span>{s.projected.toLocaleString()} {p.unit}</span>
                          <span>{s.nextTier?.threshold.toLocaleString()}</span>
                        </div>
                        <MiniBar value={s.projected} max={s.nextTier?.threshold || s.projected} color={p.color} height={8} />
                        {s.tripBoosts > 0 && (
                          <div style={{ fontSize: 10, color: "#34d399", marginTop: 6, fontFamily: "Inter, sans-serif" }}>+{s.tripBoosts.toLocaleString()} from upcoming trips</div>
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
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#d0d6e0", marginBottom: 14, fontFamily: "Inter, sans-serif" }}>🏨 Hotel Elite Status</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
              {hotelStatuses.map(p => {
                const s = p.status;
                const progress = s.nextTier ? (s.projected / s.nextTier.threshold) * 100 : 100;
                return (
                  <div key={p.id} onClick={() => { setSelectedProgram(p.id); setActiveView("programs"); }} style={{
                    background: `linear-gradient(135deg, ${p.color}15, ${p.accent}10)`, border: `1px solid ${p.color}30`,
                    borderRadius: 8, padding: 22, cursor: "pointer", transition: "all 0.3s",
                    boxShadow: `0 4px 25px ${p.color}10`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif", marginTop: 2 }}>
                          {s.currentTier ? s.currentTier.name : "Member"} • {s.current} nights YTD
                        </div>
                      </div>
                      {s.willAdvance && <Badge color="#34d399" small>↑ Tier Up!</Badge>}
                    </div>
                    <MiniBar value={s.projected} max={s.nextTier?.threshold || s.projected} color={p.color} height={8} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#62666d", marginTop: 6, fontFamily: "Inter, sans-serif" }}>
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
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#d0d6e0", margin: 0, fontFamily: "Inter, sans-serif" }}>📅 Upcoming Trips</h3>
            <button onClick={() => setActiveView("trips")} style={{
              background: "none", border: "none", color: "#0EA5A0", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>View All →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {trips.slice(0, 4).map(trip => {
              const prog = allPrograms.find(p => p.id === trip.program);
              return (
                <div key={trip.id} style={{
                  background: "linear-gradient(135deg, rgba(14,165,160,0.02), rgba(0,0,0,0.02))", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "14px 18px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{trip.type === "flight" ? "✈️" : trip.type === "hotel" ? "🏨" : "🚗"}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{trip.route || trip.property || trip.location}</div>
                      <div style={{ fontSize: 11, color: "#62666d", fontFamily: "Inter, sans-serif" }}>{trip.date} • {prog?.name}</div>
                    </div>
                  </div>
                  <Badge color={trip.status === "confirmed" ? "#34d399" : trip.status === "planned" ? "#fbbf24" : "#0EA5A0"} small>
                    {trip.status}
                  </Badge>
                </div>
              );
            })}
            {trips.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#62666d", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
                No trips yet. Add your first trip to start tracking! ✈️
              </div>
            )}
          </div>
        </div>

        {/* Credit Card Recommendations - Monetization */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#d0d6e0", margin: 0, fontFamily: "Inter, sans-serif" }}>💳 Recommended Cards</h3>
            <Badge color="#fbbf24" small>SPONSORED</Badge>
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
            {CREDIT_CARD_OFFERS.slice(0, 3).map((card, i) => (
              <div key={i} style={{
                minWidth: 220, background: `linear-gradient(135deg, ${card.color}20, ${card.color}08)`, border: `1px solid ${card.color}30`,
                borderRadius: 8, padding: 18, flex: "0 0 auto",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif", marginBottom: 6 }}>{card.name}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fbbf24", fontFamily: "Inter, sans-serif", marginBottom: 4 }}>{card.bonus}</div>
                <div style={{ fontSize: 10, color: "#8a8f98", fontFamily: "Inter, sans-serif", marginBottom: 10 }}>Spend {card.spend} • {card.fee}</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {card.tags.map((tag, j) => <Badge key={j} color={card.color || "#0EA5A0"} small>{tag}</Badge>)}
                </div>
                <button style={{
                  width: "100%", marginTop: 12, padding: "8px 0", borderRadius: 8, border: `1px solid ${card.color}40`, background: "rgba(255,255,255,0.03)",
                  color: "#f7f8f8", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
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
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f7f8f8", margin: 0, fontFamily: "Inter, sans-serif" }}>Loyalty Programs</h2>
            <p style={{ color: "#8a8f98", fontSize: 12, margin: "4px 0 0", fontFamily: "Inter, sans-serif" }}>Link and manage all your accounts</p>
          </div>
          <button onClick={() => setShowAddProgram(true)} style={{
            padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif",
            background: "linear-gradient(135deg, #0EA5A0, #0EA5A0)", color: "#f7f8f8", boxShadow: "0 4px 15px rgba(14,165,160,0.3)",
          }}>+ Add Program</button>
        </div>

        {categories.map((cat, ci) => (
          <div key={ci} style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#d0d6e0", marginBottom: 12, fontFamily: "Inter, sans-serif" }}>{cat.icon} {cat.label}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
              {cat.programs.map(prog => {
                const isLinked = !!linkedAccounts[prog.id];
                const status = isLinked ? getProjectedStatus(prog.id) : null;
                const isCard = cat.label === "Credit Cards";

                return (
                  <div key={prog.id} style={{
                    background: isLinked ? `linear-gradient(135deg, ${prog.color}12, ${prog.accent || prog.color}08)` : "rgba(0,0,0,0.02)",
                    border: `1px solid ${isLinked ? prog.color + "30" : "rgba(0,0,0,0.03)"}`,
                    borderRadius: 8, padding: 22, transition: "all 0.3s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 26 }}>{prog.logo}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{prog.name}</div>
                          {isLinked && !isCard && <div style={{ fontSize: 11, color: "#62666d", fontFamily: "Inter, sans-serif" }}>
                            ID: {linkedAccounts[prog.id].memberId}
                          </div>}
                          {isCard && <div style={{ fontSize: 11, color: "#62666d", fontFamily: "Inter, sans-serif" }}>{prog.annualFee ? `$${prog.annualFee}/yr` : ""}</div>}
                        </div>
                      </div>
                      {isLinked ? <Badge color="#34d399" small>Linked</Badge> : <Badge color="rgba(0,0,0,0.2)" small>Not Linked</Badge>}
                    </div>

                    {isLinked && status && !isCard && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8a8f98", marginBottom: 6, fontFamily: "Inter, sans-serif" }}>
                          <span>Current: {status.currentTier?.name || "Member"}</span>
                          <span>Next: {status.nextTier?.name}</span>
                        </div>
                        <MiniBar value={status.projected} max={status.nextTier?.threshold || status.projected} color={prog.color} height={8} />
                        <div style={{ fontSize: 10, color: "#62666d", marginTop: 4, fontFamily: "Inter, sans-serif" }}>
                          {status.projected.toLocaleString()} / {(status.nextTier?.threshold || status.projected).toLocaleString()} {prog.unit}
                          {status.willAdvance && <span style={{ color: "#34d399", marginLeft: 8 }}>🎉 On track to advance!</span>}
                        </div>
                      </div>
                    )}

                    {isCard && isLinked && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>
                          {(linkedAccounts[prog.id]?.pointsBalance || 0).toLocaleString()} pts
                        </div>
                        <div style={{ fontSize: 11, color: "#62666d", fontFamily: "Inter, sans-serif", marginTop: 2 }}>{prog.perks}</div>
                      </div>
                    )}

                    {!isCard && prog.tiers && (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
                        {prog.tiers.map((tier, ti) => (
                          <Badge key={ti} color={status?.currentTier?.name === tier.name ? prog.color : "rgba(0,0,0,0.04)"} small>
                            {tier.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {isLinked ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <span style={{
                          flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid rgba(14,165,160,0.1)",
                          background: "rgba(255,255,255,0.03)", color: "#8a8f98",
                          fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif", textAlign: "center",
                        }}>✓ Connected</span>
                        {prog.loginUrl && (
                          <a href={prog.loginUrl} target="_blank" rel="noopener noreferrer" style={{
                            padding: "9px 14px", borderRadius: 8, border: `1px solid ${prog.color}40`,
                            background: `${prog.color}15`, color: "#f7f8f8", textDecoration: "none",
                            fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4,
                          }}>View ↗</a>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => (setShowLinkModal(prog.id), setLinkForm({ memberId: "" }))} style={{
                        width: "100%", padding: "9px 0", borderRadius: 8, border: `1px solid ${prog.color + "40"}`,
                        background: `${prog.color}15`, color: "#f7f8f8",
                        fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.3s",
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
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f7f8f8", margin: 0, fontFamily: "Inter, sans-serif" }}>Annual Travel Plan</h2>
          <p style={{ color: "#8a8f98", fontSize: 12, margin: "4px 0 0", fontFamily: "Inter, sans-serif" }}>{trips.length} trips planned for 2026</p>
        </div>
        <button onClick={() => setShowAddTrip(true)} style={{
          padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif",
          background: "linear-gradient(135deg, #0EA5A0, #0EA5A0)", color: "#f7f8f8", boxShadow: "0 4px 15px rgba(14,165,160,0.3)",
        }}>+ Add Trip</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search trips..."
          style={{
            padding: "8px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(14,165,160,0.1)",
            borderRadius: 8, color: "#f7f8f8", fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", flex: 1, minWidth: 160,
          }} />
        {["all", "confirmed", "planned", "wishlist"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif",
            background: filterStatus === s ? "rgba(14,165,160,0.2)" : "rgba(0,0,0,0.02)",
            color: filterStatus === s ? "#0EA5A0" : "rgba(0,0,0,0.3)", textTransform: "capitalize",
          }}>{s}</button>
        ))}
      </div>

      {/* Trip Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filteredTrips.map(trip => {
          const prog = allPrograms.find(p => p.id === trip.program);
          return (
            <div key={trip.id} style={{
              background: "linear-gradient(135deg, rgba(14,165,160,0.02), rgba(0,0,0,0.02))", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "16px 20px",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                  background: prog ? `${prog.color}15` : "rgba(0,0,0,0.02)",
                }}>{trip.type === "flight" ? "✈️" : trip.type === "hotel" ? "🏨" : "🚗"}</div>
                <div>
                  {trip.tripName && <div style={{ fontSize: 13, fontWeight: 700, color: "#0EA5A0", fontFamily: "Inter, sans-serif", marginBottom: 2 }}>{trip.tripName}</div>}
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{trip.route || trip.property || trip.location}</div>
                  <div style={{ fontSize: 11, color: "#62666d", fontFamily: "Inter, sans-serif", marginTop: 2 }}>
                    {trip.date} • {prog?.name || "Unknown"} {trip.nights ? `• ${trip.nights} nights` : ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {trip.estimatedPoints > 0 && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24", fontFamily: "Inter, sans-serif" }}>+{trip.estimatedPoints.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: "#62666d", fontFamily: "Inter, sans-serif" }}>points</div>
                  </div>
                )}
                {trip.estimatedNights > 0 && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#34d399", fontFamily: "Inter, sans-serif" }}>+{trip.estimatedNights}</div>
                    <div style={{ fontSize: 10, color: "#62666d", fontFamily: "Inter, sans-serif" }}>nights</div>
                  </div>
                )}
                <Badge color={trip.status === "confirmed" ? "#34d399" : trip.status === "planned" ? "#fbbf24" : "#0EA5A0"} small>{trip.status}</Badge>
                <button onClick={() => removeTrip(trip.id)} style={{
                  width: 28, height: 28, borderRadius: 8, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444",
                  fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>×</button>
              </div>
            </div>
          );
        })}
        {filteredTrips.length === 0 && (
          <div style={{ textAlign: "center", padding: 50, color: "#62666d", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
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
            background: "none", border: "none", color: "#0EA5A0", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", marginBottom: 16, padding: 0,
          }}>← Back to All Trips</button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f7f8f8", margin: 0, fontFamily: "Inter, sans-serif" }}>
                {trip.type === "flight" ? "✈️" : trip.type === "hotel" ? "🏨" : "🚗"} {getTripName(trip)}
              </h2>
              <p style={{ color: "#8a8f98", fontSize: 12, margin: "4px 0 0", fontFamily: "Inter, sans-serif" }}>
                {trip.date} • {prog?.name} • {tripExps.length} expenses
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowExpenseReport(trip.id)} style={{
                padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(14,165,160,0.3)", background: "rgba(14,165,160,0.08)",
                color: "#0EA5A0", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>📄 Generate Report</button>
              <button onClick={() => setShowAddExpense(trip.id)} style={{
                padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "Inter, sans-serif",
                background: "linear-gradient(135deg, #0EA5A0, #0EA5A0)", color: "#f7f8f8",
              }}>+ Add Expense</button>
            </div>
          </div>

          {/* Trip expense summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
            <div style={{ background: "rgba(14,165,160,0.08)", border: "1px solid rgba(14,165,160,0.2)", borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>${tripTotal.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>Total Spend</div>
            </div>
            <div style={{ background: "linear-gradient(135deg, rgba(14,165,160,0.02), rgba(0,0,0,0.02))", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{tripExps.length}</div>
              <div style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>Expenses</div>
            </div>
            <div style={{ background: "linear-gradient(135deg, rgba(14,165,160,0.02), rgba(0,0,0,0.02))", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{tripExps.filter(e => e.receipt).length}</div>
              <div style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>With Receipts</div>
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
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>
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
                  background: "linear-gradient(135deg, rgba(14,165,160,0.02), rgba(0,0,0,0.02))", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "14px 18px",
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, background: `${cat?.color || "#666"}15`, flexShrink: 0,
                    }}>{cat?.icon || "📎"}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f7f8f8", fontFamily: "Inter, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description}</div>
                      <div style={{ fontSize: 11, color: "#62666d", fontFamily: "Inter, sans-serif" }}>
                        {exp.date} • {exp.paymentMethod || "—"} {exp.receipt ? "• 🧾" : ""} {exp.notes ? `• ${exp.notes}` : ""}
                      </div>
                      {exp.receiptImage?.data && exp.receiptImage.type?.startsWith("image/") && (
                        <img src={exp.receiptImage.data} alt="Receipt" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 8, marginTop: 4, border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}
                          onClick={(e) => { e.stopPropagation(); window.open(exp.receiptImage.data, "_blank"); }} title="Click to view full receipt" />
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: exp.amount === 0 ? "#34d399" : "#FFFFFF", fontFamily: "Inter, sans-serif" }}>
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
              <div style={{ textAlign: "center", padding: 40, color: "#62666d", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
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
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f7f8f8", margin: 0, fontFamily: "Inter, sans-serif" }}>Trip Expenses</h2>
            <p style={{ color: "#8a8f98", fontSize: 12, margin: "4px 0 0", fontFamily: "Inter, sans-serif" }}>Track spending across all your trips</p>
          </div>
        </div>

        {/* Grand total stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
          <div style={{ background: "rgba(14,165,160,0.08)", border: "1px solid rgba(14,165,160,0.2)", borderRadius: 8, padding: 18 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>${grandTotal.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>Total Across All Trips</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, rgba(14,165,160,0.02), rgba(0,0,0,0.02))", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: 18 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{expenses.length}</div>
            <div style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>Total Expenses</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, rgba(14,165,160,0.02), rgba(0,0,0,0.02))", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: 18 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{tripsWithExpenses.filter(t => t.total > 0).length}</div>
            <div style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>Trips With Expenses</div>
          </div>
        </div>

        {/* Spending by category */}
        {totalByCategory.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#d0d6e0", marginBottom: 12, fontFamily: "Inter, sans-serif" }}>Spending by Category</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {totalByCategory.map((cat, i) => (
                <div key={i} style={{ background: `${cat.color}10`, border: `1px solid ${cat.color}25`, borderRadius: 8, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{cat.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>${cat.total.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>{cat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trip-by-trip list */}
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#d0d6e0", marginBottom: 12, fontFamily: "Inter, sans-serif" }}>Expenses by Trip</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {trips.map(trip => {
            const tripExps = getTripExpenses(trip.id);
            const tripTotal = getTripTotal(trip.id);
            const prog = allPrograms.find(p => p.id === trip.program);
            return (
              <div key={trip.id} style={{
                background: "linear-gradient(135deg, rgba(14,165,160,0.02), rgba(0,0,0,0.02))", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "16px 20px",
                cursor: "pointer", transition: "all 0.2s",
              }} onClick={() => setExpenseViewTrip(trip.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                      background: prog ? `${prog.color}15` : "rgba(0,0,0,0.02)",
                    }}>{trip.type === "flight" ? "✈️" : trip.type === "hotel" ? "🏨" : "🚗"}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{getTripName(trip)}</div>
                      <div style={{ fontSize: 11, color: "#62666d", fontFamily: "Inter, sans-serif" }}>
                        {trip.date} • {tripExps.length} expense{tripExps.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: tripTotal > 0 ? "#fff" : "rgba(0,0,0,0.15)", fontFamily: "Inter, sans-serif" }}>
                        {tripTotal > 0 ? `$${tripTotal.toLocaleString()}` : "—"}
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setShowAddExpense(trip.id); }} style={{
                      width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(14,165,160,0.2)", background: "rgba(14,165,160,0.06)",
                      color: "#0EA5A0", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>+</button>
                    <span style={{ color: "rgba(0,0,0,0.08)", fontSize: 14 }}>→</span>
                  </div>
                </div>
              </div>
            );
          })}
          {trips.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#62666d", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
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
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f7f8f8", margin: 0, fontFamily: "Inter, sans-serif" }}>Trip Optimizer</h2>
            <p style={{ color: "#8a8f98", fontSize: 12, margin: "4px 0 0", fontFamily: "Inter, sans-serif" }}>See how crediting flights differently affects your status</p>
          </div>
          <Badge color="#f59e0b">★ PREMIUM</Badge>
        </div>

        {user?.tier !== "premium" ? (
          <div style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(14,165,160,0.08))", border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 8, padding: 40, textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#f7f8f8", fontFamily: "Inter, sans-serif", margin: "0 0 8px" }}>Unlock Trip Optimizer</h3>
            <p style={{ color: "#8a8f98", fontSize: 13, fontFamily: "Inter, sans-serif", maxWidth: 400, margin: "0 auto 24px" }}>
              See the optimal way to credit each flight across your airline programs. Find hidden status shortcuts and maximize every trip.
            </p>
            <button onClick={() => setShowUpgrade(true)} style={{
              padding: "12px 32px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Inter, sans-serif",
              background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#f7f8f8", boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
            }}>Upgrade to Premium — $9.99/mo</button>
          </div>
        ) : (
          <div>
            <div style={{
              background: "linear-gradient(135deg, rgba(14,165,160,0.02), rgba(0,0,0,0.02))", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: 22, marginBottom: 20,
            }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif", marginBottom: 14 }}>Optimal Credit Strategy for 2026</h4>
              <div style={{ fontSize: 12, color: "#8a8f98", fontFamily: "Inter, sans-serif", marginBottom: 16 }}>
                Based on your {scenarioTrips.length} planned flights, here's the best way to allocate credits:
              </div>
              {LOYALTY_PROGRAMS.airlines.map(airline => {
                const airlineTrips = trips.filter(t => t.program === airline.id && t.type === "flight");
                const totalPts = airlineTrips.reduce((sum, t) => sum + (t.estimatedPoints || 0), 0);
                const status = getProjectedStatus(airline.id);
                return (
                  <div key={airline.id} style={{
                    background: `${airline.color}10`, border: `1px solid ${airline.color}20`, borderRadius: 8, padding: 16, marginBottom: 10,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{airline.name}</div>
                        <div style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>
                          {airlineTrips.length} flights • +{totalPts.toLocaleString()} pts projected
                        </div>
                      </div>
                      {status?.willAdvance && <Badge color="#34d399">Will advance to {status.projectedTier.name}!</Badge>}
                      {status && !status.willAdvance && status.nextTier && (
                        <div style={{ fontSize: 11, color: "#fbbf24", fontFamily: "Inter, sans-serif" }}>
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
              borderRadius: 8, padding: 22,
            }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#34d399", fontFamily: "Inter, sans-serif", marginBottom: 10 }}>💡 Optimizer Recommendations</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Consider crediting your LAX→ATL flight to AA instead of Delta to push closer to Platinum Pro",
                  "Your Tokyo trip alone could earn 48 Marriott nights with the right booking strategy",
                  "Add one more Hilton stay (3+ nights) to lock in Diamond status for 2027",
                  "Your Amex Platinum earns 5x on flights — ensure all bookings use this card",
                ].map((tip, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 14px", fontSize: 12,
                    color: "#d0d6e0", fontFamily: "Inter, sans-serif", display: "flex", gap: 8,
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
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f7f8f8", margin: 0, fontFamily: "Inter, sans-serif" }}>Annual Reports</h2>
            <p style={{ color: "#8a8f98", fontSize: 12, margin: "4px 0 0", fontFamily: "Inter, sans-serif" }}>Your 2026 travel year at a glance</p>
          </div>
          <button onClick={() => setShowUpgrade(true)} style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)",
            color: "#f59e0b", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
          }}>★ Export PDF — Premium</button>
        </div>

        {/* Bar Chart */}
        <div style={{ background: "linear-gradient(135deg, rgba(14,165,160,0.02), rgba(0,0,0,0.02))", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: 22, marginBottom: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif", marginBottom: 18 }}>Points Earned by Month</h4>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140 }}>
            {monthlyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 9, color: "#fbbf24", fontWeight: 600, fontFamily: "Inter, sans-serif" }}>
                  {d.points > 0 ? `${(d.points / 1000).toFixed(1)}k` : ""}
                </div>
                <div style={{
                  width: "100%", maxWidth: 32, height: `${Math.max((d.points / maxPts) * 100, 3)}%`, minHeight: 3,
                  borderRadius: "4px 4px 0 0", background: d.points > 0 ? "linear-gradient(180deg, #0EA5A0, #0EA5A0)" : "rgba(0,0,0,0.02)",
                  transition: "height 1s ease",
                }} />
                <span style={{ fontSize: 9, color: "#62666d", fontFamily: "Inter, sans-serif" }}>{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Total Points Projected", value: trips.reduce((s, t) => s + (t.estimatedPoints || 0), 0).toLocaleString(), icon: "⭐", color: "#fbbf24" },
            { label: "Hotel Nights Planned", value: trips.reduce((s, t) => s + (t.estimatedNights || t.nights || 0), 0), icon: "🌙", color: "#0EA5A0" },
            { label: "Flights Planned", value: trips.filter(t => t.type === "flight").length, icon: "✈️", color: "#34d399" },
            { label: "Est. Travel Spend", value: "$" + (trips.length * 850).toLocaleString(), icon: "💰", color: "#f472b6" },
          ].map((stat, i) => (
            <div key={i} style={{
              background: `${stat.color}08`, border: `1px solid ${stat.color}20`, borderRadius: 8, padding: 20,
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Status Forecast */}
        <div style={{ background: "linear-gradient(135deg, rgba(14,165,160,0.02), rgba(0,0,0,0.02))", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: 22 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif", marginBottom: 14 }}>Year-End Status Forecast</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 10 }}>
            {allPrograms.filter(p => linkedAccounts[p.id] && p.tiers).map(prog => {
              const status = getProjectedStatus(prog.id);
              if (!status) return null;
              return (
                <div key={prog.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8,
                  background: "linear-gradient(135deg, rgba(14,165,160,0.02), rgba(0,0,0,0.02))", border: "1px solid rgba(0,0,0,0.02)",
                }}>
                  <span style={{ fontSize: 20 }}>{prog.logo}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{prog.name}</div>
                    <div style={{ fontSize: 10, color: "#62666d", fontFamily: "Inter, sans-serif" }}>
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
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f7f8f8", margin: 0, fontFamily: "Inter, sans-serif" }}>Continuum Premium</h2>
        <p style={{ color: "#8a8f98", fontSize: 14, fontFamily: "Inter, sans-serif", marginTop: 6 }}>Maximize every mile, every night, every point.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 36 }}>
        {[
          { name: "Free", price: "$0", period: "forever", color: "rgba(0,0,0,0.03)", features: ["3 linked programs", "Basic dashboard", "Manual trip entry", "Annual summary", "Community support"] },
          { name: "Premium", price: "$9.99", period: "/month", color: "#0EA5A0", popular: true, features: ["Unlimited programs", "Trip Optimizer AI", "Status match alerts", "PDF reports & exports", "Credit card recommendations", "Mileage expiration alerts", "Priority support", "Ad-free experience"] },
          { name: "Pro", price: "$24.99", period: "/month", color: "#f59e0b", features: ["Everything in Premium", "API access & integrations", "Multi-year status tracking", "Tax deduction reports", "Team/family accounts", "White-label option", "Dedicated account manager", "Custom analytics"] },
        ].map((plan, i) => (
          <div key={i} style={{
            background: plan.popular ? `linear-gradient(135deg, ${plan.color}15, ${plan.color}08)` : "rgba(0,0,0,0.02)",
            border: `1px solid ${plan.popular ? plan.color + "40" : "rgba(0,0,0,0.03)"}`,
            borderRadius: 8, padding: 28, position: "relative", overflow: "hidden",
          }}>
            {plan.popular && (
              <div style={{
                position: "absolute", top: 14, right: -28, background: plan.color, color: "#f7f8f8", fontSize: 10, fontWeight: 700,
                padding: "4px 36px", transform: "rotate(45deg)", fontFamily: "Inter, sans-serif",
              }}>POPULAR</div>
            )}
            <div style={{ fontSize: 16, fontWeight: 700, color: plan.popular ? "#0EA5A0" : "#FFFFFF", fontFamily: "Inter, sans-serif", marginBottom: 6 }}>{plan.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 18 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{plan.price}</span>
              <span style={{ fontSize: 13, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>{plan.period}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
              {plan.features.map((f, fi) => (
                <div key={fi} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#d0d6e0", fontFamily: "Inter, sans-serif" }}>
                  <span style={{ color: plan.popular ? "#0EA5A0" : "#34d399", fontSize: 13 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <button style={{
              width: "100%", padding: "12px 0", borderRadius: 8, border: plan.popular ? "none" : "1px solid rgba(0,0,0,0.03)",
              background: plan.popular ? `linear-gradient(135deg, #0EA5A0, #0EA5A0)` : "rgba(0,0,0,0.02)",
              color: "#f7f8f8", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif",
              boxShadow: plan.popular ? "0 4px 20px rgba(14,165,160,0.3)" : "none",
            }}>{plan.price === "$0" ? "Current Plan" : "Upgrade Now"}</button>
          </div>
        ))}
      </div>

      {/* Feature Highlights */}
      <div style={{
        background: "linear-gradient(135deg, rgba(14,165,160,0.02), rgba(0,0,0,0.02))", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: 24,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif", marginBottom: 16 }}>Why Go Premium?</h3>
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
              background: "linear-gradient(135deg, rgba(14,165,160,0.02), rgba(0,0,0,0.02))", borderRadius: 8, padding: 16,
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif", marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>{f.desc}</div>
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
      minHeight: "100vh", background: "#08090a",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#f7f8f8", display: "flex", position: "relative",
    }}>
      <TravelAtmosphere />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <aside style={{
        width: 220, minHeight: "100vh",
        background: "#0f1011",
        borderRight: "1px solid #23252a",
        padding: "20px 12px", display: "flex", flexDirection: "column", flexShrink: 0,
        position: "sticky", top: 0, height: "100vh", overflowY: "auto", boxSizing: "border-box",
        backdropFilter: "blur(20px)", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 28 }}>
          <LogoMark size={28} />
          <span style={{ fontSize: 17, fontWeight: 800, fontFamily: "Inter, sans-serif", letterSpacing: -0.3 }}>Continuum</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: activeView === item.id ? "rgba(14,165,160,0.12)" : "transparent",
              color: activeView === item.id ? "#0EA5A0" : "rgba(0,0,0,0.3)",
              fontSize: 13, fontWeight: activeView === item.id ? 600 : 500, fontFamily: "Inter, sans-serif", textAlign: "left", transition: "all 0.2s", width: "100%",
            }}>
              <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{item.icon}</span>
              {item.label}
              {item.id === "premium" && <span style={{ marginLeft: "auto", fontSize: 9, background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "1px 6px", borderRadius: 8, fontWeight: 700 }}>PRO</span>}
            </button>
          ))}
        </nav>

        {/* User Card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(14,165,160,0.08), rgba(0,0,0,0.02))",
          border: "1px solid rgba(14,165,160,0.08)", borderRadius: 8, padding: 14, marginTop: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #0EA5A0, #0EA5A0)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
            }}>{user?.avatar || "U"}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: "#62666d", fontFamily: "Inter, sans-serif" }}>{user?.tier === "premium" ? "Premium" : "Free Plan"}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: "100%", padding: "7px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.03)",
            color: "#62666d", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
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

        {/* Page Header — clean text, no hero image */}
        <div style={{ marginBottom: 20, padding: "4px 0" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f7f8f8", margin: 0, fontFamily: "Inter, sans-serif" }}>
            {activeView === "dashboard" ? `Welcome back, ${user?.name?.split(" ")[0]}` : navItems.find(n => n.id === activeView)?.label}
          </h1>
          <p style={{ fontSize: 12, color: "rgba(14,165,160,0.6)", fontFamily: "Inter, sans-serif", marginTop: 4 }}>
            {activeView === "dashboard" ? `${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · ${Object.keys(linkedAccounts).length} programs tracked` :
            activeView === "programs" ? "Link and manage all your loyalty accounts" :
            activeView === "trips" ? "Plan, track, and optimize your upcoming travel" :
            activeView === "expenses" ? "Track spending and receipts across every trip" :
            activeView === "optimizer" ? "AI-powered recommendations to maximize your status" :
            activeView === "reports" ? "Insights and analytics across all programs" :
            activeView === "premium" ? "Unlock the full power of Continuum" : ""}
          </p>
          <div style={{ width: 30, height: 2, borderRadius: 0, background: "#0EA5A0", marginTop: 10 }} />
        </div>

        {/* View Content */}
        {viewRenderers[activeView]?.()}
      </main>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Add Trip Modal */}
      {showAddTrip && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={() => setShowAddTrip(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "linear-gradient(135deg, #141516, #191a1b)", border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, padding: 28, width: "100%", maxWidth: 440,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#f7f8f8", margin: "0 0 20px", fontFamily: "Inter, sans-serif" }}>Add Trip</h3>

            {/* Trip Name */}
            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Trip Name</span>
              <input value={newTrip.tripName} onChange={e => setNewTrip(p => ({ ...p, tripName: e.target.value }))}
                placeholder="e.g. London Spring Getaway, Tokyo Anniversary"
                style={{
                  display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
                }} />
            </label>

            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {["flight", "hotel", "rental"].map(type => (
                <button key={type} onClick={() => setNewTrip(p => ({ ...p, type, program: type === "flight" ? "aa" : type === "hotel" ? "marriott" : "hertz" }))} style={{
                  flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif",
                  background: newTrip.type === type ? "rgba(14,165,160,0.2)" : "rgba(0,0,0,0.02)",
                  color: newTrip.type === type ? "#0EA5A0" : "rgba(0,0,0,0.3)", textTransform: "capitalize",
                }}>{type === "flight" ? "✈️" : type === "hotel" ? "🏨" : "🚗"} {type}</button>
              ))}
            </div>

            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Program</span>
              <select value={newTrip.program} onChange={e => setNewTrip(p => ({ ...p, program: e.target.value }))} style={{
                display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(14,165,160,0.1)",
                borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
              }}>
                {(newTrip.type === "flight" ? [...LOYALTY_PROGRAMS.airlines, ...customPrograms.filter(p => p.category === "airline")] : newTrip.type === "hotel" ? [...LOYALTY_PROGRAMS.hotels, ...customPrograms.filter(p => p.category === "hotel")] : [...LOYALTY_PROGRAMS.rentals, ...customPrograms.filter(p => p.category === "rental")]).map(p => (
                  <option key={p.id} value={p.id} style={{ background: "linear-gradient(135deg, #141516, #191a1b)" }}>{p.name}</option>
                ))}
              </select>
            </label>

            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>
                {newTrip.type === "flight" ? "Route" : newTrip.type === "hotel" ? "Property" : "Location"}
              </span>
              <input value={newTrip.route} onChange={e => setNewTrip(p => ({ ...p, route: e.target.value, property: e.target.value, location: e.target.value }))}
                placeholder={newTrip.type === "flight" ? "JFK → LAX" : newTrip.type === "hotel" ? "Hotel name" : "City"}
                style={{
                  display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
                }} />
            </label>

            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <label style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Date</span>
                <input type="date" value={newTrip.date} onChange={e => setNewTrip(p => ({ ...p, date: e.target.value }))} style={{
                  display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
                }} />
              </label>
              {newTrip.type === "flight" && (
                <label style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Class</span>
                  <select value={newTrip.class} onChange={e => setNewTrip(p => ({ ...p, class: e.target.value }))} style={{
                    display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
                  }}>
                    <option value="domestic" style={{ background: "linear-gradient(135deg, #141516, #191a1b)" }}>Domestic Economy</option>
                    <option value="international" style={{ background: "linear-gradient(135deg, #141516, #191a1b)" }}>International</option>
                    <option value="premium" style={{ background: "linear-gradient(135deg, #141516, #191a1b)" }}>Premium / Business</option>
                  </select>
                </label>
              )}
              {newTrip.type === "hotel" && (
                <label style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Nights</span>
                  <input type="number" min={1} value={newTrip.nights} onChange={e => setNewTrip(p => ({ ...p, nights: parseInt(e.target.value) || 1 }))} style={{
                    display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
                  }} />
                </label>
              )}
            </div>

            <label style={{ display: "block", marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Status</span>
              <select value={newTrip.status} onChange={e => setNewTrip(p => ({ ...p, status: e.target.value }))} style={{
                display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
              }}>
                <option value="confirmed" style={{ background: "linear-gradient(135deg, #141516, #191a1b)" }}>Confirmed</option>
                <option value="planned" style={{ background: "linear-gradient(135deg, #141516, #191a1b)" }}>Planned</option>
                <option value="wishlist" style={{ background: "linear-gradient(135deg, #141516, #191a1b)" }}>Wishlist</option>
              </select>
            </label>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAddTrip(false)} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid rgba(14,165,160,0.1)", background: "rgba(255,255,255,0.03)",
                color: "#8a8f98", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Cancel</button>
              <button onClick={handleAddTrip} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif",
                background: "linear-gradient(135deg, #0EA5A0, #0EA5A0)", color: "#f7f8f8",
              }}>Add Trip</button>
            </div>
          </div>
        </div>
      )}

      {/* Link Account Modal */}
      {showLinkModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={() => setShowLinkModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "linear-gradient(135deg, #141516, #191a1b)", border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, padding: 28, width: "100%", maxWidth: 400,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#f7f8f8", margin: "0 0 6px", fontFamily: "Inter, sans-serif" }}>Link Account</h3>
            <p style={{ color: "#8a8f98", fontSize: 12, margin: "0 0 20px", fontFamily: "Inter, sans-serif" }}>
              Connect your {allPrograms.find(p => p.id === showLinkModal)?.name || "loyalty"} account
            </p>

            <label style={{ display: "block", marginBottom: 18 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Member ID</span>
              <input value={linkForm.memberId} onChange={e => setLinkForm(p => ({ ...p, memberId: e.target.value }))} placeholder="Enter your member number"
                style={{
                  display: "block", width: "100%", marginTop: 6, padding: "12px 14px", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
                }} />
            </label>
            <p style={{ fontSize: 10, color: "#62666d", fontFamily: "Inter, sans-serif", marginBottom: 20 }}>
              In production, this would use OAuth to securely connect to the loyalty program's API. Demo mode uses sample data.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLinkModal(null)} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid rgba(14,165,160,0.1)", background: "rgba(255,255,255,0.03)",
                color: "#8a8f98", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Cancel</button>
              <button onClick={() => handleLinkAccount(showLinkModal)} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif",
                background: "linear-gradient(135deg, #0EA5A0, #0EA5A0)", color: "#f7f8f8",
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
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={() => setShowAddProgram(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "linear-gradient(135deg, #141516, #191a1b)", border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto",
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#f7f8f8", margin: "0 0 6px", fontFamily: "Inter, sans-serif" }}>Add Loyalty Program</h3>
            <p style={{ color: "#8a8f98", fontSize: 12, margin: "0 0 20px", fontFamily: "Inter, sans-serif" }}>Choose from {PROGRAM_DIRECTORY.airlines.length + PROGRAM_DIRECTORY.hotels.length + PROGRAM_DIRECTORY.rentals.length + PROGRAM_DIRECTORY.creditCards.length}+ programs or add a custom one</p>

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
                    flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif",
                    background: newProgram.category === cat.id ? "rgba(14,165,160,0.2)" : "rgba(0,0,0,0.02)",
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
                style={{ display: "block", width: "100%", padding: "10px 12px 10px 36px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
              />
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.3 }}>🔍</span>
            </div>

            {/* Program List */}
            {!selectedProg && (
              <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 14, borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                {filtered.map(prog => {
                  const isLinked = alreadyLinked.includes(prog.id);
                  return (
                    <button key={prog.id} onClick={() => !isLinked && setNewProgram(p => ({ ...p, selectedId: prog.id, search: "" }))}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.03)",
                        border: "none", borderBottom: "1px solid rgba(0,0,0,0.02)", cursor: isLinked ? "default" : "pointer",
                        opacity: isLinked ? 0.4 : 1, transition: "background 0.15s", textAlign: "left",
                      }}
                      onMouseEnter={e => { if (!isLinked) e.currentTarget.style.background = "rgba(0,0,0,0.02)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{prog.logo}</span>
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
                    <span style={{ fontSize: 28 }}>{selectedProg.logo}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{selectedProg.name}</div>
                      <div style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>
                        {selectedProg.tiers ? `${selectedProg.tiers.length} elite tiers · ${selectedProg.unit}` : `${selectedProg.unit} · $${selectedProg.annualFee}/yr`}
                      </div>
                    </div>
                    <button onClick={() => setNewProgram(p => ({ ...p, selectedId: "" }))} style={{
                      background: "#23252a", border: "none", borderRadius: 8, width: 28, height: 28, color: "#8a8f98", cursor: "pointer", fontSize: 14,
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
                    style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                </label>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowAddProgram(false); setNewProgram({ name: "", category: "airline", logo: "✈️", color: "#0EA5A0", memberId: "", unit: "Points", tiers: "", selectedId: "", search: "" }); }} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid rgba(14,165,160,0.1)", background: "rgba(255,255,255,0.03)",
                color: "#8a8f98", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Cancel</button>
              {selectedProg ? (
                <button onClick={() => {
                  const prog = selectedProg;
                  if (!alreadyLinked.includes(prog.id)) {
                    setLinkedAccounts(prev => ({ ...prev, [prog.id]: { memberId: newProgram.memberId || "Pending", currentPoints: 0, currentNights: 0, currentRentals: 0 } }));
                  }
                  setShowAddProgram(false);
                  setNewProgram({ name: "", category: "airline", logo: "✈️", color: "#0EA5A0", memberId: "", unit: "Points", tiers: "", selectedId: "", search: "" });
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
                  setNewProgram({ name: "", category: "airline", logo: "✈️", color: "#0EA5A0", memberId: "", unit: "Points", tiers: "", selectedId: "", search: "" });
                }} style={{
                  flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid rgba(14,165,160,0.1)", background: "rgba(255,255,255,0.03)",
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
        }} onClick={() => setShowUpgrade(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "linear-gradient(135deg, #141516, #191a1b)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: 32, width: "100%", maxWidth: 400, textAlign: "center",
          }}>
            <div style={{ fontSize: 42, marginBottom: 12, display: "flex", justifyContent: "center" }}><LogoMark size={56} /></div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#f7f8f8", margin: "0 0 8px", fontFamily: "Inter, sans-serif" }}>Upgrade to Premium</h3>
            <p style={{ color: "#8a8f98", fontSize: 13, fontFamily: "Inter, sans-serif", marginBottom: 24 }}>
              Unlock the Trip Optimizer, status match alerts, PDF exports, and more.
            </p>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#f7f8f8", fontFamily: "Inter, sans-serif", marginBottom: 4 }}>$9.99<span style={{ fontSize: 14, color: "#8a8f98" }}>/mo</span></div>
            <p style={{ fontSize: 11, color: "#62666d", fontFamily: "Inter, sans-serif", marginBottom: 24 }}>Cancel anytime. 7-day free trial.</p>
            <button onClick={() => { setUser(prev => ({ ...prev, tier: "premium" })); setShowUpgrade(false); }} style={{
              width: "100%", padding: "13px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Inter, sans-serif",
              background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#f7f8f8", boxShadow: "0 4px 20px rgba(245,158,11,0.3)", marginBottom: 10,
            }}>Start Free Trial</button>
            <button onClick={() => setShowUpgrade(false)} style={{
              width: "100%", padding: "11px 0", borderRadius: 8, border: "1px solid rgba(14,165,160,0.1)", background: "rgba(255,255,255,0.03)",
              color: "#8a8f98", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>Maybe Later</button>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={() => setShowAddExpense(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "linear-gradient(135deg, #141516, #191a1b)", border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, padding: 28, width: "100%", maxWidth: 480,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#f7f8f8", margin: "0 0 6px", fontFamily: "Inter, sans-serif" }}>Add Expense</h3>
            <p style={{ color: "#8a8f98", fontSize: 12, margin: "0 0 20px", fontFamily: "Inter, sans-serif" }}>
              {(() => { const t = trips.find(t => t.id === showAddExpense); return t ? `${t.type === "flight" ? "✈️" : t.type === "hotel" ? "🏨" : "🚗"} ${getTripName(t)}` : ""; })()}
            </p>

            {/* Category selector */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif", display: "block", marginBottom: 8 }}>Category</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {EXPENSE_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setNewExpense(p => ({ ...p, category: cat.id }))} style={{
                    padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif",
                    background: newExpense.category === cat.id ? `${cat.color}25` : "rgba(0,0,0,0.02)",
                    color: newExpense.category === cat.id ? cat.color : "rgba(0,0,0,0.3)", transition: "all 0.2s",
                  }}>{cat.icon} {cat.label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <label style={{ flex: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Description</span>
                <input value={newExpense.description} onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Marriott 3 nights"
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
              </label>
              <label style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Amount ($)</span>
                <input type="number" min="0" step="0.01" value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))} placeholder="0.00"
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <label style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Date</span>
                <input type="date" value={newExpense.date} onChange={e => setNewExpense(p => ({ ...p, date: e.target.value }))}
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
              </label>
              <label style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Payment Method</span>
                <select value={newExpense.paymentMethod} onChange={e => setNewExpense(p => ({ ...p, paymentMethod: e.target.value }))}
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}>
                  <option value="" style={{ background: "linear-gradient(135deg, #141516, #191a1b)" }}>Select...</option>
                  <option value="Amex Platinum" style={{ background: "linear-gradient(135deg, #141516, #191a1b)" }}>Amex Platinum</option>
                  <option value="Chase Sapphire" style={{ background: "linear-gradient(135deg, #141516, #191a1b)" }}>Chase Sapphire Reserve</option>
                  <option value="Cash" style={{ background: "linear-gradient(135deg, #141516, #191a1b)" }}>Cash</option>
                  <option value="Debit Card" style={{ background: "linear-gradient(135deg, #141516, #191a1b)" }}>Debit Card</option>
                  <option value="Other" style={{ background: "linear-gradient(135deg, #141516, #191a1b)" }}>Other</option>
                </select>
              </label>
            </div>

            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Notes (optional)</span>
              <input value={newExpense.notes} onChange={e => setNewExpense(p => ({ ...p, notes: e.target.value }))} placeholder="Business meal, personal, etc."
                style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
            </label>

            {/* Receipt Upload / Camera */}
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif", display: "block", marginBottom: 8 }}>Receipt</span>
              
              {!newExpense.receiptImage ? (
                <div style={{ display: "flex", gap: 10 }}>
                  {/* Upload file button */}
                  <label style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "18px 12px", borderRadius: 8, border: "2px dashed rgba(14,165,160,0.25)", background: "rgba(14,165,160,0.04)",
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <span style={{ fontSize: 22 }}>📄</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#0EA5A0", fontFamily: "Inter, sans-serif" }}>Upload File</span>
                    <span style={{ fontSize: 9, color: "#62666d", fontFamily: "Inter, sans-serif" }}>JPG, PNG, PDF</span>
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
                    padding: "18px 12px", borderRadius: 8, border: "2px dashed rgba(14,165,160,0.25)", background: "rgba(14,165,160,0.04)",
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <span style={{ fontSize: 22 }}>📸</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#0EA5A0", fontFamily: "Inter, sans-serif" }}>Take Photo</span>
                    <span style={{ fontSize: 9, color: "#62666d", fontFamily: "Inter, sans-serif" }}>Use camera</span>
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
                    padding: "18px 12px", borderRadius: 8, border: `2px dashed ${!newExpense.receipt ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.03)"}`,
                    background: !newExpense.receipt ? "rgba(0,0,0,0.02)" : "transparent", cursor: "pointer",
                  }}>
                    <span style={{ fontSize: 22 }}>⊘</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>No Receipt</span>
                    <span style={{ fontSize: 9, color: "#62666d", fontFamily: "Inter, sans-serif" }}>&nbsp;</span>
                  </button>
                </div>
              ) : (
                /* Receipt preview */
                <div style={{
                  borderRadius: 8, border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.06)", padding: 14,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  {newExpense.receiptImage.type?.startsWith("image/") ? (
                    <img src={newExpense.receiptImage.data} alt="Receipt" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }} />
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
              <button onClick={() => setShowAddExpense(null)} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid rgba(14,165,160,0.1)", background: "rgba(255,255,255,0.03)",
                color: "#8a8f98", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Cancel</button>
              <button onClick={handleAddExpense} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif",
                background: "linear-gradient(135deg, #0EA5A0, #0EA5A0)", color: "#f7f8f8",
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
              background: "linear-gradient(135deg, #141516, #191a1b)", border: "1px solid rgba(14,165,160,0.1)", borderRadius: 8, padding: 32, width: "100%", maxWidth: 600,
              maxHeight: "85vh", overflowY: "auto",
            }}>
              {/* Report Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <LogoMark size={24} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0EA5A0", fontFamily: "Inter, sans-serif" }}>Continuum</span>
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "#f7f8f8", margin: 0, fontFamily: "Inter, sans-serif" }}>Expense Report</h3>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>Generated {new Date().toLocaleDateString()}</div>
                  <div style={{ fontSize: 11, color: "#62666d", fontFamily: "Inter, sans-serif" }}>Report #{trip.id}-{Date.now().toString(36).slice(-4)}</div>
                </div>
              </div>

              {/* Trip Info */}
              <div style={{
                background: "rgba(14,165,160,0.06)", border: "1px solid rgba(14,165,160,0.15)", borderRadius: 8, padding: 18, marginBottom: 20,
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif", marginBottom: 4 }}>
                  {trip.type === "flight" ? "✈️" : trip.type === "hotel" ? "🏨" : "🚗"} {getTripName(trip)}
                </div>
                <div style={{ fontSize: 12, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>
                  {trip.date} • {prog?.name || "Unknown"} • {trip.status}
                </div>
              </div>

              {/* Summary Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0EA5A0", fontFamily: "Inter, sans-serif" }}>${tripTotal.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>Total</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{tripExps.length}</div>
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
                      <div style={{ width: 80, height: 5, borderRadius: 8, background: "#23252a", overflow: "hidden" }}>
                        <div style={{ width: `${(cat.total / tripTotal) * 100}%`, height: "100%", background: cat.color, borderRadius: 8 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#f7f8f8", fontFamily: "Inter, sans-serif", minWidth: 70, textAlign: "right" }}>${cat.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Line Items */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#8a8f98", fontFamily: "Inter, sans-serif", marginBottom: 10 }}>LINE ITEMS</div>
                <div style={{ background: "linear-gradient(135deg, rgba(14,165,160,0.02), rgba(0,0,0,0.02))", borderRadius: 8, overflow: "hidden" }}>
                  {/* Header */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 70px 28px", gap: 8, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#8a8f98", fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>Description</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#8a8f98", fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>Date</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#8a8f98", fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>Payment</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#8a8f98", fontFamily: "Inter, sans-serif", textTransform: "uppercase", textAlign: "right" }}>Amount</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#8a8f98", fontFamily: "Inter, sans-serif", textAlign: "center" }}>🧾</span>
                  </div>
                  {/* Rows */}
                  {tripExps.map((exp, i) => {
                    const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                    return (
                      <div key={exp.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 70px 28px", gap: 8, padding: "10px 14px", borderBottom: i < tripExps.length - 1 ? "1px solid rgba(0,0,0,0.02)" : "none", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: 12, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>{cat?.icon} {exp.description}</span>
                          {exp.notes && <div style={{ fontSize: 10, color: "#62666d", marginTop: 1 }}>{exp.notes}</div>}
                        </div>
                        <span style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif" }}>{exp.date?.slice(5)}</span>
                        <span style={{ fontSize: 11, color: "#8a8f98", fontFamily: "Inter, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.paymentMethod || "—"}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: exp.amount === 0 ? "#34d399" : "#FFFFFF", fontFamily: "Inter, sans-serif", textAlign: "right" }}>
                          {exp.amount === 0 ? "Free" : `$${exp.amount.toLocaleString()}`}
                        </span>
                        <span style={{ fontSize: 12, textAlign: "center" }}>{exp.receipt ? "✓" : "—"}</span>
                      </div>
                    );
                  })}
                  {/* Total */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 70px", gap: 8, padding: "12px 14px", background: "rgba(14,165,160,0.06)", borderTop: "2px solid rgba(14,165,160,0.2)" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0EA5A0", fontFamily: "Inter, sans-serif" }}>TOTAL</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#0EA5A0", fontFamily: "Inter, sans-serif", textAlign: "right" }}>${tripTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowExpenseReport(null)} style={{
                  flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid rgba(14,165,160,0.1)", background: "rgba(255,255,255,0.03)",
                  color: "#8a8f98", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}>Close</button>
                <button onClick={() => window.print()} style={{
                  flex: 1, padding: "11px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif",
                  background: "linear-gradient(135deg, #0EA5A0, #0EA5A0)", color: "#f7f8f8",
                }}>🖨️ Print / Save PDF</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
