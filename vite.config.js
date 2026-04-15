import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  plugins: [react(), faviconIcoFromSvg()],
});
