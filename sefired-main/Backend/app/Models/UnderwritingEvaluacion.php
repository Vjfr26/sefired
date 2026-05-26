<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UnderwritingEvaluacion extends Model
{
    protected $table = 'underwriting_evaluaciones';

    protected $fillable = [
        'solicitud_id',
        'evaluador_id',
        'tipo',
        'resultado',
        'score',
        'observaciones',
        'motivo_rechazo',
        'requiere_inspeccion',
        'reglas_aplicadas',
        'fecha_evaluacion',
    ];

    protected function casts(): array
    {
        return [
            'solicitud_id'        => 'integer',
            'evaluador_id'        => 'integer',
            'score'               => 'float',
            'requiere_inspeccion' => 'boolean',
            'reglas_aplicadas'    => 'array',
            'fecha_evaluacion'    => 'datetime',
        ];
    }

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(Solicitud::class, 'solicitud_id');
    }

    public function evaluador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'evaluador_id');
    }
}
