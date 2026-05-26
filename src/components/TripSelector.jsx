import React, { useState, useEffect, useRef } from "react";

// Accordion-style selector for upcoming trips (adapted from the InteractiveSelector
// reference). Each future trip is a panel: the active one expands to show details,
// the rest collapse to thin slivers with the trip's date + name as vertical text.
// Clicking a sliver activates it; clicking the active panel opens the trip.

export default function TripSelector({ trips, css, dv, isMobile, D, photoFor, formatTripDates, SegIcon, onOpenTrip, openEditTrip, removeTrip }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [shown, setShown] = useState([]);
  const scrollerRef = useRef(null);

  useEffect(() => {
    const timers = trips.map((_, i) => setTimeout(() => setShown(prev => prev.includes(i) ? prev : [...prev, i]), 120 * i));
    return () => timers.forEach(clearTimeout);
  }, [trips.length]);

  // Keep the expanded panel in view when it changes (the strip scrolls horizontally).
  useEffect(() => {
    const el = scrollerRef.current?.children?.[activeIndex];
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeIndex]);

  if (!trips || trips.length === 0) return null;

  const meta = (trip) => {
    const segs = (trip.segments || []).filter(s => !s._isMeta);
    const flights = segs.filter(s => s.type === "flight").length;
    const hotels = segs.filter(s => s.type === "hotel" || s.type === "accommodation").length;
    const iconType = flights ? "flight" : hotels ? "hotel" : "pin";
    const name = trip.tripName || trip.trip_name || trip.location || "Trip";
    const ref = trip.confirmationCode || trip.confirmation_code || segs.map(s => s.confirmationCode).filter(Boolean)[0] || "";
    const shortDate = trip.date ? new Date(trip.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase() : "";
    const countLine = [flights ? `${flights} flight${flights > 1 ? "s" : ""}` : "", hotels ? `${hotels} hotel${hotels > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · ");
    return { iconType, name, ref, shortDate, countLine, flights, hotels };
  };

  const H = isMobile ? 380 : 460;
  // Fixed widths + horizontal scroll so the active panel always has room — with
  // many trips the strip simply scrolls instead of crushing everything on screen.
  const activeW = isMobile ? "min(82vw, 360px)" : 400;
  const sliverW = isMobile ? 52 : 62;

  return (
    <div ref={scrollerRef} className="trip-accordion" style={{ display: "flex", width: "100%", height: H, gap: 6, overflowX: "auto", overflowY: "hidden", marginBottom: 8, scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
      <style>{`.trip-accordion::-webkit-scrollbar{display:none}`}</style>
      {trips.map((trip, index) => {
        const active = index === activeIndex;
        const m = meta(trip);
        const img = photoFor(trip);
        return (
          <div
            key={trip.id || index}
            onClick={() => { if (index !== activeIndex) setActiveIndex(index); else onOpenTrip?.(trip); }}
            title={active ? "Open trip" : m.name}
            style={{
              position: "relative", overflow: "hidden", cursor: "pointer",
              flexShrink: 0,
              width: active ? activeW : sliverW,
              borderRadius: 14,
              border: `1px solid ${active ? css.accent : dv.cream}`,
              backgroundColor: "#18181b",
              backgroundImage: `url('${img}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              boxShadow: active ? "0 18px 50px rgba(0,0,0,0.35)" : "0 8px 22px rgba(0,0,0,0.22)",
              opacity: shown.includes(index) ? 1 : 0,
              transform: shown.includes(index) ? "translateX(0)" : "translateX(-40px)",
              transition: "width 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease, transform 0.5s ease, border-color 0.4s ease, box-shadow 0.4s ease",
            }}
          >
            {/* Legibility gradient */}
            <div style={{ position: "absolute", inset: 0, background: active
              ? "linear-gradient(to top, rgba(10,9,7,0.86) 0%, rgba(10,9,7,0.35) 38%, rgba(10,9,7,0) 64%)"
              : "linear-gradient(to top, rgba(10,9,7,0.72) 0%, rgba(10,9,7,0.18) 55%, rgba(10,9,7,0.28) 100%)",
              transition: "background 0.5s ease", pointerEvents: "none" }} />

            {/* Collapsed sliver — vertical date + name */}
            {!active && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
                <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", display: "flex", alignItems: "center", gap: 14, maxHeight: "100%", overflow: "hidden" }}>
                  {m.shortDate && <span style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.18em", color: "rgba(255,255,255,0.78)" }}>{m.shortDate}</span>}
                  <span style={{ fontFamily: dv.serif, fontSize: isMobile ? 15 : 17, fontWeight: 500, color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,0.55)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</span>
                </div>
              </div>
            )}

            {/* Edit / delete — glass buttons on the active panel (top-right) */}
            {active && (
              <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 8 }}>
                {(!trip._shared || trip._permission === "edit") && openEditTrip && (
                  <button onClick={e => { e.stopPropagation(); openEditTrip(trip); }} title="Edit trip"
                    style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(20,20,20,0.42)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.28)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                  </button>
                )}
                {removeTrip && (
                  <button onClick={e => { e.stopPropagation(); removeTrip(trip); }} title={trip._shared ? "Remove shared trip" : "Delete trip"}
                    style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(20,20,20,0.42)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.28)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                )}
              </div>
            )}

            {/* Active panel — details */}
            {active && (
              <div style={{ position: "absolute", left: isMobile ? 18 : 26, right: isMobile ? 18 : 26, bottom: 26, pointerEvents: "none" }}>
                <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.82)", marginBottom: 8 }}>{formatTripDates(trip)}</div>
                <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 26 : 34, fontWeight: 400, letterSpacing: "-0.02em", color: "#fff", lineHeight: 1.05, textShadow: "0 2px 14px rgba(0,0,0,0.5)" }}>{m.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 10, fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.05em", color: "rgba(255,255,255,0.88)" }}>
                  {trip.location && <span>{trip.location}</span>}
                  {m.countLine && <><span style={{ opacity: 0.5 }}>·</span><span>{m.countLine}</span></>}
                  {m.ref && <><span style={{ opacity: 0.5 }}>·</span><span>Ref {m.ref}</span></>}
                  {trip._shared && <><span style={{ opacity: 0.5 }}>·</span><span style={{ color: "#9ec5ff" }}>Shared</span></>}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 16, padding: "8px 14px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.08)", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff" }}>
                  Open trip
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
