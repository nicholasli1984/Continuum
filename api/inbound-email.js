export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
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

    // Walk every candidate; first one with a meaningful classification wins
    let isExpenseEmail = false;
    let toToken = "";
    for (const addr of candidateRecipients) {
      const c = classifyRecipient(addr);
      if (c.isExpense) { isExpenseEmail = true; if (!toToken && c.token && c.token !== "expenses") toToken = c.token; }
      else if (!toToken && c.token && c.token !== "expenses" && c.token !== "trips") toToken = c.token;
    }

    // Legacy fallbacks from the original first-To-only parser (in case our header
    // enumeration missed something)
    const toRaw = (toEmail.match(/<?([^@<]+)@/)?.[1] || "").trim().toLowerCase();
    const toDomain = (toEmail.match(/@([^\s>]+)/)?.[1] || "").trim().toLowerCase();
    if (!isExpenseEmail) {
      isExpenseEmail = toDomain.startsWith("expenses.") || toDomain === "expenses.gocontinuum.app" || toRaw === "expenses" || toRaw.includes("+expense");
    }
    if (!toToken) toToken = toRaw.replace(/\+expense$/, "").replace(/\+.*$/, "");

    // Last-resort fallback: scan the raw text for "expenses@gocontinuum.app" —
    // if present anywhere in routing envelopes, treat this as expense email.
    if (!isExpenseEmail && /\bexpenses@gocontinuum\.app\b/i.test(rawText.slice(0, 4000))) {
      isExpenseEmail = true;
    }

    console.log("[inbound-email] ROUTE", JSON.stringify({
      isExpenseEmail, toToken, candidateRecipients, toRaw, toDomain,
    }));

    // Look up user — first by token in the TO address, then by any candidate sender
    let userId = null;
    let matchSource = null;

    // Try token match (e.g., nicholas.abc123@trips.gocontinuum.app)
    if (toToken && toToken !== "expenses" && toToken !== "trips") {
      const fwdRes = await fetch(`${supabaseUrl}/rest/v1/user_forwarding_addresses?forwarding_address=eq.${encodeURIComponent(toToken)}&select=user_id`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      });
      const fwdData = await fwdRes.json();
      if (fwdData?.[0]?.user_id) { userId = fwdData[0].user_id; matchSource = `token:${toToken}`; }
    }

    // If no token match, try each candidate sender in priority order
    if (!userId && candidateSenders.length > 0) {
      for (const candidate of candidateSenders) {
        const fwdRes = await fetch(`${supabaseUrl}/rest/v1/user_forwarding_addresses?email=eq.${encodeURIComponent(candidate)}&select=user_id,email`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        });
        const fwdData = await fwdRes.json();
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

    // ── EXPENSE EMAIL FLOW ──
    if (isExpenseEmail) {
      const emailLines = rawText.split(/\r?\n/);

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

      const htmlBody = extractMimePart("text\\/html");
      const textBody = extractMimePart("text\\/plain") || rawText.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();

      // Search both plain text and stripped HTML for amounts
      const searchText = (textBody + " " + htmlBody.replace(/<[^>]*>/g, " ")).replace(/&nbsp;/gi, " ").replace(/&#36;/g, "$").replace(/&amp;/gi, "&").replace(/\s+/g, " ");

      // Extract ALL monetary amounts using multiple patterns
      const allAmounts = [];
      let m;
      // Pattern 1: $123.45
      const p1 = /\$\s*([0-9,]+\.\d{2})/g;
      while ((m = p1.exec(searchText)) !== null) { const v = parseFloat(m[1].replace(/,/g, "")); if (v > 0) allAmounts.push(v); }
      // Pattern 2: USD 123.45 or EUR 123.45
      const p2 = /(?:USD|EUR|GBP|CAD)\s*([0-9,]+\.\d{2})/gi;
      while ((m = p2.exec(searchText)) !== null) { const v = parseFloat(m[1].replace(/,/g, "")); if (v > 0) allAmounts.push(v); }
      // Pattern 3: "Total" or "Amount" near a number
      const p3 = /(?:total|amount\s*due|grand\s*total|balance\s*due|estimated\s*total|room\s*total|stay\s*total|charge|payment|cost)[:\s]*\$?\s*([0-9,]+\.\d{2})/gi;
      while ((m = p3.exec(searchText)) !== null) { const v = parseFloat(m[1].replace(/,/g, "")); if (v > 0) allAmounts.push(v); }
      // Pattern 4: number followed by USD/currency
      const p4 = /([0-9,]+\.\d{2})\s*(?:USD|EUR|GBP|CAD)/gi;
      while ((m = p4.exec(searchText)) !== null) { const v = parseFloat(m[1].replace(/,/g, "")); if (v > 0) allAmounts.push(v); }
      // Pattern 5: bare numbers that look like prices (near price-like context)
      const p5 = /(?:rate|price|per\s*night|nightly)[:\s]*\$?\s*([0-9,]+\.\d{2})/gi;
      while ((m = p5.exec(searchText)) !== null) { const v = parseFloat(m[1].replace(/,/g, "")); if (v > 0) allAmounts.push(v); }
      // The total is usually the largest amount
      const amount = allAmounts.length > 0 ? Math.max(...allAmounts) : 0;

      // Currency detection
      let currency = "USD";
      if (searchText.includes("£") || /GBP/i.test(searchText)) currency = "GBP";
      else if (searchText.includes("€") || /EUR/i.test(searchText)) currency = "EUR";
      else if (/CAD/i.test(searchText)) currency = "CAD";

      // Date extraction
      let expDate = new Date().toISOString().slice(0, 10);
      const datePats = [
        /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
        /(\w{3,9}\s+\d{1,2},?\s+\d{4})/,
        /(\d{4}-\d{2}-\d{2})/,
      ];
      for (const pat of datePats) {
        const dm = searchText.match(pat);
        if (dm) { const d = new Date(dm[1]); if (!isNaN(d.getTime()) && d.getFullYear() > 2020) { expDate = d.toISOString().slice(0, 10); break; } }
      }

      // Store the original HTML email as the receipt (viewable in an iframe)
      // If no HTML, wrap plain text in minimal HTML
      const receiptContent = htmlBody || `<html><body style="font-family:monospace;padding:20px;white-space:pre-wrap">${textBody.slice(0, 15000).replace(/</g, "&lt;")}</body></html>`;
      const receiptB64 = Buffer.from(receiptContent).toString("base64");
      const receiptDataUrl = `data:text/html;base64,${receiptB64}`;

      // Clean notes — just key info, no HTML
      const cleanNotes = `From: ${senderEmail}\nDate: ${expDate}\nAmount: ${currency} ${amount.toFixed(2)}\n\nForwarded via expenses@gocontinuum.app`;

      const expPayload = {
        user_id: userId,
        trip_id: null,
        category: "biz_meals",
        description: (subject || "Forwarded receipt").slice(0, 200),
        amount,
        currency,
        date: expDate,
        payment_method: "",
        receipt: true,
        receipt_image: { name: `${(subject || "receipt").replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 40)}.html`, size: receiptContent.length, type: "text/html", data: receiptDataUrl },
        notes: cleanNotes,
        individuals: "",
        fx_rate: 1,
        usd_reimbursement: null,
      };
      await fetch(`${supabaseUrl}/rest/v1/expenses`, {
        method: "POST",
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(expPayload),
      });
      return res.status(200).json({ ok: true, type: "expense", subject, amount, currency, date: expDate });
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
  "confirmationCode": "string or null",
  "passengerName": "string or null",
  "segments": [
    {
      "type": "flight" | "hotel" | "rental" | "train" | "activity",

      // Flight fields:
      "flightNumber": "e.g. BA158",
      "departureAirport": "3-letter IATA code",
      "arrivalAirport": "3-letter IATA code",
      "date": "YYYY-MM-DD",
      "arrivalDate": "YYYY-MM-DD or null (if different from departure)",
      "departureTime": "HH:MM am/pm",
      "arrivalTime": "HH:MM am/pm",
      "airline": "full airline name",
      "aircraft": "e.g. Boeing 777-200",
      "fareClass": "economy | premium_economy | business | first",
      "bookingClass": "single letter e.g. J, D, Y",
      "departureTerminal": "e.g. T5 or null",
      "arrivalTerminal": "e.g. T3 or null",

      // Hotel fields:
      "property": "hotel name",
      "location": "address or city",
      "checkoutDate": "YYYY-MM-DD",
      "nights": number,
      "roomType": "string or null",
      "totalCost": "number as string or null",

      // Shared fields:
      "confirmationCode": "string or null"
    }
  ]
}

Email content:
${emailSnippet}`,
            }],
          }),
        });

        const aiData = await aiResp.json();
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
          if (parsed.segments && Array.isArray(parsed.segments)) {
            segments = parsed.segments.map(s => ({
              ...s,
              confirmationCode: s.confirmationCode || confirmCode,
            }));
            parseMethod = "ai";
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

    // If AI parsing produced no segments, insert a minimal placeholder

    // REMOVED: old regex parsing — now handled by AI above

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
        status: "pending",
      }),
    });

    const insertData = await insertRes.json();

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
    return res.status(200).json({ ok: false, error: err.message });
  }
}
