<?php

namespace App\Http\Controllers;

use App\Models\IpBloqueada;
use App\Models\Log;
use App\Models\Usuario;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UsuarioController extends Controller
{
    use LogsActivity;

    public function index()
    {
        $usuarios = Usuario::all();

        // Una sola query para todos los últimos logins (evita N+1)
        $lastLogins = \App\Models\Log::where('accion', 'login')
            ->whereIn('usuario_id', $usuarios->pluck('id'))
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('usuario_id')
            ->map(fn($logs) => $logs->first());

        $usuarios = $usuarios->map(function ($usuario) use ($lastLogins) {
            $lastLogin = $lastLogins->get($usuario->id);
            $usuario->ultima_conexion = $lastLogin ? $lastLogin->created_at->format('Y-m-d H:i') : null;
            $usuario->ultimo_ip       = $lastLogin ? $lastLogin->ip : null;
            return $usuario;
        });

        return response()->json([
            'status' => 'success',
            'data' => $usuarios
        ]);
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

        // Si se está bloqueando, guardamos el motivo y bloqueamos la IP
        if (!$usuario->activo) {
            if ($request->has('motivo')) {
                $usuario->motivo_bloqueo = $request->motivo;
            }

            // Obtener la última IP conocida del usuario desde los logs
            $ultimoLog = Log::where('usuario_id', $usuario->id)
                ->whereNotNull('ip')
                ->latest('created_at')
                ->first();

            if ($ultimoLog && $ultimoLog->ip) {
                IpBloqueada::updateOrCreate(
                    ['ip' => $ultimoLog->ip],
                    ['usuario_id' => $usuario->id, 'motivo' => $request->motivo ?? 'Cuenta bloqueada']
                );
            }
        } else {
            // Si se está desbloqueando, limpiamos el motivo y desbloqueamos la IP
            $usuario->motivo_bloqueo = null;
            IpBloqueada::where('usuario_id', $usuario->id)->delete();
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
            'password' => ['required', 'string', 'min:8', 'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/'],
            'sede'     => 'required|string|max:255',
            'nro_sede' => 'required|integer',
            'tipo'     => 'required|in:Admin,Oficina,Vendedor Sucursal,Vendedor Calle',
            'permisos' => 'nullable|array',
        ], [
            'password.min'   => 'La contraseña debe tener al menos 8 caracteres.',
            'password.regex' => 'La contraseña debe contener al menos una mayúscula, una minúscula y un número.',
            'nick.regex'     => 'El usuario solo puede contener letras, números, puntos, guiones y guiones bajos.',
            'tipo.in'        => 'El rol seleccionado no es válido.',
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
        ]);

        $this->logActivity(
            'Creación de Usuario',
            "Se creó el usuario {$usuario->nick}",
            'usuarios',
            auth()->id()
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Usuario creado correctamente',
            'data' => $usuario
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
            'password' => ['nullable', 'string', 'min:8', 'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/'],
            'sede'     => 'sometimes|string|max:255',
            'nro_sede' => 'sometimes|integer',
            'tipo'     => 'sometimes|in:Admin,Oficina,Vendedor Sucursal,Vendedor Calle',
            'permisos' => 'nullable|array',
            'activo'   => 'sometimes|boolean',
        ], [
            'password.min'   => 'La contraseña debe tener al menos 8 caracteres.',
            'password.regex' => 'La contraseña debe contener al menos una mayúscula, una minúscula y un número.',
            'nick.regex'     => 'El usuario solo puede contener letras, números, puntos, guiones y guiones bajos.',
            'tipo.in'        => 'El rol seleccionado no es válido.',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 400);
        }

        $data = $request->only(['nombre', 'genero', 'cargo', 'nick', 'sede', 'nro_sede', 'tipo', 'permisos', 'activo']);

        foreach (['nombre', 'cargo', 'sede'] as $field) {
            if (isset($data[$field])) {
                $data[$field] = strip_tags(trim($data[$field]));
            }
        }

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $usuario->update($data);

        $this->logActivity(
            'Edición de Usuario',
            "Se actualizó el usuario {$usuario->nick}",
            'usuarios',
            auth()->id()
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Usuario actualizado correctamente',
            'data' => $usuario
        ]);
    }

    public function destroy($id)
    {
        $usuario = Usuario::find($id);

        if (!$usuario) {
            return response()->json(['status' => 'error', 'message' => 'Usuario no encontrado'], 404);
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
