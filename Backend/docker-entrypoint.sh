#!/bin/sh
set -e

# ── Detectar Redis ─────────────────────────────────────────────────────────────
SESSION_DRV=${REDIS_HOST:+redis}
SESSION_DRV=${SESSION_DRV:-database}
CACHE_DRV=${REDIS_HOST:+redis}
CACHE_DRV=${CACHE_DRV:-database}

# ── Generar .env ───────────────────────────────────────────────────────────────
if [ -n "$APP_KEY" ]; then
    cat > /var/www/.env <<EOF
APP_NAME="${APP_NAME:-J&M}"
APP_ENV=${APP_ENV:-production}
APP_KEY=${APP_KEY}
APP_DEBUG=${APP_DEBUG:-false}
APP_URL=${APP_URL:-http://localhost:8000}

LOG_CHANNEL=stack
LOG_LEVEL=warning

DB_CONNECTION=mysql
DB_HOST=${DB_HOST:-db}
DB_PORT=3306
DB_DATABASE=${DB_DATABASE:-sefired}
DB_USERNAME=${DB_USERNAME:-root}
DB_PASSWORD=${DB_PASSWORD:-}

SESSION_DRIVER=${SESSION_DRV}
SESSION_LIFETIME=120

CACHE_STORE=${CACHE_DRV}
QUEUE_CONNECTION=database

REDIS_HOST=${REDIS_HOST:-127.0.0.1}
REDIS_PORT=${REDIS_PORT:-6379}
REDIS_PASSWORD=${REDIS_PASSWORD:-null}
REDIS_CLIENT=phpredis

FILESYSTEM_DISK=local
CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-*}
TURNSTILE_SECRET_KEY=${TURNSTILE_SECRET_KEY:-}

# FrankenPHP server config
SERVER_NAME=:8000
FRANKENPHP_CONFIG="worker ./public/index.php"
EOF
    echo "[entrypoint] .env generado — SESSION=${SESSION_DRV} CACHE=${CACHE_DRV}"
else
    echo "[entrypoint] Usando .env existente."
fi

# ── Bootstrap Laravel ──────────────────────────────────────────────────────────
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
php artisan storage:link 2>/dev/null || true

# Si se pasó un comando explícito (ej. queue worker), ejecutarlo en vez de FrankenPHP
if [ $# -gt 0 ]; then
    exec "$@"
fi

echo "[entrypoint] Iniciando FrankenPHP con ${FRANKENPHP_WORKERS:-200} workers…"

# ── FrankenPHP workers mode ───────────────────────────────────────────────────
# --workers: procesos PHP persistentes (sin bootstrap por petición)
# Cada worker atiende peticiones secuencialmente pero sin overhead de inicio
# El servidor HTTP de FrankenPHP (Caddy/Go) maneja miles de conexiones concurrentes
# distribuyéndolas entre los workers disponibles
exec frankenphp run \
    --config /dev/stdin --adapter caddyfile <<'CADDYFILE'
{
    admin off
    auto_https off
}

:8000 {
    root * /var/www/public
    encode gzip

    php_server {
        worker {
            file ./public/index.php
            num {$FRANKENPHP_WORKERS}
        }
    }
}
CADDYFILE
