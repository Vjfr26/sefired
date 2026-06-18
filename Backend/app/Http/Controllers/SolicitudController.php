<?php

namespace App\Http\Controllers;

use App\Mail\CotizacionMail;
use App\Mail\CotizacionStatusMail;
use App\Mail\PolizaEmitidaMail;
use App\Mail\FacturaMail;
use App\Models\EmailLog;
use App\Models\Solicitud;
use App\Models\Persona;
use App\Models\Poliza;
use App\Models\Factura;
use App\Rules\NoInjectionChars;
use App\Services\WorkflowService;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

/**
 * Gestión de cotizaciones/solicitudes de seguro.
 *
 * Una cotización (Solicitud con status != null) recorre el ciclo:
 *   En Revisión → Aprobado → Emitida (póliza generada)
 *                          → Rechazado
 *
 * Rutas en routes/api.php:
 *   GET  /api/cotizaciones        → listado de todas las cotizaciones
 *   POST /api/cotizaciones        → guardar nueva cotización del simulador
 *   PUT  /api/cotizaciones/{id}   → actualizar status de una cotización
 */
class SolicitudController extends Controller
{
    use LogsActivity;

    /**
     * Lista todas las cotizaciones ordenadas de más reciente a más antigua.
     * Incluye datos del cliente (nombre, cédula) y del vendedor.
     */
    public function index()
    {
        $solicitudes = Solicitud::with(['persona', 'producto'])
            ->orderByDesc('fecha_solicitud')
            ->orderByDesc('id')
            ->get()
            ->map(fn($s) => $this->formatRow($s));

        return response()->json($solicitudes);
    }

    /**
     * Guarda una cotización generada por el simulador.
     *
     * El campo `coberturas` almacena el JSON completo de la simulación:
     * items seleccionados, tasa BCV, subtotales, IVA y total final.
     * Permite reconstruir el desglose en cualquier momento.
     */
    public function store(Request $request)
    {
        $noInjection = new NoInjectionChars();

        $data = $request->validate([
            'persona_id'        => 'nullable|integer|exists:persona,id',
            'bien_asegurado_id' => 'nullable|integer|exists:bien_asegurado,id',
            'producto_id'       => 'nullable|integer|exists:producto,id',
            'tarifario_id'      => 'nullable|integer|exists:tarifario,id',
            'total'             => 'required|numeric|min:0',
            'total_bs'          => 'required|numeric|min:0',
            'fecha_solicitud'   => 'required|date',
            'coberturas'        => 'required|array',
            'nombre_tomador'    => ['nullable', 'string', 'max:120', $noInjection],
            'ci_tomador'        => ['nullable', 'string', 'max:20', $noInjection],
            'asegurado_nombre'  => ['nullable', 'string', 'max:120', $noInjection],
            'asegurado_ci'      => ['nullable', 'string', 'max:20', $noInjection],
        ]);

        $data['vendedor_id'] = auth()->id();
        $data['status']      = 'en_revision';
        $data['fuente']      = 'interno';

        $solicitud = Solicitud::create($data);
        $solicitud->load(['persona', 'producto', 'bien']);

        $ref = $solicitud->asegurado_nombre ?? $solicitud->nombre_tomador ?? "solicitud #{$solicitud->id}";
        $this->logActivity(
            'Cotización Creada',
            "Cotización #{$solicitud->id} — {$ref}",
            'solicitud',
            auth()->id()
        );

        // Enviar simulación por correo al cliente si tiene correo registrado
        $correo = $solicitud->persona?->correo;
        if ($correo) {
            try {
                Mail::to($correo)->queue(new CotizacionMail($solicitud));
                EmailLog::registrar(
                    tipo: 'cotizacion',
                    destinatario: $correo,
                    asunto: 'Simulación de seguro',
                    personaId: $solicitud->persona_id,
                );
            } catch (\Throwable) {}
        }

        return response()->json($this->formatRow($solicitud), 201);
    }

