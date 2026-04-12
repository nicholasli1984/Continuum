export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") return res.status(200).json({ status: "ok", message: "Continuum inbound email endpoint" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

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

    // Extract email headers
    const fromMatch = rawText.match(/^From:\s*(.+?)$/mi);
    const toMatch = rawText.match(/^To:\s*(.+?)$/mi);
    const subjectMatch = rawText.match(/^Subject:\s*(.+?)$/mi);
    let fromEmail = fromMatch?.[1]?.trim() || "";
    let toEmail = toMatch?.[1]?.trim() || "";
    let subject = subjectMatch?.[1]?.trim() || "";

    // Decode RFC 2047 subject
    subject = subject.replace(/=\?[^?]+\?B\?([^?]+)\?=/gi, (_, b64) => {
      try { return Buffer.from(b64, "base64").toString("utf-8"); } catch { return _; }
    }).replace(/\s+/g, " ").trim();

    // Extract sender email address
    const senderEmail = fromEmail.match(/<?([^\s<>]+@[^\s<>]+)>?/)?.[1]?.toLowerCase() || "";

    // Extract forwarding token from "to" address
    const toToken = toEmail.match(/<?([^@<]+)@/)?.[1]?.trim().toLowerCase() || "";

    // Look up user by forwarding address token
    let userId = null;

    if (toToken) {
      const fwdRes = await fetch(`${supabaseUrl}/rest/v1/user_forwarding_addresses?forwarding_address=eq.${encodeURIComponent(toToken)}&select=user_id`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      });
      const fwdData = await fwdRes.json();
      if (fwdData?.[0]?.user_id) userId = fwdData[0].user_id;
    }

    // Also try matching by sender email
    if (!userId && senderEmail) {
      const fwdRes = await fetch(`${supabaseUrl}/rest/v1/user_forwarding_addresses?email=eq.${encodeURIComponent(senderEmail)}&select=user_id`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      });
      const fwdData = await fwdRes.json();
      if (fwdData?.[0]?.user_id) userId = fwdData[0].user_id;
    }

    if (!userId) {
      return res.status(200).json({ ok: true, message: "No matching user", from: senderEmail, to: toToken });
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

    // Parse booking info — confirmation code (require "confirmation" or "booking" nearby, not random words)
    const confMatch = textContent.match(/(?:confirmation|booking|reservation)\s*(?:number|code|#|:)\s*#?\s*([A-Z0-9]{5,12})/i)
      || textContent.match(/(?:confirmation|booking|reservation)\s*#?\s*([A-Z0-9]{5,12})/i)
      || textContent.match(/(?:record\s*locator|pnr)[:\s#]*([A-Z0-9]{5,8})/i);
    const confirmCode = confMatch?.[1]?.toUpperCase() || "";

    // Parse helper
    const parseDate = (s) => {
      if (!s) return "";
      // Handle "April 29, 2026" or "Apr 29, 2026"
      const d = new Date(s.replace(/,/g, ""));
      return !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "";
    };

    // Detect hotel vs flight — use subject + first portion of body (not ads/footer)
    const detectContent = (subject + " " + textContent).slice(0, 4000);
    const hasCheckinOut = /check.?in.*check.?out|check.?out.*check.?in/is.test(detectContent);
    const hasHotelBrand = /(?:hotel|resort|marriott|hilton|hyatt|sheraton|westin|residence\s+inn|courtyard|fairmont|four\s+seasons|ritz.?carlton|intercontinental|holiday\s+inn|best\s+western|radisson|wyndham|accor|novotel|sofitel|mandarin|peninsula|shangri|ryokan|hostel|airbnb|vrbo)/i.test(detectContent);
    const hasFlightRoute = /\b[A-Z]{3}\s*(?:→|->|to|–|—)\s*[A-Z]{3}\b/.test(detectContent);
    const hasBoardingPass = /boarding\s*pass|departure\s*gate|seat\s*\d+[A-Z]/i.test(detectContent);

    const subjectIsHotel = /(?:hotel|resort|marriott|hilton|hyatt|sheraton|westin|residence\s+inn|courtyard|fairmont|ritz.?carlton|intercontinental|holiday\s+inn)/i.test(subject);
    const isHotel = subjectIsHotel || ((hasCheckinOut || hasHotelBrand) && !hasFlightRoute && !hasBoardingPass);
    const segments = [];

    if (isHotel) {
      // Hotel parsing — extract property name from subject or body
      let property = "";
      // Try subject first
      const subjPropMatch = subject.match(/(?:for|at)\s+(.+?)(?:\s*$)/i);
      if (subjPropMatch) property = subjPropMatch[1].trim();
      // Try body patterns
      if (!property) {
        const bodyProp = textContent.match(/(?:confirmed\s+at|booking\s+(?:at|for)|reservation\s+(?:at|for))\s+([^\n.!,]+)/i)
          || textContent.match(/thank\s+you\s+for\s+booking\s+(?:with\s+us.*?\n\s*.*?\n\s*)?(?:at\s+)?([^\n.!]+?(?:hotel|resort|inn|suites?|lodge|marriott|hilton|hyatt)[^\n.!]*)/i);
        if (bodyProp) property = bodyProp[1].trim();
      }
      if (!property) property = subject.replace(/^(?:Fwd:|Re:|Reservation\s+Confirmation\s*#?\s*\d*\s*(?:for)?)\s*/i, "").trim() || "Hotel";
      property = property.replace(/\[.*?\]/g, "").slice(0, 120);

      // Check-in / Check-out dates
      const checkinMatch = textContent.match(/check.?in[:\s]*(?:\w+day,?\s*)?(\w+\s+\d{1,2},?\s*\d{4}|\d{4}-\d{2}-\d{2})/i);
      const checkoutMatch = textContent.match(/check.?out[:\s]*(?:\w+day,?\s*)?(\w+\s+\d{1,2},?\s*\d{4}|\d{4}-\d{2}-\d{2})/i);
      const ci = parseDate(checkinMatch?.[1]);
      const co = parseDate(checkoutMatch?.[1]);

      // Nights
      const nightsMatch = textContent.match(/(\d+)\s*night/i) || textContent.match(/your\s+stay:\s*(\d+)\s*night/i);
      const nights = nightsMatch ? parseInt(nightsMatch[1]) : (ci && co ? Math.max(1, Math.round((new Date(co) - new Date(ci)) / 86400000)) : 1);

      // Clean text for address parsing (remove [image:...] tags and excess whitespace)
      const cleanText = textContent.replace(/\[image:[^\]]*\]/g, "").replace(/\s+/g, " ");

      // Location / address — match street number + street name + city + state/zip
      let location = "";
      const addrMatch = cleanText.match(/(\d+\s+[A-Za-z][A-Za-z\s.]{3,40}(?:Drive|Street|Avenue|Road|Blvd|Boulevard|Way|Lane|Place|Court|Circle|Parkway|Highway|Plaza|Square|Terrace)[,.\s]+[A-Za-z\s]+,\s*[A-Za-z\s]+\d{4,5}(?:\s+\w{2,3})?)/i);
      if (addrMatch) {
        location = addrMatch[1].trim();
      } else if (property) {
        // Look for address line right after property name
        const propIdx = cleanText.indexOf(property);
        if (propIdx > -1) {
          const after = cleanText.slice(propIdx + property.length, propIdx + property.length + 200);
          const addrLine = after.match(/\s*(\d+\s+[A-Za-z][^\n,]{5,60}(?:,\s*[A-Za-z][^\n,]{2,30}){1,2}\s*\d{4,5})/);
          if (addrLine) location = addrLine[1].trim();
        }
      }

      // Room type — extract just the room description
      let roomType = "";
      const roomMatch = cleanText.match(/room\s*type\s*:?\s*([A-Za-z0-9,.\s]+?)(?:\s*(?:UPGRADE|Guaranteed|Request|All\s+Request))/i)
        || cleanText.match(/room\s*type\s*:?\s*\n?\s*([A-Za-z0-9,\s]{3,50})/i);
      if (roomMatch) roomType = roomMatch[1].trim().slice(0, 60);

      // Total cost
      const costMatch = textContent.match(/total\s+(?:for\s+stay|cost|charge)[^$\d]*(\d[\d,.]+)\s*(?:USD|EUR|GBP|CAD|AUD)?/i);
      const totalCost = costMatch?.[1]?.replace(/,/g, "") || "";

      // Guest name
      const guestMatch = textContent.match(/(?:thank\s+you\s+for\s+booking\s+with\s+us,?\s*)([A-Z][a-z]+\s+[A-Z][a-z]+)/i)
        || textContent.match(/(?:guest\s*name)[:\s]*\n?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i);

      segments.push({
        type: "hotel", property, location, date: ci, checkoutDate: co, nights,
        confirmationCode: confirmCode, roomType, totalCost,
        guestName: guestMatch?.[1] || "",
      });
    } else {
      // Flight detection
      const knownCarriers = ["AA","DL","UA","WN","B6","AS","F9","NK","AF","KL","BA","AC","EK","TK","QF","SQ","CX","LH","NH","JL","QR","EY","VS","AZ","IB","TP","LX","OS","SK","AY","FI"];
      const flightMatches = [...textContent.matchAll(/\b([A-Z]{2})\s*(\d{2,4})\b/g)].filter(m => knownCarriers.includes(m[1]));
      const routeMatches = [...textContent.matchAll(/\b([A-Z]{3})\s*(?:→|->|to|–|—)\s*([A-Z]{3})\b/g)];
      const dates = [...textContent.matchAll(/\b(\d{4}-\d{2}-\d{2}|\w{3,9}\s+\d{1,2},?\s*\d{4})\b/gi)].map(m => m[1]);
      const times = [...textContent.matchAll(/\b(\d{1,2}:\d{2}\s*(?:AM|PM)?)\b/gi)].map(m => m[1]);
      const n = Math.max(flightMatches.length, routeMatches.length, 1);
      for (let i = 0; i < n; i++) {
        segments.push({
          type: "flight",
          flightNumber: flightMatches[i] ? `${flightMatches[i][1]}${flightMatches[i][2]}` : "",
          route: routeMatches[i] ? `${routeMatches[i][1]} → ${routeMatches[i][2]}` : "",
          date: parseDate(dates[i] || dates[0] || ""),
          departureTime: times[i * 2] || "",
          arrivalTime: times[i * 2 + 1] || "",
          confirmationCode: confirmCode,
        });
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
        passenger_name: segments[0]?.guestName || "",
        parse_method: segments.length > 0 ? "regex" : "none",
        status: "pending",
      }),
    });

    const insertData = await insertRes.json();

    return res.status(200).json({
      ok: true,
      itinerary_id: insertData?.[0]?.id || null,
      segments: segments.length,
      user: userId,
    });

  } catch (err) {
    console.error("Inbound email error:", err);
    return res.status(200).json({ ok: false, error: err.message });
  }
}
