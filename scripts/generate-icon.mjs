// Generate Continuum app icon PNGs from a single SVG source.
//
// Apple App Review (2026-05) rejected the previous icon as "placeholder"
// because the artwork contained the "CONTINUUM" wordmark plus the tagline
// "ELEVATE EVERY JOURNEY" — both of which become illegible at the 60pt
// notification size and the 76pt home-screen size. Apple's HIG explicitly
// discourages text inside icons.
//
// This script renders a no-text version: just the orange infinity symbol
// (with the inner gold infinity highlight + small aircraft accent) on the
// dark-navy gradient background. The result is written to:
//
//   assets/icon-only.png        — full icon (used for iOS + non-adaptive Android)
//   assets/icon-foreground.png  — infinity only, transparent background (adaptive Android foreground)
//   assets/icon-background.png  — solid dark navy fill (adaptive Android background)
//   assets/splash.png           — same icon centered on much larger canvas
//   assets/splash-dark.png      — same as splash (we use a single dark theme)
//
// Run with: node scripts/generate-icon.mjs
//
// After this script, run `npx @capacitor/assets generate` to produce the
// full set of platform-specific sizes from these sources.

import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "assets");
mkdirSync(OUT, { recursive: true });

// ── Design tokens ─────────────────────────────────────────────────────────
const BG_TOP = "#0D0B10";
const BG_BOT = "#1C1420";
const ORANGE_A = "#D4742D";
const ORANGE_B = "#E8883A";
const GOLD_A = "#C9A84C";
const GOLD_B = "#F0D78C";

// ── Infinity SVG construction ─────────────────────────────────────────────
// Drawn within a viewBox so we can re-scale easily. Numbers tuned for a
// strong silhouette at 60×60: the outer stroke is thick (24 / 1024) and
// the symbol fills ~70% of the safe area.
function buildIconSvg(size) {
  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 1024;
  const sw = 64 * scale;
  const swInner = 16 * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BG_TOP}"/>
      <stop offset="100%" stop-color="${BG_BOT}"/>
    </linearGradient>
    <linearGradient id="orange" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${ORANGE_A}"/>
      <stop offset="100%" stop-color="${ORANGE_B}"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${GOLD_A}"/>
      <stop offset="50%" stop-color="${GOLD_B}"/>
      <stop offset="100%" stop-color="${GOLD_A}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <g transform="translate(${cx},${cy}) scale(${scale * 2.2})">
    <!-- Outer infinity, bold orange -->
    <path d="M-130,0 C-130,-55 -88,-62 -64,-62 C-32,-62 -13,-32 0,-13 C13,-32 32,-62 64,-62 C88,-62 130,-55 130,0 C130,55 88,62 64,62 C32,62 13,32 0,13 C-13,32 -32,62 -64,62 C-88,62 -130,55 -130,0 Z"
      fill="none" stroke="url(#orange)" stroke-width="${sw / scale / 2.2}" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Inner gold highlight infinity -->
    <path d="M-112,0 C-112,-42 -80,-48 -64,-48 C-40,-48 -16,-24 0,-5 C16,-24 40,-48 64,-48 C80,-48 112,-42 112,0 C112,42 80,48 64,48 C40,48 16,24 0,5 C-16,24 -40,48 -64,48 C-80,48 -112,42 -112,0 Z"
      fill="none" stroke="url(#gold)" stroke-width="${swInner / scale / 2.2}" stroke-linecap="round" opacity="0.85"/>
    <!-- Center diamond -->
    <polygon points="0,-12 9,0 0,12 -9,0" fill="url(#gold)"/>
  </g>
