// In-app feature suggestions / feedback. Stores each submission in the `feedback`
// table and emails contact@gocontinuum.app (best-effort via Resend). Private —
// nothing is shown back to other users, so this isn't App Store UGC.
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // Allow the native app (capacitor://) + web. No credentials used.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    const { userId, email, category, message } = body || {};
    if (!message || !String(message).trim()) return res.status(400).json({ error: "message required" });

    const msg = String(message).trim().slice(0, 4000);
    const cat = String(category || "Feedback").slice(0, 60);
    const supa = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    await supa.from("feedback").insert({ user_id: userId || null, email: email || null, category: cat, message: msg });

    // Best-effort email so suggestions land in the inbox immediately. Never let
    // an email failure fail the submission — it's already saved in the table.
    const resendKey = (process.env.RESEND_API_KEY || "").trim();
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Continuum Feedback <feedback@gocontinuum.app>",
            to: ["contact@gocontinuum.app"],
            reply_to: email || undefined,
            subject: `[Continuum] ${cat}${email ? ` — ${email}` : ""}`,
            text: `Category: ${cat}\nFrom: ${email || "unknown"}${userId ? ` (user ${userId})` : ""}\n\n${msg}`,
          }),
        });
      } catch { /* table insert already succeeded */ }
    }

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
