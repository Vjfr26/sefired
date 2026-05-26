<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $table = 'audit_log';
    public $timestamps = false;

    protected $fillable = [
        'modelo',
        'modelo_id',
        'accion',
        'cambios',
        'usuario_id',
        'ip',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'modelo_id'  => 'integer',
            'usuario_id' => 'integer',
            'cambios'    => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    /**
     * Registra un cambio en audit_log de forma estática.
     * Uso: AuditLog::record('Poliza', $id, 'status_changed', ['status' => ['ACTIVA', 'ANULADA']]);
     */
    public static function record(
        string $modelo,
        int|null $modeloId,
        string $accion,
        array $cambios = [],
        int|null $usuarioId = null,
        string|null $ip = null
    ): self {
        return static::create([
            'modelo'     => $modelo,
            'modelo_id'  => $modeloId,
            'accion'     => $accion,
            'cambios'    => $cambios ?: null,
            'usuario_id' => $usuarioId ?? auth()->id(),
            'ip'         => $ip ?? request()->ip(),
            'created_at' => now(),
        ]);
    }
}
