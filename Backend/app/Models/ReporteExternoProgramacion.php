<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReporteExternoProgramacion extends Model
{
    protected $table = 'reportes_externos_programaciones';

    protected $fillable = ['nombre', 'hora', 'activo', 'documentos_adicionales', 'cliente_documento_ids'];

    protected function casts(): array
    {
        return [
            'activo'                 => 'boolean',
            'documentos_adicionales' => 'array',
            'cliente_documento_ids'  => 'array',
        ];
    }

    public function destinatarios(): HasMany
    {
        return $this->hasMany(ReporteExternoDestinatario::class, 'programacion_id');
    }
}
