import React from "react";

// Branded "card" representation of each linked program/credit card, shown as a
// horizontal scrolling stream with a subtle scan-shimmer (the cardScanner vibe,
// done in CSS rather than Three.js). Status programs get a tier selector; credit
// cards get a chip + network + a Benefits toggle. Real card photos aren't used
// (copyrighted / not reliably hostable) — cards are generated from brand color +
// logo so they always render.

const darken = (hex, f = 0.45) => {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return hex || "#1d1b16";
  const r = Math.round(parseInt(h.slice(0, 2), 16) * (1 - f));
  const g = Math.round(parseInt(h.slice(2, 4), 16) * (1 - f));
  const b = Math.round(parseInt(h.slice(4, 6), 16) * (1 - f));
  return `rgb(${r},${g},${b})`;
};

const networkOf = (prog) => {
  const id = (prog.id || "").toLowerCase();
  const n = (prog.name || "").toLowerCase();
  if (id.startsWith("amex") || n.includes("american express") || n.includes("amex")) return "AMEX";
  if (id.includes("bilt")) return "MASTERCARD";
  return "VISA";
};

export default function ProgramCards({ dv, isMobile, programs, ProgramLogo, linkedAccounts, kind, cardIds, onTierChange, onRemove, onToggleBenefits, expandedCardId }) {
  if (!programs || programs.length === 0) return null;
  const W = isMobile ? 230 : 264;
  const H = Math.round(W / 1.586);

  return (
    <div className="prog-cards" style={{ display: "flex", gap: 14, overflowX: "auto", padding: "4px 2px 16px", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", marginBottom: 24 }}>
      <style>{`.prog-cards::-webkit-scrollbar{display:none} @keyframes progScan{0%{transform:translateX(-160%) skewX(-16deg)}100%{transform:translateX(420%) skewX(-16deg)}}`}</style>
      {programs.map((prog, idx) => {
        const tier = linkedAccounts[prog.id]?.currentTier;
        const base = prog.color || "#2C2A26";
        const acc = prog.accent || base;
        const expanded = expandedCardId === prog.id;
        const k = cardIds ? (cardIds.has(prog.id) ? "card" : "status") : kind;
        return (
          <div key={prog.id} style={{
            position: "relative", flexShrink: 0, width: W, height: H, borderRadius: 16, overflow: "hidden", color: "#fff",
            background: `linear-gradient(135deg, ${base} 0%, ${darken(base, 0.5)} 100%)`,
            boxShadow: "0 12px 30px rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.10)",
          }}>
            {/* brand sheen */}
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(130% 100% at 82% -12%, ${acc}55, transparent 58%)`, pointerEvents: "none" }} />
            {/* scan shimmer */}
            <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 64, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)", animation: `progScan ${6.5 + idx * 0.5}s linear infinite`, pointerEvents: "none" }} />

            {/* logo chip */}
            <div style={{ position: "absolute", top: 14, left: 14, width: 38, height: 38, borderRadius: 9, background: "#fff", display: "grid", placeItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.22)" }}>
              <ProgramLogo prog={prog} size={24} />
            </div>

            {/* remove */}
            {onRemove && (
              <button onClick={() => onRemove(prog.id)} title="Remove" style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: 8, background: "rgba(0,0,0,0.30)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.30)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}

            {/* credit-card chip */}
            {k === "card" && (
              <div style={{ position: "absolute", top: 60, left: 16, width: 34, height: 26, borderRadius: 5, background: "linear-gradient(135deg,#E8C97A,#B8924A)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.18)" }} />
            )}

            {/* bottom content */}
            <div style={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
              <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 15 : 16, fontWeight: 500, lineHeight: 1.15, textShadow: "0 1px 6px rgba(0,0,0,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prog.name}</div>

              {k === "status" ? (
                <div style={{ marginTop: 8 }}>
                  <select value={tier || ""} onChange={e => onTierChange(prog.id, e.target.value)} onClick={e => e.stopPropagation()} style={{
                    width: "100%", padding: "6px 26px 6px 10px", borderRadius: 8, background: "rgba(0,0,0,0.34)", color: "#fff",
                    border: "1px solid rgba(255,255,255,0.30)", fontSize: 11, fontFamily: dv.sans, cursor: "pointer", outline: "none",
                    appearance: "none", WebkitAppearance: "none",
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 9px center",
                  }}>
                    <option value="" style={{ color: "#000" }}>Member · base</option>
                    {(prog.tiers || []).map(t => <option key={t.name} value={t.name} style={{ color: "#000" }}>{t.name}</option>)}
                  </select>
                </div>
              ) : (
                <div style={{ marginTop: 7, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.88)" }}>{networkOf(prog)}</span>
                  {onToggleBenefits && (
                    <button onClick={() => onToggleBenefits(prog.id)} style={{ padding: "5px 12px", borderRadius: 100, background: expanded ? "#fff" : "rgba(0,0,0,0.32)", color: expanded ? darken(base, 0.2) : "#fff", border: "1px solid rgba(255,255,255,0.35)", fontFamily: dv.mono, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>{expanded ? "Hide" : "Benefits"}</button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
