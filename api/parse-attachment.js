// Parse a single attachment (image or PDF page rendered to image) into a
// trip segment for a chosen type. Used by the drag-and-drop file zone on the
// trip detail page so users can drop a flight confirmation PDF, hotel
// voucher screenshot, etc. and have a pre-filled segment ready to review.
//
// Request: POST { imageDataUrl, mediaType, segmentType, fileName? }
// Response: { ok: true, segment: { ... } } | { ok: false, error: "..." }

import { withSentry } from "../api-lib/sentry.js";
import mammoth from "mammoth";

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// Read a .docx file (base64) and pull out its plain text. Drops formatting,
// keeps the prose Claude needs to find flight/hotel details.
async function docxToText(base64) {
  const buffer = Buffer.from(base64, "base64");
  const { value } = await mammoth.extractRawText({ buffer });
  return (value || "").trim();
}

const ALLOWED_TYPES = ["flight", "hotel", "activity", "rental", "train", "transfer", "restaurant", "lounge", "ferry", "cruise"];

const PROMPTS = {
  flight: `Extract flight booking details from this image. Return ONLY valid JSON, no markdown.

For multi-leg flights with stopovers/connections, create SEPARATE segments for each leg in the "segments" array (e.g. BDA→LHR→HND becomes two entries).

{
  "confirmationCode": "string or null",
  "passengerName": "string or null",
  "segments": [{
    "flightNumber": "e.g. BA158",
    "airline": "full airline name",
    "departureAirport": "3-letter IATA AIRPORT code",
    "arrivalAirport": "3-letter IATA AIRPORT code",
    "date": "YYYY-MM-DD (departure)",
    "arrivalDate": "YYYY-MM-DD (REQUIRED — same as date if same calendar day)",
    "departureTime": "HH:MM am/pm",
    "arrivalTime": "HH:MM am/pm",
    "departureTerminal": "e.g. T5 or null",
    "arrivalTerminal": "e.g. T3 or null",
    "aircraft": "e.g. Boeing 777-300ER or null",
    "fareClass": "economy | premium_economy | business | first",
    "bookingClass": "single letter, e.g. J | Y | C | null",
    "seat": "e.g. 4A or null",
    "ticketPrice": "number or null",
    "currency": "3-letter currency code, e.g. USD"
  }]
}

AIRPORT CODE RULES — CRITICAL:
- Use the EXACT 3-letter IATA AIRPORT code printed on the document. NEVER infer from a city name. NEVER substitute a different airport.
- Many cities have multiple airports — if you see HND, return HND (not NRT). If you see LGW, return LGW (not LHR). If you see EWR, return EWR (not JFK).
- NEVER return a 3-letter CITY (metro) code like TYO (Tokyo), LON (London), NYC (New York), PAR (Paris), CHI (Chicago), MIL (Milan), WAS (Washington), MOW (Moscow), STO (Stockholm), BUE (Buenos Aires), SAO (São Paulo), RIO (Rio de Janeiro), YMQ (Montréal), YTO (Toronto), SEL (Seoul), OSA (Osaka), IST/SAW areas — always pick the specific airport actually shown (HND/NRT, LHR/LGW/STN/LCY, JFK/LGA/EWR, CDG/ORY, ORD/MDW, MXP/LIN, IAD/DCA, etc.).
- If only a city name appears with no IATA code, leave the field null rather than guessing the primary airport.

CABIN CLASS RULES: "economy" includes Main Cabin, Comfort+, Economy Plus, Main Cabin Extra, Preferred. "premium_economy" only when the airline operates a separate cabin (BA World Traveller Plus, United Premium Plus, Delta Premium Select, etc.). "business" = Business / Polaris / ClubWorld. "first" = International First / Suite.`,

  hotel: `Extract hotel booking details from this image. Return ONLY valid JSON, no markdown.

{
  "confirmationCode": "string or null",
  "guestName": "string or null",
  "segments": [{
    "property": "hotel name",
    "location": "full address or city",
    "date": "YYYY-MM-DD (check-in — REQUIRED)",
    "checkoutDate": "YYYY-MM-DD (check-out — REQUIRED, calculate from check-in + nights if not explicit)",
    "nights": number,
    "roomType": "string or null",
    "totalCost": "number or null",
    "currency": "3-letter currency code, e.g. USD"
  }]
}`,

  activity: `Extract activity / tour / experience booking details from this image. Return ONLY valid JSON, no markdown.

{
  "confirmationCode": "string or null",
  "segments": [{
    "activityName": "name of the activity / tour / experience",
    "operator": "company / operator name",
    "location": "address or city",
    "date": "YYYY-MM-DD",
    "startTime": "HH:MM am/pm or null",
    "endTime": "HH:MM am/pm or null",
    "totalCost": "number or null",
    "currency": "3-letter currency code"
  }]
}`,

  rental: `Extract car / vehicle rental booking details from this image. Return ONLY valid JSON, no markdown.

{
  "confirmationCode": "string or null",
  "segments": [{
    "company": "rental company name (Hertz, Avis, etc.)",
    "vehicleClass": "compact / midsize / SUV / etc. or null",
    "pickupLocation": "address or airport code",
    "dropoffLocation": "address or airport code (same as pickup if not specified)",
    "date": "YYYY-MM-DD (pickup)",
    "dropoffDate": "YYYY-MM-DD (REQUIRED)",
    "pickupTime": "HH:MM am/pm",
    "dropoffTime": "HH:MM am/pm",
    "totalCost": "number or null",
    "currency": "3-letter currency code"
  }]
}`,

  train: `Extract train / rail booking details from this image. Return ONLY valid JSON, no markdown.

{
  "confirmationCode": "string or null",
  "passengerName": "string or null",
  "segments": [{
    "trainNumber": "e.g. Eurostar 9114",
    "operator": "Eurostar / Amtrak / SNCF / etc.",
    "departureStation": "station name",
    "arrivalStation": "station name",
    "date": "YYYY-MM-DD",
    "departureTime": "HH:MM am/pm",
    "arrivalTime": "HH:MM am/pm",
    "seat": "string or null",
    "fareClass": "standard / premium / business / first",
    "totalCost": "number or null",
    "currency": "3-letter currency code"
  }]
}`,

  transfer: `Extract ground transfer / car service / shuttle booking details from this image. Return ONLY valid JSON, no markdown.

{
  "confirmationCode": "string or null",
  "segments": [{
    "operator": "service company name (Blacklane, Uber Reserve, etc.)",
    "pickupLocation": "address",
    "dropoffLocation": "address",
    "date": "YYYY-MM-DD",
    "pickupTime": "HH:MM am/pm",
    "vehicleClass": "sedan / SUV / van / etc. or null",
    "totalCost": "number or null",
    "currency": "3-letter currency code"
  }]
}`,

  restaurant: `Extract restaurant reservation details from this image. Return ONLY valid JSON, no markdown.

{
  "confirmationCode": "string or null",
  "segments": [{
    "restaurantName": "name of the restaurant",
    "location": "address or area",
    "date": "YYYY-MM-DD",
    "startTime": "HH:MM am/pm",
    "partySize": number,
    "specialRequests": "string or null"
  }]
}`,

  lounge: `Extract airport lounge booking / pass details from this image. Return ONLY valid JSON, no markdown.

{
  "confirmationCode": "string or null",
  "segments": [{
    "loungeName": "lounge name",
    "location": "airport (IATA) and terminal",
    "date": "YYYY-MM-DD",
    "startTime": "HH:MM am/pm or null",
    "totalCost": "number or null",
    "currency": "3-letter currency code"
  }]
}`,

  ferry: `Extract ferry / boat booking details from this image. Return ONLY valid JSON, no markdown.

{
  "confirmationCode": "string or null",
  "segments": [{
    "operator": "ferry company name",
    "departurePort": "port name",
    "arrivalPort": "port name",
    "date": "YYYY-MM-DD",
    "departureTime": "HH:MM am/pm",
    "arrivalTime": "HH:MM am/pm",
    "totalCost": "number or null",
    "currency": "3-letter currency code"
  }]
}`,

  cruise: `Extract cruise booking details from this image. Return ONLY valid JSON, no markdown.

{
  "confirmationCode": "string or null",
  "passengerName": "string or null",
  "segments": [{
    "cruiseLine": "cruise line name",
    "shipName": "ship name",
    "embarkationPort": "departure port",
    "disembarkationPort": "arrival port",
    "date": "YYYY-MM-DD (embarkation)",
    "checkoutDate": "YYYY-MM-DD (disembarkation)",
    "cabin": "stateroom / cabin number or null",
    "cabinClass": "interior / oceanview / balcony / suite or null",
    "totalCost": "number or null",
    "currency": "3-letter currency code"
  }]
}`,
};

