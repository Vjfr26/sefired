<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

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
 *   $poliza->solicitud->persona
 */
class Poliza extends Model
{
    use SoftDeletes;

    protected $table = 'poliza';
    public $timestamps = false;

    protected $fillable = [
        'nro_contrato',
        'solicitud_id',
        'producto_id',
        'total',
        'total_bs',
        'tasa_emision',
        'tasa_emision_eur',
        'cobertura_dolares',
        'cobertura_bs',
        'pago',
        'frecuencia_pago',
        'moneda',
        'tipo',
        'asegurado_nombre',
        'asegurado_ci',
        'fecha_emision',
        'fecha_vencimiento',
        'nro_venezolana',
        'papeleria',
        'vendedor_id',
        'sede_poliza',
        'status',
        'created_by',
        'updated_by',
        'snapshot_datos',
        'tarifario_version_id',
    ];

    protected function casts(): array
    {
        return [
            'solicitud_id'         => 'integer',
            'producto_id'          => 'integer',
            'vendedor_id'          => 'integer',
            'total'                => 'decimal:2',
            'total_bs'             => 'decimal:2',
            'tasa_emision'         => 'decimal:4',
            'tasa_emision_eur'     => 'decimal:4',
            'cobertura_dolares'    => 'decimal:2',
            'cobertura_bs'         => 'decimal:2',
            'fecha_emision'        => 'date',
            'fecha_vencimiento'    => 'date',
            'snapshot_datos'       => 'array',
            'tarifario_version_id' => 'integer',
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

    /** Facturas emitidas contra esta póliza */
    public function facturas(): HasMany
    {
        return $this->hasMany(Factura::class, 'poliza_id');
    }

    /** Beneficiarios registrados para pólizas de vida/muerte/accidente */
    public function beneficiarios(): HasMany
    {
        return $this->hasMany(Beneficiario::class, 'poliza_id');
    }

    /**
     * Bienes cubiertos por esta póliza (el original de la solicitud + los
     * agregados después). Ver App\Models\PolizaBien.
     */
    public function bienes(): HasMany
    {
        return $this->hasMany(PolizaBien::class, 'poliza_id');
    }

    /**
     * Bienes ADICIONALES (más allá del original de la solicitud, que no
     * tiene certificado propio) — usado por el cuadro póliza para mostrar
     * la sección "Bienes Adicionales" solo cuando aplica.
     * Requiere `bienes.bien` precargado para no disparar más queries.
     */
    public function bienesAdicionales()
    {
        return $this->bienes->filter(fn($pb) => $pb->certificado !== null);
    }

    /**
     * Número de recibo real (el de la factura asociada), distinto del
     * número de contrato de la póliza. Requiere `facturas` precargado.
     */
    public function numeroRecibo(): string
    {
        return $this->facturas->sortBy('id')->first()?->numero ?? $this->nro_contrato;
    }

    /**
     * true si esta póliza reemplazó a una anterior de la misma solicitud
     * (la anterior queda en status='RENOVADA') — para mostrar "RENOVACIÓN"
     * en vez de "EMISIÓN / ALTA" en el cuadro póliza.
     */
    public function esRenovacion(): bool
    {
        return (bool) ($this->solicitud_id && self::where('solicitud_id', $this->solicitud_id)
            ->where('id', '<', $this->id)
            ->where('status', 'RENOVADA')
            ->exists());
    }
}
