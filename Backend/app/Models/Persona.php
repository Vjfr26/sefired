<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Persona extends Model
{
    protected $table = 'persona';
    public $timestamps = false;

    protected $fillable = [
        'cedula',
        'nombre',
        'telefono',
        'celular',
        'correo',
        'direccion',
        'codigo_postal',
        'nacionalidad',
        'estado',
        'ciudad',
        'nacimiento',
        'sexo',
        'condicion',
        'profesion',
        'actividad',
        'archivo',
    ];

    protected function casts(): array
    {
        return [
            'nacimiento' => 'date',
            'fecha_creacion' => 'datetime',
        ];
    }

    public function cliente(): HasOne
    {
        return $this->hasOne(Cliente::class, 'persona_id');
    }
}
