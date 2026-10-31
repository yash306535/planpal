#!/usr/bin/env bash
#
# Create the PlanPal web service on Render via the API.
#
# Requires RENDER_API_KEY in your environment. Do NOT paste the key into source,
# chat, or anywhere public — this script only reads it from the env:
#
#   RENDER_API_KEY=... ./scripts/render-deploy.sh
#
# Secrets (ANTHROPIC_API_KEY, TAVUS_*) are intentionally NOT set here — add them
# in the Render dashboard after the service is created, then redeploy.
#
# Prefer the one-click blueprint instead? See the README "Deploy to Render".
set -euo pipefail

: "${RENDER_API_KEY:?Set RENDER_API_KEY in your shell first (do not hard-code it).}"

REPO="https://github.com/yash306535/planpal"
BRANCH="main"
API="https://api.render.com/v1"

echo "→ Looking up your Render owner id…"
OWNER_ID=$(curl -sS -H "Authorization: Bearer $RENDER_API_KEY" "$API/owners?limit=1" \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d[0]["owner"]["id"])')
echo "  owner: $OWNER_ID"

BODY=$(OWNER_ID="$OWNER_ID" REPO="$REPO" BRANCH="$BRANCH" python3 - <<'PY'
import json, os
print(json.dumps({
    "type": "web_service",
    "name": "planpal",
    "ownerId": os.environ["OWNER_ID"],
    "repo": os.environ["REPO"],
    "branch": os.environ["BRANCH"],
    "autoDeploy": "yes",
    "serviceDetails": {
        "runtime": "node",
        "plan": "free",
        "region": "oregon",
        "healthCheckPath": "/",
        "envSpecificDetails": {
            "buildCommand": "npm ci --include=dev && npm run build",
            "startCommand": "npm run start",
        },
    },
    "envVars": [
        {"key": "ANTHROPIC_MODEL", "value": "claude-opus-5-5"},
        {"key": "MOCK_MODE", "value": "false"},
    ],
}))
PY
)

echo "→ Creating the Render service…"
curl -sS -X POST "$API/services" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$BODY" \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); s=d.get("service", d); print("  result:", s.get("dashboardUrl") or s.get("id") or json.dumps(d))'

echo
echo "✓ Done. In the Render dashboard, add your secret env vars"
echo "  (ANTHROPIC_API_KEY, TAVUS_API_KEY, TAVUS_PERSONA_ID, TAVUS_REPLICA_ID)"
echo "  then trigger a manual deploy. Future 'git push' to main auto-deploys."
