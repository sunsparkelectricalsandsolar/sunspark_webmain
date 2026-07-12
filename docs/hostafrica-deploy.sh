#!/usr/bin/env bash
set -Eeuo pipefail

# HostAfrica backend deploy for backend.sunsparkelectricals.co.ke.
# Run from SSH:
#   cd ~/sunspark
#   bash docs/hostafrica-deploy.sh

APP_DIR="${APP_DIR:-$HOME/sunspark}"
REPO_URL="${REPO_URL:-https://github.com/muchirifloy/sunspark.git}"
BRANCH="${BRANCH:-main}"
NODE_ENV_DIR="${NODE_ENV_DIR:-$HOME/nodevenv/sunspark/20}"
INSTALL_DEPS="${INSTALL_DEPS:-0}"
RUN_MIGRATE="${RUN_MIGRATE:-1}"
RUN_SEED="${RUN_SEED:-0}"

echo "==> Pulling Sunspark backend"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
git log -1 --oneline

if [ -f "$NODE_ENV_DIR/bin/activate" ]; then
  set +u
  # shellcheck source=/dev/null
  source "$NODE_ENV_DIR/bin/activate"
  set -u
fi

export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

cd "$APP_DIR/apps/api"

if [ "$INSTALL_DEPS" = "1" ] || [ ! -d node_modules ]; then
  echo "==> Installing backend dependencies"
  npm install --omit=dev --no-audit --no-fund --legacy-peer-deps --prefer-offline --maxsockets=1
else
  echo "==> Skipping npm install"
fi

if [ "$RUN_MIGRATE" = "1" ]; then
  echo "==> Applying SQL schema"
  npm run migrate
fi

if [ "$RUN_SEED" = "1" ]; then
  echo "==> Seeding admin/categories/settings"
  npm run seed
fi

echo "==> Building backend"
npm run build

echo "==> Restarting cPanel Node app"
mkdir -p "$APP_DIR/tmp"
touch "$APP_DIR/tmp/restart.txt"

echo "==> Done"
