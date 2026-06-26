<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Cuota mensual de una póliza. Ver migración create_cuota_table.
 */
class Cuota extends Model
{
    protected $table = 'cuota';

    protected $fillable = [
        'poliza_id',
        'numero',
        'monto',
        'monto_pagado',
        'fecha_vencimiento',
        'status',
        'factura_id',
        'fecha_pago',
    ];

    protected function casts(): array
    {
        return [
            'poliza_id'         => 'integer',
            'numero'            => 'integer',
            'monto'             => 'decimal:2',
            'monto_pagado'      => 'decimal:2',
            'fecha_vencimiento' => 'date',
            'factura_id'        => 'integer',
            'fecha_pago'        => 'date',
        ];
    }

    public function poliza(): BelongsTo
    {
        return $this->belongsTo(Poliza::class, 'poliza_id');
    }

    public function factura(): BelongsTo
    {
        return $this->belongsTo(Factura::class, 'factura_id');
    }

    /** Lo que falta por pagar de esta cuota (moneda nativa del producto). */
    public function saldo(): float
    {
        return round((float) $this->monto - (float) $this->monto_pagado, 2);
    }
}
