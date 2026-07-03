<?php

namespace App\Console\Commands;

use App\Models\Comision;
use App\Models\Poliza;
use App\Support\Moneda;
use Illuminate\Console\Command;

/**
 * Crea el registro de Comision para pólizas que no lo tengan — pensado para
 * pólizas anteriores a la introducción de la tabla `comision`, o para
 * volver a correrse tras importar una base de datos nueva (es idempotente:
 * una póliza que ya tiene su comisión se omite, nunca se duplica).
 */
class BackfillComisiones extends Command
{
    protected $signature   = 'comisiones:backfill {--status=pendiente : pendiente|pagada}';
    protected $description = 'Genera la comisión de pólizas que aún no tienen una (idempotente)';

    public function handle(): int
    {
        $status = strtoupper($this->option('status'));
        if (!in_array($status, ['PENDIENTE', 'PAGADA'], true)) {
            $this->error('--status debe ser "pendiente" o "pagada".');
            return self::FAILURE;
        }

        $polizas = Poliza::whereNotIn('id', Comision::pluck('poliza_id'))
            ->whereNotNull('vendedor_id')
            ->with('vendedor')
            ->get();

        if ($polizas->isEmpty()) {
            $this->info('No hay pólizas pendientes de respaldar — todas ya tienen su comisión.');
            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($polizas->count());
        foreach ($polizas as $poliza) {
            $monedaNativa = $poliza->monedaNativa();
            $tasaUsd      = (float) ($poliza->tasa_emision ?? 0);
            $tasaEur      = (float) ($poliza->tasa_emision_eur ?? 0);
            $baseUsd      = Moneda::aUsd((float) $poliza->total, $monedaNativa, $tasaUsd, $tasaEur);
            $tasaPct      = Comision::tasaParaUsuario($poliza->vendedor) * 100;

            Comision::create([
                'poliza_id'      => $poliza->id,
                'vendedor_id'    => $poliza->vendedor_id,
                'base_usd'       => round($baseUsd, 2),
                'tasa_pct'       => $tasaPct,
                'monto'          => round($baseUsd * $tasaPct / 100, 2),
                'status'         => $status,
                'fecha_generada' => $poliza->fecha_emision ?? now()->toDateString(),
                'fecha_pago'     => $status === 'PAGADA' ? ($poliza->fecha_emision ?? now()->toDateString()) : null,
            ]);
            $bar->advance();
        }
        $bar->finish();
        $this->newLine();
        $this->info("Comisiones generadas: {$polizas->count()} (status inicial: {$status}).");

        return self::SUCCESS;
    }
}
