#!/bin/bash
# =================================================================
# SSH Key Injection Script for NCP Ubuntu Server (Robust Version)
# =================================================================
# This script configures the 'ubuntu' user for key-based SSH access.
# It logs all output to /var/log/init-script.log for debugging.
# It retries fetching the metadata service to handle timing issues.
# =================================================================

set -e
LOG_FILE="/var/log/init-script.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "--- Starting SSH setup init script for 'ubuntu' user at $(date) ---"

# --- Wait and Retry for Metadata Service ---
PUB_KEY=""
for i in {1..5}; do
    echo "Attempt $i to fetch public key..."
    # Use -f to fail fast on HTTP errors
    PUB_KEY=$(curl -f -s http://169.254.169.254/latest/meta-data/public-keys/0/openssh-key)
    if [ -n "$PUB_KEY" ]; then
        echo "Successfully fetched public key."
        break
    fi
    echo "Failed to fetch public key (curl exit code: $?), retrying in 10 seconds..."
    sleep 10
done

if [ -z "$PUB_KEY" ]; then
    echo "FATAL: Could not retrieve public key from metadata service after 5 attempts. Exiting."
    exit 1
fi

echo "Public key found: ${PUB_KEY:0:40}..."

# --- Setup authorized_keys for ubuntu user ---
UBUNTU_HOME="/home/ubuntu"
echo "Configuring SSH for 'ubuntu' user in $UBUNTU_HOME."

# Ensure the ubuntu user and its home directory exist
if ! id "ubuntu" &>/dev/null; then
    echo "FATAL: User 'ubuntu' does not exist. Cannot configure SSH."
    exit 1
fi

if [ ! -d "$UBUNTU_HOME" ]; then
    echo "WARNING: Home directory $UBUNTU_HOME not found. It will be created."
    mkdir -p "$UBUNTU_HOME"
    chown ubuntu:ubuntu "$UBUNTU_HOME"
fi

mkdir -p "$UBUNTU_HOME/.ssh"
chmod 700 "$UBUNTU_HOME/.ssh"

echo "Adding public key to $UBUNTU_HOME/.ssh/authorized_keys"
echo "$PUB_KEY" >> "$UBUNTU_HOME/.ssh/authorized_keys"
chmod 600 "$UBUNTU_HOME/.ssh/authorized_keys"

# Ensure correct ownership
chown -R ubuntu:ubuntu "$UBUNTU_HOME/.ssh"
echo "Set ownership for $UBUNTU_HOME/.ssh directory."

# --- Harden SSH Daemon ---
echo "Hardening sshd_config to disable password authentication..."
# Use sed -i.bak to create a backup
sed -i.bak \
    -e 's/^#?PasswordAuthentication .*/PasswordAuthentication no/' \
    /etc/ssh/sshd_config

echo "Restarting SSH service to apply changes."
systemctl restart sshd

echo "--- SSH setup init script finished successfully at $(date) ---"
exit 0 