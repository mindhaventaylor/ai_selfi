#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Load environment variables from root .env
ENV_SOURCE=".env"
if [ -f "$ENV_SOURCE" ]; then
  set -o allexport
  source "$ENV_SOURCE"
  set +o allexport
  echo "✅ Loaded environment from $ENV_SOURCE"
else
  echo "⚠️  $ENV_SOURCE not found, relying on existing env"
fi

# Export required vars for the listener
export PHOTO_API_URL=${PHOTO_API_URL:-"http://localhost:3000/api/photo-generation"}
export DATABASE_URL=${DATABASE_URL:-${SUPABASE_URL:-""}}

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL must be set"
  exit 1
fi

echo "🚀 Starting dev server and queue listener..."
echo "   - API URL: $PHOTO_API_URL"
echo "   - Database: ${DATABASE_URL%%@*}@***"

# Start queue listener in background
echo ""
echo "📡 Starting queue listener..."
npm run queue:listener &
LISTENER_PID=$!

# Wait a bit for listener to start
sleep 2

# Start dev server in foreground
echo ""
echo "🌐 Starting dev server..."
npm run dev &
DEV_PID=$!

# Cleanup function
function cleanup() {
  echo ""
  echo "🔌 Stopping processes..."
  kill "$LISTENER_PID" 2>/dev/null || true
  kill "$DEV_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

# Wait for both processes
wait

