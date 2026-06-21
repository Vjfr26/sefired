<?php

namespace App\Http\Middleware;

use App\Models\IpBloqueada;
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

        if (IpBloqueada::where('ip', $request->ip())->exists()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        // Límite absoluto: 12 horas desde creación del token
        if ($usuario->token_created_at && now()->isAfter($usuario->token_created_at->addHours(12))) {
            $usuario->update(['api_token' => null, 'token_expira_en' => null, 'token_created_at' => null]);
            return response()->json(['message' => 'Sesión expirada. Inicia sesión nuevamente.'], 401);
        }

        // Expiración por inactividad: 8 horas sin actividad
        if ($usuario->token_expira_en && now()->isAfter($usuario->token_expira_en)) {
            $usuario->update(['api_token' => null, 'token_expira_en' => null, 'token_created_at' => null]);
            return response()->json(['message' => 'Sesión expirada por inactividad. Inicia sesión nuevamente.'], 401);
        }

        // Renovar ventana de inactividad con cada request activo, y registrar
        // este momento como "última conexión" real (no solo el último login).
        $usuario->update(['token_expira_en' => now()->addHours(8), 'ultimo_visto' => now()]);

        auth()->login($usuario);

        return $next($request);
    }
}
