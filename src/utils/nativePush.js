// Native push registration for the Capacitor app (iOS APNs; Android FCM later).
//
// On a native platform this requests notification permission, registers with
// the OS to get a device token, and saves that token to the backend so the
// flight cron can push to it. On web it no-ops (the PWA uses web-push instead).
//
// The token is an OS-level APNs token, completely separate from the web-push
// PushSubscription — different table (device_push_tokens), different send path.
import { isNative } from "./nativeCamera";

// Save a device token to the backend (idempotent upsert, keyed by token).
async function saveToken(userId, token, platform) {
  try {
    await fetch("/api/push-notify?action=subscribe-native", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, token, platform }),
    });
    return true;
  } catch {
    return false;
  }
}

// Register for native push and persist the token.
//   silent=true  → only proceed if permission is ALREADY granted (no prompt).
//                  Used to refresh the token on every app open.
//   silent=false → prompt for permission if needed. Used when the user taps
//                  "Enable notifications".
// Returns { ok, token?, reason? }.
export async function registerNativePush(userId, { silent = false } = {}) {
  if (!isNative() || !userId) return { ok: false, reason: "not native" };
  let PushNotifications;
  try {
    ({ PushNotifications } = await import("@capacitor/push-notifications"));
  } catch {
    return { ok: false, reason: "plugin unavailable" };
  }

  let perm = await PushNotifications.checkPermissions();
  if (perm.receive !== "granted") {
    if (silent) return { ok: false, reason: "not granted (silent)" };
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") return { ok: false, reason: `permission ${perm.receive}` };
  }

  const platform = (() => {
    try { return /android/i.test(navigator.userAgent) ? "android" : "ios"; } catch { return "ios"; }
  })();

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => { if (!settled) { settled = true; resolve(result); } };

    // Attach BOTH listeners before calling register(). addListener is async in
    // Capacitor — calling register() first lets the registration event fire
    // before anything is listening, which previously just timed out.
    Promise.all([
      PushNotifications.addListener("registration", async (token) => {
        await saveToken(userId, token.value, platform);
        finish({ ok: true, token: token.value });
      }),
      PushNotifications.addListener("registrationError", (err) => {
        finish({ ok: false, reason: String(err?.error || err?.message || JSON.stringify(err)) });
      }),
    ])
      .then(() => PushNotifications.register())
      .catch((e) => finish({ ok: false, reason: "register: " + String(e?.message || e) }));

    // Don't hang the UI forever if the OS never fires the event.
    setTimeout(() => finish({ ok: false, reason: "timeout" }), 15000);
  });
}
