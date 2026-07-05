<?php

namespace App\Http\Controllers;

use App\Models\Solicitud;
use App\Models\UnderwritingEvaluacion;
use App\Rules\NoInjectionChars;
use App\Services\WorkflowService;
use App\Traits\LogsActivity;
use App\Traits\ScopesVendedor;
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
    use LogsActivity, ScopesVendedor;

    /** Lista las evaluaciones de una cotización, de más reciente a más antigua. */
    public function index($solicitudId)
    {
        $solicitud = Solicitud::findOrFail($solicitudId);
        $this->assertAccesoSolicitud($solicitud);

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
     * Si el resultado es 'aprobado' → solicitud pasa a 'aprobado'.
     * Si el resultado es 'rechazado' → solicitud pasa a 'rechazado'.
     * En ambos casos se valida la transición con WorkflowService.
     */
    public function store(Request $request, $solicitudId)
    {
        $solicitud = Solicitud::findOrFail($solicitudId);
        $this->assertAccesoSolicitud($solicitud);

        if ($solicitud->status === 'emitida') {
            return response()->json(['error' => 'No se puede evaluar una cotización ya emitida.'], 409);
        }

        $noInjection = new NoInjectionChars();

        $data = $request->validate([
            'tipo'                => 'sometimes|in:manual,automatica',
            'resultado'           => 'required|in:pendiente,aprobado,rechazado,observado',
            'score'               => 'nullable|numeric|min:0|max:100',
            'observaciones'       => ['nullable', 'string', 'max:1000', $noInjection],
            'motivo_rechazo'      => ['nullable', 'string', 'max:1000', $noInjection],
            'requiere_inspeccion' => 'boolean',
            'reglas_aplicadas'    => 'nullable|array',
        ]);

        $data['solicitud_id']    = $solicitudId;
        $data['evaluador_id']    = auth()->id();
        $data['tipo']            = $data['tipo'] ?? 'manual';
        $data['fecha_evaluacion'] = now();

        // Aprobación "limpia" (sin observaciones) — la única que desemboca en
        // emisión automática, y solo si el vendedor ya registró el pago.
        $tieneObservacion = trim((string) ($data['observaciones'] ?? '')) !== '';
        $aproboLimpio     = $data['resultado'] === 'aprobado' && !$tieneObservacion;
        $emitir           = $aproboLimpio && !empty($solicitud->pago_datos);

        $solicitudCtrl = app(SolicitudController::class);
        // Valida el monto ANTES de crear la evaluación: así una aprobación no
        // queda "aprobada sin póliza" por un pago fuera de rango (falla 422).
        if ($emitir) {
            $solicitudCtrl->validarMontoPago($solicitud, $solicitud->pago_datos);
        }

        $evaluacion = DB::transaction(function () use ($data, $solicitud, $tieneObservacion) {
            $ev = UnderwritingEvaluacion::create($data);

            // Sincronizar el estado de la solicitud con la evaluación:
            //  - rechazado           → rechazado (una negativa es una negativa);
            //  - observado / con una  observación anotada → en_revision (queda
            //    para revisar);
            //  - aprobado sin observación → aprobado (y, si hay pago, se emite abajo).
            $nuevoStatus = null;
            if ($data['resultado'] === 'rechazado') {
                $nuevoStatus = 'rechazado';
            } elseif ($data['resultado'] === 'observado' || $tieneObservacion) {
                $nuevoStatus = 'en_revision';
            } elseif ($data['resultado'] === 'aprobado') {
                $nuevoStatus = 'aprobado';
            }

            if ($nuevoStatus && $nuevoStatus !== $solicitud->status) {
                WorkflowService::assertSolicitud($solicitud->status, $nuevoStatus);
                $solicitud->update(['status' => $nuevoStatus]);
            }

            return $ev;
        });

        // NUEVO FLUJO: aprobar con pago registrado genera la póliza + recibo
        // automáticamente (aprobado → emitida), usando el pago del vendedor.
        if ($emitir) {
            $solicitudCtrl->emitirConPago($solicitud->fresh(), $solicitud->pago_datos);
        }

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
        $this->assertAccesoSolicitud($evaluacion->solicitud);

        $noInjection = new NoInjectionChars();

        $data = $request->validate([
            'resultado'           => 'sometimes|in:pendiente,aprobado,rechazado,observado',
            'score'               => 'nullable|numeric|min:0|max:100',
            'observaciones'       => ['nullable', 'string', 'max:1000', $noInjection],
            'motivo_rechazo'      => ['nullable', 'string', 'max:1000', $noInjection],
            'requiere_inspeccion' => 'sometimes|boolean',
            'reglas_aplicadas'    => 'nullable|array',
        ]);

        DB::transaction(function () use ($data, $evaluacion) {
            $evaluacion->update($data);

            if (isset($data['resultado'])) {
                $mapEstado = ['aprobado' => 'aprobado', 'rechazado' => 'rechazado'];
                $solicitud = $evaluacion->solicitud;

                if (isset($mapEstado[$data['resultado']]) && $solicitud->status !== 'emitida') {
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

    /**
     * Un vendedor solo puede evaluar/ver underwriting de SUS propias
     * cotizaciones — espejo exacto de SolicitudController::assertAccesoSolicitud
     * (vendedor_id null tampoco se permite: son leads sin reclamar).
     */
    private function assertAccesoSolicitud(Solicitud $solicitud): void
    {
        $user = auth()->user();
        if ($this->esRolRestringido() && $solicitud->vendedor_id !== $user->id) {
            abort(403, 'No tienes acceso a esta cotización.');
        }
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
