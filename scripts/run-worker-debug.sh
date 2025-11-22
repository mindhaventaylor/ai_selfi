#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_SOURCE=".env"
ENV_CLEAN="$ROOT/.env.clean"
if [ -f "$ENV_SOURCE" ]; then
  python3 <<PY > "$ENV_CLEAN"
from pathlib import Path
import shlex

lines = Path("$ROOT/$ENV_SOURCE").read_text().splitlines()
clean = []
for line in lines:
    stripped = line.strip()
    if not stripped or stripped.startswith("#") or "=" not in stripped:
        continue
    key, val = stripped.split("=", 1)
    if key.strip() == "OPENAI_API_KEY":
        continue
    clean.append(f'{key.strip()}={shlex.quote(val.strip())}')
Path("$ENV_CLEAN").write_text("\n".join(clean) + "\n")
PY
  set -o allexport
  source "$ENV_CLEAN"
  set +o allexport
else
  echo "⚠️ .env not found, relying on existing env"
fi

export SUPABASE_URL=${SUPABASE_URL:-${VITE_SUPABASE_URL}}
export SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
export GEMINI_API_KEY=${GEMINI_API_KEY:-"AIzaSyA-7_0RKEYOcDRkwBuVlJTWQycGh5tW8K8"}

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  exit 1
fi

FUNCTION_NAME="process-generation-queue"
SERVE_LOG="$ROOT/.tmp/process-generation-queue.log"

mkdir -p "$ROOT/.tmp"
rm -f "$SERVE_LOG"

echo "▶ Starting ${FUNCTION_NAME} locally (logs -> $SERVE_LOG)"
supabase functions serve "$FUNCTION_NAME" --env-file "$ENV_CLEAN" > "$SERVE_LOG" 2>&1 &
SERVE_PID=$!

function cleanup() {
  echo "🔌 Stopping local function (pid $SERVE_PID)"
  kill "$SERVE_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "⏱️ Waiting for the server to become available..."
until curl --silent --output /dev/null --fail http://localhost:54321/health; do
  printf '.'
  sleep 1
done
printf "\n"

echo "📦 Enqueueing a test job (npm run test:generation)"
npm run test:generation

echo "🔁 Calling the worker endpoint manually to force processing"
curl --fail -X POST http://localhost:54321/functions/v1/"$FUNCTION_NAME" \
  -H "Content-Type: application/json" \
  -d '{"trigger":"manual"}'

echo "✅ Worker debug script finished. Follow logs in $SERVE_LOG"
