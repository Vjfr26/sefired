#!/bin/bash
set -e

# ── Generar .env desde variables de entorno Docker ────────────────────────────
# Cuando APP_KEY está definido en el entorno (inyectado por docker-compose),
# se genera un .env completo y correcto para el contenedor.
# Esto sobreescribe el .env del volumen montado — comportamiento intencional
# en modo Docker. Para desarrollo local, restaura tu .env con:
#   cp Backend/.env.local Backend/.env   (si guardaste una copia)
# ─────────────────────────────────────────────────────────────────────────────
if [ -n "$APP_KEY" ]; then
    cat > /var/www/.env <<EOF
APP_NAME=${APP_NAME:-Sefired}
APP_ENV=${APP_ENV:-local}
APP_KEY=${APP_KEY}
APP_DEBUG=${APP_DEBUG:-true}
APP_URL=${APP_URL:-http://localhost:8000}

LOG_CHANNEL=stack
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=${DB_HOST:-db}
DB_PORT=3306
DB_DATABASE=${DB_DATABASE:-sefired}
DB_USERNAME=${DB_USERNAME:-root}
DB_PASSWORD=${DB_PASSWORD:-}

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false

CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=local

CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-http://localhost:5173,http://localhost:5174}
TURNSTILE_SECRET_KEY=${TURNSTILE_SECRET_KEY:-}
EOF
    echo "[entrypoint] .env generado desde variables de entorno Docker."
else
    echo "[entrypoint] APP_KEY no encontrada — usando .env existente (modo local)."
fi

php artisan config:clear
php artisan cache:clear 2>/dev/null || true
php artisan migrate --force
php artisan storage:link 2>/dev/null || true

exec php artisan serve --host=0.0.0.0 --port=8000
