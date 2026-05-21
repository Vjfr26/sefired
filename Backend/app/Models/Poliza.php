<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

<<<<<<< HEAD
=======
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
>>>>>>> origin/victor
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
<<<<<<< HEAD
            'solicitud_id' => 'integer',
            'producto_id' => 'integer',
            'vendedor_id' => 'integer',
            'total' => 'decimal:2',
            'total_bs' => 'decimal:2',
            'cobertura_dolares' => 'decimal:2',
            'cobertura_bs' => 'decimal:2',
            'fecha_emision' => 'date',
=======
            'solicitud_id'      => 'integer',
            'producto_id'       => 'integer',
            'vendedor_id'       => 'integer',
            'total'             => 'decimal:2',
            'total_bs'          => 'decimal:2',
            'cobertura_dolares' => 'decimal:2',
            'cobertura_bs'      => 'decimal:2',
            'fecha_emision'     => 'date',
>>>>>>> origin/victor
            'fecha_vencimiento' => 'date',
        ];
    }

<<<<<<< HEAD
=======
    /** Solicitud que originó esta póliza (contiene el cliente y el vehículo) */
>>>>>>> origin/victor
    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(Solicitud::class, 'solicitud_id');
    }

<<<<<<< HEAD
=======
    /** Producto/cobertura contratado (APOV, RCV, HCM, etc.) */
>>>>>>> origin/victor
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

<<<<<<< HEAD
=======
    /** Vendedor que emitió la póliza (puede ser null si fue importada) */
>>>>>>> origin/victor
    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'vendedor_id');
    }
<<<<<<< HEAD

    public function polizaApov()
    {
        return $this->hasOne(PolizaApov::class, 'poliza_id', 'id');
    }

    public function polizaRcv()
    {
        return $this->hasOne(PolizaRcv::class, 'poliza_id', 'id');
    }

    public function polizaEcEp()
    {
        return $this->hasOne(PolizaEcEp::class, 'poliza_id', 'id');
    }
=======
>>>>>>> origin/victor
}
