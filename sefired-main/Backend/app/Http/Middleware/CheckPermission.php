<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Verifica que el usuario tenga el permiso requerido.
     * Los Admin tienen acceso total siempre.
     * Uso: ->middleware('perm:cotizaciones,create')
     */
    public function handle(Request $request, Closure $next, string $module, string $action = 'view'): Response
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'No autorizado.'], 401);
        }

        // Admin tiene acceso total, sin importar permisos explícitos
        if ($user->tipo === 'Admin') {
            return $next($request);
        }

        $permisos = $user->permisos ?? [];

        if (!isset($permisos[$module]) || !in_array($action, $permisos[$module])) {
            return response()->json([
                'message' => 'No tienes permiso para realizar esta acción.',
            ], 403);
        }

        return $next($request);
    }
}
