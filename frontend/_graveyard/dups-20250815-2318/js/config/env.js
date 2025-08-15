/**
 * Environment Configuration
 * Centralized API keys and configuration
 */

// Production API Keys (already provisioned and restricted)
export const ENV_CONFIG = {
  firebase: {
    apiKey: "AIzaSyBBHTTPMmtMSwHZZVkia-jxR1WINg_mFMw",
    authDomain: "conference-party-app.firebaseapp.com",
    projectId: "conference-party-app",
    storageBucket: "conference-party-app.appspot.com",
    messagingSenderId: "947888503698",
    appId: "1:947888503698:web:0b2e59d93861e3f17b0e4e"
  },
  googleMaps: {
    apiKey: "AIzaSyD5Zj_Hj31Vda3bcybxX6W4zmDlg8cotgc"
  }
};

// Export individual configs for convenience
export const FIREBASE_CONFIG = ENV_CONFIG.firebase;
export const GOOGLE_MAPS_API_KEY = ENV_CONFIG.googleMaps.apiKey;