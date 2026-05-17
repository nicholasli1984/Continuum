// Resolve which expense rows belong to a given report.
// Pure function; same logic used by the ExpenseReports page and by the
// "REPORTED" badge that points each expense back to its report(s).
//
// Two modes for reimbursement reports:
//   SNAPSHOT (preferred, set on save): report.includedExpenseIds is an
//     authoritative array of expense IDs. New expenses created after save
//     don't auto-join — fixes the user complaint that filed reports kept
//     silently growing.
//   LEGACY (fallback for rows created before the snapshot migration):
//     compute live from selectedTripIds + excludedExpenseIds. New expenses
//     on selected trips DO appear here — same as before.
export function getReportExpenses(report, trips, expenses) {
  if (!report) return [];
  if (report.reportType === "trip_cost") {
    const segCosts = (report.selectedTripIds || []).flatMap(tripId => {
      const trip = trips.find(t => t.id === tripId);
      if (!trip?.segments) return [];
      return trip.segments
        .filter(s => !s._isMeta && (s.ticketPrice || s.totalCost || s.cost))
        .map(s => {
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

  const custom = (report.customExpenses || []).map(e => ({ ...e, tripId: null }));

  // SNAPSHOT path
  if (Array.isArray(report.includedExpenseIds) && report.includedExpenseIds.length >= 0 && report.includedExpenseIds !== null) {
    // The array may be empty (a report with only custom_expenses); that's
    // valid — we still avoid the legacy live filter.
    const snapshotSet = new Set(report.includedExpenseIds);
    const snapshotExps = expenses.filter(e => snapshotSet.has(e.id));
    return [...snapshotExps, ...custom].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }

  // LEGACY path — kept for rows created before the snapshot migration.
  const tripExps = expenses.filter(e => (report.selectedTripIds || []).includes(e.tripId) && !(report.excludedExpenseIds || []).includes(e.id));
  const includedUnassigned = expenses.filter(e => !e.tripId && (report.includedUnassignedIds || []).includes(e.id));
  return [...tripExps, ...includedUnassigned, ...custom].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

// Returns Map<expenseId, report[]> for all reimbursement reports — the only
// kind that pulls from the real expense list. Trip-cost reports build line
// items from segments (synthetic IDs), so they never collide with real
// expense IDs and are skipped here.
//
// Mirrors getReportExpenses' two-mode logic: prefer the snapshot when
// present, fall back to the live filter for legacy rows.
export function buildExpenseReportMembership(standaloneReports, expenses) {
  const map = new Map();
  if (!Array.isArray(standaloneReports) || !Array.isArray(expenses)) return map;
  for (const r of standaloneReports) {
    if (r?.reportType === "trip_cost") continue;

    // Snapshot path — the report froze its membership at save time.
    if (Array.isArray(r?.includedExpenseIds)) {
      const snap = new Set(r.includedExpenseIds);
      for (const e of expenses) {
        if (!e?.id) continue;
        if (snap.has(e.id)) {
          const arr = map.get(e.id) || [];
          arr.push(r);
          map.set(e.id, arr);
        }
      }
      continue;
    }

    // Legacy live-filter path.
    const tripIds = new Set(r?.selectedTripIds || []);
    const excluded = new Set(r?.excludedExpenseIds || []);
    const includedUnassigned = new Set(r?.includedUnassignedIds || []);
    for (const e of expenses) {
      if (!e?.id) continue;
      const inTrip = e.tripId && tripIds.has(e.tripId) && !excluded.has(e.id);
      const inUnassigned = !e.tripId && includedUnassigned.has(e.id);
      if (inTrip || inUnassigned) {
        const arr = map.get(e.id) || [];
        arr.push(r);
        map.set(e.id, arr);
      }
    }
  }
  return map;
}
