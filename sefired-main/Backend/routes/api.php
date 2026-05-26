<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UsuarioController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\ClienteController;
use App\Http\Controllers\ClienteDocumentoController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\SolicitudController;
use App\Http\Controllers\TarifarioController;
use App\Http\Controllers\TasaController;
use App\Http\Controllers\VehiculoController;
use App\Http\Controllers\PolizaController;
use App\Http\Controllers\UnderwritingController;

// Login con rate limiting: máx 3 intentos por minuto por IP
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:3,1');

// ── Rutas autenticadas (cualquier rol activo) ─────────────────────────────────
// throttle:120,1 → máx 120 req/min por usuario autenticado; escrituras tienen su propio límite
Route::middleware([\App\Http\Middleware\ApiTokenMiddleware::class, 'throttle:120,1'])->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    // Cambio de contraseña: límite estricto para evitar fuerza bruta interna
    Route::post('/user/change-password', [AuthController::class, 'changePassword'])->middleware('throttle:5,10');

    // Perfil del usuario en sesión — solo campos necesarios, nunca el modelo completo
    Route::get('/user', fn(Request $r) => response()->json([
        'id'     => $r->user()->id,
        'nombre' => $r->user()->nombre,
        'nick'   => $r->user()->nick,
        'cargo'  => $r->user()->cargo,
        'genero' => $r->user()->genero,
        'tipo'   => $r->user()->tipo,
    ]));
    Route::get('/usuario', [UsuarioController::class, 'getUser']);

    // ── Clientes ──────────────────────────────────────────────────────────────
    Route::get('/clientes',                    [ClienteController::class, 'index']);
    Route::get('/clientes/{id}/polizas',       [ClienteController::class, 'polizas']);
    Route::get('/clientes/{id}/solicitudes',   [ClienteController::class, 'solicitudes']);
    Route::get('/clientes/{id}/facturas',      [ClienteController::class, 'facturas']);
    Route::put('/polizas/{id}',                [PolizaController::class, 'update']);
    Route::post('/polizas/{id}/renovar',       [PolizaController::class, 'renovar']);
    Route::post('/clientes',                   [ClienteController::class, 'store']);
    Route::put('/clientes/{id}',               [ClienteController::class, 'update']);
    Route::patch('/clientes/{id}/toggle',      [ClienteController::class, 'toggle']);
    Route::delete('/clientes/{id}',            [ClienteController::class, 'destroy']);

    // ── Documentos del cliente ────────────────────────────────────────────────
    Route::get('/clientes/{id}/documentos',              [ClienteDocumentoController::class, 'index']);
    Route::post('/clientes/{id}/documentos',             [ClienteDocumentoController::class, 'store']);
    Route::delete('/clientes/{id}/documentos/{docId}',   [ClienteDocumentoController::class, 'destroy']);

    // ── Tarifario (lectura pública para el simulador) ─────────────────────────
    Route::get('/productos/{id}/tarifario', [TarifarioController::class, 'index']);

    // ── Vehículos ─────────────────────────────────────────────────────────────
    Route::get('/vehiculos',         [VehiculoController::class, 'index']);
    Route::post('/vehiculos',        [VehiculoController::class, 'store']);
    Route::put('/vehiculos/{id}',    [VehiculoController::class, 'update']);
    Route::delete('/vehiculos/{id}', [VehiculoController::class, 'destroy']);

    // ── Productos (Coberturas) ────────────────────────────────────────────────
    Route::get('/productos',         [ProductoController::class, 'index']);

    // ── Tasas del Día (BCV) ───────────────────────────────────────────────────
    Route::get('/tasas', [TasaController::class, 'index']);

    // ── Cotizaciones / Simulador ──────────────────────────────────────────────
    Route::get('/cotizaciones',              [SolicitudController::class, 'index']);
    Route::post('/cotizaciones',             [SolicitudController::class, 'store']);
    Route::put('/cotizaciones/{id}',         [SolicitudController::class, 'update']);
    Route::post('/cotizaciones/{id}/emitir',           [SolicitudController::class,   'emitir']);
    Route::delete('/cotizaciones/{id}',                [SolicitudController::class,   'destroy']);
    Route::get('/cotizaciones/{id}/underwriting',      [UnderwritingController::class, 'index']);
    Route::post('/cotizaciones/{id}/underwriting',     [UnderwritingController::class, 'store']);
    Route::put('/underwriting/{id}',                   [UnderwritingController::class, 'update']);

    // ── Estadísticas (todos los roles) ───────────────────────────────────────
    Route::get('/reports/stats', [ReportController::class, 'getStats']);

    // ── Rutas exclusivas para Admin ───────────────────────────────────────────
    Route::middleware('role:Admin')->group(function () {

        // Gestión de usuarios
        Route::get('/usuarios',                        [UsuarioController::class, 'index']);
        Route::post('/usuarios',                       [UsuarioController::class, 'store']);
        Route::put('/usuarios/{id}',                   [UsuarioController::class, 'update']);
        Route::delete('/usuarios/{id}',                [UsuarioController::class, 'destroy']);
        Route::post('/usuarios/{id}/toggle-status',    [UsuarioController::class, 'toggleStatus']);

        // Logs del sistema (solo Admin puede ver el historial completo)
        Route::get('/reports/logs', [ReportController::class, 'getLogs']);

        // Gestión de productos y tasas (solo Admin puede crear/editar/eliminar)
        Route::post('/productos',                        [ProductoController::class, 'store']);
        Route::put('/productos/{id}',                    [ProductoController::class, 'update']);
        Route::delete('/productos/{id}',                 [ProductoController::class, 'destroy']);
        Route::post('/productos/{id}/documento',         [ProductoController::class, 'uploadDocumento']);
        Route::delete('/productos/{id}/documento',       [ProductoController::class, 'deleteDocumento']);
        Route::post('/productos/{id}/tasas',             [ProductoController::class, 'uploadTasas']);
        Route::delete('/productos/{id}/tasas',           [ProductoController::class, 'deleteTasas']);

        // Gestión del tarifario (solo Admin)
        Route::post('/productos/{id}/tarifario',    [TarifarioController::class, 'store']);
        Route::put('/tarifario/{id}',               [TarifarioController::class, 'update']);
        Route::delete('/tarifario/{id}',            [TarifarioController::class, 'destroy']);

        Route::post('/tasas',        [TasaController::class, 'store']);
        Route::put('/tasas/{id}',    [TasaController::class, 'update']);
        Route::delete('/tasas/{id}', [TasaController::class, 'destroy']);
    });
});
