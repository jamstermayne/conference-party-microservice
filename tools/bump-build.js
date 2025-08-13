/**
 * Bumps window.__ENV.BUILD and rewrites ?v= in index.html to that value.
 */
const fs = require('fs');
const envPath = 'frontend/src/js/env.js';
const htmlPath = 'frontend/src/index.html';

let js = fs.readFileSync(envPath,'utf8');
const m = js.match(/BUILD\s*:\s*['"]b(\d+)['"]/);
const next = m ? String(Number(m[1])+1).padStart(3,'0') : '001';
js = js.replace(/BUILD\s*:\s*['"]b\d+['"]/, `BUILD: 'b${next}'`);
fs.writeFileSync(envPath, js, 'utf8');

let html = fs.readFileSync(htmlPath,'utf8');
html = html.replace(/\?v=\d+/g, `?v=${next}`);
fs.writeFileSync(htmlPath, html, 'utf8');

console.log('BUILD -> b'+next);