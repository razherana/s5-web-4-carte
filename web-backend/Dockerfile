FROM php:8.3-fpm

# Install system dependencies required for building the gRPC extension
RUN apt-get update && apt-get install -y \
    autoconf \
    build-essential \
    zlib1g-dev \
    libssl-dev \
    pkg-config \
    git \
    curl \
    make \
    g++ && \
    rm -rf /var/lib/apt/lists/*

# Install the gRPC and protobuf extensions via PECL
# The printf "|\\n" automatically answers the interactive prompt for protobuf version
RUN pecl install grpc && \
    printf "|\\n" | pecl install protobuf && \
    docker-php-ext-enable grpc protobuf

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 9000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php-fpm"]
