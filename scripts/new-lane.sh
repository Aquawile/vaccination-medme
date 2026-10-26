#!/usr/bin/env bash
# Gives an agent its own folder, branch and port so two agents never touch the same files.
# Usage: bash scripts/new-lane.sh <name> [port]     e.g. bash scripts/new-lane.sh parent 8444
set -eu
name="${1:?give the lane a short name, for example parent or pharmacist}"
port="${2:-8444}"
root="$(cd "$(dirname "$0")/.." && pwd)"
dir="$root/../$(basename "$root")-$name"
git -C "$root" fetch --all --prune --quiet
git -C "$root" worktree add "$dir" -b "feat/$name" origin/staging
cd "$dir" && npx -y pnpm@10 install --frozen-lockfile
echo
echo "Lane ready: $dir  (branch feat/$name)"
echo "Open that folder in its own VS Code window, then run:  PORT=$port npx -y pnpm@10 dev"
