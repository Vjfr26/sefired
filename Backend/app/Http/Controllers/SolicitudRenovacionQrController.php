<?php

namespace App\Http\Controllers;

use App\Mail\FacturaMail;
use App\Mail\PolizaRenovadaMail;
use App\Models\Comision;
use App\Models\EmailLog;
use App\Models\Factura;
use App\Models\Poliza;
use App\Models\SolicitudRenovacionQr;
use App\Rules\NoInjectionChars;
use App\Services\WorkflowService;
use App\Support\CodigoPoliza;
use App\Support\Mensualidades;
use App\Support\Moneda;
use App\Traits\LogsActivity;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SolicitudRenovacionQrController extends Controller
{
    use LogsActivity;

    /**
     * Lista todas las solicitudes de renovación recibidas por QR.
     * Soporta filtro por status y búsqueda por nro_contrato / nombre.
     */
    public function index(Request $request)
    {
        $query = SolicitudRenovacionQr::with(['poliza', 'procesadoPor'])
            ->orderByRaw("FIELD(status,'PENDIENTE','AUTORIZADA','RECHAZADA')")
            ->orderBy('created_at', 'desc');

        if ($status = $request->query('status')) {
            $query->where('status', strtoupper($status));
        }

        if ($q = $request->query('q')) {
            $query->where(function ($sub) use ($q) {
                $sub->where('nro_contrato', 'like', "%{$q}%")
                    ->orWhere('nombre', 'like', "%{$q}%")
                    ->orWhere('telefono', 'like', "%{$q}%");
            });
        }

        $items = $query->paginate(20);

        return response()->json([
            'data' => $items->map(fn($s) => [
                'id'                   => $s->id,
                'nro_contrato'         => $s->nro_contrato,
                'concepto'             => $s->concepto ?? 'renovacion',
                'poliza_id'            => $s->poliza_id,
                'nombre'               => $s->nombre,
                'telefono'             => $s->telefono,
                'correo'               => $s->correo,
                'pagos'                => $s->pagos ?? [],
                'total_usd_estimado'   => $s->total_usd_estimado,
                'status'               => $s->status,
                'nota_agente'          => $s->nota_agente,
                'procesado_por_nombre' => $s->procesadoPor?->nombre,
                'fecha'                => $s->created_at->format('d/m/Y H:i'),
                'poliza_status'        => $s->poliza?->status,
                'poliza_total'         => $s->poliza?->total,
            ]),
            'total'        => $items->total(),
            'current_page' => $items->currentPage(),
            'last_page'    => $items->lastPage(),
        ]);
    }

    /**
     * Autoriza la solicitud: ejecuta la renovación formal de la póliza.
     * Requiere tasa_bcv del agente. Usa los datos de pago del cliente como
     * referencia para la factura, sin validar que el monto coincida exactamente
     * (el agente ya confirmó el pago antes de autorizar).
     */
    public function autorizar(Request $request, $id)
    {
        $solicitud = SolicitudRenovacionQr::findOrFail($id);

        if ($solicitud->status !== 'PENDIENTE') {
            return response()->json(['error' => 'Esta solicitud ya fue procesada.'], 409);
        }

        $data = $request->validate([
            'tasa_bcv' => 'required|numeric|min:0.0001',
            'tasa_eur' => 'nullable|numeric|min:0.0001',
        ]);

        $polizaAnterior = Poliza::findOrFail($solicitud->poliza_id);

        // Pago de cuota: flujo distinto a la renovación (aplica el cobro y emite recibo).
        if ($solicitud->concepto === 'cuota') {
            $tasaBcv = (float) $data['tasa_bcv'];
            $tasaEur = isset($data['tasa_eur']) && $data['tasa_eur'] > 0 ? (float) $data['tasa_eur'] : $tasaBcv;
            return $this->autorizarCuota($solicitud, $polizaAnterior, $tasaBcv, $tasaEur);
        }

        if (in_array($polizaAnterior->status, ['ANULADA', 'RENOVADA'])) {
            return response()->json(['error' => "No se puede renovar una póliza {$polizaAnterior->status}."], 409);
        }

        $tasaBcv    = (float) $data['tasa_bcv'];
        $tasaEur    = isset($data['tasa_eur']) && $data['tasa_eur'] > 0 ? (float) $data['tasa_eur'] : $tasaBcv;
        $sede       = auth()->user()?->sede ?? 'Principal';
        $hoy        = now()->toDateString();
        $vence      = now()->addYear()->toDateString();
        $monedaNativa = $polizaAnterior->monedaNativa();
        $totalBs    = round(Moneda::aBs((float) $polizaAnterior->total, $monedaNativa, $tasaBcv, $tasaEur), 2);
        $cobBs      = round(Moneda::aBs((float) $polizaAnterior->cobertura_dolares, $monedaNativa, $tasaBcv, $tasaEur), 2);
        $pagos       = $solicitud->pagos ?? [];
        $pagoResumen = collect($pagos)->map(fn($p) => $p['metodo'] . ' ' . $p['moneda'])->join(' / ');
        $monedaPrincipal = $pagos[0]['moneda'] ?? 'USD';

        $result = DB::transaction(function () use (
            $polizaAnterior, $solicitud, $pagos, $hoy, $vence,
            $sede, $pagoResumen, $monedaPrincipal, $monedaNativa, $tasaBcv, $tasaEur, $totalBs, $cobBs
        ) {
            $polizaAnterior->update(['status' => 'RENOVADA']);

            $nueva = Poliza::create([
                'nro_contrato'      => 'TMP-' . uniqid(),
                'solicitud_id'      => $polizaAnterior->solicitud_id,
                'producto_id'       => $polizaAnterior->producto_id,
                'total'             => $polizaAnterior->total,
                'total_bs'          => $totalBs,
                'moneda_producto'   => $monedaNativa,
                'tasa_emision'      => $tasaBcv,
                'tasa_emision_eur'  => $tasaEur,
                'cobertura_dolares' => $polizaAnterior->cobertura_dolares,
                'cobertura_bs'      => $cobBs,
                'pago'              => $pagoResumen,
                'frecuencia_pago'   => $polizaAnterior->frecuencia_pago ?? 'Anual',
                'moneda'            => $monedaPrincipal,
                'tipo'              => $polizaAnterior->tipo,
                'fecha_emision'     => $hoy,
                'fecha_vencimiento' => $vence,
                'sede_poliza'       => $sede,
                'vendedor_id'       => $polizaAnterior->vendedor_id ?? auth()->id(),
                'status'            => 'ACTIVA',
                'snapshot_datos'    => $polizaAnterior->snapshot_datos,
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
                $tasaPct = Comision::tasaParaCargo($nueva->vendedor?->cargo) * 100;
                Comision::create([
                    'poliza_id'      => $nueva->id,
                    'vendedor_id'    => $nueva->vendedor_id,
                    'base_usd'       => round($baseUsd, 2),
                    'tasa_pct'       => $tasaPct,
                    'monto'          => round($baseUsd * $tasaPct / 100, 2),
                    'fecha_generada' => $hoy,
                ]);
            }

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
                'valor_bs'      => $totalBs,
                'forma_pago'    => $pagoResumen,
                'moneda'        => $monedaPrincipal,
                'referencia'    => collect($pagos)->pluck('referencia')->join(' / '),
                'usuario_id'    => auth()->id(),
            ]);

            $solicitud->update([
                'status'        => 'AUTORIZADA',
                'procesado_por' => auth()->id(),
            ]);

            return ['nro_contrato' => $nroContrato, 'nro_factura' => $nroFactura, 'nueva_id' => $nueva->id];
        });

        // Correo al cliente
        try {
            $correoCliente = $solicitud->correo
                             ?? $polizaAnterior->solicitud?->persona?->correo;

            if ($correoCliente) {
                $nuevaPoliza = Poliza::with(['solicitud.persona', 'producto'])
                                    ->find($result['nueva_id']);
                if ($nuevaPoliza) {
                    Mail::to($correoCliente)->queue(new PolizaRenovadaMail($nuevaPoliza, $polizaAnterior->fresh()));
                    EmailLog::registrar('poliza_renovada', $correoCliente, 'Renovación ' . $result['nro_contrato'], $polizaAnterior->solicitud?->persona_id);
                }
            }
        } catch (\Throwable) {}

        $this->logActivity(
            'Renovación QR Autorizada',
            "Póliza {$polizaAnterior->nro_contrato} renovada por QR → {$result['nro_contrato']}",
            'poliza',
            auth()->id()
        );

        return response()->json([
            'message'      => 'Póliza renovada correctamente',
            'nro_contrato' => $result['nro_contrato'],
            'nro_factura'  => $result['nro_factura'],
        ], 201);
    }

    /**
     * Autoriza un pago de cuota recibido por el landing: aplica el cobro a las
     * cuotas pendientes, emite el recibo y notifica al cliente.
     */
    private function autorizarCuota(SolicitudRenovacionQr $solicitud, Poliza $poliza, float $tasaBcv, float $tasaEur)
    {
        if ($poliza->frecuencia_pago !== 'Mensual' || !in_array($poliza->status, ['ACTIVA', 'VENCIDA'], true)) {
            return response()->json(['error' => 'Esta póliza no admite pago de cuota.'], 409);
        }

        $monedaNativa = $poliza->monedaNativa();
        $pagos        = $solicitud->pagos ?? [];
        $montoNativo  = collect($pagos)->sum(
            fn($p) => Moneda::convertir((float) $p['monto'], $p['moneda'], $monedaNativa, $tasaBcv, $tasaEur)
        );
        if ($montoNativo <= 0) {
            return response()->json(['error' => 'El monto del pago no es válido.'], 422);
        }

        $saldo = round($poliza->cuotas()->get()->sum(fn($c) => max(0, (float) $c->monto - (float) $c->monto_pagado)), 2);
        if ($saldo <= 0) {
            return response()->json(['error' => 'Esta póliza ya está totalmente pagada.'], 422);
        }

        $pagoResumen = collect($pagos)->map(fn($p) => $p['metodo'] . ' ' . $p['moneda'])->join(' / ');
        $moneda      = $pagos[0]['moneda'] ?? 'USD';
        $referencia  = $pagos[0]['referencia'] ?? null;

        $factura = DB::transaction(function () use ($poliza, $montoNativo, $pagoResumen, $moneda, $referencia, $tasaBcv, $tasaEur, $solicitud) {
            $f = Mensualidades::aplicarPago($poliza, (float) $montoNativo, $pagoResumen, $moneda, $referencia, $tasaBcv, $tasaEur, auth()->id());
            $solicitud->update(['status' => 'AUTORIZADA', 'procesado_por' => auth()->id()]);
            return $f;
        });

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
            "Cuota autorizada (QR) en póliza {$poliza->nro_contrato} (recibo {$factura?->numero})",
            'poliza',
            auth()->id()
        );

        return response()->json(['ok' => true, 'nro_factura' => $factura?->numero]);
    }

    /**
     * Rechaza la solicitud con una nota opcional del agente.
     */
    public function rechazar(Request $request, $id)
    {
        $solicitud = SolicitudRenovacionQr::findOrFail($id);

        if ($solicitud->status !== 'PENDIENTE') {
            return response()->json(['error' => 'Esta solicitud ya fue procesada.'], 409);
        }

        $noInjection = new NoInjectionChars();

        $data = $request->validate([
            'nota' => ['nullable', 'string', 'max:500', $noInjection],
        ]);

        $solicitud->update([
            'status'        => 'RECHAZADA',
            'nota_agente'   => $data['nota'] ?? null,
            'procesado_por' => auth()->id(),
        ]);

        $this->logActivity(
            'Renovación QR Rechazada',
            "Solicitud de renovación #{$id} (póliza {$solicitud->nro_contrato}) rechazada",
            'poliza',
            auth()->id()
        );

        return response()->json(['message' => 'Solicitud rechazada.']);
    }
}
