FROM php:8.3-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    unzip \
    zip \
    && docker-php-ext-install pdo_mysql zip bcmath gd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Get Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy files
COPY . /var/www

# Ensure directory structure exists for Laravel
RUN mkdir -p \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

# Install runtime dependencies only
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# Set permissions (Important for the webserver to write logs/cache)
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

EXPOSE 8000
EXPOSE 6001

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]