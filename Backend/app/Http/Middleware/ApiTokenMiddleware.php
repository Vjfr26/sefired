<?php

namespace App\Http\Middleware;

use App\Models\Sesion;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $authorization = $request->header('Authorization');

        if (!$authorization || !str_starts_with($authorization, 'Bearer ')) {
            return response()->json(['message' => 'No autorizado.'], 401);
        }

        $tokenHash = hash('sha256', str_replace('Bearer ', '', $authorization));
        $sesion    = Sesion::where('token_hash', $tokenHash)->first();

        if (!$sesion) {
            return response()->json(['message' => 'No autorizado.'], 401);
        }

        $usuario = $sesion->usuario;

        if (!$usuario || !$usuario->activo) {
            $sesion->delete();
            return response()->json(['message' => 'No autorizado.'], 401);
        }

        // Cuentas temporales (ej. auditores, contratistas externos): se
        // desactivan solas al vencer su fecha límite de acceso.
        if ($usuario->temp && $usuario->temp_expira_en && now()->isAfter($usuario->temp_expira_en)) {
            $usuario->update(['activo' => false]);
            $sesion->delete();
            return response()->json(['message' => 'El acceso temporal de esta cuenta ha vencido.'], 401);
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
            return response()->json(['message' => 'Sesión expirada. Inicia sesión nuevamente.'], 401);
        }

        // Expiración por inactividad (minutos).
        if ($sesion->expira_en && now()->isAfter($sesion->expira_en)) {
            $sesion->delete();
            return response()->json(['message' => 'Sesión expirada por inactividad. Inicia sesión nuevamente.'], 401);
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