</svg>`;
}

// Infinity-only on transparent background (Android adaptive foreground)
function buildForegroundSvg(size) {
  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 1024;
  const sw = 64 * scale;
  const swInner = 16 * scale;
  // Android adaptive icon foreground gets aggressive cropping; we shrink
  // the artwork to ~60% so the symbol sits inside the safe zone.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="orange" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${ORANGE_A}"/>
      <stop offset="100%" stop-color="${ORANGE_B}"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${GOLD_A}"/>
      <stop offset="50%" stop-color="${GOLD_B}"/>
      <stop offset="100%" stop-color="${GOLD_A}"/>
    </linearGradient>
  </defs>
  <g transform="translate(${cx},${cy}) scale(${scale * 1.8})">
    <path d="M-130,0 C-130,-55 -88,-62 -64,-62 C-32,-62 -13,-32 0,-13 C13,-32 32,-62 64,-62 C88,-62 130,-55 130,0 C130,55 88,62 64,62 C32,62 13,32 0,13 C-13,32 -32,62 -64,62 C-88,62 -130,55 -130,0 Z"
      fill="none" stroke="url(#orange)" stroke-width="${sw / scale / 1.8}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-112,0 C-112,-42 -80,-48 -64,-48 C-40,-48 -16,-24 0,-5 C16,-24 40,-48 64,-48 C80,-48 112,-42 112,0 C112,42 80,48 64,48 C40,48 16,24 0,5 C-16,24 -40,48 -64,48 C-80,48 -112,42 -112,0 Z"
      fill="none" stroke="url(#gold)" stroke-width="${swInner / scale / 1.8}" stroke-linecap="round" opacity="0.85"/>
    <polygon points="0,-12 9,0 0,12 -9,0" fill="url(#gold)"/>
  </g>
</svg>`;
}

// Solid dark-navy gradient panel for Android adaptive icon background
function buildBackgroundSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BG_TOP}"/>
      <stop offset="100%" stop-color="${BG_BOT}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
</svg>`;
}

// Splash uses the same icon but on a 2732×2732 canvas (Capacitor's standard
// splash source size that scales down nicely to every device).
function buildSplashSvg() {
  const size = 2732;
  const iconSize = 1024;
  const offset = (size - iconSize) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BG_TOP}"/>
      <stop offset="100%" stop-color="${BG_BOT}"/>
    </linearGradient>
    <linearGradient id="orange" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${ORANGE_A}"/>
      <stop offset="100%" stop-color="${ORANGE_B}"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${GOLD_A}"/>
      <stop offset="50%" stop-color="${GOLD_B}"/>
      <stop offset="100%" stop-color="${GOLD_A}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <g transform="translate(${size / 2},${size / 2}) scale(2.6)">
    <path d="M-130,0 C-130,-55 -88,-62 -64,-62 C-32,-62 -13,-32 0,-13 C13,-32 32,-62 64,-62 C88,-62 130,-55 130,0 C130,55 88,62 64,62 C32,62 13,32 0,13 C-13,32 -32,62 -64,62 C-88,62 -130,55 -130,0 Z"
      fill="none" stroke="url(#orange)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-112,0 C-112,-42 -80,-48 -64,-48 C-40,-48 -16,-24 0,-5 C16,-24 40,-48 64,-48 C80,-48 112,-42 112,0 C112,42 80,48 64,48 C40,48 16,24 0,5 C-16,24 -40,48 -64,48 C-80,48 -112,42 -112,0 Z"
      fill="none" stroke="url(#gold)" stroke-width="3.5" stroke-linecap="round" opacity="0.85"/>
    <polygon points="0,-12 9,0 0,12 -9,0" fill="url(#gold)"/>
  </g>
</svg>`;
}

// ── Render to PNG ─────────────────────────────────────────────────────────
const targets = [
  { file: "icon-only.png",       svg: buildIconSvg(1024),       size: 1024 },
  { file: "icon-foreground.png", svg: buildForegroundSvg(1024), size: 1024 },
  { file: "icon-background.png", svg: buildBackgroundSvg(1024), size: 1024 },
  { file: "splash.png",          svg: buildSplashSvg(),         size: 2732 },
  { file: "splash-dark.png",     svg: buildSplashSvg(),         size: 2732 },
];

// Also overwrite the public/pwa-512x512.png and apple-touch-icon-180x180.png
// so the PWA and web app on iOS pick up the new icon immediately.
const webTargets = [
  { file: "../public/pwa-512x512.png",          svg: buildIconSvg(512),  size: 512 },
  { file: "../public/pwa-192x192.png",          svg: buildIconSvg(192),  size: 192 },
  { file: "../public/pwa-64x64.png",            svg: buildIconSvg(64),   size: 64 },
  { file: "../public/apple-touch-icon-180x180.png", svg: buildIconSvg(180), size: 180 },
  { file: "../public/maskable-icon-512x512.png", svg: buildIconSvg(512), size: 512 },
];

for (const t of [...targets, ...webTargets]) {
  const outPath = resolve(OUT, t.file);
  await sharp(Buffer.from(t.svg)).resize(t.size, t.size).png({ compressionLevel: 9 }).toFile(outPath);
  console.log("Wrote", outPath);
}

console.log("\nNext: npx @capacitor/assets generate --ios --android");
