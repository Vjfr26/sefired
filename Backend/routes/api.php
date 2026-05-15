<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ReportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware(\App\Http\Middleware\ApiTokenMiddleware::class)->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    // Reportes y Logs
    Route::get('/reports/logs', [ReportController::class, 'getLogs']);
    Route::get('/reports/stats', [ReportController::class, 'getStats']);
});
