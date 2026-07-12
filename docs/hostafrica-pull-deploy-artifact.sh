#!/usr/bin/env bash
set -Eeuo pipefail

# Use this when HostAfrica kills npm during install/build.
# It pulls the prebuilt Linux standalone artifact from the GitHub `deploy` branch.

APP_DIR="${APP_DIR:-$HOME/sunspark}"
BRANCH="${BRANCH:-deploy}"
BACKUP_ROOT="${BACKUP_ROOT:-$HOME/backups}"

timestamp="$(date +%Y%m%d-%H%M%S)"
backup_dir="$BACKUP_ROOT/sunspark-artifact-$timestamp"

echo "==> Sunspark artifact deploy started at $timestamp"
mkdir -p "$backup_dir"
cd "$APP_DIR"

if [ -f .env ]; then
  cp .env "$backup_dir/.env"
fi

if [ -d public/uploads ]; then
  mkdir -p "$backup_dir/uploads"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a public/uploads/ "$backup_dir/uploads/"
  else
    cp -a public/uploads/. "$backup_dir/uploads/"
  fi
fi

echo "==> Pulling prebuilt deploy branch"
git fetch origin "$BRANCH"
git checkout -B "$BRANCH" "origin/$BRANCH"

if [ -f "$backup_dir/.env" ]; then
  cp "$backup_dir/.env" .env
fi

if [ -d "$backup_dir/uploads" ]; then
  mkdir -p public/uploads
  if command -v rsync >/dev/null 2>&1; then
    rsync -a "$backup_dir/uploads/" public/uploads/
  else
    cp -a "$backup_dir/uploads"/. public/uploads/
  fi
fi

mkdir -p tmp
touch tmp/restart.txt

echo "==> Artifact deployed"
git log -1 --oneline
