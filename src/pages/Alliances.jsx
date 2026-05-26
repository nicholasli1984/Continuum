import React, { useState, useMemo } from "react";
import { LOYALTY_PROGRAMS } from "../constants/programs";
import { ELITE_ALLIANCE_MAP, AIRLINE_ALLIANCE } from "../constants/lounges";

// Alliance metadata + tier hierarchies (lowest → highest)
const ALLIANCES = {
  oneworld: { name: "oneworld", tiers: ["Ruby", "Sapphire", "Emerald"], color: "#C8553D" },
  star:     { name: "Star Alliance", tiers: ["Silver", "Gold"], color: "#8BA3B8" },
  skyteam:  { name: "SkyTeam", tiers: ["Elite", "Elite Plus"], color: "#6B7A5A" },
};
const ALLIANCE_KEYS = ["oneworld", "star", "skyteam"];

// Reciprocal benefit catalog by alliance + tier. Concise factual descriptions
// of what each tier earns when flying any partner carrier in the alliance.
const BENEFIT_MATRIX = {
  oneworld: {
    Ruby: [
      { name: "Priority on standby & waitlists", icon: "list" },
      { name: "Preferred or pre-reserved seating", icon: "seat", note: "Where the operating carrier offers it" },
    ],
    Sapphire: [
      { name: "Priority check-in (business counters)", icon: "fast" },
      { name: "Business-class lounge access (+1 guest)", icon: "lounge", note: "Same-day oneworld flight required" },
      { name: "Priority boarding", icon: "board" },
      { name: "Fast-track security where available", icon: "shield" },
      { name: "Extra baggage allowance", icon: "bag", note: "+1 piece or +20 kg" },
      { name: "Preferred seating", icon: "seat" },
      { name: "Priority baggage delivery", icon: "bag" },
      { name: "Priority on standby & waitlists", icon: "list" },
    ],
    Emerald: [
      { name: "Priority check-in (first-class counters)", icon: "fast" },
      { name: "First & business lounge access (+1 guest)", icon: "lounge", note: "Regardless of cabin on a oneworld flight" },
      { name: "Fast-track security & priority boarding", icon: "shield" },
      { name: "Extra baggage allowance", icon: "bag", note: "+1 piece or +20 kg" },
      { name: "Priority baggage delivery", icon: "bag" },
      { name: "Reserved seating in premium economy on long-haul", icon: "seat", note: "Subject to participating carrier" },
      { name: "Priority standby & waitlist", icon: "list" },
    ],
  },
  star: {
    Silver: [
      { name: "Priority on standby (airport)", icon: "list" },
      { name: "Priority on waitlists", icon: "list" },
      { name: "Reserved seating where offered", icon: "seat" },
    ],
    Gold: [
      { name: "Priority airport check-in", icon: "fast" },
      { name: "Lounge access (+1 guest)", icon: "lounge", note: "Same-day Star Alliance flight required" },
      { name: "Priority boarding", icon: "board" },
      { name: "Extra baggage allowance", icon: "bag", note: "+1 piece or +20 kg" },
      { name: "Priority baggage handling", icon: "bag" },
      { name: "Gold Track priority security & immigration", icon: "shield", note: "Where available" },
      { name: "Reserved or preferred seating", icon: "seat" },
      { name: "Priority standby & waitlist", icon: "list" },
    ],
  },
  skyteam: {
    Elite: [
      { name: "Priority check-in where offered", icon: "fast" },
      { name: "Priority boarding", icon: "board" },
      { name: "Preferred seating where offered", icon: "seat" },
      { name: "Extra baggage allowance", icon: "bag", note: "+1 piece or +20 kg" },
      { name: "Priority on standby & waitlists", icon: "list" },
    ],
    "Elite Plus": [
      { name: "SkyPriority lane (check-in, security, boarding, bag drop)", icon: "fast" },
      { name: "Lounge access (+1 guest) on international flights", icon: "lounge", note: "Delta SkyClub excludes non-DL Elite Plus on US domestic" },
      { name: "Priority security & immigration at select airports", icon: "shield" },
      { name: "Extra baggage allowance", icon: "bag", note: "+1 piece or +20 kg" },
      { name: "Priority baggage handling", icon: "bag" },
      { name: "Guaranteed economy reservation on sold-out long-haul (24h notice)", icon: "shield" },
      { name: "Priority standby & waitlist", icon: "list" },
    ],
  },
};

