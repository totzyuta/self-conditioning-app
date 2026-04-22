/**
 * Check that GET /api/v2/state returns { ok: true, ... } with the same
 * VITE_API_BASE_URL + x-sync-password as the app. Run before shipping a native build.
 */
import { loadEnv } from "vite";

const fromFiles = loadEnv("production", process.cwd(), "");
const base = (process.env.VITE_API_BASE_URL || fromFiles.VITE_API_BASE_URL || "").trim();
const password = (
  process.env.SYNC_PASSWORD ||
  process.env.VERIFY_SYNC_PASSWORD ||
  fromFiles.SYNC_PASSWORD ||
  fromFiles.VERIFY_SYNC_PASSWORD ||
  ""
).trim();
const userId = (
  process.env.VERIFY_USER_ID ||
  fromFiles.VERIFY_USER_ID ||
  "totzyu_dev"
).trim();

if (!base || !password) {
  console.error(`[verify:sync-api] Set VITE_API_BASE_URL and SYNC_PASSWORD (e.g. in the shell or .env.production.local).

  VITE_API_BASE_URL=https://your-app.vercel.app SYNC_PASSWORD=... npm run verify:sync-api
`);
  process.exit(1);
}

if (base.endsWith("/")) {
  console.error("[verify:sync-api] VITE_API_BASE_URL must not end with a slash.");
  process.exit(1);
}

const url = `${base}/api/v2/state?user_id=${encodeURIComponent(userId)}`;
const res = await fetch(url, {
  method: "GET",
  cache: "no-store",
  headers: { "x-sync-password": password },
});

const contentType = res.headers.get("content-type") || "";
const text = await res.text();
let data;
try {
  data = text.trim() ? JSON.parse(text) : null;
} catch {
  data = { _parseError: true };
}

if (!res.ok) {
  console.error(`[verify:sync-api] HTTP ${res.status} ${res.statusText}`);
  console.error(`  URL: ${url}`);
  if (data && !data._parseError) console.error("  body:", data);
  else console.error("  body (raw):", text.slice(0, 500));
  process.exit(1);
}

if (!data || data.ok !== true) {
  console.error("[verify:sync-api] Response is not { ok: true, ... } (wrong URL or not the sync API).");
  console.error(`  content-type: ${contentType}`);
  console.error("  body (raw):", text.slice(0, 500));
  process.exit(1);
}

console.log(`[verify:sync-api] ok: userId=${data.userId ?? userId} (GET ${url})`);
