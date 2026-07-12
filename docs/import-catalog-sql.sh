#!/usr/bin/env bash
set -Eeuo pipefail

# Import a catalog-only SQL file into the existing Sunspark database.
# Usage on HostAfrica SSH:
#   CATALOG_SQL="$HOME/sunspark-catalog-refresh.sql" bash ~/sunspark/docs/import-catalog-sql.sh
#
# The SQL file should be data-only. Do not use this for customer/order dumps.

APP_DIR="${APP_DIR:-/home/codecham/sunspark}"
CATALOG_SQL="${CATALOG_SQL:-$HOME/sunspark-catalog-refresh.sql}"

if [ ! -f "$APP_DIR/.env" ]; then
  echo "Missing $APP_DIR/.env" >&2
  exit 1
fi

if [ ! -f "$CATALOG_SQL" ]; then
  echo "Missing SQL file: $CATALOG_SQL" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$APP_DIR/.env"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is missing in $APP_DIR/.env" >&2
  exit 1
fi

cd "$APP_DIR"

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

trap 'rm -f "$APP_DIR/.db-import.cnf"' EXIT

mysql --defaults-extra-file="$APP_DIR/.db-import.cnf" < "$CATALOG_SQL"

echo "Catalog SQL imported."
