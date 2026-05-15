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
        Log::create([
            'usuario_id' => $usuarioId ?? (auth()->id() ?? null),
            'accion' => $accion,
            'tabla' => $tabla,
            'descripcion' => $descripcion,
            'ip' => Request::ip(),
        ]);
    }
}
