<?php

namespace App\Traits;

use App\Models\Log;
use Illuminate\Support\Facades\Request;

trait LogsActivity
{
    /**
     * Registra una acción en la tabla de logs.
     *
     * @param string $accion Nombre de la acción (ej: 'login', 'create_user')
     * @param string $descripcion Detalle de lo que ocurrió
     * @param string|null $tabla Nombre de la tabla afectada (opcional)
     * @param int|null $usuarioId ID del usuario que realiza la acción (opcional, intenta tomar el actual)
     * @return void
     */
    public function logActivity(string $accion, string $descripcion, ?string $tabla = null, ?int $usuarioId = null)
    {
        $fingerprint = null;
        $raw = Request::header('X-Device-Fingerprint');
        if ($raw) {
            $decoded = json_decode($raw, true);
            $fingerprint = is_array($decoded) ? $decoded : null;
        }

        Log::create([
            'usuario_id'         => $usuarioId ?? (auth()->id() ?? null),
            'accion'             => $accion,
            'tabla'              => $tabla,
            'descripcion'        => $descripcion,
            'ip'                 => Request::ip(),
            'user_agent'         => Request::header('User-Agent'),
            'device_fingerprint' => $fingerprint,
        ]);
    }
}
