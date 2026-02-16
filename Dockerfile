# Use an official PHP image with Apache
FROM php:8.2-apache

# ENV Arguments 
ARG APP_NAME
ARG APP_ENV
ARG APP_KEY
ARG APP_DEBUG
ARG APP_URL
ARG FRONTEND_URL
ARG LOG_LEVEL
ARG DB_CONNECTION
ARG DB_HOST
ARG DB_PORT
ARG DB_DATABASE
ARG DB_USERNAME
ARG DB_PASSWORD

ARG VITE_BACKEND_ENDPOINT

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nodejs \
    npm

# Enable mod_rewrite
RUN a2enmod rewrite

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# By default, Apache serves files from /var/www/html.
# Laravel expects the document root to point to the public directory of its project structure for proper routing and security.
# These commands update Apache’s configuration so that it serves files from /var/www/html/public instead, aligning it with Laravel's structure.
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy the application code to the html folder
# COPY . /var/www/html

# Copy Laravel backend code
COPY server/ /var/www/html
COPY client/ /var/www/html/client

# Set working directory
WORKDIR /var/www/html

# Install Laravel dependencies
RUN composer install

# Set environment variables for server
RUN touch .env
RUN echo "APP_NAME=${APP_NAME}" >> .env && \
    echo "APP_ENV=${APP_ENV}" >> .env && \
    echo "APP_KEY=${APP_KEY}" >> .env && \
    echo "APP_DEBUG=${APP_DEBUG}" >> .env && \
    echo "FRONTEND_URL=${FRONTEND_URL}" >> .env && \
    echo "LOG_LEVEL=${LOG_LEVEL}" >> .env && \
    echo "DB_CONNECTION=${DB_CONNECTION}" >> .env && \
    echo "DB_HOST=${DB_HOST}" >> .env && \
    echo "DB_DATABASE=${DB_DATABASE}" >> .env && \
    echo "DB_DATABASE=${DB_USERNAME}" >> .env && \
    echo "DB_DATABASE=${DB_PASSWORD}" >> .env && \
    echo "DB_PORT=${DB_PORT}" >> .env

# Set permissions for Laravel storage and cache
RUN chown -R www-data:www-data /var/www/html && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# RUN ls -a
# RUN echo "hello wrld"

RUN cd client && npm install && npm run build

# # Move React build to Laravel public directory
RUN cp -r client/dist/* public/

# # Expose port 80 for Apache
EXPOSE 80

# FROM php:8.2-apache
# # Start Apache server
# CMD ["apache2-foreground"]
