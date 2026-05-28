import React from "react";
import { LANDMARK_FALLBACK_PHOTOS } from "../constants/airline-data";
import { LOUNGE_DATABASE, AMENITY_ICONS, AMENITY_LABELS } from "../constants/lounges";
import { expenseUSD } from "../utils/expenseUsd";
import SegmentDropZone from "../components/SegmentDropZone";
import ReportedBadge from "../components/ReportedBadge";
import DayTimeline from "../components/DayTimeline";
import TripSelector from "../components/TripSelector";
// TripSearchBar removed — the global Ask Continuum bar at the bottom of the
// app handles trip lookup ("show me my Tokyo trip") plus open-ended Q&A.
import { cityPhoto } from "../constants/cityPhotos";

export function renderTrips(s) {
  const {
    css, isMobile, user, trips, expenses, sharedTrips, linkedAccounts, allPrograms,
    darkMode, tripDetailId, setTripDetailId, tripDetailSegIdx, setTripDetailSegIdx, tripDetailFullView, setTripDetailFullView,
    expenseViewTrip, setExpenseViewTrip, expandedCardId, setExpandedCardId,
    expandedSegmentKey, setExpandedSegmentKey,
    hideShared, setHideShared,
    calendarPopover, setCalendarPopover,
    setShowAddExpense, setNewExpense, setEditExpenseId, setShowAddSegment, setShowCreateTrip,
    setShowExpenseReport, setShowShareModal, setShareEmail, setShareStatus, setSharePermission,
    openEditTrip, removeTrip, removeExpense, editSegment, deleteSegment, moveSegment, showMoveSegment, setShowMoveSegment, prefillSegmentFromAttachment, showConfirm,
    getTripExpenses, getTripTotal, getTripName, formatTripDates,
    getTripGoogleCalUrl, getTripOutlookUrl, downloadTripICS,
    EXPENSE_CATEGORIES, SegIcon,
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
    supabase, setExpenses, upcomingTripsFiltered, pastTripsFiltered,
    resolveArrivalDate, resolveCityForDate, resolveHotelForDate, weatherIcon, exportMonthPDF,
    expenseReportMembership, openReport,
  } = s;
  const handleAddTrip = () => setShowCreateTrip(true);
  const D = darkMode;
    const grandTotal = expenses.reduce((s, e) => s + expenseUSD(e), 0);

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
      const tripTotal = tripExps.reduce((s, e) => s + expenseUSD(e), 0);
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

      // Build continuous date range from first to last date, filling gaps with hotel stays
      const allSegDates = Object.keys(segsByDate).filter(d => d !== "undated").sort();
      const tripStartDate = trip.date || allSegDates[0] || "";
      const tripEndDate = (() => {
        let last = allSegDates[allSegDates.length - 1] || "";
        // Extend to hotel checkout dates
        realSegs.filter(s => s.type === "hotel" || s.type === "accommodation").forEach(s => {
          const co = s.checkoutDate || (s.date && s.nights ? (() => { const d = new Date(s.date + "T12:00:00"); d.setDate(d.getDate() + (parseInt(s.nights) || 1)); return d.toISOString().slice(0, 10); })() : "");
          if (co > last) last = co;
        });
        return last;
      })();

      // Generate every date between start and end
      const sortedDates = (() => {
        if (!tripStartDate) return allSegDates.length > 0 ? allSegDates : ["undated"];
        const dates = [];
        const start = new Date(tripStartDate + "T12:00:00");
        const end = tripEndDate ? new Date(tripEndDate + "T12:00:00") : start;
        const d = new Date(start);
        while (d <= end) {
          dates.push(d.toISOString().slice(0, 10));
          d.setDate(d.getDate() + 1);
        }
        // Add any segment dates outside the range (undated, etc.)
        allSegDates.forEach(sd => { if (!dates.includes(sd)) dates.push(sd); });
        return dates;
      })();

      // For each date, ensure hotel stays spanning that date appear as virtual entries
      const hotelSegs = realSegs.filter(s => s.type === "hotel" || s.type === "accommodation");
      sortedDates.forEach(dateStr => {
        if (dateStr === "undated") return;
        if (!segsByDate[dateStr]) segsByDate[dateStr] = [];
        // Check if any hotel covers this date
        hotelSegs.forEach(h => {
          const checkin = h.date || "";
          const checkout = h.checkoutDate || (checkin && h.nights ? (() => { const d = new Date(checkin + "T12:00:00"); d.setDate(d.getDate() + (parseInt(h.nights) || 1)); return d.toISOString().slice(0, 10); })() : "");
          if (checkin && checkout && dateStr >= checkin && dateStr < checkout) {
            // Only add if this hotel isn't already listed on this date
            const alreadyListed = segsByDate[dateStr].some(s => (s.type === "hotel" || s.type === "accommodation") && s.property === h.property && s.date === h.date);
            if (!alreadyListed) {
              segsByDate[dateStr].push({ ...h, _virtualStay: true, _stayNight: Math.floor((new Date(dateStr + "T12:00:00") - new Date(checkin + "T12:00:00")) / 86400000) + 1 });
            }
          }
        });
      });

      // Editorial palette matching itinerary.html
      const ev = {
        bone: D ? "#1a1a1a" : "#fff", paper: D ? "#222" : "#fff", cream: D ? "rgba(255,255,255,0.08)" : "#E2DCCE",
        stone: D ? "#8a8a8a" : "#857A66", taupe: D ? "#999" : "#6B6458", graphite: D ? "#ccc" : "#2C2A26", ink: D ? "#f0ece6" : "#15130F",
        accent: "#C8553D", accentWash: D ? "rgba(200,85,61,0.12)" : "#F5E4DC",
        sky: "#6B8BA3", skyWash: D ? "rgba(107,139,163,0.12)" : "#DCE4EB",
        plum: "#8B6B7A", plumWash: D ? "rgba(139,107,122,0.12)" : "#EBDDE2",
        moss: "#6B7A5A", mossWash: D ? "rgba(107,122,90,0.12)" : "#E4E8DD",
        gold: "#B8924A", goldWash: D ? "rgba(184,146,74,0.12)" : "#F0E7D2",
        serif: "'Fraunces', serif", sans: "'Inter Tight', sans-serif", mono: "'JetBrains Mono', monospace",
      };

      // Segment type styling — editorial colors
      const segTypeInfo = (type) => {
        const map = {
          flight: { color: ev.sky, wash: ev.skyWash, label: "Flight" },
          hotel: { color: ev.plum, wash: ev.plumWash, label: "Hotel" },
          accommodation: { color: ev.plum, wash: ev.plumWash, label: "Accommodation" },
          activity: { color: ev.moss, wash: ev.mossWash, label: "Activity" },
          meeting: { color: ev.accent, wash: ev.accentWash, label: "Meeting" },
          restaurant: { color: ev.gold, wash: ev.goldWash, label: "Dining" },
          dining: { color: ev.gold, wash: ev.goldWash, label: "Dining" },
          train: { color: ev.gold, wash: ev.goldWash, label: "Train" },
          rental: { color: ev.accent, wash: ev.accentWash, label: "Rental Car" },
          cruise: { color: ev.sky, wash: ev.skyWash, label: "Cruise" },
          ferry: { color: ev.sky, wash: ev.skyWash, label: "Ferry" },
          transfer: { color: ev.stone, wash: "transparent", label: "Transfer" },
          transit: { color: ev.stone, wash: "transparent", label: "Transit" },
          lounge: { color: ev.gold, wash: ev.goldWash, label: "Lounge" },
        };
        return map[type] || { color: ev.accent, wash: ev.accentWash, label: type || "Item" };
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
        return <a href={mapsUrl(location)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: ev.accent, textDecoration: "none", borderBottom: `1px dashed ${ev.accent}40`, transition: "border-color 0.12s" }} onMouseEnter={e => e.currentTarget.style.borderColor = ev.accent} onMouseLeave={e => e.currentTarget.style.borderColor = `${ev.accent}40`}>{children || location}</a>;
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

      // Day number words
      const dayWords = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];

      // Compute overview metrics
      const flightCount = realSegs.filter(s => s.type === "flight").length;
      const hotelCount = realSegs.filter(s => s.type === "hotel" || s.type === "accommodation").length;
      const totalNights = realSegs.filter(s => s.type === "hotel" || s.type === "accommodation").reduce((sum, s) => sum + (parseInt(s.nights) || 0), 0);
      const totalEvents = realSegs.length;
      const tripCities = new Set();
      realSegs.forEach(s => { if (s.arrivalAirport) tripCities.add(s.arrivalAirport); if (s.location) tripCities.add(s.location.split(",")[0].trim()); });

      return (
        <div style={{ maxWidth: 900, margin: "0 auto", fontFamily: ev.sans, color: ev.ink }}>
          {/* Back link — editorial */}
          <a onClick={() => setTripDetailId(null)} style={{
            display: "inline-flex", alignItems: "center", gap: 8, fontFamily: ev.mono, fontSize: 11,
            letterSpacing: "0.12em", textTransform: "uppercase", color: ev.accent, textDecoration: "none",
            marginBottom: 24, cursor: "pointer", transition: "gap 0.3s",
          }}
            onMouseEnter={e => e.currentTarget.style.gap = "12px"}
            onMouseLeave={e => e.currentTarget.style.gap = "8px"}>
            ← Back to Trips
          </a>

          {/* ── Trip Header — editorial ──
              On mobile, stack vertically — when the actions cluster contains a
              long "Shared by ..." pill, side-by-side flex squeezes the title
              column to a few px wide and renders the title one letter per line. */}
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-end", flexWrap: "wrap", gap: isMobile ? 14 : 24, paddingBottom: isMobile ? 20 : 32, marginBottom: isMobile ? 20 : 32, borderBottom: `1px solid ${ev.cream}` }}>
            <div style={{ flex: isMobile ? "0 0 auto" : 1, minWidth: 0, width: isMobile ? "100%" : "auto" }}>
              {/* Eyebrow */}
              <div style={{ fontFamily: ev.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: ev.accent, marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 24, height: 1, background: ev.accent, display: "inline-block" }} />
                {trip.tripName || formatTripDates(trip)}
              </div>
              {/* Title */}
              <h1 style={{ fontFamily: ev.serif, fontSize: isMobile ? 26 : "clamp(48px, 6vw, 72px)", fontWeight: 300, lineHeight: isMobile ? 1.1 : 0.95, letterSpacing: "-0.035em", color: ev.ink, margin: "0 0 16px", overflowWrap: "break-word" }}>
                {(trip.location || trip.route || "Trip").split(",").map((part, i) => i === 0 ? <span key={i}>{part.trim()}</span> : <em key={i} style={{ fontStyle: "italic", color: ev.taupe, fontWeight: 400, whiteSpace: "nowrap" }}>{" & "}{part.trim()}</em>)}
              </h1>
              {/* Meta */}
              <div style={{ display: "flex", gap: isMobile ? 10 : 24, alignItems: "center", fontFamily: ev.serif, fontSize: isMobile ? 13 : 16, color: ev.taupe, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width={isMobile ? 13 : 16} height={isMobile ? 13 : 16} viewBox="0 0 24 24" fill="none" stroke={ev.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  {formatTripDates(trip)}
                </div>
                {tripCities.size > 0 && <>
                  <div style={{ width: 3, height: 3, background: ev.stone, borderRadius: "50%" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width={isMobile ? 13 : 16} height={isMobile ? 13 : 16} viewBox="0 0 24 24" fill="none" stroke={ev.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {tripCities.size} {tripCities.size === 1 ? "city" : "cities"}{totalNights > 0 ? ` · ${totalNights} nights` : ""}
                  </div>
                </>}
                {(flightCount > 0 || hotelCount > 0) && <>
                  <div style={{ width: 4, height: 4, background: ev.stone, borderRadius: "50%" }} />
                  <span>{[flightCount > 0 ? `${flightCount} flight${flightCount > 1 ? "s" : ""}` : "", hotelCount > 0 ? `${hotelCount} hotel${hotelCount > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · ")}</span>
                </>}
              </div>
            </div>
            {/* Actions */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", paddingBottom: 12 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", background: ev.mossWash, border: `1px solid ${ev.moss}`, fontFamily: ev.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: ev.moss, fontWeight: 500 }}>
                <span style={{ width: 6, height: 6, background: ev.moss, borderRadius: "50%" }} />
                {trip.status || "Planned"}
              </div>
              {canEdit && <button onClick={() => openEditTrip(trip)} style={{ padding: "10px 18px", background: "transparent", border: `1px solid ${ev.cream}`, fontFamily: ev.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: ev.taupe, cursor: "pointer", transition: "all 0.25s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ev.ink; e.currentTarget.style.color = ev.ink; e.currentTarget.style.background = ev.paper; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ev.cream; e.currentTarget.style.color = ev.taupe; e.currentTarget.style.background = "transparent"; }}>Edit</button>}
              {!trip._shared && <button onClick={() => {
                setShowShareModal(trip.id); setShareEmail(""); setShareStatus(""); setSharePermission("read");
              }} style={{ padding: "10px 18px", background: ev.ink, border: `1px solid ${ev.ink}`, fontFamily: ev.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: ev.bone, cursor: "pointer", transition: "all 0.25s" }}
                onMouseEnter={e => { e.currentTarget.style.background = ev.accent; e.currentTarget.style.borderColor = ev.accent; }}
                onMouseLeave={e => { e.currentTarget.style.background = ev.ink; e.currentTarget.style.borderColor = ev.ink; }}>Share</button>}
              {isShared && <span style={{ fontFamily: ev.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: ev.taupe, padding: "10px 16px", border: `1px solid ${ev.cream}` }}>
                Shared by {trip._sharedBy} · {isReadOnly ? "View only" : "Can edit"}
              </span>}
            </div>
          </div>

          {/* ── Itinerary at a glance · grouped by date ──
              Each day with at least one event becomes a single row: orange
              date column on the left, stacked event lines on the right. Days
              with no events are omitted (the visible gap conveys "rest day").
              Hotels render once on their check-in date with a night count, so
              a 3-night stay isn't repeated three times. Each event line stays
              clickable — jumps to that day in the timeline below. */}
          {realSegs.length > 0 && (() => {
            const fmtMD = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
            const fmtDow = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }) : "";
            const cleanTime = (t) => (t || "").toString().trim().toLowerCase().replace(/\s+/g, "");

            // Group displayable segments by their primary date (check-in for
            // hotels, departure for flights/etc).
            const byDate = new Map();
            realSegs.forEach((seg, i) => {
              const t = (seg.type || "").toString().toLowerCase();
              if (t === "transfer" || t === "transit") return;
              const d = seg.date || "";
              if (!d) return;
              if (!byDate.has(d)) byDate.set(d, []);
              byDate.get(d).push({ seg, i });
            });
            const dayGroups = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
            // Within each day, order events chronologically by their own time
            // (departure for flights, check-in for hotels, start/pickup for the
            // rest). Robust to "20:05", "7:00", and "7:00 AM" formats.
            const toMins = (seg) => {
              const raw = (seg.departureTime || seg.startTime || seg.time || seg.checkinTime || seg.pickupTime || "").toString().trim();
              const m = raw.match(/(\d{1,2}):(\d{2})/);
              if (!m) return 9999;
              let h = parseInt(m[1], 10); const min = parseInt(m[2], 10);
              if (/pm/i.test(raw) && h < 12) h += 12;
              if (/am/i.test(raw) && h === 12) h = 0;
              return h * 60 + min;
            };
            dayGroups.forEach(([, items]) => items.sort((a, b) => toMins(a.seg) - toMins(b.seg)));
            if (dayGroups.length === 0) return null;

            const renderEvent = ({ seg, i }) => {
              const info = segTypeInfo(seg.type);
              const t = (seg.type || "").toString().toLowerCase();
              const isHotel = t === "hotel" || t === "accommodation";
              const isFlight = t === "flight";

              let main = "";
              let sub = "";
              if (isHotel) {
                const nights = parseInt(seg.nights) || 0;
                main = seg.property || seg.name || "Hotel";
                sub = nights ? `${nights} nt${nights === 1 ? "" : "s"}` : "";
              } else if (isFlight) {
                const route = seg.route || `${seg.departureAirport || ""} → ${seg.arrivalAirport || ""}`.trim().replace(/^→\s*$/, "");
                const dep = cleanTime(seg.departureTime);
                const arr = cleanTime(seg.arrivalTime);
                const overnight = seg.arrivalDate && seg.date && seg.arrivalDate !== seg.date;
                const timeRange = dep && arr ? `${dep} - ${arr}${overnight ? " +1" : ""}` : (dep || arr);
                main = [seg.flightNumber, route].filter(Boolean).join(" · ");
                sub = [seg.airline, timeRange].filter(Boolean).join(" · ");
              } else {
                main = segTitle ? segTitle(seg) : (seg.title || seg.name || seg.activityName || seg.restaurantName || info.label);
                sub = segSubtitle ? (segSubtitle(seg) || "") : "";
              }

              const segKey = `${trip.id}|${i}`;
              const handleClick = (e) => {
                e.stopPropagation();
                const dayIdx = sortedDates.indexOf(seg.date);
                if (dayIdx >= 0) setTripDetailSegIdx?.(dayIdx);
                setExpandedSegmentKey?.(segKey);
                setTimeout(() => {
                  const el = document.getElementById(`seg-card-${segKey.replace("|", "-")}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 80);
              };

              return (
                <button key={i} onClick={handleClick} style={{
                  display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: 10,
                  background: "transparent", border: "none", padding: "3px 0",
                  textAlign: "left", cursor: "pointer", width: "100%",
                  fontFamily: "inherit", minWidth: 0,
                  transition: "color 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = ev.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "inherit"; }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: info.wash, display: "grid", placeItems: "center", flexShrink: 0, marginTop: isMobile ? 1 : 0 }}>
                    <SegIcon type={seg.type} size={9} color={info.color} />
                  </span>
                  {/* On narrow phones, stack the meta (airline · times) onto its
                      own line so flight times are never clipped by ellipsis. */}
                  <span style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 1 : 0, minWidth: 0, flex: 1 }}>
                    <span style={{
                      fontFamily: ev.serif, fontSize: isMobile ? 12 : 13,
                      color: "currentColor", lineHeight: 1.3,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      minWidth: 0, maxWidth: "100%",
                    }}>{main}</span>
                    {sub && <span style={{ fontFamily: ev.mono, fontSize: isMobile ? 10 : 11, color: ev.taupe, marginLeft: isMobile ? 0 : 8, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{sub}</span>}
                  </span>
                </button>
              );
            };

            return (
              <div style={{ background: ev.paper, border: `1px solid ${ev.cream}`, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: isMobile ? "12px 14px 8px" : "14px 20px 10px", borderBottom: `1px solid ${ev.cream}` }}>
                  <span style={{ width: 18, height: 1, background: ev.accent, display: "inline-block" }} />
                  <span style={{ fontFamily: ev.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: ev.taupe }}>Itinerary</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {dayGroups.map(([dateStr, items], di) => {
                    const isLast = di === dayGroups.length - 1;
                    return (
                      <div key={dateStr} style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "92px 1fr" : "120px 1fr",
                        gap: isMobile ? 10 : 16,
                        padding: isMobile ? "10px 14px" : "12px 20px",
                        borderBottom: isLast ? "none" : `1px solid ${ev.cream}`,
                        alignItems: "start",
                      }}>
                        <span style={{
                          fontFamily: ev.mono, fontSize: isMobile ? 10 : 11, fontWeight: 600,
                          letterSpacing: "0.08em", textTransform: "uppercase",
                          color: ev.accent, fontVariantNumeric: "tabular-nums",
                          whiteSpace: "nowrap", paddingTop: 3,
                        }}>
                          {fmtDow(dateStr)} {fmtMD(dateStr)}
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                          {items.map(renderEvent)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ── Add flight / hotel / meeting / activity (between summary and timeline) ── */}
          {canEdit && (
            <SegmentDropZone
              ev={ev}
              css={css}
              isMobile={isMobile}
              onClickManualAdd={() => { if (trip.date) lastDateRef.current = trip.date; setShowAddSegment(trip.id); }}
              onParsed={(parsed) => {
                if (trip.date) lastDateRef.current = trip.date;
                prefillSegmentFromAttachment?.(trip.id, parsed);
              }}
            />
          )}

          {/* ── By the hour — daily timeline (replaces the old day-by-day view) ── */}
          {realSegs.length > 0 ? (
            <DayTimeline
              ev={ev} isMobile={isMobile} D={D} trip={trip} realSegs={realSegs}
              sortedDates={sortedDates} tripStartDate={tripStartDate}
              AIRPORT_CITY={AIRPORT_CITY} SegIcon={SegIcon}
              segTypeInfo={segTypeInfo} segTitle={segTitle} segSubtitle={segSubtitle}
              resolveArrivalDate={resolveArrivalDate} resolveCityForDate={resolveCityForDate} resolveHotelForDate={resolveHotelForDate}
              onOpenSeg={(idx) => setExpandedSegmentKey?.(`${trip.id}|${idx}`)}
            />
          ) : (
            <div style={{ padding: "48px 20px", textAlign: "center", background: ev.paper, border: `1px solid ${ev.cream}` }}>
              <p style={{ fontFamily: ev.serif, fontStyle: "italic", fontSize: 16, color: ev.taupe, margin: "0 0 8px" }}>No itinerary items yet</p>
              <p style={{ fontFamily: ev.mono, fontSize: 10, color: ev.stone, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Add flights, hotels, restaurants and more to build your day-by-day plan</p>
            </div>
          )}

          {/* ── Booking detail modal (opens from the timeline, summary, or booking list) ── */}
          {(() => {
            if (!expandedSegmentKey || !String(expandedSegmentKey).startsWith(`${trip.id}|`)) return null;
            const segIdx = parseInt(String(expandedSegmentKey).split("|")[1], 10);
            const seg = realSegs[segIdx];
            if (!seg) return null;
            const info = segTypeInfo(seg.type);
            const live = seg.type === "flight" ? getFlightLiveStatus(seg) : null;
            const close = () => setExpandedSegmentKey?.(null);
            return (
              <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 24 }}>
                <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, maxHeight: isMobile ? "88vh" : "86vh", display: "flex", flexDirection: "column", overflow: "hidden", background: ev.bone, border: `1px solid ${ev.cream}`, borderRadius: isMobile ? "18px 18px 0 0" : 16, boxShadow: "0 24px 70px rgba(0,0,0,0.4)" }}>
                  {/* Header — now carries a quick Edit affordance next to Close so
                      it's discoverable without scrolling to the bottom. */}
                  <div style={{ flexShrink: 0, background: ev.bone, borderBottom: `1px solid ${ev.cream}`, padding: isMobile ? "16px 18px" : "18px 22px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <span style={{ width: 38, height: 38, borderRadius: "50%", background: info.wash, display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <SegIcon type={seg.type} size={18} color={info.color} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: ev.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: info.color, marginBottom: 3 }}>{info.label}{seg.type === "flight" && seg.airline ? ` · ${seg.airline}` : ""}</div>
                        <div style={{ fontFamily: ev.serif, fontSize: isMobile ? 19 : 22, fontWeight: 500, color: ev.ink, lineHeight: 1.15 }}>{seg.type === "flight" && seg.flightNumber ? `${seg.flightNumber} — ` : ""}{segTitle(seg)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      {canEdit && (
                        <button onClick={() => { close(); editSegment(trip.id, segIdx); }} title="Edit"
                          style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${ev.cream}`, background: "transparent", color: ev.ink, cursor: "pointer", display: "grid", placeItems: "center", transition: "all 0.18s" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = ev.ink; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = ev.cream; }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        </button>
                      )}
                      <button onClick={close} title="Close" style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${ev.cream}`, background: "transparent", color: ev.taupe, cursor: "pointer", display: "grid", placeItems: "center" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                  {/* Scrollable detail body */}
                  <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: isMobile ? "16px 18px 18px" : "18px 22px 20px" }}>
                    <SegmentDetailsPanel seg={seg} ev={ev} isMobile={isMobile} liveStatus={live} />
                    {seg.notes && <div style={{ marginTop: 14, fontFamily: ev.serif, fontSize: 14, color: ev.taupe, lineHeight: 1.5 }}>{seg.notes}</div>}
                  </div>
                  {/* Sticky action footer — always visible, no scrolling needed. */}
                  {canEdit && (
                    <div style={{ flexShrink: 0, display: "flex", gap: 8, padding: isMobile ? "12px 18px calc(12px + env(safe-area-inset-bottom))" : "14px 22px", borderTop: `1px solid ${ev.cream}`, background: ev.bone }}>
                      <button onClick={() => { close(); editSegment(trip.id, segIdx); }} style={{ flex: 1, padding: "12px 0", border: "none", background: ev.ink, color: ev.bone, fontFamily: ev.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", borderRadius: 8, fontWeight: 600 }}>Edit</button>
                      <button onClick={() => { close(); setShowMoveSegment?.({ tripId: trip.id, segIdx }); }} style={{ flex: 1, padding: "12px 0", border: `1px solid ${ev.cream}`, background: ev.paper, color: ev.ink, fontFamily: ev.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", borderRadius: 8 }}>Move</button>
                      <button onClick={() => { showConfirm("Delete this item?", () => { deleteSegment(trip.id, segIdx); close(); }); }} style={{ flex: 1, padding: "12px 0", border: `1px solid rgba(200,85,61,0.3)`, background: "rgba(200,85,61,0.06)", color: "#C8553D", fontFamily: ev.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", borderRadius: 8 }}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          {/* ── Booking Management — editorial ── */}
          {realSegs.length > 0 && (() => {
            const bookings = [];
            const seenConf = new Set();
            const airlineByName = {};
            Object.entries(AIRLINE_CS).forEach(([k, v]) => { airlineByName[v.name.toLowerCase()] = { ...v, key: k }; });
            const codeMap = { AA: "aa", DL: "dl", UA: "ua", WN: "sw", B6: "b6", AS: "as", F9: "frontier", NK: "spirit", AF: "flying_blue", KL: "flying_blue", BA: "ba_avios", AC: "aeroplan", EK: "ek", TK: "tk", QF: "qantas_ff", SQ: "sq", CX: "cx", LH: "lh", LX: "lx", OS: "os", SK: "sk", AY: "ay", IB: "ib", JL: "jl", NH: "nh", KE: "korean_skypass", QR: "qr", EY: "etihad_guest", VS: "virgin_fc", MH: "mh", BR: "br", CI: "ci", TG: "tg" };
            const hotelKeywords = [
              { re: /ritz.?carlton/i, key: "ritz" }, { re: /marriott|westin|sheraton|w hotel|st\.?\s*regis|courtyard|residence\s+inn|fairfield|springhill|aloft/i, key: "marriott" },
              { re: /hilton|waldorf|conrad|doubletree|hampton|embassy\s+suites|canopy|curio|tapestry|lxr/i, key: "hilton" }, { re: /hyatt|andaz|park\s+hyatt|grand\s+hyatt|thompson|alila|caption/i, key: "hyatt" },
              { re: /ihg|intercontinental|holiday\s+inn|crowne\s+plaza|kimpton|indigo|even\s+hotel|staybridge|candlewood/i, key: "ihg" }, { re: /mandarin\s+oriental/i, key: "mandarin" },
              { re: /four\s+seasons/i, key: "four_seasons" }, { re: /peninsula/i, key: "peninsula" }, { re: /aman/i, key: "aman" }, { re: /shangri/i, key: "shangri_la" },
              { re: /sofitel|novotel|pullman|mgallery|raffles|fairmont|swissôtel|accor/i, key: "accor" }, { re: /radisson/i, key: "radisson" }, { re: /wyndham|ramada|days\s+inn|super\s+8|la\s+quinta|tryp/i, key: "wyndham" },
            ];
            realSegs.forEach((seg, segIdxInReal) => {
              // For each booking row, capture the originating segment's date so
              // we can jump to the right day-pill on click. Use the actual seg
              // index to set expandedSegmentKey.
              const _segDate = seg.date || "";
              const _segKey = `${trip.id}|${segIdxInReal}`;
              if (seg.type === "flight") {
                const airlineName = seg.airline || "";
                const exactMatch = Object.entries(airlineByName).find(([name]) => airlineName.toLowerCase() === name);
                const fnCode = (seg.flightNumber || "").slice(0, 2).toUpperCase();
                const codeKey = codeMap[fnCode];
                const cs = exactMatch ? exactMatch[1] : (codeKey && AIRLINE_CS[codeKey] ? { ...AIRLINE_CS[codeKey], key: codeKey } : null);
                const conf = seg.confirmationCode || "";
                const label = cs?.name || airlineName || seg.flightNumber || "Flight";
                const existing = bookings.find(b => b.type === "flight" && b.label === label);
                if (existing) { if (conf && !existing.conf) existing.conf = conf; return; }
                if (conf && seenConf.has(conf)) return;
                if (conf) seenConf.add(conf);
                if (airlineName || conf || seg.flightNumber) bookings.push({ type: "flight", label, conf, phone: cs?.phone || "", manage: cs?.manage || "", color: ev.sky, _segDate, _segKey });
              } else if (seg.type === "hotel" || seg.type === "accommodation") {
                const conf = seg.confirmationCode || "";
                if (conf && seenConf.has(conf)) return;
                if (conf) seenConf.add(conf);
                const propName = seg.property || "Hotel";
                const hotelMatch = hotelKeywords.find(h => h.re.test(propName));
                const hotelCS = hotelMatch ? HOTEL_CS[hotelMatch.key] : null;
                if (seg.property || conf) bookings.push({ type: "hotel", label: propName, conf, phone: hotelCS?.phone || "", manage: hotelCS?.manage || "", color: ev.plum, _segDate, _segKey });
              } else if (seg.confirmationCode) {
                if (seenConf.has(seg.confirmationCode)) return;
                seenConf.add(seg.confirmationCode);
                const si = segTypeInfo(seg.type);
                bookings.push({ type: seg.type, label: seg.activityName || seg.restaurantName || seg.operator || seg.company || seg.loungeName || si.label, conf: seg.confirmationCode, phone: "", manage: "", color: si.color, _segDate, _segKey });
              }
            });
            if (bookings.length === 0) return null;
            return (
              <div style={{ background: ev.paper, border: `1px solid ${ev.cream}`, padding: "24px 28px", marginBottom: 24, marginTop: 32 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${ev.cream}` }}>
                  <h3 style={{ fontFamily: ev.serif, fontSize: 22, fontWeight: 400, letterSpacing: "-0.015em", color: ev.ink, margin: 0 }}>Booking Management</h3>
                  <span style={{ fontFamily: ev.mono, fontSize: 10, color: ev.accent, letterSpacing: "0.08em" }}>{bookings.length}</span>
                </div>
                {bookings.map((b, i) => {
                  // Click anywhere in the row → switch the day-pill to this booking's date AND auto-expand the segment in the timeline
                  const handleRowClick = () => {
                    if (b._segDate && sortedDates) {
                      const dayIdx = sortedDates.indexOf(b._segDate);
                      if (dayIdx >= 0) setTripDetailSegIdx?.(dayIdx);
                    }
                    if (b._segKey) setExpandedSegmentKey?.(b._segKey);
                    // Scroll the expanded segment card into the center of view (not the page top).
                    // 150ms gives React time to render the new day's segments after the day-pill switch.
                    setTimeout(() => {
                      if (!b._segKey) return;
                      const card = document.getElementById(`seg-card-${b._segKey.replace("|", "-")}`);
                      if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 150);
                  };
                  return (
                    <div key={i} onClick={handleRowClick}
                      style={{ padding: "14px 12px", margin: "0 -12px", borderBottom: i < bookings.length - 1 ? `1px solid ${ev.cream}` : "none", cursor: "pointer", transition: "background 0.18s" }}
                      onMouseEnter={e => e.currentTarget.style.background = ev.bone}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                          <span style={{ fontFamily: ev.mono, fontSize: 11, fontWeight: 700, color: b.color, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", border: `1px solid ${b.color}30`, background: `${b.color}08` }}>{b.type === "flight" ? "Flight" : b.type === "hotel" ? "Hotel" : b.type}</span>
                          <span style={{ fontFamily: ev.serif, fontSize: 15, fontWeight: 400, color: ev.ink }}>{b.label}</span>
                        </div>
                        {b.conf && <span style={{ fontFamily: ev.mono, fontSize: 12, fontWeight: 600, color: ev.accent, letterSpacing: "0.04em", flexShrink: 0 }}>{b.conf}</span>}
                      </div>
                      {(b.phone || b.manage) && (
                        <div style={{ display: "flex", gap: 16, marginTop: 8, paddingLeft: 2 }}>
                          {b.phone && <span style={{ fontFamily: ev.mono, fontSize: 11, color: ev.taupe }}>{b.phone}</span>}
                          {b.manage && <a href={b.manage} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: ev.mono, fontSize: 11, color: ev.accent, textDecoration: "none", letterSpacing: "0.04em" }}>Manage Booking &#8594;</a>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ── Trip Prep — editorial ── */}
          {(() => {
            const passportCode = user?.user_metadata?.passport_country || settingsForm.passportCountry;
            const tripStartDate2 = trip.date || (trip.segments || []).map(s => s.date).filter(Boolean).sort()[0] || "";
            const tripPrepTab = expandedCardId === `prep_${trip.id}` ? "timeline" : expandedCardId === `prep_visa_${trip.id}` ? "visa" : expandedCardId === `prep_packing_${trip.id}` ? "packing" : null;
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
            const packDefaults = getPackingItems();
            const packChecked = packingLists[trip.id] || {};
            const tripCust = customPackItems[trip.id] || [];
            const allPackItems = [...(Array.isArray(packDefaults) ? packDefaults : Object.values(packDefaults).flatMap(c => c.items)), ...tripCust];
            const packDoneCount = allPackItems.filter(i => packChecked[i.id]).length;
            const totalTasks = milestones.length + allPackItems.length;
            const totalDone = prepDoneCount + packDoneCount;
            const readinessPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
            const sColors = { visa_free: "#10b981", visa_on_arrival: ev.sky, evisa: ev.gold, visa_required: "#C8553D" };
            const sLabels = { visa_free: "Visa Free", visa_on_arrival: "Visa on Arrival", evisa: "eVisa Required", visa_required: "Visa Required" };
            return (
              <div style={{ background: ev.paper, border: `1px solid ${ev.cream}`, overflow: "hidden", marginBottom: 24 }}>
                <div style={{ padding: isMobile ? "14px 16px" : "20px 28px", borderBottom: `1px solid ${ev.cream}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                      <h3 style={{ fontFamily: ev.serif, fontSize: 22, fontWeight: 400, letterSpacing: "-0.015em", color: ev.ink, margin: 0 }}>Trip Prep</h3>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: ev.serif, fontSize: 22, fontWeight: 300, color: readinessPct === 100 ? ev.moss : ev.ink }}>{readinessPct}%</span>
                      <span style={{ fontFamily: ev.mono, fontSize: 11, color: ev.taupe, letterSpacing: "0.1em", textTransform: "uppercase" }}>ready</span>
                    </div>
                  </div>
                  <div style={{ height: 3, background: ev.cream, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${readinessPct}%`, background: readinessPct === 100 ? ev.moss : ev.accent, transition: "width 0.3s" }} />
                  </div>
                </div>
                <div style={{ display: "flex", borderBottom: `1px solid ${ev.cream}` }}>
                  {[{ id: "timeline", label: "Timeline", ct: `${prepDoneCount}/${milestones.length}` }, ...(passportCode && destinations2.length > 0 ? [{ id: "visa", label: "Visa", ct: `${destinations2.length}` }] : []), { id: "packing", label: "Packing", ct: `${packDoneCount}/${allPackItems.length}` }].map(tab => {
                    const active = tripPrepTab === tab.id;
                    return (<button key={tab.id} onClick={() => setPrepTab(active ? null : tab.id)} style={{ flex: 1, padding: "12px 6px", border: "none", cursor: "pointer", background: "transparent", borderBottom: active ? `2px solid ${ev.accent}` : "2px solid transparent", color: active ? ev.accent : ev.taupe, fontFamily: ev.mono, fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>{tab.label} <span style={{ fontFamily: ev.mono, fontSize: 11, opacity: 0.7 }}>{tab.ct}</span></button>);
                  })}
                </div>
                {tripPrepTab === "timeline" && (<div style={{ padding: isMobile ? "10px 14px" : "16px 28px" }}>{milestones.map((m, mi) => { const due = tripStartDate2 ? addDays(tripStartDate2, m.dueOffset) : ""; const overdue = due && due < today && !prepChecked[m.id]; const soon = due && !overdue && due <= addDays(today, 7) && !prepChecked[m.id]; const done = !!prepChecked[m.id]; return (<div key={m.id} onClick={() => togglePrep(m.id)} style={{ display: "flex", gap: 12, padding: "11px 0", cursor: "pointer", borderBottom: mi < milestones.length-1 ? `1px solid ${ev.cream}` : "none", opacity: done ? 0.4 : 1, transition: "opacity 0.2s" }}><div style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1, border: `1.5px solid ${done ? ev.moss : overdue ? "#C8553D" : ev.cream}`, background: done ? ev.moss : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{done && <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>}</div><div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}><span style={{ fontFamily: ev.sans, fontSize: 13, fontWeight: 500, color: done ? ev.stone : ev.ink }}>{m.label}</span>{due && <span style={{ fontFamily: ev.mono, fontSize: 11, fontWeight: 600, flexShrink: 0, padding: "2px 8px", letterSpacing: "0.06em", textTransform: "uppercase", color: done ? ev.stone : overdue ? "#C8553D" : soon ? ev.gold : ev.taupe, background: overdue ? "rgba(200,85,61,0.06)" : soon ? `${ev.gold}10` : "transparent", border: overdue ? "1px solid rgba(200,85,61,0.15)" : soon ? `1px solid ${ev.gold}20` : "1px solid transparent" }}>{overdue ? "OVERDUE" : fmtPrepDate(due)}</span>}</div><div style={{ fontFamily: ev.serif, fontStyle: "italic", fontSize: 12, color: ev.taupe, marginTop: 2 }}>{m.detail}</div></div></div>); })}</div>)}
                {tripPrepTab === "visa" && passportCode && (<div style={{ padding: isMobile ? "10px 14px" : "16px 28px" }}><div style={{ fontFamily: ev.mono, fontSize: 10, color: ev.taupe, marginBottom: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>{PNAME[passportCode] || passportCode} passport</div>{destinations2.map(dest => { const key = `${passportCode}_${dest}`; const visa = visaCache[key]; const ld = visaLoading[key]; const clr = visa ? (sColors[visa.status] || ev.taupe) : ev.taupe; return (<div key={dest} style={{ padding: "12px 0", borderBottom: `1px solid ${ev.cream}` }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: visa ? 8 : 0 }}><span style={{ fontFamily: ev.serif, fontSize: 16, fontWeight: 400, color: ev.ink }}>{dest}</span>{ld && <span style={{ fontFamily: ev.mono, fontSize: 10, color: ev.taupe }}>Checking...</span>}{visa && <span style={{ fontFamily: ev.mono, fontSize: 11, fontWeight: 700, color: clr, background: `${clr}12`, border: `1px solid ${clr}30`, padding: "3px 10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{sLabels[visa.status] || visa.status}</span>}</div>{visa && (<div><div style={{ fontFamily: ev.sans, fontSize: 12, color: ev.taupe, marginBottom: 4, lineHeight: 1.6 }}>{visa.summary}{visa.stayDuration ? ` (${visa.stayDuration})` : ""}</div>{visa.details && <div style={{ fontFamily: ev.sans, fontSize: 11, color: ev.stone, marginBottom: 6, lineHeight: 1.5 }}>{visa.details}</div>}{visa.applicationSteps?.length > 0 && visa.status !== "visa_free" && (<div style={{ marginBottom: 6 }}><div style={{ fontFamily: ev.mono, fontSize: 11, fontWeight: 700, color: ev.taupe, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>How to Apply</div>{visa.applicationSteps.map((step, si) => (<div key={si} style={{ display: "flex", gap: 8, fontFamily: ev.sans, fontSize: 11, color: ev.taupe, lineHeight: 1.5, marginBottom: 3 }}><span style={{ fontFamily: ev.mono, fontWeight: 700, color: ev.accent, width: 14, textAlign: "right", flexShrink: 0 }}>{si+1}.</span><span>{step.replace(/^Step\s*\d+:\s*/i,"")}</span></div>))}</div>)}<div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontFamily: ev.mono, fontSize: 10, color: ev.taupe, letterSpacing: "0.04em" }}>{visa.processingTime && !/N\/A/i.test(visa.processingTime) && <span>Processing: <strong style={{ color: ev.ink }}>{visa.processingTime}</strong></span>}{visa.cost && !/Free|N\/A/i.test(visa.cost) && <span>Fee: <strong style={{ color: ev.ink }}>{visa.cost}</strong></span>}</div>{visa.importantNotes?.length > 0 && (<div style={{ marginTop: 8, padding: "8px 12px", background: `${ev.gold}08`, border: `1px solid ${ev.gold}20` }}>{visa.importantNotes.map((n,ni) => <div key={ni} style={{ fontFamily: ev.sans, fontSize: 11, color: ev.gold, lineHeight: 1.5 }}>{n}</div>)}</div>)}{visa.officialWebsite && <a href={visa.officialWebsite} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 8, fontFamily: ev.mono, fontSize: 10, color: ev.accent, textDecoration: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}>Official website &#8594;</a>}</div>)}</div>); })}<div style={{ fontFamily: ev.serif, fontStyle: "italic", fontSize: 11, color: ev.stone, marginTop: 10 }}>Visa requirements may change. Always verify with the embassy before travel.</div></div>)}
                {tripPrepTab === "packing" && (<div style={{ padding: isMobile ? "10px 14px" : "16px 28px" }}>
                  {allPackItems.map(item => { const done = !!packChecked[item.id]; const isCust = item.id.startsWith("custom_"); return (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", cursor: "pointer", opacity: done ? 0.4 : 1, transition: "opacity 0.2s", borderBottom: `1px solid ${ev.cream}` }} onClick={() => togglePackItem(trip.id, item.id)}>
                      <div style={{ width: 18, height: 18, border: `1.5px solid ${done ? ev.moss : ev.cream}`, background: done ? ev.moss : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{done && <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>}</div>
                      {isCust ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                          <input type="text" value={item.label} placeholder="Custom item..." onChange={e => { e.stopPropagation(); const nx = { ...customPackItems, [trip.id]: tripCust.map(i => i.id === item.id ? { ...i, label: e.target.value } : i) }; setCustomPackItems(nx); try { localStorage.setItem("continuum_custom_pack_items", JSON.stringify(nx)); } catch {} }} onClick={e => e.stopPropagation()} style={{ flex: 1, padding: "2px 4px", border: "none", borderBottom: `1px solid ${ev.cream}`, background: "transparent", color: ev.ink, fontFamily: ev.sans, fontSize: 13, outline: "none" }} />
                          <button onClick={e => { e.stopPropagation(); const nx = { ...customPackItems, [trip.id]: tripCust.filter(i => i.id !== item.id) }; setCustomPackItems(nx); try { localStorage.setItem("continuum_custom_pack_items", JSON.stringify(nx)); } catch {} }} style={{ background: "none", border: "none", color: "#C8553D", cursor: "pointer", fontSize: 12 }}>x</button>
                        </div>
                      ) : (<span style={{ fontFamily: ev.sans, fontSize: 13, color: done ? ev.stone : ev.ink }}>{item.label}</span>)}
                    </div>
                  ); })}
                  <button onClick={() => { const id = `custom_${Date.now()}`; const nx = { ...customPackItems, [trip.id]: [...tripCust, { id, label: "", category: "custom" }] }; setCustomPackItems(nx); try { localStorage.setItem("continuum_custom_pack_items", JSON.stringify(nx)); } catch {} }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 0", border: "none", background: "transparent", color: ev.accent, fontFamily: ev.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>+ Add custom item</button>
                </div>)}
              </div>
            );
          })()}

          {/* ── Expenses — editorial ── */}
          {tripExps.length > 0 && (
            <div style={{ background: ev.paper, border: `1px solid ${ev.cream}`, padding: "24px 28px", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${ev.cream}` }}>
                <h3 style={{ fontFamily: ev.serif, fontSize: 22, fontWeight: 400, letterSpacing: "-0.015em", color: ev.ink, margin: 0 }}>Expenses</h3>
                <span style={{ fontFamily: ev.mono, fontSize: 12, fontWeight: 600, color: ev.accent, letterSpacing: "0.04em" }}>${tripTotal.toLocaleString()} USD</span>
              </div>
              {tripExps.map((exp, ei) => {
                const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                return (
                  <div key={exp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: ei < tripExps.length - 1 ? `1px solid ${ev.cream}` : "none" }}>
                    {exp.receiptImage?.data && exp.receiptImage.type?.startsWith("image/") && (
                      <img src={exp.receiptImage.data} alt="" style={{ width: 36, height: 36, objectFit: "cover", border: `1px solid ${ev.cream}`, cursor: "pointer", flexShrink: 0 }} onClick={() => setViewExpenseId(exp.id)} />
                    )}
                    {cat && <span style={{ fontFamily: ev.mono, fontSize: 11, fontWeight: 700, color: cat.color, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", border: `1px solid ${cat.color}30`, background: `${cat.color}08`, flexShrink: 0 }}>{cat.label}</span>}
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontFamily: ev.sans, fontSize: 13, color: ev.taupe, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description || exp.category}</span>
                      <ReportedBadge reports={expenseReportMembership?.get(exp.id)} onOpen={openReport} compact />
                    </div>
                    <span style={{ fontFamily: ev.mono, fontSize: 13, fontWeight: 500, color: ev.ink, flexShrink: 0 }}>{exp.amount?.toLocaleString()} {exp.currency || "USD"}</span>
                    <button onClick={() => setViewExpenseId(exp.id)} style={{ padding: "4px 10px", border: `1px solid ${ev.accent}30`, background: "transparent", color: ev.accent, fontFamily: ev.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = ev.accentWash; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>View</button>
                    <button onClick={() => { setEditExpenseId(exp.id); setShowAddExpense(trip.id); setNewExpense({ ...exp, fxRate: exp.fxRate || 1 }); }} style={{ padding: "4px 10px", border: `1px solid ${ev.cream}`, background: "transparent", color: ev.taupe, fontFamily: ev.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = ev.ink; e.currentTarget.style.color = ev.ink; }} onMouseLeave={e => { e.currentTarget.style.borderColor = ev.cream; e.currentTarget.style.color = ev.taupe; }}>Edit</button>
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
                    }} style={{ padding: "4px 8px", border: `1px solid ${ev.cream}`, background: "transparent", color: ev.taupe, fontFamily: ev.sans, fontSize: 11, cursor: "pointer", flexShrink: 0 }}>
                      <option value="">Transfer...</option>
                      <option value="_unassign">Unassign (back to inbox)</option>
                      {trips.filter(t => t.id !== trip.id).map(t => <option key={t.id} value={t.id}>{t.tripName || t.trip_name || t.location || "Trip"}</option>)}
                    </select>
                    <button onClick={() => {
                      const label = exp.description || exp.merchant || "this expense";
                      const amt = exp.amount ? ` (${exp.currency || "USD"} ${Number(exp.amount).toFixed(2)})` : "";
                      showConfirm?.(`Delete ${label}${amt}? This can't be undone.`, () => removeExpense(exp.id));
                    }} style={{ padding: "4px 10px", border: "1px solid rgba(200,85,61,0.15)", background: "transparent", color: "#C8553D", fontFamily: ev.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", flexShrink: 0, opacity: 0.5, transition: "opacity 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}>Delete</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const dv = { serif: "'Fraunces', serif", sans: "'Inter Tight', sans-serif", mono: "'JetBrains Mono', monospace", cream: D ? "rgba(255,255,255,0.06)" : "#E2DCCE", taupe: D ? "#999" : "#6B6458", stone: D ? "#8a8a8a" : "#857A66", paper: D ? "#222" : "#fff", bone: D ? "#1a1a1a" : "#fff", moss: "#6B7A5A", gold: "#B8924A" };
    const confirmedCount = trips.filter(t => t.status === "confirmed").length;
    const daysToNextTrip = upcomingTripsFiltered[0]?.date ? Math.max(0, Math.ceil((new Date(upcomingTripsFiltered[0].date + "T12:00:00") - new Date()) / 86400000)) : null;

    return (
    <div>
      {/* Hero banner removed per request. */}

      {/* ── Editorial page header ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap: isMobile ? 20 : 40, alignItems: "end", marginTop: isMobile ? 8 : 16, marginBottom: 32, paddingBottom: 28, borderBottom: `1px solid ${dv.cream}`, position: "relative", zIndex: 5 }}>
        <div>
          <div style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: css.accent, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 28, height: 1, background: css.accent }} /> The Getaways · S02
          </div>
          <h1 style={{ fontFamily: dv.serif, fontSize: isMobile ? 28 : "clamp(48px, 7vw, 80px)", fontWeight: 300, lineHeight: isMobile ? 1.05 : 0.94, letterSpacing: "-0.03em", color: css.text, margin: 0 }}>
            Your <em style={{ fontStyle: "italic", fontWeight: 400, color: css.accent }}>trips.</em>
          </h1>
          <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: isMobile ? 13 : 16, color: dv.taupe, marginTop: isMobile ? 8 : 14, maxWidth: 580, lineHeight: 1.4 }}>
            {trips.length} on the books, {confirmedCount} confirmed — a year of quiet accumulation.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", paddingBottom: 8 }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => document.getElementById("cal-month-picker")?.showPicker?.()} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", border: `1px solid ${dv.cream}`, background: dv.paper, color: css.text, cursor: "pointer", transition: "all 0.25s", borderRadius: 10 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = css.text; }} onMouseLeave={e => { e.currentTarget.style.borderColor = dv.cream; }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Export PDF
            </button>
            <input id="cal-month-picker" type="month" defaultValue={new Date().toISOString().slice(0, 7)} onChange={e => { if (e.target.value) exportMonthPDF(e.target.value); }}
              style={{ position: "absolute", top: 0, left: 0, opacity: 0, pointerEvents: "none", width: "100%", height: "100%" }} />
          </div>
          <div style={{ display: "inline-flex", border: `1px solid ${dv.cream}`, background: dv.paper, borderRadius: 10, overflow: "hidden" }}>
            {[{ v: "list", icon: <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></> }, { v: "calendar", icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> }].map(({ v, icon }) => (
              <button key={v} onClick={() => setTripsView(v)} style={{ padding: "11px 14px", color: tripsView === v ? css.accent : dv.taupe, cursor: "pointer", background: tripsView === v ? dv.bone : "transparent", display: "grid", placeItems: "center", borderRight: `1px solid ${dv.cream}`, border: "none", borderRadius: 0, transition: "all 0.25s" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
              </button>
            ))}
          </div>
          <button onClick={() => setShowImportItinerary(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", border: `1px solid ${dv.cream}`, background: dv.paper, color: css.text, cursor: "pointer", transition: "all 0.25s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = css.text; }} onMouseLeave={e => { e.currentTarget.style.borderColor = dv.cream; }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Import
          </button>
          <button onClick={handleAddTrip} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", background: css.text, color: D ? "#15130F" : "#F4F1EC", border: `1px solid ${css.text}`, fontFamily: dv.serif, fontSize: 15, fontWeight: 400, cursor: "pointer", position: "relative", overflow: "hidden", transition: "all 0.3s" }}
            onMouseEnter={e => { e.currentTarget.style.background = css.accent; e.currentTarget.style.borderColor = css.accent; }}
            onMouseLeave={e => { e.currentTarget.style.background = css.text; e.currentTarget.style.borderColor = css.text; }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Trip
          </button>
        </div>
      </div>

      {/* Metrics band (Trips on Books / Confirmed / Spend YTD / Next Departure) removed per request — felt cluttered. */}

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
                              <div style={{ fontSize: 11, fontWeight: 600, color: css.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{icon} {routeDisplay}</div>
                              {subtext && <div style={{ fontSize: 10, color: css.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{subtext}</div>}
                            </div>
                          );
                        })}
                        {dayTrips.length > 3 && <div style={{ fontSize: 11, color: css.text3, paddingLeft: 3 }}>+{dayTrips.length - 3} more</div>}
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
      {/* Filter row removed per request — search moved to the header. */}

      {/* Section separator — Upcoming */}
      {upcomingTripsFiltered.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "0 0 16px", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: dv.taupe, flexWrap: "wrap" }}>
          <div style={{ width: 28, height: 1, background: css.accent }} />
          <strong style={{ color: css.text, fontWeight: 500 }}>S 1 · Upcoming</strong>
          <span style={{ color: css.accent, background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: "2px 8px", marginLeft: 4 }}>{String(upcomingTripsFiltered.length).padStart(2, "0")} entries</span>
          {/* Hide-shared toggle — only when user has any shared trips at all */}
          {(sharedTrips || []).length > 0 && (
            <button onClick={() => setHideShared?.(!hideShared)}
              title={hideShared ? "Show shared trips everywhere in the app" : "Hide shared trips everywhere in the app"}
              style={{
                marginLeft: 4, display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px",
                border: `1px solid ${hideShared ? css.border : "#3b82f6"}`,
                background: hideShared ? "transparent" : "rgba(59,130,246,0.06)",
                color: hideShared ? css.text3 : "#3b82f6",
                fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
                cursor: "pointer", transition: "all 0.2s",
              }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: hideShared ? css.text3 : "#3b82f6" }} />
              {hideShared ? "Shared hidden" : "Shared shown"}
            </button>
          )}
          <div style={{ flex: 1, height: 1, background: dv.cream }} />
        </div>
      )}
      <div style={{ marginBottom: pastTripsFiltered.length > 0 ? 0 : 32 }}>
        {upcomingTripsFiltered.length > 0 && (
          <TripSelector
            trips={upcomingTripsFiltered}
            css={css} dv={dv} isMobile={isMobile} D={D}
            SegIcon={SegIcon}
            formatTripDates={formatTripDates}
            photoFor={(t) => {
              const segs = (t.segments || []).filter(s => !s._isMeta);
              const lastArr = segs.filter(s => s.type === "flight").map(s => s.arrivalAirport).filter(Boolean).pop();
              const city = (lastArr && AIRPORT_CITY?.[lastArr]) || (t.location || "").split(",")[0].trim() || t.tripName || "";
              return cityPhoto(city);
            }}
            onOpenTrip={(t) => { setTripDetailId(t.id); setTripDetailSegIdx(0); }}
            openEditTrip={openEditTrip}
            removeTrip={removeTrip}
          />
        )}
        {upcomingTripsFiltered.length === 0 && pastTripsFiltered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}` }}>
            {trips.length === 0 ? (
              <>
                <h3 style={{ fontFamily: dv.serif, fontSize: 24, fontWeight: 400, color: css.text, margin: "0 0 8px", letterSpacing: "-0.01em" }}>No trips yet.</h3>
                <p style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, lineHeight: 1.55, margin: "0 auto 22px", maxWidth: 460 }}>
                  Forward any booking confirmation to <span style={{ fontFamily: dv.mono, color: css.accent, fontStyle: "normal" }}>trips@gocontinuum.app</span> and the parser builds the trip for you — or add one manually.
                </p>
                <button onClick={handleAddTrip} style={{ padding: "11px 22px", background: css.text, color: D ? "#15130F" : "#F4F1EC", border: "none", fontFamily: dv.serif, fontSize: 14, cursor: "pointer", letterSpacing: "0.02em" }}>Add your first trip →</button>
              </>
            ) : (
              <p style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, margin: 0 }}>No trips match your filters.</p>
            )}
          </div>
        )}
      </div>

      {/* Past Trips Section */}
      {pastTripsFiltered.length > 0 && (
        <div>
          <button onClick={() => setPastTripsExpanded(p => !p)} style={{
            display: "flex", alignItems: "center", gap: 16, width: "100%",
            background: "none", border: "none", cursor: "pointer", padding: "0", marginBottom: 16, marginTop: 32, textAlign: "left",
            fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: dv.taupe,
          }}>
            <div style={{ width: 28, height: 1, background: css.accent }} />
            <strong style={{ color: css.text, fontWeight: 500 }}>S 2 · Past</strong>
            <span style={{ color: css.accent, background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: "2px 8px" }}>{String(pastTripsFiltered.length).padStart(2, "0")} entries</span>
            <div style={{ flex: 1, height: 1, background: dv.cream }} />
            <span style={{ fontSize: 12, color: dv.taupe, transform: pastTripsExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>&#9662;</span>
          </button>
          {pastTripsExpanded && (
            <div>
              <TripSelector
                trips={pastTripsFiltered}
                css={css} dv={dv} isMobile={isMobile} D={D}
                SegIcon={SegIcon}
                formatTripDates={formatTripDates}
                photoFor={(t) => {
                  const segs = (t.segments || []).filter(s => !s._isMeta);
                  const lastArr = segs.filter(s => s.type === "flight").map(s => s.arrivalAirport).filter(Boolean).pop();
                  const city = (lastArr && AIRPORT_CITY?.[lastArr]) || (t.location || "").split(",")[0].trim() || t.tripName || "";
                  return cityPhoto(city);
                }}
                onOpenTrip={(t) => { setTripDetailId(t.id); setTripDetailSegIdx(0); }}
                openEditTrip={openEditTrip}
                removeTrip={removeTrip}
              />
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

// ── Inline expansion detail panel for a segment in the trip timeline ──
// Renders a clean two-column "label · value" grid of every meaningful field
// the segment has, depending on type. Empty values are filtered out so the
// panel stays tight when data is sparse.
function SegmentDetailsPanel({ seg, ev, isMobile, liveStatus }) {
  const t = (seg.type || "").toString().toLowerCase();
  const rows = [];
  const push = (label, value) => { if (value !== undefined && value !== null && String(value).trim() !== "") rows.push({ label, value: String(value) }); };

  if (t === "flight") {
    push("Airline", seg.airline);
    push("Flight #", seg.flightNumber);
    push("Aircraft", seg.aircraft);
    push("Cabin / Fare", [seg.fareClass, seg.bookingClass].filter(Boolean).join(" · "));
    push("Seat", seg.seat);
    push("Confirmation", seg.confirmationCode);
    push("Departure", [seg.departureAirport, seg.departureTime].filter(Boolean).join(" · "));
    push("Departure terminal", seg.departureTerminal);
    push("Arrival", [seg.arrivalAirport, seg.arrivalTime].filter(Boolean).join(" · "));
    push("Arrival terminal", seg.arrivalTerminal);
    push("Arrival date", seg.arrivalDate);
    push("Stopover", seg.stopoverAirport ? `${seg.stopoverAirport}${seg.stopoverDuration ? ` · ${seg.stopoverDuration}` : ""}` : "");
    if (liveStatus && !liveStatus.error) {
      push("Live · departure gate", liveStatus.departureGate);
      push("Live · arrival gate", liveStatus.arrivalGate);
      push("Live · baggage belt", liveStatus.baggageBelt);
      if (liveStatus.departureDelay > 0) push("Live · delay", `${liveStatus.departureDelay} min`);
    }
  } else if (t === "hotel" || t === "accommodation") {
    push("Property", seg.property || seg.hotelName);
    push("Address", seg.location);
    push("Check-in", seg.date);
    push("Check-out", seg.checkoutDate);
    push("Nights", seg.nights);
    push("Room type", seg.roomType);
    push("Total cost", seg.totalCost ? `$${seg.totalCost}` : "");
    push("Confirmation", seg.confirmationCode);
  } else if (t === "restaurant" || t === "dining") {
    push("Restaurant", seg.restaurantName || seg.name || seg.title);
    push("Address", seg.location);
    push("Time", seg.time || seg.startTime);
    push("Party size", seg.partySize);
    push("Confirmation", seg.confirmationCode);
    push("Notes", seg.notes);
  } else if (t === "lounge") {
    push("Lounge", seg.loungeName || seg.name);
    push("Airport", seg.airport);
    push("Terminal", seg.terminal);
    push("Time", seg.time || seg.startTime);
    push("Notes", seg.notes);
  } else {
    push("Title", seg.activityName || seg.title || seg.name);
    push("Location", seg.location);
    push("Time", seg.time || seg.startTime);
    push("Confirmation", seg.confirmationCode);
    push("Notes", seg.notes);
  }

  if (rows.length === 0) {
    return (
      <p style={{ fontFamily: ev.serif, fontStyle: "italic", color: ev.taupe, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
        No additional details on file. Use the pencil icon to add more.
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 0, border: `1px solid ${ev.cream}` }}>
      {rows.map((r, i) => (
        <div key={r.label} style={{
          padding: "10px 14px",
          borderBottom: i < rows.length - 1 ? `1px solid ${ev.cream}` : "none",
          borderRight: !isMobile && (i % 2 === 0) && i < rows.length - 1 ? `1px solid ${ev.cream}` : "none",
          background: i % 2 === 0 ? "transparent" : "rgba(226,220,206,0.18)",
          display: "flex", flexDirection: "column", gap: 3,
        }}>
          <span style={{ fontFamily: ev.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ev.taupe }}>{r.label}</span>
          <span style={{ fontFamily: ev.serif, fontSize: 14, color: ev.ink, lineHeight: 1.3, wordBreak: "break-word" }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

