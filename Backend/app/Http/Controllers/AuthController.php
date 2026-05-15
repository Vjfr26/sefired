<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use LogsActivity;

    public function login(Request $request)
    {
        $request->validate([
            'nick' => 'required|string',
            'password' => 'required|string',
            'turnstile_token' => 'required|string',
        ]);

        // Verify Cloudflare Turnstile
        $response = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
            'secret' => env('TURNSTILE_SECRET_KEY'),
            'response' => $request->turnstile_token,
            'remoteip' => $request->ip(),
        ]);

        if (!$response->successful() || !$response->json('success')) {
            $this->logActivity('login_failed', "Falla de Turnstile para el usuario: {$request->nick}", 'usuarios');
            return response()->json([
                'message' => 'La verificación de seguridad falló. Por favor, intenta de nuevo.',
                'errors' => ['turnstile' => ['Captcha inválido']]
            ], 422);
        }

        $usuario = Usuario::where('nick', $request->nick)->first();

        if (!$usuario || !Hash::check($request->password, $usuario->password)) {
            $this->logActivity('login_failed', "Intento de inicio de sesión fallido para el nick: {$request->nick}", 'usuarios');
            throw ValidationException::withMessages([
                'nick' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        if (!$usuario->activo) {
            return response()->json(['message' => 'Esta cuenta se encuentra desactivada.'], 403);
        }

        // Manual token generation
        $token = bin2hex(random_bytes(40));
        $usuario->update(['api_token' => $token]);

        $this->logActivity('login', "Usuario {$usuario->nick} ha iniciado sesión", 'usuarios', $usuario->id);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'nombre' => $usuario->nombre,
                'nick' => $usuario->nick,
                'cargo' => $usuario->cargo,
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $token = str_replace('Bearer ', '', $request->header('Authorization'));
        $usuario = Usuario::where('api_token', $token)->first();

        if ($usuario) {
            $this->logActivity('logout', "Usuario {$usuario->nick} ha cerrado sesión", 'usuarios', $usuario->id);
            $usuario->update(['api_token' => null]);
        }

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }
}
