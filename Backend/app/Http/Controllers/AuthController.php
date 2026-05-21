<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
<<<<<<< HEAD
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
=======
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
>>>>>>> origin/victor
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
<<<<<<< HEAD
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
=======
    /**
     * Maneja el inicio de sesión con múltiples capas de seguridad.
     */
    public function login(Request $request)
    {
        // 1. ESTRATEGIA 1: Throttling (Limitación de intentos)
        // Bloqueamos por IP tras 5 intentos fallidos
        $throttleKey = 'login-attempt:' . $request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'error' => "Demasiados intentos. Por favor, intente de nuevo en $seconds segundos."
            ], 429);
        }

        // Validación básica de campos
        $request->validate([
            'nick' => 'required|string',
            'pass' => 'required|string',
            'cf_turnstile_response' => 'required|string'
        ]);

        // 2. SEGURIDAD ADICIONAL: Verificación de Cloudflare Turnstile en el Backend
        $response = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
            'secret' => env('TURNSTILE_SECRET_KEY', '1x0000000000000000000000000000000AA'),
            'response' => $request->cf_turnstile_response,
            'remoteip' => $request->ip(),
        ]);

        if (!$response->json('success')) {
            return response()->json(['error' => 'Verificación de seguridad fallida.'], 403);
        }

        // Buscamos al usuario por su nick
        $user = Usuario::where('nick', $request->nick)->first();

        // 3. ESTRATEGIA 2: Mensajes de Error Genéricos
        // No revelamos si el nick existe o si solo falló la contraseña
        if (!$user || !Hash::check($request->pass, $user->pass)) {
            RateLimiter::hit($throttleKey, 60); // Registramos el fallo para el throttling
            return response()->json(['error' => 'Credenciales inválidas.'], 401);
        }

        // 4. ESTRATEGIA 3: Validación de Usuarios Temporales y Activos
        // Validar si la cuenta está desactivada
        if (!$user->activo) {
            return response()->json(['error' => 'Esta cuenta se encuentra desactivada.'], 403);
        }

        // Validar si es un usuario temporal y ya expiró
        if ($user->temp && $user->temp_expira_en && now()->greaterThan($user->temp_expira_en)) {
            // Desactivar automáticamente si expiró
            $user->update(['activo' => false]);
            return response()->json(['error' => 'Su acceso temporal ha expirado.'], 403);
        }

        // 5. ESTRATEGIA 4: Sesiones Seguras
        // Iniciamos sesión y regeneramos el ID para evitar fijación de sesión
        Auth::login($user);
        $request->session()->regenerate();
        RateLimiter::clear($throttleKey); // Limpiamos los intentos fallidos tras éxito

        return response()->json([
            'success' => true,
            'message' => 'Bienvenido al sistema Sefired',
            'user' => [
                'nombre' => $user->nombre,
                'cargo' => $user->cargo,
                'tipo' => $user->tipo
>>>>>>> origin/victor
            ]
        ]);
    }

<<<<<<< HEAD
    public function logout(Request $request)
    {
        $token = str_replace('Bearer ', '', $request->header('Authorization'));
        $usuario = Usuario::where('api_token', $token)->first();

        if ($usuario) {
            $this->logActivity('logout', "Usuario {$usuario->nick} ha cerrado sesión", 'usuarios', $usuario->id);
            $usuario->update(['api_token' => null]);
        }
=======
    /**
     * Cierra la sesión de forma segura.
     */
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
>>>>>>> origin/victor

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }
}
