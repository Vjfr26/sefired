<?php

namespace App\Http\Controllers;

use App\Models\Solicitud;
use App\Models\UnderwritingEvaluacion;
use App\Services\WorkflowService;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Gestión de evaluaciones de underwriting para cotizaciones.
 *
 * Rutas:
 *   GET  /api/cotizaciones/{id}/underwriting  → historial de evaluaciones
 *   POST /api/cotizaciones/{id}/underwriting  → crear evaluación
 *   PUT  /api/underwriting/{id}               → actualizar evaluación (cambiar resultado)
 */
class UnderwritingController extends Controller
{
    use LogsActivity;

    /** Lista las evaluaciones de una cotización, de más reciente a más antigua. */
    public function index($solicitudId)
    {
        Solicitud::findOrFail($solicitudId);

        $evaluaciones = UnderwritingEvaluacion::where('solicitud_id', $solicitudId)
            ->with('evaluador')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($e) => $this->row($e));

        return response()->json($evaluaciones);
    }

    /**
     * Crea una nueva evaluación.
     *
     * Si el resultado es 'aprobado' → solicitud pasa a 'Aprobado'.
     * Si el resultado es 'rechazado' → solicitud pasa a 'Rechazado'.
     * En ambos casos se valida la transición con WorkflowService.
     */
    public function store(Request $request, $solicitudId)
    {
        $solicitud = Solicitud::findOrFail($solicitudId);

        if ($solicitud->status === 'Emitida') {
            return response()->json(['error' => 'No se puede evaluar una cotización ya emitida.'], 409);
        }

        $data = $request->validate([
            'tipo'                => 'sometimes|in:manual,automatica',
            'resultado'           => 'required|in:pendiente,aprobado,rechazado,observado',
            'score'               => 'nullable|numeric|min:0|max:100',
            'observaciones'       => 'nullable|string',
            'motivo_rechazo'      => 'nullable|string',
            'requiere_inspeccion' => 'boolean',
            'reglas_aplicadas'    => 'nullable|array',
        ]);

        $data['solicitud_id']    = $solicitudId;
        $data['evaluador_id']    = auth()->id();
        $data['tipo']            = $data['tipo'] ?? 'manual';
        $data['fecha_evaluacion'] = now();

        $evaluacion = DB::transaction(function () use ($data, $solicitud) {
            $ev = UnderwritingEvaluacion::create($data);

            // Sincronizar estado de la solicitud con el resultado
            $mapEstado = [
                'aprobado'  => 'Aprobado',
                'rechazado' => 'Rechazado',
            ];

            if (isset($mapEstado[$data['resultado']])) {
                $nuevoStatus = $mapEstado[$data['resultado']];
                WorkflowService::assertSolicitud($solicitud->status, $nuevoStatus);
                $solicitud->update(['status' => $nuevoStatus]);
            }

            return $ev;
        });

        $this->logActivity(
            'Underwriting Creado',
            "Evaluación #{$evaluacion->id} — solicitud #{$solicitudId} → {$data['resultado']}",
            'underwriting',
            auth()->id()
        );

        return response()->json($this->row($evaluacion->load('evaluador')), 201);
    }

    /**
     * Actualiza el resultado de una evaluación existente.
     * Útil para corregir observaciones o escalar de 'observado' a 'aprobado'/'rechazado'.
     */
    public function update(Request $request, $id)
    {
        $evaluacion = UnderwritingEvaluacion::with('solicitud')->findOrFail($id);

        $data = $request->validate([
            'resultado'           => 'sometimes|in:pendiente,aprobado,rechazado,observado',
            'score'               => 'nullable|numeric|min:0|max:100',
            'observaciones'       => 'nullable|string',
            'motivo_rechazo'      => 'nullable|string',
            'requiere_inspeccion' => 'sometimes|boolean',
            'reglas_aplicadas'    => 'nullable|array',
        ]);

        DB::transaction(function () use ($data, $evaluacion) {
            $evaluacion->update($data);

            if (isset($data['resultado'])) {
                $mapEstado = ['aprobado' => 'Aprobado', 'rechazado' => 'Rechazado'];
                $solicitud = $evaluacion->solicitud;

                if (isset($mapEstado[$data['resultado']]) && $solicitud->status !== 'Emitida') {
                    $nuevoStatus = $mapEstado[$data['resultado']];
                    if (WorkflowService::canTransitionSolicitud($solicitud->status, $nuevoStatus)) {
                        $solicitud->update(['status' => $nuevoStatus]);
                    }
                }
            }
        });

        $this->logActivity(
            'Underwriting Actualizado',
            "Evaluación #{$id} actualizada",
            'underwriting',
            auth()->id()
        );

        return response()->json($this->row($evaluacion->fresh()->load('evaluador')));
    }

    private function row(UnderwritingEvaluacion $e): array
    {
        return [
            'id'                  => $e->id,
            'solicitud_id'        => $e->solicitud_id,
            'evaluador_id'        => $e->evaluador_id,
            'evaluador'           => $e->evaluador ? ($e->evaluador->nombre ?? $e->evaluador->email) : null,
            'tipo'                => $e->tipo,
            'resultado'           => $e->resultado,
            'score'               => $e->score,
            'observaciones'       => $e->observaciones,
            'motivo_rechazo'      => $e->motivo_rechazo,
            'requiere_inspeccion' => (bool) $e->requiere_inspeccion,
            'reglas_aplicadas'    => $e->reglas_aplicadas,
            'fecha_evaluacion'    => $e->fecha_evaluacion?->toDateTimeString(),
            'created_at'          => $e->created_at?->toDateTimeString(),
        ];
    }
}
