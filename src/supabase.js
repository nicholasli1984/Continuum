import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const projectRef = supabaseUrl?.split("//")[1]?.split(".")[0] || "continuum";

// Safe storage adapter for Supabase auth.
//
// Passing `window.localStorage` directly is fragile: some environments
// (locked-down WebViews, Safari private mode, sandboxed iframes, devices with
// storage disabled) throw on localStorage access — including InvalidAccessError.
// That throw propagates out of Supabase's _saveSession during token refresh on
// load, hits no handler, and crashes the whole app (seen in Sentry).
//
// This wrapper try/catches every call and falls back to an in-memory store, so
// in a hostile environment the session just doesn't persist across reloads
// instead of taking the app down. Memory holds the latest value; localStorage
// is best-effort; reads prefer localStorage and fall back to memory.
const memory = new Map();
const safeStorage = {
  getItem(key) {
    try {
      const v = window.localStorage.getItem(key);
      if (v !== null) return v;
    } catch { /* storage blocked — fall through to memory */ }
    return memory.has(key) ? memory.get(key) : null;
  },
  setItem(key, value) {
    memory.set(key, value);
    try { window.localStorage.setItem(key, value); } catch { /* keep memory copy */ }
  },
  removeItem(key) {
    memory.delete(key);
    try { window.localStorage.removeItem(key); } catch { /* nothing to do */ }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: `sb-${projectRef}-auth-token`,
    storage: safeStorage,
    flowType: "pkce",
  },
});
