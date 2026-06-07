// One-shot merge of the workflow-verified lounge additions into
// src/constants/lounges.js. For each airport with new entries, find the block
// (lines between `  AIRPORT: [` and the matching `  ],`) and inject the new
// objects right before the closing `],`, indented to match.
//
// Run: node scripts/merge-lounge-additions.mjs
//
// Idempotency: we skip any addition whose `id:` already appears in the block
// for that airport, so re-running is safe.

import { readFileSync, writeFileSync } from "node:fs";

const workflowOutputPath = process.argv[2] ||
  "C:\\Users\\nicho\\AppData\\Local\\Temp\\claude\\c--Users-nicho-Documents-Continuum\\0be4ce33-5167-4777-9d53-72854f113130\\tasks\\wd0g6o9ik.output";

const wf = JSON.parse(readFileSync(workflowOutputPath, "utf8"));
const additions = wf.result.verified;

// Group by airport.
const byAirport = new Map();
for (const a of additions) {
  if (!byAirport.has(a.airport)) byAirport.set(a.airport, []);
  byAirport.get(a.airport).push(a);
}

// Read lounges.js once, mutate the string, write once at the end.
const LOUNGES_PATH = "src/constants/lounges.js";
let content = readFileSync(LOUNGES_PATH, "utf8");

// Format one addition as a single-line JS object literal, matching the style
// of the existing entries.
function fmtAddition(a) {
  const parts = [];
  parts.push(`id: ${JSON.stringify(a.id)}`);
  parts.push(`name: ${JSON.stringify(a.name)}`);
  if (a.terminal != null) parts.push(`terminal: ${JSON.stringify(String(a.terminal))}`);
  parts.push(`network: ${JSON.stringify(a.network)}`);
  if (a.alliance && a.alliance !== "none") parts.push(`alliance: ${JSON.stringify(a.alliance)}`);
  if (a.tier === "first") parts.push(`tier: "first"`);
  parts.push(`rating: ${a.rating}`);
  if (a.amenities?.length) parts.push(`amenities: [${a.amenities.map(x => JSON.stringify(x)).join(",")}]`);
  if (a.hours) parts.push(`hours: ${JSON.stringify(a.hours)}`);
  parts.push(`location: ${JSON.stringify(a.location)}`);
  parts.push(`placeQuery: ${JSON.stringify(a.placeQuery)}`);
  return `    { ${parts.join(", ")} },`;
}

let stats = { airports: 0, addedTotal: 0, skippedDuplicate: 0, missingAirport: 0 };

// For each airport with additions, find the block and inject new entries.
// The block matcher looks for `  IATA: [` at line start; the closing `],` is
// the next line whose content is exactly `  ],` after that opening.
for (const [airport, adds] of byAirport.entries()) {
  // Find opening `  IATA: [`. Anchor at start of line.
  const openRe = new RegExp(`^( {2}${airport}: \\[\\n)`, "m");
  const openMatch = openRe.exec(content);
  if (!openMatch) {
    stats.missingAirport++;
    console.warn(`[skip] airport ${airport} not found in lounges.js`);
    continue;
  }
  const openIdx = openMatch.index;
  const afterOpen = openIdx + openMatch[0].length;

  // Find the matching close — first `  ],\n` after the opening. Naive but
  // works because each airport's block is flat (no nested arrays inside).
  const closeRe = /^ {2}\],\n/m;
  closeRe.lastIndex = afterOpen;
  const tail = content.slice(afterOpen);
  const closeMatch = closeRe.exec(tail);
  if (!closeMatch) {
    stats.missingAirport++;
    console.warn(`[skip] could not find closing ],
 for airport ${airport}`);
    continue;
  }
  const closeIdx = afterOpen + closeMatch.index; // index of the closing `  ],`
  const block = content.slice(openIdx, closeIdx);

  // Dedupe: drop any addition whose id is already in the block.
  const fresh = [];
  for (const a of adds) {
    const idRe = new RegExp(`id:\\s*"${a.id.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}"`);
    if (idRe.test(block)) { stats.skippedDuplicate++; continue; }
    fresh.push(a);
  }
  if (!fresh.length) continue;

  // Build the insert block: each addition on its own line, indented 4 spaces.
  const inserted = fresh.map(fmtAddition).join("\n") + "\n";

  // Splice the insert before the closing `  ],`.
  content = content.slice(0, closeIdx) + inserted + content.slice(closeIdx);

  stats.airports++;
  stats.addedTotal += fresh.length;
}

writeFileSync(LOUNGES_PATH, content);
console.log(`\nDone. Airports touched: ${stats.airports}. Entries added: ${stats.addedTotal}. Duplicates skipped: ${stats.skippedDuplicate}. Missing airports: ${stats.missingAirport}.`);
