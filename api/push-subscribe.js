export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Server config" });

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    const { userId, subscription } = body;
    if (!userId || !subscription) return res.status(400).json({ error: "userId and subscription required" });

    // Store/update push subscription — use endpoint as unique key
    const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" };

    // Try to create push_subscriptions table if it doesn't exist (will fail silently if no perms)
    // Store in user_forwarding_addresses as a workaround if table doesn't exist
    const payload = {
      user_id: userId,
      endpoint: subscription.endpoint,
      keys_p256dh: subscription.keys?.p256dh || "",
      keys_auth: subscription.keys?.auth || "",
      created_at: new Date().toISOString(),
    };

    // Try dedicated table first
    let resp = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions`, {
      method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      // Table might not exist — store as JSON in user_forwarding_addresses member_id
      // This is a fallback; ideally create the table in Supabase dashboard
      console.log("[push-subscribe] Table not found, using fallback storage");
      // Store subscription in a simple way — overwrite approach
      const subJson = JSON.stringify({ _push: true, sub: subscription, ts: Date.now() });
      await fetch(`${supabaseUrl}/rest/v1/user_forwarding_addresses?user_id=eq.${userId}&email=eq._push_sub`, {
        method: "DELETE", headers,
      });
      await fetch(`${supabaseUrl}/rest/v1/user_forwarding_addresses`, {
        method: "POST", headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({ user_id: userId, email: "_push_sub", forwarding_address: subJson.slice(0, 200), verified: false }),
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
