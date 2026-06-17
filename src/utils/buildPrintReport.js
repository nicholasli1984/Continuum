import { expenseUSD, groupExpenseTotals, formatCurrencyAmount } from "./expenseUsd";
import { renderPdfToImages } from "./pdfRender";

// Returns the dark-themed HTML report (logo + stat cards + category bars
// + line items + embedded receipt pages) used by both the in-app View and
// the emailed PDF. Pure: no DOM mutation, no React. Caller passes trips +
// EXPENSE_CATEGORIES so this util can stay independent of any page.
export async function buildPrintReport({ title, expsForReport, trips, EXPENSE_CATEGORIES, supabase }) {
  // The main loadExpenses excludes receipt_image to keep the Supabase query
  // under its statement timeout — receipts are normally lazy-loaded when a
  // user opens an expense. For a report, we need every receipt blob in one go,
  // so hydrate any that aren't already in memory. Callers should pass the
  // supabase client; if they don't, we render whatever we have.
  if (supabase && expsForReport && expsForReport.length) {
    const needIds = expsForReport.filter(e => e?.receipt && !e?.receiptImage).map(e => e.id);
    if (needIds.length) {
      try {
        const { data } = await supabase.from("expenses").select("id, receipt_image").in("id", needIds);
        const byId = Object.fromEntries((data || []).map(r => [r.id, r.receipt_image]));
        expsForReport = expsForReport.map(e =>
          !e.receiptImage && byId[e.id] ? { ...e, receiptImage: byId[e.id] } : e
        );
      } catch { /* fall through with whatever we have */ }
    }
  }
  const CURRENCY_SYMBOLS = { USD:"$",EUR:"€",GBP:"£",CAD:"CA$",AUD:"A$",JPY:"¥",CHF:"Fr",CNY:"¥",HKD:"HK$",SGD:"S$",MXN:"MX$",BRL:"R$",INR:"₹",KRW:"₩",AED:"د.إ",THB:"฿",NOK:"kr",SEK:"kr",DKK:"kr",NZD:"NZ$" };
  const symFor = (cur) => CURRENCY_SYMBOLS[cur] || (cur + " ");
  const fmtAmt = (n, cur) => n === 0 ? "Free" : `${symFor(cur)}${n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  // Defensive HTML escape — user-entered descriptions / notes / item names
  // get interpolated into the report; a stray < or & would break the markup
  // (or worse if the report is ever forwarded as raw HTML in an email).
  const escapeHtml = (s) => String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  const toUSD = (e) => expenseUSD(e);
  // Split into convertible (genuine USD or with FX rate) vs unconverted
  // foreign-currency totals so the printed report doesn't claim
  // ¥10,000 = $10,000. `tripTotalUSD` stays for category percentages
  // (where unconverted rows just contribute 0 to the USD denominator —
  // the category bars are visualising USD share, not raw amounts).
  const grouped = groupExpenseTotals(expsForReport);
  const tripTotalUSD = grouped.usd;
  const unconvertedCurrencies = Object.keys(grouped.byCurrency);
  // HTML fragment used in two places (header stat card + table footer).
  // Each unconverted currency renders on its own line with the right number
  // of decimal places for the currency.
  const unconvertedBlock = unconvertedCurrencies.length
    ? unconvertedCurrencies.map(cur =>
        `<div style="font-size:13px;font-weight:700;color:#fbbf24;">${formatCurrencyAmount(grouped.byCurrency[cur], cur)}</div>`
      ).join("")
    : "";
  const unconvertedFootnote = unconvertedCurrencies.length
    ? `<div style="font-size:9px;color:#8a8f98;margin-top:4px;">${unconvertedCurrencies.length === 1 ? unconvertedCurrencies[0] : "Foreign"} not converted — add FX rate on each item to roll into USD</div>`
    : "";
  const receiptCount = expsForReport.filter(e => e.receipt).length;
  const catSummary = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    totalUSD: expsForReport.filter(e => e.category === cat.id).reduce((s,e) => s + toUSD(e), 0),
    count: expsForReport.filter(e => e.category === cat.id).length,
  })).filter(c => c.totalUSD > 0);
  // Build the list of receipt "pages" the report will embed. For image
  // receipts that's one entry per expense. For PDF receipts we render
  // every source page to its own PNG via pdf.js and emit one entry per
  // source page, so a 3-page hotel folio becomes 3 receipt pages in the
  // report. Previously every receipt — image or PDF — was dumped into a
  // single <img src="data:..."> tag, and PDF data URLs don't render in
  // <img> elements; receipts came out blank intermittently because the
  // browser would sometimes try to render the PDF via internal viewer
  // (first view) and refuse on subsequent views.
  //
  // Each entry: { exp, imageSrc, pageNum?, totalPages?, _isPdfPage? }
  //   exp        — source expense row (carries category, description, etc.)
  //   imageSrc   — data URL of the image to embed
  //   pageNum    — 1-based source-PDF page (only for PDF entries)
  //   totalPages — total PDF page count (only for PDF entries)
  const sourceReceipts = expsForReport.filter(e => e.receiptImage?.data);
  const expensesWithReceipts = [];
  for (const exp of sourceReceipts) {
    const type = exp.receiptImage.type || "";
    const data = exp.receiptImage.data;
    const isPdf = type === "application/pdf" || (typeof data === "string" && data.startsWith("data:application/pdf"));
    if (!isPdf) {
      expensesWithReceipts.push({ exp, imageSrc: data });
      continue;
    }
    try {
      const pages = await renderPdfToImages(data, { scale: 2 });
      if (pages.length === 0) continue;
      pages.forEach((pg, pi) => {
        expensesWithReceipts.push({
          exp,
          imageSrc: pg.dataUrl,
          pageNum: pi + 1,
          totalPages: pages.length,
          _isPdfPage: true,
        });
      });
    } catch (e) {
      console.warn("[buildPrintReport] PDF→images failed for", exp.id, e?.message);
      // Skip this receipt entirely rather than emit an unviewable PDF data URL.
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
    // expensesWithReceipts is now { exp, imageSrc, ... }; the line-item
    // jump should land on the FIRST page of this expense's receipt
    // (multi-page PDF receipts get N consecutive entries, all sharing
    // the same exp.id — findIndex naturally returns the first).
    const receiptIdx = expensesWithReceipts.findIndex(r => r.exp.id === exp.id);
    const hasReceipt = receiptIdx >= 0;
    const amountInner = `<div style="font-size:13px;font-weight:700;color:${exp.amount===0?"#34d399":"#fff"};">${fmtAmt(exp.amount,cur)}</div>${isForeign?`<div style="font-size:10px;color:#62666d;">$${usdAmt.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} USD</div>`:""}`;
    const amountCell = hasReceipt
      ? `<a href="#receipt-${receiptIdx}" class="rcpt-link" title="Jump to receipt">${amountInner}</a>`
      : amountInner;
    // Itemized rows — when an expense has sub-line-items (restaurant
    // breakdown, grocery split, etc.), render each one as an indented
    // sibling row directly under the parent so the reader sees how the
    // total was composed. The parent row keeps the rolled-up total in
    // the Amount column; child rows show their own amount in the parent
    // currency. The child rows DON'T sum into the totals/footer — that
    // would double-count, since the parent already has the rolled-up
    // total. Receipt cell on children is blank.
    const items = Array.isArray(exp.items) ? exp.items : [];
    const itemRows = items.map((it, ii) => {
      const itemAmt = Number(it.amount) || 0;
      const isLastItem = ii === items.length - 1;
      const childBorder = isLastItem ? "1px solid #2a2640" : "1px solid rgba(42,38,64,0.5)";
      return `<tr style="background:rgba(255,255,255,0.018);">
        <td style="padding:7px 14px 7px 30px;border-bottom:${childBorder};vertical-align:top;">
          <div style="display:flex;align-items:baseline;gap:8px;">
            <span style="color:#62666d;font-size:11px;font-family:'JetBrains Mono','SF Mono',monospace;">└</span>
            <span style="font-size:12px;color:#d0d6e0;">${escapeHtml(it.description || `Item ${ii + 1}`)}</span>
          </div>
        </td>
        <td style="padding:7px 14px;border-bottom:${childBorder};"></td>
        <td style="padding:7px 14px;border-bottom:${childBorder};"></td>
        <td style="padding:7px 14px;border-bottom:${childBorder};text-align:right;font-size:12px;font-family:'Geist Mono',monospace;color:#d0d6e0;">${fmtAmt(itemAmt, cur)}</td>
        <td style="padding:7px 14px;border-bottom:${childBorder};"></td>
      </tr>`;
    }).join("");
    const rowBorder = items.length ? "1px solid rgba(42,38,64,0.4)" : "1px solid #2a2640";
    const catLabel = cat?.label ? escapeHtml(cat.label) : "Uncategorized";
    const catColor = cat?.color || "#8a8f98";
    // Category pill uses the category's own colour at low alpha so the
    // column reads as a coloured tag rather than another wall of text. Plain
    // text fallback if no category matches the row (legacy/imported rows).
    const categoryCell = cat
      ? `<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:${catColor};background:${catColor}1A;border:1px solid ${catColor}33;padding:2px 8px;border-radius:4px;white-space:nowrap;"><span style="font-size:12px;line-height:1;">${cat.icon || ""}</span>${catLabel}</span>`
      : `<span style="font-size:11px;color:#62666d;">${catLabel}</span>`;
    return `<tr>
      <td style="padding:10px 14px;border-bottom:${rowBorder};vertical-align:top;">
        <div style="font-size:13px;color:#f7f8f8;">${escapeHtml(exp.description || "")}</div>
        <div style="font-size:10px;color:#62666d;margin-top:2px;">${escapeHtml(tripName)}${exp.notes ? " · " + escapeHtml(exp.notes) : ""}${items.length ? ` · ${items.length} item${items.length === 1 ? "" : "s"}` : ""}</div>
      </td>
      <td style="padding:10px 14px;border-bottom:${rowBorder};vertical-align:top;">${categoryCell}</td>
      <td style="padding:10px 14px;border-bottom:${rowBorder};font-size:12px;color:#8a8f98;white-space:nowrap;">${exp.date?.slice(5)||""}</td>
      <td style="padding:10px 14px;border-bottom:${rowBorder};text-align:right;">${amountCell}</td>
      <td style="padding:10px 14px;border-bottom:${rowBorder};text-align:center;font-size:13px;color:${exp.receipt?"#34d399":"#62666d"};">
        ${hasReceipt?`<a href="#receipt-${receiptIdx}" class="rcpt-link" style="color:#0EA5A0;font-size:10px;">p.${receiptIdx+2}</a>`:(exp.receipt?"✓":"—")}
      </td>
    </tr>${itemRows}`;
  }).join("");

  const receiptPages = expensesWithReceipts.map((entry, i) => {
    const exp = entry.exp;
    const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
    const cur = exp.currency || "USD";
    const src = entry.imageSrc;
    const headerTitle = exp.description || cat?.label || "Receipt";
    const amountStr = (exp.amount == null || isNaN(Number(exp.amount))) ? "" : fmtAmt(Number(exp.amount), cur);
    const subtextPieces = [exp.date || "", amountStr].filter(Boolean);
    const subtext = subtextPieces.join(" · ");
    // Multi-page PDF receipts append " · Page N of M" to the label so the
    // reader can see how the folio is split across consecutive pages.
    const pageSuffix = entry._isPdfPage && entry.totalPages > 1
      ? `  ·  Page ${entry.pageNum} of ${entry.totalPages}`
      : "";
    return `
      <div id="receipt-${i}" style="page-break-before:always;padding:48px;background:#13111C;min-height:100vh;box-sizing:border-box;scroll-margin-top:64px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:16px;">
          <div style="color:#8a8f98;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;">Receipt ${i+1} of ${expensesWithReceipts.length}${pageSuffix}</div>
          <a href="#report-top" class="rcpt-back no-print" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.04);color:#f7f8f8;font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;font-family:'JetBrains Mono','SF Mono',monospace;">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            Back to top
          </a>
        </div>
        <div style="font-size:16px;font-weight:700;color:#f7f8f8;margin-bottom:4px;">${cat?.icon||""} ${escapeHtml(headerTitle)}</div>
        <div style="font-size:12px;color:#8a8f98;margin-bottom:32px;">${escapeHtml(subtext)}</div>
        <img src="${src}" alt="Receipt" style="width:100%;border-radius:8px;border:1px solid #2a2640;display:block;" />
      </div>
    `;
  }).join("");

  const continuumOrigin = typeof window !== "undefined" ? window.location.origin : "https://gocontinuum.app";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#13111C;color:#f7f8f8;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}@media print{body{background:#13111C!important;}@page{margin:16mm 18mm;size:A4;}.no-print{display:none!important;}}table{border-collapse:collapse;width:100%;}.toolbar-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:6px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:#f7f8f8;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;font-family:'JetBrains Mono','SF Mono',monospace;cursor:pointer;text-decoration:none;transition:all 0.15s;}.toolbar-btn:hover{background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.2);}.toolbar-btn.primary{background:#C8553D;border-color:#C8553D;}.toolbar-btn.primary:hover{background:#b54a35;border-color:#b54a35;}.rcpt-link{text-decoration:none;color:inherit;display:inline-block;border-radius:4px;padding:2px 4px;margin:-2px -4px;transition:background 0.15s;}.rcpt-link:hover{background:rgba(14,165,160,0.12);}.rcpt-link:hover>div:first-child{color:#0EA5A0!important;}.rcpt-back:hover{background:rgba(255,255,255,0.10)!important;border-color:rgba(255,255,255,0.24)!important;}.fab-top{position:fixed;right:24px;bottom:24px;z-index:9998;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,0.14);background:rgba(15,13,15,0.92);backdrop-filter:blur(8px);color:#f7f8f8;display:none;align-items:center;justify-content:center;cursor:pointer;text-decoration:none;box-shadow:0 8px 24px rgba(0,0,0,0.5);transition:all 0.15s;}.fab-top:hover{background:rgba(200,85,61,0.95);border-color:#C8553D;}.fab-top.visible{display:flex;}@media print{.fab-top{display:none!important;}}</style>
  </head><body>
    <div class="no-print" data-report-toolbar="true" style="position:sticky;top:0;left:0;right:0;z-index:9999;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:rgba(15,13,15,0.95);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,0.08);">
      <a href="${continuumOrigin}" onclick="event.preventDefault();try{window.close();}catch(e){}setTimeout(function(){if(!window.closed){window.location.href='${continuumOrigin}';}},120);" class="toolbar-btn">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Continuum
      </a>
      <button onclick="window.print();" class="toolbar-btn primary">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Print
      </button>
    </div>
    <div id="report-top" style="padding:48px 48px 40px;background:#13111C;min-height:100vh;scroll-margin-top:64px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;">
        <div>
          <img src="${continuumOrigin}/continuum-travel-logo.svg" alt="Continuum" style="height:80px;display:block;margin-bottom:12px;" />
          <div style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;">${title}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;color:#8a8f98;">Generated ${new Date().toLocaleDateString()}</div>
          <div style="font-size:11px;color:#62666d;">Report #${Date.now().toString(36).slice(-6)}</div>
          <div style="margin-top:6px;font-size:11px;font-weight:700;color:#0EA5A0;">Total in USD</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:28px;">
        <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:16px;text-align:center;"><div style="font-size:22px;font-weight:800;color:#0EA5A0;">$${tripTotalUSD.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div style="font-size:10px;color:#8a8f98;margin-top:4px;">Total (USD)</div>${unconvertedBlock?`<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);">${unconvertedBlock}${unconvertedFootnote}</div>`:""}</div>
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
              <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Category</th>
              <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Date</th>
              <th style="padding:10px 14px;text-align:right;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Amount</th>
              <th style="padding:10px 14px;text-align:center;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Rcpt</th>
            </tr></thead>
            <tbody>${lineRows}</tbody>
            <tfoot><tr style="background:rgba(14,165,160,0.08);">
              <td colspan="3" style="padding:14px;font-size:13px;font-weight:700;color:#0EA5A0;border-top:2px solid rgba(14,165,160,0.3);">TOTAL (USD)</td>
              <td style="padding:14px;text-align:right;font-size:15px;font-weight:800;color:#0EA5A0;border-top:2px solid rgba(14,165,160,0.3);">$${tripTotalUSD.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
              <td style="border-top:2px solid rgba(14,165,160,0.3);"></td>
            </tr>${unconvertedCurrencies.map(cur => `<tr style="background:rgba(251,191,36,0.06);"><td colspan="3" style="padding:10px 14px;font-size:11px;font-weight:700;color:#fbbf24;">TOTAL (${cur}) — not converted</td><td style="padding:10px 14px;text-align:right;font-size:13px;font-weight:800;color:#fbbf24;">${formatCurrencyAmount(grouped.byCurrency[cur], cur)}</td><td></td></tr>`).join("")}</tfoot>
          </table>
        </div>
      </div>
      <div style="text-align:center;color:#62666d;font-size:10px;border-top:1px solid #2a2640;padding-top:16px;">
        Generated by Continuum — Elevate Every Journey · ${new Date().toLocaleString()}${expensesWithReceipts.length>0?` · ${expensesWithReceipts.length} receipt${expensesWithReceipts.length!==1?"s":""} attached`:""}
      </div>
    </div>
    ${receiptPages}
    <a href="#report-top" id="fab-top" class="fab-top no-print" title="Back to top" aria-label="Back to top">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
    </a>
    <script>(function(){
      document.addEventListener('click', function(e){
        var a = e.target && e.target.closest && e.target.closest('a[href^="#"]');
        if (!a) return;
        var id = a.getAttribute('href').slice(1);
        e.preventDefault();
        if (!id) { window.scrollTo(0, 0); return; }
        var t = document.getElementById(id);
        if (t && t.scrollIntoView) t.scrollIntoView({behavior:'auto',block:'start'});
      });
      var fab = document.getElementById('fab-top');
      if (fab) {
        var tick = function(){
          if (window.scrollY > window.innerHeight*0.6) fab.classList.add('visible');
          else fab.classList.remove('visible');
        };
        window.addEventListener('scroll', tick, {passive:true});
        tick();
      }
    })();</script>
  </body></html>`;
}
