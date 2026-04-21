import React, { useState } from "react";
export function renderExpenseReports(s) {
  const { css, isMobile, darkMode, user, trips, expenses, allPrograms, supabase,
    standaloneReports, setStandaloneReports, showReportBuilder, setShowReportBuilder,
    reportBuilder, setReportBuilder, editingReportId, setEditingReportId,
    reportBuilderCustom, setReportBuilderCustom,
    forwardReportId, setForwardReportId, forwardEmail, setForwardEmail, forwardStatus, setForwardStatus,
    EXPENSE_CATEGORIES, showConfirm,
    getTripExpenses, getTripTotal, getTripName, formatTripDates,
    buildPrintReport, openReportWindow } = s;
  const D = darkMode;
    const openBuilder = (report = null, type = "reimbursement") => {
      if (report) {
        setEditingReportId(report.id);
        setReportBuilder({ title: report.title, selectedTripIds: report.selectedTripIds, excludedExpenseIds: report.excludedExpenseIds, customExpenses: report.customExpenses, reportType: report.reportType || "reimbursement" });
      } else {
        setEditingReportId(null);
        setReportBuilder({ title: "", selectedTripIds: [], excludedExpenseIds: [], customExpenses: [], reportType: type });
      }
      setShowReportBuilder(true);
    };

    const saveReport = async () => {
      if (!reportBuilder.title.trim()) return;
      const payload = {
        title: reportBuilder.title,
        selected_trip_ids: reportBuilder.selectedTripIds,
        excluded_expense_ids: reportBuilder.excludedExpenseIds,
        custom_expenses: reportBuilder.customExpenses,
        updated_at: new Date().toISOString(),
      };
      if (editingReportId) {
        if (user) await supabase.from("expense_reports").update(payload).eq("id", editingReportId).eq("user_id", user.id);
        setStandaloneReports(prev => prev.map(r => r.id === editingReportId ? { ...r, ...reportBuilder, id: editingReportId } : r));
      } else {
        if (user) {
          const { data, error } = await supabase.from("expense_reports").insert({ ...payload, user_id: user.id }).select().single();
          if (!error && data) {
            setStandaloneReports(prev => [{ ...reportBuilder, id: data.id, createdAt: data.created_at?.slice(0, 10) }, ...prev]);
          }
        } else {
          setStandaloneReports(prev => [{ ...reportBuilder, id: crypto.randomUUID(), createdAt: new Date().toISOString().slice(0, 10) }, ...prev]);
        }
      }
      setShowReportBuilder(false);
    };

    const deleteReport = (id) => {
      showConfirm("Are you sure you want to delete this expense report?", async () => {
        setStandaloneReports(prev => prev.filter(r => r.id !== id));
        if (user) await supabase.from("expense_reports").delete().eq("id", id).eq("user_id", user.id);
      });
    };

    const getReportExpenses = (report) => {
      if (report.reportType === "trip_cost") {
        // Trip cost report — pull from segment costs
        const segCosts = (report.selectedTripIds || []).flatMap(tripId => {
          const trip = trips.find(t => t.id === tripId);
          if (!trip?.segments) return [];
          return trip.segments.filter(s => !s._isMeta && (s.ticketPrice || s.totalCost || s.cost)).map(s => {
            const amount = parseFloat(s.ticketPrice || s.totalCost || s.cost || 0);
            const label = s.type === "flight" ? `${s.flightNumber || ""} ${s.route || "Flight"}`.trim()
              : s.type === "hotel" || s.type === "accommodation" ? s.property || "Hotel"
              : s.activityName || s.restaurantName || s.operator || s.company || s.loungeName || s.type || "Item";
            return { id: `seg_${tripId}_${s._id || label}`, description: label, amount, currency: s.currency || "USD", fxRate: 1, date: s.date || "", category: s.type, _fromSegment: true };
          });
        });
        const custom = (report.customExpenses || []).map(e => ({ ...e, tripId: null }));
        return [...segCosts, ...custom].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
      }
      // Reimbursement report — pull from expense inbox items
      const tripExps = expenses.filter(e => report.selectedTripIds.includes(e.tripId) && !report.excludedExpenseIds.includes(e.id));
      const custom = (report.customExpenses || []).map(e => ({ ...e, tripId: null }));
      return [...tripExps, ...custom].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    };

    const toggleTripId = (tripId) => setReportBuilder(p => ({
      ...p,
      selectedTripIds: p.selectedTripIds.includes(tripId) ? p.selectedTripIds.filter(id => id !== tripId) : [...p.selectedTripIds, tripId],
      excludedExpenseIds: p.excludedExpenseIds.filter(eid => !expenses.filter(e => e.tripId === tripId).map(e => e.id).includes(eid)),
    }));

    const toggleExpenseId = (expId) => setReportBuilder(p => ({
      ...p,
      excludedExpenseIds: p.excludedExpenseIds.includes(expId) ? p.excludedExpenseIds.filter(id => id !== expId) : [...p.excludedExpenseIds, expId],
    }));

    const addCustomExpense = () => {
      const parsed = { ...reportBuilderCustom, id: crypto.randomUUID(), amount: parseFloat(reportBuilderCustom.amount) || 0, fxRate: parseFloat(reportBuilderCustom.fxRate) || 1, receipt: false };
      setReportBuilder(p => ({ ...p, customExpenses: [...p.customExpenses, parsed] }));
      setReportBuilderCustom({ category: "flight", description: "", amount: "", currency: "USD", fxRate: 1, date: "", paymentMethod: "", notes: "" });
      setShowReportCustomExpense(false);
    };

    const removeCustomExpense = (id) => setReportBuilder(p => ({ ...p, customExpenses: p.customExpenses.filter(e => e.id !== id) }));

    // Live totals for builder preview
    // Reimbursement report: only expense inbox items assigned to trips
    const builderTripExps = expenses.filter(e => reportBuilder.selectedTripIds.includes(e.tripId) && !reportBuilder.excludedExpenseIds.includes(e.id));
    // Trip cost report: auto-generate from segment costs (flights, hotels, etc.)
    const builderSegmentCosts = reportBuilder.selectedTripIds.flatMap(tripId => {
      const trip = trips.find(t => t.id === tripId);
      if (!trip?.segments) return [];
      return trip.segments.filter(s => !s._isMeta && (s.ticketPrice || s.totalCost || s.cost)).map(s => {
        const amount = parseFloat(s.ticketPrice || s.totalCost || s.cost || 0);
        const label = s.type === "flight" ? `${s.flightNumber || ""} ${s.route || "Flight"}`.trim()
          : s.type === "hotel" || s.type === "accommodation" ? s.property || "Hotel"
          : s.activityName || s.restaurantName || s.operator || s.company || s.loungeName || s.type || "Item";
        return { id: `seg_${trip.id}_${s._id || label}`, description: label, amount, currency: s.currency || "USD", fxRate: 1, date: s.date || "", category: s.type, _fromSegment: true };
      });
    });
    // Report type determines what's included
    const isReimbursement = reportBuilder.reportType !== "trip_cost";
    const builderAllExps = isReimbursement
      ? [...builderTripExps, ...reportBuilder.customExpenses]
      : [...builderSegmentCosts, ...reportBuilder.customExpenses];
    const builderTotal = builderAllExps.reduce((s, e) => s + e.amount * (e.fxRate || 1), 0);

    const inputStyle = { display: "block", width: "100%", marginTop: 5, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: `1px solid ${css.border}`, borderRadius: 7, color: css.text, fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" };
    const labelStyle = { fontSize: 10, fontWeight: 600, color: css.text3, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" };

    return (
      <div>
        {/* Header */}
        <div className="c-a1" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>Finance</div>
            <h2 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: isMobile ? 26 : 32, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>Expense Reports</h2>
            <p style={{ color: css.text2, fontSize: 13, margin: "8px 0 0" }}>Build consolidated reports across multiple trips</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => openBuilder(null, "reimbursement")} style={{
              padding: "10px 16px", borderRadius: 8, border: "none", background: css.accent,
              color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>+ Reimbursement Report</button>
            <button onClick={() => openBuilder(null, "trip_cost")} style={{
              padding: "10px 16px", borderRadius: 8, border: `1px solid ${css.accent}`, background: "transparent",
              color: css.accent, fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>+ Trip Cost Report</button>
          </div>
        </div>

        {/* Saved reports list */}
        {standaloneReports.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: css.text3 }}>
            <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.4 }}>—</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: css.text2, marginBottom: 8 }}>No expense reports yet</div>
            <div style={{ fontSize: 13, color: css.text3, marginBottom: 20 }}>Create a report to combine expenses from multiple trips with custom line items</div>
            <button onClick={() => openBuilder()} style={{ background: "none", border: "none", color: css.accent, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Create your first report →</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {standaloneReports.map(report => {
              const exps = getReportExpenses(report);
              const total = exps.reduce((s, e) => s + e.amount * (e.fxRate || 1), 0);
              return (
                <div key={report.id} style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: isMobile ? "16px" : "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, color: css.text, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{report.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.04em", background: report.reportType === "trip_cost" ? "rgba(59,130,246,0.12)" : `${css.accent}15`, color: report.reportType === "trip_cost" ? "#3b82f6" : css.accent }}>{report.reportType === "trip_cost" ? "Trip Cost" : "Reimbursement"}</span>
                        <span style={{ fontSize: 10, color: css.text3 }}>{report.selectedTripIds.length} trip{report.selectedTripIds.length !== 1 ? "s" : ""} · {exps.length} items</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 800, color: css.gold, fontFamily: "'Geist Mono', monospace" }}>${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div style={{ fontSize: 9, color: css.text3 }}>USD</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={async () => { const html = await buildPrintReport(report.title, exps); openReportWindow(html, false); }} style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: css.accent, color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      View
                    </button>
                    <button onClick={async () => { const html = await buildPrintReport(report.title, exps); openReportWindow(html, true); }} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Print</button>
                    <button onClick={() => { setForwardReportId(report.id); setForwardEmail(""); setForwardStatus(""); }} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 10, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      Forward
                    </button>
                    <button onClick={() => openBuilder(report)} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                    <button onClick={() => deleteReport(report.id)} style={{ width: 24, height: 24, borderRadius: 8, border: `1px solid rgba(239,68,68,0.2)`, background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Report Builder Modal */}
        {showReportBuilder && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
            <div style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 14, padding: 28, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Title */}
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: css.text, margin: "0 0 4px", fontFamily: "'Inter Tight', Inter, sans-serif" }}>{editingReportId ? "Edit Report" : isReimbursement ? "New Reimbursement Report" : "New Trip Cost Report"}</h3>
                <p style={{ fontSize: 12, color: css.text3, margin: "0 0 16px" }}>{isReimbursement ? "Expense items you want to claim for reimbursement" : "Total costs from your trip itinerary (flights, hotels, etc.)"}</p>
                <label>
                  <span style={labelStyle}>Report Title</span>
                  <input value={reportBuilder.title} onChange={e => setReportBuilder(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Q1 2026 Business Expenses" style={inputStyle} />
                </label>
              </div>

              {/* Trip selector */}
              <div>
                <div style={{ ...labelStyle, display: "block", marginBottom: 10 }}>Select Trips to Include</div>
                {trips.length === 0 ? (
                  <div style={{ fontSize: 12, color: css.text3 }}>No trips added yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {trips.map(trip => {
                      const selected = reportBuilder.selectedTripIds.includes(trip.id);
                      const tripExps = expenses.filter(e => e.tripId === trip.id);
                      const excludedCount = reportBuilder.excludedExpenseIds.filter(eid => tripExps.some(e => e.id === eid)).length;
                      return (
                        <div key={trip.id}>
                          <div onClick={() => toggleTripId(trip.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: `1px solid ${selected ? css.accentBorder : css.border}`, background: selected ? css.accentBg : "transparent", cursor: "pointer" }}>
                            <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${selected ? css.accent : css.text3}`, background: selected ? css.accent : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {selected && <span style={{ fontSize: 10, color: "#fff", lineHeight: 1 }}>✓</span>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: css.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.tripName || trip.route || "Trip"}</div>
                              <div style={{ fontSize: 10, color: css.text3 }}>{trip.date} · {tripExps.length} expense{tripExps.length !== 1 ? "s" : ""}
                                {selected && excludedCount > 0 ? ` · ${excludedCount} excluded` : ""}
                              </div>
                            </div>
                          </div>

                          {/* Individual expense toggles when trip is selected */}
                          {selected && tripExps.length > 0 && (
                            <div style={{ marginLeft: 26, marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
                              {tripExps.map(exp => {
                                const excluded = reportBuilder.excludedExpenseIds.includes(exp.id);
                                const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                                return (
                                  <div key={exp.id} onClick={() => toggleExpenseId(exp.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, background: excluded ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.02)", cursor: "pointer", opacity: excluded ? 0.5 : 1 }}>
                                    <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${excluded ? "#ef4444" : css.text3}`, background: excluded ? "rgba(239,68,68,0.2)" : "transparent", flexShrink: 0 }} />
                                    <span style={{ fontSize: 12 }}>{cat?.icon}</span>
                                    <span style={{ fontSize: 12, color: css.text2, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description}</span>
                                    <span style={{ fontSize: 11, color: css.text3, fontFamily: "'Geist Mono', monospace", flexShrink: 0 }}>${(exp.amount * (exp.fxRate || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    <span style={{ fontSize: 10, color: excluded ? "#ef4444" : css.text3, flexShrink: 0 }}>{excluded ? "excluded" : "included"}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Custom expenses */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={labelStyle}>Custom Expenses (not tied to a trip)</span>
                  <button onClick={() => setShowReportCustomExpense(p => !p)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${css.accentBorder}`, background: css.accentBg, color: css.accent, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ Add</button>
                </div>

                {showReportCustomExpense && (
                  <div style={{ background: css.surface2, border: `1px solid ${css.border}`, borderRadius: 10, padding: 16, marginBottom: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <button key={cat.id} onClick={() => setReportBuilderCustom(p => ({ ...p, category: cat.id }))} style={{ padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: reportBuilderCustom.category === cat.id ? `${cat.color}25` : css.surface2, color: reportBuilderCustom.category === cat.id ? cat.color : css.text3 }}>{cat.icon} {cat.label}</button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <label style={{ flex: 2 }}><span style={labelStyle}>Description</span><input value={reportBuilderCustom.description} onChange={e => setReportBuilderCustom(p => ({ ...p, description: e.target.value }))} placeholder="Description" style={inputStyle} /></label>
                      <label style={{ flex: 1 }}><span style={labelStyle}>Amount</span><input type="number" min="0" step="0.01" value={reportBuilderCustom.amount} onChange={e => setReportBuilderCustom(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" style={inputStyle} /></label>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <label style={{ flex: 1 }}><span style={labelStyle}>Date</span><input type="date" value={reportBuilderCustom.date} onChange={e => setReportBuilderCustom(p => ({ ...p, date: e.target.value }))} style={inputStyle} /></label>
                      <label style={{ flex: 1 }}><span style={labelStyle}>Payment</span><input value={reportBuilderCustom.paymentMethod} onChange={e => setReportBuilderCustom(p => ({ ...p, paymentMethod: e.target.value }))} placeholder="Card, Cash…" style={inputStyle} /></label>
                    </div>
                    <label><span style={labelStyle}>Notes</span><input value={reportBuilderCustom.notes} onChange={e => setReportBuilderCustom(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" style={inputStyle} /></label>
                    <button onClick={addCustomExpense} disabled={!reportBuilderCustom.description || !reportBuilderCustom.amount} style={{ alignSelf: "flex-end", padding: "8px 18px", borderRadius: 8, border: "none", background: css.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Add Line Item</button>
                  </div>
                )}

                {reportBuilder.customExpenses.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {reportBuilder.customExpenses.map(exp => {
                      const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                      return (
                        <div key={exp.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, background: "rgba(255,255,255,0.03)", border: `1px solid ${css.border}` }}>
                          <span style={{ fontSize: 13 }}>{cat?.icon}</span>
                          <span style={{ flex: 1, fontSize: 12, color: css.text2 }}>{exp.description}</span>
                          <span style={{ fontSize: 12, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>{exp.date}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>${(exp.amount * (exp.fxRate || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <button onClick={() => removeCustomExpense(exp.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Running total with currency breakdown */}
              {builderAllExps.length > 0 && (() => {
                const byCurrency = {};
                builderAllExps.forEach(e => {
                  const cur = e.currency || "USD";
                  byCurrency[cur] = (byCurrency[cur] || 0) + (e.amount * (e.fxRate || 1));
                });
                const currencies = Object.entries(byCurrency).sort((a, b) => b[1] - a[1]);
                return (
                  <div style={{ background: css.accentBg, border: `1px solid ${css.accentBorder}`, borderRadius: 10, padding: "14px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: currencies.length > 1 ? 8 : 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: css.text2 }}>{builderAllExps.length} item{builderAllExps.length !== 1 ? "s" : ""}</div>
                      {currencies.length === 1 ? (
                        <div style={{ fontSize: 18, fontWeight: 800, color: css.accent, fontFamily: "'Geist Mono', monospace" }}>{currencies[0][1].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencies[0][0]}</div>
                      ) : (
                        <div style={{ fontSize: 13, fontWeight: 700, color: css.accent, fontFamily: "'Geist Mono', monospace" }}>Multi-currency</div>
                      )}
                    </div>
                    {currencies.length > 1 && (
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {currencies.map(([cur, amt]) => (
                          <div key={cur} style={{ fontSize: 12, fontWeight: 700, color: css.text2, fontFamily: "'Geist Mono', monospace" }}>
                            {amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ color: css.text3, fontWeight: 500 }}>{cur}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowReportBuilder(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={saveReport} disabled={!reportBuilder.title.trim() || builderAllExps.length === 0} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "none", background: !reportBuilder.title.trim() || builderAllExps.length === 0 ? css.surface2 : css.accent, color: !reportBuilder.title.trim() || builderAllExps.length === 0 ? css.text3 : "#fff", fontSize: 13, fontWeight: 700, cursor: !reportBuilder.title.trim() || builderAllExps.length === 0 ? "not-allowed" : "pointer" }}>Save Report</button>
                {builderAllExps.length > 0 && reportBuilder.title.trim() && (
                  <button onClick={async () => { await saveReport(); const html = await buildPrintReport(reportBuilder.title, builderAllExps); openReportWindow(html, true); }} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "none", background: "#1a3a2a", color: "#34d399", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🖨️ Save & Print</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Forward Report Modal */}
        {forwardReportId && (() => {
          const report = standaloneReports.find(r => r.id === forwardReportId);
          if (!report) return null;
          const exps = getReportExpenses(report);
          const total = exps.reduce((s, e) => s + e.amount * (e.fxRate || 1), 0);

          const handleForward = async () => {
            if (!forwardEmail.trim()) return;
            setForwardStatus("sending");
            const rows = exps.map(e => {
              const cat = EXPENSE_CATEGORIES.find(c => c.id === e.category);
              return `<tr style="border-bottom:1px solid #eee"><td style="padding:8px 12px;font-size:13px">${e.date || ""}</td><td style="padding:8px 12px;font-size:13px">${cat?.label || ""}</td><td style="padding:8px 12px;font-size:13px">${e.description || ""}</td><td style="padding:8px 12px;font-size:13px;text-align:right;font-family:monospace">$${(e.amount * (e.fxRate || 1)).toFixed(2)}</td><td style="padding:8px 12px;font-size:13px">${e.receipt ? "Yes" : "No"}</td></tr>`;
            }).join("");
            const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:700px;margin:0 auto"><div style="background:#D4742D;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0"><h1 style="margin:0;font-size:20px">${report.title.replace(/</g,"&lt;")}</h1><p style="margin:6px 0 0;font-size:13px;opacity:0.85">${exps.length} items · Sent from Continuum</p></div><div style="border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px"><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f8f8f8"><th style="padding:10px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase">Date</th><th style="padding:10px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase">Category</th><th style="padding:10px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase">Description</th><th style="padding:10px 12px;text-align:right;font-size:11px;color:#888;text-transform:uppercase">Amount</th><th style="padding:10px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase">Receipt</th></tr></thead><tbody>${rows}</tbody><tfoot><tr style="background:#f8f8f8;font-weight:700"><td colspan="3" style="padding:12px;font-size:14px">Total</td><td style="padding:12px;font-size:14px;text-align:right;font-family:monospace">$${total.toFixed(2)}</td><td></td></tr></tfoot></table></div><p style="font-size:11px;color:#999;margin-top:16px;text-align:center">Sent via <a href="https://gocontinuum.app" style="color:#D4742D">Continuum</a></p></div>`;
            try {
              const resp = await fetch("/api/forward-report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipientEmail: forwardEmail.trim(), reportTitle: report.title, reportHtml: html, senderName: user?.user_metadata?.first_name || "", senderEmail: user?.email || "" }),
              });
              const data = await resp.json();
              if (data.method === "mailto" || data.fallback) {
                const subject = encodeURIComponent(`Expense Report: ${report.title}`);
                const body = encodeURIComponent(`Expense Report: ${report.title}\n\nTotal: $${total.toFixed(2)}\nItems: ${exps.length}\n\n${exps.map(e => `${e.date || ""} - ${e.description || ""} - $${(e.amount*(e.fxRate||1)).toFixed(2)}`).join("\n")}\n\nSent from Continuum`);
                window.open(`mailto:${forwardEmail.trim()}?subject=${subject}&body=${body}`, "_self");
                setForwardStatus("sent");
              } else if (data.success) { setForwardStatus("sent"); }
              else { setForwardStatus("error"); }
            } catch { setForwardStatus("error"); }
          };

          return (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000, padding: 20 }}>
              <div onClick={e => e.stopPropagation()} style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 16, padding: "28px 24px", width: "100%", maxWidth: 440 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: css.text, margin: 0 }}>Forward Report</h3>
                  <button onClick={() => setForwardReportId(null)} style={{ width: 32, height: 32, border: "none", background: "transparent", color: css.text3, fontSize: 18, cursor: "pointer" }}>x</button>
                </div>
                <div style={{ background: css.surface2, borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: css.text }}>{report.title}</div>
                  <div style={{ fontSize: 12, color: css.text3, marginTop: 4 }}>{exps.length} expense{exps.length !== 1 ? "s" : ""} · ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD{exps.filter(e => e.receipt).length > 0 ? ` · ${exps.filter(e => e.receipt).length} receipt${exps.filter(e => e.receipt).length !== 1 ? "s" : ""}` : ""}</div>
                </div>
                {forwardStatus === "sent" ? (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: css.success, marginBottom: 4 }}>Report Sent</div>
                    <p style={{ fontSize: 13, color: css.text3 }}>Forwarded to {forwardEmail}</p>
                    <button onClick={() => setForwardReportId(null)} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 8, border: "none", background: css.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Done</button>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Recipient Email</label>
                      <input type="email" value={forwardEmail} onChange={e => setForwardEmail(e.target.value)} placeholder="finance@company.com" autoFocus
                        style={{ width: "100%", padding: "12px 14px", background: css.surface2, border: `1px solid ${css.border}`, borderRadius: 8, color: css.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <p style={{ fontSize: 11, color: css.text3, marginBottom: 16 }}>The full expense report with all line items and receipt indicators will be sent as a formatted email.</p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setForwardReportId(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                      <button onClick={handleForward} disabled={!forwardEmail.trim() || forwardStatus === "sending"} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "none", background: forwardEmail.trim() ? css.accent : css.surface2, color: forwardEmail.trim() ? "#fff" : css.text3, fontSize: 13, fontWeight: 700, cursor: forwardEmail.trim() ? "pointer" : "default", opacity: forwardStatus === "sending" ? 0.6 : 1 }}>
                        {forwardStatus === "sending" ? "Sending..." : "Send Report"}
                      </button>
                    </div>
                    {forwardStatus === "error" && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 8, textAlign: "center" }}>Failed to send. Please try again.</p>}
                  </>
                )}
              </div>
            </div>
          );
        })()}

      </div>
    );
  };

