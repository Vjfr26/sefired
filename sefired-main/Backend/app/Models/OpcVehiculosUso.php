<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OpcVehiculosUso extends Model
{
    protected $table = 'opc_vehiculos_uso';
    public $timestamps = false;

    protected $fillable = [
        'id_empresa',
        'uso',
        'activo',
        'eliminado',
    ];

    protected function casts(): array
    {
        return [
            'id_empresa' => 'integer',
            'fecha_registro' => 'datetime',
        ];
    }
}
