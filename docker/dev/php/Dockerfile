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
    $PHPIZE_DEPS

# Install PHP extensions
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    intl \
    opcache \
    zip \
    mbstring \
    bcmath

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Install APCu extension
RUN pecl install apcu && docker-php-ext-enable apcu

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Configure PHP-FPM
RUN echo "php_admin_value[error_log] = /var/log/fpm-php.www.log" >> /usr/local/etc/php-fpm.d/www.conf && \
    echo "php_admin_flag[log_errors] = on" >> /usr/local/etc/php-fpm.d/www.conf

# Create log file
RUN touch /var/log/fpm-php.www.log && \
    chown www-data:www-data /var/log/fpm-php.www.log

EXPOSE 9000

CMD ["php-fpm"]
