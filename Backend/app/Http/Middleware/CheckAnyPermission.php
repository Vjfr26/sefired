<?php

namespace App\Http\Middleware;

use App\Support\PermisosPorRol;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAnyPermission
{
    /**
     * Igual que CheckPermission, pero pasa si el usuario tiene CUALQUIERA
     * de los permisos indicados — útil para rutas que se usan desde más
     * de un flujo con distinto permiso de entrada (ej. crear/editar un
     * "bien" pasa por la pantalla de Vehículos -con permiso `vehiculos`-
     * o por el wizard de cotizaciones -con permiso `cotizaciones`-).
     *
     * Uso: ->middleware('perm_any:vehiculos.edit,cotizaciones.edit')
     */
    public function handle(Request $request, Closure $next, string ...$pares): Response
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'No autorizado.'], 401);
        }

        if ($user->tipo === 'Admin') {
            return $next($request);
        }

        $permisos = $user->permisos;
        if (empty($permisos)) {
            $permisos = PermisosPorRol::paraRol($user->tipo);
        }

        foreach ($pares as $par) {
            [$module, $action] = array_pad(explode('.', $par, 2), 2, 'view');
            if (isset($permisos[$module]) && in_array($action, $permisos[$module])) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'No tienes permiso para realizar esta acción.',
        ], 403);
    }
}
