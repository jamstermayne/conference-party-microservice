import * as dotenv from "dotenv";

dotenv.config();

function getEnvironment(): "development" | "staging" | "production" {
  const env = process.env["NODE_ENV"] || "production";
  if (env === "development" || env === "staging" || env === "production") {
    return env;
  }
  return "production";
}

function getAllowedOrigins(): string[] {
  const env = getEnvironment();

  const prodOrigins = [
    "https://conference-party-app.web.app",
    "https://conference-party-app.firebaseapp.com",
  ];

  const stagingOrigins = [
    ...prodOrigins,
    // Firebase preview channels
    "https://conference-party-app--preview-*.web.app",
  ];

  const devOrigins = [
    ...stagingOrigins,
    // Local development servers
    "http://localhost:3000",
    "http://localhost:5000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5000",
    "http://127.0.0.1:8000",

    // GitHub Codespaces (dynamic pattern matching)
    "https://*.app.github.dev",

    // Gitpod
    "https://*.gitpod.io",

    // Replit
    "https://*.replit.dev",
    "https://*.repl.co",

    // CodeSandbox
    "https://*.codesandbox.io",
    "https://codesandbox.io",
  ];

  switch (env) {
  case "development":
    return devOrigins;
  case "staging":
    return stagingOrigins;
  case "production":
    return prodOrigins;
  default:
    return prodOrigins;
  }
}

export const config = {
  environment: getEnvironment(),
  cors: {
    allowedOrigins: getAllowedOrigins(),
    credentials: true,
    maxAge: 3600,
  },
  cache: {
    ttl: 300000, // 5 minutes
  },
};

export function validateConfig(): void {
  console.log("Simple configuration loaded successfully", {
    environment: config.environment,
    corsOrigins: config.cors.allowedOrigins.length,
  });
}
