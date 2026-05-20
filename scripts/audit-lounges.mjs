// ─────────────────────────────────────────────────────────────────────────
// Lounge data audit — internal-consistency checker.
//
// The lounge feature is a chain of four datasets:
//   airline → terminal(s)            (airlineTerminals.js)
//   terminal → reachable terminals   (airportConnectivity.js)
//   terminal → lounges               (lounges.js)
//   lounge network → who gets in     (CARD/ELITE/ALLIANCE access maps)
//
// A wrong link anywhere silently breaks access. This script walks the whole
// chain and reports every internal contradiction — for free, repeatably, with
// no external source — so ground-truth review can focus only on what's flagged.
//
// Usage:
//   node scripts/audit-lounges.mjs                 # full issue report
//   node scripts/audit-lounges.mjs --matrix JFK    # airline→lounge table for one airport
//   node scripts/audit-lounges.mjs --matrix        # …for every airport
// ─────────────────────────────────────────────────────────────────────────

import {
  LOUNGE_DATABASE,
  CARD_LOUNGE_ACCESS,
  ELITE_LOUNGE_ACCESS,
  ALLIANCE_LOUNGE_ACCESS,
} from "../src/constants/lounges.js";
import {
  AIRLINE_TERMINAL_AT_AIRPORT,
  normalizeTerminal,
  getAirlineTerminals,
} from "../src/constants/airlineTerminals.js";
import {
  POST_SECURITY_TERMINAL_GROUPS,
  expandToReachableTerminals,
} from "../src/constants/airportConnectivity.js";
import { LOYALTY_PROGRAMS } from "../src/constants/programs.js";

const arg = process.argv.slice(2);
const reconcileMode = arg.includes("--reconcile");
const matrixMode = arg.includes("--matrix");
const matrixAirport = (() => {
  const i = arg.indexOf("--matrix");
  const next = i >= 0 ? arg[i + 1] : null;
  return next && !next.startsWith("--") ? next.toUpperCase() : null;
})();

const norm = (t) => normalizeTerminal(t);
const uniq = (a) => [...new Set(a)];

// ── Reference sets ────────────────────────────────────────────────────────
const airlineIds = new Set(LOYALTY_PROGRAMS.airlines.map((a) => a.id));
const cardIds = new Set(LOYALTY_PROGRAMS.creditCards.map((c) => c.id));

const cardNetworks = new Set();
for (const rules of Object.values(CARD_LOUNGE_ACCESS)) for (const r of rules) cardNetworks.add(r.network);

const eliteNetworks = new Set();
for (const prog of Object.values(ELITE_LOUNGE_ACCESS))
  for (const tier of Object.values(prog.tiers || {}))
    for (const r of tier.lounges || []) eliteNetworks.add(r.network);

const allianceNetworks = new Set();
for (const alliance of Object.values(ALLIANCE_LOUNGE_ACCESS))
  for (const level of Object.values(alliance))
    for (const r of level.lounges || []) (r.networkTypes || []).forEach((n) => allianceNetworks.add(n));

const grantedNetworks = new Set([...cardNetworks, ...eliteNetworks, ...allianceNetworks]);

const loungeNetworks = new Set();
for (const lounges of Object.values(LOUNGE_DATABASE)) for (const l of lounges) loungeNetworks.add(l.network);

// ── Issue collector ───────────────────────────────────────────────────────
const issues = { critical: [], warning: [], info: [] };
const add = (sev, code, msg) => issues[sev].push({ code, msg });

// ── A. Network reachability (global) ──────────────────────────────────────
for (const n of loungeNetworks) {
  if (!grantedNetworks.has(n)) {
    const where = [];
    for (const [ap, lounges] of Object.entries(LOUNGE_DATABASE))
      for (const l of lounges) if (l.network === n) where.push(`${ap}:${l.name}`);
    add("critical", "UNREACHABLE_NETWORK",
      `network "${n}" appears on ${where.length} lounge(s) but NO access rule ever grants it — nobody can be told they can enter. e.g. ${where.slice(0, 3).join(", ")}`);
  }
}
for (const n of grantedNetworks) {
  if (!loungeNetworks.has(n)) {
    const src = [];
    if (cardNetworks.has(n)) src.push("card");
    if (eliteNetworks.has(n)) src.push("elite");
    if (allianceNetworks.has(n)) src.push("alliance");
    add("warning", "DEAD_RULE",
      `network "${n}" is granted by ${src.join("/")} rules but no lounge in the DB has it — the rule can never match.`);
  }
}

