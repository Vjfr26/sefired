<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TarifarioEcEp extends Model
{
    protected $table = 'tarifario_ec_ep';
    public $timestamps = false;

    protected $fillable = [
        'nombre_producto',
        'tipo_carro',
        'tasa',
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
            'tasa' => 'decimal:4',
            'suma_cobertura' => 'decimal:2',
            'prima_cobertura' => 'decimal:2',
            'suma_total' => 'decimal:2',
            'suma_plata' => 'decimal:2',
            'prima_plata' => 'decimal:2',
            'suma_oro' => 'decimal:2',
            'prima_oro' => 'decimal:2',
        ];
    }
}
