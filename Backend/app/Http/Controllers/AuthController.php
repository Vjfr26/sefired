<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
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
            return response()->json([
                'message' => 'La verificación de seguridad falló. Por favor, intenta de nuevo.',
                'errors' => ['turnstile' => ['Captcha inválido']]
            ], 422);
        }

        $usuario = Usuario::where('nick', $request->nick)->first();

        if (!$usuario || !Hash::check($request->password, $usuario->password)) {
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
        Usuario::where('api_token', $token)->update(['api_token' => null]);

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }
}
