// /js/env.js  (loaded before other scripts)
window.__ENV = Object.assign({}, window.__ENV || {}, {
  BACKEND_BASE: "/api",
  GOOGLE_CLIENT_ID: "REPLACE_ME.apps.googleusercontent.com",
  LINKEDIN_CLIENT_ID: "REPLACE_ME",
  INVITES_API: false,
  
  // toggle when backend endpoints are ready
  METRICS_ENABLED: false,     // enables POST only when true
  METRICS_URL: '/api/metrics',
  FLAGS_URL: '/api/flags',
  ACTIVITY_API: false
});