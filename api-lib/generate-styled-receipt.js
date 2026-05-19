// Generates a styled HTML email-receipt from parsed summary fields using
// Claude. The result is meant to LOOK like a real transactional email
// (airline confirmation, hotel booking, etc.) even though the original
// email's HTML was destroyed by mail-client forwarding. Claude reads the
// plain-text body + parsed fields and produces self-contained styled HTML
// that the Chromium screenshot pipeline can render reliably.

const STRIP_FENCE = /^```(?:html|HTML)?\s*\n?|```\s*$/g;

export async function generateStyledReceiptHtml(summary, anthropicKey) {
  if (!anthropicKey) throw new Error("Missing Anthropic API key");
  const s = summary || {};

  const prompt = `You are designing a clean, professional HTML representation of a forwarded email receipt for record-keeping.

Email data (parsed from a forwarded message):
- Merchant: ${s.merchant || "(unknown)"}
- Subject line: ${s.subject || "(none)"}
- Amount: ${s.currency || "USD"} ${Number(s.amount || 0).toFixed(2)}
- Transaction date: ${s.date || "(unknown)"}
- Category: ${s.category || "other"}
- Forwarded from: ${s.fromEmail || "(unknown)"}
- ${s.hasAttachment ? `Attachment: ${s.attachmentName}` : "No attachment"}

Email body text (this is the actual content of the email, with literal newlines preserved):
"""
${(s.bodyText || "").slice(0, 4000)}
"""

Generate a single self-contained HTML document that visually represents this email as a clean, modern transactional-email receipt. Requirements:

1. Use only inline CSS or a single <style> block in <head>. No external stylesheets, no <script>, no remote images, no <img> tags.
2. Width: max 760px, centered.
3. System fonts only: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif.
4. Background: #ffffff. Body text: #1a1a1a. Muted text: #666. Accent: #D4742D (use sparingly — merchant name, key totals).
5. Visual structure (top to bottom):
   - Receipt header: small uppercase tag like "EMAIL RECEIPT" + large merchant name + subject below
   - Key fields panel: Amount (prominent), Date, Category, From — laid out as a clean table or grid
   - Body section: parse the email body and present it with proper paragraphs, section headings (e.g. "Flight", "Payment", "Itinerary"), bold for labels, and structured layout where the body data suggests structure (flight info, totals, traveler info, etc.)
   - Strip out email-signature noise (phone numbers, confidentiality notices, MAAA/FSA titles), forwarding chain headers (From:/Sent:/To:/Subject: lines), and quote markers. Keep only the actual receipt/confirmation content.
   - Remove inline URL tracking junk like "<https://b11rb8mj.r.us-east-1.awstrack.me/...>" — show the human-readable label only.
   - Remove "[cid:...]" placeholder strings.
6. Use tables, dl/dt/dd, or grid layouts to give structure — DO NOT just dump text in <p> tags.
7. Use #fafafa background panels with #eee borders for grouping related fields.
8. Make it print-friendly and look like something you could file as an expense receipt.

Output ONLY the raw HTML document (starts with <!doctype html>). No commentary, no markdown code fences, no preamble.`;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`Claude API ${resp.status}: ${errText.slice(0, 300)}`);
  }
  const data = await resp.json();
  let html = data?.content?.[0]?.text || "";
  html = html.trim().replace(STRIP_FENCE, "").trim();
  // Sanity: must look like HTML
  if (!/<!doctype|<html/i.test(html)) {
    throw new Error("Claude returned non-HTML output");
  }
  return html;
}
