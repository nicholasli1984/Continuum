// ─────────────────────────────────────────────────────────────────────────
// Token-based APNs sender (HTTP/2 + JWT), using Node built-ins only so it
// bundles cleanly in a Vercel serverless function (no native deps).
//
// Auth = a JWT signed with your APNs Auth Key (.p8, ES256), reused for the
// whole run. Sends to Apple's production host by default (App Store + TestFlight
// builds get production device tokens); set APNS_PRODUCTION=false for Xcode
// debug builds (sandbox).
//
// Env vars (set in Vercel):
//   APNS_KEY         contents of the .p8 file (PEM; literal \n is tolerated)
//   APNS_KEY_ID      the Key ID of that .p8
//   APNS_TEAM_ID     your Apple Developer Team ID
//   APNS_BUNDLE_ID   the app's bundle id (apns-topic), e.g. app.gocontinuum.continuum
//   APNS_PRODUCTION  "true" (default) | "false"
// ─────────────────────────────────────────────────────────────────────────
import crypto from "node:crypto";
import http2 from "node:http2";

const KEY = (process.env.APNS_KEY || "").trim();
const KEY_ID = (process.env.APNS_KEY_ID || "").trim();
const TEAM_ID = (process.env.APNS_TEAM_ID || "").trim();
const BUNDLE_ID = (process.env.APNS_BUNDLE_ID || "app.gocontinuum.continuum").trim();
const PRODUCTION = (process.env.APNS_PRODUCTION || "true").trim() !== "false";

export function apnsConfigured() {
  return !!(KEY && KEY_ID && TEAM_ID && BUNDLE_ID);
}

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

function makeJwt() {
  const header = b64url(JSON.stringify({ alg: "ES256", kid: KEY_ID }));
  const claims = b64url(JSON.stringify({ iss: TEAM_ID, iat: Math.floor(Date.now() / 1000) }));
  const signingInput = `${header}.${claims}`;
  const keyPem = KEY.includes("\\n") ? KEY.replace(/\\n/g, "\n") : KEY;
  // ES256 needs the raw r||s signature (JOSE), not DER — dsaEncoding handles it.
  const sig = crypto.sign("SHA256", Buffer.from(signingInput), { key: keyPem, dsaEncoding: "ieee-p1363" });
  return `${signingInput}.${b64url(sig)}`;
}

// Create a sender bound to one HTTP/2 session + one JWT. Reuse for the whole
// cron run, then call close(). Returns null if APNs isn't configured.
export function createApnsSender() {
  if (!apnsConfigured()) return null;
  let jwt;
  try { jwt = makeJwt(); } catch (e) { console.error("APNs JWT error:", e.message); return null; }

  const host = PRODUCTION ? "https://api.push.apple.com" : "https://api.sandbox.push.apple.com";
  const client = http2.connect(host);
  client.on("error", () => {}); // avoid uncaught on transient session errors

  // Returns { ok, status, reason }. reason is Apple's error string on failure.
  const send = (token, { title, body, data }) =>
    new Promise((resolve) => {
      let payload;
      try {
        payload = JSON.stringify({
          aps: { alert: { title, body: body || "" }, sound: "default", "thread-id": data?.tag || data?.flightNumber || "flight" },
          ...(data || {}),
        });
      } catch { return resolve({ ok: false, status: 0, reason: "payload" }); }

      let req;
      try {
        req = client.request({
          ":method": "POST",
          ":path": `/3/device/${token}`,
          "authorization": `bearer ${jwt}`,
          "apns-topic": BUNDLE_ID,
          "apns-push-type": "alert",
          "apns-priority": "10",
          "content-type": "application/json",
        });
      } catch (e) { return resolve({ ok: false, status: 0, reason: e.message }); }

      let status = 0, respBody = "";
      req.on("response", (h) => { status = h[":status"]; });
      req.on("data", (d) => { respBody += d; });
      req.on("end", () => {
        if (status === 200) return resolve({ ok: true, status });
        let reason = ""; try { reason = JSON.parse(respBody).reason; } catch {}
        resolve({ ok: false, status, reason });
      });
      req.on("error", (e) => resolve({ ok: false, status: 0, reason: e.message }));
      req.setTimeout(8000, () => { try { req.close(); } catch {} resolve({ ok: false, status: 0, reason: "timeout" }); });
      req.end(payload);
    });

  const close = () => { try { client.close(); } catch {} };

  // A token should be deleted from the DB when Apple says it's permanently bad.
  const isDeadToken = (r) =>
    r.status === 410 || ["BadDeviceToken", "Unregistered", "DeviceTokenNotForTopic"].includes(r.reason);

  return { send, close, isDeadToken };
}
