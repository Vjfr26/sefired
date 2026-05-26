<?php

namespace App\Http\Controllers;

use App\Models\Log;
use App\Models\Usuario;
use App\Models\Cliente;
use App\Models\Poliza;
use App\Models\Solicitud;
use App\Models\UnderwritingEvaluacion;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Obtiene el historial de logs del sistema con filtros.
     */
    public function getLogs(Request $request)
    {
        $request->validate([
            'usuario_id' => 'nullable|integer|exists:usuarios,id',
            'accion'     => 'nullable|string|max:100',
            'desde'      => 'nullable|date',
            'hasta'      => 'nullable|date|after_or_equal:desde',
        ]);

        $query = Log::with('usuario:id,nombre')
            ->orderBy('created_at', 'desc');

        if ($request->filled('usuario_id')) {
            $query->where('usuario_id', (int) $request->usuario_id);
        }

        if ($request->filled('accion')) {
            $query->where('accion', 'like', '%' . $request->accion . '%');
        }

        if ($request->filled('desde')) {
            $query->whereDate('created_at', '>=', $request->desde);
        }

        if ($request->filled('hasta')) {
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
            'total_usuarios'           => Usuario::count(),
            'usuarios_activos'         => Usuario::where('activo', true)->count(),
            'total_clientes'           => Cliente::count(),
            'logs_hoy'                 => Log::whereDate('created_at', today())->count(),
            'total_cotizaciones'       => Solicitud::count(),
            'cotizaciones_en_revision' => Solicitud::where('status', 'En Revisión')->count(),
            'cotizaciones_aprobadas'   => Solicitud::where('status', 'Aprobado')->count(),
            'cotizaciones_emitidas'    => Solicitud::where('status', 'Emitida')->count(),
            'cotizaciones_rechazadas'  => Solicitud::where('status', 'Rechazado')->count(),
            'polizas_activas'          => Poliza::where('status', 'ACTIVA')->count(),
            'polizas_vencidas'         => Poliza::where('status', 'VENCIDA')->count(),
            'polizas_anuladas'         => Poliza::where('status', 'ANULADA')->count(),
            'underwriting_pendiente'   => UnderwritingEvaluacion::where('resultado', 'pendiente')->count(),
            'underwriting_observado'   => UnderwritingEvaluacion::where('resultado', 'observado')->count(),
        ];

        return response()->json($stats);
    }
}