    /**
     * Actualiza una cotización. Permite cambiar el estado o editar todos los campos
     * del simulador si la cotización aún no ha sido emitida.
     */
    public function update(Request $request, $id)
    {
        $solicitud = Solicitud::findOrFail($id);

        if ($solicitud->status === 'emitida') {
            return response()->json(['error' => 'No se puede editar una cotización ya emitida.'], 409);
        }

        $noInjection = new NoInjectionChars();

        $data = $request->validate([
            'status'            => 'sometimes|in:en_revision,rechazado,pendiente',
            'persona_id'        => 'sometimes|integer|exists:persona,id',
            'bien_asegurado_id' => 'nullable|integer|exists:bien_asegurado,id',
            'producto_id'       => 'nullable|integer|exists:producto,id',
            'tarifario_id'      => 'nullable|integer|exists:tarifario,id',
            'total'             => 'sometimes|numeric|min:0',
            'total_bs'          => 'sometimes|numeric|min:0',
            'fecha_solicitud'   => 'sometimes|date',
            'coberturas'        => 'sometimes|array',
            'nombre_tomador'    => ['nullable', 'string', 'max:120', $noInjection],
            'ci_tomador'        => ['nullable', 'string', 'max:20', $noInjection],
            'asegurado_nombre'  => ['nullable', 'string', 'max:120', $noInjection],
            'asegurado_ci'      => ['nullable', 'string', 'max:20', $noInjection],
        ]);

        // Validar transición de estado antes de persistir
        if (isset($data['status'])) {
            WorkflowService::assertSolicitud($solicitud->status, $data['status']);
        }

        $statusAnterior = $solicitud->status;
        $solicitud->update($data);

        $logMsg = isset($data['status'])
            ? "Cotización #{$id} → {$data['status']}"
            : "Cotización #{$id} actualizada";

        $this->logActivity('Cotización Actualizada', $logMsg, 'solicitud', auth()->id());

        // Notificar al cliente cuando la cotización cambia a aprobada o rechazada
        if (isset($data['status']) && in_array($data['status'], ['aprobado', 'rechazado']) && $data['status'] !== $statusAnterior) {
            $correo = $solicitud->persona?->correo;
            if ($correo) {
                try {
                    Mail::to($correo)->queue(new CotizacionStatusMail($solicitud->fresh('persona', 'producto'), $data['status']));
                    EmailLog::registrar(
                        'cotizacion_' . $data['status'],
                        $correo,
                        $data['status'] === 'aprobado' ? 'Cotización aprobada' : 'Cotización rechazada',
                        $solicitud->persona_id
                    );
                } catch (\Throwable) {}
            }
        }

        return response()->json(['message' => 'Cotización actualizada correctamente']);
    }

