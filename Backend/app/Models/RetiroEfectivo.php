<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Marca si el efectivo cobrado por una oficina, en una forma de pago y
 * período determinados, ya fue retirado físicamente — con notas y el
 * documento de entrega adjunto.
 */
class RetiroEfectivo extends Model
{
    protected $table = 'retiro_efectivo';

    protected $fillable = [
        'sede',
        'forma_pago',
        'fecha_inicio',
        'fecha_fin',
        'retirado',
        'notas',
        'documento_path',
        'documento_nombre',
        'usuario_id',
        'fecha_marcado',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio'  => 'date',
            'fecha_fin'     => 'date',
            'retirado'      => 'boolean',
            'usuario_id'    => 'integer',
            'fecha_marcado' => 'datetime',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
