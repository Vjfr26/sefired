<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rcv extends Model
{
    protected $table = 'rcv';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'producto',
        'categoria',
        'dependencia',
        'tasa_cosa',
        'tasa_personas',
        'tasa_prima',
        'suma_persona',
        'suma_cosa',
        'suma_prima',
        'prima_anual',
    ];

    protected function casts(): array
    {
        return [
            'tasa_cosa' => 'decimal:4',
            'tasa_personas' => 'decimal:4',
            'tasa_prima' => 'decimal:4',
            'suma_persona' => 'decimal:2',
            'suma_cosa' => 'decimal:2',
            'suma_prima' => 'decimal:2',
            'prima_anual' => 'decimal:2',
        ];
    }
}
