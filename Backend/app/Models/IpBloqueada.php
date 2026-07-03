<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IpBloqueada extends Model
{
    protected $table = 'ip_bloqueada';
    public $timestamps = false;

    protected $fillable = ['ip', 'usuario_id', 'motivo'];

    /**
     * Usuario asociado al bloqueo (el que fue bloqueado o cuyo login originó
     * el bloqueo de IP). El endpoint getIpsBloqueadas hace eager-load de esta
     * relación; sin ella, listar IPs bloqueadas lanzaba RelationNotFoundException
     * (500) y el panel mostraba "No hay ninguna IP bloqueada".
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
