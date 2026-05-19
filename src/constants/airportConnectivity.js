// Post-security (airside) terminal connectivity at major airports.
//
// At many large airports, multiple terminals are reachable from each other
// AFTER clearing security — via airside trains (ATL Plane Train, DFW Skylink,
// DEN concourse train), airside walkways (LAX TBIT→T4, SFO continuous loop,
// SLC tunnels), or airside shuttle buses (MUC, SIN T4, PTY). At those
// airports, the lounge list should NOT be restricted to the user's exact
// terminal — they can physically reach lounges in any terminal in the same
// airside cluster.
//
// At many other large airports — JFK, EWR, FRA, NRT, ICN, MEX (partially),
// YYZ — terminals are NOT airside-connected. People movers exist but are
// landside (must exit security, ride, re-clear security). Those airports
// should keep the strict terminal filter.
//
// Data principle: only encode connections confirmed by at least one official
// airport authority source or two reliable secondary sources. False positives
// (claiming a connection that doesn't exist) send users on a wild-goose chase;
// false negatives just under-show lounges. When uncertain, omit.
//
// Labels in each group are matched against lounges.js / airlineTerminals.js
// after `normalizeTerminal()` is applied to both sides — so "T1" and "1"
// resolve the same. Keep labels in the form they appear in the lounge
// database so the data is easy to eyeball.
//
// Last verified: 2026-05.

