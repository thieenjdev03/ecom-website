#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
node ./node_modules/typeorm/cli.js migration:run -d dist/database/typeorm.config.js
echo "[entrypoint] Migrations complete. Starting app..."

exec "$@"
