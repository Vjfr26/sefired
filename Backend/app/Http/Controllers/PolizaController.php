<?php

namespace App\Http\Controllers;

use App\Mail\CambioPolizaMail;
use App\Mail\PolizaRenovadaMail;
use App\Models\EmailLog;
use App\Models\Poliza;
use App\Models\PolizaBien;
use App\Models\Factura;
use App\Models\Solicitud;
use App\Models\SolicitudRenovacionQr;
use App\Models\IndicadorEconomico;
use App\Models\Venta;
use App\Models\Beneficiario;
use App\Rules\NoInjectionChars;
use App\Services\WorkflowService;
use App\Traits\LogsActivity;
use App\Traits\ScopesVendedor;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class PolizaController extends Controller
{
    use ScopesVendedor, LogsActivity;

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
        $this->assertAccesoVendedorId($poliza->solicitud?->vendedor_id, 'No tienes acceso a esta póliza.');

        if (in_array($poliza->status, ['ANULADA', 'RENOVADA'])) {
            return response()->json(['error' => "Una póliza {$poliza->status} no puede ser modificada."], 409);
        }

        $noInjection = new NoInjectionChars();

        $data = $request->validate([
            'status'            => 'sometimes|in:ACTIVA,VENCIDA,ANULADA,SUSPENDIDA,RENOVADA',
            'fecha_vencimiento' => 'sometimes|date',
            'fecha_emision'     => 'sometimes|date',
            'pago'              => ['sometimes', 'string', 'max:30', $noInjection],
            'total'             => 'sometimes|numeric|min:0',
            'total_bs'          => 'sometimes|numeric|min:0',
            'cobertura_dolares' => 'sometimes|numeric|min:0',
            'cobertura_bs'      => 'sometimes|numeric|min:0',
            'nro_venezolana'    => ['nullable', 'string', 'max:20', $noInjection],
            'papeleria'         => ['nullable', 'string', 'max:80', $noInjection],
            'vendedor_id'       => 'sometimes|nullable|integer|exists:usuarios,id',
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

        // Registrar qué cambió para el correo. vendedor_id se excluye a propósito:
        // es una reasignación interna de cartera, no algo que deba notificarse al cliente.
        $etiquetas = [
            'status'            => 'Estado',
            'fecha_vencimiento' => 'Fecha de vencimiento',
            'fecha_emision'     => 'Fecha de emisión',
            'pago'              => 'Forma de pago',
            'total'             => 'Prima (USD)',
            'total_bs'          => 'Prima (Bs.)',
            'cobertura_dolares' => 'Cobertura (USD)',
            'cobertura_bs'      => 'Cobertura (Bs.)',
            'nro_venezolana'    => 'N° Póliza (La Venezolana)',
            'papeleria'         => 'Papelería',
        ];
        $cambios = [];
        foreach ($data as $campo => $nuevo) {
            if ($campo === 'vendedor_id') continue;
            $anterior = $poliza->getAttribute($campo);
            if ((string) $anterior !== (string) $nuevo) {
                $cambios[$etiquetas[$campo] ?? $campo] = [
                    'anterior' => (string) ($anterior ?? ''),
                    'nuevo'    => (string) ($nuevo ?? ''),
                ];
            }
        }

        // El vendedor reasignado sí se audita internamente, aunque no se le
        // notifique al cliente (es una reasignación de cartera, no un cambio
        // de cobertura/condiciones).
        if (array_key_exists('vendedor_id', $data) && (int) $poliza->vendedor_id !== (int) $data['vendedor_id']) {
            $cambios['Vendedor asignado'] = ['anterior' => (string) ($poliza->vendedor_id ?? ''), 'nuevo' => (string) ($data['vendedor_id'] ?? '')];
        }

        $poliza->update($data);

        if (!empty($cambios)) {
            $detalle = implode('; ', array_map(
                fn($campo, $c) => "{$campo}: '{$c['anterior']}' → '{$c['nuevo']}'",
                array_keys($cambios), $cambios
            ));
            $this->logActivity('Póliza Actualizada', "Póliza {$poliza->nro_contrato} — {$detalle}", 'poliza', auth()->id());
        }

        // Notificar al cliente si hubo cambios reales (vendedor_id se excluye arriba)
        unset($cambios['Vendedor asignado']);
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
     */
    public function pdf($id)
    {
        $poliza = Poliza::with(['solicitud.bien', 'solicitud.persona', 'producto', 'vendedor', 'bienes.bien', 'facturas'])->findOrFail($id);
        $this->assertAccesoVendedorId($poliza->solicitud?->vendedor_id, 'No tienes acceso a esta póliza.');

        $snap  = $poliza->snapshot_datos ?? [];
        $attrs = $snap['bien']['atributos'] ?? $poliza->solicitud?->bien?->atributos ?? [];
        // Bienes adicionales (más allá del original de la solicitud, que no
        // tiene certificado propio) — solo se muestra esta sección extra si
        // la póliza cubre más de un bien.
        $bienesAdicionales = $poliza->bienesAdicionales();
        $numeroRecibo      = $poliza->numeroRecibo();
        $esRenovacion      = $poliza->esRenovacion();

        $qrUrl = url('/ver/' . urlencode($poliza->nro_contrato));

        // app('qrcode') fuerza instancia fresca (bind, no singleton) evitando
        // el cache de la facade que puede contaminar el format entre requests.
        try {
            $qrSvg  = app('qrcode')->format('svg')->size(150)->errorCorrection('H')->generate($qrUrl);
            $qrCode = 'data:image/svg+xml;base64,' . base64_encode((string) $qrSvg);
        } catch (\Throwable $e) {
            $qrCode = null; // si falla, el blade lo omite
        }

        $pdf = Pdf::loadView('poliza-pdf', compact('poliza', 'qrCode', 'bienesAdicionales', 'numeroRecibo', 'esRenovacion'))
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
        $poliza = Poliza::with(['solicitud.bien', 'producto'])
                        ->where('nro_contrato', $nroContrato)
                        ->whereNull('deleted_at')
                        ->first();

        if (!$poliza) {
            return response()->view('verificar-poliza', ['poliza' => null, 'encontrada' => false]);
        }

        $snap  = $poliza->snapshot_datos ?? [];
        // Pólizas anteriores al snapshot enriquecido no tienen 'bien' dentro
        // de snapshot_datos — se cae a la relación en vivo, igual que en landing().
        $attrs = $snap['bien']['atributos'] ?? $poliza->solicitud?->bien?->atributos ?? [];

        return response()->view('verificar-poliza', [
            'encontrada'        => true,
            'nro_contrato'      => $poliza->nro_contrato,
            'status'            => $poliza->status,
            'fecha_emision'     => $poliza->fecha_emision?->format('d/m/Y'),
            'fecha_vencimiento' => $poliza->fecha_vencimiento?->format('d/m/Y'),
            'asegurado_nombre'  => $snap['asegurado']['nombre'] ?? $poliza->asegurado_nombre ?? '—',
            'producto'          => $snap['producto']['nombre'] ?? $poliza->producto?->nombre ?? '—',
            'placa'             => strtoupper($attrs['placa'] ?? '—'),
            'marca'             => $attrs['marca'] ?? '—',
            'modelo'            => $attrs['modelo'] ?? '—',
        ]);
    }

    /**
     * Landing pública del QR: muestra información completa de la póliza
     * con pestañas para visualizar, reimprimir y solicitar renovación.
     */
    public function landing($nroContrato)
    {
        $poliza = Poliza::with(['solicitud.bien', 'solicitud.persona', 'producto'])
                        ->where('nro_contrato', $nroContrato)
                        ->whereNull('deleted_at')
                        ->first();

        if (!$poliza) {
            return response()->view('poliza-landing', [
                'encontrada'   => false,
                'nro_contrato' => $nroContrato,
            ]);
        }

        $snap  = $poliza->snapshot_datos ?? [];
        $attrs = $snap['bien']['atributos'] ?? $poliza->solicitud?->bien?->atributos ?? [];

        // Tasas del día más recientes
        $tasaUsd = (float) (IndicadorEconomico::usd()->orderBy('fecha', 'desc')->value('valor') ?? 0);
        $tasaEur = (float) (IndicadorEconomico::eur()->orderBy('fecha', 'desc')->value('valor') ?? 0);
        $totalUsd = (float) ($poliza->total ?? 0);
        $totalBs  = $tasaUsd > 0 ? round($totalUsd * $tasaUsd, 2) : null;
        $totalEur = ($tasaEur > 0 && $tasaUsd > 0) ? round($totalUsd * $tasaUsd / $tasaEur, 2) : null;

        return response()->view('poliza-landing', [
            'encontrada'        => true,
            'nro_contrato'      => $poliza->nro_contrato,
            'status'            => $poliza->status,
            'fecha_emision'     => $poliza->fecha_emision?->format('d/m/Y'),
            'fecha_vencimiento' => $poliza->fecha_vencimiento?->format('d/m/Y'),
            'asegurado_nombre'  => $snap['asegurado']['nombre'] ?? $poliza->asegurado_nombre ?? '—',
            'asegurado_ci'      => $snap['asegurado']['ci'] ?? $poliza->asegurado_ci ?? '—',
            'producto'          => $snap['producto']['nombre'] ?? $poliza->producto?->nombre ?? '—',
            'placa'             => strtoupper($attrs['placa'] ?? '—'),
            'marca'             => strtoupper($attrs['marca'] ?? '—'),
            'modelo'            => strtoupper($attrs['modelo'] ?? '—'),
            'anio'              => $attrs['anio'] ?? '—',
            'color'             => strtoupper($attrs['color'] ?? '—'),
            'serial_carroceria' => strtoupper($attrs['serial_carroceria'] ?? $attrs['serialCarroceria'] ?? '—'),
            'serial_motor'      => strtoupper($attrs['serial_motor'] ?? $attrs['serialMotor'] ?? '—'),
            'total'             => $totalUsd,
            'total_bs'          => $totalBs,
            'total_eur'         => $totalEur,
            'tasa_usd'          => $tasaUsd,
            'tasa_eur'          => $tasaEur,
        ]);
    }

    /**
     * Descarga pública del PDF de la póliza (sin autenticación).
     */
    public function pdfPublico($nroContrato)
    {
        $poliza = Poliza::with(['solicitud.bien', 'solicitud.persona', 'producto', 'vendedor', 'bienes.bien', 'facturas'])
                        ->where('nro_contrato', $nroContrato)
                        ->whereNull('deleted_at')
                        ->firstOrFail();

        $bienesAdicionales = $poliza->bienesAdicionales();
        $numeroRecibo      = $poliza->numeroRecibo();
        $esRenovacion      = $poliza->esRenovacion();

        $qrUrl = url('/ver/' . urlencode($poliza->nro_contrato));

        try {
            $qrSvg  = app('qrcode')->format('svg')->size(150)->errorCorrection('H')->generate($qrUrl);
            $qrCode = 'data:image/svg+xml;base64,' . base64_encode((string) $qrSvg);
        } catch (\Throwable $e) {
            $qrCode = null;
        }

        $pdf = Pdf::loadView('poliza-pdf', compact('poliza', 'qrCode', 'bienesAdicionales', 'numeroRecibo', 'esRenovacion'))
                  ->setPaper('letter', 'portrait');

        $filename = 'poliza-' . str_replace(['/', ' '], '-', $poliza->nro_contrato) . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Recibe una solicitud pública de renovación desde la landing del QR.
     * Los datos personales se toman del snapshot de la póliza, no del formulario.
     * Acepta múltiples métodos de pago (pagos parciales en distintas monedas).
     */
    public function solicitarRenovacion(Request $request, $nroContrato)
    {
        $poliza = Poliza::where('nro_contrato', $nroContrato)
                        ->whereNull('deleted_at')
                        ->firstOrFail();

        $metodosPermitidos = [
            'Transferencia Bancaria', 'Pago Móvil', 'Zelle', 'Binance / Cripto',
        ];

        $data = $request->validate([
            'pagos'                => 'required|array|min:1|max:5',
            'pagos.*.metodo'       => 'required|string|in:' . implode(',', $metodosPermitidos),
            'pagos.*.banco'        => 'nullable|string|max:80|regex:/^[\w\s\-\.áéíóúÁÉÍÓÚñÑ]+$/u',
            'pagos.*.referencia'   => ['required', 'string', 'max:100', 'regex:/^[\w\s\-\/]+$/'],
            'pagos.*.monto'        => 'required|numeric|min:0.01|max:9999999',
            'pagos.*.moneda'       => 'required|string|in:USD,EUR,Bs.',
        ]);

        // Sanitizar cada referencia (quitar caracteres que no sean alfanuméricos, guión, barra, espacio)
        $pagosLimpios = collect($data['pagos'])->map(fn($p) => [
            'metodo'     => $p['metodo'],
            'banco'      => isset($p['banco']) ? strip_tags(trim($p['banco'])) : null,
            'referencia' => preg_replace('/[^\w\s\-\/]/', '', trim($p['referencia'])),
            'monto'      => round((float) $p['monto'], 2),
            'moneda'     => $p['moneda'],
        ])->values()->all();

        // Datos personales desde el snapshot de la póliza — no del cliente
        $snap     = $poliza->snapshot_datos ?? [];
        $persona  = $poliza->solicitud?->persona;
        $nombre   = $snap['asegurado']['nombre'] ?? $poliza->asegurado_nombre ?? $persona?->nombre ?? null;
        $telefono = $snap['tomador']['telefono'] ?? $persona?->celular ?? $persona?->telefono ?? null;
        $correo   = $persona?->correo ?? null;

        SolicitudRenovacionQr::create([
            'poliza_id'           => $poliza->id,
            'nro_contrato'        => $poliza->nro_contrato,
            'nombre'              => $nombre,
            'telefono'            => $telefono,
            'correo'              => $correo,
            'pagos'               => $pagosLimpios,
            'total_usd_estimado'  => null, // El asesor verifica el monto real
            'status'              => 'PENDIENTE',
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Renueva una póliza: marca la actual como VENCIDA y crea una nueva
     * póliza + factura con los mismos datos de cobertura por un año más.
     */
    public function renovar(Request $request, $id)
    {
        $polizaAnterior = Poliza::with('solicitud')->findOrFail($id);
        $this->assertAccesoVendedorId($polizaAnterior->solicitud?->vendedor_id, 'No tienes acceso a esta póliza.');

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

            // Los bienes cubiertos pasan a la póliza renovada. El certificado
            // de los bienes adicionales se renumera con el nuevo nro_contrato;
            // el bien original (certificado NULL) se mantiene NULL.
            foreach ($polizaAnterior->bienes as $pb) {
                $nuevoCertificado = null;
                if ($pb->certificado && preg_match('/-(\d+)$/', $pb->certificado, $m)) {
                    $nuevoCertificado = $nroContrato . '-' . $m[1];
                }
                PolizaBien::create([
                    'poliza_id'         => $nueva->id,
                    'bien_asegurado_id' => $pb->bien_asegurado_id,
                    'certificado'       => $nuevoCertificado,
                    'cobertura_dolares' => $pb->cobertura_dolares,
                    'cobertura_bs'      => $pb->cobertura_bs,
                    'created_by'        => auth()->id(),
                ]);
            }

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

            Venta::create([
                'usuario_id'  => $nueva->vendedor_id,
                'producto_id' => $nueva->producto_id,
                'fecha_venta' => $hoy,
            ]);

            return ['nro_contrato' => $nroContrato, 'nro_factura' => $nroFactura];
        });

        $this->logActivity(
            'Póliza Renovada',
            "Póliza {$polizaAnterior->nro_contrato} renovada → {$result['nro_contrato']} (factura {$result['nro_factura']})",
            'poliza',
            auth()->id()
        );

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

    // ── Bienes cubiertos (póliza con varios bienes, ej. flota de vehículos) ───

    /**
     * Lista los bienes cubiertos por esta póliza. El bien original (el de
     * la solicitud que emitió la póliza) siempre aparece primero con
     * certificado=NULL — los agregados después tienen su propio certificado.
     */
    public function bienesPoliza($id)
    {
        $poliza = Poliza::with('solicitud', 'producto')->findOrFail($id);
        $this->assertAccesoVendedorId($poliza->solicitud?->vendedor_id, 'No tienes acceso a esta póliza.');

        $bienes   = $poliza->bienes()->with('bien')->orderBy('certificado')->get()->map(fn($pb) => $this->formatPolizaBien($pb, $poliza));
        $producto = $poliza->producto;

        return response()->json([
            'items'  => $bienes,
            'config' => [
                'permite_multiples_bienes' => (bool) $producto?->permite_multiples_bienes,
                'max_bienes'               => $producto?->max_bienes,
            ],
        ]);
    }

    /**
     * Agrega un bien adicional a una póliza ya emitida — ej. una póliza que
     * admite hasta 5 vehículos pero al solicitarla solo se registró 1 o 2.
     * El bien debe pertenecer al mismo tomador que la póliza.
     */
    public function agregarBienPoliza(Request $request, $id)
    {
        $poliza = Poliza::with('solicitud', 'producto')->findOrFail($id);
        $this->assertAccesoVendedorId($poliza->solicitud?->vendedor_id, 'No tienes acceso a esta póliza.');

        $data = $request->validate([
            'bien_asegurado_id' => 'required|integer|exists:bien_asegurado,id',
            'cobertura_dolares' => 'nullable|numeric|min:0',
            'cobertura_bs'      => 'nullable|numeric|min:0',
        ]);

        $bien = \App\Models\BienAsegurado::findOrFail($data['bien_asegurado_id']);
        if ($bien->persona_id !== $poliza->solicitud?->persona_id) {
            return response()->json(['error' => 'El bien debe pertenecer al mismo cliente de esta póliza.'], 422);
        }

        if ($poliza->bienes()->where('bien_asegurado_id', $bien->id)->exists()) {
            return response()->json(['error' => 'Este bien ya está cubierto por esta póliza.'], 409);
        }

        // El tipo de póliza (producto) define si admite más de un bien y, si
        // aplica, hasta cuántos — sin esto, cualquier póliza podía acumular
        // bienes sin límite aunque su tipo no estuviera pensado para eso.
        $producto      = $poliza->producto;
        $bienesActuales = $poliza->bienes()->count();
        if ($bienesActuales >= 1 && !$producto?->permite_multiples_bienes) {
            return response()->json(['error' => "El tipo de póliza \"{$producto?->nombre}\" no admite más de un bien cubierto."], 422);
        }
        if ($producto?->max_bienes && $bienesActuales >= $producto->max_bienes) {
            return response()->json(['error' => "Esta póliza ya alcanzó el máximo de {$producto->max_bienes} bienes cubiertos para el tipo \"{$producto->nombre}\"."], 422);
        }

        $siguiente    = $poliza->bienes()->count() + 1;
        $certificado  = $poliza->nro_contrato . '-' . str_pad($siguiente, 2, '0', STR_PAD_LEFT);

        $polizaBien = PolizaBien::create([
            'poliza_id'         => $poliza->id,
            'bien_asegurado_id' => $bien->id,
            'certificado'       => $certificado,
            'cobertura_dolares' => $data['cobertura_dolares'] ?? null,
            'cobertura_bs'      => $data['cobertura_bs'] ?? null,
            'created_by'        => auth()->id(),
        ]);

        $this->logActivity(
            'Bien Agregado a Póliza',
            "Póliza {$poliza->nro_contrato} — bien #{$bien->id} agregado con certificado {$certificado}",
            'poliza',
            auth()->id()
        );

        return response()->json($this->formatPolizaBien($polizaBien->load('bien'), $poliza), 201);
    }

    /** Quita un bien de una póliza (ej. se registró por error, o el bien se vendió). */
    public function quitarBienPoliza($id, $polizaBienId)
    {
        $poliza = Poliza::with('solicitud')->findOrFail($id);
        $this->assertAccesoVendedorId($poliza->solicitud?->vendedor_id, 'No tienes acceso a esta póliza.');

        $polizaBien = $poliza->bienes()->findOrFail($polizaBienId);
        $bienId = $polizaBien->bien_asegurado_id;
        $polizaBien->delete();

        $this->logActivity('Bien Quitado de Póliza', "Póliza {$poliza->nro_contrato} — bien #{$bienId} quitado", 'poliza', auth()->id());

        return response()->json(null, 204);
    }

    private function formatPolizaBien(PolizaBien $pb, Poliza $poliza): array
    {
        $attr = $pb->bien?->atributos ?? [];
        return [
            'id'                => $pb->id,
            'bien_asegurado_id' => $pb->bien_asegurado_id,
            'tipo'              => $pb->bien?->tipo ?? '—',
            'referencia'        => $attr['placa'] ?? $attr['descripcion'] ?? $pb->bien?->descripcion ?? '—',
            'certificado'       => $pb->certificado ?? $poliza->nro_contrato,
            'es_original'       => $pb->certificado === null,
            'cobertura_dolares' => $pb->cobertura_dolares !== null ? (float) $pb->cobertura_dolares : null,
            'cobertura_bs'      => $pb->cobertura_bs !== null ? (float) $pb->cobertura_bs : null,
        ];
    }

    // ── Beneficiarios ────────────────────────────────────────────────────────

    /** Lista los beneficiarios registrados para una póliza. */
    public function beneficiarios($id)
    {
        $poliza = Poliza::with('solicitud', 'producto')->findOrFail($id);
        $this->assertAccesoVendedorId($poliza->solicitud?->vendedor_id, 'No tienes acceso a esta póliza.');

        $producto = $poliza->producto;

        return response()->json([
            'items'  => $poliza->beneficiarios()->orderBy('id')->get(),
            'config' => [
                'aplica_beneficiarios' => (bool) $producto?->aplica_beneficiarios,
                'min_beneficiarios'    => $producto?->min_beneficiarios,
                'max_beneficiarios'    => $producto?->max_beneficiarios,
            ],
        ]);
    }

    /** Agrega un beneficiario a la póliza. */
    public function agregarBeneficiario(Request $request, $id)
    {
        $poliza = Poliza::with('solicitud', 'producto')->findOrFail($id);
        $this->assertAccesoVendedorId($poliza->solicitud?->vendedor_id, 'No tienes acceso a esta póliza.');

        $producto = $poliza->producto;
        if (!$producto?->aplica_beneficiarios) {
            return response()->json(['error' => "El tipo de póliza \"{$producto?->nombre}\" no admite beneficiarios."], 422);
        }
        if ($producto->max_beneficiarios && $poliza->beneficiarios()->count() >= $producto->max_beneficiarios) {
            return response()->json(['error' => "Esta póliza ya alcanzó el máximo de {$producto->max_beneficiarios} beneficiarios para el tipo \"{$producto->nombre}\"."], 422);
        }

        $noInjection = new NoInjectionChars();
        $data = $request->validate([
            'nombre'     => ['required', 'string', 'max:120', $noInjection],
            'cedula'     => ['nullable', 'string', 'max:20', $noInjection],
            'parentesco' => ['nullable', 'string', 'max:50', $noInjection],
            'porcentaje' => 'required|numeric|min:0.01|max:100',
        ]);

        $totalActual = (float) $poliza->beneficiarios()->sum('porcentaje');
        if ($totalActual + (float) $data['porcentaje'] > 100) {
            return response()->json([
                'error' => sprintf(
                    'El porcentaje excede el 100%% — ya hay %.2f%% asignado, disponible %.2f%%.',
                    $totalActual, 100 - $totalActual
                ),
            ], 422);
        }

        $beneficiario = $poliza->beneficiarios()->create($data);

        $this->logActivity(
            'Beneficiario Agregado',
            "Póliza {$poliza->nro_contrato} — {$beneficiario->nombre} ({$beneficiario->porcentaje}%)",
            'beneficiario',
            auth()->id()
        );

        return response()->json($beneficiario, 201);
    }

    /** Actualiza un beneficiario existente. */
    public function actualizarBeneficiario(Request $request, $id, $benId)
    {
        $poliza = Poliza::with('solicitud')->findOrFail($id);
        $this->assertAccesoVendedorId($poliza->solicitud?->vendedor_id, 'No tienes acceso a esta póliza.');

        $beneficiario = $poliza->beneficiarios()->findOrFail($benId);

        $noInjection = new NoInjectionChars();
        $data = $request->validate([
            'nombre'     => ['sometimes', 'string', 'max:120', $noInjection],
            'cedula'     => ['nullable', 'string', 'max:20', $noInjection],
            'parentesco' => ['nullable', 'string', 'max:50', $noInjection],
            'porcentaje' => 'sometimes|numeric|min:0.01|max:100',
        ]);

        if (isset($data['porcentaje'])) {
            $totalOtros = (float) $poliza->beneficiarios()->where('id', '!=', $benId)->sum('porcentaje');
            if ($totalOtros + (float) $data['porcentaje'] > 100) {
                return response()->json([
                    'error' => sprintf(
                        'El porcentaje excede el 100%% — los demás beneficiarios ya suman %.2f%%.',
                        $totalOtros
                    ),
                ], 422);
            }
        }

        $beneficiario->update($data);

        $this->logActivity('Beneficiario Actualizado', "Póliza {$poliza->nro_contrato} — {$beneficiario->nombre}", 'beneficiario', auth()->id());

        return response()->json($beneficiario);
    }

    /** Elimina un beneficiario de la póliza. */
    public function eliminarBeneficiario($id, $benId)
    {
        $poliza = Poliza::with('solicitud')->findOrFail($id);
        $this->assertAccesoVendedorId($poliza->solicitud?->vendedor_id, 'No tienes acceso a esta póliza.');

        $beneficiario = $poliza->beneficiarios()->findOrFail($benId);
        $nombre = $beneficiario->nombre;
        $beneficiario->delete();

        $this->logActivity('Beneficiario Eliminado', "Póliza {$poliza->nro_contrato} — {$nombre}", 'beneficiario', auth()->id());

        return response()->json(null, 204);
    }
}
