FROM php:8.4-fpm

# Install system dependencies required for building the gRPC extension
RUN apt-get update && apt-get install -y \
    autoconf \
    build-essential \
    zlib1g-dev \
    libssl-dev \
    libpq-dev \
    pkg-config \
    git \
    curl \
    make \
    g++ && \
    rm -rf /var/lib/apt/lists/*

# Install the gRPC and protobuf extensions via PECL
# The printf "|\\n" automatically answers the interactive prompt for protobuf version
RUN pecl install grpc && \
    printf "|\\n" | pecl install protobuf  \
    && docker-php-ext-install pdo pdo_pgsql pgsql \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-enable grpc protobuf pdo pgsql pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

RUN chown -R www-data:www-data /var/www/html/storage \
    && chown -R www-data:www-data /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

EXPOSE 9000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php-fpm"]
