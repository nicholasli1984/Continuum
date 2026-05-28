import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "../utils/apiBase";

// "Ask Continuum" — a horizontal search bar that sits as the top row of the
// bottom navigation, so it visually replaces the line between the main content
// area and the nav tabs. Calls /api/ask (Claude Haiku) with a compact trip
// summary for context; the answer surfaces in a card that floats up from the
// bar over the main content.
export default function AskContinuumPill({ css, dv, isMobile, trips, rightSlot = null }) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const inputRef = useRef(null);

  // Dismiss the answer panel on Escape.
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setShowAnswer(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const submit = async (e) => {
    e?.preventDefault?.();
    const query = q.trim();
    if (!query || loading) return;
    setLoading(true); setErr(""); setAnswer(""); setShowAnswer(true);
    try {
      const ctx = (trips || []).slice(0, 12).map(t => {
        const ts = t.date || (t.segments || []).map(s => s.date).filter(Boolean).sort()[0] || "";
        const loc = t.location || t.tripName || t.trip_name || "";
        return ts || loc ? `- ${ts || "TBD"} ${loc}`.trim() : "";
      }).filter(Boolean).join("\n");
      const res = await apiFetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, context: ctx }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't reach the assistant.");
      setAnswer(data.answer || "");
    } catch (e2) {
      setErr(e2.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const dismiss = () => { setShowAnswer(false); setAnswer(""); setErr(""); setQ(""); };

  // Theme tokens with safe fallbacks.
  const surface = dv?.paper || css.surface || "#fff";
  const border = dv?.cream || css.border || "rgba(0,0,0,0.08)";
  const ink = dv?.ink || css.text || "#15130F";
  const muted = dv?.taupe || css.text3 || "#6B6458";

  return (
    <div style={{
      position: "relative",
      // No border-bottom — visually blends into the nav as one continuous surface.
      background: "transparent",
    }}>
      {/* Answer panel — floats up over the main content area when open. */}
      <AnimatePresence>
        {showAnswer && (answer || err || loading) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22 }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: isMobile ? 12 : "50%",
              right: isMobile ? 12 : "auto",
              transform: isMobile ? "none" : "translateX(-50%)",
              width: isMobile ? "auto" : "min(640px, calc(100vw - 80px))",
              maxHeight: 360,
              overflowY: "auto",
              background: surface,
              border: `1px solid ${border}`,
              borderRadius: 16,
              boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
              padding: isMobile ? 14 : 18,
              zIndex: 200,
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: css.accent }}>
                {loading ? "Thinking…" : err ? "Couldn't ask" : "Answer"}
              </div>
              <button onClick={dismiss} aria-label="Dismiss"
                style={{ border: "none", background: "transparent", color: muted, cursor: "pointer", padding: 4, display: "grid", placeItems: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {loading && !answer && !err ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 14, color: muted }}>
                <span style={{
                  width: 14, height: 14, borderRadius: 999,
                  border: `2px solid ${border}`, borderTopColor: css.accent,
                  animation: "askcontinuum-spin 0.7s linear infinite",
                }} />
                One moment.
              </div>
            ) : (
              <p style={{
                margin: 0,
                fontFamily: err ? "'Fraunces', serif" : "'Inter Tight', sans-serif",
                fontStyle: err ? "italic" : "normal",
                fontSize: 14, lineHeight: 1.55,
                color: err ? muted : ink,
                whiteSpace: "pre-wrap",
              }}>
                {err || answer}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The bar itself */}
      <form onSubmit={submit}
        style={{
          maxWidth: 2200, margin: "0 auto",
          padding: isMobile ? "8px 12px" : "10px 48px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
        <div style={{
          flex: 1, minWidth: 0,
          display: "flex", alignItems: "center", gap: 10,
          height: isMobile ? 40 : 42,
          padding: "0 16px",
          borderRadius: 100,
          border: `1px solid ${border}`,
          background: surface,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder={isMobile ? "Ask Continuum…" : "Ask Continuum about your trips, lounges, points, packing…"}
            disabled={loading}
            style={{
              flex: 1, minWidth: 0,
              border: "none", outline: "none", background: "transparent",
              color: ink,
              fontFamily: "'Inter Tight', sans-serif", fontSize: isMobile ? 13 : 14,
            }} />
          {q && !loading && (
            <button type="button" onClick={() => { setQ(""); inputRef.current?.focus(); }}
              aria-label="Clear"
              style={{ border: "none", background: "transparent", color: muted, cursor: "pointer", padding: 0, display: "grid", placeItems: "center", flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
        {!isMobile && (
          <button type="submit" disabled={!q.trim() || loading}
            style={{
              border: "none", outline: "none",
              cursor: q.trim() && !loading ? "pointer" : "default",
              background: q.trim() && !loading ? (css.text || "#15130F") : (border),
              color: q.trim() && !loading ? (dv?.bone || "#fff") : muted,
              borderRadius: 100,
              padding: "10px 22px",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
              transition: "background 0.18s",
              height: 42, flexShrink: 0,
            }}>
            {loading ? "Asking" : "Ask"}
          </button>
        )}
        {rightSlot}
      </form>

      <style>{`@keyframes askcontinuum-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
