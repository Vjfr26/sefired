<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PolizaRcv extends Model
{
    protected $table = 'poliza_rcv';
    protected $primaryKey = 'poliza_id';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'poliza_id',
        'tarifario_rcv_id',
        'suma_persona',
        'prima_persona',
        'suma_cosa',
        'prima_cosa',
    ];

    protected function casts(): array
    {
        return [
            'poliza_id' => 'integer',
            'tarifario_rcv_id' => 'integer',
            'suma_persona' => 'decimal:2',
            'prima_persona' => 'decimal:2',
            'suma_cosa' => 'decimal:2',
            'prima_cosa' => 'decimal:2',
        ];
    }

    public function poliza(): BelongsTo
    {
        return $this->belongsTo(Poliza::class, 'poliza_id');
    }

    public function tarifario(): BelongsTo
    {
        return $this->belongsTo(TarifarioRcv::class, 'tarifario_rcv_id');
    }
}
