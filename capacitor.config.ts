import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.krishimitra.app",
  appName: "KrishiMitra",
  // Remote-load wrapper: the WebView loads the LIVE website in its normal
  // responsive mobile layout (the site has its own mobile nav).
  server: {
    url: "https://krishimi.freebuff.app",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0f5132",
  },
  // No webDir bundling needed for remote-load, but Capacitor requires it.
  webDir: "dist",
};

export default config;
