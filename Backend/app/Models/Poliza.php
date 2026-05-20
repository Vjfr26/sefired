<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Poliza extends Model
{
    protected $table = 'poliza';
    public $timestamps = false;

    protected $fillable = [
        'nro_contrato',
        'solicitud_id',
        'producto_id',
        'total',
        'total_bs',
        'cobertura_dolares',
        'cobertura_bs',
        'pago',
        'tipo',
        'fecha_emision',
        'fecha_vencimiento',
        'papeleria',
        'vendedor_id',
        'sede_poliza',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'solicitud_id' => 'integer',
            'producto_id' => 'integer',
            'vendedor_id' => 'integer',
            'total' => 'decimal:2',
            'total_bs' => 'decimal:2',
            'cobertura_dolares' => 'decimal:2',
            'cobertura_bs' => 'decimal:2',
            'fecha_emision' => 'date',
            'fecha_vencimiento' => 'date',
        ];
    }

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(Solicitud::class, 'solicitud_id');
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'vendedor_id');
    }

    public function polizaApov()
    {
        return $this->hasOne(PolizaApov::class, 'poliza_id', 'id');
    }

    public function polizaRcv()
    {
        return $this->hasOne(PolizaRcv::class, 'poliza_id', 'id');
    }

    public function polizaEcEp()
    {
        return $this->hasOne(PolizaEcEp::class, 'poliza_id', 'id');
    }
}
