#!/usr/bin/env bash
set -euo pipefail

echo "Installing backend dependencies..."
cd /workspaces/PulseControl/backend
npm install

echo "Installing frontend dependencies..."
cd /workspaces/PulseControl/frontend
npm install

echo "Codespaces setup complete."
