#!/bin/sh
set -eu

cd /var/www

if [ ! -f .env ]; then
  cp .env.example .env
fi

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

touch storage/logs/laravel.log
chown -R www-data:www-data storage bootstrap/cache || true
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

max_tries="${DB_WAIT_MAX_TRIES:-60}"
attempt=1

echo "Waiting for database connection..."
until php -r '$h=getenv("DB_HOST") ?: "mysql"; $p=getenv("DB_PORT") ?: "3306"; $d=getenv("DB_DATABASE") ?: "protibeshi_db"; $u=getenv("DB_USERNAME") ?: "root"; $pw=getenv("DB_PASSWORD") ?: ""; try { new PDO("mysql:host=".$h.";port=".$p.";dbname=".$d, $u, $pw, [PDO::ATTR_TIMEOUT => 2]); exit(0);} catch (Throwable $e) { exit(1);}'; do
  if [ "$attempt" -ge "$max_tries" ]; then
    echo "Database is not reachable after ${max_tries} attempts. Exiting." >&2
    exit 1
  fi

  echo "Database not ready yet (${attempt}/${max_tries}). Retrying in 2s..."
  attempt=$((attempt + 1))
  sleep 2
done

echo "Database connection is ready. Running migrations..."
php artisan migrate --force

if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  echo "RUN_DB_SEED=true, running seeders..."
  php artisan db:seed --force
fi

php artisan storage:link >/dev/null 2>&1 || true
php artisan config:cache >/dev/null 2>&1 || true
php artisan route:cache >/dev/null 2>&1 || true
php artisan view:cache >/dev/null 2>&1 || true

echo "Starting Laravel server..."
exec php artisan serve --host=0.0.0.0 --port=8000
