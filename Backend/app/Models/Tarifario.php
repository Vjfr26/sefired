<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tarifario extends Model
{
    protected $table = 'tarifario';

    protected $fillable = [
        'producto_id',
        'nombre',
        'subtipo',
        'datos',
        'activo',
        'version',
        'vigencia_desde',
        'vigencia_hasta',
        'parent_id',
        'estado',
        'creado_por',
    ];

    protected function casts(): array
    {
        return [
            'producto_id'    => 'integer',
            'datos'          => 'array',
            'activo'         => 'boolean',
            'version'        => 'integer',
            'vigencia_desde' => 'date',
            'vigencia_hasta' => 'date',
            'parent_id'      => 'integer',
            'creado_por'     => 'integer',
        ];
    }

    /** Versión anterior (de la que se derivó esta versión). */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Tarifario::class, 'parent_id');
    }

    /** Historial de versiones posteriores a esta tarifa. */
    public function versiones(): HasMany
    {
        return $this->hasMany(Tarifario::class, 'parent_id');
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function solicitudes(): HasMany
    {
        return $this->hasMany(Solicitud::class, 'tarifario_id');
    }
}
