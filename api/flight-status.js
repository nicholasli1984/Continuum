import { createClient } from "@supabase/supabase-js";

// Live flight status for the client. To conserve the AeroDataBox quota, this
// FIRST serves the cron's shared cache (`flight_status_tracking`) — one deduped
// fetch per flight already serves every user — and only calls AeroDataBox
// directly for flights the cron hasn't tracked yet (e.g. just added). On a 429
// it backs off and returns whatever cache exists.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    const { flights } = body;
    if (!flights || !Array.isArray(flights) || flights.length === 0) {
      return res.status(400).json({ error: "flights array required" });
    }

    const toCheck = flights.slice(0, 10);
    const results = {};
    const norm = (f) => `${(f.flightNumber || "").replace(/\s+/g, "").toUpperCase()}_${f.date || ""}`;
    const keys = toCheck.map(norm).filter(k => k.length > 1 && !k.startsWith("_") && !k.endsWith("_"));

    // 1) Read the cron's shared cache (no AeroDataBox call).
    const cacheByKey = {};
    const supaUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supaUrl && supaKey && keys.length) {
      try {
        const supa = createClient(supaUrl, supaKey);
        const { data } = await supa.from("flight_status_tracking").select("flight_key,last_status").in("flight_key", keys);
        (data || []).forEach(r => { if (r.last_status) cacheByKey[r.flight_key] = r.last_status; });
      } catch { /* fall through to direct fetch */ }
    }
    const fromCron = (s) => ({
      status: s.status || "Unknown",
      departureAirport: "",
      departureGate: s.departureGate || null,
      departureTerminal: s.departureTerminal || null,
      departureScheduled: s.schedLocal || null,
      departureRevised: s.departureRevised || null,
      departureActual: null,
      departureDelay: s.departureDelay || 0,
      checkInDesk: null,
      arrivalAirport: s.arrivalAirport || "",
      arrivalGate: null,
      arrivalTerminal: null,
      arrivalScheduled: null,
      arrivalRevised: null,
      arrivalActual: null,
      arrivalDelay: s.arrivalDelay || 0,
      baggageBelt: s.baggageBelt || null,
      aircraft: null,
      aircraftReg: null,
      _cached: true,
    });

    const apiKey = (process.env.VITE_AERODATABOX_API_KEY || "").trim();

    for (const f of toCheck) {
      const fn = (f.flightNumber || "").replace(/\s+/g, "").toUpperCase();
      const date = f.date || "";
      if (!fn || !date) continue;
      const key = `${fn}_${date}`;

      // Cached by the cron → serve it, no API call.
      if (cacheByKey[key]) { results[key] = fromCron(cacheByKey[key]); continue; }

      // Fallback: a direct AeroDataBox call (only for flights not yet tracked).
      if (!apiKey) { results[key] = { error: "API key not configured" }; continue; }
      try {
        const resp = await fetch(
          `https://aerodatabox.p.rapidapi.com/flights/number/${fn}/${date}`,
          { headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com" } }
        );
        if (resp.status === 429) {
          results[key] = { error: "HTTP 429", retryAfter: Number(resp.headers.get("Retry-After")) || 60 };
          continue;
        }
        if (!resp.ok) { results[key] = { error: `HTTP ${resp.status}` }; continue; }
        const data = await resp.json();
        const flightData = Array.isArray(data)
          ? (data.find(d => {
              const depIata = d?.departure?.airport?.iata || "";
              const arrIata = d?.arrival?.airport?.iata || "";
              if (f.departureAirport && depIata && depIata !== f.departureAirport) return false;
              if (f.arrivalAirport && arrIata && arrIata !== f.arrivalAirport) return false;
              return true;
            }) || data[0])
          : data;
        if (!flightData) { results[key] = { error: "No data" }; continue; }
        const dep = flightData.departure || {};
        const arr = flightData.arrival || {};
        results[key] = {
          status: flightData.status || "Unknown",
          departureAirport: dep.airport?.iata || "",
          departureGate: dep.gate || null,
          departureTerminal: dep.terminal || null,
          departureScheduled: dep.scheduledTimeLocal || dep.scheduledTime?.local || null,
          departureRevised: dep.revisedTimeLocal || null,
          departureActual: dep.runwayTimeLocal || null,
          departureDelay: dep.delay || 0,
          checkInDesk: dep.checkInDesk || null,
          arrivalAirport: arr.airport?.iata || "",
          arrivalGate: arr.gate || null,
          arrivalTerminal: arr.terminal || null,
          arrivalScheduled: arr.scheduledTimeLocal || arr.scheduledTime?.local || null,
          arrivalRevised: arr.revisedTimeLocal || null,
          arrivalActual: arr.runwayTimeLocal || null,
          arrivalDelay: arr.delay || 0,
          baggageBelt: arr.baggageBelt || null,
          aircraft: flightData.aircraft?.model || null,
          aircraftReg: flightData.aircraft?.reg || null,
        };
      } catch (e) {
        results[key] = { error: e.message };
      }
    }

    return res.status(200).json({ results });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}
