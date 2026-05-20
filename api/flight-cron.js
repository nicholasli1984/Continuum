// ─────────────────────────────────────────────────────────────────────────
// Server-side flight notification cron.
//
// Runs on a schedule (Vercel Cron, or any external cron hitting this URL with
// ?secret=). Independent of whether the app is open. For every upcoming flight
// across all users it:
//   1. dedupes by flight (one AeroDataBox call serves everyone on that flight)
//   2. polls on a tiered cadence (rarely days out, often near departure)
//   3. sends a one-time "departs within 24h" reminder per user
//   4. sends push on status changes (gate / delay / cancel / boarding / landed)
//   5. tallies AeroDataBox calls per day so cost stays visible
//
// Delivery is WEB PUSH (the PWA subscription stored in push_subscriptions).
// Native App Store push (APNs) is a separate path, not wired here yet.
// ─────────────────────────────────────────────────────────────────────────

import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const AERO_KEY = (process.env.VITE_AERODATABOX_API_KEY || "").trim();
const VAPID_PUBLIC = (process.env.VITE_VAPID_PUBLIC_KEY || "").trim();
const VAPID_PRIVATE = (process.env.VAPID_PRIVATE_KEY || "").trim();
const CRON_SECRET = (process.env.CRON_SECRET || "").trim();

const normFn = (s) => (s || "").replace(/\s+/g, "").toUpperCase();

// Tiered polling: how many minutes between checks, by hours-until-departure.
// The cron itself fires every ~15 min; this gates how often we actually spend
// an API call on a given flight.
function checkIntervalMin(h) {
  if (h > 24) return 180;   // >1 day out: every 3h
  if (h > 6)  return 30;    // day-of-ish: every 30 min
  if (h > -3) return 15;    // ±window around departure: every run
  return 30;                // post-departure: every 30 min (catch landing + baggage belt)
}

// "BR51" → "BR 51" for display (space between airline code and number).
const prettyFn = (fn) => (fn || "").replace(/^([A-Z]+)(\d.*)$/, "$1 $2");

async function fetchStatus(fn, date, depAirport, arrAirport) {
  const resp = await fetch(`https://aerodatabox.p.rapidapi.com/flights/number/${fn}/${date}`, {
    headers: { "X-RapidAPI-Key": AERO_KEY, "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com" },
  });
  if (!resp.ok) return { error: `HTTP ${resp.status}` };
  const data = await resp.json();
  const fd = Array.isArray(data)
    ? (data.find(d => {
        const di = d?.departure?.airport?.iata || "", ai = d?.arrival?.airport?.iata || "";
        if (depAirport && di && di !== depAirport) return false;
        if (arrAirport && ai && ai !== arrAirport) return false;
        return true;
      }) || data[0])
    : data;
  if (!fd) return { error: "No data" };
  const dep = fd.departure || {}, arr = fd.arrival || {};
  return {
    status: fd.status || "Unknown",
    departureGate: dep.gate || null,
    departureTerminal: dep.terminal || null,
    departureDelay: dep.delay || 0,
    departureRevised: dep.revisedTimeLocal || null,
    arrivalAirport: arr.airport?.iata || "",
    baggageBelt: arr.baggageBelt || null,
  };
}

