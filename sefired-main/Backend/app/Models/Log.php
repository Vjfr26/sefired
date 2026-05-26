<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Log extends Model
{
    protected $table = 'logs';

    protected $fillable = [
        'usuario_id',
        'accion',
        'tabla',
        'descripcion',
        'ip',
        'user_agent',
    ];

    public function usuario(): BelongsTo
    {
        // Se relaciona con el usuario que realizó la acción
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
