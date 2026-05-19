// Gmail OAuth flow + Pub/Sub webhook — consolidated into one serverless
// function (Vercel Hobby plan caps at 12 functions; merging these freed a
// slot for the new /api/delete-account endpoint). Routing is by body shape:
// Pub/Sub messages have a distinctive `{ message: { data: ... } }` envelope;
// everything else is treated as OAuth init / callback. The legacy URL
// `/api/gmail-webhook` is preserved via a rewrite in vercel.json.
import { createClient } from "@supabase/supabase-js";

const SCOPES = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify";

export default async function handler(req, res) {
  // Pub/Sub webhook dispatch — runs BEFORE the CORS headers below since
  // Google's Pub/Sub doesn't send CORS-relevant headers and we want to
  // return 200 fast to avoid retry storms.
  if (req.method === "POST" && req.body?.message?.data) {
    return handleGmailWebhook(req, res);
  }

  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const clientId = process.env.GOOGLE_GMAIL_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_GMAIL_CLIENT_SECRET;
  const redirectUri = "https://gocontinuum.app/api/gmail-auth";

  // OAuth callback — handle code exchange and redirect
  if (req.method === "GET" && req.query.code) {
    const { code, state: cbUserId } = req.query;
    if (!code || !cbUserId) return res.status(400).send("Missing code or state");
    try {
      // Exchange code inline (same logic as POST)
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
      });
      const tokens = await tokenRes.json();
      if (tokens.error) return res.redirect(302, `https://gocontinuum.app/?gmail=error&msg=${encodeURIComponent(tokens.error_description || tokens.error)}`);
      const supabase = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const profileRes = await fetch("https://www.googleapis.com/gmail/v1/users/me/profile", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
      const profile = await profileRes.json();
      await supabase.from("gmail_connections").upsert({
        user_id: cbUserId, gmail_email: profile.emailAddress, access_token: tokens.access_token,
        refresh_token: tokens.refresh_token, token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(), connected_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      // Set up Gmail watch
      await fetch("https://www.googleapis.com/gmail/v1/users/me/watch", {
        method: "POST", headers: { Authorization: `Bearer ${tokens.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ topicName: `projects/${process.env.GOOGLE_CLOUD_PROJECT || "continuum-travel"}/topics/gmail-notifications`, labelIds: ["INBOX"] }),
      });
      return res.redirect(302, "https://gocontinuum.app/?gmail=connected");
    } catch (e) {
      return res.redirect(302, `https://gocontinuum.app/?gmail=error&msg=${encodeURIComponent(e.message)}`);
    }
  }

  // Step 1: Generate auth URL
  if (req.method === "GET" && !req.query.code) {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&scope=${encodeURIComponent(SCOPES)}` +
      `&access_type=offline&prompt=consent` +
      `&state=${userId}`;

    return res.json({ authUrl });
  }

  // Step 2: Exchange code for tokens (called from gmail-callback)
  if (req.method === "POST") {
    const { code, userId } = req.body;
    if (!code || !userId) return res.status(400).json({ error: "Missing code or userId" });

    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      const tokens = await tokenRes.json();
      if (tokens.error) return res.status(400).json({ error: tokens.error_description || tokens.error });

      // Store tokens in Supabase
      const supabase = createClient(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Get user's email from Gmail
      const profileRes = await fetch("https://www.googleapis.com/gmail/v1/users/me/profile", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profile = await profileRes.json();

      await supabase.from("gmail_connections").upsert({
        user_id: userId,
        gmail_email: profile.emailAddress,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        connected_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      // Set up Gmail watch (Pub/Sub push notifications)
      const watchRes = await fetch("https://www.googleapis.com/gmail/v1/users/me/watch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicName: `projects/${process.env.GOOGLE_CLOUD_PROJECT || "continuum-travel"}/topics/gmail-notifications`,
          labelIds: ["INBOX"],
        }),
      });
      const watchData = await watchRes.json();

      return res.json({ ok: true, email: profile.emailAddress, watch: watchData });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}


// ─────────────────────────────────────────────────────────────────────────
// Gmail Pub/Sub webhook handler (formerly api/gmail-webhook.js).
// ─────────────────────────────────────────────────────────────────────────
// Gmail Pub/Sub webhook — receives notifications when new emails arrive

async function handleGmailWebhook(req, res) {
  
  try {
    // Pub/Sub sends a base64-encoded message
    const message = req.body?.message;
    if (!message?.data) return res.status(200).send("No data");

    const data = JSON.parse(Buffer.from(message.data, "base64").toString());
    const gmailEmail = data.emailAddress;
    const historyId = data.historyId;

    if (!gmailEmail) return res.status(200).send("No email");

    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Find the user's Gmail connection
    const { data: conn } = await supabase.from("gmail_connections")
      .select("*").eq("gmail_email", gmailEmail).single();

    if (!conn) return res.status(200).send("No connection found");

    // Refresh token if expired
    let accessToken = conn.access_token;
    if (new Date(conn.token_expiry) < new Date()) {
      const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_GMAIL_CLIENT_ID,
          client_secret: process.env.GOOGLE_GMAIL_CLIENT_SECRET,
          refresh_token: conn.refresh_token,
          grant_type: "refresh_token",
        }),
      });
      const refreshData = await refreshRes.json();
      if (refreshData.access_token) {
        accessToken = refreshData.access_token;
        await supabase.from("gmail_connections").update({
          access_token: refreshData.access_token,
          token_expiry: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        }).eq("user_id", conn.user_id);
      }
    }

    // Fetch recent messages since last historyId
    const lastHistoryId = conn.last_history_id || historyId;
    let messages = [];

    try {
      const historyRes = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/history?startHistoryId=${lastHistoryId}&historyTypes=messageAdded&labelId=INBOX`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const historyData = await historyRes.json();

      if (historyData.history) {
        const msgIds = new Set();
        historyData.history.forEach(h => {
          (h.messagesAdded || []).forEach(m => msgIds.add(m.message.id));
        });
        messages = [...msgIds];
      }
    } catch (e) {
      // If history fetch fails, get latest messages
      const listRes = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=5&labelIds=INBOX`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const listData = await listRes.json();
      messages = (listData.messages || []).map(m => m.id);
    }

    // Update last history ID
    await supabase.from("gmail_connections").update({ last_history_id: historyId }).eq("user_id", conn.user_id);

    // Process each new message
    const airlinePatterns = /american airlines|united airlines|delta air|jetblue|southwest|british airways|cathay pacific|japan airlines|air canada|singapore airlines|emirates|qantas|ana |lufthansa|korean air|flight confirmation|itinerary|e-ticket|booking confirmation|reservation|your trip|gate change|flight cancel|delay|schedule change/i;

    for (const msgId of messages.slice(0, 5)) {
      try {
        // Fetch full message
        const msgRes = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const msg = await msgRes.json();

        // Extract subject and sender
        const headers = msg.payload?.headers || [];
        const subject = headers.find(h => h.name.toLowerCase() === "subject")?.value || "";
        const from = headers.find(h => h.name.toLowerCase() === "from")?.value || "";

        // Check if it's a travel-related email
        if (!airlinePatterns.test(subject + " " + from)) continue;

        // Extract body text
        let bodyText = "";
        const extractText = (part) => {
          if (part.mimeType === "text/plain" && part.body?.data) {
            bodyText += Buffer.from(part.body.data, "base64url").toString("utf-8");
          }
          if (part.mimeType === "text/html" && part.body?.data && !bodyText) {
            const html = Buffer.from(part.body.data, "base64url").toString("utf-8");
            bodyText += html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          }
          if (part.parts) part.parts.forEach(extractText);
        };
        extractText(msg.payload);

        if (!bodyText || bodyText.length < 50) continue;

        // Check if this email was already processed
        const { data: existing } = await supabase.from("itineraries")
          .select("id").eq("user_id", conn.user_id).eq("source", `gmail:${msgId}`).limit(1);
        if (existing && existing.length > 0) continue;

        // Use Claude to parse the email
        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY || "",
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2048,
            messages: [{ role: "user", content: `Parse this travel booking email and extract ALL booking segments. Return ONLY valid JSON, no markdown, no explanation.

The email may contain flights, hotels, car rentals, trains, or activities. Extract every segment found.

For FLIGHTS with stopovers/connections, create SEPARATE segments for each leg. For example, BDA→LHR→HND should be two segments: BDA→LHR and LHR→HND, each with their own flight number.

Return this exact JSON structure:
{
  "confirmationCode": "string or null — the booking reference / confirmation number / record locator",
  "passengerName": "string or null",
  "segments": [
    {
      "type": "flight" | "hotel" | "rental" | "train" | "activity" | "change" | "cancellation",
      "status": "confirmed" | "cancelled" | "changed",

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
- If it's a change or cancellation, include what changed in a "changeDetails" field.

Subject: ${subject}
From: ${from}

Body:
${bodyText.slice(0, 8000)}` }],
          }),
        });

        if (!claudeRes.ok) continue;
        const claudeData = await claudeRes.json();
        const parsed = claudeData.content?.[0]?.text || "";

        // Try to extract JSON from Claude's response
        let segments = [];
        try {
          const jsonMatch = parsed.match(/\[[\s\S]*\]/);
          if (jsonMatch) segments = JSON.parse(jsonMatch[0]);
          else {
            const objMatch = parsed.match(/\{[\s\S]*\}/);
            if (objMatch) segments = [JSON.parse(objMatch[0])];
          }
        } catch (e) { /* parsing failed */ }

        if (segments.length === 0) continue;

        // Determine if this is a new booking, change, or cancellation
        const isChange = segments.some(s => s.type === "change" || s.status === "changed");
        const isCancellation = segments.some(s => s.type === "cancellation" || s.status === "cancelled");

        if (isChange || isCancellation) {
          // Try to find matching existing trip by confirmation code or flight number
          const confCode = segments[0]?.confirmationCode;
          const flightNum = segments[0]?.flightNumber;

          if (confCode || flightNum) {
            const { data: trips } = await supabase.from("trips")
              .select("id, segments").eq("user_id", conn.user_id);

            for (const trip of (trips || [])) {
              const tripSegs = trip.segments || [];
              const matchIdx = tripSegs.findIndex(s =>
                (confCode && s.confirmationCode === confCode) ||
                (flightNum && s.flightNumber === flightNum)
              );

              if (matchIdx >= 0) {
                if (isCancellation) {
                  // Mark segment as cancelled
                  tripSegs[matchIdx].status = "cancelled";
                  tripSegs[matchIdx]._cancelledAt = new Date().toISOString();
                } else {
                  // Update segment with new details
                  const changes = segments[0];
                  if (changes.departureTime) tripSegs[matchIdx].departureTime = changes.departureTime;
                  if (changes.arrivalTime) tripSegs[matchIdx].arrivalTime = changes.arrivalTime;
                  if (changes.date) tripSegs[matchIdx].date = changes.date;
                  if (changes.route) tripSegs[matchIdx].route = changes.route;
                  if (changes.gate) tripSegs[matchIdx].gate = changes.gate;
                  tripSegs[matchIdx]._lastUpdated = new Date().toISOString();
                  tripSegs[matchIdx]._updateSource = "gmail";
                }
                await supabase.from("trips").update({ segments: tripSegs }).eq("id", trip.id);
                break;
              }
            }
          }
        }

        // Save to itineraries inbox (for both new bookings and changes)
        await supabase.from("itineraries").insert({
          user_id: conn.user_id,
          source: "email",
          sender_email: from,
          subject: subject,
          raw_text: bodyText.slice(0, 10000),
          parsed_segments: segments,
          status: isCancellation ? "cancellation" : isChange ? "change" : "pending",
        });

      } catch (e) {
        console.error("Error processing message:", msgId, e.message);
      }
    }

    return res.status(200).json({ ok: true, processed: messages.length });
  } catch (e) {
    console.error("Gmail webhook error:", e.message);
    return res.status(200).json({ error: e.message }); // Return 200 to prevent Pub/Sub retries
  }
}
