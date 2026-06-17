import React, { useState } from "react";
import { apiFetch } from "../utils/apiBase";
import { expenseUSD, groupExpenseTotals, formatCurrencyAmount } from "../utils/expenseUsd";
import { getReportExpenses as getReportExpensesUtil } from "../utils/reportExpenses";
import { buildPrintReport as buildPrintReportUtil } from "../utils/buildPrintReport";
import ReportedBadge from "../components/ReportedBadge";
export function renderExpenseReports(s) {
  const { css, isMobile, darkMode, user, trips, expenses, setExpenses, allPrograms, supabase,
    standaloneReports, setStandaloneReports, showReportBuilder, setShowReportBuilder,
    reportBuilder, setReportBuilder, editingReportId, setEditingReportId,
    reportBuilderCustom, setReportBuilderCustom,
    forwardReportId, setForwardReportId, forwardEmail, setForwardEmail, forwardStatus, setForwardStatus, forwardError, setForwardError,
    EXPENSE_CATEGORIES, showConfirm,
    getTripExpenses, getTripTotal, getTripName, formatTripDates,
    showReportCustomExpense, setShowReportCustomExpense,
    setInlineReportHtml, expenseReportMembership, openReport } = s;

  // Free-tier monthly cap removed — every user can create unlimited reports.

  // Pass `supabase` so the util can hydrate any missing receipt_image blobs
  // (the main loadExpenses fetch deliberately omits them to avoid the Postgres
  // statement timeout — reports need them in one batch).
  const buildPrintReport = (title, expsForReport) =>
    buildPrintReportUtil({ title, expsForReport, trips, EXPENSE_CATEGORIES, supabase });


  // Render a buildPrintReport() HTML string into a base64-encoded PDF.
  // Used by Forward Report so the emailed PDF matches the in-app View Report
  // exactly — same logo, stat cards, category breakdown, line items, embedded
  // receipt pages. We render the HTML in an offscreen iframe, screenshot the
  // full body with html2canvas, then slice the canvas across PDF pages.
  const renderHtmlToPdfBase64 = async (html) => {
    const RENDER_WIDTH_PX = 1100; // matches the visual width of the in-app report
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = `position:fixed;top:0;left:-99999px;width:${RENDER_WIDTH_PX}px;height:200px;border:0;visibility:hidden;`;
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
    try {
      // Wait for iframe load, then for all images (logo + receipt data URLs).
      //
      // Two bugs to be defensive about:
      //  (a) An already-completed-but-failed image (complete=true,
      //      naturalHeight=0) used to fall into the else branch and wait
      //      forever for events that had already fired. Now we tick on any
      //      `complete` flag — success or fail, doesn't matter, the load
      //      attempt is done.
      //  (b) The overall timeout was 20s, which was tight for reports with
      //      several receipts (each a ~700KB JPEG data URL). Bump to 60s.
      // Also give each individual image a 6s safety so one stuck image
      // doesn't block the rest of the batch indefinitely.
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Report HTML load timeout (>60s) — too many large embedded receipts?")), 60000);
        iframe.onload = () => {
          const docEl = iframe.contentDocument;
          if (!docEl) { clearTimeout(timeout); return reject(new Error("Iframe document unavailable")); }
          const imgs = Array.from(docEl.images || []);
          if (imgs.length === 0) { clearTimeout(timeout); return resolve(); }
          let done = 0;
          const need = imgs.length;
          const tick = () => { done++; if (done >= need) { clearTimeout(timeout); resolve(); } };
          imgs.forEach(img => {
            if (img.complete) { tick(); return; }
            let perImg = setTimeout(() => { perImg = null; tick(); }, 6000);
            const handle = () => { if (perImg) { clearTimeout(perImg); perImg = null; tick(); } };
            img.onload = handle;
            img.onerror = handle;
          });
        };
      });
      const docEl = iframe.contentDocument;
      // Strip overlays/toolbars/floating buttons that shouldn't appear in the PDF
      docEl.querySelector("[data-report-toolbar]")?.remove();
      docEl.getElementById("fab-top")?.remove();
      docEl.querySelectorAll(".rcpt-back").forEach(el => el.remove());
      // Resize iframe so html2canvas captures full content
      const fullHeight = docEl.body.scrollHeight;
      iframe.style.height = fullHeight + "px";
      await new Promise(r => setTimeout(r, 150)); // let layout settle

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const scale = 1.5;
      // Capture clickable-link positions BEFORE we rasterise. The output
      // of html2canvas is just pixels — the <a href="#receipt-N"> jumps
      // in the source HTML lose their click behavior in the PDF unless
      // we layer real PDF link annotations on top.
      //
      // Strategy: for each .rcpt-link, measure its box in iframe coords
      // and remember which target receipt id it points to. After all
      // pages are added, walk the list, convert to per-page PDF coords,
      // and call pdf.link() to draw an invisible clickable region
      // pointing at the page that contains the receipt target.
      iframe.contentWindow.scrollTo(0, 0);
      const bodyRect = docEl.body.getBoundingClientRect();
      const targetTops = new Map();
      docEl.querySelectorAll('[id^="receipt-"]').forEach(el => {
        const r = el.getBoundingClientRect();
        targetTops.set(el.id, r.top - bodyRect.top);
      });
      const pendingLinks = [];
      docEl.querySelectorAll('a.rcpt-link[href^="#receipt-"]').forEach(a => {
        const targetId = a.getAttribute("href").slice(1);
        const targetTopPx = targetTops.get(targetId);
        if (targetTopPx == null) return;
        const r = a.getBoundingClientRect();
        // Some anchors wrap inline elements with zero extents — give them
        // at least 10x10 so they're actually tappable in a PDF reader.
        const w = Math.max(r.width, 10);
        const h = Math.max(r.height, 10);
        pendingLinks.push({
          x: r.left - bodyRect.left,
          y: r.top - bodyRect.top,
          w, h,
          targetTopPx,
        });
      });

      const canvas = await html2canvas(docEl.body, {
        backgroundColor: "#13111C",
        scale,
        useCORS: true,
        allowTaint: true,
        windowWidth: RENDER_WIDTH_PX,
        width: RENDER_WIDTH_PX,
        height: fullHeight,
        logging: false,
      });

      const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
      const pageWidthPt = pdf.internal.pageSize.getWidth();
      const pageHeightPt = pdf.internal.pageSize.getHeight();
      const pxToPt = pageWidthPt / canvas.width;
      const pageHeightPx = Math.floor(pageHeightPt / pxToPt);

      let y = 0;
      let pageIdx = 0;
      while (y < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - y);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceHeight;
        const ctx = slice.getContext("2d");
        ctx.fillStyle = "#13111C";
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, -y);
        if (pageIdx > 0) pdf.addPage();
        pdf.addImage(slice.toDataURL("image/jpeg", 0.85), "JPEG", 0, 0, pageWidthPt, sliceHeight * pxToPt);
        y += sliceHeight;
        pageIdx++;
      }

      // Add the link annotations now that all pages exist. For each link:
      //   sourcePage = which slice the anchor was rasterised on
      //   targetPage = which slice the receipt landed on
      // Per-page coords come from subtracting the page's canvas offset.
      // pdf.setPage(N) is 1-indexed; pdf.link(x, y, w, h, {pageNumber: N}).
      pendingLinks.forEach(link => {
        const cX = link.x * scale;
        const cY = link.y * scale;
        const cW = link.w * scale;
        const cH = link.h * scale;
        const sourcePage = Math.floor(cY / pageHeightPx);
        const yOnSourcePage = cY - sourcePage * pageHeightPx;
        const targetCanvasY = link.targetTopPx * scale;
        const targetPage = Math.floor(targetCanvasY / pageHeightPx);
        // Bail if any of these went out of bounds (shouldn't happen, but
        // we don't want a math glitch to throw and kill the entire send).
        if (sourcePage < 0 || sourcePage >= pageIdx) return;
        if (targetPage < 0 || targetPage >= pageIdx) return;
        try {
          pdf.setPage(sourcePage + 1);
          pdf.link(
            cX * pxToPt,
            yOnSourcePage * pxToPt,
            cW * pxToPt,
            cH * pxToPt,
            { pageNumber: targetPage + 1 }
          );
        } catch (e) {
          console.warn("[forward] link annotation failed for", link, e?.message);
        }
      });

      // jsPDF returns "data:application/pdf;base64,...."; strip the prefix.
      const dataUri = pdf.output("datauristring");
      return dataUri.split(",")[1] || "";
    } finally {
      try { document.body.removeChild(iframe); } catch {}
    }
  };

  // Detect standalone PWA (iOS home-screen / Android installed) — those modes
  // have no browser chrome, so a window.open new tab leaves the user stranded
  // with no back button. Render an in-app overlay instead.
  const isStandalonePWA = typeof window !== "undefined" && (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone === true
  );

  const openReportWindow = (html, autoPrint = false) => {
    if ((isMobile || isStandalonePWA) && setInlineReportHtml) {
      // Mobile / PWA: in-app overlay with its own back + print toolbar.
      // Strip the in-HTML toolbar (the overlay provides one).
      // Strip ONLY the report toolbar div (tagged with data-report-toolbar).
      // The toolbar contains <a>, <svg>, <button>, <svg> — no nested <div> —
      // so a lazy match up to the first </div> closes correctly. Other no-print
      // elements (FAB, receipt back-to-top pills) are <a>, not <div>, so they
      // don't get caught.
      const stripped = html.replace(/<div [^>]*data-report-toolbar="true"[^>]*>[\s\S]*?<\/div>/, "");
      setInlineReportHtml({ html: stripped, autoPrint });
      return;
    }
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
  const D = darkMode;
    const openBuilder = (report = null, type = "reimbursement") => {
      if (report) {
        setEditingReportId(report.id);
        setReportBuilder({ title: report.title, selectedTripIds: report.selectedTripIds, excludedExpenseIds: report.excludedExpenseIds, includedUnassignedIds: report.includedUnassignedIds || [], customExpenses: report.customExpenses, reportType: report.reportType || "reimbursement" });
      } else {
        setEditingReportId(null);
        setReportBuilder({ title: "", selectedTripIds: [], excludedExpenseIds: [], includedUnassignedIds: [], customExpenses: [], reportType: type });
      }
      setShowReportBuilder(true);
    };

    const saveReport = async () => {
      if (!reportBuilder.title.trim()) return;

      // Snapshot the resolved expense IDs at save time so a NEW expense
      // added later to one of selectedTripIds doesn't silently join this
      // report. Trip-cost reports use synthetic segment IDs that aren't real
      // expenses, so the snapshot is only meaningful for reimbursement
      // reports — for trip_cost we leave the field empty and the existing
      // dynamic logic handles it.
      const isReimbursement = (reportBuilder.reportType || "reimbursement") !== "trip_cost";
      const includedExpenseIds = isReimbursement
        ? [
            ...expenses
              .filter(e => (reportBuilder.selectedTripIds || []).includes(e.tripId) && !(reportBuilder.excludedExpenseIds || []).includes(e.id))
              .map(e => e.id),
            ...expenses
              .filter(e => !e.tripId && (reportBuilder.includedUnassignedIds || []).includes(e.id))
              .map(e => e.id),
          ]
        : [];

      const payload = {
        title: reportBuilder.title,
        selected_trip_ids: reportBuilder.selectedTripIds,
        excluded_expense_ids: reportBuilder.excludedExpenseIds,
        included_unassigned_expense_ids: reportBuilder.includedUnassignedIds || [],
        included_expense_ids: includedExpenseIds,
        custom_expenses: reportBuilder.customExpenses,
        updated_at: new Date().toISOString(),
      };
      // Mirror onto the local state object so the in-memory report reflects
      // the snapshot immediately, no need to refetch.
      const localStateExtras = { includedExpenseIds };
      if (editingReportId) {
        if (user) await supabase.from("expense_reports").update(payload).eq("id", editingReportId).eq("user_id", user.id);
        setStandaloneReports(prev => prev.map(r => r.id === editingReportId ? { ...r, ...reportBuilder, ...localStateExtras, id: editingReportId } : r));
      } else {
        if (user) {
          const { data, error } = await supabase.from("expense_reports").insert({ ...payload, user_id: user.id }).select().single();
          if (!error && data) {
            setStandaloneReports(prev => [{ ...reportBuilder, ...localStateExtras, id: data.id, createdAt: data.created_at?.slice(0, 10) }, ...prev]);
          }
        } else {
          setStandaloneReports(prev => [{ ...reportBuilder, ...localStateExtras, id: crypto.randomUUID(), createdAt: new Date().toISOString().slice(0, 10) }, ...prev]);
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

    // Lock = freeze the current set of expense IDs as the report's snapshot
    //        so new expenses on the report's trips don't silently join.
    // Unlock = clear the snapshot, falling back to the legacy live-filter
    //          behavior where any expense matching selectedTripIds joins.
    // Trip-cost reports use synthetic segment IDs that aren't real expenses,
    // so locking doesn't apply to them.
    const toggleReportLock = async (report) => {
      if (report.reportType === "trip_cost") return;
      const isLocked = Array.isArray(report.includedExpenseIds);
      const newSnapshot = isLocked
        ? null
        : [
            ...expenses
              .filter(e => (report.selectedTripIds || []).includes(e.tripId) && !(report.excludedExpenseIds || []).includes(e.id))
              .map(e => e.id),
            ...expenses
              .filter(e => !e.tripId && (report.includedUnassignedIds || []).includes(e.id))
              .map(e => e.id),
          ];
      if (user) {
        await supabase
          .from("expense_reports")
          .update({ included_expense_ids: newSnapshot, updated_at: new Date().toISOString() })
          .eq("id", report.id)
          .eq("user_id", user.id);
      }
      setStandaloneReports(prev => prev.map(r =>
        r.id === report.id ? { ...r, includedExpenseIds: newSnapshot } : r
      ));
    };

    const getReportExpenses = (report) => getReportExpensesUtil(report, trips, expenses);

    const toggleTripId = (tripId) => setReportBuilder(p => ({
      ...p,
      selectedTripIds: p.selectedTripIds.includes(tripId) ? p.selectedTripIds.filter(id => id !== tripId) : [...p.selectedTripIds, tripId],
      excludedExpenseIds: p.excludedExpenseIds.filter(eid => !expenses.filter(e => e.tripId === tripId).map(e => e.id).includes(eid)),
    }));

    const toggleExpenseId = (expId) => setReportBuilder(p => ({
      ...p,
      excludedExpenseIds: p.excludedExpenseIds.includes(expId) ? p.excludedExpenseIds.filter(id => id !== expId) : [...p.excludedExpenseIds, expId],
    }));

    const toggleUnassignedId = (expId) => setReportBuilder(p => {
      const current = p.includedUnassignedIds || [];
      return {
        ...p,
        includedUnassignedIds: current.includes(expId) ? current.filter(id => id !== expId) : [...current, expId],
      };
    });

    const addCustomExpense = () => {
      const parsed = { ...reportBuilderCustom, id: crypto.randomUUID(), amount: parseFloat(reportBuilderCustom.amount) || 0, fxRate: parseFloat(reportBuilderCustom.fxRate) || 1, receipt: false };
      setReportBuilder(p => ({ ...p, customExpenses: [...p.customExpenses, parsed] }));
      setReportBuilderCustom({ category: "flight", description: "", amount: "", currency: "USD", fxRate: 1, date: "", paymentMethod: "", notes: "" });
      setShowReportCustomExpense(false);
    };

    const removeCustomExpense = (id) => setReportBuilder(p => ({ ...p, customExpenses: p.customExpenses.filter(e => e.id !== id) }));

    // Live totals for builder preview
    // Reimbursement report: expense inbox items assigned to trips, plus any
    // unassigned/orphan inbox items the user opted to include
    const builderTripExps = expenses.filter(e => reportBuilder.selectedTripIds.includes(e.tripId) && !reportBuilder.excludedExpenseIds.includes(e.id));
    const builderIncludedUnassigned = expenses.filter(e => !e.tripId && (reportBuilder.includedUnassignedIds || []).includes(e.id));
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
      ? [...builderTripExps, ...builderIncludedUnassigned, ...reportBuilder.customExpenses]
      : [...builderSegmentCosts, ...reportBuilder.customExpenses];
    const builderTotal = builderAllExps.reduce((s, e) => s + expenseUSD(e), 0);

    const inputStyle = { display: "block", width: "100%", marginTop: 5, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: `1px solid ${css.border}`, borderRadius: 7, color: css.text, fontSize: 12, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" };
    const labelStyle = { fontSize: 10, fontWeight: 600, color: css.text3, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" };

    const dv = { serif: "'Fraunces', serif", sans: "'Inter Tight', sans-serif", mono: "'JetBrains Mono', monospace", cream: D ? "rgba(255,255,255,0.06)" : "#E2DCCE", taupe: D ? "#999" : "#6B6458", stone: D ? "#8a8a8a" : "#857A66", paper: D ? "#222" : "#fff", bone: D ? "#1a1a1a" : "#fff", moss: "#6B7A5A", gold: "#B8924A" };
    const totalAllExpenses = expenses.reduce((s, e) => s + expenseUSD(e), 0);
    const unfiledExpenses = expenses.filter(e => !e.tripId);
    const unfiledCount = unfiledExpenses.length;
    const unfiledTotal = unfiledExpenses.reduce((s, e) => s + expenseUSD(e), 0);
    const reportsTotal = standaloneReports.reduce((s, r) => { const exps = getReportExpenses(r); return s + exps.reduce((a, e) => a + expenseUSD(e), 0); }, 0);

    // Category allocation
    const catAlloc = EXPENSE_CATEGORIES.map(cat => ({
      ...cat,
      total: expenses.reduce((s, e) => s + (e.category === cat.id ? expenseUSD(e) : 0), 0),
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
    const catTotal = catAlloc.reduce((s, c) => s + c.total, 0);

    return (
      <div style={{ fontFamily: dv.sans, color: css.text }}>
        {/* Hero */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 0.9fr", gap: isMobile ? 24 : 48, paddingBottom: 32, borderBottom: `1px solid ${dv.cream}`, marginBottom: 32, alignItems: "end" }}>
          <div>
            <div style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: css.accent, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 1, background: css.accent }} /> The reimbursement desk
            </div>
            <h1 style={{ fontFamily: dv.serif, fontSize: isMobile ? 26 : "clamp(48px, 8vw, 96px)", fontWeight: 300, lineHeight: 0.94, letterSpacing: "-0.035em", margin: 0 }}>
              Spend it. File it. <em style={{ fontStyle: "italic", fontWeight: 400, color: css.accent }}>Forget it.</em>
            </h1>
          </div>
          <div style={{ paddingBottom: 8 }}>
            <p style={{ fontSize: 15, lineHeight: 1.55, color: dv.taupe, maxWidth: 400, margin: 0 }}>
              A clean ledger of what you've paid out, what you're owed, and what's still wandering through finance.
            </p>
          </div>
        </div>

        {/* ── Action bar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <button onClick={() => openBuilder(null, "reimbursement")} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", border: `1px solid ${dv.cream}`, background: dv.paper, color: css.text, cursor: "pointer", transition: "all 0.25s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = css.text; }} onMouseLeave={e => { e.currentTarget.style.borderColor = dv.cream; }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Reimbursement
          </button>
          <button onClick={() => openBuilder(null, "trip_cost")} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", border: `1px solid ${dv.cream}`, background: dv.paper, color: css.text, cursor: "pointer", transition: "all 0.25s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = css.text; }} onMouseLeave={e => { e.currentTarget.style.borderColor = dv.cream; }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="20" x2="6" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="14"/></svg>
            Trip Cost
          </button>
          <button onClick={() => openBuilder()} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: css.text, color: D ? "#15130F" : "#F4F1EC", border: `1px solid ${css.text}`, fontFamily: dv.serif, fontSize: 14, fontWeight: 400, cursor: "pointer", transition: "all 0.3s" }}
            onMouseEnter={e => { e.currentTarget.style.background = css.accent; e.currentTarget.style.borderColor = css.accent; }} onMouseLeave={e => { e.currentTarget.style.background = css.text; e.currentTarget.style.borderColor = css.text; }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Report
          </button>
        </div>

        {/* ── Metrics band ── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 0, background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, marginBottom: 32 }}>
          {[
            { lbl: "Total Spend · YTD", val: totalAllExpenses > 0 ? totalAllExpenses.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}) : "0", prefix: "USD ", sub: `Across ${expenses.length} expenses.` },
            { lbl: "Reports Filed", val: String(standaloneReports.length), sub: reportsTotal > 0 ? `$${reportsTotal.toLocaleString(undefined, {minimumFractionDigits: 0})} USD reported.` : "No reports yet." },
            { lbl: "Unfiled Receipts", val: String(unfiledCount), unit: "items", sub: unfiledCount > 0 ? "Awaiting assignment." : "All filed." },
            { lbl: "Categories", val: String(catAlloc.length), sub: catAlloc[0] ? `Top: ${catAlloc[0].label}.` : "No expenses yet." },
          ].map((m, i) => (
            <div key={i} style={{ padding: isMobile ? "20px 18px" : "24px 26px", borderRight: (!isMobile && i < 3) ? `1px solid ${dv.cream}` : "none", borderBottom: (isMobile && i < 2) ? `1px solid ${dv.cream}` : "none", position: "relative", overflow: "hidden" }}>
              <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 12 }}>{m.lbl}</div>
              <div style={{ fontFamily: dv.serif, fontSize: 34, fontWeight: 300, lineHeight: 1, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", color: css.text }}>
                {m.prefix && <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe, letterSpacing: "0.1em", marginRight: 3, verticalAlign: "0.3em", fontWeight: 500 }}>{m.prefix}</span>}
                {m.val}{m.unit && <span style={{ fontSize: 14, color: dv.taupe, fontStyle: "italic", marginLeft: 3 }}>{m.unit}</span>}
              </div>
              <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 12, color: dv.taupe, marginTop: 6 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Allocation bar ── */}
        {catTotal > 0 && (
          <div style={{ background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: isMobile ? 20 : 28, marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
              <div style={{ fontFamily: dv.serif, fontSize: 20, fontWeight: 400, letterSpacing: "-0.015em" }}>Allocation <em style={{ fontStyle: "italic", color: dv.taupe, fontSize: 14, marginLeft: 4 }}>— where the money went.</em></div>
              <div style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe }}>YTD · <strong style={{ color: css.text, fontWeight: 500 }}>USD {catTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></div>
            </div>
            <div style={{ height: 32, display: "flex", width: "100%", overflow: "hidden", border: `1px solid ${dv.cream}`, marginBottom: 16 }}>
              {catAlloc.map((c, i) => (
                <div key={c.id} style={{ flex: c.total, background: c.color || ["#15130F","#C8553D","#B8924A","#6B7A5A","#8BA3B8"][i % 5], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.08em", fontWeight: 500, color: "rgba(244,241,236,0.9)", overflow: "hidden", minWidth: 2, transition: "all 0.3s", cursor: "pointer" }}>
                  {(c.total / catTotal) > 0.12 && <>{c.label.toUpperCase()} <span style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 12, color: "rgba(244,241,236,0.8)", marginLeft: 6 }}>{((c.total / catTotal) * 100).toFixed(0)}%</span></>}
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : `repeat(${Math.min(catAlloc.length, 5)}, 1fr)`, gap: 16 }}>
              {catAlloc.slice(0, 5).map((c, i) => (
                <div key={c.id} style={{ display: "grid", gridTemplateColumns: "4px 1fr", gap: 10, padding: "8px 0", borderTop: `1px solid ${dv.cream}` }}>
                  <div style={{ width: 4, alignSelf: "stretch", background: c.color || ["#15130F","#C8553D","#B8924A","#6B7A5A","#8BA3B8"][i % 5] }} />
                  <div>
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 4 }}>{c.label} · {((c.total / catTotal) * 100).toFixed(0)}%</div>
                    <div style={{ fontFamily: dv.serif, fontSize: 16, fontWeight: 400, color: css.text, fontVariantNumeric: "tabular-nums" }}>
                      <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe, letterSpacing: "0.1em", marginRight: 2 }}>USD</span>{c.total.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Section separator ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "0 0 16px", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: dv.taupe }}>
          <div style={{ width: 28, height: 1, background: css.accent }} />
          <strong style={{ color: css.text, fontWeight: 500 }}>S 01 · Reports</strong>
          <span style={{ color: css.accent, background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: "2px 8px" }}>{String(standaloneReports.length)} entries</span>
          <div style={{ flex: 1, height: 1, background: dv.cream }} />
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
          <div style={{ background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, marginBottom: 32 }}>
            {standaloneReports.map((report, ri) => {
              const exps = getReportExpenses(report);
              // Split expenses into convertible (genuine USD or with an FX
              // rate) and unconverted foreign-currency rows. When any rows
              // are unconverted, surface them as their own subtotals beside
              // the USD figure so we don't lie about JPY = USD etc.
              const grouped = groupExpenseTotals(exps);
              const unconvertedCurrencies = Object.keys(grouped.byCurrency);
              return (
                <div key={report.id} style={{ borderBottom: ri < standaloneReports.length - 1 ? `1px solid ${dv.cream}` : "none", padding: isMobile ? "16px" : "18px 28px", transition: "background 0.3s" }}
                  onMouseEnter={e => e.currentTarget.style.background = dv.bone} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 16 : 18, fontWeight: 400, letterSpacing: "-0.01em", color: css.text, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{report.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.04em", background: report.reportType === "trip_cost" ? "rgba(59,130,246,0.12)" : `${css.accent}15`, color: report.reportType === "trip_cost" ? "#3b82f6" : css.accent }}>{report.reportType === "trip_cost" ? "Trip Cost" : "Reimbursement"}</span>
                        <span style={{ fontSize: 10, color: css.text3 }}>{report.selectedTripIds.length} trip{report.selectedTripIds.length !== 1 ? "s" : ""} · {exps.length} items</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {grouped.usd > 0 && (
                        <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 800, color: css.gold, fontFamily: "'Geist Mono', monospace" }}>
                          ${grouped.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                      {grouped.usd > 0 && <div style={{ fontSize: 11, color: css.text3 }}>USD</div>}
                      {unconvertedCurrencies.length > 0 && (
                        <div style={{ marginTop: grouped.usd > 0 ? 6 : 0, paddingTop: grouped.usd > 0 ? 6 : 0, borderTop: grouped.usd > 0 ? `1px solid ${dv.cream}` : "none", display: "flex", flexDirection: "column", gap: 2 }}>
                          {unconvertedCurrencies.map(cur => (
                            <div key={cur} style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, color: css.text2, fontFamily: "'Geist Mono', monospace", lineHeight: 1.2 }}>
                              {formatCurrencyAmount(grouped.byCurrency[cur], cur)}
                            </div>
                          ))}
                          <div style={{ fontSize: 10, color: css.text3, marginTop: 2 }} title="No USD conversion set on the foreign expense(s); add an FX rate on each one to roll them into the USD subtotal.">
                            Not converted to USD
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={async () => { const html = await buildPrintReport(report.title, exps); openReportWindow(html, false); }} style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: css.accent, color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      View
                    </button>
                    <button onClick={async () => { const html = await buildPrintReport(report.title, exps); openReportWindow(html, true); }} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Print</button>
                    <button onClick={() => { setForwardReportId(report.id); setForwardEmail(""); setForwardStatus(""); setForwardError(""); }} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 10, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      Forward
                    </button>
                    <button onClick={() => openBuilder(report)} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                    {/* Lock toggle — only meaningful for reimbursement reports.
                        Locked = snapshot frozen, no new expenses auto-attach.
                        Unlocked = live filter, expenses on trips in the report
                        keep joining as they're added. Default for all reports
                        is now LOCKED (the auto-lock backfill in App.jsx). */}
                    {report.reportType !== "trip_cost" && (() => {
                      const isLocked = Array.isArray(report.includedExpenseIds);
                      return (
                        <button
                          onClick={() => toggleReportLock(report)}
                          title={isLocked
                            ? "Unlock — new expenses on this report's trips will auto-attach again"
                            : "Lock — freeze this report so new expenses don't auto-attach"}
                          style={{
                            padding: "5px 10px", borderRadius: 8,
                            border: `1px solid ${isLocked ? "rgba(212,116,45,0.35)" : css.border}`,
                            background: isLocked ? "rgba(212,116,45,0.08)" : "transparent",
                            color: isLocked ? css.accent : css.text2,
                            fontSize: 10, fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 4,
                          }}
                        >
                          {isLocked ? (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <rect x="3" y="11" width="18" height="11" rx="2" />
                              <path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                          ) : (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <rect x="3" y="11" width="18" height="11" rx="2" />
                              <path d="M7 11V7a5 5 0 019.9-1" />
                            </svg>
                          )}
                          {isLocked ? "Locked" : "Unlocked"}
                        </button>
                      );
                    })()}
                    <button onClick={() => deleteReport(report.id)} style={{ width: 24, height: 24, borderRadius: 8, border: `1px solid rgba(200,85,61,0.2)`, background: "rgba(200,85,61,0.06)", color: "#C8553D", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Receipts Queue ── */}
        {unfiledExpenses.length > 0 && (
          <div style={{ background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: isMobile ? 20 : 28, marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 14, borderBottom: `1px solid ${dv.cream}`, marginBottom: 16 }}>
              <div style={{ fontFamily: dv.serif, fontSize: 20, fontWeight: 400, letterSpacing: "-0.015em" }}>
                Receipts Queue <em style={{ fontStyle: "italic", color: dv.taupe, fontSize: 14, marginLeft: 4 }}>· awaiting assignment</em>
              </div>
              <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe }}>
                <span style={{ display: "inline-block", width: 6, height: 6, background: css.accent, borderRadius: "50%", marginRight: 6, animation: "pulse 2s ease-in-out infinite" }} />
                Live
              </div>
            </div>
            {unfiledExpenses.map((exp, ei) => {
              const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
              return (
                <div key={exp.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 14, alignItems: "center", padding: "12px 0", borderBottom: ei < unfiledExpenses.length - 1 ? `1px solid ${dv.cream}` : "none" }}>
                  {/* Thumb */}
                  <div style={{ width: 36, height: 36, background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`, display: "grid", placeItems: "center", fontFamily: dv.serif, fontStyle: "italic", fontSize: 16, color: css.accent }}>
                    {(exp.description || exp.category || "E")[0].toUpperCase()}
                  </div>
                  {/* Info */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: dv.serif, fontSize: 14, color: css.text, lineHeight: 1.2, letterSpacing: "-0.005em" }}>{exp.description || "Unnamed expense"}</div>
                    <div style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.04em", marginTop: 2, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      {cat && <span style={{ padding: "1px 6px", background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>{cat.label}</span>}
                      <span>{exp.date || ""}</span>
                      <ReportedBadge reports={expenseReportMembership?.get(exp.id)} onOpen={openReport} compact />
                    </div>
                  </div>
                  {/* Amount */}
                  <div style={{ fontFamily: dv.serif, fontSize: 15, fontWeight: 400, color: css.text, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe, letterSpacing: "0.1em", marginRight: 2 }}>{exp.currency || "USD"}</span>
                    {(exp.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  {/* Assign to trip */}
                  <select onChange={async (e) => {
                    const tripId = e.target.value;
                    if (!tripId) return;
                    if (user) await supabase.from("expenses").update({ trip_id: tripId }).eq("id", exp.id).eq("user_id", user.id);
                    setExpenses(prev => prev.map(ex => ex.id === exp.id ? { ...ex, tripId } : ex));
                    e.target.value = "";
                  }} style={{ width: isMobile ? 100 : 130, padding: "6px 8px", border: `1px solid ${dv.cream}`, background: dv.bone, color: dv.taupe, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", cursor: "pointer", outline: "none", transition: "border-color 0.25s" }}
                    onFocus={e => e.currentTarget.style.borderColor = css.accent}
                    onBlur={e => e.currentTarget.style.borderColor = dv.cream}>
                    <option value="">Assign to trip...</option>
                    {trips.map(t => <option key={t.id} value={t.id}>{(t.tripName || t.trip_name || t.location || "Trip").slice(0, 30)}</option>)}
                  </select>
                </div>
              );
            })}
            <div style={{ paddingTop: 14, marginTop: 14, borderTop: `1px solid ${dv.cream}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe }}>
              <span>{unfiledExpenses.length} items · ${unfiledTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
              <button onClick={() => openBuilder()} style={{ color: css.accent, background: "none", border: "none", cursor: "pointer", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 6, transition: "gap 0.25s" }}
                onMouseEnter={e => e.currentTarget.style.gap = "10px"} onMouseLeave={e => e.currentTarget.style.gap = "6px"}>
                File all into report &#8594;
              </button>
            </div>
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
                <div style={{ ...labelStyle, display: "block", marginBottom: 10 }}>Trips to Include (optional)</div>
                {trips.length === 0 ? (
                  <div style={{ fontSize: 12, color: css.text3 }}>No trips yet — you can still build a report from unassigned receipts below.</div>
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
                                const otherReports = (expenseReportMembership?.get(exp.id) || []).filter(r => r.id !== editingReportId);
                                return (
                                  <div key={exp.id} onClick={() => toggleExpenseId(exp.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, background: excluded ? "rgba(200,85,61,0.05)" : "rgba(255,255,255,0.02)", cursor: "pointer", opacity: excluded ? 0.5 : 1, flexWrap: "wrap" }}>
                                    <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${excluded ? "#C8553D" : css.text3}`, background: excluded ? "rgba(200,85,61,0.2)" : "transparent", flexShrink: 0 }} />
                                    <span style={{ fontSize: 12 }}>{cat?.icon}</span>
                                    <span style={{ fontSize: 12, color: css.text2, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{exp.description}</span>
                                    {otherReports.length > 0 && <ReportedBadge reports={otherReports} onOpen={openReport} compact />}
                                    <span style={{ fontSize: 11, color: css.text3, fontFamily: "'Geist Mono', monospace", flexShrink: 0 }}>${(expenseUSD(exp)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    {/* "→ Inbox" button — unassigns the expense from the trip so it
                                        naturally drops from the report's auto-included set and reappears
                                        under Unassigned Receipts below. The expense row itself is
                                        preserved (amount, receipt, notes, etc.) so the user can re-file
                                        it later from the Inbox or from the Expense detail's "Transfer
                                        to Another Trip" dropdown. stopPropagation so the surrounding
                                        row click (which toggles exclude) doesn't also fire. */}
                                    <button
                                      type="button"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        const expId = exp.id;
                                        setExpenses(prev => prev.map(x => x.id === expId ? { ...x, tripId: null } : x));
                                        if (user) {
                                          const { error } = await supabase.from("expenses").update({ trip_id: null }).eq("id", expId).eq("user_id", user.id);
                                          if (error) {
                                            console.error("Send to Inbox failed:", error);
                                            alert(`Couldn't move the expense to Inbox: ${error.message || "unknown error"}.`);
                                            // Roll back the optimistic state on failure.
                                            setExpenses(prev => prev.map(x => x.id === expId ? { ...x, tripId: trip.id } : x));
                                          }
                                        }
                                      }}
                                      title="Send to Inbox — unassigns from this trip and removes from the report"
                                      style={{ padding: "3px 8px", borderRadius: 5, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 9, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
                                    >
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                                        <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
                                      </svg>
                                      Inbox
                                    </button>
                                    <span style={{ fontSize: 10, color: excluded ? "#C8553D" : css.text3, flexShrink: 0 }}>{excluded ? "excluded" : "included"}</span>
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

              {/* Unassigned receipts (orphan inbox items) */}
              {isReimbursement && unfiledExpenses.length > 0 && (
                <div>
                  <div style={{ ...labelStyle, display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
                    <span>Unassigned Receipts (from inbox)</span>
                    <span style={{ textTransform: "none", letterSpacing: 0, fontSize: 10, fontWeight: 400, color: css.text3 }}>
                      {(reportBuilder.includedUnassignedIds || []).length} of {unfiledExpenses.length} included
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 12px", borderRadius: 8, border: `1px solid ${css.border}`, background: "rgba(255,255,255,0.02)" }}>
                    {unfiledExpenses.map(exp => {
                      const included = (reportBuilder.includedUnassignedIds || []).includes(exp.id);
                      const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                      const otherReports = (expenseReportMembership?.get(exp.id) || []).filter(r => r.id !== editingReportId);
                      return (
                        <div key={exp.id} onClick={() => toggleUnassignedId(exp.id)} style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6,
                          background: included ? css.accentBg : "transparent",
                          border: `1px solid ${included ? css.accentBorder : "transparent"}`,
                          cursor: "pointer", transition: "background 0.15s", flexWrap: "wrap",
                        }}>
                          <div style={{
                            width: 14, height: 14, borderRadius: 3,
                            border: `2px solid ${included ? css.accent : css.text3}`,
                            background: included ? css.accent : "transparent",
                            flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {included && <span style={{ fontSize: 9, color: "#fff", lineHeight: 1 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 12 }}>{cat?.icon}</span>
                          <span style={{ fontSize: 12, color: css.text2, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{exp.description || "(no description)"}</span>
                          {otherReports.length > 0 && <ReportedBadge reports={otherReports} onOpen={openReport} compact />}
                          <span style={{ fontSize: 11, color: css.text3, fontFamily: "'Geist Mono', monospace", flexShrink: 0 }}>{exp.date || ""}</span>
                          <span style={{ fontSize: 11, color: css.text3, fontFamily: "'Geist Mono', monospace", flexShrink: 0 }}>${(expenseUSD(exp)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                          <span style={{ fontSize: 12, fontWeight: 700, color: css.text, fontFamily: "'Geist Mono', monospace" }}>${(expenseUSD(exp)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <button onClick={() => removeCustomExpense(exp.id)} style={{ background: "none", border: "none", color: "#C8553D", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>×</button>
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
                  byCurrency[cur] = (byCurrency[cur] || 0) + expenseUSD(e);
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
          const total = exps.reduce((s, e) => s + expenseUSD(e), 0);

          const handleForward = async () => {
            if (!forwardEmail.trim()) return;
            setForwardStatus("sending");
            setForwardError("");
            try {
              // Build the same HTML the in-app View Report uses, then render
              // it to a PDF on the client. This guarantees the recipient gets
              // exactly what the user sees in Continuum (logo, stat cards,
              // category breakdown, line items, embedded receipts).
              const html = await buildPrintReport(report.title, exps);
              const pdfBase64 = await renderHtmlToPdfBase64(html);
              const resp = await apiFetch("/api/forward-report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  recipientEmail: forwardEmail.trim(),
                  reportTitle: report.title,
                  senderName: user?.user_metadata?.first_name || "",
                  senderEmail: user?.email || "",
                  itemCount: exps.length,
                  totalUsd: total,
                  pdfBase64,
                }),
              });
              const data = await resp.json().catch(() => ({}));
              if (resp.ok && data.success) {
                setForwardStatus("sent");
              } else {
                setForwardStatus("error");
                setForwardError(data?.error || `Send failed (${resp.status})`);
              }
            } catch (err) {
              setForwardStatus("error");
              setForwardError(err?.message || "Failed to generate PDF");
              console.error("[forward] error:", err);
            }
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
                    <p style={{ fontSize: 11, color: css.text3, marginBottom: 16 }}>The report will be emailed to this address as a PDF attachment.</p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setForwardReportId(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: `1px solid ${css.border}`, background: "transparent", color: css.text2, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                      <button onClick={handleForward} disabled={!forwardEmail.trim() || forwardStatus === "sending"} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "none", background: forwardEmail.trim() ? css.accent : css.surface2, color: forwardEmail.trim() ? "#fff" : css.text3, fontSize: 13, fontWeight: 700, cursor: forwardEmail.trim() ? "pointer" : "default", opacity: forwardStatus === "sending" ? 0.6 : 1 }}>
                        {forwardStatus === "sending" ? "Sending..." : "Send Report"}
                      </button>
                    </div>
                    {forwardStatus === "error" && (
                      <p style={{ fontSize: 11, color: "#C8553D", marginTop: 12, textAlign: "center", lineHeight: 1.5 }}>
                        {forwardError || "Failed to send. Please try again."}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })()}

      </div>
    );
  };

