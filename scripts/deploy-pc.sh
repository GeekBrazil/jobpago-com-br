#!/usr/bin/env bash
set -euo pipefail

# Deploy do jobpago.com.br com BUILD NO PC DO ALLAN — regra desde 2026-09-25
# ("compilações de todos os sites devem ser locais"). Mesmo esquema do
# allancandido.com (scripts/deploy-pc.sh de lá): a imagem é construída aqui a
# partir do COMMIT (git archive), com o nome que o Coolify usa
# (<uuid>:<sha>), vai pro VPS por docker save/load e o deploy sai com
# force_rebuild=false — o Coolify acha a imagem e pula o build.
#
# Flags NEXT_PUBLIC_* do build ficam em .env.production (versionado);
# segredos seguem só no Coolify, lidos em runtime.
#
# NUNCA interromper no meio nem envolver em `timeout`: deploy cortado deixa
# coolify-helper órfão no VPS.

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$DIR")"
APP_UUID="n14b1n041063tx65wnna7p0w"
VPS="root@188.245.70.109"

echo "==> [1/6] Enviando commits para origin main..."
git -C "$ROOT_DIR" push origin main
SHA="$(git -C "$ROOT_DIR" rev-parse HEAD)"
REMOTE_SHA="$(git -C "$ROOT_DIR" ls-remote origin refs/heads/main | cut -f1)"
if [ "$SHA" != "$REMOTE_SHA" ]; then
  echo "❌ HEAD local ($SHA) difere de origin/main ($REMOTE_SHA)."; exit 1
fi
IMAGE="$APP_UUID:$SHA"

echo "==> [2/6] Build local da imagem $IMAGE (a partir do commit)..."
# --network=host: a rede padrão do Docker neste PC não sai para a internet
git -C "$ROOT_DIR" archive --format=tar HEAD | docker build --network=host -t "$IMAGE" -

echo "==> [3/6] Enviando imagem para o VPS..."
docker save "$IMAGE" | gzip -1 | ssh -o ConnectTimeout=10 "$VPS" "gunzip | docker load"
# helpers órfãos no VPS (o nome é uuid; 'coolify-helper' só aparece na imagem)
ssh "$VPS" "docker ps -a --format '{{.ID}} {{.Image}}' | awk '/coolify-helper/ {print \$1}' | xargs -r docker rm -f > /dev/null 2>&1 || true"

echo "==> [4/6] Deploy no Coolify SEM rebuild..."
DISPATCH_OUTPUT=$(ssh -o ConnectTimeout=10 "$VPS" "docker exec coolify php artisan tinker --execute='
\$app = App\Models\Application::where(\"uuid\", \"$APP_UUID\")->first();
\$dep = App\Models\ApplicationDeploymentQueue::create([
    \"application_id\" => \$app->id,
    \"deployment_uuid\" => (string) Illuminate\Support\Str::uuid(),
    \"pull_request_id\" => 0,
    \"force_rebuild\" => false,
    \"commit\" => \"$SHA\",
    \"status\" => \"queued\",
    \"is_webhook\" => false,
    \"is_api\" => true,
    \"server_id\" => \$app->destination->server->id,
    \"destination_id\" => \$app->destination->id,
    \"only_this_server\" => false,
    \"rollback\" => false,
    \"application_name\" => \$app->name,
    \"server_name\" => \$app->destination->server->name,
    \"deployment_url\" => \"\",
]);
App\Jobs\ApplicationDeploymentJob::dispatch(\$dep->id);
echo \"DEP_ID:\" . \$dep->id;
'")
DEP_ID=$(echo "$DISPATCH_OUTPUT" | grep -o 'DEP_ID:[0-9]*' | cut -d: -f2)
echo "    Deploy ID: $DEP_ID"

FINISHED=false
for i in {1..150}; do
  STATUS=$(timeout 25 ssh -o ConnectTimeout=10 "$VPS" "docker exec coolify php artisan tinker --execute='
  \$d = App\Models\ApplicationDeploymentQueue::find($DEP_ID);
  echo \"STATUS:\" . (\$d ? \$d->status : \"unknown\");
  '" 2>/dev/null | (grep -o 'STATUS:[a-z_-]*' || true) | cut -d: -f2 || true)
  STATUS="${STATUS:-waiting}"
  echo "    Progresso ($i/150): $STATUS"
  if [ "$STATUS" = "finished" ]; then FINISHED=true; break; fi
  if [ "$STATUS" = "failed" ] || [ "$STATUS" = "cancelled" ]; then echo "❌ Deploy falhou no Coolify!"; exit 1; fi
  sleep 5
done
[ "$FINISHED" = "true" ] || { echo "❌ Timeout aguardando o Coolify (o deploy segue lá — NÃO matar)."; exit 1; }

SKIPPED=$(ssh "$VPS" "docker exec coolify php artisan tinker --execute='
\$d = App\Models\ApplicationDeploymentQueue::find($DEP_ID);
echo (stripos(\$d->logs ?? \"\", \"Build step skipped\") !== false) ? \"SKIP_OK\" : \"SKIP_NAO\";
'" 2>/dev/null | grep -o 'SKIP_[A-Z]*' || true)
if [ "$SKIPPED" = "SKIP_OK" ]; then echo "    ✅ Coolify usou a imagem do PC (Build step skipped)."
else echo "    ⚠️ Não achei 'Build step skipped' no log do deploy $DEP_ID — conferir se o VPS compilou."; fi

echo "==> [5/6] Verificando produção..."
node "$DIR/verify-deploy.mjs"

echo "==> [6/6] Limpando imagens antigas do app (VPS e PC; mantém a atual)..."
ssh "$VPS" "docker images '$APP_UUID' --format '{{.Repository}}:{{.Tag}}' | grep -v ':$SHA\\$' | xargs -r docker rmi > /dev/null 2>&1 || true"
docker images "$APP_UUID" --format '{{.Repository}}:{{.Tag}}' | grep -v ":$SHA\$" | xargs -r docker rmi > /dev/null 2>&1 || true
echo "✅ JobPago publicado (build no PC)."
