#!/bin/sh
set -eu

cd "$(dirname "$0")"

echo "Preparing Laravel environment..."

mkdir -p \
	storage/framework/cache \
	storage/framework/sessions \
	storage/framework/views \
	storage/logs \
	bootstrap/cache || true

touch storage/logs/laravel.log
chmod -R 777 storage bootstrap/cache || true

echo "Clearing caches..."
php artisan config:clear || true
php artisan cache:clear || true

echo "Checking APP_KEY..."
if [ -z "${APP_KEY:-}" ]; then
echo "APP_KEY not set. Generating..."
php artisan key:generate --force || true
fi

echo "Checking JWT_SECRET..."
if [ -z "${JWT_SECRET:-}" ]; then
echo "JWT_SECRET not set. Generating..."
php artisan jwt:secret --force || true
fi

echo "Running migrations..."
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
php artisan migrate --force
fi

echo "Ensuring default admin account..."
if [ "${RUN_ADMIN_SEEDER:-true}" = "true" ]; then
php artisan db:seed --class=AdminSeeder --force
fi

echo "Linking storage..."
php artisan storage:link || true

echo "Caching config..."
php artisan config:cache

echo "Starting Laravel server..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
