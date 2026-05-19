import React from "react";

const FONTS = {
  serif: "'Fraunces', 'Instrument Serif', Georgia, serif",
  sans: "'Inter Tight', 'Instrument Sans', sans-serif",
  mono: "'JetBrains Mono', 'Geist Mono', monospace",
};

// Big editorial Wallet section: "Annual benefits — what's on the table".
// Shows portfolio totals + per-card progress bars. Tapping a card jumps to
// Programs (where the existing input UI lives).
//
// Props: summary { totalMax, totalClaimed, totalRemaining, pctClaimed, totalFees, perCard }
//        onEditCard(cardId) — navigate to Programs and expand that card
export default function BenefitsSummaryPanel({ summary, isMobile, darkMode, ProgramLogo, onEditCard, allCards }) {
  if (!summary?.hasLinkedCards) return null;
  const dv = palette(darkMode);

  return (
    <div style={{ marginBottom: 56 }}>
      <SectionEyebrow dv={dv} title="Annual benefits · what's on the table" />
      <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, lineHeight: 1.55, margin: "0 0 18px", maxWidth: 720 }}>
        You're paying for these credits in your annual fees. Track what you've actually pulled this year so they don't expire unused.
      </p>

      {/* Top stat band */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr 1fr", gap: 0, border: `1px solid ${dv.cream}`, marginBottom: 18 }}>
        <BigStat dv={dv} eyebrow="Remaining this year" value={`$${summary.totalRemaining.toLocaleString()}`} sub={`of $${summary.totalMax.toLocaleString()} total`} accent />
        <BigStat dv={dv} eyebrow="Claimed so far" value={`$${summary.totalClaimed.toLocaleString()}`} sub={`${summary.pctClaimed}% of available`} border={!isMobile} />
        <BigStat dv={dv} eyebrow="Annual fees paid" value={`$${summary.totalFees.toLocaleString()}`} sub={summary.totalClaimed >= summary.totalFees ? "Already breakeven" : `$${(summary.totalFees - summary.totalClaimed).toLocaleString()} to breakeven`} border={!isMobile} />
      </div>

      {/* Per-card breakdown */}
      <div style={{ background: dv.paper, border: `1px solid ${dv.cream}` }}>
        {summary.perCard.map((c, i) => {
          const card = allCards?.find(x => x.id === c.cardId);
          const pct = c.max > 0 ? Math.round((c.claimed / c.max) * 100) : 0;
          const remainPctOfMax = c.max > 0 ? Math.min(100, Math.round((c.remaining / c.max) * 100)) : 0;
          return (
            <div key={c.cardId} style={{
              padding: isMobile ? "14px 16px" : "16px 22px",
              borderBottom: i < summary.perCard.length - 1 ? `1px solid ${dv.cream}` : "none",
              display: "grid", gridTemplateColumns: isMobile ? "auto 1fr auto" : "auto 1fr 1.6fr auto", gap: 14, alignItems: "center",
              background: i % 2 === 1 ? "rgba(226,220,206,0.18)" : "transparent",
            }}>
              <div style={{ width: 36, height: 36, background: dv.bone, border: `1px solid ${dv.cream}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                {ProgramLogo && card ? <ProgramLogo prog={card} size={22} /> : null}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONTS.serif, fontSize: 15, color: dv.ink, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.06em", marginTop: 3 }}>
                  ${c.claimed.toLocaleString()} of ${c.max.toLocaleString()} · {pct}%
                </div>
              </div>
              {!isMobile && (
                <div>
                  {/* Progress bar — claimed (filled) vs remaining (empty) */}
                  <div style={{ height: 8, background: dv.bone, border: `1px solid ${dv.cream}`, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: pct >= 100 ? dv.moss : dv.accent, transition: "width 0.4s ease" }} />
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: c.remaining > 0 ? dv.accent : dv.moss, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 5 }}>
                    {c.remaining > 0 ? `$${c.remaining.toLocaleString()} on the table · ${remainPctOfMax}%` : "Fully claimed"}
                  </div>
                </div>
              )}
              <button onClick={() => onEditCard?.(c.cardId)} style={{
                padding: "8px 12px", border: `1px solid ${dv.cream}`, background: "transparent",
                color: dv.taupe, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.color = dv.accent; e.currentTarget.style.borderColor = dv.accent; }}
                onMouseLeave={e => { e.currentTarget.style.color = dv.taupe; e.currentTarget.style.borderColor = dv.cream; }}
              >Track →</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Compact pill for Dashboard ──
export function BenefitsDashboardPill({ summary, isMobile, darkMode, onClick }) {
  if (!summary?.hasLinkedCards || summary.totalMax === 0) return null;
  const dv = palette(darkMode);
  const urgent = summary.totalRemaining > 0 && summary.pctClaimed < 50;

  return (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 14,
      background: dv.paper, border: `1px solid ${urgent ? dv.accent : dv.cream}`,
      padding: isMobile ? "14px 16px" : "16px 22px", marginBottom: 20,
      cursor: "pointer", textAlign: "left", transition: "border-color 0.2s",
    }}
      onMouseEnter={e => { if (!urgent) e.currentTarget.style.borderColor = dv.taupe; }}
      onMouseLeave={e => { if (!urgent) e.currentTarget.style.borderColor = dv.cream; }}
    >
      <div style={{ width: 28, height: 28, background: dv.bone, border: `1px solid ${urgent ? dv.accent : dv.cream}`, color: urgent ? dv.accent : dv.taupe, display: "grid", placeItems: "center", flexShrink: 0 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: urgent ? dv.accent : dv.taupe, marginBottom: 3 }}>
          Annual card benefits
        </div>
        <div style={{ fontFamily: FONTS.serif, fontSize: isMobile ? 16 : 18, color: dv.ink, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
          {summary.totalRemaining > 0
            ? <>${summary.totalRemaining.toLocaleString()} <span style={{ fontStyle: "italic", color: dv.taupe }}>on the table</span> · {summary.pctClaimed}% claimed</>
            : <>All ${summary.totalMax.toLocaleString()} in benefits claimed.</>
          }
        </div>
      </div>
      <span style={{ width: 22, height: 22, display: "grid", placeItems: "center", color: dv.taupe }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </span>
    </button>
  );
}

function BigStat({ dv, eyebrow, value, sub, accent, border }) {
  return (
    <div style={{ padding: "20px 24px", background: dv.bone, borderLeft: border ? `1px solid ${dv.cream}` : "none" }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: accent ? dv.accent : dv.taupe, marginBottom: 8 }}>{eyebrow}</div>
      <div style={{ fontFamily: FONTS.serif, fontSize: 30, fontWeight: 400, color: accent ? dv.accent : dv.ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: dv.stone, letterSpacing: "0.06em", marginTop: 6 }}>{sub}</div>
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
