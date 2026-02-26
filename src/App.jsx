import { useState, useEffect, useCallback, useMemo } from "react";

// ============================================================
// DATA & CONSTANTS
// ============================================================
const LOYALTY_PROGRAMS = {
  airlines: [
    {
      id: "aa",
      name: "American Airlines AAdvantage",
      logo: "✈️",
      color: "#0078D2",
      accent: "#C8102E",
      tiers: [
        { name: "Gold", threshold: 30000, perks: "Priority boarding, free checked bag, 40% bonus miles" },
        { name: "Platinum", threshold: 60000, perks: "Upgrades, 60% bonus, Admiral's Club day passes" },
        { name: "Platinum Pro", threshold: 90000, perks: "Premium upgrades, 80% bonus, complimentary MCE" },
        { name: "Executive Platinum", threshold: 120000, perks: "Systemwide upgrades, 120% bonus, ConciergeKey eligible" },
      ],
      unit: "Loyalty Points",
      earnRate: { domestic: 5, international: 10, premium: 20 },
    },
    {
      id: "dl",
      name: "Delta SkyMiles",
      logo: "🔺",
      color: "#003366",
      accent: "#C8102E",
      tiers: [
        { name: "Silver Medallion", threshold: 25000, perks: "Unlimited upgrades, 40% bonus miles" },
        { name: "Gold Medallion", threshold: 50000, perks: "SkyTeam Elite Plus, 60% bonus, Sky Priority" },
        { name: "Platinum Medallion", threshold: 75000, perks: "Choice Benefits, 80% bonus, waived fees" },
        { name: "Diamond Medallion", threshold: 125000, perks: "Global upgrades, 120% bonus, Delta ONE access" },
      ],
      unit: "MQMs",
      earnRate: { domestic: 5, international: 10, premium: 18 },
    },
    {
      id: "ua",
      name: "United MileagePlus",
      logo: "🌐",
      color: "#002244",
      accent: "#0066CC",
      tiers: [
        { name: "Silver", threshold: 12, perks: "Economy Plus, priority boarding, 1 bag free", isSegments: true },
        { name: "Gold", threshold: 24, perks: "Star Alliance Gold, United Club passes", isSegments: true },
        { name: "Platinum", threshold: 36, perks: "Regional upgrades, 2 GPUs", isSegments: true },
        { name: "1K", threshold: 54, perks: "Global upgrades, PlusPoints, Premier Access", isSegments: true },
      ],
      unit: "PQPs",
      earnRate: { domestic: 5, international: 11, premium: 22 },
    },
  ],
  hotels: [
    {
      id: "marriott",
      name: "Marriott Bonvoy",
      logo: "🏨",
      color: "#7C2529",
      accent: "#B5985A",
      tiers: [
        { name: "Silver Elite", threshold: 10, perks: "10% bonus points, priority late checkout" },
        { name: "Gold Elite", threshold: 25, perks: "25% bonus, room upgrade, 2pm checkout" },
        { name: "Platinum Elite", threshold: 50, perks: "50% bonus, suite upgrade, lounge access" },
        { name: "Titanium Elite", threshold: 75, perks: "75% bonus, United Silver, 48hr guarantee" },
        { name: "Ambassador Elite", threshold: 100, perks: "Your24, ambassador service, all Titanium perks" },
      ],
      unit: "Nights",
      earnRate: { standard: 10, premium: 15, luxury: 25 },
    },
    {
      id: "hilton",
      name: "Hilton Honors",
      logo: "🌟",
      color: "#003B5C",
      accent: "#0099CC",
      tiers: [
        { name: "Silver", threshold: 10, perks: "20% bonus, 5th night free on rewards" },
        { name: "Gold", threshold: 40, perks: "80% bonus, room upgrade, free breakfast" },
        { name: "Diamond", threshold: 60, perks: "100% bonus, space-available upgrade, exec lounge" },
      ],
      unit: "Nights",
      earnRate: { standard: 10, premium: 15, luxury: 20 },
    },
    {
      id: "ihg",
      name: "IHG One Rewards",
      logo: "🔑",
      color: "#2E1A47",
      accent: "#6B3FA0",
      tiers: [
        { name: "Silver Elite", threshold: 10, perks: "20% bonus, late checkout" },
        { name: "Gold Elite", threshold: 20, perks: "40% bonus, room upgrade" },
        { name: "Platinum Elite", threshold: 40, perks: "60% bonus, guaranteed availability" },
        { name: "Diamond Elite", threshold: 70, perks: "100% bonus, suite upgrade, amenity" },
      ],
      unit: "Nights",
      earnRate: { standard: 10, premium: 15, luxury: 20 },
    },
  ],
  rentals: [
    {
      id: "hertz",
      name: "Hertz Gold Plus Rewards",
      logo: "🚗",
      color: "#FFD700",
      accent: "#000000",
      tiers: [
        { name: "Gold", threshold: 0, perks: "Skip the counter, choose your car" },
        { name: "Five Star", threshold: 10, perks: "Guaranteed upgrades, priority service" },
        { name: "President's Circle", threshold: 20, perks: "Premium vehicles, dedicated line" },
      ],
      unit: "Rentals",
      earnRate: { standard: 1, premium: 1.5 },
    },
    {
      id: "national",
      name: "National Emerald Club",
      logo: "🟢",
      color: "#006845",
      accent: "#2ECC71",
      tiers: [
        { name: "Emerald Club", threshold: 0, perks: "Choose any midsize+, bypass counter" },
        { name: "Emerald Club Executive", threshold: 12, perks: "Free upgrades, guaranteed one-class" },
        { name: "Emerald Club Executive Elite", threshold: 25, perks: "Premium aisle access, priority" },
      ],
      unit: "Rentals",
      earnRate: { standard: 1, premium: 1.5 },
    },
  ],
  creditCards: [
    {
      id: "amex_plat",
      name: "Amex Platinum",
      logo: "💳",
      color: "#B4B4B4",
      accent: "#006FCF",
      perks: "5x flights, Marriott/Hilton Gold, Centurion Lounge, $200 airline credit",
      annualFee: 695,
      bonusCategories: { flights: 5, hotels: 5, dining: 1, other: 1 },
    },
    {
      id: "chase_sapphire",
      name: "Chase Sapphire Reserve",
      logo: "💎",
      color: "#1A1F36",
      accent: "#004977",
      perks: "3x travel/dining, $300 travel credit, Priority Pass, DoorDash",
      annualFee: 550,
      bonusCategories: { flights: 3, hotels: 3, dining: 3, other: 1 },
    },
  ],
};

