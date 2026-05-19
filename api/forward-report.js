import PDFDocument from "pdfkit";

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

const CATEGORY_LABELS = {
  flight: "Flights",
  lodging: "Lodging",
  taxi: "Taxi",
  biz_meals: "Biz Dev Meals",
  meals: "Meals",
  conferences: "Conferences",
  supplies: "Supplies",
  groceries: "Groceries",
  prof_dues: "Professional Dues",
  mobile: "Mobile/Data",
  travel_fees: "Travel Fees",
  other: "Other",
};

const CURRENCY_SYMBOLS = {
  USD: "$", EUR: "EUR ", GBP: "GBP ", CAD: "CA$", AUD: "A$",
  JPY: "JPY ", CHF: "CHF ", HKD: "HK$", SGD: "S$",
};
const symFor = (c) => CURRENCY_SYMBOLS[c] || `${c || "USD"} `;
const money = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function buildPdf({ reportTitle, senderName, senderEmail, expenses, totalUsd, generatedAt }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "LETTER", margin: 48, info: { Title: reportTitle, Author: senderName || "Continuum", Creator: "Continuum" } });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const PAGE_W = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const LEFT = doc.page.margins.left;

      // Header band
      const HEADER_H = 64;
      doc.save();
      doc.rect(LEFT, doc.y, PAGE_W, HEADER_H).fill("#D4742D");
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(18).text(reportTitle, LEFT + 18, doc.y - HEADER_H + 14, { width: PAGE_W - 36, lineBreak: false, ellipsis: true });
      doc.font("Helvetica").fontSize(10).fillColor("#fbe6d4")
        .text(`${expenses.length} item${expenses.length === 1 ? "" : "s"} · Generated ${generatedAt}`, LEFT + 18, doc.y + 4, { width: PAGE_W - 36 });
      doc.restore();

      doc.moveDown(2);

      // Sender row
      if (senderName || senderEmail) {
        doc.fillColor("#444").font("Helvetica").fontSize(10);
        const fromLine = `From: ${senderName || ""}${senderName && senderEmail ? "  ·  " : ""}${senderEmail || ""}`.trim();
        if (fromLine && fromLine !== "From:") doc.text(fromLine, LEFT, doc.y);
        doc.moveDown(0.6);
      }

      // Table layout
      const COLS = [
        { key: "date", label: "Date", w: 0.13, align: "left" },
        { key: "category", label: "Category", w: 0.16, align: "left" },
        { key: "description", label: "Description", w: 0.38, align: "left" },
        { key: "amount", label: "Amount (USD)", w: 0.20, align: "right" },
        { key: "receipt", label: "Receipt", w: 0.13, align: "left" },
      ];
      const colX = (() => {
        const out = []; let x = LEFT;
        for (const c of COLS) { out.push({ ...c, x, width: c.w * PAGE_W }); x += c.w * PAGE_W; }
        return out;
      })();

      const drawHeaderRow = () => {
        const y = doc.y;
        doc.save();
        doc.rect(LEFT, y, PAGE_W, 22).fill("#f4f4f4");
        doc.fillColor("#666").font("Helvetica-Bold").fontSize(9);
        for (const c of colX) {
          doc.text(c.label.toUpperCase(), c.x + 8, y + 7, { width: c.width - 16, align: c.align });
        }
        doc.restore();
        doc.y = y + 22;
      };

      const drawRow = (row, isAlt) => {
        const cellPadX = 8, cellPadY = 6;
        // Pre-measure tallest column (description usually) so the row height fits all wraps
        doc.font("Helvetica").fontSize(10).fillColor("#222");
        let rowHeight = 18;
        for (const c of colX) {
          const value = String(row[c.key] ?? "");
          const h = doc.heightOfString(value, { width: c.width - cellPadX * 2 });
          if (h + cellPadY * 2 > rowHeight) rowHeight = h + cellPadY * 2;
        }
        // Page break if the row won't fit
        if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom - 60) {
          doc.addPage();
          drawHeaderRow();
        }
        const y = doc.y;
        if (isAlt) {
          doc.save();
          doc.rect(LEFT, y, PAGE_W, rowHeight).fill("#fafafa");
          doc.restore();
        }
        doc.fillColor("#222").font("Helvetica").fontSize(10);
        for (const c of colX) {
          const value = String(row[c.key] ?? "");
          doc.text(value, c.x + cellPadX, y + cellPadY, { width: c.width - cellPadX * 2, align: c.align });
        }
        // Bottom border
        doc.save();
        doc.lineWidth(0.5).strokeColor("#e5e5e5").moveTo(LEFT, y + rowHeight).lineTo(LEFT + PAGE_W, y + rowHeight).stroke();
        doc.restore();
        doc.y = y + rowHeight;
      };

      drawHeaderRow();
      let zebra = false;
      for (const e of expenses) {
        const usd = Number(e.amountUsd || 0);
        const native = Number(e.amount || 0);
        const cur = e.currency || "USD";
        const showNative = cur !== "USD" && native > 0;
        const amountStr = `$${money(usd)}${showNative ? `  (${symFor(cur)}${money(native)})` : ""}`;
        drawRow({
          date: e.date || "",
          category: CATEGORY_LABELS[e.category] || e.category || "",
          description: e.description || "",
          amount: amountStr,
          receipt: e.receipt ? "Yes" : "No",
        }, zebra);
        zebra = !zebra;
      }

      // Total row
      doc.moveDown(0.4);
      const totalY = doc.y;
      doc.save();
      doc.rect(LEFT, totalY, PAGE_W, 28).fill("#1f1f1f");
      doc.fillColor("#fff").font("Helvetica-Bold").fontSize(11);
      doc.text("Total (USD)", LEFT + 8, totalY + 9, { width: PAGE_W * 0.6 });
      doc.text(`$${money(totalUsd)}`, LEFT + PAGE_W * 0.6, totalY + 9, { width: PAGE_W * 0.4 - 8, align: "right" });
      doc.restore();
      doc.y = totalY + 28;

      // Footer
      doc.moveDown(2);
      doc.fillColor("#9a9a9a").font("Helvetica").fontSize(9)
        .text("Generated by Continuum  ·  gocontinuum.app", LEFT, doc.y, { width: PAGE_W, align: "center" });

      doc.end();
    } catch (e) { reject(e); }
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const {
      recipientEmail,
      reportTitle,
      senderName,
      senderEmail,
      expenses,
      totalUsd,
      itemCount,
      pdfBase64: clientPdfBase64,
    } = body || {};

    if (!recipientEmail || !reportTitle) {
      return res.status(400).json({ error: "Missing recipientEmail or reportTitle" });
    }
    if (!clientPdfBase64 && !Array.isArray(expenses)) {
      return res.status(400).json({ error: "Provide pdfBase64 (preferred) or expenses[] (legacy)" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return res.status(400).json({ error: "Invalid recipient email" });
    }

    const resendKey = (process.env.RESEND_API_KEY || "").trim();
    if (!resendKey) {
      return res.status(503).json({
        error: "Email sending is not configured on this deployment. Add a RESEND_API_KEY environment variable in Vercel and redeploy.",
        code: "no_email_service",
      });
    }

    // Prefer the PDF the client rendered from the in-app View Report HTML —
    // that way the emailed PDF matches what the user sees in Continuum
    // exactly (logo, dark theme, embedded receipts). Fall back to the
    // server-rendered pdfkit version only if no client PDF was supplied.
    let pdfBase64;
    if (clientPdfBase64) {
      pdfBase64 = String(clientPdfBase64).replace(/^data:application\/pdf;base64,/, "");
    } else {
      const generatedAt = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
      const pdfBuffer = await buildPdf({
        reportTitle,
        senderName: senderName || "",
        senderEmail: senderEmail || "",
        expenses,
        totalUsd: Number(totalUsd || 0),
        generatedAt,
      });
      pdfBase64 = pdfBuffer.toString("base64");
    }

    const resolvedItemCount = Number.isFinite(Number(itemCount)) ? Number(itemCount) : (Array.isArray(expenses) ? expenses.length : 0);
    const safeTitle = String(reportTitle).replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 60) || "expense-report";
    const filename = `${safeTitle.replace(/\s+/g, "-")}.pdf`;

    const senderLabel = senderName ? `${senderName} via Continuum` : "Continuum";
    const intro = senderName ? `${senderName} sent you an expense report from Continuum.` : "An expense report was forwarded to you from Continuum.";
    const totalLine = `${resolvedItemCount} item${resolvedItemCount === 1 ? "" : "s"} · Total $${money(Number(totalUsd || 0))} USD`;
    const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#222"><div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #ececec;border-radius:14px;overflow:hidden"><div style="background:#D4742D;color:#fff;padding:20px 24px"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.85">Expense Report</div><div style="font-size:20px;font-weight:700;margin-top:4px">${reportTitle.replace(/</g, "&lt;")}</div></div><div style="padding:24px"><p style="margin:0 0 12px;font-size:14px;line-height:1.55">${intro}</p><p style="margin:0 0 18px;font-size:14px;line-height:1.55"><strong>${totalLine}</strong></p><p style="margin:0;font-size:13px;color:#666;line-height:1.55">The full itemized report is attached as a PDF.</p></div><div style="padding:14px 24px;border-top:1px solid #ececec;font-size:11px;color:#999">Sent via <a href="https://gocontinuum.app" style="color:#D4742D;text-decoration:none">Continuum</a></div></div></body></html>`;

    const text = `${intro}\n\n${totalLine}\n\nThe full itemized report is attached as a PDF.\n\nSent via Continuum — gocontinuum.app`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${senderLabel} <reports@gocontinuum.app>`,
        to: [recipientEmail],
        reply_to: senderEmail || undefined,
        subject: `Expense Report: ${reportTitle}`,
        html,
        text,
        attachments: [{ filename, content: pdfBase64 }],
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error("[forward-report] Resend error", resp.status, errBody);
      return res.status(502).json({ error: "Email service failed to send", detail: errBody.slice(0, 500), code: "resend_failed" });
    }

    const json = await resp.json().catch(() => ({}));
    return res.status(200).json({ success: true, method: "email_with_pdf", id: json?.id || null, filename });
  } catch (e) {
    console.error("[forward-report] error:", e);
    return res.status(500).json({ error: "Server error", detail: (e && e.message) ? e.message.slice(0, 300) : "" });
  }
}
