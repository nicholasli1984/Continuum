import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LANDMARK_FALLBACK_PHOTOS } from "../constants/airline-data";
import TransferBonusBand from "../components/transferBonuses/TransferBonusBand";
import ReportedBadge from "../components/ReportedBadge";
import { isLandingDemo, DEMO_FIRST_NAME } from "../utils/landingDemo";

// Animated checkbox from prompt — SVG path draw animation
const PackCheckBox = ({ checked, onClick, size = 24, color = "#10b981" }) => (
  <div style={{ cursor: "pointer", flexShrink: 0, userSelect: "none" }} onClick={onClick}>
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <motion.path
        d="M 2.45 24.95 V 33.95 C 2.45 35.9382 4.0618 37.55 6.05 37.55 H 33.95 C 35.9382 37.55 37.55 35.9382 37.55 33.95 V 6.05 C 37.55 4.0618 35.9382 2.45 33.95 2.45 H 6.05 C 4.0618 2.45 2.45 4.0618 2.45 6.05 V 22.0617 C 2.45 23.0443 2.8516 23.9841 3.5616 24.6633 L 10.0451 30.8649 C 11.5404 32.2952 13.9308 32.1735 15.2731 30.5988 L 36.2 6.05"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={3}
        animate={{
          strokeDasharray: checked ? 150 : 132,
          strokeDashoffset: checked ? -134 : 0,
        }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
    </svg>
  </div>
);

export function renderDashboard(s) {
  const {
    css, isMobile, user, trips, expenses, sharedTrips, darkMode,
    setShowSearch, quickAddOpen, setQuickAddOpen,
    dashSubTab: _dashSubTab, setDashSubTab, embeddedTab, savedItineraries, setSavedItineraries,
    setActiveView, setTripDetailId, setTripDetailSegIdx,
    openEditTrip, removeTrip,
    setShowCreateTrip, setShowAddExpense, setNewExpense, setEditExpenseId,
    setShowReceiptQR, setShowPasteItinerary, setViewExpenseId,
    setExpandedItinId, expandedItinId,
    landmarkPhotos, userForwardingAddress,
    formatTripDates, getTripExpenses, getTripTotal, getTripName,
    getFlightLiveStatus, getPackingItems, PACK_CATEGORIES, packingLists, customPackItems,
    EXPENSE_CATEGORIES, SegIcon,
    nextTrip, upcomingTripsFiltered, allTripsWithShared,
    pushSupported, pushEnabled, enablePushNotifications, pushStatus,
    addTripFromItinerary, dismissItinerary, updateItinSeg,
    snapReceiptProcessing, handleSnapReceipt, snapReceiptInputRef,
    BLANK_EXPENSE, AIRPORT_CITY,
    lp,
    getProjectedStatus, linkedAccounts, LOYALTY_PROGRAMS, defaultSegment, supabase, loadTrips, setExpenses, removeExpense, pastTripsFiltered, getTripEndDate, todayStr, showConfirm,
    packingViewTripId, setPackingViewTripId, setCustomPackItems, togglePackItem, savePackingLists,
    timelineDate, setTimelineDate, railActive, setRailActive, renderReports, renderExpenseReports,
    transferBonuses, userPointCurrencies, benefitsSummary,
    hideShared, setHideShared,
    setPendingTripJump,
    vouchers = [], setShowVoucherModal, markVoucherRedeemed,
    expenseReportMembership, openReport,
  } = s;
  const D = darkMode;
  // When `embeddedTab` is passed (e.g. the My Trips hub renders the Packing
  // tab on its own), it overrides the dashboard's internal sub-tab and we hide
  // the hero header + the dashboard's own tab pill so only that tab's content
  // shows. Normal dashboard rendering leaves embeddedTab undefined.
  const dashSubTab = embeddedTab || _dashSubTab;
  const handleAddTrip = () => setShowCreateTrip(true);
  const dv = { bone: D ? "#1a1a1a" : "#F4F1EC", paper: D ? "#222" : "#EBE6DD", cream: D ? "rgba(255,255,255,0.06)" : "#E2DCCE", stone: D ? "#8a8a8a" : "#857A66", taupe: D ? "#999" : "#6B6458", graphite: D ? "#111" : "#2C2A26", ink: D ? "#f0ece6" : "#15130F", moss: "#6B7A5A", gold: "#B8924A" };

  // Quick action chip used on the Featured Trip card. Mono uppercase, subtle
  // border, accent-on-hover. The `primary` variant fills with ink on rest.
  const chipStyle = (dv, css, primary) => ({
    padding: "8px 14px",
    border: `1px solid ${primary ? css.text : css.border}`,
    background: primary ? css.text : "transparent",
    color: primary ? css.bg : css.text3,
    fontFamily: "'JetBrains Mono', 'Geist Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s",
  });

  // Dashboard section label with optional action button
  const SectionLabel = ({ children, action, actionLabel }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", color: css.text }}>{children}</span>
      {action && (
        <button onClick={action} style={{ background: "none", border: "none", color: css.text3, fontSize: 13, fontWeight: 500, cursor: "pointer", padding: 0, transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = css.accent} onMouseLeave={e => e.currentTarget.style.color = css.text3}>
          {actionLabel} →
        </button>
      )}
    </div>
  );

    // Dashboard uses shared css palette

    const airlineStatuses = LOYALTY_PROGRAMS.airlines.map(p => ({ ...p, status: getProjectedStatus(p.id) })).filter(p => p.status);
    const hotelStatuses = LOYALTY_PROGRAMS.hotels.map(p => ({ ...p, status: getProjectedStatus(p.id) })).filter(p => p.status);
    const totalTrips = trips.length;
    const confirmedTrips = trips.filter(t => t.status === "confirmed").length;
    const willAdvanceCount = [...airlineStatuses, ...hotelStatuses].filter(p => p.status?.willAdvance).length;
    // Local-date string (YYYY-MM-DD), not UTC. Segment dates are stored in
    // local form, so comparing against a UTC `today` was dropping today's
    // segments once the user was past ~8pm in westward timezones.
    const _today = new Date();
    const today = `${_today.getFullYear()}-${String(_today.getMonth() + 1).padStart(2, "0")}-${String(_today.getDate()).padStart(2, "0")}`;
    const daysToNext = nextTrip ? Math.max(0, Math.ceil((new Date(nextTrip.date + "T12:00:00") - new Date()) / (1000 * 60 * 60 * 24))) : null;
    const totalPointsValue = Object.entries(linkedAccounts).reduce((sum, [, acc]) => sum + (acc.pointsBalance || acc.currentPoints || acc.bonvoyPoints || acc.hhPoints || acc.ihgPoints || 0), 0);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    // ── Right-now context: are we in a trip, and how soon is the next one? ──
    // currentTrip = today falls inside a trip's date range.
    // Used by the Hero strip to switch between "Currently in X" / "Next: X→Y in N"
    // / "All quiet" framings.
    const currentTrip = trips.find(t => {
      const segs = (t.segments || []).filter(s => !s._isMeta);
      const dates = segs.map(s => s.date).filter(Boolean).sort();
      const start = t.date || dates[0];
      if (!start) return false;
      const end = (typeof getTripEndDate === "function" ? getTripEndDate(t) : null) || dates[dates.length - 1] || start;
      return today >= start && today <= end;
    });
    // Next flight (regardless of trip): used to surface "in 18h" rather than "in 1 day"
    // when a flight is imminent.
    const nextFlightSeg = (() => {
      const allFlights = trips
        .flatMap(t => (t.segments || [])
          .filter(s => !s._isMeta && s.type === "flight" && s.date && !s.cancelled)
          .map(s => ({ ...s, _tripId: t.id, _tripName: t.tripName || t.trip_name || t.location || "Trip" })))
        .filter(s => {
          // future or today, where date+time is in the future
          const ms = new Date(s.date + "T" + (s.departureTime || "12:00") + ":00").getTime();
          return ms > Date.now();
        })
        .sort((a, b) => {
          const aMs = new Date(a.date + "T" + (a.departureTime || "12:00") + ":00").getTime();
          const bMs = new Date(b.date + "T" + (b.departureTime || "12:00") + ":00").getTime();
          return aMs - bMs;
        });
      return allFlights[0] || null;
    })();
    const hoursToNextFlight = nextFlightSeg ? Math.max(0, Math.floor((new Date(nextFlightSeg.date + "T" + (nextFlightSeg.departureTime || "12:00") + ":00").getTime() - Date.now()) / 3600000)) : null;

    // ── Phase 2: smart prompts ──
    // Prompts only render when their condition is met — never empty, never noisy.
    const unfiledExpenses = expenses.filter(e => !e.tripId && !e._demo).length;
    const forwardedToImport = (savedItineraries || []).length;
    const willAdvancePrograms = [...airlineStatuses, ...hotelStatuses].filter(p => p.status?.willAdvance).length;
    const monthIdx = new Date().getMonth(); // 0 = Jan, 9 = Oct
    const isQ4 = monthIdx >= 9; // Oct/Nov/Dec — when card credits get urgent
    const benefitsRemaining = benefitsSummary?.totalRemaining || 0;
    const liveTransferBonuses = (transferBonuses?.forUser?.(userPointCurrencies || []) || []).length;

    const smartPrompts = [];
    // Imminent departure with packing prompt
    if (nextFlightSeg && hoursToNextFlight !== null && hoursToNextFlight <= 48) {
      smartPrompts.push({
        id: "imminent",
        eyebrow: "Departing soon",
        accent: css.accent,
        title: `${nextFlightSeg.route || "Next flight"}`,
        sub: `In ${hoursToNextFlight < 1 ? "<1 hour" : `${hoursToNextFlight} hours`} · check packing`,
        onClick: () => { setTripDetailId(nextFlightSeg._tripId); setPackingViewTripId(nextFlightSeg._tripId); setActiveView("trips"); },
      });
    }
    // Unfiled expenses
    if (unfiledExpenses > 0) {
      smartPrompts.push({
        id: "unfiled",
        eyebrow: "Inbox",
        accent: dv.gold,
        title: `${unfiledExpenses} unfiled receipt${unfiledExpenses === 1 ? "" : "s"}`,
        sub: "Assign each to a trip",
        onClick: () => { setDashSubTab("inbox"); },
      });
    }
    // Forwarded itineraries waiting to import
    if (forwardedToImport > 0) {
      smartPrompts.push({
        id: "forwarded",
        eyebrow: "Inbox",
        accent: dv.gold,
        title: `${forwardedToImport} forwarded booking${forwardedToImport === 1 ? "" : "s"}`,
        sub: "Review and confirm",
        onClick: () => { setDashSubTab("inbox"); },
      });
    }
    // Q4 card-credits urgency
    if (isQ4 && benefitsRemaining > 100) {
      smartPrompts.push({
        id: "credits",
        eyebrow: "Year-end",
        accent: css.accent,
        title: `$${benefitsRemaining.toLocaleString()} in card credits unclaimed`,
        sub: "Most expire Dec 31 · log them now",
        onClick: () => { setActiveView("wallet"); },
      });
    }
    // Tier advance
    if (willAdvancePrograms > 0) {
      smartPrompts.push({
        id: "advance",
        eyebrow: "Status",
        accent: dv.moss,
        title: `${willAdvancePrograms} program${willAdvancePrograms === 1 ? "" : "s"} will advance a tier`,
        sub: "On current pace",
        onClick: () => { setActiveView("programs"); },
      });
    }
    // Live transfer bonuses on user's currencies
    if (liveTransferBonuses > 0) {
      smartPrompts.push({
        id: "transfer",
        eyebrow: "Transfer bonus",
        accent: css.accent,
        title: `${liveTransferBonuses} live bonus${liveTransferBonuses === 1 ? "" : "es"} on your points`,
        sub: "Snapshot from this week",
        onClick: () => { setActiveView("wallet"); },
      });
    }
    // Expiring vouchers / free nights
    {
      const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
      const expiringSoon = (vouchers || []).filter(v => {
        if (v.status !== "active" || !v.expiry_date) return false;
        const exp = new Date(v.expiry_date + "T12:00:00");
        const days = Math.round((exp - todayD) / 86400000);
        return days >= 0 && days <= 90;
      }).sort((a, b) => (a.expiry_date || "").localeCompare(b.expiry_date || ""));
      if (expiringSoon.length > 0) {
        const first = expiringSoon[0];
        const exp = new Date(first.expiry_date + "T12:00:00");
        const days = Math.round((exp - todayD) / 86400000);
        const more = expiringSoon.length - 1;
        smartPrompts.push({
          id: "vouchers_expiring",
          eyebrow: "Expiring soon",
          accent: "#C8553D",
          title: more > 0
            ? `${first.title} + ${more} more expiring`
            : `${first.title} expires in ${days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"}`}`,
          sub: more > 0 ? `Earliest: ${days === 0 ? "today" : `${days}d`}` : "Book or transfer before it lapses",
          onClick: () => { setShowVoucherModal && setShowVoucherModal(first); },
        });
      }
    }

    // ── Phase 3: next 30 days rail ──
    // All trip segments (flight / hotel / activity) in the next 30 days,
    // sorted chronologically, deduped. Each is a tap-through to its trip.
    const RAIL_WINDOW_DAYS = 30;
    const railEnd = new Date();
    railEnd.setDate(railEnd.getDate() + RAIL_WINDOW_DAYS);
    const railEndStr = `${railEnd.getFullYear()}-${String(railEnd.getMonth() + 1).padStart(2, "0")}-${String(railEnd.getDate()).padStart(2, "0")}`;
    // Rail surfaces flights + hotels only. Transfers, activities, meals, car
    // rentals, etc. clutter the chronology when the rail is meant to answer
    // "what's coming up that I need to be at the airport / hotel for".
    // Positive allow-list keeps the rail tight; new segment types must be
    // added here explicitly to appear.
    const isRailSeg = (seg) => {
      const t = (seg.type || "").toString().toLowerCase();
      return t === "flight" || t === "hotel" || t === "accommodation" || t === "stay";
    };
    // Dedupe trips by id — protects against the same trip appearing in both
    // `trips` and `sharedTrips` (which causes every segment to render twice).
    const railTripMap = new Map();
    const railTripCandidates = hideShared ? trips : [...trips, ...(sharedTrips || [])];
    railTripCandidates.forEach(t => { if (t?.id && !railTripMap.has(t.id)) railTripMap.set(t.id, t); });
    const railSourceTrips = [...railTripMap.values()];
    const railSharedCount = (sharedTrips || []).reduce((n, t) => {
      const has = (t.segments || []).some(seg => !seg._isMeta && isRailSeg(seg) && seg.date && seg.date >= today && seg.date <= railEndStr);
      return n + (has ? 1 : 0);
    }, 0);
    // Robust time-of-day parser: handles "17:00", "5:00 PM", "5pm", "" → minutes-since-midnight
    const segTimeMinutes = (seg) => {
      const raw = (seg.departureTime || seg.time || "").toString().trim();
      if (!raw) return 720; // noon default for sort stability
      const m = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?$/);
      if (!m) return 720;
      let h = parseInt(m[1], 10);
      const min = parseInt(m[2] || "0", 10);
      const ampm = (m[3] || "").toUpperCase();
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return h * 60 + min;
    };
    const railSegmentsRaw = railSourceTrips
      .flatMap(t => (t.segments || [])
        .filter(seg => !seg._isMeta && isRailSeg(seg) && !seg.cancelled && seg.date && seg.date >= today && seg.date <= railEndStr)
        .map(seg => ({ ...seg, _tripId: t.id, _tripName: t.tripName || t.trip_name || t.location || "Trip", _tripShared: !!t._shared, _tripSharedBy: t._sharedBy }))
      )
      .sort((a, b) => {
        // Date first (YYYY-MM-DD strings sort correctly lexicographically)
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        // Same day → sort by parsed time
        return segTimeMinutes(a) - segTimeMinutes(b);
      });
    // Segment-level dedupe — guards against parser creating two entries for
    // the same physical flight (e.g. "DL724 — DL724"). Keys are composite of
    // trip + date + type + route + time + flight-number, so genuine same-day
    // round-trips with different routes still both render.
    const railSegSeen = new Set();
    const railSegments = railSegmentsRaw.filter(seg => {
      const key = `${seg._tripId}|${seg.date}|${(seg.type || "").toLowerCase()}|${(seg.route || "").trim()}|${(seg.departureTime || "").trim()}|${(seg.flightNumber || "").trim()}`;
      if (railSegSeen.has(key)) return false;
      railSegSeen.add(key);
      return true;
    });

    // Shared styles
    const box = { background: css.surface, borderRadius: css.radius, boxShadow: css.shadow };

    return (
      <div style={{ fontFamily: lp.sans, color: lp.text }}>

        {/* ── Editorial Header ── */}
        {!embeddedTab && (() => {
          // Build the context-aware status line. Three modes:
          //   in-trip — "Currently in London. Returning home in 18h."
          //   imminent — "Next: JFK → LHR in 18 hours."
          //   upcoming — "Next: Bermuda in 12 days. 4 more on the books."
          //   quiet — "All quiet on the calendar."
          const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
          let statusEyebrow, statusEyebrowColor, statusLine;

          if (currentTrip) {
            const cityName = (currentTrip.location || currentTrip.tripName || "").split(",")[0].trim() || "current trip";
            statusEyebrow = `In trip · ${cityName}`;
            statusEyebrowColor = dv.moss;
            // If there's a flight in <48h we frame around the next departure
            if (nextFlightSeg && hoursToNextFlight !== null && hoursToNextFlight <= 48) {
              const route = nextFlightSeg.route || "next flight";
              statusLine = `${dateLabel} — Next departure ${route} in ${hoursToNextFlight < 1 ? "<1 hour" : `${hoursToNextFlight} hours`}.`;
            } else {
              statusLine = `${dateLabel} — Currently in ${cityName}. ${trips.length - 1} more trip${trips.length - 1 === 1 ? "" : "s"} on the books.`;
            }
          } else if (nextTrip && hoursToNextFlight !== null && hoursToNextFlight <= 48) {
            const route = nextFlightSeg?.route || "next flight";
            statusEyebrow = "Departing soon";
            statusEyebrowColor = css.accent;
            statusLine = `${dateLabel} — ${route} departs in ${hoursToNextFlight < 1 ? "<1 hour" : `${hoursToNextFlight} hours`}.`;
          } else if (nextTrip && daysToNext !== null) {
            const dest = (nextTrip.location || nextTrip.tripName || "").split(",")[0].trim() || "next trip";
            statusEyebrow = `Next · ${dest}`;
            statusEyebrowColor = dv.gold;
            const more = trips.length - 1;
            statusLine = `${dateLabel} — ${dest} in ${daysToNext} day${daysToNext === 1 ? "" : "s"}${more > 0 ? `. ${more} more on the books.` : "."}`;
          } else {
            statusEyebrow = "All quiet";
            statusEyebrowColor = dv.taupe;
            statusLine = `${dateLabel} — No trips on the calendar. Forward a booking to trips@gocontinuum.app to add one.`;
          }

          return (
            <div style={{ marginBottom: 28 }}>
              {/* Top row: date eyebrow on the left, right-now status pill on the right */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                <div style={{ fontFamily: "'JetBrains Mono', 'Geist Mono', monospace", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: css.accent, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 1, background: css.accent }} />
                  The Dashboard · {new Date().getFullYear()}.{String(new Date().getMonth()+1).padStart(2,"0")}.{String(new Date().getDate()).padStart(2,"0")}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: statusEyebrowColor, padding: "5px 10px", border: `1px solid ${statusEyebrowColor}`, display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusEyebrowColor }} />
                  {statusEyebrow}
                </div>
              </div>
              <h1 style={{ fontFamily: "'Fraunces', 'Instrument Serif', Georgia, serif", fontSize: isMobile ? 26 : "clamp(44px, 6vw, 72px)", fontWeight: 300, lineHeight: 0.96, letterSpacing: "-0.03em", color: css.text, margin: 0 }}>
                {greeting},<br/><em style={{ fontStyle: "italic", fontWeight: 400, color: css.accent }}>{(isLandingDemo() ? DEMO_FIRST_NAME : (user?.user_metadata?.first_name || user?.user_metadata?.name?.split(" ")[0])) || "Traveler"}.</em>
              </h1>
              <div style={{ fontFamily: "'Fraunces', 'Instrument Serif', Georgia, serif", fontStyle: "italic", fontSize: 15, color: css.text3, marginTop: 10, lineHeight: 1.5 }}>
                {statusLine}
              </div>
            </div>
          );
        })()}

        {/* ── Search bar + menu pill (Travel Analytics · + · Inbox) ──
            One line: search opens the global overlay; the pill holds the two
            dashboard sub-views plus a (+) that drops down Add Trip / Add
            Expense / Add Booking. Sticky so it stays reachable while scrolling.
            Shown on all dashboard sub-views (not embedded packing). ── */}
        {!embeddedTab && (() => {
          const isAnalytics = dashSubTab === "reports";
          const isInbox = dashSubTab === "inbox";
          const inboxBadge = (savedItineraries.length + expenses.filter(e => !e.tripId && !e._demo).length) || 0;
          const addItems = [
            { label: "Add Trip", color: "#3b82f6", onClick: () => { setShowCreateTrip(true); setQuickAddOpen?.(false); },
              icon: <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1L11 12l-2 3H6l-2 2 4-1 4-1 2 7.5 2-2v-3l-3-2 4.8-7.3" /> },
            { label: "Add Expense", color: "#B8924A", onClick: () => { setShowAddExpense(true); setQuickAddOpen?.(false); },
              icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
            { label: "Add Booking", color: "#14b8a6", onClick: () => { setShowPasteItinerary(true); setQuickAddOpen?.(false); },
              icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></> },
          ];
          const circle = (active, activeColor) => ({
            width: 38, height: 38, flexShrink: 0, borderRadius: "50%", border: "none", cursor: "pointer",
            display: "grid", placeItems: "center", transition: "all 0.2s", position: "relative",
            background: active ? activeColor : "transparent", color: active ? "#fff" : css.text3,
          });
          return (
            <div style={{
              position: "sticky", top: 0, zIndex: 100, marginBottom: 24, marginTop: -4,
              paddingTop: 8, paddingBottom: 8,
              display: "flex", alignItems: "center", gap: 10,
              background: D ? "rgba(15,15,15,0.92)" : "rgba(255,255,255,0.92)",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            }}>
              {/* Search bar — opens the global search overlay */}
              <button onClick={() => setShowSearch?.(true)} style={{
                flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0,
                padding: "13px 16px", borderRadius: 999,
                border: `1px solid ${css.border}`, background: css.surface,
                cursor: "pointer", textAlign: "left", transition: "border-color 0.2s",
                boxShadow: css.shadow,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = css.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = css.border; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={css.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span style={{ color: css.text3, fontSize: 14, fontFamily: "'Inter Tight', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{isMobile ? "Search…" : "Search trips, expenses, programs, airports…"}</span>
              </button>
              {/* Menu pill — Travel Analytics · + · Inbox */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, padding: 5, borderRadius: 999, border: `1px solid ${css.border}`, background: css.surface, boxShadow: css.shadow }}>
                {/* Travel Analytics */}
                <button title="Travel Analytics" onClick={() => { setDashSubTab(isAnalytics ? "overview" : "reports"); setQuickAddOpen?.(false); }} style={circle(isAnalytics, "#14b8a6")}
                  onMouseEnter={e => { if (!isAnalytics) e.currentTarget.style.background = D ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"; }}
                  onMouseLeave={e => { if (!isAnalytics) e.currentTarget.style.background = "transparent"; }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="20" x2="6" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="14"/></svg>
                </button>
                {/* + with dropdown */}
                <div style={{ position: "relative" }}>
                  <button title="Quick add" onClick={() => setQuickAddOpen?.(!quickAddOpen)} style={{ ...circle(false), background: quickAddOpen ? css.accent : (D ? css.text : "#15130F"), color: quickAddOpen ? "#fff" : (D ? "#15130F" : "#F4F1EC") }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{ transform: quickAddOpen ? "rotate(45deg)" : "none", transition: "transform 0.25s" }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                  {quickAddOpen && (
                    <>
                      <div onClick={() => setQuickAddOpen?.(false)} style={{ position: "fixed", inset: 0, zIndex: 150 }} />
                      <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 200, background: css.surface, border: `1px solid ${css.border}`, borderRadius: 12, boxShadow: css.shadowHover, padding: 6, minWidth: 190, animation: "c-fade-up 0.2s ease" }}>
                        {addItems.map(item => (
                          <button key={item.label} onClick={item.onClick} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "11px 12px", border: "none", background: "transparent", cursor: "pointer", borderRadius: 8, color: css.text, fontFamily: "'Inter Tight', sans-serif", fontSize: 13, fontWeight: 500, textAlign: "left" }}
                            onMouseEnter={e => e.currentTarget.style.background = D ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <span style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 8, display: "grid", placeItems: "center", background: `${item.color}14`, color: item.color }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                            </span>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {/* Inbox */}
                <button title="Inbox" onClick={() => { setDashSubTab(isInbox ? "overview" : "inbox"); setQuickAddOpen?.(false); }} style={circle(isInbox, "#22c55e")}
                  onMouseEnter={e => { if (!isInbox) e.currentTarget.style.background = D ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"; }}
                  onMouseLeave={e => { if (!isInbox) e.currentTarget.style.background = "transparent"; }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>
                  {inboxBadge > 0 && <span style={{ position: "absolute", top: -1, right: -1, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8, background: css.accent, color: "#fff", fontSize: 9, fontWeight: 700, display: "grid", placeItems: "center", fontFamily: "'JetBrains Mono', monospace" }}>{inboxBadge}</span>}
                </button>
              </div>
            </div>
          );
        })()}

        {/* Alert bar */}
        {pushSupported && !pushEnabled && dashSubTab === "overview" && (
          <div onClick={enablePushNotifications} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 18px", background: css.surface, border: `1px solid ${css.border}`,
            marginBottom: 16, cursor: "pointer", transition: "border-color 0.3s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = css.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = css.border}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={css.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              <span style={{ fontSize: 13, color: css.text, display: "inline-flex", alignItems: "center", gap: 8 }}>
                Enable flight alerts<em style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", color: css.text3, marginLeft: 6, fontSize: 13 }}>— track delays, gate changes.</em>
              </span>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: css.accent, padding: "4px 10px", border: `1px solid ${css.accent}`, transition: "all 0.25s" }}>{pushStatus || "Enable"} &#8594;</span>
          </div>
        )}

        {/* ── (Removed) old sub-tab pill ──
            Travel Analytics + Inbox now live in the menu pill at the top of the
            dashboard (next to the search bar), so this standalone sticky pill is
            disabled. Guarded with `false` rather than deleted to keep the diff
            small; safe to remove the whole block in a later cleanup. ── */}
        {false && !embeddedTab && (() => {
          const tabs = [
            { id: "reports", label: "Travel Analytics", hoverColor: "#14b8a6", gradFrom: "#14b8a6", gradTo: "#0d9488", icon: <><line x1="6" y1="20" x2="6" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="14"/></> },
            { id: "inbox", label: "Inbox", hoverColor: "#22c55e", gradFrom: "#80FF72", gradTo: "#22c55e", icon: <><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></>, badge: (savedItineraries.length + expenses.filter(e => !e.tripId && !e._demo).length) || 0 },
          ];

          // ── MOBILE: Gradient circle pills ──
          if (isMobile) {
            return (
              <div style={{
                position: "sticky", top: 0, zIndex: 100,
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, padding: "10px 12px", marginBottom: 20, marginTop: 12,
                background: D ? "rgba(15,15,15,0.92)" : "rgba(255,255,255,0.92)",
                backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              }}>
                {tabs.map(tab => {
                  const isActive = dashSubTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => { setDashSubTab(tab.id); if (tab.id !== "packing") setPackingViewTripId(null); setTimeout(() => { const m = document.querySelector("main"); if (m) m.scrollTo({ top: 0, behavior: "smooth" }); else window.scrollTo({ top: 0, behavior: "smooth" }); }, 0); }}
                      style={{
                        position: "relative", width: isActive ? 120 : 48, height: 48,
                        borderRadius: 24, border: "none", cursor: "pointer",
                        background: isActive ? `linear-gradient(135deg, ${tab.gradFrom}, ${tab.gradTo})` : (D ? "rgba(255,255,255,0.08)" : "#fff"),
                        boxShadow: isActive ? "none" : "0 2px 8px rgba(0,0,0,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        overflow: "hidden",
                      }}>
                      {/* Glow */}
                      {isActive && <div style={{ position: "absolute", top: 8, left: 0, right: 0, bottom: -8, borderRadius: 24, background: `linear-gradient(135deg, ${tab.gradFrom}, ${tab.gradTo})`, filter: "blur(12px)", opacity: 0.4, zIndex: -1 }} />}
                      {/* Icon — visible when not active */}
                      <span style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.4s", transform: isActive ? "scale(0)" : "scale(1)",
                        position: isActive ? "absolute" : "relative",
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={D ? "#888" : "#6B6458"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{tab.icon}</svg>
                      </span>
                      {/* Label — visible when active */}
                      <span style={{
                        fontFamily: "'Inter Tight', sans-serif", fontSize: 12, fontWeight: 600,
                        color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em",
                        transition: "all 0.4s", transform: isActive ? "scale(1)" : "scale(0)",
                        position: isActive ? "relative" : "absolute", whiteSpace: "nowrap",
                      }}>{tab.label}</span>
                      {/* Badge */}
                      {tab.badge > 0 && !isActive && <span style={{ position: "absolute", top: 2, right: 2, fontSize: 10, fontWeight: 700, color: "#fff", background: css.accent, borderRadius: 10, padding: "1px 4px", minWidth: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{tab.badge}</span>}
                    </button>
                  );
                })}
                {/* + button */}
                <button onClick={handleAddTrip} style={{ width: 48, height: 48, borderRadius: 24, border: "none", background: D ? css.text : "#15130F", color: D ? "#15130F" : "#F4F1EC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
            );
          }

          // ── DESKTOP: Editorial flat tabs ──
          return (
            <div data-tour="dash-tabs" style={{
              position: "sticky", top: 0, zIndex: 100,
              display: "flex", alignItems: "stretch", justifyContent: "center",
              marginBottom: 32, marginTop: 16,
              borderTop: `1px solid ${css.border}`, borderBottom: `1px solid ${css.border}`,
              background: D ? "rgba(15,15,15,0.92)" : "rgba(255,255,255,0.92)",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            }}>
              <div style={{ display: "flex" }}>
                {tabs.map((tab, ti) => {
                  const isActive = dashSubTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => { setDashSubTab(tab.id); if (tab.id !== "packing") setPackingViewTripId(null); setTimeout(() => { const m = document.querySelector("main"); if (m) m.scrollTo({ top: 0, behavior: "smooth" }); else window.scrollTo({ top: 0, behavior: "smooth" }); }, 0); }}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = tab.hoverColor; e.currentTarget.style.background = D ? "rgba(255,255,255,0.04)" : css.surface; } }}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = css.text3; e.currentTarget.style.background = "transparent"; } }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "16px 24px", cursor: "pointer", border: "none",
                        borderRight: `1px solid ${css.border}`,
                        borderLeft: ti === 0 ? `1px solid ${css.border}` : "none",
                        background: isActive ? (D ? "rgba(255,255,255,0.04)" : css.surface) : "transparent",
                        fontFamily: "'JetBrains Mono', 'Geist Mono', monospace",
                        fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
                        color: isActive ? css.text : css.text3,
                        transition: "all 0.3s", position: "relative",
                      }}>
                      {isActive && <div style={{ position: "absolute", left: 0, top: -1, right: 0, height: 2, background: tab.hoverColor }} />}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{tab.icon}</svg>
                      {tab.label}
                      {isActive && tab.section && <em style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", textTransform: "none", letterSpacing: 0, color: css.accent, marginLeft: 4, fontSize: 11, fontWeight: 400 }}>· {tab.section}</em>}
                      {tab.badge > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: css.accent, borderRadius: 10, padding: "1px 5px", marginLeft: 2 }}>{tab.badge}</span>}
                    </button>
                  );
                })}
              </div>
              <button data-tour="add-trip" onClick={handleAddTrip} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "0 24px",
                background: D ? css.text : "#15130F", color: D ? "#15130F" : "#F4F1EC",
                border: "none", fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 400,
                cursor: "pointer", transition: "all 0.3s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = css.accent; e.currentTarget.style.color = "#F4F1EC"; }}
                onMouseLeave={e => { e.currentTarget.style.background = D ? css.text : "#15130F"; e.currentTarget.style.color = D ? "#15130F" : "#F4F1EC"; }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Trip
              </button>
            </div>
          );
        })()}

        {/* ── Dashboard content ── */}
        {dashSubTab === "overview" && <>

                {/* Live transfer-bonus band — refreshed weekly */}
                {transferBonuses && (
                  <TransferBonusBand
                    bonuses={transferBonuses.active}
                    userBonuses={transferBonuses.forUser(userPointCurrencies || [])}
                    lastUpdated={transferBonuses.data?.lastUpdated}
                    isMobile={isMobile} darkMode={D} variant="compact"
                  />
                )}

                {/* Featured Trip — Editorial Hero Card */}
                {nextTrip && (() => {
                  const nt = nextTrip;
                  const ntName = nt.tripName || nt.trip_name || nt.location || "Upcoming Trip";
                  const ntSegs = (nt.segments || []).filter(s => !s._isMeta);
                  const ntDates = ntSegs.map(s => s.date).filter(Boolean).sort();
                  const ntNights = ntSegs.filter(s => s.type === "hotel").reduce((s, h) => s + (h.nights || 1), 0);
                  const ntFlights = ntSegs.filter(s => s.type === "flight");
                  const ntDepart = ntFlights[0]?.route?.split(/→|->/).map(s => s.trim())[0] || "";
                  const ntReturn = ntFlights.length > 0 ? ntFlights[ntFlights.length - 1]?.route?.split(/→|->/).map(s => s.trim()).pop() || "" : "";
                  const ntLoc = nt.location || ntName;
                  // Find a photo for this trip's destination
                  const ntCity = ntLoc.split(",")[0].trim();
                  const FEAT_PHOTOS = {
                    "Tokyo":"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1400&q=80&fit=crop",
                    "Osaka":"https://images.unsplash.com/photo-1590253230532-a67f6bc61b1e?w=1400&q=80&fit=crop",
                    "Hong Kong":"https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?w=1400&q=80&fit=crop",
                    "New York":"https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=1400&q=80&fit=crop",
                    "London":"https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1400&q=80&fit=crop",
                    "Paris":"https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1400&q=80&fit=crop",
                    "Taipei":"https://images.unsplash.com/photo-1552529899-8c1ebff7ea46?w=1400&q=80&fit=crop",
                    "Las Vegas":"https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=1400&q=80&fit=crop",
                    "Singapore":"https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1400&q=80&fit=crop",
                    "Bermuda":"https://images.unsplash.com/photo-1548574505-5e239809ee19?w=1400&q=80&fit=crop",
                  };
                  let ntPhoto = landmarkPhotos?.[`${ntCity}, `] || null;
                  if (!ntPhoto) { for (const [city, url] of Object.entries(FEAT_PHOTOS)) { if (ntLoc.toLowerCase().includes(city.toLowerCase())) { ntPhoto = url; break; } } }
                  if (!ntPhoto) ntPhoto = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1400&q=80&fit=crop";

                  return (
                    <div onClick={() => { setTripDetailId(nt.id); setActiveView("trips"); }}
                      style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 1fr", gap: 0, background: css.surface, border: `1px solid ${css.border}`, marginBottom: 32, overflow: "hidden", cursor: "pointer" }}>
                      {/* Image */}
                      <div style={{ position: "relative", minHeight: isMobile ? 220 : 400, overflow: "hidden", background: "#1a1a1a" }}>
                        <img src={ntPhoto} alt={ntName} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, filter: "saturate(0.85) contrast(1.05)" }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(21,19,15,0) 0%, rgba(21,19,15,0.2) 60%, rgba(21,19,15,0.6) 100%)" }} />
                        <div style={{ position: "absolute", bottom: 16, left: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#F4F1EC", opacity: 0.85, zIndex: 2 }}>
                          <span style={{ color: css.accent }}>&#9679; </span>{ntCity}
                        </div>
                      </div>
                      {/* Body */}
                      <div style={{ padding: isMobile ? 24 : "32px 36px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: css.accent, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: css.accent, boxShadow: `0 0 10px ${css.accent}`, display: "inline-block" }} />
                            Next Departure
                          </div>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 20 }}>
                            <span style={{ fontFamily: "'Fraunces', serif", fontSize: isMobile ? 36 : 64, fontWeight: 300, lineHeight: 0.9, letterSpacing: "-0.04em", color: css.text, fontVariantNumeric: "tabular-nums" }}>{daysToNext !== null ? daysToNext : "--"}</span>
                            <span style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 16, color: css.text3 }}>days away</span>
                          </div>
                          <div style={{ fontFamily: "'Fraunces', serif", fontSize: isMobile ? 24 : 32, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.1, color: css.text, marginBottom: 8 }}>
                            {ntName}
                          </div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: css.accent, fontWeight: 500, marginBottom: nt._shared ? 8 : 24 }}>
                            {nt.location || ""}{ntNights > 0 ? ` · ${ntNights} nights` : ""}
                          </div>
                          {nt._shared && (
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.1em", color: "#3b82f6", fontWeight: 500, marginBottom: 24, display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                              Shared by {nt._sharedBy || "Someone"}
                            </div>
                          )}
                        </div>
                        {/* Stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, paddingTop: 20, borderTop: `1px solid ${css.border}` }}>
                          <div style={{ paddingRight: 16, borderRight: `1px solid ${css.border}` }}>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3, marginBottom: 6 }}>Depart</div>
                            <div style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 15, fontWeight: 500, color: css.text }}>{ntDates[0] ? new Date(ntDates[0]+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "--"} {ntDepart && <span style={{ fontFamily: "'JetBrains Mono', monospace", color: css.text3, fontSize: 11, marginLeft: 4 }}>{ntDepart}</span>}</div>
                          </div>
                          <div style={{ padding: "0 16px", borderRight: `1px solid ${css.border}` }}>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3, marginBottom: 6 }}>Return</div>
                            <div style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 15, fontWeight: 500, color: css.text }}>{ntDates.length > 1 ? new Date(ntDates[ntDates.length-1]+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "--"} {ntReturn && <span style={{ fontFamily: "'JetBrains Mono', monospace", color: css.text3, fontSize: 11, marginLeft: 4 }}>{ntReturn}</span>}</div>
                          </div>
                          <div style={{ paddingLeft: 16 }}>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3, marginBottom: 6 }}>Status</div>
                            <div style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 15, fontWeight: 500, color: css.text, textTransform: "capitalize" }}>{nt.status || "Confirmed"}</div>
                          </div>
                        </div>
                        {/* Quick action chips — bypass the whole-card click to jump straight to a function */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${css.border}` }}>
                          <button onClick={e => { e.stopPropagation(); setTripDetailId(nt.id); setActiveView("trips"); }}
                            style={chipStyle(dv, css, true)}>
                            Open trip →
                          </button>
                          <button onClick={e => { e.stopPropagation(); setTripDetailId(nt.id); setPackingViewTripId(nt.id); setActiveView("trips"); }}
                            style={chipStyle(dv, css)}>
                            Packing list
                          </button>
                          {typeof generateFlightyICS === "function" && ntFlights.length > 0 && (
                            <button onClick={e => { e.stopPropagation(); generateFlightyICS(nt); }}
                              style={chipStyle(dv, css)}>
                              Export to calendar
                            </button>
                          )}
                          <button onClick={e => { e.stopPropagation(); setShowAddExpense(nt.id); }}
                            style={chipStyle(dv, css)}>
                            Log expense
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

        {/* ── Phase 2: Smart prompts row ── */}
        {smartPrompts.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${Math.min(smartPrompts.length, 3)}, 1fr)`, gap: 10, marginBottom: 32 }}>
            {smartPrompts.slice(0, 6).map(p => (
              <button key={p.id} onClick={p.onClick}
                style={{
                  textAlign: "left", cursor: "pointer", padding: isMobile ? "14px 16px" : "16px 18px",
                  background: dv.paper, border: `1px solid ${dv.cream}`, borderLeft: `3px solid ${p.accent}`,
                  display: "flex", flexDirection: "column", gap: 6, transition: "border-color 0.2s, background 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = dv.bone; }}
                onMouseLeave={e => { e.currentTarget.style.background = dv.paper; }}
              >
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: p.accent }}>
                  {p.eyebrow}
                </span>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, color: css.text, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
                  {p.title}
                </span>
                <span style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 12, color: css.text3, lineHeight: 1.4 }}>
                  {p.sub} →
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── Phase 3: Next 30 days rail ── */}
        {(railSegments.length > 0 || railSharedCount > 0) && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: isMobile ? 22 : 26, fontWeight: 400, letterSpacing: "-0.02em", color: css.text, margin: 0 }}>
                  Next 30 Days <em style={{ fontStyle: "italic", color: css.text3, fontSize: isMobile ? 14 : 16, marginLeft: 4 }}>— the rail.</em>
                </h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Hide shared toggle — only surfaces when there are shared trips in the window */}
                {railSharedCount > 0 && (
                  <button onClick={() => setHideShared?.(!hideShared)}
                    title={hideShared ? "Show shared trips everywhere in the app" : "Hide shared trips everywhere in the app"}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px",
                      border: `1px solid ${hideShared ? css.border : "#3b82f6"}`,
                      background: hideShared ? "transparent" : "rgba(59,130,246,0.06)",
                      color: hideShared ? css.text3 : "#3b82f6",
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
                      cursor: "pointer", transition: "all 0.2s",
                    }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: hideShared ? css.text3 : "#3b82f6" }} />
                    {hideShared ? "Shared hidden" : "Shared shown"}
                  </button>
                )}
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3 }}>
                  {railSegments.length} item{railSegments.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
            {railSegments.length === 0 ? (
              <div style={{ padding: "16px 18px", background: dv.paper, border: `1px solid ${dv.cream}`, fontFamily: "'Fraunces', serif", fontStyle: "italic", color: css.text3, fontSize: 14 }}>
                Every upcoming item in this window is from a shared trip — toggle "Shared hidden" to bring them back.
              </div>
            ) : (
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x proximity" }}>
              {railSegments.map((seg, i) => {
                const segDate = new Date(seg.date + "T12:00:00");
                const dateLabel = segDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const dayLabel = segDate.toLocaleDateString("en-US", { weekday: "short" });
                const segTypeLower = (seg.type || "").toString().toLowerCase();
                const typeLabels = { flight: "Flight", hotel: "Hotel", activity: "Activity", car: "Car", train: "Train" };
                const typeIcon = segTypeLower === "flight"
                  ? <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                  : <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>;
                const typeLabel = typeLabels[segTypeLower] || (seg.type ? String(seg.type).charAt(0).toUpperCase() + String(seg.type).slice(1) : "Item");
                const detail = segTypeLower === "flight"
                  ? (seg.route || `${seg.departureAirport || ""} → ${seg.arrivalAirport || ""}`.trim().replace(/^→\s*$/, ""))
                  : (seg.property || seg.title || seg.name || seg.route || seg.location || typeLabel);
                return (
                  <button key={`${seg._tripId}-${seg.id || i}`} onClick={() => {
                    // Queue a jump that App.jsx's resolver will translate into
                    // the right day-pill index + expanded card key once Trips loads.
                    setPendingTripJump?.({
                      tripId: seg._tripId,
                      segDate: seg.date,
                      match: { type: seg.type || "", date: seg.date || "", flightNumber: seg.flightNumber || "", route: seg.route || "" },
                    });
                    setTripDetailId(seg._tripId);
                    setActiveView("trips");
                  }}
                    style={{
                      flex: "0 0 auto", scrollSnapAlign: "start", textAlign: "left", cursor: "pointer",
                      width: isMobile ? 200 : 220, minWidth: 0, maxWidth: isMobile ? 200 : 220,
                      boxSizing: "border-box", overflow: "hidden",
                      padding: "14px 16px",
                      background: dv.paper, border: `1px solid ${dv.cream}`,
                      display: "flex", flexDirection: "column", gap: 8, transition: "border-color 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = css.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = dv.cream; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3, minWidth: 0 }}>
                      <span style={{ color: css.accent }}>{dateLabel}</span>
                      <span>· {dayLabel}</span>
                      <span style={{ marginLeft: "auto", color: css.text3 }}>{typeLabel}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <span style={{ width: 28, height: 28, background: dv.bone, border: `1px solid ${dv.cream}`, color: css.text3, display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{typeIcon}</svg>
                      </span>
                      <span style={{ fontFamily: "'Fraunces', serif", fontSize: 15, color: css.text, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 }}>
                        {detail}
                      </span>
                    </div>
                    {/* Flight number + time row (or just time for non-flight segments) */}
                    {(() => {
                      const fn = segTypeLower === "flight" ? (seg.flightNumber || "") : "";
                      const tm = seg.departureTime || seg.time || seg.startTime || "";
                      if (!fn && !tm) return null;
                      return (
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.06em", color: css.accent, fontWeight: 500, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                          {[fn, tm].filter(Boolean).join(" · ")}
                        </div>
                      );
                    })()}
                    <div style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 11, color: css.text3, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, maxWidth: "100%" }}>
                      {seg._tripName}
                    </div>
                    {seg._tripShared && (
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.08em", color: "#3b82f6", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, maxWidth: "100%" }}>
                        Shared by {seg._tripSharedBy || "Someone"}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* ── Upcoming Trips — Editorial Timeline ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "32px 0 20px", paddingBottom: 14, borderBottom: `1px solid ${css.border}` }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: isMobile ? 24 : 28, fontWeight: 400, letterSpacing: "-0.02em", color: css.text, margin: 0 }}>
            Upcoming Trips <em style={{ fontStyle: "italic", color: css.text3, fontSize: isMobile ? 16 : 20, marginLeft: 4 }}>— the chronicle.</em>
          </h2>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: css.text3, letterSpacing: "0.1em" }}>S 02 · Itinerary</span>
            <button onClick={() => setActiveView("trips")} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: css.accent, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "gap 0.25s" }}
              onMouseEnter={e => e.currentTarget.style.gap = "10px"} onMouseLeave={e => e.currentTarget.style.gap = "6px"}>
              View All &#8599;
            </button>
          </div>
        </div>
        <div style={{ marginBottom: 32 }}>
          {upcomingTripsFiltered.slice(0, 6).map((trip, tIdx) => {
            const tripStart = trip.date || (trip.segments && trip.segments.map(s => s.date).filter(Boolean).sort()[0]) || "";
            const daysAway = tripStart ? Math.max(0, Math.ceil((new Date(tripStart + "T12:00:00") - new Date()) / 86400000)) : null;
            const confCode = trip.confirmationCode || trip.confirmation_code || (trip.segments && trip.segments.map(s => s.confirmationCode).filter(Boolean)[0]) || "";
            const realSegs = (trip.segments || []).filter(s => !s._isMeta);
            const hasFlights = realSegs.some(s => s.type === "flight");
            const tripName = trip.tripName || trip.trip_name || trip.location || "Trip";
            const sColors = { confirmed: "#6B7A5A", planned: "#B8924A", pending: css.accent };
            const sColor = sColors[trip.status] || css.text3;
            // Get city codes from flights
            const cityCodes = [];
            realSegs.filter(s => s.type === "flight" && s.route).forEach(s => {
              const codes = (s.route || "").split(/→|->|-|\//).map(c => c.trim().toUpperCase()).filter(c => c.length === 3);
              codes.forEach(c => { if (!cityCodes.includes(c)) cityCodes.push(c); });
            });

            return (
              <div key={trip.id} onClick={() => { setTripDetailId(trip.id); setTripDetailSegIdx(0); setActiveView("trips"); }}
                style={{
                  display: "grid", gridTemplateColumns: isMobile ? "auto 1fr auto" : "auto auto 1fr auto auto auto",
                  gap: isMobile ? 12 : 20, alignItems: "center", padding: isMobile ? "16px 16px" : "18px 24px",
                  background: dv.paper, border: `1px solid ${dv.cream}`,
                  marginBottom: tIdx < Math.min(upcomingTripsFiltered.length, 6) - 1 ? 3 : 0,
                  cursor: "pointer", transition: "background 0.3s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = dv.bone}
                onMouseLeave={e => e.currentTarget.style.background = dv.paper}>
                {/* Index */}
                {!isMobile && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: dv.stone, letterSpacing: "0.08em", width: 24 }}>{String(tIdx + 1).padStart(2, "0")}</span>}
                {/* Icon */}
                <div style={{ width: 38, height: 38, border: `1px solid ${dv.cream}`, background: dv.bone, display: "grid", placeItems: "center", flexShrink: 0, transition: "border-color 0.3s, color 0.3s" }}>
                  <SegIcon type={hasFlights ? "flight" : "hotel"} size={16} color={dv.taupe} />
                </div>
                {/* Main */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: isMobile ? 18 : 22, fontWeight: 400, letterSpacing: "-0.015em", color: dv.ink, lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tripName}
                  </div>
                  {trip.location && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: css.accent, fontWeight: 500, marginTop: 4 }}>
                      {trip.location}
                    </div>
                  )}
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.04em", color: dv.taupe, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                    <span>{formatTripDates(trip)}</span>
                    {confCode && <span style={{ background: dv.bone, border: `1px solid ${dv.cream}`, padding: "1px 6px", fontSize: 10, letterSpacing: "0.08em", color: dv.taupe }}>{confCode}</span>}
                    {trip._shared && <span style={{ color: "#3b82f6", fontWeight: 500 }}>Shared by {trip._sharedBy || "Someone"}</span>}
                  </div>
                </div>
                {/* City codes */}
                {!isMobile && cityCodes.length > 0 && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: css.accent, letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", gap: 4, alignItems: "center" }}>
                    {cityCodes.slice(0, 4).map((c, i) => <span key={i}>{c}{i < Math.min(cityCodes.length, 4) - 1 && <span style={{ color: dv.stone, margin: "0 2px" }}>&#8594;</span>}</span>)}
                  </div>
                )}
                {/* Days */}
                <div style={{ textAlign: "right", minWidth: isMobile ? 40 : 60 }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: isMobile ? 18 : 24, fontWeight: 400, lineHeight: 1, color: dv.ink, fontVariantNumeric: "tabular-nums" }}>{daysAway !== null ? daysAway : "--"}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginTop: 3 }}>days out</div>
                </div>
                {/* Status */}
                {!isMobile && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", padding: "4px 10px", border: `1px solid ${sColor}`, color: sColor }}>{trip.status || "planned"}</span>}
                {/* Edit / Delete actions — owners get both, shared trips with edit permission get edit only */}
                {!isMobile && (() => {
                  const canEdit = !trip._shared || trip._permission === "edit";
                  const canDelete = true; // shared trips delete = remove the share
                  return (
                    <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                      {canEdit && openEditTrip && (
                        <button onClick={e => { e.stopPropagation(); openEditTrip(trip); }} title={trip._shared ? "Edit shared trip" : "Edit trip"} style={{
                          width: 28, height: 28, border: `1px solid ${dv.cream}`, background: "transparent", color: dv.taupe,
                          display: "grid", placeItems: "center", cursor: "pointer", transition: "all 0.2s",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.color = css.text; e.currentTarget.style.borderColor = css.text; }}
                          onMouseLeave={e => { e.currentTarget.style.color = dv.taupe; e.currentTarget.style.borderColor = dv.cream; }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        </button>
                      )}
                      {canDelete && removeTrip && (
                        <button onClick={e => { e.stopPropagation(); removeTrip(trip); }} title={trip._shared ? "Remove shared trip" : "Delete trip"} style={{
                          width: 28, height: 28, border: `1px solid ${dv.cream}`, background: "transparent", color: dv.taupe,
                          display: "grid", placeItems: "center", cursor: "pointer", transition: "all 0.2s",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#C8553D"; e.currentTarget.style.borderColor = "#C8553D"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = dv.taupe; e.currentTarget.style.borderColor = dv.cream; }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      )}
                    </div>
                  );
                })()}
                {/* Arrow */}
                {!isMobile && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={dv.taupe} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.3s, color 0.3s" }}><polyline points="9 18 15 12 9 6"/></svg>}
              </div>
            );
          })}
          {upcomingTripsFiltered.length === 0 && (
            <div style={{ padding: "48px 20px", textAlign: "center", background: dv.paper, border: `1px solid ${dv.cream}` }}>
              <p style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 16, color: dv.taupe }}>No upcoming trips — add one to begin.</p>
            </div>
          )}
        </div>

        {/* ── Trip Highlights — Editorial Scrollable Rail ── */}
        {upcomingTripsFiltered.length > 0 && (() => {
          const IATA_CITY = { JFK: "New York", LAX: "Los Angeles", SFO: "San Francisco", ORD: "Chicago", MIA: "Miami", LHR: "London", CDG: "Paris", NRT: "Tokyo", HND: "Tokyo", KIX: "Osaka", ICN: "Seoul", SIN: "Singapore", HKG: "Hong Kong", DXB: "Dubai", FCO: "Rome", BCN: "Barcelona", AMS: "Amsterdam", IST: "Istanbul", BKK: "Bangkok", SYD: "Sydney", YYZ: "Toronto", TPE: "Taipei", BDA: "Bermuda", NAS: "Nassau", CUN: "Cancun", HNL: "Honolulu", ATH: "Athens", LIS: "Lisbon", PRG: "Prague", BUD: "Budapest", VIE: "Vienna", SEA: "Seattle", BOS: "Boston", DEN: "Denver", MCO: "Orlando", FLL: "Fort Lauderdale", LAS: "Las Vegas", YVR: "Vancouver", YUL: "Montreal", DOH: "Doha", TSA: "Taipei", EWR: "New York" };
          const CITY_LANDMARKS = {
            "New York": ["Statue of Liberty", "Central Park", "Times Square", "Brooklyn Bridge", "Empire State Building"],
            "London": ["Big Ben", "Tower Bridge", "Buckingham Palace", "British Museum", "Hyde Park"],
            "Paris": ["Eiffel Tower", "Louvre Museum", "Arc de Triomphe", "Notre-Dame", "Montmartre"],
            "Tokyo": ["Shibuya Crossing", "Senso-ji Temple", "Tokyo Tower", "Meiji Shrine", "Tsukiji Market"],
            "Osaka": ["Osaka Castle", "Dotonbori", "Universal Studios", "Shinsekai", "Namba"],
            "Seoul": ["Gyeongbokgung Palace", "Bukchon Hanok Village", "Myeongdong", "N Seoul Tower", "Hongdae"],
            "Singapore": ["Marina Bay Sands", "Gardens by the Bay", "Sentosa Island", "Chinatown", "Orchard Road"],
            "Hong Kong": ["Victoria Peak", "Star Ferry", "Temple Street", "Tian Tan Buddha", "Mong Kok"],
            "Dubai": ["Burj Khalifa", "Palm Jumeirah", "Dubai Mall", "Gold Souk", "Dubai Marina"],
            "Rome": ["Colosseum", "Vatican City", "Trevi Fountain", "Pantheon", "Spanish Steps"],
            "Barcelona": ["Sagrada Familia", "Park Guell", "La Rambla", "Casa Batllo", "Gothic Quarter"],
            "Amsterdam": ["Anne Frank House", "Rijksmuseum", "Canal Cruise", "Vondelpark", "Dam Square"],
            "Istanbul": ["Hagia Sophia", "Blue Mosque", "Grand Bazaar", "Topkapi Palace", "Bosphorus Cruise"],
            "Bangkok": ["Grand Palace", "Wat Pho", "Chatuchak Market", "Khao San Road", "Jim Thompson House"],
            "Sydney": ["Opera House", "Harbour Bridge", "Bondi Beach", "Taronga Zoo", "The Rocks"],
            "Bermuda": ["Horseshoe Bay", "Crystal Caves", "Royal Naval Dockyard", "St George", "Gibbs Hill Lighthouse"],
            "Miami": ["South Beach", "Wynwood Walls", "Art Deco District", "Brickell", "Little Havana"],
            "Los Angeles": ["Hollywood Sign", "Santa Monica Pier", "Griffith Observatory", "Venice Beach", "Getty Center"],
            "San Francisco": ["Golden Gate Bridge", "Alcatraz Island", "Fishermans Wharf", "Chinatown", "Cable Cars"],
            "Chicago": ["Millennium Park", "Willis Tower", "Navy Pier", "Art Institute", "Magnificent Mile"],
            "Honolulu": ["Waikiki Beach", "Diamond Head", "Pearl Harbor", "North Shore", "Ala Moana"],
            "Cancun": ["Chichen Itza", "Isla Mujeres", "Xcaret Park", "Tulum Ruins", "Cenotes"],
            "Nassau": ["Atlantis Resort", "Cable Beach", "Fort Charlotte", "Blue Lagoon", "Junkanoo Beach"],
            "Taipei": ["Taipei 101", "Jiufen Old Street", "Shilin Night Market", "National Palace Museum", "Elephant Mountain"],
            "Washington DC": ["Lincoln Memorial", "Capitol Building", "Smithsonian", "Georgetown", "National Mall"],
            "Boston": ["Freedom Trail", "Fenway Park", "Harvard Yard", "Boston Common", "Faneuil Hall"],
            "Seattle": ["Space Needle", "Pike Place Market", "Chihuly Garden", "Museum of Pop Culture", "Kerry Park"],
            "Toronto": ["CN Tower", "Royal Ontario Museum", "Distillery District", "Kensington Market", "Toronto Islands"],
          };
          // Normalize city name lookups (handle "New York City" -> "New York" etc.)
          const normalizeCity = (name) => {
            const map = { "New York City": "New York", "NYC": "New York", "LA": "Los Angeles", "SF": "San Francisco", "DC": "Washington DC", "Washington": "Washington DC" };
            return map[name] || name;
          };
          return (
            <div>
              {/* Section head */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "0 0 20px", paddingBottom: 14, borderBottom: `1px solid ${css.border}` }}>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: isMobile ? 24 : 28, fontWeight: 400, letterSpacing: "-0.02em", color: css.text, margin: 0 }}>
                  Trip Highlights <em style={{ fontStyle: "italic", color: css.text3, fontSize: isMobile ? 16 : 20, marginLeft: 4 }}>— places to wander.</em>
                </h2>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: css.text3, letterSpacing: "0.1em" }}>S 03 · Itinerary Notes</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 32, marginBottom: 32 }}>
                {upcomingTripsFiltered.slice(0, 4).map((trip, tIdx) => {
                  const realSegs = (trip.segments || []).filter(s => !s._isMeta);
                  const flights = realSegs.filter(s => s.type === "flight");
                  // Collect unique destination cities from flight segments
                  // Find origin city (first departure) and final return (last arrival) to exclude
                  const sortedFlights = [...flights].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
                  const homeCode = sortedFlights.length > 0 ? (sortedFlights[0].departureAirport?.toUpperCase() || sortedFlights[0].route?.split(/[→\-–>\/]/)[0]?.trim()?.toUpperCase()) : null;
                  const returnCode = sortedFlights.length > 0 ? (sortedFlights[sortedFlights.length - 1].arrivalAirport?.toUpperCase() || sortedFlights[sortedFlights.length - 1].route?.split(/[→\-–>\/]/).pop()?.trim()?.toUpperCase()) : null;
                  const homeCodes = new Set([homeCode, returnCode].filter(Boolean));

                  // Collect all airport codes from flights
                  const allCodes = new Set();
                  flights.forEach(f => {
                    if (f.arrivalAirport) allCodes.add(f.arrivalAirport.toUpperCase());
                    if (f.departureAirport) allCodes.add(f.departureAirport.toUpperCase());
                    if (f.route) {
                      f.route.split(/[→\-–>\/]/).map(s => s.trim().toUpperCase()).filter(s => s.length === 3 && /^[A-Z]{3}$/.test(s)).forEach(code => allCodes.add(code));
                    }
                  });

                  // Remove home/origin airports — keep only destination cities
                  homeCodes.forEach(code => allCodes.delete(code));

                  const cities = [...allCodes].map(code => IATA_CITY[code]).filter(Boolean);

                  // Also check non-flight segments for location-based cities
                  realSegs.filter(s => s.type !== "flight").forEach(s => {
                    if (s.location) {
                      s.location.split(/[,\/]/).map(p => p.trim()).filter(Boolean).forEach(loc => {
                        const n = normalizeCity(loc);
                        if (CITY_LANDMARKS[n] && !cities.includes(n)) cities.push(n);
                      });
                    }
                  });

                  // Also parse trip.location for additional cities
                  if (trip.location) {
                    trip.location.split(/[,\/]/).map(s => s.trim()).filter(Boolean).forEach(loc => {
                      const normalized = normalizeCity(loc);
                      // Skip if it matches the home city
                      const homeCity = homeCode ? IATA_CITY[homeCode] : null;
                      if (normalized !== homeCity && !cities.includes(normalized)) cities.push(normalized);
                    });
                  }
                  const uniqueCities = [...new Set(cities)];
                  // Build landmark cards
                  const landmarks = [];
                  const CITY_PHOTOS = {
                      "New York": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80&auto=format&fit=crop",
                      "London": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80&auto=format&fit=crop",
                      "Paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80&auto=format&fit=crop",
                      "Tokyo": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80&auto=format&fit=crop",
                      "Osaka": "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400&q=80&auto=format&fit=crop",
                      "Seoul": "https://images.unsplash.com/photo-1546874177-9e664107314e?w=400&q=80&auto=format&fit=crop",
                      "Singapore": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80&auto=format&fit=crop",
                      "Hong Kong": "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=400&q=80&auto=format&fit=crop",
                      "Dubai": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80&auto=format&fit=crop",
                      "Rome": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80&auto=format&fit=crop",
                      "Barcelona": "https://images.unsplash.com/photo-1583779457094-ab6f77f7bf57?w=400&q=80&auto=format&fit=crop",
                      "Amsterdam": "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&q=80&auto=format&fit=crop",
                      "Istanbul": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&q=80&auto=format&fit=crop",
                      "Bangkok": "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=400&q=80&auto=format&fit=crop",
                      "Sydney": "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=400&q=80&auto=format&fit=crop",
                      "Bermuda": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&q=80&auto=format&fit=crop",
                      "Miami": "https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=400&q=80&auto=format&fit=crop",
                      "Los Angeles": "https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=400&q=80&auto=format&fit=crop",
                      "San Francisco": "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=400&q=80&auto=format&fit=crop",
                      "Chicago": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80&auto=format&fit=crop",
                      "Honolulu": "https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=400&q=80&auto=format&fit=crop",
                      "Taipei": "https://images.unsplash.com/photo-1508248467877-aec1e22e0e68?w=400&q=80&auto=format&fit=crop",
                      "Cancun": "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400&q=80&auto=format&fit=crop",
                      "Vancouver": "https://images.unsplash.com/photo-1559511260-66a68e7e9b97?w=400&q=80&auto=format&fit=crop",
                      "Montreal": "https://images.unsplash.com/photo-1519178614-68673b201f36?w=400&q=80&auto=format&fit=crop",
                      "Nashville": "https://images.unsplash.com/photo-1545419913-775cae67e15f?w=400&q=80&auto=format&fit=crop",
                      "Fort Lauderdale": "https://images.unsplash.com/photo-1591792111137-5b8219d5fad6?w=400&q=80&auto=format&fit=crop",
                      "Washington DC": "https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=400&q=80&auto=format&fit=crop",
                      "Jersey City": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80&auto=format&fit=crop",
                  };
                  uniqueCities.forEach(city => {
                    const normalCity = normalizeCity(city);
                    const cityLandmarks = CITY_LANDMARKS[normalCity] || [`Visit ${city}`];
                    const defaultCityPhoto = CITY_PHOTOS[normalCity] || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80&auto=format&fit=crop";
                    cityLandmarks.forEach(lm => {
                      const photoKey = `${lm}, ${normalCity}`;
                      const fallback = LANDMARK_FALLBACK_PHOTOS[lm] || defaultCityPhoto;
                      landmarks.push({ city: normalCity, name: lm, photo: landmarkPhotos[photoKey] || fallback, _fetchKey: photoKey, _lm: lm, _city: normalCity });
                    });
                  });
                  if (landmarks.length === 0 && trip.location) {
                    const loc = normalizeCity(trip.location.split(",")[0].trim());
                    landmarks.push({ city: loc, name: `Visit ${loc}`, photo: landmarkPhotos[`${loc}, `] || CITY_PHOTOS[loc] || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80&auto=format&fit=crop", _fetchKey: `${loc}, `, _lm: loc, _city: "" });
                  }
                  return (
                    <div key={trip.id}>
                      {/* Trip header — editorial layout */}
                      <div style={{ display: "flex", alignItems: "baseline", gap: isMobile ? 10 : 20, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${css.border}`, flexWrap: "wrap" }}>
                        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: isMobile ? 18 : 24, fontWeight: 400, letterSpacing: "-0.015em", color: css.text, margin: 0 }}>{trip.tripName || trip.trip_name || trip.location || "Trip"}</h3>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: css.text3, letterSpacing: "0.05em" }}>{formatTripDates(trip)}</span>
                        {uniqueCities.length > 0 && (
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: css.accent }}>
                            {uniqueCities.map((c, ci) => <span key={ci}>{c}{ci < uniqueCities.length - 1 && <span style={{ color: css.text3, margin: "0 6px" }}>·</span>}</span>)}
                          </span>
                        )}
                      </div>
                      {/* Scrollable highlight rail — editorial cards */}
                      <div style={{ display: "flex", gap: 14, overflowX: "auto", scrollBehavior: "smooth", margin: isMobile ? "0 -16px" : "0 -40px", padding: isMobile ? "4px 16px 12px" : "4px 40px 12px", scrollbarWidth: "thin", scrollbarColor: `${css.text3}40 transparent` }}>
                        {landmarks.slice(0, 10).map((lm, li) => (
                          <a key={li} href={`https://www.google.com/search?q=${encodeURIComponent(lm.name + " " + lm.city)}`} target="_blank" rel="noopener noreferrer"
                            style={{ flex: "0 0 240px", height: 300, position: "relative", overflow: "hidden", cursor: "pointer", background: "#2C2A26", border: `1px solid ${css.border}`, textDecoration: "none", transition: "all 0.4s" }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = css.accent; const img = e.currentTarget.querySelector("img"); if (img) { img.style.transform = "scale(1.08)"; img.style.filter = "saturate(1) contrast(1.08)"; } }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = css.border; const img = e.currentTarget.querySelector("img"); if (img) { img.style.transform = "scale(1)"; img.style.filter = "saturate(0.88) contrast(1.05)"; } }}>
                            {/* Image */}
                            {lm.photo && <img src={lm.photo} alt={lm.name} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.88) contrast(1.05)", transition: "transform 0.9s ease, filter 0.3s" }} />}
                            {/* Gradient overlay */}
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(21,19,15,0.85) 0%, rgba(21,19,15,0.1) 55%, rgba(21,19,15,0.3) 100%)", zIndex: 1 }} />
                            {/* Index */}
                            <div style={{ position: "absolute", top: 14, left: 14, zIndex: 2, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.15em", color: "#F4F1EC", opacity: 0.85 }}>
                              <span style={{ color: css.accent }}>N&#176; </span>{String(li + 1).padStart(2, "0")}
                            </div>
                            {/* Body */}
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 18, zIndex: 2 }}>
                              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: css.accent, opacity: 0.9, marginBottom: 8 }}>{lm.city}</div>
                              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.05, color: "#F4F1EC", marginBottom: 10 }}>{lm.name}</div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid rgba(244,241,236,0.2)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F4F1EC", opacity: 0.85 }}>
                                <span>N&#176; {String(li + 1).padStart(3, "0")}</span>
                                <span style={{ color: css.accent }}>Explore &#8594;</span>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        </>}

        {/* ── Inbox Tab — Booking + Expense Inboxes ── */}
        {dashSubTab === "inbox" && (() => {
          const dv = { bone: D ? "#1a1a1a" : "#F4F1EC", paper: D ? "#222" : "#EBE6DD", cream: D ? "rgba(255,255,255,0.06)" : "#E2DCCE", stone: D ? "#8a8a8a" : "#857A66", taupe: D ? "#999" : "#6B6458", graphite: D ? "#111" : "#2C2A26", ink: D ? "#f0ece6" : "#15130F", serif: "'Fraunces', serif", sans: "'Inter Tight', sans-serif", mono: "'JetBrains Mono', monospace" };
          return (
          <div style={{ fontFamily: dv.sans, color: dv.ink }}>
          {/* Hero */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 0.9fr", gap: isMobile ? 24 : 48, paddingBottom: 32, borderBottom: `1px solid ${dv.cream}`, marginBottom: 32, alignItems: "end" }}>
            <div>
              <div style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: css.accent, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 1, background: css.accent }} /> The forwarding desk
              </div>
              <h1 style={{ fontFamily: dv.serif, fontSize: isMobile ? 26 : "clamp(48px, 8vw, 96px)", fontWeight: 300, lineHeight: 0.94, letterSpacing: "-0.035em", margin: 0 }}>
                Forward a booking. Snap a receipt. <em style={{ fontStyle: "italic", fontWeight: 400, color: css.accent }}>We'll do the rest.</em>
              </h1>
            </div>
            <div style={{ paddingBottom: 8 }}>
              <p style={{ fontSize: 15, lineHeight: 1.55, color: dv.taupe, maxWidth: 400, margin: 0 }}>
                Trips and receipts arrive here for triage. Confirmations turn into itineraries; loose receipts get filed against trips. You decide what to keep.
              </p>
            </div>
          </div>
          {/* Gmail connection */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: dv.paper, border: `1px solid ${dv.cream}`, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" fill={css.accent}/></svg>
              <div>
                <div style={{ fontFamily: dv.sans, fontSize: 13, fontWeight: 600, color: dv.ink }}>Auto-import from Gmail</div>
                <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 12, color: dv.taupe, marginTop: 2 }}>Detect flight confirmations, changes, and cancellations.</div>
              </div>
            </div>
            <button onClick={async () => {
              const res = await fetch(`/api/gmail-auth?userId=${user?.id}`);
              const data = await res.json();
              if (data.authUrl) window.location.href = data.authUrl;
            }} style={{
              fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
              color: css.accent, padding: "8px 16px", border: `1px solid ${css.accent}`, background: "transparent",
              cursor: "pointer", transition: "all 0.25s", whiteSpace: "nowrap", flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 8,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = css.accent; e.currentTarget.style.color = "#F4F1EC"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = css.accent; }}>
              Connect Gmail &#8594;
            </button>
          </div>

          {/* Section header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${dv.cream}` }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <h3 style={{ fontFamily: dv.serif, fontSize: 22, fontWeight: 400, letterSpacing: "-0.015em", color: dv.ink, margin: 0 }}>Booking Inbox</h3>
              {savedItineraries.length > 0 && (
                <span style={{ fontFamily: dv.mono, fontSize: 10, color: css.accent, letterSpacing: "0.08em", background: dv.paper, border: `1px solid ${dv.cream}`, padding: "2px 8px" }}>{savedItineraries.length}</span>
              )}
            </div>
            <button onClick={() => setShowPasteItinerary(true)} style={{
              padding: "10px 18px", border: `1px solid ${dv.cream}`, background: dv.paper, color: dv.ink,
              fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
              cursor: "pointer", transition: "all 0.25s",
            }} onMouseEnter={e => { e.currentTarget.style.borderColor = dv.ink; }} onMouseLeave={e => { e.currentTarget.style.borderColor = dv.cream; }}>
              + Add Booking
            </button>
          </div>
          {/* Forwarding address — available to every user */}
          {userForwardingAddress && (
            <div style={{ marginBottom: 20, padding: "12px 16px", background: dv.paper, border: `1px solid ${dv.cream}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={dv.taupe} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.08em", textTransform: "uppercase" }}>Forward bookings to:</span>
              <span style={{ fontFamily: dv.mono, fontSize: 12, fontWeight: 500, color: css.accent, cursor: "pointer", wordBreak: "break-all" }}
                onClick={() => { navigator.clipboard?.writeText("trips@gocontinuum.app"); }}
                title="Click to copy">
                trips@gocontinuum.app
              </span>
              <span style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 11, color: dv.taupe }}>tap to copy</span>
            </div>
          )}

          {savedItineraries.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {savedItineraries.map(itin => {
                const segs = itin.parsed_segments || [];
                const flights = segs.filter(s => s.type === "flight");
                const hotels = segs.filter(s => s.type === "hotel");
                const isHotel = hotels.length > 0 && flights.length === 0;
                const firstDate = segs.map(s => s.date).filter(Boolean).sort()[0];
                const isExpanded = expandedItinId === itin.id;
                // Booking type is stored as parse_method = "ai|<type>"
                const bookingType = (itin.parse_method || "").split("|")[1] || "new_booking";
                const typeMeta = {
                  new_booking: { label: "New booking", color: dv.moss, bg: "rgba(107,122,90,0.10)" },
                  change:      { label: "Booking change", color: css.accent, bg: "rgba(200,85,61,0.10)" },
                  cancellation:{ label: "Cancellation", color: dv.gold, bg: "rgba(184,146,74,0.12)" },
                  reminder:    { label: "Reminder", color: dv.taupe, bg: dv.bone },
                }[bookingType] || { label: "Booking", color: dv.taupe, bg: dv.bone };
                // Try to match this itinerary against an existing trip by confirmation code
                const matchedTrip = itin.confirmation_code
                  ? trips.find(t => {
                      const code = (t.confirmationCode || t.confirmation_code || "").toString().toUpperCase();
                      const segCode = (t.segments || []).map(s => (s?.confirmationCode || "").toString().toUpperCase()).find(Boolean);
                      const target = itin.confirmation_code.toString().toUpperCase();
                      return code === target || segCode === target;
                    })
                  : null;
                const updateItinSeg = (segIdx, updates) => {
                  setSavedItineraries(prev => prev.map(it => it.id !== itin.id ? it : {
                    ...it, parsed_segments: it.parsed_segments.map((s, i) => i === segIdx ? { ...s, ...updates } : s),
                  }));
                };
                return (
                  <div key={itin.id} style={{ background: dv.paper, border: `1px solid ${dv.cream}`, overflow: "hidden", transition: "all 0.2s ease" }}>
                    {/* Header row */}
                    <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, cursor: "pointer" }}
                      onClick={() => setExpandedItinId(isExpanded ? null : itin.id)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <SegIcon type={isHotel ? "hotel" : "flight"} size={16} color={css.accent} />
                          <span style={{ fontFamily: dv.serif, fontSize: 14, fontWeight: 400, letterSpacing: "-0.01em", color: dv.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {isHotel ? (hotels[0]?.property || itin.subject || "Hotel") : (itin.subject || "Booking")}
                          </span>
                          <span style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: typeMeta.color, background: typeMeta.bg, border: `1px solid ${typeMeta.color}40`, padding: "2px 7px", whiteSpace: "nowrap" }}>
                            {typeMeta.label}
                          </span>
                          {matchedTrip && bookingType !== "new_booking" && (
                            <span style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 11, color: dv.taupe }}>
                              · matches {matchedTrip.tripName || matchedTrip.trip_name || "an existing trip"}
                            </span>
                          )}
                        </div>
                        <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", color: dv.taupe, display: "flex", gap: 10, flexWrap: "wrap" }}>
                          {itin.confirmation_code && <span style={{ fontWeight: 600, color: dv.ink }}>{itin.confirmation_code}</span>}
                          {isHotel && hotels[0]?.date && <span>{new Date(hotels[0].date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {hotels[0].checkoutDate ? new Date(hotels[0].checkoutDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>}
                          {isHotel && hotels[0]?.nights && <span>{hotels[0].nights} night{hotels[0].nights > 1 ? "s" : ""}</span>}
                          {flights.length > 0 && <span>{flights.length} segment{flights.length > 1 ? "s" : ""}</span>}
                          {flights.length > 0 && flights[0]?.departureAirport && <span>{flights.map(f => f.departureAirport).filter(Boolean)[0]} → {flights.map(f => f.arrivalAirport).filter(Boolean).pop()}</span>}
                          {firstDate && !isHotel && <span>{new Date(firstDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                          {flights[0]?.airline && <span>{flights[0].airline}</span>}
                          {flights[0]?.fareClass && <span style={{ textTransform: "capitalize" }}>{flights[0].fareClass}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                          <path d="M4 6l4 4 4-4" stroke={dv.taupe} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                    {/* Expanded detail + edit */}
                    {isExpanded && (
                      <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${dv.cream}` }}>
                        {segs.map((seg, segIdx) => (
                          <div key={segIdx} style={{ padding: "12px 0", borderBottom: segIdx < segs.length - 1 ? `1px solid ${dv.cream}` : "none" }}>
                            <div style={{ fontFamily: dv.mono, fontSize: 10, fontWeight: 700, color: css.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{seg.type === "hotel" ? "Hotel" : "Flight"}</div>
                            {seg.type === "hotel" ? (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                {[
                                  { key: "property", label: "Property" },
                                  { key: "location", label: "Address" },
                                  { key: "date", label: "Check-in", type: "date" },
                                  { key: "checkoutDate", label: "Check-out", type: "date" },
                                  { key: "roomType", label: "Room Type" },
                                  { key: "nights", label: "Nights", type: "number" },
                                  { key: "confirmationCode", label: "Confirmation" },
                                  { key: "totalCost", label: "Total Cost" },
                                ].map(f => (
                                  <div key={f.key}>
                                    <label style={{ fontFamily: dv.mono, fontSize: 11, fontWeight: 700, color: dv.taupe, textTransform: "uppercase", letterSpacing: "0.08em" }}>{f.label}</label>
                                    <input type={f.type || "text"} value={seg[f.key] || ""} onChange={e => updateItinSeg(segIdx, { [f.key]: e.target.value })}
                                      style={{ display: "block", width: "100%", padding: "6px 8px", background: D ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${dv.cream}`, color: dv.ink, fontSize: 12, fontFamily: f.key === "confirmationCode" ? dv.mono : dv.sans, outline: "none", boxSizing: "border-box", marginTop: 2 }} />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                {[
                                  { key: "flightNumber", label: "Flight Number", mono: true },
                                  { key: "confirmationCode", label: "Confirmation", mono: true },
                                  { key: "departureAirport", label: "From (IATA)", mono: true, placeholder: "e.g. BDA" },
                                  { key: "arrivalAirport", label: "To (IATA)", mono: true, placeholder: "e.g. LHR" },
                                  { key: "date", label: "Departure Date", type: "date" },
                                  { key: "arrivalDate", label: "Arrival Date", type: "date" },
                                  { key: "departureTime", label: "Departs" },
                                  { key: "arrivalTime", label: "Arrives" },
                                  { key: "airline", label: "Airline" },
                                  { key: "aircraft", label: "Aircraft" },
                                  { key: "fareClass", label: "Cabin Class", placeholder: "e.g. business" },
                                  { key: "bookingClass", label: "Booking Class", mono: true, placeholder: "e.g. J" },
                                  { key: "stopoverAirport", label: "Stopover", mono: true, placeholder: "e.g. LHR" },
                                  { key: "stopoverDuration", label: "Layover", placeholder: "e.g. 2h 45m" },
                                ].map(f => (
                                  <div key={f.key}>
                                    <label style={{ fontFamily: dv.mono, fontSize: 11, fontWeight: 700, color: dv.taupe, textTransform: "uppercase", letterSpacing: "0.08em" }}>{f.label}</label>
                                    <input type={f.type || "text"} value={seg[f.key] || ""} placeholder={f.placeholder || ""} onChange={e => updateItinSeg(segIdx, { [f.key]: e.target.value })}
                                      style={{ display: "block", width: "100%", padding: "6px 8px", background: D ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${dv.cream}`, color: dv.ink, fontSize: 12, fontFamily: f.mono ? dv.mono : dv.sans, outline: "none", boxSizing: "border-box", marginTop: 2 }} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                          {bookingType === "reminder" ? (
                            <span style={{ padding: "8px 14px", border: `1px solid ${dv.cream}`, background: dv.bone, color: dv.taupe, fontFamily: dv.serif, fontStyle: "italic", fontSize: 12 }}>
                              {matchedTrip ? "Already on your trips — no action needed." : "Reminder only — nothing to add."}
                            </span>
                          ) : bookingType === "cancellation" ? (() => {
                            // Resolve which trip + segment indices the cancellation maps to.
                            // Prefer the API-supplied match_meta (computed at email-receive time
                            // from confirmation_code, then flight_number+date fallback). Fall
                            // back to the matchedTrip lookup, which finds the trip but not the
                            // specific segments.
                            const meta = itin.match_meta || null;
                            const targetTrip = meta?.matched && meta?.trip_id
                              ? trips.find(t => t.id === meta.trip_id)
                              : matchedTrip;
                            // If meta provided segment_indices, use those; otherwise fall back
                            // to matching every segment in the trip whose confirmation code
                            // matches the cancellation's confirmation code.
                            const segIndices = (() => {
                              if (meta?.matched && Array.isArray(meta.segment_indices) && meta.segment_indices.length > 0) {
                                return meta.segment_indices;
                              }
                              if (!targetTrip || !itin.confirmation_code) return [];
                              const target = itin.confirmation_code.toString().toUpperCase();
                              const segs = targetTrip.segments || [];
                              const out = [];
                              for (let i = 0; i < segs.length; i++) {
                                const code = (segs[i]?.confirmationCode || "").toString().toUpperCase();
                                if (code === target) out.push(i);
                              }
                              return out;
                            })();
                            if (!targetTrip || segIndices.length === 0) {
                              return (
                                <span style={{ padding: "8px 14px", border: `1px solid ${dv.cream}`, background: dv.bone, color: dv.taupe, fontFamily: dv.serif, fontStyle: "italic", fontSize: 12 }}>
                                  Cancellation notice — no matching booking found in your trips.
                                </span>
                              );
                            }
                            const segLabel = (() => {
                              if (segIndices.length > 1) return `${segIndices.length} segments`;
                              const seg = (targetTrip.segments || [])[segIndices[0]];
                              if (!seg) return "this segment";
                              if (seg.type === "flight") return `${seg.flightNumber || "Flight"} · ${seg.route || ""}`.trim();
                              if (seg.type === "hotel" || seg.type === "accommodation") return seg.property || "Hotel";
                              return seg.activityName || seg.restaurantName || seg.type || "this segment";
                            })();
                            return (
                              <button onClick={async () => {
                                if (!user) return;
                                const segs = (targetTrip.segments || []).map((s, i) =>
                                  segIndices.includes(i) ? { ...s, cancelled: true, cancelledAt: new Date().toISOString() } : s
                                );
                                // If every non-meta segment is now cancelled, flip the whole
                                // trip's status to cancelled too.
                                const realSegs = segs.filter(s => !s._isMeta);
                                const allCancelled = realSegs.length > 0 && realSegs.every(s => s.cancelled);
                                const tripUpdate = allCancelled ? { segments: segs, status: "cancelled" } : { segments: segs };
                                await supabase.from("trips").update(tripUpdate).eq("id", targetTrip.id).eq("user_id", user.id);
                                await supabase.from("itineraries").update({ status: "added", trip_id: targetTrip.id }).eq("id", itin.id);
                                loadTrips(user.id);
                                setSavedItineraries(prev => prev.filter(i => i.id !== itin.id));
                              }} style={{
                                padding: "8px 16px", border: `1px solid #C8553D`, background: "#C8553D", color: "#fff",
                                fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
                              }}>Mark {segLabel} cancelled</button>
                            );
                          })() : bookingType === "change" && matchedTrip ? (
                            <button onClick={async () => {
                              if (!user) return;
                              const newSegs = (itin.parsed_segments || []).map(s => ({
                                _id: crypto.randomUUID(),
                                type: s.type || "flight",
                                property: s.property || "", location: s.location || "",
                                date: s.date || "", checkoutDate: s.checkoutDate || "",
                                nights: s.nights || 1, roomType: s.roomType || "",
                                totalCost: s.totalCost || "", confirmationCode: s.confirmationCode || itin.confirmation_code || "",
                                route: s.route || (s.departureAirport && s.arrivalAirport ? `${s.departureAirport} → ${s.arrivalAirport}` : ""),
                                flightNumber: s.flightNumber || "",
                                departureTime: s.departureTime || "", arrivalTime: s.arrivalTime || "",
                                departureAirport: s.departureAirport || "", arrivalAirport: s.arrivalAirport || "",
                                arrivalDate: s.arrivalDate || "",
                                airline: s.airline || "", aircraft: s.aircraft || "",
                                fareClass: s.fareClass || "", bookingClass: s.bookingClass || "",
                              }));
                              const existing = (matchedTrip.segments || []).filter(s => !s._isMeta);
                              // Replace segments matching by flight number / property; append the rest
                              const merged = [...existing];
                              newSegs.forEach(ns => {
                                const idx = merged.findIndex(es =>
                                  (ns.flightNumber && es.flightNumber && ns.flightNumber === es.flightNumber) ||
                                  (ns.property && es.property && ns.property.toLowerCase() === es.property.toLowerCase())
                                );
                                if (idx >= 0) merged[idx] = { ...merged[idx], ...ns };
                                else merged.push(ns);
                              });
                              const meta = (matchedTrip.segments || []).find(s => s._isMeta);
                              const finalSegs = meta ? [meta, ...merged] : merged;
                              await supabase.from("trips").update({ segments: finalSegs }).eq("id", matchedTrip.id).eq("user_id", user.id);
                              await supabase.from("itineraries").update({ status: "added", trip_id: matchedTrip.id }).eq("id", itin.id);
                              loadTrips(user.id);
                              setSavedItineraries(prev => prev.filter(i => i.id !== itin.id));
                            }} style={{
                              padding: "8px 16px", border: `1px solid ${css.accent}`, background: css.accent, color: "#fff",
                              fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
                            }}>Apply change to trip</button>
                          ) : (
                            <button onClick={() => addTripFromItinerary(itin)} style={{
                              padding: "8px 16px", border: `1px solid ${css.accent}`, background: css.accent, color: "#fff",
                              fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
                            }}>Create New Trip</button>
                          )}
                          {bookingType !== "reminder" && bookingType !== "cancellation" && trips.length > 0 && (
                            <select onChange={async e => {
                              const tripId = e.target.value;
                              if (!tripId) return;
                              const trip = trips.find(t => t.id === tripId);
                              if (!trip) return;
                              const newSegs = (itin.parsed_segments || []).map(s => ({
                                ...defaultSegment(), _id: crypto.randomUUID(),
                                type: s.type || "flight",
                                property: s.property || "", location: s.location || "",
                                date: s.date || "", checkoutDate: s.checkoutDate || "",
                                nights: s.nights || 1, roomType: s.roomType || "",
                                totalCost: s.totalCost || "", confirmationCode: s.confirmationCode || "",
                                route: s.route || (s.departureAirport && s.arrivalAirport ? `${s.departureAirport} → ${s.arrivalAirport}` : ""),
                                flightNumber: s.flightNumber || "",
                                departureTime: s.departureTime || "", arrivalTime: s.arrivalTime || "",
                                departureAirport: s.departureAirport || "", arrivalAirport: s.arrivalAirport || "",
                                departureTerminal: s.departureTerminal || "", arrivalTerminal: s.arrivalTerminal || "",
                                arrivalDate: s.arrivalDate || "",
                                airline: s.airline || "", aircraft: s.aircraft || "",
                                fareClass: s.fareClass || "", bookingClass: s.bookingClass || "",
                                seat: s.seat || "", class: s.class || "",
                                stopoverAirport: s.stopoverAirport || "", stopoverDuration: s.stopoverDuration || "",
                              }));
                              const existingSegs = trip.segments && trip.segments.length > 0 ? trip.segments : [];
                              const mergedSegs = [...existingSegs, ...newSegs].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
                              if (user) {
                                await supabase.from("trips").update({ segments: mergedSegs }).eq("id", tripId).eq("user_id", user.id);
                                await supabase.from("itineraries").update({ status: "added", trip_id: tripId }).eq("id", itin.id);
                                loadTrips(user.id);
                                setSavedItineraries(prev => prev.filter(i => i.id !== itin.id));
                                setExpandedItinId(null);
                              }
                              e.target.value = "";
                            }} style={{ padding: "8px 12px", border: `1px solid ${dv.cream}`, background: "transparent", color: dv.taupe, fontFamily: dv.sans, fontSize: 11, cursor: "pointer" }}>
                              <option value="">Add to existing trip...</option>
                              {trips.slice(0, 20).map(t => <option key={t.id} value={t.id}>{t.tripName || t.trip_name || t.route || t.property || "Trip"}</option>)}
                            </select>
                          )}
                          <button onClick={() => dismissItinerary(itin.id)} style={{
                            padding: "8px 12px", border: `1px solid ${dv.cream}`,
                            background: "transparent", color: dv.taupe, fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
                          }}>Dismiss</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

        {/* ── Expense Inbox — unassigned expenses ── */}
        {(() => {
          const inboxExpenses = expenses.filter(e => !e.tripId);
          return (
            <div style={{ marginTop: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${dv.cream}` }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <h3 style={{ fontFamily: dv.serif, fontSize: 22, fontWeight: 400, letterSpacing: "-0.015em", color: dv.ink, margin: 0 }}>Expense Inbox</h3>
                  {inboxExpenses.length > 0 && (
                    <span style={{ fontFamily: dv.mono, fontSize: 10, color: css.accent, letterSpacing: "0.08em", background: dv.paper, border: `1px solid ${dv.cream}`, padding: "2px 8px" }}>{inboxExpenses.length}</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="file" accept="image/*" capture="environment" ref={snapReceiptInputRef} style={{ display: "none" }}
                    onChange={e => { if (e.target.files?.[0]) handleSnapReceipt(e.target.files[0]); }} />
                  <button onClick={() => snapReceiptInputRef.current?.click()} disabled={snapReceiptProcessing} style={{
                    padding: "8px 14px", border: `1px solid ${css.accent}`, background: snapReceiptProcessing ? dv.paper : css.accent, color: snapReceiptProcessing ? dv.taupe : "#fff",
                    fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", cursor: snapReceiptProcessing ? "default" : "pointer",
                    transition: "all 0.12s ease", display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    {snapReceiptProcessing ? "Reading..." : "Snap Receipt"}
                  </button>
                  <button onClick={() => setShowReceiptQR(true)} style={{
                    padding: "8px 14px", border: `1px solid ${dv.cream}`, background: "transparent", color: dv.taupe,
                    fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                    transition: "all 0.12s ease", display: "flex", alignItems: "center", gap: 6,
                  }} onMouseEnter={e => { e.currentTarget.style.borderColor = dv.ink; e.currentTarget.style.color = dv.ink; }} onMouseLeave={e => { e.currentTarget.style.borderColor = dv.cream; e.currentTarget.style.color = dv.taupe; }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                    Receipt QR
                  </button>
                  <button onClick={() => { setShowAddExpense("_inbox"); setNewExpense(BLANK_EXPENSE); setEditExpenseId(null); }} style={{
                    padding: "8px 16px", border: `1px solid ${css.accent}`, background: "transparent", color: css.accent,
                    fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                    transition: "all 0.12s ease",
                  }} onMouseEnter={e => { e.currentTarget.style.background = css.accent; e.currentTarget.style.color = "#F4F1EC"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = css.accent; }}>
                    + Add Expense
                  </button>
                </div>
              </div>
              {userForwardingAddress && (
                <div style={{ marginBottom: 20, padding: "12px 16px", background: dv.paper, border: `1px solid ${dv.cream}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={dv.taupe} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <span style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.08em", textTransform: "uppercase" }}>Forward receipts to:</span>
                  <span style={{ fontFamily: dv.mono, fontSize: 12, fontWeight: 500, color: css.accent, cursor: "pointer", wordBreak: "break-all" }}
                    onClick={() => { navigator.clipboard?.writeText("expenses@gocontinuum.app"); }}
                    title="Click to copy">
                    expenses@gocontinuum.app
                  </span>
                  <span style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 11, color: dv.taupe }}>tap to copy</span>
                </div>
              )}
              {inboxExpenses.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {inboxExpenses.map(exp => {
                    const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                    return (
                      <div key={exp.id} style={{ background: dv.paper, border: `1px solid ${dv.cream}`, padding: isMobile ? "12px" : "12px 16px" }} onClick={() => setViewExpenseId(exp.id)}>
                        {/* Top row: description + amount */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                              {cat && <span style={{ fontFamily: dv.mono, fontSize: 11, fontWeight: 700, color: cat.color, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 6px", border: `1px solid ${cat.color}30` }}>{cat.label}</span>}
                              <span style={{ fontFamily: dv.serif, fontSize: isMobile ? 13 : 14, fontWeight: 400, color: dv.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description || "Expense"}</span>
                            </div>
                            <div style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.06em", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                              {exp.date && <span>{new Date(exp.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                              {exp.receipt && <span style={{ color: "#22c55e" }}>Receipt</span>}
                              <ReportedBadge reports={expenseReportMembership?.get(exp.id)} onOpen={openReport} compact={isMobile} />
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500, color: dv.ink, fontFamily: dv.mono }}>{exp.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {exp.currency || "USD"}</div>
                          </div>
                        </div>
                        {/* Bottom row: actions */}
                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
                          {trips.length > 0 && (
                            <select onChange={async e => {
                              const tripId = e.target.value; if (!tripId) return;
                              if (user) await supabase.from("expenses").update({ trip_id: tripId }).eq("id", exp.id).eq("user_id", user.id);
                              setExpenses(prev => prev.map(ex => ex.id === exp.id ? { ...ex, tripId } : ex));
                              e.target.value = "";
                            }} style={{ padding: "6px 10px", border: `1px solid ${dv.cream}`, background: "transparent", color: dv.taupe, fontFamily: dv.sans, fontSize: 11, cursor: "pointer", flex: isMobile ? "1 1 auto" : "0 0 auto" }}>
                              <option value="">Assign to trip...</option>
                              {trips.map(t => <option key={t.id} value={t.id}>{t.tripName || t.location || "Trip"}</option>)}
                            </select>
                          )}
                          <button onClick={() => setViewExpenseId(exp.id)} style={{ padding: "6px 10px", border: `1px solid ${css.accent}30`, background: "transparent", color: css.accent, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>View</button>
                          <button onClick={() => { setEditExpenseId(exp.id); setShowAddExpense("_inbox"); setNewExpense({ ...exp, fxRate: exp.fxRate || 1 }); }} style={{ padding: "6px 10px", border: `1px solid ${dv.cream}`, background: "transparent", color: dv.taupe, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>Edit</button>
                          <button onClick={() => {
                            const label = exp.description || exp.merchant || "this receipt";
                            const amt = exp.amount ? ` (${exp.currency || "USD"} ${Number(exp.amount).toFixed(2)})` : "";
                            showConfirm?.(`Delete ${label}${amt}? This can't be undone.`, () => removeExpense(exp.id));
                          }} title="Delete receipt" style={{ padding: "6px 10px", border: "1px solid rgba(200,85,61,0.2)", background: "transparent", color: "#C8553D", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>x</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "24px 20px", textAlign: "center", background: dv.paper, border: `1px solid ${dv.cream}` }}>
                  <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 14, color: dv.taupe, margin: "0 0 4px" }}>No unassigned expenses</p>
                  <p style={{ fontFamily: dv.mono, fontSize: 10, color: dv.stone, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Add receipts here and assign them to trips later</p>
                </div>
              )}
            </div>
          );
        })()}

          </div>
        );
        })()}

        {/* ── Timeline Tab — vertical chronological view ── */}
        {dashSubTab === "timeline" && (() => {
          const realToday = new Date().toISOString().slice(0, 10);
          const selectedDate = timelineDate || realToday;
          const isToday = selectedDate === realToday;
          const nowHM = new Date().getHours() * 60 + new Date().getMinutes();
          const fmtTime = (t) => { if (!t) return ""; const [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${ap}`; };
          const parseHM = (t) => { if (!t) return null; const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
          const segColors = { flight: "#3b82f6", hotel: "#8b5cf6", accommodation: "#8b5cf6", activity: "#22c55e", train: "#f59e0b", rental: "#C8553D", restaurant: "#f97316", transfer: "#a855f7", cruise: "#06b6d4", ferry: "#0ea5e9", lounge: "#c9a84c" };
          const fmtDateLabel = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

          // Collect all trip dates for quick-jump
          const allTripDates = new Set();
          trips.forEach(t => (t.segments || []).filter(s => !s._isMeta && s.date).forEach(s => allTripDates.add(s.date)));
          const sortedTripDates = [...allTripDates].sort();
          const prevDate = sortedTripDates.filter(d => d < selectedDate).pop();
          const nextDate = sortedTripDates.find(d => d > selectedDate);

          // Find trip and segments for selected date
          let todayTrip = null;
          let todaySegs = [];
          for (const trip of trips) {
            const segs = (trip.segments || []).filter(s => !s._isMeta);
            const matching = segs.filter(s => s.date === selectedDate);
            if (matching.length > 0) { todayTrip = trip; todaySegs = matching; break; }
            const dates = segs.map(s => s.date).filter(Boolean).sort();
            if (dates.length > 0 && dates[0] <= selectedDate && dates[dates.length - 1] >= selectedDate) {
              todayTrip = trip; todaySegs = matching;
              break;
            }
          }

          // Sort by time
          todaySegs.sort((a, b) => {
            const tA = a.departureTime || a.startTime || a.time || a.checkinTime || a.pickupTime || "";
            const tB = b.departureTime || b.startTime || b.time || b.checkinTime || b.pickupTime || "";
            return tA.localeCompare(tB);
          });

          // YouTube video IDs for landmarks and cities
          const YT_LANDMARK_VIDEOS = {
            "Eiffel Tower": "PbznMOF_dUo", "Colosseum": "k-P6Ys_EHME", "Big Ben": "JtW0jL9dBSs",
            "Sagrada Familia": "xJWSbdJYSMk", "Golden Gate Bridge": "qGbMjFSIzVE", "Burj Khalifa": "UwPbS4cOrWI",
            "Statue of Liberty": "07oB4bS4Kk0", "Times Square": "2A6cA3mMXoU", "Central Park": "vLwapXGz-II",
            "Brooklyn Bridge": "4OV5HMQH_uc", "Shibuya Crossing": "wBDmfGrGfKQ", "Tokyo Tower": "6gKFMEdFR38",
            "Osaka Castle": "r4RlQ0Lx6Hc", "Opera House": "EnPFz-0J7g4", "Marina Bay Sands": "s7DkKp1gBSw",
            "Hagia Sophia": "rKjCQHl56Xk", "Victoria Peak": "5fJlrEm3RDs", "Taipei 101": "8YwqFz0BjmA",
            "Horseshoe Bay": "j8r3kK6QFBA", "Waikiki Beach": "9_ZwbxfIcuY", "South Beach": "XZuA1cFDHR4",
            "Meiji Shrine": "JkkOKFqM2Z4", "Dotonbori": "jF48JvL10LE", "Universal Studios": "j0XBqnCRxiI",
          };
          const YT_CITY_VIDEOS = {
            "New York": "MtCwtKRVkfE", "Los Angeles": "9Qs3GlNZMhY", "San Francisco": "X4VVn3WqjHE",
            "Chicago": "eTM2M19Yjbk", "Miami": "OlJpjPIWKJU", "London": "45ETZ1xvHS0",
            "Paris": "UCPqVl3QqJY", "Tokyo": "zY8wM1sUVcA", "Osaka": "YGxh4U0UiBI",
            "Sydney": "EnPFz-0J7g4", "Dubai": "j2I0sNh0MJE", "Singapore": "LT9TTy2GZxM",
            "Hong Kong": "5fJlrEm3RDs", "Seoul": "8CfqGb_A3kY", "Bangkok": "8f-U2IFwEew",
            "Rome": "k-P6Ys_EHME", "Barcelona": "xJWSbdJYSMk", "Amsterdam": "R0Y1l8mCLm8",
            "Istanbul": "4p2rHpL_bqk", "Bermuda": "j8r3kK6QFBA", "Cancun": "d9R2Nxqkf9w",
            "Bali": "X_0HpIXnJWM", "Honolulu": "9_ZwbxfIcuY", "Toronto": "Av4WJLru6FI",
            "Vancouver": "hLzgEd7FXCQ", "Taipei": "8YwqFz0BjmA", "Shanghai": "YOmAJX3peSI",
            "Lisbon": "JqL0kwzluVY", "Prague": "0j95y8LBRHA", "Budapest": "yoVmPKYkfFo",
            "Vienna": "L_8u1OlKP3s", "Athens": "bVWVF72l3PA", "Doha": "oknM4VFZFgA",
            "Hamilton": "j8r3kK6QFBA", "St. George's": "j8r3kK6QFBA",
          };

          // Build video list from segments + city fallback
          const getSegLocation = (seg) => seg.activityName || seg.restaurantName || seg.loungeName || seg.property || seg.location || "";
          const tripLocation = todayTrip?.location || todaySegs[0]?.location || todaySegs[0]?.property || "";
          const tripCity = tripLocation.split(",")[0].trim();

          // Find best video: landmark from segment > city from segment location > trip city > airport city
          const findVideoForSeg = (seg) => {
            const loc = getSegLocation(seg);
            // Check landmark match
            for (const [landmark, vid] of Object.entries(YT_LANDMARK_VIDEOS)) {
              if (loc.toLowerCase().includes(landmark.toLowerCase())) return { id: vid, label: landmark };
            }
            // Check city from segment location
            const segCity = (seg.location || "").split(",")[0].trim();
            if (segCity && YT_CITY_VIDEOS[segCity]) return { id: YT_CITY_VIDEOS[segCity], label: segCity };
            return null;
          };

          // Collect unique videos for all segments
          const videoList = [];
          const seenVids = new Set();
          for (const seg of todaySegs) {
            const v = findVideoForSeg(seg);
            if (v && !seenVids.has(v.id)) { videoList.push(v); seenVids.add(v.id); }
          }
          // Fallback: city from trip location or airport codes
          if (videoList.length === 0) {
            if (tripCity && YT_CITY_VIDEOS[tripCity]) {
              videoList.push({ id: YT_CITY_VIDEOS[tripCity], label: tripCity });
            } else {
              // Try to get city from airport codes in flight segments
              const flightSegs = todaySegs.filter(s => s.type === "flight" && s.route);
              for (const fs of flightSegs) {
                const codes = (fs.route || "").split(/→|->|-|\//).map(s => s.trim().toUpperCase()).filter(s => s.length === 3);
                for (const code of codes) {
                  const city = AIRPORT_CITY[code];
                  if (city && YT_CITY_VIDEOS[city] && !seenVids.has(YT_CITY_VIDEOS[city])) {
                    videoList.push({ id: YT_CITY_VIDEOS[city], label: city });
                    seenVids.add(YT_CITY_VIDEOS[city]);
                  }
                }
              }
            }
          }
          const activeVideo = videoList[0] || null;

          // Get photo for each segment
          const getSegPhoto = (seg) => {
            const name = seg.activityName || seg.restaurantName || seg.loungeName || seg.property || seg.location || "";
            if (landmarkPhotos[name]) return landmarkPhotos[name];
            if (LANDMARK_FALLBACK_PHOTOS[name]) return LANDMARK_FALLBACK_PHOTOS[name];
            const city = seg.location || tripCity;
            if (city && landmarkPhotos[`${city}, `]) return landmarkPhotos[`${city}, `];
            return null;
          };
          const getSegTitle = (seg) => seg.activityName || seg.restaurantName || seg.loungeName || seg.property || seg.flightNumber || seg.trainNumber || seg.operator || seg.company || seg.route || seg.location || seg.type;
          const getSegTime = (seg) => seg.departureTime || seg.startTime || seg.time || seg.checkinTime || seg.pickupTime || "";
          const getSegEndTime = (seg) => seg.arrivalTime || seg.endTime || seg.checkoutTime || seg.dropoffTime || "";
          const getSegSub = (seg) => {
            if (seg.type === "flight") return seg.route || `${seg.departureAirport || ""} - ${seg.arrivalAirport || ""}`;
            if (seg.type === "hotel" || seg.type === "accommodation") return seg.location || "";
            if (seg.type === "restaurant") return seg.cuisine ? `${seg.cuisine} cuisine` : seg.location || "";
            return seg.location || seg.pickupLocation || "";
          };

          return (
            <div>
              {/* Date selector */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 16, gap: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => prevDate && setTimelineDate(prevDate)} disabled={!prevDate}
                    style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: prevDate ? css.text : css.text3, cursor: prevDate ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: prevDate ? 1 : 0.3 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <div style={{ position: "relative" }}>
                    <button onClick={() => { const inp = document.getElementById("timeline-date-pick"); if (inp) inp.showPicker(); }}
                      style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${css.border}`, background: css.surface, color: css.text, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {fmtDateLabel(selectedDate)}
                    </button>
                    <input id="timeline-date-pick" type="date" value={selectedDate} onChange={e => setTimelineDate(e.target.value)}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} />
                  </div>
                  <button onClick={() => nextDate && setTimelineDate(nextDate)} disabled={!nextDate}
                    style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: nextDate ? css.text : css.text3, cursor: nextDate ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: nextDate ? 1 : 0.3 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
                {!isToday && (
                  <button onClick={() => setTimelineDate(realToday)}
                    style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: css.accentBg, color: css.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    Back to Today
                  </button>
                )}
              </div>

              {todayTrip ? (
                <>
                  {/* ── Focus Rail Carousel ── */}
                  {todaySegs.length > 0 ? (() => {
                    // Build carousel items from segments
                    const CITY_PHOTOS_MAP = {
                      "Tokyo": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80&fit=crop",
                      "Osaka": "https://images.unsplash.com/photo-1589452271712-64b8a66c3929?w=800&q=80&fit=crop",
                      "Kyoto": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80&fit=crop",
                      "Paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80&fit=crop",
                      "London": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80&fit=crop",
                      "New York": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80&fit=crop",
                      "Rome": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80&fit=crop",
                      "Barcelona": "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80&fit=crop",
                      "Dubai": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80&fit=crop",
                      "Singapore": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80&fit=crop",
                      "Hong Kong": "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&q=80&fit=crop",
                      "Bangkok": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80&fit=crop",
                      "Seoul": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&q=80&fit=crop",
                      "Sydney": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80&fit=crop",
                      "Bermuda": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80&fit=crop",
                      "Honolulu": "https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=800&q=80&fit=crop",
                      "Miami": "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800&q=80&fit=crop",
                      "Amsterdam": "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80&fit=crop",
                      "Istanbul": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80&fit=crop",
                      "Bali": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80&fit=crop",
                    };
                    const defaultPhoto = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80&fit=crop";

                    const carouselItems = todaySegs.map((seg, idx) => {
                      const photo = getSegPhoto(seg) || CITY_PHOTOS_MAP[tripCity] || CITY_PHOTOS_MAP[seg.location?.split(",")[0]?.trim()] || defaultPhoto;
                      const time = getSegTime(seg);
                      const endTime = getSegEndTime(seg);
                      const timeStr = time ? `${fmtTime(time)}${endTime ? ` - ${fmtTime(endTime)}` : ""}` : "";
                      const color = segColors[seg.type] || css.accent;
                      const timeMin = parseHM(time);
                      const isCurrent = isToday && timeMin !== null && parseHM(endTime) !== null ? (nowHM >= timeMin && nowHM <= parseHM(endTime)) : (isToday && timeMin !== null && Math.abs(nowHM - timeMin) < 60);
                      return { id: seg._id || idx, title: getSegTitle(seg), description: getSegSub(seg), imageSrc: photo, meta: timeStr, type: seg.type, color, isCurrent };
                    });

                    // Find initial index: current activity or first upcoming
                    let initIdx = 0;
                    if (isToday) {
                      const curIdx = carouselItems.findIndex(c => c.isCurrent);
                      if (curIdx >= 0) initIdx = curIdx;
                      else {
                        const nextIdx = todaySegs.findIndex(seg => { const t = parseHM(getSegTime(seg)); return t !== null && t > nowHM; });
                        if (nextIdx >= 0) initIdx = nextIdx;
                      }
                    }

                    const count = carouselItems.length;
                    const wrapIdx = (v) => ((v % count) + count) % count;
                    const activeIdx = wrapIdx(railActive);
                    const activeItem = carouselItems[activeIdx];
                    const cardW = isMobile ? 220 : 280;

                    return (
                      <div>
                        {/* Trip name */}
                        <div style={{ marginBottom: 16, textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: css.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                            {todayTrip.tripName || todayTrip.trip_name || todayTrip.location || "Itinerary"}
                          </div>
                          <div style={{ fontSize: 10, color: css.text3 }}>{todaySegs.length} {todaySegs.length === 1 ? "activity" : "activities"}</div>
                        </div>

                        {/* Carousel stage */}
                        <div style={{
                          position: "relative", height: isMobile ? 380 : 460, overflow: "hidden",
                          borderRadius: 20, userSelect: "none",
                          background: D ? "#0a0a0f" : "#0f0f14",
                          marginLeft: isMobile ? -16 : -48, marginRight: isMobile ? -16 : -48,
                        }}>
                          {/* Background ambience — blurred active image */}
                          <AnimatePresence mode="popLayout">
                            <motion.div key={`bg-${activeItem.id}`} initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
                              style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
                              <img src={activeItem.imageSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) saturate(1.8)" }} />
                              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,15,1) 0%, rgba(10,10,15,0.4) 50%, transparent 100%)" }} />
                            </motion.div>
                          </AnimatePresence>

                          {/* Cards rail */}
                          <div style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "center", alignItems: "center", height: isMobile ? 300 : 360, perspective: "1200px" }}>
                            {[-2, -1, 0, 1, 2].map(offset => {
                              const idx = wrapIdx(railActive + offset);
                              const item = carouselItems[idx];
                              const isCenter = offset === 0;
                              const dist = Math.abs(offset);
                              return (
                                <motion.div key={railActive + offset}
                                  animate={{
                                    x: offset * (isMobile ? 180 : 280),
                                    z: -dist * 150,
                                    scale: isCenter ? 1 : 0.82,
                                    rotateY: offset * -18,
                                    opacity: isCenter ? 1 : Math.max(0.15, 1 - dist * 0.45),
                                    filter: `blur(${isCenter ? 0 : dist * 5}px) brightness(${isCenter ? 1 : 0.5})`,
                                  }}
                                  transition={{ type: "spring", stiffness: isCenter ? 400 : 300, damping: isCenter ? 20 : 30 }}
                                  onClick={() => { if (offset !== 0) setRailActive(r => r + offset); }}
                                  style={{
                                    position: "absolute", width: cardW, aspectRatio: "3/4", borderRadius: 16,
                                    overflow: "hidden", cursor: isCenter ? "default" : "pointer",
                                    transformStyle: "preserve-3d",
                                    boxShadow: isCenter ? "0 20px 60px rgba(0,0,0,0.5)" : "0 8px 30px rgba(0,0,0,0.3)",
                                    zIndex: isCenter ? 20 : 10 - dist,
                                    border: `1px solid rgba(255,255,255,${isCenter ? 0.15 : 0.05})`,
                                  }}>
                                  <img src={item.imageSrc} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
                                  {/* Gradient overlay */}
                                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)", pointerEvents: "none" }} />
                                  {/* Time badge */}
                                  {item.meta && (
                                    <div style={{ position: "absolute", top: 12, left: 12, padding: "5px 10px", borderRadius: 8, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "'Geist Mono', monospace", letterSpacing: "0.02em" }}>
                                      {item.meta}
                                    </div>
                                  )}
                                  {/* Now badge */}
                                  {item.isCurrent && (
                                    <div style={{ position: "absolute", top: 12, right: 12, padding: "4px 10px", borderRadius: 8, background: css.accent, fontSize: 11, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em" }}>Now</div>
                                  )}
                                  {/* Type pill */}
                                  <div style={{ position: "absolute", bottom: 12, left: 12, padding: "3px 8px", borderRadius: 6, background: `${item.color}cc`, fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.type}</div>
                                </motion.div>
                              );
                            })}
                          </div>

                          {/* Info + controls at bottom */}
                          <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 16px" : "0 32px" }}>
                            {/* Info */}
                            <AnimatePresence mode="wait">
                              <motion.div key={activeItem.id} initial={{ opacity: 0, y: 8, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -8, filter: "blur(4px)" }} transition={{ duration: 0.25 }}
                                style={{ flex: 1 }}>
                                <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{activeItem.title}</div>
                                {activeItem.description && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{activeItem.description}</div>}
                              </motion.div>
                            </AnimatePresence>
                            {/* Nav buttons */}
                            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.08)", borderRadius: 24, padding: 3, backdropFilter: "blur(8px)", flexShrink: 0 }}>
                              <button onClick={() => setRailActive(r => r - 1)} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                              </button>
                              <span style={{ minWidth: 36, textAlign: "center", fontSize: 11, fontFamily: "'Geist Mono', monospace", color: "rgba(255,255,255,0.4)" }}>{activeIdx + 1}/{count}</span>
                              <button onClick={() => setRailActive(r => r + 1)} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })() : (
                    <div style={{ padding: "32px 20px", textAlign: "center", borderRadius: 14, background: css.surface, border: `1px solid ${css.border}` }}>
                      <div style={{ fontSize: 13, color: css.text3 }}>No scheduled activities for this date</div>
                      <div style={{ fontSize: 11, color: css.text3, marginTop: 4 }}>Add segments with this date to your trip to see them here</div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: "48px 20px", textAlign: "center", borderRadius: 14, background: css.surface, border: `1px solid ${css.border}` }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={css.text3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16, opacity: 0.4 }}>
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <div style={{ fontSize: 15, fontWeight: 600, color: css.text, marginBottom: 6 }}>No trip on this date</div>
                  <div style={{ fontSize: 12, color: css.text3, lineHeight: 1.5 }}>
                    {isToday ? "When you have a trip with today's date, your itinerary and destination highlights will appear here." : "No segments are scheduled for this date. Use the arrows to jump to the next trip date."}
                  </div>
                  {sortedTripDates.length > 0 && (
                    <button onClick={() => setTimelineDate(sortedTripDates.find(d => d >= realToday) || sortedTripDates[0])}
                      style={{ marginTop: 12, padding: "8px 18px", borderRadius: 8, border: "none", background: css.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      Jump to next trip
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Expense Reports Tab — standalone reports manager ── */}
        {dashSubTab === "expensereports" && renderExpenseReports?.()}

        {/* ── Reports Tab — expense summaries ── */}
        {dashSubTab === "reports" && renderReports()}

        {/* ── Activity Tab — recent actions feed ── */}
        {dashSubTab === "packing" && (() => {
          const dv = { bone: D ? "#1a1a1a" : "#F4F1EC", paper: D ? "#222" : "#EBE6DD", cream: D ? "rgba(255,255,255,0.06)" : "#E2DCCE", stone: D ? "#8a8a8a" : "#857A66", taupe: D ? "#999" : "#6B6458", graphite: D ? "#111" : "#2C2A26", ink: D ? "#f0ece6" : "#15130F", moss: "#6B7A5A", gold: "#B8924A", serif: "'Fraunces', 'Instrument Serif', Georgia, serif", sans: "'Inter Tight', 'Instrument Sans', sans-serif", mono: "'JetBrains Mono', 'Geist Mono', monospace" };
          const CatIcon = ({ d, size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={css.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;

          const todayStr = new Date().toISOString().slice(0, 10);
          const upcomingWithPacking = [...trips].filter(t => {
            const d = t.date || (t.segments || []).map(s => s.date).filter(Boolean).sort()[0] || "";
            return d >= todayStr;
          }).sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
          const pastWithPacking = [...trips].filter(t => {
            const d = t.date || (t.segments || []).map(s => s.date).filter(Boolean).sort()[0] || "";
            return d && d < todayStr;
          }).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
          const allTripsForPacking = [...upcomingWithPacking, ...pastWithPacking];

          // Trip detail view
          if (packingViewTripId) {
            const trip = trips.find(t => t.id === packingViewTripId);
            if (!trip) { setPackingViewTripId(null); return null; }
            const tripName = trip.tripName || trip.trip_name || trip.location || "Trip";
            const customItems = customPackItems[trip.id] || [];
            const allItems = [...getPackingItems(), ...customItems];
            const checked = packingLists[trip.id] || {};
            const total = allItems.length;
            const done = allItems.filter(i => checked[i.id]).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const segs = (trip.segments || []).filter(s => !s._isMeta);
            const dates = segs.map(s => s.date).filter(Boolean).sort();
            const duration = dates.length >= 2 ? Math.max(1, Math.ceil((new Date(dates[dates.length-1]) - new Date(dates[0])) / 86400000)) : 1;
            const loc = trip.location || "";
            const isBeach = /beach|bermuda|hawaii|cancun|bahamas|caribbean|maldives|bali|phuket|fiji/i.test(loc + " " + tripName);
            const isCold = /iceland|norway|finland|sweden|alaska|ski|whistler|aspen/i.test(loc + " " + tripName);
            const climate = isBeach ? "Tropical" : isCold ? "Cold" : "Temperate";
            const tripDates = dates.length >= 2 ? `${new Date(dates[0]+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})} -- ${new Date(dates[dates.length-1]+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}` : formatTripDates(trip);
            const daysOut = dates[0] ? Math.max(0, Math.ceil((new Date(dates[0]) - new Date()) / 86400000)) : null;
            const subText = pct >= 100 ? "Packed. Ready. Go." : pct >= 75 ? "The end is in sight." : pct >= 50 ? "Halfway, and holding." : pct >= 25 ? "A gentle start." : "Let's begin, shall we.";

            return (
              <div style={{ fontFamily: dv.sans, color: dv.ink }}>
                {/* Back */}
                <button onClick={() => setPackingViewTripId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: dv.taupe, padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 6, fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg> All trips
                </button>

                {/* Config bar */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1.2fr 1fr 1fr auto", gap: 0, background: dv.paper, border: `1px solid ${dv.cream}`, padding: 8, marginBottom: 32, alignItems: "center" }}>
                  <div style={{ padding: "14px 20px", borderRight: isMobile ? "none" : `1px solid ${dv.cream}` }}>
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 4 }}>Destination</div>
                    <div style={{ fontFamily: dv.serif, fontSize: 18, fontWeight: 400, color: dv.ink }}>{tripName}</div>
                  </div>
                  <div style={{ padding: "14px 20px", borderRight: isMobile ? "none" : `1px solid ${dv.cream}` }}>
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 4 }}>Duration</div>
                    <div style={{ fontFamily: dv.serif, fontSize: 18, fontWeight: 400, color: dv.ink }}>{duration} <em style={{ fontStyle: "italic", color: dv.taupe, fontSize: 14 }}>nights</em></div>
                  </div>
                  <div style={{ padding: "14px 20px", borderRight: isMobile ? "none" : `1px solid ${dv.cream}` }}>
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 4 }}>Climate</div>
                    <div style={{ fontFamily: dv.serif, fontSize: 18, fontWeight: 400, color: dv.ink }}>{climate}</div>
                  </div>
                  <div style={{ padding: "14px 20px" }}>
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 4 }}>Purpose</div>
                    <div style={{ fontFamily: dv.serif, fontSize: 18, fontWeight: 400, color: dv.ink }}>{/business/i.test(tripName) ? "Business" : "Personal"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "0 8px" }}>
                    {/* Copy from previous trip */}
                    <select onChange={e => {
                      const srcTripId = e.target.value;
                      if (!srcTripId) return;
                      const srcCustom = customPackItems[srcTripId] || [];
                      if (srcCustom.length === 0) { e.target.value = ""; return; }
                      // Copy custom items with new IDs
                      const copied = srcCustom.map(item => ({ ...item, id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }));
                      const existing = customPackItems[trip.id] || [];
                      const nx = { ...customPackItems, [trip.id]: [...existing, ...copied] };
                      setCustomPackItems(nx);
                      try { localStorage.setItem("continuum_custom_pack_items", JSON.stringify(nx)); } catch {}
                      e.target.value = "";
                    }} style={{ padding: "14px 16px", background: dv.paper, border: `1px solid ${dv.cream}`, fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.06em", color: dv.ink, cursor: "pointer", outline: "none" }}>
                      <option value="">Copy from trip...</option>
                      {trips.filter(t => t.id !== trip.id && (customPackItems[t.id] || []).length > 0).map(t => (
                        <option key={t.id} value={t.id}>{(t.tripName || t.trip_name || t.location || "Trip").slice(0, 30)} ({(customPackItems[t.id] || []).length} items)</option>
                      ))}
                    </select>
                    {!isMobile && (
                      <button onClick={() => { savePackingLists({ ...packingLists, [trip.id]: {} }); }}
                        style={{ padding: "14px 20px", background: dv.graphite, color: "#F4F1EC", border: "none", fontFamily: dv.serif, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
                        Reset &#8594;
                      </button>
                    )}
                  </div>
                </div>

                {/* Dashboard strip */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr 1fr", gap: 20, marginBottom: 32 }}>
                  <div style={{ background: dv.paper, border: `1px solid ${dv.cream}`, padding: isMobile ? 20 : 28, position: "relative" }}>
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 14 }}>Packing Progress</div>
                    <div style={{ fontFamily: dv.serif, fontSize: 44, fontWeight: 300, lineHeight: 1, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
                      {done}<span style={{ fontSize: 18, color: dv.taupe, fontStyle: "italic", marginLeft: 4 }}>/ {total}</span>
                    </div>
                    <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.taupe, marginTop: 8 }}>{subText}</div>
                    <div style={{ position: "absolute", top: 22, right: 22, width: 60, height: 60 }}>
                      <svg viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                        <circle cx="32" cy="32" r="28" fill="none" stroke={dv.cream} strokeWidth="4" />
                        <circle cx="32" cy="32" r="28" fill="none" stroke={css.accent} strokeWidth="4" strokeLinecap="round" strokeDasharray="176" strokeDashoffset={176 - (176 * pct / 100)} style={{ transition: "stroke-dashoffset 0.8s ease" }} />
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: dv.mono, fontSize: 11, fontWeight: 500, color: dv.ink }}>{pct}%</div>
                    </div>
                  </div>
                  <div style={{ background: dv.paper, border: `1px solid ${dv.cream}`, padding: isMobile ? 20 : 28 }}>
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 14 }}>Weight Est.</div>
                    <div style={{ fontFamily: dv.serif, fontSize: 44, fontWeight: 300, lineHeight: 1 }}>{(total * 0.14).toFixed(1)}<span style={{ fontSize: 18, color: dv.taupe, fontStyle: "italic", marginLeft: 4 }}>kg</span></div>
                    <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.taupe, marginTop: 8 }}>Well within carry-on.</div>
                  </div>
                  <div style={{ background: dv.graphite, color: "#F4F1EC", padding: isMobile ? 20 : 28, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: "-40%", right: "-30%", width: "80%", height: "80%", background: `radial-gradient(circle, ${css.accent}30, transparent 60%)`, pointerEvents: "none" }} />
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.stone, marginBottom: 14, position: "relative", zIndex: 2 }}>Days Until Departure</div>
                    <div style={{ fontFamily: dv.serif, fontSize: 44, fontWeight: 300, lineHeight: 1, color: "#F4F1EC", position: "relative", zIndex: 2 }}>{daysOut !== null ? daysOut : "--"}</div>
                    <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.stone, marginTop: 8, position: "relative", zIndex: 2 }}>{daysOut === null ? "No date set." : daysOut > 14 ? "Plenty of time." : daysOut > 7 ? "Getting close." : daysOut > 1 ? "Nearly off." : daysOut === 1 ? "Tomorrow." : "Today!"}</div>
                  </div>
                </div>

                {/* Section header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${dv.cream}` }}>
                  <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 22 : 28, fontWeight: 400, letterSpacing: "-0.02em" }}>The Inventory <em style={{ fontStyle: "italic", color: dv.taupe, fontSize: isMobile ? 15 : 20 }}>by category</em></div>
                  <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe, letterSpacing: "0.1em" }}>S 02 -- Checklist</span>
                </div>

                {/* Category grid */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 20 }}>
                  {Object.entries(PACK_CATEGORIES).map(([catKey, cat]) => {
                    const catCustom = customItems.filter(ci => ci.category === catKey);
                    const hiddenIds = customPackItems[`_hidden_${trip.id}`] || [];
                    const catItems = [...cat.items.filter(i => !hiddenIds.includes(i.id)), ...catCustom];
                    const catDone = catItems.filter(i => checked[i.id]).length;
                    return (
                      <div key={catKey} style={{ background: dv.paper, border: `1px solid ${dv.cream}`, padding: isMobile ? 18 : 24, transition: "border-color 0.3s, transform 0.3s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = dv.stone; e.currentTarget.style.transform = "translateY(-2px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = dv.cream; e.currentTarget.style.transform = "translateY(0)"; }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${dv.cream}` }}>
                          <div style={{ fontFamily: dv.serif, fontSize: 20, fontWeight: 400, letterSpacing: "-0.015em", display: "flex", alignItems: "center", gap: 10 }}>
                            <CatIcon d={cat.icon} />
                            {cat.title}
                          </div>
                          <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe, letterSpacing: "0.08em", background: dv.bone, padding: "3px 8px", border: `1px solid ${dv.cream}` }}>{catDone}/{catItems.length}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {catItems.map(item => {
                            const isDone = !!checked[item.id];
                            const isCustom = item.id.startsWith("custom_");
                            return (
                              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", cursor: "pointer", borderBottom: "1px solid transparent", transition: "border-color 0.2s" }}
                                onMouseEnter={e => e.currentTarget.style.borderBottomColor = dv.cream}
                                onMouseLeave={e => e.currentTarget.style.borderBottomColor = "transparent"}>
                                <PackCheckBox checked={isDone} onClick={() => togglePackItem(trip.id, item.id)} size={18} color={css.accent} />
                                {isCustom ? (
                                  <input value={item.label} placeholder="Custom item..." onClick={e => e.stopPropagation()}
                                    onChange={e => { const nx = { ...customPackItems, [trip.id]: customItems.map(i => i.id === item.id ? { ...i, label: e.target.value } : i) }; setCustomPackItems(nx); try { localStorage.setItem("continuum_custom_pack_items", JSON.stringify(nx)); } catch {} }}
                                    style={{ flex: 1, border: "none", background: "transparent", fontSize: 14, color: isDone ? dv.stone : dv.ink, textDecoration: isDone ? "line-through" : "none", fontFamily: dv.sans, outline: "none", padding: 0 }} />
                                ) : (
                                  <span onClick={() => togglePackItem(trip.id, item.id)} style={{ flex: 1, fontSize: 14, color: isDone ? dv.stone : dv.ink, textDecoration: isDone ? "line-through" : "none", transition: "color 0.3s" }}>{item.label}</span>
                                )}
                                <span onClick={(e) => { e.stopPropagation();
                                  if (isCustom) {
                                    const nx = { ...customPackItems, [trip.id]: customItems.filter(i => i.id !== item.id) }; setCustomPackItems(nx); try { localStorage.setItem("continuum_custom_pack_items", JSON.stringify(nx)); } catch {}
                                  } else {
                                    // Hide default item by adding to a hidden list stored in customPackItems with a special prefix
                                    const hidden = (customPackItems[`_hidden_${trip.id}`] || []);
                                    const nx = { ...customPackItems, [`_hidden_${trip.id}`]: [...hidden, item.id] };
                                    setCustomPackItems(nx); try { localStorage.setItem("continuum_custom_pack_items", JSON.stringify(nx)); } catch {}
                                  }
                                  const nc = { ...packingLists }; if (nc[trip.id]) delete nc[trip.id][item.id]; savePackingLists(nc);
                                }} style={{ opacity: 0, color: dv.stone, fontSize: 14, padding: "0 4px", cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = css.accent; }} onMouseLeave={e => e.currentTarget.style.opacity = "0"}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0 2px", borderTop: `1px dashed ${dv.cream}`, marginTop: 8 }}>
                          <input placeholder="Add an item..." onKeyDown={e => { if (e.key === "Enter" && e.target.value.trim()) { const id = `custom_${Date.now()}`; const nx = { ...customPackItems, [trip.id]: [...customItems, { id, label: e.target.value.trim(), category: catKey }] }; setCustomPackItems(nx); try { localStorage.setItem("continuum_custom_pack_items", JSON.stringify(nx)); } catch {} e.target.value = ""; } }}
                            style={{ flex: 1, background: "transparent", border: "none", fontFamily: dv.sans, fontSize: 13, color: dv.ink, outline: "none", padding: "4px 0" }} />
                          <button onClick={e => { const inp = e.currentTarget.previousElementSibling; if (inp.value.trim()) { const id = `custom_${Date.now()}`; const nx = { ...customPackItems, [trip.id]: [...customItems, { id, label: inp.value.trim(), category: catKey }] }; setCustomPackItems(nx); try { localStorage.setItem("continuum_custom_pack_items", JSON.stringify(nx)); } catch {} inp.value = ""; } }}
                            style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, background: "none", border: "none", cursor: "pointer" }}>+ Add</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Main packing landing — hero + trip list
          return (
            <div style={{ fontFamily: dv.sans, color: dv.ink }}>
              {/* Hero */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 0.9fr", gap: isMobile ? 24 : 48, paddingBottom: 32, borderBottom: `1px solid ${dv.cream}`, marginBottom: 32, alignItems: "end" }}>
                <div>
                  <div style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: css.accent, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 1, background: css.accent }} /> The packing ledger
                  </div>
                  <h1 style={{ fontFamily: dv.serif, fontSize: isMobile ? 26 : "clamp(48px, 8vw, 96px)", fontWeight: 300, lineHeight: 0.94, letterSpacing: "-0.035em", margin: 0 }}>
                    Pack light. Forget nothing. <em style={{ fontStyle: "italic", fontWeight: 400, color: css.accent }}>Leave easy.</em>
                  </h1>
                </div>
                <div style={{ paddingBottom: 8 }}>
                  <p style={{ fontSize: 15, lineHeight: 1.55, color: dv.taupe, maxWidth: 400, margin: "0 0 20px" }}>
                    An unhurried checklist for people who've learned -- usually the hard way -- that a good trip begins with a good list. Tailored to where you're going and how long you'll be gone.
                  </p>
                </div>
              </div>

              {/* Trip list */}
              {allTripsForPacking.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {/* Upcoming label */}
                  {upcomingWithPacking.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 8px", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: dv.taupe }}>
                      <div style={{ width: 20, height: 1, background: css.accent }} />
                      <span style={{ color: css.text, fontWeight: 500 }}>Upcoming</span>
                      <span style={{ color: css.accent }}>{upcomingWithPacking.length}</span>
                      <div style={{ flex: 1, height: 1, background: dv.cream }} />
                    </div>
                  )}
                  {allTripsForPacking.map((trip, i) => {
                    const tripItems = [...getPackingItems(), ...(customPackItems[trip.id] || [])];
                    const ch = packingLists[trip.id] || {};
                    const checkedCount = tripItems.filter(it => ch[it.id]).length;
                    const totalCount = tripItems.length;
                    const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
                    const tripName = trip.tripName || trip.trip_name || trip.location || "Trip";
                    const segs = (trip.segments || []).filter(s => !s._isMeta);
                    const dates = segs.map(s => s.date).filter(Boolean).sort();
                    const dur = dates.length >= 2 ? Math.max(1, Math.ceil((new Date(dates[dates.length-1]) - new Date(dates[0])) / 86400000)) : null;
                    const isPast = i >= upcomingWithPacking.length;
                    return (
                      <React.Fragment key={trip.id}>
                      {/* Past section label */}
                      {i === upcomingWithPacking.length && pastWithPacking.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 8px", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: dv.taupe }}>
                          <div style={{ width: 20, height: 1, background: dv.stone }} />
                          <span style={{ color: dv.taupe, fontWeight: 500 }}>Past Trips</span>
                          <span style={{ color: dv.stone }}>{pastWithPacking.length}</span>
                          <div style={{ flex: 1, height: 1, background: dv.cream }} />
                        </div>
                      )}
                      <div onClick={() => { setPackingViewTripId(trip.id); setTimeout(() => { const m = document.querySelector("main"); if (m) m.scrollTo({ top: 0, behavior: "smooth" }); else window.scrollTo({ top: 0, behavior: "smooth" }); }, 0); }} data-past={isPast}
                        style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 4px", borderBottom: `1px solid ${dv.cream}`, cursor: "pointer", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = `${dv.cream}40`}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        {/* Progress ring */}
                        <div style={{ width: 44, height: 44, flexShrink: 0, position: "relative" }}>
                          <svg viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                            <circle cx="32" cy="32" r="28" fill="none" stroke={dv.cream} strokeWidth="4" />
                            <circle cx="32" cy="32" r="28" fill="none" stroke={pct === 100 ? "#10b981" : css.accent} strokeWidth="4" strokeLinecap="round" strokeDasharray="176" strokeDashoffset={176 - (176 * pct / 100)} />
                          </svg>
                          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: dv.mono, fontSize: 11, fontWeight: 500, color: dv.ink }}>{pct}%</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: dv.serif, fontSize: 18, fontWeight: 400, color: dv.ink }}>{tripName}</div>
                          <div style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.06em", marginTop: 2 }}>
                            {formatTripDates(trip)}{dur ? ` · ${dur} nights` : ""} · {checkedCount}/{totalCount} packed
                          </div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={dv.stone} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "48px 20px", textAlign: "center" }}>
                  <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 18, color: dv.taupe }}>No trips yet. Add one to start packing.</div>
                </div>
              )}
            </div>
          );
        })()}

      </div>
    );
  };

