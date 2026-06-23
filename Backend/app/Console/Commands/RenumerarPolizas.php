<?php

namespace App\Console\Commands;

use App\Models\Factura;
use App\Models\Poliza;
use App\Support\CodigoPoliza;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Recalcula nro_contrato (y el numero del recibo/factura asociado) de
 * pólizas existentes con el formato numérico oficina-estado-producto-
 * indicador-secuencial. Pensado para correrse de nuevo sin problema
 * (determinístico: misma póliza + mismos datos = mismo código siempre),
 * incluyendo después de importar la base de datos real de producción.
 *
 * ADVERTENCIA: si alguna de estas pólizas ya circula con su número actual
 * en manos del cliente (documento físico, correo ya enviado, QR ya
 * impreso), ese número deja de funcionar al renumerar. Revisar antes de
 * correr contra datos reales que ya estén en uso por clientes.
 */
class RenumerarPolizas extends Command
{
    protected $signature   = 'polizas:renumerar {--dry-run : Solo muestra los cambios, no los guarda}';
    protected $description = 'Recalcula el código numérico de pólizas (oficina-estado-producto-indicador-secuencial) y su recibo asociado';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $polizas = Poliza::with('solicitud.persona')->get();

        if ($polizas->isEmpty()) {
            $this->info('No hay pólizas para renumerar.');
            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($polizas->count());
        $cambios = 0;

        foreach ($polizas as $poliza) {
            $nuevoContrato = CodigoPoliza::generar(
                $poliza->sede_poliza ?? '',
                $poliza->solicitud?->persona?->estado,
                $poliza->producto_id ?? 0,
                $poliza->esRenovacion() ? CodigoPoliza::INDICADOR_RENOVACION : CodigoPoliza::INDICADOR_NUEVO,
                $poliza->id
            );
            $nuevoRecibo = CodigoPoliza::codigoRecibo($nuevoContrato);

            if ($nuevoContrato !== $poliza->nro_contrato) {
                $cambios++;
                if (!$dryRun) {
                    DB::transaction(function () use ($poliza, $nuevoContrato, $nuevoRecibo) {
                        $poliza->update(['nro_contrato' => $nuevoContrato]);
                        Factura::where('poliza_id', $poliza->id)->update(['numero' => $nuevoRecibo]);
                    });
                }
            }
            $bar->advance();
        }
        $bar->finish();
        $this->newLine();

        $this->info($dryRun
            ? "Se renumerarían {$cambios} de {$polizas->count()} pólizas (dry-run, nada se guardó)."
            : "Renumeradas {$cambios} de {$polizas->count()} pólizas."
        );

        return self::SUCCESS;
    }
}
