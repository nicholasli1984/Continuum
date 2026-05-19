#!/usr/bin/env node
// Generates the Apple Sign-In Client Secret (JWT) that Supabase needs.
//
// This JWT is signed with your Apple .p8 private key. Apple's max expiry is
// 6 months, after which you need to re-generate and re-paste into Supabase.
//
// Usage:
//   node generate-apple-jwt.js <TEAM_ID> <KEY_ID> <SERVICES_ID> <path/to/AuthKey_XXX.p8>
//
// Example:
//   node generate-apple-jwt.js ABC123XYZ9 ABCDEF1234 app.gocontinuum.continuum.signin ~/Downloads/AuthKey_ABCDEF1234.p8
//
// Output: the JWT printed on stdout. Copy it and paste into Supabase →
// Authentication → Providers → Apple → Secret Key (for OAuth).

const fs = require("fs");
const path = require("path");

const [, , TEAM_ID, KEY_ID, SERVICES_ID, P8_PATH] = process.argv;

if (!TEAM_ID || !KEY_ID || !SERVICES_ID || !P8_PATH) {
  console.error("Usage: node generate-apple-jwt.js <TEAM_ID> <KEY_ID> <SERVICES_ID> <p8-file-path>");
  process.exit(1);
}

let jwt;
try {
  jwt = require("jsonwebtoken");
} catch {
  console.error("Missing dependency. Run: npm install jsonwebtoken (in this folder)");
  process.exit(1);
}

const expanded = P8_PATH.startsWith("~/")
  ? path.join(process.env.HOME || "", P8_PATH.slice(2))
  : P8_PATH;
const privateKey = fs.readFileSync(expanded, "utf8");

const now = Math.floor(Date.now() / 1000);
const token = jwt.sign(
  {
    iss: TEAM_ID,
    iat: now,
    exp: now + 60 * 60 * 24 * 180, // 180 days (Apple maximum)
    aud: "https://appleid.apple.com",
    sub: SERVICES_ID,
  },
  privateKey,
  {
    algorithm: "ES256",
    header: { alg: "ES256", kid: KEY_ID },
  },
);

console.log(token);
