<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PolizaRcv extends Model
{
    protected $table = 'poliza_rcv';
    public $timestamps = false;

    protected $fillable = [
        'vehiculo_id',
        'suma_persona',
        'prima_persona',
        'suma_cosa',
        'prima_cosa',
    ];

    protected function casts(): array
    {
        return [
            'vehiculo_id' => 'integer',
            'suma_persona' => 'decimal:2',
            'prima_persona' => 'decimal:2',
            'suma_cosa' => 'decimal:2',
            'prima_cosa' => 'decimal:2',
        ];
    }

    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(Vehiculo::class, 'vehiculo_id');
    }
}
