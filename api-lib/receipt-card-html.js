// Builds a clean, controlled HTML card for an email receipt from parsed
// summary fields. We control 100% of this HTML — inline styles, no
// external resources, no email-template CSS — so Chromium renders it
// reliably every time. Used both by the inbound-email pipeline (for new
// forwards where the original email HTML is empty/minimal) and by the
// client auto-recovery (for legacy records that were migrated to blank
// PNGs because their original HTML didn't render).
export function buildReceiptCardHtml(summary) {
  const s = summary || {};
  const escape = (v) =>
    String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const merchant = escape(s.merchant || s.subject || "Email Receipt");
  const subject = escape(s.subject || "");
  const currency = escape(s.currency || "USD");
  const amount = Number(s.amount || 0).toFixed(2);
  const date = escape(s.date || "");
  const category = escape((s.category || "other").replace(/_/g, " "));
  const fromEmail = escape(s.fromEmail || "");
  const attachmentName = escape(s.attachmentName || "");
  const bodyHtml = escape(s.bodyText || "").replace(/\n/g, "<br>");

  const subjectLine = subject && subject !== merchant
    ? `<div style="font-size:13px;color:#666;margin-top:4px">${subject}</div>`
    : "";
  const attachmentRow = s.hasAttachment && attachmentName
    ? `<tr><td style="padding:7px 0;color:#888;vertical-align:top">Attachment</td><td style="padding:7px 0;color:#1a1a1a;word-break:break-all">${attachmentName}</td></tr>`
    : "";

  return `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:#fff;color:#1a1a1a}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:24px;line-height:1.55;max-width:760px;margin:0 auto;font-size:14px}
.hdr{border-bottom:2px solid #1a1a1a;padding-bottom:14px;margin-bottom:18px}
.tag{font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#888;font-weight:600;margin-bottom:6px}
.merchant{font-size:22px;font-weight:700;color:#0a0a0a;line-height:1.2}
.fields{width:100%;border-collapse:collapse;margin-bottom:22px;font-size:14px}
.fields td{padding:7px 0;vertical-align:top}
.lbl{color:#888;width:120px}
.val{color:#1a1a1a;font-weight:500;word-break:break-all}
.section{font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#888;font-weight:600;margin:18px 0 10px;border-top:1px solid #eee;padding-top:14px}
.body{background:#fafafa;border:1px solid #eee;border-radius:6px;padding:16px 18px;font-size:13px;line-height:1.65;color:#222;word-break:break-word}
</style></head><body>
<div class="hdr">
  <div class="tag">Email Receipt</div>
  <div class="merchant">${merchant}</div>
  ${subjectLine}
</div>
<table class="fields">
<tr><td class="lbl">Amount</td><td class="val">${currency} ${amount}</td></tr>
<tr><td class="lbl">Date</td><td class="val">${date || "—"}</td></tr>
<tr><td class="lbl">Category</td><td class="val" style="text-transform:capitalize">${category}</td></tr>
${fromEmail ? `<tr><td class="lbl">From</td><td class="val">${fromEmail}</td></tr>` : ""}
${attachmentRow}
</table>
${bodyHtml ? `<div class="section">Email Body</div><div class="body">${bodyHtml}</div>` : ""}
</body></html>`;
}
