<?php

namespace App\Http\Controllers;

use App\Models\Sesion;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class SesionController extends Controller
{
    use LogsActivity;

    /** Hash del token de la sesión que hace este request (para marcar "actual"). */
    private function currentHash(Request $request): string
    {
        return hash('sha256', str_replace('Bearer ', '', (string) $request->header('Authorization')));
    }

    /** Lista las sesiones activas del usuario en sesión. */
    public function index(Request $request)
    {
        $actual = $this->currentHash($request);

        $sesiones = Sesion::where('usuario_id', auth()->id())
            ->orderByDesc('ultimo_visto')
            ->get()
            ->map(fn (Sesion $s) => [
                'id'           => $s->id,
                'ip'           => $s->ip,
                'user_agent'   => $s->user_agent,
                'ultimo_visto' => $s->ultimo_visto,
                'inicio'       => $s->created_at,
                'es_actual'    => hash_equals($s->token_hash, $actual),
            ]);

        return response()->json($sesiones);
    }

    /** Cierra una sesión propia por id. */
    public function destroy(Request $request, int $id)
    {
        $sesion = Sesion::where('usuario_id', auth()->id())->where('id', $id)->first();

        if (!$sesion) {
            return response()->json(['message' => 'Sesión no encontrada.'], 404);
        }

        $sesion->delete();

        return response()->json(['message' => 'Sesión cerrada.']);
    }

    /** Cierra todas las sesiones propias excepto la actual. */
    public function cerrarOtras(Request $request)
    {
        $n = Sesion::where('usuario_id', auth()->id())
            ->where('token_hash', '!=', $this->currentHash($request))
            ->delete();

        return response()->json(['message' => "Se cerraron {$n} sesión(es).", 'cerradas' => $n]);
    }

    /** (Admin) Cierra TODAS las sesiones de un usuario — fuerza su re-login. */
    public function forzarLogout(Request $request, int $id)
    {
        $n = Sesion::where('usuario_id', $id)->delete();

        $this->logActivity('logout', "Admin forzó el cierre de sesión del usuario #{$id} ({$n} sesión/es)", 'usuarios', $id);

        return response()->json(['message' => "Se cerraron {$n} sesión(es) del usuario.", 'cerradas' => $n]);
    }
}
