import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Server config error" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // POST — fetch shared trips by IDs (existing)
  if (req.method === "POST") {
    try {
      let body = req.body;
      if (typeof body === "string") body = JSON.parse(body);
      const { tripIds } = body;
      if (!tripIds || !Array.isArray(tripIds) || tripIds.length === 0) return res.status(400).json({ error: "tripIds required" });
      if (tripIds.length > 50) return res.status(400).json({ error: "Too many trip IDs" });
      const { data, error } = await supabase.from("trips").select("*").in("id", tripIds);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ trips: data || [] });
    } catch (e) {
      return res.status(500).json({ error: "Server error" });
    }
  }

  // PUT — update a shared trip (requires valid edit permission in trip_shares)
  if (req.method === "PUT") {
    try {
      let body = req.body;
      if (typeof body === "string") body = JSON.parse(body);
      const { tripId, userId, payload } = body;
      if (!tripId || !userId || !payload) return res.status(400).json({ error: "tripId, userId, and payload required" });

      // Verify the user has edit permission on this trip
      const { data: shares } = await supabase
        .from("trip_shares")
        .select("permission")
        .eq("trip_id", tripId)
        .or(`shared_with_id.eq.${userId.replace(/[^a-f0-9-]/gi, "")},shared_with_email.eq.${(body.userEmail || "").replace(/[^a-zA-Z0-9@._+-]/g, "")}`)
        .eq("permission", "edit");
      if (!shares || shares.length === 0) {
        return res.status(403).json({ error: "You do not have edit permission on this trip" });
      }

      // Update the trip
      const { error } = await supabase.from("trips").update(payload).eq("id", tripId);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: "Server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