const SAMPLE_USER = {
  name: "Alex Rivera",
  email: "alex@example.com",
  avatar: "AR",
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
    { id: 1, type: "flight", program: "aa", route: "JFK → LAX", date: "2026-03-15", class: "premium", estimatedPoints: 4200, status: "confirmed" },
    { id: 2, type: "hotel", program: "marriott", property: "JW Marriott LA Live", date: "2026-03-15", nights: 3, estimatedNights: 3, status: "confirmed" },
    { id: 3, type: "flight", program: "dl", route: "LAX → ATL", date: "2026-03-18", class: "domestic", estimatedPoints: 2800, status: "confirmed" },
    { id: 4, type: "flight", program: "aa", route: "DFW → LHR", date: "2026-04-10", class: "international", estimatedPoints: 9200, status: "planned" },
    { id: 5, type: "hotel", program: "hilton", property: "Waldorf Astoria London", date: "2026-04-10", nights: 5, estimatedNights: 5, status: "planned" },
    { id: 6, type: "rental", program: "hertz", location: "London Heathrow", date: "2026-04-10", days: 3, estimatedRentals: 1, status: "planned" },
    { id: 7, type: "flight", program: "ua", route: "SFO → NRT", date: "2026-06-20", class: "premium", estimatedPoints: 8800, status: "planned" },
    { id: 8, type: "hotel", program: "marriott", property: "Ritz-Carlton Tokyo", date: "2026-06-20", nights: 7, estimatedNights: 7, status: "planned" },
    { id: 9, type: "flight", program: "dl", route: "JFK → CDG", date: "2026-08-05", class: "international", estimatedPoints: 7500, status: "wishlist" },
    { id: 10, type: "hotel", program: "ihg", property: "InterContinental Paris", date: "2026-08-05", nights: 4, estimatedNights: 4, status: "wishlist" },
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
const ProgressRing = ({ progress, size = 80, stroke = 6, color = "#6366f1", label, sublabel }) => {
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

const Badge = ({ children, color = "#6366f1", small }) => (
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
    background: active ? "rgba(139,92,246,0.15)" : "transparent", color: active ? "#a78bfa" : "rgba(255,255,255,0.45)", transition: "all 0.2s",
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
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [newTrip, setNewTrip] = useState({ type: "flight", program: "aa", route: "", date: "", class: "domestic", nights: 1, status: "planned" });
  const [trips, setTrips] = useState([]);
  const [linkedAccounts, setLinkedAccounts] = useState({});
  const [showLinkModal, setShowLinkModal] = useState(null);
  const [linkForm, setLinkForm] = useState({ memberId: "" });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => { setTimeout(() => setAnimateIn(true), 100); }, []);

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setUser(SAMPLE_USER);
    setTrips(SAMPLE_USER.upcomingTrips);
    setLinkedAccounts(SAMPLE_USER.linkedAccounts);
    setIsLoggedIn(true);
  };

  const handleRegister = (e) => {
    if (e) e.preventDefault();
    setUser({ ...SAMPLE_USER, name: registerForm.name || "New User", email: registerForm.email });
    setTrips([]);
    setLinkedAccounts({});
    setIsLoggedIn(true);
  };

  const handleLogout = () => { setIsLoggedIn(false); setUser(null); setActiveView("dashboard"); };

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
    setNewTrip({ type: "flight", program: "aa", route: "", date: "", class: "domestic", nights: 1, status: "planned" });
  };

  const removeTrip = (id) => setTrips(prev => prev.filter(t => t.id !== id));

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

  const allPrograms = useMemo(() => [...LOYALTY_PROGRAMS.airlines, ...LOYALTY_PROGRAMS.hotels, ...LOYALTY_PROGRAMS.rentals], []);

  // ============================================================
  // LOGIN / REGISTER SCREEN
  // ============================================================
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0a0a1a 0%, #1a1040 40%, #0d1b3e 70%, #0a0a1a 100%)",
        fontFamily: "'Outfit', 'DM Sans', system-ui, sans-serif", padding: 20,
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{
          width: "100%", maxWidth: 440, opacity: animateIn ? 1 : 0, transform: animateIn ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 42, marginBottom: 8 }}>✦</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: -0.5, fontFamily: "Outfit" }}>StatusVault</h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 6, fontFamily: "DM Sans" }}>Elite Status Intelligence Platform</p>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 32,
            backdropFilter: "blur(40px)", boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
          }}>
            <div style={{ display: "flex", marginBottom: 28, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 3 }}>
              {["Sign In", "Register"].map((tab, i) => (
                <button key={tab} onClick={() => setIsRegistering(i === 1)} style={{
                  flex: 1, padding: "10px 0", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "DM Sans",
                  background: (i === 0 ? !isRegistering : isRegistering) ? "rgba(139,92,246,0.2)" : "transparent",
                  color: (i === 0 ? !isRegistering : isRegistering) ? "#a78bfa" : "rgba(255,255,255,0.35)", transition: "all 0.3s",
                }}>{tab}</button>
              ))}
            </div>

            {!isRegistering ? (
              <div>
                <label style={{ display: "block", marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "DM Sans" }}>Email</span>
                  <input type="email" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} placeholder="alex@example.com"
                    style={{ display: "block", width: "100%", marginTop: 6, padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: "DM Sans", outline: "none", boxSizing: "border-box" }} />
                </label>
                <label style={{ display: "block", marginBottom: 24 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "DM Sans" }}>Password</span>
                  <input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••"
                    style={{ display: "block", width: "100%", marginTop: 6, padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: "DM Sans", outline: "none", boxSizing: "border-box" }} />
                </label>
                <button onClick={handleLogin} style={{
                  width: "100%", padding: "13px 0", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Outfit",
                  background: "linear-gradient(135deg, #7c3aed, #6366f1, #818cf8)", color: "#fff", boxShadow: "0 4px 20px rgba(99,102,241,0.3)", transition: "all 0.3s",
                }}>Sign In</button>
                <button onClick={() => { setLoginForm({ email: "alex@example.com", password: "demo" }); setTimeout(handleLogin, 100); }} style={{
                  width: "100%", padding: "11px 0", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "DM Sans",
                  background: "transparent", color: "#a78bfa", marginTop: 10, transition: "all 0.3s",
                }}>Try Demo Account →</button>
              </div>
            ) : (
              <div>
                <label style={{ display: "block", marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "DM Sans" }}>Full Name</span>
                  <input value={registerForm.name} onChange={e => setRegisterForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name"
                    style={{ display: "block", width: "100%", marginTop: 6, padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: "DM Sans", outline: "none", boxSizing: "border-box" }} />
                </label>
                <label style={{ display: "block", marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "DM Sans" }}>Email</span>
                  <input type="email" value={registerForm.email} onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))} placeholder="you@email.com"
                    style={{ display: "block", width: "100%", marginTop: 6, padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: "DM Sans", outline: "none", boxSizing: "border-box" }} />
                </label>
                <label style={{ display: "block", marginBottom: 24 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "DM Sans" }}>Password</span>
                  <input type="password" value={registerForm.password} onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••"
                    style={{ display: "block", width: "100%", marginTop: 6, padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: "DM Sans", outline: "none", boxSizing: "border-box" }} />
                </label>
                <button onClick={handleRegister} style={{
                  width: "100%", padding: "13px 0", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Outfit",
                  background: "linear-gradient(135deg, #7c3aed, #6366f1, #818cf8)", color: "#fff", boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
                }}>Create Account</button>
              </div>
            )}

            <div style={{ textAlign: "center", marginTop: 20, padding: "14px 0 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "DM Sans", margin: 0 }}>By signing in, you agree to our Terms of Service</p>
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
            { label: "Linked Programs", value: Object.keys(linkedAccounts).length, icon: "🔗", color: "#818cf8" },
            { label: "Planned Trips", value: totalTrips, icon: "🗺️", color: "#34d399" },
            { label: "Confirmed", value: confirmedTrips, icon: "✅", color: "#fbbf24" },
            { label: "Status Advances", value: willAdvanceCount, icon: "🚀", color: "#f472b6" },
          ].map((stat, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "18px 20px",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{ fontSize: 28 }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", fontFamily: "Outfit" }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500, fontFamily: "DM Sans" }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Airline Status Cards */}
        {airlineStatuses.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 14, fontFamily: "Outfit" }}>✈️ Airline Elite Status</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
              {airlineStatuses.map(p => {
                const s = p.status;
                const progress = s.nextTier ? (s.projected / s.nextTier.threshold) * 100 : 100;
                return (
                  <div key={p.id} onClick={() => { setSelectedProgram(p.id); setActiveView("programs"); }} style={{
                    background: `linear-gradient(135deg, ${p.color}15, ${p.accent}10)`, border: `1px solid ${p.color}30`,
                    borderRadius: 16, padding: 22, cursor: "pointer", transition: "all 0.3s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Outfit" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "DM Sans", marginTop: 2 }}>
                          {s.currentTier ? s.currentTier.name : "Member"} → {s.nextTier?.name || "Top Tier"}
                        </div>
                      </div>
                      {s.willAdvance && <Badge color="#34d399" small>↑ Advancing!</Badge>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <ProgressRing progress={Math.min(progress, 100)} size={70} color={p.color} label={`${Math.round(progress)}%`} sublabel={p.unit} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4, fontFamily: "DM Sans" }}>
                          <span>{s.projected.toLocaleString()} {p.unit}</span>
                          <span>{s.nextTier?.threshold.toLocaleString()}</span>
                        </div>
                        <MiniBar value={s.projected} max={s.nextTier?.threshold || s.projected} color={p.color} height={8} />
                        {s.tripBoosts > 0 && (
                          <div style={{ fontSize: 10, color: "#34d399", marginTop: 6, fontFamily: "DM Sans" }}>+{s.tripBoosts.toLocaleString()} from upcoming trips</div>
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
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 14, fontFamily: "Outfit" }}>🏨 Hotel Elite Status</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
              {hotelStatuses.map(p => {
                const s = p.status;
                const progress = s.nextTier ? (s.projected / s.nextTier.threshold) * 100 : 100;
                return (
                  <div key={p.id} onClick={() => { setSelectedProgram(p.id); setActiveView("programs"); }} style={{
                    background: `linear-gradient(135deg, ${p.color}15, ${p.accent}10)`, border: `1px solid ${p.color}30`,
                    borderRadius: 16, padding: 22, cursor: "pointer", transition: "all 0.3s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Outfit" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "DM Sans", marginTop: 2 }}>
                          {s.currentTier ? s.currentTier.name : "Member"} • {s.current} nights YTD
                        </div>
                      </div>
                      {s.willAdvance && <Badge color="#34d399" small>↑ Tier Up!</Badge>}
                    </div>
                    <MiniBar value={s.projected} max={s.nextTier?.threshold || s.projected} color={p.color} height={8} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 6, fontFamily: "DM Sans" }}>
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
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: 0, fontFamily: "Outfit" }}>📅 Upcoming Trips</h3>
            <button onClick={() => setActiveView("trips")} style={{
              background: "none", border: "none", color: "#818cf8", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans",
            }}>View All →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {trips.slice(0, 4).map(trip => {
              const prog = allPrograms.find(p => p.id === trip.program);
              return (
                <div key={trip.id} style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 18px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{trip.type === "flight" ? "✈️" : trip.type === "hotel" ? "🏨" : "🚗"}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "DM Sans" }}>{trip.route || trip.property || trip.location}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "DM Sans" }}>{trip.date} • {prog?.name}</div>
                    </div>
                  </div>
                  <Badge color={trip.status === "confirmed" ? "#34d399" : trip.status === "planned" ? "#fbbf24" : "#818cf8"} small>
                    {trip.status}
                  </Badge>
                </div>
              );
            })}
            {trips.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.25)", fontSize: 13, fontFamily: "DM Sans" }}>
                No trips yet. Add your first trip to start tracking! ✈️
              </div>
            )}
          </div>
        </div>

        {/* Credit Card Recommendations - Monetization */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: 0, fontFamily: "Outfit" }}>💳 Recommended Cards</h3>
            <Badge color="#fbbf24" small>SPONSORED</Badge>
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
            {CREDIT_CARD_OFFERS.slice(0, 3).map((card, i) => (
              <div key={i} style={{
                minWidth: 220, background: `linear-gradient(135deg, ${card.color}20, ${card.color}08)`, border: `1px solid ${card.color}30`,
                borderRadius: 14, padding: 18, flex: "0 0 auto",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Outfit", marginBottom: 6 }}>{card.name}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fbbf24", fontFamily: "Outfit", marginBottom: 4 }}>{card.bonus}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "DM Sans", marginBottom: 10 }}>Spend {card.spend} • {card.fee}</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {card.tags.map((tag, j) => <Badge key={j} color={card.color || "#6366f1"} small>{tag}</Badge>)}
                </div>
                <button style={{
                  width: "100%", marginTop: 12, padding: "8px 0", borderRadius: 8, border: `1px solid ${card.color}40`, background: "transparent",
                  color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans",
                }}>Apply Now →</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPrograms = () => {
    const categories = [
      { label: "Airlines", icon: "✈️", programs: LOYALTY_PROGRAMS.airlines },
      { label: "Hotels", icon: "🏨", programs: LOYALTY_PROGRAMS.hotels },
      { label: "Rental Cars", icon: "🚗", programs: LOYALTY_PROGRAMS.rentals },
      { label: "Credit Cards", icon: "💳", programs: LOYALTY_PROGRAMS.creditCards },
    ];

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "Outfit" }}>Loyalty Programs</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "4px 0 0", fontFamily: "DM Sans" }}>Link and manage all your accounts</p>
          </div>
        </div>

        {categories.map((cat, ci) => (
          <div key={ci} style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 12, fontFamily: "Outfit" }}>{cat.icon} {cat.label}</h3>
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
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Outfit" }}>{prog.name}</div>
                          {isLinked && !isCard && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "DM Sans" }}>
                            ID: {linkedAccounts[prog.id].memberId}
                          </div>}
                          {isCard && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "DM Sans" }}>{prog.annualFee ? `$${prog.annualFee}/yr` : ""}</div>}
                        </div>
                      </div>
                      {isLinked ? <Badge color="#34d399" small>Linked</Badge> : <Badge color="rgba(255,255,255,0.3)" small>Not Linked</Badge>}
                    </div>

                    {isLinked && status && !isCard && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontFamily: "DM Sans" }}>
                          <span>Current: {status.currentTier?.name || "Member"}</span>
                          <span>Next: {status.nextTier?.name}</span>
                        </div>
                        <MiniBar value={status.projected} max={status.nextTier?.threshold || status.projected} color={prog.color} height={8} />
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4, fontFamily: "DM Sans" }}>
                          {status.projected.toLocaleString()} / {(status.nextTier?.threshold || status.projected).toLocaleString()} {prog.unit}
                          {status.willAdvance && <span style={{ color: "#34d399", marginLeft: 8 }}>🎉 On track to advance!</span>}
                        </div>
                      </div>
                    )}

                    {isCard && isLinked && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "Outfit" }}>
                          {(linkedAccounts[prog.id]?.pointsBalance || 0).toLocaleString()} pts
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "DM Sans", marginTop: 2 }}>{prog.perks}</div>
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

                    <button onClick={() => isLinked ? null : (setShowLinkModal(prog.id), setLinkForm({ memberId: "" }))} style={{
                      width: "100%", padding: "9px 0", borderRadius: 10, border: `1px solid ${isLinked ? "rgba(255,255,255,0.08)" : prog.color + "40"}`,
                      background: isLinked ? "rgba(255,255,255,0.03)" : `${prog.color}15`, color: isLinked ? "rgba(255,255,255,0.4)" : "#fff",
                      fontSize: 12, fontWeight: 600, cursor: isLinked ? "default" : "pointer", fontFamily: "DM Sans", transition: "all 0.3s",
                    }}>{isLinked ? "✓ Connected" : "Link Account"}</button>
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
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "Outfit" }}>Annual Travel Plan</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "4px 0 0", fontFamily: "DM Sans" }}>{trips.length} trips planned for 2026</p>
        </div>
        <button onClick={() => setShowAddTrip(true)} style={{
          padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Outfit",
          background: "linear-gradient(135deg, #7c3aed, #6366f1)", color: "#fff", boxShadow: "0 4px 15px rgba(99,102,241,0.3)",
        }}>+ Add Trip</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search trips..."
          style={{
            padding: "8px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, color: "#fff", fontSize: 12, fontFamily: "DM Sans", outline: "none", flex: 1, minWidth: 160,
          }} />
        {["all", "confirmed", "planned", "wishlist"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: "8px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "DM Sans",
            background: filterStatus === s ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
            color: filterStatus === s ? "#a78bfa" : "rgba(255,255,255,0.4)", textTransform: "capitalize",
          }}>{s}</button>
        ))}
      </div>

      {/* Trip Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filteredTrips.map(trip => {
          const prog = allPrograms.find(p => p.id === trip.program);
          return (
            <div key={trip.id} style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 20px",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                  background: prog ? `${prog.color}15` : "rgba(255,255,255,0.04)",
                }}>{trip.type === "flight" ? "✈️" : trip.type === "hotel" ? "🏨" : "🚗"}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Outfit" }}>{trip.route || trip.property || trip.location}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "DM Sans", marginTop: 2 }}>
                    {trip.date} • {prog?.name || "Unknown"} {trip.nights ? `• ${trip.nights} nights` : ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {trip.estimatedPoints > 0 && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24", fontFamily: "Outfit" }}>+{trip.estimatedPoints.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "DM Sans" }}>points</div>
                  </div>
                )}
                {trip.estimatedNights > 0 && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#34d399", fontFamily: "Outfit" }}>+{trip.estimatedNights}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "DM Sans" }}>nights</div>
                  </div>
                )}
                <Badge color={trip.status === "confirmed" ? "#34d399" : trip.status === "planned" ? "#fbbf24" : "#818cf8"} small>{trip.status}</Badge>
                <button onClick={() => removeTrip(trip.id)} style={{
                  width: 28, height: 28, borderRadius: 8, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444",
                  fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>×</button>
              </div>
            </div>
          );
        })}
        {filteredTrips.length === 0 && (
          <div style={{ textAlign: "center", padding: 50, color: "rgba(255,255,255,0.25)", fontSize: 13, fontFamily: "DM Sans" }}>
            No trips match your filters
          </div>
        )}
      </div>
    </div>
  );

  const renderOptimizer = () => {
    const scenarioTrips = trips.filter(t => t.type === "flight");
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "Outfit" }}>Trip Optimizer</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "4px 0 0", fontFamily: "DM Sans" }}>See how crediting flights differently affects your status</p>
          </div>
          <Badge color="#f59e0b">★ PREMIUM</Badge>
        </div>

        {user?.tier !== "premium" ? (
          <div style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(139,92,246,0.08))", border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 20, padding: 40, textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "Outfit", margin: "0 0 8px" }}>Unlock Trip Optimizer</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "DM Sans", maxWidth: 400, margin: "0 auto 24px" }}>
              See the optimal way to credit each flight across your airline programs. Find hidden status shortcuts and maximize every trip.
            </p>
            <button onClick={() => setShowUpgrade(true)} style={{
              padding: "12px 32px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Outfit",
              background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
            }}>Upgrade to Premium — $9.99/mo</button>
          </div>
        ) : (
          <div>
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 22, marginBottom: 20,
            }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Outfit", marginBottom: 14 }}>Optimal Credit Strategy for 2026</h4>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "DM Sans", marginBottom: 16 }}>
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
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Outfit" }}>{airline.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "DM Sans" }}>
                          {airlineTrips.length} flights • +{totalPts.toLocaleString()} pts projected
                        </div>
                      </div>
                      {status?.willAdvance && <Badge color="#34d399">Will advance to {status.projectedTier.name}!</Badge>}
                      {status && !status.willAdvance && status.nextTier && (
                        <div style={{ fontSize: 11, color: "#fbbf24", fontFamily: "DM Sans" }}>
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
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#34d399", fontFamily: "Outfit", marginBottom: 10 }}>💡 Optimizer Recommendations</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Consider crediting your LAX→ATL flight to AA instead of Delta to push closer to Platinum Pro",
                  "Your Tokyo trip alone could earn 48 Marriott nights with the right booking strategy",
                  "Add one more Hilton stay (3+ nights) to lock in Diamond status for 2027",
                  "Your Amex Platinum earns 5x on flights — ensure all bookings use this card",
                ].map((tip, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", fontSize: 12,
                    color: "rgba(255,255,255,0.6)", fontFamily: "DM Sans", display: "flex", gap: 8,
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
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "Outfit" }}>Annual Reports</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "4px 0 0", fontFamily: "DM Sans" }}>Your 2026 travel year at a glance</p>
          </div>
          <button onClick={() => setShowUpgrade(true)} style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)",
            color: "#f59e0b", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans",
          }}>★ Export PDF — Premium</button>
        </div>

        {/* Bar Chart */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 22, marginBottom: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Outfit", marginBottom: 18 }}>Points Earned by Month</h4>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140 }}>
            {monthlyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 9, color: "#fbbf24", fontWeight: 600, fontFamily: "DM Sans" }}>
                  {d.points > 0 ? `${(d.points / 1000).toFixed(1)}k` : ""}
                </div>
                <div style={{
                  width: "100%", maxWidth: 32, height: `${Math.max((d.points / maxPts) * 100, 3)}%`, minHeight: 3,
                  borderRadius: "4px 4px 0 0", background: d.points > 0 ? "linear-gradient(180deg, #818cf8, #6366f1)" : "rgba(255,255,255,0.04)",
                  transition: "height 1s ease",
                }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "DM Sans" }}>{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Total Points Projected", value: trips.reduce((s, t) => s + (t.estimatedPoints || 0), 0).toLocaleString(), icon: "⭐", color: "#fbbf24" },
            { label: "Hotel Nights Planned", value: trips.reduce((s, t) => s + (t.estimatedNights || t.nights || 0), 0), icon: "🌙", color: "#818cf8" },
            { label: "Flights Planned", value: trips.filter(t => t.type === "flight").length, icon: "✈️", color: "#34d399" },
            { label: "Est. Travel Spend", value: "$" + (trips.length * 850).toLocaleString(), icon: "💰", color: "#f472b6" },
          ].map((stat, i) => (
            <div key={i} style={{
              background: `${stat.color}08`, border: `1px solid ${stat.color}20`, borderRadius: 14, padding: 20,
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "Outfit" }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "DM Sans", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Status Forecast */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 22 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Outfit", marginBottom: 14 }}>Year-End Status Forecast</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 10 }}>
            {allPrograms.filter(p => linkedAccounts[p.id] && p.tiers).map(prog => {
              const status = getProjectedStatus(prog.id);
              if (!status) return null;
              return (
                <div key={prog.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10,
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <span style={{ fontSize: 20 }}>{prog.logo}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "DM Sans" }}>{prog.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "DM Sans" }}>
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
        <div style={{ fontSize: 48, marginBottom: 12 }}>✦</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "Outfit" }}>StatusVault Premium</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontFamily: "DM Sans", marginTop: 6 }}>Maximize every mile, every night, every point.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 36 }}>
        {[
          { name: "Free", price: "$0", period: "forever", color: "rgba(255,255,255,0.1)", features: ["3 linked programs", "Basic dashboard", "Manual trip entry", "Annual summary", "Community support"] },
          { name: "Premium", price: "$9.99", period: "/month", color: "#7c3aed", popular: true, features: ["Unlimited programs", "Trip Optimizer AI", "Status match alerts", "PDF reports & exports", "Credit card recommendations", "Mileage expiration alerts", "Priority support", "Ad-free experience"] },
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
                padding: "4px 36px", transform: "rotate(45deg)", fontFamily: "DM Sans",
              }}>POPULAR</div>
            )}
            <div style={{ fontSize: 16, fontWeight: 700, color: plan.popular ? "#a78bfa" : "#fff", fontFamily: "Outfit", marginBottom: 6 }}>{plan.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 18 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: "#fff", fontFamily: "Outfit" }}>{plan.price}</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "DM Sans" }}>{plan.period}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
              {plan.features.map((f, fi) => (
                <div key={fi} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "DM Sans" }}>
                  <span style={{ color: plan.popular ? "#a78bfa" : "#34d399", fontSize: 13 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <button style={{
              width: "100%", padding: "12px 0", borderRadius: 12, border: plan.popular ? "none" : "1px solid rgba(255,255,255,0.1)",
              background: plan.popular ? `linear-gradient(135deg, #7c3aed, #6366f1)` : "rgba(255,255,255,0.04)",
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit",
              boxShadow: plan.popular ? "0 4px 20px rgba(99,102,241,0.3)" : "none",
            }}>{plan.price === "$0" ? "Current Plan" : "Upgrade Now"}</button>
          </div>
        ))}
      </div>

      {/* Feature Highlights */}
      <div style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "Outfit", marginBottom: 16 }}>Why Go Premium?</h3>
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
              background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 16,
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Outfit", marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "DM Sans", lineHeight: 1.5 }}>{f.desc}</div>
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
    { id: "premium", label: "Premium", icon: "✦" },
  ];

  const viewRenderers = { dashboard: renderDashboard, programs: renderPrograms, trips: renderTrips, optimizer: renderOptimizer, reports: renderReports, premium: renderPremium };

  // ============================================================
  // MAIN LAYOUT
  // ============================================================
  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #0a0a1a 0%, #1a1040 40%, #0d1b3e 70%, #0a0a1a 100%)",
      fontFamily: "'Outfit', 'DM Sans', system-ui, sans-serif", color: "#fff", display: "flex",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <aside style={{
        width: 220, minHeight: "100vh", background: "rgba(0,0,0,0.3)", borderRight: "1px solid rgba(255,255,255,0.04)",
        padding: "20px 12px", display: "flex", flexDirection: "column", flexShrink: 0,
        position: "sticky", top: 0, height: "100vh", overflowY: "auto", boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 28 }}>
          <span style={{ fontSize: 22 }}>✦</span>
          <span style={{ fontSize: 17, fontWeight: 800, fontFamily: "Outfit", letterSpacing: -0.3 }}>StatusVault</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
              background: activeView === item.id ? "rgba(139,92,246,0.12)" : "transparent",
              color: activeView === item.id ? "#a78bfa" : "rgba(255,255,255,0.4)",
              fontSize: 13, fontWeight: activeView === item.id ? 600 : 500, fontFamily: "DM Sans", textAlign: "left", transition: "all 0.2s", width: "100%",
            }}>
              <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{item.icon}</span>
              {item.label}
              {item.id === "premium" && <span style={{ marginLeft: "auto", fontSize: 9, background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "1px 6px", borderRadius: 6, fontWeight: 700 }}>PRO</span>}
            </button>
          ))}
        </nav>

        {/* User Card */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14, marginTop: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
            }}>{user?.avatar || "U"}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "DM Sans" }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "DM Sans" }}>{user?.tier === "premium" ? "Premium" : "Free Plan"}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: "100%", padding: "7px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "transparent",
            color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans",
          }}>Sign Out</button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "28px 32px", maxWidth: 1000, overflowY: "auto" }}>
        {/* Top Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "Outfit" }}>
              {activeView === "dashboard" ? `Welcome back, ${user?.name?.split(" ")[0]}` : navItems.find(n => n.id === activeView)?.label}
            </h1>
            {activeView === "dashboard" && (
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "4px 0 0", fontFamily: "DM Sans" }}>
                Here's your elite status overview for 2026
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <IconBtn icon="🔔" label="Notifications" badge />
            <IconBtn icon="⚙️" label="Settings" />
          </div>
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
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={() => setShowAddTrip(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 440,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 20px", fontFamily: "Outfit" }}>Add Trip</h3>

            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {["flight", "hotel", "rental"].map(type => (
                <button key={type} onClick={() => setNewTrip(p => ({ ...p, type, program: type === "flight" ? "aa" : type === "hotel" ? "marriott" : "hertz" }))} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "DM Sans",
                  background: newTrip.type === type ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
                  color: newTrip.type === type ? "#a78bfa" : "rgba(255,255,255,0.4)", textTransform: "capitalize",
                }}>{type === "flight" ? "✈️" : type === "hotel" ? "🏨" : "🚗"} {type}</button>
              ))}
            </div>

            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "DM Sans" }}>Program</span>
              <select value={newTrip.program} onChange={e => setNewTrip(p => ({ ...p, program: e.target.value }))} style={{
                display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "DM Sans", outline: "none", boxSizing: "border-box",
              }}>
                {(newTrip.type === "flight" ? LOYALTY_PROGRAMS.airlines : newTrip.type === "hotel" ? LOYALTY_PROGRAMS.hotels : LOYALTY_PROGRAMS.rentals).map(p => (
                  <option key={p.id} value={p.id} style={{ background: "#1a1a2e" }}>{p.name}</option>
                ))}
              </select>
            </label>

            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "DM Sans" }}>
                {newTrip.type === "flight" ? "Route" : newTrip.type === "hotel" ? "Property" : "Location"}
              </span>
              <input value={newTrip.route} onChange={e => setNewTrip(p => ({ ...p, route: e.target.value, property: e.target.value, location: e.target.value }))}
                placeholder={newTrip.type === "flight" ? "JFK → LAX" : newTrip.type === "hotel" ? "Hotel name" : "City"}
                style={{
                  display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "DM Sans", outline: "none", boxSizing: "border-box",
                }} />
            </label>

            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <label style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "DM Sans" }}>Date</span>
                <input type="date" value={newTrip.date} onChange={e => setNewTrip(p => ({ ...p, date: e.target.value }))} style={{
                  display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "DM Sans", outline: "none", boxSizing: "border-box",
                }} />
              </label>
              {newTrip.type === "flight" && (
                <label style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "DM Sans" }}>Class</span>
                  <select value={newTrip.class} onChange={e => setNewTrip(p => ({ ...p, class: e.target.value }))} style={{
                    display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "DM Sans", outline: "none", boxSizing: "border-box",
                  }}>
                    <option value="domestic" style={{ background: "#1a1a2e" }}>Domestic Economy</option>
                    <option value="international" style={{ background: "#1a1a2e" }}>International</option>
                    <option value="premium" style={{ background: "#1a1a2e" }}>Premium / Business</option>
                  </select>
                </label>
              )}
              {newTrip.type === "hotel" && (
                <label style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "DM Sans" }}>Nights</span>
                  <input type="number" min={1} value={newTrip.nights} onChange={e => setNewTrip(p => ({ ...p, nights: parseInt(e.target.value) || 1 }))} style={{
                    display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "DM Sans", outline: "none", boxSizing: "border-box",
                  }} />
                </label>
              )}
            </div>

            <label style={{ display: "block", marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "DM Sans" }}>Status</span>
              <select value={newTrip.status} onChange={e => setNewTrip(p => ({ ...p, status: e.target.value }))} style={{
                display: "block", width: "100%", marginTop: 6, padding: "10px 12px", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "DM Sans", outline: "none", boxSizing: "border-box",
              }}>
                <option value="confirmed" style={{ background: "#1a1a2e" }}>Confirmed</option>
                <option value="planned" style={{ background: "#1a1a2e" }}>Planned</option>
                <option value="wishlist" style={{ background: "#1a1a2e" }}>Wishlist</option>
              </select>
            </label>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAddTrip(false)} style={{
                flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
                color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans",
              }}>Cancel</button>
              <button onClick={handleAddTrip} style={{
                flex: 1, padding: "11px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Outfit",
                background: "linear-gradient(135deg, #7c3aed, #6366f1)", color: "#fff",
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
            background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 400,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 6px", fontFamily: "Outfit" }}>Link Account</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 20px", fontFamily: "DM Sans" }}>
              Connect your {allPrograms.find(p => p.id === showLinkModal)?.name || "loyalty"} account
            </p>

            <label style={{ display: "block", marginBottom: 18 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "DM Sans" }}>Member ID</span>
              <input value={linkForm.memberId} onChange={e => setLinkForm(p => ({ ...p, memberId: e.target.value }))} placeholder="Enter your member number"
                style={{
                  display: "block", width: "100%", marginTop: 6, padding: "12px 14px", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: "DM Sans", outline: "none", boxSizing: "border-box",
                }} />
            </label>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "DM Sans", marginBottom: 20 }}>
              In production, this would use OAuth to securely connect to the loyalty program's API. Demo mode uses sample data.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLinkModal(null)} style={{
                flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
                color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans",
              }}>Cancel</button>
              <button onClick={() => handleLinkAccount(showLinkModal)} style={{
                flex: 1, padding: "11px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Outfit",
                background: "linear-gradient(135deg, #7c3aed, #6366f1)", color: "#fff",
              }}>Link Account</button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={() => setShowUpgrade(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#1a1a2e", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 400, textAlign: "center",
          }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>✦</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 8px", fontFamily: "Outfit" }}>Upgrade to Premium</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "DM Sans", marginBottom: 24 }}>
              Unlock the Trip Optimizer, status match alerts, PDF exports, and more.
            </p>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", fontFamily: "Outfit", marginBottom: 4 }}>$9.99<span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>/mo</span></div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "DM Sans", marginBottom: 24 }}>Cancel anytime. 7-day free trial.</p>
            <button onClick={() => { setUser(prev => ({ ...prev, tier: "premium" })); setShowUpgrade(false); }} style={{
              width: "100%", padding: "13px 0", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Outfit",
              background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", boxShadow: "0 4px 20px rgba(245,158,11,0.3)", marginBottom: 10,
            }}>Start Free Trial</button>
            <button onClick={() => setShowUpgrade(false)} style={{
              width: "100%", padding: "11px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
              color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans",
            }}>Maybe Later</button>
          </div>
        </div>
      )}
    </div>
  );
}
