import React from "react";

// Anonymized community stats page. Renders aggregates only — no names, no
// per-person data. Data comes from /api/community-stats via App.jsx.
export function renderCommunity(s) {
  const { css, isMobile, darkMode, communityStats, communityLoading, user } = s;
  const D = darkMode;
  const dv = {
    bone: D ? "#1a1a1a" : "#F4F1EC",
    paper: D ? "#222" : "#EBE6DD",
    cream: D ? "rgba(255,255,255,0.08)" : "#E2DCCE",
    stone: D ? "#8a8a8a" : "#857A66",
    taupe: D ? "#999" : "#6B6458",
    ink: D ? "#f0ece6" : "#15130F",
    accent: "#C8553D",
    moss: "#6B7A5A",
    gold: "#B8924A",
    serif: "'Fraunces', 'Instrument Serif', Georgia, serif",
    sans: "'Inter Tight', 'Instrument Sans', sans-serif",
    mono: "'JetBrains Mono', 'Geist Mono', monospace",
  };

  const Header = () => (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.accent }}>
        <div style={{ width: 32, height: 1, background: dv.accent }} />
        Continuum · Community §06
      </div>
      <h1 style={{ fontFamily: dv.serif, fontSize: isMobile ? 32 : "clamp(48px, 8vw, 80px)", fontWeight: 300, lineHeight: 0.96, letterSpacing: "-0.03em", color: dv.ink, margin: 0 }}>
        Community<em style={{ fontStyle: "italic", color: dv.accent, fontWeight: 400 }}>.</em>
      </h1>
      <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: isMobile ? 15 : 18, color: dv.taupe, marginTop: 16, marginBottom: 0, lineHeight: 1.45, maxWidth: 560 }}>
        Where Continuum travels — and where you stand among them. All anonymous.
      </p>
    </div>
  );

  if (communityLoading && !communityStats) {
    return (
      <div style={{ fontFamily: dv.sans, color: dv.ink }}>
        <Header />
        <div style={{ padding: "60px 28px", textAlign: "center", background: dv.paper, border: `1px solid ${dv.cream}`, fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 16 }}>
          Gathering the community…
        </div>
      </div>
    );
  }

  if (communityStats && communityStats.ready === false) {
    return (
      <div style={{ fontFamily: dv.sans, color: dv.ink }}>
        <Header />
        <div style={{ padding: "60px 28px", textAlign: "center", background: dv.paper, border: `1px solid ${dv.cream}` }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={dv.accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3 style={{ fontFamily: dv.serif, fontSize: 24, fontWeight: 400, color: dv.ink, margin: 0 }}>The community is growing.</h3>
          <p style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, marginTop: 10, marginBottom: 0 }}>
            Community stats unlock once a few more travelers join — {communityStats.memberCount} so far. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  const cs = communityStats || {};
  const you = cs.you || {};
  const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString());
  const maxDest = (cs.topDestinations || []).reduce((m, d) => Math.max(m, d.count), 0) || 1;
  const topPct = you.flightsBeatPct != null ? Math.max(1, 100 - you.flightsBeatPct) : null;

  const metrics = [
    { lbl: "Members", val: fmt(cs.memberCount), sub: "travelers on Continuum" },
    { lbl: "Trips logged", val: fmt(cs.totalTrips), sub: "across the community" },
    { lbl: "Flights tracked", val: fmt(cs.totalFlights), sub: "and counting" },
  ];

  const SectionSep = ({ num, title }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "0 0 18px", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: dv.taupe }}>
      <div style={{ width: 28, height: 1, background: dv.accent }} />
      <strong style={{ color: dv.ink, fontWeight: 500 }}>{num} · {title}</strong>
      <div style={{ flex: 1, height: 1, background: dv.cream }} />
    </div>
  );

  return (
    <div style={{ fontFamily: dv.sans, color: dv.ink }}>
      <Header />

      {/* Community totals */}
      <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 0, background: dv.paper, border: `1px solid ${dv.cream}`, marginBottom: 40 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{
            padding: isMobile ? "20px 18px" : "26px 28px",
            borderRight: !isMobile && i < metrics.length - 1 ? `1px solid ${dv.cream}` : "none",
            borderBottom: isMobile && i < metrics.length - 1 ? `1px solid ${dv.cream}` : "none",
          }}>
            <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 12 }}>{m.lbl}</div>
            <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 32 : 40, fontWeight: 300, lineHeight: 1, letterSpacing: "-0.03em", color: dv.ink, fontVariantNumeric: "tabular-nums" }}>{m.val}</div>
            <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.taupe, marginTop: 8 }}>{m.sub}</div>
          </div>
        ))}
      </section>

      {/* You vs the community */}
      <SectionSep num="§ 01" title="Where you stand" />
      <div style={{ background: dv.paper, border: `1px solid ${dv.cream}`, borderLeft: `3px solid ${dv.accent}`, padding: isMobile ? "22px 18px" : "28px 30px", marginBottom: 40 }}>
        {topPct != null ? (
          <>
            <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 22 : 28, fontWeight: 300, color: dv.ink, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
              You're in the <em style={{ fontStyle: "italic", color: dv.accent, fontWeight: 500 }}>top {topPct}%</em> of Continuum travelers by flights this year.
            </div>
            <div style={{ display: "flex", gap: 28, marginTop: 20, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 6 }}>Your flights</div>
                <div style={{ fontFamily: dv.serif, fontSize: 26, fontWeight: 300, color: dv.ink }}>{fmt(you.flights)}</div>
              </div>
              <div>
                <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 6 }}>Your trips</div>
                <div style={{ fontFamily: dv.serif, fontSize: 26, fontWeight: 300, color: dv.ink }}>{fmt(you.trips)}</div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 16, color: dv.taupe }}>
            Add a trip or two and we'll show how you compare to the community.
          </div>
        )}
      </div>

      {/* Top destinations */}
      <SectionSep num="§ 02" title="Top destinations" />
      <div style={{ background: dv.paper, border: `1px solid ${dv.cream}`, marginBottom: 40 }}>
        {(cs.topDestinations || []).length === 0 ? (
          <div style={{ padding: "44px 28px", textAlign: "center", fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 16 }}>No destinations yet.</div>
        ) : (
          cs.topDestinations.map((d, i) => (
            <div key={d.city} style={{ display: "flex", alignItems: "center", gap: 16, padding: isMobile ? "16px 16px" : "18px 28px", borderBottom: i < cs.topDestinations.length - 1 ? `1px solid ${dv.cream}` : "none" }}>
              <span style={{ fontFamily: dv.mono, fontSize: 12, color: dv.stone, minWidth: 24 }}>{String(i + 1).padStart(2, "0")}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 17 : 20, fontWeight: 400, color: dv.ink, marginBottom: 6 }}>{d.city}</div>
                <div style={{ height: 4, background: dv.cream, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.max(6, (d.count / maxDest) * 100)}%`, background: i === 0 ? dv.accent : dv.gold, borderRadius: 2 }} />
                </div>
              </div>
              <span style={{ fontFamily: dv.mono, fontSize: 12, color: dv.taupe, fontVariantNumeric: "tabular-nums" }}>{d.count} {d.count === 1 ? "trip" : "trips"}</span>
            </div>
          ))
        )}
      </div>

      <p style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", color: dv.stone, textAlign: "center", marginBottom: 20 }}>
        Aggregated and anonymized across all Continuum members. No individual data is ever shown.
      </p>
    </div>
  );
}
