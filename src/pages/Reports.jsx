import React from "react";
export function renderReports(s) {
  const { css, isMobile, darkMode, user, trips, expenses, linkedAccounts, allPrograms,
    EXPENSE_CATEGORIES, AIRPORT_COORDS, AIRPORT_CITY,
    getTripExpenses, getTripTotal, getTripName, formatTripDates,
    haversineDistance, parseRoute, greatCircleMiles } = s;
  const D = darkMode;
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

