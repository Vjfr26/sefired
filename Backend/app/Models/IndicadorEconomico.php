<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

<<<<<<< HEAD
=======
/**
 * Almacena indicadores económicos del sistema (tasas BCV y unidad tributaria).
 *
 * Tipos de registro:
 *   tipo = 'tasa_cambio'      → tasa de cambio BCV; moneda = 'USD' o 'EUR'
 *   tipo = 'unidad_tributaria' → valor de la UT; moneda = null
 *
 * La unicidad (tipo + moneda + fecha) previene duplicar la tasa del mismo día.
 */
>>>>>>> origin/victor
class IndicadorEconomico extends Model
{
    protected $table = 'indicador_economico';
    public $timestamps = false;

    protected $fillable = [
        'tipo',
<<<<<<< HEAD
=======
        'moneda',
        'fecha',
>>>>>>> origin/victor
        'valor',
    ];

    protected function casts(): array
    {
        return [
<<<<<<< HEAD
            'valor' => 'decimal:4',
            'fecha_registro' => 'datetime',
        ];
    }

=======
            'valor'           => 'decimal:4',
            'fecha'           => 'date',
            'fecha_registro'  => 'datetime',
        ];
    }

    /** Registros de tasa de cambio BCV (USD y EUR) */
>>>>>>> origin/victor
    public function scopeTasaCambio($query)
    {
        return $query->where('tipo', 'tasa_cambio');
    }

<<<<<<< HEAD
=======
    /** Registros de tasa USD específicamente */
    public function scopeUsd($query)
    {
        return $query->where('tipo', 'tasa_cambio')->where('moneda', 'USD');
    }

    /** Registros de tasa EUR específicamente */
    public function scopeEur($query)
    {
        return $query->where('tipo', 'tasa_cambio')->where('moneda', 'EUR');
    }

    /** Unidad Tributaria */
>>>>>>> origin/victor
    public function scopeUnidadTributaria($query)
    {
        return $query->where('tipo', 'unidad_tributaria');
    }
}
