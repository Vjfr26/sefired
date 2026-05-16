<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Solicitud;

/**
 * Representa un vehículo registrado en el sistema.
 *
 * Un vehículo siempre pertenece a un cliente (el propietario) y puede tener
 * múltiples conductores autorizados y tomadores de seguro asociados.
 *
 * El estado del vehículo (Activo/Inactivo) no es un campo de la base de datos:
 * se calcula en tiempo real mirando si existe alguna póliza con status='ACTIVA'
 * vinculada a su placa a través de la cadena solicitud → poliza.
 *
 * Las solicitudes de seguro se relacionan por la placa (no por el ID del vehículo)
 * porque históricamente los sistemas de seguros en Venezuela identifican los contratos
 * por placa, no por el vehículo como entidad interna.
 */
class Vehiculo extends Model
{
    protected $table = 'vehiculo';
    public $timestamps = false;

    protected $fillable = [
        'cliente_id',
        'placa',
        'fecha_adquisicion',
        'certificado_transito',
        'certificado_origen',
        'marca',
        'modelo',
        'clase',
        'tipo',
        'anio',
        'uso',
        'color',
        'peso',
        'puestos',
        'aparcamiento',
        'serial_carroceria',
        'serial_motor',
        'titulo',
    ];

    protected function casts(): array
    {
        return [
            'cliente_id'       => 'integer',
            'fecha_adquisicion' => 'date',
            'anio'             => 'integer',
            'peso'             => 'integer',
            'puestos'          => 'integer',
        ];
    }

    /** El cliente propietario del vehículo (dueño registrado) */
    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    /**
     * Solicitudes de seguro asociadas a esta placa.
     * La relación es por placa (string), no por ID, porque las pólizas
     * se identifican por la placa en el sistema de seguros venezolano.
     */
    public function solicitudes(): HasMany
    {
        return $this->hasMany(Solicitud::class, 'placa', 'placa');
    }

    /** Conductores autorizados que pueden manejar este vehículo */
    public function conductores(): HasMany
    {
        return $this->hasMany(Conductor::class, 'vehiculo_id');
    }

    /** Tomadores del seguro (persona que paga la póliza, puede ser distinta al propietario) */
    public function tomadores(): HasMany
    {
        return $this->hasMany(Tomador::class, 'vehiculo_id');
    }
}
