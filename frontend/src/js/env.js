// /js/env.js  (loaded before other scripts)
window.__ENV = Object.assign(window.__ENV || {}, {
  // APIs
  API_BASE: "/api", // switch to "https://us-central1-conference-party-app.cloudfunctions.net/api" if you want direct CF
  BACKEND_BASE: "/api", // legacy alias
  INVITE_REDEEM_ENDPOINT: "",

  // Auth providers (fill when ready)
  GOOGLE_CLIENT_ID: "",
  LINKEDIN_CLIENT_ID: "",
  LINKEDIN_REDIRECT_URI: location.origin + "/auth/linkedin/callback",

  // Feature/metrics (disabled until endpoints live)
  FLAGS_API_ENABLED: false,
  FLAGS_URL: '/api/flags',
  METRICS_ENABLED: false,
  METRICS_ENDPOINT: "",
  METRICS_URL: '/api/metrics',
  
  // Legacy flags
  INVITES_API: false,
  ACTIVITY_API: false,

  // PWA install behavior
  PWA_DEVTOOLS_SUPPRESS_WARNING: true,
  PWA_AUTO_PROMPT: false,

  LOG_LEVEL: "warn"
});