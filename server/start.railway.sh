#!/bin/sh
set -eu

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  cp .env.example .env
fi

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

touch storage/logs/laravel.log
chmod -R 775 storage bootstrap/cache || true

php artisan config:clear >/dev/null 2>&1 || true
php artisan cache:clear >/dev/null 2>&1 || true

app_key="$(grep '^APP_KEY=' .env | cut -d= -f2- || true)"
if [ -z "$app_key" ]; then
  php artisan key:generate --force >/dev/null 2>&1 || true
fi

jwt_secret="$(grep '^JWT_SECRET=' .env | cut -d= -f2- || true)"
if [ -z "$jwt_secret" ]; then
  php artisan jwt:secret --force >/dev/null 2>&1 || true
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  php artisan migrate --force
fi

php artisan storage:link >/dev/null 2>&1 || true

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
