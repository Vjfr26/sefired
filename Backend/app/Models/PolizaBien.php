<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Asociación entre una póliza y uno de los bienes que cubre.
 * Ver comentario en la migración create_poliza_bienes_table para el
 * significado de certificado=NULL (bien original/único de la póliza).
 */
class PolizaBien extends Model
{
    protected $table = 'poliza_bienes';

    protected $fillable = [
        'poliza_id',
        'bien_asegurado_id',
        'certificado',
        'cobertura_dolares',
        'cobertura_bs',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'poliza_id'         => 'integer',
            'bien_asegurado_id' => 'integer',
            'cobertura_dolares' => 'decimal:2',
            'cobertura_bs'      => 'decimal:2',
            'created_by'        => 'integer',
        ];
    }

    public function poliza(): BelongsTo
    {
        return $this->belongsTo(Poliza::class, 'poliza_id');
    }

    public function bien(): BelongsTo
    {
        return $this->belongsTo(BienAsegurado::class, 'bien_asegurado_id');
    }
}
