<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReporteInternoProgramacion extends Model
{
    protected $table = 'reportes_internos_programaciones';

    protected $fillable = ['nombre', 'hora', 'tipo', 'activo', 'documentos_adicionales', 'cliente_documento_ids'];

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
        return $this->hasMany(ReporteInternoDestinatario::class, 'programacion_id');
    }
}
