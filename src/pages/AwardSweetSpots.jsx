import React, { useMemo, useState } from "react";
import { SWEET_SPOTS, SWEET_SPOT_CATEGORIES, spotsForCurrencies, spotsByCategory } from "../constants/awardSweetSpots";
import { POINT_CURRENCIES } from "../constants/pointValues";

const FONTS = {
  serif: "'Fraunces', 'Instrument Serif', Georgia, serif",
  sans: "'Inter Tight', 'Instrument Sans', sans-serif",
  mono: "'JetBrains Mono', 'Geist Mono', monospace",
};

const CABIN_LABELS = {
  first: "First class",
  business: "Business class",
  premium_economy: "Premium economy",
  economy: "Economy",
  hotel: "Hotel",
};

export function renderAwardSweetSpots(s) {
  return <AwardSweetSpotsPage {...s} />;
}

function AwardSweetSpotsPage({ css, isMobile, darkMode, userPointCurrencies }) {
  const D = darkMode;
  const dv = palette(D);

  const userCurrencies = userPointCurrencies || [];
  const hasUserCurrencies = userCurrencies.length > 0;

  // "mine" filter: show only spots on currencies the user holds
  const [showOnlyMine, setShowOnlyMine] = useState(hasUserCurrencies);
  const [selectedCurrency, setSelectedCurrency] = useState(null); // optional single-currency drill-in
  const [selectedCategory, setSelectedCategory] = useState(null); // optional category filter

  const filteredSpots = useMemo(() => {
    let spots = SWEET_SPOTS;
    if (showOnlyMine && hasUserCurrencies) spots = spotsForCurrencies(userCurrencies);
    if (selectedCurrency) spots = spots.filter(s => s.currency === selectedCurrency);
    if (selectedCategory) spots = spots.filter(s => s.category === selectedCategory);
    return spots;
  }, [showOnlyMine, hasUserCurrencies, userCurrencies, selectedCurrency, selectedCategory]);

  const grouped = useMemo(() => spotsByCategory(filteredSpots), [filteredSpots]);
  const currenciesInLibrary = useMemo(() => {
    const set = new Set(SWEET_SPOTS.map(s => s.currency));
    return [...set];
  }, []);

  return (
    <div style={{ fontFamily: FONTS.sans, color: dv.ink }}>
      <Hero dv={dv} D={D} isMobile={isMobile} css={css} />
      <PageHeader dv={dv} isMobile={isMobile} />

      {/* Filter row */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 36 }}>
        {/* Toggle: mine vs all */}
        {hasUserCurrencies && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ToggleChip
              dv={dv}
              active={showOnlyMine}
              onClick={() => setShowOnlyMine(true)}
              label={`On points I hold · ${userCurrencies.length}`}
            />
            <ToggleChip
              dv={dv}
              active={!showOnlyMine}
              onClick={() => setShowOnlyMine(false)}
              label={`All currencies · ${currenciesInLibrary.length}`}
            />
          </div>
        )}

        {/* Currency chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <FilterChip dv={dv} active={!selectedCurrency} onClick={() => setSelectedCurrency(null)} label="All currencies" />
          {(showOnlyMine && hasUserCurrencies ? userCurrencies : currenciesInLibrary).map(cId => {
            const meta = POINT_CURRENCIES[cId];
            if (!meta) return null;
            return (
              <FilterChip
                key={cId} dv={dv}
                active={selectedCurrency === cId}
                onClick={() => setSelectedCurrency(prev => prev === cId ? null : cId)}
                label={meta.name}
              />
            );
          })}
        </div>

        {/* Category chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <FilterChip dv={dv} active={!selectedCategory} onClick={() => setSelectedCategory(null)} label="All themes" />
          {SWEET_SPOT_CATEGORIES.map(cat => (
            <FilterChip key={cat.id} dv={dv}
              active={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(prev => prev === cat.id ? null : cat.id)}
              label={cat.label}
            />
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredSpots.length === 0 && (
        <div style={{ background: dv.paper, border: `1px solid ${dv.cream}`, padding: isMobile ? "32px 22px" : "48px 32px", textAlign: "center" }}>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, fontWeight: 400, color: dv.ink, margin: "0 0 8px", letterSpacing: "-0.01em" }}>
            Nothing here for that combination.
          </h3>
          <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, lineHeight: 1.55, margin: 0 }}>
            Try clearing a filter — or switch off "On points I hold" to browse the full library.
          </p>
        </div>
      )}

      {/* Grouped by category */}
      {SWEET_SPOT_CATEGORIES.map(cat => {
        const spots = grouped[cat.id];
        if (!spots || spots.length === 0) return null;
        return (
          <section key={cat.id} style={{ marginBottom: 56 }}>
            <SectionEyebrow dv={dv} title={`${cat.label} · ${cat.note}`} />
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(360px, 1fr))", gap: 14 }}>
              {spots.map(spot => <SpotCard key={spot.id} spot={spot} dv={dv} isMobile={isMobile} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SpotCard({ spot, dv, isMobile }) {
  const meta = POINT_CURRENCIES[spot.currency];
  const cabinLabel = CABIN_LABELS[spot.cabin] || spot.cabin;
  return (
    <article style={{
      background: dv.paper, border: `1px solid ${dv.cream}`, padding: isMobile ? "20px 18px" : "24px 22px",
      display: "flex", flexDirection: "column", gap: 14, position: "relative",
    }}>
      {/* Currency + cabin badges */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe }}>
        <span style={{ padding: "3px 8px", border: `1px solid ${dv.cream}`, background: dv.bone, color: dv.accent }}>{meta?.name || spot.currency}</span>
        <span>{cabinLabel}</span>
      </div>

      {/* Title + route */}
      <div>
        <h3 style={{ fontFamily: FONTS.serif, fontSize: isMobile ? 20 : 22, fontWeight: 400, color: dv.ink, margin: 0, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
          {spot.title}
        </h3>
        <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", color: dv.taupe, fontSize: 13, margin: "6px 0 0", lineHeight: 1.4 }}>
          {spot.route}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, border: `1px solid ${dv.cream}` }}>
        <Stat dv={dv} eyebrow="Points" value={spot.points.label} />
        <Stat dv={dv} eyebrow="Cash equivalent" value={`$${spot.cashValue.low.toLocaleString()}–${spot.cashValue.high.toLocaleString()}`} border />
        <Stat dv={dv} eyebrow="Effective rate" value={spot.cppLabel} border accent />
      </div>

      {/* Booking path */}
      <div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe, marginBottom: 4 }}>How to book</div>
        <div style={{ fontFamily: FONTS.serif, fontSize: 14, color: dv.ink, lineHeight: 1.45 }}>
          {spot.via} → book through {spot.partner}.
        </div>
      </div>

      {/* Notes */}
      <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", color: dv.taupe, fontSize: 13, lineHeight: 1.55, margin: 0 }}>
        {spot.notes}
      </p>

      {/* Availability footer */}
      <div style={{ paddingTop: 10, borderTop: `1px solid ${dv.cream}`, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.stone }}>
        Availability · {spot.availability}
      </div>
    </article>
  );
}

function Stat({ dv, eyebrow, value, border, accent }) {
  return (
    <div style={{ padding: "12px 14px", background: dv.bone, borderLeft: border ? `1px solid ${dv.cream}` : "none" }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe, marginBottom: 4 }}>{eyebrow}</div>
      <div style={{ fontFamily: FONTS.serif, fontSize: 14, fontWeight: 400, color: accent ? dv.accent : dv.ink, fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>{value}</div>
    </div>
  );
}

function FilterChip({ dv, active, onClick, label, title, mono }) {
  return (
    <button onClick={onClick} title={title}
      style={{
        padding: "7px 12px", border: `1px solid ${active ? dv.ink : dv.cream}`,
        background: active ? dv.ink : "transparent", color: active ? dv.bone : dv.taupe,
        fontFamily: mono ? FONTS.mono : FONTS.sans,
        fontSize: mono ? 10 : 11, letterSpacing: mono ? "0.1em" : "0.04em",
        textTransform: mono ? "uppercase" : "none",
        cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
      }}>
      {label}
    </button>
  );
}

function ToggleChip({ dv, active, onClick, label }) {
  return (
    <button onClick={onClick}
      style={{
        padding: "8px 14px", border: `1px solid ${active ? dv.accent : dv.cream}`,
        background: active ? "rgba(200,85,61,0.06)" : "transparent",
        color: active ? dv.accent : dv.taupe,
        fontFamily: FONTS.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
        cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
        display: "inline-flex", alignItems: "center", gap: 8,
      }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? dv.accent : dv.stone }} />
      {label}
    </button>
  );
}

function Hero({ dv, D, isMobile, css }) {
  return (
    <div style={{ margin: isMobile ? "0 -16px 0" : "0 -40px 0", position: "relative", height: isMobile ? 200 : 320, overflow: "hidden", background: "#2C2A26" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/programsPicture.jpeg')", backgroundSize: "cover", backgroundPosition: "center", filter: "saturate(0.85) contrast(1.05) brightness(0.7)", animation: "kenburns 24s ease-in-out infinite alternate" }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${D ? "rgba(15,15,15,0)" : "rgba(244,241,236,0)"} 55%, ${D ? "rgba(15,15,15,0.9)" : "rgba(244,241,236,0.9)"} 90%, ${css.bg} 100%)`, zIndex: 1 }} />
      <div style={{ position: "absolute", top: 18, left: isMobile ? 16 : 48, zIndex: 3, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#F4F1EC", opacity: 0.9 }}>
        <span style={{ color: dv.accent }}>● </span>Sweet spots
      </div>
    </div>
  );
}

function PageHeader({ dv, isMobile }) {
  return (
    <div style={{ marginTop: -24, marginBottom: 36, paddingBottom: 28, borderBottom: `1px solid ${dv.cream}`, position: "relative", zIndex: 5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.accent }}>
        <div style={{ width: 28, height: 1, background: dv.accent }} />
        Awards · Curated redemption library
      </div>
      <h1 style={{ fontFamily: FONTS.serif, fontSize: isMobile ? 28 : "clamp(56px, 8vw, 92px)", fontWeight: 300, lineHeight: 0.94, letterSpacing: "-0.03em", color: dv.ink, margin: 0 }}>
        What your points <em style={{ fontStyle: "italic", color: dv.accent, fontWeight: 400 }}>are actually worth.</em>
      </h1>
      <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", fontSize: isMobile ? 15 : 18, color: dv.taupe, marginTop: 16, marginBottom: 0, lineHeight: 1.45, maxWidth: 640 }}>
        Hand-picked redemptions where points punch above their weight — first class on the world's best products, hidden hotel sweet spots, and the transferable shortcuts that get you there.
      </p>
    </div>
  );
}

function SectionEyebrow({ dv, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "0 0 18px", fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: dv.taupe }}>
      <div style={{ width: 28, height: 1, background: dv.accent }} />
      <strong style={{ color: dv.ink, fontWeight: 500 }}>{title}</strong>
      <div style={{ flex: 1, height: 1, background: dv.cream }} />
    </div>
  );
}

function palette(D) {
  return {
    bone: D ? "#1a1a1a" : "#F4F1EC",
    paper: D ? "#222" : "#EBE6DD",
    cream: D ? "rgba(255,255,255,0.08)" : "#E2DCCE",
    stone: D ? "#8a8a8a" : "#857A66",
    taupe: D ? "#999" : "#6B6458",
    ink: D ? "#f0ece6" : "#15130F",
    accent: "#C8553D",
    moss: "#6B7A5A",
  };
}
