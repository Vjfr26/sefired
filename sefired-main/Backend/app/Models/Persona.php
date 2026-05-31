<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Persona extends Model
{
    use SoftDeletes;

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
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'nacimiento'     => 'date',
            'fecha_creacion' => 'datetime',
            'activo'         => 'boolean',
        ];
    }

    public function solicitudes(): HasMany
    {
        return $this->hasMany(Solicitud::class, 'persona_id');
    }

    public function bienes(): HasMany
    {
        return $this->hasMany(BienAsegurado::class, 'persona_id');
    }

    public function documentos(): HasMany
    {
        return $this->hasMany(ClienteDocumento::class, 'persona_id');
    }
}
