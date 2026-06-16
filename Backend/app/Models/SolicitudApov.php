<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitudApov extends Model
{
    protected $table = 'solicitud_apov';
    public $timestamps = false;

    protected $fillable = [
        'vehiculo_id',
        'plan_muerte_accidental',
        'plan_invalidez',
        'plan_medicos',
        'plan_funerarios',
    ];

    protected function casts(): array
    {
        return [
            'vehiculo_id' => 'integer',
        ];
    }

    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(Vehiculo::class, 'vehiculo_id');
    }
}
