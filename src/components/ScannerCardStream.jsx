import React, { useRef, useEffect, useMemo } from "react";

// Faithful "card scanner": all linked programs stream right→left in one line; as
// each card crosses the vertical scanner beam it dissolves into ASCII + drifting
// particles (the bit left of the beam = scrambled, the bit right = the real card).
// Built with rAF + a 2D canvas (no Three.js — the reference's Three deps were
// heavy and its handlers were stubbed).

const ASCII = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789(){}[]<>;:,._-+=!@#$%^&*|/?~";
const genAscii = (w, h) => {
  let out = "";
  for (let r = 0; r < h; r++) {
    let line = "";
    for (let c = 0; c < w; c++) line += ASCII[(Math.random() * ASCII.length) | 0];
    out += line + "\n";
  }
  return out;
};
const darken = (hex, f = 0.5) => {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return hex || "#1d1b16";
  const r = Math.round(parseInt(h.slice(0, 2), 16) * (1 - f));
  const g = Math.round(parseInt(h.slice(2, 4), 16) * (1 - f));
  const b = Math.round(parseInt(h.slice(4, 6), 16) * (1 - f));
  return `rgb(${r},${g},${b})`;
};
const networkOf = (prog) => {
  const id = (prog.id || "").toLowerCase(), n = (prog.name || "").toLowerCase();
  if (id.startsWith("amex") || n.includes("amex") || n.includes("american express")) return "AMEX";
  if (id.includes("bilt")) return "MASTERCARD";
  return "VISA";
};

