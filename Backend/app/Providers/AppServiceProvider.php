<?php

namespace App\Providers;

use App\Models\Factura;
use App\Models\Persona;
use App\Models\Poliza;
use App\Models\Producto;
use App\Models\Solicitud;
use App\Models\Usuario;
use App\Observers\AuditObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Forzar que url() siempre use APP_URL, ignorando el host del request.
        // Sin esto, en Docker url() devuelve http://backend:8000/... (nombre del servicio).
        URL::forceRootUrl(config('app.url'));

        $this->configureRateLimiters();

        $observer = new AuditObserver();
        Solicitud::observe($observer);
        Poliza::observe($observer);
        Factura::observe($observer);
        Producto::observe($observer);
        Usuario::observe($observer);
        Persona::observe($observer);
    }

    private function configureRateLimiters(): void
    {
        // Límite global para toda la API: 200 req/min por IP.
        // Actúa como barrera contra flooding masivo antes de que los
        // throttles por ruta más específicos entren en juego.
        // Usuarios autenticados se identifican por ID para no penalizar
        // IPs compartidas (NAT corporativo, VPNs).
        RateLimiter::for('api_global', function (Request $request) {
            return $request->user()
                ? Limit::perMinute(200)->by('u:' . $request->user()->id)
                : Limit::perMinute(200)->by('ip:' . $request->ip());
        });

        // Límite para operaciones de escritura sensibles.
        // Más estricto para dificultar ataques de enumeración o abuso masivo.
        RateLimiter::for('api_write', function (Request $request) {
            return $request->user()
                ? Limit::perMinute(40)->by('w:' . $request->user()->id)
                : Limit::perMinute(20)->by('w:' . $request->ip());
        });
    }
}
