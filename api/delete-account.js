// Account deletion — Apple App Store Review Guideline 5.1.1(v) requires
// any app that creates accounts to also let users delete their account
// IN-APP (not just on a website). This endpoint:
//
//   1. Verifies the caller's JWT via Supabase Auth.
//   2. Deletes user-owned rows from every table that has a user_id column.
//   3. Deletes the auth user via the Supabase admin API.
//
// On the client, the user must reauthenticate-ish (active session token in
// the Authorization header is enough to prove identity), confirm the
// destructive action twice, then receive a clean sign-out.
//
// We do NOT try to handle shared/collaborative data perfectly: when the
// deleter is the OWNER of a shared trip, the trip is deleted; recipients
// just lose access. That matches user expectations and avoids a much
// thornier consent dance.

import { withSentry } from "../api-lib/sentry.js";

async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Server config error" });
  }

  // 1. Identify the caller. We require an Authorization: Bearer <access_token>
  //    header — that proves they're the user they say they are.
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const accessToken = auth.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) return res.status(401).json({ error: "Missing access token" });

  let userId, userEmail;
  try {
    const meResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${accessToken}` },
    });
    if (!meResp.ok) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
    const me = await meResp.json();
    userId = me?.id;
    userEmail = me?.email;
    if (!userId) return res.status(401).json({ error: "Could not resolve user" });
  } catch (e) {
    return res.status(401).json({ error: "Auth verification failed" });
  }

  // 2. Scrub user-owned data. Each table is best-effort — if any one fails
  //    we log and continue so a partial migration doesn't leave a half-
  //    deleted account. Order does not matter except where foreign keys
  //    cascade (which Supabase generally handles).
  const tablesByUserId = [
    "expenses",
    "trips",
    "expense_reports",
    "user_vouchers",
    "linked_accounts",
    "itineraries",
    "user_forwarding_addresses",
    "gmail_connections",
    "push_subscriptions",
    "split_groups",
    "split_contacts",
  ];

  const deletionLog = {};
  for (const table of tablesByUserId) {
    try {
      const resp = await fetch(`${supabaseUrl}/rest/v1/${table}?user_id=eq.${userId}`, {
        method: "DELETE",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Prefer: "return=minimal",
        },
      });
      deletionLog[table] = resp.status;
    } catch (e) {
      deletionLog[table] = `err:${e?.message?.slice(0, 60)}`;
    }
  }

  // Trip shares: rows where the user is the owner OR the invitee.
  // Schema uses `shared_by_user_id` for owner and `shared_with_email` for invitee.
  if (userEmail) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/trip_shares?shared_by_user_id=eq.${userId}`, {
        method: "DELETE",
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: "return=minimal" },
      });
      await fetch(`${supabaseUrl}/rest/v1/trip_shares?shared_with_email=eq.${encodeURIComponent(userEmail.toLowerCase())}`, {
        method: "DELETE",
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: "return=minimal" },
      });
    } catch (_) {}
  }

  // 3. Delete the auth user. After this the access token is invalid and the
  //    user cannot sign back in with the same credentials. Email is freed
  //    up for future sign-ups.
  let authDeleteStatus;
  try {
    const delResp = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    authDeleteStatus = delResp.status;
    if (!delResp.ok) {
      const txt = await delResp.text();
      console.error("[delete-account] admin delete failed:", delResp.status, txt.slice(0, 200));
      return res.status(500).json({ error: "Could not delete auth user", detail: txt.slice(0, 300), deletionLog });
    }
  } catch (e) {
    return res.status(500).json({ error: "Auth deletion threw", detail: e?.message?.slice(0, 200), deletionLog });
  }

  console.log("[delete-account] deleted user", userId, "log:", JSON.stringify(deletionLog));
  return res.status(200).json({ ok: true, userId, deletionLog, authDeleteStatus });
}

export default withSentry(handler);
