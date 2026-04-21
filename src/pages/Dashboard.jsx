import React from "react";
import { LOYALTY_PROGRAMS } from "../constants/programs";
import { LANDMARK_FALLBACK_PHOTOS } from "../constants/airline-data";

export function renderDashboard(s) {
  const {
    css, isMobile, user, trips, expenses, sharedTrips, darkMode,
    dashSubTab, setDashSubTab, savedItineraries, setSavedItineraries,
    setActiveView, setTripDetailId, setTripDetailSegIdx,
    setShowCreateTrip, setShowAddExpense, setNewExpense, setEditExpenseId,
    setShowReceiptQR, setShowPasteItinerary, setViewExpenseId,
    setExpandedItinId, expandedItinId,
    landmarkPhotos, userForwardingAddress,
    formatTripDates, getTripExpenses, getTripTotal, getTripName,
    getFlightLiveStatus, getPackingItems, packingLists, customPackItems,
    EXPENSE_CATEGORIES, SegIcon, SectionLabel,
    nextTrip, upcomingTripsFiltered, allTripsWithShared,
    pushSupported, pushEnabled, enablePushNotifications,
    addTripFromItinerary, dismissItinerary, updateItinSeg,
    snapReceiptProcessing, handleSnapReceipt, snapReceiptInputRef,
    BLANK_EXPENSE, AIRPORT_CITY,
    lp,
  } = s;
  const D = darkMode;
    // Dashboard uses shared css palette

    const airlineStatuses = LOYALTY_PROGRAMS.airlines.map(p => ({ ...p, status: getProjectedStatus(p.id) })).filter(p => p.status);
    const hotelStatuses = LOYALTY_PROGRAMS.hotels.map(p => ({ ...p, status: getProjectedStatus(p.id) })).filter(p => p.status);
    const totalTrips = trips.length;
    const confirmedTrips = trips.filter(t => t.status === "confirmed").length;
    const willAdvanceCount = [...airlineStatuses, ...hotelStatuses].filter(p => p.status?.willAdvance).length;
    const today = new Date().toISOString().slice(0, 10);
    const daysToNext = nextTrip ? Math.max(0, Math.ceil((new Date(nextTrip.date + "T12:00:00") - new Date()) / (1000 * 60 * 60 * 24))) : null;
    const totalPointsValue = Object.entries(linkedAccounts).reduce((sum, [, acc]) => sum + (acc.pointsBalance || acc.currentPoints || acc.bonvoyPoints || acc.hhPoints || acc.ihgPoints || 0), 0);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    // Shared styles
    const box = { background: css.surface, borderRadius: css.radius, boxShadow: css.shadow };

    return (
      <div style={{ fontFamily: lp.sans, color: lp.text }}>

        {/* ── Header: greeting ── */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 700, color: css.text, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {greeting}, {user?.user_metadata?.first_name || user?.user_metadata?.name?.split(" ")[0] || "Traveler"}
          </h1>
          <div style={{ fontSize: isMobile ? 12 : 13, color: css.text3, fontWeight: 500, marginTop: 4 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>

        {/* Push notification prompt */}
        {pushSupported && !pushEnabled && dashSubTab === "overview" && (
          <button onClick={enablePushNotifications} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", borderRadius: 8, background: "transparent", border: `1px solid ${D ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.2)"}`, cursor: "pointer", marginBottom: 10, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = D ? "rgba(59,130,246,0.06)" : "rgba(59,130,246,0.03)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            <span style={{ fontSize: 11, color: css.text3 }}>Enable flight alerts</span>
            <span style={{ fontSize: 10, color: "#3b82f6", fontWeight: 600, marginLeft: "auto" }}>Enable</span>
          </button>
        )}

        {/* ── Tab bar + Add Trip (sticks to top on scroll, flush with header) ── */}
        <div className="c-a1" style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 0", marginBottom: 16, background: D ? "rgba(15,15,15,0.95)" : "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: `1px solid ${css.border}`, marginLeft: isMobile ? -16 : -48, marginRight: isMobile ? -16 : -48, paddingLeft: isMobile ? 8 : 48, paddingRight: isMobile ? 8 : 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: isMobile ? 0 : 4,
            background: "transparent",
            padding: 0, overflowX: isMobile ? "auto" : "visible", flex: 1, justifyContent: "center",
          }}>
            {[
              { id: "overview", label: "Overview" },
              { id: "inbox", label: "Inbox" },
              { id: "timeline", label: "Timeline" },
              { id: "reports", label: "Reports" },
              { id: "packing", label: "Packing" },
            ].map(tab => {
              const isActive = dashSubTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setDashSubTab(tab.id)} style={{
                  padding: isMobile ? "6px 10px" : "8px 18px", border: "none", cursor: "pointer",
                  background: "transparent",
                  borderBottom: isActive ? `2px solid ${css.accent}` : "2px solid transparent",
                  borderRadius: 0, color: isActive ? css.accent : css.text3,
                  fontSize: isMobile ? 11 : 13, fontWeight: isActive ? 600 : 400, transition: "all 0.15s",
                  whiteSpace: "nowrap", fontFamily: "inherit",
                }}>
                  {tab.label}
                  {tab.id === "inbox" && (savedItineraries.length + expenses.filter(e => !e.tripId).length) > 0 && (
                    <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: "#fff", background: css.accent, borderRadius: 10, padding: "1px 6px", minWidth: 16, display: "inline-block", textAlign: "center" }}>
                      {savedItineraries.length + expenses.filter(e => !e.tripId).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button onClick={() => setShowCreateTrip(true)} style={{
            padding: isMobile ? "7px 14px" : "8px 20px", border: "none", background: css.accent, color: "#fff",
            fontSize: isMobile ? 12 : 13, fontWeight: 600, cursor: "pointer", borderRadius: 24,
            transition: "all 0.15s ease", whiteSpace: "nowrap", marginLeft: 12, flexShrink: 0,
          }}>
            + Add Trip
          </button>
        </div>

        {/* ── Hero banner image ── */}
        {dashSubTab === "overview" && (
          <div style={{ margin: isMobile ? "0 -16px 0" : "0 -48px 0", position: "relative", height: isMobile ? 160 : 240, overflow: "hidden" }}>
            <img src="/hero-travel.jpg" alt="Travel" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%", display: "block" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: isMobile ? 60 : 80, background: D ? "linear-gradient(transparent, #0f0f0f)" : "linear-gradient(transparent, #ffffff)" }} />
          </div>
        )}

        {/* ── Dashboard content (on solid background) ── */}
        {dashSubTab === "overview" && <>

                {/* Next trip countdown */}
                {nextTrip && (
                  <div className="c-a1" style={{ padding: "8px 0 8px" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: css.accent, marginBottom: 4 }}>
                      {daysToNext === 0 ? "Departing Today" : daysToNext === 1 ? "Departing Tomorrow" : `${daysToNext} Days Away`}
                    </div>
                    <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: css.text, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                      {nextTrip.tripName || nextTrip.trip_name || nextTrip.location || "Upcoming Trip"}
                    </div>
                    {nextTrip.location && <div style={{ fontSize: 13, color: css.text3, marginTop: 4 }}>{nextTrip.location}</div>}
                  </div>
                )}

        {/* ── Upcoming Trips ── */}
        <div className="c-a1" style={{ marginTop: 20 }}>
          <SectionLabel action={() => setActiveView("trips")} actionLabel="View all">Upcoming Trips</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcomingTripsFiltered.slice(0, 6).map((trip, tIdx) => {
              const tripStart = trip.date || (trip.segments && trip.segments.map(s => s.date).filter(Boolean).sort()[0]) || "";
              const daysAway = tripStart ? Math.max(0, Math.ceil((new Date(tripStart + "T12:00:00") - new Date()) / 86400000)) : null;
              const confCode = trip.confirmationCode || trip.confirmation_code
                || (trip.segments && trip.segments.map(s => s.confirmationCode).filter(Boolean)[0])
                || (trip.bookingSource?.confirmation) || "";
              const realSegs = (trip.segments || []).filter(s => !s._isMeta);
              const hasFlights = realSegs.some(s => s.type === "flight");
              const hasHotels = realSegs.some(s => s.type === "hotel" || s.type === "accommodation");
              const hasActivities = realSegs.some(s => s.type === "activity" || s.type === "restaurant");
              // Find first flight with live status
              const firstFlightStatus = realSegs.filter(s => s.type === "flight").map(s => getFlightLiveStatus(s)).find(s => s && !s.error);
              const flightAlert = firstFlightStatus?.status === "Canceled" ? "Cancelled" : firstFlightStatus?.departureDelay > 15 ? `Delayed ${firstFlightStatus.departureDelay}m` : firstFlightStatus?.status === "EnRoute" ? "In Flight" : firstFlightStatus?.status === "Landed" ? "Landed" : null;
              const alertColor = firstFlightStatus?.status === "Canceled" ? "#ef4444" : firstFlightStatus?.departureDelay > 15 ? "#f59e0b" : firstFlightStatus?.status === "EnRoute" ? "#3b82f6" : firstFlightStatus?.status === "Landed" ? "#10b981" : null;
              const segIconType = realSegs.length === 0 ? "pin" : hasFlights ? "flight" : hasHotels ? "hotel" : hasActivities ? "activity" : "pin";
              const sColor = trip.status === "confirmed" ? lp.green : trip.status === "planned" ? "#F59E0B" : lp.teal;
              const sBg = trip.status === "confirmed" ? "rgba(34,197,94,0.10)" : trip.status === "planned" ? "rgba(245,158,11,0.10)" : "rgba(14,165,160,0.10)";
              return (
                <div key={trip.id} onClick={() => { setTripDetailId(trip.id); setTripDetailSegIdx(0); setActiveView("trips"); }}
                  style={{ padding: isMobile ? "12px 14px" : "16px 20px", borderRadius: css.radius, background: css.surface, border: `1px solid ${css.border}`, boxShadow: css.shadow, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: isMobile ? 8 : 12, transition: "all 0.15s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = css.shadowHover; e.currentTarget.style.borderColor = css.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = css.shadow; e.currentTarget.style.borderColor = css.border; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 12, flex: 1, minWidth: 0 }}>
                    <div style={{ width: isMobile ? 34 : 40, height: isMobile ? 34 : 40, borderRadius: 10, background: `${lp.teal}15`, border: `1px solid ${lp.teal}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <SegIcon type={segIconType} size={isMobile ? 15 : 18} color={lp.teal} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: css.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{trip.tripName || trip.trip_name || trip.route || trip.property || trip.location}</div>
                      <div style={{ fontSize: isMobile ? 10 : 11, color: css.text3, marginTop: 2 }}>
                        <span>{formatTripDates(trip)}</span>
                        {trip.location && <span> · {trip.location}</span>}
                      </div>
                      {confCode && <div style={{ fontFamily: lp.mono, fontWeight: 600, color: lp.text2, fontSize: 9, marginTop: 1 }}>{confCode}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {daysAway !== null && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: daysAway <= 7 ? lp.teal : lp.text2, fontFamily: lp.mono }}>
                        {daysAway === 0 ? "Today" : daysAway === 1 ? "Tomorrow" : `${daysAway}d`}
                      </span>
                    )}
                    {flightAlert && <span style={{ fontSize: 9, fontWeight: 700, color: alertColor, background: `${alertColor}12`, padding: "3px 8px", borderRadius: 4, border: `1px solid ${alertColor}30`, textTransform: "uppercase", letterSpacing: "0.04em" }}>{flightAlert}</span>}
                    {trip._shared && <span style={{ fontSize: 9, fontWeight: 600, color: "#3b82f6", background: "rgba(59,130,246,0.1)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(59,130,246,0.2)" }}>Shared</span>}
                    <span style={{ fontSize: 9, fontWeight: 700, color: sColor, background: sBg, padding: "4px 10px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.06em", border: `1px solid ${sColor}30` }}>{trip.status}</span>
                  </div>
                </div>
              );
            })}
            {upcomingTripsFiltered.length === 0 && (
              <div style={{ padding: "40px 20px", textAlign: "center", borderRadius: 14, background: lp.surface, border: `1px solid ${lp.border}` }}>
                <p style={{ fontSize: 13, color: lp.dim, marginBottom: 12 }}>No upcoming trips</p>
                <button onClick={() => setShowCreateTrip(true)} style={{ background: lp.teal, border: "none", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: lp.sans, padding: "10px 22px", borderRadius: 10 }}>+ Add your first trip</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Trip Highlights — vertical list with horizontal landmark scroll ── */}
        {upcomingTripsFiltered.length > 0 && (() => {
          // Extract unique destination cities from flight segments
          const IATA_CITY = { JFK: "New York", LAX: "Los Angeles", SFO: "San Francisco", ORD: "Chicago", MIA: "Miami", LHR: "London", CDG: "Paris", NRT: "Tokyo", HND: "Tokyo", KIX: "Osaka", ICN: "Seoul", SIN: "Singapore", HKG: "Hong Kong", DXB: "Dubai", FCO: "Rome", BCN: "Barcelona", AMS: "Amsterdam", FRA: "Frankfurt", IST: "Istanbul", BKK: "Bangkok", SYD: "Sydney", YYZ: "Toronto", MEX: "Mexico City", GRU: "Sao Paulo", DEL: "Delhi", BOM: "Mumbai", PEK: "Beijing", PVG: "Shanghai", TPE: "Taipei", CAN: "Guangzhou", KUL: "Kuala Lumpur", MNL: "Manila", CGK: "Jakarta", DOH: "Doha", AUH: "Abu Dhabi", JNB: "Johannesburg", CAI: "Cairo", ATH: "Athens", LIS: "Lisbon", MAD: "Madrid", MUC: "Munich", ZRH: "Zurich", VIE: "Vienna", CPH: "Copenhagen", OSL: "Oslo", ARN: "Stockholm", HEL: "Helsinki", WAW: "Warsaw", PRG: "Prague", BUD: "Budapest", DUB: "Dublin", EDI: "Edinburgh", BER: "Berlin", MXP: "Milan", VCE: "Venice", NAP: "Naples", ATL: "Atlanta", DFW: "Dallas", DEN: "Denver", SEA: "Seattle", BOS: "Boston", IAD: "Washington DC", PHL: "Philadelphia", MSP: "Minneapolis", DTW: "Detroit", CLT: "Charlotte", PHX: "Phoenix", TPA: "Tampa", MCO: "Orlando", FLL: "Fort Lauderdale", SAN: "San Diego", PDX: "Portland", HNL: "Honolulu", ANC: "Anchorage", BDA: "Bermuda", NAS: "Nassau", MBJ: "Montego Bay", CUN: "Cancun", LIM: "Lima", SCL: "Santiago", EZE: "Buenos Aires", BOG: "Bogota", PTY: "Panama City", SJU: "San Juan", STT: "St Thomas", SXM: "St Maarten" };
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
          // Photos come from Google Places API — fetched dynamically
          return (
            <div className="c-a2" style={{ marginTop: 32 }}>
              <SectionLabel>Trip Highlights</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {upcomingTripsFiltered.slice(0, 6).map((trip, tIdx) => {
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
                      {/* Trip header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: css.text }}>{trip.tripName || trip.trip_name || trip.location || "Trip"}</div>
                        <span style={{ fontSize: 11, color: css.text3 }}>{formatTripDates(trip)}</span>
                        {uniqueCities.length > 0 && <span style={{ fontSize: 11, color: css.accent, fontWeight: 600, textShadow: "0 0 8px rgba(255,255,255,0.9)" }}>{uniqueCities.join(" · ")}</span>}
                      </div>
                      {/* Horizontal scrolling landmark cards */}
                      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", marginLeft: isMobile ? -16 : 0, marginRight: isMobile ? -16 : 0, paddingLeft: isMobile ? 16 : 0, paddingRight: isMobile ? 16 : 0 }}>
                        {landmarks.slice(0, 10).map((lm, li) => (
                          <a key={li} href={`https://www.google.com/search?q=${encodeURIComponent(lm.name + " " + lm.city + " things to do travel guide")}`} target="_blank" rel="noopener noreferrer" style={{ minWidth: isMobile ? 200 : 220, maxWidth: isMobile ? 200 : 220, borderRadius: 12, overflow: "hidden", background: css.surface, border: `1px solid ${css.border}`, flexShrink: 0, scrollSnapAlign: "start", transition: "transform 0.15s, box-shadow 0.15s", textDecoration: "none", display: "block", cursor: "pointer" }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.15)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                          >
                            <div style={{ height: 140, position: "relative", overflow: "hidden", background: D ? "#222" : "#f0f0f0" }}>
                              {lm.photo ? (
                                <img src={lm.photo} alt={lm.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                              ) : (
                                <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${D ? "#1a1a1a" : "#e8e8e8"} 25%, ${D ? "#222" : "#f2f2f2"} 50%, ${D ? "#1a1a1a" : "#e8e8e8"} 75%)`, backgroundSize: "200% 100%", animation: "c-shimmer 1.5s ease-in-out infinite", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <span style={{ fontSize: 10, color: css.text3, opacity: 0.5 }}>Loading...</span>
                                </div>
                              )}
                              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 10px 8px", background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)" }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{lm.name}</div>
                              </div>
                            </div>
                            <div style={{ padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ fontSize: 10, color: css.text3, fontWeight: 500 }}>{lm.city}</div>
                              <div style={{ fontSize: 9, color: css.accent, fontWeight: 600 }}>Explore</div>
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
        {dashSubTab === "inbox" && (
          <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: css.text, margin: 0, letterSpacing: "-0.01em" }}>Booking Inbox</h3>
              {savedItineraries.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: lp.teal, borderRadius: 10, padding: "2px 8px", minWidth: 18, textAlign: "center" }}>{savedItineraries.length}</span>
              )}
            </div>
            <button onClick={() => setShowPasteItinerary(true)} style={{
              padding: "8px 16px", border: `1px solid ${lp.teal}`, background: "transparent", color: lp.teal,
              fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: lp.sans, borderRadius: 0,
              transition: "all 0.12s ease", textTransform: "uppercase", letterSpacing: "0.04em",
            }} onMouseEnter={e => { e.currentTarget.style.background = lp.teal; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = lp.teal; }}>
              + Add Booking
            </button>
          </div>
          {/* Forwarding address */}
          {userForwardingAddress && (
            <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: lp.surface, border: `1px solid ${lp.border}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={lp.dim} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span style={{ fontSize: 11, color: lp.dim }}>Forward bookings to:</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: lp.teal, fontFamily: lp.mono, cursor: "pointer", wordBreak: "break-all" }}
                onClick={() => { navigator.clipboard?.writeText("trips@gocontinuum.app"); }}
                title="Click to copy">
                trips@gocontinuum.app
              </span>
              <span style={{ fontSize: 10, color: lp.dim }}>tap to copy</span>
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
                const updateItinSeg = (segIdx, updates) => {
                  setSavedItineraries(prev => prev.map(it => it.id !== itin.id ? it : {
                    ...it, parsed_segments: it.parsed_segments.map((s, i) => i === segIdx ? { ...s, ...updates } : s),
                  }));
                };
                return (
                  <div key={itin.id} style={{ borderRadius: 12, background: lp.surface, border: `1px solid ${lp.border}`, overflow: "hidden", transition: "all 0.2s ease" }}>
                    {/* Header row */}
                    <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, cursor: "pointer" }}
                      onClick={() => setExpandedItinId(isExpanded ? null : itin.id)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <SegIcon type={isHotel ? "hotel" : "flight"} size={16} color={lp.teal} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: lp.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {isHotel ? (hotels[0]?.property || itin.subject || "Hotel") : (itin.subject || "Booking")}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: lp.dim, display: "flex", gap: 10, flexWrap: "wrap" }}>
                          {itin.confirmation_code && <span style={{ fontFamily: lp.mono, fontWeight: 600, color: lp.text2 }}>{itin.confirmation_code}</span>}
                          {isHotel && hotels[0]?.date && <span>{new Date(hotels[0].date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {hotels[0].checkoutDate ? new Date(hotels[0].checkoutDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>}
                          {isHotel && hotels[0]?.nights && <span>{hotels[0].nights} night{hotels[0].nights > 1 ? "s" : ""}</span>}
                          {flights.length > 0 && <span>{flights.length} segment{flights.length > 1 ? "s" : ""}</span>}
                          {flights.length > 0 && flights[0]?.departureAirport && <span style={{ fontFamily: lp.mono }}>{flights.map(f => f.departureAirport).filter(Boolean)[0]} → {flights.map(f => f.arrivalAirport).filter(Boolean).pop()}</span>}
                          {firstDate && !isHotel && <span>{new Date(firstDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                          {flights[0]?.airline && <span>{flights[0].airline}</span>}
                          {flights[0]?.fareClass && <span style={{ textTransform: "capitalize" }}>{flights[0].fareClass}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                          <path d="M4 6l4 4 4-4" stroke={lp.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                    {/* Expanded detail + edit */}
                    {isExpanded && (
                      <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${lp.border}` }}>
                        {segs.map((seg, segIdx) => (
                          <div key={segIdx} style={{ padding: "12px 0", borderBottom: segIdx < segs.length - 1 ? `1px solid ${lp.border}` : "none" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: lp.teal, textTransform: "uppercase", marginBottom: 8 }}>{seg.type === "hotel" ? "Hotel" : "Flight"}</div>
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
                                    <label style={{ fontSize: 9, fontWeight: 700, color: lp.dim, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</label>
                                    <input type={f.type || "text"} value={seg[f.key] || ""} onChange={e => updateItinSeg(segIdx, { [f.key]: e.target.value })}
                                      style={{ display: "block", width: "100%", padding: "6px 8px", background: D ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${lp.border}`, borderRadius: 6, color: lp.text, fontSize: 12, fontFamily: f.key === "confirmationCode" ? lp.mono : "inherit", outline: "none", boxSizing: "border-box", marginTop: 2 }} />
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
                                    <label style={{ fontSize: 9, fontWeight: 700, color: lp.dim, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</label>
                                    <input type={f.type || "text"} value={seg[f.key] || ""} placeholder={f.placeholder || ""} onChange={e => updateItinSeg(segIdx, { [f.key]: e.target.value })}
                                      style={{ display: "block", width: "100%", padding: "6px 8px", background: D ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${lp.border}`, borderRadius: 6, color: lp.text, fontSize: 12, fontFamily: f.mono ? lp.mono : "inherit", outline: "none", boxSizing: "border-box", marginTop: 2 }} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                          <button onClick={() => addTripFromItinerary(itin)} style={{
                            padding: "8px 16px", borderRadius: 8, border: "none",
                            background: lp.teal, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer",
                          }}>Create New Trip</button>
                          {trips.length > 0 && (
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
                            }} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${lp.border2}`, background: "transparent", color: lp.dim, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                              <option value="">Add to existing trip...</option>
                              {trips.slice(0, 20).map(t => <option key={t.id} value={t.id}>{t.tripName || t.trip_name || t.route || t.property || "Trip"}</option>)}
                            </select>
                          )}
                          <button onClick={() => dismissItinerary(itin.id)} style={{
                            padding: "8px 12px", borderRadius: 8, border: `1px solid ${lp.border2}`,
                            background: "transparent", color: lp.dim, fontSize: 11, fontWeight: 500, cursor: "pointer",
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
            <div className="c-a2" style={{ marginTop: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: css.text, margin: 0, letterSpacing: "-0.01em" }}>Expense Inbox</h3>
                  {inboxExpenses.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: lp.teal, background: lp.tealDim, padding: "2px 8px", borderRadius: 10 }}>{inboxExpenses.length}</span>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="file" accept="image/*" capture="environment" ref={snapReceiptInputRef} style={{ display: "none" }}
                    onChange={e => { if (e.target.files?.[0]) handleSnapReceipt(e.target.files[0]); }} />
                  <button onClick={() => snapReceiptInputRef.current?.click()} disabled={snapReceiptProcessing} style={{
                    padding: "8px 14px", border: `1px solid ${css.accent}`, background: snapReceiptProcessing ? css.surface2 : css.accent, color: snapReceiptProcessing ? css.text3 : "#fff",
                    fontSize: 11, fontWeight: 700, cursor: snapReceiptProcessing ? "default" : "pointer", fontFamily: lp.sans, borderRadius: 8,
                    transition: "all 0.12s ease", display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    {snapReceiptProcessing ? "Reading..." : "Snap Receipt"}
                  </button>
                  <button onClick={() => setShowReceiptQR(true)} style={{
                    padding: "8px 14px", border: `1px solid ${css.border}`, background: css.surface, color: css.text2,
                    fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: lp.sans, borderRadius: 8,
                    transition: "all 0.12s ease", display: "flex", alignItems: "center", gap: 6,
                  }} onMouseEnter={e => { e.currentTarget.style.borderColor = css.accent; e.currentTarget.style.color = css.accent; }} onMouseLeave={e => { e.currentTarget.style.borderColor = css.border; e.currentTarget.style.color = css.text2; }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                    Receipt QR
                  </button>
                  <button onClick={() => { setShowAddExpense("_inbox"); setNewExpense(BLANK_EXPENSE); setEditExpenseId(null); }} style={{
                    padding: "8px 16px", border: `1px solid ${lp.teal}`, background: "transparent", color: lp.teal,
                    fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: lp.sans, borderRadius: 0,
                    transition: "all 0.12s ease", textTransform: "uppercase", letterSpacing: "0.04em",
                  }} onMouseEnter={e => { e.currentTarget.style.background = lp.teal; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = lp.teal; }}>
                    + Add Expense
                  </button>
                </div>
              </div>
              {userForwardingAddress && (
                <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: lp.surface, border: `1px solid ${lp.border}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={lp.dim} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <span style={{ fontSize: 11, color: lp.dim }}>Forward receipts to:</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: lp.teal, fontFamily: lp.mono, cursor: "pointer", wordBreak: "break-all" }}
                    onClick={() => { navigator.clipboard?.writeText("expenses@gocontinuum.app"); }}
                    title="Click to copy">
                    expenses@gocontinuum.app
                  </span>
                  <span style={{ fontSize: 10, color: lp.dim }}>tap to copy</span>
                </div>
              )}
              {inboxExpenses.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {inboxExpenses.map(exp => {
                    const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                    return (
                      <div key={exp.id} style={{ background: lp.surface, border: `1px solid ${lp.border}`, borderRadius: 12, padding: isMobile ? "12px" : "12px 16px" }} onClick={() => setViewExpenseId(exp.id)}>
                        {/* Top row: description + amount */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                              {cat && <span style={{ fontSize: 9, fontWeight: 700, color: cat.color, background: `${cat.color}15`, padding: "2px 6px", borderRadius: 4 }}>{cat.label}</span>}
                              <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, color: lp.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description || "Expense"}</span>
                            </div>
                            <div style={{ fontSize: 11, color: lp.dim, display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {exp.date && <span>{new Date(exp.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                              {exp.receipt && <span style={{ color: "#22c55e" }}>Receipt</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: lp.text, fontFamily: lp.mono }}>{exp.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {exp.currency || "USD"}</div>
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
                            }} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${lp.border}`, background: "transparent", color: lp.dim, fontSize: 11, cursor: "pointer", flex: isMobile ? "1 1 auto" : "0 0 auto" }}>
                              <option value="">Assign to trip...</option>
                              {trips.map(t => <option key={t.id} value={t.id}>{t.tripName || t.location || "Trip"}</option>)}
                            </select>
                          )}
                          <button onClick={() => setViewExpenseId(exp.id)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${css.accent}30`, background: "transparent", color: css.accent, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>View</button>
                          <button onClick={() => { setEditExpenseId(exp.id); setShowAddExpense("_inbox"); setNewExpense({ ...exp, fxRate: exp.fxRate || 1 }); }} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${lp.border}`, background: "transparent", color: lp.dim, fontSize: 11, cursor: "pointer" }}>Edit</button>
                          <button onClick={() => removeExpense(exp.id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#ef4444", fontSize: 11, cursor: "pointer" }}>x</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "24px 20px", textAlign: "center", borderRadius: 14, background: lp.surface, border: `1px solid ${lp.border}` }}>
                  <p style={{ fontSize: 13, color: lp.dim, margin: "0 0 4px" }}>No unassigned expenses</p>
                  <p style={{ fontSize: 11, color: lp.dim, margin: 0 }}>Add receipts here and assign them to trips later</p>
                </div>
              )}
            </div>
          );
        })()}

          </div>
        )}

        {/* ── Timeline Tab — vertical chronological view ── */}
        {dashSubTab === "timeline" && (() => {
          const allSorted = [...upcomingTripsFiltered, ...pastTripsFiltered].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
          const yearGroups = {};
          allSorted.forEach(trip => {
            const yr = (trip.date || "").slice(0, 4) || "Unknown";
            if (!yearGroups[yr]) yearGroups[yr] = [];
            yearGroups[yr].push(trip);
          });
          return (
            <div>
              {Object.entries(yearGroups).sort(([a], [b]) => a.localeCompare(b)).map(([year, yTrips]) => (
                <div key={year} style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: css.text, marginBottom: 16, letterSpacing: "-0.02em" }}>{year}</div>
                  <div style={{ position: "relative", paddingLeft: 28 }}>
                    {/* Vertical line */}
                    <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: css.border, borderRadius: 1 }} />
                    {yTrips.map((trip, idx) => {
                      const realSegs = (trip.segments || []).filter(s => !s._isMeta);
                      const end = getTripEndDate(trip);
                      const isPast = end && end < todayStr;
                      return (
                        <div key={trip.id} style={{ position: "relative", marginBottom: idx < yTrips.length - 1 ? 20 : 0 }}>
                          {/* Dot */}
                          <div style={{ position: "absolute", left: -22, top: 6, width: 12, height: 12, borderRadius: "50%", background: isPast ? css.text3 : css.accent, border: `2px solid ${css.bg}` }} />
                          <div onClick={() => { setTripDetailId(trip.id); setTripDetailSegIdx(0); setActiveView("trips"); }}
                            style={{ padding: "14px 18px", borderRadius: 12, background: css.surface, border: `1px solid ${css.border}`, cursor: "pointer", transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = css.accent; e.currentTarget.style.boxShadow = css.shadowHover; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = css.border; e.currentTarget.style.boxShadow = "none"; }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: isPast ? css.text2 : css.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {trip.tripName || trip.trip_name || trip.location || "Trip"}
                                </div>
                                <div style={{ fontSize: 11, color: css.text3, marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <span>{formatTripDates(trip)}</span>
                                  {trip.location && <span>· {trip.location}</span>}
                                  {realSegs.length > 0 && <span>· {realSegs.length} segment{realSegs.length > 1 ? "s" : ""}</span>}
                                </div>
                              </div>
                              <span style={{ fontSize: 9, fontWeight: 700, color: isPast ? css.text3 : (trip.status === "confirmed" ? lp.green : "#F59E0B"), textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
                                {isPast ? "Past" : trip.status}
                              </span>
                            </div>
                            {/* Segment type pills */}
                            {realSegs.length > 0 && (
                              <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                                {[...new Set(realSegs.map(s => s.type))].map(type => (
                                  <span key={type} style={{ fontSize: 10, color: css.text2, background: css.surface2, padding: "2px 8px", borderRadius: 4, textTransform: "capitalize" }}>{type}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {allSorted.length === 0 && (
                <div style={{ padding: "40px 20px", textAlign: "center", borderRadius: 14, background: css.surface, border: `1px solid ${css.border}` }}>
                  <p style={{ fontSize: 13, color: css.text3 }}>No trips to show on timeline</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Reports Tab — expense summaries ── */}
        {dashSubTab === "reports" && (() => {
          const totalSpent = expenses.reduce((sum, e) => sum + (e.usdReimbursement ? parseFloat(e.usdReimbursement) : (e.amount || 0)), 0);
          const catBreakdown = EXPENSE_CATEGORIES.map(cat => ({
            ...cat,
            total: expenses.filter(e => e.category === cat.id).reduce((sum, e) => sum + (e.usdReimbursement ? parseFloat(e.usdReimbursement) : (e.amount || 0)), 0),
            count: expenses.filter(e => e.category === cat.id).length,
          })).filter(c => c.count > 0).sort((a, b) => b.total - a.total);
          const tripCosts = trips.map(trip => {
            const tripExpenses = expenses.filter(e => e.tripId === trip.id || e.trip_id === trip.id);
            return { ...trip, total: tripExpenses.reduce((sum, e) => sum + (e.usdReimbursement ? parseFloat(e.usdReimbursement) : (e.amount || 0)), 0), count: tripExpenses.length };
          }).filter(t => t.count > 0).sort((a, b) => b.total - a.total);
          const maxCatTotal = catBreakdown.length > 0 ? catBreakdown[0].total : 1;
          return (
            <div>
              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
                <div style={{ padding: "18px 20px", borderRadius: 12, background: css.surface, border: `1px solid ${css.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Total Spent</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: css.text, fontFamily: lp.mono }}>${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ padding: "18px 20px", borderRadius: 12, background: css.surface, border: `1px solid ${css.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Expenses</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: css.text }}>{expenses.length}</div>
                </div>
                <div style={{ padding: "18px 20px", borderRadius: 12, background: css.surface, border: `1px solid ${css.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Categories</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: css.text }}>{catBreakdown.length}</div>
                </div>
              </div>

              {/* Spending by category */}
              {catBreakdown.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: css.text, marginBottom: 14 }}>Spending by Category</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {catBreakdown.map(cat => (
                      <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 80, fontSize: 11, fontWeight: 600, color: css.text2, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.label}</div>
                        <div style={{ flex: 1, height: 8, borderRadius: 4, background: css.surface2, overflow: "hidden" }}>
                          <div style={{ width: `${(cat.total / maxCatTotal) * 100}%`, height: "100%", borderRadius: 4, background: cat.color, transition: "width 0.6s ease" }} />
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: css.text, fontFamily: lp.mono, flexShrink: 0, minWidth: 70, textAlign: "right" }}>${cat.total.toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost by trip */}
              {tripCosts.length > 0 && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: css.text, marginBottom: 14 }}>Cost by Trip</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {tripCosts.slice(0, 10).map(trip => (
                      <div key={trip.id} onClick={() => { setTripDetailId(trip.id); setTripDetailSegIdx(0); setActiveView("trips"); }}
                        style={{ padding: "12px 16px", borderRadius: 12, background: css.surface, border: `1px solid ${css.border}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = css.accent}
                        onMouseLeave={e => e.currentTarget.style.borderColor = css.border}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{trip.tripName || trip.trip_name || trip.location || "Trip"}</div>
                          <div style={{ fontSize: 11, color: css.text3, marginTop: 2 }}>{trip.count} expense{trip.count > 1 ? "s" : ""} · {formatTripDates(trip)}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: css.text, fontFamily: lp.mono }}>${trip.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {expenses.length === 0 && (
                <div style={{ padding: "40px 20px", textAlign: "center", borderRadius: 14, background: css.surface, border: `1px solid ${css.border}` }}>
                  <p style={{ fontSize: 13, color: css.text3 }}>No expenses recorded yet</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Activity Tab — recent actions feed ── */}
        {dashSubTab === "packing" && (() => {
          const upcomingWithPacking = [...trips].filter(t => {
            const d = t.date || (t.segments || []).map(s => s.date).filter(Boolean).sort()[0] || "";
            return d >= new Date().toISOString().slice(0, 10);
          }).sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
          const allTripsForPacking = upcomingWithPacking.length > 0 ? upcomingWithPacking : trips.slice(0, 5);

          return (
            <div>
              {allTripsForPacking.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {allTripsForPacking.map(trip => {
                    const packCats = getPackingItems(trip);
                    const checked = packingLists[trip.id] || {};
                    const tripCust = (customPackItems[trip.id] || []);
                    const allItems = [...Object.values(packCats).flatMap(c => c.items), ...tripCust];
                    const checkedCount = allItems.filter(i => checked[i.id]).length;
                    const totalCount = allItems.length;
                    const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
                    const tripName = trip.tripName || trip.trip_name || trip.location || "Trip";
                    return (
                      <div key={trip.id} onClick={() => { setTripDetailId(trip.id); setTripDetailSegIdx(0); setActiveView("trips"); }}
                        style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 12, padding: isMobile ? "14px 16px" : "16px 20px", cursor: "pointer", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = css.accent; e.currentTarget.style.boxShadow = css.shadowHover; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = css.border; e.currentTarget.style.boxShadow = "none"; }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: css.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tripName}</div>
                            <div style={{ fontSize: 10, color: css.text3, marginTop: 2 }}>{formatTripDates(trip)}{trip.location ? ` · ${trip.location}` : ""}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: pct === 100 ? "#10b981" : css.text, fontFamily: "'Geist Mono', monospace" }}>{pct}%</div>
                            <div style={{ fontSize: 9, color: css.text3 }}>{checkedCount}/{totalCount}</div>
                          </div>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: css.surface2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#10b981" : css.accent, borderRadius: 2, transition: "width 0.3s ease" }} />
                        </div>
                        {/* Category summary */}
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                          {Object.entries(packCats).map(([catKey, cat]) => {
                            const catCust = tripCust.filter(i => i.category === catKey);
                            const catAll = [...cat.items, ...catCust];
                            const catDone = catAll.filter(i => checked[i.id]).length;
                            return (
                              <span key={catKey} style={{ fontSize: 10, color: catDone === catAll.length ? "#10b981" : css.text3, fontFamily: "'Geist Mono', monospace" }}>
                                {cat.label} {catDone}/{catAll.length}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "40px 20px", textAlign: "center", borderRadius: 14, background: css.surface, border: `1px solid ${css.border}` }}>
                  <p style={{ fontSize: 13, color: css.text3, margin: "0 0 8px" }}>No trips yet</p>
                  <p style={{ fontSize: 12, color: css.text3, margin: 0 }}>Add a trip to start your packing list</p>
                </div>
              )}
            </div>
          );
        })()}

      </div>
    );
  };