// Major non-alliance loyalty programs. These airlines aren't part of
// oneworld / Star / SkyTeam, so status with them doesn't unlock alliance
// reciprocity — only their own perks plus any bilateral partnerships.
// Keys MUST match LOYALTY_PROGRAMS.airlines IDs in programs.js.
const INDEPENDENT_PROGRAMS = {
  emirates_skywards: {
    airlineName: "Emirates",
    programName: "Skywards",
    tiers: ["Blue", "Silver", "Gold", "Platinum"],
    topNote: "Top tier (Platinum) unlocks Emirates Lounge access globally, chauffeur service in Business/First, fast-track everywhere.",
    partners: ["Qantas (oneworld)", "JetBlue", "Alaska", "South African"],
  },
  etihad_guest: {
    airlineName: "Etihad Airways",
    programName: "Etihad Guest",
    tiers: ["Silver", "Gold", "Platinum", "Exclusive"],
    topNote: "Gold unlocks Etihad Lounges + chauffeur in Business/First; Platinum adds guaranteed seat on sold-out flights.",
    partners: ["American Airlines (oneworld)", "Virgin Australia", "ITA Airways"],
  },
  b6: {
    airlineName: "JetBlue",
    programName: "TrueBlue",
    tiers: ["Mosaic 1", "Mosaic 2", "Mosaic 3", "Mosaic 4"],
    topNote: "Mosaic tiers add free checked bags, premium drinks, Even More Space upgrades, free same-day switches.",
    partners: ["American Airlines", "Hawaiian", "Emirates", "Qatar"],
  },
  sw: {
    airlineName: "Southwest",
    programName: "Rapid Rewards",
    tiers: ["A-List", "A-List Preferred", "Companion Pass"],
    topNote: "A-List Preferred earns 100% bonus points; Companion Pass lets a designated traveler fly free with you all year.",
    partners: ["No interline partners — Southwest is intentionally standalone."],
  },
};

// Cabin-class entitlements that apply regardless of status
const FARE_BENEFITS = {
  economy: [
    { name: "Standard checked baggage per fare rules", icon: "bag" },
    { name: "Seat selection (some fares require fee)", icon: "seat" },
  ],
  premium_economy: [
    { name: "Increased baggage allowance", icon: "bag" },
    { name: "Priority boarding (premium-cabin lane)", icon: "board" },
    { name: "Larger seat with enhanced recline", icon: "seat" },
    { name: "Enhanced meal service", icon: "seat" },
  ],
  business: [
    { name: "Multiple checked bags included", icon: "bag" },
    { name: "Lounge access on day of travel", icon: "lounge", note: "Operating-airline business lounges" },
    { name: "Priority check-in, security, boarding", icon: "fast" },
    { name: "Lie-flat seat on long-haul (most carriers)", icon: "seat" },
    { name: "Premium dining and beverages", icon: "seat" },
  ],
  first: [
    { name: "Highest baggage allowance", icon: "bag" },
    { name: "First-class lounge access", icon: "lounge" },
    { name: "Dedicated check-in & priority everything", icon: "fast" },
    { name: "Enclosed suite or fully flat seat", icon: "seat" },
    { name: "Bespoke dining service", icon: "seat" },
    { name: "Chauffeur service (select carriers)", icon: "fast" },
  ],
};

// Compact icon set used by the benefit rows
const ICONS = {
  check:  <polyline points="20 6 9 17 4 12" />,
  bag:    <><path d="M5 7h14l-1 13H6z" /><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /></>,
  lounge: <><path d="M3 18h18l-2-9H5z" /><path d="M7 18v3M17 18v3" /></>,
  fast:   <polyline points="13 2 4 14 12 14 11 22 20 10 12 10 13 2" />,
  board:  <><path d="M2 22h20" /><path d="M6 18l4-12 8 4-2 8z" /></>,
  seat:   <><path d="M5 18v-6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v6" /><path d="M3 22h18" /><path d="M5 18h14" /></>,
  list:   <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
};
const Icon = ({ id, color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONS[id] || ICONS.check}</svg>
);

export function renderAlliances(s) {
  return <AlliancesPage {...s} />;
}