export const POST_SECURITY_TERMINAL_GROUPS = {
  // ── Amsterdam Schiphol ──
  // Single central terminal with a continuous airside spine across piers B/C/D
  // (Schengen) and E/F/G (non-Schengen). Passport control between Schengen and
  // non-Schengen is not a re-security event.
  AMS: [["3", "2", "Non-Schengen"]],

  // ── Atlanta Hartsfield-Jackson ──
  // Plane Train (underground people mover) + parallel pedestrian Transportation
  // Mall connect all concourses post-security, 24/7.
  ATL: [["T", "A", "B", "C", "D", "E", "F"]],

  // ── Nashville ──
  // Single central checkpoint with post-security walkways to all concourses.
  BNA: [["Main", "A", "B", "C", "D"]],

  // ── Boston Logan ──
  // Terminal B–C Connector (opened 2022) extends airside to Terminal E. Terminal
  // A is a Delta-only building with no airside link to B/C/E.
  BOS: [["B", "C", "E"]],

  // ── Paris CDG ──
  // T2E and T2F have an airside walkway and the internal LISA shuttle reaches
  // satellites S3/S4 from T2E. T1 ↔ T2 and T2A/B/C/D ↔ T2E/F airside transfers
  // exist only inside the non-Schengen transit zone, so we conservatively only
  // group the high-confidence walkable pair.
  CDG: [["T2E", "T2F"]],

  // ── Charlotte Douglas ──
  // Central atrium with post-security pedestrian walkways linking concourses
  // A–E. No train; all on foot.
  CLT: [["A", "B", "C", "D", "E"]],

  // ── Denver ──
  // Underground Concourse Train connects A/B/C airside; A also reachable via
  // the post-security A-Bridge walkway.
  DEN: [["A", "B", "C"]],

  // ── Dallas-Fort Worth ──
  // Skylink airside automated people mover connects all five terminals plus
  // adjacent terminals are walkable airside.
  DFW: [["A", "B", "C", "D", "E"]],

  // ── Dublin ──
  // T1 and T2 share a common post-security area connected by climate-controlled
  // corridors. US Preclearance at T2 doesn't break airside continuity.
  DUB: [["T1", "T2"]],

  // ── Dubai International ──
  // T1 and T3 share an airside transit area. T2 (low-cost, opposite side of
  // airfield) requires landside transfer and is not in this group.
  DXB: [["T1", "T3"]],

  // ── Rome Fiumicino ──
  // T1 and T3 connected by an airside covered walkway + free airside shuttle.
  FCO: [["T1", "T3"]],

  // ── Washington Dulles ──
  // AeroTrain underground people mover connects Main Terminal to concourses
  // A, B, C, D airside. International gates ("Int'l" in our DB) are on C/D
  // and reached via the same train.
  IAD: [["Main", "A", "B", "C", "D", "Int'l"]],

  // ── Houston Bush Intercontinental ──
  // Skyway (elevated) + Subway (underground) airside people movers connect all
  // five terminals.
  IAH: [["A", "B", "C", "D", "E"]],

  // ── Istanbul ──
  // Single mega-terminal. International and domestic concourses share airside
  // with passport control (not re-security) between them.
  IST: [["Int'l", "Dom"]],

  // ── Johannesburg OR Tambo ──
  // Single integrated terminal; international (Terminal A) and domestic
  // (Terminal B/C) are airside-walkable, separated only by immigration.
  JNB: [["Int'l", "Dom"]],

  // ── Los Angeles LAX ──
  // T3, T4, T5, T6, T7, T8, and TBIT are all airside-connected since the 2018
  // TBIT–T4 connector and 2024 TBIT–T3 link. Underground tunnels handle
  // T4–T6; above-ground walkways handle T6–T8. T1 and T2 are NOT in this
  // cluster (still landside-only). T5 is closed for demolition through 2028
  // but kept here as a label since the DB still references it.
  LAX: [["T3", "TBIT", "T4", "T5", "T6", "T7", "T8"]],

  // ── London Heathrow ──
  // T2 and T3 connected post-security by a moving-walkway tunnel (~8-10 min).
  // T4 and T5 have no airside walking path; the "Flight Connections" buses
  // for ticketed connecting pax are not a general airside path.
  LHR: [["T2", "T3"]],

  // ── Madrid Barajas ──
  // T4 and T4S satellite connected by an underground APM (24/7, airside).
  // T1/T2/T3 form a separate older complex with no airside link to T4.
  MAD: [["T4", "T4S"]],

  // ── Mexico City Benito Juárez ──
  // Aerotrén airside automated people mover (boarding pass required, 5am–11pm)
  // connects T1 and T2.
  MEX: [["T1", "T2"]],

  // ── Miami International ──
  // Concourses D–E and H–J are each airside-connected, but the North Terminal
  // (Concourse D area, labeled "N" in our DB) is NOT airside-connected to
  // Concourse J. So N and J are in DIFFERENT clusters and stay separate.
  // Encoded explicitly here for clarity (no cross-cluster grouping).
  MIA: [["N", "D", "E", "F", "G"], ["H", "J"]],

  // ── Minneapolis-Saint Paul ──
  // Terminal 1 (Lindbergh) has concourses A–G all airside-connected via the
  // central terminal. Terminal 2 (Humphrey) is 3 miles away with no airside
  // link to T1.
  MSP: [["1-A", "1-B", "1-C", "1-D", "1-E", "1-F", "1-G"]],

  // ── Munich ──
  // T1 and T2 connected airside by a shuttle bus (every 10-20 min) running
  // between dedicated airside gates. The MAC pedestrian walkway is landside.
  MUC: [["T1", "T2"]],

  // ── Chicago O'Hare ──
  // T1, T2, T3 connected by post-security pedestrian walkways at gate level.
  // T5 (international) is its own cluster — accessible only via the landside
  // ATS people mover or a limited-hours airside transfer bus for connecting
  // pax. Encoded conservatively here as T1/T2/T3 only.
  ORD: [["T1", "T2", "T3"]],

  // ── Portland ──
  // Single airside footprint connecting all concourses (B/C/D/E) via the
  // central post-security terminal.
  PDX: [["B", "C", "D", "E"]],

  // ── Philadelphia ──
  // All terminals (A West, A East, B, C, D, E, F) connected in a continuous
  // line via post-security pedestrian walkways; free airside shuttle bus
  // supplements walking between A-East and F.
  PHL: [["A West", "A East", "B/C", "B", "C", "D", "E", "F"]],

  // ── Panama City Tocumen ──
  // Main (T1) and T2 connected by an airside transit corridor (15-25 min
  // walk) plus an airside shuttle (~15 min headway, 5am–9pm).
  PTY: [["Main", "T2"]],

  // ── Shanghai Pudong ──
  // T1 and T2 connected airside via an underground corridor; satellites S1/S2
  // are connected to their respective main terminals via airside APMs.
  PVG: [["T1", "T2"]],

  // ── San Diego ──
  // Terminal 2 East and West share a common airside corridor (separate
  // checkpoints but connected post-security). Terminal 1 is separate.
  SAN: [["2W", "2E"]],

  // ── Seattle-Tacoma ──
  // Satellite Transit System (SEA Underground) airside APM + post-security
  // walkways connect all four concourses (A/B/C/D) and the North & South
  // satellites.
  SEA: [["A", "B", "C", "D", "N", "S"]],

  // ── San Francisco ──
  // Continuous airside walkway loop completed June 2024 with the Harvey Milk
  // T1 final connector. All five terminals (Int'l A → T1 → T2 → T3 → Int'l G)
  // now form one airside cluster.
  SFO: [["T1", "T2", "T3", "Int'l A", "Int'l G"]],

  // ── Singapore Changi ──
  // T1, T2, T3 connected by airside Skytrain. T4 connected to T1/T2/T3 by an
  // airside shuttle bus (24/7, ~13 min headway) for transit passengers.
  // Allow extra time for T4 transfers.
  SIN: [["T1", "T2", "T3", "T4"]],

  // ── Salt Lake City ──
  // Two underground post-security tunnels (Mid-Concourse + new River Tunnel
  // opened Oct 2024) connect concourses A and B.
  SLC: [["A", "B"]],

  // ── Taipei Taoyuan ──
  // T1 and T2 connected airside via Skytrain (5am–midnight) with an airside
  // shuttle bus overnight.
  TPE: [["T1", "T2"]],

  // ── Vancouver ──
  // Y-shaped main terminal with post-security corridors linking domestic
  // (piers A/B/C), international (pier D), and US-preclearance (pier E).
  YVR: [["Int'l", "Dom"]],

  // ──────────────────────────────────────────────────────────────────────
  // Airports explicitly verified to have NO airside connectivity between
  // terminals (kept here as documentation; not included in the export above
  // but recorded so future contributors don't waste research time):
  //
  //   AUH — T1/T3 closed since Oct 2023; all flights at new Terminal A.
  //   DCA — Terminals 1 and 2 have no airside walkway.
  //   DTW — McNamara (EM-A) and Evans/North (NM) are 3 miles apart.
  //   EWR — AirTrain is landside; no airside walkway between A/B/C.
  //   FLL — T1 and T4 not airside-connected (T3-T4 are, but DB has 1 and 4).
  //   FRA — SkyLine has limited airside use; most pax must re-clear security.
  //   ICN — Airside connection is one-way T1→T2 only with onward boarding
  //         pass. Asymmetric; better to under-promise.
  //   JFK — No airside walkways between any terminals as of 2026.
  //   LAS — T1 and T3 have NO direct airside passenger path despite shared
  //         D Gates being accessible from both sides.
  //   LGA — Terminal B and Terminal C not airside-connected.
  //   MAN — T1 closing late 2025; current connectivity uncertain.
  //   MCO — Terminal A and Terminal C are separate buildings; APM is landside.
  //   MEL — Australian exit immigration makes T1↔T2 functionally landside.
  //   NRT — Inter-terminal bus boards from airside but no airside corridor.
  //   SYD — T1 (Int'l) and T3 (Qantas Dom) are 4km apart, no airside link.
  //   TPA — Hub-and-spoke; each airside has its own security, not connected.
  //   YYZ — Terminal Link train is landside only.
  // ──────────────────────────────────────────────────────────────────────
};

