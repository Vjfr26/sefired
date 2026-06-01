<?php

use App\Http\Controllers\PolizaController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Página pública de verificación de póliza (sin autenticación)
// Usada como fallback local; el QR impreso en las pólizas apunta a La Venezolana.
Route::get('/verificar/{nroContrato}', [PolizaController::class, 'verificar'])
    ->where('nroContrato', '[A-Za-z0-9\-]+')
    ->middleware('throttle:60,1');
