// "Ask Continuum" — a concise travel assistant powered by Claude. Takes a
// natural-language question plus a small summary of the user's trips so it can
// answer trip-specific questions. Read-only (answers/advice; it doesn't mutate
// data). Uses ANTHROPIC_API_KEY from the environment.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!key) return res.status(500).json({ error: "Assistant isn't configured yet." });

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    const { query, context } = body || {};
    if (!query || !String(query).trim()) return res.status(400).json({ error: "query required" });

    const system = "You are Continuum's travel assistant — concise, warm, and genuinely useful for a frequent premium traveler. You help with trip planning, packing, flights, layovers, lounges, loyalty points/status, and destination tips. Keep answers tight: 2–5 sentences or a short bullet list, never a wall of text. When the question is about the user's own trips, use the TRIPS context provided and don't invent bookings or details you weren't given. Be specific and practical. No emoji.";
    const userMsg = (context ? `The user's trips (for reference):\n${String(context).slice(0, 2000)}\n\n` : "") + `Question: ${String(query).slice(0, 1000)}`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 700,
        system,
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: data?.error?.message || "Assistant error" });
    const answer = (data?.content || []).map(c => c.text || "").join("").trim();
    return res.json({ answer: answer || "I'm not sure how to answer that — try rephrasing." });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