// Reduce LOUNGE_DATABASE terminal labels to the canonical form used in
// normalizeTerminal() so a single comparison covers all variants.
function canon(t) {
  if (!t) return "";
  return t.toString().toUpperCase().replace(/^TERMINAL\s+/i, "").replace(/^T(?=\d)/i, "").trim();
}

// Given an airport and one terminal label the user is in, return every
// terminal label they can also reach post-security (including the input
// terminal itself). Labels in the result are canonicalized.
//
// If the airport isn't in the connectivity map, or the user's terminal isn't
// in any known group at that airport, returns just the canonicalized input —
// i.e. the existing strict-terminal behavior, which is the safe fallback.
export function getPostSecurityReachableTerminals(airport, terminal) {
  const c = canon(terminal);
  if (!c) return [];
  const entry = POST_SECURITY_TERMINAL_GROUPS[(airport || "").toUpperCase()];
  if (!entry) return [c];
  for (const group of entry) {
    const canonGroup = group.map(canon);
    if (canonGroup.includes(c)) return canonGroup;
  }
  return [c];
}

// Convenience: expand a set of terminals (e.g. what the user might depart from
// — derived from their booked flight + airline-inferred terminals) into the
// full set of post-security reachable terminals at this airport.
export function expandToReachableTerminals(airport, terminals) {
  if (!airport || !terminals || terminals.length === 0) return [];
  const expanded = new Set();
  for (const t of terminals) {
    for (const r of getPostSecurityReachableTerminals(airport, t)) {
      expanded.add(r);
    }
  }
  return [...expanded];
}

// True if the airport has any documented post-security inter-terminal
// connectivity. Useful for the UI to surface the "you can also reach X"
// affordance only where it's meaningful.
export function airportHasInterTerminalConnectivity(airport) {
  const entry = POST_SECURITY_TERMINAL_GROUPS[(airport || "").toUpperCase()];
  return !!entry && entry.some(g => g.length > 1);
}
