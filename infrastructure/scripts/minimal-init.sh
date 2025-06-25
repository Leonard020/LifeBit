#!/bin/bash
# LifeBit minimal init script
# This script runs on first boot and only performs essential updates.

set -e

exec > /var/log/lifebit-init.log 2>&1

echo "[INFO] $(date) - Starting minimal initialization"

# Basic package update (non-interactive)
export DEBIAN_FRONTEND=noninteractive
apt-get update -y && apt-get upgrade -y --no-install-recommends

# Ensure Python is available for Ansible
if ! command -v python &>/dev/null; then
  ln -s /usr/bin/python3 /usr/bin/python || true
fi

echo "[INFO] $(date) - Initialization completed" 