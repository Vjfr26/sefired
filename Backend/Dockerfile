FROM dunglas/frankenphp:1-php8.4

# ── Extensiones PHP ────────────────────────────────────────────────────────────
# install-php-extensions es el helper oficial de FrankenPHP/Docker PHP
RUN install-php-extensions \
    pdo_mysql \
    mbstring \
    bcmath \
    gd \
    zip \
    opcache \
    redis \
    pcntl

# ── OPcache (bytecode cache — PHP arranca 5x más rápido) ──────────────────────
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.enable_cli=1'; \
    echo 'opcache.memory_consumption=256'; \
    echo 'opcache.interned_strings_buffer=32'; \
    echo 'opcache.max_accelerated_files=32000'; \
    echo 'opcache.validate_timestamps=0'; \
    echo 'opcache.save_comments=1'; \
    echo 'opcache.fast_shutdown=1'; \
} > /usr/local/etc/php/conf.d/opcache.ini

# ── Límites PHP ────────────────────────────────────────────────────────────────
RUN { \
    echo 'memory_limit=256M'; \
    echo 'max_execution_time=60'; \
    echo 'upload_max_filesize=20M'; \
    echo 'post_max_size=20M'; \
} > /usr/local/etc/php/conf.d/app.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
COPY . .

RUN composer install --no-interaction --prefer-dist --optimize-autoloader \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8000

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
