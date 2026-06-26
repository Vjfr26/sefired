<?php

namespace App\Support;

use App\Models\Cuota;
use App\Models\Factura;
use App\Models\Poliza;
use Carbon\Carbon;

/**
 * Lógica de mensualidades: financiamiento en 12 cuotas, generación de cuotas
 * al emitir/renovar, y aplicación de cobros (cada cobro emite un recibo y
 * asigna el monto a las cuotas pendientes en orden; el excedente adelanta las
 * siguientes). Moneda y CodigoPoliza viven en este mismo namespace (App\Support).
 */
class Mensualidades
{
    /** Total mensual financiado = prima * (1 + recargo%). Cuesta algo más que el anual. */
    public static function totalFinanciado(float $prima, float $recargoPct): float
    {
        return round($prima * (1 + $recargoPct / 100), 2);
    }

    /** Monto de una cuota individual (12 iguales; la 12ª absorbe el redondeo). */
    public static function montoCuota(float $prima, float $recargoPct): float
    {
        return round(self::totalFinanciado($prima, $recargoPct) / 12, 2);
    }

    /** Genera las 12 cuotas de una póliza mensual. $fechaEmision en 'Y-m-d'. */
    public static function generarCuotas(Poliza $poliza, float $prima, float $recargoPct, string $fechaEmision): void
    {
        $total   = self::totalFinanciado($prima, $recargoPct);
        $base    = round($total / 12, 2);
        $emision = Carbon::parse($fechaEmision);

        $acumulado = 0.0;
        for ($n = 1; $n <= 12; $n++) {
            // La cuota 12 absorbe el remanente de redondeo para cuadrar el total.
            $monto = $n < 12 ? $base : round($total - $acumulado, 2);
            $acumulado = round($acumulado + $monto, 2);
            Cuota::create([
                'poliza_id'         => $poliza->id,
                'numero'            => $n,
                'monto'             => $monto,
                'monto_pagado'      => 0,
                'fecha_vencimiento' => $emision->copy()->addMonthsNoOverflow($n - 1)->toDateString(),
                'status'            => 'PENDIENTE',
            ]);
        }
    }

    /**
     * Aplica un cobro (en moneda nativa del producto) a las cuotas pendientes
     * en orden, emite UN recibo (factura) por el monto cobrado y enlaza las
     * cuotas cubiertas. Devuelve la factura, o null si no hay monto.
     */
    public static function aplicarPago(
        Poliza $poliza,
        float $montoNativo,
        string $formaPagoResumen,
        string $moneda,
        ?string $referencia,
        float $tasaBcv,
        float $tasaEur,
        ?int $usuarioId,
        ?string $sede = null,
    ): ?Factura {
        if ($montoNativo <= 0) {
            return null;
        }

        $monedaNativa = $poliza->monedaNativa();
        $valorBs      = round(Moneda::aBs($montoNativo, $monedaNativa, $tasaBcv, $tasaEur), 2);

        // Número de recibo único por póliza: base del nro_contrato + secuencia.
        $seq    = Factura::where('poliza_id', $poliza->id)->count() + 1;
        $base   = CodigoPoliza::codigoRecibo($poliza->nro_contrato);
        $numero = $seq === 1 ? $base : $base . '-' . $seq;

        $factura = Factura::create([
            'numero'        => $numero,
            'sede'          => $sede ?? $poliza->sede_poliza ?? 'Principal',
            'fecha_factura' => now()->toDateString(),
            'poliza_id'     => $poliza->id,
            'valor'         => round($montoNativo, 2),
            'valor_bs'      => $valorBs,
            'forma_pago'    => $formaPagoResumen,
            'moneda'        => $moneda,
            'referencia'    => $referencia,
            'usuario_id'    => $usuarioId,
        ]);

        // Asignar a cuotas pendientes, de la más antigua a la más nueva.
        $restante = round($montoNativo, 2);
        $cuotas = Cuota::where('poliza_id', $poliza->id)
            ->where('status', '!=', 'PAGADA')
            ->orderBy('numero')
            ->get();

        foreach ($cuotas as $cuota) {
            if ($restante <= 0.001) {
                break;
            }
            $falta = round((float) $cuota->monto - (float) $cuota->monto_pagado, 2);
            if ($falta <= 0) {
                continue;
            }
            $aplica = min($restante, $falta);
            $cuota->monto_pagado = round((float) $cuota->monto_pagado + $aplica, 2);
            $cuota->factura_id   = $factura->id;
            if ($cuota->monto_pagado + 0.001 >= (float) $cuota->monto) {
                $cuota->status     = 'PAGADA';
                $cuota->fecha_pago = now()->toDateString();
            } else {
                $cuota->status = 'PARCIAL';
            }
            $cuota->save();
            $restante = round($restante - $aplica, 2);
        }

        return $factura;
    }
}
