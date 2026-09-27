import React, { useState, useEffect, useRef } from "react";

// Accordion-style selector for trips. Each trip is a full-width band: the active
// one expands into a tall photo card with its details, the rest collapse to slim
// rows showing the date and name. Clicking a collapsed row activates it; clicking
// the active panel opens the trip.
//
// This was originally a horizontal strip of narrow slivers with the labels set in
// vertical writing mode. Trip names here run long ("[Christine] November ICA
// Business Trip"), and rotated text is slow to read at any length — so the
// accordion now stacks downward, which gives every label the full width of the
// page to sit on and keeps the type horizontal.

export default function TripSelector({ trips, css, dv, isMobile, D, photoFor, formatTripDates, SegIcon, onOpenTrip, openEditTrip, removeTrip }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [shown, setShown] = useState([]);
  const scrollerRef = useRef(null);

  useEffect(() => {
    const timers = trips.map((_, i) => setTimeout(() => setShown(prev => prev.includes(i) ? prev : [...prev, i]), 120 * i));
    return () => timers.forEach(clearTimeout);
  }, [trips.length]);

  // Keep the expanded panel in view when it changes.
  useEffect(() => {
    const el = scrollerRef.current?.children?.[activeIndex];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
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

  const activeH = isMobile ? 380 : 440;
  const rowH = isMobile ? 62 : 70;
  const padX = isMobile ? 18 : 26;

  return (
    <div ref={scrollerRef} style={{ display: "flex", flexDirection: "column", width: "100%", gap: 6, marginBottom: 8 }}>
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
              width: "100%",
              height: active ? activeH : rowH,
              flexShrink: 0,
              borderRadius: 14,
              border: `1px solid ${active ? css.accent : dv.cream}`,
              backgroundColor: "#18181b",
              backgroundImage: `url('${img}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              boxShadow: active ? "0 18px 50px rgba(0,0,0,0.35)" : "0 8px 22px rgba(0,0,0,0.22)",
              opacity: shown.includes(index) ? 1 : 0,
              transform: shown.includes(index) ? "translateY(0)" : "translateY(-12px)",
              transition: "height 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease, transform 0.5s ease, border-color 0.4s ease, box-shadow 0.4s ease",
            }}
          >
            {/* Legibility gradient — bottom-up on the open card, left-to-right on a
                collapsed row where the type sits along the leading edge. */}
            <div style={{ position: "absolute", inset: 0, background: active
              ? "linear-gradient(to top, rgba(10,9,7,0.86) 0%, rgba(10,9,7,0.35) 38%, rgba(10,9,7,0) 64%)"
              : "linear-gradient(to right, rgba(10,9,7,0.82) 0%, rgba(10,9,7,0.55) 55%, rgba(10,9,7,0.30) 100%)",
              transition: "background 0.5s ease", pointerEvents: "none" }} />

            {/* Collapsed row — date + name, reading straight across */}
            {!active && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: isMobile ? 12 : 16, padding: `0 ${padX}px` }}>
                {m.shortDate && (
                  <span style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.16em", color: "rgba(255,255,255,0.78)", flex: "none", width: isMobile ? 52 : 58 }}>
                    {m.shortDate}
                  </span>
                )}
                <span style={{
                  fontFamily: dv.serif, fontSize: isMobile ? 16 : 19, fontWeight: 500, color: "#fff",
                  textShadow: "0 1px 8px rgba(0,0,0,0.55)", lineHeight: 1.2,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0,
                }}>{m.name}</span>
                {m.countLine && !isMobile && (
                  <span style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", color: "rgba(255,255,255,0.7)", flex: "none", whiteSpace: "nowrap" }}>
                    {m.countLine}
                  </span>
                )}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
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
              <div style={{ position: "absolute", left: padX, right: padX, bottom: 26, pointerEvents: "none" }}>
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
