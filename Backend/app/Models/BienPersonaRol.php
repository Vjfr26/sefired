<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BienPersonaRol extends Model
{
    protected $table = 'bien_persona_rol';
    public $timestamps = false;

    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    protected $fillable = [
        'bien_asegurado_id',
        'persona_id',
        'rol',
        'datos',
    ];

    protected function casts(): array
    {
        return [
            'bien_asegurado_id' => 'integer',
            'persona_id'        => 'integer',
            'datos'             => 'array',
        ];
    }

    public function bien(): BelongsTo
    {
        return $this->belongsTo(BienAsegurado::class, 'bien_asegurado_id');
    }

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class, 'persona_id');
    }
}
