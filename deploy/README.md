# Bazinga deployment — AWS EC2 + Docker Compose + HTTPS

Production runs as a Docker Compose stack on a single EC2 host, behind an nginx
edge that terminates TLS with free, auto-renewing Let's Encrypt certificates.
MySQL is **AWS RDS** (managed), so there is no database container.

```
                         ┌────────────────────────── EC2 host ──────────────────────────┐
  Internet ── :443 ───▶  │  nginx (TLS, Let's Encrypt)  ──┬──▶ client  (SPA static)      │
            ── :80  ───▶  │   └─ http→https redirect       └──▶ api     (:8080, .NET)     │
                         │  certbot (auto-renew sidecar)                                  │
                         └───────────────────────────────────────────┬───────────────────┘
                                                                      │ TLS (3306)
                                                            AWS RDS for MySQL (managed)
```

Images are built in CI and **pulled** on the host — nothing is built in
production. The app is served on one HTTPS origin: the SPA at `/`, the API
under `/api/` (the frontend calls the API with same-origin relative paths).

## Files

| Path | Purpose |
|------|---------|
| `docker-compose.yml` | Production stack: `api`, `client`, `nginx`, `certbot`. |
| `.env.example` | Template for `.env` (domain, RDS connection string, secrets, image tags). |
| `nginx/templates/default.conf.template` | Edge config; `${DOMAIN}` filled in at container start. |
| `nginx/dev.conf` | Plain-HTTP edge used by the **local** stack (`../docker-compose.yml`). |
| `scripts/bootstrap-ec2.sh` | Installs Docker + compose plugin on a fresh host. |
| `scripts/init-letsencrypt.sh` | One-time TLS issuance. |
| `scripts/deploy.sh` | Pull images + (re)start the stack. |

---

## 1. AWS prerequisites

1. **EC2 instance** — Amazon Linux 2023 or Ubuntu 22.04+, t3.small or larger.
   Security group inbound: **TCP 22** (your IP), **TCP 80** and **TCP 443**
   (0.0.0.0/0).
2. **Elastic IP** associated with the instance (so the DNS record is stable).
3. **DNS** — an `A` record for `your-domain.com` (and `www`) pointing at the
   Elastic IP. TLS issuance fails until this resolves publicly.
4. **RDS for MySQL** — a MySQL 8.x instance. Put it in the **same VPC** as the
   EC2 host and allow inbound **3306** from the EC2 instance's security group
   (not from the world). Create the database and an app user:
   ```sql
   CREATE DATABASE bazinga CHARACTER SET utf8mb4;
   CREATE USER 'bazinga_app'@'%' IDENTIFIED BY 'a-strong-password';
   GRANT ALL PRIVILEGES ON bazinga.* TO 'bazinga_app'@'%';
   FLUSH PRIVILEGES;
   ```
   The schema itself is created automatically on first API start.

## 2. Provision the host (once)

```bash
# copy this repo's deploy/ dir to the host, e.g. /opt/bazinga/deploy, then:
cd /opt/bazinga/deploy
sudo ./scripts/bootstrap-ec2.sh
# log out/in so your user is in the docker group
```

## 3. Configure

```bash
cp .env.example .env
nano .env   # set DOMAIN, LETSENCRYPT_EMAIL, DB_CONNECTION_STRING, JWT_SECRET,
            # API_IMAGE / CLIENT_IMAGE, and (optionally) SMTP + Stripe keys
```

Generate a strong JWT secret with `openssl rand -base64 48`.

## 4. Authenticate to the image registry

Pull access for the images named in `.env` (`API_IMAGE` / `CLIENT_IMAGE`):

```bash
# GitHub Container Registry
echo "$GHCR_TOKEN" | docker login ghcr.io -u <user> --password-stdin
# …or Amazon ECR
aws ecr get-login-password --region <region> \
  | docker login --username AWS --password-stdin <acct>.dkr.ecr.<region>.amazonaws.com
```

## 5. Issue certificates + go live

```bash
./scripts/init-letsencrypt.sh   # one-time: dummy cert → nginx up → real cert
./scripts/deploy.sh             # pull images + start the full stack
```

Visit `https://your-domain.com` — it should load over a trusted certificate,
with HTTP redirecting to HTTPS. Renewals happen automatically (the `certbot`
sidecar renews; `nginx` reloads every 6h).

> Tip: while testing, set `CERTBOT_STAGING=1` in `.env` to use Let's Encrypt's
> staging CA and avoid the production rate limits, then flip to `0` and re-run
> `init-letsencrypt.sh` for a trusted cert.

## 6. Redeploying new versions

CI pushes new images; on the host just:

```bash
cd /opt/bazinga/deploy && ./scripts/deploy.sh
```

(or wire CI to SSH in and run it — see `.github/workflows/`).

## Operations

```bash
docker compose ps                 # what's running
docker compose logs -f api        # backend logs
docker compose logs -f nginx      # edge / TLS logs
docker compose exec nginx nginx -s reload
docker compose down               # stop everything (RDS data is untouched)
```

### TLS troubleshooting
- `init-letsencrypt.sh` fails with a challenge error → DNS isn't pointing at the
  host yet, or port 80 is blocked by the security group.
- Cert renews but the browser still shows the old one → `docker compose exec
  nginx nginx -s reload`.

## Local development

From the repo root (not this dir):

```bash
docker compose up --build   # db + api + client + http proxy → http://localhost:8080
```

or run the API and `npm run dev` (the Vite dev server proxies `/api` → `:8080`).
