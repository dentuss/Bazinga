# Deploying Bazinga to AWS — first-time guide

This guide gets the whole app live on **HTTPS** using **AWS EC2 + RDS** and
Docker Compose, assuming you have **never deployed a website before**. Plan
on 60–90 minutes the first time, mostly waiting on AWS resources to come up
and DNS to propagate.

A picture of what we're building lives in [`docs/diagrams.md`](../docs/diagrams.md#4-deployment).

```
                         ┌────────────────────────── EC2 host ──────────────────────────┐
  Internet ── :443 ───▶  │  nginx (TLS, Let's Encrypt)  ──┬──▶ client  (SPA static)      │
            ── :80  ───▶  │   └─ http→https redirect       └──▶ api     (:8080, .NET)     │
                         │  certbot (auto-renew sidecar)                                  │
                         └───────────────────────────────────────────┬───────────────────┘
                                                                      │ TLS (3306)
                                                            AWS RDS for MySQL (managed)
```

If anything is unclear or breaks, jump to [Troubleshooting](#troubleshooting)
at the bottom.

---

## Table of contents

1. [Things you need before you start](#1-things-you-need-before-you-start)
2. [Buy a domain & point it at AWS](#2-buy-a-domain--point-it-at-aws)
3. [Create the EC2 server](#3-create-the-ec2-server)
4. [Open the firewall (security groups)](#4-open-the-firewall-security-groups)
5. [Give the server a stable IP (Elastic IP)](#5-give-the-server-a-stable-ip-elastic-ip)
6. [Point your domain at the server (DNS A record)](#6-point-your-domain-at-the-server-dns-a-record)
7. [Create the RDS MySQL database](#7-create-the-rds-mysql-database)
8. [SSH into the server for the first time](#8-ssh-into-the-server-for-the-first-time)
9. [Get the deploy files onto the server](#9-get-the-deploy-files-onto-the-server)
10. [Install Docker](#10-install-docker)
11. [Get a GitHub token so the server can pull the images](#11-get-a-github-token-so-the-server-can-pull-the-images)
12. [Fill in `.env`](#12-fill-in-env)
13. [Issue the HTTPS certificate (first time only)](#13-issue-the-https-certificate-first-time-only)
14. [Start the stack](#14-start-the-stack)
15. [Verify it's working](#15-verify-its-working)
16. [Create the first admin user](#16-create-the-first-admin-user)
17. [Day-to-day operations](#17-day-to-day-operations)
18. [Releasing new versions](#18-releasing-new-versions)
19. [Troubleshooting](#troubleshooting)

---

## 1. Things you need before you start

- **An AWS account** with billing set up. The default region is fine; pick
  the one closest to your users (e.g. `eu-central-1` for Europe).
- **A computer with an SSH client**. macOS/Linux already have `ssh`. On
  Windows use PowerShell (built-in) or [MobaXterm](https://mobaxterm.mobatek.net/).
- **A domain name** you own (or are about to register). It can be at AWS
  Route 53, Namecheap, GoDaddy, Cloudflare — anywhere that lets you edit DNS
  records.
- **A GitHub account** that already has access to this repository (read
  access is enough to pull the prebuilt images).

You **do not** need to install Docker locally, or .NET, or Node — everything
runs on the server inside containers.

---

## 2. Buy a domain & point it at AWS

If you already own one, skip ahead to [step 6](#6-point-your-domain-at-the-server-dns-a-record).
Otherwise:

1. Pick a registrar — Namecheap, Cloudflare Registrar, or AWS Route 53. Cost
   is ~$10–$15/year for a `.com`.
2. Buy your domain (e.g. `bazinga-app.com`).
3. (Optional but recommended) Move the **nameservers** to AWS Route 53 so DNS
   changes are instant. Skip this for now — we can use whichever DNS panel
   came with the domain.

You only need the *root* domain (e.g. `bazinga.example.com` or just
`example.com`). We'll add the actual A record later in step 6 once we have
the server's IP.

---

## 3. Create the EC2 server

EC2 is "a virtual computer in AWS". We need one Linux machine.

1. Open the [AWS Console](https://console.aws.amazon.com/), pick your region
   (top-right dropdown).
2. Go to **EC2** → **Instances** → **Launch instances**.
3. Fill in:
   - **Name**: `bazinga-prod`
   - **AMI** (operating system): pick **Amazon Linux 2023** (or **Ubuntu
     Server 22.04 LTS** — both work). Stay with the free-tier eligible image
     if you see the green badge.
   - **Instance type**: `t3.small` is the minimum that builds happily. The
     free-tier `t3.micro` will run it but is tight on memory.
   - **Key pair (login)**: click **Create new key pair**. Name it
     `bazinga-key`, leave RSA + .pem defaults, click **Create**. Your browser
     downloads `bazinga-key.pem` — **save it somewhere safe**; you can't get
     it again. On macOS/Linux `chmod 400 bazinga-key.pem` so SSH accepts it.
   - **Network settings**: leave the default VPC selected. Allow **SSH**
     from "My IP", and tick **Allow HTTP** and **Allow HTTPS** from anywhere.
     We'll tidy this in the next step.
   - **Storage**: 20 GiB is plenty.
4. Click **Launch instance**. Wait ~30 seconds for it to reach the
   **Running** state and pass the 2/2 status checks (takes a couple minutes).

> **Note about RDS networking.** The instance needs to be in a VPC that can
> reach your RDS database. The "default VPC" is fine because we'll put RDS
> in the same one in step 7.

---

## 4. Open the firewall (security groups)

AWS calls firewalls "security groups". The wizard created one for you; let's
double-check the rules.

1. EC2 → **Security Groups**, find the one named after your instance
   (`launch-wizard-...`).
2. In **Inbound rules**, you should have:
   | Type  | Port | Source              |
   |-------|------|---------------------|
   | SSH   | 22   | My IP / your IP     |
   | HTTP  | 80   | 0.0.0.0/0 (Anywhere)|
   | HTTPS | 443  | 0.0.0.0/0 (Anywhere)|
3. If anything's missing, click **Edit inbound rules** → **Add rule** →
   pick the type → **Save rules**.

**Outbound** rules should be `All traffic → 0.0.0.0/0` (the default).

---

## 5. Give the server a stable IP (Elastic IP)

Without this the public IP changes every time the instance restarts, breaking
DNS and TLS.

1. EC2 → **Elastic IPs** → **Allocate Elastic IP address** → **Allocate**.
2. Select the new IP, click **Actions** → **Associate Elastic IP address**.
3. **Resource type: Instance**, pick `bazinga-prod`, click **Associate**.
4. Copy the IP — you'll paste it in the next step. It looks like `3.74.123.45`.

> Elastic IPs are **free while associated with a running instance**. If you
> stop the instance for a long time, AWS charges a small hourly fee.

---

## 6. Point your domain at the server (DNS A record)

In your DNS panel (Route 53, Namecheap, Cloudflare, etc.):

| Type | Host        | Value (Elastic IP) | TTL  |
|------|-------------|--------------------|------|
| A    | `@`         | `3.74.123.45`      | Auto |
| A    | `www`       | `3.74.123.45`      | Auto |

Verify before continuing — it can take a few minutes to a couple hours:

```bash
# from your laptop
dig +short bazinga.example.com   # should print the IP
dig +short www.bazinga.example.com
```

> **Don't proceed to step 13 (TLS issuance) until DNS resolves to the IP.**
> Let's Encrypt validates the domain by hitting `http://<your-domain>/...`
> and that won't work if DNS isn't ready yet.

---

## 7. Create the RDS MySQL database

We use AWS RDS so MySQL is managed, backed up automatically, and lives
outside the EC2 instance (we never lose data on a re-deploy).

1. Open **RDS** in the AWS console (same region as EC2!).
2. **Databases** → **Create database**.
3. Choose:
   - **Standard create**.
   - Engine: **MySQL**, version **8.x** (any 8.0.x is fine).
   - Templates: **Free tier** (if eligible) or **Dev/Test**.
   - DB instance identifier: `bazinga-db`.
   - Master username: `admin` (default).
   - Master password: generate a strong one and **save it** — you'll paste it
     into `.env` shortly.
   - DB instance class: `db.t3.micro` is enough for now.
   - Storage: 20 GiB gp3.
   - **Connectivity**: pick **the same VPC** as your EC2 instance.
     **Public access: No**. **VPC security group: Create new** named
     `bazinga-db-sg`.
   - **Additional configuration** → **Initial database name**: `bazinga`.
     (If you skip this you'll have to create the DB by hand later.)
4. **Create database** and wait ~5–10 minutes until status is **Available**.
5. Click into the DB → copy the **Endpoint** (e.g.
   `bazinga-db.abcdefxyz.eu-central-1.rds.amazonaws.com`). Save it.

**Now allow EC2 to reach RDS:**

1. RDS → click your DB → under **Connectivity & security** find
   **VPC security groups** → click `bazinga-db-sg`.
2. **Inbound rules** → **Edit inbound rules** → **Add rule**:
   - Type: **MYSQL/Aurora** (port 3306).
   - Source: choose **Security group**, then pick the EC2 instance's SG
     (`launch-wizard-...`).
3. **Save rules**.

This means only the EC2 host can talk to MySQL — not the public internet.

---

## 8. SSH into the server for the first time

From your laptop:

```bash
# Amazon Linux 2023 uses ec2-user; Ubuntu uses ubuntu.
ssh -i ~/Downloads/bazinga-key.pem ec2-user@3.74.123.45
#   ↑ path to the .pem file        ↑ your Elastic IP
```

On Windows PowerShell the command is identical. First time SSH will ask to
confirm the host key — type `yes`.

You should land at a shell prompt like `[ec2-user@ip-172-31-... ~]$`.

---

## 9. Get the deploy files onto the server

You **don't need the whole repo** — only the `deploy/` directory and a way to
reach the prebuilt images. Simplest: clone the repo, that gives you scripts,
templates, and a place to update later.

```bash
# on the EC2 host
sudo dnf install -y git    # Amazon Linux 2023
# or:  sudo apt-get update && sudo apt-get install -y git    # Ubuntu

sudo mkdir -p /opt/bazinga
sudo chown $USER:$USER /opt/bazinga
git clone https://github.com/dentuss/Bazinga.git /opt/bazinga
cd /opt/bazinga/deploy
```

(If you'd rather just copy the `deploy/` folder over with `scp`, that works
too — but the git clone is easier to update later.)

---

## 10. Install Docker

There's a script for it:

```bash
cd /opt/bazinga/deploy
sudo ./scripts/bootstrap-ec2.sh
```

This installs Docker + the Compose plugin and adds your user to the `docker`
group. **Log out and SSH back in** so the group membership takes effect, then
verify:

```bash
docker --version
docker compose version
docker ps                         # should print an empty header, no permission error
```

If you get `permission denied while trying to connect to the Docker daemon`,
you forgot the logout/login.

---

## 11. Get a GitHub token so the server can pull the images

The images are hosted on **GitHub Container Registry (GHCR)**, which needs
authentication even for public images sometimes (and definitely for private).

1. On your laptop, go to <https://github.com/settings/tokens/new?scopes=read:packages&description=bazinga-deploy>.
2. Set an expiration (e.g. 90 days), confirm `read:packages` is ticked, click
   **Generate token**, **copy** the string (`ghp_...` or `github_pat_...`).
3. On the EC2 host:

```bash
echo "PASTE_THE_TOKEN_HERE" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

You should see `Login Succeeded`. The credentials are saved in
`~/.docker/config.json`; no need to do this again unless the token expires.

---

## 12. Fill in `.env`

```bash
cd /opt/bazinga/deploy
cp .env.example .env
nano .env       # or vim
```

Walk through every field:

| Variable | What to put |
|----------|-------------|
| `DOMAIN` | Your apex domain, e.g. `bazinga.example.com`. **No** `https://`, **no** trailing slash. |
| `LETSENCRYPT_EMAIL` | Email Let's Encrypt sends expiry notices to. Use a real one. |
| `CERTBOT_STAGING` | Keep at `0` for real certs. Flip to `1` while debugging cert issuance — Let's Encrypt's staging CA has no rate limits, but the cert isn't trusted by browsers. |
| `API_IMAGE` | `ghcr.io/dentuss/bazinga-api:latest` (or pin a specific `:sha-…` tag). |
| `CLIENT_IMAGE` | `ghcr.io/dentuss/bazinga-client:latest`. |
| `ASPNETCORE_ENVIRONMENT` | Leave at `Production`. |
| `DB_CONNECTION_STRING` | The connection string for RDS. Paste the RDS endpoint from step 7. Example: <br/>`Server=bazinga-db.abcdefxyz.eu-central-1.rds.amazonaws.com;Port=3306;Database=bazinga;User=admin;Password=YOUR_MASTER_PW;SslMode=Required;AllowPublicKeyRetrieval=true` |
| `JWT_SECRET` | Run `openssl rand -base64 48` on the host and paste the result. **Anything random and ≥ 32 chars** is fine — but treat it like a password and never share. |
| `SMTP_*` | Leave blank for now if you don't have SMTP set up — magic-link emails will be logged to `docker compose logs api` instead of sent. Wire later. |
| `EMAIL_FROM_*` | `Bazinga` and `no-reply@your-domain.com`. |
| `STRIPE_*` | Leave blank to use the mock card form. Plug in real test keys when you're ready. |

Save and exit (`Ctrl-O`, `Enter`, `Ctrl-X` in nano).

> If your password contains a `;` or `=` it'll break the connection string —
> regenerate it in RDS without those characters.

---

## 13. Issue the HTTPS certificate (first time only)

```bash
cd /opt/bazinga/deploy
./scripts/init-letsencrypt.sh
```

What this does, in order:

1. Drops a throwaway self-signed cert so nginx will even start.
2. Brings up the `nginx` container.
3. Calls Let's Encrypt over HTTP (`/.well-known/acme-challenge/...`) to prove
   you control the domain.
4. Replaces the dummy cert with the real Let's Encrypt cert.
5. Reloads nginx.

You should see lines like:

```
### Requesting a Let's Encrypt certificate for bazinga.example.com www.bazinga.example.com ...
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/bazinga.example.com/fullchain.pem
### Reloading nginx ...
### Done. https://bazinga.example.com should now serve a trusted certificate.
```

If it fails, jump to [Troubleshooting → TLS issuance](#tls-issuance-failed).

> Renewals are automatic — the `certbot` sidecar tries every 12h and only
> actually renews within 30 days of expiry. nginx re-reads the cert every 6h.

---

## 14. Start the stack

```bash
./scripts/deploy.sh
```

This pulls the latest images, starts everything, and prints a status table.
First run takes a couple of minutes while images download.

```
NAME             COMMAND                  SERVICE   STATUS
bazinga-api      "dotnet BazingaCom..."   api       Up (healthy)
bazinga-client   "/docker-entrypoin..."   client    Up
bazinga-nginx    "/bin/sh -c 'while..."   nginx     Up
bazinga-certbot  "/bin/sh -c 'trap ..."   certbot   Up
```

---

## 15. Verify it's working

From your laptop:

```bash
curl -I https://bazinga.example.com/         # expect HTTP/2 200
curl -I http://bazinga.example.com/          # expect 301 → https://
curl    https://bazinga.example.com/api/comics | head    # expect JSON
```

Or just open `https://bazinga.example.com` in a browser — you should see the
landing page over a green padlock.

---

## 16. Create the first admin user

The `/admin` panel is gated by `user.role = 'ADMIN'`. Until you create one,
nobody can sign in to it.

**Easiest path** — sign up a regular account through the UI, then promote it
in MySQL once:

```bash
# from any machine that can reach RDS — easiest is the EC2 host itself.
sudo dnf install -y mariadb1011-client-utils   # AL2023
mysql -h bazinga-db.abcdefxyz.eu-central-1.rds.amazonaws.com -u admin -p bazinga
# enter the master password from .env
```

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
SELECT id, email, role FROM users WHERE email = 'you@example.com';
exit
```

Now sign in normally and open `https://bazinga.example.com/admin`. You're an
admin.

---

## 17. Day-to-day operations

```bash
cd /opt/bazinga/deploy

docker compose ps                       # what's running
docker compose logs -f api              # follow backend logs
docker compose logs -f nginx            # edge / TLS logs
docker compose restart api              # restart just one service
docker compose down                     # stop everything (RDS data untouched)
docker compose up -d                    # start everything back up
docker compose exec nginx nginx -s reload   # re-read nginx config
```

Disk filling up? Clean old images:

```bash
docker image prune -af
```

---

## 18. Releasing new versions

CI pushes a new image to GHCR every time `main`/`master` lands. On the
server:

```bash
cd /opt/bazinga/deploy && ./scripts/deploy.sh
```

That pulls `:latest` and restarts the changed containers. If you'd rather
automate it, set `ENABLE_SSH_DEPLOY=true` as a repo *variable* and add the
secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` — the release workflow
will SSH in and run `deploy.sh` for you.

---

## Troubleshooting

### `init-letsencrypt.sh` fails with `unauthorized` or `connection refused`

DNS isn't resolving to the server yet, or port 80 is closed.

```bash
dig +short bazinga.example.com         # must print the Elastic IP
curl http://bazinga.example.com/.well-known/acme-challenge/test   # must reach nginx (404 is fine)
```

Fix DNS / open port 80 in the security group, then re-run the script. While
debugging, set `CERTBOT_STAGING=1` in `.env` to avoid Let's Encrypt's
production rate limits.

### The API can't connect to RDS (`Unable to connect to any of the specified MySQL hosts`)

- RDS security group inbound rule for **MYSQL/Aurora** must allow the **EC2
  instance's SG** as source (not your IP, not 0.0.0.0/0).
- The connection string must use the RDS endpoint (`*.rds.amazonaws.com`),
  not the IP.
- `SslMode=Required;AllowPublicKeyRetrieval=true` is needed for RDS MySQL 8.

Quick probe from the EC2 host:

```bash
sudo dnf install -y nc
nc -vz bazinga-db.abcdefxyz.eu-central-1.rds.amazonaws.com 3306
# expect: Connection to ... succeeded!
```

### Browser shows "your connection is not private" / certificate warning

You're either still on the throwaway cert (re-run `init-letsencrypt.sh`),
or `CERTBOT_STAGING=1` is set — flip it to `0` and re-issue.

After a successful renewal, also do:

```bash
docker compose exec nginx nginx -s reload
```

### `docker compose pull` fails with `unauthorized`

Your GHCR login (step 11) expired or never happened. Re-run the
`docker login ghcr.io` command.

### Site looks broken, console shows mixed-content errors

The SPA expects to talk to the API via same-origin `/api/...`. If you see
calls to `http://localhost:8080`, you're running an old build — pull a fresh
client image (`./scripts/deploy.sh`).

### Nginx exits immediately with "host not found in upstream"

The `api` or `client` container failed health checks and isn't in the
network. `docker compose logs api` will tell you why — usually a bad
connection string.

### Where do uploaded user data and DB go if I rebuild the EC2 instance?

- **DB**: RDS is separate; rebuilding the EC2 doesn't touch it.
- **Let's Encrypt certs**: stored under `deploy/certbot/conf/` on the EC2
  disk. Back this folder up (or just re-run `init-letsencrypt.sh` on the
  new host — it'll re-issue).
- **`.env`**: keep a copy somewhere safe (it has secrets) so you can
  recreate it on a new host.

---

## Local development (no AWS needed)

From the repo root:

```bash
docker compose up --build
```

This starts a local MySQL + the API + the SPA + a plain-HTTP proxy on
`http://localhost:8080`. Stop with `Ctrl-C` or `docker compose down`.

For active frontend work, run `npm run dev` in `bazinga.client/` and `dotnet
run --project src/BazingaComics.Web` in `bazinga.api/` instead — much faster
feedback loop.
