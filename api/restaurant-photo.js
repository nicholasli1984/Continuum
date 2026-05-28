// /api/restaurant-photo — proxies a real photo of a named restaurant via the
// Google Places API (New). Returns a 302 redirect to a googleusercontent URL
// so we don't bandwidth our function with image bytes. If Places has nothing
// for this name+city, redirects to the supplied `fallback` (cuisine-generic).
//
// Inputs (query string):
//   name      — restaurant name (required)
//   city      — city, to disambiguate the text search (optional but recommended)
//   fallback  — URL to redirect to if no photo is found (recommended)
//
// Requires env var GOOGLE_PLACES_API_KEY. Enable "Places API (New)" in the
// Google Cloud Console project that owns the key.
export default async function handler(req, res) {
  // Aggressive caching — Vercel's edge will absorb repeat hits and never even
  // run this function for the same (name, city) pair within 30 days.
  res.setHeader("Cache-Control", "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=604800");

  const { name = "", city = "", fallback = "" } = req.query || {};
  const key = (process.env.GOOGLE_PLACES_API_KEY || "").trim();

  // Fail open: if we can't get a real photo for any reason, send the client to
  // the cuisine fallback so the card still renders something nice.
  const bail = () => {
    if (fallback) return res.redirect(302, String(fallback));
    return res.status(404).send("no photo");
  };

  if (!key || !name) return bail();

  try {
    const textQuery = [name, city].filter(Boolean).join(" ");

    // 1) Find the place + its photo references.
    const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.id,places.photos",
      },
      body: JSON.stringify({ textQuery, maxResultCount: 1 }),
    });

    if (!searchRes.ok) {
      console.error("[restaurant-photo] searchText failed:", searchRes.status);
      return bail();
    }

    const data = await searchRes.json();
    const photoName = data?.places?.[0]?.photos?.[0]?.name;
    if (!photoName) return bail();

    // 2) Ask Places for the photo URL (skipHttpRedirect=true returns JSON
    //    instead of a 302). The returned photoUri is a signed googleusercontent
    //    link that the browser can load directly — no API key needed.
    const mediaRes = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media` +
      `?maxWidthPx=520&skipHttpRedirect=true&key=${encodeURIComponent(key)}`
    );

    if (!mediaRes.ok) {
      console.error("[restaurant-photo] media failed:", mediaRes.status);
      return bail();
    }

    const { photoUri } = await mediaRes.json();
    if (!photoUri) return bail();

    return res.redirect(302, photoUri);
  } catch (e) {
    console.error("[restaurant-photo] error:", e.message);
    return bail();
  }
}
