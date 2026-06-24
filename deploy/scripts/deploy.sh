#!/usr/bin/env bash
# Pull the latest images and (re)start the stack. Run on the EC2 host after CI
# has pushed new images, or via SSH from CI. Idempotent.
#
# Usage:  cd deploy && ./scripts/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "ERROR: deploy/.env not found. Copy .env.example to .env and fill it in." >&2
  exit 1
fi

echo "### Pulling images ..."
docker compose pull api client nginx certbot

# If TLS has never been issued on this host, do it now so nginx can start.
if [ ! -d "./certbot/conf/live" ]; then
  echo "### No certificates yet — running first-time TLS bootstrap ..."
  ./scripts/init-letsencrypt.sh
fi

echo "### Starting stack ..."
docker compose up -d

echo "### Pruning dangling images ..."
docker image prune -f >/dev/null 2>&1 || true

echo "### Status:"
docker compose ps
