<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OficinaRetiroCaja extends Model
{
    protected $table = 'oficina_retiros_caja';

    protected $fillable = [
        'sede',
        'monto_bs',
        'monto_usd',
        'monto_eur',
        'observaciones',
        'usuario_id',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
