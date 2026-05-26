<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IpBloqueada extends Model
{
    protected $table = 'ip_bloqueada';
    public $timestamps = false;

    protected $fillable = ['ip', 'usuario_id', 'motivo'];
}
