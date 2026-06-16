<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

// FrankenPHP worker mode: keep the process alive and handle requests in a loop
if (function_exists('frankenphp_handle_request')) {
    while (frankenphp_handle_request(function () use ($app) {
        $app->handleRequest(Request::capture());
    }));
} else {
    $app->handleRequest(Request::capture());
}