function AlliancesPage({ css, isMobile, darkMode, linkedAccounts, setActiveView, ProgramLogo }) {
  const D = darkMode;
  const dv = {
    bone: D ? "#1a1a1a" : "#fff",
    paper: D ? "#222" : "#fff",
    cream: D ? "rgba(255,255,255,0.08)" : "#E2DCCE",
    stone: D ? "#8a8a8a" : "#857A66",
    taupe: D ? "#999" : "#6B6458",
    ink: D ? "#f0ece6" : "#15130F",
    accent: "#C8553D",
    moss: "#6B7A5A",
    gold: "#B8924A",
    rose: "#B85454",
    serif: "'Fraunces', 'Instrument Serif', Georgia, serif",
    sans: "'Inter Tight', 'Instrument Sans', sans-serif",
    mono: "'JetBrains Mono', 'Geist Mono', monospace",
  };

  // ── Build user's holdings from linked accounts in Programs ──
  const allAirlinePrograms = LOYALTY_PROGRAMS.airlines;
  const userHoldings = useMemo(() => {
    const list = [];
    Object.entries(linkedAccounts || {}).forEach(([progId, acct]) => {
      if (!acct?.currentTier) return;
      const prog = allAirlinePrograms.find(p => p.id === progId);
      if (!prog) return;
      const mapping = ELITE_ALLIANCE_MAP[progId];
      if (!mapping) return;
      const allianceTier = mapping.tiers[acct.currentTier];
      if (!allianceTier) return;
      list.push({
        progId,
        prog,
        airlineCode: progId.toUpperCase().slice(0, 3),
        airlineName: prog.name,
        program: prog.name.split(/\s+/).slice(-2).join(" "),
        tier: acct.currentTier,
        alliance: mapping.alliance,
        allianceTier,
      });
    });
    return list;
  }, [linkedAccounts, allAirlinePrograms]);

  // ── Independent (non-alliance) holdings — shown alongside alliance ones ──
  const independentHoldings = useMemo(() => {
    const list = [];
    Object.entries(linkedAccounts || {}).forEach(([progId, acct]) => {
      if (!acct?.currentTier) return;
      const meta = INDEPENDENT_PROGRAMS[progId];
      if (!meta) return;
      const prog = allAirlinePrograms.find(p => p.id === progId);
      list.push({
        progId,
        prog,
        airlineCode: progId.toUpperCase().slice(0, 3),
        airlineName: meta.airlineName,
        programName: meta.programName,
        tier: acct.currentTier,
      });
    });
    return list;
  }, [linkedAccounts, allAirlinePrograms]);

  // Per-alliance summary of user's best tier
  const standingByAlliance = useMemo(() => {
    const out = {};
    ALLIANCE_KEYS.forEach(k => { out[k] = null; });
    userHoldings.forEach(h => {
      const tiers = ALLIANCES[h.alliance].tiers;
      const idx = tiers.indexOf(h.allianceTier);
      const cur = out[h.alliance];
      const curIdx = cur ? tiers.indexOf(cur.allianceTier) : -1;
      if (idx > curIdx) out[h.alliance] = h;
    });
    return out;
  }, [userHoldings]);

  // ── Calculator state ──
  const allAirlines = useMemo(() => {
    return allAirlinePrograms
      .map(p => ({ code: p.id, name: p.name, alliance: AIRLINE_ALLIANCE[p.id] || "none" }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allAirlinePrograms]);

  const [flightAirlineCode, setFlightAirlineCode] = useState(allAirlines[0]?.code || "");
  const [statusKey, setStatusKey] = useState(userHoldings[0]?.airlineCode || "none");
  const [cabin, setCabin] = useState("economy");

  const flightAirline = allAirlines.find(a => a.code === flightAirlineCode);
  const userStatus = userHoldings.find(h => h.airlineCode === statusKey) || null;
  const flightAlliance = flightAirline?.alliance && flightAirline.alliance !== "none" ? flightAirline.alliance : null;

  let matchKind = "none"; // home | alliance | none
  let appliedAlliance = null;
  let appliedTier = null;
  let eliteBenefits = [];
  let deniedBenefits = [];
  if (userStatus && flightAirline) {
    if (userStatus.airlineCode === flightAirline.code.toUpperCase().slice(0,3) ||
        userStatus.airlineCode.toLowerCase() === flightAirline.code.toLowerCase()) {
      matchKind = "home";
      appliedAlliance = userStatus.alliance;
      appliedTier = userStatus.allianceTier;
      eliteBenefits = BENEFIT_MATRIX[userStatus.alliance]?.[userStatus.allianceTier] || [];
    } else if (flightAlliance && userStatus.alliance === flightAlliance) {
      matchKind = "alliance";
      appliedAlliance = userStatus.alliance;
      appliedTier = userStatus.allianceTier;
      eliteBenefits = BENEFIT_MATRIX[userStatus.alliance]?.[userStatus.allianceTier] || [];
    } else {
      matchKind = "none";
      deniedBenefits = BENEFIT_MATRIX[userStatus.alliance]?.[userStatus.allianceTier] || [];
    }
  }
  const fareBenefits = FARE_BENEFITS[cabin] || [];

  // ── Render helpers ──
  const SectionEyebrow = ({ children, color }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: color || dv.accent }}>
      <div style={{ width: 28, height: 1, background: color || dv.accent }} />
      {children}
    </div>
  );

  const cabinOptions = [
    { id: "economy", label: "Economy" },
    { id: "premium_economy", label: "Premium Eco" },
    { id: "business", label: "Business" },
    { id: "first", label: "First" },
  ];

  return (
    <div style={{ fontFamily: dv.sans, color: dv.ink }}>
      {/* ── Hero banner ── */}
      <div style={{ margin: isMobile ? "0 -16px 0" : "0 -40px 0", position: "relative", height: isMobile ? 200 : 320, overflow: "hidden", background: "#2C2A26" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=2000&q=80&fit=crop')", backgroundSize: "cover", backgroundPosition: "center", filter: "saturate(0.55) contrast(1.05) brightness(0.75)", animation: "kenburns 24s ease-in-out infinite alternate" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${D ? "rgba(15,15,15,0)" : "rgba(244,241,236,0)"} 55%, ${D ? "rgba(15,15,15,0.9)" : "rgba(244,241,236,0.9)"} 90%, ${css.bg} 100%)`, zIndex: 1 }} />
        <div style={{ position: "absolute", top: 18, left: isMobile ? 16 : 48, zIndex: 3, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#F4F1EC", opacity: 0.9 }}>
          <span style={{ color: dv.accent }}>&#9679; </span>Loyalty Intelligence
        </div>
      </div>

      {/* ── PAGE HEAD ── */}
      <div style={{ marginTop: -24, marginBottom: 36, paddingBottom: 28, borderBottom: `1px solid ${dv.cream}`, position: "relative", zIndex: 5, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap: isMobile ? 16 : 40, alignItems: "end" }}>
        <div>
          <SectionEyebrow>Benefits Calculator</SectionEyebrow>
          <h1 style={{ fontFamily: dv.serif, fontSize: isMobile ? 28 : "clamp(56px, 8vw, 92px)", fontWeight: 300, lineHeight: 0.94, letterSpacing: "-0.03em", color: dv.ink, margin: 0 }}>
            What you <em style={{ fontStyle: "italic", fontWeight: 400, color: dv.accent }}>actually</em> get.
          </h1>
          <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: isMobile ? 15 : 18, color: dv.taupe, marginTop: 16, marginBottom: 0, lineHeight: 1.45, maxWidth: 540 }}>
            Pick a flight. We map your stored elite holdings against the operating airline's alliance, so you see only the benefits that will actually be honored.
          </p>
        </div>
      </div>

      {/* ── Profile band ── */}
      <div style={{ background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: isMobile ? "20px 18px" : "22px 26px", marginBottom: 40, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr auto", gap: isMobile ? 16 : 28, alignItems: "center" }}>
        <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe }}>
          <span style={{ color: dv.accent }}>●</span>&nbsp;&nbsp;Your Continuum profile
        </div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
          {userHoldings.length === 0 && independentHoldings.length === 0 ? (
            <span style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14 }}>
              No elite status linked yet. Add one in Programs to see it applied here.
            </span>
          ) : (
            <>
              {userHoldings.map((h, i) => (
                <div key={`a-${i}`} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    {ProgramLogo && h.prog ? <ProgramLogo prog={h.prog} size={22} /> : (
                      <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.ink, letterSpacing: "0.05em" }}>{h.airlineCode}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontFamily: dv.serif, fontSize: 15, color: dv.ink, lineHeight: 1.15 }}>{h.airlineName} · {h.tier}</div>
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginTop: 3 }}>
                      <span style={{ color: dv.accent, marginRight: 6 }}>{ALLIANCES[h.alliance].name} {h.allianceTier}</span>
                    </div>
                  </div>
                </div>
              ))}
              {independentHoldings.map((h, i) => (
                <div key={`i-${i}`} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    {ProgramLogo && h.prog ? <ProgramLogo prog={h.prog} size={22} /> : (
                      <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.ink, letterSpacing: "0.05em" }}>{h.airlineCode}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontFamily: dv.serif, fontSize: 15, color: dv.ink, lineHeight: 1.15 }}>{h.airlineName} · {h.tier}</div>
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginTop: 3 }}>
                      <span style={{ color: dv.taupe, marginRight: 6 }}>Independent · {h.programName}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        <button onClick={() => setActiveView?.("programs")}
          style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe, border: `1px solid ${dv.cream}`, padding: "8px 14px", background: "transparent", cursor: "pointer", transition: "all 0.25s", whiteSpace: "nowrap" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = dv.accent; e.currentTarget.style.color = dv.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = dv.cream; e.currentTarget.style.color = dv.taupe; }}>
          {userHoldings.length === 0 ? "Add status →" : "Edit holdings"}
        </button>
      </div>

      {/* ── Calculator ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(320px, 360px) 1fr", gap: 0, background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, marginBottom: 56, minHeight: 540 }}>

        {/* LEFT: inputs */}
        <div style={{ padding: isMobile ? "26px 20px" : "32px 30px", borderRight: isMobile ? "none" : `1px solid ${dv.cream}`, borderBottom: isMobile ? `1px solid ${dv.cream}` : "none", background: dv.bone }}>
          <SectionEyebrow>Configure flight</SectionEyebrow>

          <Field dv={dv} label="Operating airline" step="i.">
            <select value={flightAirlineCode} onChange={e => setFlightAirlineCode(e.target.value)} style={selectStyle(dv)}>
              {(() => {
                const grouped = { oneworld: [], star: [], skyteam: [], none: [] };
                allAirlines.forEach(a => grouped[a.alliance].push(a));
                return ALLIANCE_KEYS.map(k => (
                  <optgroup key={k} label={ALLIANCES[k].name}>
                    {grouped[k].map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                  </optgroup>
                )).concat([
                  <optgroup key="none" label="No alliance">
                    {grouped.none.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                  </optgroup>
                ]);
              })()}
            </select>
            <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.taupe, marginTop: 8, lineHeight: 1.4 }}>The airline metal you'll be flying — not the marketing carrier.</p>
          </Field>

          <Field dv={dv} label="Status to apply" step="ii.">
            <select value={statusKey} onChange={e => setStatusKey(e.target.value)} style={selectStyle(dv)}>
              {userHoldings.map(h => (
                <option key={h.airlineCode} value={h.airlineCode}>{h.airlineName} · {h.tier}</option>
              ))}
              <option value="none">— No status applied —</option>
            </select>
            <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.taupe, marginTop: 8, lineHeight: 1.4 }}>Pulled from your linked Programs.</p>
          </Field>

          <Field dv={dv} label="Cabin class" step="iii.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {cabinOptions.map(c => {
                const active = cabin === c.id;
                return (
                  <button key={c.id} onClick={() => setCabin(c.id)} style={{
                    padding: "11px 8px",
                    fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                    background: active ? dv.ink : dv.bone, color: active ? dv.bone : dv.taupe,
                    border: `1px solid ${active ? dv.ink : dv.cream}`, cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                  }}>{c.label}</button>
                );
              })}
            </div>
          </Field>

          {/* Verdict */}
          <div style={{ marginTop: 32, paddingTop: 28, borderTop: `1px solid ${dv.cream}` }}>
            {!userStatus ? (
              <Verdict dv={dv} tone="partial" status="No status applied">
                <em style={{ fontStyle: "italic", color: dv.accent }}>Fare-class</em> benefits only.
                <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.taupe, marginTop: 6, lineHeight: 1.4 }}>Apply a held status above to see reciprocal alliance benefits.</p>
              </Verdict>
            ) : matchKind === "home" ? (
              <Verdict dv={dv} tone="match" status="Home airline · full benefits">
                Your <em style={{ fontStyle: "italic", color: dv.accent }}>{userStatus.tier}</em> status applies in full.
                <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.taupe, marginTop: 6, lineHeight: 1.4 }}>Plus any home-program perks (upgrades, bonus miles, complimentary seats) not shown in the alliance grid.</p>
              </Verdict>
            ) : matchKind === "alliance" ? (
              <Verdict dv={dv} tone="match" status={`${ALLIANCES[appliedAlliance].name} match`}>
                You'll travel as <em style={{ fontStyle: "italic", color: dv.accent }}>{ALLIANCES[appliedAlliance].name} {appliedTier}</em>.
                <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.taupe, marginTop: 6, lineHeight: 1.4 }}>{userStatus.tier} on {userStatus.airlineName} maps to {appliedTier} across the {ALLIANCES[appliedAlliance].name} network — recognized on {flightAirline.name}.</p>
              </Verdict>
            ) : (
              <Verdict dv={dv} tone="mismatch" status="Alliance mismatch">
                No <em style={{ fontStyle: "italic", color: dv.accent }}>elite benefits</em> on this flight.
                <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.taupe, marginTop: 6, lineHeight: 1.4 }}>{userStatus.airlineName} ({ALLIANCES[userStatus.alliance].name}) and {flightAirline.name} ({flightAirline.alliance === "none" ? "no alliance" : ALLIANCES[flightAirline.alliance].name}) don't share an alliance. Only fare-class benefits apply.</p>
              </Verdict>
            )}
          </div>
        </div>

        {/* RIGHT: benefits */}
        <div style={{ padding: isMobile ? "26px 20px" : "32px 36px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 18, borderBottom: `1px solid ${dv.cream}`, gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe, marginBottom: 6 }}>Operating</div>
              <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 22 : 30, fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.02em", color: dv.ink }}>
                {flightAirline?.name}<em style={{ fontStyle: "italic", color: dv.accent, fontWeight: 400 }}>.</em>
              </div>
              <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.taupe, marginTop: 6 }}>
                {flightAirline?.alliance === "none" ? "Independent carrier — no alliance reciprocity" : `Member · ${ALLIANCES[flightAirline.alliance].name}`}
              </div>
            </div>
            {appliedAlliance && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", border: `1px solid ${dv.cream}`, background: dv.paper }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ALLIANCES[appliedAlliance].color }} />
                <div>
                  <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.ink, fontWeight: 500 }}>{ALLIANCES[appliedAlliance].name}</div>
                  <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 12, color: dv.taupe }}>applied as {appliedTier}</div>
                </div>
              </div>
            )}
          </div>

          {matchKind === "none" && userStatus && (
            <div style={{ padding: "18px 22px", border: `1px dashed ${dv.stone}`, background: "rgba(184,174,156,0.06)", marginBottom: 22 }}>
              <div style={{ fontFamily: dv.serif, fontSize: 16, color: dv.ink, lineHeight: 1.3 }}>
                Your {userStatus.tier} status is invisible on this flight.
              </div>
              <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.taupe, marginTop: 6, lineHeight: 1.5 }}>
                {ALLIANCES[userStatus.alliance].name} status is not recognized by {flightAirline.name}. The benefits below are everything you'd otherwise have received — they will not be honored at the airport.
              </div>
            </div>
          )}

          <div style={{ display: "grid", gap: 4 }}>
            {eliteBenefits.map((b, i) => (
              <BenefitRow key={`e-${i}`} dv={dv} b={b} kind="granted" sourceLabel={matchKind === "home" ? "Home airline" : ALLIANCES[appliedAlliance].name} sourceClass="alliance" />
            ))}
            {deniedBenefits.map((b, i) => (
              <BenefitRow key={`d-${i}`} dv={dv} b={b} kind="denied" sourceLabel="Not honored" sourceClass="none" />
            ))}
            {fareBenefits.map((b, i) => (
              <BenefitRow key={`f-${i}`} dv={dv} b={b} kind="fare" sourceLabel="Fare class" sourceClass="fare" />
            ))}
          </div>
        </div>
      </div>

      {/* ── Your standing across alliances ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "0 0 18px", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: dv.taupe }}>
        <div style={{ width: 28, height: 1, background: dv.accent }} />
        <strong style={{ color: dv.ink, fontWeight: 500 }}>Your standing · across the three alliances</strong>
        <div style={{ flex: 1, height: 1, background: dv.cream }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 0, border: `1px solid ${dv.cream}`, background: dv.paper, marginBottom: 32 }}>
        {ALLIANCE_KEYS.map((alliKey, ai) => {
          const alli = ALLIANCES[alliKey];
          const standing = standingByAlliance[alliKey];
          const tiers = alli.tiers;
          const userTierIdx = standing ? tiers.indexOf(standing.allianceTier) : -1;
          // Top-line summary
          const summary = !standing
            ? "Not yet a member."
            : userTierIdx === tiers.length - 1
              ? "Top tier — you've reached the ceiling."
              : `Next tier: ${tiers[userTierIdx + 1]}.`;
          // Quick benefit highlight at user's current tier
          const topBenefit = standing
            ? (BENEFIT_MATRIX[alliKey]?.[standing.allianceTier] || []).slice(0, 3).map(b => b.name).join(" · ")
            : "Add a program in this alliance to start tracking.";
          return (
            <div key={alliKey} style={{
              padding: isMobile ? "22px 20px" : "28px 28px",
              borderRight: !isMobile && ai < ALLIANCE_KEYS.length - 1 ? `1px solid ${dv.cream}` : "none",
              borderBottom: isMobile && ai < ALLIANCE_KEYS.length - 1 ? `1px solid ${dv.cream}` : "none",
            }}>
              <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe, marginBottom: 4 }}>{tiers.length} tiers</div>
              <div style={{ fontFamily: dv.serif, fontSize: 26, fontWeight: 400, letterSpacing: "-0.02em", color: dv.ink, marginBottom: 14 }}>{alli.name}</div>

              {/* Tier ladder */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {tiers.map((t, ti) => {
                  const isUser = standing && ti === userTierIdx;
                  const isPast = standing && ti < userTierIdx;
                  return (
                    <React.Fragment key={t}>
                      {ti > 0 && <span style={{ color: dv.stone, fontFamily: dv.mono, fontSize: 11 }}>→</span>}
                      <span style={{
                        fontFamily: isUser ? dv.serif : dv.mono,
                        fontSize: isUser ? 16 : 11,
                        fontStyle: isUser ? "italic" : "normal",
                        letterSpacing: isUser ? "-0.005em" : "0.08em",
                        textTransform: isUser ? "none" : "uppercase",
                        color: isUser ? dv.ink : isPast ? dv.taupe : dv.stone,
                        fontWeight: isUser ? 500 : 400,
                        display: "inline-flex", alignItems: "center", gap: 6,
                      }}>
                        {isUser && <span style={{ width: 7, height: 7, borderRadius: "50%", background: alli.color }} />}
                        {t}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>

              <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 14, color: standing ? dv.ink : dv.taupe, lineHeight: 1.45, marginBottom: 8 }}>
                {standing
                  ? <>You're <strong style={{ fontStyle: "normal", fontWeight: 500, color: dv.accent }}>{alli.name} {standing.allianceTier}</strong> via {standing.tier} on {standing.airlineName}.</>
                  : <em>{summary}</em>}
              </div>
              {standing && (
                <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.taupe, lineHeight: 1.5, marginTop: 6 }}>
                  {summary}
                </div>
              )}

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${dv.cream}`, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, lineHeight: 1.6 }}>
                {standing ? "Top benefits at this tier" : "Get started"}
              </div>
              <div style={{ fontFamily: dv.serif, fontSize: 13, color: dv.ink, marginTop: 8, lineHeight: 1.5 }}>
                {topBenefit}
              </div>

              {!standing && (
                <button onClick={() => setActiveView?.("programs")} style={{
                  marginTop: 16, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
                  border: `1px solid ${dv.cream}`, background: "transparent", color: dv.accent, padding: "7px 12px", cursor: "pointer", transition: "all 0.25s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = dv.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = dv.cream; }}>
                  Add a {alli.name} program →
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Independent carriers ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "44px 0 18px", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: dv.taupe }}>
        <div style={{ width: 28, height: 1, background: dv.accent }} />
        <strong style={{ color: dv.ink, fontWeight: 500 }}>Independent carriers · outside the three alliances</strong>
        <div style={{ flex: 1, height: 1, background: dv.cream }} />
      </div>
      <p style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, lineHeight: 1.5, margin: "0 0 18px", maxWidth: 720 }}>
        Status with these airlines stays in their own loyalty world — no alliance reciprocity.
        They each have their own perks plus a handful of bilateral partnerships you should know about.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 0, border: `1px solid ${dv.cream}`, background: dv.paper }}>
        {Object.entries(INDEPENDENT_PROGRAMS).map(([progId, meta], idx) => {
          const heldTier = linkedAccounts?.[progId]?.currentTier;
          const heldIdx = heldTier ? meta.tiers.indexOf(heldTier) : -1;
          const prog = allAirlinePrograms.find(p => p.id === progId);
          const totalCols = isMobile ? 1 : 2;
          const isLastInRow = (idx % totalCols) === totalCols - 1;
          const lastRowStart = Math.floor((Object.keys(INDEPENDENT_PROGRAMS).length - 1) / totalCols) * totalCols;
          const isInLastRow = idx >= lastRowStart;
          return (
            <div key={progId} style={{
              padding: isMobile ? "22px 20px" : "26px 28px",
              borderRight: !isLastInRow && !isMobile ? `1px solid ${dv.cream}` : "none",
              borderBottom: !isInLastRow ? `1px solid ${dv.cream}` : "none",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    {ProgramLogo && prog ? <ProgramLogo prog={prog} size={26} /> : (
                      <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.ink }}>{progId.toUpperCase().slice(0, 3)}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe }}>{meta.programName}</div>
                    <div style={{ fontFamily: dv.serif, fontSize: 22, fontWeight: 400, letterSpacing: "-0.015em", color: dv.ink, marginTop: 2 }}>{meta.airlineName}</div>
                  </div>
                </div>
                {heldTier && (
                  <span style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.accent, padding: "3px 8px", border: `1px solid ${dv.accent}`, background: "rgba(200,85,61,0.06)", whiteSpace: "nowrap" }}>
                    Yours · {heldTier}
                  </span>
                )}
              </div>

              {/* Tier ladder */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 14, marginBottom: 14 }}>
                {meta.tiers.map((t, ti) => {
                  const isUser = ti === heldIdx;
                  const isPast = heldIdx > -1 && ti < heldIdx;
                  return (
                    <React.Fragment key={t}>
                      {ti > 0 && <span style={{ color: dv.stone, fontFamily: dv.mono, fontSize: 11 }}>→</span>}
                      <span style={{
                        fontFamily: isUser ? dv.serif : dv.mono,
                        fontSize: isUser ? 15 : 11,
                        fontStyle: isUser ? "italic" : "normal",
                        letterSpacing: isUser ? "-0.005em" : "0.08em",
                        textTransform: isUser ? "none" : "uppercase",
                        color: isUser ? dv.ink : isPast ? dv.taupe : dv.stone,
                        fontWeight: isUser ? 500 : 400,
                        display: "inline-flex", alignItems: "center", gap: 6,
                      }}>
                        {isUser && <span style={{ width: 7, height: 7, borderRadius: "50%", background: dv.accent }} />}
                        {t}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>

              <p style={{ fontFamily: dv.serif, fontSize: 13, color: dv.ink, lineHeight: 1.5, margin: "0 0 12px" }}>
                {meta.topNote}
              </p>

              <div style={{ paddingTop: 12, borderTop: `1px solid ${dv.cream}` }}>
                <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 6 }}>
                  Bilateral partnerships
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {meta.partners.map((p, pi) => (
                    <span key={pi} style={{
                      fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.04em",
                      color: dv.taupe, padding: "3px 8px", background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`,
                    }}>{p}</span>
                  ))}
                </div>
              </div>

              {!heldTier && (
                <button onClick={() => setActiveView?.("programs")} style={{
                  marginTop: 14, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
                  border: `1px solid ${dv.cream}`, background: "transparent", color: dv.accent, padding: "7px 12px", cursor: "pointer", transition: "all 0.25s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = dv.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = dv.cream; }}>
                  Add {meta.programName} →
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 12, lineHeight: 1.5, marginTop: 16, marginBottom: 0 }}>
        Other independent carriers tracked in Programs (low-cost: Spirit, Frontier, AirAsia, Scoot, Jetstar, EasyJet, Norwegian, Hong Kong Airlines, Bermudair, Caribbean Airlines, etc.) follow the same pattern: their status is meaningful only on their own metal.
      </p>
    </div>
  );
}

