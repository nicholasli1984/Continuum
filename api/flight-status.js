export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = (process.env.VITE_AERODATABOX_API_KEY || "").trim();
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const { flights } = body;
    if (!flights || !Array.isArray(flights) || flights.length === 0) {
      return res.status(400).json({ error: "flights array required" });
    }

    // Limit to 10 flights per request to avoid quota abuse
    const toCheck = flights.slice(0, 10);
    const results = {};

    for (const f of toCheck) {
      const fn = (f.flightNumber || "").replace(/\s+/g, "").toUpperCase();
      const date = f.date || "";
      if (!fn || !date) continue;

      const key = `${fn}_${date}`;
      try {
        const resp = await fetch(
          `https://aerodatabox.p.rapidapi.com/flights/number/${fn}/${date}`,
          {
            headers: {
              "X-RapidAPI-Key": apiKey,
              "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com",
            },
          }
        );

        if (!resp.ok) {
          results[key] = { error: `HTTP ${resp.status}` };
          continue;
        }

        const data = await resp.json();
        // May return an array of flights (codeshares) — find the best match
        const flightData = Array.isArray(data)
          ? data.find(d => {
              const depIata = d?.departure?.airport?.iata || "";
              const arrIata = d?.arrival?.airport?.iata || "";
              // If caller specified airports, match them
              if (f.departureAirport && depIata && depIata !== f.departureAirport) return false;
              if (f.arrivalAirport && arrIata && arrIata !== f.arrivalAirport) return false;
              return true;
            }) || data[0]
          : data;

        if (!flightData) {
          results[key] = { error: "No data" };
          continue;
        }

        const dep = flightData.departure || {};
        const arr = flightData.arrival || {};

        results[key] = {
          status: flightData.status || "Unknown",
          // Departure
          departureAirport: dep.airport?.iata || "",
          departureGate: dep.gate || null,
          departureTerminal: dep.terminal || null,
          departureScheduled: dep.scheduledTimeLocal || null,
          departureRevised: dep.revisedTimeLocal || null,
          departureActual: dep.runwayTimeLocal || null,
          departureDelay: dep.delay || 0,
          checkInDesk: dep.checkInDesk || null,
          // Arrival
          arrivalAirport: arr.airport?.iata || "",
          arrivalGate: arr.gate || null,
          arrivalTerminal: arr.terminal || null,
          arrivalScheduled: arr.scheduledTimeLocal || null,
          arrivalRevised: arr.revisedTimeLocal || null,
          arrivalActual: arr.runwayTimeLocal || null,
          arrivalDelay: arr.delay || 0,
          baggageBelt: arr.baggageBelt || null,
          // Aircraft
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
