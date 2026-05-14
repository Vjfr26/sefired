<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IndicadorEconomico extends Model
{
    protected $table = 'indicador_economico';
    public $timestamps = false;

    protected $fillable = [
        'tipo',
        'valor',
    ];

    protected function casts(): array
    {
        return [
            'valor' => 'decimal:4',
            'fecha_registro' => 'datetime',
        ];
    }

    public function scopeTasaCambio($query)
    {
        return $query->where('tipo', 'tasa_cambio');
    }

    public function scopeUnidadTributaria($query)
    {
        return $query->where('tipo', 'unidad_tributaria');
    }
}
