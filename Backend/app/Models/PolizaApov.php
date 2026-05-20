<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PolizaApov extends Model
{
    protected $table = 'poliza_apov';
    protected $primaryKey = 'poliza_id';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'poliza_id',
        'tarifario_apov_id',
        'suma_muerte_accidental',
        'suma_invalidez',
        'suma_medicos',
        'suma_funerarios',
    ];

    protected function casts(): array
    {
        return [
            'poliza_id' => 'integer',
            'tarifario_apov_id' => 'integer',
            'suma_muerte_accidental' => 'decimal:2',
            'suma_invalidez' => 'decimal:2',
            'suma_medicos' => 'decimal:2',
            'suma_funerarios' => 'decimal:2',
        ];
    }

    public function poliza(): BelongsTo
    {
        return $this->belongsTo(Poliza::class, 'poliza_id');
    }

    public function tarifario(): BelongsTo
    {
        return $this->belongsTo(TarifarioApov::class, 'tarifario_apov_id');
    }
}
