// public/js/env.js
// Centralized runtime config (no process.env in browser)

window.__ENV = Object.assign({
  // ---- Google OAuth ----
  GOOGLE_CLIENT_ID: "REPLACE_ME.apps.googleusercontent.com",

  // ---- LinkedIn OAuth ----
  LINKEDIN_CLIENT_ID: "REPLACE_ME_LINKEDIN",

  // ---- Backend (Cloud Functions) ----
  BACKEND_BASE: "https://us-central1-conference-party-app.cloudfunctions.net/api",

  // Feature flags
  INVITES_API: true
}, window.__ENV || {});