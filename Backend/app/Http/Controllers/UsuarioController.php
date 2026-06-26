<?php

namespace App\Http\Controllers;

use App\Models\IpBloqueada;
use App\Models\Log;
use App\Models\Usuario;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UsuarioController extends Controller
{
    use LogsActivity;

    public function index()
    {
        $usuarios = Usuario::all();

        // ultimo_visto se actualiza en cada request autenticado (ver
        // ApiTokenMiddleware), así que refleja actividad real y no solo el
        // momento del login — evita que se vea "desactualizado" mientras el
        // usuario sigue trabajando con la misma sesión. El IP sigue tomándose
        // del último login registrado en el log de auditoría.
        $lastLogins = \App\Models\Log::where('accion', 'login')
            ->whereIn('usuario_id', $usuarios->pluck('id'))
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('usuario_id')
            ->map(fn($logs) => $logs->first());

        $usuarios = $usuarios->map(function ($usuario) use ($lastLogins) {
            $lastLogin = $lastLogins->get($usuario->id);
            $usuario->ultima_conexion = $usuario->ultimo_visto?->format('Y-m-d H:i')
                ?? $lastLogin?->created_at->format('Y-m-d H:i');
            $usuario->ultimo_ip       = $lastLogin ? $lastLogin->ip : null;
            // El frontend repite GET /usuario cada 30s mientras la sesión está
            // abierta (ver AppContext.refreshUser) — 2 min de margen es de sobra
            // para considerar la sesión "activa ahora" y no solo "vista hace poco".
            // También exige api_token vigente: sin esto, cerrar sesión no
            // bajaba "Activo ahora" hasta que pasaran los 2 minutos completos,
            // aunque el token ya estuviera invalidado desde el logout.
            $reciente = $usuario->ultimo_visto?->gt(now()->subMinutes(2)) ?? false;
            $usuario->activo_ahora    = !empty($usuario->api_token) && $reciente;
            return $usuario->makeVisible(['temp', 'temp_expira_en']);
        });

        return response()->json([
            'status' => 'success',
            'data' => $usuarios
        ]);
    }

    /**
     * Lista liviana de usuarios activos para reasignar el vendedor de una
     * póliza/cotización. Expone solo id/nombre/tipo (no el listado completo
     * de usuarios.view) para no exigir ese permiso en el flujo de "Ajustar
     * póliza", que ya está controlado por clientes.adjust.
     */
    public function vendedoresDisponibles()
    {
        $usuarios = Usuario::where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'tipo']);

        return response()->json($usuarios);
    }

    public function getUser(Request $request)
    {
        $u = auth()->user();
        return response()->json([
            'status' => 'success',
            'data' => [
                'id'       => $u->id,
                'nombre'   => $u->nombre,
                'nick'     => $u->nick,
                'cargo'    => $u->cargo,
                'genero'   => $u->genero,
                'tipo'     => $u->tipo,
                'permisos' => $u->permisos,
            ],
        ]);
    }

    public function toggleStatus(Request $request, $id)
    {
        $usuario = Usuario::find($id);

        if (!$usuario) {
            return response()->json(['status' => 'error', 'message' => 'Usuario no encontrado'], 404);
        }

        $usuario->activo = !$usuario->activo;

        // Última IP conocida del usuario según los logs — se usa tanto para
        // bloquear como para desbloquear.
        $ultimoLog = Log::where('usuario_id', $usuario->id)
            ->whereNotNull('ip')
            ->latest('created_at')
            ->first();

        if (!$usuario->activo) {
            // Si se está bloqueando, guardamos el motivo y bloqueamos la IP
            // de forma permanente (igual que el lockout automático de
            // AuthController) — queda así a propósito, es una medida seria.
            if ($request->has('motivo')) {
                $usuario->motivo_bloqueo = strip_tags(trim(substr($request->motivo, 0, 200)));
            }

            if ($ultimoLog && $ultimoLog->ip) {
                IpBloqueada::updateOrCreate(
                    ['ip' => $ultimoLog->ip],
                    ['usuario_id' => $usuario->id, 'motivo' => $request->motivo ?? 'Cuenta bloqueada']
                );
            }
        } else {
            // Al desbloquear: limpiar el motivo y TODO bloqueo de IP que
            // pueda estar frenando a este usuario — por usuario_id (lo
            // normal) y también por su última IP conocida directamente,
            // porque si esa IP es compartida (oficina) y quedó "apuntando" a
            // otro usuario_id por un bloqueo posterior, borrar solo por
            // usuario_id no la suelta y el usuario (o el propio admin, si
            // comparte la IP) se queda sin poder volver a entrar. También se
            // limpia el lockout temporal de cache de esa IP, para que se
            // pueda reintentar en segundos en vez de esperar el resto de los
            // 30 minutos — y sin que esto afecte la capacidad de seguir
            // bloqueando/desbloqueando a otros usuarios después.
            $usuario->motivo_bloqueo = null;
            IpBloqueada::where('usuario_id', $usuario->id)->delete();
            if ($ultimoLog && $ultimoLog->ip) {
                IpBloqueada::where('ip', $ultimoLog->ip)->delete();
                Cache::forget('login_lockout:' . $ultimoLog->ip);
                Cache::forget('login_attempts:' . $ultimoLog->ip);
            }
        }

        $usuario->save();

        $status = $usuario->activo ? 'activó' : 'desactivó';
        $this->logActivity(
            'Cambio de Estado de Usuario',
            "Se {$status} al usuario {$usuario->nick}",
            'usuarios',
            auth()->id()
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Estado actualizado correctamente',
            'data' => $usuario
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre'   => 'required|string|max:255',
            'cargo'    => 'required|string|max:255',
            'genero'   => 'required|in:M,F',
            'nick'     => 'required|string|max:50|unique:usuarios|regex:/^[a-zA-Z0-9._-]+$/',
            'password' => ['required', 'string', 'min:8', 'max:128', 'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/'],
            'sede'     => 'required|string|max:255',
            'nro_sede' => 'required|integer',
            'tipo'     => 'required|in:Admin,Oficina,Vendedor Sucursal,Vendedor Calle',
            'permisos' => 'nullable|array',
            'temp'           => 'sometimes|boolean',
            'temp_expira_en' => 'nullable|required_if:temp,true|date|after_or_equal:today',
        ], [
            'password.min'   => 'La contraseña debe tener al menos 8 caracteres.',
            'password.regex' => 'La contraseña debe contener al menos una mayúscula, una minúscula y un número.',
            'nick.regex'     => 'El usuario solo puede contener letras, números, puntos, guiones y guiones bajos.',
            'tipo.in'        => 'El rol seleccionado no es válido.',
            'temp_expira_en.required_if' => 'Una cuenta temporal necesita una fecha de vencimiento.',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 400);
        }

        $usuario = Usuario::create([
            'nombre'   => strip_tags(trim($request->nombre)),
            'genero'   => $request->genero,
            'cargo'    => strip_tags(trim($request->cargo)),
            'nick'     => $request->nick,
            'password' => Hash::make($request->password),
            'sede'     => strip_tags(trim($request->sede)),
            'nro_sede' => $request->nro_sede,
            'tipo'     => $request->tipo,
            'permisos' => $request->permisos,
            'activo'   => true,
            'temp'           => $request->boolean('temp'),
            'temp_expira_en' => $request->temp ? $request->temp_expira_en : null,
        ]);

        $this->logActivity(
            'Creación de Usuario',
            "Se creó el usuario {$usuario->nick}" . ($usuario->temp ? " (cuenta temporal, vence {$usuario->temp_expira_en})" : ''),
            'usuarios',
            auth()->id()
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Usuario creado correctamente',
            'data' => $usuario->makeVisible(['temp', 'temp_expira_en'])
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $usuario = Usuario::find($id);

        if (!$usuario) {
            return response()->json(['status' => 'error', 'message' => 'Usuario no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre'   => 'sometimes|string|max:255',
            'genero'   => 'sometimes|in:M,F',
            'cargo'    => 'sometimes|string|max:255',
            'nick'     => 'sometimes|string|max:50|unique:usuarios,nick,' . $id . '|regex:/^[a-zA-Z0-9._-]+$/',
            'password' => ['nullable', 'string', 'min:8', 'max:128', 'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/'],
            'sede'     => 'sometimes|string|max:255',
            'nro_sede' => 'sometimes|integer',
            'tipo'     => 'sometimes|in:Admin,Oficina,Vendedor Sucursal,Vendedor Calle',
            'permisos' => 'nullable|array',
            'activo'   => 'sometimes|boolean',
            'temp'           => 'sometimes|boolean',
            'temp_expira_en' => 'nullable|required_if:temp,true|date|after_or_equal:today',
        ], [
            'password.min'   => 'La contraseña debe tener al menos 8 caracteres.',
            'password.regex' => 'La contraseña debe contener al menos una mayúscula, una minúscula y un número.',
            'nick.regex'     => 'El usuario solo puede contener letras, números, puntos, guiones y guiones bajos.',
            'tipo.in'        => 'El rol seleccionado no es válido.',
            'temp_expira_en.required_if' => 'Una cuenta temporal necesita una fecha de vencimiento.',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 400);
        }

        $data = $request->only(['nombre', 'genero', 'cargo', 'nick', 'sede', 'nro_sede', 'tipo', 'permisos', 'activo', 'temp', 'temp_expira_en']);
        if (isset($data['temp']) && !$data['temp']) {
            $data['temp_expira_en'] = null;
        }

        foreach (['nombre', 'cargo', 'sede'] as $field) {
            if (isset($data[$field])) {
                $data[$field] = strip_tags(trim($data[$field]));
            }
        }

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $antes = $this->snapshotAntes($usuario);
        $usuario->update($data);

        $this->logActivity(
            'Edición de Usuario',
            "Usuario {$usuario->nick} — " . $this->describirCambios($usuario, $antes),
            'usuarios',
            auth()->id()
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Usuario actualizado correctamente',
            'data' => $usuario->makeVisible(['temp', 'temp_expira_en'])
        ]);
    }

    public function destroy($id)
    {
        if ((int) $id === auth()->id()) {
            return response()->json(['status' => 'error', 'message' => 'No puedes eliminar tu propia cuenta.'], 403);
        }

        $usuario = Usuario::find($id);

        if (!$usuario) {
            return response()->json(['status' => 'error', 'message' => 'Usuario no encontrado'], 404);
        }

        // Impedir eliminar el último Admin activo
        if ($usuario->tipo === 'Admin') {
            $adminsActivos = Usuario::where('tipo', 'Admin')->where('activo', true)->count();
            if ($adminsActivos <= 1) {
                return response()->json(['status' => 'error', 'message' => 'No se puede eliminar el último administrador activo.'], 403);
            }
        }

        $nick = $usuario->nick;
        $usuario->delete();

        $this->logActivity(
            'Eliminación de Usuario',
            "Se eliminó el usuario {$nick}",
            'usuarios',
            auth()->id()
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Usuario eliminado correctamente'
        ]);
    }
}
