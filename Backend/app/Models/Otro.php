<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Otro extends Model
{
    protected $table = 'otros';
    public $timestamps = false;

    protected $fillable = [
        'nombre_producto',
        'tipo_carro',
        'tasa',
        'tasa_cobertura',
        'suma_cobertura',
        'suma_diamante',
        'prima_diamante',
        'suma_total',
        'prima',
    ];

    protected function casts(): array
    {
        return [
            'tasa' => 'decimal:4',
            'tasa_cobertura' => 'decimal:4',
            'suma_cobertura' => 'decimal:2',
            'suma_diamante' => 'decimal:2',
            'prima_diamante' => 'decimal:2',
            'suma_total' => 'decimal:2',
            'prima' => 'decimal:2',
        ];
    }
}
