import { readFileSync, existsSync } from 'fs';

// Verify firebase.json points to correct hosting directory
const fb = JSON.parse(readFileSync('firebase.json', 'utf8'));
if (fb.hosting?.public !== 'frontend/src') {
  console.error('❌ hosting.public must be frontend/src');
  process.exit(1);
}

// Check for stale files that shouldn't exist
const staleFiles = [
  'public/index.html',
  'public/js/app.js',
  'public/js/metrics.js',
  'public/js/ftue-progress.js',
  'public/js/activity-feed.js'
];

staleFiles.forEach(p => {
  if (existsSync(p)) {
    console.error(`❌ Stale file detected: ${p}. Delete or move to frontend/src.`);
    process.exit(1);
  }
});

// Check that public directory doesn't exist at all
if (existsSync('public/')) {
  console.error('❌ public/ directory exists but should not. All files should be in frontend/src/');
  process.exit(1);
}

console.log('✅ Hosting root verified and no stale /public files detected.');