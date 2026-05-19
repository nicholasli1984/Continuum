import { withSentry } from "../api-lib/sentry.js";
import { renderEmailHtmlToPng } from "../api-lib/render-email-png.js";
import { buildReceiptCardHtml } from "../api-lib/receipt-card-html.js";

// Auth-protected. Two modes:
//   { html: "..." }      → render the provided HTML directly
//   { summary: {...} }   → build a controlled receipt-card HTML from the
//                          summary fields, then render that
// Used by the client to migrate legacy text/html (or blank PNG) receipts
// into properly-styled image/png receipts.
async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // JWT auth — confirm caller is a signed-in user
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return res.status(401).json({ error: "Missing Authorization header" });

  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: "Server misconfigured: missing Supabase env" });
  }

  try {
    const verifyResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` },
    });
    if (!verifyResp.ok) return res.status(401).json({ error: "Invalid or expired token" });
  } catch (e) {
    return res.status(500).json({ error: "Auth check failed: " + (e?.message || String(e)) });
  }

  // Parse body
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || (typeof body.html !== "string" && typeof body.summary !== "object")) {
    return res.status(400).json({ error: "Body must be JSON with { html: string } or { summary: {...} }" });
  }

  try {
    const t0 = Date.now();
    let html = "";
    if (body.summary && typeof body.summary === "object") {
      html = buildReceiptCardHtml(body.summary);
    } else {
      html = body.html;
      if (html.length > 8 * 1024 * 1024) {
        return res.status(413).json({ error: "HTML too large (>8MB)" });
      }
    }
    const buffer = await renderEmailHtmlToPng(html);
    const ms = Date.now() - t0;
    const dataUrl = `data:image/png;base64,${Buffer.from(buffer).toString("base64")}`;
    return res.status(200).json({ ok: true, ms, bytes: buffer.length, dataUrl });
  } catch (e) {
    console.error("[render-html-to-png] failed", e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}

export default withSentry(handler);
