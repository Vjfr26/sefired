<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'modelo_vehiculo_id',
        'tipo',
        'uso',
        'clase',
        'anio',
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
            'cliente_id' => 'integer',
            'modelo_vehiculo_id' => 'integer',
            'fecha_adquisicion' => 'date',
            'anio' => 'integer',
            'peso' => 'integer',
            'puestos' => 'integer',
        ];
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function modeloVehiculo(): BelongsTo
    {
        return $this->belongsTo(ModeloVehiculo::class, 'modelo_vehiculo_id');
    }

    public function conductores(): HasMany
    {
        return $this->hasMany(Conductor::class, 'vehiculo_id');
    }

    public function tomadores(): HasMany
    {
        return $this->hasMany(Tomador::class, 'vehiculo_id');
    }
}
