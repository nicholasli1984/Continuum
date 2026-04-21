import React from "react";
import { LOYALTY_PROGRAMS } from "../constants/programs";
export function renderPrograms(s, _previewSub = null) {
  const { css, isMobile, darkMode, user, linkedAccounts, setLinkedAccounts, supabase,
    progAddType, setProgAddType, progAddId, setProgAddId, progAddTier, setProgAddTier,
    ProgramLogo, expandedCardId, setExpandedCardId,
    cardBenefitValues, setCardBenefitValue, cardCustomBenefits, addCustomBenefit, updateCustomBenefit, removeCustomBenefit,
    getCardNetValue, showConfirm, getTripExpenses, getTripTotal, getTripName, formatTripDates, EXPENSE_CATEGORIES, SegIcon, AIRPORT_CITY, AIRLINE_CS, HOTEL_CS, OTA_CS } = s;
  const D = darkMode;
    // Simple single-page program manager
    const allAirlines = LOYALTY_PROGRAMS.airlines;
    const allHotels = LOYALTY_PROGRAMS.hotels;
    const allCards = LOYALTY_PROGRAMS.creditCards;
    const linkedCount = Object.keys(linkedAccounts).length;

    // Add program — saves to Supabase for cross-device sync
    const addProgram = async (type, programId, tier) => {
      if (!programId) return;
      const now = new Date().toISOString();
      setLinkedAccounts(prev => ({
        ...prev,
        [programId]: { ...(prev[programId] || {}), memberId: prev[programId]?.memberId || "", currentTier: tier || "", updatedAt: now },
      }));
      if (user) {
        await supabase.from("linked_accounts").upsert({
          user_id: user.id, program_id: programId, member_id: linkedAccounts[programId]?.memberId || "",
          current_tier: tier || "", tier_credits: 0, points_balance: 0, current_nights: 0, current_rentals: 0, updated_at: now,
        }, { onConflict: "user_id,program_id" });
      }
    };
    const removeProgram = (programId) => {
      showConfirm("Are you sure you want to remove this program?", async () => {
        setLinkedAccounts(prev => { const n = { ...prev }; delete n[programId]; return n; });
        if (user) {
          await supabase.from("linked_accounts").delete().eq("user_id", user.id).eq("program_id", programId);
        }
      });
    };

    const addType = progAddType;
    const setAddType = (v) => { setProgAddType(v); setProgAddId(""); setProgAddTier(""); };
    const addProgramId = progAddId;
    const setAddProgramId = (v) => { setProgAddId(v); setProgAddTier(""); };
    const addTier = progAddTier;
    const setAddTier = setProgAddTier;

    const programOptions = addType === "airline" ? allAirlines : addType === "hotel" ? allHotels : allCards;
    const selectedProg = programOptions.find(p => p.id === addProgramId);
    const tierOptions = selectedProg?.tiers || [];

    const handleAdd = () => {
      if (!addProgramId) return;
      addProgram(addType, addProgramId, addType === "card" ? "" : addTier);
      setProgAddId(""); setProgAddTier("");
    };

    // Group linked programs by type
    const linkedAirlines = allAirlines.filter(p => linkedAccounts[p.id]);
    const linkedHotels = allHotels.filter(p => linkedAccounts[p.id]);
    const linkedCards = allCards.filter(p => linkedAccounts[p.id]);

    return (
      <div>
        {/* Page header */}
        <div className="c-a1" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: css.text, margin: 0, letterSpacing: "-0.02em" }}>My Programs</h2>
          <p style={{ color: css.text3, fontSize: 13, margin: "6px 0 0" }}>{linkedCount} program{linkedCount !== 1 ? "s" : ""} added</p>
        </div>

        {/* ── Add Program Form ── */}
        <div className="c-a2" style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: isMobile ? "20px 16px" : "24px 28px", marginBottom: 32, boxShadow: css.shadow }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: css.text, marginBottom: 16 }}>Add a Program</div>
          <div style={{ display: "flex", gap: isMobile ? 8 : 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            {/* Box 1: Type */}
            <div style={{ flex: isMobile ? "1 1 100%" : "1 1 140px", minWidth: isMobile ? 0 : 140 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Type</label>
              <select value={addType} onChange={e => { setAddType(e.target.value); setAddProgramId(""); setAddTier(""); }} style={{ width: "100%", padding: "10px 12px", background: css.surface2, border: `1px solid ${css.border}`, borderRadius: 8, color: css.text, fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}>
                <option value="airline">Airline</option>
                <option value="hotel">Hotel</option>
                <option value="card">Credit Card</option>
              </select>
            </div>
            {/* Box 2: Program */}
            <div style={{ flex: isMobile ? "1 1 100%" : "2 1 200px", minWidth: isMobile ? 0 : 200 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Program</label>
              <select value={addProgramId} onChange={e => { setAddProgramId(e.target.value); setAddTier(""); }} style={{ width: "100%", padding: "10px 12px", background: css.surface2, border: `1px solid ${css.border}`, borderRadius: 8, color: css.text, fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}>
                <option value="">Select {addType === "card" ? "credit card" : addType}...</option>
                {programOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {/* Box 3: Tier (not for credit cards) */}
            {addType !== "card" && (
              <div style={{ flex: isMobile ? "1 1 100%" : "1 1 180px", minWidth: isMobile ? 0 : 180 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Status Level</label>
                <select value={addTier} onChange={e => setAddTier(e.target.value)} disabled={!addProgramId || tierOptions.length === 0} style={{ width: "100%", padding: "10px 12px", background: css.surface2, border: `1px solid ${css.border}`, borderRadius: 8, color: css.text, fontSize: 14, fontFamily: "inherit", cursor: "pointer", opacity: (!addProgramId || tierOptions.length === 0) ? 0.5 : 1 }}>
                  <option value="">Member (base)</option>
                  {tierOptions.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>
            )}
            {/* Add button */}
            <button onClick={handleAdd} disabled={!addProgramId} style={{ padding: "10px 24px", border: "none", borderRadius: 8, background: addProgramId ? css.accent : css.surface2, color: addProgramId ? "#fff" : css.text3, fontSize: 14, fontWeight: 600, cursor: addProgramId ? "pointer" : "default", transition: "all 0.15s", flexShrink: 0, fontFamily: "inherit" }}>Add</button>
          </div>
        </div>

        {/* ── Linked Programs List ── */}
        {linkedAirlines.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Airlines</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {linkedAirlines.map(prog => (
                <div key={prog.id} style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 14, padding: isMobile ? "10px 12px" : "14px 18px", borderRadius: 12, background: css.surface, border: `1px solid ${css.border}`, boxShadow: css.shadow, flexWrap: isMobile ? "wrap" : "nowrap" }}>
                  <ProgramLogo prog={prog} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: css.text }}>{prog.name}</div>
                    <div style={{ fontSize: 11, color: css.text3, marginTop: 2 }}>{linkedAccounts[prog.id]?.currentTier || "Member"}</div>
                  </div>
                  <select value={linkedAccounts[prog.id]?.currentTier || ""} onChange={e => { const tier = e.target.value; setLinkedAccounts(prev => ({ ...prev, [prog.id]: { ...prev[prog.id], currentTier: tier } })); if (user) supabase.from("linked_accounts").upsert({ user_id: user.id, program_id: prog.id, current_tier: tier, member_id: linkedAccounts[prog.id]?.memberId || "", updated_at: new Date().toISOString() }, { onConflict: "user_id,program_id" }); }} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${css.border}`, background: css.surface2, color: css.text, fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
                    <option value="">Member</option>
                    {(prog.tiers || []).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                  <button onClick={() => removeProgram(prog.id)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${D ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.2)"}`, background: "transparent", color: "#ef4444", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {linkedHotels.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Hotels</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {linkedHotels.map(prog => (
                <div key={prog.id} style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 14, padding: isMobile ? "10px 12px" : "14px 18px", borderRadius: 12, background: css.surface, border: `1px solid ${css.border}`, boxShadow: css.shadow, flexWrap: isMobile ? "wrap" : "nowrap" }}>
                  <ProgramLogo prog={prog} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: css.text }}>{prog.name}</div>
                    <div style={{ fontSize: 11, color: css.text3, marginTop: 2 }}>{linkedAccounts[prog.id]?.currentTier || "Member"}</div>
                  </div>
                  <select value={linkedAccounts[prog.id]?.currentTier || ""} onChange={e => { const tier = e.target.value; setLinkedAccounts(prev => ({ ...prev, [prog.id]: { ...prev[prog.id], currentTier: tier } })); if (user) supabase.from("linked_accounts").upsert({ user_id: user.id, program_id: prog.id, current_tier: tier, member_id: linkedAccounts[prog.id]?.memberId || "", updated_at: new Date().toISOString() }, { onConflict: "user_id,program_id" }); }} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${css.border}`, background: css.surface2, color: css.text, fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
                    <option value="">Member</option>
                    {(prog.tiers || []).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                  <button onClick={() => removeProgram(prog.id)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${D ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.2)"}`, background: "transparent", color: "#ef4444", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {linkedCards.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Credit Cards</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {linkedCards.map(prog => {
                const isExpanded = expandedCardId === prog.id;
                const { total, fee, net } = getCardNetValue(prog.id);
                const hasBenefits = (prog.benefits || []).length > 0;
                const values = cardBenefitValues[prog.id] || {};
                const netColor = net >= 0 ? "#10b981" : "#ef4444";
                return (
                <div key={prog.id} style={{ borderRadius: 12, background: css.surface, border: `1px solid ${css.border}`, boxShadow: css.shadow, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 14, padding: isMobile ? "10px 12px" : "14px 18px", flexWrap: isMobile ? "wrap" : "nowrap" }}>
                    <ProgramLogo prog={prog} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: css.text }}>{prog.name}</div>
                      <div style={{ fontSize: 11, color: css.text3, marginTop: 2 }}>
                        {fee > 0 ? `$${fee}/yr` : "No annual fee"}
                        {hasBenefits && total > 0 && <span> · ${total} benefits used</span>}
                      </div>
                    </div>
                    {(hasBenefits || total > 0 || fee > 0) && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, marginRight: 4 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Net Value</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: netColor, fontFamily: "'Space Mono', monospace" }}>{net >= 0 ? "+" : "−"}${Math.abs(net)}</div>
                      </div>
                    )}
                    <button onClick={() => setExpandedCardId(isExpanded ? null : prog.id)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${css.border}`, background: css.surface2, color: css.text2, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>{isExpanded ? "Hide" : "Benefits"}</button>
                    <button onClick={() => removeProgram(prog.id)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${D ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.2)"}`, background: "transparent", color: "#ef4444", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Remove</button>
                  </div>
                  {isExpanded && (() => {
                    const customs = cardCustomBenefits[prog.id] || [];
                    return (
                    <div style={{ padding: isMobile ? "12px 14px 16px" : "4px 20px 20px", borderTop: `1px solid ${css.border}`, background: css.surface2 }}>
                      {hasBenefits && <div style={{ fontSize: 11, color: css.text3, marginTop: 12, marginBottom: 12 }}>Enter the dollar value you actually received from each benefit this year. The face value is shown as a hint.</div>}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(prog.benefits || []).map(b => {
                          const v = values[b.id];
                          return (
                            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: css.surface, border: `1px solid ${css.border}` }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, color: css.text, fontWeight: 500 }}>{b.label}</div>
                                <div style={{ fontSize: 10, color: css.text3, marginTop: 2 }}>{b.maxValue > 0 ? `Face value up to $${b.maxValue}` : "Variable / perk value"}</div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 13, color: css.text3 }}>$</span>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min="0"
                                  value={v == null ? "" : v}
                                  placeholder="0"
                                  onChange={e => setCardBenefitValue(prog.id, b.id, e.target.value === "" ? "" : Number(e.target.value))}
                                  style={{ width: 80, padding: "6px 10px", borderRadius: 6, border: `1px solid ${css.border}`, background: css.surface2, color: css.text, fontSize: 13, fontFamily: "'Space Mono', monospace", textAlign: "right", outline: "none" }}
                                />
                                {b.maxValue > 0 && (
                                  <button onClick={() => setCardBenefitValue(prog.id, b.id, b.maxValue)} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${css.border}`, background: "transparent", color: css.text3, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }} title="Fill with full face value">Max</button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Other / custom benefits */}
                      <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px dashed ${css.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Other Benefits</div>
                          <button onClick={() => addCustomBenefit(prog.id)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${css.accent}`, background: "transparent", color: css.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Add</button>
                        </div>
                        {customs.length === 0 && (
                          <div style={{ fontSize: 11, color: css.text3, fontStyle: "italic", padding: "4px 0" }}>Add any card-specific enhancements (e.g. Points Boost, category multipliers, hidden perks) with a description and dollar value.</div>
                        )}
                        {customs.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {customs.map(cb => (
                              <div key={cb.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: css.surface, border: `1px solid ${css.border}` }}>
                                <input
                                  type="text"
                                  value={cb.label}
                                  placeholder="e.g. Points Boost on redemptions"
                                  onChange={e => updateCustomBenefit(prog.id, cb.id, { label: e.target.value })}
                                  style={{ flex: 1, minWidth: 0, padding: "6px 10px", borderRadius: 6, border: `1px solid ${css.border}`, background: css.surface2, color: css.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                                />
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 13, color: css.text3 }}>$</span>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    min="0"
                                    value={cb.value == null ? "" : cb.value}
                                    placeholder="0"
                                    onChange={e => updateCustomBenefit(prog.id, cb.id, { value: e.target.value === "" ? "" : Number(e.target.value) })}
                                    style={{ width: 80, padding: "6px 10px", borderRadius: 6, border: `1px solid ${css.border}`, background: css.surface2, color: css.text, fontSize: 13, fontFamily: "'Space Mono', monospace", textAlign: "right", outline: "none" }}
                                  />
                                </div>
                                <button onClick={() => removeCustomBenefit(prog.id, cb.id)} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${D ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.2)"}`, background: "transparent", color: "#ef4444", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }} title="Remove">×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: `1px solid ${css.border}` }}>
                        <div style={{ fontSize: 11, color: css.text3 }}>
                          <span style={{ color: "#10b981", fontWeight: 600 }}>+${total}</span> benefits
                          {" − "}
                          <span style={{ color: "#ef4444", fontWeight: 600 }}>${fee}</span> fee
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: netColor, fontFamily: "'Space Mono', monospace" }}>= {net >= 0 ? "+" : "−"}${Math.abs(net)} net</div>
                      </div>
                    </div>
                    );
                  })()}
                </div>
                );
              })}
            </div>
          </div>
        )}

        {linkedCount === 0 && (
          <div style={{ padding: "48px 20px", textAlign: "center", borderRadius: 14, background: css.surface, border: `1px solid ${css.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: css.text, marginBottom: 8 }}>No programs added yet</div>
            <p style={{ fontSize: 13, color: css.text3, margin: 0 }}>Use the form above to add your airline, hotel, and credit card programs</p>
          </div>
        )}

      </div>
    );
  };

  const renderTrips = () => {
  const renderTrips = () => renderTripsPage({
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
    layoverMap: new Map(), flightType, setFlightType,
    generateFlightyICS, togglePackItem,
  });

}
