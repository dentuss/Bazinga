# Bazinga Deployment (Docker Compose)

The pipeline builds two Docker images per branch (API + client), pushes them to
the GitLab Container Registry, then SSHes to the target server and runs
`docker compose pull && up -d` against `docker-compose.yml`.

```
push to main  ->  build_api_main, build_client_main  ->  deploy_main  (port 80,   /var/www/bazinga-prod)
push to dev   ->  build_api_dev,  build_client_dev   ->  deploy_dev   (port 8080, /var/www/bazinga-dev)
```

The same `docker-compose.yml` is used for both environments. The deploy job
writes a fresh `.env` next to it on the server with the right image tags and
port, so prod and dev are isolated by `COMPOSE_PROJECT_NAME` and live as two
independent compose stacks.

## One-time GitLab setup

### 1. Enable the Container Registry on your GitLab instance

If your self-hosted GitLab does not yet have the registry enabled, edit
`/etc/gitlab/gitlab.rb`:

```ruby
registry_external_url 'https://gitlab.gitlab-servak:5050'
```

Then `sudo gitlab-ctl reconfigure`. Verify in the project: *Deploy -> Container
Registry* should be visible.

### 2. Configure the GitLab Runner for Docker-in-Docker

Add to `/etc/gitlab-runner/config.toml` under `[runners.docker]`:

```toml
privileged = true
volumes = ["/certs/client", "/cache"]
```

Restart: `sudo systemctl restart gitlab-runner`. This is required so the
runner can build images via `docker:24-dind`.

### 3. CI/CD variables (Project -> Settings -> CI/CD -> Variables)

| Key               | Value                                              | Protected | Masked |
|-------------------|----------------------------------------------------|-----------|--------|
| `SSH_PRIVATE_KEY` | content of the deploy SSH private key (full file)  | off       | off    |
| `DEPLOY_HOST`     | `gitlab.gitlab-servak` or its IP                   | off       | off    |
| `DEPLOY_USER`     | `deploy`                                           | off       | off    |

`Protected: off` is important - otherwise the variables are not exposed on the
`dev` branch.

## One-time server setup (the GitLab VM)

### 4. Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker
```

### 5. Create the deploy user

```bash
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy
sudo mkdir -p /var/www/bazinga-prod /var/www/bazinga-dev
sudo chown -R deploy:deploy /var/www/bazinga-prod /var/www/bazinga-dev
```

### 6. SSH key for CI

On any local machine:

```bash
ssh-keygen -t ed25519 -f gitlab_ci_key -N ""
ssh-copy-id -i gitlab_ci_key.pub deploy@gitlab.gitlab-servak
```

Copy the **private key** content into the `SSH_PRIVATE_KEY` CI variable.

### 7. Trust the GitLab registry from the server

The registry on `gitlab.gitlab-servak:5050` likely uses a self-signed cert.
Either install the CA into Docker:

```bash
sudo mkdir -p /etc/docker/certs.d/gitlab.gitlab-servak:5050
sudo cp /path/to/gitlab.crt /etc/docker/certs.d/gitlab.gitlab-servak:5050/ca.crt
sudo systemctl restart docker
```

Or, for a lab environment, mark it as insecure in `/etc/docker/daemon.json`:

```json
{
  "insecure-registries": ["gitlab.gitlab-servak:5050"]
}
```

```bash
sudo systemctl restart docker
```

## Trigger the pipeline

```bash
git push origin main   # triggers build_*_main + deploy_main
git push origin dev    # triggers build_*_dev  + deploy_dev
```

After both pipelines turn green:

- production: `http://gitlab.gitlab-servak/`
- staging:    `http://gitlab.gitlab-servak:8080/`

## Useful commands on the server

```bash
# what is running
cd /var/www/bazinga-prod && docker compose ps
cd /var/www/bazinga-dev  && docker compose ps

# logs
docker compose logs -f api
docker compose logs -f client

# manual restart
docker compose restart

# stop everything
docker compose down
```

## Screenshots for the report

1. *Build -> Pipelines* with two green pipelines (`main` + `dev`)
2. Each pipeline opened, showing build_* + deploy_* jobs all green
3. *Deploy -> Container Registry* showing pushed images (`api:main`, `client:main`, `api:dev`, `client:dev`)
4. *Operate -> Environments* with `production` and `staging` and their URLs
5. On the server: `docker compose ps` output for both stacks, and `curl -I http://localhost/` and `curl -I http://localhost:8080/` returning 200
