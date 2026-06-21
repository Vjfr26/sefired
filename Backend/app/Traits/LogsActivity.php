<?php

namespace App\Traits;

use App\Models\Log;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

trait LogsActivity
{
    /**
     * Captura los valores ANTES de guardar — debe llamarse antes de
     * $model->update()/save(). Tras guardar, Eloquent sincroniza
     * getOriginal() con los valores nuevos, así que esa foto hay que
     * tomarla con anticipación.
     */
    protected function snapshotAntes(Model $model): array
    {
        return $model->getAttributes();
    }

    /**
     * Describe qué campos cambiaron en un modelo recién guardado, en
     * formato "campo: antes → después", para que la auditoría diga
     * exactamente qué se modificó en vez de solo "se actualizó X".
     * Llamar DESPUÉS de $model->update()/save(), pasando el snapshot
     * tomado con snapshotAntes() ANTES de guardar.
     */
    protected function describirCambios(Model $model, array $antes, array $ocultar = []): string
    {
        $ocultar = array_merge($ocultar, ['password', 'api_token', 'token_expira_en', 'token_created_at', 'updated_at', 'created_at', 'remember_token']);
        $truncar = fn(string $s) => strlen($s) > 60 ? substr($s, 0, 60) . '…' : $s;
        $fmt = fn($v) => match (true) {
            $v === null     => '—',
            is_bool($v)     => $v ? 'sí' : 'no',
            is_array($v)    => $truncar(json_encode($v)),
            default         => $truncar((string) $v),
        };

        $cambios = [];
        foreach ($model->getChanges() as $campo => $nuevo) {
            if (in_array($campo, $ocultar, true)) continue;
            $anterior = $antes[$campo] ?? null;
            if ($anterior === $nuevo) continue;
            $cambios[] = "{$campo}: " . $fmt($anterior) . ' → ' . $fmt($nuevo);
        }

        return $cambios ? implode('; ', $cambios) : 'sin cambios en los datos';
    }

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
