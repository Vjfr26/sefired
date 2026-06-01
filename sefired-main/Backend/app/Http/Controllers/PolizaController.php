<?php

namespace App\Http\Controllers;

use App\Mail\CambioPolizaMail;
use App\Mail\PolizaRenovadaMail;
use App\Models\EmailLog;
use App\Models\Poliza;
use App\Models\Factura;
use App\Models\Solicitud;
use App\Models\IndicadorEconomico;
use App\Services\WorkflowService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class PolizaController extends Controller
{
    /**
     * Actualiza campos editables de una póliza existente.
     * Solo se modifican los campos enviados (PATCH semántico con PUT).
     *
     * Restricción: no se puede activar una póliza si el vehículo ya tiene
     * otra póliza ACTIVA — un vehículo solo puede tener una cobertura vigente.
     *
     * Campos ajustables: status, fecha_vencimiento, fecha_emision, pago,
     * total, total_bs, cobertura_dolares, cobertura_bs.
     */
    public function update(Request $request, $id)
    {
        $poliza = Poliza::with('solicitud')->findOrFail($id);

        if (in_array($poliza->status, ['ANULADA', 'RENOVADA'])) {
            return response()->json(['error' => "Una póliza {$poliza->status} no puede ser modificada."], 409);
        }

        $data = $request->validate([
            'status'            => 'sometimes|in:ACTIVA,VENCIDA,ANULADA,SUSPENDIDA,RENOVADA',
            'fecha_vencimiento' => 'sometimes|date',
            'fecha_emision'     => 'sometimes|date',
            'pago'              => 'sometimes|string|max:30',
            'total'             => 'sometimes|numeric|min:0',
            'total_bs'          => 'sometimes|numeric|min:0',
            'cobertura_dolares' => 'sometimes|numeric|min:0',
            'cobertura_bs'      => 'sometimes|numeric|min:0',
        ]);

        // Validar transición de estado
        if (isset($data['status']) && $data['status'] !== $poliza->status) {
            WorkflowService::assertPoliza($poliza->status, $data['status']);
        }

        // Si se intenta activar, verificar que el bien no tenga ya otra póliza activa
        if (isset($data['status']) && $data['status'] === 'ACTIVA' && $poliza->status !== 'ACTIVA') {
            $bienId = $poliza->solicitud?->bien_asegurado_id;

            if ($bienId) {
                $conflicto = Poliza::whereHas('solicitud', fn($q) => $q->where('bien_asegurado_id', $bienId))
                    ->where('status', 'ACTIVA')
                    ->where('id', '!=', $poliza->id)
                    ->exists();

                if ($conflicto) {
                    return response()->json([
                        'error' => 'Este bien ya tiene una póliza ACTIVA. Anule o venza la anterior antes de activar esta.',
                    ], 409);
                }
            }
        }

        // Registrar qué cambió para el correo
        $etiquetas = [
            'status'            => 'Estado',
            'fecha_vencimiento' => 'Fecha de vencimiento',
            'fecha_emision'     => 'Fecha de emisión',
            'pago'              => 'Forma de pago',
            'total'             => 'Prima (USD)',
            'total_bs'          => 'Prima (Bs.)',
            'cobertura_dolares' => 'Cobertura (USD)',
            'cobertura_bs'      => 'Cobertura (Bs.)',
        ];
        $cambios = [];
        foreach ($data as $campo => $nuevo) {
            $anterior = $poliza->getAttribute($campo);
            if ((string) $anterior !== (string) $nuevo) {
                $cambios[$etiquetas[$campo] ?? $campo] = [
                    'anterior' => (string) ($anterior ?? ''),
                    'nuevo'    => (string) ($nuevo ?? ''),
                ];
            }
        }

        $poliza->update($data);

        // Notificar al cliente si hubo cambios reales
        if (!empty($cambios)) {
            $correo = $poliza->solicitud?->persona?->correo;
            if ($correo) {
                try {
                    Mail::to($correo)->queue(new CambioPolizaMail(
                        $poliza->fresh(),
                        $cambios,
                        auth()->user()?->nombre ?? 'J&M Seguros',
                    ));
                    EmailLog::registrar('cambio_poliza', $correo, 'Póliza ajustada ' . $poliza->nro_contrato, $poliza->solicitud?->persona_id);
                } catch (\Throwable) {}
            }
        }

        return response()->json(['message' => 'Póliza actualizada correctamente']);
    }

    /**
     * Genera el PDF de la póliza.
     * La URL del QR se configura con POLIZA_QR_BASE_URL en el .env.
     */
    public function pdf($id)
    {
        $poliza = Poliza::with(['solicitud.bien', 'solicitud.persona', 'producto', 'vendedor'])->findOrFail($id);

        $snap  = $poliza->snapshot_datos ?? [];
        $attrs = $snap['bien']['atributos'] ?? $poliza->solicitud?->bien?->atributos ?? [];

        // Cédula: snapshot → columna poliza → persona relacionada → tomador de cotización
        $ci = $snap['asegurado']['ci']
            ?? $poliza->asegurado_ci
            ?? $poliza->solicitud?->persona?->cedula
            ?? $poliza->solicitud?->ci_tomador
            ?? '';

        // Placa: snapshot → bien relacionado
        $placa = strtoupper($attrs['placa'] ?? '');

        // El QR usa el número de contrato de J&M (POL-2026-XXXXX)
        // que es el mismo que se envía en el reporte a La Venezolana
        $baseUrl = rtrim(env('POLIZA_QR_BASE_URL', 'https://lavenezolanadeseguros.com.ve/qr.php'), '/');
        $qrUrl   = $baseUrl . '?poliza=' . urlencode($poliza->nro_contrato)
                            . '&cedula=' . urlencode($ci)
                            . '&placa='  . urlencode($placa);

        // app('qrcode') fuerza instancia fresca (bind, no singleton) evitando
        // el cache de la facade que puede contaminar el format entre requests.
        try {
            $qrSvg  = app('qrcode')->format('svg')->size(150)->errorCorrection('H')->generate($qrUrl);
            $qrCode = 'data:image/svg+xml;base64,' . base64_encode((string) $qrSvg);
        } catch (\Throwable $e) {
            $qrCode = null; // si falla, el blade lo omite
        }

        $pdf = Pdf::loadView('poliza-pdf', compact('poliza', 'qrCode'))
                  ->setPaper('letter', 'portrait');

        $filename = 'poliza-' . str_replace(['/', ' '], '-', $poliza->nro_contrato) . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Página pública de verificación de póliza (sin autenticación).
     * Usada como fallback local; la URL principal del QR apunta a La Venezolana.
     */
    public function verificar($nroContrato)
    {
        $poliza = Poliza::where('nro_contrato', $nroContrato)
                        ->whereNull('deleted_at')
                        ->first();

        if (!$poliza) {
            return response()->view('verificar-poliza', ['poliza' => null, 'encontrada' => false]);
        }

        $snap  = $poliza->snapshot_datos ?? [];
        $attrs = $snap['bien']['atributos'] ?? [];

        return response()->view('verificar-poliza', [
            'encontrada'        => true,
            'nro_contrato'      => $poliza->nro_contrato,
            'status'            => $poliza->status,
            'fecha_emision'     => $poliza->fecha_emision?->format('d/m/Y'),
            'fecha_vencimiento' => $poliza->fecha_vencimiento?->format('d/m/Y'),
            'asegurado_nombre'  => $snap['asegurado']['nombre'] ?? $poliza->asegurado_nombre ?? '—',
            'producto'          => $snap['producto']['nombre'] ?? '—',
            'placa'             => strtoupper($attrs['placa'] ?? '—'),
            'marca'             => $attrs['marca'] ?? '—',
            'modelo'            => $attrs['modelo'] ?? '—',
        ]);
    }

    /**
     * Renueva una póliza: marca la actual como VENCIDA y crea una nueva
     * póliza + factura con los mismos datos de cobertura por un año más.
     */
    public function renovar(Request $request, $id)
    {
        $polizaAnterior = Poliza::findOrFail($id);

        $data = $request->validate([
            'tasa_bcv'          => 'required|numeric|min:0.0001',
            'tasa_eur'          => 'nullable|numeric|min:0.0001',
            'frecuencia_pago'   => 'nullable|string|in:Mensual,Anual',
            'pagos'             => 'required|array|min:1',
            'pagos.*.forma'     => 'required|string|max:30',
            'pagos.*.moneda'    => 'required|string|in:USD,EUR,Bs.',
            'pagos.*.monto'     => 'required|numeric|min:0.01',
            'pagos.*.referencia'=> 'nullable|string|max:100',
        ]);

        $tasaBcv        = (float) $data['tasa_bcv'];
        $tasaEur        = isset($data['tasa_eur']) && $data['tasa_eur'] > 0 ? (float) $data['tasa_eur'] : $tasaBcv;
        $frecuencia     = $data['frecuencia_pago'] ?? 'Anual';
        $sede           = auth()->user()?->sede ?? 'Principal';
        $pagoResumen    = collect($data['pagos'])->map(fn($p) => $p['forma'] . ' ' . $p['moneda'])->join(' / ');
        $moneda         = $data['pagos'][0]['moneda'] ?? 'USD';
        $totalBsNuevo   = round((float) $polizaAnterior->total * $tasaBcv, 2);
        $coberturaBsNew = round((float) $polizaAnterior->cobertura_dolares * $tasaBcv, 2);

        // Validar total pagos = total póliza
        $totalPagado = collect($data['pagos'])->sum(function ($p) use ($tasaBcv, $tasaEur) {
            $m = (float) $p['monto'];
            return match ($p['moneda']) {
                'USD' => $m,
                'EUR' => $tasaEur > 0 ? $m * ($tasaEur / $tasaBcv) : $m,
                'Bs.' => $tasaBcv > 0 ? $m / $tasaBcv : 0,
                default => 0,
            };
        });

        if ((int) round($totalPagado * 100) !== (int) round((float) $polizaAnterior->total * 100)) {
            return response()->json([
                'error' => sprintf(
                    'El total de los pagos ($ %.2f USD) no coincide con el total de la póliza ($ %.2f USD).',
                    round($totalPagado, 2), $polizaAnterior->total
                ),
            ], 422);
        }

        $hoy  = now()->toDateString();
        $vence = now()->addYear()->toDateString();
        $anno  = now()->year;

        $result = DB::transaction(function () use ($polizaAnterior, $data, $hoy, $vence, $anno, $sede, $pagoResumen, $moneda, $frecuencia, $tasaBcv, $tasaEur, $totalBsNuevo, $coberturaBsNew) {
            $polizaAnterior->update(['status' => 'RENOVADA']);

            $nueva = Poliza::create([
                'nro_contrato'      => 'TMP-' . uniqid(),
                'solicitud_id'      => $polizaAnterior->solicitud_id,
                'producto_id'       => $polizaAnterior->producto_id,
                'total'             => $polizaAnterior->total,
                'total_bs'          => $totalBsNuevo,
                'tasa_emision'      => $tasaBcv,
                'tasa_emision_eur'  => $tasaEur,
                'cobertura_dolares' => $polizaAnterior->cobertura_dolares,
                'cobertura_bs'      => $coberturaBsNew,
                'pago'              => $pagoResumen,
                'frecuencia_pago'   => $frecuencia,
                'moneda'            => $moneda,
                'tipo'              => $polizaAnterior->tipo,
                'fecha_emision'     => $hoy,
                'fecha_vencimiento' => $vence,
                'sede_poliza'       => $sede,
                'vendedor_id'       => $polizaAnterior->vendedor_id ?? auth()->id(),
                'status'            => 'ACTIVA',
            ]);

            $nroContrato = 'POL-' . $anno . '-' . str_pad($nueva->id, 5, '0', STR_PAD_LEFT);
            $nroFactura  = 'FAC-' . $anno . '-' . str_pad($nueva->id, 5, '0', STR_PAD_LEFT);

            $nueva->update(['nro_contrato' => $nroContrato]);

            Factura::create([
                'numero'        => $nroFactura,
                'sede'          => $sede,
                'fecha_factura' => $hoy,
                'poliza_id'     => $nueva->id,
                'valor'         => $polizaAnterior->total,
                'valor_bs'      => $totalBsNuevo,
                'forma_pago'    => $pagoResumen,
                'moneda'        => $moneda,
                'referencia'    => $data['pagos'][0]['referencia'] ?? null,
                'usuario_id'    => auth()->id(),
            ]);

            return ['nro_contrato' => $nroContrato, 'nro_factura' => $nroFactura];
        });

        // Notificar al cliente que su póliza fue renovada
        $correo = $polizaAnterior->solicitud?->persona?->correo;
        if ($correo) {
            try {
                $nuevaPoliza = Poliza::with(['solicitud.persona', 'producto'])->find(
                    Poliza::where('nro_contrato', $result['nro_contrato'])->value('id')
                );
                if ($nuevaPoliza) {
                    Mail::to($correo)->queue(new PolizaRenovadaMail($nuevaPoliza, $polizaAnterior->fresh()));
                    EmailLog::registrar('poliza_renovada', $correo, 'Renovación ' . $result['nro_contrato'], $polizaAnterior->solicitud?->persona_id);
                }
            } catch (\Throwable) {}
        }

        return response()->json([
            'message'      => 'Póliza renovada correctamente',
            'nro_contrato' => $result['nro_contrato'],
            'nro_factura'  => $result['nro_factura'],
        ], 201);
    }
}
