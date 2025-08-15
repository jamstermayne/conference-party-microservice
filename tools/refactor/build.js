import { build } from "esbuild";

await build({
  entryPoints: [
    "frontend/src/js/main.js",
    "frontend/src/js/router-stack.js",
    "frontend/src/js/app.js",
    "frontend/src/js/calendar.js",
    "frontend/src/js/controllers/events.js",
    "frontend/src/js/api/invites.js"
  ],
  bundle: true,
  splitting: true,
  format: "esm",
  sourcemap: true,
  outdir: "frontend/dist",
  target: ["es2022"],
  treeShaking: true,
  minify: true,
  metafile: true,
  logLevel: "info",
  external: ["https://*", "http://*"],
  loader: {
    ".css": "css",
    ".png": "file",
    ".svg": "file"
  }
}).then(result => {
  // Output bundle size info
  const text = require("esbuild").analyzeMetafileSync(result.metafile);
  console.log("\n=== Bundle Analysis ===");
  console.log(text);
});