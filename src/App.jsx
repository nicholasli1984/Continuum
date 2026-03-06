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
    const customByCategory = {
      airline: customPrograms.filter(p => p.category === "airline"),
      hotel: customPrograms.filter(p => p.category === "hotel"),
      rental: customPrograms.filter(p => p.category === "rental"),
      card: customPrograms.filter(p => p.category === "card"),
    };
    const categories = [
      { label: "Airlines", key: "air", programs: [...LOYALTY_PROGRAMS.airlines, ...customByCategory.airline] },
      { label: "Hotels", key: "htl", programs: [...LOYALTY_PROGRAMS.hotels, ...customByCategory.hotel] },
      { label: "Rental Cars", key: "car", programs: [...LOYALTY_PROGRAMS.rentals, ...customByCategory.rental] },
      { label: "Credit Cards", key: "crd", programs: [...LOYALTY_PROGRAMS.creditCards, ...customByCategory.card] },
    ];
    const linkedCount = Object.keys(linkedAccounts).length;

    return (
      <div>
        {/* Page header */}
        <div className="c-a1" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>Loyalty Portfolio</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: isMobile ? 28 : 36, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>Your Programs</h2>
            <p style={{ color: css.text2, fontSize: 13, margin: "8px 0 0", fontFamily: "'Outfit', sans-serif" }}>
              {linkedCount} linked · {Object.values(customByCategory).flat().length} custom programs
            </p>
          </div>
          <button onClick={() => setShowAddProgram(true)} className="c-btn-primary" style={{
            padding: "10px 22px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: css.accent, color: "#fff", flexShrink: 0, fontFamily: "'Outfit', sans-serif",
          }}>+ Add Program</button>
        </div>

        {categories.map((cat, ci) => (
          <div key={cat.key} className={`c-a${ci + 2}`} style={{ marginBottom: 40 }}>
            {/* Category header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${css.border}` }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 500, color: css.text, margin: 0 }}>{cat.label}</h3>
              <span style={{ fontSize: 11, color: css.text3, fontFamily: "'JetBrains Mono', monospace" }}>
                {cat.programs.filter(p => linkedAccounts[p.id]).length}/{cat.programs.length} linked
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {cat.programs.map(prog => {
                const isLinked = !!linkedAccounts[prog.id];
                const status = isLinked ? getProjectedStatus(prog.id) : null;
                const isCard = cat.key === "crd";

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
        ))}
      </div>
    );
  };

  const renderTrips = () => {
    const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);
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
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
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
                    </div>
                  </div>
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
    const scenarioTrips = trips.filter(t => t.type === "flight");
    const isPremium = user?.tier === "premium";
    return (
      <div>
        {/* Header */}
        <div className="c-a1" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: css.gold, marginBottom: 8 }}>Premium Feature</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: isMobile ? 28 : 36, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>Trip Optimizer</h2>
            <p style={{ color: css.text2, fontSize: 13, margin: "8px 0 0" }}>Credit flights strategically to accelerate elite status</p>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: css.gold, background: css.goldBg, border: `1px solid ${css.gold}30`, borderRadius: 20, padding: "4px 12px", flexShrink: 0 }}>★ PREMIUM</span>
        </div>

        {!isPremium ? (
          /* Premium Gate */
          <div className="c-a2">
            {/* Blurred preview */}
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ filter: "blur(4px)", pointerEvents: "none", opacity: 0.4 }}>
                <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 16, padding: 24, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ width: "40%", height: 14, background: css.surface2, borderRadius: 4 }} />
                    <div style={{ width: "20%", height: 14, background: css.successBg, borderRadius: 4 }} />
                  </div>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ background: css.surface2, borderRadius: 8, padding: 14, marginBottom: 8 }}>
                      <div style={{ width: "60%", height: 12, background: css.border, borderRadius: 3, marginBottom: 6 }} />
                      <div style={{ width: "40%", height: 10, background: css.border, borderRadius: 3 }} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Overlay CTA */}
              <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                background: D ? "rgba(17,16,9,0.75)" : "rgba(250,250,248,0.75)", backdropFilter: "blur(2px)",
                padding: 32, textAlign: "center",
              }}>
                <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.6 }}>🔐</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 600, color: css.text, margin: "0 0 10px" }}>Unlock the Optimizer</h3>
                <p style={{ color: css.text2, fontSize: 14, maxWidth: 380, margin: "0 auto 24px", lineHeight: 1.6 }}>
                  See the optimal way to credit every flight across your programs. Find hidden status shortcuts and maximize each trip.
                </p>
                <button onClick={() => setShowUpgrade(true)} className="c-btn-primary" style={{
                  padding: "13px 36px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700,
                  background: css.gold, color: "#1A1200",
                }}>Upgrade to Premium — $9.99/mo</button>
              </div>
            </div>

            {/* Feature list */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              {[
                { title: "Credit Strategy AI", desc: "Know exactly which airline to credit each flight to for maximum status velocity" },
                { title: "Gap Analysis", desc: "See exactly how many miles you need to hit the next tier across all programs" },
                { title: "Mileage Run Calculator", desc: "Find the cheapest routes to earn the exact status miles you need" },
                { title: "Hotel Qualifying Nights", desc: "Optimize your hotel stays across brands to hit elite thresholds efficiently" },
              ].map((f, i) => (
                <div key={i} style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: css.text, marginBottom: 5 }}>
                    <span style={{ color: css.gold, marginRight: 6 }}>★</span>{f.title}
                  </div>
                  <div style={{ fontSize: 12, color: css.text2, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Premium content */
          <div>
            {/* Strategy cards */}
            <div className="c-a2" style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 16, padding: "20px 22px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
                <h4 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 500, color: css.text, margin: 0 }}>Credit Strategy · 2026</h4>
                <span style={{ fontSize: 11, color: css.text3, fontFamily: "'JetBrains Mono', monospace" }}>{scenarioTrips.length} flights analyzed</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {LOYALTY_PROGRAMS.airlines.map(airline => {
                  const airlineTrips = trips.filter(t => t.program === airline.id && t.type === "flight");
                  const totalPts = airlineTrips.reduce((sum, t) => sum + (t.estimatedPoints || 0), 0);
                  const status = getProjectedStatus(airline.id);
                  return (
                    <div key={airline.id} style={{
                      background: css.surface2, border: `1px solid ${css.border}`,
                      borderLeft: `3px solid ${airline.color}`, borderRadius: 10, padding: "14px 16px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{airline.name}</div>
                          <div style={{ fontSize: 11, color: css.text3, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                            {airlineTrips.length} flights · +{totalPts.toLocaleString()} pts projected
                          </div>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          {status?.willAdvance ? (
                            <span style={{ fontSize: 11, fontWeight: 700, color: css.success, background: css.successBg, border: `1px solid ${css.success}30`, borderRadius: 20, padding: "3px 10px" }}>
                              ↑ {status.projectedTier.name}
                            </span>
                          ) : status?.nextTier ? (
                            <span style={{ fontSize: 11, color: css.warning, fontFamily: "'JetBrains Mono', monospace" }}>
                              {(status.nextTier.threshold - status.projected).toLocaleString()} more → {status.nextTier.name}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="c-a3" style={{
              background: css.surface, border: `1px solid ${css.border}`, borderLeft: `3px solid ${css.success}`,
              borderRadius: 16, padding: "20px 22px",
            }}>
              <h4 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 500, color: css.success, margin: "0 0 14px" }}>Optimizer Recommendations</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Credit your LAX→ATL flight to AA instead of Delta to push closer to Platinum Pro",
                  "Your Tokyo trip alone could earn 48 Marriott nights with the right booking strategy",
                  "Add one more Hilton stay (3+ nights) to lock in Diamond status for 2027",
                  "Your Amex Platinum earns 5x on flights — ensure all bookings use this card",
                ].map((tip, i) => (
                  <div key={i} style={{
                    background: css.surface2, borderRadius: 8, padding: "10px 14px", fontSize: 12,
                    color: css.text, display: "flex", gap: 10, alignItems: "flex-start",
                  }}>
                    <span style={{ color: css.success, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>→</span>
                    {tip}
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

  const viewRenderers = { dashboard: renderDashboard, programs: renderPrograms, trips: renderTrips, expenses: renderExpenses, optimizer: renderOptimizer, reports: renderReports, premium: renderPremium };

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
          <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0, overflow: "hidden" }}>
            {navItems.map(item => (
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
            ))}
          </nav>

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
