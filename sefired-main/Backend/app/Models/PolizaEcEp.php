<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PolizaEcEp extends Model
{
    protected $table = 'poliza_ec_ep';
    protected $primaryKey = 'poliza_id';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'poliza_id',
        'tarifario_ec_ep_id',
        'suma_cobertura',
        'prima_cobertura',
        'suma_total',
        'suma_plata',
        'prima_plata',
        'suma_oro',
        'prima_oro',
    ];

    protected function casts(): array
    {
        return [
            'poliza_id' => 'integer',
            'tarifario_ec_ep_id' => 'integer',
            'suma_cobertura' => 'decimal:2',
            'prima_cobertura' => 'decimal:2',
            'suma_total' => 'decimal:2',
            'suma_plata' => 'decimal:2',
            'prima_plata' => 'decimal:2',
            'suma_oro' => 'decimal:2',
            'prima_oro' => 'decimal:2',
        ];
    }

    public function poliza(): BelongsTo
    {
        return $this->belongsTo(Poliza::class, 'poliza_id');
    }

    public function tarifario(): BelongsTo
    {
        return $this->belongsTo(TarifarioEcEp::class, 'tarifario_ec_ep_id');
    }
}
