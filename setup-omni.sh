#!/bin/bash
# OMNI MCP & Cloudflared Setup Script
# This script installs OMNI MCP and Cloudflared for workflow optimization
# Repository: https://github.com/fajarhide/omni

set -e

OMNI_VERSION="v0.4.5"
OMNI_URL="https://github.com/fajarhide/omni/releases/download/${OMNI_VERSION}/omni-x86_64-linux.tar.gz"
CLOUDFLARED_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
INSTALL_DIR="$HOME/.local/bin"

echo "=== OMNI MCP & Cloudflared Setup Script ==="
echo "OMNI Version: ${OMNI_VERSION}"
echo ""

# Create install directory
mkdir -p "$INSTALL_DIR"

# ============================================
# Install OMNI
# ============================================
echo "[1/2] Installing OMNI ${OMNI_VERSION}..."
cd /tmp
curl -L -o omni.tar.gz "$OMNI_URL"

echo "Extracting OMNI..."
tar -xzf omni.tar.gz

echo "Installing OMNI to ${INSTALL_DIR}..."
cp omni-x86_64-linux "$INSTALL_DIR/omni"
chmod +x "$INSTALL_DIR/omni"

# Cleanup OMNI files
rm -f omni.tar.gz omni-x86_64-linux omni-wasm.wasm

# Verify OMNI installation
echo ""
echo "Verifying OMNI installation..."
"$INSTALL_DIR/omni" --version

# ============================================
# Install Cloudflared
# ============================================
echo ""
echo "[2/2] Installing Cloudflared..."
curl -L -o "$INSTALL_DIR/cloudflared" "$CLOUDFLARED_URL"
chmod +x "$INSTALL_DIR/cloudflared"

# Verify Cloudflared installation
echo "Verifying Cloudflared installation..."
"$INSTALL_DIR/cloudflared" --version

echo ""
echo "=== Installation Complete ==="
echo "Installed tools:"
echo "  - OMNI:         ${INSTALL_DIR}/omni"
echo "  - Cloudflared:  ${INSTALL_DIR}/cloudflared"
echo ""
echo "Make sure ${INSTALL_DIR} is in your PATH."
echo "Add this to your ~/.bashrc or ~/.zshrc:"
echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
echo ""
echo "=== OMNI Usage Examples ==="
echo "  git diff | omni           # Distill git output"
echo "  docker logs <id> | omni   # Distill container logs"
echo "  npm install | omni        # Clean dependency logs"
echo "  omni density < file.txt   # Analyze token density"
