#!/usr/bin/env bash
# One-time provisioning for a fresh EC2 host (Amazon Linux 2023 or Ubuntu 22.04+).
# Installs Docker + the compose plugin and prepares the deploy directory.
#
# Usage (on the EC2 host):  sudo ./bootstrap-ec2.sh
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

TARGET_USER="${SUDO_USER:-ec2-user}"

if command -v dnf >/dev/null 2>&1; then
  # Amazon Linux 2023 / Fedora family
  dnf -y install docker
  systemctl enable --now docker
  # compose plugin
  mkdir -p /usr/libexec/docker/cli-plugins
  COMPOSE_VERSION="v2.29.7"
  curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-$(uname -m)" \
    -o /usr/libexec/docker/cli-plugins/docker-compose
  chmod +x /usr/libexec/docker/cli-plugins/docker-compose
elif command -v apt-get >/dev/null 2>&1; then
  # Ubuntu / Debian — official Docker repo (ships the compose plugin)
  apt-get update
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
else
  echo "Unsupported distro: need dnf or apt-get." >&2
  exit 1
fi

usermod -aG docker "$TARGET_USER" || true

echo
echo "Docker installed:"
docker --version
docker compose version
echo
echo "Next steps:"
echo "  1) Log out/in (or 'newgrp docker') so '$TARGET_USER' can use docker without sudo."
echo "  2) Point your domain's DNS A/AAAA record at this host's public IP."
echo "  3) Open inbound TCP 80 and 443 in the EC2 security group."
echo "  4) In the deploy/ dir: cp .env.example .env && edit it."
echo "  5) Run ./scripts/init-letsencrypt.sh then ./scripts/deploy.sh"