    /**
     * Emite una cotización: crea la Póliza y la Factura de forma automática.
     *
     * Solo puede emitirse si el status es 'aprobado' o 'en_revision'.
     * El nro_contrato y número de factura se auto-generan a partir del ID de póliza.
     *
     * Campos requeridos: pago, sede. Opcional: referencia.
     */
    public function emitir(Request $request, $id)
    {
        $solicitud = Solicitud::findOrFail($id);

        if ($solicitud->status === 'emitida') {
            return response()->json(['error' => 'Esta cotización ya fue emitida.'], 409);
        }

        $noInjection = new NoInjectionChars();

        $data = $request->validate([
            'tasa_bcv'          => 'required|numeric|min:0.0001',
            'tasa_eur'          => 'nullable|numeric|min:0.0001',
            'frecuencia_pago'   => 'nullable|string|in:Mensual,Anual',
            'pagos'             => 'required|array|min:1',
            'pagos.*.forma'     => ['required', 'string', 'max:30', $noInjection],
            'pagos.*.moneda'    => 'required|string|in:USD,EUR,Bs.',
            'pagos.*.monto'     => 'required|numeric|min:0.01',
            'pagos.*.referencia'=> ['nullable', 'string', 'max:100', $noInjection],
            // campos legacy / fallback
            'pago'      => ['nullable', 'string', 'max:30', $noInjection],
            'moneda'    => ['nullable', 'string', 'max:10', $noInjection],
            'referencia'=> ['nullable', 'string', 'max:50', $noInjection],
        ]);

        $solicitud->load(['persona', 'producto', 'tarifario', 'bien']);

        $cobs    = is_array($solicitud->coberturas) ? $solicitud->coberturas : [];
        $hoy     = now()->toDateString();
        $venc    = now()->addYear()->toDateString();
        $anno    = now()->year;
        $tasaBcv = (float) $data['tasa_bcv'];
        $tasaEur = isset($data['tasa_eur']) && $data['tasa_eur'] > 0 ? (float) $data['tasa_eur'] : $tasaBcv;

        // Validar que la suma de los pagos equivale al total de la póliza (±0.10 USD de tolerancia)
        $totalPoliza  = (float) $solicitud->total;
        $totalPagado  = 0.0;
        foreach ($data['pagos'] as $p) {
            $monto = (float) $p['monto'];
            $totalPagado += match ($p['moneda']) {
                'USD' => $monto,
                'EUR' => $tasaEur > 0 ? $monto * ($tasaEur / $tasaBcv) : $monto,
                'Bs.' => $tasaBcv > 0 ? $monto / $tasaBcv               : 0,
                default => 0,
            };
        }

        // Comparación exacta en centavos para evitar errores de punto flotante
        if ((int) round($totalPagado * 100) !== (int) round($totalPoliza * 100)) {
            return response()->json([
                'error' => sprintf(
                    'El total de los pagos ($ %.2f USD) no coincide con el total de la póliza ($ %.2f USD). Diferencia: $ %.2f USD.',
                    round($totalPagado, 2), $totalPoliza, abs(round($totalPagado, 2) - $totalPoliza)
                ),
            ], 422);
        }

        // Resumen de formas de pago para el campo string
        $pagoResumen = collect($data['pagos'])
            ->map(fn($p) => $p['forma'] . ' ' . $p['moneda'])
            ->join(' / ');

        $moneda      = $data['pagos'][0]['moneda'] ?? 'USD';
        $frecuencia  = $data['frecuencia_pago'] ?? 'Anual';

        // Sede desde el usuario autenticado o fallback
        $sede = auth()->user()?->sede ?? 'Principal';

        // cobertura_dolares: para productos por_valor (RCV) es el valor de mercado del vehículo;
        // para los demás tipos (fijo, por_plan, por_nivel) es la suma asegurada del producto.
        $tipoCal          = $solicitud->producto?->tipo_calculo;
        $coberturaDolares = ($tipoCal === 'por_valor')
            ? (float) ($cobs['valor_mercado'] ?? 0)
            : (float) ($solicitud->producto?->cobertura ?? 0);
        $totalUsd    = (float) $solicitud->total;
        $totalBs     = round($totalUsd * $tasaBcv, 2);
        $coberturaBS = round($coberturaDolares * $tasaBcv, 2);

        // Asegurado: si se indicó una persona diferente al tomador, se usa esa; si no, el tomador mismo.
        $aseguradoNombre = $solicitud->asegurado_nombre ?? $solicitud->nombre_tomador ?? null;
        $aseguradoCi     = $solicitud->asegurado_ci     ?? $solicitud->ci_tomador     ?? null;

        // Snapshot inmutable: datos tal como existían al momento de emisión.
        $snapshot = [
            'tomador' => [
                'nombre' => $solicitud->nombre_tomador ?? $solicitud->persona?->nombre,
                'ci'     => $solicitud->ci_tomador     ?? $solicitud->persona?->cedula,
            ],
            'asegurado' => [
                'nombre' => $aseguradoNombre,
                'ci'     => $aseguradoCi,
            ],
            'producto' => $solicitud->producto ? [
                'id'           => $solicitud->producto->id,
                'nombre'       => $solicitud->producto->nombre,
                'tipo'         => $solicitud->producto->tipo,
                'tipo_calculo' => $solicitud->producto->tipo_calculo,
                'cobertura'    => $solicitud->producto->cobertura,
            ] : null,
            'tarifario' => $solicitud->tarifario ? [
                'id'      => $solicitud->tarifario->id,
                'nombre'  => $solicitud->tarifario->nombre,
                'version' => $solicitud->tarifario->version,
                'datos'   => $solicitud->tarifario->datos,
            ] : null,
            'coberturas'       => $cobs,
            'tasa_bcv'         => (float) ($cobs['tasaBCV'] ?? 1),
            'tasa_emision'     => $tasaBcv,
            'tasa_emision_eur' => $tasaEur,
            'moneda'           => $moneda,
            'pagos'            => $data['pagos'],
            'bien'             => $solicitud->bien ? [
                'id'        => $solicitud->bien->id,
                'tipo'      => $solicitud->bien->tipo,
                'atributos' => $solicitud->bien->atributos,
            ] : null,
            'fecha_emision' => $hoy,
            'total_usd'     => $totalUsd,
            'total_bs'      => $totalBs,
        ];

        $result = DB::transaction(function () use ($solicitud, $data, $hoy, $venc, $anno, $coberturaDolares, $coberturaBS, $aseguradoNombre, $aseguradoCi, $snapshot, $tasaBcv, $tasaEur, $totalUsd, $totalBs, $moneda, $pagoResumen, $sede, $frecuencia) {
            $poliza = Poliza::create([
                'nro_contrato'         => 'TMP-' . uniqid(),
                'solicitud_id'         => $solicitud->id,
                'producto_id'          => $solicitud->producto_id ?? null,
                'total'                => $totalUsd,
                'total_bs'             => $totalBs,
                'tasa_emision'         => $tasaBcv,
                'tasa_emision_eur'     => $tasaEur,
                'cobertura_dolares'    => $coberturaDolares,
                'cobertura_bs'         => $coberturaBS,
                'asegurado_nombre'     => $aseguradoNombre,
                'asegurado_ci'         => $aseguradoCi,
                'pago'                 => $pagoResumen,
                'frecuencia_pago'      => $frecuencia,
                'moneda'               => $moneda,
                'tipo'                 => 'Individual',
                'fecha_emision'        => $hoy,
                'fecha_vencimiento'    => $venc,
                'sede_poliza'          => $sede,
                'vendedor_id'          => $solicitud->vendedor_id ?? auth()->id(),
                'status'               => 'ACTIVA',
                'snapshot_datos'       => $snapshot,
                'tarifario_version_id' => $solicitud->tarifario_id,
            ]);

            $nroContrato = 'POL-' . $anno . '-' . str_pad($poliza->id, 5, '0', STR_PAD_LEFT);
            $nroFactura  = 'FAC-' . $anno . '-' . str_pad($poliza->id, 5, '0', STR_PAD_LEFT);

            $poliza->update(['nro_contrato' => $nroContrato]);

            Factura::create([
                'numero'        => $nroFactura,
                'sede'          => $sede,
                'fecha_factura' => $hoy,
                'poliza_id'     => $poliza->id,
                'valor'         => $totalUsd,
                'valor_bs'      => $totalBs,
                'forma_pago'    => $pagoResumen,
                'moneda'        => $moneda,
                'referencia'    => $data['pagos'][0]['referencia'] ?? null,
                'usuario_id'    => auth()->id(),
            ]);

            $solicitud->update(['status' => 'emitida']);

            return ['nro_contrato' => $nroContrato, 'nro_factura' => $nroFactura];
        });

        $this->logActivity(
            'Póliza Emitida',
            "Póliza {$result['nro_contrato']} emitida para cotización #{$solicitud->id}",
            'poliza',
            auth()->id()
        );

        // Correos — se despachan en cola para no bloquear el request
        $polizaEmitida = Poliza::with(['solicitud.persona', 'producto'])
            ->where('nro_contrato', $result['nro_contrato'])->first();
        $facturaEmitida = Factura::with('poliza')
            ->where('numero', $result['nro_factura'])->first();
        $correo = $solicitud->persona?->correo;

        if ($correo && $polizaEmitida) {
            try {
                Mail::to($correo)->queue(new PolizaEmitidaMail($polizaEmitida));
                EmailLog::registrar('poliza_emitida', $correo, 'Póliza emitida ' . $result['nro_contrato'],
                    $solicitud->persona?->id, $polizaEmitida->id);
            } catch (\Throwable) {}
        }
        if ($correo && $facturaEmitida) {
            try {
                Mail::to($correo)->queue(new FacturaMail($facturaEmitida, $solicitud->persona?->nombre ?? ''));
                EmailLog::registrar('factura', $correo, 'Factura ' . $result['nro_factura'],
                    $solicitud->persona?->id, $polizaEmitida?->id);
            } catch (\Throwable) {}
        }

        return response()->json([
            'message'      => 'Póliza y factura generadas correctamente',
            'nro_contrato' => $result['nro_contrato'],
            'nro_factura'  => $result['nro_factura'],
        ], 201);
    }

