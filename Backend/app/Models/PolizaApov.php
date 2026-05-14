<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PolizaApov extends Model
{
    protected $table = 'poliza_apov';
    public $timestamps = false;

    protected $fillable = [
        'vehiculo_id',
        'suma_muerte_accidental',
        'suma_invalidez',
        'suma_medicos',
        'suma_funerarios',
    ];

    protected function casts(): array
    {
        return [
            'vehiculo_id' => 'integer',
            'suma_muerte_accidental' => 'decimal:2',
            'suma_invalidez' => 'decimal:2',
            'suma_medicos' => 'decimal:2',
            'suma_funerarios' => 'decimal:2',
        ];
    }

    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(Vehiculo::class, 'vehiculo_id');
    }
}
