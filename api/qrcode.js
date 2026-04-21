export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { data } = req.query;
  if (!data) return res.status(400).json({ error: "data parameter required" });

  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=480x480&format=svg&data=${encodeURIComponent(data)}`;
    const resp = await fetch(qrUrl);
    if (!resp.ok) return res.status(502).json({ error: "QR generation failed" });
    const svg = await resp.text();
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "s-maxage=86400");
    return res.status(200).send(svg);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
}
