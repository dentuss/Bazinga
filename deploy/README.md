# Bazinga Deployment Setup

One-time setup steps on the GitLab VM (`gitlab.gitlab-servak`) before the CI/CD
pipeline can deploy successfully.

## 1. Install runtimes

```bash
# .NET 9 runtime (for the API)
sudo apt-get update
sudo apt-get install -y dotnet-runtime-9.0 aspnetcore-runtime-9.0

# nginx (to serve the client SPA and reverse-proxy the API)
sudo apt-get install -y nginx rsync
```

## 2. Create deploy user and target directories

```bash
sudo useradd -m -s /bin/bash deploy
sudo mkdir -p /var/www/bazinga-prod/{api,client}
sudo mkdir -p /var/www/bazinga-dev/{api,client}
sudo chown -R deploy:deploy /var/www/bazinga-prod /var/www/bazinga-dev
```

## 3. Generate SSH key for CI

On any local machine:

```bash
ssh-keygen -t ed25519 -f gitlab_ci_key -N ""
ssh-copy-id -i gitlab_ci_key.pub deploy@gitlab.gitlab-servak
```

Add the **private key** content to GitLab:
*Settings -> CI/CD -> Variables*

| Key                | Value                            | Protected | Masked |
|--------------------|----------------------------------|-----------|--------|
| `SSH_PRIVATE_KEY`  | full content of `gitlab_ci_key`  | off       | off    |
| `DEPLOY_HOST`      | `gitlab.gitlab-servak` (or IP)   | off       | off    |
| `DEPLOY_USER`      | `deploy`                         | off       | off    |

> Important: turn **Protected** OFF, otherwise the variable is not available
> for the `dev` branch.

## 4. Install systemd services

```bash
sudo cp deploy/bazinga-api-prod.service /etc/systemd/system/
sudo cp deploy/bazinga-api-dev.service  /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable bazinga-api-prod bazinga-api-dev
```

Don't start them yet - they will fail until the first deploy uploads the DLLs.
After the first successful pipeline run, start them:

```bash
sudo systemctl start bazinga-api-prod
sudo systemctl start bazinga-api-dev
```

## 5. Allow `deploy` to restart services without password

```bash
sudo cp deploy/sudoers-deploy /etc/sudoers.d/deploy
sudo chmod 440 /etc/sudoers.d/deploy
sudo visudo -c   # validate
```

## 6. nginx config (optional, for serving the client)

`/etc/nginx/sites-available/bazinga-prod`:

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/bazinga-prod/client;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```

`/etc/nginx/sites-available/bazinga-dev`:

```nginx
server {
    listen 8080;
    server_name _;

    root /var/www/bazinga-dev/client;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5001/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/bazinga-prod /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/bazinga-dev  /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 7. Trigger the pipeline

Push any change to `main` or `dev`. After the pipeline finishes:

- prod is available at `http://gitlab.gitlab-servak/`
- dev (staging) at `http://gitlab.gitlab-servak:8080/`
- API logs: `journalctl -u bazinga-api-prod -f` (or `-dev`)
