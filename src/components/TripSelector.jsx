import React, { useState, useEffect } from "react";

// Grid of trip cards. Each trip is a small photo tile carrying its date and name,
// laid out in reading order — left to right, then down — so the sequence the
// caller passes in (upcoming soonest-first, past most-recent-first) reads
// chronologically down the page. Clicking a card opens the trip.
//
// This began as a horizontal accordion of narrow slivers with the labels set in
// vertical writing mode, then a stack of full-width bands. Both spent a lot of
// height on one trip at a time; the grid trades the large hero image for seeing
// every trip at once without scrolling.

export default function TripSelector({ trips, css, dv, isMobile, D, photoFor, formatTripDates, SegIcon, onOpenTrip, openEditTrip, removeTrip }) {
  const [shown, setShown] = useState([]);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const timers = trips.map((_, i) => setTimeout(() => setShown(prev => prev.includes(i) ? prev : [...prev, i]), 45 * i));
    return () => timers.forEach(clearTimeout);
  }, [trips.length]);

  if (!trips || trips.length === 0) return null;

  const meta = (trip) => {
    const segs = (trip.segments || []).filter(s => !s._isMeta);
    const flights = segs.filter(s => s.type === "flight").length;
    const hotels = segs.filter(s => s.type === "hotel" || s.type === "accommodation").length;
    const name = trip.tripName || trip.trip_name || trip.location || "Trip";
    const shortDate = trip.date
      ? new Date(trip.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()
      : "";
    const countLine = [flights ? `${flights} flight${flights > 1 ? "s" : ""}` : "", hotels ? `${hotels} hotel${hotels > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · ");
    return { name, shortDate, countLine };
  };

  const cardH = isMobile ? 118 : 136;
  const glassBtn = {
    width: 26, height: 26, borderRadius: 8,
    background: "rgba(20,20,20,0.48)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.28)", color: "#fff",
    display: "grid", placeItems: "center", cursor: "pointer", padding: 0,
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fill, minmax(210px, 1fr))",
      gap: isMobile ? 8 : 10,
      marginBottom: 8,
    }}>
      {trips.map((trip, index) => {
        const m = meta(trip);
        const img = photoFor(trip);
        const isHover = hovered === index;
        // Controls sit on the card itself; on touch there's no hover, so they stay put.
        const showControls = isMobile || isHover;
        return (
          <div
            key={trip.id || index}
            onClick={() => onOpenTrip?.(trip)}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            title={`${m.name}${m.countLine ? ` — ${m.countLine}` : ""}`}
            style={{
              position: "relative", overflow: "hidden", cursor: "pointer",
              height: cardH, borderRadius: 12,
              border: `1px solid ${isHover ? css.accent : dv.cream}`,
              backgroundColor: "#18181b",
              backgroundImage: `url('${img}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              boxShadow: isHover ? "0 12px 28px rgba(0,0,0,0.30)" : "0 6px 16px rgba(0,0,0,0.18)",
              opacity: shown.includes(index) ? 1 : 0,
              transform: shown.includes(index) ? (isHover ? "translateY(-2px)" : "translateY(0)") : "translateY(-8px)",
              transition: "opacity 0.4s ease, transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
            }}
          >
            {/* Legibility gradient */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(to top, rgba(10,9,7,0.88) 0%, rgba(10,9,7,0.55) 42%, rgba(10,9,7,0.12) 78%, rgba(10,9,7,0.05) 100%)" }} />

            {/* Edit / delete */}
            <div style={{
              position: "absolute", top: 8, right: 8, display: "flex", gap: 6,
              opacity: showControls ? 1 : 0, transition: "opacity 0.2s ease",
              pointerEvents: showControls ? "auto" : "none",
            }}>
              {(!trip._shared || trip._permission === "edit") && openEditTrip && (
                <button onClick={e => { e.stopPropagation(); openEditTrip(trip); }} title="Edit trip" style={glassBtn}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                </button>
              )}
              {removeTrip && (
                <button onClick={e => { e.stopPropagation(); removeTrip(trip); }} title={trip._shared ? "Remove shared trip" : "Delete trip"} style={glassBtn}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              )}
            </div>

            {/* Shared marker */}
            {trip._shared && (
              <span style={{
                position: "absolute", top: 10, left: 12, fontFamily: dv.mono, fontSize: 8.5,
                letterSpacing: "0.14em", textTransform: "uppercase", color: "#9ec5ff",
                textShadow: "0 1px 6px rgba(0,0,0,0.6)",
              }}>Shared</span>
            )}

            {/* Date · name · counts */}
            <div style={{ position: "absolute", left: 12, right: 12, bottom: 11 }}>
              {m.shortDate && (
                <div style={{ fontFamily: dv.mono, fontSize: 9, letterSpacing: "0.16em", color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>
                  {m.shortDate}
                </div>
              )}
              <div style={{
                fontFamily: dv.serif, fontSize: isMobile ? 14 : 16, fontWeight: 500, color: "#fff",
                lineHeight: 1.22, letterSpacing: "-0.01em", textShadow: "0 1px 8px rgba(0,0,0,0.6)",
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>{m.name}</div>
              {m.countLine && (
                <div style={{ fontFamily: dv.mono, fontSize: 9, letterSpacing: "0.06em", color: "rgba(255,255,255,0.68)", marginTop: 4 }}>
                  {m.countLine}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
