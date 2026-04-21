export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const anthropicKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!anthropicKey) return res.status(500).json({ error: "AI not configured" });

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const { passportCountry, destinationCountry, destinationCity } = body;
    if (!passportCountry || !destinationCountry) {
      return res.status(400).json({ error: "passportCountry and destinationCountry required" });
    }

    const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: `You are a visa and immigration expert. Provide accurate visa requirements for a ${passportCountry} passport holder traveling to ${destinationCountry}${destinationCity ? ` (${destinationCity})` : ""}.

Use your knowledge from official government immigration sources. Be precise and current.

Return ONLY valid JSON, no markdown:
{
  "status": "visa_free" | "visa_on_arrival" | "evisa" | "visa_required" | "transit_visa",
  "stayDuration": "number of days allowed (e.g. '90 days' or '30 days')",
  "summary": "One sentence summary of the requirement",
  "details": "2-3 sentences with key details — what documents are needed at entry, any restrictions",
  "applicationSteps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "processingTime": "Expected processing time (e.g. '3-5 business days', '24-72 hours for eVisa', 'N/A for visa-free')",
  "cost": "Visa fee if applicable (e.g. '$160 USD', 'Free', '$25 eVisa fee')",
  "officialWebsite": "URL of the official government visa/immigration website",
  "importantNotes": [
    "Any critical warnings or tips (e.g. 'Passport must be valid 6 months beyond stay', 'Proof of onward travel required')"
  ]
}`,
        }],
      }),
    });

    const aiData = await aiResp.json();
    if (aiData?.error) {
      return res.status(200).json({ error: aiData.error.message });
    }

    const aiText = aiData?.content?.[0]?.text || "";
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.status(200).json({
        ...parsed,
        passportCountry,
        destinationCountry,
        checkedAt: new Date().toISOString(),
      });
    }

    return res.status(200).json({ error: "Could not parse response", raw: aiText });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
