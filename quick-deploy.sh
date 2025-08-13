#!/usr/bin/env bash
set -euo pipefail
echo "🚀 Quick Deploy (hosting only, no tests)"
node tools/bump-build.js || true
firebase deploy --only hosting
echo "✅ Deployed. Open: https://conference-party-app.web.app"