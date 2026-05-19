import React from "react";

// Tour steps for the first-run product walkthrough. Focused on the four
// flows we want users to try first: email forwarding, snap-a-receipt,
// expense split, travel trackers. Each step optionally provides a
// `preview(dv, fonts)` mini-mockup that previews the actual UI.

const FONTS = { serif: "'Fraunces', serif", sans: "'Inter Tight', sans-serif", mono: "'JetBrains Mono', monospace" };

// Shared mini-card surface used by previews
const surface = (dv) => ({
  background: dv.bone, border: `1px solid ${dv.cream}`, padding: "10px 12px",
  display: "flex", flexDirection: "column", gap: 4,
});

const eyebrow = (dv) => ({
  fontFamily: FONTS.mono, fontSize: 9, letterSpacing: "0.12em",
  textTransform: "uppercase", color: dv.accent,
});

const titleSm = (dv) => ({
  fontFamily: FONTS.serif, fontSize: 13, color: dv.ink, lineHeight: 1.2, letterSpacing: "-0.01em",
});

const meta = (dv) => ({
  fontFamily: FONTS.mono, fontSize: 9, letterSpacing: "0.08em",
  textTransform: "uppercase", color: dv.taupe,
});

// ── Preview: forwarded booking lands as a parsed trip ──
function PreviewForward(dv) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{
        ...surface(dv), borderLeft: `3px solid ${dv.accent}`, padding: "8px 10px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe }}>
          Inbox · trips@gocontinuum.app
        </span>
        <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: dv.taupe }}>now</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center", color: dv.taupe, fontSize: 14, lineHeight: 1 }}>↓</div>
      <div style={surface(dv)}>
        <span style={eyebrow(dv)}>Flight · parsed</span>
        <span style={titleSm(dv)}>AA 1234 · BNA → LGA</span>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={meta(dv)}>Apr 26 · 3:45 PM</span>
          <span style={meta(dv)}>Confirmed</span>
        </div>
      </div>
    </div>
  );
}

// ── Preview: snap a receipt → parsed inbox row ──
function PreviewSnap(dv) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{
        ...surface(dv), padding: "10px 12px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 28, height: 28, border: `1px solid ${dv.cream}`,
          display: "grid", placeItems: "center", color: dv.accent, flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
        <span style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: "0.08em", color: dv.taupe }}>
          Camera · capturing receipt
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "center", color: dv.taupe, fontSize: 14, lineHeight: 1 }}>↓</div>
      <div style={{ ...surface(dv), borderLeft: `3px solid ${dv.accent}` }}>
        <span style={eyebrow(dv)}>Inbox · auto-filled</span>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={titleSm(dv)}>Lyft</span>
          <span style={{ fontFamily: FONTS.serif, fontSize: 13, color: dv.ink }}>$24.50</span>
        </div>
        <span style={meta(dv)}>Apr 28 · Transport · assign to trip →</span>
      </div>
    </div>
  );
}

// ── Preview: expense split across companions and currencies ──
function PreviewSplit(dv) {
  const Avatar = ({ initials, bg }) => (
    <div style={{
      width: 26, height: 26, borderRadius: "50%", background: bg,
      display: "grid", placeItems: "center", border: `2px solid ${dv.bone}`,
      color: "#fff", fontFamily: FONTS.mono, fontSize: 9, fontWeight: 600,
    }}>{initials}</div>
  );
  return (
    <div style={surface(dv)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={titleSm(dv)}>Dinner · Tokyo</span>
        <span style={{ fontFamily: FONTS.serif, fontSize: 13, color: dv.ink }}>¥18,400</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex" }}>
          <Avatar initials="N" bg="#C8553D" />
          <div style={{ marginLeft: -8 }}><Avatar initials="S" bg="#6B7A5A" /></div>
          <div style={{ marginLeft: -8 }}><Avatar initials="M" bg="#1C4B82" /></div>
        </div>
        <span style={meta(dv)}>Split equal · 3 ways</span>
      </div>
      <div style={{
        marginTop: 8, paddingTop: 8, borderTop: `1px solid ${dv.cream}`,
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
      }}>
        <span style={{ fontFamily: FONTS.serif, fontStyle: "italic", color: dv.taupe, fontSize: 11 }}>
          You're owed
        </span>
        <span style={{ fontFamily: FONTS.serif, fontSize: 13, color: dv.accent }}>≈ $82.50 USD</span>
      </div>
    </div>
  );
}

// ── Preview: travel trackers — programs, vouchers, lounges ──
function PreviewTrackers(dv) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ ...surface(dv), borderLeft: `3px solid ${dv.accent}`, padding: "8px 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={titleSm(dv)}>AA Executive Platinum</span>
          <span style={meta(dv)}>196 / 200K LP</span>
        </div>
        <div style={{ height: 3, background: dv.cream, marginTop: 6, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, width: "98%", background: dv.accent }} />
        </div>
      </div>
      <div style={{ ...surface(dv), padding: "8px 10px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ ...eyebrow(dv), color: "#B8924A" }}>Voucher · 6 mo left</span>
          <span style={titleSm(dv)}>BA Travel Together</span>
        </div>
        <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: dv.taupe }}>~$1,500</span>
      </div>
      <div style={{ ...surface(dv), padding: "8px 10px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ ...eyebrow(dv), color: "#6B7A5A" }}>Lounge · JFK T8</span>
          <span style={titleSm(dv)}>Flagship Lounge · access via EXP</span>
        </div>
      </div>
    </div>
  );
}

export const TOUR_STEPS = [
  {
    title: "Welcome to Continuum.",
    body: "Four flows that pay for the app: forward a booking, snap a receipt, split a tab, track every status and voucher in one place. This tour is five steps.",
    placement: "bottom",
  },
  {
    selector: "[data-tour=\"add-trip\"]",
    title: "Forward a booking. We do the rest.",
    body: "Forward any flight, hotel, or rental confirmation to trips@gocontinuum.app. Continuum parses dates, segments, confirmation numbers — and a trip card appears on your dashboard.",
    placement: "bottom",
    preview: PreviewForward,
  },
  {
    selector: "[data-tour=\"snap-receipt\"]",
    title: "Snap a receipt. It lands in your inbox.",
    body: "Tap the camera in the header. We OCR the merchant, amount, currency, and date — then you assign it to a trip in one tap. Same flow works for emailed PDFs to expenses@gocontinuum.app.",
    placement: "bottom",
    preview: PreviewSnap,
  },
  {
    selector: "[data-tour=\"nav-split\"]",
    title: "Split tabs across people and currencies.",
    body: "Add companions to your address book once. Split any expense — equal, exact, percent, or share — across multiple currencies, with FX baked in. Balances settle cleanly even on multi-leg trips.",
    placement: "top",
    preview: PreviewSplit,
  },
  {
    selector: "[data-tour=\"nav-loyalty\"]",
    title: "Travel trackers — status, vouchers, lounges.",
    body: "Link your loyalty programs and credit cards once. Continuum tracks status progress, surfaces vouchers from your linked cards before they expire, and tells you which lounges you can enter at every airport you're flying through.",
    placement: "top",
    preview: PreviewTrackers,
  },
  {
    title: "That's the lay of the land.",
    body: "Start by forwarding a real booking to trips@gocontinuum.app. The question-mark button up top reopens this tour anytime. Settings is in your avatar.",
    placement: "bottom",
  },
];
