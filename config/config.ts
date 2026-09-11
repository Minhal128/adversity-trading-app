// Get backend URI from app.config.js extra with safe fallback
let BACKEND_URI = "https://stingray-app-priwf.ondigitalocean.app";

try {
  const Constants = require("expo-constants").default;
  // Use DigitalOcean backend for production
  BACKEND_URI = "https://stingray-app-priwf.ondigitalocean.app";

  // FOR LOCAL DEVELOPMENT (uncomment when testing locally)
  // BACKEND_URI = "http://192.168.1.4:5000";

  // FOR ANDROID EMULATOR (uncomment when testing on emulator)
  // BACKEND_URI = "http://10.0.2.2:5000";

  // Prioritize local overrides for testing
  // BACKEND_URI = Constants?.expoConfig?.extra?.BACKEND_URI || BACKEND_URI;
} catch (error) {
  console.warn("⚠️ Could not load expo-constants:", error);
}

// Firebase / Google Auth configuration (set via .env or EAS secrets)
const GOOGLE_WEB_CLIENT_ID: string =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) || '';

const GOOGLE_IOS_CLIENT_ID: string =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) || '';

const GOOGLE_ANDROID_CLIENT_ID: string =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) || '';

const config = {
  baseUrl: BACKEND_URI,

  // Firebase / Google auth config
  googleWebClientId: GOOGLE_WEB_CLIENT_ID,
  googleIosClientId: GOOGLE_IOS_CLIENT_ID,
  googleAndroidClientId: GOOGLE_ANDROID_CLIENT_ID,

  // App configuration
  appName: "ATC",
  appVersion: "1.0.0",
  appType: "service",
  userType: "provider",
};

// Log configuration on load (only in development)
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log("🔧 Config loaded:");
  console.log("  - BACKEND_URI:", BACKEND_URI);
  console.log("  - baseUrl:", config.baseUrl);
  console.log("  - Google Web Client ID configured:", !!GOOGLE_WEB_CLIENT_ID);
}

export default config;
