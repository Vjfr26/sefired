<?php

namespace App\Console\Commands;

use App\Models\BienAsegurado;
use Illuminate\Console\Command;

/**
 * Elimina (soft delete, reversible) los bienes que NO están cubiertos por
 * ninguna póliza ni vinculados a una cotización activa — los "huérfanos" que
 * quedaron de cotizaciones que nunca se emitieron o se rechazaron.
 *
 * Regla: todo bien debe estar asociado a una póliza. Por defecto es dry-run
 * (solo lista); con --force ejecuta la baja. Es repetible y seguro.
 */
class LimpiarBienesHuerfanos extends Command
{
    protected $signature  = 'bienes:limpiar-huerfanos {--force : Ejecuta la eliminación (por defecto solo lista)}';
    protected $description = 'Elimina (soft delete) bienes sin póliza ni cotización activa';

    // Estados de cotización que mantienen "vivo" un bien (no rechazada/inexistente).
    private const SOLICITUD_ACTIVA = ['pendiente', 'en_revision', 'aprobado', 'emitida'];

    public function handle(): int
    {
        $huerfanos = BienAsegurado::doesntHave('polizaBienes')
            ->whereDoesntHave('solicitudes', fn ($q) => $q->whereIn('status', self::SOLICITUD_ACTIVA))
            ->with('persona:id,nombre,cedula')
            ->get();

        if ($huerfanos->isEmpty()) {
            $this->info('No hay bienes huérfanos.');
            return self::SUCCESS;
        }

        $this->warn($huerfanos->count() . ' bien(es) huérfano(s) (sin póliza ni cotización activa):');
        $this->table(
            ['ID', 'Tipo', 'Cliente', 'Cédula', 'Referencia'],
            $huerfanos->map(fn ($b) => [
                $b->id,
                $b->tipo,
                $b->persona?->nombre ?? '—',
                $b->persona?->cedula ?? '—',
                $b->atributos['placa'] ?? $b->atributos['descripcion'] ?? $b->descripcion ?? '—',
            ])->all()
        );

        if (!$this->option('force')) {
            $this->newLine();
            $this->info('Dry-run. Ejecuta con --force para eliminarlos (soft delete, reversible con restore()).');
            return self::SUCCESS;
        }

        $ids = $huerfanos->pluck('id');
        BienAsegurado::whereIn('id', $ids)->delete();
        $this->info($ids->count() . ' bien(es) eliminado(s) (soft delete).');

        return self::SUCCESS;
    }
}
