import React from "react";
import { LOUNGE_DATABASE, AMENITY_ICONS, AMENITY_LABELS } from "../constants/lounges";
import { LOYALTY_PROGRAMS } from "../constants/programs";
import { getAirlineTerminals, normalizeTerminal } from "../constants/airlineTerminals";
import { expandToReachableTerminals, airportHasInterTerminalConnectivity } from "../constants/airportConnectivity";

const NETWORK_LABELS = {
  star_alliance: "Star Alliance", oneworld: "oneworld", skyteam: "SkyTeam",
  priority_pass: "Priority Pass", loungekey: "LoungeKey", diners_club: "Diners Club",
  independent: "Independent",
};
const networkLabel = (n) => (!n ? "Independent" : NETWORK_LABELS[n] || n);

export function renderLounges(s) {
  const { css, isMobile, darkMode, user, linkedAccounts,
    loungeAirport, setLoungeAirport, loungeSearchCode, setLoungeSearchCode,
    loungeDropdownOpen, setLoungeDropdownOpen, loungeExpandedId, setLoungeExpandedId,
    loungeFlightAirline, setLoungeFlightAirline, loungeFlightClass, setLoungeFlightClass,
    loungeAccessRoute, setLoungeAccessRoute, loungePhotos, loungeVisits,
    getLoungeAccess, saveLoungeVisit,
    AIRPORT_CITY, trips, sharedTrips,
    loungeShowAllTerminals, setLoungeShowAllTerminals } = s;
  const D = darkMode;

  const dv = {
    bone: D ? "#1a1a1a" : "#fff",
    paper: D ? "#222" : "#fff",
    cream: D ? "rgba(255,255,255,0.08)" : "#E2DCCE",
    stone: D ? "#8a8a8a" : "#857A66",
    taupe: D ? "#999" : "#6B6458",
    graphite: D ? "#111" : "#2C2A26",
    ink: D ? "#f0ece6" : "#15130F",
    accent: "#C8553D",
    accentSoft: D ? "rgba(228,168,143,0.6)" : "#E4A88F",
    moss: "#6B7A5A",
    gold: "#B8924A",
    serif: "'Fraunces', 'Instrument Serif', Georgia, serif",
    sans: "'Inter Tight', 'Instrument Sans', sans-serif",
    mono: "'JetBrains Mono', 'Geist Mono', monospace",
  };

  const lounges = loungeAirport ? (LOUNGE_DATABASE[loungeAirport] || []) : [];
  const airportCodes = Object.keys(LOUNGE_DATABASE).sort();
  const linkedProgramCount = Object.keys(linkedAccounts).length;
  const visitCount = (loungeVisits || []).length;

  // ── Terminal inference ──
  // Two sources can tell us which terminal(s) the user will depart from:
  //   (a) Their actual upcoming flight at this airport (best signal)
  //   (b) The static airline→terminal map (fallback when no flight on file
  //       OR when the user's just exploring with the airline dropdown)
  // We combine both. When ANY source has terminal info, we filter the lounge
  // list to those terminals by default. The user can override via "Show all
  // terminals" if they want the full airport view.
  const todayLocal = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();
  const horizonEnd = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();
  const allTrips = [...(trips || []), ...(sharedTrips || [])];
  const upcomingFromHere = loungeAirport
    ? allTrips.flatMap(t => (t.segments || [])
        .filter(s => !s._isMeta && (s.type || "").toString().toLowerCase() === "flight"
          && s.date && s.date >= todayLocal && s.date <= horizonEnd
          && (s.departureAirport || "").toUpperCase() === loungeAirport.toUpperCase())
        .map(s => ({
          tripName: t.tripName || t.trip_name || t.location || "Trip",
          tripId: t.id, date: s.date, time: s.departureTime || "",
          route: s.route || `${s.departureAirport} → ${s.arrivalAirport || ""}`.trim(),
          terminal: (s.departureTerminal || "").toString().trim(),
          flightNumber: s.flightNumber || "",
          airline: s.airline || "",
        }))
      ).sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const flightTerminals = [...new Set(upcomingFromHere.map(f => f.terminal).filter(Boolean).map(normalizeTerminal))];
  const inferredTerminals = loungeFlightAirline && loungeAirport
    ? getAirlineTerminals(loungeAirport, loungeFlightAirline)
    : [];
  // The user's "home" terminal(s) — where their flight is actually departing
  // from (or where their selected airline operates). These are the strict set
  // before we expand for post-security inter-terminal connectivity.
  const strictTerminalSet = new Set([...flightTerminals, ...inferredTerminals]);
  // Expand the home terminal(s) using documented post-security connectivity at
  // this airport. At hubs like ATL/DFW/DEN where airside trains link all
  // concourses, the user can physically reach lounges in other terminals too;
  // at JFK/EWR/FRA where terminals are landside-only, the expansion is a no-op.
  const reachableTerminalsList = expandToReachableTerminals(loungeAirport, [...strictTerminalSet]);
  const combinedTerminalSet = new Set(reachableTerminalsList.length > 0 ? reachableTerminalsList : [...strictTerminalSet]);
  const hasTerminalSignal = combinedTerminalSet.size > 0;
  const isInYourTerminal = (lounge) => hasTerminalSignal && combinedTerminalSet.has(normalizeTerminal(lounge.terminal));
  const isHomeTerminal = (lounge) => strictTerminalSet.has(normalizeTerminal(lounge.terminal));
  const nextDepartureFromHere = upcomingFromHere[0] || null;
  // Display labels for the strict set (the user's actual terminal). Extra
  // post-security-reachable terminals are surfaced separately so we don't
  // pretend the user is "in" five terminals at once.
  const strictTerminals = [...strictTerminalSet];
  const terminalLabels = strictTerminals.map(t => t.match(/^[A-Z0-9]+$/) ? `Terminal ${t}` : t);
  const extraReachableTerminals = reachableTerminalsList.filter(t => !strictTerminalSet.has(t));
  const hasExtraReachable = extraReachableTerminals.length > 0 && airportHasInterTerminalConnectivity(loungeAirport);
  const extraReachableLabels = extraReachableTerminals.map(t => t.match(/^[A-Z0-9]+$/) ? `T${t}` : t);

  const loungesWithAccess = lounges.map(l => ({
    ...l,
    _access: getLoungeAccess(l.network, l),
    _inYourTerminal: isInYourTerminal(l),
    _isHomeTerminal: isHomeTerminal(l),
  }));
  // FILTER (not just sort): when we know a terminal AND the user hasn't asked
  // to see all, only show lounges in that terminal. Lounges in another terminal
  // are post-security unreachable, so listing them is just noise.
  const applyTerminalFilter = hasTerminalSignal && !loungeShowAllTerminals;
  const visibleLounges = applyTerminalFilter
    ? loungesWithAccess.filter(l => l._inYourTerminal)
    : loungesWithAccess;
  // Sort order: home terminal first, then reachable post-security, then anything else.
  // Within each tier, rating descending.
  const sortByTerminalThenRating = (a, b) => {
    if (a._isHomeTerminal !== b._isHomeTerminal) return a._isHomeTerminal ? -1 : 1;
    if (a._inYourTerminal !== b._inYourTerminal) return a._inYourTerminal ? -1 : 1;
    return b.rating - a.rating;
  };
  const accessible = visibleLounges.filter(l => l._access.length > 0).sort(sortByTerminalThenRating);
  const inaccessible = visibleLounges.filter(l => l._access.length === 0).sort(sortByTerminalThenRating);
  // Count of lounges that exist at the airport but are hidden by the terminal filter
  const hiddenByTerminal = applyTerminalFilter
    ? loungesWithAccess.length - visibleLounges.length
    : 0;

  const allAirlineOptions = LOYALTY_PROGRAMS.airlines.map(a => ({ id: a.id, name: a.name }));

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.3;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars.push(<svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={dv.gold} stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>);
      } else if (i === full && half) {
        stars.push(<svg key={i} width="11" height="11" viewBox="0 0 24 24"><defs><clipPath id={`half${i}-${rating}`}><rect x="0" y="0" width="12" height="24" /></clipPath></defs><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={dv.gold} clipPath={`url(#half${i}-${rating})`} /><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="none" stroke={dv.cream} strokeWidth="1.4" /></svg>);
      } else {
        stars.push(<svg key={i} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={dv.cream} strokeWidth="1.4"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>);
      }
    }
    return <span style={{ display: "inline-flex", alignItems: "center", gap: 1 }}>{stars}</span>;
  };

  const networkAccent = (n) => {
    const map = { centurion: "#15130F", capital_one: dv.accent, priority_pass: "#6B4E2E", chase_sapphire_lounge: "#1A1F36" };
    return map[n] || dv.taupe;
  };

  // ─── METRICS ───
  const metrics = [
    { lbl: "Programs Linked", val: String(linkedProgramCount), sub: linkedProgramCount === 0 ? "Add a card or status to unlock access." : "Used to compute your access rights." },
    { lbl: "Airports Indexed", val: String(airportCodes.length), sub: "Across major hubs and growing." },
    { lbl: "Visits Logged", val: String(visitCount), sub: visitCount === 0 ? "Log your first visit from any lounge." : "Across all airports." },
    { lbl: loungeAirport ? `Accessible · ${loungeAirport}` : "Accessible · Airport", val: loungeAirport ? String(accessible.length) : "—", sub: loungeAirport ? `of ${lounges.length} on the field.` : "Search an airport to begin." },
  ];

  return (
    <div style={{ fontFamily: dv.sans, color: dv.ink }}>
      {/* ── Hero banner ── */}
      <div style={{ margin: isMobile ? "0 -16px 0" : "0 -40px 0", position: "relative", height: isMobile ? 200 : 320, overflow: "hidden", background: "#2C2A26" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/airlineLounge.avif')", backgroundSize: "cover", backgroundPosition: "center", filter: "saturate(0.85) contrast(1.05)", animation: "kenburns 24s ease-in-out infinite alternate" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${D ? "rgba(15,15,15,0)" : "rgba(244,241,236,0)"} 55%, ${D ? "rgba(15,15,15,0.9)" : "rgba(244,241,236,0.9)"} 90%, ${css.bg} 100%)`, zIndex: 1 }} />
        <div style={{ position: "absolute", top: 18, left: isMobile ? 16 : 48, zIndex: 3, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#F4F1EC", opacity: 0.85 }}>
          <span style={{ color: css.accent }}>&#9679; </span>Continuum
        </div>
      </div>

      {/* ─── PAGE HEAD ─── */}
      <div style={{ marginTop: -20, marginBottom: 36, position: "relative", zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.accent }}>
          <div style={{ width: 32, height: 1, background: dv.accent }} />
          Travel · Lounges §05
        </div>
        <h1 style={{ fontFamily: dv.serif, fontSize: isMobile ? 30 : "clamp(56px, 8vw, 88px)", fontWeight: 300, lineHeight: isMobile ? 1.05 : 0.94, letterSpacing: "-0.03em", color: dv.ink, margin: 0 }}>
          Lounges<em style={{ fontStyle: "italic", color: dv.accent, fontWeight: 400 }}>.</em>
        </h1>
        <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: isMobile ? 15 : 18, color: dv.taupe, marginTop: 16, marginBottom: 0, lineHeight: 1.45, maxWidth: 540 }}>
          The rooms that wait for you — sorted by what your status, cards, and ticket make possible.
        </p>
      </div>

      {/* ─── METRICS BAND ─── */}
      <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 0, background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, marginBottom: 40 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{
            padding: isMobile ? "20px 18px" : "26px 28px",
            borderRight: !isMobile && i < metrics.length - 1 ? `1px solid ${dv.cream}` : "none",
            borderBottom: isMobile && i < 2 ? `1px solid ${dv.cream}` : "none",
            borderRightWidth: isMobile && i % 2 === 0 ? 1 : 0,
            borderRightStyle: "solid",
            borderRightColor: dv.cream,
          }}>
            <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 12 }}>{m.lbl}</div>
            <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 28 : 38, fontWeight: 300, lineHeight: 1, letterSpacing: "-0.03em", color: dv.ink, fontVariantNumeric: "tabular-nums" }}>{m.val}</div>
            <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.taupe, marginTop: 8, lineHeight: 1.4 }}>{m.sub}</div>
          </div>
        ))}
      </section>

      {/* ─── SEARCH SECTION ─── */}
      <SectionSep dv={dv} num="§ 1" title="Search" rule />

      {/* Flight context */}
      <div style={{ background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: isMobile ? "20px 18px" : "26px 28px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
          <div>
            <span style={{ fontFamily: dv.serif, fontSize: 20, fontWeight: 400, letterSpacing: "-0.015em", color: dv.ink }}>Flight context</span>
            <em style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, marginLeft: 6 }}>— refines what you can enter.</em>
          </div>
          <span style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe }}>
            {loungeFlightAirline ? "Airline set" : "Any carrier"} · {loungeFlightClass}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr", gap: 14 }}>
          <Field dv={dv} label="Airline">
            <select value={loungeFlightAirline} onChange={e => setLoungeFlightAirline(e.target.value)} style={selectStyle(dv)}>
              <option value="">Any airline</option>
              {allAirlineOptions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field dv={dv} label="Cabin">
            <select value={loungeFlightClass} onChange={e => setLoungeFlightClass(e.target.value)} style={selectStyle(dv)}>
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </Field>
          <Field dv={dv} label="Route">
            <select value={loungeAccessRoute} onChange={e => setLoungeAccessRoute(e.target.value)} style={selectStyle(dv)}>
              <option value="domestic">Domestic</option>
              <option value="international">International</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Airport search */}
      <div style={{ background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: isMobile ? "20px 18px" : "26px 28px", marginBottom: 40 }}>
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontFamily: dv.serif, fontSize: 20, fontWeight: 400, letterSpacing: "-0.015em", color: dv.ink }}>Airport</span>
          <em style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, marginLeft: 6 }}>— search by name or IATA.</em>
        </div>
        <div style={{ position: "relative", maxWidth: 480 }}>
          <input
            value={loungeSearchCode}
            onChange={e => { setLoungeSearchCode(e.target.value); setLoungeDropdownOpen(true); }}
            onFocus={() => setLoungeDropdownOpen(true)}
            placeholder="LHR · London Heathrow"
            style={{
              width: "100%", padding: "13px 16px",
              border: `1px solid ${loungeDropdownOpen ? dv.accent : dv.cream}`,
              background: dv.bone, color: dv.ink, fontSize: 14,
              fontFamily: dv.sans, outline: "none", boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
          />
          {loungeAirport && !loungeDropdownOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <span style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", color: dv.accent, padding: "3px 8px", border: `1px solid ${dv.accent}`, background: dv.bone }}>{loungeAirport}</span>
              <span style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 14, color: dv.taupe }}>{AIRPORT_CITY[loungeAirport] || ""}</span>
              {/* Inline terminal chip — visible when an airline is selected and we know its terminal here */}
              {inferredTerminals.length > 0 && (() => {
                const airlineName = (LOYALTY_PROGRAMS.airlines.find(a => a.id === loungeFlightAirline) || {}).name;
                const labels = inferredTerminals.map(t => t.match(/^[A-Z0-9]+$/) ? `T${t}` : t).join(" · ");
                const shortName = airlineName ? airlineName.split(" ")[0] : "Selected airline";
                return (
                  <span title={`${airlineName || "This airline"} operates from ${labels} at ${loungeAirport}`}
                    style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", color: "#3b82f6", padding: "3px 8px", border: "1px solid #3b82f6", background: "rgba(59,130,246,0.06)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#3b82f6" }} />
                    {shortName} · {labels}
                  </span>
                );
              })()}
              <button onClick={() => { setLoungeAirport(null); setLoungeSearchCode(""); setLoungeExpandedId(null); }} style={{
                background: "none", border: "none", cursor: "pointer", color: dv.taupe,
                fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", padding: 0,
              }}>Clear</button>
            </div>
          )}
          {loungeDropdownOpen && (() => {
            const query = loungeSearchCode.trim().toLowerCase();
            const filtered = airportCodes.filter(code => {
              const city = (AIRPORT_CITY[code] || "").toLowerCase();
              return code.toLowerCase().includes(query) || city.includes(query);
            }).sort((a, b) => (AIRPORT_CITY[a] || a).localeCompare(AIRPORT_CITY[b] || b));
            if (filtered.length === 0) return null;
            return (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, marginTop: 6, zIndex: 200,
                background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`,
                boxShadow: D ? "0 12px 28px rgba(0,0,0,0.6)" : "0 12px 28px rgba(21,19,15,0.12)",
                maxHeight: 320, overflowY: "auto",
              }}>
                {filtered.map(code => {
                  const isActive = loungeAirport === code;
                  return (
                    <button key={code} onClick={() => {
                      setLoungeAirport(code);
                      setLoungeExpandedId(null);
                      setLoungeSearchCode(`${code} · ${AIRPORT_CITY[code] || code}`);
                      setLoungeDropdownOpen(false);
                    }} style={{
                      display: "flex", alignItems: "center", gap: 14, width: "100%",
                      padding: "11px 16px", border: "none", cursor: "pointer", textAlign: "left",
                      background: isActive ? dv.paper : "transparent",
                      borderBottom: `1px solid ${dv.cream}`, transition: "background 0.15s",
                    }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = dv.paper; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ fontFamily: dv.mono, fontSize: 11, fontWeight: 500, color: dv.accent, letterSpacing: "0.1em", minWidth: 36 }}>{code}</span>
                      <span style={{ fontFamily: dv.serif, fontSize: 14, color: dv.ink }}>{AIRPORT_CITY[code] || code}</span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
          {loungeDropdownOpen && (
            <div onClick={() => setLoungeDropdownOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
          )}
        </div>
      </div>

      {/* ─── TERMINAL CONTEXT BAND ─── */}
      {loungeAirport && hasTerminalSignal && (() => {
        const airlineName = (LOYALTY_PROGRAMS.airlines.find(a => a.id === loungeFlightAirline) || {}).name;
        const fromFlight = upcomingFromHere.length > 0 && flightTerminals.length > 0;
        const eyebrow = fromFlight
          ? `You depart ${loungeAirport} · ${nextDepartureFromHere?.flightNumber || nextDepartureFromHere?.route}`
          : airlineName
            ? `${airlineName} at ${loungeAirport}`
            : `Terminal context · ${loungeAirport}`;
        return (
          <div style={{ background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, borderLeft: `3px solid ${dv.accent}`, padding: isMobile ? "14px 16px" : "16px 22px", marginBottom: 24, display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16, alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.accent, marginBottom: 4 }}>
                {eyebrow}
              </div>
              <div style={{ fontFamily: dv.serif, fontSize: 16, color: dv.ink, lineHeight: 1.3 }}>
                {fromFlight
                  ? <>Your terminal: <strong style={{ color: dv.accent, fontWeight: 500 }}>{terminalLabels.join(" · ")}</strong>{hasExtraReachable ? <> · post-security access also to <strong style={{ color: dv.gold, fontWeight: 500 }}>{extraReachableLabels.join(" · ")}</strong>.</> : <>. Showing lounges in your terminal only.</>}</>
                  : <>{airlineName || "This airline"} operates from <strong style={{ color: dv.accent, fontWeight: 500 }}>{terminalLabels.join(" · ")}</strong>{hasExtraReachable ? <> · post-security access also to <strong style={{ color: dv.gold, fontWeight: 500 }}>{extraReachableLabels.join(" · ")}</strong>.</> : <>. Showing lounges there only.</>}</>
                }
              </div>
              {hasExtraReachable && (
                <div style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.06em", marginTop: 4 }}>
                  Showing lounges in every terminal you can walk to without re-clearing security.
                </div>
              )}
              {!fromFlight && (
                <div style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.06em", marginTop: 4 }}>
                  Inferred from {airlineName || "the airline"}'s usual gates · forward your booking to refine.
                </div>
              )}
              {upcomingFromHere.length > 1 && (
                <div style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.06em", marginTop: 4 }}>
                  {upcomingFromHere.length} upcoming departures from this airport in the next 30 days
                </div>
              )}
            </div>
            {/* Show all terminals toggle */}
            <button onClick={() => setLoungeShowAllTerminals?.(!loungeShowAllTerminals)}
              title={loungeShowAllTerminals ? "Hide lounges in other terminals" : "Show lounges in all terminals"}
              style={{
                flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px",
                border: `1px solid ${loungeShowAllTerminals ? dv.accent : dv.cream}`,
                background: loungeShowAllTerminals ? "rgba(200,85,61,0.08)" : "transparent",
                color: loungeShowAllTerminals ? dv.accent : dv.taupe,
                fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                cursor: "pointer", transition: "all 0.2s",
              }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: loungeShowAllTerminals ? dv.accent : dv.stone }} />
              {loungeShowAllTerminals
                ? `All terminals · ${loungesWithAccess.length}`
                : hasExtraReachable
                  ? `Reachable · ${visibleLounges.length} of ${loungesWithAccess.length}`
                  : `Same terminal · ${visibleLounges.length} of ${loungesWithAccess.length}`}
            </button>
          </div>
        );
      })()}

      {/* ─── ACCESSIBLE LIST ─── */}
      {loungeAirport && (
        <>
          <SectionSep
            dv={dv}
            num="§ 2"
            title={`Accessible at ${loungeAirport}`}
            count={accessible.length}
            rule
          />
          {accessible.length === 0 ? (
            <div style={{ padding: "44px 28px", textAlign: "center", background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, marginBottom: 40 }}>
              <p style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 16, margin: 0 }}>
                No accessible lounges with the current setup. Adjust your flight class or add programs to unlock more.
              </p>
            </div>
          ) : (
            <LoungeLedger
              dv={dv}
              isMobile={isMobile}
              lounges={accessible}
              expandedId={loungeExpandedId}
              setExpandedId={setLoungeExpandedId}
              loungePhotos={loungePhotos}
              loungeAirport={loungeAirport}
              renderStars={renderStars}
              networkAccent={networkAccent}
              saveLoungeVisit={saveLoungeVisit}
              hasAccess
            />
          )}

          {inaccessible.length > 0 && (
            <>
              <SectionSep
                dv={dv}
                num="§ 3"
                title="Out of reach"
                count={inaccessible.length}
                rule
              />
              <LoungeLedger
                dv={dv}
                isMobile={isMobile}
                lounges={inaccessible}
                expandedId={loungeExpandedId}
                setExpandedId={setLoungeExpandedId}
                loungePhotos={loungePhotos}
                loungeAirport={loungeAirport}
                renderStars={renderStars}
                networkAccent={networkAccent}
                saveLoungeVisit={saveLoungeVisit}
                hasAccess={false}
              />
            </>
          )}
        </>
      )}

      {!loungeAirport && (
        <div style={{ padding: "60px 28px", textAlign: "center", background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}` }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={dv.accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h3 style={{ fontFamily: dv.serif, fontSize: 24, fontWeight: 400, color: dv.ink, margin: 0, letterSpacing: "-0.01em" }}>Pick an airport.</h3>
          <p style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, marginTop: 8, marginBottom: 0 }}>
            Search above by code or city to see what's open to you.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── helpers ───
function SectionSep({ dv, num, title, count, rule }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "0 0 18px", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: dv.taupe }}>
      <div style={{ width: 28, height: 1, background: dv.accent }} />
      <strong style={{ color: dv.ink, fontWeight: 500 }}>{num} · {title}</strong>
      {count != null && (
        <span style={{ color: dv.accent, background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: "2px 8px" }}>
          {String(count)} {count === 1 ? "entry" : "entries"}
        </span>
      )}
      {rule && <div style={{ flex: 1, height: 1, background: dv.cream }} />}
    </div>
  );
}

