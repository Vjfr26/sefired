<?php

namespace App\Http\Controllers;

use App\Models\Log;
use App\Models\Usuario;
use App\Models\Persona;
use App\Models\Poliza;
use App\Models\Solicitud;
use App\Models\UnderwritingEvaluacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
        // Consolidar conteos en el menor número de queries posible
        $solCounts = Solicitud::selectRaw("
            COUNT(*) as total,
            SUM(status = 'en_revision') as en_revision,
            SUM(status = 'aprobado')    as aprobado,
            SUM(status = 'emitida')     as emitida,
            SUM(status = 'rechazado')   as rechazado
        ")->first();

        $polCounts = Poliza::selectRaw("
            SUM(status = 'ACTIVA')   as activas,
            SUM(status = 'VENCIDA')  as vencidas,
            SUM(status = 'ANULADA')  as anuladas
        ")->first();

        $uwCounts = UnderwritingEvaluacion::selectRaw("
            SUM(resultado = 'pendiente')  as pendiente,
            SUM(resultado = 'observado')  as observado
        ")->first();

        $stats = [
            'total_usuarios'           => Usuario::count(),
            'usuarios_activos'         => Usuario::where('activo', true)->count(),
            'total_clientes'           => Persona::count(),
            'logs_hoy'                 => Log::whereDate('created_at', today())->count(),
            'total_cotizaciones'       => (int) $solCounts->total,
            'cotizaciones_en_revision' => (int) $solCounts->en_revision,
            'cotizaciones_aprobadas'   => (int) $solCounts->aprobado,
            'cotizaciones_emitidas'    => (int) $solCounts->emitida,
            'cotizaciones_rechazadas'  => (int) $solCounts->rechazado,
            'polizas_activas'          => (int) $polCounts->activas,
            'polizas_vencidas'         => (int) $polCounts->vencidas,
            'polizas_anuladas'         => (int) $polCounts->anuladas,
            'underwriting_pendiente'   => (int) $uwCounts->pendiente,
            'underwriting_observado'   => (int) $uwCounts->observado,
        ];

        return response()->json($stats);
    }
}
