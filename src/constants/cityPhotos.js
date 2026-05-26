// Verified city → destination photo map. Mirrors the Dashboard's `cityPhoto`
// resolver (every image was visually verified during the 2026-05-25 image audit)
// so trips across the app draw from the same trustworthy set. Substring match so
// "Tokyo, Japan" → Tokyo. Unknown cities fall back to a neutral travel image.

const Q = "?w=1400&q=80&auto=format&fit=crop";

export const CITY_PHOTOS = {
  Tokyo: "https://images.unsplash.com/photo-1542051841857-5f90071e7989" + Q,
  Osaka: "https://images.unsplash.com/photo-1590559899731-a382839e5549" + Q,
  Seoul: "https://images.unsplash.com/photo-1538485399081-7191377e8241" + Q,
  Taipei: "https://images.unsplash.com/photo-1470004914212-05527e49370b" + Q,
  "Hong Kong": "https://images.unsplash.com/photo-1536599018102-9f803c140fc1" + Q,
  Singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd" + Q,
  Bangkok: "https://images.unsplash.com/photo-1563492065599-3520f775eeed" + Q,
  Dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c" + Q,
  "New York": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9" + Q,
  London: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad" + Q,
  Paris: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f" + Q,
  Rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5" + Q,
  Barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded" + Q,
  Amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017" + Q,
  Sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9" + Q,
  "San Francisco": "https://images.unsplash.com/photo-1449034446853-66c86144b0ad" + Q,
  Miami: "https://images.unsplash.com/photo-1535498730771-e735b998cd64" + Q,
  Honolulu: "https://images.unsplash.com/photo-1507876466758-bc54f384809c" + Q,
  Vancouver: "https://images.unsplash.com/photo-1560814304-4f05b62af116" + Q,
  Montreal: "https://images.unsplash.com/photo-1519178614-68673b201f36" + Q,
  Toronto: "https://images.unsplash.com/photo-1517935706615-2717063c2225" + Q,
  Bermuda: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Horseshoebay.Bermuda.JPG/1280px-Horseshoebay.Bermuda.JPG",
};

export const DEFAULT_CITY_PHOTO = "https://images.unsplash.com/photo-1488646953014-85cb44e25828" + Q;

export function cityPhoto(city) {
  if (!city) return DEFAULT_CITY_PHOTO;
  const lc = String(city).toLowerCase();
  for (const [k, u] of Object.entries(CITY_PHOTOS)) if (lc.includes(k.toLowerCase())) return u;
  return DEFAULT_CITY_PHOTO;
}
