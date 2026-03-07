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
  { id: "flights",   label: "Flights",        icon: "✈️" },
  { id: "hotels",    label: "Hotels",         icon: "🏨" },
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

// ============================================================
// MAIN APP
// ============================================================
export default function EliteStatusTracker() {
  const [darkMode, setDarkMode] = useState(true);
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
  const [editExpenseId, setEditExpenseId] = useState(null); // null or expense id being edited
  const [newExpense, setNewExpense] = useState({ category: "flight", description: "", amount: "", currency: "USD", fxRate: 1, date: "", paymentMethod: "", receipt: false, receiptImage: null, notes: "" });
  const [expenseViewTrip, setExpenseViewTrip] = useState(null); // null = overview, tripId = detail
  const [showExpenseReport, setShowExpenseReport] = useState(null); // tripId for report modal
  const [allianceMyProgram, setAllianceMyProgram] = useState("aa");
  const [allianceCompare, setAllianceCompare] = useState("ua");
  const [programSubView, setProgramSubView] = useState("airlines");
  const [programsHover, setProgramsHover] = useState(false);
  const [optimizerTab, setOptimizerTab] = useState("global");
  const [optimizerTripId, setOptimizerTripId] = useState(null);
  const [allianceGoal, setAllianceGoal] = useState("sa_gold");
  const [optimizerHover, setOptimizerHover] = useState(false);
  const [ccOptTarget, setCcOptTarget] = useState("max_points"); // "max_points" | airline/hotel program id
  const [ccOptAmount, setCcOptAmount] = useState("100"); // purchase amount for illustration
  const [ccBookingMode, setCcBookingMode] = useState("direct"); // "direct" | "portal"
  const [customPrograms, setCustomPrograms] = useState([]);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [newProgram, setNewProgram] = useState({ name: "", category: "airline", logo: "✈️", color: "#0EA5A0", memberId: "", unit: "Points", tiers: "", selectedId: "", search: "" });
  const [conciergeProgram, setConciergeProgram] = useState(null); // program object for AI concierge
  const [conciergeMessages, setConciergeMessages] = useState([]); // { role, content }
  const [conciergeInput, setConciergeInput] = useState("");
  const [conciergeLoading, setConciergeLoading] = useState(false);
  const [conciergeSpeaking, setConciergeSpeaking] = useState(false);

  // ── PA announcement state (top-level so mute button works on all pages) ──
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [showChime, setShowChime] = useState(false);
  const [paMuted, setPaMuted] = useState(false);
  const [paEnded, setPaEnded] = useState(false);
  const audioCtxRef = React.useRef(null);
  const paPlayedRef = React.useRef(false);
  const [cockpitSection, setCockpitSection] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);

  // ── Itinerary import & trip detail state ──
  const [showImportItinerary, setShowImportItinerary] = useState(false);
  const [itineraryText, setItineraryText] = useState("");
  const [tripDetailId, setTripDetailId] = useState(null); // trip id to show detail view

  // ── Mobile detection ──
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => { setTimeout(() => setAnimateIn(true), 100); }, []);

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

  // ── Itinerary parser ──
  const parseItinerary = (text) => {
    const segments = [];
    let tripName = "";
    let bookingSource = null;
    let confirmationCode = "";

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
    const confMatch = text.match(/(?:confirmation|booking|record locator|pnr|ref)[:\s#]*([A-Z0-9]{5,8})/i);
    if (confMatch) confirmationCode = confMatch[1].toUpperCase();

    // Extract flight segments: look for patterns like "AA 123", "DL 456", airport codes, dates, times
    const flightPattern = /(?:(?:flight|flt)[:\s]*)?([A-Z]{2})\s*(\d{1,4})\b/gi;
    const airportPattern = /\b([A-Z]{3})\s*(?:→|->|to|–|—|-)\s*([A-Z]{3})\b/g;
    const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w{3,9}\s+\d{1,2},?\s*\d{4}|\d{4}-\d{2}-\d{2})\b/gi;
    const timePattern = /\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\b/g;
    const seatPattern = /(?:seat|ste?)[:\s]*(\d{1,2}[A-K])/gi;
    const fareClassPattern = /(?:fare\s*(?:class|basis|code)|booking\s*class)[:\s]*([A-Z][A-Z0-9]{0,7})/gi;
    const aircraftPattern = /(?:aircraft|plane|equipment|acft)[:\s]*([A-Z0-9]{2,4}(?:\s*[-/]\s*\d{3,4})?)/gi;
    const durationPattern = /(?:duration|travel\s*time|flight\s*time)[:\s]*(\d+h\s*\d*m?|\d+\s*hr[s]?\s*\d*\s*min[s]?)/gi;
    const distancePattern = /(?:distance|miles)[:\s]*([\d,]+)\s*(?:mi|miles|km)/gi;
    const layoverPattern = /(?:layover|connection|stopover)[:\s]*(?:(\d+h\s*\d*m?)|([\d.]+)\s*(?:hr|hour))/gi;

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
    while ((fm = flightPattern.exec(text)) !== null) flights.push({ carrier: fm[1], number: fm[2] });

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

    // Determine airline program from flight carrier codes
    const carrierToProgram = { AA: "aa", DL: "dl", UA: "ua", WN: "sw", B6: "b6", AS: "atmos", F9: "frontier", NK: "spirit", AF: "flying_blue", KL: "flying_blue", BA: "ba_avios", AC: "aeroplan", EK: "emirates_skywards", TK: "turkish_miles", QF: "qantas_ff", SQ: "singapore_kf", CX: "cathay_mp" };

    // Build segments
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
        confirmationCode,
        bookingSource: bookingSource ? { name: bookingSource.name, phone: bookingSource.phone, manage: bookingSource.manage, type: bookingSource.type } : null,
        airlineCS: AIRLINE_CS[programId] || null,
      });
    }

    return segments;
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

  const BLANK_EXPENSE = { category: "flight", description: "", amount: "", currency: "USD", fxRate: 1, date: "", paymentMethod: "", receipt: false, receiptImage: null, notes: "" };

  const handleAddExpense = () => {
    const parsed = { ...newExpense, amount: parseFloat(newExpense.amount) || 0, fxRate: parseFloat(newExpense.fxRate) || 1 };
    if (editExpenseId) {
      setExpenses(prev => prev.map(e => e.id === editExpenseId ? { ...parsed, id: editExpenseId, tripId: e.tripId } : e));
      setEditExpenseId(null);
    } else {
      setExpenses(prev => [...prev, { ...parsed, id: Date.now(), tripId: showAddExpense }]);
    }
    setShowAddExpense(null);
    setNewExpense(BLANK_EXPENSE);
  };

  const removeExpense = (id) => setExpenses(prev => prev.filter(e => e.id !== id));

  const getTripExpenses = (tripId) => expenses.filter(e => e.tripId === tripId);
  const getTripTotal = (tripId) => getTripExpenses(tripId).reduce((sum, e) => sum + e.amount * (e.fxRate || 1), 0);
  const getTripName = (trip) => trip.tripName || trip.route || trip.property || trip.location || "Trip";

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
    if (user?.tier !== "premium") { setShowUpgrade(true); return; }
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
        { id: "login", label: "Log In", sub: "Dashboard", icon: "🛫" },
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

    // ==================== LOGIN PAGE (Split-Screen Glassmorphism) ====================
    return (
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", height: "100vh", overflow: "hidden", background: "#08090a" }}>
        {/* Mute button */}
        {audioPlayed && !paEnded && (
          <button
            onClick={() => { if (paMuted) { window.speechSynthesis?.resume(); setPaMuted(false); } else { window.speechSynthesis?.pause(); setPaMuted(true); } }}
            style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "rgba(8,8,12,0.88)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 10, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, backdropFilter: "blur(12px)", boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}
          >
            <span style={{ fontSize: 15 }}>{paMuted ? "🔊" : "🔇"}</span>
            <span style={{ fontSize: 9, fontFamily: "Space Mono, monospace", color: "#8a8f98", letterSpacing: 1 }}>{paMuted ? "RESUME PA" : "MUTE PA"}</span>
          </button>
        )}

        {/* LEFT PANEL — Image (hidden on mobile, 60% on desktop) */}
        {!isMobile && (
        <div style={{ flex: "0 0 60%", position: "relative", overflow: "hidden" }}>
          <img src="/login-bg.jpg" alt="Airport Lounge" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
          {/* Gradient overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(8,9,10,0.3) 0%, rgba(14,165,160,0.08) 50%, rgba(8,9,10,0.5) 100%)" }} />
          {/* Bottom text overlay */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "60px 48px 40px", background: "linear-gradient(to top, rgba(8,9,10,0.9) 0%, transparent 100%)" }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#f7f8f8", margin: "0 0 10px", fontFamily: "Inter, sans-serif", lineHeight: 1.2 }}>
              Travel Without<br />Boundaries
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: 0, fontFamily: "Inter, sans-serif", maxWidth: 380, lineHeight: 1.6 }}>
              Track your elite status, plan smarter trips, and unlock premium experiences across 30+ airline and hotel partners.
            </p>
          </div>
          {/* Back button */}
          <button onClick={() => goTo("landing")} style={{
            position: "absolute", top: 28, left: 28, background: "rgba(8,8,12,0.6)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
            padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, backdropFilter: "blur(12px)", zIndex: 10,
          }}>
            <span style={{ fontSize: 13, color: "#f7f8f8", fontFamily: "Inter, sans-serif" }}>← Back</span>
          </button>
        </div>
        )}

        {/* RIGHT PANEL — Login Form (full on mobile, 40% on desktop) */}
        <div style={{
          flex: isMobile ? 1 : "0 0 40%", display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: isMobile ? "20px" : "24px 40px", position: "relative",
          overflow: "hidden", background: "linear-gradient(180deg, #0a0b0d 0%, #0d0f12 50%, #0a0b0d 100%)",
        }}>
          {/* Subtle glow effect */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,160,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{
            width: "100%", maxWidth: 380,
            opacity: animateIn ? 1 : 0, transform: animateIn ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)", position: "relative", zIndex: 1,
          }}>
            {/* Back button on mobile */}
            {isMobile && (
              <button onClick={() => goTo("landing")} style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                padding: "5px 12px", cursor: "pointer", marginBottom: 12, fontSize: 12, color: "#8a8f98", fontFamily: "Inter, sans-serif",
              }}>← Back</button>
            )}
            {/* Logo + Header */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                <img src="/continuum-travel-logo.svg" alt="Continuum" style={{ height: isMobile ? 64 : 88, display: "block" }} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f7f8f8", margin: "0 0 4px", fontFamily: "Inter, sans-serif", letterSpacing: -0.3 }}>
                {isRegistering ? "Create Account" : "Welcome Back"}
              </h1>
              <p style={{ color: "rgba(138,143,152,0.8)", fontSize: 12, margin: 0, fontFamily: "Inter, sans-serif" }}>
                {isRegistering ? "Join the Continuum experience" : "Sign in to your account"}
              </p>
            </div>

            {/* Glassmorphism Card */}
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16, padding: "20px 22px",
              backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}>
              {/* Tab Toggle */}
              <div style={{ display: "flex", marginBottom: 16, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3 }}>
                {["Sign In", "Register"].map((tab, i) => (
                  <button key={tab} onClick={() => setIsRegistering(i === 1)} style={{
                    flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer",
                    fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif",
                    background: (i === 0 ? !isRegistering : isRegistering) ? "rgba(14,165,160,0.15)" : "transparent",
                    color: (i === 0 ? !isRegistering : isRegistering) ? "#0EA5A0" : "#62666d",
                    transition: "all 0.3s ease",
                  }}>{tab}</button>
                ))}
              </div>

              {!isRegistering ? (
                <div>
                  <label style={{ display: "block", marginBottom: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "Inter, sans-serif" }}>Email</span>
                    <input type="email" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} placeholder="alex@example.com"
                      style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.3s" }} />
                  </label>
                  <label style={{ display: "block", marginBottom: 16 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "Inter, sans-serif" }}>Password</span>
                    <input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••"
                      style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.3s" }} />
                  </label>
                  <button onClick={handleLogin} style={{
                    width: "100%", padding: "11px 0", border: "none", borderRadius: 10, cursor: "pointer",
                    fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif", letterSpacing: 0.3,
                    background: "linear-gradient(135deg, #0EA5A0, #0c8e8a)", color: "#fff",
                    boxShadow: "0 4px 20px rgba(14,165,160,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                  }}>Sign In</button>
                  <button onClick={() => { setLoginForm({ email: "alex@example.com", password: "demo" }); setTimeout(handleLogin, 100); }} style={{
                    width: "100%", padding: "9px 0", border: "1px solid rgba(14,165,160,0.15)", borderRadius: 10, cursor: "pointer",
                    fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif",
                    background: "rgba(14,165,160,0.04)", color: "#0EA5A0", marginTop: 8,
                    transition: "all 0.3s ease",
                  }}>Try Demo Account →</button>
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "Inter, sans-serif" }}>Full Name</span>
                    <input value={registerForm.name} onChange={e => setRegisterForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name"
                      style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.3s" }} />
                  </label>
                  <label style={{ display: "block", marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "Inter, sans-serif" }}>Email</span>
                    <input type="email" value={registerForm.email} onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))} placeholder="you@email.com"
                      style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.3s" }} />
                  </label>
                  <label style={{ display: "block", marginBottom: 14 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "Inter, sans-serif" }}>Password</span>
                    <input type="password" value={registerForm.password} onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••"
                      style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.3s" }} />
                  </label>
                  <button onClick={handleRegister} style={{
                    width: "100%", padding: "11px 0", border: "none", borderRadius: 10, cursor: "pointer",
                    fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif", letterSpacing: 0.3,
                    background: "linear-gradient(135deg, #0EA5A0, #0c8e8a)", color: "#fff",
                    boxShadow: "0 4px 20px rgba(14,165,160,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                  }}>Create Account</button>
                </div>
              )}

              <div style={{ textAlign: "center", marginTop: 12, padding: "10px 0 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <p style={{ color: "#52555c", fontSize: 10, fontFamily: "Inter, sans-serif", margin: 0 }}>By signing in, you agree to our Terms of Service</p>
              </div>
            </div>
          </div>
        </div>
      </div>
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
    // Landing page palette — fixed dark, sharp-edged, bold minimalist
    const lp = {
      bg:       "#08090a",
      surface:  "#0f1012",
      surface2: "#17191d",
      border:   "#1e2028",
      border2:  "#2a2640",
      text:     "#f7f8f8",
      text2:    "#d0d6e0",
      dim:      "#8a8f98",
      teal:     "#0EA5A0",
      tealDim:  "rgba(14,165,160,0.12)",
      tealBord: "rgba(14,165,160,0.25)",
      red:      "#ef4444",
      green:    "#34d399",
      mono:     "'Space Mono', 'JetBrains Mono', monospace",
      sans:     "'DM Sans', 'Outfit', sans-serif",
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
    const box = { background: lp.surface, border: `1px solid ${lp.border}` };
    const SectionLabel = ({ children, action, actionLabel }) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: lp.teal, fontFamily: lp.mono }}>{children}</span>
        <div style={{ flex: 1, height: 1, background: lp.border }} />
        {action && (
          <button onClick={action} style={{ background: "none", border: `1px solid ${lp.border2}`, color: lp.dim, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", padding: "4px 12px", fontFamily: lp.mono, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = lp.teal} onMouseLeave={e => e.currentTarget.style.color = lp.dim}>
            {actionLabel}
          </button>
        )}
      </div>
    );

    return (
      <div style={{ fontFamily: lp.sans, color: lp.text }}>

        {/* ── Top bar: greeting + date ── */}
        <div className="c-a1" style={{ borderBottom: `1px solid ${lp.border}`, paddingBottom: 24, marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: lp.teal, fontFamily: lp.mono, marginBottom: 8 }}>{greeting}</div>
              <h1 style={{ fontFamily: lp.mono, fontSize: isMobile ? 28 : 40, fontWeight: 700, color: lp.text, margin: 0, letterSpacing: -1, lineHeight: 1 }}>
                {user?.name?.split(" ")[0]?.toUpperCase()}
              </h1>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: lp.dim, fontFamily: lp.mono }}>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}</div>
              <div style={{ fontSize: 10, color: lp.dim, fontFamily: lp.mono, marginTop: 2 }}>{Object.keys(linkedAccounts).length} PROGRAMS TRACKED</div>
            </div>
          </div>
        </div>

        {/* ── Stat grid ── */}
        <div className="c-a2" style={{ display: "grid", gridTemplateColumns: nextTrip ? (isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr 1fr") : "repeat(4, 1fr)", gap: 0, border: `1px solid ${lp.border}`, marginBottom: 28 }}>
          {[
            { label: "Linked", value: Object.keys(linkedAccounts).length, sub: "PROGRAMS", accent: lp.teal },
            { label: "Portfolio", value: totalPointsValue >= 1000 ? `${Math.round(totalPointsValue/1000)}K` : String(totalPointsValue), sub: "TOTAL PTS", accent: "#C9A84C" },
            { label: "Confirmed", value: confirmedTrips, sub: `OF ${totalTrips} TRIPS`, accent: lp.green },
            { label: "Advancing", value: willAdvanceCount, sub: "STATUS UPGRADES", accent: "#9B6FD6" },
          ].map((s, i, arr) => (
            <div key={i} style={{ padding: "22px 24px", borderRight: i < arr.length - 1 && !nextTrip ? `1px solid ${lp.border}` : (nextTrip && i < arr.length - 1 ? `1px solid ${lp.border}` : "none"), background: lp.surface, position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.accent }} />
              <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 700, color: lp.text, fontFamily: lp.mono, letterSpacing: -2, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: s.accent, fontFamily: lp.mono, letterSpacing: "0.15em" }}>{s.sub}</div>
              <div style={{ fontSize: 10, color: lp.dim, fontFamily: lp.mono, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
          {nextTrip && (
            <div style={{ padding: "22px 24px", background: lp.tealDim, borderLeft: `1px solid ${lp.tealBord}`, position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: lp.teal }} />
              <div style={{ fontSize: 8, fontWeight: 700, color: lp.teal, fontFamily: lp.mono, letterSpacing: "0.15em", marginBottom: 6 }}>NEXT TRIP</div>
              <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 700, color: lp.teal, fontFamily: lp.mono, letterSpacing: -2, lineHeight: 1 }}>{daysToNext}<span style={{ fontSize: 12, fontWeight: 400, marginLeft: 4 }}>D</span></div>
              <div style={{ fontSize: 10, color: lp.text2, fontFamily: lp.mono, marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nextTrip.route || nextTrip.property || nextTrip.location}</div>
            </div>
          )}
        </div>

        {/* ── Quick actions ── */}
        <div className="c-a2" style={{ display: "flex", gap: 0, marginBottom: 36, border: `1px solid ${lp.border}`, overflow: "hidden", width: "fit-content" }}>
          <button onClick={() => setShowAddTrip(true)} style={{ padding: "10px 24px", border: "none", background: lp.teal, color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: lp.mono }}>+ ADD TRIP</button>
          {[["OPTIMIZER","optimizer"],["REPORTS","reports"],["PROGRAMS","programs"]].map(([l,v], i) => (
            <button key={v} onClick={() => setActiveView(v)} style={{ padding: "10px 20px", border: "none", borderLeft: `1px solid ${lp.border}`, background: lp.surface, color: lp.dim, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: lp.mono, transition: "color 0.15s, background 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.color = lp.teal; e.currentTarget.style.background = lp.tealDim; }}
              onMouseLeave={e => { e.currentTarget.style.color = lp.dim; e.currentTarget.style.background = lp.surface; }}
            >{l} →</button>
          ))}
        </div>

        {/* ── Airline Status ── */}
        {airlineStatuses.length > 0 && (
          <div className="c-a3" style={{ marginBottom: 32 }}>
            <SectionLabel action={() => setActiveView("programs")} actionLabel="MANAGE →">Airline Elite Status — {airlineStatuses.length} Programs</SectionLabel>
            <div style={{ border: `1px solid ${lp.border}`, overflow: "hidden" }}>
              {/* Column header */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 60px" : "240px 1fr 100px 90px", background: lp.surface2, borderBottom: `1px solid ${lp.border}` }}>
                {["PROGRAM", !isMobile && "PROGRESS", !isMobile && "STATUS", "TO NEXT"].filter(Boolean).map((h, i) => (
                  <div key={i} style={{ padding: "8px 14px", fontSize: 8, fontWeight: 700, letterSpacing: "0.15em", color: lp.dim, fontFamily: lp.mono, textAlign: i > 1 ? "right" : "left" }}>{h}</div>
                ))}
              </div>
              {airlineStatuses.map((p, idx) => {
                const s = p.status;
                const pct = s.nextTier ? Math.min((s.projected / s.nextTier.threshold) * 100, 100) : 100;
                return (
                  <div key={p.id} onClick={() => { setSelectedProgram(p.id); setActiveView("programs"); }} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 60px" : "240px 1fr 100px 90px", alignItems: "center", cursor: "pointer", borderBottom: idx < airlineStatuses.length - 1 ? `1px solid ${lp.border}` : "none", transition: "background 0.12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = lp.surface2}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ padding: "14px", display: "flex", alignItems: "center", gap: 10, borderRight: `1px solid ${lp.border}` }}>
                      <div style={{ width: 3, height: 32, background: p.color, flexShrink: 0 }} />
                      <ProgramLogo prog={p} size={22} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: lp.text, fontFamily: lp.mono }}>{p.name.split(" ").slice(-1)[0].toUpperCase()}</div>
                        <div style={{ fontSize: 9, color: lp.dim, fontFamily: lp.mono, marginTop: 1 }}>{p.name.split(" ").slice(0, -1).join(" ")}</div>
                      </div>
                    </div>
                    {!isMobile && (
                      <div style={{ padding: "14px 14px", borderRight: `1px solid ${lp.border}` }}>
                        <div style={{ width: "100%", height: 3, background: lp.border2 }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: p.color, transition: "width 1s ease" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 8, color: lp.dim, fontFamily: lp.mono }}>
                          <span>{s.projected.toLocaleString()}</span>
                          <span style={{ color: lp.teal }}>{s.tripBoosts > 0 ? `+${s.tripBoosts.toLocaleString()} PLANNED` : ""}</span>
                          <span>{s.nextTier?.threshold.toLocaleString() || "MAX"}</span>
                        </div>
                      </div>
                    )}
                    {!isMobile && (
                      <div style={{ padding: "14px", borderRight: `1px solid ${lp.border}`, textAlign: "right" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: p.color, fontFamily: lp.mono }}>{s.currentTier?.name || "MEMBER"}</div>
                        {s.willAdvance && <div style={{ fontSize: 8, color: lp.green, fontFamily: lp.mono, marginTop: 2 }}>↑ ADVANCING</div>}
                      </div>
                    )}
                    <div style={{ padding: "14px", textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: s.nextTier ? lp.text : lp.green, fontFamily: lp.mono }}>{s.nextTier ? Math.round(pct) + "%" : "MAX"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Hotel Status ── */}
        {hotelStatuses.length > 0 && (
          <div className="c-a4" style={{ marginBottom: 32 }}>
            <SectionLabel action={() => setActiveView("programs")} actionLabel="MANAGE →">Hotel Elite Status — {hotelStatuses.length} Programs</SectionLabel>
            <div style={{ border: `1px solid ${lp.border}`, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 60px" : "240px 1fr 100px 90px", background: lp.surface2, borderBottom: `1px solid ${lp.border}` }}>
                {["PROGRAM", !isMobile && "PROGRESS", !isMobile && "STATUS", "NIGHTS"].filter(Boolean).map((h, i) => (
                  <div key={i} style={{ padding: "8px 14px", fontSize: 8, fontWeight: 700, letterSpacing: "0.15em", color: lp.dim, fontFamily: lp.mono, textAlign: i > 1 ? "right" : "left" }}>{h}</div>
                ))}
              </div>
              {hotelStatuses.map((p, idx) => {
                const s = p.status;
                const pct = s.nextTier ? Math.min((s.projected / s.nextTier.threshold) * 100, 100) : 100;
                return (
                  <div key={p.id} onClick={() => { setSelectedProgram(p.id); setActiveView("programs"); }} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 60px" : "240px 1fr 100px 90px", alignItems: "center", cursor: "pointer", borderBottom: idx < hotelStatuses.length - 1 ? `1px solid ${lp.border}` : "none", transition: "background 0.12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = lp.surface2}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ padding: "14px", display: "flex", alignItems: "center", gap: 10, borderRight: `1px solid ${lp.border}` }}>
                      <div style={{ width: 3, height: 32, background: p.color, flexShrink: 0 }} />
                      <ProgramLogo prog={p} size={22} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: lp.text, fontFamily: lp.mono }}>{p.name.split(" ").slice(-1)[0].toUpperCase()}</div>
                        <div style={{ fontSize: 9, color: lp.dim, fontFamily: lp.mono, marginTop: 1 }}>{p.name.split(" ").slice(0, -1).join(" ")}</div>
                      </div>
                    </div>
                    {!isMobile && (
                      <div style={{ padding: "14px", borderRight: `1px solid ${lp.border}` }}>
                        <div style={{ width: "100%", height: 3, background: lp.border2 }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: p.color, transition: "width 1s ease" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 8, color: lp.dim, fontFamily: lp.mono }}>
                          <span>{s.projected} nts</span>
                          <span style={{ color: lp.teal }}>{s.tripBoosts > 0 ? `+${s.tripBoosts} PLANNED` : ""}</span>
                          <span>{s.nextTier?.threshold || "MAX"} nts</span>
                        </div>
                      </div>
                    )}
                    {!isMobile && (
                      <div style={{ padding: "14px", borderRight: `1px solid ${lp.border}`, textAlign: "right" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: p.color, fontFamily: lp.mono }}>{s.currentTier?.name || "MEMBER"}</div>
                        {s.willAdvance && <div style={{ fontSize: 8, color: lp.green, fontFamily: lp.mono, marginTop: 2 }}>↑ ADVANCING</div>}
                      </div>
                    )}
                    <div style={{ padding: "14px", textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: s.nextTier ? lp.text : lp.green, fontFamily: lp.mono }}>{s.nextTier ? `${s.nextTier.threshold - s.projected}` : "MAX"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Two-column: Trips + Cards ── */}
        <div className="c-a5" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 24 }}>

          {/* Upcoming Trips */}
          <div>
            <SectionLabel action={() => setActiveView("trips")} actionLabel="ALL TRIPS →">Upcoming Trips — {trips.length}</SectionLabel>
            <div style={{ border: `1px solid ${lp.border}`, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", background: lp.surface2, borderBottom: `1px solid ${lp.border}` }}>
                {["ROUTE / PROPERTY", "DATE", "STATUS"].map((h, i) => (
                  <div key={i} style={{ padding: "8px 14px", fontSize: 8, fontWeight: 700, letterSpacing: "0.15em", color: lp.dim, fontFamily: lp.mono, textAlign: i > 0 ? "right" : "left" }}>{h}</div>
                ))}
              </div>
              {trips.slice(0, 6).map((trip, idx) => {
                const prog = allPrograms.find(p => p.id === trip.program);
                const sColor = trip.status === "confirmed" ? lp.green : trip.status === "planned" ? "#C9A84C" : lp.teal;
                return (
                  <div key={trip.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", alignItems: "center", borderBottom: idx < Math.min(trips.length, 6) - 1 ? `1px solid ${lp.border}` : "none", transition: "background 0.12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = lp.surface2}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderRight: `1px solid ${lp.border}` }}>
                      <div style={{ width: 3, height: 28, background: prog?.color || lp.teal, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: lp.text, fontFamily: lp.mono, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: isMobile ? 140 : 240 }}>{trip.route || trip.property || trip.location}</div>
                        <div style={{ fontSize: 8, color: lp.dim, fontFamily: lp.mono, marginTop: 2 }}>{prog?.name?.split(" ")[0] || "—"}</div>
                      </div>
                    </div>
                    <div style={{ padding: "12px 14px", textAlign: "right", borderRight: `1px solid ${lp.border}` }}>
                      <div style={{ fontSize: 9, color: lp.dim, fontFamily: lp.mono }}>{trip.date?.slice(5)}</div>
                    </div>
                    <div style={{ padding: "12px 14px", textAlign: "right" }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: sColor, fontFamily: lp.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{trip.status}</span>
                    </div>
                  </div>
                );
              })}
              {trips.length === 0 && (
                <div style={{ padding: "32px 20px", textAlign: "center" }}>
                  <button onClick={() => setShowAddTrip(true)} style={{ background: "none", border: "none", color: lp.teal, cursor: "pointer", fontWeight: 700, fontSize: 11, fontFamily: lp.mono, letterSpacing: "0.1em" }}>+ ADD FIRST TRIP</button>
                </div>
              )}
            </div>
          </div>

          {/* Recommended Cards */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: lp.teal, fontFamily: lp.mono }}>Card Offers</span>
              <span style={{ fontSize: 7, fontWeight: 700, color: lp.dim, border: `1px solid ${lp.border2}`, padding: "2px 6px", fontFamily: lp.mono, letterSpacing: "0.1em" }}>SPONSORED</span>
              <div style={{ flex: 1, height: 1, background: lp.border }} />
            </div>
            <div style={{ border: `1px solid ${lp.border}`, overflow: "hidden" }}>
              {CREDIT_CARD_OFFERS.slice(0, 3).map((card, i) => (
                <div key={i} style={{ padding: "16px 18px", borderBottom: i < 2 ? `1px solid ${lp.border}` : "none", position: "relative", transition: "background 0.12s" }}
                  onMouseEnter={e => e.currentTarget.style.background = lp.surface2}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: card.color }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, paddingLeft: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: lp.text, fontFamily: lp.mono }}>{card.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#C9A84C", fontFamily: lp.mono }}>{card.bonus}</div>
                  </div>
                  <div style={{ fontSize: 8, color: lp.dim, marginBottom: 10, fontFamily: lp.mono, paddingLeft: 6 }}>SPEND {card.spend} · {card.fee}</div>
                  <button style={{ width: "100%", padding: "7px 0", border: `1px solid ${lp.tealBord}`, background: "transparent", color: lp.teal, fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: lp.mono, letterSpacing: "0.12em", textTransform: "uppercase", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = lp.tealDim}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    APPLY NOW →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPrograms = () => {
    // Delegate alliance benefits sub-view to renderAlliances
    if (programSubView === "alliances") return renderAlliances();

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
    const activeSub = SUB_TABS.find(t => t.id === programSubView) || SUB_TABS[0];
    const linkedCount = Object.keys(linkedAccounts).length;

    return (
      <div>
        {/* Page header */}
        <div className="c-a1" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>Loyalty Portfolio</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: isMobile ? 28 : 36, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>{activeSub.label}</h2>
            <p style={{ color: css.text2, fontSize: 13, margin: "8px 0 0", fontFamily: "'Outfit', sans-serif" }}>
              {linkedCount} linked · {Object.values(customByCategory).flat().length} custom programs
            </p>
          </div>
          <button onClick={() => setShowAddProgram(true)} className="c-btn-primary" style={{
            padding: "10px 22px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: css.accent, color: "#fff", flexShrink: 0, fontFamily: "'Outfit', sans-serif",
          }}>+ Add Program</button>
        </div>

        {/* Sub-tabs — desktop only (mobile uses nav row) */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: `1px solid ${css.border}` }}>
            {SUB_TABS.map(tab => (
              <button key={tab.id} onClick={() => setProgramSubView(tab.id)} style={{
                padding: "9px 20px", border: "none", cursor: "pointer", background: "transparent",
                borderBottom: programSubView === tab.id ? `2px solid ${css.accent}` : "2px solid transparent",
                color: programSubView === tab.id ? css.accent : css.text3,
                fontSize: 13, fontWeight: programSubView === tab.id ? 600 : 400,
                fontFamily: "'Outfit', sans-serif", transition: "all 0.15s",
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
              <span style={{ fontSize: 11, color: css.text3, fontFamily: "'JetBrains Mono', monospace" }}>
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
                            <div style={{ fontSize: 10, color: css.text3, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
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

                    {/* Status progress for airline/hotel */}
                    {isLinked && status && !isCard && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: css.text2, marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, color: prog.color }}>{status.currentTier?.name || "Member"}</span>
                          {status.nextTier && <span style={{ color: css.text3 }}>→ {status.nextTier.name}</span>}
                        </div>
                        <div style={{ width: "100%", height: 5, borderRadius: 3, background: css.surface2, overflow: "hidden" }}>
                          <div style={{
                            width: `${Math.min((status.projected / (status.nextTier?.threshold || status.projected)) * 100, 100)}%`,
                            height: "100%", borderRadius: 3, background: prog.color, transition: "width 1s ease",
                          }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: css.text3, marginTop: 5, fontFamily: "'JetBrains Mono', monospace" }}>
                          <span>{status.projected.toLocaleString()} {prog.unit?.split(" ")[0]}</span>
                          {status.willAdvance && <span style={{ color: css.success, fontWeight: 600 }}>On track ↑</span>}
                          {status.nextTier && !status.willAdvance && <span>{(status.nextTier.threshold - status.projected).toLocaleString()} to go</span>}
                        </div>
                      </div>
                    )}

                    {/* Card balance */}
                    {isCard && isLinked && (
                      <div style={{ marginBottom: 14, padding: "10px 14px", background: css.surface2, borderRadius: 8 }}>
                        <div style={{ fontSize: 20, fontWeight: 600, color: css.text, fontFamily: "'JetBrains Mono', monospace" }}>
                          {(linkedAccounts[prog.id]?.pointsBalance || 0).toLocaleString()}
                          <span style={{ fontSize: 12, fontWeight: 400, color: css.text2, marginLeft: 4 }}>pts</span>
                        </div>
                        {prog.perks && <div style={{ fontSize: 10, color: css.text3, marginTop: 4 }}>{prog.perks}</div>}
                      </div>
                    )}

                    {/* Tier badges */}
                    {!isCard && prog.tiers && (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
                        {prog.tiers.map((tier, ti) => (
                          <span key={ti} style={{
                            fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                            background: status?.currentTier?.name === tier.name ? `${prog.color}20` : css.surface2,
                            color: status?.currentTier?.name === tier.name ? prog.color : css.text3,
                            border: status?.currentTier?.name === tier.name ? `1px solid ${prog.color}40` : `1px solid ${css.border}`,
                          }}>{tier.name}</span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    {isLinked ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{
                          flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${css.border}`,
                          background: css.surface2, color: css.text3,
                          fontSize: 11, fontWeight: 500, textAlign: "center",
                        }}>✓ Connected</span>
                        {prog.loginUrl && (
                          <a href={prog.loginUrl} target="_blank" rel="noopener noreferrer" style={{
                            padding: "8px 14px", borderRadius: 8, border: `1px solid ${prog.color}40`,
                            background: `${prog.color}12`, color: css.text, textDecoration: "none",
                            fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4,
                          }}>View ↗</a>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => { setShowLinkModal(prog.id); setLinkForm({ memberId: "" }); }} style={{
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

    // ── Trip Detail View ──
    if (tripDetailId) {
      const trip = trips.find(t => t.id === tripDetailId);
      if (!trip) { setTripDetailId(null); return null; }
      const prog = allPrograms.find(p => p.id === trip.program);
      const sColor = trip.status === "confirmed" ? css.success : trip.status === "planned" ? css.warning : css.accent;
      const sBg = trip.status === "confirmed" ? css.successBg : trip.status === "planned" ? css.warningBg : css.accentBg;
      const tripExps = expenses.filter(e => e.tripId === trip.id);
      const tripTotal = tripExps.reduce((s, e) => s + e.amount, 0);
      // Customer service: booking source (OTA) takes priority, fallback to airline
      const csInfo = trip.bookingSource || trip.airlineCS || (AIRLINE_CS[trip.program] ? { ...AIRLINE_CS[trip.program], type: "airline" } : null);
      const manageUrl = trip.bookingSource?.manage || trip.airlineCS?.manage || AIRLINE_CS[trip.program]?.manage || null;

      const DetailRow = ({ label, value, mono, accent, link }) => {
        if (!value) return null;
        return (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${css.border}` }}>
            <span style={{ fontSize: 12, color: css.text3, fontWeight: 500 }}>{label}</span>
            {link ? (
              <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: css.accent, textDecoration: "none", fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit" }}>{value} ↗</a>
            ) : (
              <span style={{ fontSize: 13, fontWeight: 600, color: accent ? css.accent : css.text, fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit" }}>{value}</span>
            )}
          </div>
        );
      };

      return (
        <div>
          {/* Back button */}
          <button onClick={() => setTripDetailId(null)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 0", marginBottom: 16,
            background: "none", border: "none", color: css.accent, cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>
            <span style={{ fontSize: 16 }}>←</span> Back to Trips
          </button>

          {/* Trip header card */}
          <div style={{
            background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "24px 28px", marginBottom: 20,
            borderTop: `3px solid ${prog?.color || css.accent}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                  background: prog ? `${prog.color}15` : css.surface2, border: `1px solid ${prog ? prog.color + "25" : css.border}`,
                }}>✈️</div>
                <div>
                  {trip.tripName && <div style={{ fontSize: 12, fontWeight: 600, color: css.accent, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{trip.tripName}</div>}
                  <div style={{ fontSize: 22, fontWeight: 700, color: css.text, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{trip.route}</div>
                  <div style={{ fontSize: 12, color: css.text3, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                    {trip.date} · {prog?.name || "—"}{trip.flightNumber ? ` · Flight ${trip.flightNumber}` : ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {trip.estimatedPoints > 0 && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: css.gold, fontFamily: "'JetBrains Mono', monospace" }}>+{trip.estimatedPoints.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: css.text3 }}>est. points</div>
                  </div>
                )}
                <span style={{ fontSize: 11, fontWeight: 600, color: sColor, background: sBg, border: `1px solid ${sColor}30`, borderRadius: 20, padding: "4px 12px", textTransform: "capitalize" }}>{trip.status}</span>
              </div>
            </div>
          </div>

          {/* Flight Details card */}
          <div style={{
            background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: css.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15 }}>🛫</span> Flight Details
            </div>
            <DetailRow label="Flight Number" value={trip.flightNumber} mono />
            <DetailRow label="Route" value={trip.route} />
            <DetailRow label="Date" value={trip.date} mono />
            <DetailRow label="Departure" value={trip.departureTime} mono />
            <DetailRow label="Arrival" value={trip.arrivalTime} mono />
            <DetailRow label="Aircraft" value={trip.aircraft} />
            <DetailRow label="Seat" value={trip.seat} mono />
            <DetailRow label="Fare Class" value={trip.fareClass} mono accent />
            <DetailRow label="Cabin" value={trip.class === "premium" ? "Premium / Business" : trip.class === "international" ? "International Economy" : "Domestic Economy"} />
            <DetailRow label="Distance" value={trip.distance ? `${Number(trip.distance).toLocaleString()} mi` : ""} mono />
            <DetailRow label="Travel Time" value={trip.travelTime} mono />
            {trip.layover && <DetailRow label="Layover" value={trip.layover} mono />}
          </div>

          {/* Booking Management card */}
          <div style={{
            background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: css.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15 }}>📋</span> Booking Management
            </div>
            <DetailRow label="Confirmation Code" value={trip.confirmationCode} mono accent />
            {manageUrl && <DetailRow label="Manage Reservation" value={csInfo?.name || "Manage Online"} link={manageUrl} />}

            {/* Customer service */}
            {csInfo && (
              <div style={{ marginTop: 14, padding: "14px 16px", background: css.surface2, borderRadius: 10, border: `1px solid ${css.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Customer Service</div>
                {trip.bookingSource && trip.bookingSource.type === "ota" && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${css.border}` }}>
                    <span style={{ fontSize: 12, color: css.text2 }}>{trip.bookingSource.name} (Booking Source)</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: css.accent, fontFamily: "'JetBrains Mono', monospace" }}>{trip.bookingSource.phone || "N/A"}</span>
                  </div>
                )}
                {(trip.airlineCS || AIRLINE_CS[trip.program]) && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                    <span style={{ fontSize: 12, color: css.text2 }}>{(trip.airlineCS || AIRLINE_CS[trip.program])?.name} (Airline)</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: css.text, fontFamily: "'JetBrains Mono', monospace" }}>{(trip.airlineCS || AIRLINE_CS[trip.program])?.phone}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expenses for this trip */}
          {tripExps.length > 0 && (
            <div style={{
              background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "20px 24px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: css.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15 }}>💰</span> Expenses · <span style={{ fontFamily: "'JetBrains Mono', monospace", color: css.accent }}>${tripTotal.toLocaleString()}</span>
              </div>
              {tripExps.map(exp => (
                <div key={exp.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${css.border}` }}>
                  <span style={{ fontSize: 12, color: css.text2 }}>{exp.description || exp.category}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: css.text, fontFamily: "'JetBrains Mono', monospace" }}>${exp.amount.toLocaleString()}</span>
                </div>
              ))}
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
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: isMobile ? 28 : 36, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>Your Trips</h2>
          <p style={{ color: css.text2, fontSize: 13, margin: "8px 0 0" }}>
            {trips.length} trips · {trips.filter(t => t.status === "confirmed").length} confirmed
            {grandTotal > 0 && <span style={{ marginLeft: 10, color: css.accent, fontFamily: "'JetBrains Mono', monospace" }}>${grandTotal.toLocaleString()} total spend</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={exportToFlighty} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
            background: user?.tier === "premium" ? css.accentBg : css.surface2,
            border: user?.tier === "premium" ? `1px solid ${css.accentBorder}` : `1px solid ${css.border}`,
            color: user?.tier === "premium" ? css.accent : css.text3, transition: "all 0.15s",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
            Flighty Sync
            {user?.tier !== "premium" && <span style={{ fontSize: 9, background: css.goldBg, color: css.gold, padding: "2px 6px", borderRadius: 6, fontWeight: 700, border: `1px solid ${css.gold}30` }}>PRO</span>}
          </button>
          <button onClick={() => setShowImportItinerary(true)} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
            background: css.accentBg, border: `1px solid ${css.accentBorder}`, color: css.accent, transition: "all 0.15s",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            Import Itinerary
          </button>
          <button onClick={() => setShowAddTrip(true)} className="c-btn-primary" style={{
            padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: css.accent, color: "#fff",
          }}>+ Add Trip</button>
        </div>
      </div>

      {/* Flighty instructions banner */}
      {user?.tier === "premium" && trips.filter(t => t.type === "flight").length > 0 && (
        <div className="c-a2" style={{
          display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", marginBottom: 20,
          background: css.accentBg, border: `1px solid ${css.accentBorder}`, borderRadius: 12,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>✈️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: css.text, marginBottom: 3 }}>Sync with Flighty</div>
            <div style={{ fontSize: 12, color: css.text2, lineHeight: 1.6 }}>
              1. Click <strong style={{ color: css.accent }}>Flighty Sync</strong> → download <code style={{ background: css.surface2, padding: "1px 5px", borderRadius: 4, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>continuum-flights.ics</code>
              {"  "}2. Import into Apple/Google Calendar{"  "}3. Open Flighty → Settings → Calendar Sync
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="c-a2" style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search trips..."
          style={{
            padding: "8px 14px", background: css.surface, border: `1px solid ${css.border}`,
            borderRadius: 8, color: css.text, fontSize: 12, outline: "none", flex: 1, minWidth: 160,
            fontFamily: "'Outfit', sans-serif",
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

      {/* Trip Cards */}
      <div className="c-a3" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filteredTrips.map(trip => {
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
                <div style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={e => { e.stopPropagation(); setTripDetailId(trip.id); }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                    background: prog ? `${prog.color}15` : css.surface2, border: `1px solid ${prog ? prog.color + "25" : css.border}`,
                    flexShrink: 0,
                  }}>{trip.type === "flight" ? "✈️" : trip.type === "hotel" ? "🏨" : "🚗"}</div>
                  <div>
                    {trip.tripName && <div style={{ fontSize: 11, fontWeight: 600, color: css.accent, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{trip.tripName}</div>}
                    <div style={{ fontSize: 14, fontWeight: 600, color: css.text }}>{trip.route || trip.property || trip.location}</div>
                    <div style={{ fontSize: 11, color: css.text3, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                      {trip.date} · {prog?.name?.split(" ")[0] || "—"}{trip.nights ? ` · ${trip.nights}n` : ""}
                      {trip.flightNumber ? ` · ${trip.flightNumber}` : ""}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: css.accent, fontWeight: 600, opacity: 0.6 }}>View →</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  {/* Expense total pill */}
                  {tripTotal > 0 && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: css.text, fontFamily: "'JetBrains Mono', monospace" }}>${tripTotal.toLocaleString()}</div>
                      <div style={{ fontSize: 9, color: css.text3 }}>{tripExps.length} exp.</div>
                    </div>
                  )}
                  {trip.estimatedPoints > 0 && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: css.gold, fontFamily: "'JetBrains Mono', monospace" }}>+{trip.estimatedPoints.toLocaleString()}</div>
                      <div style={{ fontSize: 9, color: css.text3 }}>pts</div>
                    </div>
                  )}
                  <span style={{ fontSize: 10, fontWeight: 600, color: sColor, background: sBg, border: `1px solid ${sColor}30`, borderRadius: 20, padding: "3px 10px", textTransform: "capitalize" }}>{trip.status}</span>
                  {/* Add Expense */}
                  <button onClick={e => { e.stopPropagation(); setShowAddExpense(trip.id); }} style={{
                    padding: "5px 11px", borderRadius: 8, border: `1px solid ${css.accentBorder}`,
                    background: css.accentBg, color: css.accent, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}>+ Expense</button>
                  {/* Chevron expand */}
                  <span style={{ color: css.text3, fontSize: 12, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
                  {/* Delete trip */}
                  <button onClick={e => { e.stopPropagation(); removeTrip(trip.id); }} style={{
                    width: 28, height: 28, borderRadius: 8, border: `1px solid ${D ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)"}`,
                    background: "rgba(239,68,68,0.06)", color: "#ef4444",
                    fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>×</button>
                </div>
              </div>

              {/* Expense drawer — expands inline */}
              {isExpanded && (
                <div style={{ borderTop: `1px solid ${css.border}`, background: css.surface2 }}>
                  {/* Drawer header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", gap: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: css.text2 }}>
                      {tripExps.length > 0
                        ? <><span style={{ color: css.text, fontFamily: "'JetBrains Mono', monospace" }}>${tripTotal.toLocaleString()}</span> · {tripExps.length} expense{tripExps.length !== 1 ? "s" : ""}</>
                        : "No expenses yet"}
                    </div>
                    <button onClick={e => { e.stopPropagation(); setShowExpenseReport(trip.id); }} style={{
                      padding: "5px 12px", borderRadius: 7, border: `1px solid ${css.border}`,
                      background: "transparent", color: css.text2, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    }}>Export Report ↗</button>
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
                            {cat.label} <span style={{ fontFamily: "'JetBrains Mono', monospace", color: css.text2 }}>${cat.total.toLocaleString()}</span>
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
                            <span style={{ fontSize: 15, flexShrink: 0 }}>{cat?.icon || "📎"}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 500, color: css.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description}</div>
                              <div style={{ fontSize: 10, color: css.text3, fontFamily: "'JetBrains Mono', monospace" }}>
                                {exp.date}{exp.paymentMethod ? ` · ${exp.paymentMethod}` : ""}{exp.receipt ? " · 🧾" : ""}
                                {isForeign ? ` · ${exp.currency} @ ${exp.fxRate}` : ""}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: usdAmt === 0 ? css.success : css.text, fontFamily: "'JetBrains Mono', monospace" }}>
                                {usdAmt === 0 ? "Free" : `$${usdAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                              </div>
                              {isForeign && (
                                <div style={{ fontSize: 9, color: css.text3, fontFamily: "'JetBrains Mono', monospace" }}>
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
        {filteredTrips.length === 0 && (
          <div style={{ textAlign: "center", padding: "56px 20px", color: css.text3, fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>✈️</div>
            {trips.length === 0 ? (
              <><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: css.text2, marginBottom: 8 }}>No trips yet</div>
              <button onClick={() => setShowAddTrip(true)} style={{ background: "none", border: "none", color: css.accent, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Add your first trip →</button></>
            ) : "No trips match your filters"}
          </div>
        )}
      </div>
    </div>
  );
  };

  const renderExpenses = () => { setActiveView("trips"); return null; };


  const renderOptimizer = () => {
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

    const OPT_TAB_LABELS = { global: "Global Status Optimizer", trip: "Trip-by-Trip Comparison", alliance: "Alliance Goal Optimizer", cards: "Credit Card Optimizer" };

    const BarFill = ({ pct, color }) => (
      <div style={{ width: "100%", height: 6, borderRadius: 3, background: css.surface2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.6s ease" }} />
      </div>
    );

    return (
      <div>
        {/* Header */}
        <div className="c-a1" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>Strategy Engine</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: isMobile ? 28 : 36, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>{OPT_TAB_LABELS[optimizerTab] || "Trip Optimizer"}</h2>
          <p style={{ color: css.text2, fontSize: 13, margin: "8px 0 0" }}>Credit flights strategically to accelerate elite status across {airlines.length} airline programs</p>
        </div>

        {flightTrips.length === 0 && (
          <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "28px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: css.text2 }}>No flight trips found. Add flights in the Trips tab to use the optimizer.</div>
          </div>
        )}

        {/* ── Tab 1: Global Status Optimizer ── */}
        {optimizerTab === "global" && flightTrips.length > 0 && (
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
                        <span style={{ fontSize: 12, fontWeight: 700, color: isBest ? css.accent : css.text3, fontFamily: "'JetBrains Mono', monospace", width: 20 }}>#{i + 1}</span>
                        <ProgramLogo prog={r.airline} size={24} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{r.airline.name}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {r.currentTier && <span style={{ fontSize: 10, fontWeight: 600, color: r.airline.color, background: `${r.airline.color}15`, padding: "2px 8px", borderRadius: 12 }}>{r.currentTier.name}</span>}
                        {!r.nextTier && r.currentTier && <span style={{ fontSize: 10, fontWeight: 700, color: css.success, background: css.successBg, padding: "2px 8px", borderRadius: 12 }}>MAX</span>}
                      </div>
                    </div>
                    <BarFill pct={r.pctToNext} color={r.airline.color} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: css.text3, marginTop: 5, fontFamily: "'JetBrains Mono', monospace" }}>
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
        {optimizerTab === "trip" && flightTrips.length > 0 && (
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
                            <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: r.airline.color }}>+{r.ptsFromTrip.toLocaleString()} {r.airline.unit}</span>
                            {advanced && <span style={{ fontSize: 10, fontWeight: 700, color: css.success, background: css.successBg, padding: "2px 8px", borderRadius: 12 }}>TIER UP</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: css.text3, width: 40, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>{r.before.pctToNext}%</span>
                          <BarFill pct={r.before.pctToNext} color={css.border} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 10, color: css.accent, width: 40, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{r.after.pctToNext}%</span>
                          <BarFill pct={r.after.pctToNext} color={r.airline.color} />
                        </div>
                        <div style={{ fontSize: 10, color: css.text3, marginTop: 5, fontFamily: "'JetBrains Mono', monospace" }}>
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
        {optimizerTab === "alliance" && flightTrips.length > 0 && (
          <div>
            {/* Goal selector */}
            <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>Target Alliance Status</div>
              <select value={allianceGoal} onChange={e => setAllianceGoal(e.target.value)} style={{
                width: "100%", maxWidth: 340, background: css.surface2, border: `1px solid ${css.border}`,
                color: css.text, padding: "8px 12px", borderRadius: 8, fontSize: 13, fontFamily: "'Outfit', sans-serif",
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
                      <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? css.accent : css.text3, fontFamily: "'JetBrains Mono', monospace", width: 20 }}>#{i + 1}</span>
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
                        <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: css.warning }}>{r.remaining.toLocaleString()} short</span>
                      )}
                    </div>
                  </div>
                  <BarFill pct={r.pct} color={r.reached ? css.success : r.color} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: css.text3, marginTop: 5, fontFamily: "'JetBrains Mono', monospace" }}>
                    <span>{r.existingPts.toLocaleString()} existing + {r.totalFromTrips.toLocaleString()} from trips = {r.total.toLocaleString()}</span>
                    <span>{r.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION 4: Credit Card Optimizer ── */}
        {optimizerTab === "cards" && (() => {
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
                      color: css.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, fontFamily: "'Outfit', sans-serif",
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
                        fontFamily: "'JetBrains Mono', monospace", boxSizing: "border-box", outline: "none",
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
                              Use <strong style={{ color: css.accent }}>{cat.best.card.name}</strong> — <span style={{ fontFamily: "'JetBrains Mono', monospace", color: css.gold }}>{cat.best.rate}x</span> {cat.best.currency}
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
                          <div style={{ fontSize: 14, fontWeight: 700, color: css.gold, fontFamily: "'JetBrains Mono', monospace" }}>
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
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: i === 0 ? css.accent : css.text3 }}>{r.rate}x</span>
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
                              padding: "8px", textAlign: "center", fontFamily: "'JetBrains Mono', monospace",
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

    return (
      <div>
        {/* Header */}
        <div className="c-a1" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>Analytics</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: isMobile ? 28 : 36, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>Annual Reports</h2>
            <p style={{ color: css.text2, fontSize: 13, margin: "8px 0 0" }}>Your 2026 travel year at a glance</p>
          </div>
          <button onClick={() => setShowUpgrade(true)} style={{
            padding: "9px 16px", borderRadius: 8, border: `1px solid ${css.goldBg}`,
            background: css.goldBg, color: css.gold, fontSize: 12, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>★ Export PDF — Premium</button>
        </div>

        {/* Summary stats */}
        <div className="c-a2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Points Projected", value: totalPoints.toLocaleString(), sub: "loyalty pts", color: css.gold },
            { label: "Hotel Nights", value: totalNights, sub: "qualifying", color: css.accent },
            { label: "Flights", value: totalFlights, sub: "planned", color: css.success },
            { label: "Est. Spend", value: `$${(trips.length * 850).toLocaleString()}`, sub: "travel budget", color: css.text2 },
          ].map((stat, i) => (
            <div key={i} style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "18px 20px", boxShadow: D ? "none" : "0 1px 4px rgba(26,21,18,0.05)" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: stat.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: css.text, margin: "6px 0 2px" }}>{stat.label}</div>
              <div style={{ fontSize: 10, color: css.text3 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="c-a3" style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 16, padding: "20px 22px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
            <h4 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 500, color: css.text, margin: 0 }}>Points by Month</h4>
            <span style={{ fontSize: 11, color: css.text3, fontFamily: "'JetBrains Mono', monospace" }}>2026</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: isMobile ? 4 : 8, height: 140 }}>
            {monthlyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                {d.points > 0 && (
                  <div style={{ fontSize: 8, color: css.accent, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
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
                <span style={{ fontSize: 8, color: css.text3, fontFamily: "'JetBrains Mono', monospace" }}>{d.month.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Forecast */}
        <div className="c-a4" style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 16, padding: "20px 22px" }}>
          <h4 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 500, color: css.text, margin: "0 0 16px" }}>Year-End Status Forecast</h4>
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
                        <div style={{ fontSize: 10, color: status.willAdvance ? css.success : css.text3, flexShrink: 0, marginLeft: 8, fontFamily: "'JetBrains Mono', monospace" }}>
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

    // Determine user's elite tier from selected program via projected status
    const myStatus = getProjectedStatus(allianceMyProgram);
    const myEliteLevel = myStatus?.currentTier?.name || null;
    const myAllianceMeta = ALLIANCE_MBR[allianceMyProgram];
    const myAllianceTierKey = myAllianceMeta && myEliteLevel ? myAllianceMeta.tierMap[myEliteLevel] : null;
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
              onChange={e => setAllianceMyProgram(e.target.value)}
              style={{ width: "100%", background: lp.surface2, border: `1px solid ${lp.border2}`, color: lp.text, padding: "8px 10px", fontFamily: lp.mono, fontSize: 12, outline: "none" }}
            >
              {Object.entries(PROG_NAMES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
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

  const renderPremium = () => (
    <div>
      {/* Hero */}
      <div className="c-a1" style={{ textAlign: "center", marginBottom: 40, paddingTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <img src="/continuum-travel-logo.svg" alt="Continuum" style={{ height: 160, display: "block", filter: D ? "brightness(0.9) saturate(0.9)" : "none" }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: css.gold, marginBottom: 10 }}>Unlock the Full Journey</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: isMobile ? 32 : 44, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>Continuum Premium</h2>
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
              <span style={{ fontSize: 38, fontWeight: 700, color: css.text, fontFamily: "'Cormorant Garamond', Georgia, serif", lineHeight: 1 }}>{plan.price}</span>
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
        <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 500, color: css.text, margin: "0 0 20px" }}>Why upgrade?</h3>
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
  // NAV CONFIG
  // ============================================================
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "programs", label: "Programs", icon: "🔗" },
    { id: "trips", label: "Trips", icon: "🗺️" },
    { id: "optimizer", label: "Optimizer", icon: "🧠" },
    { id: "reports", label: "Reports", icon: "📈" },
    { id: "premium", label: "Premium", icon: "💎" },
  ];

  const viewRenderers = { dashboard: renderDashboard, programs: renderPrograms, trips: renderTrips, expenses: renderExpenses, optimizer: renderOptimizer, reports: renderReports, alliances: renderAlliances, premium: renderPremium };

  // ============================================================
  // MAIN LAYOUT — Warm Editorial Design System
  // ============================================================
  const D = darkMode;
  const css = {
    bg: D ? "#111009" : "#FAFAF8",
    surface: D ? "#1C1914" : "#FFFFFF",
    surface2: D ? "#24201A" : "#F5F0EB",
    surface3: D ? "#2E281F" : "#EDE6DC",
    border: D ? "#38302A" : "#E4D9CE",
    text: D ? "#F0E8DF" : "#1A1512",
    text2: D ? "#A89080" : "#6B5444",
    text3: D ? "#6B5248" : "#A8937E",
    accent: D ? "#E8883A" : "#D4742D",
    accentBg: D ? "rgba(232,136,58,0.12)" : "#FFF3E8",
    accentBorder: D ? "rgba(232,136,58,0.25)" : "rgba(212,116,45,0.25)",
    gold: "#C9A84C",
    goldBg: D ? "rgba(201,168,76,0.1)" : "#FDF8EE",
    success: D ? "#3DB87A" : "#1E7A4A",
    successBg: D ? "rgba(61,184,122,0.1)" : "#EAF7F0",
    warning: D ? "#E8B44A" : "#B07A15",
    warningBg: D ? "rgba(232,180,74,0.1)" : "#FEF7E6",
    nav: D ? "rgba(17,16,9,0.96)" : "rgba(255,252,249,0.97)",
    shadow: D ? "0 2px 16px rgba(0,0,0,0.4)" : "0 2px 16px rgba(26,21,18,0.08)",
    shadowHover: D ? "0 8px 32px rgba(232,136,58,0.15)" : "0 8px 32px rgba(212,116,45,0.12)",
  };

  return (
    <div data-theme={D ? "dark" : "light"} style={{
      height: "100vh", overflow: "hidden", background: css.bg, display: "flex", flexDirection: "column",
      fontFamily: "'Outfit', 'DM Sans', sans-serif", color: css.text, position: "relative",
      transition: "background 0.3s ease, color 0.3s ease",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${D ? "#38302A" : "#D4C4B4"}; border-radius: 3px; }
        .c-card { transition: transform 0.2s cubic-bezier(0.175,0.885,0.32,1.2), box-shadow 0.2s ease, border-color 0.2s ease; }
        .c-card:hover { transform: translateY(-2px); box-shadow: ${D ? "0 8px 32px rgba(232,136,58,0.15)" : "0 8px 32px rgba(212,116,45,0.1)"}; border-color: ${D ? "rgba(232,136,58,0.35)" : "rgba(212,116,45,0.3)"} !important; }
        .c-nav-btn { transition: all 0.15s ease; }
        .c-nav-btn:hover { background: ${D ? "rgba(240,232,223,0.06)" : "rgba(26,21,18,0.05)"} !important; }
        .c-row-hover { transition: background 0.12s ease; }
        .c-row-hover:hover { background: ${D ? "rgba(240,232,223,0.04)" : "rgba(212,116,45,0.04)"} !important; }
        .c-btn-primary { transition: all 0.15s ease; }
        .c-btn-primary:hover { background: ${D ? "#F09040" : "#C06425"} !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(212,116,45,0.3); }
        .c-tag { display:inline-flex; align-items:center; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
        @keyframes c-fade-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes c-pulse { 0%,100% { opacity:0.6; transform:scale(1); } 50% { opacity:1; transform:scale(1.2); } }
        .c-a1 { animation: c-fade-up 0.45s ease 0.05s backwards; }
        .c-a2 { animation: c-fade-up 0.45s ease 0.1s backwards; }
        .c-a3 { animation: c-fade-up 0.45s ease 0.15s backwards; }
        .c-a4 { animation: c-fade-up 0.45s ease 0.2s backwards; }
        .c-a5 { animation: c-fade-up 0.45s ease 0.25s backwards; }
        .c-a6 { animation: c-fade-up 0.45s ease 0.3s backwards; }
        .c-a7 { animation: c-fade-up 0.45s ease 0.35s backwards; }
      `}</style>

      {/* ── Top Navigation ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100, flexShrink: 0,
        background: css.nav, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderBottom: `1px solid ${css.border}`,
        height: isMobile ? "auto" : 62,
        display: "flex", flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center",
        padding: isMobile ? 0 : "0 24px",
        boxShadow: `0 1px 0 ${css.border}`,
      }}>
        {/* Desktop nav */}
        {!isMobile && (<>
          {/* Logo */}
          <div style={{ flexShrink: 0, marginRight: 32 }}>
            <img src="/continuum-travel-logo.svg" alt="Continuum" style={{ height: 36, display: "block", filter: D ? "brightness(0.9)" : "none" }} />
          </div>

          {/* Nav pills */}
          {(() => {
            const PROG_SUBS = [
              { id: "airlines",     label: "Airlines" },
              { id: "hotels",       label: "Hotels" },
              { id: "credit_cards", label: "Credit Cards" },
              { id: "rentals",      label: "Car Rental Programs" },
              { id: "alliances",    label: "Airline Alliance Benefits" },
            ];
            const OPT_SUBS = [
              { id: "global",   label: "Global Status Optimizer" },
              { id: "trip",     label: "Trip-by-Trip Comparison" },
              { id: "alliance", label: "Alliance Goal Optimizer" },
              { id: "cards",    label: "Credit Card Optimizer" },
            ];
            return (
              <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0, overflow: "visible", position: "relative" }}>
                {navItems.map(item => {
                  if (item.id === "programs") {
                    return (
                      <div key="programs" style={{ position: "relative" }}
                        onMouseEnter={() => setProgramsHover(true)}
                        onMouseLeave={() => setProgramsHover(false)}
                      >
                        <button onClick={() => setActiveView("programs")} className="c-nav-btn" style={{
                          display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
                          border: "none", cursor: "pointer",
                          background: activeView === "programs" ? css.accentBg : "transparent",
                          color: activeView === "programs" ? css.accent : css.text2,
                          fontSize: 13, fontWeight: activeView === "programs" ? 600 : 400,
                          fontFamily: "'Outfit', sans-serif",
                        }}>
                          <span style={{ fontSize: 14 }}>{item.icon}</span>
                          {item.label}
                          <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
                        </button>
                        {programsHover && (
                          <div style={{
                            position: "absolute", top: "100%", left: 0, zIndex: 200,
                            paddingTop: 6,
                          }}>
                            <div style={{
                              background: css.surface, border: `1px solid ${css.border}`,
                              borderRadius: 10, padding: "6px 0", minWidth: 220,
                              boxShadow: css.shadow,
                            }}>
                              {PROG_SUBS.map(sub => (
                                <button key={sub.id} onClick={() => { setActiveView("programs"); setProgramSubView(sub.id); setProgramsHover(false); }} style={{
                                  display: "block", width: "100%", textAlign: "left",
                                  padding: "9px 18px", border: "none", cursor: "pointer",
                                  background: (activeView === "programs" && programSubView === sub.id) ? css.accentBg : "transparent",
                                  color: (activeView === "programs" && programSubView === sub.id) ? css.accent : css.text,
                                  fontSize: 13, fontFamily: "'Outfit', sans-serif",
                                }}>{sub.label}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  if (item.id === "optimizer") {
                    return (
                      <div key="optimizer" style={{ position: "relative" }}
                        onMouseEnter={() => setOptimizerHover(true)}
                        onMouseLeave={() => setOptimizerHover(false)}
                      >
                        <button onClick={() => setActiveView("optimizer")} className="c-nav-btn" style={{
                          display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
                          border: "none", cursor: "pointer",
                          background: activeView === "optimizer" ? css.accentBg : "transparent",
                          color: activeView === "optimizer" ? css.accent : css.text2,
                          fontSize: 13, fontWeight: activeView === "optimizer" ? 600 : 400,
                          fontFamily: "'Outfit', sans-serif",
                        }}>
                          <span style={{ fontSize: 14 }}>{item.icon}</span>
                          {item.label}
                          <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
                        </button>
                        {optimizerHover && (
                          <div style={{
                            position: "absolute", top: "100%", left: 0, zIndex: 200,
                            paddingTop: 6,
                          }}>
                            <div style={{
                              background: css.surface, border: `1px solid ${css.border}`,
                              borderRadius: 10, padding: "6px 0", minWidth: 220,
                              boxShadow: css.shadow,
                            }}>
                              {OPT_SUBS.map(sub => (
                                <button key={sub.id} onClick={() => { setActiveView("optimizer"); setOptimizerTab(sub.id); setOptimizerHover(false); }} style={{
                                  display: "block", width: "100%", textAlign: "left",
                                  padding: "9px 18px", border: "none", cursor: "pointer",
                                  background: (activeView === "optimizer" && optimizerTab === sub.id) ? css.accentBg : "transparent",
                                  color: (activeView === "optimizer" && optimizerTab === sub.id) ? css.accent : css.text,
                                  fontSize: 13, fontFamily: "'Outfit', sans-serif",
                                }}>{sub.label}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <button key={item.id} onClick={() => setActiveView(item.id)} className="c-nav-btn" style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
                      border: "none", cursor: "pointer",
                      background: activeView === item.id ? css.accentBg : "transparent",
                      color: activeView === item.id ? css.accent : css.text2,
                      fontSize: 13, fontWeight: activeView === item.id ? 600 : 400,
                      fontFamily: "'Outfit', sans-serif",
                    }}>
                      <span style={{ fontSize: 14 }}>{item.icon}</span>
                      {item.label}
                      {item.id === "premium" && <span style={{ fontSize: 9, background: css.goldBg, color: css.gold, padding: "2px 6px", borderRadius: 6, fontWeight: 700, border: `1px solid ${D ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.3)"}` }}>PRO</span>}
                    </button>
                  );
                })}
              </nav>
            );
          })()}

          {/* Right: dark mode, avatar, sign out — compact, never wraps */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
            <button onClick={() => setDarkMode(d => !d)} title={D ? "Light mode" : "Dark mode"} style={{
              width: 32, height: 32, borderRadius: 8, border: `1px solid ${css.border}`,
              background: "transparent", cursor: "pointer", fontSize: 15,
              display: "flex", alignItems: "center", justifyContent: "center", color: css.text2,
            }}>{D ? "☀️" : "🌙"}</button>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `linear-gradient(135deg, ${css.accent}, ${D ? "#C06020" : "#B85820"})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>{user?.avatar || "U"}</div>
            <button onClick={handleLogout} style={{
              padding: "5px 12px", borderRadius: 8, border: `1px solid ${css.border}`,
              background: "transparent", color: css.text3, fontSize: 11, fontWeight: 500,
              cursor: "pointer", whiteSpace: "nowrap",
            }}>Sign out</button>
          </div>
        </>)}

        {/* Mobile nav */}
        {isMobile && (<>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px" }}>
            <img src="/continuum-travel-logo.svg" alt="Continuum" style={{ height: 28 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setDarkMode(d => !d)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{D ? "☀️" : "🌙"}</button>
              <button onClick={handleLogout} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 11, cursor: "pointer" }}>Out</button>
            </div>
          </div>
          <div style={{ display: "flex", overflowX: "auto", borderTop: `1px solid ${css.border}`, padding: "0 8px", scrollbarWidth: "none" }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveView(item.id)} style={{
                display: "flex", alignItems: "center", gap: 4, padding: "8px 10px", border: "none", cursor: "pointer",
                background: "transparent", borderBottom: activeView === item.id ? `2px solid ${css.accent}` : "2px solid transparent",
                color: activeView === item.id ? css.accent : css.text3,
                fontSize: 11, fontWeight: activeView === item.id ? 600 : 400,
                whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.15s",
              }}><span>{item.icon}</span> {item.label}</button>
            ))}
          </div>
          {activeView === "programs" && (
            <div style={{ display: "flex", overflowX: "auto", borderTop: `1px solid ${css.border}`, padding: "0 8px", scrollbarWidth: "none", background: css.surface2 }}>
              {[
                { id: "airlines", label: "Airlines" },
                { id: "hotels", label: "Hotels" },
                { id: "credit_cards", label: "Credit Cards" },
                { id: "rentals", label: "Car Rentals" },
                { id: "alliances", label: "Alliance Benefits" },
              ].map(sub => (
                <button key={sub.id} onClick={() => setProgramSubView(sub.id)} style={{
                  padding: "6px 10px", border: "none", cursor: "pointer", background: "transparent",
                  borderBottom: programSubView === sub.id ? `2px solid ${css.accent}` : "2px solid transparent",
                  color: programSubView === sub.id ? css.accent : css.text3,
                  fontSize: 10, fontWeight: programSubView === sub.id ? 600 : 400,
                  whiteSpace: "nowrap", flexShrink: 0,
                }}>{sub.label}</button>
              ))}
            </div>
          )}
          {activeView === "optimizer" && (
            <div style={{ display: "flex", overflowX: "auto", borderTop: `1px solid ${css.border}`, padding: "0 8px", scrollbarWidth: "none", background: css.surface2 }}>
              {[
                { id: "global", label: "Global Optimizer" },
                { id: "trip", label: "Trip-by-Trip" },
                { id: "alliance", label: "Alliance Goal" },
                { id: "cards", label: "Card Optimizer" },
              ].map(sub => (
                <button key={sub.id} onClick={() => setOptimizerTab(sub.id)} style={{
                  padding: "6px 10px", border: "none", cursor: "pointer", background: "transparent",
                  borderBottom: optimizerTab === sub.id ? `2px solid ${css.accent}` : "2px solid transparent",
                  color: optimizerTab === sub.id ? css.accent : css.text3,
                  fontSize: 10, fontWeight: optimizerTab === sub.id ? 600 : 400,
                  whiteSpace: "nowrap", flexShrink: 0,
                }}>{sub.label}</button>
              ))}
            </div>
          )}
        </>)}
      </header>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: isMobile ? "24px 16px 60px" : "36px 40px 80px" }}>
          {viewRenderers[activeView]?.()}
        </div>
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
            background: "#211e2e", border: "1px solid #2a2640", borderRadius: 8, padding: 28, width: "100%", maxWidth: 440,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 20px", fontFamily: "'Inter Tight', Inter, sans-serif" }}>Add Trip</h3>

            {/* Trip Name */}
            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Trip Name</span>
              <input value={newTrip.tripName} onChange={e => setNewTrip(p => ({ ...p, tripName: e.target.value }))}
                placeholder="e.g. London Spring Getaway, Tokyo Anniversary"
                style={{
                  display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)",
                  border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
                }} />
            </label>

            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {["flight", "hotel", "rental"].map(type => (
                <button key={type} onClick={() => setNewTrip(p => ({ ...p, type, program: type === "flight" ? "aa" : type === "hotel" ? "marriott" : "hertz" }))} style={{
                  flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif",
                  background: newTrip.type === type ? "rgba(14,165,160,0.2)" : "rgba(255,255,255,0.03)",
                  color: newTrip.type === type ? "#0EA5A0" : "rgba(0,0,0,0.3)", textTransform: "capitalize",
                }}>{type === "flight" ? "✈️" : type === "hotel" ? "🏨" : "🚗"} {type}</button>
              ))}
            </div>

            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Program</span>
              <select value={newTrip.program} onChange={e => setNewTrip(p => ({ ...p, program: e.target.value }))} style={{
                display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640",
                borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
              }}>
                {(newTrip.type === "flight" ? [...LOYALTY_PROGRAMS.airlines, ...customPrograms.filter(p => p.category === "airline")] : newTrip.type === "hotel" ? [...LOYALTY_PROGRAMS.hotels, ...customPrograms.filter(p => p.category === "hotel")] : [...LOYALTY_PROGRAMS.rentals, ...customPrograms.filter(p => p.category === "rental")]).map(p => (
                  <option key={p.id} value={p.id} style={{ background: "#211e2e" }}>{p.name}</option>
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
                  border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
                }} />
            </label>

            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <label style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Date</span>
                <input type="date" value={newTrip.date} onChange={e => setNewTrip(p => ({ ...p, date: e.target.value }))} style={{
                  display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)",
                  border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
                }} />
              </label>
              {newTrip.type === "flight" && (
                <label style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Class</span>
                  <select value={newTrip.class} onChange={e => setNewTrip(p => ({ ...p, class: e.target.value }))} style={{
                    display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)",
                    border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
                  }}>
                    <option value="domestic" style={{ background: "#211e2e" }}>Domestic Economy</option>
                    <option value="international" style={{ background: "#211e2e" }}>International</option>
                    <option value="premium" style={{ background: "#211e2e" }}>Premium / Business</option>
                  </select>
                </label>
              )}
              {newTrip.type === "hotel" && (
                <label style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Nights</span>
                  <input type="number" min={1} value={newTrip.nights} onChange={e => setNewTrip(p => ({ ...p, nights: parseInt(e.target.value) || 1 }))} style={{
                    display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)",
                    border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
                  }} />
                </label>
              )}
            </div>

            <label style={{ display: "block", marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Status</span>
              <select value={newTrip.status} onChange={e => setNewTrip(p => ({ ...p, status: e.target.value }))} style={{
                display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)",
                border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
              }}>
                <option value="confirmed" style={{ background: "#211e2e" }}>Confirmed</option>
                <option value="planned" style={{ background: "#211e2e" }}>Planned</option>
                <option value="wishlist" style={{ background: "#211e2e" }}>Wishlist</option>
              </select>
            </label>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAddTrip(false)} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid #2a2640", background: "rgba(255,255,255,0.03)",
                color: "#8a8f98", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Cancel</button>
              <button onClick={handleAddTrip} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif",
                background: "#0EA5A0", color: "#f7f8f8",
              }}>Add Trip</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Itinerary Modal */}
      {showImportItinerary && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={() => setShowImportItinerary(false)}>
          <div onClick={e => e.stopPropagation()} style={{
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
                fontFamily: "'JetBrains Mono', monospace", outline: "none", resize: "vertical",
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
      {showLinkModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={() => setShowLinkModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#211e2e", border: "1px solid #2a2640", borderRadius: 8, padding: 28, width: "100%", maxWidth: 400,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 6px", fontFamily: "'Inter Tight', Inter, sans-serif" }}>Link Account</h3>
            <p style={{ color: "#8a8f98", fontSize: 12, margin: "0 0 20px", fontFamily: "Inter, sans-serif" }}>
              Connect your {allPrograms.find(p => p.id === showLinkModal)?.name || "loyalty"} account
            </p>

            <label style={{ display: "block", marginBottom: 18 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Member ID</span>
              <input value={linkForm.memberId} onChange={e => setLinkForm(p => ({ ...p, memberId: e.target.value }))} placeholder="Enter your member number"
                style={{
                  display: "block", width: "100%", marginTop: 6, padding: "12px 14px", background: "rgba(255,255,255,0.03)",
                  border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
                }} />
            </label>
            <p style={{ fontSize: 10, color: "#62666d", fontFamily: "Inter, sans-serif", marginBottom: 20 }}>
              In production, this would use OAuth to securely connect to the loyalty program's API. Demo mode uses sample data.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLinkModal(null)} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid #2a2640", background: "rgba(255,255,255,0.03)",
                color: "#8a8f98", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Cancel</button>
              <button onClick={() => handleLinkAccount(showLinkModal)} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif",
                background: "#0EA5A0", color: "#f7f8f8",
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
            background: "#211e2e", border: "1px solid #2a2640", borderRadius: 8, padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto",
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 6px", fontFamily: "'Inter Tight', Inter, sans-serif" }}>Add Loyalty Program</h3>
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
              <button onClick={() => { setShowAddProgram(false); setNewProgram({ name: "", category: "airline", logo: "✈️", color: "#0EA5A0", memberId: "", unit: "Points", tiers: "", selectedId: "", search: "" }); }} style={{
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
        }} onClick={() => setShowUpgrade(false)}>
          <div onClick={e => e.stopPropagation()} style={{
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
      {showAddExpense && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={() => { setShowAddExpense(null); setEditExpenseId(null); setNewExpense(BLANK_EXPENSE); }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#211e2e", border: "1px solid #2a2640", borderRadius: 8, padding: 28, width: "100%", maxWidth: 480,
            maxHeight: "90vh", overflowY: "auto",
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 6px", fontFamily: "'Inter Tight', Inter, sans-serif" }}>{editExpenseId ? "Edit Expense" : "Add Expense"}</h3>
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
                    background: newExpense.category === cat.id ? `${cat.color}25` : "rgba(255,255,255,0.03)",
                    color: newExpense.category === cat.id ? cat.color : "rgba(0,0,0,0.3)", transition: "all 0.2s",
                  }}>{cat.icon} {cat.label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <label style={{ flex: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Description</span>
                <input value={newExpense.description} onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Marriott 3 nights"
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
              </label>
              <label style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Currency</span>
                <select value={newExpense.currency} onChange={e => setNewExpense(p => ({ ...p, currency: e.target.value, fxRate: e.target.value === "USD" ? 1 : p.fxRate }))}
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "#1a1728", border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}>
                  {["USD","EUR","GBP","CAD","AUD","JPY","CHF","CNY","HKD","SGD","MXN","BRL","INR","KRW","AED","THB","NOK","SEK","DKK","NZD"].map(c => (
                    <option key={c} value={c} style={{ background: "#211e2e" }}>{c}</option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <label style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Amount ({newExpense.currency})</span>
                <input type="number" min="0" step="0.01" value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))} placeholder="0.00"
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
              </label>
              {newExpense.currency !== "USD" && (
                <label style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>FX Rate → USD</span>
                  <input type="number" min="0" step="0.0001" value={newExpense.fxRate} onChange={e => setNewExpense(p => ({ ...p, fxRate: e.target.value }))} placeholder="1.0000"
                    style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                  {newExpense.amount && newExpense.fxRate && (
                    <div style={{ marginTop: 4, fontSize: 10, color: "#0EA5A0", fontFamily: "Inter, sans-serif" }}>
                      = ${(parseFloat(newExpense.amount) * parseFloat(newExpense.fxRate)).toFixed(2)} USD
                    </div>
                  )}
                </label>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <label style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Date</span>
                <input type="date" value={newExpense.date} onChange={e => setNewExpense(p => ({ ...p, date: e.target.value }))}
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
              </label>
              <label style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Payment Method</span>
                <select value={newExpense.paymentMethod} onChange={e => setNewExpense(p => ({ ...p, paymentMethod: e.target.value }))}
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}>
                  <option value="" style={{ background: "#211e2e" }}>Select...</option>
                  <option value="Amex Platinum" style={{ background: "#211e2e" }}>Amex Platinum</option>
                  <option value="Chase Sapphire" style={{ background: "#211e2e" }}>Chase Sapphire Reserve</option>
                  <option value="Cash" style={{ background: "#211e2e" }}>Cash</option>
                  <option value="Debit Card" style={{ background: "#211e2e" }}>Debit Card</option>
                  <option value="Other" style={{ background: "#211e2e" }}>Other</option>
                </select>
              </label>
            </div>

            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>Notes (optional)</span>
              <input value={newExpense.notes} onChange={e => setNewExpense(p => ({ ...p, notes: e.target.value }))} placeholder="Business meal, personal, etc."
                style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2640", borderRadius: 8, color: "#f7f8f8", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
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
                    background: !newExpense.receipt ? "rgba(255,255,255,0.03)" : "transparent", cursor: "pointer",
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
                flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid #2a2640", background: "rgba(255,255,255,0.03)",
                color: "#8a8f98", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Cancel</button>
              <button onClick={handleAddExpense} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif",
                background: "#0EA5A0", color: "#f7f8f8",
              }}>{editExpenseId ? "Save Changes" : "Add Expense"}</button>
            </div>
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

        return (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
          }} onClick={() => setShowExpenseReport(null)}>
            <div onClick={e => e.stopPropagation()} style={{
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
                  {trip.type === "flight" ? "✈️" : trip.type === "hotel" ? "🏨" : "🚗"} {getTripName(trip)}
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
                <button onClick={() => window.print()} style={{
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
