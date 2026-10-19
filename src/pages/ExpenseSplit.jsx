import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "../utils/apiBase";
import { motion, AnimatePresence } from "framer-motion";
import lobsterPicture from "../components/expenseSplitBg.jpg";
import { isLandingDemo, DEMO_FIRST_NAME, getDemoContacts, getDemoTrip } from "../utils/landingDemo";

const SPLIT_CATS = [
  { id: "food", label: "Food & Drinks", color: "#C8553D" },
  { id: "transport", label: "Transport", color: "#6B7A5A" },
  { id: "accommodation", label: "Accommodation", color: "#B8924A" },
  { id: "activities", label: "Activities", color: "#6B6458" },
  { id: "shopping", label: "Shopping", color: "#C8553D" },
  { id: "flights", label: "Flights", color: "#6B7A5A" },
  { id: "other", label: "Other", color: "#B8AE9C" },
];

const CHIP_COLORS = ["#C8553D", "#6B7A5A", "#B8924A", "#6B6458", "#2C2A26"];
const initials = (name) => name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

/*
 * Local handles — people in a split who don't have an email on file.
 *
 * Every split table keys a person by their address: group membership, each
 * expense share, every settlement. Making the email column nullable would mean
 * reworking all of that, so someone added by name alone gets a stable handle in
 * a reserved domain instead. It satisfies the schema and keeps the balance
 * maths untouched, and because it is recognisable the UI can hide it and no
 * code path will try to invite or match a real account with it.
 */
const LOCAL_DOMAIN = "local.continuum";
const isLocalHandle = (email) => (email || "").toLowerCase().endsWith(`@${LOCAL_DOMAIN}`);
const makeLocalHandle = (name) => {
  const slug = (name || "")
    .toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "").slice(0, 24) || "person";
  return `${slug}.${Math.random().toString(36).slice(2, 8)}@${LOCAL_DOMAIN}`;
};
// The receipt columns arrived in a later patch; PostgREST answers an unknown
// column with PGRST204 (or 42703 straight from Postgres).
const missingReceiptColumn = (error) =>
  !!error && (error.code === "PGRST204" || error.code === "42703" || /receipt_image/i.test(error.message || ""));

// An expense's receipts, newest storage shape first. Rows written before
// multi-receipt support carry a single `receipt_image` instead of a list.
const receiptsOf = (exp) => {
  if (Array.isArray(exp?.receipt_images) && exp.receipt_images.length) return exp.receipt_images.filter(Boolean);
  return exp?.receipt_image ? [exp.receipt_image] : [];
};

// What to show where an address would go — nothing, for a name-only person.
const shownEmail = (email) => (isLocalHandle(email) ? "" : email);
// Fallback label when there's no display name: never expose the handle.
const handleLabel = (email) => (isLocalHandle(email) ? "Unnamed" : (email || "").split("@")[0]);

// Common travel currencies for the split form
const SPLIT_CURRENCIES = ["USD","EUR","GBP","JPY","CAD","AUD","CHF","CNY","HKD","SGD","MXN","BRL","INR","KRW","AED","THB","NZD","NOK","SEK","DKK"];
const CURRENCY_SYMBOLS = { USD:"$", EUR:"€", GBP:"£", JPY:"¥", CAD:"CA$", AUD:"A$", CHF:"Fr", CNY:"¥", HKD:"HK$", SGD:"S$", MXN:"MX$", BRL:"R$", INR:"₹", KRW:"₩", AED:"د.إ", THB:"฿", NZD:"NZ$", NOK:"kr", SEK:"kr", DKK:"kr" };
const symFor = (ccy) => CURRENCY_SYMBOLS[ccy] || `${ccy} `;
const SPLIT_TYPES = [
  { id: "equal",      label: "Equal",      hint: "split evenly across selected people" },
  { id: "exact",      label: "Exact",      hint: "enter the dollar amount each person owes" },
  { id: "percentage", label: "Percentage", hint: "must total 100%" },
  { id: "shares",     label: "Shares",     hint: "e.g. 2:1:1 — first person pays double" },
];

export function renderExpenseSplit(s) {
  return <ExpenseSplitPage {...s} />;
}

// Free-tier per-group expense cap removed — every user can split as many as they want.

