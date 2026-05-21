<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

<<<<<<< HEAD
=======
/**
 * Representa el rol "cliente" dentro del sistema.
 *
 * El modelo es intencionalmente delgado: la información personal
 * (nombre, cédula, teléfono, correo…) vive en Persona para poder
 * reutilizarla en otros roles como Tomador o Conductor sin duplicar datos.
 *
 * El campo `activo` permite que un administrador desactive manualmente un cliente
 * sin borrar sus datos ni sus pólizas. Un cliente desactivado aparece como
 * "Bloqueado" en el panel y no puede operar, independientemente del estado
 * de sus pólizas.
 *
 * Cadena de relaciones para consultar pólizas de un cliente:
 *   $cliente->solicitudes->flatMap->polizas
 */
>>>>>>> origin/victor
class Cliente extends Model
{
    protected $table = 'cliente';
    public $timestamps = false;

    protected $fillable = [
        'persona_id',
<<<<<<< HEAD
=======
        'activo',
>>>>>>> origin/victor
    ];

    protected function casts(): array
    {
        return [
            'persona_id' => 'integer',
<<<<<<< HEAD
        ];
    }

=======
            'activo'     => 'boolean',   // se guarda como tinyint(1) en MySQL
        ];
    }

    /** Datos personales del cliente (nombre, cédula, teléfono, correo, etc.) */
>>>>>>> origin/victor
    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class, 'persona_id');
    }

<<<<<<< HEAD
=======
    /** Vehículos asegurados registrados a nombre de este cliente */
>>>>>>> origin/victor
    public function vehiculos(): HasMany
    {
        return $this->hasMany(Vehiculo::class, 'cliente_id');
    }

<<<<<<< HEAD
=======
    /**
     * Solicitudes de seguro del cliente.
     * Cada solicitud puede derivar en una o varias pólizas.
     */
>>>>>>> origin/victor
    public function solicitudes(): HasMany
    {
        return $this->hasMany(Solicitud::class, 'cliente_id');
    }
}