export default async function handler(req, res) {
  // ── Auth ── Vercel Cron sends "Authorization: Bearer <CRON_SECRET>".
  // Manual/external triggers can pass ?secret=<CRON_SECRET>. If no secret is
  // configured, allow (dev only).
  if (CRON_SECRET) {
    const auth = req.headers.authorization || "";
    const qs = req.query.secret || "";
    if (auth !== `Bearer ${CRON_SECRET}` && qs !== CRON_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }
  if (!AERO_KEY) return res.status(500).json({ error: "AeroDataBox key missing" });
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return res.status(500).json({ error: "VAPID keys missing" });

  webpush.setVapidDetails("mailto:notifications@gocontinuum.app", VAPID_PUBLIC, VAPID_PRIVATE);
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ── Debug helpers (only with a valid secret) ──
  // ?debugFlight=BR51/2026-05-31  → return AeroDataBox status, no DB writes/push
  if (req.query.debugFlight) {
    const [fn, date] = String(req.query.debugFlight).split("/");
    const status = await fetchStatus(normFn(fn), date, "", "");
    return res.json({ debugFlight: `${fn}/${date}`, status });
  }
  // ?debugSamples=<user_id>  → send one of each notification format so the
  // wording/layout can be reviewed on a real device. Unique tags so they stack.
  if (req.query.debugSamples) {
    const userId = String(req.query.debugSamples);
    const { data: row } = await supabase.from("push_subscriptions").select("subscription").eq("user_id", userId).maybeSingle();
    if (!row) return res.json({ sent: 0, reason: "no subscription stored for this user" });
    const subscription = typeof row.subscription === "string" ? JSON.parse(row.subscription) : row.subscription;
    const samples = [
      // Live now (new format: route in every flight alert)
      { tag: "s-24h",   title: "BR 51 departs within 24h", body: "JFK → TPE · Sat 1:25 AM" },
      { tag: "s-gate",  title: "Gate change — BR 51",      body: "JFK → TPE · Now Gate 42, Terminal 1 (was Gate 31)" },
      { tag: "s-board", title: "BR 51 is boarding",        body: "JFK → TPE · Gate 42" },
      { tag: "s-land",  title: "Landed — BR 51",           body: "JFK → TPE" },
      { tag: "s-bag",   title: "Baggage claim — BR 51",    body: "Carousel 7 · TPE" },
      // Previews (not wired yet — pending your go-ahead)
      { tag: "s-1h",    title: "BR 51 departs in 1 hour",  body: "JFK → TPE · Gate 31, Terminal 1" },
      { tag: "s-hotel", title: "Online check-in open — The Ritz-Carlton, Tokyo", body: "Check in now and head straight to your room." },
    ];
    let sent = 0;
    for (const s of samples) {
      try {
        await webpush.sendNotification(subscription, JSON.stringify({ title: s.title, body: s.body, icon: "/pwa-192x192.png", badge: "/pwa-64x64.png", data: { flightNumber: s.tag } }));
        sent++;
        await new Promise(r => setTimeout(r, 600)); // small gap so iOS shows them distinctly
      } catch (e) { /* skip */ }
    }
    return res.json({ debugSamples: userId, sent });
  }
  // ?debugSubs=1  → report whether push_subscriptions exists + row count
  if (req.query.debugSubs) {
    const { data, error, count } = await supabase.from("push_subscriptions").select("user_id", { count: "exact" });
    return res.json({ tableError: error?.message || null, count: count ?? (data?.length || 0), userIds: (data || []).map(d => d.user_id).slice(0, 20) });
  }
  // ?debugPush=<user_id>  → send one test push to that user's subscription
  if (req.query.debugPush) {
    const userId = String(req.query.debugPush);
    const { data: sub } = await supabase.from("push_subscriptions").select("subscription").eq("user_id", userId).maybeSingle();
    if (!sub) return res.json({ debugPush: userId, sent: false, reason: "no subscription stored for this user" });
    try {
      const subscription = typeof sub.subscription === "string" ? JSON.parse(sub.subscription) : sub.subscription;
      await webpush.sendNotification(subscription, JSON.stringify({ title: "Continuum test alert", body: "Flight notifications are working. ✈️", icon: "/pwa-192x192.png", badge: "/pwa-64x64.png", data: { test: true } }));
      return res.json({ debugPush: userId, sent: true });
    } catch (e) {
      return res.json({ debugPush: userId, sent: false, error: e.message, statusCode: e.statusCode });
    }
  }

  const now = new Date();
  // Track from 48h before departure to 26h after, so we still catch the
  // baggage belt (often assigned after arrival) even on long-haul flights.
  const windowStart = new Date(now.getTime() - 26 * 3600 * 1000);
  const windowEnd = new Date(now.getTime() + 48 * 3600 * 1000);

  // ── 1. Load all trips; extract upcoming flight segments; group by flight ──
  const { data: trips, error: tErr } = await supabase
    .from("trips")
    .select("user_id, segments, flight_number, date, departure_terminal");
  if (tErr) return res.status(500).json({ error: tErr.message });

  const flights = {}; // flight_key -> { fn, date, dep, arr, departAt, users:Set }
  const addSeg = (userId, fn0, date, dep, arr, depTime) => {
    const fn = normFn(fn0);
    if (!fn || !date) return;
    let departAt;
    const hhmm = (depTime || "").match(/(\d{1,2}):(\d{2})/);
    departAt = hhmm ? new Date(`${date}T${hhmm[1].padStart(2, "0")}:${hhmm[2]}:00`) : new Date(`${date}T12:00:00`);
    if (isNaN(departAt.getTime())) departAt = new Date(`${date}T12:00:00`);
    if (departAt < windowStart || departAt > windowEnd) return;
    const key = `${fn}_${date}`;
    if (!flights[key]) flights[key] = { fn, date, dep: dep || "", arr: arr || "", departAt, users: new Set() };
    if (userId) flights[key].users.add(userId);
  };

  for (const t of (trips || [])) {
    const segs = Array.isArray(t.segments) ? t.segments : [];
    if (segs.length) {
      segs.filter(s => !s._isMeta && s.type === "flight" && s.flightNumber && s.date)
        .forEach(s => addSeg(t.user_id, s.flightNumber, s.date, s.departureAirport, s.arrivalAirport, s.departureTime));
    } else if (t.flight_number && t.date) {
      addSeg(t.user_id, t.flight_number, t.date, "", "", null); // legacy single-segment trip
    }
  }

  const keys = Object.keys(flights);
  if (keys.length === 0) return res.json({ ok: true, flights: 0, checked: 0, apiCalls: 0, notifications: 0 });

  // ── 2. Load tracking rows + push subscriptions for everyone involved ──
  const { data: trackRows } = await supabase.from("flight_status_tracking").select("*").in("flight_key", keys);
  const track = {}; (trackRows || []).forEach(r => { track[r.flight_key] = r; });

  const allUsers = new Set();
  keys.forEach(k => flights[k].users.forEach(u => allUsers.add(u)));
  const { data: subs } = await supabase.from("push_subscriptions").select("user_id, subscription").in("user_id", [...allUsers]);
  const subByUser = {};
  (subs || []).forEach(s => { try { subByUser[s.user_id] = typeof s.subscription === "string" ? JSON.parse(s.subscription) : s.subscription; } catch {} });

  let apiCalls = 0, notifications = 0, checked = 0;
  // `tag` namespaces each event type per flight so distinct events persist
  // separately but repeated updates of the same event replace in place.
  const notify = async (userId, title, body, fnum, tag) => {
    const sub = subByUser[userId];
    if (!sub) return;
    try {
      await webpush.sendNotification(sub, JSON.stringify({ title, body, icon: "/pwa-192x192.png", badge: "/pwa-64x64.png", data: { flightNumber: fnum, tag: tag || fnum } }));
      notifications++;
    } catch (e) {
      if (e.statusCode === 410 || e.statusCode === 404) await supabase.from("push_subscriptions").delete().eq("user_id", userId);
    }
  };

  // ── 3. Per-flight processing ──
  for (const key of keys) {
    const f = flights[key];
    const tr = track[key] || { last_status: null, last_checked_at: null, reminded_users: [] };
    const hoursUntil = (f.departAt - now) / 3600000;
    const reminded = new Set(tr.reminded_users || []);

    const pf = prettyFn(f.fn);
    const route = f.dep && f.arr ? `${f.dep} → ${f.arr}` : (f.dep || f.arr || "");
    const withRoute = (s) => route ? (s ? `${route} · ${s}` : route) : s;

    // 24h departure reminder (per user, once)
    if (hoursUntil > 0 && hoursUntil <= 24) {
      const when = f.departAt.toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", hour12: true });
      for (const u of f.users) {
        if (!reminded.has(u)) {
          await notify(u, `${pf} departs within 24h`, withRoute(when), f.fn, `${f.fn}-24h`);
          reminded.add(u);
        }
      }
    }

    // Tiered polling — is a status check due?
    const lastChecked = tr.last_checked_at ? new Date(tr.last_checked_at) : null;
    const due = !lastChecked || (now - lastChecked) / 60000 >= checkIntervalMin(hoursUntil);

    let fresh = tr.last_status;
    if (due) {
      fresh = await fetchStatus(f.fn, f.date, f.dep, f.arr);
      apiCalls++; checked++;
      if (!fresh.error) {
        const old = tr.last_status || {};
        // Gate change (includes the previous gate when we have it)
        if (fresh.departureGate && fresh.departureGate !== old.departureGate) {
          const was = old.departureGate ? ` (was Gate ${old.departureGate})` : "";
          const term = fresh.departureTerminal ? `, Terminal ${fresh.departureTerminal}` : "";
          for (const u of f.users) await notify(u, `Gate change — ${pf}`, withRoute(`Now Gate ${fresh.departureGate}${term}${was}`), f.fn, `${f.fn}-gate`);
        }
        // Delay
        if (fresh.departureDelay > 15 && (old.departureDelay || 0) <= 15) {
          const rev = fresh.departureRevised ? `New departure ${fresh.departureRevised.split(" ").pop()?.replace(/[+-]\d{2}:\d{2}$/, "")}` : "";
          for (const u of f.users) await notify(u, `${pf} delayed ${fresh.departureDelay} min`, withRoute(rev), f.fn, `${f.fn}-delay`);
        }
        // Cancellation
        if (fresh.status === "Canceled" && old.status !== "Canceled")
          for (const u of f.users) await notify(u, `Cancelled — ${pf}`, withRoute("Contact your airline."), f.fn, `${f.fn}-cancel`);
        // Boarding
        if (fresh.status === "Boarding" && old.status !== "Boarding")
          for (const u of f.users) await notify(u, `${pf} is boarding`, withRoute(fresh.departureGate ? `Gate ${fresh.departureGate}` : ""), f.fn, `${f.fn}-board`);
        // Landed
        if (fresh.status === "Arrived" && old.status !== "Arrived")
          for (const u of f.users) await notify(u, `Landed — ${pf}`, withRoute(""), f.fn, `${f.fn}-landed`);
        // Baggage claim — the belt is often assigned after the Arrived status,
        // so this is its own event, fired when the carousel number appears.
        if (fresh.baggageBelt && fresh.baggageBelt !== old.baggageBelt)
          for (const u of f.users) await notify(u, `Baggage claim — ${pf}`, `Carousel ${fresh.baggageBelt}${f.arr ? ` · ${f.arr}` : ""}`, f.fn, `${f.fn}-baggage`);
      }
    }

    await supabase.from("flight_status_tracking").upsert({
      flight_key: key,
      last_status: fresh && !fresh.error ? fresh : (tr.last_status || null),
      last_checked_at: due ? now.toISOString() : (tr.last_checked_at || null),
      reminded_users: [...reminded],
      updated_at: now.toISOString(),
    }, { onConflict: "flight_key" });
  }

  // ── 4. Record API usage for the day ──
  if (apiCalls > 0) {
    const day = now.toISOString().slice(0, 10);
    const { data: usage } = await supabase.from("api_usage_daily").select("aerodatabox_calls").eq("day", day).maybeSingle();
    await supabase.from("api_usage_daily").upsert(
      { day, aerodatabox_calls: (usage?.aerodatabox_calls || 0) + apiCalls, updated_at: now.toISOString() },
      { onConflict: "day" }
    );
  }

  return res.json({ ok: true, flights: keys.length, checked, apiCalls, notifications });
}
