import { withSentry } from "../api-lib/sentry.js";

async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");

  // Cron-only action: refresh transfer-bonus snapshot in Supabase. Triggered
  // weekly via Vercel cron (see vercel.json). Authenticated by either Vercel's
  // x-vercel-cron header or a CRON_SECRET query param.
  if (req.query.action === "refresh-transfer-bonuses") {
    return refreshTransferBonuses(req, res);
  }

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url", items: [] });

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ContinuumApp/1.0; +https://continuum-azure.vercel.app)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!response.ok) {
      return res.status(200).json({ items: [], error: `Feed returned ${response.status}` });
    }

    const xml = await response.text();

    const getTag = (str, tag) => {
      const m = str.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
      return m ? m[1].trim() : "";
    };

    const getLink = (str) => {
      // <link>url</link> or <link href="url"/>
      const plain = str.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      if (plain) return plain[1].trim();
      const attr = str.match(/<link[^>]+href="([^"]+)"/i);
      if (attr) return attr[1];
      return "";
    };

    const getMedia = (str) => {
      // <media:thumbnail url="..."/> or <media:content url="..."/> or <enclosure url="..."/>
      const m1 = str.match(/<media:thumbnail[^>]+url="([^"]+)"/i);
      if (m1) return m1[1];
      const m2 = str.match(/<media:content[^>]+url="([^"]+)"/i);
      if (m2) return m2[1];
      const m3 = str.match(/<enclosure[^>]+url="([^"]+)"/i);
      if (m3) return m3[1];
      // Try first <img src in description
      const desc = getTag(str, "description");
      const img = desc.match(/<img[^>]+src="([^"]+)"/i);
      if (img) return img[1];
      return null;
    };

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
      const raw = match[1];
      const desc = getTag(raw, "description")
        .replace(/<[^>]*>/g, "")
        .replace(/&[a-z]+;/g, " ")
        .trim()
        .slice(0, 160);

      items.push({
        title: getTag(raw, "title"),
        link: getLink(raw),
        pubDate: getTag(raw, "pubDate"),
        description: desc ? desc + "…" : "",
        guid: getTag(raw, "guid") || getLink(raw),
        thumbnail: getMedia(raw),
      });
    }

    return res.status(200).json({ items });
  } catch (e) {
    return res.status(200).json({ items: [], error: e.message });
  }
}

// ── Transfer bonus refresh ─────────────────────────────────────────────
// Scrapes Frequent Miler's transfer-bonus tracker, asks Claude Haiku to
// extract structured rows, writes the snapshot to Supabase row id='current'.
async function refreshTransferBonuses(req, res) {
  const isVercelCron = req.headers["x-vercel-cron"] === "1";
  const secret = process.env.CRON_SECRET;
  const okSecret = secret && req.query.secret === secret;
  if (!isVercelCron && !okSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!anthropicKey) return res.status(500).json({ error: "Missing ANTHROPIC_API_KEY" });
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Missing Supabase config" });

  const SOURCE_URL = "https://frequentmiler.com/transfer-bonus-promotions/";
  let html;
  try {
    const r = await fetch(SOURCE_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ContinuumApp/1.0; +https://gocontinuum.app)" },
    });
    if (!r.ok) return res.status(502).json({ error: `Source returned ${r.status}` });
    html = await r.text();
  } catch (e) {
    return res.status(502).json({ error: `Fetch failed: ${e.message}` });
  }

  // Strip down HTML aggressively to fit context cheaply.
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/?(svg|path|img|nav|footer|header|aside|form|iframe)[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60000);

  const todayIso = new Date().toISOString().slice(0, 10);
  const prompt = `You are extracting structured data from a credit-card-points transfer-bonus tracker page.

Today's date: ${todayIso}

Return ONLY a JSON array of currently-active transfer bonus promotions. Each item must match this schema:
{
  "from": string,         // The source loyalty currency, exactly one of: "Amex Membership Rewards", "Chase Ultimate Rewards", "Capital One Miles", "Citi ThankYou Points", "Bilt Rewards", "Marriott Bonvoy", "World of Hyatt", "Hilton Honors", "IHG One Rewards"
  "to": string,           // Destination program, e.g. "Virgin Atlantic Flying Club", "Air France-KLM Flying Blue", "Hyatt"
  "bonusPct": number,     // The bonus percentage, e.g. 30 for "30% bonus" (1000 pts -> 1300)
  "endDate": string|null, // YYYY-MM-DD, null if no end date stated
  "notes": string|null,   // Optional one-line caveat (targeted offer, minimum, first-time, etc.). Null if none.
  "url": string|null      // Source URL if a per-offer link is given, else null
}

Rules:
- Include ONLY currently active offers (endDate >= today, or no endDate).
- If from-currency is not in the list above, skip the row.
- Keep "to" concise (program name, not a sentence).
- Output JSON ONLY — no prose, no code fences. Empty array [] is acceptable if nothing is live.

Page content:
"""
${text}
"""`;

  let bonuses = [];
  try {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!aiRes.ok) {
      const errBody = await aiRes.text();
      return res.status(502).json({ error: `Claude API ${aiRes.status}: ${errBody.slice(0, 300)}` });
    }
    const aiJson = await aiRes.json();
    const content = aiJson?.content?.[0]?.text?.trim() || "";
    // Defensive: strip any code fences if model added them
    const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    bonuses = JSON.parse(cleaned);
    if (!Array.isArray(bonuses)) throw new Error("Not an array");
  } catch (e) {
    return res.status(502).json({ error: `Parse failed: ${e.message}` });
  }

  // Write snapshot to Supabase via REST (no SDK to keep this lean)
  const payload = { source: "Frequent Miler", bonuses };
  try {
    const upsertRes = await fetch(`${supabaseUrl}/rest/v1/transfer_bonuses?on_conflict=id`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "authorization": `Bearer ${supabaseKey}`,
        "content-type": "application/json",
        "prefer": "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ id: "current", payload, updated_at: new Date().toISOString() }),
    });
    if (!upsertRes.ok) {
      const errBody = await upsertRes.text();
      return res.status(502).json({ error: `Supabase upsert ${upsertRes.status}: ${errBody.slice(0, 300)}` });
    }
  } catch (e) {
    return res.status(502).json({ error: `Supabase write failed: ${e.message}` });
  }

  return res.status(200).json({ ok: true, count: bonuses.length, bonuses });
}

export default withSentry(handler);