async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    const { imageDataUrl, mediaType, segmentType, fileName } = body || {};

    if (!imageDataUrl || !segmentType) {
      return res.status(400).json({ ok: false, error: "Missing imageDataUrl or segmentType" });
    }
    if (!ALLOWED_TYPES.includes(segmentType)) {
      return res.status(400).json({ ok: false, error: `Unknown segmentType: ${segmentType}` });
    }

    const anthropicKey = (process.env.ANTHROPIC_API_KEY || "").trim();
    if (!anthropicKey) {
      return res.status(500).json({ ok: false, error: "Anthropic API key not configured on server" });
    }

    const b64 = imageDataUrl.replace(/^data:[^;]+;base64,/, "");
    const detectedType = mediaType || (imageDataUrl.match(/^data:([^;]+);/)?.[1]) || "image/png";

    // Pick the right Claude content block based on file type:
    //   .docx → server-side mammoth → plain text → text-only Claude call
    //   .pdf  → "document" block so Claude reads ALL pages natively
    //   image → "image" block (existing behavior)
    let contentBlocks;
    if (detectedType === DOCX_MIME || /\.docx$/i.test(fileName || "")) {
      const text = await docxToText(b64);
      if (!text || text.length < 20) {
        return res.status(200).json({ ok: false, error: "The Word document had no readable text. Try saving it as a PDF and dropping that instead." });
      }
      contentBlocks = [
        { type: "text", text: `Document contents (extracted from a Word file):\n\n${text.slice(0, 18000)}\n\n---\n\n${PROMPTS[segmentType]}` },
      ];
    } else if (detectedType === "application/pdf" || /\.pdf$/i.test(fileName || "")) {
      contentBlocks = [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } },
        { type: "text", text: PROMPTS[segmentType] },
      ];
    } else {
      contentBlocks = [
        { type: "image", source: { type: "base64", media_type: detectedType, data: b64 } },
        { type: "text", text: PROMPTS[segmentType] },
      ];
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
          content: contentBlocks,
        }],
      }),
    });

    const aiData = await aiResp.json();
    if (aiData?.error) {
      console.error("[parse-attachment] AI error:", aiData.error);
      return res.status(500).json({ ok: false, error: aiData.error?.message || "AI parsing failed" });
    }

    const text = aiData?.content?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(200).json({ ok: false, error: "Couldn't extract structured data from this file. Try a different file or fill the form manually." });
    }

    let parsed;
    try { parsed = JSON.parse(jsonMatch[0]); }
    catch (e) { return res.status(200).json({ ok: false, error: "Parser returned malformed JSON. Try a clearer image." }); }

    const segments = Array.isArray(parsed?.segments) ? parsed.segments : [];
    if (segments.length === 0) {
      return res.status(200).json({ ok: false, error: "No booking details found in this file." });
    }

    return res.status(200).json({
      ok: true,
      segments: segments.map(s => ({ ...s, confirmationCode: s.confirmationCode || parsed.confirmationCode || "" })),
      confirmationCode: parsed.confirmationCode || "",
      passengerName: parsed.passengerName || parsed.guestName || "",
      segmentType,
    });
  } catch (err) {
    console.error("[parse-attachment] error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
}

export default withSentry(handler);
