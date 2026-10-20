/*
 * Relink a split-group member to an email address.
 *
 * People can be added to a group by name alone — they get a handle in a
 * reserved local domain instead of an address. When that person later creates a
 * Continuum account, their entries need to move onto the real address so the
 * account is recognised as them. Deleting and re-adding would orphan every
 * share and settlement already recorded against the handle, which is the whole
 * problem this solves.
 *
 * Identity is the email column, and it is repeated across four places:
 *   split_group_members.email
 *   split_expense_shares.email      (per-person amounts on each expense)
 *   split_settlements.from_email / to_email
 *   split_contacts.email            (the owner's address book)
 *
 * The client cannot rewrite all of those: RLS lets you change shares only on
 * expenses you added yourself, so a member relinked by the group owner would
 * keep the old identity on anyone else's expenses — balances would silently
 * split in two. This runs with the service role to rewrite them together, and
 * authorises the caller first: they must hold a valid session and belong to the
 * group they are editing.
 */

const LOCAL_DOMAIN = "local.continuum";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Server is missing Supabase configuration" });
  }

  const svc = (path, init = {}) => fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  // ── 1. Who is calling ────────────────────────────────────────────────
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const accessToken = auth.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) return res.status(401).json({ error: "Missing access token" });

  let callerId, callerEmail;
  try {
    const meResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${accessToken}` },
    });
    if (!meResp.ok) return res.status(401).json({ error: "Invalid or expired session" });
    const me = await meResp.json();
    callerId = me?.id;
    callerEmail = (me?.email || "").toLowerCase();
    if (!callerId) return res.status(401).json({ error: "Could not resolve user" });
  } catch {
    return res.status(401).json({ error: "Auth verification failed" });
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const groupId = (body?.groupId || "").trim();
  const memberId = (body?.memberId || "").trim();
  const newEmail = (body?.newEmail || "").trim().toLowerCase();
  if (!groupId || !memberId) return res.status(400).json({ error: "Missing groupId or memberId" });
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  if (newEmail.endsWith(`@${LOCAL_DOMAIN}`)) {
    return res.status(400).json({ error: "That is a placeholder address, not a real one" });
  }

  try {
    // ── 2. Is the caller in this group? ────────────────────────────────
    const membersResp = await svc(`split_group_members?group_id=eq.${groupId}&select=id,email,display_name,user_id`);
    if (!membersResp.ok) return res.status(500).json({ error: "Could not read the group" });
    const members = await membersResp.json();

    const callerIsMember = members.some(m =>
      m.user_id === callerId || (m.email || "").toLowerCase() === callerEmail);
    if (!callerIsMember) return res.status(403).json({ error: "You are not a member of this group" });

    const target = members.find(m => m.id === memberId);
    if (!target) return res.status(404).json({ error: "That person is not in this group" });

    const oldEmail = (target.email || "").toLowerCase();
    if (oldEmail === newEmail) return res.status(200).json({ ok: true, unchanged: true });

    // The address must not already belong to someone else here, or two rows
    // would claim one identity and the balances would double up.
    const clash = members.find(m => m.id !== memberId && (m.email || "").toLowerCase() === newEmail);
    if (clash) {
      return res.status(409).json({ error: `${clash.display_name || newEmail} already uses that email in this group` });
    }

    // ── 3. Does an account exist for it? ───────────────────────────────
    let linkedUserId = null;
    try {
      const usersResp = await fetch(
        `${supabaseUrl}/auth/v1/admin/users?per_page=200&filter=${encodeURIComponent(newEmail)}`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
      if (usersResp.ok) {
        const found = await usersResp.json();
        const list = Array.isArray(found?.users) ? found.users : Array.isArray(found) ? found : [];
        linkedUserId = list.find(u => (u.email || "").toLowerCase() === newEmail)?.id || null;
      }
    } catch { /* linking is a bonus; the relink itself still stands */ }

    // ── 4. Rewrite the identity everywhere it appears ──────────────────
    const steps = [];

    // a. The membership row itself.
    steps.push(["member", await svc(`split_group_members?id=eq.${memberId}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ email: newEmail, user_id: linkedUserId || target.user_id || null }),
    })]);

    // b. Their shares, but only on this group's expenses — the same handle
    //    could legitimately exist in another group.
    const expResp = await svc(`split_expenses?group_id=eq.${groupId}&select=id`);
    const expenseIds = expResp.ok ? (await expResp.json()).map(e => e.id) : [];
    if (expenseIds.length) {
      const inList = `(${expenseIds.join(",")})`;
      steps.push(["shares", await svc(`split_expense_shares?email=eq.${encodeURIComponent(oldEmail)}&expense_id=in.${inList}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ email: newEmail }),
      })]);
    }

    // c. Settlements, on both sides of the payment.
    steps.push(["settlements_from", await svc(`split_settlements?group_id=eq.${groupId}&from_email=eq.${encodeURIComponent(oldEmail)}`, {
      method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ from_email: newEmail }),
    })]);
    steps.push(["settlements_to", await svc(`split_settlements?group_id=eq.${groupId}&to_email=eq.${encodeURIComponent(oldEmail)}`, {
      method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ to_email: newEmail }),
    })]);

    // d. The caller's address book. If they already have a contact on the real
    //    address, drop the placeholder rather than creating a duplicate.
    const contactsResp = await svc(`split_contacts?owner_id=eq.${callerId}&select=id,email`);
    if (contactsResp.ok) {
      const contacts = await contactsResp.json();
      const placeholder = contacts.find(c => (c.email || "").toLowerCase() === oldEmail);
      const existing = contacts.find(c => (c.email || "").toLowerCase() === newEmail);
      if (placeholder && existing) {
        steps.push(["contact_dedupe", await svc(`split_contacts?id=eq.${placeholder.id}`, {
          method: "DELETE", headers: { Prefer: "return=minimal" },
        })]);
      } else if (placeholder) {
        steps.push(["contact", await svc(`split_contacts?id=eq.${placeholder.id}`, {
          method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ email: newEmail }),
        })]);
      }
    }

    const failed = steps.filter(([, r]) => !r.ok).map(([name]) => name);
    if (failed.length) {
      // Partial writes leave the identity split, so say which parts landed
      // rather than reporting a clean success.
      return res.status(500).json({
        error: "The email was only partly applied — reload and try again",
        failed,
      });
    }

    return res.status(200).json({
      ok: true,
      email: newEmail,
      linkedUserId,
      hasAccount: !!linkedUserId,
      rewroteExpenses: expenseIds.length,
    });
  } catch (err) {
    console.error("[split-member] relink failed:", err);
    return res.status(500).json({ error: err.message || "Relink failed" });
  }
}
