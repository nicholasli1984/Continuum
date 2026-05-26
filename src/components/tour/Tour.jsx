import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

const PALETTE = {
  light: { bone: "#F4F1EC", paper: "#EBE6DD", cream: "#E2DCCE", taupe: "#6B6458", ink: "#15130F", accent: "#C8553D" },
  dark:  { bone: "#1a1a1a", paper: "#222",   cream: "rgba(255,255,255,0.08)", taupe: "#999", ink: "#f0ece6", accent: "#C8553D" },
};
const FONTS = { serif: "'Fraunces', serif", sans: "'Inter Tight', sans-serif", mono: "'JetBrains Mono', monospace" };

// Locate the target element for a given step. Steps with no `selector` render
// as a centered modal (used for welcome/done).
function findTarget(selector) {
  if (!selector) return null;
  try { return document.querySelector(selector); } catch { return null; }
}

// Fit the tooltip into the viewport, preferring `placement` but falling back
// when there isn't room. Returns { tooltipStyle, arrowStyle, finalPlacement }.
function computeTooltip(rect, placement, tooltipSize) {
  const { width: tw, height: th } = tooltipSize;
  const margin = 14;
  const vw = window.innerWidth, vh = window.innerHeight;
  const candidates = [placement, "bottom", "top", "right", "left"];
  for (const p of candidates) {
    let top, left;
    if (p === "bottom") { top = rect.bottom + margin; left = rect.left + rect.width / 2 - tw / 2; }
    else if (p === "top") { top = rect.top - th - margin; left = rect.left + rect.width / 2 - tw / 2; }
    else if (p === "right") { top = rect.top + rect.height / 2 - th / 2; left = rect.right + margin; }
    else { top = rect.top + rect.height / 2 - th / 2; left = rect.left - tw - margin; }
    // Clamp horizontally / vertically into viewport
    const clampedLeft = Math.max(12, Math.min(vw - tw - 12, left));
    const clampedTop = Math.max(12, Math.min(vh - th - 12, top));
    const fitsV = (p === "bottom" && top + th + 12 <= vh) || (p === "top" && top >= 12) || p === "left" || p === "right";
    const fitsH = (p === "left" && left >= 12) || (p === "right" && left + tw + 12 <= vw) || p === "top" || p === "bottom";
    if (fitsV && fitsH) {
      return { tooltipStyle: { top: clampedTop, left: clampedLeft }, finalPlacement: p };
    }
  }
  // Fallback: center on screen
  return { tooltipStyle: { top: vh / 2 - th / 2, left: vw / 2 - tw / 2 }, finalPlacement: "center" };
}

export default function Tour({ open, steps, darkMode, onClose, onComplete }) {
  const dv = darkMode ? PALETTE.dark : PALETTE.light;
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState(null);
  const tooltipRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  // Reset to first step whenever the tour reopens.
  useEffect(() => { if (open) setStepIdx(0); }, [open]);

  const step = open && steps[stepIdx] ? steps[stepIdx] : null;

  // Recompute positioning whenever the step (or window) changes.
  useLayoutEffect(() => {
    if (!open || !step) return;

    let raf = 0;
    const update = () => {
      const target = findTarget(step.selector);
      if (target) {
        const r = target.getBoundingClientRect();
        // Auto-scroll if the target is outside the viewport.
        const inView = r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth;
        if (!inView) {
          target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
          // Schedule another measurement after the smooth scroll completes-ish.
          raf = requestAnimationFrame(() => requestAnimationFrame(update));
        }
        setRect(r);
        const ttSize = tooltipRef.current
          ? { width: tooltipRef.current.offsetWidth, height: tooltipRef.current.offsetHeight }
          : { width: 320, height: 220 };
        const { tooltipStyle } = computeTooltip(r, step.placement || "bottom", ttSize);
        setTooltipPos(tooltipStyle);
      } else {
        setRect(null); // centered tooltip
      }
    };

    update();
    const onResize = () => update();
    const onScroll = () => update();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, step, stepIdx]);

  // Re-measure once the tooltip has actually rendered (so we know its real size).
  useLayoutEffect(() => {
    if (!open || !step || !rect || !tooltipRef.current) return;
    const ttSize = { width: tooltipRef.current.offsetWidth, height: tooltipRef.current.offsetHeight };
    const { tooltipStyle } = computeTooltip(rect, step.placement || "bottom", ttSize);
    setTooltipPos(tooltipStyle);
  }, [open, step, rect]);

  if (!open || !step) return null;

  const last = stepIdx === steps.length - 1;
  const goNext = () => {
    if (last) {
      onComplete?.();
      onClose?.();
    } else {
      setStepIdx(i => i + 1);
    }
  };
  const goBack = () => setStepIdx(i => Math.max(0, i - 1));
  const skip = () => onClose?.();

  // SVG mask creates the "spotlight" cutout around the target. Centered
  // tooltips skip the cutout and use a plain dimmer.
  const padding = 8;
  const cutout = rect ? {
    x: Math.max(0, rect.left - padding),
    y: Math.max(0, rect.top - padding),
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  } : null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, pointerEvents: "none" }}>
      {/* Backdrop with optional cutout */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "auto" }} onClick={skip}>
        <defs>
          <mask id="continuum-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {cutout && <rect x={cutout.x} y={cutout.y} width={cutout.width} height={cutout.height} rx="6" fill="black" />}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(15,13,15,0.72)" mask="url(#continuum-tour-mask)" />
        {/* Soft ring around the target */}
        {cutout && (
          <rect x={cutout.x - 1} y={cutout.y - 1} width={cutout.width + 2} height={cutout.height + 2}
            rx="7" fill="none" stroke={dv.accent} strokeWidth="2" opacity="0.85" pointerEvents="none" />
        )}
      </svg>

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        onClick={e => e.stopPropagation()}
        style={{
          position: "absolute",
          top: rect ? tooltipPos.top : "50%",
          left: rect ? tooltipPos.left : "50%",
          transform: rect ? "none" : "translate(-50%, -50%)",
          width: 360, maxWidth: "calc(100vw - 24px)",
          background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`,
          padding: "20px 22px 18px", boxShadow: "0 12px 36px rgba(15,13,15,0.35)",
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.accent }}>
            Welcome · {String(stepIdx + 1)} / {String(steps.length)}
          </span>
          <button onClick={skip} aria-label="Skip tour"
            style={{ background: "transparent", border: "none", color: dv.taupe, cursor: "pointer", padding: 0, display: "grid", placeItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, fontWeight: 400, letterSpacing: "-0.015em", color: dv.ink, margin: "0 0 8px" }}>
          {step.title}
        </h3>
        {step.preview && (
          <div style={{ margin: "12px 0 14px" }}>
            {step.preview(dv)}
          </div>
        )}
        <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, lineHeight: 1.55, margin: "0 0 18px" }}>
          {step.body}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <button onClick={skip}
            style={{ background: "none", border: "none", color: dv.taupe, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", padding: "6px 0" }}>
            Skip tour
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {stepIdx > 0 && (
              <button onClick={goBack}
                style={{ padding: "9px 16px", border: `1px solid ${dv.cream}`, background: "transparent", color: dv.taupe, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                Back
              </button>
            )}
            <button onClick={goNext}
              style={{ padding: "9px 18px", border: "none", background: dv.ink, color: dv.bone, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
              {last ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
