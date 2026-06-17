<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UsuarioController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\BienAseguradoController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\ClienteDocumentoController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\SolicitudController;
use App\Http\Controllers\TarifarioController;
use App\Http\Controllers\TasaController;
use App\Http\Controllers\PolizaController;
use App\Http\Controllers\UnderwritingController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\SolicitudRenovacionQrController;

// ── Portal público (sin autenticación) — cotizador para clientes ──────────────
Route::prefix('portal')->middleware('throttle:60,1')->group(function () {
    Route::get('/productos',                         [PortalController::class, 'productos']);
    Route::get('/productos/{id}/subtipos',           [PortalController::class, 'subtipos']);
    Route::post('/verificar',                        [PortalController::class, 'verificarCliente'])->middleware('throttle:20,1');
    Route::post('/cotizacion',                       [PortalController::class, 'cotizar'])->middleware('throttle:10,1');
});

// El brute force lo maneja AuthController (3 fallos → lockout → IP ban).
// El flooding lo cubre throttle:api_global (200/min) aplicado globalmente.
Route::post('/login', [AuthController::class, 'login']);

// ── Rutas autenticadas (cualquier rol activo) ─────────────────────────────────
// throttle:120,1 → máx 120 req/min por usuario autenticado; escrituras tienen su propio límite
Route::middleware([\App\Http\Middleware\ApiTokenMiddleware::class, 'throttle:120,1'])->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    // Cambio de contraseña: límite estricto para evitar fuerza bruta interna
    Route::post('/user/change-password', [AuthController::class, 'changePassword'])->middleware('throttle:5,10');
    // Verificación de contraseña para confirmar acciones destructivas
    Route::post('/user/verify-password', [AuthController::class, 'verifyPassword'])->middleware('throttle:10,1');

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

    // ── Lectura ───────────────────────────────────────────────────────────────
    Route::get('/clientes',                          [ClienteController::class,      'index']);
    Route::get('/clientes/{id}/polizas',             [ClienteController::class,      'polizas']);
    Route::get('/clientes/{id}/solicitudes',         [ClienteController::class,      'solicitudes']);
    Route::get('/clientes/{id}/facturas',            [ClienteController::class,      'facturas']);
    Route::get('/clientes/{id}/documentos',          [ClienteDocumentoController::class, 'index']);
    Route::get('/bienes',                            [BienAseguradoController::class,'index']);
    Route::get('/bienes/{id}',                       [BienAseguradoController::class,'show']);
    Route::get('/productos',                         [ProductoController::class,     'index']);
    Route::get('/productos/{id}/tarifario',          [TarifarioController::class,    'index']);
    Route::get('/tasas',                             [TasaController::class,         'index'])->middleware('perm:tasas,view');
    Route::get('/cotizaciones',                      [SolicitudController::class,    'index'])->middleware('perm:cotizaciones,view');
    Route::get('/cotizaciones/{id}/underwriting',    [UnderwritingController::class, 'index'])->middleware('perm:cotizaciones,view');
    Route::get('/reports/stats',                     [ReportController::class,       'getStats'])->middleware('perm:home,view');

    // Reportes — lectura (URLs que coinciden con el frontend)
    Route::get('/reportes/externos/politicas',       [ReportController::class, 'getExternalReportPolicies']);
    Route::get('/reportes/externos/programaciones',  [ReportController::class, 'getExternalReportSchedules']);
    Route::get('/reportes/externos/historial',       [ReportController::class, 'getExternalReportHistory']);
    Route::get('/reportes/externos/descargar/{id}',  [ReportController::class, 'downloadExternalReport']);
    Route::get('/reports/ventas-comisiones',         [ReportController::class, 'getVentasComisiones']);
    Route::get('/reports/oficinas',                  [ReportController::class, 'getOficinas']);
    Route::get('/reports/personal',                  [ReportController::class, 'getPersonal']);
    Route::get('/reports/usuarios',                  [ReportController::class, 'getUsuariosReport']);
    Route::get('/reports/clientes',                  [ReportController::class, 'getClientesReport']);
    Route::get('/reports/vehiculos',                 [ReportController::class, 'getVehiculosReport']);
    Route::get('/reports/automaticos/programaciones',[ReportController::class, 'getInternalSchedules']);
    Route::get('/reports/automaticos/historial',     [ReportController::class, 'getInternalHistory']);
    Route::get('/reports/automaticos/descargar/{id}',[ReportController::class, 'downloadInternalReport']);

    // ── Escritura — throttle adicional: 40 req/min por usuario ───────────────
    Route::middleware('throttle:api_write')->group(function () {
        Route::get('/polizas/{id}/pdf',            [PolizaController::class,          'pdf'])->middleware('perm:cotizaciones,view');
        Route::put('/polizas/{id}',                [PolizaController::class,          'update'])->middleware('perm:cotizaciones,edit');
        Route::post('/polizas/{id}/renovar',       [PolizaController::class,          'renovar'])->middleware('perm:cotizaciones,emit');
        Route::get('/renovaciones-qr',             [SolicitudRenovacionQrController::class, 'index'])->middleware('perm:cotizaciones,view')->withoutMiddleware('throttle:api_write');
        Route::post('/renovaciones-qr/{id}/autorizar', [SolicitudRenovacionQrController::class, 'autorizar'])->middleware('perm:cotizaciones,emit');
        Route::post('/renovaciones-qr/{id}/rechazar',  [SolicitudRenovacionQrController::class, 'rechazar'])->middleware('perm:cotizaciones,edit');
        Route::post('/clientes',                   [ClienteController::class,         'store'])->middleware('perm:cotizaciones,create');
        Route::put('/clientes/{id}',               [ClienteController::class,         'update'])->middleware('perm:cotizaciones,edit');
        Route::patch('/clientes/{id}/toggle',      [ClienteController::class,         'toggle'])->middleware('perm:cotizaciones,edit');
        Route::delete('/clientes/{id}',            [ClienteController::class,         'destroy'])->middleware('perm:cotizaciones,delete');
        Route::post('/clientes/{id}/documentos',           [ClienteDocumentoController::class,'store'])->middleware('perm:cotizaciones,create');
        Route::delete('/clientes/{id}/documentos/{docId}', [ClienteDocumentoController::class,'destroy'])->middleware('perm:cotizaciones,delete');
        Route::post('/bienes',                             [BienAseguradoController::class,   'store'])->middleware('perm:cotizaciones,create');
        Route::put('/bienes/{id}',                         [BienAseguradoController::class,   'update'])->middleware('perm:cotizaciones,edit');
        Route::delete('/bienes/{id}',                      [BienAseguradoController::class,   'destroy'])->middleware('perm:cotizaciones,delete');
        Route::post('/bienes/{id}/personas',               [BienAseguradoController::class,   'agregarPersona'])->middleware('perm:cotizaciones,create');
        Route::delete('/bienes/{id}/personas/{rolId}',     [BienAseguradoController::class,   'quitarPersona'])->middleware('perm:cotizaciones,edit');
        Route::post('/cotizaciones',               [SolicitudController::class,       'store'])->middleware('perm:cotizaciones,create');
        Route::put('/cotizaciones/{id}',           [SolicitudController::class,       'update'])->middleware('perm:cotizaciones,edit');
        Route::post('/cotizaciones/{id}/emitir',   [SolicitudController::class,       'emitir'])->middleware('perm:cotizaciones,emit');
        Route::delete('/cotizaciones/{id}',        [SolicitudController::class,       'destroy'])->middleware('perm:cotizaciones,delete');
        Route::post('/cotizaciones/{id}/underwriting', [UnderwritingController::class,'store'])->middleware('perm:cotizaciones,edit');
        Route::put('/underwriting/{id}',           [UnderwritingController::class,    'update'])->middleware('perm:cotizaciones,edit');

        // Reportes — exportaciones (URLs que coinciden con el frontend)
        Route::post('/reportes/externos/exportar',            [ReportController::class, 'exportExternalReport']);
        Route::post('/reportes/externos/programaciones',      [ReportController::class, 'saveExternalReportSchedules']);
        Route::post('/reportes/externos/historial/ejecutar',  [ReportController::class, 'runExternalReportSchedule']);
        Route::post('/reports/ventas-comisiones/exportar',    [ReportController::class, 'exportVentas']);
        Route::post('/reports/oficinas/exportar',             [ReportController::class, 'exportOficinas']);
        Route::post('/reports/personal/exportar',             [ReportController::class, 'exportPersonal']);
        Route::post('/reports/automaticos/programaciones',    [ReportController::class, 'saveInternalSchedules']);
        Route::post('/reports/automaticos/historial/ejecutar',[ReportController::class, 'runInternalSchedule']);
    });

    // ── Rutas exclusivas para Admin ───────────────────────────────────────────
    Route::middleware(['role:Admin', 'throttle:api_write'])->group(function () {

        // Gestión de usuarios
        Route::get('/usuarios',                        [UsuarioController::class, 'index']);
        Route::post('/usuarios',                       [UsuarioController::class, 'store']);
        Route::put('/usuarios/{id}',                   [UsuarioController::class, 'update']);
        Route::delete('/usuarios/{id}',                [UsuarioController::class, 'destroy']);
        Route::post('/usuarios/{id}/toggle-status',    [UsuarioController::class, 'toggleStatus']);

        // Logs del sistema (solo Admin puede ver el historial completo)
        Route::get('/reports/logs', [ReportController::class, 'getLogs']);

        // Gestión de productos y tasas
        Route::post('/productos',                        [ProductoController::class, 'store']);
        Route::put('/productos/{id}',                    [ProductoController::class, 'update']);
        Route::delete('/productos/{id}',                 [ProductoController::class, 'destroy']);
        Route::post('/productos/{id}/documento',         [ProductoController::class, 'uploadDocumento']);
        Route::delete('/productos/{id}/documento',       [ProductoController::class, 'deleteDocumento']);
        Route::post('/productos/{id}/tasas',             [ProductoController::class, 'uploadTasas']);
        Route::delete('/productos/{id}/tasas',           [ProductoController::class, 'deleteTasas']);

        // Gestión del tarifario
        Route::post('/productos/{id}/tarifario',    [TarifarioController::class, 'store']);
        Route::put('/tarifario/{id}',               [TarifarioController::class, 'update']);
        Route::delete('/tarifario/{id}',            [TarifarioController::class, 'destroy']);

        Route::post('/tasas',        [TasaController::class, 'store']);
        Route::put('/tasas/{id}',    [TasaController::class, 'update']);
        Route::delete('/tasas/{id}', [TasaController::class, 'destroy']);
    });
});