export default function ScannerCardStream({ programs, ProgramLogo, isMobile, D, speed = 70, onCardClick, cardIds, linkedAccounts }) {
  const CARD_W = isMobile ? 268 : 348;
  const CARD_H = isMobile ? 168 : 218;
  const GAP = isMobile ? 64 : 132;
  const H = CARD_H + (isMobile ? 34 : 52);

  const wrapRef = useRef(null);
  const lineRef = useRef(null);
  const canvasRef = useRef(null);

  // Repeat the program set enough times to fill the line for a seamless loop.
  const items = useMemo(() => {
    const list = programs || [];
    if (list.length === 0) return [];
    const setW = list.length * (CARD_W + GAP);
    const reps = Math.max(2, Math.ceil(2600 / setW) + 1);
    const cols = Math.max(6, Math.floor(CARD_W / 6.5));
    const rows = Math.max(8, Math.floor(CARD_H / 13));
    const out = [];
    for (let r = 0; r < reps; r++) {
      list.forEach((p, i) => out.push({ key: `${p.id}-${r}-${i}`, prog: p, ascii: genAscii(cols, rows) }));
    }
    return out;
  }, [programs, CARD_W, CARD_H, GAP]);

  const setW = (programs?.length || 0) * (CARD_W + GAP);

  useEffect(() => {
    const wrap = wrapRef.current, line = lineRef.current, canvas = canvasRef.current;
    if (!wrap || !line || !canvas || items.length === 0) return;
    const ctx = canvas.getContext("2d");
    let raf, last = performance.now();
    let pos = 0;
    let paused = false;
    const onEnter = () => { paused = true; };
    const onLeave = () => { paused = false; };
    wrap.addEventListener("mouseenter", onEnter);
    wrap.addEventListener("mouseleave", onLeave);

    const resize = () => {
      canvas.width = wrap.clientWidth;
      canvas.height = H;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = [];
    const spawn = (x) => particles.push({
      x, y: Math.random() * H, vx: -(Math.random() * 0.9 + 0.3), vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2.4 + 0.8, life: 1, decay: Math.random() * 0.012 + 0.004,
    });

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!paused) pos -= speed * dt;
      if (setW > 0 && pos <= -setW) pos += setW;
      line.style.transform = `translate(${pos}px, -50%)`; // keep vertical centering

      const wrapRect = wrap.getBoundingClientRect();
      const scannerX = wrapRect.left + wrapRect.width / 2;
      const sw = 7, sLeft = scannerX - sw / 2, sRight = scannerX + sw / 2;
      let scanning = 0;

      line.querySelectorAll(".sc-wrap").forEach((w) => {
        const rect = w.getBoundingClientRect();
        const normal = w.firstChild, ascii = w.lastChild;
        if (rect.right < sLeft) { // fully past the beam → all ASCII
          normal.style.clipPath = "inset(0 0 0 100%)";
          ascii.style.clipPath = "inset(0 0 0 0)";
        } else if (rect.left > sRight) { // not reached → full card
          normal.style.clipPath = "inset(0 0 0 0)";
          ascii.style.clipPath = "inset(0 100% 0 0)";
        } else { // straddling the beam
          scanning++;
          const iLeft = Math.max(sLeft - rect.left, 0);
          const iRight = Math.min(sRight - rect.left, rect.width);
          normal.style.clipPath = `inset(0 0 0 ${(iLeft / rect.width) * 100}%)`;
          ascii.style.clipPath = `inset(0 ${100 - (iRight / rect.width) * 100}% 0 0)`;
        }
      });

      // Particles emit at the beam, drift left, fade.
      const localX = wrapRect.width / 2;
      const emit = scanning > 0 ? 4 : 1;
      for (let i = 0; i < emit; i++) spawn(localX + (Math.random() - 0.5) * 4);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.shadowBlur = 6;
      ctx.shadowColor = D ? "rgba(180,180,210,0.5)" : "rgba(40,40,70,0.35)";
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        if (p.life <= 0 || p.x < -10) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.life) * (D ? 0.5 : 0.4);
        ctx.fillStyle = D ? "#cfd2e6" : "#23233a";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      if (particles.length > 360) particles.splice(0, particles.length - 360);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      wrap.removeEventListener("mouseenter", onEnter);
      wrap.removeEventListener("mouseleave", onLeave);
    };
  }, [items, setW, speed, H, D]);

  if (!programs || programs.length === 0) return null;

  const CardArt = ({ prog }) => {
    const base = prog.color || "#2C2A26";
    const acc = prog.accent || base;
    const isCard = cardIds ? cardIds.has(prog.id) : false;
    const tier = linkedAccounts?.[prog.id]?.currentTier;
    // Credit cards show a card number + network; status programs show the tier.
    const bigLine = isCard ? "1234 5678 9000 0000" : (tier ? tier.toUpperCase() : "MEMBER");
    const corner = isCard ? networkOf(prog) : (tier ? "STATUS" : "");
    return (
      <div style={{ width: "100%", height: "100%", borderRadius: 16, overflow: "hidden", position: "relative", color: "#fff", background: `linear-gradient(135deg, ${base} 0%, ${darken(base, 0.3)} 100%)`, boxShadow: "0 16px 40px rgba(0,0,0,0.30)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: isMobile ? 16 : 20, boxSizing: "border-box" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(130% 100% at 82% -12%, ${acc}66, transparent 58%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "62%", background: "linear-gradient(to top, rgba(0,0,0,0.46), transparent)", pointerEvents: "none" }} />
        {/* top: logo + corner label */}
        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <span style={{ width: 44, height: 44, borderRadius: 10, background: "#fff", display: "grid", placeItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.22)", flexShrink: 0 }}>
            <ProgramLogo prog={prog} size={28} />
          </span>
          {corner && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.85)", marginTop: 5 }}>{corner}</span>}
        </div>
        {/* chip (credit cards only) */}
        {isCard ? (
          <div style={{ position: "relative", width: 42, height: 30, borderRadius: 6, background: "linear-gradient(135deg,#E8C97A,#B8924A)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.18)" }} />
        ) : <div style={{ position: "relative", height: 1 }} />}
        {/* bottom: tier/number + name */}
        <div style={{ position: "relative" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: isCard ? (isMobile ? 13 : 16) : (isMobile ? 13 : 15), letterSpacing: isCard ? "0.14em" : "0.16em", color: "rgba(255,255,255,0.96)", textShadow: "0 1px 6px rgba(0,0,0,0.5)", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bigLine}</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: isMobile ? 17 : 20, fontWeight: 500, lineHeight: 1.1, color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prog.name}</div>
        </div>
      </div>
    );
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", height: H, overflow: "hidden", marginBottom: 24 }}>
      {/* particle canvas */}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: H, zIndex: 1, pointerEvents: "none" }} />
      {/* scanner beam */}
      <div style={{ position: "absolute", top: "8%", bottom: "8%", left: "50%", width: 2, transform: "translateX(-50%)", zIndex: 3, pointerEvents: "none", borderRadius: 4, background: "linear-gradient(to bottom, transparent, #8b5cf6, transparent)", boxShadow: "0 0 10px #a78bfa, 0 0 22px #8b5cf6, 0 0 40px #6366f1" }} />
      {/* card line */}
      <div ref={lineRef} style={{ position: "absolute", top: "50%", left: 0, transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: GAP, height: CARD_H, willChange: "transform", zIndex: 2 }}>
        {items.map((it) => (
          <div key={it.key} className="sc-wrap" onClick={() => onCardClick && onCardClick(it.prog)} style={{ position: "relative", width: CARD_W, height: CARD_H, flexShrink: 0, cursor: onCardClick ? "pointer" : "default" }}>
            <div style={{ position: "absolute", inset: 0, zIndex: 2, clipPath: "inset(0 0 0 0)" }}>
              <CardArt prog={it.prog} />
            </div>
            <div style={{ position: "absolute", inset: 0, zIndex: 1, clipPath: "inset(0 100% 0 0)", overflow: "hidden" }}>
              <pre style={{ margin: 0, padding: 0, width: "100%", height: "100%", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, lineHeight: "12px", color: D ? "rgba(190,195,225,0.32)" : "rgba(70,72,100,0.3)", whiteSpace: "pre", overflow: "hidden", WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.12) 100%)", maskImage: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.12) 100%)" }}>{it.ascii}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
