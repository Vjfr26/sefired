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
            return response()->json(['message' => 'No autorizado. Token faltante o inválido.'], 401);
        }

        $token = str_replace('Bearer ', '', $authorization);
        $usuario = Usuario::where('api_token', $token)->first();

        if (!$usuario || !$usuario->activo) {
            return response()->json(['message' => 'No autorizado. Token inválido o cuenta desactivada.'], 401);
        }

        // Auth the user in the request
        auth()->login($usuario);

        return $next($request);
    }
}
