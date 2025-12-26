FROM php:8.4-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    unzip \
    curl \
    libzip-dev \
    icu-dev \
    libpq-dev \
    postgresql-dev \
    oniguruma-dev \
    linux-headers \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    $PHPIZE_DEPS

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg && \
    docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    intl \
    opcache \
    zip \
    mbstring \
    bcmath \
    gd

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Install APCu extension
RUN pecl install apcu && docker-php-ext-enable apcu

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

EXPOSE 9000

CMD ["php-fpm"]
