import { build } from "esbuild";
import fs from "fs";

// Find actual entry points that exist
const entryPoints = [
  "frontend/src/js/main.js",
  "frontend/src/js/init-app.js",
  "frontend/src/js/router-stack.js",
  "frontend/src/js/stack.js",
].filter(f => fs.existsSync(f));

console.log("Building entry points:", entryPoints);

await build({
  entryPoints,
  bundle: true,
  splitting: true,
  format: "esm",
  sourcemap: true,
  outdir: "frontend/dist/js",
  target: ["es2020"],
  treeShaking: true,
  minify: true,
  metafile: true,
  logLevel: "info",
  // Don't bundle external URLs
  external: ["https://*", "http://*"],
  // Handle imports with query strings
  plugins: [{
    name: 'clean-imports',
    setup(build) {
      build.onResolve({ filter: /\?v=/ }, args => {
        // Strip version query strings
        const path = args.path.split('?')[0];
        return { path, external: false };
      });
    }
  }],
  loader: {
    ".css": "text",
    ".png": "dataurl",
    ".svg": "text"
  }
}).then(async result => {
  // Output bundle size info
  const { analyzeMetafileSync } = await import("esbuild");
  const text = analyzeMetafileSync(result.metafile, {
    verbose: false
  });
  console.log("\n=== Bundle Analysis ===");
  console.log(text);
  
  // Calculate total bundle size
  let totalSize = 0;
  for (const [output, meta] of Object.entries(result.metafile.outputs)) {
    totalSize += meta.bytes;
  }
  console.log(`\nTotal bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
}).catch(err => {
  console.error("Build failed:", err);
  process.exit(1);
});