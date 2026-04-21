import React, { useState } from "react";
import { LOYALTY_PROGRAMS, PROGRAM_DIRECTORY } from "../constants/programs";
import { CC_SPENDING_CATS, CC_TRANSFER_PARTNERS, CC_BONUS_EXPANDED, ELITE_BONUS_PCT, PARTNER_CLASS_RATES, PARTNER_EARN_RATES } from "../constants/airline-data";
import { ALLIANCE_MBR, ALLIANCE_TIER_COLORS, ALLIANCE_TIER_LABELS } from "../constants/benefits";

export function renderOptimizer(s, _previewTab = null) {
  // Destructure the state bag
  const { css, isMobile, user, trips, linkedAccounts, allPrograms, 
    calcSegmentCredits, calcTripEarnings, getBookingClassCabin, greatCircleMiles, segProgName,
    itinSegments, setItinSegments, itinCreditAirline, setItinCreditAirline, itinCurrentTier, setItinCurrentTier,
    itinFare, setItinFare, itinHistory, setItinHistory, showItinHistory, setShowItinHistory,
    optimizerTab, setOptimizerTab, optimizerTripId, setOptimizerTripId,
    ccOptTarget, setCcOptTarget, ccOptAmount, setCcOptAmount, ccBookingMode, setCcBookingMode,
    allianceGoal, setAllianceGoal, setActiveView, AIRPORT_COORDS, AIRPORT_CITY,
    formatTripDates, ProgramLogo, EXPENSE_CATEGORIES } = s;
    const _tab = _previewTab || optimizerTab;
    const flightTrips = trips.filter(t => t.type === "flight");
    const airlines = LOYALTY_PROGRAMS.airlines;

    // Helper: estimate points a trip would earn if credited to a given airline
    const estimatePts = (trip, airline) => {
      const rate = airline.earnRate || {};
      const cls = trip.class || "domestic";
      const perMile = rate[cls] || rate.domestic || 5;
      // Use estimatedPoints as base proxy for "miles flown × base rate" of original airline
      const origAirline = airlines.find(a => a.id === trip.program);
      const origRate = origAirline?.earnRate?.[cls] || origAirline?.earnRate?.domestic || 5;
      const baseMiles = origRate > 0 ? (trip.estimatedPoints || 0) / origRate : 0;
      return Math.round(baseMiles * perMile);
    };

    // Helper: given a program and total points, find current tier, next tier, % to next
    const tierProgress = (airline, totalPts) => {
      let currentTier = null, nextTier = null;
      for (const tier of airline.tiers) {
        if (totalPts >= tier.threshold) currentTier = tier;
      }
      nextTier = airline.tiers.find(t => t.threshold > totalPts) || null;
      const topTier = airline.tiers[airline.tiers.length - 1];
      const pctToNext = nextTier ? Math.min(100, Math.round((totalPts / nextTier.threshold) * 100)) : 100;
      return { currentTier, nextTier, topTier, pctToNext, totalPts };
    };

    // ── SECTION 1: Global optimizer — credit ALL trips to one program ──
    const globalResults = airlines.map(airline => {
      const account = linkedAccounts[airline.id];
      const existingPts = account?.currentPoints || account?.tierCredits || 0;
      const totalFromTrips = flightTrips.reduce((sum, t) => sum + estimatePts(t, airline), 0);
      const total = existingPts + totalFromTrips;
      const prog = tierProgress(airline, total);
      return { airline, existingPts, totalFromTrips, total, ...prog };
    }).sort((a, b) => {
      // Sort by: reached highest tier first, then by % to next tier
      const aTierIdx = a.airline.tiers.indexOf(a.currentTier);
      const bTierIdx = b.airline.tiers.indexOf(b.currentTier);
      if (aTierIdx !== bTierIdx) return bTierIdx - aTierIdx;
      return b.pctToNext - a.pctToNext;
    });
    const bestGlobal = globalResults[0];

    // ── SECTION 2: Trip-by-trip comparison ──
    const selectedTrip = flightTrips.find(t => t.id === optimizerTripId) || flightTrips[0];
    const tripResults = selectedTrip ? airlines.map(airline => {
      const account = linkedAccounts[airline.id];
      const existingPts = account?.currentPoints || account?.tierCredits || 0;
      const ptsFromTrip = estimatePts(selectedTrip, airline);
      const beforeProg = tierProgress(airline, existingPts);
      const afterProg = tierProgress(airline, existingPts + ptsFromTrip);
      return { airline, ptsFromTrip, existingPts, before: beforeProg, after: afterProg };
    }).filter(r => r.ptsFromTrip > 0).sort((a, b) => {
      // Sort by biggest % jump
      const aJump = a.after.pctToNext - a.before.pctToNext;
      const bJump = b.after.pctToNext - b.before.pctToNext;
      return bJump - aJump;
    }) : [];

    // ── SECTION 3: Alliance goal optimizer ──
    // Map alliance tier keys to the airline programs that can reach them
    const GOAL_OPTIONS = [
      { key: "sa_silver", label: "Star Alliance Silver" },
      { key: "sa_gold", label: "Star Alliance Gold" },
      { key: "ow_ruby", label: "Oneworld Ruby" },
      { key: "ow_sapphire", label: "Oneworld Sapphire" },
      { key: "ow_emerald", label: "Oneworld Emerald" },
      { key: "st_elite", label: "SkyTeam Elite" },
      { key: "st_elite_plus", label: "SkyTeam Elite Plus" },
    ];
    const goalResults = (() => {
      const goal = allianceGoal;
      // Find all airline programs that map to this alliance tier
      const candidates = Object.entries(ALLIANCE_MBR).map(([progId, meta]) => {
        const airline = airlines.find(a => a.id === progId);
        if (!airline) return null;
        // Find the tier name in this program that maps to the goal alliance tier
        const tierName = Object.entries(meta.tierMap).find(([, v]) => v === goal)?.[0];
        if (!tierName) return null;
        const tier = airline.tiers.find(t => t.name === tierName);
        if (!tier) return null;
        const account = linkedAccounts[progId];
        const existingPts = account?.currentPoints || account?.tierCredits || 0;
        const totalFromTrips = flightTrips.reduce((sum, t) => sum + estimatePts(t, airline), 0);
        const total = existingPts + totalFromTrips;
        const remaining = Math.max(0, tier.threshold - total);
        const pct = Math.min(100, Math.round((total / tier.threshold) * 100));
        const reached = total >= tier.threshold;
        return { airline, tierName, threshold: tier.threshold, existingPts, totalFromTrips, total, remaining, pct, reached, color: meta.color };
      }).filter(Boolean);
      return candidates.sort((a, b) => a.remaining - b.remaining);
    })();

    const OPT_TAB_LABELS = { itinerary: "Elite Status Calculator", global: "Global Status Optimizer", trip: "Trip-by-Trip Comparison", alliance: "Alliance Goal Optimizer", cards: "Credit Card Optimizer" };

    const BarFill = ({ pct, color }) => (
      <div style={{ width: "100%", height: 6, borderRadius: 3, background: css.surface2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.6s ease" }} />
      </div>
    );

    // ── Itinerary Calculator helpers ──
    const updateItinSeg = (id, field, value) => {
      setItinSegments(segs => segs.map(s => s.id === id ? { ...s, [field]: value } : s));
    };
    const addItinSeg = () => {
      const last = itinSegments[itinSegments.length - 1];
      setItinSegments(segs => [...segs, { id: crypto.randomUUID(), origin: last?.destination || "", destination: "", operatingAirline: last?.operatingAirline || "", marketingAirline: last?.marketingAirline || "", bookingClass: "", distance: "" }]);
    };
    const removeItinSeg = (id) => {
      if (itinSegments.length <= 1) return;
      setItinSegments(segs => segs.filter(s => s.id !== id));
    };

    // Calculate results for all airlines
    const calcItinResults = () => {
      // Eligible fare for LP/status earning = base fare + airline surcharges (YQ/YR) only.
      // Government taxes and other fees do NOT count toward revenue-based earning.
      const eligibleFare = (parseFloat(itinFare.baseFare) || 0) + (parseFloat(itinFare.airlineFees) || 0);
      const totalFare = eligibleFare; // used for earning calculation
      const segments = itinSegments.map(seg => {
        const dist = parseInt(seg.distance) || greatCircleMiles(seg.origin.toUpperCase().trim(), seg.destination.toUpperCase().trim());
        const opAirline = seg.operatingAirline;
        const cabin = getBookingClassCabin(opAirline, seg.bookingClass) || "economy";
        return { ...seg, distanceMiles: dist, cabin };
      });
      const totalDistance = segments.reduce((s, seg) => s + seg.distanceMiles, 0);
      const perSegFare = segments.length > 0 ? totalFare / segments.length : 0;

      // Calculate for each airline program, applying elite bonus if it's the selected crediting airline
      const results = airlines.filter(a => a.tiers && a.tiers.length > 0).map(airline => {
        // Look up elite bonus: only apply if this is the selected credit airline AND user has a current tier set
        const bonusMap = ELITE_BONUS_PCT[airline.id] || {};
        const eliteBonus = (airline.id === itinCreditAirline && itinCurrentTier) ? (bonusMap[itinCurrentTier] || 0) : 0;
        let totalCredits = 0;
        const segDetails = segments.map(seg => {
          const credits = calcSegmentCredits(airline.id, seg.operatingAirline, seg.cabin, seg.distanceMiles, perSegFare, eliteBonus, seg.bookingClass || "");
          totalCredits += credits;
          return { ...seg, credits };
        });
        const account = linkedAccounts[airline.id];
        const existingPts = account?.currentPoints || account?.tierCredits || 0;
        const projTotal = existingPts + totalCredits;
        const prog = tierProgress(airline, projTotal);
        return { airline, totalCredits, segDetails, existingPts, projTotal, totalDistance, totalFare, eliteBonus, ...prog };
      }).filter(r => r.totalCredits > 0).sort((a, b) => {
        const aIdx = a.airline.tiers.indexOf(a.currentTier);
        const bIdx = b.airline.tiers.indexOf(b.currentTier);
        if (aIdx !== bIdx) return bIdx - aIdx;
        return b.pctToNext - a.pctToNext;
      });
      return results;
    };

    const itinCalcResults = (_tab === "itinerary" && itinSegments.some(s => s.origin && s.destination)) ? calcItinResults() : [];

    // Tier journey bar component
    const TierJourneyBar = ({ airline, totalPts, color }) => {
      if (!airline.tiers || airline.tiers.length === 0) return null;
      const maxThreshold = airline.tiers[airline.tiers.length - 1].threshold;
      return (
        <div style={{ position: "relative", marginTop: 8 }}>
          <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", background: css.surface2, border: `1px solid ${css.border}` }}>
            {airline.tiers.map((tier, i) => {
              const prevThreshold = i > 0 ? airline.tiers[i - 1].threshold : 0;
              const width = ((tier.threshold - prevThreshold) / maxThreshold) * 100;
              const filled = Math.min(100, Math.max(0, ((totalPts - prevThreshold) / (tier.threshold - prevThreshold)) * 100));
              return (
                <div key={tier.name} style={{ width: `${width}%`, position: "relative", borderRight: i < airline.tiers.length - 1 ? `1px solid ${css.border}` : "none" }}>
                  <div style={{ width: `${filled}%`, height: "100%", background: color, transition: "width 0.8s ease" }} />
                </div>
              );
            })}
          </div>
          {/* Tier labels below */}
          <div style={{ display: "flex", position: "relative", marginTop: 4 }}>
            {airline.tiers.map((tier, i) => {
              const pos = (tier.threshold / maxThreshold) * 100;
              const reached = totalPts >= tier.threshold;
              return (
                <div key={tier.name} style={{ position: "absolute", left: `${pos}%`, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
                  <div style={{ fontSize: 8, fontWeight: reached ? 700 : 500, color: reached ? color : css.text3, fontFamily: "'Geist Mono', monospace" }}>
                    {tier.name}
                  </div>
                  <div style={{ fontSize: 7, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>
                    {tier.threshold >= 1000 ? `${Math.round(tier.threshold / 1000)}K` : tier.threshold}
                  </div>
                </div>
              );
            })}
            {/* Current position marker */}
            {totalPts > 0 && (
              <div style={{ position: "absolute", left: `${Math.min(100, (totalPts / maxThreshold) * 100)}%`, top: -14, transform: "translateX(-50%)" }}>
                <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `5px solid ${color}` }} />
              </div>
            )}
          </div>
        </div>
      );
    };

    const fieldStyle = { display: "block", width: "100%", padding: "8px 10px", background: css.surface2, border: `1px solid ${css.border}`, borderRadius: 7, color: css.text, fontSize: 12, fontFamily: "'Instrument Sans', 'Outfit', sans-serif", outline: "none", boxSizing: "border-box" };
    const labelStyle = { fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, display: "block" };

    return (
      <div>
        {/* Header */}
        <div className="c-a1" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>Strategy Engine</div>
          <h2 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: isMobile ? 28 : 36, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>{OPT_TAB_LABELS[_tab] || "Trip Optimizer"}</h2>
          <p style={{ color: css.text2, fontSize: 13, margin: "8px 0 0" }}>
            {_tab === "itinerary" ? "Enter your itinerary to see exactly where each flight puts you on every airline's elite status ladder" : `Credit flights strategically to accelerate elite status across ${airlines.length} airline programs`}
          </p>
        </div>

        {/* ── Itinerary Calculator Tab ── */}
        {_tab === "itinerary" && (
          <div>
            {/* Segment builder */}
            <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: isMobile ? "16px" : "24px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: css.text, marginBottom: 16 }}>Flight Segments</div>
              {itinSegments.map((seg, idx) => (
                <div key={seg.id} style={{ marginBottom: 16, padding: 16, background: css.surface2, border: `1px solid ${css.border}`, borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: css.accent }}>Segment {idx + 1}</div>
                    {itinSegments.length > 1 && (
                      <button onClick={() => removeItinSeg(seg.id)} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid rgba(239,68,68,0.2)`, background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    )}
                  </div>
                  {/* Route */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={labelStyle}>Origin (IATA)</label>
                      <input value={seg.origin} onChange={e => updateItinSeg(seg.id, "origin", e.target.value.toUpperCase().slice(0, 3))} placeholder="YYZ" maxLength={3} style={{ ...fieldStyle, textTransform: "uppercase", fontFamily: "'Geist Mono', monospace" }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Destination</label>
                      <input value={seg.destination} onChange={e => updateItinSeg(seg.id, "destination", e.target.value.toUpperCase().slice(0, 3))} placeholder="HKG" maxLength={3} style={{ ...fieldStyle, textTransform: "uppercase", fontFamily: "'Geist Mono', monospace" }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Distance (mi)</label>
                      <input type="number" value={seg.distance || ""} onChange={e => updateItinSeg(seg.id, "distance", e.target.value)}
                        placeholder={greatCircleMiles(seg.origin.toUpperCase().trim(), seg.destination.toUpperCase().trim()) || "auto"}
                        style={{ ...fieldStyle, fontFamily: "'Geist Mono', monospace" }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Booking Class</label>
                      <input value={seg.bookingClass} onChange={e => updateItinSeg(seg.id, "bookingClass", e.target.value.toUpperCase().slice(0, 1))} placeholder="J" maxLength={1} style={{ ...fieldStyle, textTransform: "uppercase", fontFamily: "'Geist Mono', monospace", textAlign: "center" }} />
                    </div>
                  </div>
                  {/* Airlines */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Operating Airline</label>
                      <select value={seg.operatingAirline} onChange={e => updateItinSeg(seg.id, "operatingAirline", e.target.value)} style={fieldStyle}>
                        <option value="">— Select —</option>
                        {airlines.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Marketing / Ticketing Airline</label>
                      <select value={seg.marketingAirline} onChange={e => updateItinSeg(seg.id, "marketingAirline", e.target.value)} style={fieldStyle}>
                        <option value="">— Same as operating —</option>
                        {airlines.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Auto distance + cabin display */}
                  {seg.origin && seg.destination && (
                    <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {(() => {
                        const dist = parseInt(seg.distance) || greatCircleMiles(seg.origin.toUpperCase().trim(), seg.destination.toUpperCase().trim());
                        const cabin = seg.bookingClass ? (getBookingClassCabin(seg.operatingAirline, seg.bookingClass) || "economy") : null;
                        return (<>
                          {dist > 0 && <span style={{ fontSize: 10, color: css.text3, fontFamily: "'Geist Mono', monospace", background: css.surface, padding: "3px 8px", borderRadius: 4 }}>📏 {dist.toLocaleString()} mi</span>}
                          {cabin && <span style={{ fontSize: 10, color: css.accent, fontFamily: "'Geist Mono', monospace", background: css.accentBg, padding: "3px 8px", borderRadius: 4 }}>{cabin.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>}
                        </>);
                      })()}
                    </div>
                  )}
                </div>
              ))}
              <button onClick={addItinSeg} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${css.accentBorder}`, background: css.accentBg, color: css.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Segment</button>
            </div>

            {/* Fare breakdown */}
            <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: isMobile ? "16px" : "24px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: css.text, marginBottom: 16 }}>Fare Breakdown</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Base Fare ✓</label>
                  <input type="number" value={itinFare.baseFare} onChange={e => setItinFare(f => ({ ...f, baseFare: e.target.value }))} placeholder="0.00" style={{ ...fieldStyle, fontFamily: "'Geist Mono', monospace", borderColor: itinFare.baseFare ? "rgba(14,165,160,0.3)" : undefined }} />
                </div>
                <div>
                  <label style={labelStyle}>Gov. Taxes</label>
                  <input type="number" value={itinFare.taxes} onChange={e => setItinFare(f => ({ ...f, taxes: e.target.value }))} placeholder="0.00" style={{ ...fieldStyle, fontFamily: "'Geist Mono', monospace", opacity: 0.7 }} />
                </div>
                <div>
                  <label style={labelStyle}>Carrier Surcharges (YQ/YR) ✓</label>
                  <input type="number" value={itinFare.airlineFees} onChange={e => setItinFare(f => ({ ...f, airlineFees: e.target.value }))} placeholder="0.00" style={{ ...fieldStyle, fontFamily: "'Geist Mono', monospace", borderColor: itinFare.airlineFees ? "rgba(14,165,160,0.3)" : undefined }} />
                </div>
                <div>
                  <label style={labelStyle}>Other Fees</label>
                  <input type="number" value={itinFare.otherFees} onChange={e => setItinFare(f => ({ ...f, otherFees: e.target.value }))} placeholder="0.00" style={{ ...fieldStyle, fontFamily: "'Geist Mono', monospace", opacity: 0.7 }} />
                </div>
              </div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>
                  Total: ${((parseFloat(itinFare.baseFare) || 0) + (parseFloat(itinFare.taxes) || 0) + (parseFloat(itinFare.airlineFees) || 0) + (parseFloat(itinFare.otherFees) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} {itinFare.currency}
                </div>
                <div style={{ fontSize: 10, color: css.accent, fontFamily: "'Geist Mono', monospace" }}>
                  Eligible for earning: ${((parseFloat(itinFare.baseFare) || 0) + (parseFloat(itinFare.airlineFees) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} (base + airline fees)
                </div>
              </div>
            </div>

            {/* Itinerary summary */}
            {itinSegments.some(s => s.origin && s.destination) && (
              <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "12px 20px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>ROUTE:</span>
                  {itinSegments.filter(s => s.origin && s.destination).map((s, i) => (
                    <span key={s.id} style={{ fontSize: 12, fontWeight: 600, color: css.text, fontFamily: "'Geist Mono', monospace" }}>
                      {i > 0 && <span style={{ color: css.text3, margin: "0 4px" }}>→</span>}
                      {s.origin} → {s.destination}
                    </span>
                  ))}
                  <span style={{ fontSize: 10, color: css.text3, fontFamily: "'Geist Mono', monospace", marginLeft: 8 }}>
                    {itinSegments.reduce((s, seg) => s + (parseInt(seg.distance) || greatCircleMiles(seg.origin.toUpperCase().trim(), seg.destination.toUpperCase().trim())), 0).toLocaleString()} total miles
                  </span>
                </div>
              </div>
            )}

            {/* Credit to which program? */}
            <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: isMobile ? "16px" : "24px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: css.text, marginBottom: 16 }}>Credit To Program</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Elite Status Program</label>
                  <select value={itinCreditAirline} onChange={e => setItinCreditAirline(e.target.value)} style={fieldStyle}>
                    <option value="">— Select Program —</option>
                    {airlines.filter(a => a.tiers && a.tiers.length > 0).map(a => <option key={a.id} value={a.id}>{a.name} ({a.unit})</option>)}
                  </select>
                </div>
                {itinCreditAirline && (() => {
                  const prog = airlines.find(a => a.id === itinCreditAirline);
                  if (!prog) return null;
                  const bonusMap = ELITE_BONUS_PCT[itinCreditAirline] || {};
                  const bonusPct = bonusMap[itinCurrentTier] || 0;
                  return (
                    <div>
                      <label style={labelStyle}>Current Elite Tier (prior year status — determines earning bonus)</label>
                      <select value={itinCurrentTier} onChange={e => setItinCurrentTier(e.target.value)} style={fieldStyle}>
                        <option value="">Base Member (no bonus)</option>
                        {prog.tiers.map(t => {
                          const b = bonusMap[t.name];
                          return <option key={t.name} value={t.name}>{t.name}{b ? ` (+${b}% bonus)` : ""}</option>;
                        })}
                      </select>
                      {bonusPct > 0 && (
                        <div style={{ fontSize: 10, color: css.accent, marginTop: 4, fontWeight: 600, fontFamily: "'Geist Mono', monospace" }}>
                          {itinCurrentTier}: +{bonusPct}% earning bonus applied to all segments
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              {itinCreditAirline && (() => {
                const prog = airlines.find(a => a.id === itinCreditAirline);
                if (!prog) return null;
                const account = linkedAccounts[itinCreditAirline];
                const existingPts = account?.currentPoints || account?.tierCredits || 0;
                return (
                  <div style={{ marginTop: 12, padding: "12px 16px", background: css.surface2, borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: css.text3 }}>Current year {prog.unit} (from Programs tab)</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>{existingPts.toLocaleString()}</span>
                    </div>
                    {existingPts === 0 && (
                      <div style={{ fontSize: 10, color: css.text3, marginTop: 6, lineHeight: 1.4 }}>
                        Enter your current year's {prog.unit} balance in the <button onClick={() => { setActiveView("programs"); }} style={{ background: "none", border: "none", color: css.accent, cursor: "pointer", fontSize: 10, fontWeight: 600, padding: 0, fontFamily: "inherit" }}>Programs tab →</button> and it will be reflected here.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Results: Single selected program detail */}
            {(() => {
              const r = itinCreditAirline ? itinCalcResults.find(r => r.airline.id === itinCreditAirline) : null;
              if (!r) {
                if (itinCreditAirline && itinSegments.some(s => s.origin && s.destination)) {
                  return (
                    <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "28px 24px", textAlign: "center" }}>
                      <div style={{ fontSize: 13, color: css.text2 }}>Add an operating airline and booking class to each segment to see earning projections.</div>
                    </div>
                  );
                }
                if (!itinCreditAirline && itinSegments.some(s => s.origin && s.destination)) {
                  return (
                    <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "28px 24px", textAlign: "center" }}>
                      <div style={{ fontSize: 13, color: css.text2 }}>Select a crediting program above to see your elite status earning projection.</div>
                    </div>
                  );
                }
                return null;
              }
              return (
                <div style={{ background: css.surface, border: `1px solid ${r.airline.color}40`, borderLeft: `4px solid ${r.airline.color}`, borderRadius: 14, padding: isMobile ? "16px" : "24px" }}>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <ProgramLogo prog={r.airline} size={28} />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: css.text }}>{r.airline.name}</div>
                        <div style={{ fontSize: 11, color: css.text3 }}>
                          {r.airline.unit}
                          {r.eliteBonus > 0 && <span style={{ color: css.accent, fontWeight: 600 }}> (+{r.eliteBonus}% elite bonus)</span>}
                          {" · "}
                          {(() => {
                            const rates = PARTNER_EARN_RATES[r.airline.id];
                            const isOwn = r.airline.id === (r.segDetails[0]?.operatingAirline || "");
                            const pEntry = rates?.[r.segDetails[0]?.operatingAirline] || {};
                            if (isOwn && (rates?._type === "fare_own" || rates?._type === "revenue")) return "Revenue-based (per $ spent)";
                            if (pEntry._fare) return "Revenue-based (per $ spent)";
                            if (rates?._type === "segment" || rates?._type === "fare_own") return "Distance-based (approx)";
                            return "Distance-based (% of miles flown)";
                          })()}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: r.airline.color, fontFamily: "'Geist Mono', monospace" }}>+{r.totalCredits.toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: css.text3 }}>{r.airline.unit} from this itinerary</div>
                    </div>
                  </div>

                  {/* Tier journey bar — large */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Elite Status Journey</div>
                    <TierJourneyBar airline={r.airline} totalPts={r.projTotal} color={r.airline.color} />
                  </div>

                  {/* Summary stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 24, marginBottom: 16 }}>
                    <div style={{ background: css.surface2, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>{r.existingPts.toLocaleString()}</div>
                      <div style={{ fontSize: 9, color: css.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Existing</div>
                    </div>
                    <div style={{ background: `${r.airline.color}12`, border: `1px solid ${r.airline.color}25`, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: r.airline.color, fontFamily: "'Geist Mono', monospace" }}>+{r.totalCredits.toLocaleString()}</div>
                      <div style={{ fontSize: 9, color: css.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>This Trip</div>
                    </div>
                    <div style={{ background: css.surface2, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>{r.projTotal.toLocaleString()}</div>
                      <div style={{ fontSize: 9, color: css.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Projected</div>
                    </div>
                  </div>

                  {/* Current / Next tier */}
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Projected Tier</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: r.currentTier ? r.airline.color : css.text3 }}>{r.currentTier?.name || "Base Member"}</div>
                      {r.currentTier?.perks && <div style={{ fontSize: 10, color: css.text2, marginTop: 2, lineHeight: 1.4 }}>{r.currentTier.perks}</div>}
                    </div>
                    {r.nextTier && (
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Next Tier</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: css.text2 }}>{r.nextTier.name}</div>
                        <div style={{ fontSize: 11, color: css.accent, fontWeight: 600, fontFamily: "'Geist Mono', monospace", marginTop: 2 }}>{(r.nextTier.threshold - r.projTotal).toLocaleString()} {r.airline.unit} remaining ({r.pctToNext}%)</div>
                      </div>
                    )}
                    {!r.nextTier && r.currentTier && (
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: css.success, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Top Tier Reached</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: css.success }}>Maximum Status</div>
                      </div>
                    )}
                  </div>

                  {/* Per-segment breakdown */}
                  <div style={{ borderTop: `1px solid ${css.border}`, paddingTop: 12 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Segment Breakdown</div>
                    {r.segDetails.map((sd, si) => {
                      const rates = PARTNER_EARN_RATES[r.airline.id];
                      const segIsOwn = r.airline.id === sd.operatingAirline;
                      const partnerEntry = rates?.[sd.operatingAirline] || rates?._default || {};
                      const useFare = (segIsOwn && (rates?._type === "fare_own" || rates?._type === "revenue")) || partnerEntry._fare;
                      // Resolve actual rate used (per-class if available, else cabin fallback)
                      const bc = (sd.bookingClass || "").toUpperCase();
                      let segRate = 0;
                      let rateLabel = "";
                      if (!segIsOwn && bc && PARTNER_CLASS_RATES[r.airline.id]?.[sd.operatingAirline]?.[bc] !== undefined) {
                        segRate = PARTNER_CLASS_RATES[r.airline.id][sd.operatingAirline][bc];
                        rateLabel = `class ${bc}: ${segRate}%`;
                      } else {
                        const segRates = rates?.[segIsOwn ? "_own" : sd.operatingAirline] || rates?._default || {};
                        segRate = segRates[sd.cabin] || 0;
                        rateLabel = useFare ? `${segRate}/$` : `${segRate}%`;
                      }
                      return (
                        <div key={si} style={{ padding: "6px 0", borderBottom: si < r.segDetails.length - 1 ? `1px solid ${css.border}` : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>{sd.origin} → {sd.destination}</span>
                              <span style={{ fontSize: 9, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>{sd.distanceMiles.toLocaleString()} mi</span>
                              <span style={{ fontSize: 9, color: css.accent, background: css.accentBg, padding: "1px 6px", borderRadius: 4 }}>{sd.cabin.replace(/_/g, " ")}{bc ? ` (${bc})` : ""}</span>
                            </div>
                            <span style={{ fontWeight: 700, color: r.airline.color, fontFamily: "'Geist Mono', monospace" }}>+{sd.credits.toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: 9, color: css.text3, fontFamily: "'Geist Mono', monospace", marginTop: 2 }}>
                            {useFare
                              ? `$${(r.totalFare / r.segDetails.length).toLocaleString(undefined, {minimumFractionDigits: 0})} × ${rateLabel} = ${Math.round((r.totalFare / r.segDetails.length) * segRate).toLocaleString()}`
                              : `${sd.distanceMiles.toLocaleString()} mi × ${rateLabel} = ${Math.round(sd.distanceMiles * segRate / 100).toLocaleString()}`}
                            {r.eliteBonus > 0 && ` × ${(1 + r.eliteBonus / 100).toFixed(1)} (${r.eliteBonus}% bonus)`}
                            {` = ${sd.credits.toLocaleString()}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Save to History button */}
            {itinSegments.some(s => s.origin && s.destination) && (
              <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => {
                  const route = itinSegments.filter(s => s.origin && s.destination).map(s => `${s.origin}→${s.destination}`).join(", ");
                  const totalFare = (parseFloat(itinFare.baseFare) || 0) + (parseFloat(itinFare.taxes) || 0) + (parseFloat(itinFare.airlineFees) || 0) + (parseFloat(itinFare.otherFees) || 0);
                  const creditProg = airlines.find(a => a.id === itinCreditAirline);
                  const r = itinCalcResults.find(r => r.airline.id === itinCreditAirline);
                  const entry = {
                    id: crypto.randomUUID(),
                    savedAt: new Date().toISOString(),
                    route,
                    segments: itinSegments.filter(s => s.origin && s.destination).map(s => ({ ...s })),
                    fare: { ...itinFare },
                    totalFare,
                    creditAirline: itinCreditAirline,
                    creditProgramName: creditProg?.name || "",
                    currentTier: itinCurrentTier,
                    totalCredits: r?.totalCredits || 0,
                    projectedTier: r?.currentTier?.name || "Base Member",
                    unit: creditProg?.unit || "",
                  };
                  const updated = [entry, ...itinHistory].slice(0, 50);
                  setItinHistory(updated);
                  localStorage.setItem("continuum_itin_history", JSON.stringify(updated));
                }} style={{
                  padding: "10px 20px", borderRadius: 8, border: `1px solid ${css.accentBorder}`,
                  background: css.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>Save to History</button>
                <button onClick={() => {
                  setItinSegments([{ id: crypto.randomUUID(), origin: "", destination: "", operatingAirline: "", marketingAirline: "", bookingClass: "", distance: "" }]);
                  setItinFare({ baseFare: "", taxes: "", airlineFees: "", otherFees: "", currency: "USD" });
                  setItinCreditAirline("");
                }} style={{
                  padding: "10px 20px", borderRadius: 8, border: `1px solid ${css.border}`,
                  background: "transparent", color: css.text3, fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>Clear Form</button>
              </div>
            )}

            {/* Saved History */}
            {itinHistory.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <button onClick={() => setShowItinHistory(h => !h)} style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: "12px 0", border: "none", cursor: "pointer", background: "transparent",
                  color: css.text2, fontSize: 13, fontWeight: 600, fontFamily: "'Instrument Sans', 'Outfit', sans-serif",
                }}>
                  <span style={{ transform: showItinHistory ? "rotate(90deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▸</span>
                  Saved Calculations ({itinHistory.length})
                </button>
                {showItinHistory && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                    {itinHistory.map(h => {
                      const creditProg = airlines.find(a => a.id === h.creditAirline);
                      return (
                        <div key={h.id} style={{
                          background: css.surface, border: `1px solid ${css.border}`, borderRadius: 10,
                          padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
                          gap: 12, flexWrap: "wrap",
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.route}</div>
                            <div style={{ fontSize: 10, color: css.text3, marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <span>{new Date(h.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                              {h.creditProgramName && <span style={{ color: creditProg?.color || css.accent }}>→ {h.creditProgramName}</span>}
                              {h.totalCredits > 0 && <span style={{ fontWeight: 600, fontFamily: "'Geist Mono', monospace" }}>+{h.totalCredits.toLocaleString()} {h.unit}</span>}
                              {h.totalFare > 0 && <span>${h.totalFare.toLocaleString()}</span>}
                              {h.projectedTier && h.projectedTier !== "Base Member" && <span style={{ color: creditProg?.color || css.text2, fontWeight: 600 }}>→ {h.projectedTier}</span>}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <button onClick={() => {
                              setItinSegments(h.segments.map(s => ({ ...s, id: crypto.randomUUID() })));
                              setItinFare(h.fare || { baseFare: "", taxes: "", airlineFees: "", otherFees: "", currency: "USD" });
                              setItinCreditAirline(h.creditAirline || "");
                            }} style={{
                              padding: "5px 12px", borderRadius: 6, border: `1px solid ${css.accentBorder}`,
                              background: css.accentBg, color: css.accent, fontSize: 10, fontWeight: 600, cursor: "pointer",
                            }}>Load</button>
                            <button onClick={() => {
                              const updated = itinHistory.filter(x => x.id !== h.id);
                              setItinHistory(updated);
                              localStorage.setItem("continuum_itin_history", JSON.stringify(updated));
                            }} style={{
                              padding: "5px 10px", borderRadius: 6, border: `1px solid rgba(239,68,68,0.2)`,
                              background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 10, fontWeight: 600, cursor: "pointer",
                            }}>×</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {flightTrips.length === 0 && _tab !== "itinerary" && (
          <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "28px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: css.text2 }}>No flight trips found. Add flights in the Trips tab to use the optimizer.</div>
          </div>
        )}

        {/* ── Tab: Global Status Optimizer ── */}
        {_tab === "global" && flightTrips.length > 0 && (
          <div>
            {/* Recommendation banner */}
            {bestGlobal && (
              <div style={{
                background: css.surface, border: `1px solid ${css.accentBorder}`, borderLeft: `4px solid ${css.accent}`,
                borderRadius: 14, padding: "18px 22px", marginBottom: 20,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: css.accent, marginBottom: 6 }}>Recommended</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: css.text }}>
                  Credit all {flightTrips.length} flights to <span style={{ color: bestGlobal.airline.color }}>{bestGlobal.airline.name}</span>
                </div>
                <div style={{ fontSize: 12, color: css.text2, marginTop: 4 }}>
                  {bestGlobal.currentTier ? `Projected: ${bestGlobal.currentTier.name}` : "Projected: Base Member"}
                  {bestGlobal.nextTier && ` — ${bestGlobal.pctToNext}% toward ${bestGlobal.nextTier.name}`}
                  {!bestGlobal.nextTier && bestGlobal.currentTier && ` — Top tier reached!`}
                  {` · ${bestGlobal.totalFromTrips.toLocaleString()} ${bestGlobal.airline.unit} from trips + ${bestGlobal.existingPts.toLocaleString()} existing`}
                </div>
              </div>
            )}

            {/* All airlines ranked */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {globalResults.map((r, i) => {
                const isBest = i === 0;
                return (
                  <div key={r.airline.id} style={{
                    background: css.surface, border: `1px solid ${isBest ? r.airline.color + "50" : css.border}`,
                    borderLeft: `3px solid ${r.airline.color}`, borderRadius: 12, padding: "16px 20px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isBest ? css.accent : css.text3, fontFamily: "'Geist Mono', monospace", width: 20 }}>#{i + 1}</span>
                        <ProgramLogo prog={r.airline} size={24} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{r.airline.name}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {r.currentTier && <span style={{ fontSize: 10, fontWeight: 600, color: r.airline.color, background: `${r.airline.color}15`, padding: "2px 8px", borderRadius: 12 }}>{r.currentTier.name}</span>}
                        {!r.nextTier && r.currentTier && <span style={{ fontSize: 10, fontWeight: 700, color: css.success, background: css.successBg, padding: "2px 8px", borderRadius: 12 }}>MAX</span>}
                      </div>
                    </div>
                    <BarFill pct={r.pctToNext} color={r.airline.color} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: css.text3, marginTop: 5, fontFamily: "'Geist Mono', monospace" }}>
                      <span>{r.total.toLocaleString()} {r.airline.unit} total ({r.existingPts.toLocaleString()} existing + {r.totalFromTrips.toLocaleString()} from trips)</span>
                      {r.nextTier && <span>{r.pctToNext}% → {r.nextTier.name} ({r.nextTier.threshold.toLocaleString()})</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab 2: Trip-by-Trip Comparison ── */}
        {_tab === "trip" && flightTrips.length > 0 && (
          <div>
            {/* Trip selector */}
            <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>Select a Flight</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {flightTrips.map(t => (
                  <button key={t.id} onClick={() => setOptimizerTripId(t.id)} style={{
                    padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                    border: `1px solid ${(selectedTrip?.id === t.id) ? css.accent : css.border}`,
                    background: (selectedTrip?.id === t.id) ? css.accentBg : css.surface2,
                    color: (selectedTrip?.id === t.id) ? css.accent : css.text,
                    fontSize: 12, fontWeight: (selectedTrip?.id === t.id) ? 600 : 400,
                  }}>
                    {t.route} · {t.class} · {t.date}
                  </button>
                ))}
              </div>
            </div>

            {selectedTrip && (
              <>
                <div style={{ fontSize: 12, color: css.text2, marginBottom: 14 }}>
                  Showing how <strong style={{ color: css.text }}>{selectedTrip.route}</strong> ({selectedTrip.class}, {(selectedTrip.estimatedPoints || 0).toLocaleString()} base pts) would affect status on each airline:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tripResults.map((r, i) => {
                    const jump = r.after.pctToNext - r.before.pctToNext;
                    const advanced = r.after.currentTier?.name !== r.before.currentTier?.name;
                    return (
                      <div key={r.airline.id} style={{
                        background: css.surface, border: `1px solid ${advanced ? css.success + "50" : css.border}`,
                        borderLeft: `3px solid ${r.airline.color}`, borderRadius: 12, padding: "14px 18px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <ProgramLogo prog={r.airline} size={22} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{r.airline.name}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'Geist Mono', monospace", color: r.airline.color }}>+{r.ptsFromTrip.toLocaleString()} {r.airline.unit}</span>
                            {advanced && <span style={{ fontSize: 10, fontWeight: 700, color: css.success, background: css.successBg, padding: "2px 8px", borderRadius: 12 }}>TIER UP</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: css.text3, width: 40, flexShrink: 0, fontFamily: "'Geist Mono', monospace" }}>{r.before.pctToNext}%</span>
                          <BarFill pct={r.before.pctToNext} color={css.border} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 10, color: css.accent, width: 40, flexShrink: 0, fontFamily: "'Geist Mono', monospace", fontWeight: 700 }}>{r.after.pctToNext}%</span>
                          <BarFill pct={r.after.pctToNext} color={r.airline.color} />
                        </div>
                        <div style={{ fontSize: 10, color: css.text3, marginTop: 5, fontFamily: "'Geist Mono', monospace" }}>
                          {r.before.currentTier?.name || "Base"} → {r.after.currentTier?.name || "Base"}
                          {r.after.nextTier && (() => { const gap = r.after.nextTier.threshold - r.existingPts - r.ptsFromTrip; return ` · ${gap > 0 ? gap.toLocaleString() + " to " + r.after.nextTier.name : r.after.nextTier.name + " reached!"}`; })()}
                          {jump > 0 && <span style={{ color: css.accent, fontWeight: 600 }}> (+{jump}% jump)</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Tab 3: Alliance Goal Optimizer ── */}
        {_tab === "alliance" && flightTrips.length > 0 && (
          <div>
            {/* Goal selector */}
            <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>Target Alliance Status</div>
              <select value={allianceGoal} onChange={e => setAllianceGoal(e.target.value)} style={{
                width: "100%", maxWidth: 340, background: css.surface2, border: `1px solid ${css.border}`,
                color: css.text, padding: "8px 12px", borderRadius: 8, fontSize: 13, fontFamily: "'Instrument Sans', 'Outfit', sans-serif",
              }}>
                {GOAL_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
              </select>
              <div style={{ fontSize: 12, color: css.text2, marginTop: 8 }}>
                Which airline program should you credit to in order to reach <strong style={{ color: ALLIANCE_TIER_COLORS[allianceGoal] }}>{ALLIANCE_TIER_LABELS[allianceGoal]}</strong>?
              </div>
            </div>

            {/* Recommendation */}
            {goalResults.length > 0 && goalResults[0].reached && (
              <div style={{
                background: css.surface, border: `1px solid ${css.success}40`, borderLeft: `4px solid ${css.success}`,
                borderRadius: 14, padding: "16px 20px", marginBottom: 16,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: css.success }}>
                  You can reach {ALLIANCE_TIER_LABELS[allianceGoal]} by crediting to {goalResults[0].airline.name}!
                </div>
                <div style={{ fontSize: 12, color: css.text2, marginTop: 4 }}>
                  Credit all trips to earn {goalResults[0].tierName} status ({goalResults[0].total.toLocaleString()} / {goalResults[0].threshold.toLocaleString()} {goalResults[0].airline.unit}).
                </div>
              </div>
            )}
            {goalResults.length > 0 && !goalResults[0].reached && (
              <div style={{
                background: css.surface, border: `1px solid ${css.warning}40`, borderLeft: `4px solid ${css.warning}`,
                borderRadius: 14, padding: "16px 20px", marginBottom: 16,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: css.warning }}>
                  Closest path to {ALLIANCE_TIER_LABELS[allianceGoal]}: credit to {goalResults[0].airline.name}
                </div>
                <div style={{ fontSize: 12, color: css.text2, marginTop: 4 }}>
                  You'd reach {goalResults[0].pct}% of {goalResults[0].tierName} ({goalResults[0].total.toLocaleString()} / {goalResults[0].threshold.toLocaleString()} {goalResults[0].airline.unit}) — {goalResults[0].remaining.toLocaleString()} more needed.
                </div>
              </div>
            )}
            {goalResults.length === 0 && (
              <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "20px", textAlign: "center", fontSize: 13, color: css.text3 }}>
                No airline programs in the system map to this alliance tier.
              </div>
            )}

            {/* All candidates */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {goalResults.map((r, i) => (
                <div key={r.airline.id} style={{
                  background: css.surface, border: `1px solid ${r.reached ? css.success + "40" : css.border}`,
                  borderLeft: `3px solid ${r.color}`, borderRadius: 12, padding: "16px 20px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? css.accent : css.text3, fontFamily: "'Geist Mono', monospace", width: 20 }}>#{i + 1}</span>
                      <ProgramLogo prog={r.airline} size={24} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{r.airline.name}</div>
                        <div style={{ fontSize: 10, color: css.text3 }}>Target: {r.tierName} ({r.threshold.toLocaleString()} {r.airline.unit})</div>
                      </div>
                    </div>
                    <div>
                      {r.reached ? (
                        <span style={{ fontSize: 10, fontWeight: 700, color: css.success, background: css.successBg, padding: "3px 10px", borderRadius: 12 }}>ACHIEVED</span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'Geist Mono', monospace", color: css.warning }}>{r.remaining.toLocaleString()} short</span>
                      )}
                    </div>
                  </div>
                  <BarFill pct={r.pct} color={r.reached ? css.success : r.color} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: css.text3, marginTop: 5, fontFamily: "'Geist Mono', monospace" }}>
                    <span>{r.existingPts.toLocaleString()} existing + {r.totalFromTrips.toLocaleString()} from trips = {r.total.toLocaleString()}</span>
                    <span>{r.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION 4: Credit Card Optimizer ── */}
        {_tab === "cards" && (() => {
          const allCards = LOYALTY_PROGRAMS.creditCards;
          const linkedCards = allCards.filter(c => linkedAccounts[c.id]);
          const cards = linkedCards.length > 0 ? linkedCards : allCards;
          const usingAll = linkedCards.length === 0;

          // Build target options: "max_points", plus all airline & hotel programs reachable via transfer
          const targetOptions = [
            { id: "max_points", label: "Highest Points (Any Program)", group: "General" },
          ];
          const airlineTargets = LOYALTY_PROGRAMS.airlines.map(a => ({ id: a.id, label: `${a.name} (${a.unit})`, group: "Airlines" }));
          const hotelTargets = LOYALTY_PROGRAMS.hotels.map(h => ({ id: h.id, label: `${h.name} (${h.unit})`, group: "Hotels" }));
          targetOptions.push(...airlineTargets, ...hotelTargets);

          // For a given card and category, calculate effective points toward target
          const getEffectiveRate = (cardId, catId) => {
            const bonus = CC_BONUS_EXPANDED[cardId] || {};
            const entry = bonus[catId] !== undefined ? bonus[catId] : (bonus.other || 1);
            const rate = _ccRate(entry, ccBookingMode);
            if (ccOptTarget === "max_points") return rate;
            const tp = CC_TRANSFER_PARTNERS[cardId];
            if (!tp) return 0;
            if (tp.directProgram === ccOptTarget) return rate;
            if (tp.partners && tp.partners.includes(ccOptTarget)) return rate;
            return 0;
          };
          // Check if a card/category combo has a portal bonus
          const hasPortalBonus = (cardId, catId) => {
            const bonus = CC_BONUS_EXPANDED[cardId] || {};
            const entry = bonus[catId];
            return _ccHasPortalBonus(entry);
          };

          // For each spending category, find the best card
          const categoryResults = CC_SPENDING_CATS.map(cat => {
            const cardRanking = cards.map(card => {
              const rate = getEffectiveRate(card.id, cat.id);
              const portalBonus = hasPortalBonus(card.id, cat.id);
              const bonus = CC_BONUS_EXPANDED[card.id] || {};
              const entry = bonus[cat.id];
              const directRate = _ccRate(entry, "direct");
              const portalRate = _ccRate(entry, "portal");
              return {
                card, rate, directRate, portalRate, portalBonus,
                currency: CC_TRANSFER_PARTNERS[card.id]?.currency || card.unit,
                canReachTarget: ccOptTarget === "max_points" || (() => {
                  const tp = CC_TRANSFER_PARTNERS[card.id];
                  if (!tp) return false;
                  if (tp.directProgram === ccOptTarget) return true;
                  return tp.partners && tp.partners.includes(ccOptTarget);
                })(),
              };
            }).filter(r => r.rate > 0).sort((a, b) => b.rate - a.rate);
            return { ...cat, ranking: cardRanking, best: cardRanking[0] || null };
          });

          // Overall summary: which card is best across all categories
          const cardWins = {};
          categoryResults.forEach(cat => {
            if (cat.best) {
              cardWins[cat.best.card.id] = (cardWins[cat.best.card.id] || 0) + 1;
            }
          });
          const topCardId = Object.entries(cardWins).sort((a, b) => b[1] - a[1])[0]?.[0];
          const topCard = cards.find(c => c.id === topCardId);

          // Target program info
          const targetProg = ccOptTarget !== "max_points" ? [...LOYALTY_PROGRAMS.airlines, ...LOYALTY_PROGRAMS.hotels].find(p => p.id === ccOptTarget) : null;

          // Sign-up bonus / min spend tracker (for linked cards)
          const purchaseAmt = parseFloat(ccOptAmount) || 100;

          return (
            <div>
              {/* Target selector */}
              <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "18px 22px", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <label style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: css.text3, marginBottom: 6 }}>Optimize For</div>
                    <select value={ccOptTarget} onChange={e => setCcOptTarget(e.target.value)} style={{
                      width: "100%", background: css.surface2, border: `1px solid ${css.border}`,
                      color: css.text, padding: "9px 12px", borderRadius: 8, fontSize: 13, fontFamily: "'Instrument Sans', 'Outfit', sans-serif",
                    }}>
                      <optgroup label="General">
                        <option value="max_points">Highest Points (Any Program)</option>
                      </optgroup>
                      <optgroup label="Airline Miles">
                        {airlineTargets.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </optgroup>
                      <optgroup label="Hotel Points">
                        {hotelTargets.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </optgroup>
                    </select>
                  </label>
                  <label style={{ width: 140 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: css.text3, marginBottom: 6 }}>Purchase Amount</div>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: css.text3, fontSize: 13 }}>$</span>
                      <input type="number" value={ccOptAmount} onChange={e => setCcOptAmount(e.target.value)} min="1" style={{
                        width: "100%", background: css.surface2, border: `1px solid ${css.border}`,
                        color: css.text, padding: "9px 12px 9px 22px", borderRadius: 8, fontSize: 13,
                        fontFamily: "'Geist Mono', monospace", boxSizing: "border-box", outline: "none",
                      }} />
                    </div>
                  </label>
                </div>

                {/* Booking mode toggle */}
                <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: css.text3 }}>Booking Method</div>
                  <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${css.border}` }}>
                    {[
                      { id: "direct", label: "Book Direct", desc: "Book on airline/hotel website" },
                      { id: "portal", label: "Card Travel Portal", desc: "Book via card issuer portal" },
                    ].map(mode => (
                      <button key={mode.id} onClick={() => setCcBookingMode(mode.id)} style={{
                        padding: "7px 16px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                        background: ccBookingMode === mode.id ? css.accentBg : css.surface2,
                        color: ccBookingMode === mode.id ? css.accent : css.text3,
                        borderRight: mode.id === "direct" ? `1px solid ${css.border}` : "none",
                      }}>{mode.label}</button>
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: css.text3, fontStyle: "italic" }}>
                    {ccBookingMode === "portal" ? "Rates reflect booking through Chase Travel, Amex Travel, Capital One Travel, etc." : "Rates reflect paying directly on airline/hotel websites with your card."}
                  </span>
                </div>

                {targetProg && (
                  <div style={{ fontSize: 12, color: css.text2, marginTop: 10 }}>
                    Showing which card earns the most <strong style={{ color: targetProg.color }}>{targetProg.name}</strong> {targetProg.unit} via direct earning or transfer partners.
                  </div>
                )}
                {usingAll && (
                  <div style={{ fontSize: 11, color: css.warning, marginTop: 8 }}>
                    No cards linked yet — showing all cards. Link your credit cards in Programs to personalize results.
                  </div>
                )}
              </div>

              {/* Top recommendation */}
              {topCard && (
                <div style={{
                  background: css.surface, border: `1px solid ${css.accent}40`, borderLeft: `4px solid ${css.accent}`,
                  borderRadius: 14, padding: "16px 20px", marginBottom: 20,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Top Card Overall</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <ProgramLogo prog={topCard} size={28} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: css.text }}>{topCard.name}</div>
                      <div style={{ fontSize: 11, color: css.text2 }}>Best card for {cardWins[topCardId]} of {CC_SPENDING_CATS.length} spending categories{ccOptTarget !== "max_points" && targetProg ? ` toward ${targetProg.name}` : ""}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Category-by-category breakdown */}
              <div style={{ fontSize: 13, fontWeight: 700, color: css.text, marginBottom: 12 }}>Best Card by Spending Category</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {categoryResults.map(cat => (
                  <div key={cat.id} style={{
                    background: css.surface, border: `1px solid ${css.border}`, borderRadius: 12, padding: "14px 18px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: cat.ranking.length > 1 ? 10 : 0, flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{cat.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{cat.label}</div>
                          {cat.best ? (
                            <div style={{ fontSize: 11, color: css.text3 }}>
                              Use <strong style={{ color: css.accent }}>{cat.best.card.name}</strong> — <span style={{ fontFamily: "'Geist Mono', monospace", color: css.gold }}>{cat.best.rate}x</span> {cat.best.currency}
                              {cat.best.portalBonus && ccBookingMode === "portal" && <span style={{ fontSize: 9, fontWeight: 700, color: css.warning, background: css.warningBg, padding: "1px 6px", borderRadius: 6, marginLeft: 6, border: `1px solid ${css.warning}30` }}>PORTAL RATE</span>}
                              {cat.best.portalBonus && ccBookingMode === "direct" && <span style={{ fontSize: 9, color: css.text3, marginLeft: 6 }}>({cat.best.portalRate}x via portal)</span>}
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: css.text3 }}>No linked card earns toward this target</div>
                          )}
                        </div>
                      </div>
                      {cat.best && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: css.gold, fontFamily: "'Geist Mono', monospace" }}>
                            {(cat.best.rate * purchaseAmt).toLocaleString()}
                          </div>
                          <div style={{ fontSize: 9, color: css.text3 }}>pts per ${purchaseAmt.toLocaleString()}</div>
                        </div>
                      )}
                    </div>

                    {/* Runner-ups */}
                    {cat.ranking.length > 1 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {cat.ranking.map((r, i) => (
                          <div key={r.card.id} style={{
                            display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8,
                            background: i === 0 ? css.accentBg : css.surface2, border: `1px solid ${i === 0 ? css.accentBorder : css.border}`,
                            fontSize: 11, color: i === 0 ? css.accent : css.text2,
                          }}>
                            <ProgramLogo prog={r.card} size={14} />
                            <span style={{ fontWeight: i === 0 ? 600 : 400 }}>{r.card.name.split(" ")[0]}</span>
                            <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 600, color: i === 0 ? css.accent : css.text3 }}>{r.rate}x</span>
                            {r.portalBonus && ccBookingMode === "portal" && <span style={{ fontSize: 8, color: css.warning, fontWeight: 700 }}>P</span>}
                            {r.portalBonus && ccBookingMode === "direct" && r.portalRate > r.directRate && <span style={{ fontSize: 8, color: css.text3 }}>({r.portalRate}x P)</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Transfer partner awareness panel */}
              {ccOptTarget !== "max_points" && targetProg && (
                <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: "18px 22px", marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: css.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15 }}>🔄</span> Cards That Transfer to {targetProg.name}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {cards.filter(c => {
                      const tp = CC_TRANSFER_PARTNERS[c.id];
                      if (!tp) return false;
                      if (tp.directProgram === ccOptTarget) return true;
                      return tp.partners && tp.partners.includes(ccOptTarget);
                    }).map(card => {
                      const tp = CC_TRANSFER_PARTNERS[card.id];
                      const isDirect = tp?.directProgram === ccOptTarget;
                      return (
                        <div key={card.id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px",
                          background: css.surface2, borderRadius: 10, border: `1px solid ${css.border}`,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <ProgramLogo prog={card} size={22} />
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: css.text }}>{card.name}</div>
                              <div style={{ fontSize: 10, color: css.text3 }}>{tp?.currency}</div>
                            </div>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 10,
                            background: isDirect ? css.successBg : css.accentBg,
                            color: isDirect ? css.success : css.accent,
                            border: `1px solid ${isDirect ? css.success : css.accent}30`,
                          }}>{isDirect ? "Direct Earn" : "1:1 Transfer"}</span>
                        </div>
                      );
                    })}
                    {cards.filter(c => {
                      const tp = CC_TRANSFER_PARTNERS[c.id];
                      if (!tp) return false;
                      return tp.directProgram === ccOptTarget || (tp.partners && tp.partners.includes(ccOptTarget));
                    }).length === 0 && (
                      <div style={{ textAlign: "center", padding: "20px", color: css.text3, fontSize: 12 }}>
                        None of your {usingAll ? "" : "linked "}cards transfer to {targetProg.name}.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Full card comparison table */}
              <div style={{ fontSize: 13, fontWeight: 700, color: css.text, marginBottom: 12 }}>Full Earn Rate Comparison</div>
              <div style={{ overflowX: "auto", borderRadius: 14, border: `1px solid ${css.border}` }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: css.surface, fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: css.surface2 }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: css.text3, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", position: "sticky", left: 0, background: css.surface2, zIndex: 1 }}>Card</th>
                      {CC_SPENDING_CATS.map(cat => (
                        <th key={cat.id} style={{ padding: "10px 8px", textAlign: "center", color: css.text3, fontWeight: 600, fontSize: 10, whiteSpace: "nowrap" }}>
                          <div>{cat.icon}</div>{cat.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map(card => (
                      <tr key={card.id} style={{ borderTop: `1px solid ${css.border}` }}>
                        <td style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 6, position: "sticky", left: 0, background: css.surface, zIndex: 1, whiteSpace: "nowrap" }}>
                          <ProgramLogo prog={card} size={16} />
                          <span style={{ fontWeight: 500, color: css.text, fontSize: 11 }}>{card.name.length > 18 ? card.name.slice(0, 16) + ".." : card.name}</span>
                        </td>
                        {CC_SPENDING_CATS.map(cat => {
                          const rate = getEffectiveRate(card.id, cat.id);
                          const isBest = categoryResults.find(c => c.id === cat.id)?.best?.card.id === card.id;
                          const isPortal = hasPortalBonus(card.id, cat.id);
                          return (
                            <td key={cat.id} style={{
                              padding: "8px", textAlign: "center", fontFamily: "'Geist Mono', monospace",
                              fontWeight: isBest ? 700 : 400,
                              color: rate === 0 ? css.text3 + "60" : isBest ? css.accent : css.text,
                              background: isBest ? css.accentBg : "transparent",
                              position: "relative",
                            }}>
                              {rate === 0 ? "—" : `${rate}x`}
                              {isPortal && ccBookingMode === "portal" && rate > 0 && <span style={{ position: "absolute", top: 2, right: 2, fontSize: 7, color: css.warning, fontWeight: 700 }}>P</span>}
                              {isPortal && ccBookingMode === "direct" && rate > 0 && (() => {
                                const bonus = CC_BONUS_EXPANDED[card.id] || {};
                                const pRate = _ccRate(bonus[cat.id], "portal");
                                return pRate > rate ? <div style={{ fontSize: 8, color: css.text3, fontWeight: 400 }}>{pRate}x via P</div> : null;
                              })()}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  // ── helper shared with both report types ──
  const buildPrintReport = async (title, expsForReport) => {
    const CURRENCY_SYMBOLS = { USD:"$",EUR:"€",GBP:"£",CAD:"CA$",AUD:"A$",JPY:"¥",CHF:"Fr",CNY:"¥",HKD:"HK$",SGD:"S$",MXN:"MX$",BRL:"R$",INR:"₹",KRW:"₩",AED:"د.إ",THB:"฿",NOK:"kr",SEK:"kr",DKK:"kr",NZD:"NZ$" };
    const symFor = (cur) => CURRENCY_SYMBOLS[cur] || (cur + " ");
    const fmtAmt = (n, cur) => n === 0 ? "Free" : `${symFor(cur)}${n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    const toUSD = (e) => e.amount * (e.fxRate || 1);
    const tripTotalUSD = expsForReport.reduce((s, e) => s + toUSD(e), 0);
    const receiptCount = expsForReport.filter(e => e.receipt).length;
    const catSummary = EXPENSE_CATEGORIES.map(cat => ({
      ...cat,
      totalUSD: expsForReport.filter(e => e.category === cat.id).reduce((s,e) => s + toUSD(e), 0),
      count: expsForReport.filter(e => e.category === cat.id).length,
    })).filter(c => c.totalUSD > 0);
    const expensesWithReceipts = expsForReport.filter(e => e.receiptImage?.data);
    const pdfPageImages = {};
    for (const exp of expensesWithReceipts) {
      if (exp.receiptImage.type === "application/pdf") {
        try { pdfPageImages[exp.id] = await renderPdfToImages(exp.receiptImage.data); } catch(e) { pdfPageImages[exp.id] = []; }
      }
    }

    const catRows = catSummary.map(cat => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #2a2640;"><span style="font-size:16px;margin-right:8px;">${cat.icon}</span><span style="font-size:13px;color:#d0d6e0;">${cat.label} (${cat.count})</span></td>
        <td style="padding:10px 0;border-bottom:1px solid #2a2640;"><div style="background:#2a2640;border-radius:4px;height:6px;width:120px;overflow:hidden;"><div style="width:${tripTotalUSD>0?Math.round((cat.totalUSD/tripTotalUSD)*100):0}%;height:100%;background:${cat.color};border-radius:4px;"></div></div></td>
        <td style="padding:10px 0;border-bottom:1px solid #2a2640;text-align:right;font-size:13px;font-weight:700;color:#f7f8f8;">$${cat.totalUSD.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      </tr>`).join("");

    const lineRows = expsForReport.map((exp, i) => {
      const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
      const cur = exp.currency || "USD";
      const usdAmt = toUSD(exp);
      const isForeign = cur !== "USD";
      const tripName = exp.tripId ? (trips.find(t => t.id === exp.tripId)?.tripName || trips.find(t => t.id === exp.tripId)?.route || "Trip") : "Custom";
      const receiptIdx = expensesWithReceipts.findIndex(e => e.id === exp.id);
      return `<tr>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2640;vertical-align:top;">
          <div style="font-size:13px;color:#f7f8f8;">${cat?.icon||""} ${exp.description}</div>
          <div style="font-size:10px;color:#62666d;margin-top:2px;">${tripName}${exp.notes ? " · " + exp.notes : ""}</div>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2640;font-size:12px;color:#8a8f98;white-space:nowrap;">${exp.date?.slice(5)||""}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2640;font-size:12px;color:#8a8f98;">${exp.paymentMethod||"—"}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2640;text-align:right;">
          <div style="font-size:13px;font-weight:700;color:${exp.amount===0?"#34d399":"#fff"};">${fmtAmt(exp.amount,cur)}</div>
          ${isForeign?`<div style="font-size:10px;color:#62666d;">$${usdAmt.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} USD</div>`:""}
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2640;text-align:center;font-size:13px;color:${exp.receipt?"#34d399":"#62666d"};">
          ${exp.receipt?(receiptIdx>=0?`<span style="font-size:10px;color:#0EA5A0;">p.${receiptIdx+2}</span>`:"✓"):"—"}
        </td>
      </tr>`;
    }).join("");

    const receiptPages = expensesWithReceipts.map((exp, i) => {
      const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
      const cur = exp.currency || "USD";
      const isPdf = exp.receiptImage.type === "application/pdf";
      const pages = isPdf ? (pdfPageImages[exp.id] || []) : [exp.receiptImage.data];
      return pages.map((src, pi) => `
        <div style="page-break-before:always;padding:48px;background:#13111C;min-height:100vh;box-sizing:border-box;">
          ${pi === 0 ? `
            <div style="color:#8a8f98;font-size:11px;font-family:monospace;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.1em;">Receipt ${i+1} of ${expensesWithReceipts.length}${isPdf && pages.length > 1 ? ` — Page 1 of ${pages.length}` : ""}</div>
            <div style="font-size:16px;font-weight:700;color:#f7f8f8;margin-bottom:4px;">${cat?.icon||""} ${exp.description}</div>
            <div style="font-size:12px;color:#8a8f98;margin-bottom:32px;">${exp.date||""} · ${exp.paymentMethod||""} · ${fmtAmt(exp.amount,cur)}</div>
          ` : `
            <div style="color:#8a8f98;font-size:11px;font-family:monospace;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.1em;">Receipt ${i+1} — Page ${pi+1} of ${pages.length} · ${exp.description}</div>
          `}
          <img src="${src}" alt="Receipt${isPdf ? ` page ${pi+1}` : ""}" style="width:100%;border-radius:8px;border:1px solid #2a2640;display:block;" />
        </div>
      `).join("");
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
      <style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#13111C;color:#f7f8f8;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}@media print{body{background:#13111C!important;}@page{margin:16mm 18mm;size:A4;}}table{border-collapse:collapse;width:100%;}</style>
    </head><body>
      <div style="padding:48px 48px 40px;background:#13111C;min-height:100vh;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;">
          <div>
            <img src="${window.location.origin}/continuum-travel-logo.svg" alt="Continuum" style="height:80px;display:block;margin-bottom:12px;" />
            <div style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;">${title}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;color:#8a8f98;">Generated ${new Date().toLocaleDateString()}</div>
            <div style="font-size:11px;color:#62666d;">Report #${Date.now().toString(36).slice(-6)}</div>
            <div style="margin-top:6px;font-size:11px;font-weight:700;color:#0EA5A0;">Total in USD</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:28px;">
          <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:16px;text-align:center;"><div style="font-size:22px;font-weight:800;color:#0EA5A0;">$${tripTotalUSD.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div style="font-size:10px;color:#8a8f98;margin-top:4px;">Total (USD)</div></div>
          <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:16px;text-align:center;"><div style="font-size:22px;font-weight:700;color:#fff;">${expsForReport.length}</div><div style="font-size:10px;color:#8a8f98;margin-top:4px;">Items</div></div>
          <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:16px;text-align:center;"><div style="font-size:22px;font-weight:800;color:#34d399;">${receiptCount}/${expsForReport.length}</div><div style="font-size:10px;color:#8a8f98;margin-top:4px;">Receipts</div></div>
        </div>
        <div style="margin-bottom:28px;">
          <div style="font-size:11px;font-weight:700;color:#8a8f98;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Breakdown by Category</div>
          <table><tbody>${catRows}</tbody></table>
        </div>
        <div style="margin-bottom:32px;">
          <div style="font-size:11px;font-weight:700;color:#8a8f98;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Line Items</div>
          <div style="background:#1a1725;border-radius:8px;overflow:hidden;border:1px solid #2a2640;">
            <table>
              <thead><tr style="background:rgba(255,255,255,0.04);">
                <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Description</th>
                <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Date</th>
                <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Payment</th>
                <th style="padding:10px 14px;text-align:right;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Amount</th>
                <th style="padding:10px 14px;text-align:center;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">🧾</th>
              </tr></thead>
              <tbody>${lineRows}</tbody>
              <tfoot><tr style="background:rgba(14,165,160,0.08);">
                <td colspan="3" style="padding:14px;font-size:13px;font-weight:700;color:#0EA5A0;border-top:2px solid rgba(14,165,160,0.3);">TOTAL (USD)</td>
                <td style="padding:14px;text-align:right;font-size:15px;font-weight:800;color:#0EA5A0;border-top:2px solid rgba(14,165,160,0.3);">$${tripTotalUSD.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                <td style="border-top:2px solid rgba(14,165,160,0.3);"></td>
              </tr></tfoot>
            </table>
          </div>
        </div>
        <div style="text-align:center;color:#62666d;font-size:10px;border-top:1px solid #2a2640;padding-top:16px;">
          Generated by Continuum — Elevate Every Journey · ${new Date().toLocaleString()}${expensesWithReceipts.length>0?` · ${expensesWithReceipts.length} receipt${expensesWithReceipts.length!==1?"s":""} attached`:""}
        </div>
      </div>
      ${receiptPages}
    </body></html>`;

    return html;
  };

  const openReportWindow = (html, autoPrint = false) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    if (!autoPrint) return;
    const imgs = w.document.images;
    if (imgs.length === 0) { setTimeout(() => { w.focus(); w.print(); }, 300); return; }
    let loaded = 0;
    const tryPrint = () => { loaded++; if (loaded >= imgs.length) setTimeout(() => { w.focus(); w.print(); }, 300); };
    Array.from(imgs).forEach(img => { if (img.complete) tryPrint(); else { img.onload = tryPrint; img.onerror = tryPrint; } });
  };
