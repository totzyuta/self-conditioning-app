import { registerPlugin } from "@capacitor/core";

export const HealthKitBridge = registerPlugin("HealthKitBridge", {
  web: {
    requestAuthorization: async () => ({ granted: false }),
    syncLatest: async () => ({ weights: [], stepsByDate: [] }),
  },
});
