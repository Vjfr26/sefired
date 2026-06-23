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
use App\Http\Controllers\SolicitudContactoController;
use App\Http\Controllers\SolicitudRenovacionQrController;
use App\Http\Controllers\VehiculoCatalogoController;

// ── Portal público (sin autenticación) — cotizador para clientes ──────────────
Route::prefix('portal')->middleware('throttle:60,1')->group(function () {
    Route::get('/productos',                         [PortalController::class, 'productos']);
    Route::get('/productos/{id}/subtipos',           [PortalController::class, 'subtipos']);
    Route::get('/tasas',                             [PortalController::class, 'tasas']);
    Route::post('/verificar',                        [PortalController::class, 'verificarCliente'])->middleware('throttle:20,1');
    Route::post('/cotizacion',                       [PortalController::class, 'cotizar'])->middleware('throttle:10,1');
    Route::post('/contacto',                         [PortalController::class, 'contacto'])->middleware('throttle:5,1');
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
    Route::get('/usuarios/vendedores-disponibles', [UsuarioController::class, 'vendedoresDisponibles'])->middleware('perm:clientes,adjust');

    // ── Lectura ───────────────────────────────────────────────────────────────
    Route::get('/clientes',                          [ClienteController::class,      'index'])->middleware('perm:clientes,view');
    Route::get('/clientes/{id}/polizas',             [ClienteController::class,      'polizas'])->middleware('perm:clientes,view_polizas');
    Route::get('/clientes/{id}/solicitudes',         [ClienteController::class,      'solicitudes'])->middleware('perm:clientes,view');
    Route::get('/clientes/{id}/facturas',            [ClienteController::class,      'facturas'])->middleware('perm:clientes,view_facturas');
    Route::get('/clientes/{id}/documentos',          [ClienteDocumentoController::class, 'index'])->middleware('perm:clientes,view_docs');
    Route::get('/bienes',                            [BienAseguradoController::class,'index'])->middleware('perm:vehiculos,view');
    Route::get('/bienes/{id}',                       [BienAseguradoController::class,'show'])->middleware('perm:vehiculos,view');
    Route::get('/productos',                         [ProductoController::class,     'index'])->middleware('perm:productos,view');
    Route::get('/productos/{id}/tarifario',          [TarifarioController::class,    'index'])->middleware('perm:productos,view');
    Route::get('/tasas',                             [TasaController::class,         'index']);
    Route::get('/cotizaciones',                      [SolicitudController::class,    'index'])->middleware('perm:cotizaciones,view');
    Route::get('/cotizaciones/{id}/underwriting',    [UnderwritingController::class, 'index'])->middleware('perm:cotizaciones,view');
    Route::get('/reports/stats',                     [ReportController::class,       'getStats'])->middleware('perm:home,view');

    // Reportes — lectura (URLs que coinciden con el frontend)
    Route::get('/reportes/externos/politicas',       [ReportController::class, 'getExternalReportPolicies'])->middleware('perm:reportes,view_externos');
    Route::get('/reportes/externos/programaciones',  [ReportController::class, 'getExternalReportSchedules'])->middleware('perm:reportes,manage_schedules');
    Route::get('/reportes/externos/historial',       [ReportController::class, 'getExternalReportHistory'])->middleware('perm:reportes,view_externos');
    Route::get('/reportes/externos/descargar/{id}',  [ReportController::class, 'downloadExternalReport'])->middleware('perm:reportes,export');
    Route::get('/reports/ventas-comisiones',         [ReportController::class, 'getVentasComisiones'])->middleware('perm:reportes,view_ventas');
    Route::get('/reports/oficinas',                  [ReportController::class, 'getOficinas'])->middleware('perm:reportes,view_oficinas');
    Route::get('/reports/personal',                  [ReportController::class, 'getPersonal'])->middleware('perm:reportes,view_personal');
    Route::get('/reports/usuarios',                  [ReportController::class, 'getUsuariosReport'])->middleware('perm:reportes,view_metrics_personal');
    Route::get('/reports/clientes',                  [ReportController::class, 'getClientesReport'])->middleware('perm:reportes,view_metrics_clientes');
    Route::get('/reports/vehiculos',                 [ReportController::class, 'getVehiculosReport'])->middleware('perm:reportes,view_metrics_vehiculos');
    Route::get('/solicitudes-contacto',              [SolicitudContactoController::class, 'index'])->middleware('perm:reportes,view_leads');

    // ── Escritura — throttle adicional: 40 req/min por usuario ───────────────
    Route::middleware('throttle:api_write')->group(function () {
        Route::get('/polizas/{id}/pdf',            [PolizaController::class,          'pdf'])->middleware('perm:cotizaciones,view');
        Route::put('/polizas/{id}',                [PolizaController::class,          'update'])->middleware('perm:cotizaciones,edit');
        Route::post('/polizas/{id}/renovar',       [PolizaController::class,          'renovar'])->middleware('perm:cotizaciones,emit');
        Route::get('/polizas/{id}/beneficiarios',           [PolizaController::class, 'beneficiarios'])->middleware('perm:clientes,manage_beneficiarios');
        Route::post('/polizas/{id}/beneficiarios',          [PolizaController::class, 'agregarBeneficiario'])->middleware('perm:clientes,manage_beneficiarios');
        Route::put('/polizas/{id}/beneficiarios/{benId}',   [PolizaController::class, 'actualizarBeneficiario'])->middleware('perm:clientes,manage_beneficiarios');
        Route::delete('/polizas/{id}/beneficiarios/{benId}',[PolizaController::class, 'eliminarBeneficiario'])->middleware('perm:clientes,manage_beneficiarios');
        Route::get('/polizas/{id}/bienes',           [PolizaController::class, 'bienesPoliza'])->middleware('perm:clientes,manage_bienes');
        Route::post('/polizas/{id}/bienes',          [PolizaController::class, 'agregarBienPoliza'])->middleware('perm:clientes,manage_bienes');
        Route::delete('/polizas/{id}/bienes/{polizaBienId}', [PolizaController::class, 'quitarBienPoliza'])->middleware('perm:clientes,manage_bienes');
        Route::get('/renovaciones-qr',             [SolicitudRenovacionQrController::class, 'index'])->middleware('perm:cotizaciones,view')->withoutMiddleware('throttle:api_write');
        Route::post('/renovaciones-qr/{id}/autorizar', [SolicitudRenovacionQrController::class, 'autorizar'])->middleware('perm:cotizaciones,emit');
        Route::post('/renovaciones-qr/{id}/rechazar',  [SolicitudRenovacionQrController::class, 'rechazar'])->middleware('perm:cotizaciones,edit');
        // POST /clientes y los documentos se usan tanto desde la pantalla de
        // Clientes (permiso clientes.*) como desde el wizard del Simulador
        // (permiso cotizaciones.*) — perm_any acepta cualquiera de los dos.
        Route::post('/clientes',                   [ClienteController::class,         'store'])->middleware('perm_any:clientes.create,cotizaciones.create');
        Route::put('/clientes/{id}',               [ClienteController::class,         'update'])->middleware('perm:clientes,edit');
        Route::patch('/clientes/{id}/toggle',      [ClienteController::class,         'toggle'])->middleware('perm:clientes,block');
        Route::delete('/clientes/{id}',            [ClienteController::class,         'destroy'])->middleware('perm:clientes,delete');
        Route::post('/clientes/{id}/documentos',           [ClienteDocumentoController::class,'store'])->middleware('perm_any:clientes.view_docs,cotizaciones.create,cotizaciones.edit');
        Route::delete('/clientes/{id}/documentos/{docId}', [ClienteDocumentoController::class,'destroy'])->middleware('perm_any:clientes.view_docs,cotizaciones.create,cotizaciones.edit');
        // Igual que clientes: "bienes" se crea/edita desde el wizard del
        // Simulador (cotizaciones.*) y también desde la pantalla de
        // Vehículos / Bienes Asegurados (vehiculos.*).
        Route::post('/bienes',                             [BienAseguradoController::class,   'store'])->middleware('perm:cotizaciones,create');
        Route::put('/bienes/{id}',                         [BienAseguradoController::class,   'update'])->middleware('perm_any:vehiculos.edit,cotizaciones.create,cotizaciones.edit');
        Route::delete('/bienes/{id}',                      [BienAseguradoController::class,   'destroy'])->middleware('perm:vehiculos,delete');
        Route::post('/bienes/{id}/personas',               [BienAseguradoController::class,   'agregarPersona'])->middleware('perm:cotizaciones,create');
        Route::delete('/bienes/{id}/personas/{rolId}',     [BienAseguradoController::class,   'quitarPersona'])->middleware('perm_any:vehiculos.edit,cotizaciones.create,cotizaciones.edit');
        Route::post('/cotizaciones',               [SolicitudController::class,       'store'])->middleware('perm:cotizaciones,create');
        Route::put('/cotizaciones/{id}',           [SolicitudController::class,       'update'])->middleware('perm:cotizaciones,edit');
        Route::post('/cotizaciones/{id}/emitir',   [SolicitudController::class,       'emitir'])->middleware('perm:cotizaciones,emit');
        Route::delete('/cotizaciones/{id}',        [SolicitudController::class,       'destroy'])->middleware('perm:cotizaciones,delete');
        Route::post('/cotizaciones/{id}/underwriting', [UnderwritingController::class,'store'])->middleware('perm:cotizaciones,underwrite');
        Route::put('/underwriting/{id}',           [UnderwritingController::class,    'update'])->middleware('perm:cotizaciones,underwrite');

        // Reportes — exportaciones (URLs que coinciden con el frontend)
        Route::post('/reportes/externos/exportar',            [ReportController::class, 'exportExternalReport'])->middleware('perm:reportes,export');
        Route::post('/reportes/externos/programaciones',      [ReportController::class, 'saveExternalReportSchedules'])->middleware('perm:reportes,manage_schedules');
        Route::post('/reportes/externos/historial/ejecutar',  [ReportController::class, 'runExternalReportSchedule'])->middleware('perm:reportes,manage_schedules');
        Route::post('/reports/ventas-comisiones/exportar',    [ReportController::class, 'exportVentas'])->middleware('perm:reportes,export');
        Route::post('/reports/oficinas/exportar',             [ReportController::class, 'exportOficinas'])->middleware('perm:reportes,export');
        Route::post('/reports/personal/exportar',             [ReportController::class, 'exportPersonal'])->middleware('perm:reportes,export');
        Route::post('/reportes/adjuntos',                     [ReportController::class, 'uploadReporteAdjunto'])->middleware('perm:reportes,manage_schedules');
        Route::put('/solicitudes-contacto/{id}',              [SolicitudContactoController::class, 'update'])->middleware('perm:reportes,manage_leads');
        Route::delete('/reports/ips-bloqueadas/{id}',         [ReportController::class, 'unbloquearIp'])->middleware('perm:config,manage_security');
    });

    // ── Gestión de usuarios, productos y tasas ────────────────────────────────
    // Antes solo exigían 'role:Admin' (sin granularidad — un Admin siempre
    // pasa el chequeo de perm: igual, así que cambiar a perm: no le quita
    // nada al Admin, pero permite delegar estas acciones a otros roles
    // vía permisos personalizados).
    Route::middleware('throttle:api_write')->group(function () {

        // Gestión de usuarios
        Route::get('/usuarios',                        [UsuarioController::class, 'index'])->middleware('perm:usuarios,view');
        Route::post('/usuarios',                       [UsuarioController::class, 'store'])->middleware('perm:usuarios,create');
        Route::put('/usuarios/{id}',                   [UsuarioController::class, 'update'])->middleware('perm:usuarios,edit');
        Route::delete('/usuarios/{id}',                [UsuarioController::class, 'destroy'])->middleware('perm:usuarios,delete');
        Route::post('/usuarios/{id}/toggle-status',    [UsuarioController::class, 'toggleStatus'])->middleware('perm:usuarios,block');

        // Logs del sistema (auditoría)
        Route::get('/reports/logs', [ReportController::class, 'getLogs'])->middleware('perm:config,view_audit');
        Route::get('/reports/audit-log', [ReportController::class, 'getAuditLog'])->middleware('perm:config,view_audit');
        Route::get('/reports/email-logs', [ReportController::class, 'getEmailLogs'])->middleware('perm:config,view_email_logs');
        Route::get('/reports/ips-bloqueadas', [ReportController::class, 'getIpsBloqueadas'])->middleware('perm:config,view_audit');

        // Gestión de productos y tasas
        Route::post('/productos',                        [ProductoController::class, 'store'])->middleware('perm:productos,create');
        Route::put('/productos/{id}',                    [ProductoController::class, 'update'])->middleware('perm:productos,edit');
        Route::delete('/productos/{id}',                 [ProductoController::class, 'destroy'])->middleware('perm:productos,delete');
        Route::post('/productos/{id}/documento',         [ProductoController::class, 'uploadDocumento'])->middleware('perm:productos,manage_docs');
        Route::delete('/productos/{id}/documento',       [ProductoController::class, 'deleteDocumento'])->middleware('perm:productos,manage_docs');
        Route::post('/productos/{id}/beneficios',           [ProductoController::class, 'agregarBeneficio'])->middleware('perm:productos,manage_beneficios');
        Route::put('/productos/{id}/beneficios/{benId}',    [ProductoController::class, 'actualizarBeneficio'])->middleware('perm:productos,manage_beneficios');
        Route::delete('/productos/{id}/beneficios/{benId}', [ProductoController::class, 'eliminarBeneficio'])->middleware('perm:productos,manage_beneficios');

        // Gestión del tarifario
        Route::post('/productos/{id}/tarifario',    [TarifarioController::class, 'store'])->middleware('perm:productos,edit');
        Route::put('/tarifario/{id}',               [TarifarioController::class, 'update'])->middleware('perm:productos,edit');
        Route::delete('/tarifario/{id}',            [TarifarioController::class, 'destroy'])->middleware('perm:productos,edit');

        Route::post('/tasas',        [TasaController::class, 'store'])->middleware('perm:tasas,create');
        Route::put('/tasas/{id}',    [TasaController::class, 'update'])->middleware('perm:tasas,edit');
        Route::delete('/tasas/{id}', [TasaController::class, 'destroy'])->middleware('perm:tasas,delete');

        // Gestión del catálogo de vehículos (usando permisos de productos)
        Route::get('/vehiculos-catalogo',              [VehiculoCatalogoController::class, 'index'])->middleware('perm:productos,view');
        Route::post('/vehiculos-catalogo',             [VehiculoCatalogoController::class, 'store'])->middleware('perm:productos,edit');
        Route::put('/vehiculos-catalogo/{id}',         [VehiculoCatalogoController::class, 'update'])->middleware('perm:productos,edit');
        Route::delete('/vehiculos-catalogo/{id}',      [VehiculoCatalogoController::class, 'destroy'])->middleware('perm:productos,delete');
    });
});
