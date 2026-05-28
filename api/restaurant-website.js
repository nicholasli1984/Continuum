// /api/restaurant-website — returns the official website URL for a named
// restaurant via Google Places API (New). Returns JSON { url } where url is
// the official site, or null if Places doesn't have one. Cached aggressively
// at the edge so repeat lookups are free.
//
// Inputs (query string):
//   name — restaurant name (required)
//   city — city, to disambiguate the search (recommended)
//
// Requires GOOGLE_PLACES_API_KEY env var (same key as /api/restaurant-photo).
export default async function handler(req, res) {
  // 30-day edge cache. Restaurants change their official site rarely; if one
  // does, Vercel's stale-while-revalidate window refreshes in the background.
  res.setHeader("Cache-Control", "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=604800");

  const { name = "", city = "" } = req.query || {};
  const key = (process.env.GOOGLE_PLACES_API_KEY || "").trim();

  if (!key || !name) return res.status(200).json({ url: null });

  try {
    const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.websiteUri,places.displayName",
      },
      body: JSON.stringify({
        textQuery: [name, city].filter(Boolean).join(" "),
        maxResultCount: 1,
      }),
    });

    if (!r.ok) {
      console.error("[restaurant-website] searchText failed:", r.status);
      return res.status(200).json({ url: null });
    }

    const data = await r.json();
    const url = data?.places?.[0]?.websiteUri || null;
    return res.status(200).json({ url });
  } catch (e) {
    console.error("[restaurant-website] error:", e.message);
    return res.status(200).json({ url: null });
  }
}
