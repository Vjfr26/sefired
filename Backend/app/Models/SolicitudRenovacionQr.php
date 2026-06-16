<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitudRenovacionQr extends Model
{
    protected $table = 'solicitudes_renovacion_qr';

    protected $fillable = [
        'poliza_id', 'nro_contrato',
        'nombre', 'telefono', 'correo',
        'pagos', 'total_usd_estimado',
        'status', 'nota_agente', 'procesado_por',
    ];

    protected $casts = [
        'pagos'               => 'array',
        'total_usd_estimado'  => 'float',
    ];

    public function poliza(): BelongsTo
    {
        return $this->belongsTo(Poliza::class, 'poliza_id');
    }

    public function procesadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'procesado_por');
    }
}
