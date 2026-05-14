<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Factura extends Model
{
    protected $table = 'factura';
    public $timestamps = false;

    protected $fillable = [
        'numero',
        'sede',
        'fecha_factura',
        'poliza_id',
        'valor',
        'valor_bs',
        'forma_pago',
        'referencia',
        'usuario_id',
    ];

    protected function casts(): array
    {
        return [
            'poliza_id' => 'integer',
            'usuario_id' => 'integer',
            'fecha_factura' => 'date',
            'valor' => 'decimal:2',
            'valor_bs' => 'decimal:2',
        ];
    }

    public function poliza(): BelongsTo
    {
        return $this->belongsTo(Poliza::class, 'poliza_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
