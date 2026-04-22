/**
 * Capacitor iOS/Android: relative /api/... would resolve to bundled HTML.
 * Fails the build if VITE_API_BASE_URL is missing (same resolution as Vite's loadEnv for production).
 */
import { loadEnv } from "vite";

const fromFiles = loadEnv("production", process.cwd(), "");
const base = (process.env.VITE_API_BASE_URL || fromFiles.VITE_API_BASE_URL || "").trim();

if (!base) {
  console.error(`[cap:sync] VITE_API_BASE_URL is not set.

The native bundle has no same-origin server; a bare /api/... request returns the SPA shell (HTML), not JSON.

Set your deployed API origin (no trailing slash), for example:

  VITE_API_BASE_URL=https://your-app.vercel.app npm run cap:sync

Or add VITE_API_BASE_URL to .env.production or .env.production.local (see .env.example), then run npm run cap:sync.
`);
  process.exit(1);
}

if (/\n/.test(base)) {
  console.error("[cap:sync] VITE_API_BASE_URL must be a single line (https origin, no path).");
  process.exit(1);
}

if (base.endsWith("/")) {
  console.error("[cap:sync] VITE_API_BASE_URL must not end with a slash.");
  process.exit(1);
}

if (!/^https?:\/\//i.test(base)) {
  console.error("[cap:sync] VITE_API_BASE_URL must be an absolute URL (e.g. https://your-app.vercel.app).");
  process.exit(1);
}
