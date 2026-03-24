FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    curl \
    git \
    libzip-dev \
    unzip \
    zip \
    && docker-php-ext-install pdo_mysql zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

ENV VIEW_COMPILED_PATH=/var/www/storage/framework/views

COPY . /var/www

RUN ls -la && test -f artisan

RUN test -f /var/www/.env || cp /var/www/.env.example /var/www/.env

RUN mkdir -p \
    /var/www/storage/framework/cache \
    /var/www/storage/framework/sessions \
    /var/www/storage/framework/views \
    /var/www/storage/logs \
    /var/www/bootstrap/cache

RUN chmod -R 775 /var/www/storage /var/www/bootstrap/cache

RUN composer install --no-interaction --prefer-dist --optimize-autoloader

RUN composer dump-autoload --optimize

EXPOSE 8000
EXPOSE 6001

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
