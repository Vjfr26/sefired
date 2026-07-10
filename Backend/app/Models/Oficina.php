<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Oficina/sede de la empresa. `codigo` es el dígito (1-9) que ocupa la
 * primera posición del código de póliza — ver CodigoPoliza. `nombre` es el
 * texto que se guarda en usuarios.sede y poliza.sede_poliza.
 */
class Oficina extends Model
{
    protected $table = 'oficina';

    protected $fillable = [
        'nombre',
        'codigo',
    ];

    protected function casts(): array
    {
        return [
            'codigo' => 'integer',
        ];
    }
}
