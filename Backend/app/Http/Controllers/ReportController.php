<?php

namespace App\Http\Controllers;

use App\Models\Log;
use App\Models\Usuario;
use App\Models\Venta;
use App\Models\Cliente;
use App\Models\Poliza;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Obtiene el historial de logs del sistema con filtros.
     */
    public function getLogs(Request $request)
    {
        $query = Log::with('usuario:id,nombre,nick')
            ->orderBy('created_at', 'desc');

        // Filtro por usuario
        if ($request->has('usuario_id')) {
            $query->where('usuario_id', $request->usuario_id);
        }

        // Filtro por acción
        if ($request->has('accion')) {
            $query->where('accion', 'like', "%{$request->accion}%");
        }

        // Filtro por fecha
        if ($request->has('desde')) {
            $query->whereDate('created_at', '>=', $request->desde);
        }
        if ($request->has('hasta')) {
            $query->whereDate('created_at', '<=', $request->hasta);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Obtiene estadísticas generales para el Dashboard.
     */
    public function getStats()
    {
        $stats = [
            'total_usuarios' => Usuario::count(),
            'usuarios_activos' => Usuario::where('activo', true)->count(),
            'total_clientes' => Cliente::count(),
            'total_polizas' => Poliza::count(),
            'total_ventas' => Venta::count(),
            'logs_hoy' => Log::whereDate('created_at', today())->count(),
            // Puedes añadir más estadísticas aquí
        ];

        return response()->json($stats);
    }
}
