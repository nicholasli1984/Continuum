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

  const { data: laRows, error: laErr } = await supabase
    .from("linked_accounts")
    .select("program_id, current_tier")
    .eq("user_id", userId);
  if (laErr) return res.status(500).json({ error: laErr.message });

  const accounts = {};
  (laRows || []).forEach(r => { accounts[r.program_id] = { currentTier: r.current_tier || "" }; });

  // Compute lounge access for the user's specific HND→TSA on JL scenario so we
  // can compare the engine's output to what the dashboard is rendering.
  const aid = airlineIdFromFn("JL 99");
  const alliance = aid ? AIRLINE_ALLIANCE[aid] : null;
  const accessible = computeLoungeAccess({
    airport: "HND",
    flyingAirlineId: aid,
    alliance,
    isIntl: isInternational("HND", "TSA"),
    accounts,
  });

  return res.json({
    userId,
    accountsCount: laRows?.length || 0,
    accounts,
    hndCheck: {
      flyingAirlineId: aid,
      alliance,
      isIntl: isInternational("HND", "TSA"),
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
