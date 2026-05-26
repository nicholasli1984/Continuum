import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Compact animated search (adapted from the GooeySearchBar reference to the repo's
// JSX + inline styles + framer-motion). A pill that expands into an input on click,
// drives the live trip filter, and shows matching trips in a dropdown.

export default function TripSearchBar({ css, dv, isMobile, trips, value, onChange, onSelect }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target) && !value) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [value]);

  const q = (value || "").trim().toLowerCase();
  const matches = q
    ? (trips || []).filter(t => `${t.tripName || t.trip_name || ""} ${t.location || ""} ${t.confirmationCode || t.confirmation_code || ""}`.toLowerCase().includes(q)).slice(0, 6)
    : [];

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <motion.div
        animate={{ width: open ? (isMobile ? 210 : 280) : 118 }}
        transition={{ type: "spring", bounce: 0.18, duration: 0.55 }}
        onClick={() => !open && setOpen(true)}
        style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 14px", borderRadius: 100, border: `1px solid ${dv.cream}`, background: dv.paper, cursor: open ? "text" : "pointer", overflow: "hidden" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={open ? css.accent : dv.taupe} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        {open ? (
          <input ref={inputRef} value={value} onChange={e => onChange(e.target.value)} placeholder="Search trips, cities, refs…"
            style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", color: css.text, fontFamily: dv.mono, fontSize: 12, letterSpacing: "0.03em" }} />
        ) : (
          <span style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text }}>Search</span>
        )}
        {open && value && (
          <button onClick={e => { e.stopPropagation(); onChange(""); inputRef.current?.focus(); }} style={{ border: "none", background: "transparent", color: dv.taupe, cursor: "pointer", padding: 0, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        )}
      </motion.div>
      <AnimatePresence>
        {open && matches.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
            style={{ position: "absolute", top: 48, right: 0, width: isMobile ? 250 : 320, maxHeight: 300, overflowY: "auto", background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`, borderRadius: 14, boxShadow: "0 16px 44px rgba(0,0,0,0.25)", zIndex: 60, padding: 6 }}>
            {matches.map(t => (
              <button key={t.id} onClick={() => { onSelect?.(t); setOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 11px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={e => e.currentTarget.style.background = dv.paper} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ fontFamily: dv.serif, fontSize: 14, color: css.text }}>{t.tripName || t.trip_name || t.location || "Trip"}</div>
                <div style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, marginTop: 2 }}>{[t.location, t.date].filter(Boolean).join(" · ")}</div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
