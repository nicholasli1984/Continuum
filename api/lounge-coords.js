// /api/lounge-coords — resolves a Google Places text query (e.g. the lounges
// dataset's `placeQuery` field like "Qantas Club Adelaide Airport") into a
// lat/lng for the directions iframe. Aggressively edge-cached so popular
// lounges only hit Google once across all users.
//
// Inputs (query string):
//   query — Places-friendly search string (required)
//
// Requires GOOGLE_PLACES_API_KEY env var.
export default async function handler(req, res) {
  // Coordinates don't change. Cache forever (well, 60 days) at the edge.
  res.setHeader("Cache-Control", "public, max-age=5184000, s-maxage=5184000, stale-while-revalidate=604800");

  const { query = "" } = req.query || {};
  const key = (process.env.GOOGLE_PLACES_API_KEY || "").trim();

  if (!key || !query) return res.status(200).json({ lat: null, lng: null });

  try {
    const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.location,places.displayName",
      },
      body: JSON.stringify({
        textQuery: String(query),
        maxResultCount: 1,
      }),
    });

    if (!r.ok) {
      console.error("[lounge-coords] searchText failed:", r.status);
      return res.status(200).json({ lat: null, lng: null });
    }

    const data = await r.json();
    const loc = data?.places?.[0]?.location;
    const name = data?.places?.[0]?.displayName?.text || null;
    if (!loc) return res.status(200).json({ lat: null, lng: null });

    return res.status(200).json({
      lat: loc.latitude ?? null,
      lng: loc.longitude ?? null,
      name,
    });
  } catch (e) {
    console.error("[lounge-coords] error:", e.message);
    return res.status(200).json({ lat: null, lng: null });
  }
}
