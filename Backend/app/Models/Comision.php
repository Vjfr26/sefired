<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Comisión generada por una póliza emitida/renovada, con estado
 * Pendiente/Pagada que un admin puede cambiar manualmente.
 */
class Comision extends Model
{
    protected $table = 'comision';
    public $timestamps = false;

    protected $fillable = [
        'poliza_id',
        'vendedor_id',
        'base_usd',
        'tasa_pct',
        'monto',
        'status',
        'fecha_generada',
        'fecha_pago',
        'pagado_por',
    ];

    protected function casts(): array
    {
        return [
            'poliza_id'      => 'integer',
            'vendedor_id'    => 'integer',
            'base_usd'       => 'decimal:2',
            'tasa_pct'       => 'decimal:2',
            'monto'          => 'decimal:2',
            'fecha_generada' => 'date',
            'fecha_pago'     => 'date',
            'pagado_por'     => 'integer',
        ];
    }

    public function poliza(): BelongsTo
    {
        return $this->belongsTo(Poliza::class, 'poliza_id');
    }

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'vendedor_id');
    }

    public function pagadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'pagado_por');
    }

    /** Tasa de comisión vigente según el cargo (10% Agente, 5% el resto). */
    public static function tasaParaCargo(?string $cargo): float
    {
        return strtolower((string) $cargo) === 'agente' ? 0.10 : 0.05;
    }
}
