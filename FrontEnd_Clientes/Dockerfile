# ── Etapa 1: compilar con Vite ────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .

# VITE_API_URL se inyecta en tiempo de build para que quede embebido en el JS
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build
# Resultado en /app/dist — archivos estáticos minificados y con hashes de cache

# ── Etapa 2: servir con Nginx (imagen ~25MB vs ~1GB de Node) ──────────────────
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5174

CMD ["nginx", "-g", "daemon off;"]
