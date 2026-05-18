<?php

namespace App\Http\Controllers;

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
        return response()->json([
            'status' => 'success',
            'data' => Usuario::all()
        ]);
    }

    public function getUser(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'data' => auth()->user()
        ]);
    }

    public function toggleStatus($id)
    {
        $usuario = Usuario::find($id);

        if (!$usuario) {
            return response()->json(['status' => 'error', 'message' => 'Usuario no encontrado'], 404);
        }

        $usuario->activo = !$usuario->activo;
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
            'nombre' => 'required|string|max:255',
            'cargo' => 'required|string|max:255',
            'nick' => 'required|string|max:255|unique:usuarios',
            'password' => 'required|string|min:6',
            'sede' => 'required|string|max:255',
            'nro_sede' => 'required|integer',
            'tipo' => 'required|string|max:255',
            'permisos' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 400);
        }

        $usuario = Usuario::create([
            'nombre' => $request->nombre,
            'cargo' => $request->cargo,
            'nick' => $request->nick,
            'password' => Hash::make($request->password),
            'sede' => $request->sede,
            'nro_sede' => $request->nro_sede,
            'tipo' => $request->tipo,
            'permisos' => $request->permisos,
            'activo' => true,
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
            'nombre' => 'sometimes|string|max:255',
            'cargo' => 'sometimes|string|max:255',
            'nick' => 'sometimes|string|max:255|unique:usuarios,nick,' . $id,
            'password' => 'nullable|string|min:6',
            'sede' => 'sometimes|string|max:255',
            'nro_sede' => 'sometimes|integer',
            'tipo' => 'sometimes|string|max:255',
            'permisos' => 'nullable|array',
            'activo' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 400);
        }

        $data = $request->only(['nombre', 'cargo', 'nick', 'sede', 'nro_sede', 'tipo', 'permisos', 'activo']);

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
