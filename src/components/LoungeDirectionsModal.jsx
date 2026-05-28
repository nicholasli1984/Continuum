import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "../utils/apiBase";

// LoungeDirectionsModal — opens an in-app sheet showing walking directions
// from the user's current location to a specific lounge. Powered by the
// Google Maps Embed API (free for unlimited iframe loads). The actual lounge
// coordinates come from a tiny Places lookup via /api/lounge-coords.
//
// Limits worth surfacing in the UI:
// - GPS inside terminals can drift 50–100m
// - Google's indoor map data varies by airport; the route may default to the
//   nearest outdoor entrance rather than the lounge interior on smaller airports
//
// Props:
//   lounge       — the lounge object (uses .name and .placeQuery)
//   airport      — airport IATA code (used only for display)
//   embedApiKey  — the Maps Embed API key (the same Google Cloud key that
//                  powers /api/lounge-coords and /api/restaurant-photo, but
//                  with Maps Embed API enabled on it)
//   onClose      — close handler
export default function LoungeDirectionsModal({ lounge, airport, embedApiKey, onClose, css, dv, isMobile }) {
  const [userLoc, setUserLoc] = useState(null);   // { lat, lng } or null
  const [loungeLoc, setLoungeLoc] = useState(null); // { lat, lng, name } or null
  const [locError, setLocError] = useState("");
  const [coordsError, setCoordsError] = useState("");
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [loadingCoords, setLoadingCoords] = useState(true);

  // Fetch lounge coordinates (cached aggressively, so this is usually instant).
  useEffect(() => {
    let cancelled = false;
    const q = lounge?.placeQuery || `${lounge?.name || ""} ${airport || ""}`.trim();
    if (!q) { setCoordsError("This lounge doesn't have enough info to map."); setLoadingCoords(false); return; }
    (async () => {
      try {
        const cacheKey = `loungeLoc:${q}`;
        const cached = (() => { try { return JSON.parse(localStorage.getItem(cacheKey) || "null"); } catch { return null; } })();
        if (cached?.lat && cached?.lng && cached?.t && Date.now() - cached.t < 60 * 86400 * 1000) {
          if (!cancelled) { setLoungeLoc(cached); setLoadingCoords(false); }
          return;
        }
        const res = await apiFetch(`/api/lounge-coords?query=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data?.lat && data?.lng) {
          setLoungeLoc(data);
          try { localStorage.setItem(cacheKey, JSON.stringify({ ...data, t: Date.now() })); } catch { /* quota */ }
        } else {
          setCoordsError("We couldn't pin this lounge on the map.");
        }
      } catch (e) {
        if (!cancelled) setCoordsError("Couldn't look up the lounge location.");
      } finally {
        if (!cancelled) setLoadingCoords(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lounge, airport]);

  // Request user's geolocation (one-time per modal open; permission state
  // persists at the OS/browser level).
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError("Your browser doesn't support location.");
      setLoadingLoc(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoadingLoc(false);
      },
      (err) => {
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Location access denied. Enable it in your settings to see walking directions."
            : "Couldn't read your location."
        );
        setLoadingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Open native Maps (Apple Maps on iOS, Google Maps elsewhere) for proper
  // turn-by-turn voice navigation.
  const openInNativeMaps = () => {
    if (!loungeLoc) return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const origin = userLoc ? `${userLoc.lat},${userLoc.lng}` : "";
    const dest = `${loungeLoc.lat},${loungeLoc.lng}`;
    if (isIOS) {
      // Apple Maps walking directions
      const url = origin
        ? `maps://?saddr=${origin}&daddr=${dest}&dirflg=w`
        : `maps://?daddr=${dest}&dirflg=w`;
      window.location.href = url;
    } else {
      // Google Maps walking directions (works on Android + web + falls back to apple maps if no GM)
      const url = origin
        ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=walking`
        : `https://www.google.com/maps/search/?api=1&query=${dest}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Compute a "X km away" hint so the user can see if the directions are even
  // useful (vs being 4 timezones from the lounge).
  const distanceKm = (() => {
    if (!userLoc || !loungeLoc) return null;
    const R = 6371;
    const dLat = (loungeLoc.lat - userLoc.lat) * Math.PI / 180;
    const dLon = (loungeLoc.lng - userLoc.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(userLoc.lat * Math.PI / 180) * Math.cos(loungeLoc.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  })();

  // Build the iframe URL. The Embed API takes origin and destination as text
  // queries or lat,lng pairs.
  const embedUrl = (() => {
    if (!embedApiKey || !loungeLoc) return null;
    const dest = `${loungeLoc.lat},${loungeLoc.lng}`;
    if (userLoc) {
      const orig = `${userLoc.lat},${userLoc.lng}`;
      return `https://www.google.com/maps/embed/v1/directions?key=${encodeURIComponent(embedApiKey)}&origin=${orig}&destination=${dest}&mode=walking`;
    }
    // No user location yet — show the lounge as a pin instead of directions.
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(embedApiKey)}&q=${dest}&zoom=18`;
  })();

  const surface = dv?.paper || css.surface || "#fff";
  const border = dv?.cream || css.border || "#E2DCCE";
  const ink = dv?.ink || css.text || "#15130F";
  const muted = dv?.taupe || css.text3 || "#6B6458";

  const farAway = distanceKm !== null && distanceKm > 5;

  return (
    <div onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 2500,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center",
        padding: isMobile ? 0 : 24,
      }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 720,
          background: surface, color: ink,
          borderRadius: isMobile ? "16px 16px 0 0" : 18,
          border: `1px solid ${border}`,
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          maxHeight: isMobile ? "90vh" : "85vh",
          boxShadow: "0 30px 60px rgba(0,0,0,0.32)",
        }}>
        {/* Header */}
        <div style={{ padding: isMobile ? "16px 18px" : "20px 24px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: css.accent, marginBottom: 4 }}>
              Walking · {airport || lounge?.terminal || "Airport"}
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: isMobile ? 19 : 22, fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {lounge?.name || "Lounge"}
            </div>
            {distanceKm !== null && (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: muted, marginTop: 4 }}>
                {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`} away
                {farAway && <span style={{ color: css.accent, marginLeft: 6 }}>· not at this airport yet</span>}
              </div>
            )}
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ border: `1px solid ${border}`, background: "transparent", color: muted, padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em" }}>
            CLOSE
          </button>
        </div>

        {/* Map area */}
        <div style={{ position: "relative", flex: 1, minHeight: isMobile ? 360 : 460, background: dv?.bone || "#f4f1ec" }}>
          {(loadingLoc || loadingCoords) && (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: muted, fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 15 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: 999,
                  border: `2px solid ${border}`, borderTopColor: css.accent,
                  animation: "loungeDir-spin 0.7s linear infinite",
                }} />
                {loadingLoc ? "Reading your location…" : "Finding the lounge…"}
              </div>
            </div>
          )}
          {!loadingLoc && !loadingCoords && coordsError && (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 28, textAlign: "center" }}>
              <div>
                <div style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 16, color: muted, marginBottom: 12 }}>{coordsError}</div>
                <button onClick={onClose} style={{ padding: "10px 18px", border: `1px solid ${border}`, background: "transparent", color: ink, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", borderRadius: 100 }}>
                  Got it
                </button>
              </div>
            </div>
          )}
          {!loadingLoc && !loadingCoords && !coordsError && embedUrl && (
            <iframe
              title={`Walking to ${lounge?.name}`}
              src={embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allow="geolocation"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: isMobile ? "12px 14px calc(12px + env(safe-area-inset-bottom))" : "16px 24px", borderTop: `1px solid ${border}`, display: "flex", flexDirection: "column", gap: 10 }}>
          {locError && !farAway && (
            <div style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 13, color: muted }}>
              {locError} The map below shows the lounge location.
            </div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.06em", color: muted, lineHeight: 1.5, maxWidth: 320 }}>
              Indoor accuracy depends on the airport's map data. For turn-by-turn, open in your native Maps app.
            </div>
            <button onClick={openInNativeMaps} disabled={!loungeLoc}
              style={{
                padding: "11px 18px", border: "none",
                background: loungeLoc ? (css.text || "#15130F") : border,
                color: loungeLoc ? (dv?.bone || "#fff") : muted,
                borderRadius: 100, cursor: loungeLoc ? "pointer" : "default",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
                transition: "background 0.18s",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}>
              Open in Maps
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
          </div>
        </div>

        <style>{`@keyframes loungeDir-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
