#!/usr/bin/env bash
# Brings this clone up to date with GitHub without touching your work.
# Fetches every branch, then fast-forwards the branch you are on if it is clean and behind.
set -u
cd "$(dirname "$0")/.."
git fetch --all --prune --quiet || { echo "sync: fetch failed (offline?)"; exit 0; }
branch=$(git rev-parse --abbrev-ref HEAD)
if [ -z "$(git status --porcelain)" ] && git rev-parse --verify -q "@{u}" >/dev/null; then
  git merge --ff-only --quiet "@{u}" 2>/dev/null && echo "sync: $branch is up to date" || echo "sync: $branch has local commits, left alone"
else
  echo "sync: fetched; $branch has local changes or no upstream, left alone"
fi
echo "staging is at $(git rev-parse --short origin/staging 2>/dev/null)"
