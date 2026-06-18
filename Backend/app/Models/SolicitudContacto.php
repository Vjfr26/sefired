<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SolicitudContacto extends Model
{
    protected $table = 'solicitudes_contacto';

    protected $fillable = [
        'email', 'motivo', 'destino', 'status', 'ip',
    ];

    /** Motivos válidos que el cliente puede elegir en el chatbot. */
    public const MOTIVOS = ['cotizar', 'poliza', 'siniestro', 'tecnico'];

    /** A qué tipo de personal interno se dirige cada motivo. */
    public static function destinoParaMotivo(string $motivo): string
    {
        return $motivo === 'tecnico' ? 'tecnico' : 'asesor';
    }
}
