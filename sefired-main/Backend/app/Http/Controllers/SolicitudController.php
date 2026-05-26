<?php

namespace App\Http\Controllers;

use App\Models\Solicitud;
use App\Models\Cliente;
use App\Models\Poliza;
use App\Models\Factura;
use App\Services\WorkflowService;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
        $solicitudes = Solicitud::with(['cliente.persona', 'producto'])
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
        $data = $request->validate([
            'cliente_id'       => 'required|integer|exists:cliente,id',
            'placa'            => 'nullable|string|max:20',
            'producto_id'      => 'nullable|integer|exists:producto,id',
            'tarifario_id'     => 'nullable|integer|exists:tarifario,id',
            'total'            => 'required|numeric|min:0',
            'total_bs'         => 'required|numeric|min:0',
            'fecha_solicitud'  => 'required|date',
            'coberturas'       => 'required|array',
            'nombre_tomador'   => 'nullable|string|max:120',
            'ci_tomador'       => 'nullable|string|max:20',
            'asegurado_nombre' => 'nullable|string|max:120',
            'asegurado_ci'     => 'nullable|string|max:20',
        ]);

        $data['vendedor_id'] = auth()->id();
        $data['status']      = 'En Revisión';

        $solicitud = Solicitud::create($data);

        $ref = $solicitud->placa ?? $solicitud->asegurado_nombre ?? "cliente #{$solicitud->cliente_id}";
        $this->logActivity(
            'Cotización Creada',
            "Cotización #{$solicitud->id} — {$ref}",
            'solicitud',
            auth()->id()
        );

        return response()->json($this->formatRow($solicitud->load(['cliente.persona', 'producto'])), 201);
    }

    /**
     * Actualiza una cotización. Permite cambiar el estado o editar todos los campos
     * del simulador si la cotización aún no ha sido emitida.
     */
    public function update(Request $request, $id)
    {
        $solicitud = Solicitud::findOrFail($id);

        if ($solicitud->status === 'Emitida') {
            return response()->json(['error' => 'No se puede editar una cotización ya emitida.'], 409);
        }

        $data = $request->validate([
            'status'           => 'sometimes|in:En Revisión,Aprobado,Rechazado',
            'cliente_id'       => 'sometimes|integer|exists:cliente,id',
            'placa'            => 'nullable|string|max:20',
            'producto_id'      => 'nullable|integer|exists:producto,id',
            'tarifario_id'     => 'nullable|integer|exists:tarifario,id',
            'total'            => 'sometimes|numeric|min:0',
            'total_bs'         => 'sometimes|numeric|min:0',
            'fecha_solicitud'  => 'sometimes|date',
            'coberturas'       => 'sometimes|array',
            'nombre_tomador'   => 'nullable|string|max:120',
            'ci_tomador'       => 'nullable|string|max:20',
            'asegurado_nombre' => 'nullable|string|max:120',
            'asegurado_ci'     => 'nullable|string|max:20',
        ]);

        // Validar transición de estado antes de persistir
        if (isset($data['status'])) {
            WorkflowService::assertSolicitud($solicitud->status, $data['status']);
        }

        $solicitud->update($data);

        $logMsg = isset($data['status'])
            ? "Cotización #{$id} → {$data['status']}"
            : "Cotización #{$id} actualizada";

        $this->logActivity('Cotización Actualizada', $logMsg, 'solicitud', auth()->id());

        return response()->json(['message' => 'Cotización actualizada correctamente']);
    }

    /**
     * Emite una cotización: crea la Póliza y la Factura de forma automática.
     *
     * Solo puede emitirse si el status es 'Aprobado' o 'En Revisión'.
     * El nro_contrato y número de factura se auto-generan a partir del ID de póliza.
     *
     * Campos requeridos: pago, sede. Opcional: referencia.
     */
    public function emitir(Request $request, $id)
    {
        $solicitud = Solicitud::findOrFail($id);

        if ($solicitud->status === 'Emitida') {
            return response()->json(['error' => 'Esta cotización ya fue emitida.'], 409);
        }

        $data = $request->validate([
            'pago'       => 'required|string|max:30',
            'referencia' => 'nullable|string|max:50',
            'sede'       => 'required|string|max:20',
        ]);

        $solicitud->load(['cliente.persona', 'producto', 'tarifario']);

        $cobs    = is_array($solicitud->coberturas) ? $solicitud->coberturas : [];
        $hoy     = now()->toDateString();
        $venc    = now()->addYear()->toDateString();
        $anno    = now()->year;
        $tasaBcv = (float) ($cobs['tasaBCV'] ?? 1);

        // cobertura_dolares: para productos por_valor (RCV) es el valor de mercado del vehículo;
        // para los demás tipos (fijo, por_plan, por_nivel) es la suma asegurada del producto.
        $tipoCal          = $solicitud->producto?->tipo_calculo;
        $coberturaDolares = ($tipoCal === 'por_valor')
            ? (float) ($cobs['valor_mercado'] ?? 0)
            : (float) ($solicitud->producto?->cobertura ?? 0);
        $coberturaBS = $coberturaDolares * $tasaBcv;

        // Asegurado: si se indicó una persona diferente al tomador, se usa esa; si no, el tomador mismo.
        $aseguradoNombre = $solicitud->asegurado_nombre ?? $solicitud->nombre_tomador ?? null;
        $aseguradoCi     = $solicitud->asegurado_ci     ?? $solicitud->ci_tomador     ?? null;

        // Snapshot inmutable: datos tal como existían al momento de emisión.
        $snapshot = [
            'tomador' => [
                'nombre' => $solicitud->nombre_tomador ?? $solicitud->cliente?->persona?->nombre,
                'ci'     => $solicitud->ci_tomador     ?? $solicitud->cliente?->persona?->cedula,
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
            'tasa_bcv'         => $tasaBcv,
            'placa'            => $solicitud->placa,
            'fecha_emision'    => $hoy,
            'total_usd'        => (float) $solicitud->total,
            'total_bs'         => (float) $solicitud->total_bs,
        ];

        $result = DB::transaction(function () use ($solicitud, $data, $hoy, $venc, $anno, $coberturaDolares, $coberturaBS, $aseguradoNombre, $aseguradoCi, $snapshot) {
            $poliza = Poliza::create([
                'nro_contrato'         => 'TMP-' . uniqid(),
                'solicitud_id'         => $solicitud->id,
                'producto_id'          => $solicitud->producto_id ?? null,
                'total'                => $solicitud->total,
                'total_bs'             => $solicitud->total_bs,
                'cobertura_dolares'    => $coberturaDolares,
                'cobertura_bs'         => $coberturaBS,
                'asegurado_nombre'     => $aseguradoNombre,
                'asegurado_ci'         => $aseguradoCi,
                'pago'                 => $data['pago'],
                'tipo'                 => 'Individual',
                'fecha_emision'        => $hoy,
                'fecha_vencimiento'    => $venc,
                'sede_poliza'          => $data['sede'],
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
                'sede'          => $data['sede'],
                'fecha_factura' => $hoy,
                'poliza_id'     => $poliza->id,
                'valor'         => $solicitud->total,
                'valor_bs'      => $solicitud->total_bs,
                'forma_pago'    => $data['pago'],
                'referencia'    => $data['referencia'] ?? null,
                'usuario_id'    => auth()->id(),
            ]);

            $solicitud->update(['status' => 'Emitida']);

            return ['nro_contrato' => $nroContrato, 'nro_factura' => $nroFactura];
        });

        $this->logActivity(
            'Póliza Emitida',
            "Póliza {$result['nro_contrato']} emitida para cotización #{$solicitud->id}",
            'poliza',
            auth()->id()
        );

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

        $nombre = $s->nombre_tomador ?? $s->cliente?->persona?->nombre ?? '—';
        $ci     = $s->ci_tomador     ?? $s->cliente?->persona?->cedula  ?? '—';

        // Número de cotización: COT-YYYY-XXXXX
        $nro = 'COT-' . $s->fecha_solicitud?->format('Y') . '-' . str_pad($s->id, 5, '0', STR_PAD_LEFT);

        return [
            'id'               => $s->id,
            'nro'              => $nro,
            'cliente_id'       => $s->cliente_id,
            'nombre'           => $nombre,
            'ci'               => $ci,
            'placa'            => $s->placa ?? '—',
            'producto_id'      => $s->producto_id,
            'producto'         => $s->producto?->nombre ?? '—',
            'tarifario_id'     => $s->tarifario_id,
            'total'            => $total,
            'total_bs'         => $totalBs,
            'tasa_bcv'         => $tasaBcv,
            'status'           => $s->status ?? 'En Revisión',
            'fecha'            => $s->fecha_solicitud?->format('d/m/Y') ?? '—',
            'coberturas'       => $cobs,
            'asegurado_nombre' => $s->asegurado_nombre,
            'asegurado_ci'     => $s->asegurado_ci,
        ];
    }
}
