// /js/env.js  (loaded before other scripts)
window.__ENV = Object.assign(
  {
    APP_NAME: 'velocity.ai',
    BUILD: (window.__ENV && window.__ENV.BUILD) || Date.now(),
    BACKEND_BASE: "/api",
    GOOGLE_CLIENT_ID: "REPLACE_ME.apps.googleusercontent.com",
    LINKEDIN_CLIENT_ID: "REPLACE_ME",
    ACTIVITY_API: false,
    INVITES_API: false,
    METRICS_API: false,
    FLAGS_API: false,
    METRICS_URL: '/api/metrics',
    FLAGS_URL: '/api/flags',
    SW_DISABLE: false
  },
  window.__ENV || {}
);