import { registerPlugin } from "@capacitor/core";

export const NativeChrome = registerPlugin("NativeChrome", {
  web: {
    setChrome: async () => {},
  },
});
