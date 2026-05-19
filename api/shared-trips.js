import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Server config error" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // POST — fetch shared trips by IDs (existing) OR look up a user by email
  // (action: "lookup_user", merged from the former /api/lookup-user-by-email
  // endpoint to stay under Vercel Hobby's 12-function cap).
  if (req.method === "POST") {
    try {
      let body = req.body;
      if (typeof body === "string") body = JSON.parse(body);

      // ── lookup_user — find a Supabase auth user by email (service role) ──
      if (body && body.action === "lookup_user") {
        const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
        const authHeader = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
        if (!authHeader) return res.status(401).json({ error: "Missing auth token" });
        try {
          const verifyRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: { apikey: anonKey || supabaseKey, Authorization: `Bearer ${authHeader}` },
          });
          if (!verifyRes.ok) return res.status(401).json({ error: "Invalid token" });
        } catch (_) { return res.status(401).json({ error: "Auth verification failed" }); }
        const email = (body.email || "").toLowerCase().trim();
        if (!email.includes("@")) return res.status(400).json({ error: "Invalid email" });
        const admin = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
        const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (error) return res.status(500).json({ error: error.message });
        const found = (data?.users || []).find(u => (u.email || "").toLowerCase() === email);
        return res.status(200).json({ user_id: found?.id || null });
      }

      // ── default: fetch shared trips by IDs ──
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

  // DELETE — remove the calling user's share row for a trip (so the trip
  // disappears from their dashboard). The underlying trip is untouched —
  // only the recipient's trip_shares row is deleted. Service-role bypasses
  // RLS so this works even when the recipient can't write to trip_shares
  // directly.
  //
  // Strategy: first SELECT all matching rows (case-insensitive email + UUID),
  // then DELETE by id. Returns counts so the client knows whether anything
  // actually happened (vs. silent zero-row "success").
  if (req.method === "DELETE") {
    try {
      let body = req.body;
      if (typeof body === "string") body = JSON.parse(body);
      const { tripId, userId, userEmail } = body || {};
      if (!tripId || (!userId && !userEmail)) {
        return res.status(400).json({ error: "tripId and one of userId/userEmail required" });
      }
      const safeUserId = (userId || "").replace(/[^a-f0-9-]/gi, "");
      const safeUserEmail = (userEmail || "").replace(/[^a-zA-Z0-9@._+-]/g, "").toLowerCase();

      // Fetch ALL share rows for this trip first so we can match locally
      // (case-insensitive email comparison, and UUID match).
      const { data: allRows, error: selErr } = await supabase
        .from("trip_shares")
        .select("id, shared_with_id, shared_with_email")
        .eq("trip_id", tripId);
      if (selErr) {
        return res.status(500).json({ error: `Select failed: ${selErr.message}` });
      }

      const matches = (allRows || []).filter(r => {
        const rEmail = (r.shared_with_email || "").toLowerCase().trim();
        const rId = (r.shared_with_id || "").toString();
        return (safeUserId && rId === safeUserId) || (safeUserEmail && rEmail === safeUserEmail);
      });

      if (matches.length === 0) {
        return res.status(404).json({
          error: "No matching share row found for this user",
          debug: {
            tripId,
            tried_userId: safeUserId,
            tried_userEmail: safeUserEmail,
            row_count_for_trip: (allRows || []).length,
            sample_emails: (allRows || []).slice(0, 3).map(r => r.shared_with_email),
            sample_ids: (allRows || []).slice(0, 3).map(r => r.shared_with_id),
          },
        });
      }

      const ids = matches.map(r => r.id);
      const { error: delErr } = await supabase.from("trip_shares").delete().in("id", ids);
      if (delErr) return res.status(500).json({ error: `Delete failed: ${delErr.message}` });
      return res.status(200).json({ ok: true, deleted: ids.length });
    } catch (e) {
      return res.status(500).json({ error: e.message || "Server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
