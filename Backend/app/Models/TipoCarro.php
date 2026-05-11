<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoCarro extends Model
{
    protected $table = 'tipos_carros';
    public $timestamps = false;

    protected $fillable = [
        'tipo_carro',
        'grupo',
        'contexto',
    ];

    public function scopeGeneral($query)
    {
        return $query->where('contexto', 'general');
    }

    public function scopeEcep($query)
    {
        return $query->where('contexto', 'ecep');
    }
}
