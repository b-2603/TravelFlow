FROM php:8.4-cli-alpine

WORKDIR /var/www/html

RUN apk add --no-cache \
    bash \
    git \
    unzip \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    libxml2-dev \
    $PHPIZE_DEPS \
    openssl-dev \
    openssh-client \
    curl \
    openssl \
    ca-certificates

RUN docker-php-ext-install pdo pdo_mysql zip intl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock* ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-scripts

COPY . .

RUN pecl install mongodb && docker-php-ext-enable mongodb

RUN php artisan config:clear \
    && php artisan cache:clear \
    && php artisan config:cache

EXPOSE 10000

CMD ["sh", "-c", "php artisan serve --host=0.0.0.0 --port=10000"]
