import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // Allow the native app (origin capacitor://localhost) AND the web to call this.
  // No cookies/credentials are used (auth is the userId in the body), so a
  // wildcard origin is safe — and required, since the previous hardcoded
  // gocontinuum.app origin blocked the native app's cross-origin token save.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Handle subscribe action (merged from push-subscribe)
  if (req.query.action === "subscribe") {
    try {
      const { userId, subscription } = req.body;
      if (!userId || !subscription) return res.status(400).json({ error: "Missing userId or subscription" });
      const supabase = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from("push_subscriptions").upsert({ user_id: userId, subscription: JSON.stringify(subscription), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      return res.json({ ok: true });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  // Native app device token (APNs/FCM) — separate from web-push subscriptions.
  if (req.query.action === "subscribe-native") {
    try {
      const { userId, token, platform } = req.body;
      if (!userId || !token) return res.status(400).json({ error: "Missing userId or token" });
      const supabase = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from("device_push_tokens").upsert({ token, user_id: userId, platform: platform || "ios", updated_at: new Date().toISOString() }, { onConflict: "token" });
      return res.json({ ok: true });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  const vapidPublic = (process.env.VITE_VAPID_PUBLIC_KEY || "").trim();
  const vapidPrivate = (process.env.VAPID_PRIVATE_KEY || "").trim();
  if (!vapidPublic || !vapidPrivate) return res.status(500).json({ error: "VAPID keys not configured" });

  webpush.setVapidDetails("mailto:notifications@gocontinuum.app", vapidPublic, vapidPrivate);

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    const { subscription, title, body: notifBody, icon, data } = body;
    if (!subscription || !title) return res.status(400).json({ error: "subscription and title required" });

    await webpush.sendNotification(subscription, JSON.stringify({
      title,
      body: notifBody || "",
      icon: icon || "/pwa-192x192.png",
      badge: "/pwa-64x64.png",
      data: data || {},
    }));

    return res.status(200).json({ ok: true });
  } catch (e) {
    if (e.statusCode === 410 || e.statusCode === 404) {
      return res.status(200).json({ ok: false, expired: true });
    }
    return res.status(500).json({ error: e.message });
  }
}
