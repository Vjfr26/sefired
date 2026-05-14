<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tomador extends Model
{
    protected $table = 'tomador';
    public $timestamps = false;

    protected $fillable = [
        'persona_id',
        'vehiculo_id',
        'copia',
    ];

    protected function casts(): array
    {
        return [
            'persona_id' => 'integer',
            'vehiculo_id' => 'integer',
        ];
    }

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class, 'persona_id');
    }

    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(Vehiculo::class, 'vehiculo_id');
    }
}
