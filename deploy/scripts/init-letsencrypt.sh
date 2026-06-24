#!/usr/bin/env bash
# One-time TLS bootstrap for the Bazinga edge nginx.
#
# nginx won't start if its 443 server references certs that don't exist yet, so
# we: (1) drop a throwaway self-signed cert, (2) start nginx, (3) ask Let's
# Encrypt for the real cert over the http-01 webroot challenge, (4) reload.
# Run once per host (re-running is safe). Renewals are automatic via the certbot
# service in docker-compose.yml.
#
# Usage:  cd deploy && ./scripts/init-letsencrypt.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "ERROR: deploy/.env not found. Copy .env.example to .env and fill it in." >&2
  exit 1
fi
# shellcheck disable=SC1091
set -a; . ./.env; set +a

: "${DOMAIN:?DOMAIN must be set in .env}"
: "${LETSENCRYPT_EMAIL:?LETSENCRYPT_EMAIL must be set in .env}"

DATA="./certbot"
DOMAINS=("$DOMAIN" "www.$DOMAIN")
RSA_KEY_SIZE=4096

mkdir -p "$DATA/conf" "$DATA/www"

# Recommended TLS params used by the nginx 443 server.
if [ ! -e "$DATA/conf/options-ssl-nginx.conf" ] || [ ! -e "$DATA/conf/ssl-dhparams.pem" ]; then
  echo "### Downloading recommended TLS parameters ..."
  curl -fsSL https://raw.githubusercontent.com/certbot/certbot/main/certbot-nginx/src/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    > "$DATA/conf/options-ssl-nginx.conf"
  curl -fsSL https://raw.githubusercontent.com/certbot/certbot/main/certbot/ssl-dhparams.pem \
    > "$DATA/conf/ssl-dhparams.pem"
fi

LIVE="$DATA/conf/live/$DOMAIN"
echo "### Creating a throwaway certificate for $DOMAIN ..."
mkdir -p "$LIVE"
docker compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$RSA_KEY_SIZE -days 1 \
    -keyout '/etc/letsencrypt/live/$DOMAIN/privkey.pem' \
    -out '/etc/letsencrypt/live/$DOMAIN/fullchain.pem' \
    -subj '/CN=localhost'" certbot

echo "### Starting nginx ..."
docker compose up -d nginx

echo "### Deleting the throwaway certificate ..."
docker compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$DOMAIN && \
  rm -Rf /etc/letsencrypt/archive/$DOMAIN && \
  rm -Rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot

# Build certbot args
domain_args=""
for d in "${DOMAINS[@]}"; do domain_args="$domain_args -d $d"; done
staging_arg=""
if [ "${CERTBOT_STAGING:-0}" = "1" ]; then staging_arg="--staging"; fi

echo "### Requesting a Let's Encrypt certificate for ${DOMAINS[*]} ..."
# shellcheck disable=SC2086
docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $domain_args \
    --email $LETSENCRYPT_EMAIL \
    --rsa-key-size $RSA_KEY_SIZE \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    --force-renewal" certbot

echo "### Reloading nginx ..."
docker compose exec nginx nginx -s reload

echo "### Done. https://$DOMAIN should now serve a trusted certificate."
