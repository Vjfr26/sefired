<?php

namespace App\Http\Middleware;

use App\Support\PermisosPorRol;
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

        // permisos vacío/null es un estado válido (no un error): significa
        // que el usuario no tiene overrides personalizados y debe heredar
        // los permisos por defecto de su rol — igual que ya hace el
        // frontend en getEffectivePermsObj(). Sin este fallback, cualquier
        // usuario sin permisos personalizados quedaba bloqueado de TODO.
        if (!PermisosPorRol::tiene($user, $module, $action)) {
            return response()->json([
                'message' => 'No tienes permiso para realizar esta acción.',
            ], 403);
        }

        return $next($request);
    }
}
