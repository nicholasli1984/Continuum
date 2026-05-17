import { expenseUSD } from "./expenseUsd";

// Returns the dark-themed HTML report (logo + stat cards + category bars
// + line items + embedded receipt pages) used by both the in-app View and
// the emailed PDF. Pure: no DOM mutation, no React. Caller passes trips +
// EXPENSE_CATEGORIES so this util can stay independent of any page.
export async function buildPrintReport({ title, expsForReport, trips, EXPENSE_CATEGORIES }) {
  const CURRENCY_SYMBOLS = { USD:"$",EUR:"€",GBP:"£",CAD:"CA$",AUD:"A$",JPY:"¥",CHF:"Fr",CNY:"¥",HKD:"HK$",SGD:"S$",MXN:"MX$",BRL:"R$",INR:"₹",KRW:"₩",AED:"د.إ",THB:"฿",NOK:"kr",SEK:"kr",DKK:"kr",NZD:"NZ$" };
  const symFor = (cur) => CURRENCY_SYMBOLS[cur] || (cur + " ");
  const fmtAmt = (n, cur) => n === 0 ? "Free" : `${symFor(cur)}${n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const toUSD = (e) => expenseUSD(e);
  const tripTotalUSD = expsForReport.reduce((s, e) => s + toUSD(e), 0);
  const receiptCount = expsForReport.filter(e => e.receipt).length;
  const catSummary = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    totalUSD: expsForReport.filter(e => e.category === cat.id).reduce((s,e) => s + toUSD(e), 0),
    count: expsForReport.filter(e => e.category === cat.id).length,
  })).filter(c => c.totalUSD > 0);
  const expensesWithReceipts = expsForReport.filter(e => e.receiptImage?.data);

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
    const hasReceipt = receiptIdx >= 0;
    const amountInner = `<div style="font-size:13px;font-weight:700;color:${exp.amount===0?"#34d399":"#fff"};">${fmtAmt(exp.amount,cur)}</div>${isForeign?`<div style="font-size:10px;color:#62666d;">$${usdAmt.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} USD</div>`:""}`;
    const amountCell = hasReceipt
      ? `<a href="#receipt-${receiptIdx}" class="rcpt-link" title="Jump to receipt">${amountInner}</a>`
      : amountInner;
    return `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid #2a2640;vertical-align:top;">
        <div style="font-size:13px;color:#f7f8f8;">${cat?.icon||""} ${exp.description}</div>
        <div style="font-size:10px;color:#62666d;margin-top:2px;">${tripName}${exp.notes ? " · " + exp.notes : ""}</div>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #2a2640;font-size:12px;color:#8a8f98;white-space:nowrap;">${exp.date?.slice(5)||""}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #2a2640;text-align:right;">${amountCell}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #2a2640;text-align:center;font-size:13px;color:${exp.receipt?"#34d399":"#62666d"};">
        ${hasReceipt?`<a href="#receipt-${receiptIdx}" class="rcpt-link" style="color:#0EA5A0;font-size:10px;">p.${receiptIdx+2}</a>`:(exp.receipt?"✓":"—")}
      </td>
    </tr>`;
  }).join("");

  const receiptPages = expensesWithReceipts.map((exp, i) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
    const cur = exp.currency || "USD";
    const src = exp.receiptImage.data;
    return `
      <div id="receipt-${i}" style="page-break-before:always;padding:48px;background:#13111C;min-height:100vh;box-sizing:border-box;scroll-margin-top:64px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:16px;">
          <div style="color:#8a8f98;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;">Receipt ${i+1} of ${expensesWithReceipts.length}</div>
          <a href="#report-top" class="rcpt-back no-print" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.04);color:#f7f8f8;font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;font-family:'JetBrains Mono','SF Mono',monospace;">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            Back to top
          </a>
        </div>
        <div style="font-size:16px;font-weight:700;color:#f7f8f8;margin-bottom:4px;">${cat?.icon||""} ${exp.description}</div>
        <div style="font-size:12px;color:#8a8f98;margin-bottom:32px;">${exp.date||""} · ${fmtAmt(exp.amount,cur)}</div>
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
              <th style="padding:10px 14px;text-align:right;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Amount</th>
              <th style="padding:10px 14px;text-align:center;font-size:10px;font-weight:700;color:#8a8f98;text-transform:uppercase;border-bottom:1px solid #2a2640;">Rcpt</th>
            </tr></thead>
            <tbody>${lineRows}</tbody>
            <tfoot><tr style="background:rgba(14,165,160,0.08);">
              <td colspan="2" style="padding:14px;font-size:13px;font-weight:700;color:#0EA5A0;border-top:2px solid rgba(14,165,160,0.3);">TOTAL (USD)</td>
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
