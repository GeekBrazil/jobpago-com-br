#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$DIR")"
APP_UUID="n14b1n041063tx65wnna7p0w"
TOKEN_FILE="$HOME/.config/coolify/api_token"

echo "==> [1/4] Enviando alterações para origin main..."
git -C "$ROOT_DIR" push origin main

echo "==> [2/4] Disparando deploy no Coolify..."
TOKEN="$(cat "$TOKEN_FILE")"
DEPLOY_RESPONSE=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" \
  "https://coolify.allancandido.com/api/v1/deploy?uuid=$APP_UUID")
DEPLOYMENT_UUID=$(echo "$DEPLOY_RESPONSE" | node -e "process.stdin.once('data', d => console.log(JSON.parse(d).deployments[0].deployment_uuid))")
echo "    deployment: $DEPLOYMENT_UUID"

echo "==> [3/4] Aguardando terminar..."
while true; do
  STATUS=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "https://coolify.allancandido.com/api/v1/deployments/$DEPLOYMENT_UUID" \
    | node -e "process.stdin.once('data', d => console.log(JSON.parse(d).status))")
  [ "$STATUS" != "in_progress" ] && [ "$STATUS" != "queued" ] && break
  sleep 5
done
echo "    status: $STATUS"
[ "$STATUS" = "finished" ] || { echo "Deploy falhou (status=$STATUS)."; exit 1; }

echo "==> [4/4] Verificando produção..."
node "$DIR/verify-deploy.mjs"
