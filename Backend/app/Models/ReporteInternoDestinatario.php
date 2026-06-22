<?php

namespace App\Models;

use App\Models\Concerns\HasFrecuenciaEnvio;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReporteInternoDestinatario extends Model
{
    use HasFrecuenciaEnvio;

    protected $table = 'reportes_internos_destinatarios';

    protected $fillable = ['programacion_id', 'email', 'frecuencia', 'activo', 'ultimo_envio'];

    protected function casts(): array
    {
        return [
            'activo'       => 'boolean',
            'ultimo_envio' => 'datetime',
        ];
    }

    public function programacion(): BelongsTo
    {
        return $this->belongsTo(ReporteInternoProgramacion::class, 'programacion_id');
    }
}
