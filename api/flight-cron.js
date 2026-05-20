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
  if (h > 2)  return 15;    // 2–6h out: every 15 min
  if (h > -2) return 5;     // ±2h around departure: every 5 min (fast gate/delay/boarding)
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
  // AeroDataBox's local scheduled time carries the airport's UTC offset
  // (e.g. "2026-05-31 18:00-04:00"), so it gives both the correct absolute
  // instant (schedUtc) and the local time to display (schedLocal).
  const schedLocalRaw = dep.scheduledTime?.local || dep.scheduledTimeLocal || null;
  let schedUtc = null;
  if (schedLocalRaw) { const d = new Date(String(schedLocalRaw).replace(" ", "T")); if (!isNaN(d.getTime())) schedUtc = d.toISOString(); }
  return {
    status: fd.status || "Unknown",
    departureGate: dep.gate || null,
    departureTerminal: dep.terminal || null,
    departureDelay: dep.delay || 0,
    departureRevised: dep.revisedTimeLocal || null,
    arrivalAirport: arr.airport?.iata || "",
    arrivalDelay: arr.delay || 0,
    baggageBelt: arr.baggageBelt || null,
    schedLocal: schedLocalRaw,
    schedUtc,
  };
}

// Format an AeroDataBox local time string ("2026-05-31 18:00-04:00") as the
// airport's local clock time, e.g. "Sat 6:00 PM" — without the server's
// timezone shifting it.
function fmtLocal(localStr) {
  const m = String(localStr || "").match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return "";
  const [, y, mo, d, hh, mm] = m;
  const weekday = new Date(Date.UTC(+y, +mo - 1, +d, +hh, +mm)).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  let h = +hh; const ampm = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
  return `${weekday} ${h}:${mm} ${ampm}`;
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
      { tag: "s-3h",    title: "BR 51 departs in 3 hours", body: "JFK → TPE · Sat 6:00 PM · Time to head to the airport" },
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

  // Hotels — fire a one-time "online check-in open" reminder ~24h before
  // check-in. No flight API involved, so this is free.
  const hotels = {}; // hotel_key -> { name, checkinAt, users:Set }
  const addHotel = (userId, name, date) => {
    if (!name || !date) return;
    const checkinAt = new Date(`${date}T15:00:00`); // hotels check in ~3pm local
    if (isNaN(checkinAt.getTime())) return;
    if (checkinAt < new Date(now.getTime() - 2 * 3600 * 1000) || checkinAt > windowEnd) return;
    const key = `H_${userId}_${date}_${String(name).slice(0, 24)}`;
    if (!hotels[key]) hotels[key] = { name, checkinAt, users: new Set() };
    if (userId) hotels[key].users.add(userId);
  };

  // Connections — consecutive flights meeting at the same airport with a short
  // layover, so we can warn about tight connections (and ones a delay puts at
  // risk). Times at one connecting airport share a timezone, so the gap math is
  // offset-independent.
  const connections = {}; // conn_key -> { userId, aFn, bFn, airport, scheduledGap, aKey }
  const tMs = (date, timeStr) => { const m = (timeStr || "").match(/(\d{1,2}):(\d{2})/); if (!m || !date) return null; const d = new Date(`${date}T${m[1].padStart(2, "0")}:${m[2]}:00Z`); return isNaN(d.getTime()) ? null : d.getTime(); };
  const addConnections = (userId, fs) => {
    for (let i = 0; i < fs.length - 1; i++) {
      const A = fs[i], B = fs[i + 1];
      if (!A.arr || !B.dep || A.arr !== B.dep || !A.arrTime || !B.depTime) continue;
      const aDep = tMs(A.date, A.depTime); let aArr = tMs(A.date, A.arrTime); const bDep = tMs(B.date, B.depTime);
      if (aArr == null || bDep == null) continue;
      if (aDep != null && aArr < aDep) aArr += 86400000; // arrival past midnight
      const gap = Math.round((bDep - aArr) / 60000);
      if (gap <= 0 || gap > 300) continue; // overnight stay / bad data — not a connection
      const aKey = `${normFn(A.fn)}_${A.date}`;
      connections[`C_${userId}_${aKey}_${normFn(B.fn)}`] = { userId, aFn: normFn(A.fn), bFn: normFn(B.fn), airport: A.arr, scheduledGap: gap, aKey };
    }
  };

  for (const t of (trips || [])) {
    const segs = Array.isArray(t.segments) ? t.segments : [];
    if (segs.length) {
      const fseg = [];
      segs.forEach(s => {
        if (s._isMeta) return;
        if (s.type === "flight" && s.flightNumber && s.date) {
          addSeg(t.user_id, s.flightNumber, s.date, s.departureAirport, s.arrivalAirport, s.departureTime);
          fseg.push({ fn: s.flightNumber, date: s.date, dep: s.departureAirport, arr: s.arrivalAirport, depTime: s.departureTime, arrTime: s.arrivalTime });
        }
        if (s.type === "hotel") addHotel(t.user_id, s.property || s.propertyName || s.location || s.name || "your hotel", s.date);
      });
      fseg.sort((a, b) => `${a.date} ${a.depTime || ""}`.localeCompare(`${b.date} ${b.depTime || ""}`));
      addConnections(t.user_id, fseg);
    } else if (t.flight_number && t.date) {
      addSeg(t.user_id, t.flight_number, t.date, "", "", null); // legacy single-segment trip
    }
  }

  const keys = Object.keys(flights);
  const hotelKeys = Object.keys(hotels);
  const connKeys = Object.keys(connections);
  if (keys.length === 0 && hotelKeys.length === 0) return res.json({ ok: true, flights: 0, hotels: 0, connections: 0, checked: 0, apiCalls: 0, notifications: 0 });

  // ── 2. Load tracking rows + push subscriptions for everyone involved ──
  const allKeys = [...keys, ...hotelKeys, ...connKeys];
  const { data: trackRows } = await supabase.from("flight_status_tracking").select("*").in("flight_key", allKeys);
  const track = {}; (trackRows || []).forEach(r => { track[r.flight_key] = r; });
  // reminded_users may be a legacy flat array (24h only) or the keyed object.
  const remindersOf = (tr) => { const r = tr?.reminded_users; if (Array.isArray(r)) return { "24h": r }; return (r && typeof r === "object") ? r : {}; };

  const allUsers = new Set();
  keys.forEach(k => flights[k].users.forEach(u => allUsers.add(u)));
  hotelKeys.forEach(k => hotels[k].users.forEach(u => allUsers.add(u)));
  connKeys.forEach(k => allUsers.add(connections[k].userId));
  const { data: subs } = await supabase.from("push_subscriptions").select("user_id, subscription").in("user_id", [...allUsers]);
  const subByUser = {};
  (subs || []).forEach(s => { try { subByUser[s.user_id] = typeof s.subscription === "string" ? JSON.parse(s.subscription) : s.subscription; } catch {} });

  let apiCalls = 0, notifications = 0, checked = 0;
  const statusByKey = {}; // flight_key -> latest known status (for connection alerts)
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
    const tr = track[key] || { last_status: null, last_checked_at: null, reminded_users: {} };
    // Prefer AeroDataBox's scheduled time (carries the correct UTC offset) over
    // the naive trip time for all timing. Falls back to the trip time until the
    // flight has been polled once.
    const schedFromTrack = tr.last_status?.schedUtc ? new Date(tr.last_status.schedUtc) : null;
    let departAt = (schedFromTrack && !isNaN(schedFromTrack.getTime())) ? schedFromTrack : f.departAt;
    let schedLocal = tr.last_status?.schedLocal || null;
    let hoursUntil = (departAt - now) / 3600000;
    const reminders = remindersOf(tr); // { "48h":[uid], "24h":[...], "1h":[...] }

    const pf = prettyFn(f.fn);
    const route = f.dep && f.arr ? `${f.dep} → ${f.arr}` : (f.dep || f.arr || "");
    const withRoute = (s) => route ? (s ? `${route} · ${s}` : route) : s;
    // Send a one-time reminder for a given band (per user).
    const sendBand = async (band, title, body) => {
      reminders[band] = reminders[band] || [];
      for (const u of f.users) {
        if (!reminders[band].includes(u)) { await notify(u, title, body, f.fn, `${f.fn}-${band}`); reminders[band].push(u); }
      }
    };

    // Tiered polling — is a status check due?
    const lastChecked = tr.last_checked_at ? new Date(tr.last_checked_at) : null;
    const due = !lastChecked || (now - lastChecked) / 60000 >= checkIntervalMin(hoursUntil);

    let fresh = tr.last_status;
    if (due) {
      fresh = await fetchStatus(f.fn, f.date, f.dep, f.arr);
      apiCalls++; checked++;
      if (!fresh.error) {
        const old = tr.last_status || {};
        // Refine timing from AeroDataBox's scheduled time (correct timezone)
        if (fresh.schedUtc) { const acc = new Date(fresh.schedUtc); if (!isNaN(acc.getTime())) { departAt = acc; hoursUntil = (acc - now) / 3600000; } }
        if (fresh.schedLocal) schedLocal = fresh.schedLocal;
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

    // ── Departure reminders (each band fires once per user) ──
    const lastKnown = (fresh && !fresh.error) ? fresh : (tr.last_status || {});
    // Show the airport's local departure time when we have it, else the naive trip time.
    const depWhen = schedLocal ? fmtLocal(schedLocal) : f.departAt.toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", hour12: true });
    const gateInfo = lastKnown.departureGate ? `Gate ${lastKnown.departureGate}${lastKnown.departureTerminal ? `, Terminal ${lastKnown.departureTerminal}` : ""}` : "";
    if (hoursUntil > 24 && hoursUntil <= 48) await sendBand("48h", `${pf} departs in 48 hours`, withRoute(depWhen));
    else if (hoursUntil > 3 && hoursUntil <= 24) await sendBand("24h", `${pf} departs within 24h`, withRoute(depWhen));
    else if (hoursUntil > 0 && hoursUntil <= 3) await sendBand("3h", `${pf} departs in 3 hours`, withRoute(`${depWhen}${gateInfo ? ` · ${gateInfo}` : ""} · Time to head to the airport`));

    statusByKey[key] = (fresh && !fresh.error) ? fresh : (tr.last_status || null);
    await supabase.from("flight_status_tracking").upsert({
      flight_key: key,
      last_status: fresh && !fresh.error ? fresh : (tr.last_status || null),
      last_checked_at: due ? now.toISOString() : (tr.last_checked_at || null),
      reminded_users: reminders,
      updated_at: now.toISOString(),
    }, { onConflict: "flight_key" });
  }

  // ── 3b. Per-hotel processing — one-time "check-in open" reminder, no API ──
  for (const key of hotelKeys) {
    const h = hotels[key];
    const tr = track[key] || { reminded_users: {} };
    const reminders = remindersOf(tr);
    const hoursToCheckin = (h.checkinAt - now) / 3600000;
    if (hoursToCheckin > 0 && hoursToCheckin <= 24) {
      reminders["checkin"] = reminders["checkin"] || [];
      for (const u of h.users) {
        if (!reminders["checkin"].includes(u)) {
          await notify(u, `Online check-in open — ${h.name}`, "Check in now and head straight to your room.", null, `${key}-checkin`);
          reminders["checkin"].push(u);
        }
      }
    }
    await supabase.from("flight_status_tracking").upsert({ flight_key: key, reminded_users: reminders, updated_at: now.toISOString() }, { onConflict: "flight_key" });
  }

  // ── 3c. Connection alerts — tight-connection heads-up + delay-at-risk ──
  for (const ckey of connKeys) {
    const c = connections[ckey];
    const aFlight = flights[c.aKey];
    if (!aFlight) continue; // inbound flight not in the window yet
    const tr = track[ckey] || { reminded_users: {} };
    const reminders = remindersOf(tr);
    const aStatus = statusByKey[c.aKey] || {};
    const aDepartAt = aStatus.schedUtc ? new Date(aStatus.schedUtc) : aFlight.departAt;
    const hoursUntilA = (aDepartAt - now) / 3600000;
    const arrDelay = aStatus.arrivalDelay || 0;
    const revisedGap = c.scheduledGap - arrDelay;
    const pfA = prettyFn(c.aFn), pfB = prettyFn(c.bFn);

    // Heads-up: a scheduled tight connection, once, within 24h of the inbound.
    if (c.scheduledGap < 90 && hoursUntilA > 0 && hoursUntilA <= 24) {
      reminders["conn"] = reminders["conn"] || [];
      if (!reminders["conn"].includes(c.userId)) {
        await notify(c.userId, `Tight connection at ${c.airport}`, `${c.scheduledGap} min between ${pfA} and ${pfB}. We'll watch it.`, null, `${ckey}-conn`);
        reminders["conn"].push(c.userId);
      }
    }
    // At-risk: the inbound is running late enough to threaten the connection, once.
    if (arrDelay > 0 && revisedGap < 45 && revisedGap < c.scheduledGap) {
      reminders["risk"] = reminders["risk"] || [];
      if (!reminders["risk"].includes(c.userId)) {
        await notify(c.userId, `Connection at risk — ${c.airport}`, `${pfA} running ~${arrDelay} min late · about ${Math.max(0, revisedGap)} min to make ${pfB}.`, null, `${ckey}-risk`);
        reminders["risk"].push(c.userId);
      }
    }
    await supabase.from("flight_status_tracking").upsert({ flight_key: ckey, reminded_users: reminders, updated_at: now.toISOString() }, { onConflict: "flight_key" });
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

  return res.json({ ok: true, flights: keys.length, hotels: hotelKeys.length, connections: connKeys.length, checked, apiCalls, notifications });
}
