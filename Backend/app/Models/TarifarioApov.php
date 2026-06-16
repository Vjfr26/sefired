<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TarifarioApov extends Model
{
    protected $table = 'tarifario_apov';

    protected $fillable = [
        'tipo_carro',
        'cobertura',
        'plan',
        'suma_asegurada',
        'prima',
    ];

    protected function casts(): array
    {
        return [
            'suma_asegurada' => 'decimal:2',
            'prima' => 'decimal:2',
        ];
    }
}
