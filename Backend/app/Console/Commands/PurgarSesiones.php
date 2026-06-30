<?php

namespace App\Console\Commands;

use App\Models\Sesion;
use Illuminate\Console\Command;

/**
 * Elimina las sesiones expiradas — por inactividad (`expira_en` pasado) o por
 * tope absoluto (creadas hace más de auth.token.absolute_hours). Mantiene la
 * tabla `sesiones` acotada (~número de usuarios activos). Pensado para correr
 * cada hora desde el scheduler.
 */
class PurgarSesiones extends Command
{
    protected $signature = 'sesiones:purgar';

    protected $description = 'Elimina sesiones expiradas (inactividad o tope absoluto).';

    public function handle(): int
    {
        $absoluteHours = (int) config('auth.token.absolute_hours', 12);

        $n = Sesion::where('expira_en', '<', now())
            ->orWhere('created_at', '<', now()->subHours($absoluteHours))
            ->delete();

        $this->info("Sesiones purgadas: {$n}");

        return self::SUCCESS;
    }
}