// ── B. ID validity ────────────────────────────────────────────────────────
for (const ap of Object.keys(AIRLINE_TERMINAL_AT_AIRPORT))
  for (const id of Object.keys(AIRLINE_TERMINAL_AT_AIRPORT[ap]))
    if (!airlineIds.has(id)) add("warning", "BAD_AIRLINE_ID", `${ap}: airline id "${id}" not in LOYALTY_PROGRAMS.airlines — terminal lookup will silently fall back to "show all".`);
for (const id of Object.keys(CARD_LOUNGE_ACCESS))
  if (!cardIds.has(id)) add("warning", "BAD_CARD_ID", `CARD_LOUNGE_ACCESS card id "${id}" not in LOYALTY_PROGRAMS.creditCards.`);
for (const id of Object.keys(ELITE_LOUNGE_ACCESS))
  if (!airlineIds.has(id)) add("warning", "BAD_ELITE_ID", `ELITE_LOUNGE_ACCESS program id "${id}" not in LOYALTY_PROGRAMS.airlines.`);

// ── C/D/E. Per-airport chain checks ───────────────────────────────────────
const airports = uniq([...Object.keys(LOUNGE_DATABASE), ...Object.keys(AIRLINE_TERMINAL_AT_AIRPORT)]).sort();

for (const ap of airports) {
  const lounges = LOUNGE_DATABASE[ap] || [];
  const airlineMap = AIRLINE_TERMINAL_AT_AIRPORT[ap] || {};
  const groups = POST_SECURITY_TERMINAL_GROUPS[ap] || [];

  // F. Coverage gaps
  if (lounges.length && !Object.keys(airlineMap).length)
    add("info", "NO_AIRLINE_DATA", `${ap}: has ${lounges.length} lounge(s) but no airline→terminal data — cannot terminal-filter, shows everything.`);
  if (!lounges.length && Object.keys(airlineMap).length)
    add("info", "NO_LOUNGE_DATA", `${ap}: has airline→terminal data but no lounges in the DB.`);
  if (!lounges.length) continue;

  const loungeTerminals = uniq(lounges.map((l) => norm(l.terminal)).filter(Boolean));
  const airlineTerminals = uniq(Object.values(airlineMap).flat().map(norm).filter(Boolean));
  const connectivityTerminals = uniq(groups.flat().map(norm).filter(Boolean));

  // ── Terminal-vocabulary reconciliation (the headline check) ──
  // lounges.js and airlineTerminals.js must speak the SAME terminal labels at
  // each airport, or airline→terminal→lounge never connects. Zero overlap =
  // the airport's whole lounge filter is broken.
  if (loungeTerminals.length && airlineTerminals.length) {
    // Reachability-based: a lounge "connects" if any airline's terminal reaches
    // it post-security (so airside-linked concourses with different labels count).
    const reachAir = expandToReachableTerminals(ap, airlineTerminals);
    const shared = loungeTerminals.filter((t) => reachAir.includes(t));
    if (shared.length === 0)
      add("critical", "VOCAB_DISJOINT",
        `${ap}: lounge terminals [${loungeTerminals.join(",")}] and airline-reachable terminals [${reachAir.join(",")}] share NOTHING — terminal filtering shows zero lounges for every airline here.`);
    else {
      const loungeUnreached = loungeTerminals.filter((t) => !reachAir.includes(t));
      if (loungeUnreached.length)
        add("warning", "VOCAB_PARTIAL",
          `${ap}: some lounge terminals aren't reachable from any airline — unreached [${loungeUnreached.join(",")}], shared [${shared.join(",")}].`);
    }
  }

  // C. Connectivity labels that match nothing real at this airport (stale label)
  for (const t of connectivityTerminals)
    if (!loungeTerminals.includes(t) && !airlineTerminals.includes(t))
      add("warning", "STALE_CONNECTIVITY_LABEL", `${ap}: connectivity group references terminal "${t}" that no lounge or airline uses — likely a stale/typo label.`);

  // D. Orphan lounge: terminal no airline serves AND not in any connectivity group
  const reachableFromAirlines = expandToReachableTerminals(ap, airlineTerminals);
  if (airlineTerminals.length) {
    for (const l of lounges) {
      const lt = norm(l.terminal);
      if (!lt) continue;
      if (!reachableFromAirlines.includes(lt) && !connectivityTerminals.includes(lt))
        add("warning", "ORPHAN_LOUNGE", `${ap}: lounge "${l.name}" is in terminal "${l.terminal}" which no tracked airline departs from and isn't airside-connected — verify the terminal.`);
    }
  }

  // E. Airline with zero reachable lounges (data probably missing somewhere)
  for (const id of Object.keys(airlineMap)) {
    if (!airlineIds.has(id)) continue;
    const dep = getAirlineTerminals(ap, id);
    if (!dep.length) continue;
    const reach = expandToReachableTerminals(ap, dep);
    const reachable = lounges.filter((l) => reach.includes(norm(l.terminal)));
    const cardReachable = reachable.filter((l) => cardNetworks.has(l.network));
    if (reachable.length === 0)
      add("info", "AIRLINE_NO_LOUNGE", `${ap}/${id}: departs ${dep.join(",")} (reaches ${reach.join(",") || "—"}) but zero lounges reachable there.`);
    else if (cardReachable.length === 0)
      add("info", "AIRLINE_NO_CARD_LOUNGE", `${ap}/${id}: departs ${dep.join(",")} — ${reachable.length} lounge(s) reachable but none are credit-card lounges.`);
  }
}

