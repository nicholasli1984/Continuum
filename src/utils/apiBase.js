// Fetch wrapper so the app's own /api endpoints work on the native app.
//
// The native WebView runs from capacitor://localhost, so a relative "/api/..."
// URL never reaches the Vercel backend, and a cross-origin fetch to
// gocontinuum.app is CORS/preflight-blocked. On native we therefore route /api
// calls through the built-in native HTTP plugin (CapacitorHttp) against an
// absolute URL — native HTTP isn't subject to browser CORS, so it just works.
//
// On web it's a plain same-origin fetch (unchanged behavior). We deliberately
// do NOT enable CapacitorHttp globally — that would reroute Supabase's own
// fetches too. This wrapper only touches calls that opt in via apiFetch().
//
// Returns a fetch-like Response supporting .ok / .status / .json() / .text() /
// .headers.get() — which is everything our /api callers use (all JSON).
import { Capacitor, CapacitorHttp } from "@capacitor/core";

const API_BASE = "https://gocontinuum.app";
const isNative = () => { try { return Capacitor.isNativePlatform(); } catch { return false; } };

export async function apiFetch(path, opts = {}) {
  if (!isNative()) return fetch(path, opts);

  const url = /^https?:\/\//.test(path) ? path : API_BASE + path;
  const method = (opts.method || "GET").toUpperCase();
  const headers = { ...(opts.headers || {}) };

  let data;
  if (opts.body != null) {
    if (typeof opts.body === "string") { try { data = JSON.parse(opts.body); } catch { data = opts.body; } }
    else data = opts.body;
  }

  let res;
  try {
    res = await CapacitorHttp.request({ url, method, headers, data });
  } catch (e) {
    throw new TypeError("Network request failed: " + (e?.message || e));
  }

  const status = res.status || 0;
  const raw = res.data;
  const h = res.headers || {};
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => (typeof raw === "string" ? JSON.parse(raw) : raw),
    text: async () => (typeof raw === "string" ? raw : JSON.stringify(raw ?? "")),
    headers: { get: (k) => h[k] ?? h[String(k).toLowerCase()] ?? null },
  };
}
