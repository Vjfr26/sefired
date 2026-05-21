<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PolizaApov extends Model
{
    protected $table = 'poliza_apov';
<<<<<<< HEAD
    protected $primaryKey = 'poliza_id';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'poliza_id',
        'tarifario_apov_id',
=======
    public $timestamps = false;

    protected $fillable = [
        'vehiculo_id',
>>>>>>> origin/victor
        'suma_muerte_accidental',
        'suma_invalidez',
        'suma_medicos',
        'suma_funerarios',
    ];

    protected function casts(): array
    {
        return [
<<<<<<< HEAD
            'poliza_id' => 'integer',
            'tarifario_apov_id' => 'integer',
=======
            'vehiculo_id' => 'integer',
>>>>>>> origin/victor
            'suma_muerte_accidental' => 'decimal:2',
            'suma_invalidez' => 'decimal:2',
            'suma_medicos' => 'decimal:2',
            'suma_funerarios' => 'decimal:2',
        ];
    }

<<<<<<< HEAD
    public function poliza(): BelongsTo
    {
        return $this->belongsTo(Poliza::class, 'poliza_id');
    }

    public function tarifario(): BelongsTo
    {
        return $this->belongsTo(TarifarioApov::class, 'tarifario_apov_id');
=======
    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(Vehiculo::class, 'vehiculo_id');
>>>>>>> origin/victor
    }
}
