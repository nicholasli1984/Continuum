import React from "react";
import { LANDMARK_FALLBACK_PHOTOS } from "../constants/airline-data";
import { LOUNGE_DATABASE, AMENITY_ICONS, AMENITY_LABELS } from "../constants/lounges";

export function renderTrips(s) {
  const {
    css, isMobile, user, trips, expenses, sharedTrips, linkedAccounts, allPrograms,
    darkMode, tripDetailId, setTripDetailId, setTripDetailSegIdx,
    expenseViewTrip, setExpenseViewTrip, expandedCardId, setExpandedCardId,
    calendarPopover, setCalendarPopover,
    setShowAddExpense, setNewExpense, setEditExpenseId, setShowAddSegment, setShowCreateTrip,
    setShowExpenseReport, setShowShareModal, setShareEmail, setShareStatus, setSharePermission,
    openEditTrip, removeTrip, removeExpense, editSegment, deleteSegment, showConfirm,
    getTripExpenses, getTripTotal, getTripName, formatTripDates,
    getTripGoogleCalUrl, getTripOutlookUrl, downloadTripICS,
    EXPENSE_CATEGORIES, SegIcon, segTypeInfo, segTime, segTitle, segSubtitle, segLocation,
    getFlightLiveStatus, weatherCache, tempUnit, setTempUnit,
    checkVisa, visaCache, visaLoading, packingLists, savePackingLists,
    packExpanded, setPackExpanded, customPackItems, setCustomPackItems, getPackingItems,
    lastDateRef, settingsForm, BLANK_EXPENSE,
    searchQuery, setSearchQuery, filterStatus, setFilterStatus, tripsView, setTripsView,
    pastTripsExpanded, setPastTripsExpanded, hotelSectionOpen, setHotelSectionOpen,
    tripSummaryId, setTripSummaryId, showImportItinerary, setShowImportItinerary,
    cropExpenseId, setCropExpenseId, cropRect, setCropRect, cropStartRef, cropEndRef,
    setViewExpenseId, setActiveView,
    AIRPORT_CITY, AIRLINE_CS, HOTEL_CS, OTA_CS,
    calViewMonth, setCalViewMonth,
    layoverMap, flightType, setFlightType,
    generateFlightyICS, togglePackItem,
  } = s;
  const D = darkMode;
    const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);

    // ── Trip Detail View — Full-screen timeline layout ──
    if (tripDetailId) {
      const trip = [...trips, ...sharedTrips].find(t => t.id === tripDetailId);
      if (!trip) return null;
      const isShared = !!trip._shared;
      const isReadOnly = isShared && trip._permission !== "edit";
      const canEdit = !isShared || trip._permission === "edit";
      const prog = allPrograms.find(p => p.id === trip.program);
      const sColor = trip.status === "confirmed" ? css.success : trip.status === "planned" ? css.warning : css.accent;
      const sBg = trip.status === "confirmed" ? css.successBg : trip.status === "planned" ? css.warningBg : css.accentBg;
      const tripExps = expenses.filter(e => e.tripId === trip.id);
      const tripTotal = tripExps.reduce((s, e) => s + e.amount, 0);
      const csInfo = trip.bookingSource || trip.airlineCS || (AIRLINE_CS[trip.program] ? { ...AIRLINE_CS[trip.program], type: "airline" } : null);
      const manageUrl = trip.bookingSource?.manage || trip.airlineCS?.manage || AIRLINE_CS[trip.program]?.manage || null;

      // Group segments by date for day-by-day timeline
      const realSegs = (trip.segments || []).filter(s => !s._isMeta);
      const segsByDate = {};
      realSegs.forEach(seg => {
        const d = seg.date || "undated";
        if (!segsByDate[d]) segsByDate[d] = [];
        segsByDate[d].push(seg);
      });
      // Sort each day's segments by time
      Object.values(segsByDate).forEach(segs => segs.sort((a, b) => (a.departureTime || a.startTime || a.time || a.checkinTime || a.pickupTime || "99:99").localeCompare(b.departureTime || b.startTime || b.time || b.checkinTime || b.pickupTime || "99:99")));
      const sortedDates = Object.keys(segsByDate).sort();
      const tripStartDate = trip.date || sortedDates[0] || "";

      // Segment type styling
      const segTypeInfo = (type) => {
        const map = { flight: { color: "#3b82f6", label: "Flight" }, hotel: { color: "#8b5cf6", label: "Hotel" }, accommodation: { color: "#8b5cf6", label: "Accommodation" }, activity: { color: "#22c55e", label: "Activity" }, train: { color: "#f59e0b", label: "Train" }, rental: { color: "#ef4444", label: "Rental Car" }, cruise: { color: "#06b6d4", label: "Cruise" }, ferry: { color: "#0ea5e9", label: "Ferry" }, restaurant: { color: "#f97316", label: "Restaurant" }, transfer: { color: "#a855f7", label: "Transfer" }, lounge: { color: "#c9a84c", label: "Lounge" } };
        return map[type] || { color: css.accent, label: type || "Item" };
      };

      // Get the main display info for a segment
      const segTitle = (s) => s.property || s.activityName || s.restaurantName || s.loungeName || s.flightNumber || s.trainNumber || s.cruiseLine || s.operator || s.company || s.provider || s.route || s.location || segTypeInfo(s.type).label;
      const segSubtitle = (s) => {
        if (s.type === "flight") return [s.route, s.fareClass === "business_first" ? "Business" : s.fareClass === "premium_economy" ? "Premium" : s.fareClass === "economy" ? "Economy" : "", s.seat ? `Seat ${s.seat}` : ""].filter(Boolean).join(" · ");
        if (s.type === "hotel" || s.type === "accommodation") return [s.location, s.roomType, s.nights ? `${s.nights} night${s.nights > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · ");
        if (s.type === "restaurant") return [s.location, s.cuisine, s.partySize ? `Party of ${s.partySize}` : ""].filter(Boolean).join(" · ");
        if (s.type === "train") return [s.departureStation && s.arrivalStation ? `${s.departureStation} → ${s.arrivalStation}` : "", s.fareClass].filter(Boolean).join(" · ");
        if (s.type === "rental") return [s.pickupLocation, s.vehicleType].filter(Boolean).join(" · ");
        if (s.type === "transfer") return [s.pickupLocation, s.dropoffLocation].filter(Boolean).join(" → ");
        if (s.type === "lounge") return [s.airport, s.terminal, s.accessMethod].filter(Boolean).join(" · ");
        if (s.type === "cruise") return [s.shipName, s.cabinType].filter(Boolean).join(" · ");
        if (s.type === "ferry") return [s.departurePort, s.arrivalPort].filter(Boolean).join(" → ");
        return s.location || s.notes || "";
      };
      const segTime = (s) => s.departureTime || s.startTime || s.time || s.checkinTime || s.pickupTime || "";
      // Get the location string from a segment for Google Maps linking
      const segLocation = (s) => s.location || s.pickupLocation || s.airport || s.departureStation || s.departurePort || "";
      const mapsUrl = (loc) => loc ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}` : null;
      const LocationLink = ({ location, children }) => {
        if (!location) return children || null;
        return <a href={mapsUrl(location)} target="_blank" rel="noopener noreferrer" style={{ color: css.accent, textDecoration: "none", borderBottom: `1px dashed ${css.accent}40`, transition: "border-color 0.12s" }} onMouseEnter={e => e.currentTarget.style.borderColor = css.accent} onMouseLeave={e => e.currentTarget.style.borderColor = `${css.accent}40`}>{children || location}</a>;
      };

      const DetailRow = ({ label, value, mono, accent, link }) => {
        if (!value) return null;
        return (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${css.border}` }}>
            <span style={{ fontSize: 12, color: css.text3, fontWeight: 500 }}>{label}</span>
            {link ? (
              <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: css.accent, textDecoration: "none", fontFamily: mono ? "'Geist Mono', monospace" : "inherit" }}>{value} ↗</a>
            ) : (
              <span style={{ fontSize: 13, fontWeight: 600, color: accent ? css.accent : css.text, fontFamily: mono ? "'Geist Mono', monospace" : "inherit" }}>{value}</span>
            )}
          </div>
        );
      };

      return (
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {/* Back button */}
          <button onClick={() => setTripDetailId(null)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 0", marginBottom: 16,
            background: "none", border: "none", color: css.accent, cursor: "pointer", fontSize: 13, fontWeight: 700,
          }}>
            <span style={{ fontSize: 16 }}>←</span> Back to Trips
          </button>

          {/* Trip header card */}
          <div style={{
            background: css.surface, border: `1px solid ${css.border}`, borderRadius: 0, padding: "24px 28px", marginBottom: 20,
            borderLeft: `3px solid ${css.accent}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div>
                {trip.tripName && <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: css.accent, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.tripName}</div>}
                <div style={{ fontSize: 22, fontWeight: 800, color: css.text, fontFamily: "'Instrument Sans', sans-serif", letterSpacing: "-0.02em" }}>{trip.location || trip.route || "Trip"}</div>
                <div style={{ fontSize: 12, color: css.text3, marginTop: 6, fontFamily: "'Geist Mono', monospace" }}>
                  {formatTripDates(trip)}{trip.location && trip.route ? ` · ${trip.route}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {trip.estimatedPoints > 0 && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: css.gold, fontFamily: "'Geist Mono', monospace" }}>+{trip.estimatedPoints.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: css.text3 }}>est. points</div>
                  </div>
                )}
                <span style={{ fontSize: 9, fontWeight: 700, color: sColor, background: sBg, border: `1px solid ${sColor}30`, padding: "4px 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{trip.status}</span>
                {canEdit && <button onClick={() => openEditTrip(trip)} style={{
                  padding: "6px 14px", border: `1px solid ${css.border}`, background: "transparent",
                  color: css.text3, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  textTransform: "uppercase", letterSpacing: "0.04em", transition: "all 0.12s",
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = css.accent; e.currentTarget.style.color = css.accent; }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = css.border; e.currentTarget.style.color = css.text3; }}>
                  Edit
                </button>}
                {!trip._shared && <button onClick={() => { setShowShareModal(trip.id); setShareEmail(""); setShareStatus(""); setSharePermission("read"); }} style={{
                  padding: "6px 14px", border: `1px solid ${css.border}`, background: "transparent",
                  color: css.text3, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  textTransform: "uppercase", letterSpacing: "0.04em", transition: "all 0.12s",
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#3b82f6"; }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = css.border; e.currentTarget.style.color = css.text3; }}>
                  Share
                </button>}
                {isShared && <span style={{ fontSize: 10, fontWeight: 600, color: isReadOnly ? "#3b82f6" : "#10b981", background: isReadOnly ? "rgba(59,130,246,0.1)" : "rgba(16,185,129,0.1)", padding: "4px 10px", border: `1px solid ${isReadOnly ? "rgba(59,130,246,0.2)" : "rgba(16,185,129,0.2)"}` }}>
                  Shared by {trip._sharedBy} · {isReadOnly ? "View only" : "Can edit"}
                </span>}
              </div>
            </div>
          </div>

          {/* Add to Trip button — hidden for read-only shared trips */}
          {canEdit && <button onClick={() => { if (trip.date) lastDateRef.current = trip.date; setShowAddSegment(trip.id); }} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
            padding: "12px 0", border: `1px dashed ${css.border}`, background: "transparent",
            color: css.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 24,
            transition: "all 0.12s",
          }} onMouseEnter={e => { e.currentTarget.style.borderColor = css.accent; e.currentTarget.style.background = css.accentBg; }}
             onMouseLeave={e => { e.currentTarget.style.borderColor = css.border; e.currentTarget.style.background = "transparent"; }}>
            + Add Flight, Hotel, Activity...
          </button>}

          {/* ── Day-by-day Timeline ── */}
          {realSegs.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <div style={{ display: "inline-flex", border: `1px solid ${css.border}`, overflow: "hidden" }}>
                {["F", "C"].map(u => (
                  <button key={u} onClick={() => setTempUnit(u)} style={{
                    padding: "4px 12px", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Geist Mono', monospace", transition: "all 0.12s",
                    background: tempUnit === u ? css.accent : "transparent",
                    color: tempUnit === u ? "#fff" : css.text3,
                  }}>°{u}</button>
                ))}
              </div>
            </div>
          )}
          {realSegs.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", background: css.surface, border: `1px solid ${css.border}` }}>
              <p style={{ fontSize: 15, color: css.text3, margin: "0 0 8px" }}>No itinerary items yet</p>
              <p style={{ fontSize: 12, color: css.text3, margin: 0 }}>Add flights, hotels, restaurants and more to build your day-by-day plan</p>
            </div>
          ) : (
            <div>
              {/* Collapsible Hotel Bookings section */}
              {(() => {
                const hotelSegs = realSegs.filter(s => s.type === "hotel" || s.type === "accommodation");
                if (hotelSegs.length === 0) return null;
                const info = segTypeInfo("hotel");
                return (
                  <div style={{ marginBottom: 20, border: `1px solid ${css.border}`, background: css.surface }}>
                    <button onClick={() => setHotelSectionOpen(!hotelSectionOpen)} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                      padding: "14px 20px", border: "none", background: "transparent", cursor: "pointer", color: css.text,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: `${info.color}12`, border: `1px solid ${info.color}25` }}><SegIcon type="hotel" size={15} color={info.color} /></div>
                        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.02em" }}>Hotel Bookings</span>
                        <span style={{ fontSize: 11, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>{hotelSegs.length}</span>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: hotelSectionOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                        <path d="M4 6l4 4 4-4" stroke={css.text3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {hotelSectionOpen && (
                      <div style={{ padding: "0 20px 16px", borderTop: `1px solid ${css.border}` }}>
                        {hotelSegs.map((seg, i) => {
                          const checkin = seg.date ? new Date(seg.date + "T12:00:00") : null;
                          const checkout = seg.checkoutDate ? new Date(seg.checkoutDate + "T12:00:00") : (checkin && seg.nights ? new Date(checkin.getTime() + (parseInt(seg.nights) || 1) * 86400000) : null);
                          const nights = (checkin && checkout) ? Math.round((checkout - checkin) / 86400000) : (parseInt(seg.nights) || 0);
                          const fmt = d => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          return (
                            <div key={`hotel-${i}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < hotelSegs.length - 1 ? `1px solid ${css.border}` : "none" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: css.text }}>{seg.property || "Accommodation"}</div>
                                <div style={{ fontSize: 11, color: css.text3, marginTop: 3, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                                  {checkin && checkout && <span>{fmt(checkin)} – {fmt(checkout)}</span>}
                                  {nights > 0 && <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 600 }}>· {nights} night{nights > 1 ? "s" : ""}</span>}
                                  {seg.roomType && <span>· {seg.roomType}</span>}
                                </div>
                                {seg.location && <div style={{ fontSize: 11, color: css.text3, marginTop: 2 }}><LocationLink location={`${seg.property || ""} ${seg.location}`}>{seg.location}</LocationLink></div>}
                              </div>
                              {seg.confirmationCode && (
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                  <div style={{ fontSize: 9, color: css.text3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Conf</div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: css.accent, fontFamily: "'Geist Mono', monospace" }}>{seg.confirmationCode}</div>
                                </div>
                              )}
                              {canEdit && <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                <button onClick={(e) => { e.stopPropagation(); editSegment(trip.id, realSegs.indexOf(seg)); }} style={{ padding: "3px 8px", border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                                <button onClick={(e) => { e.stopPropagation(); showConfirm("Delete this item?", () => deleteSegment(trip.id, realSegs.indexOf(seg))); }} style={{ padding: "3px 8px", border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#ef4444", fontSize: 10, fontWeight: 600, cursor: "pointer", opacity: 0.6 }}>Delete</button>
                              </div>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Day-by-day timeline with layover connectors */}
              {(() => {
                // Build flat sorted list of all non-hotel segments with layover info
                const allTimeline = realSegs.filter(s => s.type !== "hotel" && s.type !== "accommodation");
                // Group by date for day headers
                const byDate = {};
                allTimeline.forEach(seg => { const d = seg.date || "undated"; if (!byDate[d]) byDate[d] = []; byDate[d].push(seg); });
                Object.values(byDate).forEach(segs => segs.sort((a, b) => (a.departureTime || a.startTime || a.time || "99:99").localeCompare(b.departureTime || b.startTime || b.time || "99:99")));
                const dates = Object.keys(byDate).sort();

                // Pre-calculate layovers — ONLY between legs of the same multi-city booking
                // Legs are linked by sharing the same _bookingGroup ID (set during multi-city creation)
                const flatFlights = allTimeline.filter(s => s.type === "flight").sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.departureTime || "").localeCompare(b.departureTime || ""));
                const layoverMap = new Map();
                for (let i = 0; i < flatFlights.length - 1; i++) {
                  const curr = flatFlights[i];
                  const next = flatFlights[i + 1];
                  // Only show layover if both legs share the same booking group (multi-city)
                  if (!curr._bookingGroup || !next._bookingGroup || curr._bookingGroup !== next._bookingGroup) continue;
                  const resolvedArrDate = resolveArrivalDate(curr);
                  if (curr.date && next.date && curr.arrivalTime && resolvedArrDate) {
                    // Use resolved arrival date (explicit, or inferred from time comparison)
                    const arrDate = new Date(`${resolvedArrDate}T${curr.arrivalTime}:00`);
                    const depDate = new Date(`${next.date}T${next.departureTime || "00:00"}:00`);
                    const diffMs = depDate - arrDate;
                    if (diffMs > 0) {
                      const totalMins = Math.round(diffMs / 60000);
                      const days = Math.floor(totalMins / 1440);
                      const hrs = Math.floor((totalMins % 1440) / 60);
                      const mins = totalMins % 60;
                      let durText = "";
                      if (days > 0) durText += `${days}d `;
                      if (hrs > 0) durText += `${hrs}h `;
                      if (mins > 0 && days === 0) durText += `${mins}m`;
                      const airports = (curr.route || "").split("→").map(s => s.trim());
                      const layoverAirport = airports[airports.length - 1] || "?";
                      layoverMap.set(curr, { duration: durText.trim(), airport: layoverAirport, arrivalTime: curr.arrivalTime });
                    }
                  }
                }

                return dates.map((dateStr, dayIdx) => {
                const daySegs = byDate[dateStr];
                if (!daySegs || daySegs.length === 0) return null;
                const dayDate = dateStr !== "undated" ? new Date(dateStr + "T12:00:00") : null;
                const dayNum = dayDate && tripStartDate ? Math.floor((dayDate - new Date(tripStartDate + "T12:00:00")) / 86400000) + 1 : dayIdx + 1;
                const dayLabel = dayDate ? dayDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }).toUpperCase() : "UNDATED";
                // Resolve hotel for this night, then fall back to city/airport
                const dayHotel = dateStr !== "undated" ? resolveHotelForDate(realSegs, dateStr) : null;
                const dayCity = dateStr !== "undated" ? resolveCityForDate(realSegs, dateStr) : { city: "", airportCode: "" };
                // Weather key: prefer airport code (always geocodes) → city → trip location
                const weatherCity = dayCity.airportCode || dayCity.city || (dayHotel?.location ? dayHotel.location.split(",")[0].trim() : "") || trip.location?.split(",")[0]?.trim() || "";
                const wxKey = `${weatherCity}_${dateStr}`;
                const wx = weatherCache[wxKey] || null;
                const toF = (c) => Math.round(c * 9 / 5 + 32);
                const fmtTemp = (c) => tempUnit === "F" ? `${toF(c)}°` : `${Math.round(c)}°`;
                // Display label: hotel name if staying somewhere, otherwise city/airport
                const dayLocationLabel = dayHotel?.name || "";

                return (
                  <div key={dateStr} style={{ marginBottom: 32 }}>
                    {/* Day header: Day X — Date — Hotel Name ... weather on far right */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: `2px solid ${css.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: css.text, letterSpacing: "-0.01em", flexShrink: 0 }}>DAY {dayNum}</span>
                        <span style={{ fontSize: 12, color: css.text3, fontWeight: 600, letterSpacing: "0.02em", flexShrink: 0 }}>— {dayLabel}</span>
                        {dayLocationLabel && <span style={{ fontSize: 11, fontWeight: 600, color: css.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>· {dayLocationLabel}</span>}
                      </div>
                      {wx ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "'Geist Mono', monospace", color: css.text2, flexShrink: 0 }} title={wx.isHistorical ? `Expected weather (based on ${wx.cityName || "location"} last year)` : `Weather forecast for ${wx.cityName || "location"}`}>
                          <span style={{ fontSize: 15 }}>{weatherIcon(wx.code).icon}</span>
                          <span style={{ fontWeight: 700 }}>{fmtTemp(wx.high)}</span>
                          <span style={{ color: css.text3, fontWeight: 500 }}>{fmtTemp(wx.low)}</span>
                          <span style={{ fontSize: 9, color: wx.isHistorical ? css.warning : css.success, fontWeight: 600 }}>{wx.isHistorical ? "Expected" : "Forecast"}</span>
                        </div>
                      ) : weatherCity ? (
                        <span style={{ fontSize: 10, color: css.text3, fontStyle: "italic", flexShrink: 0 }}>Loading weather for {weatherCity}...</span>
                      ) : null}
                    </div>

                    {/* Timeline items */}
                    {daySegs.map((seg, segIdx) => {
                      const info = segTypeInfo(seg.type);
                      const time = segTime(seg);
                      const title = segTitle(seg);
                      const subtitle = segSubtitle(seg);
                      const isLast = segIdx === daySegs.length - 1;
                      const liveStatus = seg.type === "flight" ? getFlightLiveStatus(seg) : null;
                      const liveStatusColor = liveStatus?.status === "Landed" ? "#10b981" : liveStatus?.status === "EnRoute" ? "#3b82f6" : liveStatus?.status === "Canceled" ? "#ef4444" : (liveStatus?.departureDelay > 15 || liveStatus?.arrivalDelay > 15) ? "#f59e0b" : liveStatus ? "#10b981" : null;
                      const liveStatusLabel = liveStatus?.status === "Landed" ? "Landed" : liveStatus?.status === "EnRoute" ? "In Flight" : liveStatus?.status === "Canceled" ? "Cancelled" : (liveStatus?.departureDelay > 15) ? `Delayed ${liveStatus.departureDelay}m` : liveStatus?.status === "Scheduled" ? "On Time" : null;

                      return (
                        <React.Fragment key={segIdx}>
                        <div style={{ display: "flex", gap: 16, marginLeft: 8 }}>
                          {/* Timeline column */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 52, flexShrink: 0 }}>
                            {time && <div style={{ fontSize: 12, fontWeight: 600, color: css.text2, fontFamily: "'Geist Mono', monospace", marginBottom: 4, width: "100%", textAlign: "right", paddingRight: 12 }}>{time}</div>}
                            {!time && <div style={{ height: 18 }} />}
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: liveStatusColor || info.color, flexShrink: 0 }} />
                            {!isLast && <div style={{ width: 2, flex: 1, background: css.border, minHeight: 40 }} />}
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, paddingBottom: isLast && !layoverMap.has(seg) ? 0 : 16, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: css.text, lineHeight: 1.3 }}>{title}</div>
                                {liveStatusLabel && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, color: liveStatusColor, background: `${liveStatusColor}15`, border: `1px solid ${liveStatusColor}30`, textTransform: "uppercase", letterSpacing: "0.04em" }}>{liveStatusLabel}</span>}
                              </div>
                              {canEdit && <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                <button onClick={() => editSegment(trip.id, realSegs.indexOf(seg))} style={{ padding: "3px 8px", border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 10, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor = css.accent; e.currentTarget.style.color = css.accent; }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor = css.border; e.currentTarget.style.color = css.text3; }}>Edit</button>
                                <button onClick={() => { showConfirm("Delete this item?", () => deleteSegment(trip.id, realSegs.indexOf(seg))); }} style={{ padding: "3px 8px", border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#ef4444", fontSize: 10, fontWeight: 600, cursor: "pointer", opacity: 0.6, transition: "opacity 0.12s" }}
                                  onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}>Delete</button>
                              </div>}
                            </div>
                            {subtitle && <div style={{ fontSize: 13, color: css.text3, marginBottom: 4, lineHeight: 1.5 }}>
                              {segLocation(seg) ? (
                                <>{subtitle.split(segLocation(seg)).map((part, pi, arr) => (
                                  <React.Fragment key={pi}>
                                    {part}
                                    {pi < arr.length - 1 && <LocationLink location={`${seg.property || seg.activityName || seg.restaurantName || ""} ${segLocation(seg)}`}>{segLocation(seg)}</LocationLink>}
                                  </React.Fragment>
                                ))}</>
                              ) : subtitle}
                            </div>}
                            {/* Arrival time for flights */}
                            {seg.type === "flight" && seg.arrivalTime && (
                              <div style={{ fontSize: 12, color: css.text2, fontFamily: "'Geist Mono', monospace", marginBottom: 6 }}>
                                Arrives {seg.arrivalTime}{seg.arrivalTerminal ? ` · Terminal ${seg.arrivalTerminal}` : ""}
                              </div>
                            )}
                            {/* Live flight info */}
                            {liveStatus && !liveStatus.error && (
                              <div style={{ fontSize: 11, color: css.text3, marginBottom: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                {liveStatus.departureGate && <span>Gate <strong style={{ color: css.text2 }}>{liveStatus.departureGate}</strong></span>}
                                {liveStatus.departureTerminal && !seg.departureTerminal && <span>Terminal <strong style={{ color: css.text2 }}>{liveStatus.departureTerminal}</strong></span>}
                                {liveStatus.arrivalGate && <span>Arr. Gate <strong style={{ color: css.text2 }}>{liveStatus.arrivalGate}</strong></span>}
                                {liveStatus.baggageBelt && <span>Baggage <strong style={{ color: css.text2 }}>{liveStatus.baggageBelt}</strong></span>}
                                {liveStatus.departureDelay > 0 && liveStatus.departureRevised && <span style={{ color: "#f59e0b" }}>Now departs {liveStatus.departureRevised.split(" ").pop()?.replace(/[+-]\d{2}:\d{2}$/, "") || liveStatus.departureRevised}</span>}
                                {liveStatus.arrivalDelay > 0 && liveStatus.arrivalRevised && <span style={{ color: "#f59e0b" }}>Now arrives {liveStatus.arrivalRevised.split(" ").pop()?.replace(/[+-]\d{2}:\d{2}$/, "") || liveStatus.arrivalRevised}</span>}
                              </div>
                            )}
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                              <span style={{ fontSize: 10, fontWeight: 600, color: info.color, background: `${info.color}12`, border: `1px solid ${info.color}25`, padding: "2px 8px" }}>{info.label}</span>
                              {seg.confirmationCode && <span style={{ fontSize: 10, fontWeight: 600, color: css.text2, background: css.surface2, padding: "2px 8px", fontFamily: "'Geist Mono', monospace" }}>{seg.confirmationCode}</span>}
                              {(seg.cost || seg.totalCost || seg.ticketPrice) && <span style={{ fontSize: 10, fontWeight: 600, color: css.text3, padding: "2px 8px" }}>{parseFloat(seg.cost || seg.totalCost || seg.ticketPrice || 0).toLocaleString()} {seg.currency || "USD"}</span>}
                            </div>
                          </div>
                        </div>
                        {/* Layover connector between flights */}
                        {layoverMap.has(seg) && (() => {
                          const lo = layoverMap.get(seg);
                          return (
                            <div style={{ display: "flex", gap: 16, marginLeft: 8, marginBottom: 8 }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 52, flexShrink: 0 }}>
                                <div style={{ width: 0, borderLeft: `2px dashed ${css.warning}40`, flex: 1, minHeight: 32 }} />
                              </div>
                              <div style={{ flex: 1, padding: "8px 14px", background: `${css.warning}08`, border: `1px dashed ${css.warning}30`, display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 6, height: 6, background: css.warning, borderRadius: "50%", flexShrink: 0 }} />
                                <div style={{ fontSize: 12, fontWeight: 600, color: css.warning }}>
                                  {lo.duration} layover at <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 800 }}>{lo.airport}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        </React.Fragment>
                      );
                    })}
                  </div>
                );
              });
              })()}
            </div>
          )}


          {/* Booking Management — built from segments */}
          {realSegs.length > 0 && (() => {
            // Collect unique bookings from segments
            const bookings = [];
            const seenConf = new Set();
            // Airlines — match by airline name or flight number prefix
            // Build airline lookup — match by full name or flight number prefix (e.g. BA → British Airways)
            const airlineByName = {};
            const airlineByCode = {};
            Object.entries(AIRLINE_CS).forEach(([k, v]) => { airlineByName[v.name.toLowerCase()] = { ...v, key: k }; });
            // Map 2-letter IATA codes to AIRLINE_CS entries
            const codeMap = { AA: "aa", DL: "dl", UA: "ua", WN: "sw", B6: "b6", AS: "as", F9: "frontier", NK: "spirit", AF: "flying_blue", KL: "flying_blue", BA: "ba_avios", AC: "aeroplan", EK: "ek", TK: "tk", QF: "qantas_ff", SQ: "sq", CX: "cx", LH: "lh", LX: "lx", OS: "os", SK: "sk", AY: "ay", IB: "ib", JL: "jl", NH: "nh", KE: "korean_skypass", QR: "qr", EY: "etihad_guest", VS: "virgin_fc", MH: "mh", BR: "br", CI: "ci", TG: "tg" };
            // Hotel brand keyword → HOTEL_CS key lookup
            const hotelKeywords = [
              { re: /ritz.?carlton/i, key: "ritz" },
              { re: /marriott|westin|sheraton|w hotel|st\.?\s*regis|courtyard|residence\s+inn|fairfield|springhill|aloft/i, key: "marriott" },
              { re: /hilton|waldorf|conrad|doubletree|hampton|embassy\s+suites|canopy|curio|tapestry|lxr/i, key: "hilton" },
              { re: /hyatt|andaz|park\s+hyatt|grand\s+hyatt|thompson|alila|caption/i, key: "hyatt" },
              { re: /ihg|intercontinental|holiday\s+inn|crowne\s+plaza|kimpton|indigo|even\s+hotel|staybridge|candlewood/i, key: "ihg" },
              { re: /mandarin\s+oriental/i, key: "mandarin" },
              { re: /four\s+seasons/i, key: "four_seasons" },
              { re: /peninsula/i, key: "peninsula" },
              { re: /aman/i, key: "aman" },
              { re: /shangri/i, key: "shangri_la" },
              { re: /sofitel|novotel|pullman|mgallery|raffles|fairmont|swissôtel|accor/i, key: "accor" },
              { re: /radisson/i, key: "radisson" },
              { re: /wyndham|ramada|days\s+inn|super\s+8|la\s+quinta|tryp/i, key: "wyndham" },
            ];
            realSegs.forEach(seg => {
              if (seg.type === "flight") {
                const airlineName = seg.airline || "";
                const exactMatch = Object.entries(airlineByName).find(([name]) => airlineName.toLowerCase() === name);
                const fnCode = (seg.flightNumber || "").slice(0, 2).toUpperCase();
                const codeKey = codeMap[fnCode];
                const cs = exactMatch ? exactMatch[1] : (codeKey && AIRLINE_CS[codeKey] ? { ...AIRLINE_CS[codeKey], key: codeKey } : null);
                const conf = seg.confirmationCode || "";
                const label = cs?.name || airlineName || seg.flightNumber || "Flight";
                const existing = bookings.find(b => b.type === "flight" && b.label === label);
                if (existing) {
                  if (conf && !existing.conf) existing.conf = conf;
                  return;
                }
                if (conf && seenConf.has(conf)) return;
                if (conf) seenConf.add(conf);
                if (airlineName || conf || seg.flightNumber) bookings.push({ type: "flight", label, conf, phone: cs?.phone || "", manage: cs?.manage || "", color: "#3b82f6" });
              } else if (seg.type === "hotel" || seg.type === "accommodation") {
                const conf = seg.confirmationCode || "";
                if (conf && seenConf.has(conf)) return;
                if (conf) seenConf.add(conf);
                const propName = seg.property || "Hotel";
                // Look up hotel brand CS info
                const hotelMatch = hotelKeywords.find(h => h.re.test(propName));
                const hotelCS = hotelMatch ? HOTEL_CS[hotelMatch.key] : null;
                if (seg.property || conf) bookings.push({ type: "hotel", label: propName, conf, phone: hotelCS?.phone || "", manage: hotelCS?.manage || "", color: "#8b5cf6" });
              } else if (seg.confirmationCode) {
                if (seenConf.has(seg.confirmationCode)) return;
                seenConf.add(seg.confirmationCode);
                const segInfo = segTypeInfo(seg.type);
                bookings.push({ type: seg.type, label: seg.activityName || seg.restaurantName || seg.operator || seg.company || seg.loungeName || segInfo.label, conf: seg.confirmationCode, phone: "", manage: "", color: segInfo.color });
              }
            });
            if (bookings.length === 0) return null;
            return (
              <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 0, padding: "20px 24px", marginBottom: 20, borderLeft: `3px solid ${css.accent}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: css.text, marginBottom: 14 }}>Booking Management</div>
                {bookings.map((b, i) => (
                  <div key={i} style={{ padding: "10px 0", borderBottom: i < bookings.length - 1 ? `1px solid ${css.border}` : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: b.color, background: `${b.color}15`, padding: "2px 6px" }}>{b.type === "flight" ? "Flight" : b.type === "hotel" ? "Hotel" : b.type}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{b.label}</span>
                      </div>
                      {b.conf && <span style={{ fontSize: 12, fontWeight: 700, color: css.accent, fontFamily: "'Geist Mono', monospace", flexShrink: 0 }}>{b.conf}</span>}
                    </div>
                    {(b.phone || b.manage) && (
                      <div style={{ display: "flex", gap: 12, marginTop: 6, paddingLeft: 2 }}>
                        {b.phone && <span style={{ fontSize: 11, color: css.text2 }}>{b.phone}</span>}
                        {b.manage && <a href={b.manage} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: css.accent, textDecoration: "none" }}>Manage Booking ↗</a>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ── Trip Prep ── */}
          {(() => {
            const passportCode = user?.user_metadata?.passport_country || settingsForm.passportCountry;
            const tripStartDate = trip.date || (trip.segments || []).map(s => s.date).filter(Boolean).sort()[0] || "";
            const daysUntilTrip = tripStartDate ? Math.max(0, Math.ceil((new Date(tripStartDate + "T12:00:00") - new Date()) / 86400000)) : null;
            const tripPrepTab = expandedCardId === `prep_${trip.id}` ? "timeline" : expandedCardId === `prep_visa_${trip.id}` ? "visa" : expandedCardId === `prep_pack_${trip.id}` ? "packing" : null;
            const setPrepTab = (tab) => setExpandedCardId(tab ? (tab === "timeline" ? `prep_${trip.id}` : `prep_${tab}_${trip.id}`) : null);
            const addDays = (dateStr, days) => { if (!dateStr) return ""; const d = new Date(dateStr + "T12:00:00"); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
            const fmtPrepDate = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
            const today = new Date().toISOString().slice(0, 10);
            const IATA_COUNTRY2 = { JFK:"United States",LAX:"United States",SFO:"United States",ORD:"United States",MIA:"United States",ATL:"United States",LHR:"United Kingdom",CDG:"France",NRT:"Japan",HND:"Japan",KIX:"Japan",HKG:"Hong Kong",SIN:"Singapore",BKK:"Thailand",ICN:"South Korea",TPE:"Taiwan",PVG:"China",PEK:"China",BDA:"Bermuda",AMS:"Netherlands",FRA:"Germany",MUC:"Germany",FCO:"Italy",BCN:"Spain",MAD:"Spain",LIS:"Portugal",DUB:"Ireland",CPH:"Denmark",IST:"Turkey",DXB:"UAE",DOH:"Qatar",SYD:"Australia",YYZ:"Canada",YVR:"Canada",MEX:"Mexico",CUN:"Mexico",GRU:"Brazil",EZE:"Argentina",DEL:"India",BOM:"India",JNB:"South Africa",ZRH:"Switzerland",VIE:"Austria",BRU:"Belgium",DPS:"Indonesia",MLE:"Maldives",KUL:"Malaysia",SGN:"Vietnam",NAS:"Bahamas",MBJ:"Jamaica" };
            const PNAME = { US:"United States",CA:"Canada",GB:"United Kingdom",AU:"Australia",NZ:"New Zealand",DE:"Germany",FR:"France",JP:"Japan",KR:"South Korea",SG:"Singapore",HK:"Hong Kong",TW:"Taiwan",IN:"India",CN:"China",BR:"Brazil",MX:"Mexico",BM:"Bermuda",IE:"Ireland",NL:"Netherlands",IT:"Italy",ES:"Spain",CH:"Switzerland",SE:"Sweden",NO:"Norway",DK:"Denmark",FI:"Finland" };
            const destCountries2 = new Set();
            const destCities2 = {};
            realSegs.filter(s => s.type === "flight").forEach(seg => { const arr = seg.arrivalAirport?.toUpperCase(); if (arr && IATA_COUNTRY2[arr]) { destCountries2.add(IATA_COUNTRY2[arr]); if (!destCities2[IATA_COUNTRY2[arr]]) destCities2[IATA_COUNTRY2[arr]] = arr; } });
            if (trip.location && destCountries2.size === 0) trip.location.split(/[,\/]/).map(s => s.trim()).filter(Boolean).forEach(l => destCountries2.add(l));
            destCountries2.delete(PNAME[passportCode] || "");
            const destinations2 = [...destCountries2];
            destinations2.forEach(dest => { const key = `${passportCode}_${dest}`; if (passportCode && !visaCache[key] && !visaLoading[key]) setTimeout(() => checkVisa(passportCode, dest, destCities2[dest] || ""), 500); });
            const needsVisa = destinations2.some(d => { const v = visaCache[`${passportCode}_${d}`]; return v && (v.status === "visa_required" || v.status === "evisa"); });
            const hasFlightsP = realSegs.some(s => s.type === "flight");
            const hasHotelsP = realSegs.some(s => s.type === "hotel" || s.type === "accommodation");
            const milestones = [];
            if (needsVisa) milestones.push({ id: "visa", label: "Apply for visa", detail: "Check requirements and submit application", dueOffset: -84 });
            milestones.push({ id: "passport_check", label: "Verify passport validity", detail: "Must be valid 6+ months beyond travel dates", dueOffset: -84 });
            milestones.push({ id: "travel_insurance", label: "Purchase travel insurance", detail: "Coverage for cancellation, medical, luggage", dueOffset: -56 });
            if (!hasHotelsP && hasFlightsP) milestones.push({ id: "book_hotels", label: "Book accommodation", detail: "Reserve hotels for all destinations", dueOffset: -42 });
            milestones.push({ id: "notify_bank", label: "Notify bank of travel dates", detail: "Prevent card blocks in foreign countries", dueOffset: -14 });
            milestones.push({ id: "download_maps", label: "Download offline maps", detail: "Google Maps or Apple Maps offline areas", dueOffset: -7 });
            milestones.push({ id: "confirm_bookings", label: "Confirm all reservations", detail: "Double-check hotels, flights, activities", dueOffset: -7 });
            milestones.push({ id: "start_packing", label: "Start packing", detail: "Use the packing tab below", dueOffset: -5 });
            milestones.push({ id: "online_checkin", label: "Online check-in", detail: "Opens 24-48h before departure", dueOffset: -1 });
            milestones.push({ id: "charge_devices", label: "Charge all devices", detail: "Phone, laptop, power bank, headphones", dueOffset: -1 });
            milestones.push({ id: "check_status", label: "Check flight status", detail: "Verify no delays or gate changes", dueOffset: 0 });
            const prepChecked = packingLists[`prep_${trip.id}`] || {};
            const togglePrep = (id) => savePackingLists({ ...packingLists, [`prep_${trip.id}`]: { ...prepChecked, [id]: !prepChecked[id] } });
            const prepDoneCount = milestones.filter(m => prepChecked[m.id]).length;
            const packCats = getPackingItems(trip);
            const packChecked = packingLists[trip.id] || {};
            const tripCust = customPackItems[trip.id] || [];
            const allPackItems = [...Object.values(packCats).flatMap(c => c.items), ...tripCust];
            const packDoneCount = allPackItems.filter(i => packChecked[i.id]).length;
            const totalTasks = milestones.length + allPackItems.length;
            const totalDone = prepDoneCount + packDoneCount;
            const readinessPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
            const sColors = { visa_free: "#10b981", visa_on_arrival: "#3b82f6", evisa: "#f59e0b", visa_required: "#ef4444" };
            const sLabels = { visa_free: "Visa Free", visa_on_arrival: "Visa on Arrival", evisa: "eVisa Required", visa_required: "Visa Required" };
            return (
              <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
                <div style={{ padding: isMobile ? "14px 16px" : "18px 24px", borderBottom: `1px solid ${css.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={css.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                      <span style={{ fontSize: 14, fontWeight: 700, color: css.text }}>Trip Prep</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: readinessPct === 100 ? "#10b981" : css.text, fontFamily: "'Geist Mono', monospace" }}>{readinessPct}%</span>
                      <span style={{ fontSize: 9, color: css.text3 }}>ready</span>
                    </div>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: css.surface2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${readinessPct}%`, background: readinessPct === 100 ? "#10b981" : css.accent, borderRadius: 2, transition: "width 0.3s" }} />
                  </div>
                </div>
                <div style={{ display: "flex", borderBottom: `1px solid ${css.border}` }}>
                  {[{ id: "timeline", label: "Timeline", ct: `${prepDoneCount}/${milestones.length}` }, ...(passportCode && destinations2.length > 0 ? [{ id: "visa", label: "Visa", ct: `${destinations2.length}` }] : []), { id: "packing", label: "Packing", ct: `${packDoneCount}/${allPackItems.length}` }].map(tab => {
                    const active = tripPrepTab === tab.id;
                    return (<button key={tab.id} onClick={() => setPrepTab(active ? null : tab.id)} style={{ flex: 1, padding: "10px 6px", border: "none", cursor: "pointer", background: "transparent", borderBottom: active ? `2px solid ${css.accent}` : "2px solid transparent", color: active ? css.accent : css.text3, fontSize: 11, fontWeight: active ? 700 : 500, fontFamily: "inherit" }}>{tab.label} <span style={{ fontSize: 9, fontFamily: "'Geist Mono', monospace", opacity: 0.7 }}>{tab.ct}</span></button>);
                  })}
                </div>
                {tripPrepTab === "timeline" && (<div style={{ padding: isMobile ? "10px 14px" : "14px 24px" }}>{milestones.map((m, mi) => { const due = tripStartDate ? addDays(tripStartDate, m.dueOffset) : ""; const overdue = due && due < today && !prepChecked[m.id]; const soon = due && !overdue && due <= addDays(today, 7) && !prepChecked[m.id]; const done = !!prepChecked[m.id]; return (<div key={m.id} onClick={() => togglePrep(m.id)} style={{ display: "flex", gap: 10, padding: "9px 2px", cursor: "pointer", borderBottom: mi < milestones.length-1 ? `1px solid ${css.border}` : "none", opacity: done ? 0.4 : 1, transition: "opacity 0.2s" }}><div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1, border: `1.5px solid ${done ? "#10b981" : overdue ? "#ef4444" : css.border}`, background: done ? "#10b981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{done && <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>}</div><div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}><span style={{ fontSize: 12, fontWeight: 600, color: done ? css.text3 : css.text }}>{m.label}</span>{due && <span style={{ fontSize: 9, fontWeight: 600, flexShrink: 0, padding: "2px 6px", borderRadius: 4, color: done ? css.text3 : overdue ? "#ef4444" : soon ? "#f59e0b" : css.text3, background: overdue ? "rgba(239,68,68,0.08)" : soon ? "rgba(245,158,11,0.08)" : "transparent" }}>{overdue ? "OVERDUE" : fmtPrepDate(due)}</span>}</div><div style={{ fontSize: 10, color: css.text3, marginTop: 1 }}>{m.detail}</div></div></div>); })}</div>)}
                {tripPrepTab === "visa" && passportCode && (<div style={{ padding: isMobile ? "10px 14px" : "14px 24px" }}><div style={{ fontSize: 10, color: css.text3, marginBottom: 8 }}>{PNAME[passportCode] || passportCode} passport</div>{destinations2.map(dest => { const key = `${passportCode}_${dest}`; const visa = visaCache[key]; const ld = visaLoading[key]; const clr = visa ? (sColors[visa.status] || css.text3) : css.text3; return (<div key={dest} style={{ padding: "10px 0", borderBottom: `1px solid ${css.border}` }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: visa ? 6 : 0 }}><span style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{dest}</span>{ld && <span style={{ fontSize: 10, color: css.text3 }}>Checking...</span>}{visa && <span style={{ fontSize: 9, fontWeight: 700, color: clr, background: `${clr}12`, border: `1px solid ${clr}30`, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase" }}>{sLabels[visa.status] || visa.status}</span>}</div>{visa && (<div><div style={{ fontSize: 11, color: css.text2, marginBottom: 4, lineHeight: 1.5 }}>{visa.summary}{visa.stayDuration ? ` (${visa.stayDuration})` : ""}</div>{visa.details && <div style={{ fontSize: 10, color: css.text3, marginBottom: 6, lineHeight: 1.5 }}>{visa.details}</div>}{visa.applicationSteps?.length > 0 && visa.status !== "visa_free" && (<div style={{ marginBottom: 6 }}><div style={{ fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", marginBottom: 4 }}>How to Apply</div>{visa.applicationSteps.map((step, si) => (<div key={si} style={{ display: "flex", gap: 6, fontSize: 10, color: css.text2, lineHeight: 1.5, marginBottom: 2 }}><span style={{ fontWeight: 700, color: css.accent, width: 14, textAlign: "right", flexShrink: 0 }}>{si+1}.</span><span>{step.replace(/^Step\s*\d+:\s*/i,"")}</span></div>))}</div>)}<div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 10, color: css.text3 }}>{visa.processingTime && !/N\/A/i.test(visa.processingTime) && <span>Processing: <strong style={{ color: css.text2 }}>{visa.processingTime}</strong></span>}{visa.cost && !/Free|N\/A/i.test(visa.cost) && <span>Fee: <strong style={{ color: css.text2 }}>{visa.cost}</strong></span>}</div>{visa.importantNotes?.length > 0 && (<div style={{ marginTop: 6, padding: "6px 8px", borderRadius: 6, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)" }}>{visa.importantNotes.map((n,ni) => <div key={ni} style={{ fontSize: 10, color: "#f59e0b", lineHeight: 1.5 }}>{n}</div>)}</div>)}{visa.officialWebsite && <a href={visa.officialWebsite} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 6, fontSize: 10, color: css.accent, textDecoration: "none" }}>Official website ↗</a>}</div>)}</div>); })}<div style={{ fontSize: 9, color: css.text3, marginTop: 8, fontStyle: "italic" }}>Visa requirements may change. Always verify with the embassy before travel.</div></div>)}
                {tripPrepTab === "packing" && (<div style={{ padding: isMobile ? "10px 14px" : "14px 24px" }}>{Object.entries(packCats).map(([catKey, cat]) => { const isOpen = packExpanded === catKey; const catCust = tripCust.filter(i => i.category === catKey); const catAll = [...cat.items, ...catCust]; const catDone = catAll.filter(i => packChecked[i.id]).length; return (<div key={catKey}><button onClick={() => setPackExpanded(isOpen ? null : catKey)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 4px", border: "none", background: "transparent", cursor: "pointer", borderBottom: `1px solid ${css.border}`, fontFamily: "inherit" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 12, fontWeight: 600, color: css.text }}>{cat.label}</span><span style={{ fontSize: 10, color: catDone === catAll.length && catAll.length > 0 ? "#10b981" : css.text3, fontFamily: "'Geist Mono', monospace" }}>{catDone}/{catAll.length}</span></div><svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="M4 6l4 4 4-4" stroke={css.text3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>{isOpen && (<div style={{ padding: "6px 0" }}>{catAll.map(item => { const done = !!packChecked[item.id]; const isCust = item.id.startsWith("custom_"); return (<div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", cursor: "pointer", opacity: done ? 0.4 : 1, transition: "opacity 0.2s" }} onClick={() => togglePackItem(trip.id, item.id)}><div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${done ? "#10b981" : css.border}`, background: done ? "#10b981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{done && <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>}</div>{isCust ? (<div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}><input type="text" value={item.label} placeholder="Custom item..." onChange={e => { e.stopPropagation(); const nx = { ...customPackItems, [trip.id]: tripCust.map(i => i.id === item.id ? { ...i, label: e.target.value } : i) }; setCustomPackItems(nx); try { localStorage.setItem("continuum_custom_pack_items", JSON.stringify(nx)); } catch {} }} onClick={e => e.stopPropagation()} style={{ flex: 1, padding: "2px 4px", border: "none", borderBottom: `1px solid ${css.border}`, background: "transparent", color: css.text, fontSize: 12, fontFamily: "inherit", outline: "none" }} /><button onClick={e => { e.stopPropagation(); const nx = { ...customPackItems, [trip.id]: tripCust.filter(i => i.id !== item.id) }; setCustomPackItems(nx); try { localStorage.setItem("continuum_custom_pack_items", JSON.stringify(nx)); } catch {} }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>x</button></div>) : (<span style={{ fontSize: 12, color: done ? css.text3 : css.text }}>{item.label}</span>)}</div>); })}<button onClick={() => { const id = `custom_${Date.now()}`; const nx = { ...customPackItems, [trip.id]: [...tripCust, { id, label: "", category: catKey }] }; setCustomPackItems(nx); try { localStorage.setItem("continuum_custom_pack_items", JSON.stringify(nx)); } catch {} }} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "7px 8px", border: "none", background: "transparent", color: css.text3, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}><span style={{ fontSize: 14 }}>+</span> Add custom item</button></div>)}</div>); })}</div>)}
              </div>
            );
          })()}

          {/* Expenses for this trip */}
          {tripExps.length > 0 && (
            <div style={{
              background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "20px 24px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: css.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15 }}>—</span> Expenses · <span style={{ fontFamily: "'Geist Mono', monospace", color: css.accent }}>${tripTotal.toLocaleString()}</span>
              </div>
              {tripExps.map(exp => {
                const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                return (
                  <div key={exp.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${css.border}` }}>
                    {exp.receiptImage?.data && exp.receiptImage.type?.startsWith("image/") && (
                      <div style={{ flexShrink: 0, position: "relative" }}>
                        <img src={exp.receiptImage.data} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4, border: `1px solid ${css.border}`, cursor: "pointer" }} onClick={() => setViewExpenseId(exp.id)} />
                        <button onClick={(e) => { e.stopPropagation(); setCropExpenseId(exp.id); setCropStart(null); setCropEnd(null); }} style={{ position: "absolute", bottom: -3, right: -3, width: 16, height: 16, borderRadius: 3, border: `1px solid ${css.border}`, background: css.surface, color: css.text3, fontSize: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }} title="Crop">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 002 2h14"/><path d="M18 22V8a2 2 0 00-2-2H2"/></svg>
                        </button>
                      </div>
                    )}
                    {cat && <span style={{ fontSize: 9, fontWeight: 700, color: cat.color, background: `${cat.color}15`, padding: "2px 6px", flexShrink: 0 }}>{cat.label}</span>}
                    <span style={{ fontSize: 12, color: css.text2, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description || exp.category}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: css.text, fontFamily: "'Geist Mono', monospace", flexShrink: 0 }}>{exp.amount?.toLocaleString()} {exp.currency || "USD"}</span>
                    <button onClick={() => setViewExpenseId(exp.id)} style={{ padding: "3px 8px", border: `1px solid ${css.accent}30`, background: "transparent", color: css.accent, fontSize: 10, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>View</button>
                    <button onClick={() => { setEditExpenseId(exp.id); setShowAddExpense(trip.id); setNewExpense({ ...exp, fxRate: exp.fxRate || 1 }); }} style={{ padding: "3px 8px", border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 10, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Edit</button>
                    <select onChange={async e => {
                      const newTripId = e.target.value; if (!newTripId) return;
                      if (newTripId === "_unassign") {
                        if (user) await supabase.from("expenses").update({ trip_id: null }).eq("id", exp.id).eq("user_id", user.id);
                        setExpenses(prev => prev.map(ex => ex.id === exp.id ? { ...ex, tripId: null } : ex));
                      } else {
                        if (user) await supabase.from("expenses").update({ trip_id: newTripId }).eq("id", exp.id).eq("user_id", user.id);
                        setExpenses(prev => prev.map(ex => ex.id === exp.id ? { ...ex, tripId: newTripId } : ex));
                      }
                      e.target.value = "";
                    }} style={{ padding: "3px 6px", borderRadius: 4, border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 10, cursor: "pointer", flexShrink: 0 }}>
                      <option value="">Transfer...</option>
                      <option value="_unassign">Unassign (back to inbox)</option>
                      {trips.filter(t => t.id !== trip.id).map(t => <option key={t.id} value={t.id}>{t.tripName || t.trip_name || t.location || "Trip"}</option>)}
                    </select>
                    <button onClick={() => removeExpense(exp.id)} style={{ padding: "3px 8px", border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#ef4444", fontSize: 10, fontWeight: 600, cursor: "pointer", flexShrink: 0, opacity: 0.6 }}>Delete</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
    <div>
      {/* ── Hero banner image ── */}
      <div style={{ margin: isMobile ? "0 -16px 0" : "0 -48px 0", position: "relative", height: isMobile ? 160 : 240, overflow: "hidden" }}>
        <img src="/hero-trips.jpg" alt="Trips" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%", display: "block" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: isMobile ? 60 : 80, background: D ? "linear-gradient(transparent, #0f0f0f)" : "linear-gradient(transparent, #ffffff)" }} />
      </div>

      {/* Page header */}
      <div className="c-a1" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 700, color: css.text, margin: 0, letterSpacing: "-0.02em" }}>Your Trips</h2>
          <p style={{ color: css.text3, fontSize: 13, margin: "6px 0 0" }}>
            {trips.length} trip{trips.length !== 1 ? "s" : ""} · {trips.filter(t => t.status === "confirmed").length} confirmed
            {grandTotal > 0 && <span style={{ marginLeft: 10, color: css.accent, fontFamily: "'Geist Mono', monospace" }}>${grandTotal.toLocaleString()} total spend</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Export Month PDF button */}
          <div style={{ position: "relative" }}>
            <button onClick={() => document.getElementById("cal-month-picker").showPicker?.()} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: css.surface2, border: `1px solid ${css.border}`, color: css.text2, transition: "all 0.15s",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
              Export PDF
            </button>
            <input id="cal-month-picker" type="month" defaultValue={new Date().toISOString().slice(0, 7)}
              onChange={e => { if (e.target.value) exportMonthPDF(e.target.value); }}
              style={{ position: "absolute", top: 0, left: 0, opacity: 0, pointerEvents: "none", width: "100%", height: "100%" }}
            />
          </div>
          {/* View toggle */}
          <div style={{ display: "flex", background: css.surface2, border: `1px solid ${css.border}`, borderRadius: 8, padding: 3, gap: 2 }}>
            {[{ v: "list", icon: "≡" }, { v: "calendar", icon: "▦" }].map(({ v, icon }) => (
              <button key={v} onClick={() => setTripsView(v)} style={{
                padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: tripsView === v ? css.surface : "transparent",
                color: tripsView === v ? css.text : css.text3,
                boxShadow: tripsView === v ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                transition: "all 0.15s",
              }}>{icon}</button>
            ))}
          </div>
          <button onClick={() => setShowImportItinerary(true)} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
            background: css.surface2, border: `1px solid ${css.border}`, color: css.text2, transition: "all 0.15s",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            Import Itinerary
          </button>
          <button onClick={() => setShowCreateTrip(true)} className="c-btn-primary" style={{
            padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: css.accent, color: "#fff",
          }}>+ Add Trip</button>
        </div>
      </div>

      {/* Flighty instructions banner */}

      {/* Calendar view */}
      {tripsView === "calendar" && (() => {
        const pad = (n) => String(n).padStart(2, "0");
        const { year, month } = calViewMonth;
        const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);
        const today = new Date();
        const isToday = (d) => d && year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
        const getTripsForDay = (d) => {
          if (!d) return [];
          const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
          return trips.filter(t => {
            const segs = (t.segments && t.segments.length > 0) ? t.segments : (t.date ? [{ type: t.type, date: t.date, checkoutDate: t.checkoutDate, dropoffDate: t.dropoffDate, nights: t.nights }] : []);
            return segs.some(seg => {
              if (!seg.date) return false;
              if (seg.date === dateStr) return true;
              // Hotels span check-in through checkout
              if (seg.type === "hotel") {
                const checkout = seg.checkoutDate || (seg.nights > 1 ? (() => { const e = new Date(seg.date + "T12:00:00"); e.setDate(e.getDate() + seg.nights); return e.toISOString().slice(0,10); })() : null);
                if (checkout && dateStr > seg.date && dateStr < checkout) return true;
              }
              // Car rentals span pickup through dropoff
              if (seg.type === "car" && seg.dropoffDate && dateStr > seg.date && dateStr <= seg.dropoffDate) return true;
              return false;
            });
          });
        };
        const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return (
          <div>
            {/* Month navigator */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <button onClick={() => setCalViewMonth(p => { const d = new Date(p.year, p.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${css.border}`, background: css.surface, color: css.text, fontSize: 16, cursor: "pointer" }}>‹</button>
              <span style={{ fontSize: 16, fontWeight: 700, color: css.text, fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.02em" }}>{monthLabel}</span>
              <button onClick={() => setCalViewMonth(p => { const d = new Date(p.year, p.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${css.border}`, background: css.surface, color: css.text, fontSize: 16, cursor: "pointer" }}>›</button>
            </div>
            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 2 }}>
              {DAY_LABELS.map(d => (
                <div key={d} style={{ textAlign: "center", padding: "6px 0", fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.1em" }}>{d}</div>
              ))}
            </div>
            {/* Day grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isMobile ? 1 : 2 }}>
              {cells.map((d, i) => {
                const dayTrips = getTripsForDay(d);
                const dateStr = d ? `${year}-${pad(month + 1)}-${pad(d)}` : "";
                if (isMobile) {
                  // Compact single-page mobile view: date number + colored dots only
                  return (
                    <div key={i} onClick={() => {
                      if (d && dayTrips.length > 0) { setTripDetailId(dayTrips[0].id); setTripDetailSegIdx(0); }
                    }} style={{
                      background: d ? css.surface : "transparent",
                      border: `1px solid ${d ? (dayTrips.length > 0 ? css.accentBorder : css.border) : "transparent"}`,
                      borderRadius: 6, padding: "5px 2px 6px", textAlign: "center",
                      cursor: d && dayTrips.length > 0 ? "pointer" : "default",
                      minHeight: 44,
                    }}>
                      {d && <>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: isToday(d) ? 700 : 400, background: isToday(d) ? css.accent : "transparent", color: isToday(d) ? "#fff" : css.text2, margin: "0 auto 4px" }}>{d}</div>
                        <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                          {dayTrips.slice(0, 3).map((trip, ti) => {
                            const prog = allPrograms.find(p => p.id === trip.program);
                            const color = prog?.color || css.accent;
                            const allSegs = (trip.segments && trip.segments.length > 0) ? trip.segments : [{ type: trip.type, date: trip.date }];
                            const seg = allSegs.find(s => s.date === dateStr) || allSegs[0];
                            const segType = seg?.type || trip.type;
                            const dotIcon = "●";
                            return <div key={ti} style={{ width: 14, height: 14, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#fff" }}>{dotIcon}</div>;
                          })}
                          {dayTrips.length > 3 && <div style={{ fontSize: 7, color: css.text3, lineHeight: "14px" }}>+{dayTrips.length - 3}</div>}
                        </div>
                      </>}
                    </div>
                  );
                }
                return (
                  <div key={i} style={{ background: d ? css.surface : "transparent", border: `1px solid ${d ? css.border : "transparent"}`, borderRadius: 8, minHeight: 120, padding: "6px 6px 5px" }}>
                    {d && (
                      <>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: isToday(d) ? 700 : 400, background: isToday(d) ? css.accent : "transparent", color: isToday(d) ? "#fff" : css.text2, marginBottom: 4 }}>{d}</div>
                        {dayTrips.slice(0, 3).map((trip, ti) => {
                          const prog = allPrograms.find(p => p.id === trip.program);
                          const color = prog?.color || css.accent;
                          const allSegs = (trip.segments && trip.segments.length > 0) ? trip.segments : [{ type: trip.type, date: trip.date, route: trip.route, flightNumber: trip.flightNumber, departureTime: trip.departureTime, arrivalTime: trip.arrivalTime, property: trip.property, location: trip.location, nights: trip.nights, checkoutDate: trip.checkoutDate, dropoffDate: trip.dropoffDate }];
                          const daySegs = allSegs.filter(seg => {
                            if (!seg.date) return false;
                            if (seg.date === dateStr) return true;
                            if (seg.type === "hotel") { const co = seg.checkoutDate || null; if (co && dateStr > seg.date && dateStr < co) return true; }
                            if (seg.type === "car" && seg.dropoffDate && dateStr > seg.date && dateStr <= seg.dropoffDate) return true;
                            return false;
                          });
                          const seg = daySegs[0] || allSegs[0];
                          const segType = seg?.type || trip.type;
                          const icon = "";
                          const routeDisplay = segType === "flight"
                            ? (seg?.route ? seg.route.replace(/\s*[→>]\s*/g, " - ").replace(/\s*[–—]+\s*/g, " - ") : seg?.flightNumber || trip.route || "Flight")
                            : segType === "hotel" ? (seg?.property || seg?.location || trip.property || "Hotel")
                            : (seg?.pickupLocation || trip.location || "Car");
                          const flightNum = (() => { const fn = seg?.flightNumber || ""; const m = fn.match(/^([A-Z]{1,3})\s*(\d+)$/); return m ? `${m[1]} ${m[2]}` : fn; })();
                          const timeRange = [seg?.departureTime, seg?.arrivalTime].filter(Boolean).join(" - ");
                          const hotelNights = (() => { const co = seg?.checkoutDate; return (co && seg?.date) ? Math.round((new Date(co) - new Date(seg.date)) / 86400000) : (seg?.nights || 0); })();
                          const subtext = segType === "flight" ? [flightNum, timeRange].filter(Boolean).join(" · ") : segType === "hotel" && hotelNights ? `${hotelNights} nights` : "";
                          const segIdx = daySegs[0] ? allSegs.indexOf(daySegs[0]) : 0;
                          return (
                            <div key={ti} onClick={() => { setTripDetailId(trip.id); setTripDetailSegIdx(Math.max(0, segIdx)); }}
                              title={[seg?.route || seg?.property, seg?.flightNumber, seg?.departureTime, seg?.arrivalTime].filter(Boolean).join(" · ")}
                              style={{ background: `${color}18`, borderLeft: `2px solid ${color}`, borderRadius: 3, padding: "3px 6px", marginBottom: 3, cursor: "pointer" }}>
                              <div style={{ fontSize: 9, fontWeight: 600, color: css.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{icon} {routeDisplay}</div>
                              {subtext && <div style={{ fontSize: 8, color: css.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{subtext}</div>}
                            </div>
                          );
                        })}
                        {dayTrips.length > 3 && <div style={{ fontSize: 9, color: css.text3, paddingLeft: 3 }}>+{dayTrips.length - 3} more</div>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Filters + List (only in list view) */}
      {tripsView === "list" && <>
      <div className="c-a2" style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search trips..."
          style={{
            padding: "8px 14px", background: css.surface, border: `1px solid ${css.border}`,
            borderRadius: 8, color: css.text, fontSize: 12, outline: "none", flex: 1, minWidth: 160,
            fontFamily: "'Instrument Sans', 'Outfit', sans-serif",
          }} />
        {["all", "confirmed", "planned", "wishlist"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: "8px 14px", borderRadius: 8, border: `1px solid ${filterStatus === s ? css.accentBorder : css.border}`,
            cursor: "pointer", fontSize: 11, fontWeight: 600,
            background: filterStatus === s ? css.accentBg : css.surface,
            color: filterStatus === s ? css.accent : css.text2, textTransform: "capitalize",
          }}>{s}</button>
        ))}
      </div>

      {/* Trip Cards — Upcoming */}
      {upcomingTripsFiltered.length > 0 && (
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'Geist Mono', monospace", marginBottom: 8, textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
          Upcoming · {upcomingTripsFiltered.length}
        </div>
      )}
      <div className="c-a3" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: pastTripsFiltered.length > 0 ? 28 : 0 }}>
        {upcomingTripsFiltered.map(trip => {
          const canEdit = !trip._shared || trip._permission === "edit";
          const prog = allPrograms.find(p => p.id === trip.program);
          const sColor = trip.status === "confirmed" ? css.success : trip.status === "planned" ? css.warning : css.accent;
          const sBg = trip.status === "confirmed" ? css.successBg : trip.status === "planned" ? css.warningBg : css.accentBg;
          const tripExps = getTripExpenses(trip.id);
          const tripTotal = getTripTotal(trip.id);
          const isExpanded = expenseViewTrip === trip.id;
          const catBreakdown = EXPENSE_CATEGORIES.map(cat => ({
            ...cat, total: tripExps.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
          })).filter(c => c.total > 0);

          return (
            <div key={trip.id} style={{
              background: css.surface,
              border: `1px solid ${isExpanded ? css.accentBorder : css.border}`,
              borderRadius: 14, overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}>
              {/* Trip header row */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap",
                gap: 12, padding: "16px 20px", cursor: "pointer",
              }} onClick={() => setExpenseViewTrip(isExpanded ? null : trip.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", flex: 1, minWidth: 0 }} onClick={e => { e.stopPropagation(); setTripDetailId(trip.id); setTripDetailSegIdx(0); }}>
                  <div style={{
                    width: isMobile ? 36 : 44, height: isMobile ? 36 : 44, borderRadius: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${css.accent}15`, border: `1px solid ${css.accent}25`,
                    flexShrink: 0,
                  }}>
                    <SegIcon type={(() => { const segs = (trip.segments || []).filter(s => !s._isMeta); if (segs.length === 0) return "pin"; if (segs.some(s => s.type === "flight")) return "flight"; if (segs.some(s => s.type === "hotel" || s.type === "accommodation")) return "hotel"; return "pin"; })()} size={isMobile ? 16 : 20} color={css.accent} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    {trip.tripName && <div style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: css.accent, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.tripName}</div>}
                    <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: css.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.location || trip.tripName || trip.trip_name || "Trip"}</div>
                    <div style={{ fontSize: isMobile ? 10 : 11, color: css.text3, marginTop: 2, fontFamily: "'Geist Mono', monospace" }}>
                      {formatTripDates(trip)}
                    </div>
                    {trip._shared && <div style={{ fontSize: 9, fontWeight: 600, color: "#3b82f6", marginTop: 2 }}>Shared by {trip._sharedBy}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 10, flexShrink: 0 }}>
                  {/* Expense total — desktop only */}
                  {!isMobile && tripTotal > 0 && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>${tripTotal.toLocaleString()}</div>
                      <div style={{ fontSize: 9, color: css.text3 }}>{tripExps.length} exp.</div>
                    </div>
                  )}
                  {/* Points — desktop only */}
                  {!isMobile && trip.estimatedPoints > 0 && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: css.gold, fontFamily: "'Geist Mono', monospace" }}>+{trip.estimatedPoints.toLocaleString()}</div>
                      <div style={{ fontSize: 9, color: css.text3 }}>pts</div>
                    </div>
                  )}
                  <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 600, color: sColor, background: sBg, border: `1px solid ${sColor}30`, borderRadius: 20, padding: isMobile ? "2px 8px" : "3px 10px", textTransform: "capitalize", flexShrink: 0 }}>{trip.status}</span>
                  {/* Add Expense */}
                  <button onClick={e => { e.stopPropagation(); setShowAddExpense(trip.id); }} style={{
                    padding: isMobile ? "4px 8px" : "5px 11px", borderRadius: 8, border: `1px solid ${css.accentBorder}`,
                    background: css.accentBg, color: css.accent, fontSize: isMobile ? 10 : 11, fontWeight: 600, cursor: "pointer", flexShrink: 0,
                  }}>+ Exp</button>
                  {/* Chevron expand */}
                  <span style={{ color: css.text3, fontSize: 12, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
                  {/* Desktop-only: Calendar, Edit, Delete */}
                  {!isMobile && <>
                    <button onClick={e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setCalendarPopover(calendarPopover?.id === trip.id ? null : { id: trip.id, top: r.bottom + 6, right: window.innerWidth - r.right }); }} style={{
                      padding: "5px 10px", borderRadius: 8, border: `1px solid ${css.border}`,
                      background: calendarPopover?.id === trip.id ? css.surface2 : "transparent",
                      color: css.text2, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Calendar
                    </button>
                    <button onClick={e => { e.stopPropagation(); openEditTrip(trip); }} style={{
                      width: 28, height: 28, borderRadius: 8, border: `1px solid ${css.border}`,
                      background: css.surface2, color: css.text2,
                      fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }} title="Edit trip">✎</button>
                    <button onClick={e => { e.stopPropagation(); removeTrip(trip.id); }} style={{
                      width: 28, height: 28, borderRadius: 8, border: `1px solid ${D ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)"}`,
                      background: "rgba(239,68,68,0.06)", color: "#ef4444",
                      fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }} title="Delete trip">×</button>
                  </>}
                </div>
              </div>

              {/* Expense drawer — expands inline */}
              {isExpanded && (
                <div style={{ borderTop: `1px solid ${css.border}`, background: css.surface2 }}>
                  {/* Drawer header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: css.text2 }}>
                      {tripExps.length > 0
                        ? <><span style={{ color: css.text, fontFamily: "'Geist Mono', monospace" }}>${tripTotal.toLocaleString()}</span> · {tripExps.length} expense{tripExps.length !== 1 ? "s" : ""}</>
                        : "No expenses yet"}
                      {isMobile && trip.estimatedPoints > 0 && <span style={{ marginLeft: 8, color: css.gold, fontFamily: "'Geist Mono', monospace" }}>· +{trip.estimatedPoints.toLocaleString()} pts</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button onClick={e => { e.stopPropagation(); setShowExpenseReport(trip.id); }} style={{
                        padding: "5px 12px", borderRadius: 7, border: `1px solid ${css.border}`,
                        background: "transparent", color: css.text2, fontSize: 11, fontWeight: 600, cursor: "pointer",
                      }}>Export Report ↗</button>
                      {isMobile && <>
                        <button onClick={e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setCalendarPopover(calendarPopover?.id === trip.id ? null : { id: trip.id, top: r.bottom + 6, right: window.innerWidth - r.right }); }} style={{
                          width: 30, height: 30, borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }} title="Add to calendar">📅</button>
                        <button onClick={e => { e.stopPropagation(); openEditTrip(trip); }} style={{
                          width: 30, height: 30, borderRadius: 8, border: `1px solid ${css.border}`, background: css.surface2, color: css.text2, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }} title="Edit trip">✎</button>
                        <button onClick={e => { e.stopPropagation(); removeTrip(trip.id); }} style={{
                          width: 30, height: 30, borderRadius: 8, border: `1px solid ${D ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)"}`, background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }} title="Delete trip">×</button>
                      </>}
                    </div>
                  </div>

                  {/* Category breakdown bar */}
                  {tripTotal > 0 && (
                    <div style={{ padding: "0 20px 10px" }}>
                      <div style={{ display: "flex", height: 5, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                        {catBreakdown.map((cat, i) => (
                          <div key={i} style={{ width: `${(cat.total / tripTotal) * 100}%`, background: cat.color }} title={`${cat.label}: $${cat.total}`} />
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {catBreakdown.map((cat, i) => (
                          <span key={i} style={{ fontSize: 10, color: css.text3, display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cat.color, flexShrink: 0, display: "inline-block" }} />
                            {cat.label} <span style={{ fontFamily: "'Geist Mono', monospace", color: css.text2 }}>${cat.total.toLocaleString()}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expense rows */}
                  <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {tripExps.sort((a, b) => new Date(a.date) - new Date(b.date)).map(exp => {
                      const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                      const usdAmt = exp.amount * (exp.fxRate || 1);
                      const isForeign = exp.currency && exp.currency !== "USD";
                      return (
                        <div key={exp.id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
                          background: css.surface, borderRadius: 8, padding: "9px 12px", border: `1px solid ${css.border}`,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 15, flexShrink: 0 }}>{cat?.icon || "•"}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 500, color: css.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description}</div>
                              <div style={{ fontSize: 10, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>
                                {exp.date}{exp.paymentMethod ? ` · ${exp.paymentMethod}` : ""}{exp.receipt ? " · 🧾" : ""}
                                {isForeign ? ` · ${exp.currency} @ ${exp.fxRate}` : ""}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: usdAmt === 0 ? css.success : css.text, fontFamily: "'Geist Mono', monospace" }}>
                                {usdAmt === 0 ? "Free" : `$${usdAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                              </div>
                              {isForeign && (
                                <div style={{ fontSize: 9, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>
                                  {exp.amount.toLocaleString()} {exp.currency}
                                </div>
                              )}
                            </div>
                            {canEdit && <button onClick={() => {
                              setNewExpense({ ...exp, amount: String(exp.amount), fxRate: exp.fxRate || 1 });
                              setEditExpenseId(exp.id);
                              setShowAddExpense(exp.tripId);
                            }} style={{
                              width: 22, height: 22, borderRadius: 6, border: "none",
                              background: css.accentBg, color: css.accent,
                              fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            }}>✎</button>}
                            {canEdit && <button onClick={() => removeExpense(exp.id)} style={{
                              width: 22, height: 22, borderRadius: 6, border: "none",
                              background: "rgba(239,68,68,0.08)", color: "#ef4444",
                              fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            }}>×</button>}
                          </div>
                        </div>
                      );
                    })}
                    {/* Add expense CTA in drawer */}
                    {canEdit && <button onClick={e => { e.stopPropagation(); setShowAddExpense(trip.id); }} style={{
                      width: "100%", padding: "8px 0", borderRadius: 8, border: `1px dashed ${css.border}`,
                      background: "transparent", color: css.text3, fontSize: 12, cursor: "pointer", marginTop: 4,
                    }}>+ Add expense</button>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {upcomingTripsFiltered.length === 0 && pastTripsFiltered.length === 0 && (
          <div style={{ textAlign: "center", padding: "56px 20px", color: css.text3, fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>—</div>
            {trips.length === 0 ? (
              <><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: css.text2, marginBottom: 8 }}>No trips yet</div>
              <button onClick={() => setShowCreateTrip(true)} style={{ background: "none", border: "none", color: css.accent, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Add your first trip →</button></>
            ) : "No trips match your filters"}
          </div>
        )}
      </div>

      {/* Past Trips Section */}
      {pastTripsFiltered.length > 0 && (
        <div>
          <button onClick={() => setPastTripsExpanded(p => !p)} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            background: "none", border: "none", cursor: "pointer", padding: "4px 0", marginBottom: 12, textAlign: "left",
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'Geist Mono', monospace" }}>
              Past Trips · {pastTripsFiltered.length}
            </span>
            <span style={{ fontSize: 12, color: css.text3, transform: pastTripsExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block", marginLeft: "auto" }}>▾</span>
          </button>
          {pastTripsExpanded && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pastTripsFiltered.map(trip => {
                const canEdit = !trip._shared || trip._permission === "edit";
                const prog = allPrograms.find(p => p.id === trip.program);
                const sColor = trip.status === "confirmed" ? css.success : trip.status === "planned" ? css.warning : css.accent;
                const sBg = trip.status === "confirmed" ? css.successBg : trip.status === "planned" ? css.warningBg : css.accentBg;
                const tripExps = getTripExpenses(trip.id);
                const tripTotal = getTripTotal(trip.id);
                const isExpanded = expenseViewTrip === trip.id;
                const catBreakdown = EXPENSE_CATEGORIES.map(cat => ({
                  ...cat, total: tripExps.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
                })).filter(c => c.total > 0);
                return (
                  <div key={trip.id} style={{
                    background: css.surface, border: `1px solid ${isExpanded ? css.accentBorder : css.border}`,
                    borderRadius: 14, overflow: "hidden", opacity: 0.85,
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap",
                      gap: 12, padding: "16px 20px", cursor: "pointer",
                    }} onClick={() => setExpenseViewTrip(isExpanded ? null : trip.id)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", flex: 1, minWidth: 0 }} onClick={e => { e.stopPropagation(); setTripDetailId(trip.id); setTripDetailSegIdx(0); }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                          background: prog ? `${prog.color}15` : css.surface2, border: `1px solid ${prog ? prog.color + "25" : css.border}`,
                          flexShrink: 0,
                        }}>
                          {(() => { const segs = trip.segments; if (segs && segs.length > 1) return ""; const t = (segs && segs[0]?.type) || trip.type; return ""; })()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          {trip.tripName && <div style={{ fontSize: 11, fontWeight: 600, color: css.accent, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{trip.tripName}</div>}
                          <div style={{ fontSize: 14, fontWeight: 600, color: css.text }}>{trip.location || trip.route || trip.property || trip.tripName || trip.trip_name || "Trip"}</div>
                          <div style={{ fontSize: 11, color: css.text3, marginTop: 2, fontFamily: "'Geist Mono', monospace" }}>
                            {formatTripDates(trip)}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, color: css.accent, fontWeight: 600, opacity: 0.6, flexShrink: 0 }}>View →</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 10, flexShrink: 0 }}>
                        {!isMobile && tripTotal > 0 && (
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>${tripTotal.toLocaleString()}</div>
                            <div style={{ fontSize: 9, color: css.text3 }}>{tripExps.length} exp.</div>
                          </div>
                        )}
                        {!isMobile && trip.estimatedPoints > 0 && (
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: css.gold, fontFamily: "'Geist Mono', monospace" }}>+{trip.estimatedPoints.toLocaleString()}</div>
                            <div style={{ fontSize: 9, color: css.text3 }}>pts</div>
                          </div>
                        )}
                        <span style={{ fontSize: 10, fontWeight: 600, color: sColor, background: sBg, border: `1px solid ${sColor}30`, borderRadius: 20, padding: "3px 10px", textTransform: "capitalize" }}>{trip.status}</span>
                        <button onClick={e => { e.stopPropagation(); setShowAddExpense(trip.id); }} style={{
                          padding: "5px 11px", borderRadius: 8, border: `1px solid ${css.accentBorder}`,
                          background: css.accentBg, color: css.accent, fontSize: 11, fontWeight: 600, cursor: "pointer",
                        }}>+ Exp</button>
                        <span style={{ color: css.text3, fontSize: 12, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
                        {!isMobile && <>
                          <button onClick={e => { e.stopPropagation(); openEditTrip(trip); }} style={{
                            width: 28, height: 28, borderRadius: 8, border: `1px solid ${css.border}`,
                            background: css.surface2, color: css.text2,
                            fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }} title="Edit trip">✎</button>
                          <button onClick={e => { e.stopPropagation(); removeTrip(trip.id); }} style={{
                            width: 28, height: 28, borderRadius: 8, border: `1px solid ${D ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)"}`,
                            background: "rgba(239,68,68,0.06)", color: "#ef4444",
                            fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }} title="Delete trip">×</button>
                        </>}
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ borderTop: `1px solid ${css.border}`, background: css.surface2 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", gap: 10, flexWrap: "wrap" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: css.text2 }}>
                            {tripExps.length > 0
                              ? <><span style={{ color: css.text, fontFamily: "'Geist Mono', monospace" }}>${tripTotal.toLocaleString()}</span> · {tripExps.length} expense{tripExps.length !== 1 ? "s" : ""}</>
                              : "No expenses yet"}
                            {isMobile && trip.estimatedPoints > 0 && <span style={{ marginLeft: 8, color: css.gold, fontFamily: "'Geist Mono', monospace" }}>· +{trip.estimatedPoints.toLocaleString()} pts</span>}
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button onClick={e => { e.stopPropagation(); setShowExpenseReport(trip.id); }} style={{
                              padding: "5px 12px", borderRadius: 7, border: `1px solid ${css.border}`,
                              background: "transparent", color: css.text2, fontSize: 11, fontWeight: 600, cursor: "pointer",
                            }}>Export Report ↗</button>
                            {isMobile && <>
                              <button onClick={e => { e.stopPropagation(); openEditTrip(trip); }} style={{
                                width: 30, height: 30, borderRadius: 8, border: `1px solid ${css.border}`, background: css.surface2, color: css.text2, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              }} title="Edit trip">✎</button>
                              <button onClick={e => { e.stopPropagation(); removeTrip(trip.id); }} style={{
                                width: 30, height: 30, borderRadius: 8, border: `1px solid ${D ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)"}`, background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              }} title="Delete trip">×</button>
                            </>}
                          </div>
                        </div>
                        {tripTotal > 0 && (
                          <div style={{ padding: "0 20px 10px" }}>
                            <div style={{ display: "flex", height: 5, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                              {catBreakdown.map((cat, i) => (
                                <div key={i} style={{ width: `${(cat.total / tripTotal) * 100}%`, background: cat.color }} title={`${cat.label}: $${cat.total}`} />
                              ))}
                            </div>
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                              {catBreakdown.map((cat, i) => (
                                <span key={i} style={{ fontSize: 10, color: css.text3, display: "flex", alignItems: "center", gap: 4 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: cat.color, flexShrink: 0, display: "inline-block" }} />
                                  {cat.label} <span style={{ fontFamily: "'Geist Mono', monospace", color: css.text2 }}>${cat.total.toLocaleString()}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                          {tripExps.sort((a, b) => new Date(a.date) - new Date(b.date)).map(exp => {
                            const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                            const usdAmt = exp.amount * (exp.fxRate || 1);
                            const isForeign = exp.currency && exp.currency !== "USD";
                            return (
                              <div key={exp.id} style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
                                background: css.surface, borderRadius: 8, padding: "9px 12px", border: `1px solid ${css.border}`,
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                                  <span style={{ fontSize: 15, flexShrink: 0 }}>{cat?.icon || "•"}</span>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: css.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description}</div>
                                    <div style={{ fontSize: 10, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>
                                      {exp.date}{exp.paymentMethod ? ` · ${exp.paymentMethod}` : ""}{exp.receipt ? " · 🧾" : ""}
                                      {isForeign ? ` · ${exp.currency} @ ${exp.fxRate}` : ""}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                  <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: usdAmt === 0 ? css.success : css.text, fontFamily: "'Geist Mono', monospace" }}>
                                      {usdAmt === 0 ? "Free" : `$${usdAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    </div>
                                    {isForeign && <div style={{ fontSize: 9, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>{exp.amount.toLocaleString()} {exp.currency}</div>}
                                  </div>
                                  <button onClick={() => { setNewExpense({ ...exp, amount: String(exp.amount), fxRate: exp.fxRate || 1 }); setEditExpenseId(exp.id); setShowAddExpense(exp.tripId); }} style={{
                                    width: 22, height: 22, borderRadius: 6, border: "none",
                                    background: css.accentBg, color: css.accent,
                                    fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>✎</button>
                                  <button onClick={() => removeExpense(exp.id)} style={{
                                    width: 22, height: 22, borderRadius: 6, border: "none",
                                    background: "rgba(239,68,68,0.08)", color: "#ef4444",
                                    fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>×</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </>}

      {/* Global calendar popover — fixed position so it escapes overflow:hidden cards */}
      {calendarPopover && (() => {
        const trip = trips.find(t => t.id === calendarPopover.id);
        if (!trip) return null;
        return (
          <>
            <div onClick={() => setCalendarPopover(null)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
            <div style={{ position: "fixed", top: calendarPopover.top, right: calendarPopover.right, zIndex: 200, background: css.surface, border: `1px solid ${css.border}`, borderRadius: 10, padding: 6, minWidth: 175, boxShadow: "0 8px 28px rgba(0,0,0,0.35)" }}>
              <button onClick={() => setCalendarPopover(null)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "6px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, color: css.text3, background: "transparent", border: "none", cursor: "pointer", marginBottom: 2 }}
                onMouseEnter={e => e.currentTarget.style.background = css.surface2}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >Cancel</button>
              <div style={{ height: 1, background: css.border, margin: "2px 6px 4px" }} />
              <a href={getTripGoogleCalUrl(trip)} target="_blank" rel="noopener noreferrer" onClick={() => setCalendarPopover(null)}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 7, fontSize: 12, fontWeight: 500, color: css.text, textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.background = css.surface2}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <svg width="14" height="14" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M43.6 20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/>
                  <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z"/>
                  <path fill="#FBBC05" d="M24 44c5.2 0 9.9-1.8 13.6-4.7l-6.3-5.2C29.4 35.7 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.7 39.6 16.4 44 24 44z"/>
                  <path fill="#EA4335" d="M43.6 20H24v8h11.3c-.7 2.1-2 3.9-3.7 5.1l6.3 5.2C41.4 34.9 44 29.8 44 24c0-1.3-.1-2.7-.4-4z"/>
                </svg>
                Google Calendar
              </a>
              <a href={getTripOutlookUrl(trip)} target="_blank" rel="noopener noreferrer" onClick={() => setCalendarPopover(null)}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 7, fontSize: 12, fontWeight: 500, color: css.text, textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.background = css.surface2}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <svg width="14" height="14" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                  <rect width="48" height="48" rx="4" fill="#0078D4"/>
                  <rect x="6" y="10" width="22" height="28" rx="2" fill="white" opacity="0.95"/>
                  <rect x="28" y="18" width="14" height="20" rx="1" fill="white" opacity="0.7"/>
                  <line x1="10" y1="18" x2="24" y2="18" stroke="#0078D4" strokeWidth="2"/>
                  <line x1="10" y1="23" x2="24" y2="23" stroke="#0078D4" strokeWidth="2"/>
                  <line x1="10" y1="28" x2="24" y2="28" stroke="#0078D4" strokeWidth="2"/>
                </svg>
                Outlook
              </a>
              <div style={{ height: 1, background: css.border, margin: "4px 6px" }} />
              <button onClick={() => { downloadTripICS(trip); setCalendarPopover(null); }}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 7, fontSize: 12, fontWeight: 500, color: css.text, width: "100%", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                onMouseEnter={e => e.currentTarget.style.background = css.surface2}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download .ics
              </button>
            </div>
          </>
        );
      })()}
    </div>
  );
  };

