<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Representa una póliza de seguro emitida.
 *
 * Ciclo de vida del status:
 *   ACTIVA → póliza vigente dentro de su fecha de vencimiento
 *   VENCIDA → superó fecha_vencimiento sin renovarse
 *   ANULADA → cancelada antes del vencimiento
 *
 * Los montos se almacenan en dos monedas:
 *   total / cobertura_dolares → USD (referencia principal)
 *   total_bs / cobertura_bs   → Bolívares (calculado con la tasa del día de emisión)
 *
 * Ruta hasta el cliente dueño de esta póliza:
 *   $poliza->solicitud->cliente->persona
 */
class Poliza extends Model
{
    protected $table = 'poliza';
    public $timestamps = false;

    protected $fillable = [
        'nro_contrato',
        'solicitud_id',
        'producto_id',
        'total',
        'total_bs',
        'cobertura_dolares',
        'cobertura_bs',
        'pago',
        'tipo',
        'fecha_emision',
        'fecha_vencimiento',
        'papeleria',
        'vendedor_id',
        'sede_poliza',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'solicitud_id'      => 'integer',
            'producto_id'       => 'integer',
            'vendedor_id'       => 'integer',
            'total'             => 'decimal:2',
            'total_bs'          => 'decimal:2',
            'cobertura_dolares' => 'decimal:2',
            'cobertura_bs'      => 'decimal:2',
            'fecha_emision'     => 'date',
            'fecha_vencimiento' => 'date',
        ];
    }

    /** Solicitud que originó esta póliza (contiene el cliente y el vehículo) */
    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(Solicitud::class, 'solicitud_id');
    }

    /** Producto/cobertura contratado (APOV, RCV, HCM, etc.) */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    /** Vendedor que emitió la póliza (puede ser null si fue importada) */
    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'vendedor_id');
    }
}
