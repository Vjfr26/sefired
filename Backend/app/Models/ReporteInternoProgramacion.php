<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReporteInternoProgramacion extends Model
{
    protected $table = 'reportes_internos_programaciones';

    protected $fillable = ['nombre', 'hora', 'activo'];

    protected function casts(): array
    {
        return ['activo' => 'boolean'];
    }

    public function destinatarios(): HasMany
    {
        return $this->hasMany(ReporteInternoDestinatario::class, 'programacion_id');
    }
}
