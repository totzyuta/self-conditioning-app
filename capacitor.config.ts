import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.selfconditioning.notes",
  appName: "Conditioning",
  webDir: "dist",
  server: {
    // Use deployed API; set VITE_API_BASE_URL at build time for native app.
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;
