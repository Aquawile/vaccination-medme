#!/usr/bin/env bash
# Keeps this folder current with GitHub every 30 seconds while the folder is open in VS Code.
cd "$(dirname "$0")/.."
while true; do bash scripts/sync.sh >/dev/null 2>&1; sleep 30; done