function ExpenseSplitPage({ css, isMobile, darkMode, user, supabase, navResetTimestamp }) {
  const D = darkMode;

  // Divvy palette — adapts to dark/light
  const dv = {
    bone: D ? "#1a1a1a" : "#fff",
    paper: D ? "#222" : "#fff",
    cream: D ? "rgba(255,255,255,0.06)" : "#E2DCCE",
    stone: D ? "#8a8a8a" : "#857A66",
    taupe: D ? "#999" : "#6B6458",
    graphite: D ? "#111" : "#2C2A26",
    ink: D ? "#f0ece6" : "#15130F",
    accent: "#C8553D",
    accentSoft: "#E4A88F",
    moss: "#6B7A5A",
    gold: "#B8924A",
    serif: "'Fraunces', 'Instrument Serif', Georgia, serif",
    sans: "'Inter Tight', 'Instrument Sans', sans-serif",
    mono: "'JetBrains Mono', 'Geist Mono', monospace",
  };

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupExpenses, setGroupExpenses] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettle, setShowSettle] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: "", amount: "", currency: "USD", fxRate: 1,
    category: "food", paidBy: user?.email || "",
    splitType: "equal", splitInputs: {}, // { [email]: stringValue } when not equal
    date: new Date().toISOString().slice(0, 10), receiptImages: [],
  });
  const [splitWith, setSplitWith] = useState(new Set()); // emails included in split
  const [allBalances, setAllBalances] = useState(null); // { byCurrency: { USD: { totalOwed, totalOwing, perPerson: { email: net } } }, loaded }
  const receiptInputRef = useRef(null);
  const [settleForm, setSettleForm] = useState({ to: "", amount: "" });
  const [tablesReady, setTablesReady] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [addMemberForm, setAddMemberForm] = useState({ show: false, email: "", name: "" });
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [groupNameDraft, setGroupNameDraft] = useState("");
  const [contacts, setContacts] = useState([]);
  const [contactsReady, setContactsReady] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactForm, setContactForm] = useState({ email: "", name: "" });
  const [editingContactId, setEditingContactId] = useState(null);
  const [editingContactName, setEditingContactName] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editExpenseForm, setEditExpenseForm] = useState({ description: "", amount: "", currency: "USD", fxRate: 1, category: "food", date: "", splitType: "equal", splitInputs: {}, receiptImages: [] });
  const editReceiptInputRef = useRef(null);
  // Set when a receipt couldn't be stored because the column isn't there yet.
  const [receiptNotice, setReceiptNotice] = useState(false);
  // { id, state: "saving" | "saved" | "removed" | "error" } for the row being edited.
  const [receiptStatus, setReceiptStatus] = useState(null);
  // Receipt currently open full size, as a data URL.
  const [receiptViewer, setReceiptViewer] = useState(null);
  const [showStatement, setShowStatement] = useState(false);
  const [statementCopied, setStatementCopied] = useState(false);
  const [editSplitWith, setEditSplitWith] = useState(new Set());
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);
  const totalRef = useRef(null);

  const userEmail = (user?.email || "").toLowerCase().trim();
  const userName = isLandingDemo()
    ? DEMO_FIRST_NAME
    : (user?.user_metadata?.first_name || userEmail.split("@")[0]);

  useEffect(() => { if (user) { loadGroups(); loadContacts(); } }, [user]);

  // Reset to the groups-list view whenever the bottom-nav Expense Split button
  // is tapped. The parent bumps navResetTimestamp on every nav click so we
  // can pop out of any sub-view (group detail, edit forms, etc.).
  useEffect(() => {
    if (!navResetTimestamp) return;
    setSelectedGroup(null);
    setShowAddExpense(false);
    setShowSettle(false);
    setShowNewGroup(false);
    setEditingExpenseId(null);
    setEditingMemberId(null);
    setExpandedExpenseId(null);
    setShowAddContact(false);
  }, [navResetTimestamp]);

  // ── Address book (contacts) ──
  const loadContacts = async () => {
    if (!user) return;
    // Landing-demo mode: bypass Supabase and surface two generic companions
    // so the Expense Split screenshot doesn't expose real address-book names.
    if (isLandingDemo()) {
      setContacts(getDemoContacts(user.id));
      setContactsReady(true);
      return;
    }
    const { data, error } = await supabase.from("split_contacts").select("*").eq("owner_id", user.id).order("display_name", { ascending: true });
    if (error) {
      // Table not yet migrated — non-fatal, just disable the address book UI.
      if (error.code === "42P01" || error.message?.includes("schema cache")) {
        setContactsReady(false); setContacts([]); return;
      }
      console.error("loadContacts error:", error);
      setContactsReady(true); return;
    }
    setContacts(data || []);
    setContactsReady(true);
    // First-load backfill from groups the user owns.
    if ((data || []).length === 0) backfillContactsFromOwnedGroups(data || []);
  };

  const backfillContactsFromOwnedGroups = async (existing) => {
    if (!user) return;
    const { data: ownedGroups } = await supabase.from("split_groups").select("id").eq("created_by", user.id);
    if (!ownedGroups || ownedGroups.length === 0) return;
    const { data: members } = await supabase.from("split_group_members").select("email, display_name").in("group_id", ownedGroups.map(g => g.id));
    if (!members || members.length === 0) return;
    const existingEmails = new Set((existing || []).map(c => (c.email || "").toLowerCase()));
    const seen = new Set();
    const rows = [];
    members.forEach(m => {
      const norm = (m.email || "").toLowerCase().trim();
      if (!norm || norm === userEmail || existingEmails.has(norm) || seen.has(norm)) return;
      seen.add(norm);
      rows.push({ owner_id: user.id, email: norm, display_name: m.display_name || norm.split("@")[0] });
    });
    if (rows.length === 0) return;
    const { data: inserted } = await supabase.from("split_contacts").insert(rows).select();
    if (inserted) setContacts(prev => [...prev, ...inserted].sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "")));
  };

  // A contact needs either an address or a name. With only a name, the person
  // is matched by that name so adding them again reuses the same handle rather
  // than creating a second entry for the same person.
  const addContact = async (email, displayName) => {
    if (!user) return null;
    const name = (displayName || "").trim();
    const given = (email || "").toLowerCase().trim();
    if (!given && !name) return null;
    if (given && !given.includes("@")) return null;
    if (given && given === userEmail) return null;
    if (given) {
      const existing = contacts.find(c => (c.email || "").toLowerCase() === given);
      if (existing) return existing;
    } else {
      const existing = contacts.find(c => isLocalHandle(c.email) && (c.display_name || "").toLowerCase() === name.toLowerCase());
      if (existing) return existing;
    }
    const norm = given || makeLocalHandle(name);
    const row = { owner_id: user.id, email: norm, display_name: (name || norm.split("@")[0]).trim() };
    const { data, error } = await supabase.from("split_contacts").insert(row).select().single();
    if (error) {
      if (error.code === "23505") {
        // Race / duplicate — re-fetch
        const { data: re } = await supabase.from("split_contacts").select("*").eq("owner_id", user.id).eq("email", norm).single();
        if (re && !contacts.find(c => c.id === re.id)) setContacts(prev => [...prev, re].sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "")));
        return re || null;
      }
      console.error("addContact error:", error);
      return null;
    }
    setContacts(prev => [...prev, data].sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "")));
    return data;
  };

  const renameContact = async (id, displayName) => {
    const name = (displayName || "").trim();
    if (!name) return;
    await supabase.from("split_contacts").update({ display_name: name }).eq("id", id);
    setContacts(prev => prev.map(c => c.id === id ? { ...c, display_name: name } : c));
  };

  const removeContact = async (id) => {
    await supabase.from("split_contacts").delete().eq("id", id);
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  // Server-side lookup: returns the auth.users.id for an email if that email
  // belongs to a registered Continuum account, otherwise null.
  const lookupContinuumUser = async (email) => {
    const norm = (email || "").toLowerCase().trim();
    if (!norm.includes("@") || !user) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return null;
      const res = await apiFetch("/api/shared-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "lookup_user", email: norm }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.user_id || null;
    } catch (e) {
      return null;
    }
  };

  // Load global balances across every group the user belongs to so we can
  // show a "you're owed / you owe" summary on the landing view. Re-runs when
  // groups change or the user adds/edits/settles in any group.
  useEffect(() => {
    if (!user || groups.length === 0) { setAllBalances(null); return; }
    let cancelled = false;
    (async () => {
      const groupIds = groups.map(g => g.id);
      const [{ data: exps }, { data: setts }] = await Promise.all([
        supabase.from("split_expenses").select("id, group_id, paid_by_email, amount, fx_rate, currency, split_expense_shares(email, amount)").in("group_id", groupIds),
        supabase.from("split_settlements").select("group_id, from_email, to_email, amount").in("group_id", groupIds),
      ]);
      if (cancelled) return;
      const groupCcyById = Object.fromEntries(groups.map(g => [g.id, g.currency || "USD"]));
      // byCurrency: { CCY: { perPerson: { email: net (positive = they owe you) } } }
      const byCurrency = {};
      const ensureCcy = (ccy) => { if (!byCurrency[ccy]) byCurrency[ccy] = { perPerson: {} }; return byCurrency[ccy]; };

      (exps || []).forEach(exp => {
        const ccy = groupCcyById[exp.group_id] || "USD";
        const fx = parseFloat(exp.fx_rate) > 0 ? parseFloat(exp.fx_rate) : 1;
        const totalInGroupCcy = (exp.amount || 0) * fx;
        const bucket = ensureCcy(ccy);
        const shares = exp.split_expense_shares || [];
        const myShare = shares.find(sh => sh.email === userEmail);
        const myShareAmt = myShare ? (myShare.amount * fx) : 0;
        if (exp.paid_by_email === userEmail) {
          // You paid. Each non-you share is what they owe you.
          shares.forEach(sh => {
            if (sh.email === userEmail) return;
            bucket.perPerson[sh.email] = (bucket.perPerson[sh.email] || 0) + (sh.amount * fx);
          });
        } else if (myShareAmt > 0) {
          // Someone else paid. You owe them your share.
          bucket.perPerson[exp.paid_by_email] = (bucket.perPerson[exp.paid_by_email] || 0) - myShareAmt;
        }
      });

      (setts || []).forEach(s => {
        const ccy = groupCcyById[s.group_id] || "USD";
        const bucket = ensureCcy(ccy);
        if (s.from_email === userEmail) bucket.perPerson[s.to_email] = (bucket.perPerson[s.to_email] || 0) + s.amount;
        else if (s.to_email === userEmail) bucket.perPerson[s.from_email] = (bucket.perPerson[s.from_email] || 0) - s.amount;
      });

      // Compute totals per currency
      Object.keys(byCurrency).forEach(ccy => {
        const buc = byCurrency[ccy];
        let owed = 0, owing = 0;
        Object.values(buc.perPerson).forEach(v => { if (v > 0.01) owed += v; else if (v < -0.01) owing += -v; });
        buc.totalOwed = owed;
        buc.totalOwing = owing;
        buc.net = owed - owing;
      });

      setAllBalances({ byCurrency, loaded: true });
    })();
    return () => { cancelled = true; };
  }, [user, groups, groupExpenses, settlements]);

  const loadGroups = async () => {
    if (!user) return;
    // Landing-demo mode: surface a single generic group so the screenshot's
    // "1 group / 2 companions" framing holds without touching real data.
    if (isLandingDemo()) {
      setTablesReady(true);
      setGroups([{
        id: "demo-group",
        name: getDemoTrip().tripName,
        currency: "USD",
        created_at: new Date().toISOString(),
        created_by: user.id,
        _isOwner: true,
      }]);
      return;
    }
    // First try the join query
    const { data, error } = await supabase.from("split_group_members").select("group_id, split_groups(id, name, currency, created_at, created_by)").ilike("email", userEmail);
    if (error && (error.code === "42P01" || error.message?.includes("schema cache"))) { setTablesReady(false); return; }
    setTablesReady(true);
    if (data && data.some(d => d.split_groups)) {
      const g = data.map(d => d.split_groups).filter(Boolean).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      g.forEach(grp => { grp._isOwner = grp.created_by === user?.id; });
      setGroups(g);
    } else {
      // Fallback: query memberships then fetch groups separately
      const { data: memberships, error: mErr } = await supabase.from("split_group_members").select("group_id").ilike("email", userEmail);
      if (mErr) { if (mErr.code === "42P01") setTablesReady(false); return; }
      setTablesReady(true);
      if (!memberships || memberships.length === 0) { setGroups([]); return; }
      const groupIds = [...new Set(memberships.map(m => m.group_id))];
      const { data: grps } = await supabase.from("split_groups").select("*").in("id", groupIds);
      if (grps) {
        grps.forEach(grp => { grp._isOwner = grp.created_by === user?.id; });
        grps.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
        setGroups(grps);
      }
    }
  };

  const loadGroupData = async (groupId) => {
    const [m, e, s] = await Promise.all([
      supabase.from("split_group_members").select("*").eq("group_id", groupId),
      supabase.from("split_expenses").select("*, split_expense_shares(*)").eq("group_id", groupId).order("date", { ascending: false }),
      supabase.from("split_settlements").select("*").eq("group_id", groupId).order("date", { ascending: false }),
    ]);
    const members = m.data || [];
    // Auto-populate user_id for the current user if missing
    const myMember = members.find(mb => mb.email === userEmail && !mb.user_id);
    if (myMember && user?.id) {
      await supabase.from("split_group_members").update({ user_id: user.id }).eq("id", myMember.id);
      myMember.user_id = user.id;
    }
    // Backfill: any unlinked member whose email belongs to a Continuum
    // account gets retroactively linked, so the badge appears next render.
    const unlinked = members.filter(mb => !mb.user_id && mb.email !== userEmail);
    if (unlinked.length > 0) {
      Promise.all(unlinked.map(async mb => {
        const linkedId = await lookupContinuumUser(mb.email);
        if (!linkedId) return null;
        await supabase.from("split_group_members").update({ user_id: linkedId }).eq("id", mb.id);
        return { id: mb.id, user_id: linkedId };
      })).then(results => {
        const linked = results.filter(Boolean);
        if (linked.length === 0) return;
        setGroupMembers(prev => prev.map(mb => {
          const upd = linked.find(l => l.id === mb.id);
          return upd ? { ...mb, user_id: upd.user_id } : mb;
        }));
      });
    }
    setGroupMembers(members); setGroupExpenses(e.data || []); setSettlements(s.data || []);
    // Probe for the receipt column so the forms can say up front that receipts
    // can't be stored yet, rather than letting an upload fail silently.
    const probe = await supabase.from("split_expenses").select("id,receipt_image").limit(1);
    if (missingReceiptColumn(probe.error)) setReceiptNotice(true);
  };

  const selectGroup = async (group) => {
    setSelectedGroup(group);
    await loadGroupData(group.id);
    // Initialize splitWith to all members
    const { data: members } = await supabase.from("split_group_members").select("email").eq("group_id", group.id);
    if (members) setSplitWith(new Set(members.map(m => m.email)));
    // Default the add-expense form's currency to the group currency
    setExpenseForm(p => ({ ...p, currency: group.currency || "USD", fxRate: 1, splitType: "equal", splitInputs: {} }));
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    setLoading(true);
    // If there's a half-typed entry still in the input box, treat it as if the
    // user pressed Enter on it — push to pendingMembers and the address book.
    let allPending = pendingMembers;
    const typed = newMemberEmail.trim();
    if (typed) {
      const created = await addContact(typed.includes("@") ? typed : "", typed.includes("@") ? "" : typed);
      if (created) {
        const norm = (created.email || "").toLowerCase();
        if (!allPending.some(pm => pm.email.toLowerCase() === norm)) {
          allPending = [...allPending, { email: norm, name: created.display_name || "" }];
        }
      }
      setNewMemberEmail("");
    }
    const { data: group, error } = await supabase.from("split_groups").insert({ name: newGroupName, created_by: user.id }).select().single();
    if (error || !group) { setLoading(false); return; }
    await supabase.from("split_group_members").insert({ group_id: group.id, user_id: user.id, email: userEmail, display_name: userName });
    // Mirror every member into the address book (no-op if already there).
    await Promise.all(allPending.map(pm => addContact(pm.email, pm.name)));
    for (const pm of allPending) {
      const normalizedEmail = pm.email.toLowerCase().trim();
      const md = { group_id: group.id, email: normalizedEmail, display_name: pm.name || handleLabel(normalizedEmail) };
      // Authoritative check: does this email map to a Continuum auth.users row?
      // Skipped for a local handle, which can never belong to an account.
      if (!isLocalHandle(normalizedEmail)) {
        const linkedId = await lookupContinuumUser(normalizedEmail);
        if (linkedId) md.user_id = linkedId;
      }
      await supabase.from("split_group_members").insert(md);
    }
    setNewGroupName(""); setPendingMembers([]); setShowNewGroup(false); setLoading(false);
    await loadGroups(); await selectGroup(group);
  };

  // Compute per-person share amounts (in expense currency) given the split
  // type and the user's inputs. Returns { ok, shares: { email: amount }, error }.
  const computeShares = (totalAmount, splitType, splitInputs, includedEmails) => {
    const total = parseFloat(totalAmount) || 0;
    if (total <= 0) return { ok: false, error: "Amount required." };
    if (includedEmails.length === 0) return { ok: false, error: "Select at least one person." };
    const shares = {};

    if (splitType === "equal") {
      const each = total / includedEmails.length;
      includedEmails.forEach(e => { shares[e] = each; });
      return { ok: true, shares };
    }
    if (splitType === "exact") {
      let sum = 0;
      includedEmails.forEach(e => { const v = parseFloat(splitInputs[e]) || 0; shares[e] = v; sum += v; });
      const diff = Math.abs(sum - total);
      if (diff > 0.01) return { ok: false, error: `Exact amounts add to ${sum.toFixed(2)}, expected ${total.toFixed(2)}.` };
      return { ok: true, shares };
    }
    if (splitType === "percentage") {
      let pct = 0;
      includedEmails.forEach(e => { pct += parseFloat(splitInputs[e]) || 0; });
      if (Math.abs(pct - 100) > 0.05) return { ok: false, error: `Percentages add to ${pct.toFixed(1)}%, expected 100%.` };
      includedEmails.forEach(e => { shares[e] = total * ((parseFloat(splitInputs[e]) || 0) / 100); });
      return { ok: true, shares };
    }
    if (splitType === "shares") {
      let totalShares = 0;
      includedEmails.forEach(e => { totalShares += parseFloat(splitInputs[e]) || 0; });
      if (totalShares <= 0) return { ok: false, error: "Enter at least one share." };
      includedEmails.forEach(e => { shares[e] = total * ((parseFloat(splitInputs[e]) || 0) / totalShares); });
      return { ok: true, shares };
    }
    return { ok: false, error: "Unknown split type." };
  };

  const addExpense = async () => {
    if (!expenseForm.description.trim() || !expenseForm.amount || !selectedGroup) return;
    const splitMembers = groupMembers.filter(m => splitWith.has(m.email));
    if (splitMembers.length === 0) return;
    const includedEmails = splitMembers.map(m => m.email);
    const shareResult = computeShares(expenseForm.amount, expenseForm.splitType, expenseForm.splitInputs, includedEmails);
    if (!shareResult.ok) { alert(shareResult.error); return; }
    setLoading(true);
    const amount = parseFloat(expenseForm.amount);
    const fxRate = expenseForm.currency === selectedGroup.currency
      ? 1
      : (parseFloat(expenseForm.fxRate) > 0 ? parseFloat(expenseForm.fxRate) : 1);
    const row = {
      group_id: selectedGroup.id, paid_by_email: expenseForm.paidBy, description: expenseForm.description,
      amount, currency: expenseForm.currency || selectedGroup.currency, fx_rate: fxRate,
      category: expenseForm.category, date: expenseForm.date, split_type: expenseForm.splitType, created_by: user.id,
      receipt_images: expenseForm.receiptImages || [],
      receipt_image: (expenseForm.receiptImages || [])[0] || null,
    };
    let { data: expense, error: expError } = await supabase.from("split_expenses").insert(row).select().single();
    // Installs that predate supabase-splits-receipt-migration.sql have no
    // receipt columns; save the expense anyway rather than losing it.
    if (expError && missingReceiptColumn(expError)) {
      const { receipt_image, receipt_images, ...withoutReceipt } = row;
      ({ data: expense, error: expError } = await supabase.from("split_expenses").insert(withoutReceipt).select().single());
      if (!expError && (receipt_images || []).length) setReceiptNotice(true);
    }
    if (expError) console.error("Split expense insert error:", expError);
    if (expense) {
      await supabase.from("split_expense_shares").insert(includedEmails.map(email => ({
        expense_id: expense.id, email, amount: shareResult.shares[email], settled: email === expenseForm.paidBy,
      })));
    }
    setExpenseForm({
      description: "", amount: "", currency: selectedGroup.currency || "USD", fxRate: 1,
      category: "food", paidBy: userEmail,
      splitType: "equal", splitInputs: {},
      date: new Date().toISOString().slice(0, 10), receiptImages: [],
    });
    setSplitWith(new Set(groupMembers.map(m => m.email)));
    setLoading(false);
    await loadGroupData(selectedGroup.id);
  };

  /*
   * Receipts are kept on the expense row as a data URL, so a straight phone
   * photo (3–5 MB once base64'd) would bloat every read of the group. Downscale
   * to a long edge of 1600px as JPEG first — still legible for a receipt, an
   * order of magnitude smaller. Anything that fails to decode as an image falls
   * back to the raw data URL rather than being dropped.
   */
  const fileToReceipt = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result;
      const img = new Image();
      img.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        try {
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        } catch { resolve(raw); }
      };
      img.onerror = () => resolve(raw);
      img.src = raw;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

  // Several files can be picked at once; each is downscaled and appended.
  const filesToReceipts = async (fileList) => {
    const out = [];
    for (const file of Array.from(fileList || [])) {
      const data = await fileToReceipt(file);
      if (data) out.push(data);
    }
    return out;
  };

  const handleReceiptCapture = async (e) => {
    const files = e.target.files;
    const added = await filesToReceipts(files);
    e.target.value = "";                       // let the same file be picked again
    if (added.length) setExpenseForm(p => ({ ...p, receiptImages: [...(p.receiptImages || []), ...added] }));
  };

  /*
   * On an expense that already exists, a receipt is written the moment it's
   * picked rather than waiting for Save. Choosing a file for a specific expense
   * carries no ambiguity about intent, and the previous behaviour — holding it
   * in form state until Save — read as "it didn't take", since nothing on the
   * row changed in the meantime.
   */
  // `receipt_image` is written alongside the list so a client that only knows
  // about the single column still shows the first one.
  const persistReceipts = async (expenseId, list) => {
    if (!expenseId) return false;
    const images = (list || []).filter(Boolean);
    setReceiptStatus({ id: expenseId, state: "saving" });
    const { error } = await supabase.from("split_expenses")
      .update({ receipt_images: images, receipt_image: images[0] || null }).eq("id", expenseId);
    if (error) {
      setReceiptStatus({ id: expenseId, state: "error" });
      if (missingReceiptColumn(error)) setReceiptNotice(true);
      else console.error("Receipt save error:", error);
      return false;
    }
    // Reflect it on the row behind the form so the thumbnails are there as soon
    // as the editor closes.
    setGroupExpenses(prev => prev.map(e => e.id === expenseId
      ? { ...e, receipt_images: images, receipt_image: images[0] || null }
      : e));
    setReceiptStatus({ id: expenseId, state: images.length ? "saved" : "removed" });
    return true;
  };

  // Same, for the form that edits an expense already saved.
  const handleEditReceiptCapture = async (e) => {
    const files = e.target.files;
    const added = await filesToReceipts(files);
    e.target.value = "";
    if (!added.length) return;
    const next = [...(editExpenseForm.receiptImages || []), ...added];
    setEditExpenseForm(p => ({ ...p, receiptImages: next }));
    await persistReceipts(editingExpenseId, next);
  };

  const removeEditReceipt = async (index) => {
    const next = (editExpenseForm.receiptImages || []).filter((_, i) => i !== index);
    setEditExpenseForm(p => ({ ...p, receiptImages: next }));
    await persistReceipts(editingExpenseId, next);
  };

  const settleUp = async () => {
    if (!settleForm.to || !settleForm.amount || !selectedGroup) return;
    setLoading(true);
    await supabase.from("split_settlements").insert({ group_id: selectedGroup.id, from_email: userEmail, to_email: settleForm.to, amount: parseFloat(settleForm.amount) });
    setSettleForm({ to: "", amount: "" }); setShowSettle(false); setLoading(false);
    await loadGroupData(selectedGroup.id);
  };

  const deleteExpense = async (id) => { await supabase.from("split_expenses").delete().eq("id", id); await loadGroupData(selectedGroup.id); };

  const updateExpense = async (expenseId) => {
    if (!editExpenseForm.description.trim() || !editExpenseForm.amount || editSplitWith.size === 0) return;
    const includedEmails = [...editSplitWith];
    const splitType = editExpenseForm.splitType || "equal";
    const result = computeShares(editExpenseForm.amount, splitType, editExpenseForm.splitInputs || {}, includedEmails);
    if (!result.ok) { alert(result.error); return; }
    setLoading(true);
    const amount = parseFloat(editExpenseForm.amount);
    const fxRate = editExpenseForm.currency === selectedGroup.currency
      ? 1
      : (parseFloat(editExpenseForm.fxRate) > 0 ? parseFloat(editExpenseForm.fxRate) : 1);
    const patch = {
      description: editExpenseForm.description, amount,
      currency: editExpenseForm.currency || selectedGroup.currency, fx_rate: fxRate,
      category: editExpenseForm.category, date: editExpenseForm.date,
      split_type: splitType,
      receipt_images: editExpenseForm.receiptImages || [],
      receipt_image: (editExpenseForm.receiptImages || [])[0] || null,
    };
    let { error: updErr } = await supabase.from("split_expenses").update(patch).eq("id", expenseId);
    if (updErr && missingReceiptColumn(updErr)) {
      const { receipt_image, receipt_images, ...withoutReceipt } = patch;
      ({ error: updErr } = await supabase.from("split_expenses").update(withoutReceipt).eq("id", expenseId));
      if (!updErr && (receipt_images || []).length) setReceiptNotice(true);
    }
    if (updErr) console.error("Split expense update error:", updErr);
    await supabase.from("split_expense_shares").delete().eq("expense_id", expenseId);
    const exp = groupExpenses.find(e => e.id === expenseId);
    const newShares = includedEmails.map(email => ({
      expense_id: expenseId, email, amount: result.shares[email], settled: email === exp?.paid_by_email,
    }));
    await supabase.from("split_expense_shares").insert(newShares);
    setEditingExpenseId(null);
    setLoading(false);
    await loadGroupData(selectedGroup.id);
  };

  const deleteGroup = async (id) => {
    setLoading(true);
    await supabase.from("split_settlements").delete().eq("group_id", id);
    await supabase.from("split_expenses").delete().eq("group_id", id);
    await supabase.from("split_group_members").delete().eq("group_id", id);
    await supabase.from("split_groups").delete().eq("id", id);
    setSelectedGroup(null); setShowDeleteConfirm(null); setLoading(false); await loadGroups();
  };

  const renameMember = async (memberId, newName) => {
    await supabase.from("split_group_members").update({ display_name: newName }).eq("id", memberId);
    setGroupMembers(prev => prev.map(m => m.id === memberId ? { ...m, display_name: newName } : m));
  };

  const saveGroupName = async () => {
    const newName = (groupNameDraft || "").trim();
    if (!selectedGroup || !newName || newName === selectedGroup.name) {
      setEditingGroupName(false);
      return;
    }
    const { error } = await supabase.from("split_groups").update({ name: newName }).eq("id", selectedGroup.id);
    if (error) { console.error("Group rename error:", error); setEditingGroupName(false); return; }
    setSelectedGroup(prev => prev ? { ...prev, name: newName } : prev);
    setGroups(prev => prev.map(g => g.id === selectedGroup.id ? { ...g, name: newName } : g));
    setEditingGroupName(false);
  };

  const removeMember = async (memberId, email) => {
    if (email === userEmail) return; // can't remove yourself
    if (groupMembers.length <= 2) return; // need at least 2
    await supabase.from("split_group_members").delete().eq("id", memberId);
    setGroupMembers(prev => prev.filter(m => m.id !== memberId));
    setSplitWith(prev => { const next = new Set(prev); next.delete(email); return next; });
  };

  // The inline box when creating a group accepts either an address or a plain
  // name; whichever it is, the person lands in the address book and the pending
  // list under one identity.
  const addPendingMember = async (raw) => {
    const value = (raw || "").trim();
    if (!value) return;
    const asEmail = value.includes("@");
    const created = await addContact(asEmail ? value : "", asEmail ? "" : value);
    if (!created) return;
    const norm = (created.email || "").toLowerCase();
    setPendingMembers(p => p.find(pm => pm.email.toLowerCase() === norm) ? p : [...p, { email: norm, name: created.display_name || "" }]);
    setNewMemberEmail("");
  };

  const addMemberToGroup = async () => {
    if (!selectedGroup) return;
    const typedEmail = addMemberForm.email.trim();
    const name = addMemberForm.name.trim();
    // Either identifies the person; an address that isn't one is still rejected.
    if (!typedEmail && !name) return;
    if (typedEmail && !typedEmail.includes("@")) return;
    const normalizedEmail = typedEmail.toLowerCase();
    // Check not already a member — by address when there is one, by name otherwise.
    const dupe = normalizedEmail
      ? groupMembers.some(m => m.email.toLowerCase() === normalizedEmail)
      : groupMembers.some(m => isLocalHandle(m.email) && (m.display_name || "").toLowerCase() === name.toLowerCase());
    if (dupe) { setAddMemberForm({ show: false, email: "", name: "" }); return; }
    setLoading(true);
    // Reuse the handle this person already has in the address book, so the same
    // name-only person stays one identity across groups.
    const knownLocal = !normalizedEmail
      ? contacts.find(c => isLocalHandle(c.email) && (c.display_name || "").toLowerCase() === name.toLowerCase())
      : null;
    const identity = normalizedEmail || knownLocal?.email || makeLocalHandle(name);
    // Mirror to the global address book so this person becomes pickable in future trips.
    if (selectedGroup._isOwner) {
      addContact(identity, name);
    }
    const md = { group_id: selectedGroup.id, email: identity, display_name: name || handleLabel(identity) };
    // Authoritative check via service-role lookup — pointless for a local handle,
    // which can never belong to an account.
    if (normalizedEmail && !isLocalHandle(normalizedEmail)) {
      const linkedId = await lookupContinuumUser(normalizedEmail);
      if (linkedId) md.user_id = linkedId;
    }
    await supabase.from("split_group_members").insert(md);
    setAddMemberForm({ show: false, email: "", name: "" });
    setLoading(false);
    await loadGroupData(selectedGroup.id);
  };

  const calcBalances = () => {
    const bal = {}; groupMembers.forEach(m => { bal[m.email] = 0; });
    groupExpenses.forEach(exp => {
      const fx = parseFloat(exp.fx_rate) > 0 ? parseFloat(exp.fx_rate) : 1;
      bal[exp.paid_by_email] = (bal[exp.paid_by_email] || 0) + (exp.amount * fx);
      (exp.split_expense_shares || []).forEach(sh => {
        bal[sh.email] = (bal[sh.email] || 0) - (sh.amount * fx);
      });
    });
    settlements.forEach(s => {
      // Settlements are recorded in group currency.
      bal[s.from_email] = (bal[s.from_email] || 0) + s.amount;
      bal[s.to_email] = (bal[s.to_email] || 0) - s.amount;
    });
    return bal;
  };

  /*
   * Group statement — the numbers behind "who owes what", worked out the long
   * way so each figure can be checked by hand.
   *
   * Deliberately recomputed from the raw rows rather than reusing
   * calcBalances(), with the same conventions (fx applied to expenses, which
   * are entered in any currency; settlements already in group currency), so the
   * reconciliation is an independent arithmetic check and not a restatement of
   * the same sum. Per person:
   *
   *     paid − share + settlements made − settlements received = net
   *
   * A positive net means the group owes them.
   */
  const buildStatement = () => {
    const rows = {};
    const seed = (email) => (rows[email] ||= { email, paid: 0, share: 0, settledOut: 0, settledIn: 0 });
    groupMembers.forEach(m => seed(m.email));

    let totalPaid = 0, totalShares = 0;
    const lineIssues = [];

    const lines = [...groupExpenses]
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
      .map(exp => {
        const fx = parseFloat(exp.fx_rate) > 0 ? parseFloat(exp.fx_rate) : 1;
        const paid = (parseFloat(exp.amount) || 0) * fx;
        seed(exp.paid_by_email).paid += paid;
        totalPaid += paid;

        const shares = (exp.split_expense_shares || []).map(sh => {
          const amt = (parseFloat(sh.amount) || 0) * fx;
          seed(sh.email).share += amt;
          totalShares += amt;
          return { email: sh.email, amount: amt };
        });

        // Shares should add back to the expense. A cent or two is rounding on an
        // uneven split; more than that means the expense was edited in a way
        // that left its shares behind, and the statement must say so.
        const shareSum = shares.reduce((s, x) => s + x.amount, 0);
        const drift = paid - shareSum;
        if (Math.abs(drift) > 0.011) lineIssues.push({ id: exp.id, description: exp.description, drift });

        return {
          id: exp.id, date: exp.date, description: exp.description,
          currency: exp.currency, rawAmount: parseFloat(exp.amount) || 0, fx,
          amount: paid, paidBy: exp.paid_by_email, splitType: exp.split_type || "equal",
          shares, drift,
          receipts: receiptsOf(exp),
        };
      });

    settlements.forEach(s => {
      const amt = parseFloat(s.amount) || 0;
      seed(s.from_email).settledOut += amt;
      seed(s.to_email).settledIn += amt;
    });

    const people = Object.values(rows).map(r => ({
      ...r,
      net: r.paid - r.share + r.settledOut - r.settledIn,
    })).sort((a, b) => b.net - a.net);

    const netSum = people.reduce((s, p) => s + p.net, 0);
    const settledTotal = settlements.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);

    return {
      lines, people, lineIssues,
      totals: { paid: totalPaid, shares: totalShares, settled: settledTotal, netSum },
      checks: {
        // Everything paid out was allocated to someone.
        paidEqualsShares: Math.abs(totalPaid - totalShares) <= 0.011 + 0.01 * lines.length,
        // Every debt is someone else's credit, so the nets cancel.
        netsCancel: Math.abs(netSum) <= 0.011 + 0.01 * people.length,
        // No expense lost its shares.
        linesTie: lineIssues.length === 0,
      },
      period: {
        from: lines[0]?.date || "",
        to: lines[lines.length - 1]?.date || "",
      },
    };
  };

  /*
   * The statement as a self-contained HTML page: opened in a new window for
   * printing or saving to PDF, and the same markup that can be pasted into a
   * message to the group. Built as a document rather than a screenshot so the
   * figures stay selectable and checkable.
   */
  const statementHtml = (st, debts, groupCcy, sym) => {
    const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const m = (n) => `${sym}${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const signed = (n) => `${n < -0.005 ? "−" : ""}${m(n)}`;
    const name = (email) => memberName(email) === "You" ? (memberName(email) + ` (${shownEmail(email) || "no email"})`) : memberName(email);

    const peopleRows = st.people.map(p => `
      <tr>
        <td>${esc(memberName(p.email))}</td>
        <td class="n">${m(p.paid)}</td>
        <td class="n">${m(p.share)}</td>
        <td class="n">${p.settledOut ? m(p.settledOut) : "—"}</td>
        <td class="n">${p.settledIn ? m(p.settledIn) : "—"}</td>
        <td class="n ${p.net > 0.005 ? "pos" : p.net < -0.005 ? "neg" : ""}">${
          p.net > 0.005 ? `is owed ${m(p.net)}` : p.net < -0.005 ? `owes ${m(p.net)}` : "settled"}</td>
      </tr>`).join("");

    const debtRows = debts.length
      ? debts.map(d => `<li><strong>${esc(memberName(d.from))}</strong> pays <strong>${esc(memberName(d.to))}</strong> ${m(d.amount)}</li>`).join("")
      : "<li>Everyone is square — no payments needed.</li>";

    // Receipts are numbered so a ledger row points at its images in the
    // appendix — "R3" beside the line, "R3" over the picture.
    let receiptNo = 0;
    const receiptBlocks = [];
    const lineRows = st.lines.map(l => {
      let tag = "—";
      if (l.receipts.length) {
        receiptNo += 1;
        const no = receiptNo;
        tag = `<a href="#r${no}">R${no}${l.receipts.length > 1 ? ` (${l.receipts.length})` : ""}</a>`;
        receiptBlocks.push(`
          <div class="receipt" id="r${no}">
            <div class="rcap"><strong>R${no}</strong> · ${esc(l.date || "")} · ${esc(l.description || "")} · ${
              esc(memberName(l.paidBy))} paid ${m(l.amount)}${l.receipts.length > 1 ? ` · ${l.receipts.length} images` : ""}</div>
            ${l.receipts.map(src => `<img src="${src}" alt="Receipt for ${esc(l.description || "expense")}" />`).join("")}
          </div>`);
      }
      // One column per person; a blank cell means they were not in this split.
      const byEmail = Object.fromEntries(l.shares.map(s => [s.email, s.amount]));
      const cells = st.people.map(p => {
        const v = byEmail[p.email];
        const isPayer = p.email === l.paidBy;
        return `<td class="n share${v == null ? " out" : ""}${isPayer ? " payer" : ""}">${v == null ? "·" : v.toFixed(2)}</td>`;
      }).join("");

      return `
      <tr>
        <td class="d">${esc(l.date || "")}</td>
        <td>${esc(l.description || "")}</td>
        <td>${esc(memberName(l.paidBy))}</td>
        <td class="n">${l.currency && l.currency !== groupCcy ? `<span class="fx">${esc(l.currency)} ${l.rawAmount.toFixed(2)}</span> ` : ""}${l.amount.toFixed(2)}</td>
        ${cells}
        <td>${tag}</td>
      </tr>`;
    }).join("");

    // Column totals — each person's total share, which is the figure the
    // summary at the top reports. Reading down a column proves that row.
    const shareTotals = st.people.map(p => `<td class="n share tot">${p.share.toFixed(2)}</td>`).join("");
    const paidTotals = st.people.map(p => `<td class="n share">${p.paid ? p.paid.toFixed(2) : "·"}</td>`).join("");
    const netTotals = st.people.map(p => `<td class="n share ${p.net > 0.005 ? "pos" : p.net < -0.005 ? "neg" : ""}">${
      Math.abs(p.net) < 0.005 ? "—" : (p.net > 0 ? "+" : "−") + Math.abs(p.net).toFixed(2)}</td>`).join("");
    const peopleHead = st.people.map(p => `<th class="n share">${esc(memberName(p.email))}</th>`).join("");

    const receiptCount = st.lines.reduce((s, l) => s + l.receipts.length, 0);
    const receiptSection = receiptCount
      ? `<h2>Receipts — ${receiptCount} image${receiptCount === 1 ? "" : "s"}</h2>
         <p class="sub">Each is labelled with the ledger line it belongs to.</p>
         ${receiptBlocks.join("")}`
      : `<h2>Receipts</h2><p class="sub">No receipts attached to these expenses.</p>`;

    const check = (ok, text) => `<li class="${ok ? "ok" : "bad"}">${ok ? "✓" : "✗"} ${text}</li>`;
    const issues = st.lineIssues.length
      ? `<p class="bad">Lines whose shares no longer add up to the amount:</p><ul>${
          st.lineIssues.map(i => `<li class="bad">${esc(i.description || "(untitled)")} — out by ${m(i.drift)}</li>`).join("")}</ul>`
      : "";

    return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(selectedGroup.name)} — statement</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #15130F; margin: 32px; line-height: 1.5; }
  h1 { font-size: 24px; margin: 0 0 4px; font-weight: 600; letter-spacing: -0.02em; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #857A66; margin: 32px 0 10px; font-weight: 600; }
  .sub { color: #6B6458; font-size: 13px; margin: 0 0 4px; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #E2DCCE; vertical-align: top; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #857A66; }
  td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .pos { color: #4F6D4F; } .neg { color: #C03E34; }
  ul { margin: 0; padding-left: 18px; font-size: 13px; }
  li { margin-bottom: 4px; }
  li.ok { color: #4F6D4F; list-style: none; margin-left: -18px; }
  li.bad { color: #C03E34; list-style: none; margin-left: -18px; }
  p.bad { color: #C03E34; font-size: 13px; margin: 10px 0 4px; }
  .foot { margin-top: 28px; padding-top: 12px; border-top: 1px solid #E2DCCE; font-size: 11px; color: #857A66; }
  a { color: #3A6491; }
  /* Share matrix — one column per person. Tight and numeric so nine people
     still fit across the page; the row/column totals are what make it
     checkable by eye. */
  .matrix { font-size: 11px; }
  .matrix th, .matrix td { padding: 5px 6px; }
  .matrix td.d { white-space: nowrap; color: #857A66; }
  .matrix th.share, .matrix td.share { width: 1%; }
  .matrix td.share { font-variant-numeric: tabular-nums; }
  .matrix td.out { color: #C9C2B4; }
  .matrix td.payer { box-shadow: inset 0 0 0 1px #E2DCCE; border-radius: 3px; }
  .matrix .fx { color: #857A66; font-size: 9.5px; }
  .matrix tfoot td { border-top: 1px solid #15130F; border-bottom: none; font-size: 11px; padding-top: 7px; }
  .matrix tfoot tr.sum td { font-weight: 600; }
  .matrix tfoot td.tot { font-weight: 600; }
  .receipt { margin: 18px 0 24px; }
  .rcap { font-size: 11px; color: #857A66; margin-bottom: 6px; padding-bottom: 5px; border-bottom: 1px solid #E2DCCE; }
  .rcap strong { color: #15130F; }
  .receipt img { max-width: 100%; max-height: 760px; border: 1px solid #E2DCCE; border-radius: 4px; display: block; margin-bottom: 8px; }
  /* The matrix is wide once a group has more than a handful of people, so the
     statement prints landscape rather than shrinking the figures to fit. */
  @page { size: ${st.people.length > 5 ? "landscape" : "portrait"}; margin: 12mm; }
  @media print {
    body { margin: 0; }
    h2 { break-after: avoid; }
    tr { break-inside: avoid; }
    thead { display: table-header-group; }
    .matrix { font-size: 9.5px; }
    .matrix th, .matrix td { padding: 4px 5px; }
    /* Keep a receipt with its caption, and never slice an image across pages. */
    .receipt { break-inside: avoid; page-break-inside: avoid; }
    .receipt img { max-height: 620px; }
    a { color: inherit; text-decoration: none; }
  }
</style></head><body>
  <h1>${esc(selectedGroup.name)}</h1>
  <p class="sub">Statement as of ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}${
    st.period.from ? ` · expenses from ${esc(st.period.from)} to ${esc(st.period.to)}` : ""}</p>
  <p class="sub">${st.lines.length} expense${st.lines.length === 1 ? "" : "s"} · ${st.people.length} people · ${m(st.totals.paid)} total in ${esc(groupCcy)}${
    st.totals.settled ? ` · ${m(st.totals.settled)} already settled` : ""}</p>

  <h2>Where everyone stands</h2>
  <table>
    <thead><tr><th>Person</th><th class="n">Paid out</th><th class="n">Their share</th><th class="n">Paid back</th><th class="n">Received</th><th class="n">Position</th></tr></thead>
    <tbody>${peopleRows}</tbody>
  </table>

  <h2>Settling up${debts.length ? ` — ${debts.length} payment${debts.length === 1 ? "" : "s"}` : ""}</h2>
  <ul>${debtRows}</ul>

  <h2>Reconciliation</h2>
  <ul>
    ${check(st.checks.paidEqualsShares, `Everything paid out is allocated: ${m(st.totals.paid)} paid, ${m(st.totals.shares)} in shares.`)}
    ${check(st.checks.netsCancel, `Positions cancel out: they sum to ${st.totals.netSum.toFixed(2)}, as they must — every debt is someone's credit.`)}
    ${check(st.checks.linesTie, `Every expense's shares add back to its amount${st.lineIssues.length ? "" : " (to the cent)"}.`)}
  </ul>
  ${issues}
  <p class="sub" style="margin-top:10px">Each row above is <em>paid out − their share + paid back − received = position</em>. Amounts entered in another currency are converted at the rate stored with that expense and shown in the ledger below.</p>

  <h2>Ledger — every expense, and each person's share</h2>
  <p class="sub">Amounts in ${esc(groupCcy)}. A dot means that person wasn't in the split. The payer's own share is boxed. Read down a column to see how someone's total share is made up.</p>
  <table class="matrix">
    <thead>
      <tr>
        <th>Date</th><th>Expense</th><th>Paid by</th><th class="n">Amount</th>
        ${peopleHead}
        <th>Receipt</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
    <tfoot>
      <tr class="sum">
        <td colspan="3">Total share</td><td class="n">${st.totals.shares.toFixed(2)}</td>${shareTotals}<td></td>
      </tr>
      <tr>
        <td colspan="3">Paid out</td><td class="n">${st.totals.paid.toFixed(2)}</td>${paidTotals}<td></td>
      </tr>
      <tr>
        <td colspan="3">Position${st.totals.settled ? " (after settlements)" : ""}</td><td class="n">${st.totals.netSum.toFixed(2)}</td>${netTotals}<td></td>
      </tr>
    </tfoot>
  </table>

  ${receiptSection}

  <div class="foot">Generated by Continuum · figures in ${esc(groupCcy)}</div>
</body></html>`;
  };

  const openStatementPrint = (html) => {
    const w = window.open("", "_blank");
    if (!w) return false;                       // popup blocked — caller falls back to copy
    w.document.write(html);
    w.document.close();
    return true;
  };

  const simplifyDebts = () => {
    const bal = calcBalances();
    const debtors = Object.entries(bal).filter(([, v]) => v < -0.01).map(([e, v]) => ({ email: e, amount: -v })).sort((a, b) => b.amount - a.amount);
    const creditors = Object.entries(bal).filter(([, v]) => v > 0.01).map(([e, v]) => ({ email: e, amount: v })).sort((a, b) => b.amount - a.amount);
    const txns = []; let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const amt = Math.min(debtors[di].amount, creditors[ci].amount);
      txns.push({ from: debtors[di].email, to: creditors[ci].email, amount: Math.round(amt * 100) / 100 });
      debtors[di].amount -= amt; creditors[ci].amount -= amt;
      if (debtors[di].amount < 0.01) di++; if (creditors[ci].amount < 0.01) ci++;
    }
    return txns;
  };

  const memberName = (email) => {
    if (email === userEmail) return "You";
    const m = groupMembers.find(m => m.email === email);
    return m?.display_name || handleLabel(email);
  };

  const fmtAmt = (n) => Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Tables not ready
  if (tablesReady === false) {
    return (
      <div style={{ fontFamily: dv.sans, padding: "60px 20px", textAlign: "center", color: dv.taupe }}>
        <div style={{ fontFamily: dv.serif, fontSize: 28, color: dv.ink, marginBottom: 12 }}>Setup Required</div>
        <p style={{ marginBottom: 20, lineHeight: 1.6 }}>Database tables need to be created. Contact the administrator.</p>
        <button onClick={() => { setTablesReady(null); loadGroups(); }} style={{ padding: "12px 24px", background: dv.accent, color: "#F4F1EC", border: "none", fontFamily: dv.serif, fontSize: 16, cursor: "pointer" }}>Retry</button>
      </div>
    );
  }

  // ── GROUP DETAIL ──
  if (selectedGroup) {
    const balances = calcBalances();
    const myBalance = balances[userEmail] || 0;
    const debts = simplifyDebts();
    const totalSpent = groupExpenses.reduce((s, e) => s + e.amount, 0);
    const payer = groupMembers.find(m => m.email === (groupExpenses[0]?.paid_by_email || userEmail));

    return (
      <div style={{ fontFamily: dv.sans, color: dv.ink }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 32, borderBottom: `1px solid ${dv.cream}`, marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => { setSelectedGroup(null); loadGroups(); }} style={{ background: "none", border: "none", cursor: "pointer", color: dv.taupe, padding: 0, fontSize: 20 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div>
              {editingGroupName && selectedGroup._isOwner ? (
                <input
                  autoFocus
                  value={groupNameDraft}
                  onChange={e => setGroupNameDraft(e.target.value)}
                  onBlur={saveGroupName}
                  onKeyDown={e => {
                    if (e.key === "Enter") { e.preventDefault(); saveGroupName(); }
                    if (e.key === "Escape") { e.preventDefault(); setEditingGroupName(false); }
                  }}
                  style={{
                    fontFamily: dv.serif, fontSize: 28, fontWeight: 400, letterSpacing: "-0.02em",
                    color: dv.ink, background: "transparent",
                    border: "none", borderBottom: `1px solid ${dv.accent}`,
                    padding: "2px 0", outline: "none", minWidth: 240,
                  }}
                />
              ) : (
                <div
                  onClick={() => {
                    if (!selectedGroup._isOwner) return;
                    setGroupNameDraft(selectedGroup.name || "");
                    setEditingGroupName(true);
                  }}
                  title={selectedGroup._isOwner ? "Click to rename" : ""}
                  style={{
                    fontFamily: dv.serif, fontSize: 28, fontWeight: 400, letterSpacing: "-0.02em",
                    cursor: selectedGroup._isOwner ? "text" : "default",
                    display: "inline-flex", alignItems: "center", gap: 8,
                  }}>
                  {selectedGroup.name}
                  {selectedGroup._isOwner && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={dv.taupe} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  )}
                  {!selectedGroup._isOwner && <em style={{ fontStyle: "italic", color: dv.taupe, fontSize: 18 }}>shared</em>}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe, letterSpacing: "0.1em" }}>{groupMembers.length} MEMBERS</span>
            <button onClick={() => setShowDeleteConfirm(selectedGroup.id)} style={{ background: "none", border: "none", cursor: "pointer", color: dv.accent, opacity: 0.6, padding: 4 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </button>
          </div>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div style={{ padding: "20px 24px", background: `${dv.accent}10`, border: `1px solid ${dv.accent}30`, marginBottom: 24 }}>
            <div style={{ fontFamily: dv.serif, fontSize: 16, color: dv.ink, marginBottom: 8 }}>Delete this group permanently?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => deleteGroup(selectedGroup.id)} style={{ padding: "10px 20px", background: dv.accent, color: "#F4F1EC", border: "none", fontFamily: dv.serif, cursor: "pointer" }}>{loading ? "Deleting..." : "Delete"}</button>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${dv.cream}`, color: dv.ink, fontFamily: dv.serif, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Two-column workspace */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.15fr", gap: isMobile ? 24 : 48 }}>

          {/* Left Panel — The Receipt */}
          <div style={{ background: dv.paper, padding: isMobile ? 24 : 40, border: `1px solid ${dv.cream}`, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${dv.cream}` }}>
              <div style={{ fontFamily: dv.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.02em" }}>The Receipt <em style={{ fontStyle: "italic", color: dv.taupe, fontSize: 18 }}>details</em></div>
              <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe, letterSpacing: "0.1em" }}>S 01</span>
            </div>

            {/* Expense form */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 }}>What was it for</label>
              <input value={expenseForm.description} onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))} placeholder="Dinner at Osteria..."
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "12px 0", fontFamily: dv.serif, fontSize: 22, fontWeight: 400, color: dv.ink, outline: "none" }} />
            </div>

            {(() => {
              const groupCcy = selectedGroup.currency || "USD";
              const isForeign = expenseForm.currency && expenseForm.currency !== groupCcy;
              const fxNum = parseFloat(expenseForm.fxRate) || 1;
              const amtNum = parseFloat(expenseForm.amount) || 0;
              const convertedAmt = isForeign ? amtNum * fxNum : amtNum;
              return (
            <>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1.4fr 1fr", gap: 16, marginBottom: isForeign ? 12 : 20 }}>
              <div>
                <label style={{ display: "block", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 }}>Currency</label>
                <select value={expenseForm.currency || groupCcy} onChange={e => setExpenseForm(p => ({ ...p, currency: e.target.value, fxRate: e.target.value === groupCcy ? 1 : (p.fxRate || 1) }))}
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "12px 0", fontFamily: dv.serif, fontSize: 18, color: dv.ink, outline: "none" }}>
                  {SPLIT_CURRENCIES.includes(groupCcy) ? null : <option value={groupCcy}>{groupCcy}</option>}
                  {SPLIT_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 }}>Total amount</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", fontFamily: dv.serif, fontSize: 22, color: dv.stone, fontStyle: "italic" }}>{symFor(expenseForm.currency || groupCcy)}</span>
                  <input type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00"
                    style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "12px 0 12px 32px", fontFamily: dv.serif, fontSize: 22, color: dv.ink, outline: "none", fontVariantNumeric: "tabular-nums" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 }}>Paid by</label>
                <select value={expenseForm.paidBy} onChange={e => setExpenseForm(p => ({ ...p, paidBy: e.target.value }))}
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "12px 0", fontFamily: dv.serif, fontSize: 18, color: dv.ink, outline: "none" }}>
                  {groupMembers.map(m => <option key={m.email} value={m.email}>{m.email === userEmail ? `${m.display_name || "You"} (you)` : m.display_name || m.email}</option>)}
                </select>
              </div>
            </div>
            {isForeign && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr", gap: 16, marginBottom: 20, alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 }}>FX rate · 1 {expenseForm.currency} =</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "baseline", gap: 6 }}>
                    <input type="number" step="0.0001" value={expenseForm.fxRate} onChange={e => setExpenseForm(p => ({ ...p, fxRate: e.target.value }))} placeholder="1.0000"
                      style={{ width: 130, background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "8px 0", fontFamily: dv.mono, fontSize: 14, color: dv.ink, outline: "none", fontVariantNumeric: "tabular-nums" }} />
                    <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe, letterSpacing: "0.08em" }}>{groupCcy}</span>
                  </div>
                </div>
                {amtNum > 0 && (
                  <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.taupe, paddingBottom: 6 }}>
                    ≈ {symFor(groupCcy)}{convertedAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {groupCcy} for the group ledger.
                  </div>
                )}
              </div>
            )}
            </>
              );
            })()}

            {/* People chips — toggleable */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <label style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe }}>Splitting between</label>
                <span style={{ fontFamily: dv.mono, fontSize: 10, color: dv.stone }}>{splitWith.size}/{groupMembers.length}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 0", minHeight: 48 }}>
                {groupMembers.map((m, i) => {
                  const isPayer = m.email === expenseForm.paidBy;
                  const isIncluded = splitWith.has(m.email);
                  const isRegistered = !!m.user_id;
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                      onClick={() => {
                        setSplitWith(prev => {
                          const next = new Set(prev);
                          if (next.has(m.email)) { if (next.size > 1) next.delete(m.email); } else { next.add(m.email); }
                          return next;
                        });
                      }}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px 8px 8px",
                        background: isIncluded ? (isPayer ? dv.graphite : CHIP_COLORS[i % 5]) : "transparent",
                        color: isIncluded ? "#F4F1EC" : dv.stone,
                        border: `1.5px solid ${isIncluded ? "transparent" : `${dv.stone}40`}`,
                        borderRadius: 100, fontSize: 13, cursor: "pointer", userSelect: "none",
                        transition: "all 0.2s ease",
                      }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: isIncluded ? "rgba(255,255,255,0.2)" : `${dv.stone}30`,
                        color: isIncluded ? "#F4F1EC" : dv.stone,
                        display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600, fontFamily: dv.sans,
                      }}>
                        {initials(m.display_name || m.email)}
                      </div>
                      <span style={{ fontWeight: isIncluded ? 500 : 400 }}>{m.display_name || handleLabel(m.email)}{isPayer && isIncluded ? " · paid" : ""}</span>
                      {isRegistered && <span style={{ fontSize: 10, fontWeight: 700, color: isIncluded ? "rgba(255,255,255,0.6)" : dv.accent, letterSpacing: "0.06em" }}>C</span>}
                    </motion.div>
                  );
                })}
              </div>
              {expenseForm.splitType === "equal" && expenseForm.amount && splitWith.size > 0 && (
                <div style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe, marginTop: 4 }}>
                  {symFor(expenseForm.currency || selectedGroup.currency)}{(parseFloat(expenseForm.amount) / splitWith.size).toFixed(2)} each across {splitWith.size} {splitWith.size === 1 ? "person" : "people"}
                </div>
              )}
            </div>

            {/* Split type selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 10 }}>Split type</label>
              <div style={{ display: "flex", gap: 0, border: `1px solid ${dv.cream}`, background: dv.bone }}>
                {SPLIT_TYPES.map((t, ti) => {
                  const active = expenseForm.splitType === t.id;
                  return (
                    <button key={t.id} onClick={() => setExpenseForm(p => ({ ...p, splitType: t.id, splitInputs: t.id === "equal" ? {} : p.splitInputs }))}
                      style={{
                        flex: 1, padding: "10px 12px",
                        background: active ? dv.ink : "transparent",
                        color: active ? dv.bone : dv.taupe,
                        border: "none",
                        borderRight: ti < SPLIT_TYPES.length - 1 ? `1px solid ${dv.cream}` : "none",
                        fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
                        cursor: "pointer", transition: "all 0.2s",
                      }}>
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 12, marginTop: 8, marginBottom: 0 }}>
                {SPLIT_TYPES.find(t => t.id === expenseForm.splitType)?.hint}
              </p>
            </div>

            {/* Per-person inputs when not equal */}
            {expenseForm.splitType !== "equal" && splitWith.size > 0 && (() => {
              const included = groupMembers.filter(m => splitWith.has(m.email));
              const ccy = expenseForm.currency || selectedGroup.currency;
              const total = parseFloat(expenseForm.amount) || 0;
              let inputSum = 0;
              included.forEach(m => { inputSum += parseFloat(expenseForm.splitInputs[m.email]) || 0; });
              const target = expenseForm.splitType === "exact" ? total : (expenseForm.splitType === "percentage" ? 100 : null);
              const diff = target != null ? (target - inputSum) : null;
              const balanced = target == null || Math.abs(diff) < 0.01;
              const suffix = expenseForm.splitType === "percentage" ? "%" : (expenseForm.splitType === "shares" ? " sh" : "");
              const inputPlaceholder = expenseForm.splitType === "exact" ? "0.00" : (expenseForm.splitType === "percentage" ? "0" : "1");
              return (
                <div style={{ marginBottom: 20, padding: "16px 0", borderTop: `1px solid ${dv.cream}`, borderBottom: `1px solid ${dv.cream}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                    <label style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe }}>
                      {expenseForm.splitType === "exact" ? "Amount per person" : expenseForm.splitType === "percentage" ? "Percentage per person" : "Shares per person"}
                    </label>
                    {target != null && (
                      <span style={{ fontFamily: dv.mono, fontSize: 11, color: balanced ? dv.moss : dv.accent }}>
                        {balanced
                          ? "Balanced"
                          : `${diff > 0 ? "Need" : "Over by"} ${Math.abs(diff).toFixed(expenseForm.splitType === "percentage" ? 1 : 2)}${suffix}`}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {included.map(m => {
                      const v = expenseForm.splitInputs[m.email] ?? "";
                      const sharePreview = (() => {
                        if (expenseForm.splitType === "exact") return parseFloat(v) || 0;
                        if (expenseForm.splitType === "percentage") return total * ((parseFloat(v) || 0) / 100);
                        if (expenseForm.splitType === "shares") {
                          let totalShares = 0;
                          included.forEach(mm => { totalShares += parseFloat(expenseForm.splitInputs[mm.email]) || 0; });
                          return totalShares > 0 ? total * ((parseFloat(v) || 0) / totalShares) : 0;
                        }
                        return 0;
                      })();
                      return (
                        <div key={m.email} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center" }}>
                          <span style={{ fontFamily: dv.serif, fontSize: 14, color: dv.ink }}>
                            {m.email === userEmail ? `${m.display_name || "You"} (you)` : m.display_name || m.email}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {expenseForm.splitType === "exact" && <span style={{ fontFamily: dv.mono, fontSize: 12, color: dv.stone }}>{symFor(ccy)}</span>}
                            <input type="number" step="0.01" value={v} placeholder={inputPlaceholder}
                              onChange={e => setExpenseForm(p => ({ ...p, splitInputs: { ...p.splitInputs, [m.email]: e.target.value } }))}
                              style={{ width: 84, padding: "6px 8px", background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`, color: dv.ink, fontFamily: dv.mono, fontSize: 13, textAlign: "right", outline: "none" }} />
                            {expenseForm.splitType !== "exact" && <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe }}>{suffix.trim()}</span>}
                          </div>
                          <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe, minWidth: 70, textAlign: "right" }}>
                            ≈ {symFor(ccy)}{sharePreview.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Receipt snapshot */}
            <div style={{ marginBottom: 20 }}>
              {receiptNotice && (
                <div style={{ marginBottom: 10, padding: "10px 12px", border: `1px solid ${dv.gold}40`, background: `${dv.gold}10`, borderRadius: 10 }}>
                  <div style={{ fontFamily: dv.sans, fontSize: 12, lineHeight: 1.5, color: dv.ink }}>
                    The expense saved, but the receipts couldn't be stored yet — run{" "}
                    <span style={{ fontFamily: dv.mono, fontSize: 11 }}>supabase-splits-receipt-migration.sql</span> in your Supabase SQL editor, then add them again.
                  </div>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <label style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe }}>
                  Receipts
                  {(expenseForm.receiptImages || []).length > 0 && (
                    <span style={{ marginLeft: 8, color: dv.stone }}>{expenseForm.receiptImages.length}</span>
                  )}
                </label>
                <button onClick={() => receiptInputRef.current?.click()}
                  style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: dv.ink, background: "none", border: "none", cursor: "pointer" }}>
                  + Add receipt
                </button>
              </div>
              <input ref={receiptInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleReceiptCapture} />
              {(expenseForm.receiptImages || []).length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {expenseForm.receiptImages.map((src, ri) => (
                    <div key={ri} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: `1px solid ${dv.cream}` }}>
                      <img src={src} alt={`Receipt ${ri + 1}`} onClick={() => setReceiptViewer({ list: expenseForm.receiptImages, index: ri })}
                        style={{ width: 92, height: 92, objectFit: "cover", display: "block", cursor: "zoom-in" }} />
                      <button onClick={() => setExpenseForm(p => ({ ...p, receiptImages: p.receiptImages.filter((_, i) => i !== ri) }))}
                        title="Remove"
                        style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                  ))}
                  <div onClick={() => receiptInputRef.current?.click()} title="Add another"
                    style={{ width: 92, height: 92, border: `1px dashed ${dv.stone}50`, borderRadius: 8, display: "grid", placeItems: "center", cursor: "pointer", color: dv.stone, fontFamily: dv.mono, fontSize: 20 }}>+</div>
                </div>
              ) : (
                <div onClick={() => receiptInputRef.current?.click()}
                  style={{ padding: "28px 20px", border: `1px dashed ${dv.stone}50`, textAlign: "center", cursor: "pointer", transition: "border-color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = dv.accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor = `${dv.stone}50`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dv.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
                  </svg>
                  <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 14, color: dv.stone }}>Choose a photo or take one</div>
                </div>
              )}
            </div>

            {/* Category + Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: "block", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 }}>Category</label>
                <select value={expenseForm.category} onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))}
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "10px 0", fontFamily: dv.sans, fontSize: 14, color: dv.ink, outline: "none" }}>
                  {SPLIT_CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 }}>Date</label>
                <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))}
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "10px 0", fontFamily: dv.sans, fontSize: 14, color: dv.ink, outline: "none" }} />
              </div>
            </div>

            {/* Submit */}
            <button onClick={addExpense} disabled={loading || !expenseForm.description || !expenseForm.amount}
              style={{ width: "100%", padding: 18, background: dv.graphite, color: "#F4F1EC", border: "none", fontFamily: dv.serif, fontSize: 17, cursor: "pointer", letterSpacing: "0.02em", position: "relative", overflow: "hidden", opacity: loading ? 0.5 : 1 }}>
              <span style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {loading ? "Adding..." : "Settle the tab"} <span>&#8594;</span>
              </span>
            </button>
          </div>

          {/* Right Panel — The Tally (dark) */}
          <div style={{ background: dv.graphite, color: "#F4F1EC", padding: isMobile ? 24 : 40, border: `1px solid ${dv.graphite}`, position: "relative", overflow: "hidden" }}>
            {/* Accent glow */}
            <div style={{ position: "absolute", top: "-40%", right: "-20%", width: "70%", height: "70%", background: "radial-gradient(circle, rgba(200,85,61,0.15), transparent 60%)", pointerEvents: "none" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid rgba(244,241,236,0.1)", position: "relative", zIndex: 2 }}>
              <div style={{ fontFamily: dv.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.02em", color: "#F4F1EC" }}>The Tally <em style={{ fontStyle: "italic", color: dv.stone, fontSize: 18 }}>breakdown</em></div>
              <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.stone, letterSpacing: "0.1em" }}>S 02</span>
            </div>

            {/* Total */}
            <div style={{ marginBottom: 36, position: "relative", zIndex: 2 }}>
              <div style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.stone, marginBottom: 12 }}>Total Settled</div>
              <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 38 : 76, fontWeight: 300, lineHeight: 1, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", color: "#F4F1EC", display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: isMobile ? 32 : 44, color: dv.stone, fontStyle: "italic" }}>$</span>
                <span ref={totalRef}>{fmtAmt(totalSpent)}</span>
              </div>
              <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 14, color: dv.stone, marginTop: 10 }}>
                {groupExpenses.length > 0 ? `${groupExpenses.length} expense${groupExpenses.length !== 1 ? "s" : ""} across ${groupMembers.length} people` : "Ready when you are."}
              </div>
            </div>

            {/* Your balance */}
            <div style={{ padding: "16px 18px", marginBottom: 28, background: myBalance >= 0 ? "rgba(107,122,90,0.12)" : "rgba(200,85,61,0.12)", border: `1px solid ${myBalance >= 0 ? "rgba(107,122,90,0.25)" : "rgba(200,85,61,0.25)"}`, position: "relative", zIndex: 2 }}>
              <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.stone, marginBottom: 6 }}>{myBalance >= 0 ? "You are owed" : "You owe"}</div>
              <div style={{ fontFamily: dv.serif, fontSize: 28, fontWeight: 400, color: myBalance >= 0 ? "#A8B89A" : dv.accentSoft, fontVariantNumeric: "tabular-nums" }}>
                <span style={{ fontSize: 18, fontStyle: "italic", marginRight: 2 }}>$</span>{fmtAmt(myBalance)}
              </div>
            </div>

            {/* Who owes what */}
            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.stone, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                Who owes what
                <div style={{ flex: 1, height: 1, background: "rgba(244,241,236,0.12)" }} />
              </div>

              {debts.length > 0 ? debts.map((d, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: "1px solid rgba(244,241,236,0.06)" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: CHIP_COLORS[i % 5], display: "grid", placeItems: "center", fontSize: 13, fontWeight: 500, color: "#F4F1EC" }}>
                    {initials(memberName(d.from))}
                  </div>
                  <div>
                    <div style={{ fontFamily: dv.serif, fontSize: 18, fontWeight: 400 }}>{memberName(d.from)}</div>
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.accentSoft, marginTop: 2 }}>
                      Owes {memberName(d.to)}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontFamily: dv.serif, fontSize: 22, fontWeight: 400, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
                      <span style={{ fontSize: 14, color: dv.stone, fontStyle: "italic", marginRight: 2 }}>$</span>{fmtAmt(d.amount)}
                    </div>
                    {d.from === userEmail && (
                      <button onClick={() => { setSettleForm({ to: d.to, amount: d.amount.toFixed(2) }); setShowSettle(true); }}
                        style={{ padding: "6px 14px", background: dv.moss, color: "#F4F1EC", border: "none", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
                        Settle
                      </button>
                    )}
                  </div>
                </motion.div>
              )) : (
                <div style={{ textAlign: "center", padding: "48px 20px", color: dv.stone }}>
                  <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 48, color: "rgba(244,241,236,0.12)", marginBottom: 8 }}>~</div>
                  <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 16 }}>All settled up, or add an expense.</div>
                </div>
              )}
            </div>

            {/* Statement — the shareable "where everyone stands" summary */}
            <button onClick={() => setShowStatement(true)} style={{ width: "100%", marginTop: 24, padding: 14, background: "transparent", border: "1px solid rgba(244,241,236,0.18)", color: "#F4F1EC", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", position: "relative", zIndex: 2 }}>
              Statement &amp; reconciliation
            </button>

            {/* Settle button */}
            <button onClick={() => setShowSettle(true)} style={{ width: "100%", marginTop: 10, padding: 16, background: "rgba(244,241,236,0.06)", border: "1px solid rgba(244,241,236,0.1)", color: "#F4F1EC", fontFamily: dv.serif, fontSize: 15, cursor: "pointer", position: "relative", zIndex: 2 }}>
              Record a payment &#8594;
            </button>
          </div>
        </div>

        {/* Expenses list */}
        {groupExpenses.length > 0 && (
          <div style={{ marginTop: 48, borderTop: `1px solid ${dv.cream}`, paddingTop: 32 }}>
            <div style={{ fontFamily: dv.serif, fontSize: 22, fontWeight: 400, marginBottom: 20 }}>Ledger <em style={{ fontStyle: "italic", color: dv.taupe, fontSize: 16 }}>history</em></div>
            {groupExpenses.map((exp, i) => {
              const cat = SPLIT_CATS.find(c => c.id === exp.category) || SPLIT_CATS[6];
              const paidByYou = exp.paid_by_email === userEmail;
              const shares = exp.split_expense_shares || [];
              const isExpanded = expandedExpenseId === exp.id;
              const isEditing = editingExpenseId === exp.id;
              // Who added this. Expenses predating authorship are treated as the
              // group creator's, which is what the RLS migration backfills them to.
              const isMine = exp.created_by ? exp.created_by === user?.id : !!selectedGroup?._isOwner;
              const author = groupMembers.find(m => m.user_id && m.user_id === exp.created_by);
              const addedByName = author?.display_name || handleLabel(author?.email) || "another member";

              return (
                <div key={exp.id} style={{ borderBottom: `1px solid ${dv.cream}` }}>
                  {/* Main row */}
                  <div onClick={() => setExpandedExpenseId(isExpanded ? null : exp.id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0", cursor: "pointer" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: dv.ink }}>{exp.description}</div>
                      <div style={{ fontSize: 11, color: dv.taupe, marginTop: 2 }}>
                        Paid by <strong style={{ color: paidByYou ? dv.accent : dv.ink }}>{paidByYou ? "you" : memberName(exp.paid_by_email)}</strong> · {exp.date}
                      </div>
                    </div>
                    {/* Avatar circles for included users */}
                    <div style={{ display: "flex", flexShrink: 0, marginRight: 4 }}>
                      {shares.slice(0, 5).map((sh, si) => {
                        const mIdx = groupMembers.findIndex(gm => gm.email === sh.email);
                        return (
                          <div key={sh.id} title={memberName(sh.email)} style={{
                            width: 22, height: 22, borderRadius: "50%", background: CHIP_COLORS[(mIdx >= 0 ? mIdx : si) % 5],
                            color: "#F4F1EC", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 600,
                            marginLeft: si > 0 ? -6 : 0, border: `2px solid ${dv.bone}`, position: "relative", zIndex: 5 - si,
                          }}>
                            {initials(memberName(sh.email))}
                          </div>
                        );
                      })}
                      {shares.length > 5 && (
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: dv.stone, color: "#F4F1EC", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 600, marginLeft: -6, border: `2px solid ${dv.bone}` }}>
                          +{shares.length - 5}
                        </div>
                      )}
                    </div>
                    <div style={{ fontFamily: dv.serif, fontSize: 18, fontWeight: 400, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: dv.stone, fontStyle: "italic" }}>$</span>{fmtAmt(exp.amount)}
                    </div>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                      <path d="M4 6l4 4 4-4" stroke={dv.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ padding: "0 0 16px 20px" }}>
                      {/* Receipt — viewable without entering edit */}
                      {!isEditing && receiptsOf(exp).length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                          {receiptsOf(exp).map((src, ri) => (
                            <button key={ri} onClick={e => { e.stopPropagation(); setReceiptViewer({ list: receiptsOf(exp), index: ri }); }}
                              title={`View receipt ${ri + 1}`}
                              style={{ display: "inline-block", padding: 0, border: `1px solid ${dv.cream}`, borderRadius: 10, overflow: "hidden", background: "none", cursor: "zoom-in" }}>
                              <img src={src} alt={`Receipt ${ri + 1}`} style={{ width: 86, height: 86, objectFit: "cover", display: "block" }} />
                            </button>
                          ))}
                        </div>
                      )}
                      {/* People included */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 }}>Split between</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {shares.map((sh, si) => (
                            <div key={sh.id} style={{
                              display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 5px",
                              background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, borderRadius: 100, fontSize: 12,
                            }}>
                              <div style={{ width: 18, height: 18, borderRadius: "50%", background: CHIP_COLORS[si % 5], color: "#F4F1EC", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 600 }}>
                                {initials(memberName(sh.email))}
                              </div>
                              <span style={{ color: dv.ink }}>{memberName(sh.email)}</span>
                              <span style={{ fontFamily: dv.mono, fontSize: 10, color: dv.stone }}>${fmtAmt(sh.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Edit / Delete actions — only for whoever added the expense.
                          Everyone in a group can add to it, but someone else's entry
                          is theirs to correct. The database enforces this too; this
                          just avoids offering an action that would be refused. */}
                      {!isEditing && !isMine ? (
                        <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 12, color: dv.stone }}>
                          Added by {addedByName} — only they can edit this
                        </div>
                      ) : !isEditing ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            setEditingExpenseId(exp.id);
                            // Hydrate per-person inputs from existing shares so the edit form
                            // can roundtrip the original split type.
                            const splitInputs = {};
                            const splitType = exp.split_type || "equal";
                            const shareTotal = (shares || []).reduce((s, sh) => s + (sh.amount || 0), 0);
                            (shares || []).forEach(sh => {
                              if (splitType === "exact") splitInputs[sh.email] = String(sh.amount);
                              else if (splitType === "percentage") splitInputs[sh.email] = exp.amount > 0 ? String(((sh.amount / exp.amount) * 100).toFixed(2)) : "0";
                              else if (splitType === "shares") splitInputs[sh.email] = shareTotal > 0 ? String((sh.amount / shareTotal).toFixed(4)) : "1";
                            });
                            setEditExpenseForm({
                              description: exp.description, amount: String(exp.amount),
                              currency: exp.currency || selectedGroup.currency || "USD",
                              fxRate: exp.fx_rate || 1,
                              category: exp.category || "food", date: exp.date || "",
                              splitType, splitInputs,
                              receiptImages: receiptsOf(exp),
                            });
                            setEditSplitWith(new Set(shares.map(sh => sh.email)));
                          }}
                            style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: dv.ink, background: "none", border: `1px solid ${dv.cream}`, padding: "6px 14px", cursor: "pointer" }}>
                            Edit
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteExpense(exp.id); }}
                            style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: dv.accent, background: "none", border: `1px solid ${dv.accent}30`, padding: "6px 14px", cursor: "pointer" }}>
                            Delete
                          </button>
                        </div>
                      ) : (
                        <div style={{ padding: "12px 14px", background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, marginTop: 4 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
                            <div>
                              <label style={{ display: "block", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 6 }}>Description</label>
                              <input value={editExpenseForm.description} onChange={e => setEditExpenseForm(p => ({ ...p, description: e.target.value }))}
                                style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "6px 0", fontFamily: dv.serif, fontSize: 16, color: dv.ink, outline: "none" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 6 }}>Amount</label>
                              <div style={{ position: "relative" }}>
                                <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", fontFamily: dv.serif, fontSize: 16, color: dv.stone, fontStyle: "italic" }}>$</span>
                                <input type="number" step="0.01" value={editExpenseForm.amount} onChange={e => setEditExpenseForm(p => ({ ...p, amount: e.target.value }))}
                                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "6px 0 6px 16px", fontFamily: dv.serif, fontSize: 16, color: dv.ink, outline: "none" }} />
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                            <div>
                              <label style={{ display: "block", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 6 }}>Category</label>
                              <select value={editExpenseForm.category} onChange={e => setEditExpenseForm(p => ({ ...p, category: e.target.value }))}
                                style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "6px 0", fontFamily: dv.sans, fontSize: 13, color: dv.ink, outline: "none" }}>
                                {SPLIT_CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ display: "block", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 6 }}>Date</label>
                              <input type="date" value={editExpenseForm.date} onChange={e => setEditExpenseForm(p => ({ ...p, date: e.target.value }))}
                                style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "6px 0", fontFamily: dv.sans, fontSize: 13, color: dv.ink, outline: "none" }} />
                            </div>
                          </div>
                          {/* Edit split members */}
                          <div style={{ marginBottom: 12 }}>
                            <label style={{ display: "block", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 }}>Split between <span style={{ color: dv.stone }}>({editSplitWith.size}/{groupMembers.length})</span></label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {groupMembers.map((gm, gi) => {
                                const included = editSplitWith.has(gm.email);
                                return (
                                  <div key={gm.email} onClick={() => setEditSplitWith(prev => {
                                    const next = new Set(prev);
                                    if (next.has(gm.email)) { if (next.size > 1) next.delete(gm.email); } else next.add(gm.email);
                                    return next;
                                  })}
                                    style={{
                                      display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 5px",
                                      background: included ? CHIP_COLORS[gi % 5] : "transparent",
                                      color: included ? "#F4F1EC" : dv.stone,
                                      border: `1.5px solid ${included ? "transparent" : `${dv.stone}40`}`,
                                      borderRadius: 100, fontSize: 12, cursor: "pointer", transition: "all 0.2s",
                                    }}>
                                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: included ? "rgba(255,255,255,0.2)" : `${dv.stone}30`, color: included ? "#F4F1EC" : dv.stone, display: "grid", placeItems: "center", fontSize: 10, fontWeight: 600 }}>
                                      {initials(gm.display_name || gm.email)}
                                    </div>
                                    <span style={{ fontWeight: included ? 500 : 400 }}>{gm.display_name || handleLabel(gm.email)}</span>
                                  </div>
                                );
                              })}
                            </div>
                            {editExpenseForm.amount && editSplitWith.size > 0 && (
                              <div style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, marginTop: 6 }}>
                                ${(parseFloat(editExpenseForm.amount) / editSplitWith.size).toFixed(2)} each
                              </div>
                            )}
                          </div>
                          {/* Receipt — add one after the fact, replace it, or drop it.
                              Saved on pick, not on Save, so the row updates immediately. */}
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                              <span style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe }}>
                                Receipt
                                {receiptStatus?.id === exp.id && (
                                  <span style={{ marginLeft: 8, color: receiptStatus.state === "error" ? dv.accent : dv.moss, textTransform: "none", letterSpacing: "0.04em" }}>
                                    {receiptStatus.state === "saving" ? "saving…"
                                      : receiptStatus.state === "saved" ? "saved"
                                      : receiptStatus.state === "removed" ? "removed"
                                      : "not saved"}
                                  </span>
                                )}
                              </span>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => editReceiptInputRef.current?.click()}
                                  style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: dv.ink, background: "none", border: `1px solid ${dv.cream}`, padding: "5px 12px", cursor: "pointer" }}>
                                  + Add receipt
                                </button>
                              </div>
                            </div>
                            {receiptNotice && (
                              <div style={{ marginBottom: 8, padding: "10px 12px", border: `1px solid ${dv.gold}40`, background: `${dv.gold}10`, borderRadius: 10 }}>
                                <div style={{ fontFamily: dv.sans, fontSize: 12, lineHeight: 1.5, color: dv.ink }}>
                                  Receipts can't be stored yet — run{" "}
                                  <span style={{ fontFamily: dv.mono, fontSize: 11 }}>supabase-splits-receipt-migration.sql</span> in your Supabase SQL editor, then add it again.
                                </div>
                              </div>
                            )}
                            <input ref={editReceiptInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleEditReceiptCapture} />
                            {(editExpenseForm.receiptImages || []).length > 0 ? (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {editExpenseForm.receiptImages.map((src, ri) => (
                                  <div key={ri} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: `1px solid ${dv.cream}` }}>
                                    <img src={src} alt={`Receipt ${ri + 1}`} onClick={() => setReceiptViewer({ list: editExpenseForm.receiptImages, index: ri })}
                                      style={{ width: 84, height: 84, objectFit: "cover", display: "block", cursor: "zoom-in" }} />
                                    <button onClick={() => removeEditReceipt(ri)} title="Remove"
                                      style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                                  </div>
                                ))}
                                <div onClick={() => editReceiptInputRef.current?.click()} title="Add another"
                                  style={{ width: 84, height: 84, border: `1px dashed ${dv.cream}`, borderRadius: 8, display: "grid", placeItems: "center", cursor: "pointer", color: dv.stone, fontFamily: dv.mono, fontSize: 18 }}>+</div>
                              </div>
                            ) : (
                              <div onClick={() => editReceiptInputRef.current?.click()}
                                style={{ border: `1px dashed ${dv.cream}`, borderRadius: 10, padding: "14px 12px", textAlign: "center", cursor: "pointer" }}>
                                <span style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.stone }}>Choose a photo or take one</span>
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => updateExpense(exp.id)} disabled={loading}
                              style={{ padding: "8px 18px", background: dv.graphite, color: "#F4F1EC", border: "none", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
                              {loading ? "Saving..." : "Save"}
                            </button>
                            <button onClick={() => setEditingExpenseId(null)}
                              style={{ padding: "8px 14px", background: "transparent", border: `1px solid ${dv.cream}`, color: dv.taupe, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Members */}
        <div style={{ marginTop: 36, borderTop: `1px solid ${dv.cream}`, paddingTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <div style={{ fontFamily: dv.serif, fontSize: 22, fontWeight: 400 }}>People <em style={{ fontStyle: "italic", color: dv.taupe, fontSize: 16 }}>in this group</em></div>
            <button onClick={() => setAddMemberForm(f => ({ ...f, show: !f.show }))}
              style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: dv.ink, background: "none", border: "none", cursor: "pointer" }}>
              + Add person
            </button>
          </div>

          {/* Add member inline form */}
          <AnimatePresence>
            {addMemberForm.show && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", marginBottom: 12 }}>
                <div style={{ padding: "16px 18px", background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, marginBottom: 8 }}>
                  {/* Quick-pick from existing companions */}
                  {(() => {
                    const inGroupEmails = new Set(groupMembers.map(m => (m.email || "").toLowerCase()));
                    const pickable = contacts.filter(c => !inGroupEmails.has((c.email || "").toLowerCase()));
                    if (pickable.length === 0) return null;
                    return (
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 }}>From your companions</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {pickable.map((c, ci) => (
                            <button key={c.id}
                              onClick={async () => {
                                setAddMemberForm({ show: true, email: c.email, name: c.display_name || "" });
                                // Auto-submit immediately for fast pick-and-go
                                setTimeout(() => addMemberToGroup(), 0);
                              }}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px 5px 5px",
                                background: "transparent", border: `1px solid ${dv.cream}`, borderRadius: 100,
                                fontFamily: dv.sans, fontSize: 12, color: dv.ink, cursor: "pointer", transition: "all 0.2s",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = dv.accent; e.currentTarget.style.color = dv.accent; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = dv.cream; e.currentTarget.style.color = dv.ink; }}>
                              <span style={{ width: 20, height: 20, borderRadius: "50%", background: CHIP_COLORS[ci % 5], color: "#F4F1EC", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600 }}>
                                {initials(c.display_name || c.email)}
                              </span>
                              {c.display_name || handleLabel(c.email)}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 6 }}>Email · optional</label>
                      <input value={addMemberForm.email} onChange={e => setAddMemberForm(f => ({ ...f, email: e.target.value }))} placeholder="Leave blank if they don't use it"
                        onKeyDown={e => { if (e.key === "Enter") addMemberToGroup(); }}
                        style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "8px 0", fontFamily: dv.sans, fontSize: 14, color: dv.ink, outline: "none" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 6 }}>Display name</label>
                      <input value={addMemberForm.name} onChange={e => setAddMemberForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Christine"
                        onKeyDown={e => { if (e.key === "Enter") addMemberToGroup(); }}
                        style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "8px 0", fontFamily: dv.sans, fontSize: 14, color: dv.ink, outline: "none" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={addMemberToGroup} disabled={loading || (!addMemberForm.email.includes("@") && !addMemberForm.name.trim())}
                      style={{ padding: "10px 20px", background: dv.graphite, color: "#F4F1EC", border: "none", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
                      {loading ? "Adding..." : "Add to group"}
                    </button>
                    <button onClick={() => setAddMemberForm({ show: false, email: "", name: "" })}
                      style={{ padding: "10px 16px", background: "transparent", border: `1px solid ${dv.cream}`, color: dv.taupe, fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {groupMembers.map((m, i) => {
              const bal = balances[m.email] || 0;
              const isRegistered = !!m.user_id;
              const isMe = m.email === userEmail;
              const isEditing = editingMemberId === m.id;
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 4px", borderBottom: i < groupMembers.length - 1 ? `1px solid ${dv.cream}` : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: CHIP_COLORS[i % 5], color: "#F4F1EC", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                    {initials(m.display_name || m.email)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input autoFocus value={editingName} onChange={e => setEditingName(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { renameMember(m.id, editingName); setEditingMemberId(null); } if (e.key === "Escape") setEditingMemberId(null); }}
                          style={{ flex: 1, border: "none", borderBottom: `1px solid ${dv.accent}`, background: "transparent", fontFamily: dv.serif, fontSize: 16, fontWeight: 400, color: dv.ink, outline: "none", padding: "2px 0" }} />
                        <button onClick={() => { renameMember(m.id, editingName); setEditingMemberId(null); }}
                          style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: dv.accent, background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}>Save</button>
                      </div>
                    ) : (
                      <div style={{ fontFamily: dv.serif, fontSize: 16, fontWeight: 400, color: dv.ink }}>{m.display_name || handleLabel(m.email)}</div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                      <span style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.06em" }}>{shownEmail(m.email) || "No email"}</span>
                      {isRegistered && <span style={{ fontSize: 10, fontWeight: 700, color: dv.accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>Continuum</span>}
                      {isMe && <span style={{ fontSize: 10, color: dv.taupe, letterSpacing: "0.08em", textTransform: "uppercase" }}>You</span>}
                    </div>
                  </div>
                  <span style={{ fontFamily: dv.serif, fontSize: 16, fontWeight: 400, color: bal > 0.01 ? dv.moss : bal < -0.01 ? dv.accent : dv.stone, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                    {bal > 0.01 ? <><span style={{ fontSize: 11, fontStyle: "italic" }}>$</span>+{fmtAmt(bal)}</> : bal < -0.01 ? <><span style={{ fontSize: 11, fontStyle: "italic" }}>$</span>-{fmtAmt(bal)}</> : <span style={{ fontSize: 12 }}>settled</span>}
                  </span>
                  {!isEditing && (
                    <button onClick={() => { setEditingMemberId(m.id); setEditingName(m.display_name || ""); }}
                      style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: dv.taupe, background: "none", border: "none", cursor: "pointer", padding: "4px 6px", flexShrink: 0 }}>
                      Edit
                    </button>
                  )}
                  {!isMe && groupMembers.length > 2 && !isEditing && (
                    <button onClick={() => removeMember(m.id, m.email)} title="Remove from group"
                      style={{ background: "none", border: "none", color: dv.stone, cursor: "pointer", padding: "0 2px", opacity: 0.4, transition: "opacity 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.4"}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/*
          * Receipt viewer.
          *
          * The thumbnails used to be links straight to the stored data: URL.
          * Chrome and Firefox block top-level navigation to data: URLs, so that
          * opened a blank tab — the image was there, the browser just refused to
          * render it as a document. Shown in-app instead. The download goes
          * through a blob URL for the same reason.
          */}
        <AnimatePresence>
          {receiptViewer && (() => {
            const list = (receiptViewer.list || []).filter(Boolean);
            const index = Math.min(Math.max(receiptViewer.index || 0, 0), Math.max(list.length - 1, 0));
            const current = list[index];
            if (!current) return null;
            const step = (delta) => setReceiptViewer(v => ({ ...v, index: (index + delta + list.length) % list.length }));
            return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setReceiptViewer(null)}
              style={{
                position: "fixed", inset: 0, zIndex: 9999, background: "rgba(10,9,7,0.88)",
                backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: isMobile ? "16px 12px calc(140px + env(safe-area-inset-bottom))" : 32,
              }}>
              <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: 900, width: "100%", maxHeight: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>
                    Receipt{list.length > 1 ? ` ${index + 1} / ${list.length}` : ""}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {list.length > 1 && (
                      <>
                        <button onClick={() => step(-1)} title="Previous"
                          style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F4F1EC", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", padding: "7px 12px", cursor: "pointer" }}>‹</button>
                        <button onClick={() => step(1)} title="Next"
                          style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F4F1EC", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", padding: "7px 12px", cursor: "pointer" }}>›</button>
                      </>
                    )}
                    <button onClick={() => {
                      try {
                        const [meta, b64] = current.split(",");
                        const mime = (meta.match(/:(.*?);/) || [])[1] || "image/jpeg";
                        const bytes = atob(b64);
                        const buf = new Uint8Array(bytes.length);
                        for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
                        const url = URL.createObjectURL(new Blob([buf], { type: mime }));
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `receipt${list.length > 1 ? `-${index + 1}` : ""}.${mime.includes("png") ? "png" : "jpg"}`;
                        document.body.appendChild(a); a.click(); a.remove();
                        setTimeout(() => URL.revokeObjectURL(url), 10000);
                      } catch (err) { console.error("Receipt download failed:", err); }
                    }}
                      style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F4F1EC", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", padding: "7px 14px", cursor: "pointer" }}>
                      Download
                    </button>
                    <button onClick={() => setReceiptViewer(null)}
                      style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F4F1EC", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", padding: "7px 14px", cursor: "pointer" }}>
                      Close
                    </button>
                  </div>
                </div>
                <img src={current} alt={`Receipt ${index + 1}`}
                  style={{ width: "100%", maxHeight: isMobile ? "70vh" : "80vh", objectFit: "contain", borderRadius: 12, background: "#15130F" }} />
                {list.length > 1 && (
                  <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                    {list.map((src, ti) => (
                      <button key={ti} onClick={() => setReceiptViewer(v => ({ ...v, index: ti }))}
                        style={{ padding: 0, border: `2px solid ${ti === index ? "#F4F1EC" : "transparent"}`, borderRadius: 6, overflow: "hidden", background: "none", cursor: "pointer", opacity: ti === index ? 1 : 0.6 }}>
                        <img src={src} alt={`Receipt ${ti + 1}`} style={{ width: 46, height: 46, objectFit: "cover", display: "block" }} />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Statement & reconciliation */}
        <AnimatePresence>
          {showStatement && (() => {
            const st = buildStatement();
            const debts = simplifyDebts();
            const groupCcy = selectedGroup.currency || "USD";
            const sym = symFor(groupCcy);
            const m = (n) => `${sym}${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const html = () => statementHtml(st, debts, groupCcy, sym);
            const allOk = st.checks.paidEqualsShares && st.checks.netsCancel && st.checks.linesTie;
            const row = { display: "grid", gridTemplateColumns: isMobile ? "1.2fr 1fr 1fr" : "1.4fr repeat(5, 1fr)", gap: 8, padding: "8px 0", borderBottom: `1px solid ${dv.cream}`, fontSize: 12.5, alignItems: "baseline" };
            const num = { textAlign: "right", fontFamily: dv.mono, fontSize: 11.5, fontVariantNumeric: "tabular-nums" };
            return (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowStatement(false)}
                style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(21,19,15,0.6)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? "0 0 calc(132px + env(safe-area-inset-bottom))" : 24 }}>
                <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}
                  onClick={e => e.stopPropagation()}
                  style={{ width: "100%", maxWidth: 820, maxHeight: isMobile ? "calc(var(--app-height, 100dvh) * 0.8)" : "88vh", overflowY: "auto", background: dv.bone, border: `1px solid ${dv.cream}`, borderRadius: isMobile ? 18 : 16, boxShadow: "0 24px 70px rgba(0,0,0,0.4)" }}>
                  {/* Sticky header */}
                  <div style={{ position: "sticky", top: 0, zIndex: 2, background: dv.bone, borderBottom: `1px solid ${dv.cream}`, padding: isMobile ? "16px 18px" : "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.13em", textTransform: "uppercase", color: dv.accent, marginBottom: 4 }}>Statement</div>
                      <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 20 : 23, fontWeight: 400, letterSpacing: "-0.02em" }}>{selectedGroup.name}</div>
                      <div style={{ fontFamily: dv.sans, fontSize: 12, color: dv.taupe, marginTop: 3 }}>
                        {st.lines.length} expense{st.lines.length === 1 ? "" : "s"} · {m(st.totals.paid)} total{st.totals.settled ? ` · ${m(st.totals.settled)} settled` : ""}
                      </div>
                    </div>
                    <button onClick={() => setShowStatement(false)} title="Close"
                      style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${dv.cream}`, background: "transparent", color: dv.taupe, cursor: "pointer", display: "grid", placeItems: "center", flex: "none" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>

                  <div style={{ padding: isMobile ? "16px 18px 20px" : "20px 22px 24px" }}>
                    {/* Where everyone stands */}
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 10 }}>Where everyone stands</div>
                    {!isMobile && (
                      <div style={{ ...row, color: dv.taupe, fontFamily: dv.mono, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        <span>Person</span><span style={num}>Paid out</span><span style={num}>Their share</span><span style={num}>Paid back</span><span style={num}>Received</span><span style={num}>Position</span>
                      </div>
                    )}
                    {st.people.map(p => (
                      <div key={p.email} style={row}>
                        <span style={{ fontFamily: dv.serif, fontSize: 14 }}>{memberName(p.email)}</span>
                        {!isMobile && <span style={num}>{m(p.paid)}</span>}
                        {!isMobile && <span style={num}>{m(p.share)}</span>}
                        {!isMobile && <span style={num}>{p.settledOut ? m(p.settledOut) : "—"}</span>}
                        {!isMobile && <span style={num}>{p.settledIn ? m(p.settledIn) : "—"}</span>}
                        {isMobile && <span style={{ ...num, color: dv.taupe }}>{m(p.paid)} paid</span>}
                        <span style={{ ...num, color: p.net > 0.005 ? dv.moss : p.net < -0.005 ? dv.accent : dv.taupe, fontWeight: 600 }}>
                          {p.net > 0.005 ? `+${m(p.net)}` : p.net < -0.005 ? `−${m(p.net)}` : "settled"}
                        </span>
                      </div>
                    ))}

                    {/* Settle up */}
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, margin: "24px 0 10px" }}>
                      Settling up{debts.length ? ` — ${debts.length} payment${debts.length === 1 ? "" : "s"}` : ""}
                    </div>
                    {debts.length ? debts.map((d, i) => (
                      <div key={i} style={{ fontFamily: dv.sans, fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${dv.cream}` }}>
                        <strong style={{ fontWeight: 600 }}>{memberName(d.from)}</strong> pays <strong style={{ fontWeight: 600 }}>{memberName(d.to)}</strong>
                        <span style={{ fontFamily: dv.mono, fontSize: 12, marginLeft: 8 }}>{m(d.amount)}</span>
                      </div>
                    )) : (
                      <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 14, color: dv.taupe }}>Everyone is square.</div>
                    )}

                    {/* Reconciliation */}
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, margin: "24px 0 10px" }}>Reconciliation</div>
                    <div style={{ border: `1px solid ${allOk ? `${dv.moss}40` : `${dv.accent}40`}`, background: allOk ? (D ? "rgba(107,122,90,0.08)" : "rgba(107,122,90,0.05)") : (D ? "rgba(200,85,61,0.08)" : "rgba(200,85,61,0.05)"), borderRadius: 10, padding: "12px 14px" }}>
                      {[
                        [st.checks.paidEqualsShares, `Everything paid out is allocated — ${m(st.totals.paid)} paid, ${m(st.totals.shares)} in shares.`],
                        [st.checks.netsCancel, `Positions cancel out — they sum to ${st.totals.netSum.toFixed(2)}, as they must.`],
                        [st.checks.linesTie, `Every expense's shares add back to its amount.`],
                      ].map(([ok, text], i) => (
                        <div key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, color: ok ? dv.ink : dv.accent, marginBottom: 4, lineHeight: 1.5 }}>
                          <span style={{ color: ok ? dv.moss : dv.accent, flex: "none" }}>{ok ? "✓" : "✗"}</span>
                          <span>{text}</span>
                        </div>
                      ))}
                      {st.lineIssues.length > 0 && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${dv.cream}` }}>
                          {st.lineIssues.map(i => (
                            <div key={i.id} style={{ fontSize: 12, color: dv.accent }}>{i.description || "(untitled)"} — out by {m(i.drift)}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 12.5, color: dv.taupe, margin: "10px 0 0", lineHeight: 1.5 }}>
                      Each line reads: paid out − their share + paid back − received = position. A few cents of rounding on an uneven split is expected and tolerated.
                    </p>

                    {/* What the printable will carry */}
                    {(() => {
                      const withReceipts = st.lines.filter(l => l.receipts.length).length;
                      const images = st.lines.reduce((s, l) => s + l.receipts.length, 0);
                      return (
                        <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", color: dv.stone, marginTop: 14 }}>
                          {images
                            ? `${images} receipt image${images === 1 ? "" : "s"} across ${withReceipts} of ${st.lines.length} expenses — included in the printable statement`
                            : "No receipts attached to these expenses"}
                          {images > 0 && st.lines.length - withReceipts > 0
                            ? ` · ${st.lines.length - withReceipts} without a receipt`
                            : ""}
                        </div>
                      );
                    })()}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 22 }}>
                      <button onClick={() => { if (!openStatementPrint(html())) alert("Allow pop-ups for this site to open the printable statement."); }}
                        style={{ padding: "10px 16px", background: dv.ink, color: dv.bone, border: "none", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                        Open printable / PDF
                      </button>
                      <button onClick={async () => {
                        const text = [
                          `${selectedGroup.name} — statement`,
                          `${st.lines.length} expenses · ${m(st.totals.paid)} total`,
                          "",
                          ...st.people.map(p => `${memberName(p.email)}: paid ${m(p.paid)}, share ${m(p.share)} → ${p.net > 0.005 ? `is owed ${m(p.net)}` : p.net < -0.005 ? `owes ${m(p.net)}` : "settled"}`),
                          "",
                          "Settle up:",
                          ...(debts.length ? debts.map(d => `  ${memberName(d.from)} pays ${memberName(d.to)} ${m(d.amount)}`) : ["  everyone is square"]),
                        ].join("\n");
                        try { await navigator.clipboard.writeText(text); setStatementCopied(true); setTimeout(() => setStatementCopied(false), 2000); }
                        catch { alert(text); }
                      }}
                        style={{ padding: "10px 16px", background: "transparent", color: dv.ink, border: `1px solid ${dv.cream}`, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                        {statementCopied ? "Copied" : "Copy summary"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Settle modal */}
        <AnimatePresence>
          {showSettle && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettle(false)}
              style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(21,19,15,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()} style={{ width: "90%", maxWidth: 400, background: dv.paper, padding: 32, border: `1px solid ${dv.cream}` }}>
                <div style={{ fontFamily: dv.serif, fontSize: 22, marginBottom: 20 }}>Record Payment</div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 }}>Who did you pay</label>
                  <select value={settleForm.to} onChange={e => setSettleForm(p => ({ ...p, to: e.target.value }))}
                    style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "10px 0", fontFamily: dv.serif, fontSize: 18, color: dv.ink, outline: "none" }}>
                    <option value="">Select person</option>
                    {groupMembers.filter(m => m.email !== userEmail).map(m => <option key={m.email} value={m.email}>{m.display_name || m.email}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 }}>Amount</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", fontFamily: dv.serif, fontSize: 22, color: dv.stone, fontStyle: "italic" }}>$</span>
                    <input type="number" step="0.01" value={settleForm.amount} onChange={e => setSettleForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00"
                      style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "12px 0 12px 20px", fontFamily: dv.serif, fontSize: 22, color: dv.ink, outline: "none" }} />
                  </div>
                </div>
                <button onClick={settleUp} disabled={loading || !settleForm.to || !settleForm.amount}
                  style={{ width: "100%", padding: 16, background: dv.graphite, color: "#F4F1EC", border: "none", fontFamily: dv.serif, fontSize: 16, cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
                  {loading ? "Recording..." : "Record payment"} &#8594;
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── GROUPS LIST ──
  return (
    <div style={{ fontFamily: dv.sans, color: dv.ink }}>
      {/* ── Hero banner ── */}
      <div style={{ margin: isMobile ? "0 -16px 0" : "0 -40px 0", position: "relative", height: isMobile ? 200 : 320, overflow: "hidden", background: "#2C2A26" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${lobsterPicture})`, backgroundSize: "cover", backgroundPosition: "center", filter: "saturate(0.85) contrast(1.05)", animation: "kenburns 24s ease-in-out infinite alternate" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${D ? "rgba(15,15,15,0)" : "rgba(244,241,236,0)"} 55%, ${D ? "rgba(15,15,15,0.9)" : "rgba(244,241,236,0.9)"} 90%, ${css.bg} 100%)`, zIndex: 1 }} />
        <div style={{ position: "absolute", top: 18, left: isMobile ? 16 : 48, zIndex: 3, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#F4F1EC", opacity: 0.85 }}>
          <span style={{ color: css.accent }}>&#9679; </span>Continuum
        </div>
      </div>

      {/* Hero text */}
      <div style={{ marginTop: -20, position: "relative", zIndex: 5, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 0.85fr", gap: isMobile ? 24 : 64, paddingBottom: 48, borderBottom: `1px solid ${dv.cream}`, marginBottom: 48 }}>
        <div>
          <div style={{ fontFamily: dv.mono, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: dv.accent, marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 28, height: 1, background: dv.accent }} />
            Expense Split
          </div>
          <h1 style={{ fontFamily: dv.serif, fontSize: isMobile ? 26 : 72, fontWeight: 300, lineHeight: 0.95, letterSpacing: "-0.035em" }}>
            Who had <em style={{ fontStyle: "italic", fontWeight: 400, color: css.accent }}>the lobster?</em>
          </h1>
        </div>
        <div style={{ paddingBottom: 12 }}>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: dv.taupe, maxWidth: 380, marginBottom: 24 }}>
            An unhurried tool for dividing restaurant tabs, hotels, flights, and everything in between. Built for travelers who'd rather not do math at the table.
          </p>
          <div style={{ display: "flex", gap: 40, paddingTop: 20, borderTop: `1px solid ${dv.cream}` }}>
            <div>
              <div style={{ fontFamily: dv.serif, fontSize: 32, fontWeight: 400, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{groups.length}</div>
              <div style={{ fontFamily: dv.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: dv.taupe, marginTop: 4 }}>Groups</div>
            </div>
            <div>
              <div style={{ fontFamily: dv.serif, fontSize: 32, fontWeight: 400, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{contacts.length}</div>
              <div style={{ fontFamily: dv.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: dv.taupe, marginTop: 4 }}>Companion{contacts.length === 1 ? "" : "s"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Global balances — across every group */}
      {allBalances?.loaded && Object.keys(allBalances.byCurrency).length > 0 && (() => {
        const ccys = Object.keys(allBalances.byCurrency).sort();
        return (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "0 0 18px", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: dv.taupe }}>
              <div style={{ width: 28, height: 1, background: dv.accent }} />
              <strong style={{ color: dv.ink, fontWeight: 500 }}>The tally · across every group</strong>
              <div style={{ flex: 1, height: 1, background: dv.cream }} />
            </div>
            <div style={{ background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: isMobile ? "20px 18px" : "26px 28px" }}>
              {ccys.map((ccy, ci) => {
                const buc = allBalances.byCurrency[ccy];
                const sym = symFor(ccy);
                const counterparties = Object.entries(buc.perPerson)
                  .filter(([, v]) => Math.abs(v) > 0.01)
                  .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));
                if (counterparties.length === 0) return null;
                return (
                  <div key={ccy} style={{ paddingTop: ci === 0 ? 0 : 22, marginTop: ci === 0 ? 0 : 22, borderTop: ci === 0 ? "none" : `1px solid ${dv.cream}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <span style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe, marginRight: 8 }}>{ccy}</span>
                        <span style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 14, color: dv.taupe }}>across {groups.filter(g => (g.currency || "USD") === ccy).length} group{groups.filter(g => (g.currency || "USD") === ccy).length === 1 ? "" : "s"}</span>
                      </div>
                      <div style={{ display: "flex", gap: 22, alignItems: "baseline" }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe }}>Owed to you</div>
                          <div style={{ fontFamily: dv.serif, fontSize: 22, color: dv.moss, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>{sym}{buc.totalOwed.toFixed(2)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe }}>You owe</div>
                          <div style={{ fontFamily: dv.serif, fontSize: 22, color: dv.accent, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>{sym}{buc.totalOwing.toFixed(2)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe }}>Net</div>
                          <div style={{ fontFamily: dv.serif, fontSize: 26, fontWeight: 400, color: buc.net >= 0 ? dv.moss : dv.accent, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
                            {buc.net >= 0 ? "+" : "−"}{sym}{Math.abs(buc.net).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "6px 28px" }}>
                      {counterparties.map(([email, net]) => {
                        const m = groupMembers.find(mb => mb.email === email);
                        const display = m?.display_name || handleLabel(email);
                        return (
                          <div key={email} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${dv.cream}` }}>
                            <span style={{ fontFamily: dv.serif, fontSize: 14, color: dv.ink }}>
                              {net >= 0 ? <em style={{ fontStyle: "italic", color: dv.taupe }}>owes you</em> : <em style={{ fontStyle: "italic", color: dv.taupe }}>you owe</em>} <span style={{ marginLeft: 4 }}>{display}</span>
                            </span>
                            <span style={{ fontFamily: dv.mono, fontSize: 13, color: net >= 0 ? dv.moss : dv.accent, fontVariantNumeric: "tabular-nums" }}>
                              {sym}{Math.abs(net).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Companions — your address book of trip-mates */}
      {contactsReady && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "0 0 18px", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: dv.taupe }}>
            <div style={{ width: 28, height: 1, background: dv.accent }} />
            <strong style={{ color: dv.ink, fontWeight: 500 }}>Companions · your address book</strong>
            <span style={{ color: dv.accent, background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: "2px 8px" }}>
              {String(contacts.length)}
            </span>
            <div style={{ flex: 1, height: 1, background: dv.cream }} />
            <button onClick={() => { setContactForm({ email: "", name: "" }); setShowAddContact(true); }} style={{
              background: "none", border: `1px solid ${dv.cream}`, padding: "4px 10px",
              fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
              color: dv.taupe, cursor: "pointer", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.color = dv.ink; e.currentTarget.style.borderColor = dv.ink; }}
              onMouseLeave={e => { e.currentTarget.style.color = dv.taupe; e.currentTarget.style.borderColor = dv.cream; }}>
              + Add
            </button>
          </div>

          {showAddContact && (
            <div style={{ background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: "16px 18px", marginBottom: 12, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr auto auto", gap: 10, alignItems: "end" }}>
              <div>
                <label style={{ display: "block", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 6 }}>Email · optional</label>
                <input autoFocus type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} placeholder="Leave blank if they don't use it"
                  style={{ width: "100%", background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: "8px 10px", fontFamily: dv.sans, fontSize: 13, color: dv.ink, outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 6 }}>Name</label>
                <input value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Christine"
                  style={{ width: "100%", background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: "8px 10px", fontFamily: dv.sans, fontSize: 13, color: dv.ink, outline: "none" }} />
              </div>
              <button onClick={async () => {
                // One of the two identifies them; an address that isn't one is rejected.
                const hasEmail = contactForm.email.includes("@");
                if (!hasEmail && !contactForm.name.trim()) return;
                if (contactForm.email.trim() && !hasEmail) return;
                await addContact(contactForm.email, contactForm.name);
                setContactForm({ email: "", name: "" });
                setShowAddContact(false);
              }} style={{
                padding: "9px 16px", background: dv.ink, color: dv.bone, border: "none",
                fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
              }}>Save</button>
              <button onClick={() => { setShowAddContact(false); setContactForm({ email: "", name: "" }); }} style={{
                padding: "9px 14px", background: "transparent", color: dv.taupe, border: `1px solid ${dv.cream}`,
                fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
              }}>Cancel</button>
            </div>
          )}

          {contacts.length === 0 ? (
            <div style={{ background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: "32px 24px", textAlign: "center" }}>
              <p style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, margin: 0 }}>
                No companions yet — add the people you usually travel with so you can pick them when creating a trip.
              </p>
            </div>
          ) : (
            <div style={{ background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}` }}>
              {contacts.map((c, ci) => {
                const last = ci === contacts.length - 1;
                const isEditing = editingContactId === c.id;
                return (
                  <div key={c.id} style={{
                    display: "grid", gridTemplateColumns: isMobile ? "auto 1fr auto" : "auto 1.2fr 1.2fr auto",
                    gap: isMobile ? 10 : 18, alignItems: "center",
                    padding: isMobile ? "12px 14px" : "14px 22px",
                    borderBottom: last ? "none" : `1px solid ${dv.cream}`,
                    background: ci % 2 === 1 ? "rgba(226,220,206,0.18)" : "transparent",
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: CHIP_COLORS[ci % 5], color: "#F4F1EC", display: "grid", placeItems: "center", fontFamily: dv.sans, fontSize: 11, fontWeight: 500 }}>
                      {initials(c.display_name || c.email)}
                    </div>
                    {isEditing ? (
                      <input autoFocus value={editingContactName} onChange={e => setEditingContactName(e.target.value)}
                        onBlur={async () => { await renameContact(c.id, editingContactName); setEditingContactId(null); }}
                        onKeyDown={async e => {
                          if (e.key === "Enter") { e.preventDefault(); await renameContact(c.id, editingContactName); setEditingContactId(null); }
                          if (e.key === "Escape") { setEditingContactId(null); }
                        }}
                        style={{ background: dv.bone, borderRadius: 12, border: `1px solid ${dv.accent}`, padding: "6px 10px", fontFamily: dv.serif, fontSize: 15, color: dv.ink, outline: "none" }} />
                    ) : (
                      <div onClick={() => { setEditingContactId(c.id); setEditingContactName(c.display_name || ""); }}
                        title="Click to rename"
                        style={{ fontFamily: dv.serif, fontSize: 15, color: dv.ink, cursor: "text" }}>
                        {c.display_name || handleLabel(c.email)}
                      </div>
                    )}
                    {!isMobile && (
                      <div style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe }}>{shownEmail(c.email) || "No email"}</div>
                    )}
                    <button onClick={() => removeContact(c.id)} title="Remove from address book" style={{
                      width: 28, height: 28, border: `1px solid ${dv.cream}`, background: "transparent",
                      color: dv.taupe, display: "grid", placeItems: "center", cursor: "pointer", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.color = dv.accent; e.currentTarget.style.borderColor = dv.accent; }}
                      onMouseLeave={e => { e.currentTarget.style.color = dv.taupe; e.currentTarget.style.borderColor = dv.cream; }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Groups */}
      {groups.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          {groups.map((group, i) => (
            <div key={group.id} onClick={() => selectGroup(group)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", borderBottom: `1px solid ${dv.cream}`, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: CHIP_COLORS[i % 5], display: "grid", placeItems: "center", fontSize: 13, fontWeight: 500, color: "#F4F1EC", flexShrink: 0 }}>
                  {group.name[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: dv.serif, fontSize: 18, fontWeight: 400 }}>{group.name}</div>
                  <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", color: dv.taupe, textTransform: "uppercase", marginTop: 2 }}>
                    {group._isOwner ? "Created" : "Shared with you"} · {new Date(group.created_at).toLocaleDateString()}
                  </div>
                </div>
                {!group._isOwner && <span style={{ fontSize: 11, fontWeight: 700, color: dv.accent, background: `${dv.accent}15`, padding: "3px 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Shared</span>}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={dv.stone} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>
      )}

      {groups.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: dv.stone }}>
          <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 52, color: `${dv.stone}30`, marginBottom: 8 }}>~</div>
          <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 18 }}>No groups yet. Create one to start splitting.</div>
        </div>
      )}

      {/* Create group button */}
      <button onClick={() => setShowNewGroup(true)} style={{ width: "100%", padding: 20, background: dv.graphite, color: "#F4F1EC", border: "none", fontFamily: dv.serif, fontSize: 17, cursor: "pointer", letterSpacing: "0.02em", marginTop: 16 }}>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>Create a new group <span>&#8594;</span></span>
      </button>

      {/* New Group Modal */}
      <AnimatePresence>
        {showNewGroup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewGroup(false)}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(21,19,15,0.6)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center" }}>
            <motion.div initial={{ y: isMobile ? "100%" : 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: isMobile ? "100%" : 20, opacity: 0 }}
              onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: dv.paper, padding: isMobile ? "28px 20px" : 40, borderRadius: isMobile ? "16px 16px 0 0" : 0, border: `1px solid ${dv.cream}` }}>
              <div style={{ fontFamily: dv.serif, fontSize: 24, marginBottom: 24 }}>New Group</div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 }}>Group name</label>
                <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Tokyo Trip 2026..."
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "12px 0", fontFamily: dv.serif, fontSize: 22, color: dv.ink, outline: "none" }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <label style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe }}>
                    Add from companions
                  </label>
                  <span style={{ fontFamily: dv.mono, fontSize: 10, color: dv.stone }}>
                    {pendingMembers.length} selected
                  </span>
                </div>

                {/* Contact picker — toggle chips */}
                {contacts.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                    {contacts.map((c, i) => {
                      const selected = pendingMembers.some(pm => pm.email.toLowerCase() === c.email.toLowerCase());
                      return (
                        <div key={c.id}
                          onClick={() => {
                            setPendingMembers(prev => selected
                              ? prev.filter(pm => pm.email.toLowerCase() !== c.email.toLowerCase())
                              : [...prev, { email: c.email, name: c.display_name || "" }]);
                          }}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px 6px 6px",
                            background: selected ? CHIP_COLORS[i % 5] : "transparent",
                            color: selected ? "#F4F1EC" : dv.ink,
                            border: `1.5px solid ${selected ? "transparent" : `${dv.stone}40`}`,
                            borderRadius: 100, fontSize: 13, cursor: "pointer", userSelect: "none",
                            transition: "all 0.2s",
                          }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: selected ? "rgba(255,255,255,0.2)" : `${dv.stone}30`, color: selected ? "#F4F1EC" : dv.stone, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600 }}>
                            {initials(c.display_name || c.email)}
                          </div>
                          <span style={{ fontWeight: selected ? 500 : 400 }}>{c.display_name || handleLabel(c.email)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 12, margin: "4px 0 14px" }}>
                    No companions in your address book yet — add one inline below.
                  </p>
                )}

                {/* Inline entry — a name or an email */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <input placeholder="or add a name or email…" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key !== "Enter") return;
                      await addPendingMember(newMemberEmail);
                    }}
                    style={{ flex: 1, background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "10px 0", fontFamily: dv.sans, fontSize: 14, color: dv.ink, outline: "none" }} />
                  <button onClick={() => addPendingMember(newMemberEmail)}
                    style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: dv.ink, background: "none", border: "none", cursor: "pointer" }}>
                    + Add
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: dv.taupe, fontStyle: "italic", marginBottom: 20 }}>You'll be added automatically.</div>
              <button onClick={createGroup} disabled={loading || !newGroupName.trim()}
                style={{ width: "100%", padding: 18, background: dv.graphite, color: "#F4F1EC", border: "none", fontFamily: dv.serif, fontSize: 17, cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
                {loading ? "Creating..." : "Create group"} &#8594;
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
