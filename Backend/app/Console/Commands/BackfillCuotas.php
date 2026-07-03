<?php

namespace App\Console\Commands;

use App\Models\Cuota;
use App\Models\Poliza;
use App\Support\Mensualidades;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Genera las 12 cuotas de las pólizas mensuales que no tienen ninguna (emitidas
 * antes de que existiera el sistema de cuotas, tabla creada el 2026-06-26), y
 * reconcilia lo ya cobrado en la emisión (sus recibos) contra esas cuotas, para
 * que la primera quede pagada y el modal de Cuotas muestre el saldo correcto.
 *
 * Es idempotente: solo toca pólizas mensuales ACTIVA/VENCIDA con 0 cuotas.
 */
class BackfillCuotas extends Command
{
    protected $signature = 'cuotas:backfill {--dry-run : Muestra qué haría, sin escribir nada}';

    protected $description = 'Genera y reconcilia las cuotas de pólizas mensuales antiguas sin cuotas.';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        $polizas = Poliza::where('frecuencia_pago', 'Mensual')
            ->whereIn('status', ['ACTIVA', 'VENCIDA'])
            ->whereDoesntHave('cuotas')
            ->with(['producto', 'facturas'])
            ->get();

        if ($polizas->isEmpty()) {
            $this->info('No hay pólizas mensuales sin cuotas. Nada que hacer.');
            return self::SUCCESS;
        }

        $this->info(($dry ? '[DRY-RUN] ' : '') . "Pólizas mensuales sin cuotas: {$polizas->count()}");

        foreach ($polizas as $poliza) {
            $recargo = (float) ($poliza->producto?->recargo_mensual_pct ?? 0);
            $prima   = (float) $poliza->total;
            $pagado  = round((float) $poliza->facturas->sum('valor'), 2); // moneda nativa

            $this->line("  {$poliza->nro_contrato}: prima={$prima} recargo={$recargo}% ya_pagado={$pagado}");

            if ($dry) {
                continue;
            }

            DB::transaction(function () use ($poliza, $prima, $recargo, $pagado) {
                Mensualidades::generarCuotas($poliza, $prima, $recargo, $poliza->fecha_emision->toDateString());

                if ($pagado <= 0) {
                    return;
                }

                // Reconciliar el monto ya cobrado (recibos de emisión) contra las
                // cuotas, de la más antigua a la más nueva — sin crear un recibo
                // nuevo; se enlaza al primer recibo existente de la póliza.
                $facturaId = $poliza->facturas->sortBy('id')->first()?->id;
                $restante  = $pagado;

                foreach (Cuota::where('poliza_id', $poliza->id)->orderBy('numero')->get() as $cuota) {
                    if ($restante <= 0.001) {
                        break;
                    }
                    $falta = round((float) $cuota->monto - (float) $cuota->monto_pagado, 2);
                    if ($falta <= 0) {
                        continue;
                    }
                    $aplica = min($restante, $falta);
                    $cuota->monto_pagado = round((float) $cuota->monto_pagado + $aplica, 2);
                    $cuota->factura_id   = $facturaId;
                    if ($cuota->monto_pagado + 0.001 >= (float) $cuota->monto) {
                        $cuota->status     = 'PAGADA';
                        $cuota->fecha_pago = $poliza->fecha_emision->toDateString();
                    } else {
                        $cuota->status = 'PARCIAL';
                    }
                    $cuota->save();
                    $restante = round($restante - $aplica, 2);
                }
            });

            $this->info('    ✓ 12 cuotas generadas y reconciliadas');
        }

        $this->info('Listo.');
        return self::SUCCESS;
    }
}
