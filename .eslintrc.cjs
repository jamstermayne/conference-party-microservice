/* eslint-env node */
module.exports = {
  extends: ["eslint:recommended"],
  env: { browser: true, es2022: true },
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  rules: {
    "no-restricted-imports": ["error", {
      "patterns": [
        "*/_graveyard/**",
        "**/assets/**/calendar.js",
        "**/assets/**/events.js",
        "**/assets/**/invites.js",
        "**/assets/**/app.js",
        "**/assets/**/api.js"
      ]
    }]
  }
}