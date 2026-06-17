<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class BienAsegurado extends Model
{
    use SoftDeletes;

    protected $table = 'bien_asegurado';

    protected $fillable = [
        'persona_id',
        'tipo',
        'atributos',
        'valor_declarado',
        'descripcion',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'persona_id'      => 'integer',
            'atributos'       => 'array',
            'valor_declarado' => 'decimal:2',
            'created_by'      => 'integer',
        ];
    }

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class, 'persona_id');
    }

    public function roles(): HasMany
    {
        return $this->hasMany(BienPersonaRol::class, 'bien_asegurado_id');
    }

    public function solicitudes(): HasMany
    {
        return $this->hasMany(Solicitud::class, 'bien_asegurado_id');
    }

    /** Personas con un rol específico sobre este bien */
    public function personas(string $rol): HasMany
    {
        return $this->hasMany(BienPersonaRol::class, 'bien_asegurado_id')
                    ->where('rol', $rol);
    }
}