function Field({ dv, label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  );
}

function selectStyle(dv) {
  return {
    width: "100%", padding: "11px 14px", background: dv.bone,
    border: `1px solid ${dv.cream}`, color: dv.ink, fontSize: 13,
    fontFamily: dv.sans, cursor: "pointer", outline: "none",
    appearance: "none", WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6458' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 36,
  };
}

function LoungeLedger({ dv, isMobile, lounges, expandedId, setExpandedId, loungePhotos, loungeAirport, renderStars, networkAccent, saveLoungeVisit, hasAccess }) {
  return (
    <div style={{ background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, marginBottom: 40 }}>
      {lounges.map((lounge, idx) => {
        const expanded = expandedId === lounge.id;
        const accessRules = lounge._access || [];
        const nColor = networkAccent(lounge.network);
        const last = idx === lounges.length - 1;
        return (
          <div key={lounge.id} style={{
            borderBottom: last ? "none" : `1px solid ${dv.cream}`,
            background: idx % 2 === 1 ? "rgba(226,220,206,0.18)" : "transparent",
            transition: "background 0.25s",
          }}>
            <div onClick={() => setExpandedId(expanded ? null : lounge.id)}
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "32px 6px 1fr auto" : "36px 6px 1fr auto auto auto",
                gap: isMobile ? 12 : 18, alignItems: "center",
                padding: isMobile ? "16px 16px" : "18px 28px", cursor: "pointer",
              }}
              onMouseEnter={e => e.currentTarget.style.background = dv.bone}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.stone, letterSpacing: "0.08em" }}>{String(idx + 1)}</span>
              <div style={{ width: 4, height: 36, background: nColor, opacity: hasAccess ? 1 : 0.4 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 16 : 19, fontWeight: 400, letterSpacing: "-0.005em", color: hasAccess ? dv.ink : dv.taupe, lineHeight: 1.15, marginBottom: 4 }}>
                  {lounge.name}
                  {hasAccess && <em style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.moss, fontSize: 13, marginLeft: 8 }}>· access</em>}
                </div>
                <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.04em", color: dv.taupe, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <span>Term {lounge.terminal}</span>
                  {lounge._isHomeTerminal ? (
                    <span style={{ color: dv.accent, fontWeight: 500, padding: "1px 6px", border: `1px solid ${dv.accent}`, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 9 }}>
                      Your terminal
                    </span>
                  ) : lounge._inYourTerminal ? (
                    <span title="Reachable from your terminal without re-clearing security" style={{ color: dv.gold, fontWeight: 500, padding: "1px 6px", border: `1px solid ${dv.gold}`, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 9 }}>
                      Reachable
                    </span>
                  ) : null}
                  <span style={{ color: dv.stone }}>·</span>
                  <span style={{ color: nColor, fontWeight: 500 }}>{networkLabel(lounge.network)}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                {renderStars(lounge.rating)}
                <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe, marginLeft: 4 }}>{lounge.rating.toFixed(1)}</span>
              </div>
              {!isMobile && (
                <span style={{
                  fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
                  padding: "4px 10px",
                  border: `1px solid ${hasAccess ? dv.moss : dv.cream}`,
                  color: hasAccess ? dv.moss : dv.stone,
                  background: hasAccess ? "rgba(107,122,90,0.08)" : "transparent",
                  whiteSpace: "nowrap",
                }}>
                  {hasAccess ? "Open to you" : "Not yours"}
                </span>
              )}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={dv.taupe} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            {expanded && (
              <div style={{ padding: isMobile ? "0 16px 22px" : "0 28px 26px", borderTop: `1px solid ${dv.cream}`, background: dv.bone }}>
                {loungePhotos[lounge.id] && (
                  <div style={{ margin: "20px 0 22px", overflow: "hidden", height: 220, border: `1px solid ${dv.cream}` }}>
                    <img src={loungePhotos[lounge.id]} alt={lounge.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 28, marginTop: loungePhotos[lounge.id] ? 0 : 22 }}>
                  <div>
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe, marginBottom: 12 }}>Details</div>
                    <div style={{ fontFamily: dv.serif, fontSize: 14, color: dv.ink, lineHeight: 1.7 }}>
                      <div><span style={{ color: dv.taupe }}>Location · </span>{lounge.location}</div>
                      <div><span style={{ color: dv.taupe }}>Hours · </span>{lounge.hours}</div>
                      <div><span style={{ color: dv.taupe }}>Network · </span><span style={{ color: nColor, fontWeight: 500 }}>{networkLabel(lounge.network)}</span></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe, marginBottom: 12 }}>Amenities</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {lounge.amenities.map(a => (
                        <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", border: `1px solid ${dv.cream}`, background: dv.paper, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", color: dv.taupe }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d={AMENITY_ICONS[a] || "M12 12m-9 0a9 9 0 1018 0 9 9 0 10-18 0"} />
                          </svg>
                          {AMENITY_LABELS[a] || a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {accessRules.length > 0 && (
                  <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${dv.cream}` }}>
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe, marginBottom: 12 }}>Your access</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {accessRules.map((rule, ri) => (
                        <div key={ri} style={{ padding: "10px 14px", background: "rgba(107,122,90,0.08)", border: `1px solid rgba(107,122,90,0.25)`, display: "flex", alignItems: "center", gap: 12 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={dv.moss} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontFamily: dv.serif, fontSize: 14, color: dv.ink, fontWeight: 400 }}>
                              {rule.source === "card" ? rule.cardName : `${rule.airlineName} ${rule.tier}`}
                            </span>
                            <span style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 13, marginLeft: 8 }}>{rule.guestNote}</span>
                            {rule.condition && <span style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.gold, marginLeft: 8 }}>conditional</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 22, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {hasAccess && (
                    <button onClick={(e) => { e.stopPropagation(); saveLoungeVisit({ loungeId: lounge.id, loungeName: lounge.name, airport: loungeAirport, date: new Date().toISOString().split("T")[0], network: lounge.network }); }} style={{
                      padding: "11px 22px", background: dv.ink, color: dv.bone, border: "none",
                      fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", transition: "background 0.25s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = dv.accent}
                      onMouseLeave={e => e.currentTarget.style.background = dv.ink}
                    >Log visit</button>
                  )}
                  {lounge.placeQuery && (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lounge.placeQuery)}`} target="_blank" rel="noopener noreferrer" style={{
                      padding: "11px 18px", border: `1px solid ${dv.cream}`, background: "transparent",
                      color: dv.taupe, fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
                      textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.25s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.color = dv.ink; e.currentTarget.style.borderColor = dv.ink; }}
                      onMouseLeave={e => { e.currentTarget.style.color = dv.taupe; e.currentTarget.style.borderColor = dv.cream; }}
                    >
                      Google Maps
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
