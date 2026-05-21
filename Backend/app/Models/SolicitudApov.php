<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitudApov extends Model
{
    protected $table = 'solicitud_apov';
<<<<<<< HEAD
    protected $primaryKey = 'solicitud_id';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'solicitud_id',
        'plan_elegido',
=======
    public $timestamps = false;

    protected $fillable = [
        'vehiculo_id',
        'plan_muerte_accidental',
        'plan_invalidez',
        'plan_medicos',
        'plan_funerarios',
>>>>>>> origin/victor
    ];

    protected function casts(): array
    {
        return [
<<<<<<< HEAD
            'solicitud_id' => 'integer',
        ];
    }

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(Solicitud::class, 'solicitud_id');
=======
            'vehiculo_id' => 'integer',
        ];
    }

    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(Vehiculo::class, 'vehiculo_id');
>>>>>>> origin/victor
    }
}
