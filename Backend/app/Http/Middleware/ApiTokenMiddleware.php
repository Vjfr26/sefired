<?php

namespace App\Http\Middleware;

use App\Models\Usuario;
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

        $token     = str_replace('Bearer ', '', $authorization);
        $tokenHash = hash('sha256', $token);
        $usuario   = Usuario::where('api_token', $tokenHash)->first();

        if (!$usuario || !$usuario->activo) {
            return response()->json(['message' => 'No autorizado.'], 401);
        }

        // Cuentas temporales (ej. auditores, contratistas externos): se
        // desactivan solas al vencer su fecha límite de acceso.
        if ($usuario->temp && $usuario->temp_expira_en && now()->isAfter($usuario->temp_expira_en)) {
            $usuario->update(['activo' => false, 'api_token' => null]);
            return response()->json(['message' => 'El acceso temporal de esta cuenta ha vencido.'], 401);
        }

        // El bloqueo permanente de IP (ip_bloqueada) se revisa SOLO al hacer
        // login (AuthController), no en cada request de una sesión ya
        // autenticada. Si se revisara aquí también, bloquear a un usuario
        // bloquea de paso su IP, y si el admin comparte esa IP (oficina),
        // su propia sesión activa quedaría cortada de TODO — incluida la
        // acción de desbloquear — dejando el sistema sin salida posible
        // desde la app. El bloqueo de IP sigue siendo permanente y sigue
        // impidiendo iniciar sesión nueva desde ahí; solo no interrumpe
        // sesiones que ya estaban autenticadas.

        $idleMinutes   = (int) config('auth.token.idle_minutes', 30);
        $absoluteHours = (int) config('auth.token.absolute_hours', 12);
        $renewThrottle = (int) config('auth.token.renew_throttle_seconds', 60);

        // Límite absoluto desde la creación del token.
        if ($usuario->token_created_at && now()->isAfter($usuario->token_created_at->copy()->addHours($absoluteHours))) {
            $usuario->update(['api_token' => null, 'token_expira_en' => null, 'token_created_at' => null]);
            return response()->json(['message' => 'Sesión expirada. Inicia sesión nuevamente.'], 401);
        }

        // Expiración por inactividad (minutos).
        if ($usuario->token_expira_en && now()->isAfter($usuario->token_expira_en)) {
            $usuario->update(['api_token' => null, 'token_expira_en' => null, 'token_created_at' => null]);
            return response()->json(['message' => 'Sesión expirada por inactividad. Inicia sesión nuevamente.'], 401);
        }

        // Renueva la ventana de inactividad y "último visto", pero NO en cada
        // request: solo si pasaron al menos `renewThrottle` segundos desde la
        // última escritura. Así una sesión activa no produce un UPDATE en la
        // tabla `usuarios` por cada llamada a la API — clave con muchos
        // usuarios concurrentes. La ventana de inactividad (minutos) es muy
        // superior a este intervalo, así que la sesión no expira antes de tiempo.
        if (!$usuario->ultimo_visto || $usuario->ultimo_visto->diffInSeconds(now()) >= $renewThrottle) {
            $usuario->update(['token_expira_en' => now()->addMinutes($idleMinutes), 'ultimo_visto' => now()]);
        }

        auth()->login($usuario);

        return $next($request);
    }
}
