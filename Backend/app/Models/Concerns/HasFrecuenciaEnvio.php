<?php

namespace App\Models\Concerns;

use Carbon\Carbon;

/**
 * Lógica compartida por los destinatarios de reportes (externos e internos)
 * para decidir si ya les corresponde recibir un nuevo envío, según su propia
 * frecuencia y la hora configurada en la programación a la que pertenecen.
 */
trait HasFrecuenciaEnvio
{
    /**
     * @param string $hora Hora configurada en la programación, formato "HH:MM".
     */
    public function estaPendiente(string $hora): bool
    {
        $ahora = now();

        // Antes de la hora programada del día, todavía no le toca a nadie.
        if ($ahora->format('H:i') < $hora) {
            return false;
        }

        if (!$this->ultimo_envio) {
            return true;
        }

        $ultimo = Carbon::parse($this->ultimo_envio);

        return match ($this->frecuencia) {
            'diario'      => !$ultimo->isToday(),
            'semanal'     => $ultimo->diffInDays($ahora) >= 7,
            'mensual'     => $ultimo->diffInMonthsPrecise($ahora) >= 1,
            'trimestral'  => $ultimo->diffInMonthsPrecise($ahora) >= 3,
            default       => !$ultimo->isToday(),
        };
    }
}
