FROM php:8.2-fpm-alpine

# System dependencies
RUN apk add --no-cache \
    bash \
    git \
    libzip-dev \
    oniguruma-dev \
    zlib-dev \
    autoconf \
    gcc \
    g++ \
    make \
    linux-headers \
    icu-dev \
    curl \
    openssh-client

# PHP extensions
RUN docker-php-ext-install pdo zip intl
RUN pecl install mongodb && docker-php-ext-enable mongodb

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/backend

# Copy only composer files first for better layer caching
COPY composer.json composer.lock* ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Copy the application source
COPY . .

# Run any app-specific setup steps
RUN composer dump-autoload --optimize

EXPOSE 9000
CMD ["php-fpm"]
