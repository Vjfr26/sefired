<?php

namespace App\Http\Controllers;

use App\Mail\PolizaRenovadaMail;
use App\Models\EmailLog;
use App\Models\Factura;
use App\Models\Poliza;
use App\Models\SolicitudRenovacionQr;
use App\Rules\NoInjectionChars;
use App\Services\WorkflowService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SolicitudRenovacionQrController extends Controller
{
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

        if (in_array($polizaAnterior->status, ['ANULADA', 'RENOVADA'])) {
            return response()->json(['error' => "No se puede renovar una póliza {$polizaAnterior->status}."], 409);
        }

        $tasaBcv    = (float) $data['tasa_bcv'];
        $tasaEur    = isset($data['tasa_eur']) && $data['tasa_eur'] > 0 ? (float) $data['tasa_eur'] : $tasaBcv;
        $sede       = auth()->user()?->sede ?? 'Principal';
        $hoy        = now()->toDateString();
        $vence      = now()->addYear()->toDateString();
        $anno       = now()->year;
        $totalBs    = round((float) $polizaAnterior->total * $tasaBcv, 2);
        $cobBs      = round((float) $polizaAnterior->cobertura_dolares * $tasaBcv, 2);
        $pagos       = $solicitud->pagos ?? [];
        $pagoResumen = collect($pagos)->map(fn($p) => $p['metodo'] . ' ' . $p['moneda'])->join(' / ');
        $monedaPrincipal = $pagos[0]['moneda'] ?? 'USD';

        $result = DB::transaction(function () use (
            $polizaAnterior, $solicitud, $pagos, $hoy, $vence, $anno,
            $sede, $pagoResumen, $monedaPrincipal, $tasaBcv, $tasaEur, $totalBs, $cobBs
        ) {
            $polizaAnterior->update(['status' => 'RENOVADA']);

            $nueva = Poliza::create([
                'nro_contrato'      => 'TMP-' . uniqid(),
                'solicitud_id'      => $polizaAnterior->solicitud_id,
                'producto_id'       => $polizaAnterior->producto_id,
                'total'             => $polizaAnterior->total,
                'total_bs'          => $totalBs,
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

            $nroContrato = 'POL-' . $anno . '-' . str_pad($nueva->id, 5, '0', STR_PAD_LEFT);
            $nroFactura  = 'FAC-' . $anno . '-' . str_pad($nueva->id, 5, '0', STR_PAD_LEFT);

            $nueva->update(['nro_contrato' => $nroContrato]);

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

        return response()->json([
            'message'      => 'Póliza renovada correctamente',
            'nro_contrato' => $result['nro_contrato'],
            'nro_factura'  => $result['nro_factura'],
        ], 201);
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

        return response()->json(['message' => 'Solicitud rechazada.']);
    }
}
