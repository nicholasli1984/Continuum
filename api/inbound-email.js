import { withSentry } from "../api-lib/sentry.js";
import { renderEmailHtmlToPng } from "../api-lib/render-email-png.js";
import { buildReceiptCardHtml } from "../api-lib/receipt-card-html.js";

// Defensive wrapper around `Response.json()`. Anthropic, Supabase, and CDN
// edges occasionally return HTML (502/504, rate-limit pages, maintenance) —
// calling .json() on those bodies throws SyntaxError ("Unexpected token '<'")
// which used to bubble all the way up and Sentry-out the entire webhook.
const safeJson = async (response) => {
  try {
    const text = await response.text();
    if (!text) return null;
    try { return JSON.parse(text); }
    catch {
      console.error("[inbound-email] non-JSON response", response.status, text.slice(0, 200));
      return null;
    }
  } catch (e) {
    console.error("[inbound-email] response.text() failed:", e?.message);
    return null;
  }
};

async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  // Diagnostic: POST mode.
  //   Content-Type: text/html  → renders the raw HTML body
  //   Content-Type: application/json with { summary: {...} } → Claude→render
  if (req.method === "POST" && req.query && req.query.testRender) {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString("utf-8");
      const ct = String(req.headers["content-type"] || "");
      let html = "";
      let aiMs = 0;
      if (ct.includes("application/json")) {
        const parsed = JSON.parse(raw);
        if (parsed.summary) {
          html = buildReceiptCardHtml(parsed.summary);
        } else if (parsed.html) {
          html = parsed.html;
        }
      } else {
        html = raw;
      }
      if (!html) return res.status(400).json({ error: "no html or summary provided" });
      const png = await renderEmailHtmlToPng(html);
      if (req.query.raw) {
        res.setHeader("Content-Type", "image/png");
        res.setHeader("X-AI-Ms", String(aiMs));
        res.setHeader("X-Html-Size", String(html.length));
        return res.status(200).send(Buffer.from(png));
      }
      return res.status(200).json({ ok: true, aiMs, htmlBytes: html.length, pngBytes: png.length });
    } catch (e) {
      return res.status(500).json({ error: e?.message || String(e), stack: (e?.stack || "").split("\n").slice(0, 8).join("\n") });
    }
  }
  if (req.method === "GET" && req.query && req.query.testRender) {
    // Diagnostic: exercises the Chromium screenshot path. Hit with:
    //   /api/inbound-email?testRender=1                  → simple test HTML
    //   /api/inbound-email?testRender=1&whiteOnWhite=1   → hostile email
    //   /api/inbound-email?testRender=1&raw=1            → returns the PNG bytes directly
    try {
      let testHtml;
      if (req.query.whiteOnWhite) {
        // Simulates a transactional email that sets explicit white text on
        // every element (with a CID background image that won't load).
        // Without aggressive safety CSS this renders as a fully blank PNG.
        testHtml = `<!doctype html><html><head><style>body{background:url(cid:bg.png);color:#fff}td{color:#fff;background:url(cid:cell.png)}h1{color:#fff}p{color:#fff}</style></head><body style="color:#fff;background:url(cid:bg.png)"><h1 style="color:#ffffff">Test Email — Should Be Readable</h1><table style="color:#fff;background:url(cid:tbg.png)"><tr><td style="color:#fff"><font color="#ffffff">Merchant</font></td><td style="color:#fff">Test Co.</td></tr><tr><td style="color:#fff">Amount</td><td style="color:#fff">USD 517.20</td></tr><tr><td style="color:#fff">Date</td><td style="color:#fff">2026-06-09</td></tr></table><p style="color:#fff">If you can read this, the readability safety CSS is working.</p></body></html>`;
      } else {
        testHtml = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;padding:32px;background:#fff;color:#1a1a1a}h1{color:#D4742D}</style></head><body><h1>Continuum Test Receipt</h1><p>If you can see this in a PNG, Chromium rendering works.</p><table border="1" cellpadding="8" style="margin-top:16px;border-collapse:collapse"><tr><th>Merchant</th><td>Test Co.</td></tr><tr><th>Amount</th><td>$42.00</td></tr><tr><th>Date</th><td>2026-05-15</td></tr></table></body></html>`;
      }
      const t0 = Date.now();
      const png = await renderEmailHtmlToPng(testHtml);
      const ms = Date.now() - t0;
      const headHex = Buffer.from(png).slice(0, 8).toString("hex");
      const valid = headHex === "89504e470d0a1a0a";
      if (req.query.raw) {
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "no-cache");
        return res.status(200).send(Buffer.from(png));
      }
      return res.status(200).json({ ok: true, valid, ms, bytes: png.length, headHex });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e?.message || String(e), name: e?.name, stack: (e?.stack || "").split("\n").slice(0, 8).join("\n") });
    }
  }
  if (req.method === "GET") return res.status(200).json({ status: "ok" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Defensive: some env values arrive with a trailing newline/whitespace
  // which would corrupt every subsequent fetch URL into an invalid request.
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "").trim();

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Missing Supabase config" });
  }

  try {
    // Read raw body
    let rawText = "";
    if (typeof req.body === "string") {
      rawText = req.body;
    } else if (req.body) {
      rawText = JSON.stringify(req.body);
    } else {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      rawText = Buffer.concat(chunks).toString("utf-8");
    }

    // Extract email headers — read all instances, we'll try multiple for sender matching
    const headerVal = (name) => {
      const m = rawText.match(new RegExp(`^${name}:\\s*(.+?)$`, "mi"));
      return m?.[1]?.trim() || "";
    };
    const headerValAll = (name) => {
      const rx = new RegExp(`^${name}:\\s*(.+?)$`, "gmi");
      const out = [];
      let m;
      while ((m = rx.exec(rawText)) !== null) out.push(m[1].trim());
      return out;
    };
    const fromEmail = headerVal("From");
    const toEmail = headerVal("To");
    let subject = headerVal("Subject");

    // Decode RFC 2047 subject
    subject = subject.replace(/=\?[^?]+\?B\?([^?]+)\?=/gi, (_, b64) => {
      try { return Buffer.from(b64, "base64").toString("utf-8"); } catch { return _; }
    }).replace(/\s+/g, " ").trim();

    // Helper: pull an email address out of an angle-bracketed or bare header value
    const extractAddress = (s) => {
      if (!s) return "";
      const m = s.match(/<?([^\s<>,;"]+@[^\s<>,;"]+)>?/);
      return m?.[1]?.toLowerCase() || "";
    };

    // Primary sender candidate
    const senderEmail = extractAddress(fromEmail);

    // Alternate candidates for auto-forwarded / filter-forwarded mail
    // (Gmail filters preserve original From: but the forwarder's address leaks into these)
    const altSenderHeaders = [
      ...headerValAll("Reply-To"),
      ...headerValAll("Return-Path"),
      ...headerValAll("X-Forwarded-For"),
      ...headerValAll("X-Forwarded-To"),
      ...headerValAll("X-Original-From"),
      ...headerValAll("X-Original-Sender"),
      ...headerValAll("Delivered-To"),
      ...headerValAll("X-Google-Original-From"),
      ...headerValAll("Resent-From"),
      ...headerValAll("Sender"),
    ];
    const candidateSenders = Array.from(new Set(
      [senderEmail, ...altSenderHeaders.map(extractAddress)]
        .filter(e => e && e.includes("@"))
    ));

    // Collect ALL possible destination addresses. Cloudflare Email Routing, Gmail
    // auto-forward, and SendGrid Inbound Parse can each put the real recipient in
    // different headers — so we look at every plausible one.
    const allToHeaders = [
      ...headerValAll("To"),
      ...headerValAll("Delivered-To"),
      ...headerValAll("X-Forwarded-To"),
      ...headerValAll("X-Original-To"),
      ...headerValAll("Envelope-To"),
      ...headerValAll("X-Delivered-To"),
    ];
    const candidateRecipients = Array.from(new Set(
      allToHeaders.map(extractAddress).filter(Boolean)
    ));

    // Helper — classify a single address as expense, token, or neither
    const classifyRecipient = (addr) => {
      const local = addr.split("@")[0] || "";
      const domain = addr.split("@")[1] || "";
      const isExpense = domain === "expenses.gocontinuum.app"
        || domain.startsWith("expenses.")
        || local === "expenses"
        || local.endsWith("+expense")
        || local.endsWith("+expenses");
      const tokenFromAddr = local.replace(/\+expense.*$/, "").replace(/\+.*$/, "");
      return { isExpense, token: tokenFromAddr };
    };

    // Walk every candidate; the explicit recipient determines routing.
    // expenses@ → expense. trips@ → itinerary. Either signal, once seen, is sticky.
    let sawExplicitExpenses = false;
    let sawExplicitTrips = false;
    let toToken = "";
    for (const addr of candidateRecipients) {
      const c = classifyRecipient(addr);
      const localPart = (addr.split("@")[0] || "").toLowerCase().replace(/\+.*$/, "");
      if (c.isExpense) { sawExplicitExpenses = true; if (!toToken && c.token && c.token !== "expenses") toToken = c.token; }
      else if (localPart === "trips") { sawExplicitTrips = true; }
      else if (!toToken && c.token && c.token !== "expenses" && c.token !== "trips") toToken = c.token;
    }

    // Legacy fallbacks from the original first-To-only parser
    const toRaw = (toEmail.match(/<?([^@<]+)@/)?.[1] || "").trim().toLowerCase();
    const toDomain = (toEmail.match(/@([^\s>]+)/)?.[1] || "").trim().toLowerCase();
    if (!sawExplicitExpenses && (toDomain.startsWith("expenses.") || toDomain === "expenses.gocontinuum.app" || toRaw === "expenses" || toRaw.includes("+expense"))) {
      sawExplicitExpenses = true;
    }
    if (!sawExplicitTrips && toRaw === "trips") sawExplicitTrips = true;
    if (!toToken) toToken = toRaw.replace(/\+expense$/, "").replace(/\+.*$/, "");

    // Explicit recipient wins. Trips@ beats body-scan; expenses@ beats body-scan.
    let isExpenseEmail = sawExplicitExpenses;
    // Body-scan fallback only when NEITHER explicit signal was found.
    if (!sawExplicitExpenses && !sawExplicitTrips && /\bexpenses@gocontinuum\.app\b/i.test(rawText.slice(0, 4000))) {
      isExpenseEmail = true;
    }

    console.log("[inbound-email] ROUTE", JSON.stringify({
      isExpenseEmail, sawExplicitExpenses, sawExplicitTrips, toToken, candidateRecipients, toRaw, toDomain,
    }));

    // Look up user — first by token in the TO address, then by any candidate sender
    let userId = null;
    let matchSource = null;

    // Try token match (e.g., nicholas.abc123@trips.gocontinuum.app)
    if (toToken && toToken !== "expenses" && toToken !== "trips") {
      const fwdRes = await fetch(`${supabaseUrl}/rest/v1/user_forwarding_addresses?forwarding_address=eq.${encodeURIComponent(toToken)}&select=user_id`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      });
      const fwdData = await safeJson(fwdRes);
      if (fwdData?.[0]?.user_id) { userId = fwdData[0].user_id; matchSource = `token:${toToken}`; }
    }

    // If no token match, try each candidate sender in priority order
    if (!userId && candidateSenders.length > 0) {
      for (const candidate of candidateSenders) {
        const fwdRes = await fetch(`${supabaseUrl}/rest/v1/user_forwarding_addresses?email=eq.${encodeURIComponent(candidate)}&select=user_id,email`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        });
        const fwdData = await safeJson(fwdRes);
        if (fwdData?.[0]?.user_id) {
          userId = fwdData[0].user_id;
          matchSource = `sender:${candidate}`;
          break;
        }
      }
    }

    // Diagnostic log (visible in Vercel function logs) for unmatched inbound emails
    if (!userId) {
      console.log("[inbound-email] NO MATCH", JSON.stringify({
        to: toEmail, toToken, toDomain, isExpenseEmail,
        from: fromEmail, senderEmail,
        candidateSenders, subject,
      }));
      return res.status(200).json({
        ok: true, message: "No matching user",
        to: toToken, from: senderEmail,
        candidates: candidateSenders,
      });
    }
    console.log("[inbound-email] MATCH", JSON.stringify({ userId, matchSource, subject }));

    // ── Shared attachment extraction ──
    // Both the expense flow (expenses@ + receipt-as-attachment) and the
    // trips@ booking-parser fallback need to enumerate attachments from the
    // raw MIME body. Hoisted here so the trips@ path doesn't crash with
    // `primaryAttachment is not defined` — they used to be scoped inside
    // the expense block only, which left the trips@ docx/pdf fallback
    // referencing undeclared variables.
    const emailLines = rawText.split(/\r?\n/);

    // Helper: extract any attachments (PDF, images, .docx) from the
    // multipart MIME. Returns array of { filename, contentType, base64Data }.
    // Inline body-embedded *images* (signature logos, banners) are excluded —
    // they have Content-Disposition: inline and/or a Content-ID and are
    // never the receipt. PDFs marked as `Content-Disposition: inline` by
    // Apple Mail / Gmail (so the recipient can preview them) ARE real
    // attachments, so the inline filter only applies to image MIME types.
    // Recognized file extensions used as a fallback when the MIME type is
    // generic (application/octet-stream is common from corporate booking
    // systems and some mail clients). The Content-Type alone is not enough.
    const ATTACH_EXT_RX = /\.(pdf|docx|jpg|jpeg|png|webp|heic)(?:["']|$)/i;
    const EXT_TO_MIME = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      heic: "image/heic",
    };

    const extractAttachments = () => {
      const out = [];
      for (let i = 0; i < emailLines.length; i++) {
        // Pass 1: any line with a Content-Type header is a candidate part.
        // We accept on either a known MIME match OR a recognized file
        // extension in the Content-Type / filename / name parameters.
        if (!/^\s*Content-Type:/i.test(emailLines[i])) continue;
        const headerLines = [];
        let j = i;
        while (j < emailLines.length && emailLines[j].trim() !== "") { headerLines.push(emailLines[j]); j++; }
        const headerBlock = headerLines.join(" ");
        const isB64 = /base64/i.test(headerBlock);
        if (!isB64) continue;

        const ctMatch = headerBlock.match(/Content-Type:\s*([^;\s]+)/i);
        let contentType = (ctMatch?.[1] || "application/octet-stream").toLowerCase();

        const fnMatch = headerBlock.match(/filename\*?="?([^";\r\n]+)"?/i) || headerBlock.match(/name="?([^";\r\n]+)"?/i);
        let filename = fnMatch?.[1]?.replace(/^UTF-8''/, "") || "";
        // Some mailers URL-encode the filename (RFC 2231).
        try { if (/%[0-9A-F]{2}/i.test(filename)) filename = decodeURIComponent(filename); } catch (_) {}

        // Decide whether this part is one we care about. We accept either:
        //   (a) Content-Type matches one of our known attachment MIME types, OR
        //   (b) Filename ends in a recognized extension — important for
        //       application/octet-stream and other generic types that some
        //       corporate mail systems use for legitimate PDF receipts.
        const knownMime = /^(application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|image\/(?:jpeg|jpg|png|webp|heic))$/.test(contentType);
        const extMatch = filename && filename.match(ATTACH_EXT_RX);
        if (!knownMime && !extMatch) continue;

        // If the MIME type is generic but the extension is recognized,
        // override the contentType so downstream Claude routing picks the
        // right parser (image vs document).
        if (!knownMime && extMatch) {
          contentType = EXT_TO_MIME[extMatch[1].toLowerCase()];
        }

        // Inline-image filter (signature logos / banners). PDFs marked as
        // inline by Apple Mail / Gmail for preview ARE real attachments, so
        // this only applies to image MIME types.
        const isImage = contentType.startsWith("image/");
        const isInlineImage = isImage && (/Content-Disposition:\s*inline/i.test(headerBlock) || /Content-ID:\s*</i.test(headerBlock));
        if (isInlineImage) continue;

        if (!filename) filename = `attachment.${contentType.split("/")[1] || "bin"}`;
        j++;
        const bodyLines = [];
        while (j < emailLines.length && !emailLines[j].startsWith("--")) { bodyLines.push(emailLines[j]); j++; }
        const base64Data = bodyLines.join("").replace(/\s/g, "");
        if (base64Data.length > 200) out.push({ filename, contentType, base64Data });
      }
      return out;
    };

    const attachments = extractAttachments();
    const primaryAttachment = attachments.find(a => a.contentType === "application/pdf")
      || attachments.find(a => a.contentType.startsWith("image/"));

    // Extract inline images for CID resolution. Gmail and Apple Mail bundle
    // inline logos and banners as image/* parts with a Content-ID header,
    // and the HTML body references them as <img src="cid:abc123">. To make
    // the screenshot render those images, we collect them here and later
    // rewrite cid: refs in the htmlBody to data: URLs before rendering.
    // Outlook also includes inline images this way, but Outlook's
    // forwarding usually strips both the <img> tag and the part entirely —
    // so this is mostly useful for Gmail/Apple Mail-forwarded mail.
    const extractInlineImages = () => {
      const map = new Map(); // contentId (without <>) → dataUrl
      for (let i = 0; i < emailLines.length; i++) {
        if (!/^\s*Content-Type:/i.test(emailLines[i])) continue;
        const headerLines = [];
        let j = i;
        while (j < emailLines.length && emailLines[j].trim() !== "") { headerLines.push(emailLines[j]); j++; }
        const headerBlock = headerLines.join(" ");
        if (!/base64/i.test(headerBlock)) continue;
        const ctMatch = headerBlock.match(/Content-Type:\s*(image\/[^;\s]+)/i);
        if (!ctMatch) continue;
        const cidMatch = headerBlock.match(/Content-ID:\s*<?([^>;\s]+)>?/i);
        if (!cidMatch) continue;
        const contentType = ctMatch[1].toLowerCase();
        const cid = cidMatch[1].trim();
        j++;
        const bodyLines = [];
        while (j < emailLines.length && !emailLines[j].startsWith("--")) { bodyLines.push(emailLines[j]); j++; }
        const base64Data = bodyLines.join("").replace(/\s/g, "");
        if (base64Data.length < 100) continue;
        // Sanity cap: ~5MB per inline image
        if (base64Data.length > 7 * 1024 * 1024) continue;
        map.set(cid, `data:${contentType};base64,${base64Data}`);
      }
      return map;
    };
    const inlineImageMap = extractInlineImages();
    if (inlineImageMap.size > 0) {
      console.log("[inbound-email] INLINE IMAGES", JSON.stringify({
        count: inlineImageMap.size,
        cids: Array.from(inlineImageMap.keys()).slice(0, 5),
      }));
    }

    // Replace cid: image references in an HTML body with data: URLs from
    // the inline image map. Handles both src="cid:xxx" and src='cid:xxx',
    // and also bare cid:xxx in style="background-image:url(cid:xxx)".
    const resolveCidImages = (html) => {
      if (!html || inlineImageMap.size === 0) return html;
      return html.replace(/cid:([^"'\s>)]+)/gi, (match, cid) => {
        const dataUrl = inlineImageMap.get(cid) || inlineImageMap.get(cid.replace(/[<>]/g, ""));
        return dataUrl || match;
      });
    };
    console.log("[inbound-email] ATTACHMENTS", JSON.stringify({
      count: attachments.length,
      kinds: attachments.map(a => ({ filename: a.filename, contentType: a.contentType, bytes: Math.round((a.base64Data.length * 3) / 4) })),
      primary: primaryAttachment ? { filename: primaryAttachment.filename, contentType: primaryAttachment.contentType } : null,
    }));

    // ── EXPENSE EMAIL FLOW ──
    if (isExpenseEmail) {

      // Helper: extract MIME part by content type, with proper charset handling
      const extractMimePart = (contentType) => {
        for (let i = 0; i < emailLines.length; i++) {
          if (!new RegExp(`Content-Type:\\s*${contentType}`, "i").test(emailLines[i])) continue;
          // Read headers until blank line to get charset and encoding
          const headerLines = [];
          let j = i;
          while (j < emailLines.length && emailLines[j].trim() !== "") { headerLines.push(emailLines[j]); j++; }
          const headerBlock = headerLines.join(" ");
          const isB64 = /base64/i.test(headerBlock);
          const isQP = /quoted-printable/i.test(headerBlock);
          const charsetMatch = headerBlock.match(/charset="?([^";\s]+)"?/i);
          const charset = charsetMatch?.[1]?.toLowerCase() || "utf-8";
          j++; // skip blank line
          const bodyLines = [];
          while (j < emailLines.length && !emailLines[j].startsWith("--")) { bodyLines.push(emailLines[j]); j++; }
          let content = "";
          const rawBody = bodyLines.join(isB64 ? "" : "\n");
          if (isB64) {
            const buf = Buffer.from(rawBody, "base64");
            // Decode with proper charset
            try {
              if (charset === "utf-8" || charset === "utf8") { content = buf.toString("utf-8"); }
              else { content = new TextDecoder(charset).decode(buf); }
            } catch { content = buf.toString("utf-8"); }
          } else if (isQP) {
            content = rawBody.replace(/=\r?\n/g, "").replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
            // Fix UTF-8 sequences decoded as Latin-1
            try { content = Buffer.from(content, "latin1").toString("utf-8"); } catch {}
          } else {
            content = rawBody;
          }
          // Clean up common encoding artifacts
          content = content.replace(/Ã¢Â[^\s]*/g, "").replace(/Â /g, " ").replace(/Â©/g, "©").replace(/Â/g, "");
          if (content.trim()) return content;
        }
        return "";
      };

      // Valid expense category IDs (must match EXPENSE_CATEGORIES in src/App.jsx).
      // Claude sometimes invents categories like "transportation" or "dining"; we
      // fall back to "other" so the UI doesn't silently render them as Other.
      const VALID_EXPENSE_CATEGORIES = new Set([
        "flight", "lodging", "taxi", "biz_meals", "meals", "conferences",
        "supplies", "groceries", "prof_dues", "mobile", "travel_fees", "other",
      ]);

      // ── Unified expense flow ──
      // 1. Always read the email body (HTML + plain text).
      // 2. Send body + attachment (if any) to Claude in ONE call so the AI
      //    sees both sources together and produces consistent data.
      // 3. Build a combined HTML receipt: email body on top, attachment
      //    embedded below (PDF as <object>, image inline). The user can see
      //    both the source email AND the original attachment when they open
      //    the expense detail.
      // 4. Fall back to regex parsing of the body for amount/currency/date
      //    only when Claude returned nothing and no attachment was sent.

      // Strip a leading UTF-8 BOM from the extracted body (very common in
      // forwarded email HTML). If it survives into the stored receipt, the
      // client iframe renders it as visible "ï»¿" garbage and the rest of
      // the HTML becomes invisible.
      const stripBom = (s) => (s && s.charCodeAt(0) === 0xFEFF) ? s.slice(1) : s;
      // Extract HTML body and resolve any cid: image references against the
      // inline image map we built from the MIME parts. This lets Gmail- and
      // Apple-Mail-forwarded emails render with their original embedded
      // logos/banners intact.
      const htmlBody = resolveCidImages(stripBom(extractMimePart("text\\/html")));
      const textBody = stripBom(extractMimePart("text\\/plain") || rawText.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim());
      const searchText = (textBody + " " + htmlBody.replace(/<[^>]*>/g, " ")).replace(/&nbsp;/gi, " ").replace(/&#36;/g, "$").replace(/&amp;/gi, "&").replace(/\s+/g, " ");

      const anthropicKey = (process.env.ANTHROPIC_API_KEY || "").trim();
      let aiAmount = 0, aiCurrency = "", aiDate = "", aiMerchant = "", aiCategory = "", aiDescription = "";

      const haveAttachmentForClaude = primaryAttachment && (
        primaryAttachment.contentType === "application/pdf" ||
        primaryAttachment.contentType.startsWith("image/")
      );
      const haveBodyForClaude = searchText.length > 50;

      if (anthropicKey && (haveAttachmentForClaude || haveBodyForClaude)) {
        try {
          // Build multi-modal content blocks. Attachment first (so Claude
          // sees the receipt artwork before the surrounding email context).
          const contentBlocks = [];
          if (haveAttachmentForClaude) {
            const isPdf = primaryAttachment.contentType === "application/pdf";
            contentBlocks.push(isPdf
              ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: primaryAttachment.base64Data } }
              : { type: "image",    source: { type: "base64", media_type: primaryAttachment.contentType, data: primaryAttachment.base64Data } });
          }
          contentBlocks.push({
            type: "text",
            text: `Extract expense info from this forwarded email${haveAttachmentForClaude ? " and its attached receipt" : ""}. Return ONLY valid JSON, no markdown:
{
  "merchant": "string — vendor / business name (the airline, hotel, restaurant, store — prefer the operating brand over the booking platform when both appear)",
  "amount": number (the TOTAL amount charged/paid, including taxes/fees/tip — NOT a 'starting from' price, NOT a per-night rate, NOT a discount amount),
  "currency": "USD" | "EUR" | "GBP" | "CAD" | "JPY" | "AUD" | "SGD" | "HKD",
  "date": "YYYY-MM-DD (the charge/transaction date if shown; otherwise the trip/stay/service date)",
  "category": "flight" | "lodging" | "taxi" | "biz_meals" | "meals" | "conferences" | "supplies" | "groceries" | "prof_dues" | "mobile" | "travel_fees" | "other",
  "description": "concise one-line description (e.g. 'Delta flight LGA → MIA' or 'Marriott — 3 nights in Boston' or 'Lunch at La Pecora Bianca')"
}

Category guidance:
- flight: airline tickets, baggage fees, seat upgrades
- lodging: hotels, motels, Airbnbs, vacation rentals
- taxi: Uber, Lyft, taxis, rideshare, car services, transit, rental cars, parking
- biz_meals: restaurant meals with clients/colleagues
- meals: personal restaurant meals, cafes, takeout
- conferences: conference registration, event tickets, training fees
- supplies: office supplies, software, hardware, equipment
- groceries: supermarkets, food retail
- prof_dues: professional memberships, licenses, certifications
- mobile: phone bills, data plans, roaming charges
- travel_fees: visas, passports, TSA PreCheck, Global Entry, travel insurance
- other: anything else

${haveAttachmentForClaude ? "The attached file is the primary receipt — prefer its numbers when both sources disagree. Use the email body for context (sender brand, trip purpose, currency hints)." : ""}If this looks like a marketing/promotional email (no actual purchase) or no clear total can be determined, return amount: 0. Default to USD if currency is unclear.

Subject: ${subject || "(no subject)"}
From: ${senderEmail}

Email content:
${searchText.slice(0, 12000)}`,
          });

          const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
            body: JSON.stringify({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 800,
              messages: [{ role: "user", content: contentBlocks }],
            }),
          });
          if (aiRes.ok) {
            const aiJson = await safeJson(aiRes);
            const aiText = aiJson?.content?.[0]?.text?.trim() || "";
            const cleaned = aiText.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
            const jm = cleaned.match(/\{[\s\S]*\}/);
            if (jm) {
              const parsed = JSON.parse(jm[0]);
              if (typeof parsed.amount === "number" && parsed.amount > 0) aiAmount = parsed.amount;
              if (parsed.currency) aiCurrency = parsed.currency;
              if (parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) aiDate = parsed.date;
              if (parsed.merchant) aiMerchant = String(parsed.merchant).trim();
              if (parsed.category && VALID_EXPENSE_CATEGORIES.has(parsed.category)) aiCategory = parsed.category;
              if (parsed.description) aiDescription = String(parsed.description).trim();
            }
          } else {
            console.error("[inbound-email] Claude parse failed:", aiRes.status, await aiRes.text());
          }
        } catch (e) {
          console.error("[inbound-email] Claude parse error:", e?.message);
        }
      }

      // Regex fallback — runs only when Claude got nothing AND we didn't
      // send it an attachment (an attachment-equipped call that came back
      // empty almost certainly means the receipt has zero usable text, so
      // regex on the body text won't help either).
      let regexAmount = 0;
      let regexCurrency = "USD";
      let regexDate = new Date().toISOString().slice(0, 10);
      if (!aiAmount && !haveAttachmentForClaude) {
        const allAmounts = [];
        let m;
        const p1 = /\$\s*([0-9,]+\.\d{2})/g;
        while ((m = p1.exec(searchText)) !== null) { const v = parseFloat(m[1].replace(/,/g, "")); if (v > 0) allAmounts.push(v); }
        const p2 = /(?:USD|EUR|GBP|CAD)\s*([0-9,]+\.\d{2})/gi;
        while ((m = p2.exec(searchText)) !== null) { const v = parseFloat(m[1].replace(/,/g, "")); if (v > 0) allAmounts.push(v); }
        const p3 = /(?:total|amount\s*due|grand\s*total|balance\s*due|estimated\s*total|room\s*total|stay\s*total|charge|payment|cost)[:\s]*\$?\s*([0-9,]+\.\d{2})/gi;
        while ((m = p3.exec(searchText)) !== null) { const v = parseFloat(m[1].replace(/,/g, "")); if (v > 0) allAmounts.push(v); }
        const p4 = /([0-9,]+\.\d{2})\s*(?:USD|EUR|GBP|CAD)/gi;
        while ((m = p4.exec(searchText)) !== null) { const v = parseFloat(m[1].replace(/,/g, "")); if (v > 0) allAmounts.push(v); }
        const p5 = /(?:rate|price|per\s*night|nightly)[:\s]*\$?\s*([0-9,]+\.\d{2})/gi;
        while ((m = p5.exec(searchText)) !== null) { const v = parseFloat(m[1].replace(/,/g, "")); if (v > 0) allAmounts.push(v); }
        regexAmount = allAmounts.length > 0 ? Math.max(...allAmounts) : 0;

        if (searchText.includes("£") || /GBP/i.test(searchText)) regexCurrency = "GBP";
        else if (searchText.includes("€") || /EUR/i.test(searchText)) regexCurrency = "EUR";
        else if (/CAD/i.test(searchText)) regexCurrency = "CAD";

        const datePats = [
          /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
          /(\w{3,9}\s+\d{1,2},?\s+\d{4})/,
          /(\d{4}-\d{2}-\d{2})/,
        ];
        for (const pat of datePats) {
          const dm = searchText.match(pat);
          if (dm) { const d = new Date(dm[1]); if (!isNaN(d.getTime()) && d.getFullYear() > 2020) { regexDate = d.toISOString().slice(0, 10); break; } }
        }
      }

      const amount = aiAmount || regexAmount;
      const currency = aiCurrency || regexCurrency;
      const expDate = aiDate || regexDate;
      const category = aiCategory || "other";
      const finalDescription = aiDescription
        ? (aiMerchant && !aiDescription.toLowerCase().includes(aiMerchant.toLowerCase())
            ? `${aiMerchant} — ${aiDescription}`
            : aiDescription)
        : (subject || "Forwarded receipt");
      const parseSource = aiAmount ? (haveAttachmentForClaude ? "ai+attachment" : "ai") : (regexAmount ? "regex" : "none");

      console.log("[inbound-email] EXPENSE BODY", JSON.stringify({
        parseSource, amount, currency, expDate, category, merchant: aiMerchant,
        attached: haveAttachmentForClaude ? primaryAttachment.filename : null,
      }));

      // ── Decide the receipt image strategy ──
      // 1. If the email has an IMAGE attachment, use that image directly as
      //    the receipt. It IS the actual receipt scan; the parsed fields go
      //    in `notes`. This bypasses HTML rendering entirely.
      // 2. If the email has a PDF attachment, store the PDF directly so the
      //    existing PDF→PNG "Convert to image" flow works.
      // 3. Otherwise build a canonical receipt CARD from the parsed fields +
      //    cleaned email body text. We control 100% of this HTML so it
      //    renders identically in any context — no <!doctype>, no <html>,
      //    no <body>, no <style> blocks that fight the host page.
      const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

      let receiptImage;
      let receiptName;
      let receiptStrategy;
      let attachmentDropped = false;
      const MAX_RECEIPT_BYTES = 4 * 1024 * 1024;

      if (primaryAttachment && primaryAttachment.contentType.startsWith("image/")) {
        // Strategy 1: image attachment → store image directly
        receiptStrategy = "image-direct";
        const imgDataUrl = `data:${primaryAttachment.contentType};base64,${primaryAttachment.base64Data}`;
        const imgBytes = Math.round((primaryAttachment.base64Data.length * 3) / 4);
        if (imgDataUrl.length > MAX_RECEIPT_BYTES) {
          // Too big — fall through to canonical card below
          attachmentDropped = true;
          receiptStrategy = "card";
        } else {
          receiptName = primaryAttachment.filename;
          receiptImage = { name: receiptName, size: imgBytes, type: primaryAttachment.contentType, data: imgDataUrl };
        }
      } else if (primaryAttachment && primaryAttachment.contentType === "application/pdf") {
        // Strategy 2: PDF attachment → store PDF directly
        receiptStrategy = "pdf-direct";
        const pdfDataUrl = `data:application/pdf;base64,${primaryAttachment.base64Data}`;
        const pdfBytes = Math.round((primaryAttachment.base64Data.length * 3) / 4);
        if (pdfDataUrl.length > MAX_RECEIPT_BYTES) {
          attachmentDropped = true;
          receiptStrategy = "card";
        } else {
          receiptName = primaryAttachment.filename;
          receiptImage = { name: receiptName, size: pdfBytes, type: "application/pdf", data: pdfDataUrl };
        }
      }

      if (!receiptImage) {
        // Strategy 3: structured receipt-card data + raw HTML for popup view.
        // We store BOTH:
        //   - A `summary` object (parsed fields + cleaned body text) that the
        //     client renders as a React card. Guaranteed visible, no rendering
        //     pipeline that can fail.
        //   - The original HTML in `data` so the user can hit "Open Original"
        //     to view it in a popup window (the one rendering path we know
        //     works: window.open + document.write).
        receiptStrategy = htmlBody ? "html-passthrough" : "text-card";

        const stripScripts = (h) => String(h || "")
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "")
          .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "")
          .replace(/javascript:/gi, "blocked:");

        let bodyHtmlBlock;
        if (htmlBody && htmlBody.trim().length > 0) {
          // Pass the original HTML through — this gives the user the email
          // as it actually appeared in their inbox, logos and all.
          bodyHtmlBlock = stripScripts(htmlBody);
        } else {
          // Fall back to a readable text card.
          const cleanBodyText = String(textBody || "")
            .replace(/-{3,}\s*forwarded\s*message\s*-{3,}/gi, "")
            .replace(/^>+\s?/gm, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim()
            .slice(0, 5000);
          const merchantLabel = escapeHtml(aiMerchant || subject || "Email Receipt");
          const categoryLabel = escapeHtml(category.replace(/_/g, " "));
          const amountStr = `${escapeHtml(currency)} ${amount.toFixed(2)}`;
          const dateStr = escapeHtml(expDate);
          const fromLine = escapeHtml(senderEmail);
          const subjectLine = escapeHtml(subject || "(no subject)");
          const bodyHtml = escapeHtml(cleanBodyText).replace(/\n/g, "<br>");
          bodyHtmlBlock = `<div style="font:14px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:20px;background:#fff;color:#1a1a1a;max-width:720px;line-height:1.5;margin:0 auto;box-sizing:border-box">`
            + `<div style="border-bottom:2px solid #1a1a1a;padding-bottom:12px;margin-bottom:16px">`
            + `<div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#888;margin-bottom:6px">Email Receipt</div>`
            + `<div style="font-size:20px;font-weight:600;color:#1a1a1a">${merchantLabel}</div>`
            + `</div>`
            + `<table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:13px">`
            + `<tr><td style="padding:6px 0;color:#888;width:110px">Amount</td><td style="padding:6px 0;font-weight:600;color:#1a1a1a">${amountStr}</td></tr>`
            + `<tr><td style="padding:6px 0;color:#888">Date</td><td style="padding:6px 0;color:#1a1a1a">${dateStr}</td></tr>`
            + `<tr><td style="padding:6px 0;color:#888">Category</td><td style="padding:6px 0;color:#1a1a1a;text-transform:capitalize">${categoryLabel}</td></tr>`
            + `<tr><td style="padding:6px 0;color:#888">From</td><td style="padding:6px 0;color:#1a1a1a">${fromLine}</td></tr>`
            + `<tr><td style="padding:6px 0;color:#888;vertical-align:top">Subject</td><td style="padding:6px 0;color:#1a1a1a">${subjectLine}</td></tr>`
            + `</table>`
            + `<div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#888;margin-bottom:8px;padding-top:14px;border-top:1px solid #eee">Email Body</div>`
            + `<div style="font-size:13px;line-height:1.6;background:#fafafa;padding:14px 16px;border-radius:6px;border:1px solid #eee;color:#222;word-break:break-word;white-space:normal">${bodyHtml || '<em style="color:#888">No body text.</em>'}</div>`
            + `</div>`;
        }

        // Optional attachment embed (PDF or image) below the body
        let attachmentBlock = "";
        if (primaryAttachment) {
          const a = primaryAttachment;
          const attachBytes = Math.round((a.base64Data.length * 3) / 4);
          const header = `<div style="padding:14px 18px;background:#f5f5f5;border-top:2px solid #aaa;border-bottom:1px solid #ddd;font-weight:600;font-size:13px;color:#333;font-family:-apple-system,sans-serif">Attached: ${escapeHtml(a.filename)} (${(attachBytes / 1024).toFixed(0)} KB)</div>`;
          if (a.contentType === "application/pdf") {
            attachmentBlock = header + `<object data="data:application/pdf;base64,${a.base64Data}" type="application/pdf" style="display:block;width:100%;height:80vh;border:none"><p style="padding:20px;font-family:-apple-system,sans-serif;color:#666">PDF attached — your browser can't render it inline. Tap "Open Full Size" to view.</p></object>`;
          } else if (a.contentType.startsWith("image/")) {
            attachmentBlock = header + `<img src="data:${a.contentType};base64,${a.base64Data}" alt="${escapeHtml(a.filename)}" style="display:block;max-width:100%;height:auto;margin:0 auto"/>`;
          }
        }

        // Wrap in a minimal doc with a charset declaration so the iframe
        // decodes UTF-8 correctly. The Blob URL + iframe approach on the
        // client handles this faithfully without service-worker interference.
        const receiptContent = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:#fff;color:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}img{max-width:100%;height:auto}a{color:#0066cc}</style></head><body>${bodyHtmlBlock}${attachmentBlock}</body></html>`;

        // Always extract a clean plain-text version of the body for the
        // React card the client renders. The client does NOT trust the
        // raw HTML to render correctly — we've burned hours trying to make
        // forwarded transactional emails render in an iframe, and the
        // failure modes (white text on missing CID backgrounds, CSP-blocked
        // remote resources, service-worker interception) are not fixable
        // client-side. The plain-text summary is bulletproof.
        const htmlToCleanText = (s) => String(s || "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<\/?(p|div|br|tr|li|h[1-6]|hr|table)[^>]*>/gi, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/gi, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&#x2F;/gi, "/")
          .replace(/&#x3D;/gi, "=")
          .replace(/[ \t]+/g, " ")
          .replace(/\n[ \t]+/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
        const bodyTextClean = (textBody || htmlToCleanText(htmlBody) || "")
          .replace(/-{3,}\s*forwarded\s*message\s*-{3,}/gi, "")
          .replace(/^>+\s?/gm, "")
          .replace(/\[cid:[^\]]+\]/gi, "") // CID image refs are dead in forwarded mail
          .replace(/\n{3,}/g, "\n\n")
          .trim()
          .slice(0, 5000);
        const summary = {
          merchant: aiMerchant || "",
          category,
          amount,
          currency,
          date: expDate,
          fromEmail: senderEmail,
          subject: subject || "",
          bodyText: bodyTextClean,
          hasAttachment: !!primaryAttachment,
          attachmentName: primaryAttachment ? primaryAttachment.filename : null,
          parseSource,
        };

        // Pick the HTML to render: trim the attachment if combined size
        // would blow past our cap.
        let htmlForRender = receiptContent;
        if (receiptContent.length > MAX_RECEIPT_BYTES) {
          attachmentDropped = true;
          htmlForRender = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:#fff;color:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}img{max-width:100%;height:auto}a{color:#0066cc}</style></head><body>${bodyHtmlBlock}<div style="padding:14px 18px;background:#fff5e6;border-top:1px solid #f2c879;color:#8a5a00;font-size:12px">Attachment "${primaryAttachment ? escapeHtml(primaryAttachment.filename) : "(file)"}" omitted from receipt (too large to embed).</div></body></html>`;
        }

        // Try to render the ORIGINAL email HTML first. If the email was
        // forwarded from a client that preserved its HTML (Apple Mail,
        // Gmail web, etc.), this gives the user the actual visual format
        // of the email. If the result is too small (<30KB — usually means
        // Outlook stripped the HTML and we're rendering empty content),
        // fall back to the hand-built card from parsed text.
        const cardHtml = buildReceiptCardHtml(summary);
        const tryOriginal = htmlBody && htmlBody.trim().length > 200;
        let pngDataUrl = null;
        let pngBytes = 0;
        let receiptStrategyChosen = "card";
        try {
          const startedAt = Date.now();
          if (tryOriginal) {
            const origBuffer = await renderEmailHtmlToPng(receiptContent);
            if (origBuffer.length >= 30000) {
              // Original HTML rendered substantive content
              pngBytes = origBuffer.length;
              pngDataUrl = `data:image/png;base64,${origBuffer.toString("base64")}`;
              receiptStrategyChosen = "original-html";
              console.log("[inbound-email] rendered ORIGINAL→PNG", { ms: Date.now() - startedAt, bytes: pngBytes });
            } else {
              console.warn("[inbound-email] original HTML rendered blank (", origBuffer.length, "bytes), using card");
            }
          }
          if (!pngDataUrl) {
            // Fall back to hand-built card from summary
            const t1 = Date.now();
            const cardBuffer = await renderEmailHtmlToPng(cardHtml);
            pngBytes = cardBuffer.length;
            pngDataUrl = `data:image/png;base64,${cardBuffer.toString("base64")}`;
            receiptStrategyChosen = "card";
            console.log("[inbound-email] rendered CARD→PNG", { ms: Date.now() - t1, bytes: pngBytes });
          }
          if (pngBytes > MAX_RECEIPT_BYTES) {
            console.warn("[inbound-email] PNG too large", pngBytes);
            pngDataUrl = null;
          }
        } catch (renderErr) {
          console.error("[inbound-email] PNG render failed, falling back to HTML:", renderErr?.message);
        }

        if (pngDataUrl) {
          // Primary path: store the screenshot. Existing image renderer +
          // crop UI handle it natively.
          receiptName = `${(subject || "receipt").replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 40)}.png`;
          receiptImage = { name: receiptName, size: pngBytes, type: "image/png", data: pngDataUrl, summary };
          receiptStrategy = "chromium-png";
        } else {
          // Fallback: store the HTML and let the client render the card.
          const receiptB64 = Buffer.from(htmlForRender, "utf-8").toString("base64");
          receiptName = `${(subject || "receipt").replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 40)}.html`;
          receiptImage = { name: receiptName, size: htmlForRender.length, type: "text/html", data: `data:text/html;base64,${receiptB64}`, summary };
        }
      }

      console.log("[inbound-email] RECEIPT", JSON.stringify({
        strategy: receiptStrategy,
        receiptType: receiptImage.type,
        receiptBytes: receiptImage.size,
        attachmentDropped,
        hasHtmlBody: !!htmlBody,
        hasTextBody: !!textBody,
        attachment: primaryAttachment ? { filename: primaryAttachment.filename, contentType: primaryAttachment.contentType, bytes: Math.round((primaryAttachment.base64Data.length * 3) / 4) } : null,
      }));

      const cleanNotes = `From: ${senderEmail}\nMerchant: ${aiMerchant || "—"}\nDate: ${expDate}\nAmount: ${currency} ${amount.toFixed(2)}\nParsed by: ${parseSource}\n${primaryAttachment ? `Attachment: ${primaryAttachment.filename}${attachmentDropped ? " (too large — using receipt card)" : ""}\n` : ""}\nForwarded via expenses@gocontinuum.app`;

      const expPayload = {
        user_id: userId,
        trip_id: null,
        category,
        description: finalDescription.slice(0, 200),
        amount,
        currency,
        date: expDate,
        payment_method: "",
        receipt: true,
        receipt_image: receiptImage,
        notes: cleanNotes,
        individuals: "",
        fx_rate: 1,
        usd_reimbursement: null,
      };
      const insertResp = await fetch(`${supabaseUrl}/rest/v1/expenses`, {
        method: "POST",
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(expPayload),
      });
      if (!insertResp.ok) {
        const errText = await insertResp.text().catch(() => "");
        console.error("[inbound-email] expense insert failed", insertResp.status, errText.slice(0, 400));
        return res.status(200).json({ ok: false, type: "expense", error: "supabase_insert_failed", status: insertResp.status, detail: errText.slice(0, 400) });
      }
      return res.status(200).json({ ok: true, type: "expense", subject, amount, currency, date: expDate, hasAttachment: !!primaryAttachment, parseSource, receiptStrategy, attachmentDropped, receiptBytes: receiptImage.size });
    }

    // Extract text content from MIME email
    let textContent = "";
    const lines = rawText.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (!/Content-Type:\s*text\/plain/i.test(lines[i])) continue;
      const nearby = lines.slice(Math.max(0, i - 2), i + 3).join(" ");
      const isBase64 = /base64/i.test(nearby);
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== "") j++;
      j++;
      const bodyLines = [];
      while (j < lines.length && !lines[j].startsWith("--")) {
        bodyLines.push(lines[j].trim());
        j++;
      }
      if (isBase64) {
        try {
          textContent = Buffer.from(bodyLines.join(""), "base64").toString("utf-8");
        } catch { textContent = bodyLines.join("\n"); }
      } else {
        textContent = bodyLines.join("\n")
          .replace(/=\r?\n/g, "")
          .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      }
      if (textContent) break;
    }

    if (!textContent) {
      textContent = rawText.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
    }

    console.log("[inbound-email] TEXT EXTRACT", JSON.stringify({ textLen: textContent.length, rawLen: rawText.length, preview: textContent.slice(0, 200) }));

    // ── AI-powered booking parser via Claude ──
    const anthropicKey = (process.env.ANTHROPIC_API_KEY || "").trim();
    let segments = [];
    let confirmCode = "";
    let passengerName = "";
    let parseMethod = "none";

    if (anthropicKey && textContent.length > 10) {
      try {
        const emailSnippet = textContent.slice(0, 12000); // Keep within token limits
        const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2048,
            messages: [{
              role: "user",
              content: `Parse this travel booking email and extract ALL booking segments. Return ONLY valid JSON, no markdown, no explanation.

The email may contain flights, hotels, car rentals, trains, or activities. Extract every segment found.

For FLIGHTS with stopovers/connections, create SEPARATE segments for each leg. For example, BDA→LHR→HND should be two segments: BDA→LHR and LHR→HND, each with their own flight number.

Return this exact JSON structure:
{
  "bookingType": "new_booking | change | cancellation | reminder",
  "confirmationCode": "string or null",
  "passengerName": "string or null",
  "segments": [
    {
      "type": "flight" | "hotel" | "rental" | "train" | "activity",

      // Flight fields:
      "flightNumber": "e.g. BA158",
      "departureAirport": "3-letter IATA code",
      "arrivalAirport": "3-letter IATA code",
      "date": "YYYY-MM-DD (departure date)",
      "arrivalDate": "YYYY-MM-DD — REQUIRED. If arrival is the same calendar day as departure, repeat the departure date here. Only differ when the flight crosses midnight or the date line.",
      "departureTime": "HH:MM am/pm",
      "arrivalTime": "HH:MM am/pm",
      "airline": "full airline name",
      "aircraft": "e.g. Boeing 777-200",
      "fareClass": "economy | premium_economy | business | first — see CABIN CLASS RULES below",
      "bookingClass": "single letter e.g. J, D, Y",
      "departureTerminal": "e.g. T5 or null",
      "arrivalTerminal": "e.g. T3 or null",

      // Hotel fields:
      "property": "hotel name",
      "location": "full address or city",
      "date": "YYYY-MM-DD (check-in date — REQUIRED for hotels)",
      "checkoutDate": "YYYY-MM-DD (check-out date — REQUIRED for hotels, calculate from check-in + nights if not explicit)",
      "nights": number,
      "roomType": "string or null",
      "totalCost": "number as string or null",

      // Shared fields:
      "confirmationCode": "string or null — REQUIRED: extract the booking reference / confirmation number"
    }
  ]
}

IMPORTANT:
- For hotels, you MUST extract the check-in date, check-out date, and number of nights. If only check-in and nights are given, calculate check-out. If only check-in and check-out are given, calculate nights.
- You MUST extract the confirmation code / booking reference / record locator. Look for labels like "Confirmation #", "Booking Reference", "Record Locator", "Reservation ID", etc.
- For flights, "arrivalDate" is REQUIRED and must always be filled. If the flight arrives the same calendar day as departure, use the same date string as "date". Only set a different date when the flight crosses midnight (red-eye, transpacific, etc.) or the international date line.

AIRPORT CODE RULES — CRITICAL:
- "departureAirport" / "arrivalAirport" must be the EXACT 3-letter IATA AIRPORT code printed in the email. NEVER infer it from a city name. NEVER substitute a different airport.
- Many cities have multiple airports — if the email shows HND, return HND (not NRT). LGW stays LGW (not LHR). EWR stays EWR (not JFK). MDW stays MDW (not ORD). ORY stays ORY (not CDG). LIN stays LIN (not MXP). DCA stays DCA (not IAD). HOU stays HOU (not IAH).
- NEVER return a 3-letter CITY (metro) code: TYO (Tokyo), LON (London), NYC (New York), PAR (Paris), CHI (Chicago), MIL (Milan), WAS (Washington), MOW (Moscow), STO (Stockholm), BUE (Buenos Aires), SAO (São Paulo), RIO (Rio), YMQ (Montréal), YTO (Toronto), SEL (Seoul), OSA (Osaka), BHX-area, etc. Always pick the specific airport actually shown.
- If only a city name appears with no IATA code, set the field to null rather than guessing the primary airport.

CABIN CLASS RULES (for "fareClass"):
- "economy" — the standard rear cabin. This includes ALL of: Main Cabin, Basic Economy, Economy Plus, Economy Comfort, Comfort+, Main Cabin Extra, Preferred Seating, Extra Legroom, Even More Space, Standard, Coach, Saver. These are extra-legroom or perks WITHIN the economy cabin — they are still economy. Booking classes Y, B, M, H, K, L, V, S, N, Q, O, G, X, E, T, U all map to economy.
- "premium_economy" — ONLY when the airline operates a SEPARATE PREMIUM ECONOMY CABIN with its own seat product (wider seats, separate galley, recliner-style or shell seats). Marketing names include: Delta Premium Select, United Premium Plus, American Premium Economy, BA World Traveller Plus, Virgin Premium, ANA Premium Economy, Air France Premium Economy, Lufthansa Premium Economy, Cathay Premium Economy, Singapore Premium Economy, JAL Premium Economy, Qantas Premium Economy, Air New Zealand The Works Premium. Booking classes typically W, P, A, R. If the email says only "Comfort+", "Main Cabin Extra", "Economy Plus", "Preferred", or similar, that is ECONOMY, NOT premium economy.
- "business" — Business Class, Polaris, ClubWorld, Apex Suite, Qsuite, Reverse Herringbone, J/C/D/I/Z classes.
- "first" — International First Class, Suite, F/A/P classes.
- When uncertain, default to "economy" — most tickets are economy.

Classify "bookingType" with this guidance:
- "new_booking" — first booking confirmation. Subject often says "Booking confirmed", "Reservation confirmed", "E-ticket", "Your itinerary".
- "change" — modification to an existing booking. Subject says "Change", "Updated", "Schedule change", "Itinerary update", "Modified", "Re-issued ticket", "New flight time".
- "cancellation" — booking cancelled. Subject says "Cancelled", "Canceled", "Refund", "Reservation cancelled".
- "reminder" — pre-arrival reminder, check-in reminder, "Your trip is in X days", "Time to check in", "Get ready for your stay", "Online check-in now open". These are NOT new bookings — they're nudges about an existing one.
When in doubt between new_booking and reminder, prefer reminder if the email talks about an upcoming/imminent stay/flight without including the original booking action.

Email content:
${emailSnippet}`,
            }],
          }),
        });

        const aiData = await safeJson(aiResp);
        console.log("[inbound-email] AI RAW RESPONSE", JSON.stringify({ status: aiResp.status, type: aiData?.type, error: aiData?.error, contentLen: aiData?.content?.[0]?.text?.length }));
        if (aiData?.error) {
          console.error("[inbound-email] AI API ERROR", JSON.stringify(aiData.error));
        }
        const aiText = aiData?.content?.[0]?.text || "";
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          confirmCode = parsed.confirmationCode || "";
          passengerName = parsed.passengerName || "";
          const bookingType = ["new_booking", "change", "cancellation", "reminder"].includes(parsed.bookingType)
            ? parsed.bookingType : "new_booking";
          if (parsed.segments && Array.isArray(parsed.segments)) {
            segments = parsed.segments.map(s => ({
              ...s,
              confirmationCode: s.confirmationCode || confirmCode,
            }));
            parseMethod = `ai|${bookingType}`;
          } else {
            parseMethod = `ai|${bookingType}`;
          }
        }
        console.log("[inbound-email] AI PARSE", JSON.stringify({ parseMethod, segmentCount: segments.length, confirmCode, subject: subject.slice(0, 60) }));
      } catch (aiErr) {
        parseMethod = "ai_error:" + (aiErr.message || "unknown").slice(0, 100);
        console.error("[inbound-email] AI parse error:", aiErr.message, aiErr.stack);
      }
    } else {
      parseMethod = "skipped:key=" + !!anthropicKey + ",textLen=" + textContent.length;
    }

    // Fallback: basic regex confirmation code if AI didn't run or failed
    if (!confirmCode) {
      const confMatch = textContent.match(/(?:confirmation|booking|reservation)\s*(?:number|code|#|:)\s*#?\s*([A-Z0-9]{5,12})/i)
        || textContent.match(/(?:confirmation|booking|reservation)\s*#?\s*([A-Z0-9]{5,12})/i)
        || textContent.match(/(?:record\s*locator|pnr)[:\s#]*([A-Z0-9]{5,8})/i);
      confirmCode = confMatch?.[1]?.toUpperCase() || "";
    }

    // Attachment fallback for trips@ — when the email body produced no
    // segments (or wasn't parseable) but the user attached a PDF / image /
    // .docx of the booking confirmation, run the attachment through Claude
    // (Vision for image, native document parse for PDF, mammoth → text for
    // Word) with a generic booking prompt and merge any segments found.
    const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    // Pick the best attachment to feed to the booking parser. PDFs and
    // Word docs are most likely to be itineraries; fall back to images.
    const bookingAttachment = primaryAttachment
      || attachments.find(a => a.contentType === DOCX_MIME)
      || null;
    if (segments.length === 0 && bookingAttachment && anthropicKey) {
      try {
        const isPdf = bookingAttachment.contentType === "application/pdf";
        const isDocx = bookingAttachment.contentType === DOCX_MIME || /\.docx$/i.test(bookingAttachment.filename || "");
        let attachmentBlock;
        if (isDocx) {
          const { default: mammoth } = await import("mammoth");
          const buf = Buffer.from(bookingAttachment.base64Data, "base64");
          const { value } = await mammoth.extractRawText({ buffer: buf });
          const docText = (value || "").trim().slice(0, 18000);
          attachmentBlock = { type: "text", text: `Document contents (extracted from a Word file):\n\n${docText}\n\n---\n\n` };
        } else if (isPdf) {
          attachmentBlock = { type: "document", source: { type: "base64", media_type: "application/pdf", data: bookingAttachment.base64Data } };
        } else {
          attachmentBlock = { type: "image", source: { type: "base64", media_type: bookingAttachment.contentType, data: bookingAttachment.base64Data } };
        }
        const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2048,
            messages: [{
              role: "user",
              content: [
                attachmentBlock,
                { type: "text", text: `Extract ALL travel booking segments from this attachment. Return ONLY valid JSON, no markdown.

Detect each segment's type and include the relevant fields. For multi-leg flights, create a separate segment per leg.

{
  "bookingType": "new_booking | change | cancellation | reminder",
  "confirmationCode": "string or null",
  "passengerName": "string or null",
  "segments": [
    {
      "type": "flight" | "hotel" | "rental" | "train" | "activity" | "transfer" | "ferry" | "cruise",
      "flightNumber": "e.g. BA158",
      "airline": "full airline name",
      "departureAirport": "3-letter IATA AIRPORT code",
      "arrivalAirport": "3-letter IATA AIRPORT code",
      "date": "YYYY-MM-DD (departure or check-in)",
      "arrivalDate": "YYYY-MM-DD (REQUIRED for flights — same as date if same calendar day)",
      "checkoutDate": "YYYY-MM-DD (REQUIRED for hotels)",
      "departureTime": "HH:MM am/pm",
      "arrivalTime": "HH:MM am/pm",
      "departureTerminal": "e.g. T5 or null",
      "arrivalTerminal": "e.g. T3 or null",
      "fareClass": "economy | premium_economy | business | first",
      "bookingClass": "single letter or null",
      "property": "hotel name (hotel)",
      "location": "address or city",
      "nights": number,
      "operator": "company name (rental/transfer/activity)",
      "totalCost": "number or null",
      "currency": "3-letter currency code",
      "confirmationCode": "string or null"
    }
  ]
}

AIRPORT CODE RULES — CRITICAL: For "departureAirport" / "arrivalAirport", use the EXACT 3-letter IATA AIRPORT code printed in the document. NEVER infer from city name. NEVER substitute a different airport. Many cities have multiple airports — HND ≠ NRT, LGW ≠ LHR, EWR ≠ JFK, MDW ≠ ORD, ORY ≠ CDG, LIN ≠ MXP, DCA ≠ IAD, HOU ≠ IAH. NEVER return a city/metro code (TYO, LON, NYC, PAR, CHI, MIL, WAS, BUE, SAO, YMQ, YTO, SEL, OSA, etc.). If only a city name is shown with no airport code, return null.` },
              ],
            }],
          }),
        });
        const aiData = await safeJson(aiResp);
        const text = aiData?.content?.[0]?.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed?.segments) && parsed.segments.length > 0) {
            segments = parsed.segments.map(s => ({ ...s, confirmationCode: s.confirmationCode || parsed.confirmationCode || confirmCode }));
            if (!confirmCode && parsed.confirmationCode) confirmCode = parsed.confirmationCode;
            if (!passengerName && parsed.passengerName) passengerName = parsed.passengerName;
            const bookingType = ["new_booking", "change", "cancellation", "reminder"].includes(parsed.bookingType) ? parsed.bookingType : "new_booking";
            parseMethod = `ai|${bookingType}|attachment`;
          }
        }
      } catch (attErr) {
        console.error("[inbound-email] attachment-as-itinerary parse error:", attErr.message);
      }
    }

    // If AI parsing produced no segments, insert a minimal placeholder

    // REMOVED: old regex parsing — now handled by AI above

    // Derive intent from parseMethod (set by AI as `ai|<bookingType>`)
    const intent = (() => {
      const t = parseMethod.split("|")[1];
      if (t === "cancellation" || t === "change" || t === "reminder") return t;
      return null; // null = treat as new booking
    })();

    // For cancellations: try to match the confirmation_code (or flight number
    // + date) against the user's existing trip segments. If we find a match,
    // store it in match_meta so the inbox UI can offer one-click "Mark
    // cancelled" without requiring the user to hunt through trips.
    let matchMeta = null;
    if (intent === "cancellation" && userId) {
      try {
        const tripsRes = await fetch(`${supabaseUrl}/rest/v1/trips?user_id=eq.${userId}&select=id,segments`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        });
        const userTrips = await safeJson(tripsRes);
        if (Array.isArray(userTrips)) {
          const cleanCode = (s) => (s || "").toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
          const targetCode = cleanCode(confirmCode);
          for (const trip of userTrips) {
            const segs = Array.isArray(trip.segments) ? trip.segments : [];
            const hits = [];
            for (let i = 0; i < segs.length; i++) {
              const segCode = cleanCode(segs[i]?.confirmationCode);
              if (targetCode && segCode && segCode === targetCode) {
                hits.push(i);
              }
            }
            if (hits.length > 0) {
              matchMeta = {
                matched: true,
                trip_id: trip.id,
                segment_indices: hits,
                matched_by: "confirmation_code",
              };
              break;
            }
          }
          // Fallback: match by flight number + date (only for cancellations
          // referencing a single flight segment)
          if (!matchMeta && segments.length > 0) {
            const cancelSeg = segments.find(s => s.type === "flight" && s.flightNumber && s.date);
            if (cancelSeg) {
              const targetFlight = cleanCode(cancelSeg.flightNumber);
              const targetDate = cancelSeg.date;
              for (const trip of userTrips) {
                const segs = Array.isArray(trip.segments) ? trip.segments : [];
                const hits = [];
                for (let i = 0; i < segs.length; i++) {
                  if (segs[i]?.type !== "flight") continue;
                  if (cleanCode(segs[i]?.flightNumber) === targetFlight && segs[i]?.date === targetDate) {
                    hits.push(i);
                  }
                }
                if (hits.length > 0) {
                  matchMeta = {
                    matched: true,
                    trip_id: trip.id,
                    segment_indices: hits,
                    matched_by: "flight_number_date",
                  };
                  break;
                }
              }
            }
          }
          if (!matchMeta) matchMeta = { matched: false };
        }
      } catch (matchErr) {
        console.error("[inbound-email] cancellation match error:", matchErr.message);
        matchMeta = { matched: false, error: matchErr.message?.slice(0, 200) };
      }
    }

    // Insert into Supabase
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/itineraries`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        user_id: userId,
        source: "email",
        sender_email: senderEmail,
        subject: subject || confirmCode || "Forwarded Booking",
        raw_text: textContent.slice(0, 50000),
        parsed_segments: segments,
        booking_source: senderEmail.match(/@([^.]+)\./)?.[1] || "",
        confirmation_code: confirmCode,
        passenger_name: passengerName || segments[0]?.guestName || "",
        parse_method: parseMethod,
        intent,
        match_meta: matchMeta,
        status: "pending",
      }),
    });

    const insertData = await safeJson(insertRes);

    return res.status(200).json({
      ok: true,
      itinerary_id: insertData?.[0]?.id || null,
      segments: segments.length,
      parseMethod,
      textLen: textContent.length,
      user: userId,
    });

  } catch (err) {
    console.error("Inbound email error:", err);
    // Forward to Sentry — webhook errors are otherwise silent
    try { const { captureBackendError } = await import("../api-lib/sentry.js"); await captureBackendError(err, { source: "inbound-email" }); } catch (_) {}
    return res.status(200).json({ ok: false, error: err.message });
  }
}

export default withSentry(handler);
