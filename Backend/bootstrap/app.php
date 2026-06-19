<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
            'perm' => \App\Http\Middleware\CheckPermission::class,
        ]);

        // El backend recibe tráfico tanto detrás del nginx interno (que sí
        // reenvía X-Forwarded-For con la IP real) como directo en el puerto
        // expuesto del contenedor. Solo se confía en el rango de red interno
        // de Docker — así Request::ip() usa la IP real del cliente cuando
        // pasa por el proxy, pero no se puede falsificar pegándole directo
        // al puerto del backend con un X-Forwarded-For inventado.
        $middleware->trustProxies(at: explode(',', env('TRUSTED_PROXIES', '172.16.0.0/12')));

        // Middlewares aplicados a TODAS las rutas API (api/*):
        //  - LimitRequestSize:  rechaza body > 25 MB antes de parsearlo
        //  - throttle:api_global: 200 req/min por IP/usuario — barrera contra flooding
        //  - SecurityHeaders:   cabeceras de seguridad en cada respuesta
        $middleware->api(prepend: [
            \App\Http\Middleware\LimitRequestSize::class,
            'throttle:api_global',
        ]);
        $middleware->api(append: [
            \App\Http\Middleware\SecurityHeaders::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {

        // Demasiadas solicitudes — incluye cuánto tiempo esperar
        $exceptions->render(function (ThrottleRequestsException $e) {
            $retryAfter = (int) ($e->getHeaders()['Retry-After'] ?? 60);
            $minutos    = ceil($retryAfter / 60);
            $mensaje    = $retryAfter <= 60
                ? "Demasiadas solicitudes. Por favor espera {$retryAfter} segundos antes de intentarlo de nuevo."
                : "Demasiadas solicitudes. Por favor espera {$minutos} minuto(s) antes de intentarlo de nuevo.";

            return response()->json(['message' => $mensaje], 429, $e->getHeaders());
        });

        // Token ausente o inválido
        $exceptions->render(function (AuthenticationException $e) {
            return response()->json(['message' => 'No autenticado. Inicia sesión para continuar.'], 401);
        });

        // Recurso no encontrado (findOrFail, etc.)
        $exceptions->render(function (ModelNotFoundException $e) {
            return response()->json(['message' => 'Recurso no encontrado.'], 404);
        });

        // Ruta no encontrada
        $exceptions->render(function (NotFoundHttpException $e) {
            return response()->json(['message' => 'La ruta solicitada no existe.'], 404);
        });

        // Método HTTP no permitido (ej. GET donde se espera POST)
        $exceptions->render(function (MethodNotAllowedHttpException $e) {
            return response()->json(['message' => 'Método HTTP no permitido para esta ruta.'], 405);
        });

        // Errores de validación — ya incluyen detalles por campo, solo mejoramos el mensaje principal
        $exceptions->render(function (ValidationException $e) {
            return response()->json([
                'message' => 'Los datos enviados no son válidos.',
                'errors'  => $e->errors(),
            ], 422);
        });

    })->create();
