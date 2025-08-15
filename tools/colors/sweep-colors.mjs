// tools/colors/sweep-colors.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const SRC = path.join(repoRoot, "frontend", "src");

const WRITE = process.argv.includes("--write");
const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, "map.json"), "utf8"));

// Globs by simple recursion (no external deps)
const includeExt = new Set([".css",".scss",".js",".ts",".jsx",".tsx",".html",".svg"]);
const excludeDirs = new Set(["node_modules",".next","dist","build","backup","public/assets/vendor","frontend/src/assets/css/tokens"]);

const files = [];
(function walk(d) {
  for (const name of fs.readdirSync(d, { withFileTypes:true })) {
    const p = path.join(d, name.name);
    if (name.isDirectory()) {
      if (![...excludeDirs].some(x => p.includes(x))) walk(p);
    } else if (includeExt.has(path.extname(name.name))) {
      files.push(p);
    }
  }
})(SRC);

const HEX_RE = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

// Helpers
const hexToRgba = (hex) => {
  let h = hex.replace("#","").toLowerCase();
  if (h.length === 3 || h.length === 4) {
    h = h.split("").map(ch => ch+ch).join("");
  }
  const r = parseInt(h.slice(0,2),16);
  const g = parseInt(h.slice(2,4),16);
  const b = parseInt(h.slice(4,6),16);
  let a = 255;
  if (h.length === 8) a = parseInt(h.slice(6,8),16);
  const alpha = +(a/255).toFixed(3);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Frequency + replacements
const freq = new Map();
const unmatched = new Map();
let totalHits = 0, totalReplaced = 0;

for (const f of files) {
  const input = fs.readFileSync(f, "utf8");
  let changed = input;
  const seen = new Set();

  input.replace(HEX_RE, (m) => { seen.add(m.toLowerCase()); return m; });

  for (const hex of seen) {
    freq.set(hex, (freq.get(hex)||0)+ (input.match(new RegExp(hex.replace('#','\\#'),"g"))||[]).length);
    let repl = MAP[hex] || MAP[hex.toLowerCase()];
    if (!repl) {
      // Handle 8-digit hex to rgba tokenization
      if (hex.length === 9 || hex.length === 5) {
        repl = hexToRgba(hex);
      }
    }
    if (repl) {
      const before = changed;
      changed = changed.replace(new RegExp(hex.replace('#','\\#'), "g"), repl);
      const diff = (before.match(new RegExp(hex.replace('#','\\#'),"g"))||[]).length;
      totalReplaced += diff;
    } else {
      unmatched.set(hex, (unmatched.get(hex)||0) + 1);
    }
  }

  if (WRITE && changed !== input) fs.writeFileSync(f, changed, "utf8");
  totalHits += seen.size;
}

console.log(`\n— Color Sweep Report —`);
console.log(`Scanned files: ${files.length}`);
console.log(`Unique hex seen: ${freq.size}`);
console.log(`Replacements applied: ${totalReplaced}${WRITE ? " (write mode)" : " (dry-run)"}`);

if (unmatched.size) {
  const entries = [...unmatched.entries()]
    .map(([hex]) => [hex, freq.get(hex)||0])
    .sort((a,b)=>b[1]-a[1]);

  console.log(`\nTop unmatched colors (by count):`);
  for (const [hex,count] of entries.slice(0,50)) {
    console.log(`${count.toString().padStart(5)}  ${hex}`);
  }

  // Emit auto-alias tokens file for the unmatched top colors (suggestions)
  const aliasOut = path.join(repoRoot, "frontend", "src", "assets", "css", "tokens", "_auto-aliases.css");
  const lines = [
    "/* Auto-generated aliases from color sweeper */",
    "/* These are suggested mappings for the most frequently used unmapped hex colors */",
    "/* Edit these to point to semantic tokens (e.g., var(--error-weak) instead of the hex) */",
    ":root {"
  ];
  
  for (const [hex,count] of entries.slice(0,50)) {
    const safe = hex.toLowerCase().replace("#","").slice(0,6);
    let suggestion = hex;
    
    // Provide semantic suggestions for common patterns
    if (hex.includes('ff6b6b') || hex.includes('e74c3c')) {
      suggestion = `${hex}; /* TODO: consider var(--error-weak) */`;
    } else if (hex.includes('22c55e') || hex.includes('059669') || hex.includes('4caf50')) {
      suggestion = `${hex}; /* TODO: consider var(--success) */`;
    } else if (hex.includes('f59e0b') || hex.includes('f39c12')) {
      suggestion = `${hex}; /* TODO: consider var(--warning) */`;
    } else if (hex.includes('3498db') || hex.includes('4285f4')) {
      suggestion = `${hex}; /* TODO: consider var(--info) */`;
    } else if (hex.match(/^#[0-5]/)) {
      suggestion = `${hex}; /* TODO: consider var(--neutral-xxx) */`;
    } else if (hex.match(/^#[e-f]/)) {
      suggestion = `${hex}; /* TODO: consider var(--neutral-xxx) or var(--text-xxx) */`;
    } else {
      suggestion = `${hex}; /* ${count} uses */`;
    }
    
    lines.push(`  --alias-${safe}: ${suggestion}`);
  }
  lines.push("}");
  fs.writeFileSync(aliasOut, lines.join("\n")+"\n", "utf8");
  console.log(`\nWrote suggestions → tokens/_auto-aliases.css (50 aliases). Import this file in color-tokens.css.`);
} else {
  console.log(`\nAll hex mapped. ✅`);
}