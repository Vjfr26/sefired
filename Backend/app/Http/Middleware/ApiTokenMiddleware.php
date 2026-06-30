<?php

namespace App\Http\Middleware;

use App\Models\Sesion;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenMiddleware
{
    /**
     * Respuesta 401 con la cabecera `X-Session-Expired` para que el frontend
     * sepa que la sesión terminó (y por qué) y muestre la animación de cierre
     * + redirija al login. Motivos: 'nueva_sesion' (otro dispositivo tomó la
     * sesión), 'expirada' (inactividad/tope), 'invalida' (token inválido).
     */
    private function noAutorizado(string $motivo, string $mensaje = 'No autorizado.'): Response
    {
        return response()->json(['message' => $mensaje], 401)
            ->header('X-Session-Expired', $motivo);
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $authorization = $request->header('Authorization');

        if (!$authorization || !str_starts_with($authorization, 'Bearer ')) {
            return $this->noAutorizado('invalida');
        }

        $tokenHash = hash('sha256', str_replace('Bearer ', '', $authorization));
        $sesion    = Sesion::where('token_hash', $tokenHash)->first();

        if (!$sesion) {
            // Si esta sesión fue cerrada por un nuevo login (takeover), el login
            // dejó una marca en caché con su token_hash → se avisa específicamente.
            $motivo = Cache::pull('sesion_tomada:' . $tokenHash) ? 'nueva_sesion' : 'invalida';
            $mensaje = $motivo === 'nueva_sesion'
                ? 'Se inició sesión con tu usuario en otro dispositivo.'
                : 'No autorizado.';
            return $this->noAutorizado($motivo, $mensaje);
        }

        $usuario = $sesion->usuario;

        if (!$usuario || !$usuario->activo) {
            $sesion->delete();
            return $this->noAutorizado('invalida');
        }

        // Cuentas temporales (ej. auditores, contratistas externos): se
        // desactivan solas al vencer su fecha límite de acceso.
        if ($usuario->temp && $usuario->temp_expira_en && now()->isAfter($usuario->temp_expira_en)) {
            $usuario->update(['activo' => false]);
            $sesion->delete();
            return $this->noAutorizado('expirada', 'El acceso temporal de esta cuenta ha vencido.');
        }

        // El bloqueo permanente de IP (ip_bloqueada) se revisa SOLO al hacer
        // login (AuthController), no en cada request de una sesión ya
        // autenticada. Si se revisara aquí también, bloquear a un usuario
        // bloquea de paso su IP, y si el admin comparte esa IP (oficina),
        // su propia sesión activa quedaría cortada de TODO — incluida la
        // acción de desbloquear — dejando el sistema sin salida posible
        // desde la app.

        $idleMinutes   = (int) config('auth.token.idle_minutes', 30);
        $absoluteHours = (int) config('auth.token.absolute_hours', 12);
        $renewThrottle = (int) config('auth.token.renew_throttle_seconds', 60);

        // Tope absoluto desde la creación de la sesión.
        if ($sesion->created_at && now()->isAfter($sesion->created_at->copy()->addHours($absoluteHours))) {
            $sesion->delete();
            return $this->noAutorizado('expirada', 'Sesión expirada. Inicia sesión nuevamente.');
        }

        // Expiración por inactividad (minutos).
        if ($sesion->expira_en && now()->isAfter($sesion->expira_en)) {
            $sesion->delete();
            return $this->noAutorizado('expirada', 'Sesión expirada por inactividad. Inicia sesión nuevamente.');
        }

        // Renueva la ventana de inactividad / "último visto", pero NO en cada
        // request: solo si pasaron al menos `renewThrottle` segundos desde la
        // última escritura. El estado vive en `sesiones` (no en `usuarios`), así
        // que la actividad de muchos usuarios no contiende sobre esa tabla. Se
        // espeja `usuarios.ultimo_visto` para mantener los reportes existentes.
        if (!$sesion->ultimo_visto || $sesion->ultimo_visto->diffInSeconds(now()) >= $renewThrottle) {
            $sesion->update([
                'expira_en'    => now()->addMinutes($idleMinutes),
                'ultimo_visto' => now(),
                'ip'           => $request->ip(),
            ]);
            $usuario->update(['ultimo_visto' => now()]);
        }

        auth()->login($usuario);

        return $next($request);
    }
}
