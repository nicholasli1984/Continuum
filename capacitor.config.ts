import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.gocontinuum.continuum",
  appName: "Continuum",
  webDir: "dist",
  // Live-reload during dev: point the native shell at your hot-reloading vite
  // server. To use, run `npm run dev` then `npx cap run android` and the app
  // loads from your laptop instead of the bundled dist/. Comment out for
  // production builds.
  // server: { url: "http://10.0.0.5:5173", cleartext: true },
  ios: {
    contentInset: "always",
    // Lock the WebView background to the dark theme so a cold launch doesn't
    // flash white before React mounts. Matches the StatusBar config below.
    backgroundColor: "#15130F",
    // Ensure the app uses the modern WKWebView scheme so Apple's privacy
    // disclosures around UIWebView don't apply (UIWebView was deprecated in
    // iOS 12 — Capacitor uses WKWebView by default but explicit is safer).
    scheme: "Continuum",
    // The HTTPS origin that Capacitor's native shell allows for fetch() calls.
    // Letting Capacitor proxy through capacitor:// scheme.
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    // Allow http during dev (vite serves on http://). Remove for prod builds.
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#15130F",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#15130F",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
