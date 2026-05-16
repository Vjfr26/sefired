<?php

/**
 * Rutas de la API del panel interno Sefired.
 *
 * Este archivo se registra en bootstrap/app.php con la clave "api",
 * lo que hace que Laravel automáticamente:
 *   - Prefije todas las rutas con /api
 *   - Aplique el middleware group "api" (sin verificación CSRF)
 *
 * El frontend en desarrollo accede a estas rutas a través del proxy de Vite:
 *   localhost:5173/api/... → localhost:8000/api/...
 *
 * Para ejecutar el servidor de desarrollo:
 *   /opt/lampp/bin/php artisan serve   (usar PHP de XAMPP, no el del sistema)
 */

use App\Http\Controllers\ClienteController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\TasaController;
use App\Http\Controllers\VehiculoController;
use Illuminate\Support\Facades\Route;

// ── Clientes ──────────────────────────────────────────────────────────────────
// CRUD completo de clientes. Cada cliente está asociado a una Persona
// y puede tener múltiples solicitudes que derivan en pólizas.
Route::get('/clientes',                  [ClienteController::class, 'index']);   // lista con resumen de póliza
Route::post('/clientes',                 [ClienteController::class, 'store']);   // crear persona + cliente
Route::put('/clientes/{id}',             [ClienteController::class, 'update']);  // editar datos personales
Route::patch('/clientes/{id}/toggle',    [ClienteController::class, 'toggle']);  // activar / desactivar
Route::delete('/clientes/{id}',          [ClienteController::class, 'destroy']); // eliminar (bloqueado si tiene pólizas)

// ── Vehículos ─────────────────────────────────────────────────────────────────
// CRUD de vehículos asegurados. El estado (Activo/Inactivo) se deriva
// de si la placa tiene pólizas activas en la cadena solicitud → poliza.
Route::get('/vehiculos',         [VehiculoController::class, 'index']);   // listado con propietario
Route::post('/vehiculos',        [VehiculoController::class, 'store']);   // registrar vehículo
Route::put('/vehiculos/{id}',    [VehiculoController::class, 'update']);  // editar datos
Route::delete('/vehiculos/{id}', [VehiculoController::class, 'destroy']); // eliminar (bloqueado si tiene conductores)

// ── Productos (Coberturas) ────────────────────────────────────────────────────
// CRUD de productos asegurables. La eliminación se bloquea si el producto
// tiene pólizas asociadas para preservar el historial comercial.
Route::get('/productos',         [ProductoController::class, 'index']);
Route::post('/productos',        [ProductoController::class, 'store']);
Route::put('/productos/{id}',    [ProductoController::class, 'update']);
Route::delete('/productos/{id}', [ProductoController::class, 'destroy']);

// ── Tasas del Día (BCV) ───────────────────────────────────────────────────────
// Gestión de tasas de cambio USD/EUR publicadas diariamente por el BCV.
// Tabla: indicador_economico (tipo='tasa_cambio', moneda='USD'|'EUR')
Route::get('/tasas',         [TasaController::class, 'index']);   // tasas actuales + historial 60 días
Route::post('/tasas',        [TasaController::class, 'store']);   // registrar USD y EUR del día
Route::put('/tasas/{id}',    [TasaController::class, 'update']);  // corregir valor de una tasa
Route::delete('/tasas/{id}', [TasaController::class, 'destroy']); // eliminar registro del historial
