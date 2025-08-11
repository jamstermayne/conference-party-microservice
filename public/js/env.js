// /js/env.js
// Centralized runtime config (browser-safe)
// Replace REPLACE_ME* with real values when ready.

window.__ENV = Object.assign({
  GOOGLE_CLIENT_ID: "REPLACE_ME_GOOGLE.apps.googleusercontent.com",
  LINKEDIN_CLIENT_ID: "REPLACE_ME_LINKEDIN",

  // Cloud Functions base
  BACKEND_BASE: "https://us-central1-conference-party-app.cloudfunctions.net/api",

  // Feature flags
  INVITES_API: true
}, window.__ENV || {});