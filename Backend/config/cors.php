<?php

/**
 * Para desarrollo: CORS_ALLOWED_ORIGINS no se define y usa el default (localhost:5173).
 * Para producción: definir en .env → CORS_ALLOWED_ORIGINS=https://panel.jandm.com
 * Si se necesitan varios orígenes: CORS_ALLOWED_ORIGINS=https://a.com,https://b.com
 */

$rawOrigins = env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:5174');
$allowedOrigins = array_map('trim', explode(',', $rawOrigins));

return [
    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Accept', 'Content-Type', 'Authorization', 'X-Device-Fingerprint'],

    'exposed_headers' => ['X-Session-Expired'],

    'max_age' => 600,

    'supports_credentials' => false,
];
