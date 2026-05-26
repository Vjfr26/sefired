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
            return response()->json(['message' => 'No autorizado. Token faltante o inválido.'], 401);
        }

        $token = str_replace('Bearer ', '', $authorization);
        $usuario = Usuario::where('api_token', $token)->first();

        if (!$usuario || !$usuario->activo) {
            return response()->json(['message' => 'No autorizado. Token inválido o cuenta desactivada.'], 401);
        }

        // Verificar si la IP del request está en la lista de IPs bloqueadas
        if (IpBloqueada::where('ip', $request->ip())->exists()) {
            return response()->json(['message' => 'Acceso denegado desde esta dirección IP.'], 403);
        }

        // Límite absoluto: máximo 12 horas desde que se creó el token, sin importar actividad
        if ($usuario->token_created_at && now()->isAfter($usuario->token_created_at->addHours(12))) {
            $usuario->update(['api_token' => null, 'token_expira_en' => null, 'token_created_at' => null]);
            return response()->json(['message' => 'La sesión ha expirado. Por favor inicia sesión nuevamente.'], 401);
        }

        // Expiración por inactividad: 8 horas sin hacer ningún request
        if ($usuario->token_expira_en && now()->isAfter($usuario->token_expira_en)) {
            $usuario->update(['api_token' => null, 'token_expira_en' => null, 'token_created_at' => null]);
            return response()->json(['message' => 'La sesión expiró por inactividad. Por favor inicia sesión nuevamente.'], 401);
        }

        // Renovar ventana de inactividad con cada request activo
        $usuario->update(['token_expira_en' => now()->addHours(8)]);

        auth()->login($usuario);

        return $next($request);
    }
}
