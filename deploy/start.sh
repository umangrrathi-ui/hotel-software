#!/bin/sh
# Container entrypoint: apply pending D1 migrations, then serve the built app on workerd (Cloudflare's runtime).
set -eu
STATE_DIR="${STATE_DIR:-/data/state}"
CONFIG=dist/server/wrangler.json
WRANGLER="node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js"

if [ -z "${APP_DOMAIN:-}" ]; then
  echo "APP_DOMAIN must be set, e.g. hotel.example.com. See .env.example." >&2
  exit 1
fi
if [ "${#OWNER_SETUP_KEY}" -lt 12 ]; then
  echo "OWNER_SETUP_KEY must be set (at least 12 characters). See .env.example." >&2
  exit 1
fi

# Point the generated config at the repo's SQL migrations so `migrations apply` tracks what already ran.
node -e '
const fs=require("fs"),p=process.argv[1],c=JSON.parse(fs.readFileSync(p,"utf8"));
c.d1_databases[0].migrations_dir=require("path").resolve("drizzle");
fs.writeFileSync(p,JSON.stringify(c));' "$CONFIG"

mkdir -p "$STATE_DIR"
CI=1 $WRANGLER d1 migrations apply DB --local --persist-to "$STATE_DIR" --config "$CONFIG"

# --local-upstream makes request.url carry the public https://APP_DOMAIN origin,
# so the app's same-origin checks match what the browser sends through the proxy.
# APP_PROTOCOL=http is only for testing on a laptop at http://localhost:8787.
exec $WRANGLER dev --config "$CONFIG" --local --persist-to "$STATE_DIR" \
  --ip 0.0.0.0 --port 8787 --inspector-port 0 --show-interactive-dev-session=false \
  --local-upstream "$APP_DOMAIN" --upstream-protocol "${APP_PROTOCOL:-https}" \
  --var "OWNER_SETUP_KEY:$OWNER_SETUP_KEY"
