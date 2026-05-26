<?php

namespace App\Http\Controllers;

use App\Models\Poliza;
use App\Models\Factura;
use App\Models\Solicitud;
use App\Services\WorkflowService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        // Si se intenta activar, verificar que el vehículo no tenga ya otra póliza activa
        if (isset($data['status']) && $data['status'] === 'ACTIVA' && $poliza->status !== 'ACTIVA') {
            $placa = $poliza->solicitud?->placa;

            if ($placa) {
                $conflicto = Poliza::whereHas('solicitud', fn($q) => $q->where('placa', $placa))
                    ->where('status', 'ACTIVA')
                    ->where('id', '!=', $poliza->id)
                    ->exists();

                if ($conflicto) {
                    return response()->json([
                        'error' => 'El vehículo ' . $placa . ' ya tiene una póliza ACTIVA. Anule o venza la anterior antes de activar esta.',
                    ], 409);
                }
            }
        }

        $poliza->update($data);

        return response()->json(['message' => 'Póliza actualizada correctamente']);
    }

    /**
     * Renueva una póliza: marca la actual como VENCIDA y crea una nueva
     * póliza + factura con los mismos datos de cobertura por un año más.
     */
    public function renovar(Request $request, $id)
    {
        $polizaAnterior = Poliza::findOrFail($id);

        $data = $request->validate([
            'pago'       => 'required|string|max:30',
            'referencia' => 'nullable|string|max:50',
            'sede'       => 'required|string|max:20',
        ]);

        $hoy  = now()->toDateString();
        $vence = now()->addYear()->toDateString();
        $anno  = now()->year;

        $result = DB::transaction(function () use ($polizaAnterior, $data, $hoy, $vence, $anno) {
            $polizaAnterior->update(['status' => 'VENCIDA']);

            $nueva = Poliza::create([
                'nro_contrato'      => 'TMP-' . uniqid(),
                'solicitud_id'      => $polizaAnterior->solicitud_id,
                'producto_id'       => $polizaAnterior->producto_id,
                'total'             => $polizaAnterior->total,
                'total_bs'          => $polizaAnterior->total_bs,
                'cobertura_dolares' => $polizaAnterior->cobertura_dolares,
                'cobertura_bs'      => $polizaAnterior->cobertura_bs,
                'pago'              => $data['pago'],
                'tipo'              => $polizaAnterior->tipo,
                'fecha_emision'     => $hoy,
                'fecha_vencimiento' => $vence,
                'sede_poliza'       => $data['sede'],
                'vendedor_id'       => $polizaAnterior->vendedor_id ?? auth()->id(),
                'status'            => 'ACTIVA',
            ]);

            $nroContrato = 'POL-' . $anno . '-' . str_pad($nueva->id, 5, '0', STR_PAD_LEFT);
            $nroFactura  = 'FAC-' . $anno . '-' . str_pad($nueva->id, 5, '0', STR_PAD_LEFT);

            $nueva->update(['nro_contrato' => $nroContrato]);

            Factura::create([
                'numero'        => $nroFactura,
                'sede'          => $data['sede'],
                'fecha_factura' => $hoy,
                'poliza_id'     => $nueva->id,
                'valor'         => $polizaAnterior->total,
                'valor_bs'      => $polizaAnterior->total_bs,
                'forma_pago'    => $data['pago'],
                'referencia'    => $data['referencia'] ?? null,
                'usuario_id'    => auth()->id(),
            ]);

            return ['nro_contrato' => $nroContrato, 'nro_factura' => $nroFactura];
        });

        return response()->json([
            'message'      => 'Póliza renovada correctamente',
            'nro_contrato' => $result['nro_contrato'],
            'nro_factura'  => $result['nro_factura'],
        ], 201);
    }
}