    /**
     * Elimina una cotización (solo si no tiene pólizas emitidas).
     */
    public function destroy($id)
    {
        $solicitud = Solicitud::with('polizas')->findOrFail($id);

        if ($solicitud->polizas->isNotEmpty()) {
            return response()->json(
                ['error' => 'No se puede eliminar una cotización con pólizas emitidas.'],
                409
            );
        }

        $solicitud->delete();

        return response()->json(['message' => 'Cotización eliminada correctamente']);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private function formatRow(Solicitud $s): array
    {
        $cobs     = is_array($s->coberturas) ? $s->coberturas : [];
        $total    = (float) $s->total;
        $totalBs  = (float) $s->total_bs;
        $tasaBcv  = $cobs['tasaBCV'] ?? null;

        $nombre = $s->nombre_tomador ?? $s->persona?->nombre ?? '—';
        $ci     = $s->ci_tomador     ?? $s->persona?->cedula  ?? '—';

        // Número de cotización: COT-YYYY-XXXXX
        $nro = 'COT-' . $s->fecha_solicitud?->format('Y') . '-' . str_pad($s->id, 5, '0', STR_PAD_LEFT);

        return [
            'id'                => $s->id,
            'nro'               => $nro,
            'persona_id'        => $s->persona_id,
            'nombre'            => $nombre,
            'ci'                => $ci,
            'bien_asegurado_id' => $s->bien_asegurado_id,
            'bien_tipo'         => $s->bien?->tipo,
            'bien_atributos'    => $s->bien?->atributos,
            'producto_id'       => $s->producto_id,
            'producto'          => $s->producto?->nombre ?? '—',
            'tarifario_id'      => $s->tarifario_id,
            'total'             => $total,
            'total_bs'          => $totalBs,
            'tasa_bcv'          => $tasaBcv,
            'fuente'            => $s->fuente ?? 'interno',
            'status'            => $s->status ?? 'en_revision',
            'fecha'             => $s->fecha_solicitud?->format('d/m/Y') ?? '—',
            'coberturas'        => $cobs,
            'asegurado_nombre'  => $s->asegurado_nombre,
            'asegurado_ci'      => $s->asegurado_ci,
        ];
    }
}
