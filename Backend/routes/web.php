<?php

use App\Http\Controllers\PolizaController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Ruta legacy — mantener por compatibilidad con QRs físicos ya impresos que apunten a /verificar
Route::get('/verificar/{nroContrato}', [PolizaController::class, 'verificar'])
    ->where('nroContrato', '[A-Za-z0-9\-]+')
    ->middleware('throttle:60,1');

// Landing pública del QR: visualización, reimpresión y solicitud de renovación
Route::get('/ver/{nroContrato}', [PolizaController::class, 'landing'])
    ->name('poliza.landing')
    ->where('nroContrato', '[A-Za-z0-9\-]+')
    ->middleware('throttle:60,1');

Route::get('/ver/{nroContrato}/pdf', [PolizaController::class, 'pdfPublico'])
    ->name('poliza.pdf-publico')
    ->where('nroContrato', '[A-Za-z0-9\-]+')
    ->middleware('throttle:20,1');

Route::post('/ver/{nroContrato}/renovacion', [PolizaController::class, 'solicitarRenovacion'])
    ->name('poliza.solicitar-renovacion')
    ->where('nroContrato', '[A-Za-z0-9\-]+')
    ->middleware('throttle:5,1');

Route::post('/ver/{nroContrato}/pago-cuota', [PolizaController::class, 'solicitarPagoCuota'])
    ->name('poliza.solicitar-pago-cuota')
    ->where('nroContrato', '[A-Za-z0-9\-]+')
    ->middleware('throttle:5,1');
