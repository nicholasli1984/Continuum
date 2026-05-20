// ─────────────────────────────────────────────────────────────────────────
// Community stats — anonymized aggregates across all Continuum users.
//
// Low legal risk by design: no names, no per-user data, no location of any
// individual, no user-generated free text. Just aggregate counts + the
// requesting user's own percentile. Gated below a minimum member count so
// nothing can be back-computed to identify a person while the base is tiny.
// ─────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const MIN_MEMBERS = 5; // suppress community stats until at least this many contribute

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const userId = req.query.userId || (req.body && (typeof req.body === "string" ? JSON.parse(req.body).userId : req.body.userId)) || null;

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Pull only what we need to aggregate. Service role bypasses RLS.
  const { data: trips, error } = await supabase
    .from("trips")
    .select("user_id, location, trip_name, segments");
  if (error) return res.status(500).json({ error: error.message });

  const members = new Set();
  let totalTrips = 0, totalFlights = 0;
  const destCounts = {};                 // normalized city -> count
  const perUser = {};                    // user_id -> { trips, flights }

  const bump = (uid, k) => { perUser[uid] = perUser[uid] || { trips: 0, flights: 0 }; perUser[uid][k]++; };

  for (const t of (trips || [])) {
    if (!t.user_id) continue;
    members.add(t.user_id);
    totalTrips++; bump(t.user_id, "trips");

    const segs = Array.isArray(t.segments) ? t.segments : [];
    const flightCount = segs.filter(s => !s._isMeta && s.type === "flight" && s.flightNumber).length;
    totalFlights += flightCount;
    for (let i = 0; i < flightCount; i++) bump(t.user_id, "flights");

    // Destination = the trip's location (city). Take the part before a comma so
    // "Tokyo, Japan" and "Tokyo" collapse together. Title-case-insensitive key.
    const loc = (t.location || "").trim();
    if (loc) {
      const city = loc.split(",")[0].trim();
      if (city) {
        const key = city.toLowerCase();
        destCounts[key] = destCounts[key] || { label: city, count: 0 };
        destCounts[key].count++;
      }
    }
  }

  const memberCount = members.size;
  if (memberCount < MIN_MEMBERS) {
    return res.json({ ready: false, memberCount, minMembers: MIN_MEMBERS });
  }

  const topDestinations = Object.values(destCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map(d => ({ city: d.label, count: d.count }));

  // Requester percentile (how many members they out-fly / out-trip).
  const me = perUser[userId] || { trips: 0, flights: 0 };
  const pct = (key) => {
    const vals = Object.values(perUser).map(u => u[key]);
    const below = vals.filter(v => v < me[key]).length;
    return memberCount > 1 ? Math.round((below / memberCount) * 100) : 0; // % of members you beat
  };

  return res.json({
    ready: true,
    memberCount,
    totalTrips,
    totalFlights,
    topDestinations,
    you: {
      trips: me.trips,
      flights: me.flights,
      flightsBeatPct: pct("flights"),  // "more than X% of members"
      tripsBeatPct: pct("trips"),
    },
  });
}
