<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Solicitud extends Model
{
    protected $table = 'solicitud';
    public $timestamps = false;

    protected $fillable = [
        'cliente_id',
        'placa',
        'producto_id',
        'total',
        'total_bs',
        'suma_cobertura_bs',
        'suma_prima_bs',
        'fecha_solicitud',
    ];

    protected function casts(): array
    {
        return [
            'cliente_id' => 'integer',
            'producto_id' => 'integer',
            'total' => 'decimal:2',
            'total_bs' => 'decimal:2',
            'suma_cobertura_bs' => 'decimal:2',
            'suma_prima_bs' => 'decimal:2',
            'fecha_solicitud' => 'date',
        ];
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function polizas(): HasMany
    {
        return $this->hasMany(Poliza::class, 'solicitud_id');
    }
<<<<<<< HEAD

    public function solicitudApov()
    {
        return $this->hasOne(SolicitudApov::class, 'solicitud_id', 'id');
    }
=======
>>>>>>> origin/victor
}
