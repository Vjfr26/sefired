<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Una sesión activa de un usuario en un dispositivo. Ver migración
 * create_sesiones_table y [[ApiTokenMiddleware]].
 */
class Sesion extends Model
{
    protected $table = 'sesiones';

    // `created_at` se gestiona como ancla del tope absoluto; no hay updated_at.
    public $timestamps = false;

    protected $fillable = [
        'usuario_id',
        'token_hash',
        'device_fingerprint',
        'user_agent',
        'ip_inicial',
        'ip',
        'created_at',
        'ultimo_visto',
        'expira_en',
    ];

    protected function casts(): array
    {
        return [
            'device_fingerprint' => 'array',
            'created_at'         => 'datetime',
            'ultimo_visto'       => 'datetime',
            'expira_en'          => 'datetime',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
