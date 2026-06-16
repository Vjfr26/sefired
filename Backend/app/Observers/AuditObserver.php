<?php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

/**
 * Observer base reutilizable. Registrar instancias por modelo en AppServiceProvider.
 *
 * Comportamiento:
 *   creating  → auto-set created_by / updated_by si el modelo los tiene
 *   updating  → auto-set updated_by; registra cambios en audit_log
 *   created   → registra en audit_log
 *   deleted   → registra en audit_log (soft o hard)
 */
class AuditObserver
{
    public function creating(Model $model): void
    {
        $userId = auth()->id();
        if ($userId && in_array('created_by', $model->getFillable())) {
            $model->created_by = $model->created_by ?? $userId;
        }
        if ($userId && in_array('updated_by', $model->getFillable())) {
            $model->updated_by = $model->updated_by ?? $userId;
        }
    }

    public function updating(Model $model): void
    {
        $userId = auth()->id();
        if ($userId && in_array('updated_by', $model->getFillable())) {
            $model->updated_by = $userId;
        }
    }

    public function created(Model $model): void
    {
        $this->record($model, 'created', []);
    }

    public function updated(Model $model): void
    {
        // Solo campos que realmente cambiaron, excluyendo timestamps y campos de auditoría
        $skip    = ['updated_at', 'created_at', 'updated_by', 'created_by'];
        $cambios = array_filter(
            $model->getChanges(),
            fn($key) => !in_array($key, $skip),
            ARRAY_FILTER_USE_KEY
        );

        if (empty($cambios)) {
            return;
        }

        $original = array_intersect_key($model->getOriginal(), $cambios);
        $this->record($model, 'updated', ['antes' => $original, 'despues' => $cambios]);
    }

    public function deleted(Model $model): void
    {
        $this->record($model, 'deleted', []);
    }

    private function record(Model $model, string $accion, array $cambios): void
    {
        try {
            AuditLog::record(
                modelo:    class_basename($model),
                modeloId:  $model->getKey(),
                accion:    $accion,
                cambios:   $cambios,
                usuarioId: auth()->id(),
                ip:        request()?->ip(),
            );
        } catch (\Throwable) {
            // La auditoría nunca debe interrumpir la operación principal
        }
    }
}
