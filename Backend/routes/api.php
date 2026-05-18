<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UsuarioController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware(\App\Http\Middleware\ApiTokenMiddleware::class)->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::get('/usuarios', [UsuarioController::class, 'index']);
    Route::post('/usuarios', [UsuarioController::class, 'store']);
    Route::put('/usuarios/{id}', [UsuarioController::class, 'update']);
    Route::delete('/usuarios/{id}', [UsuarioController::class, 'destroy']);
    Route::post('/usuarios/{id}/toggle-status', [UsuarioController::class, 'toggleStatus']);
    Route::get('/usuario', [UsuarioController::class, 'getUser']);

    Route::post('/logout', [AuthController::class, 'logout']);

    // Reportes y Logs
    Route::get('/reports/logs', [ReportController::class, 'getLogs']);
    Route::get('/reports/stats', [ReportController::class, 'getStats']);
});
