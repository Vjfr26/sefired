<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PolizaRcv extends Model
{
    protected $table = 'poliza_rcv';
<<<<<<< HEAD
    protected $primaryKey = 'poliza_id';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'poliza_id',
        'tarifario_rcv_id',
=======
    public $timestamps = false;

    protected $fillable = [
        'vehiculo_id',
>>>>>>> origin/victor
        'suma_persona',
        'prima_persona',
        'suma_cosa',
        'prima_cosa',
    ];

    protected function casts(): array
    {
        return [
<<<<<<< HEAD
            'poliza_id' => 'integer',
            'tarifario_rcv_id' => 'integer',
=======
            'vehiculo_id' => 'integer',
>>>>>>> origin/victor
            'suma_persona' => 'decimal:2',
            'prima_persona' => 'decimal:2',
            'suma_cosa' => 'decimal:2',
            'prima_cosa' => 'decimal:2',
        ];
    }

<<<<<<< HEAD
    public function poliza(): BelongsTo
    {
        return $this->belongsTo(Poliza::class, 'poliza_id');
    }

    public function tarifario(): BelongsTo
    {
        return $this->belongsTo(TarifarioRcv::class, 'tarifario_rcv_id');
=======
    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(Vehiculo::class, 'vehiculo_id');
>>>>>>> origin/victor
    }
}
