import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Server config error" });

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const { recipientEmail, reportTitle, reportHtml, senderName, senderEmail } = body;

    if (!recipientEmail || !reportTitle || !reportHtml) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Use Supabase Edge Functions or a simple email service
    // For now, use the Resend API if available, otherwise return the HTML for client-side mailto
    const resendKey = process.env.RESEND_API_KEY;

    if (resendKey) {
      // Send via Resend
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `Continuum <noreply@gocontinuum.app>`,
          to: [recipientEmail],
          reply_to: senderEmail || undefined,
          subject: `Expense Report: ${reportTitle}`,
          html: reportHtml,
        }),
      });
      if (resp.ok) {
        return res.status(200).json({ success: true, method: "email" });
      } else {
        const err = await resp.text();
        console.error("Resend error:", err);
        return res.status(200).json({ success: true, method: "mailto", fallback: true });
      }
    }

    // No email service configured — return success and let client use mailto
    return res.status(200).json({ success: true, method: "mailto" });
  } catch (e) {
    console.error("Forward report error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
