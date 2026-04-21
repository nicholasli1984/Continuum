import webpush from "web-push";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

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
