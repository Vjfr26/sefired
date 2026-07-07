<?php

namespace App\Http\Controllers;

use App\Mail\CambioPolizaMail;
use App\Mail\PolizaRenovadaMail;
use App\Models\Comision;
use App\Mail\FacturaMail;
use App\Models\Cuota;
use App\Models\EmailLog;
use App\Models\Poliza;
use App\Models\PolizaBien;
use App\Models\Factura;
use App\Models\Solicitud;
use App\Models\SolicitudRenovacionQr;
use App\Models\IndicadorEconomico;
use App\Models\Venta;
use App\Models\Beneficiario;
use App\Rules\CedulaValida;
use App\Rules\NoInjectionChars;
use App\Services\WorkflowService;
use App\Support\CodigoPoliza;
use App\Support\EnvioDocumentosProducto;
use App\Support\Mensualidades;
use App\Support\Documento;
use App\Support\Moneda;
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
            'pago'              => ['sometimes', 'string', 'max:255', $noInjection],
            'total'             => 'sometimes|numeric|min:0',
            'total_bs'          => 'sometimes|numeric|min:0',
            'cobertura_dolares' => 'sometimes|numeric|min:0',
            'cobertura_bs'      => 'sometimes|numeric|min:0',
            'nro_venezolana'    => ['nullable', 'string', 'max:20', $noInjection],
            'papeleria'         => ['nullable', 'string', 'max:80', $noInjection],
            'vendedor_id'       => 'sometimes|nullable|integer|exists:usuarios,id',
            // Columnas adicionales del PDF
            'tipo'              => ['sometimes', 'nullable', 'string', 'max:40', $noInjection],
            'sede_poliza'       => ['sometimes', 'nullable', 'string', 'max:60', $noInjection],
            'frecuencia_pago'   => ['sometimes', 'nullable', 'string', 'max:20', $noInjection],
            'asegurado_nombre'  => ['sometimes', 'nullable', 'string', 'max:120', $noInjection],
            'asegurado_ci'      => ['sometimes', 'nullable', 'string', 'max:20', $noInjection],
            // Datos del PDF que viven en snapshot_datos (no son columnas)
            'asegurado_direccion' => ['sometimes', 'nullable', 'string', 'max:255', $noInjection],
            'asegurado_telefono'  => ['sometimes', 'nullable', 'string', 'max:30', $noInjection],
            'tomador_nombre'    => ['sometimes', 'nullable', 'string', 'max:120', $noInjection],
            'tomador_ci'        => ['sometimes', 'nullable', 'string', 'max:20', $noInjection],
            'tomador_direccion' => ['sometimes', 'nullable', 'string', 'max:255', $noInjection],
            'tomador_telefono'  => ['sometimes', 'nullable', 'string', 'max:30', $noInjection],
            'bien_marca'        => ['sometimes', 'nullable', 'string', 'max:40', $noInjection],
            'bien_modelo'       => ['sometimes', 'nullable', 'string', 'max:40', $noInjection],
            'bien_anio'         => ['sometimes', 'nullable', 'string', 'max:8', $noInjection],
            'bien_placa'        => ['sometimes', 'nullable', 'string', 'max:15', $noInjection],
            'bien_color'        => ['sometimes', 'nullable', 'string', 'max:30', $noInjection],
            'bien_version'      => ['sometimes', 'nullable', 'string', 'max:40', $noInjection],
            'bien_puestos'      => ['sometimes', 'nullable', 'string', 'max:5', $noInjection],
            'bien_uso'               => ['sometimes', 'nullable', 'string', 'max:40', $noInjection],
            'bien_serial_carroceria' => ['sometimes', 'nullable', 'string', 'max:30', $noInjection],
            'bien_serial_motor'      => ['sometimes', 'nullable', 'string', 'max:30', $noInjection],
        ]);

        // Coherencia de fechas: el vencimiento debe ser posterior a la emisión.
        $emisionFinal = $data['fecha_emision']     ?? $poliza->fecha_emision?->toDateString();
        $vencFinal    = $data['fecha_vencimiento'] ?? $poliza->fecha_vencimiento?->toDateString();
        if ($emisionFinal && $vencFinal && $vencFinal <= $emisionFinal) {
            return response()->json(['error' => 'La fecha de vencimiento debe ser posterior a la de emisión.'], 422);
        }

        // ── Campos del PDF que viven en snapshot_datos (datos personales / bien)
        // Se extraen del payload, se mergean al snapshot y se quitan de $data
        // para que $poliza->update() solo reciba columnas reales.
        $snap = $poliza->snapshot_datos ?? [];
        $snapAntes = $snap;
        if (array_key_exists('asegurado_nombre', $data)) $snap['asegurado']['nombre'] = $data['asegurado_nombre'];
        if (array_key_exists('asegurado_ci', $data))     $snap['asegurado']['ci']     = $data['asegurado_ci'];
        $snapMap = [
            'asegurado_direccion' => ['asegurado', 'direccion'],
            'asegurado_telefono'  => ['asegurado', 'telefono'],
            'tomador_nombre'      => ['tomador', 'nombre'],
            'tomador_ci'          => ['tomador', 'ci'],
            'tomador_direccion'   => ['tomador', 'direccion'],
            'tomador_telefono'    => ['tomador', 'telefono'],
        ];
        foreach ($snapMap as $field => [$grp, $key]) {
            if (array_key_exists($field, $data)) { $snap[$grp][$key] = $data[$field]; unset($data[$field]); }
        }
        $bienMap = ['bien_marca'=>'marca','bien_modelo'=>'modelo','bien_anio'=>'anio','bien_placa'=>'placa','bien_color'=>'color','bien_version'=>'version','bien_puestos'=>'puestos','bien_uso'=>'uso','bien_serial_carroceria'=>'serial_carroceria','bien_serial_motor'=>'serial_motor'];
        foreach ($bienMap as $field => $key) {
            if (array_key_exists($field, $data)) { $snap['bien']['atributos'][$key] = $data[$field]; unset($data[$field]); }
        }
        if ($snap !== $snapAntes) {
            $poliza->snapshot_datos = $snap;
        }

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
            'tipo'              => 'Tipo de póliza',
            'sede_poliza'       => 'Oficina / Sede',
            'frecuencia_pago'   => 'Frecuencia de pago',
            'asegurado_nombre'  => 'Asegurado (nombre)',
            'asegurado_ci'      => 'Asegurado (cédula)',
        ];
        $cambios = [];
        if (isset($poliza->snapshot_datos) && $poliza->isDirty('snapshot_datos')) {
            $cambios['Datos del asegurado/tomador/bien'] = ['anterior' => '(varios)', 'nuevo' => 'actualizados'];
        }
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
                        auth()->user()?->nombre ?? 'LA VENEZOLANA DE SEGUROS Y VIDA C.A.',
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
    public function pdf(Request $request, $id)
    {
        $poliza = Poliza::with(['solicitud.bien', 'solicitud.persona', 'producto', 'vendedor', 'bienes.bien', 'facturas'])->findOrFail($id);
        $this->assertAccesoVendedorId($poliza->solicitud?->vendedor_id, 'No tienes acceso a esta póliza.');

        // Vista de Bienes: el documento se acota a un solo bien (con su
        // certificado), sin la sección de bienes adicionales. Vista de Clientes
        // (sin ?bien=): se muestra la póliza completa con todos los bienes.
        $bienScope = $request->filled('bien')
            ? $poliza->bienes->firstWhere('bien_asegurado_id', (int) $request->query('bien'))
            : null;

        // Bienes adicionales (más allá del original de la solicitud, que no
        // tiene certificado propio) — solo cuando NO se acota a un bien.
        $bienesAdicionales = $bienScope ? collect() : $poliza->bienesAdicionales();
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

        $pdf = Pdf::loadView('poliza-pdf', compact('poliza', 'qrCode', 'bienesAdicionales', 'numeroRecibo', 'esRenovacion', 'bienScope'))
                  ->setPaper('letter', 'portrait');

        $certSuffix = $bienScope && $bienScope->certificado
            ? '-' . str_replace(['/', ' '], '-', $bienScope->certificado)
            : '';
        $filename = 'poliza-' . str_replace(['/', ' '], '-', $poliza->nro_contrato) . $certSuffix . '.pdf';

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
        $moneda  = $poliza->monedaNativa();
        $total   = (float) ($poliza->total ?? 0);
        $totalBs  = $tasaUsd > 0 ? round(Moneda::aBs($total, $moneda, $tasaUsd, $tasaEur), 2) : null;
        $totalEur = $tasaEur > 0 ? round(Moneda::convertir($total, $moneda, 'EUR', $tasaUsd, $tasaEur), 2) : null;
        $totalUsdEquiv = $tasaUsd > 0 ? round(Moneda::aUsd($total, $moneda, $tasaUsd, $tasaEur), 2) : $total;

        // Datos de mensualidad (igual que al emitir): si el producto admite pago
        // mensual, la primera cuota es el mínimo a cubrir; el cliente puede
        // adelantar hasta el total anual.
        $permiteMensual = (bool) ($poliza->producto?->permite_mensualidades);
        $recargoPct     = (float) ($poliza->producto?->recargo_mensual_pct ?? 0);
        $cuotaMensual   = $permiteMensual && $total > 0
            ? round(($total / 12) * (1 + $recargoPct / 100), 2)
            : null;

        // Operable en línea (pagar cuota / renovar): vigente o ya vencida —
        // no ANULADA ni RENOVADA (QR viejo reutilizado).
        $operable = in_array($poliza->status, ['ACTIVA', 'VENCIDA'], true);

        // Renovar: solo "por vencer" (30 días anual / 7 mensual) o ya vencida;
        // las mensuales además sin cuotas pendientes. Ver Poliza::motivoNoRenovable().
        $renovableMotivo = $poliza->motivoNoRenovable();
        $renovable       = $renovableMotivo === null;

        // Pago de cuota en línea: solo pólizas mensuales con saldo pendiente.
        $cuotaSaldo   = 0.0;
        $cuotaProxima = null;
        if ($poliza->frecuencia_pago === 'Mensual' && $operable) {
            $cuotas = $poliza->cuotas()->orderBy('numero')->get();
            $cuotaSaldo = round($cuotas->sum(fn($c) => max(0, (float) $c->monto - (float) $c->monto_pagado)), 2);
            $prox = $cuotas->first(fn($c) => $c->status !== 'PAGADA');
            if ($prox) {
                $cuotaProxima = [
                    'numero'      => $prox->numero,
                    'monto'       => round(max(0, (float) $prox->monto - (float) $prox->monto_pagado), 2),
                    'vencimiento' => $prox->fecha_vencimiento?->format('d/m/Y'),
                ];
            }
        }
        $puedePagarCuota = $cuotaSaldo > 0 && $cuotaProxima !== null;

        return response()->view('poliza-landing', [
            'encontrada'        => true,
            'nro_contrato'      => $poliza->nro_contrato,
            'status'            => $poliza->status,
            'renovable'             => $renovable,
            'renovable_motivo'      => $renovableMotivo,
            'permite_mensualidades' => $permiteMensual,
            'recargo_mensual_pct'   => $recargoPct,
            'cuota_mensual'         => $cuotaMensual,
            'puede_pagar_cuota'     => $puedePagarCuota,
            'cuota_saldo'           => $cuotaSaldo,
            'cuota_proxima'         => $cuotaProxima,
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
            'moneda'            => $moneda,
            'moneda_simbolo'    => Moneda::simbolo($moneda),
            'total'             => $total,
            'total_bs'          => $totalBs,
            'total_eur'         => $totalEur,
            'total_usd_equiv'   => $totalUsdEquiv,
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

        // Solo pólizas vigentes o vencidas admiten renovación en línea.
        if (!in_array($poliza->status, ['ACTIVA', 'VENCIDA'], true)) {
            return response()->json([
                'message' => 'Esta póliza no admite renovación en línea (estado: ' . $poliza->status . '). Contacte a su asesor.',
            ], 422);
        }

        // Evita solicitudes duplicadas: si ya hay una pendiente para esta póliza,
        // no se crea otra (el asesor ya la tiene en cola para revisar).
        if (SolicitudRenovacionQr::where('poliza_id', $poliza->id)->where('status', 'PENDIENTE')->exists()) {
            return response()->json([
                'message' => 'Ya recibimos una solicitud de renovación para esta póliza y está en revisión. Un asesor la procesará pronto.',
            ], 422);
        }

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
     * Recibe una solicitud pública de PAGO DE CUOTA desde la landing del QR.
     * Mismo mecanismo que la renovación (queda PENDIENTE y el asesor confirma),
     * distinguida por concepto='cuota'.
     */
    public function solicitarPagoCuota(Request $request, $nroContrato)
    {
        $poliza = Poliza::where('nro_contrato', $nroContrato)
                        ->whereNull('deleted_at')
                        ->firstOrFail();

        if ($poliza->frecuencia_pago !== 'Mensual' || !in_array($poliza->status, ['ACTIVA', 'VENCIDA'], true)) {
            return response()->json(['message' => 'Esta póliza no admite pago de cuota en línea.'], 422);
        }

        $saldo = round($poliza->cuotas()->get()->sum(fn($c) => max(0, (float) $c->monto - (float) $c->monto_pagado)), 2);
        if ($saldo <= 0) {
            return response()->json(['message' => 'Esta póliza no tiene cuotas pendientes.'], 422);
        }

        if (SolicitudRenovacionQr::where('poliza_id', $poliza->id)->where('concepto', 'cuota')->where('status', 'PENDIENTE')->exists()) {
            return response()->json(['message' => 'Ya recibimos un pago de cuota para esta póliza y está en revisión.'], 422);
        }

        $metodosPermitidos = ['Transferencia Bancaria', 'Pago Móvil', 'Zelle', 'Binance / Cripto'];
        $data = $request->validate([
            'pagos'              => 'required|array|min:1|max:5',
            'pagos.*.metodo'     => 'required|string|in:' . implode(',', $metodosPermitidos),
            'pagos.*.banco'      => 'nullable|string|max:80|regex:/^[\w\s\-\.áéíóúÁÉÍÓÚñÑ]+$/u',
            'pagos.*.referencia' => ['required', 'string', 'max:100', 'regex:/^[\w\s\-\/]+$/'],
            'pagos.*.monto'      => 'required|numeric|min:0.01|max:9999999',
            'pagos.*.moneda'     => 'required|string|in:USD,EUR,Bs.',
        ]);

        $pagosLimpios = collect($data['pagos'])->map(fn($p) => [
            'metodo'     => $p['metodo'],
            'banco'      => isset($p['banco']) ? strip_tags(trim($p['banco'])) : null,
            'referencia' => preg_replace('/[^\w\s\-\/]/', '', trim($p['referencia'])),
            'monto'      => round((float) $p['monto'], 2),
            'moneda'     => $p['moneda'],
        ])->values()->all();

        $snap     = $poliza->snapshot_datos ?? [];
        $persona  = $poliza->solicitud?->persona;

        SolicitudRenovacionQr::create([
            'poliza_id'          => $poliza->id,
            'nro_contrato'       => $poliza->nro_contrato,
            'concepto'           => 'cuota',
            'nombre'             => $snap['asegurado']['nombre'] ?? $poliza->asegurado_nombre ?? $persona?->nombre ?? null,
            'telefono'           => $snap['tomador']['telefono'] ?? $persona?->celular ?? $persona?->telefono ?? null,
            'correo'             => $persona?->correo ?? null,
            'pagos'              => $pagosLimpios,
            'total_usd_estimado' => null,
            'status'             => 'PENDIENTE',
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Lista las cuotas de una póliza mensual (panel del asesor).
     */
    public function cuotas($id)
    {
        $poliza = Poliza::with(['solicitud', 'cuotas' => fn($q) => $q->orderBy('numero')])->findOrFail($id);
        $this->assertAccesoVendedorId($poliza->solicitud?->vendedor_id, 'No tienes acceso a esta póliza.');

        $monedaNativa = $poliza->monedaNativa();
        $cuotas = $poliza->cuotas->map(fn($c) => [
            'id'                => $c->id,
            'numero'            => $c->numero,
            'monto'             => (float) $c->monto,
            'monto_pagado'      => (float) $c->monto_pagado,
            'saldo'             => $c->saldo(),
            'fecha_vencimiento' => $c->fecha_vencimiento?->format('Y-m-d'),
            'status'            => $c->status,
        ])->values();

        $total  = round($poliza->cuotas->sum('monto'), 2);
        $pagado = round($poliza->cuotas->sum('monto_pagado'), 2);

        return response()->json([
            'frecuencia'     => $poliza->frecuencia_pago,
            'moneda'         => $monedaNativa,
            'moneda_simbolo' => Moneda::simbolo($monedaNativa),
            'cuotas'         => $cuotas,
            'total'          => $total,
            'pagado'         => $pagado,
            'saldo'          => round($total - $pagado, 2),
        ]);
    }

    /**
     * Registra un cobro de cuota(s) desde el panel del asesor: aplica el pago a
     * las cuotas pendientes, emite un recibo y envía el correo al cliente.
     */
    public function pagarCuota(Request $request, $id)
    {
        $poliza = Poliza::with('solicitud.persona', 'producto')->findOrFail($id);
        $this->assertAccesoVendedorId($poliza->solicitud?->vendedor_id, 'No tienes acceso a esta póliza.');

        if ($poliza->frecuencia_pago !== 'Mensual') {
            return response()->json(['error' => 'Esta póliza no es de pago mensual.'], 422);
        }
        if (!in_array($poliza->status, ['ACTIVA', 'VENCIDA'], true)) {
            return response()->json(['error' => "No se pueden registrar pagos en una póliza {$poliza->status}."], 422);
        }

        $noInjection = new NoInjectionChars();
        $data = $request->validate([
            'tasa_bcv'           => 'required|numeric|min:0.0001',
            'tasa_eur'           => 'nullable|numeric|min:0.0001',
            'pagos'              => 'required|array|min:1',
            'pagos.*.forma'      => ['required', 'string', 'max:30', $noInjection],
            'pagos.*.moneda'     => 'required|string|in:USD,EUR,Bs.',
            'pagos.*.monto'      => 'required|numeric|min:0.01',
            'pagos.*.referencia' => ['nullable', 'string', 'max:100', $noInjection],
        ]);

        $tasaBcv      = (float) $data['tasa_bcv'];
        $tasaEur      = isset($data['tasa_eur']) && $data['tasa_eur'] > 0 ? (float) $data['tasa_eur'] : $tasaBcv;
        $monedaNativa = $poliza->monedaNativa();
        $montoNativo  = collect($data['pagos'])->sum(
            fn($p) => Moneda::convertir((float) $p['monto'], $p['moneda'], $monedaNativa, $tasaBcv, $tasaEur)
        );

        // No aceptar más que el saldo pendiente de la póliza.
        $saldo = round($poliza->cuotas()->get()->sum(fn($c) => $c->saldo()), 2);
        if ($saldo <= 0) {
            return response()->json(['error' => 'Esta póliza ya está totalmente pagada.'], 422);
        }
        if ((int) round($montoNativo * 100) > (int) round($saldo * 100) + 10) {
            return response()->json([
                'error' => sprintf(
                    'El pago (%s%.2f) supera el saldo pendiente (%s%.2f).',
                    Moneda::simbolo($monedaNativa), round($montoNativo, 2),
                    Moneda::simbolo($monedaNativa), $saldo
                ),
            ], 422);
        }

        $pagoResumen = collect($data['pagos'])->map(fn($p) => $p['forma'] . ' ' . $p['moneda'])->join(' / ');
        $moneda      = $data['pagos'][0]['moneda'] ?? 'USD';

        $factura = DB::transaction(fn() => Mensualidades::aplicarPago(
            $poliza, (float) $montoNativo, $pagoResumen, $moneda,
            $data['pagos'][0]['referencia'] ?? null, $tasaBcv, $tasaEur, auth()->id()
        ));

        $correo = $poliza->solicitud?->persona?->correo;
        if ($factura && $correo) {
            try {
                Mail::to($correo)->queue(new FacturaMail($factura->fresh(), $poliza->solicitud?->persona?->nombre ?? ''));
                EmailLog::registrar(
                    tipo: 'recibo_cuota',
                    destinatario: $correo,
                    asunto: 'Recibo ' . $factura->numero,
                    personaId: $poliza->solicitud?->persona_id,
                    polizaId: $poliza->id,
                );
            } catch (\Throwable) {}
        }

        $this->logActivity(
            'Pago de cuota',
            "Cobro registrado en póliza {$poliza->nro_contrato} (recibo {$factura?->numero})",
            'poliza',
            auth()->id()
        );

        return response()->json(['ok' => true, 'nro_factura' => $factura?->numero]);
    }

    /**
     * Renueva una póliza: marca la actual como VENCIDA y crea una nueva
     * póliza + factura con los mismos datos de cobertura por un año más.
     */
    public function renovar(Request $request, $id)
    {
        $polizaAnterior = Poliza::with('solicitud', 'producto', 'cuotas')->findOrFail($id);
        $this->assertAccesoVendedorId($polizaAnterior->solicitud?->vendedor_id, 'No tienes acceso a esta póliza.');

        // Solo se renueva una póliza "por vencer" (30 días anual / 7 mensual) o
        // ya vencida; las mensuales además sin cuotas pendientes. Con el flag
        // `anticipada` (confirmación explícita del usuario en el modal) se
        // permite renovar fuera de la ventana — la nueva vigencia arranca al
        // vencer la actual, así que no se pierde cobertura.
        if ($motivoNoRenov = $polizaAnterior->motivoNoRenovable($request->boolean('anticipada'))) {
            return response()->json(['error' => $motivoNoRenov], 422);
        }

        $noInjection = new NoInjectionChars();

        $data = $request->validate([
            'tasa_bcv'          => 'required|numeric|min:0.0001',
            'tasa_eur'          => 'nullable|numeric|min:0.0001',
            'anticipada'        => 'sometimes|boolean',
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
        $monedaNativa   = $polizaAnterior->monedaNativa();
        $totalBsNuevo   = round(Moneda::aBs((float) $polizaAnterior->total, $monedaNativa, $tasaBcv, $tasaEur), 2);
        $coberturaBsNew = round(Moneda::aBs((float) $polizaAnterior->cobertura_dolares, $monedaNativa, $tasaBcv, $tasaEur), 2);

        // Mismo criterio que al emitir: el pago puede ir desde la primera cuota
        // (Mensual, si el producto admite mensualidades) hasta el total anual.
        $totalPoliza    = (float) $polizaAnterior->total;
        $totalPagado    = collect($data['pagos'])->sum(
            fn($p) => Moneda::convertir((float) $p['monto'], $p['moneda'], $monedaNativa, $tasaBcv, $tasaEur)
        );

        $permiteMensual = (bool) ($polizaAnterior->producto?->permite_mensualidades);
        $recargoPct     = (float) ($polizaAnterior->producto?->recargo_mensual_pct ?? 0);
        $esMensual      = $frecuencia === 'Mensual' && $permiteMensual;
        $montoMinimo    = $esMensual ? Mensualidades::montoCuota($totalPoliza, $recargoPct) : $totalPoliza;
        $montoMaximo    = $esMensual ? Mensualidades::totalFinanciado($totalPoliza, $recargoPct) : $totalPoliza;

        $pagCents = (int) floor($totalPagado * 100 + 1e-6);
        $minCents = (int) round($montoMinimo * 100);
        $maxCents = (int) round($montoMaximo * 100);
        if ($pagCents < $minCents || $pagCents > $maxCents + 10) {
            return response()->json([
                'error' => $pagCents < $minCents
                    ? sprintf(
                        'El pago (%s%.2f %s) es menor a %s (%s%.2f %s).',
                        Moneda::simbolo($monedaNativa), round($totalPagado, 2), Moneda::etiqueta($monedaNativa),
                        $esMensual ? 'la primera cuota mensual' : 'el total de la póliza',
                        Moneda::simbolo($monedaNativa), $montoMinimo, Moneda::etiqueta($monedaNativa)
                    )
                    : sprintf(
                        'El pago (%s%.2f %s) supera el %s (%s%.2f %s).',
                        Moneda::simbolo($monedaNativa), round($totalPagado, 2), Moneda::etiqueta($monedaNativa),
                        $esMensual ? 'total financiado de las 12 cuotas' : 'total anual de la póliza',
                        Moneda::simbolo($monedaNativa), $montoMaximo, Moneda::etiqueta($monedaNativa)
                    ),
            ], 422);
        }

        $hoy  = now()->toDateString();
        // La nueva vigencia encadena con la anterior: arranca al vencer la
        // póliza vigente (renovar anticipado no pierde la cobertura restante).
        // Si ya venció, arranca hoy.
        $inicio = $polizaAnterior->fecha_vencimiento?->isFuture()
            ? $polizaAnterior->fecha_vencimiento->toDateString()
            : $hoy;
        $vence = \Illuminate\Support\Carbon::parse($inicio)->addYear()->toDateString();

        // La renovación hereda el snapshot de la póliza anterior (datos del
        // bien/vehículo, coberturas del tarifario, sumas RCV/APOV migradas…):
        // el PDF del cuadro póliza sale de ahí. Solo se refrescan los datos
        // propios de esta emisión (fecha, tasas, pagos).
        $snapshotNuevo = $polizaAnterior->snapshot_datos ?? [];
        if (!empty($snapshotNuevo)) {
            $snapshotNuevo['fecha_emision']    = $inicio;
            $snapshotNuevo['tasa_emision']     = $tasaBcv;
            $snapshotNuevo['tasa_emision_eur'] = $tasaEur;
            $snapshotNuevo['moneda']           = $moneda;
            $snapshotNuevo['pagos']            = $data['pagos'];
            $snapshotNuevo['total_bs']         = $totalBsNuevo;
        }

        $result = DB::transaction(function () use ($polizaAnterior, $data, $hoy, $inicio, $vence, $sede, $pagoResumen, $moneda, $monedaNativa, $frecuencia, $tasaBcv, $tasaEur, $totalBsNuevo, $coberturaBsNew, $esMensual, $recargoPct, $totalPagado, $snapshotNuevo) {
            $polizaAnterior->update(['status' => 'RENOVADA']);

            $nueva = Poliza::create([
                'nro_contrato'      => 'TMP-' . uniqid(),
                'solicitud_id'      => $polizaAnterior->solicitud_id,
                'producto_id'       => $polizaAnterior->producto_id,
                'total'             => $polizaAnterior->total,
                'total_bs'          => $totalBsNuevo,
                'moneda_producto'   => $monedaNativa,
                'tasa_emision'      => $tasaBcv,
                'tasa_emision_eur'  => $tasaEur,
                'cobertura_dolares' => $polizaAnterior->cobertura_dolares,
                'cobertura_bs'      => $coberturaBsNew,
                'pago'              => $pagoResumen,
                'frecuencia_pago'   => $frecuencia,
                'moneda'            => $moneda,
                'tipo'              => $polizaAnterior->tipo,
                'asegurado_nombre'  => $polizaAnterior->asegurado_nombre,
                'asegurado_ci'      => $polizaAnterior->asegurado_ci,
                'fecha_emision'     => $inicio,
                'fecha_vencimiento' => $vence,
                'sede_poliza'       => $sede,
                'vendedor_id'       => $polizaAnterior->vendedor_id ?? auth()->id(),
                'status'            => 'ACTIVA',
                'snapshot_datos'    => $snapshotNuevo ?: null,
                'tarifario_version_id' => $polizaAnterior->tarifario_version_id,
            ]);

            $nroContrato = CodigoPoliza::generar(
                $sede,
                $polizaAnterior->solicitud?->persona?->estado,
                $nueva->producto_id,
                CodigoPoliza::INDICADOR_RENOVACION,
                $nueva->id
            );
            $nroFactura  = CodigoPoliza::codigoRecibo($nroContrato);

            $nueva->update(['nro_contrato' => $nroContrato]);

            if ($nueva->vendedor_id) {
                $baseUsd = Moneda::aUsd((float) $polizaAnterior->total, $monedaNativa, $tasaBcv, $tasaEur);
                $tasaPct = Comision::tasaParaUsuario($nueva->vendedor) * 100;
                Comision::create([
                    'poliza_id'      => $nueva->id,
                    'vendedor_id'    => $nueva->vendedor_id,
                    'base_usd'       => round($baseUsd, 2),
                    'tasa_pct'       => $tasaPct,
                    'monto'          => round($baseUsd * $tasaPct / 100, 2),
                    'fecha_generada' => $hoy,
                ]);
            }

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

            if ($esMensual) {
                // Renovación mensual: 12 cuotas nuevas + cobro inicial (emite recibo).
                // Las cuotas se calendarizan desde el inicio de la nueva vigencia.
                Mensualidades::generarCuotas($nueva, (float) $polizaAnterior->total, $recargoPct, $inicio);
                $factura = Mensualidades::aplicarPago(
                    $nueva, (float) $totalPagado, $pagoResumen, $moneda,
                    $data['pagos'][0]['referencia'] ?? null, $tasaBcv, $tasaEur, auth()->id(), $sede
                );
                $nroFactura = $factura?->numero ?? $nroFactura;
            } else {
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
            }

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

                    // Documentos del producto que el cliente aún no haya recibido
                    if ($nuevaPoliza->solicitud?->persona && $nuevaPoliza->producto) {
                        EnvioDocumentosProducto::paraPersona(
                            $nuevaPoliza->solicitud->persona,
                            $nuevaPoliza->producto,
                            $nuevaPoliza->id
                        );
                    }
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
        $poliza = Poliza::with('solicitud', 'producto', 'cuotas')->findOrFail($id);
        $this->assertAccesoVendedorId($poliza->solicitud?->vendedor_id, 'No tienes acceso a esta póliza.');

        $bienes   = $poliza->bienes()->with('bien')->orderBy('certificado')->get()->map(fn($pb) => $this->formatPolizaBien($pb, $poliza));
        $producto = $poliza->producto;

        // Contexto para recalcular prima al agregar un bien: moneda nativa, si
        // es mensual cuántas cuotas quedan por cobrar, y una prima sugerida
        // (prorrateo de la prima actual entre los bienes ya cubiertos).
        $monedaNativa  = $poliza->monedaNativa();
        $cuotasRest    = $poliza->frecuencia_pago === 'Mensual'
            ? $poliza->cuotas->where('status', '!=', 'PAGADA')->count()
            : 0;
        $nBienes       = max(1, $bienes->count());
        $primaSugerida = round((float) $poliza->total / $nBienes, 2);

        return response()->json([
            'items'  => $bienes,
            'config' => [
                'permite_multiples_bienes' => (bool) $producto?->permite_multiples_bienes,
                'lleva_certificado'        => (bool) $producto?->lleva_certificado,
                'max_bienes'               => $producto?->max_bienes,
                'frecuencia_pago'          => $poliza->frecuencia_pago,
                'moneda_nativa'            => $monedaNativa,
                'moneda_simbolo'           => Moneda::simbolo($monedaNativa),
                'usa_eur'                  => $monedaNativa === 'EUR',
                'recargo_mensual_pct'      => (float) ($producto?->recargo_mensual_pct ?? 0),
                'cuotas_restantes'         => $cuotasRest,
                'prima_actual'             => (float) $poliza->total,
                'prima_sugerida'           => $primaSugerida,
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
            // Recálculo de prima al agregar el bien (opcional). Si se envía una
            // prima adicional > 0, se exige la tasa para la conversión a Bs.
            'prima_adicional'   => 'nullable|numeric|min:0',
            'tasa_bcv'          => 'required_with:prima_adicional|nullable|numeric|min:0.0001',
            'tasa_eur'          => 'nullable|numeric|min:0.0001',
            'forma_pago'        => ['nullable', 'string', 'max:30', new NoInjectionChars()],
            'referencia'        => ['nullable', 'string', 'max:100', new NoInjectionChars()],
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

        $primaAdic = isset($data['prima_adicional']) ? round((float) $data['prima_adicional'], 2) : 0.0;

        // Si la póliza es mensual y se va a cobrar, debe haber cuotas vivas
        // donde repartir el adicional — si no, hay que saldar/renovar primero.
        if ($primaAdic > 0 && $poliza->frecuencia_pago === 'Mensual') {
            $cuotasRest = $poliza->cuotas()->where('status', '!=', 'PAGADA')->count();
            if ($cuotasRest === 0) {
                return response()->json(['error' => 'No quedan cuotas pendientes donde repartir la prima adicional. Renueva la póliza para agregar cobertura.'], 422);
            }
        }

        $siguiente    = $bienesActuales + 1;
        $certificado  = $poliza->nro_contrato . '-' . str_pad($siguiente, 2, '0', STR_PAD_LEFT);

        $resultado = DB::transaction(function () use ($poliza, $bien, $certificado, $data, $primaAdic, $producto) {
            $polizaBien = PolizaBien::create([
                'poliza_id'         => $poliza->id,
                'bien_asegurado_id' => $bien->id,
                'certificado'       => $certificado,
                'cobertura_dolares' => $data['cobertura_dolares'] ?? null,
                'cobertura_bs'      => $data['cobertura_bs'] ?? null,
                'created_by'        => auth()->id(),
            ]);

            $recibo = null;
            if ($primaAdic > 0) {
                $recibo = $this->recalcularPrimaPorBien($poliza, $primaAdic, $data, $producto);
            }

            return [$polizaBien, $recibo];
        });

        [$polizaBien, $recibo] = $resultado;

        $detallePrima = $primaAdic > 0
            ? ($poliza->frecuencia_pago === 'Mensual'
                ? " — prima +{$primaAdic} repartida en cuotas restantes"
                : " — prima +{$primaAdic}, recibo {$recibo}")
            : '';
        $this->logActivity(
            'Bien Agregado a Póliza',
            "Póliza {$poliza->nro_contrato} — bien #{$bien->id} agregado con certificado {$certificado}{$detallePrima}",
            'poliza',
            auth()->id()
        );

        $out = $this->formatPolizaBien($polizaBien->load('bien'), $poliza);
        if ($primaAdic > 0) {
            $out['prima_aplicada'] = $primaAdic;
            $out['recibo']         = $recibo; // null en mensual (se cobra por cuota)
        }
        return response()->json($out, 201);
    }

    /**
     * Recalcula la prima de la póliza al agregar un bien adicional:
     *  - Sube poliza.total / total_bs por la prima adicional (moneda nativa).
     *  - Anual: emite un recibo (factura) por el cobro adicional.
     *  - Mensual: reparte el adicional financiado (con recargo) entre las
     *    cuotas que aún no están PAGADA; se cobra al pagar cada una.
     * Devuelve el número de recibo (anual) o null (mensual).
     * Debe llamarse dentro de una transacción.
     */
    private function recalcularPrimaPorBien(Poliza $poliza, float $primaAdic, array $data, $producto): ?string
    {
        $monedaNativa = $poliza->monedaNativa();
        $tasaBcv      = (float) $data['tasa_bcv'];
        $tasaEur      = isset($data['tasa_eur']) && $data['tasa_eur'] > 0 ? (float) $data['tasa_eur'] : $tasaBcv;
        $primaBs      = round(Moneda::aBs($primaAdic, $monedaNativa, $tasaBcv, $tasaEur), 2);

        $poliza->total    = round((float) $poliza->total + $primaAdic, 2);
        $poliza->total_bs = round((float) $poliza->total_bs + $primaBs, 2);
        $poliza->save();

        if ($poliza->frecuencia_pago === 'Mensual') {
            // Repartir el adicional financiado (con el mismo recargo del producto)
            // entre las cuotas vivas; la última absorbe el redondeo.
            $recargo        = (float) ($producto?->recargo_mensual_pct ?? 0);
            $financiadoAdic = round($primaAdic * (1 + $recargo / 100), 2);
            $cuotas         = $poliza->cuotas()->where('status', '!=', 'PAGADA')->orderBy('numero')->get();
            $n              = $cuotas->count();
            $base           = round($financiadoAdic / $n, 2);
            $acum           = 0.0;
            foreach ($cuotas->values() as $i => $cuota) {
                $delta = $i < $n - 1 ? $base : round($financiadoAdic - $acum, 2);
                $acum  = round($acum + $delta, 2);
                $cuota->monto = round((float) $cuota->monto + $delta, 2);
                $cuota->save();
            }
            return null;
        }

        // Anual: recibo por el cobro adicional, numerado tras los recibos previos.
        $seq    = Factura::where('poliza_id', $poliza->id)->count() + 1;
        $base   = CodigoPoliza::codigoRecibo($poliza->nro_contrato);
        $numero = $seq === 1 ? $base : $base . '-' . $seq;
        $monedaLabel = $monedaNativa === 'BS' ? 'Bs.' : $monedaNativa;

        $factura = Factura::create([
            'numero'        => $numero,
            'sede'          => $poliza->sede_poliza ?? 'Principal',
            'fecha_factura' => now()->toDateString(),
            'poliza_id'     => $poliza->id,
            'valor'         => $primaAdic,
            'valor_bs'      => $primaBs,
            'forma_pago'    => $data['forma_pago'] ?? 'Transferencia',
            'moneda'        => $monedaLabel,
            'referencia'    => $data['referencia'] ?? null,
            'usuario_id'    => auth()->id(),
        ]);

        return $factura->numero;
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

        if ($request->filled('cedula')) $request->merge(['cedula' => Documento::normalizarCedula($request->input('cedula'))]);

        $noInjection = new NoInjectionChars();
        $data = $request->validate([
            'nombre'     => ['required', 'string', 'max:120', $noInjection],
            'cedula'     => ['nullable', 'string', 'max:20', new CedulaValida()],
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

        if ($request->filled('cedula')) $request->merge(['cedula' => Documento::normalizarCedula($request->input('cedula'))]);

        $noInjection = new NoInjectionChars();
        $data = $request->validate([
            'nombre'     => ['sometimes', 'string', 'max:120', $noInjection],
            'cedula'     => ['nullable', 'string', 'max:20', new CedulaValida()],
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
