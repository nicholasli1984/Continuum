import React from "react";
import { LOUNGE_DATABASE, AMENITY_ICONS, AMENITY_LABELS } from "../constants/lounges";
import { LOYALTY_PROGRAMS } from "../constants/programs";
export function renderLounges(s) {
  const { css, isMobile, darkMode, user, linkedAccounts,
    loungeAirport, setLoungeAirport, loungeSearchCode, setLoungeSearchCode,
    loungeDropdownOpen, setLoungeDropdownOpen, loungeExpandedId, setLoungeExpandedId,
    loungeFlightAirline, setLoungeFlightAirline, loungeFlightClass, setLoungeFlightClass,
    loungeAccessRoute, setLoungeAccessRoute, loungePhotos, loungeVisits, setLoungeVisits,
    getLoungeAccess, saveLoungeVisit, removeLoungeVisit, fetchLoungePhoto,
    AIRPORT_CITY, showConfirm } = s;
  const D = darkMode;
    const lounges = loungeAirport ? (LOUNGE_DATABASE[loungeAirport] || []) : [];
    const airportCodes = Object.keys(LOUNGE_DATABASE).sort();

    const handleSearch = () => {
      const code = loungeSearchCode.trim().toUpperCase();
      if (LOUNGE_DATABASE[code]) {
        setLoungeAirport(code);
        setLoungeExpandedId(null);
      }
    };

    const networkColor = (n) => {
      const map = { centurion: "#006FCF", capital_one: "#D03027", priority_pass: "#6B4E2E", delta_sky_club: "#003366", admirals_club: "#0078D2", flagship: "#0078D2", polaris: "#002244", united_club: "#002244", alaska_lounge: "#01426A", cathay_lounge: "#006564", singapore_lounge: "#003876", generic_airline: "#666", plaza_premium: "#8B6F47", turkish_lounge: "#C8102E", emirates_lounge: "#D71920", qantas_lounge: "#E0162B", chase_sapphire_lounge: "#1A1F36", greenwich_lounge: "#0078D2", soho_lounge: "#0078D2", chelsea_lounge: "#0078D2", lh_first: "#05164D", af_la_premiere: "#002157", ana_suite: "#13448F" };
      return map[n] || css.accent;
    };

    const renderStars = (rating) => {
      const full = Math.floor(rating);
      const half = rating - full >= 0.3;
      const stars = [];
      for (let i = 0; i < 5; i++) {
        if (i < full) stars.push(<svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={css.accent} stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>);
        else if (i === full && half) stars.push(<svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="none"><defs><clipPath id={`half${i}`}><rect x="0" y="0" width="12" height="24"/></clipPath></defs><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={css.accent} clipPath={`url(#half${i})`}/><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="none" stroke={css.border} strokeWidth="1.5"/></svg>);
        else stars.push(<svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={css.border} strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>);
      }
      return <span style={{ display: "inline-flex", alignItems: "center", gap: 1 }}>{stars}</span>;
    };

    // Build airline options from all airlines in LOYALTY_PROGRAMS
    const allAirlineOptions = LOYALTY_PROGRAMS.airlines.map(a => ({ id: a.id, name: a.name }));

    return (
      <div>
        {/* Header */}
        <div className="c-a1" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: css.text, margin: 0, letterSpacing: "-0.02em" }}>Lounges</h2>
          <p style={{ color: css.text3, fontSize: 13, margin: "6px 0 0" }}>Access based on your programs. {Object.keys(linkedAccounts).length} program{Object.keys(linkedAccounts).length !== 1 ? "s" : ""} linked.</p>
        </div>

        {/* Flight context — what are you flying? */}
        <div className="c-a2" style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: isMobile ? "16px" : "20px 24px", marginBottom: 24, boxShadow: css.shadow }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: css.text, marginBottom: 14 }}>What are you flying?</div>
          <div style={{ display: "flex", gap: isMobile ? 8 : 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: isMobile ? "1 1 100%" : "1 1 180px", minWidth: isMobile ? 0 : 160 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Airline</label>
              <select value={loungeFlightAirline} onChange={e => setLoungeFlightAirline(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: css.surface2, border: `1px solid ${css.border}`, borderRadius: 8, color: css.text, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                <option value="">Any airline</option>
                {allAirlineOptions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div style={{ flex: isMobile ? "1 1 48%" : "1 1 160px", minWidth: isMobile ? 0 : 140 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Class</label>
              <select value={loungeFlightClass} onChange={e => setLoungeFlightClass(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: css.surface2, border: `1px solid ${css.border}`, borderRadius: 8, color: css.text, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                <option value="economy">Economy</option>
                <option value="premium_economy">Premium Economy</option>
                <option value="business">Business</option>
                <option value="first">First</option>
              </select>
            </div>
            <div style={{ flex: isMobile ? "1 1 48%" : "1 1 160px", minWidth: isMobile ? 0 : 140 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Route</label>
              <select value={loungeAccessRoute} onChange={e => setLoungeAccessRoute(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: css.surface2, border: `1px solid ${css.border}`, borderRadius: 8, color: css.text, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                <option value="domestic">Domestic</option>
                <option value="international">International</option>
              </select>
            </div>
          </div>
        </div>

        <div>
            {/* Searchable airport dropdown */}
            <div style={{ position: "relative", marginBottom: 24, maxWidth: 420 }}>
              <input
                value={loungeSearchCode}
                onChange={e => { setLoungeSearchCode(e.target.value); setLoungeDropdownOpen(true); }}
                onFocus={() => setLoungeDropdownOpen(true)}
                placeholder="Search airport name or IATA code..."
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 10,
                  border: `1px solid ${loungeDropdownOpen ? css.accent : css.border}`,
                  background: css.surface, color: css.text, fontSize: 14,
                  fontFamily: "'Instrument Sans', 'Outfit', sans-serif",
                  outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
                }}
              />
              {loungeAirport && !loungeDropdownOpen && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: css.accent, fontFamily: "'Space Mono', monospace" }}>{loungeAirport}</span>
                  <span style={{ fontSize: 12, color: css.text2 }}>{AIRPORT_CITY[loungeAirport] || ""}</span>
                  <button onClick={() => { setLoungeAirport(null); setLoungeSearchCode(""); setLoungeExpandedId(null); }} style={{
                    background: "none", border: "none", cursor: "pointer", color: css.text3, fontSize: 11, padding: "2px 6px",
                  }}>Clear</button>
                </div>
              )}
              {loungeDropdownOpen && (() => {
                const query = loungeSearchCode.trim().toLowerCase();
                const filtered = airportCodes.filter(code => {
                  const city = (AIRPORT_CITY[code] || "").toLowerCase();
                  return code.toLowerCase().includes(query) || city.includes(query);
                }).sort((a, b) => {
                  const cityA = AIRPORT_CITY[a] || a;
                  const cityB = AIRPORT_CITY[b] || b;
                  return cityA.localeCompare(cityB);
                });
                if (filtered.length === 0) return null;
                return (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, zIndex: 200,
                    background: css.surface, border: `1px solid ${css.border}`, borderRadius: 10,
                    boxShadow: D ? "0 8px 24px rgba(0,0,0,0.6)" : "0 8px 24px rgba(0,0,0,0.12)",
                    maxHeight: 280, overflowY: "auto",
                  }}>
                    {filtered.map(code => {
                      const isActive = loungeAirport === code;
                      return (
                        <button key={code} onClick={() => {
                          setLoungeAirport(code);
                          setLoungeExpandedId(null);
                          setLoungeSearchCode(code + " - " + (AIRPORT_CITY[code] || code));
                          setLoungeDropdownOpen(false);
                        }} style={{
                          display: "flex", alignItems: "center", gap: 10, width: "100%",
                          padding: "10px 14px", border: "none", cursor: "pointer", textAlign: "left",
                          background: isActive ? css.accentBg : "transparent",
                          color: isActive ? css.accent : css.text,
                          fontSize: 13, fontFamily: "'Instrument Sans', 'Outfit', sans-serif",
                          borderBottom: `1px solid ${css.border}`, transition: "background 0.1s",
                        }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = css.surface2; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                        >
                          <span style={{ fontWeight: 700, fontFamily: "'Space Mono', monospace", fontSize: 12, minWidth: 36 }}>{code}</span>
                          <span style={{ color: isActive ? css.accent : css.text2 }}>{AIRPORT_CITY[code] || code}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
              {loungeDropdownOpen && (
                <div onClick={() => setLoungeDropdownOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
              )}
            </div>

            {/* Lounge list — accessible first, then others */}
            {loungeAirport && (() => {
              // Force recalculation when flight context changes (referenced for reactivity)
              void loungeFlightAirline; void loungeFlightClass;
              // Sort: accessible lounges first (by rating desc), then inaccessible
              const loungesWithAccess = lounges.map(l => ({ ...l, _access: getLoungeAccess(l.network, l) }));
              const accessible = loungesWithAccess.filter(l => l._access.length > 0).sort((a, b) => b.rating - a.rating);
              return (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: css.text2, marginBottom: 16 }}>
                  {accessible.length > 0 ? `${accessible.length} lounge${accessible.length !== 1 ? "s" : ""} you can access at ${loungeAirport}` : `No accessible lounges at ${loungeAirport}`}
                </div>
                {accessible.length === 0 && (
                  <div style={{ padding: "40px 20px", textAlign: "center", borderRadius: 14, background: css.surface, border: `1px solid ${css.border}` }}>
                    <p style={{ fontSize: 13, color: css.text3, margin: 0 }}>You don't have access to any lounges at this airport with your current programs and flight</p>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {accessible.map(lounge => {
                    const expanded = loungeExpandedId === lounge.id;
                    const accessRules = lounge._access;
                    const hasAccess = accessRules.length > 0;
                    const nColor = networkColor(lounge.network);

                    // Trigger photo fetch on expand
                    // Photo fetch moved to useEffect below

                    return (
                      <div key={lounge.id} style={{
                        background: css.surface, border: `1px solid ${expanded ? css.accentBorder : css.border}`,
                        borderRadius: 12, overflow: "hidden", transition: "all 0.2s",
                      }}>
                        {/* Collapsed header */}
                        <div onClick={() => setLoungeExpandedId(expanded ? null : lounge.id)} style={{
                          padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                        }}>
                          {/* Network color bar */}
                          <div style={{ width: 4, height: 40, borderRadius: 2, background: nColor, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 15, fontWeight: 600, color: css.text }}>{lounge.name}</span>
                              {hasAccess && (
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: css.successBg, color: css.success, border: `1px solid ${css.success}30`, letterSpacing: "0.03em" }}>ACCESS</span>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 12, color: css.text3 }}>
                              <span>Terminal {lounge.terminal}</span>
                              <span style={{ color: nColor, fontWeight: 600 }}>{networkLabel(lounge.network)}</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              {renderStars(lounge.rating)}
                              <span style={{ fontSize: 12, fontWeight: 600, color: css.text2, marginLeft: 4 }}>{lounge.rating}</span>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={css.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                        </div>

                        {/* Expanded content */}
                        {expanded && (
                          <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${css.border}` }}>
                            {/* Photo */}
                            {loungePhotos[lounge.id] && (
                              <div style={{ margin: "14px 0", borderRadius: 8, overflow: "hidden", height: 180 }}>
                                <img src={loungePhotos[lounge.id]} alt={lounge.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            )}

                            {/* Details grid */}
                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginTop: 14 }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Details</div>
                                <div style={{ fontSize: 13, color: css.text2, lineHeight: 1.8 }}>
                                  <div><span style={{ color: css.text3 }}>Location:</span> {lounge.location}</div>
                                  <div><span style={{ color: css.text3 }}>Hours:</span> {lounge.hours}</div>
                                  <div><span style={{ color: css.text3 }}>Network:</span> <span style={{ color: nColor, fontWeight: 600 }}>{networkLabel(lounge.network)}</span></div>
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Amenities</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  {lounge.amenities.map(a => (
                                    <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: css.surface2, fontSize: 11, color: css.text2 }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d={AMENITY_ICONS[a] || "M12 12m-9 0a9 9 0 1018 0 9 9 0 10-18 0"} />
                                      </svg>
                                      {AMENITY_LABELS[a] || a}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Access rules */}
                            {accessRules.length > 0 && (
                              <div style={{ marginTop: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Your Access</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  {accessRules.map((rule, ri) => (
                                    <div key={ri} style={{ padding: "8px 12px", borderRadius: 8, background: css.successBg, border: `1px solid ${css.success}20`, display: "flex", alignItems: "center", gap: 10 }}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={css.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                      </svg>
                                      <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: css.success }}>
                                          {rule.source === "card" ? rule.cardName : `${rule.airlineName} ${rule.tier}`}
                                        </span>
                                        <span style={{ fontSize: 11, color: css.text3, marginLeft: 8 }}>{rule.guestNote}</span>
                                        {rule.condition && <span style={{ fontSize: 10, color: css.warning, marginLeft: 6 }}>(Conditional)</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Log visit button */}
                            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                              <button onClick={(e) => { e.stopPropagation(); saveLoungeVisit({ loungeId: lounge.id, loungeName: lounge.name, airport: loungeAirport, date: new Date().toISOString().split("T")[0], network: lounge.network }); }} style={{
                                padding: "8px 16px", borderRadius: 8, border: `1px solid ${css.accentBorder}`,
                                background: css.accentBg, color: css.accent, fontSize: 12, fontWeight: 600,
                                cursor: "pointer",
                              }}>Log Visit</button>
                              {lounge.placeQuery && (
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lounge.placeQuery)}`} target="_blank" rel="noopener noreferrer" style={{
                                  padding: "8px 16px", borderRadius: 8, border: `1px solid ${css.border}`,
                                  background: css.surface, color: css.text2, fontSize: 12, fontWeight: 600,
                                  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
                                }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                  Google Maps
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              );
            })()}

            {/* Empty state */}
            {!loungeAirport && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: css.text3 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={css.text3} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: 16 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Search for an airport</div>
                <div style={{ fontSize: 13 }}>Search for an airport by name or IATA code above to browse lounges</div>
              </div>
            )}
          </div>
      </div>
    );
  };

  // ============================================================