// ── small helpers ──
function Field({ dv, label, step, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe }}>{label}</span>
        {step && <span style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 12, color: dv.accent }}>{step}</span>}
      </div>
      {children}
    </div>
  );
}

function selectStyle(dv) {
  return {
    width: "100%", padding: "13px 38px 13px 14px", background: dv.bone,
    border: `1px solid ${dv.cream}`, color: dv.ink, fontSize: 16,
    fontFamily: dv.serif, fontWeight: 400, letterSpacing: "-0.005em",
    cursor: "pointer", outline: "none",
    appearance: "none", WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6458' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
  };
}

function Verdict({ dv, tone, status, children }) {
  const toneColor = tone === "match" ? dv.moss : tone === "mismatch" ? dv.rose : dv.gold;
  return (
    <>
      <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: toneColor, marginBottom: 10 }}>{status}</div>
      <div style={{ fontFamily: dv.serif, fontSize: 21, fontWeight: 400, lineHeight: 1.25, letterSpacing: "-0.015em", color: dv.ink }}>
        {children}
      </div>
    </>
  );
}

function BenefitRow({ dv, b, kind, sourceLabel, sourceClass }) {
  const iconColor = kind === "granted" ? dv.moss : kind === "fare" ? dv.gold : dv.stone;
  const sourceColor = sourceClass === "alliance" ? dv.accent : sourceClass === "fare" ? dv.gold : dv.stone;
  const sourceBg = sourceClass === "alliance" ? "rgba(228,168,143,0.12)" : sourceClass === "fare" ? "rgba(184,146,74,0.08)" : dv.bone;
  const sourceBorder = sourceClass === "alliance" ? "rgba(228,168,143,0.5)" : sourceClass === "fare" ? "rgba(184,146,74,0.5)" : dv.cream;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "36px 1fr auto", gap: 16, alignItems: "center",
      padding: "14px 0", borderBottom: `1px solid ${dv.cream}`,
    }}>
      <div style={{
        width: 36, height: 36, border: `1px solid ${kind === "granted" ? dv.moss : dv.cream}`,
        background: kind === "denied" ? "transparent" : dv.bone,
        display: "grid", placeItems: "center", color: iconColor, opacity: kind === "denied" ? 0.5 : 1,
      }}>
        <Icon id={b.icon} color={iconColor} />
      </div>
      <div>
        <div style={{
          fontFamily: dv.serif, fontSize: 16, fontWeight: 400, letterSpacing: "-0.005em", lineHeight: 1.3,
          color: kind === "denied" ? dv.stone : dv.ink,
          textDecoration: kind === "denied" ? "line-through" : "none",
          textDecorationColor: dv.stone,
        }}>{b.name}</div>
        {b.note && (
          <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.04em", color: dv.taupe, marginTop: 4, lineHeight: 1.4 }}>{b.note}</div>
        )}
      </div>
      <span style={{
        fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
        color: sourceColor, background: sourceBg, border: `1px solid ${sourceBorder}`,
        padding: "4px 8px", whiteSpace: "nowrap",
      }}>{sourceLabel}</span>
    </div>
  );
}
