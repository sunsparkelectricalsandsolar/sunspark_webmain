#!/usr/bin/env bash
set -Eeuo pipefail

# Sunspark HostAfrica deployment helper.
# Run this on SSH as the cPanel user:
#   bash ~/sunspark/docs/hostafrica-deploy.sh
#
# If ~/sunspark is not yet a Git checkout, the script backs it up, clones the
# GitHub repo into the same path, restores .env and public/uploads, then builds.

APP_DIR="${APP_DIR:-$HOME/sunspark}"
REPO_URL="${REPO_URL:-https://github.com/muchirifloy/sunspark.git}"
BRANCH="${BRANCH:-main}"
NODE_ENV_DIR="${NODE_ENV_DIR:-$HOME/nodevenv/sunspark/20}"
BACKUP_ROOT="${BACKUP_ROOT:-$HOME/backups}"
IMPORT_SQL="${IMPORT_SQL:-}"

timestamp="$(date +%Y%m%d-%H%M%S)"
backup_dir="$BACKUP_ROOT/sunspark-$timestamp"

copy_dir_contents() {
  source_dir="$1"
  target_dir="$2"
  mkdir -p "$target_dir"

  if command -v rsync >/dev/null 2>&1; then
    rsync -a "$source_dir"/ "$target_dir"/
    return
  fi

  if command -v tar >/dev/null 2>&1; then
    (cd "$source_dir" && tar cf - .) | (cd "$target_dir" && tar xf -)
    return
  fi

  cp -a "$source_dir"/. "$target_dir"/
}

repair_cloudlinux_node_modules() {
  modules_target="$NODE_ENV_DIR/lib/node_modules"
  if [ ! -d "$modules_target" ]; then
    return
  fi

  if [ -e "$APP_DIR/node_modules" ] && [ ! -L "$APP_DIR/node_modules" ]; then
    broken_modules="$BACKUP_ROOT/node_modules-$timestamp"
    echo "==> Moving non-symlink node_modules to $broken_modules"
    mv "$APP_DIR/node_modules" "$broken_modules"
  fi

  if [ ! -e "$APP_DIR/node_modules" ]; then
    echo "==> Linking CloudLinux node_modules virtualenv"
    ln -s "$modules_target" "$APP_DIR/node_modules"
  fi
}

echo "==> Sunspark deploy started at $timestamp"
mkdir -p "$BACKUP_ROOT"

if [ -d "$APP_DIR" ]; then
  echo "==> Backing up current app to $backup_dir"
  mkdir -p "$backup_dir"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a \
      --exclude node_modules \
      --exclude .next/cache \
      "$APP_DIR"/ "$backup_dir"/
  else
    mkdir -p "$backup_dir"
    (cd "$APP_DIR" && tar \
      --exclude ./node_modules \
      --exclude ./.next/cache \
      -cf - .) | (cd "$backup_dir" && tar xf -)
  fi
fi

if [ ! -d "$APP_DIR/.git" ]; then
  echo "==> App root is not a Git checkout. Replacing it with a fresh clone."
  old_dir="${APP_DIR}.old.$timestamp"
  if [ -d "$APP_DIR" ]; then
    mv "$APP_DIR" "$old_dir"
  fi

  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"

  if [ -f "$old_dir/.env" ]; then
    cp "$old_dir/.env" "$APP_DIR/.env"
  fi

  if [ -d "$old_dir/public/uploads" ]; then
    mkdir -p "$APP_DIR/public/uploads"
    copy_dir_contents "$old_dir/public/uploads" "$APP_DIR/public/uploads"
  fi
else
  echo "==> Pulling latest code from $BRANCH"
  cd "$APP_DIR"
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
fi

cd "$APP_DIR"

echo "==> Active commit"
git log -1 --oneline

if [ -f "$APP_DIR/.env" ]; then
  sed -i '/^NODE_ENV=/d' "$APP_DIR/.env"
fi

if [ -f "$NODE_ENV_DIR/bin/activate" ]; then
  # shellcheck source=/dev/null
  set +u
  source "$NODE_ENV_DIR/bin/activate"
  set -u
fi

repair_cloudlinux_node_modules

export NODE_ENV=production
export NPM_CONFIG_PRODUCTION=false

echo "==> Installing production/build dependencies"
rm -rf .next
npm install --omit=dev --no-audit --no-fund --legacy-peer-deps --prefer-offline --maxsockets=1

echo "==> Preparing Prisma"
node -e 'require.resolve("dotenv/config"); console.log("dotenv/config ok")'
npx prisma generate
npx prisma db push
npm run seed

if [ -n "$IMPORT_SQL" ]; then
  if [ ! -f "$IMPORT_SQL" ]; then
    echo "Import file not found: $IMPORT_SQL" >&2
    exit 1
  fi
  echo "==> Importing SQL data from $IMPORT_SQL"
  set -a
  # shellcheck source=/dev/null
  source "$APP_DIR/.env"
  set +a
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "DATABASE_URL is missing in $APP_DIR/.env" >&2
    exit 1
  fi
  node -e '
    const url = new URL(process.env.DATABASE_URL);
    const fs = require("fs");
    fs.writeFileSync(".db-import.cnf", [
      "[client]",
      `host=${url.hostname}`,
      `port=${url.port || 3306}`,
      `user=${decodeURIComponent(url.username)}`,
      `password=${decodeURIComponent(url.password)}`,
      `database=${url.pathname.slice(1)}`,
      ""
    ].join("\n"), { mode: 0o600 });
  '
  mysql --defaults-extra-file=.db-import.cnf < "$IMPORT_SQL"
  rm -f .db-import.cnf
fi

echo "==> Building Next.js"
npm run build

echo "==> Restarting cPanel Node app"
mkdir -p tmp
touch tmp/restart.txt

echo "==> Done. Live app should now be on:"
git log -1 --oneline
