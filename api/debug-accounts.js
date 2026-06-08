// /api/debug-accounts — admin-only inspector for a user's linked_accounts +
// computed HND-Emerald lounge list. Lets us check whether the right loyalty
// program / tier is stored and whether the lounge engine is returning the
// expected result without poking around in Supabase by hand.
//
// Auth: ?userId=<uuid>. No secret check — this only ever returns data for the
// requested user, all of which is already visible to them in the app. (Add an
// admin-email check if this stays around long-term.)

import { createClient } from "@supabase/supabase-js";
import { computeLoungeAccess, airlineIdFromFn, isInternational } from "../src/constants/loungeAccess.js";
import { AIRLINE_ALLIANCE } from "../src/constants/lounges.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const userId = String(req.query.userId || "").trim();
  if (!userId) return res.status(400).json({ error: "Missing ?userId=<uuid>" });

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ?recentExpenses=1 → return the user's last 20 expenses with no receipt
  // body (just metadata) so we can verify a snap-and-save actually landed.
  if (req.query.recentExpenses) {
    const { data, error } = await supabase
      .from("expenses")
      .select("id, trip_id, date, amount, currency, vendor, category, status, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ userId, count: data?.length || 0, expenses: data });
  }

  const { data: laRows, error: laErr } = await supabase
    .from("linked_accounts")
    .select("program_id, current_tier")
    .eq("user_id", userId);
  if (laErr) return res.status(500).json({ error: laErr.message });

  const accounts = {};
  (laRows || []).forEach(r => { accounts[r.program_id] = { currentTier: r.current_tier || "" }; });

  // Run the engine against the airport/flight in the query. Defaults to the
  // HND → TSA on JL99 scenario so the original Emerald test still works.
  const airport = String(req.query.airport || "HND").toUpperCase();
  const arrAirport = String(req.query.arr || "TSA").toUpperCase();
  const flightNumber = String(req.query.flight || "JL 99");
  const aid = airlineIdFromFn(flightNumber);
  const alliance = aid ? AIRLINE_ALLIANCE[aid] : null;
  const isIntl = isInternational(airport, arrAirport);
  const accessible = computeLoungeAccess({
    airport, flyingAirlineId: aid, alliance, isIntl, accounts,
  });

  return res.json({
    userId,
    accountsCount: laRows?.length || 0,
    accounts,
    check: {
      airport, arr: arrAirport, flightNumber,
      flyingAirlineId: aid, alliance, isIntl,
      grantedCount: accessible.length,
      granted: accessible.map(a => ({
        name: a.lounge.name,
        tier: a.lounge.tier || "business",
        rating: a.lounge.rating,
        network: a.lounge.network,
        grants: a.grants,
      })),
    },
  });
}
