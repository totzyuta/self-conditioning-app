import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Local dev only:
 * Vite dev server doesn't run Vercel Serverless Functions under /api.
 * Provide a tiny middleware bridge so `/api/v2/state` works on localhost,
 * enabling seed reset / sync without requiring `vercel dev`.
 */
function localApiBridge() {
  return {
    name: "local-api-bridge",
    async configureServer(server) {
      // Load `.env.local` for local function execution (Vercel/Supabase keys).
      // Vite loads env for the client; this middleware runs in Node and needs process.env.
      try {
        const envPath = path.join(__dirname, ".env.local");
        if (fs.existsSync(envPath)) {
          const raw = fs.readFileSync(envPath, "utf8");
          raw.split(/\r?\n/).forEach((line) => {
            const t = line.trim();
            if (!t || t.startsWith("#")) return;
            const i = t.indexOf("=");
            if (i < 1) return;
            const k = t.slice(0, i).trim();
            let v = t.slice(i + 1).trim();
            if ((v.startsWith("\"") && v.endsWith("\"")) || (v.startsWith("'") && v.endsWith("'"))) {
              v = v.slice(1, -1);
            }
            if (k && process.env[k] == null) process.env[k] = v;
          });
        }
      } catch {
        // ignore
      }

      // Lazy-load so it doesn't slow down startup when unused.
      const mod = await import("./api/v2/state.js");
      const handler = mod?.default;
      if (typeof handler !== "function") return;

      server.middlewares.use(async (req, res, next) => {
        try {
          const rawUrl = req.url || "";
          if (!rawUrl.startsWith("/api/v2/state")) return next();

          const url = new URL(rawUrl, "http://localhost");
          req.query = Object.fromEntries(url.searchParams.entries());

          if (req.method === "PUT" || req.method === "POST" || req.method === "PATCH") {
            const chunks = [];
            for await (const c of req) chunks.push(c);
            req.body = Buffer.concat(chunks).toString("utf8");
          }

          await handler(req, res);
        } catch (e) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ ok: false, error: e?.message || "local api bridge error" }));
        }
      });
    },
  };
}

/** Dev/preview: browsers request /favicon.ico; serve same asset as public/favicon.svg */
function faviconIcoFromSvg() {
  return {
    name: "favicon-ico-from-svg",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/favicon.ico" && !req.url?.startsWith("/favicon.ico?")) {
          next();
          return;
        }
        try {
          const svg = fs.readFileSync(path.join(__dirname, "public/favicon.svg"), "utf8");
          res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
          res.end(svg);
        } catch {
          next();
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/favicon.ico" && !req.url?.startsWith("/favicon.ico?")) {
          next();
          return;
        }
        try {
          const svg = fs.readFileSync(path.join(__dirname, "dist/favicon.svg"), "utf8");
          res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
          res.end(svg);
        } catch {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApiBridge(), faviconIcoFromSvg()],
});
