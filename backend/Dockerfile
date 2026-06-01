FROM php:8.2-cli-alpine

ENV COMPOSER_ALLOW_SUPERUSER=1

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

RUN docker-php-ext-install pdo zip intl
RUN pecl install mongodb && docker-php-ext-enable mongodb

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock* ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-scripts

COPY . .

RUN composer dump-autoload --optimize
RUN php artisan package:discover --ansi
RUN php artisan config:clear || true
RUN php artisan cache:clear || true

ENV PORT=10000
EXPOSE 10000

CMD sh -c "php artisan serve --host 0.0.0.0 --port ${PORT:-10000}"