// ── Reconcile mode: dump every disjoint airport's lounge vs airline labels ──
if (reconcileMode) {
  const disjoint = issues.critical.filter((i) => i.code === "VOCAB_DISJOINT").map((i) => i.msg.split(":")[0]);
  console.log(`${disjoint.length} airports need terminal-vocabulary reconciliation:\n`);
  for (const ap of disjoint) {
    const lounges = LOUNGE_DATABASE[ap] || [];
    const airlineMap = AIRLINE_TERMINAL_AT_AIRPORT[ap] || {};
    // airline label -> [airline ids]
    const byTerm = {};
    for (const [id, terms] of Object.entries(airlineMap))
      for (const t of terms.map(norm)) (byTerm[t] ||= []).push(id);
    console.log(`══ ${ap} ══`);
    console.log(`  AIRLINE labels (target vocab):`);
    for (const [t, ids] of Object.entries(byTerm)) console.log(`     [${t}] ← ${ids.join(", ")}`);
    console.log(`  LOUNGES (name | current terminal | location):`);
    for (const l of lounges) console.log(`     • ${l.name}  |  "${l.terminal}"  |  ${l.location || "—"}`);
    console.log("");
  }
  process.exit(0);
}

// ── Matrix mode: airline → reachable (card) lounges ───────────────────────
if (matrixMode) {
  const targets = matrixAirport ? [matrixAirport] : Object.keys(LOUNGE_DATABASE).sort();
  for (const ap of targets) {
    const lounges = LOUNGE_DATABASE[ap] || [];
    const airlineMap = AIRLINE_TERMINAL_AT_AIRPORT[ap] || {};
    if (!lounges.length) { console.log(`\n${ap}: (no lounges in DB)`); continue; }
    console.log(`\n══ ${ap} ══  ${lounges.length} lounges across terminals [${uniq(lounges.map(l=>norm(l.terminal))).join(", ")}]`);
    const ids = Object.keys(airlineMap).filter((id) => airlineIds.has(id)).sort();
    if (!ids.length) { console.log("   (no airline→terminal data — would show all lounges)"); continue; }
    for (const id of ids) {
      const dep = getAirlineTerminals(ap, id);
      const reach = expandToReachableTerminals(ap, dep);
      const reachable = lounges.filter((l) => reach.includes(norm(l.terminal)));
      const cards = reachable.filter((l) => cardNetworks.has(l.network));
      const name = LOYALTY_PROGRAMS.airlines.find((a) => a.id === id)?.name || id;
      console.log(`   ${id.padEnd(14)} dep[${dep.join(",")}] reach[${reach.join(",")}]  →  ${reachable.length} lounges, ${cards.length} card: ${cards.map(c=>c.name).join(" | ") || "—"}`);
    }
  }
  process.exit(0);
}

// ── Report ────────────────────────────────────────────────────────────────
const byCode = (list) => {
  const m = {};
  for (const it of list) (m[it.code] ||= []).push(it.msg);
  return m;
};
const section = (title, list) => {
  console.log(`\n${title} — ${list.length}`);
  const grouped = byCode(list);
  for (const [code, msgs] of Object.entries(grouped)) {
    console.log(`  [${code}] × ${msgs.length}`);
    for (const m of msgs.slice(0, 40)) console.log(`     • ${m}`);
    if (msgs.length > 40) console.log(`     … +${msgs.length - 40} more`);
  }
};

console.log("LOUNGE DATA AUDIT");
console.log("=".repeat(70));
console.log(`airports: ${Object.keys(LOUNGE_DATABASE).length} with lounges, ${Object.keys(AIRLINE_TERMINAL_AT_AIRPORT).length} with airline→terminal data`);
console.log(`lounge networks: ${loungeNetworks.size} · granted by rules: ${grantedNetworks.size} (card ${cardNetworks.size}, elite ${eliteNetworks.size}, alliance ${allianceNetworks.size})`);
section("CRITICAL", issues.critical);
section("WARNING", issues.warning);
section("INFO", issues.info);
console.log(`\nTotal: ${issues.critical.length} critical, ${issues.warning.length} warning, ${issues.info.length} info`);
