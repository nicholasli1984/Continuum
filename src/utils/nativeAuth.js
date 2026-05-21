// Native social sign-in for the Capacitor app (Apple + Google), the
// App-Store-compliant way: the OS shows a native sign-in sheet (no external
// Safari redirect — that's what got the first submission rejected), the plugin
// returns an OIDC idToken, and we hand that to Supabase via signInWithIdToken.
//
// On web this is never used — the web/PWA keeps the existing signInWithOAuth
// redirect flow, which is fine in a browser.
//
// Requires (build-time, native only):
//   VITE_GOOGLE_IOS_CLIENT_ID   the iOS OAuth client id (…apps.googleusercontent.com)
//   VITE_GOOGLE_WEB_CLIENT_ID   the Web OAuth client id (audience Supabase verifies)
import { isNative } from "./nativeCamera";
import { supabase } from "../supabase";

const GOOGLE_IOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;

// Whether to show the native Google button (only once the iOS client id is
// configured at build time — avoids a button that can't work yet).
export const nativeGoogleEnabled = !!GOOGLE_IOS_CLIENT_ID;

let initialized = false;
async function ensureInit(SocialLogin) {
  if (initialized) return;
  await SocialLogin.initialize({
    apple: {}, // native Sign in with Apple uses the app's bundle id — no config
    ...(GOOGLE_IOS_CLIENT_ID
      ? { google: { iOSClientId: GOOGLE_IOS_CLIENT_ID, iOSServerClientId: GOOGLE_WEB_CLIENT_ID || undefined, mode: "online" } }
      : {}),
  });
  initialized = true;
}

// provider: 'apple' | 'google'. Returns { ok, reason?, cancelled? }.
// On success the Supabase auth listener picks up the new session and the UI
// updates on its own.
export async function nativeSignIn(provider) {
  if (!isNative()) return { ok: false, reason: "not native" };
  try {
    const { SocialLogin } = await import("@capgo/capacitor-social-login");
    await ensureInit(SocialLogin);
    const scopes = provider === "apple" ? ["email", "name"] : ["email", "profile"];
    const res = await SocialLogin.login({ provider, options: { scopes } });
    const idToken = res?.result?.idToken;
    if (!idToken) return { ok: false, reason: `No identity token returned from ${provider}.` };
    const { error } = await supabase.auth.signInWithIdToken({ provider, token: idToken });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    const msg = String(e?.message || e);
    // The plugin throws on user cancel — treat that as a non-error.
    return { ok: false, reason: msg, cancelled: /cancel|canceled|cancelled/i.test(msg) };
  }
}
