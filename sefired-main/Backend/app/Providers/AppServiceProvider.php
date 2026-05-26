<?php

namespace App\Providers;

use App\Models\Factura;
use App\Models\Poliza;
use App\Models\Producto;
use App\Models\Solicitud;
use App\Observers\AuditObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        $observer = new AuditObserver();

        Solicitud::observe($observer);
        Poliza::observe($observer);
        Factura::observe($observer);
        Producto::observe($observer);
    }
}
