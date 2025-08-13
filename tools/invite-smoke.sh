#!/usr/bin/env bash
set -euo pipefail
REGION=${REGION:-us-central1}
PROJECT=${PROJECT:-conference-party-app}
API="https://${REGION}-${PROJECT}.cloudfunctions.net/api"
TOKEN="${TOKEN:-}" # set to a Firebase ID token to auth

authH=()
if [ -n "$TOKEN" ]; then authH=(-H "Authorization: Bearer $TOKEN"); fi

echo "== Health =="
curl -s $API/health | jq .

echo "== Mine (requires auth) =="
curl -s "${authH[@]}" "$API/invites/mine" | jq .