# J&M — LA VENEZOLANA DE SEGUROS Y VIDA C.A.

Sistema interno de gestión de pólizas, clientes y ventas.

---

## Variables de entorno

### `.env` — raíz (Docker Compose)

```# Base de datos
DB_ROOT_PASSWORD=secret
DB_NAME=sefired
DB_PORT=3307

# Backend
BACKEND_PORT=8000
APP_KEY=base64:YLgm9qHKPqX3DU2zwPF8WSNTiu/IZPXqwxqHHULE5RM=
APP_URL=http://192.168.1.135:8000

# SMTP
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tuseguro@jmlavenezolana.com
MAIL_PASSWORD=vdfrsasqzmjecuez
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=tuseguro@jmlavenezolana.com
MAIL_FROM_NAME="J&M Seguros"

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# FrontEnd Interno
FRONTEND_INTERNO_PORT=5173
VITE_API_URL_INTERNO=

# FrontEnd Clientes
FRONTEND_CLIENTES_PORT=5174
VITE_API_URL_CLIENTES=
```

---

### `Backend/.env` — Laravel

```env
APP_NAME=Sefired
APP_ENV=local
APP_KEY=base64:YLgm9qHKPqX3DU2zwPF8WSNTiu/IZPXqwxqHHULE5RM=
APP_DEBUG=true
APP_URL=http://localhost:8000

LOG_CHANNEL=stack
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=sefired
DB_USERNAME=root
DB_PASSWORD=secret

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false

CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=local

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
VITE_API_URL=
```

---

### `FrontEnd_Interno/.env` — Panel de gestión

```env
VITE_APP_NAME=Sefired
VITE_API_URL=
VITE_TURNSTILE_SITE_KEY=0x4AAAAAADPWm4GmxJIO3s97
```

---

### `FrontEnd_Clientes/.env` — Portal público

```env
VITE_APP_NAME=Sefired
VITE_API_URL=
VITE_TURNSTILE_SITE_KEY=0x4AAAAAADPWm4GmxJIO3s97
```

---

## Levantar el proyecto

```bash
cd sefired-main

# Producción (todos los servicios)
docker compose up -d

# Desarrollo (incluye phpMyAdmin en http://localhost:8083)
docker compose --profile dev up -d
```

## Accesos locales

| Servicio        | URL                          |
|-----------------|------------------------------|
| Backend API     | http://localhost:8000        |
| Panel interno   | http://localhost:5173        |
| Portal clientes | http://localhost:5174        |
| phpMyAdmin      | http://localhost:8083 (dev)  |
| MySQL (host)    | localhost:3307               |

## Resetear la base de datos

```bash
docker compose down -v   # borra el volumen db_data
docker compose up -d db  # recarga desde BD/sefired (1).sql
```

## Limpiar sesiones atascadas

```bash
# Redis
docker exec sefired-redis redis-cli FLUSHDB

# DB
docker exec sefired-db mysql -u root -psecret sefired \
  -e "UPDATE usuarios SET api_token=NULL, token_expira_en=NULL WHERE nick='tu_usuario';"
```
