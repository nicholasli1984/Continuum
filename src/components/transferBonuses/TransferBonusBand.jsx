import React, { useState } from "react";
import { TRANSFER_FROM_TO_CURRENCY_ID, daysRemaining } from "../../constants/transferBonuses";

const FONTS = {
  serif: "'Fraunces', 'Instrument Serif', Georgia, serif",
  sans: "'Inter Tight', 'Instrument Sans', sans-serif",
  mono: "'JetBrains Mono', 'Geist Mono', monospace",
};

// Slim editorial band that surfaces active transfer bonuses.
//
// Props:
//   bonuses        — array of bonus objects (active + applicable)
//   userBonuses    — subset that match currencies the user holds (highlighted)
//   lastUpdated    — ISO date string for "as of" line
//   isMobile, darkMode
//   variant: "compact" (Dashboard) | "full" (Wallet)
export default function TransferBonusBand({ bonuses, userBonuses, lastUpdated, isMobile, darkMode, variant = "compact" }) {
  const [expanded, setExpanded] = useState(variant === "full");
  if (!bonuses || bonuses.length === 0) return null;

  const dv = palette(darkMode);
  const personal = userBonuses && userBonuses.length > 0;
  const headlineCount = personal ? userBonuses.length : bonuses.length;
  const headlineText = personal
    ? `${headlineCount} transfer bonus${headlineCount === 1 ? "" : "es"} on points you hold`
    : `${bonuses.length} active transfer bonus${bonuses.length === 1 ? "" : "es"}`;

  return (
    <div style={{
      background: dv.paper, borderRadius: 12, border: `1px solid ${personal ? dv.accent : dv.cream}`,
      marginBottom: variant === "full" ? 32 : 20, position: "relative",
    }}>
      {/* Header row */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 14,
          padding: isMobile ? "14px 16px" : "16px 22px",
          background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
          borderBottom: expanded ? `1px solid ${dv.cream}` : "none",
        }}
      >
        <div style={{ width: 28, height: 28, background: dv.bone, borderRadius: 12, border: `1px solid ${personal ? dv.accent : dv.cream}`, color: personal ? dv.accent : dv.taupe, display: "grid", placeItems: "center", flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: personal ? dv.accent : dv.taupe, marginBottom: 3 }}>
            Transfer bonuses · live
          </div>
          <div style={{ fontFamily: FONTS.serif, fontSize: isMobile ? 16 : 18, color: dv.ink, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
            {headlineText}
          </div>
        </div>
        <span style={{
          width: 22, height: 22, display: "grid", placeItems: "center",
          color: dv.taupe, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.25s",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </button>

      {/* Body */}
      {expanded && (
        <div>
          {/* Show personal first, then everything else */}
          {[...(userBonuses || []), ...bonuses.filter(b => !(userBonuses || []).includes(b))].map((b, i, arr) => (
            <BonusRow key={`${b.from}->${b.to}-${i}`} bonus={b} dv={dv} isMobile={isMobile}
              personal={(userBonuses || []).includes(b)}
              isLast={i === arr.length - 1}
            />
          ))}
          <div style={{ padding: "10px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${dv.cream}`, background: dv.bone }}>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: dv.stone, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {lastUpdated ? `Updated ${formatRelative(lastUpdated)}` : "Seed data"}
            </span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: dv.stone, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Source · Frequent Miler
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function BonusRow({ bonus, dv, isMobile, personal, isLast }) {
  const days = daysRemaining(bonus);
  const urgent = days !== null && days <= 7;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: isMobile ? "1fr auto" : "1fr auto auto auto", gap: isMobile ? 10 : 16,
      padding: isMobile ? "12px 16px" : "14px 22px", alignItems: "center",
      borderBottom: !isLast ? `1px solid ${dv.cream}` : "none",
      background: personal ? "rgba(200,85,61,0.04)" : "transparent",
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: FONTS.serif, fontSize: 15, color: dv.ink, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {bonus.from} <span style={{ color: dv.stone, fontStyle: "italic", margin: "0 4px" }}>→</span> {bonus.to}
        </div>
        {bonus.notes && (
          <div style={{ fontFamily: FONTS.serif, fontStyle: "italic", fontSize: 12, color: dv.taupe, marginTop: 2, lineHeight: 1.4 }}>{bonus.notes}</div>
        )}
      </div>
      <span style={{ fontFamily: FONTS.mono, fontSize: 14, color: dv.accent, fontWeight: 500, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
        +{bonus.bonusPct}%
      </span>
      {!isMobile && (
        <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: urgent ? dv.accent : dv.taupe, letterSpacing: "0.06em", textTransform: "uppercase", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {days === null ? "Open-ended" : days === 0 ? "Ends today" : `${days}d left`}
        </span>
      )}
      {!isMobile && bonus.url && (
        <a href={bonus.url} target="_blank" rel="noopener noreferrer"
          style={{ fontFamily: FONTS.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", padding: "4px 8px", border: `1px solid ${dv.cream}` }}
          onMouseEnter={e => { e.currentTarget.style.color = dv.accent; e.currentTarget.style.borderColor = dv.accent; }}
          onMouseLeave={e => { e.currentTarget.style.color = dv.taupe; e.currentTarget.style.borderColor = dv.cream; }}>
          Details →
        </a>
      )}
    </div>
  );
}

function palette(D) {
  return {
    bone: D ? "#1a1a1a" : "#fff",
    paper: D ? "#222" : "#fff",
    cream: D ? "rgba(255,255,255,0.08)" : "#E2DCCE",
    stone: D ? "#8a8a8a" : "#857A66",
    taupe: D ? "#999" : "#6B6458",
    ink: D ? "#f0ece6" : "#15130F",
    accent: "#C8553D",
  };
}

function formatRelative(iso) {
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now - then;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return then.toISOString().slice(0, 10);
}
