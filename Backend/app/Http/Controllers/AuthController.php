<?php

namespace App\Http\Controllers;

use App\Models\IpBloqueada;
use App\Models\Usuario;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use LogsActivity;

    // Patrones de ataques comunes detectados en los campos del formulario de login
    private const ATTACK_PATTERNS = [
        '/(\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b|\bINSERT\b|\bDROP\b|\bDELETE\b|\bUPDATE\b|\bEXEC\b)/i',
        '/(\bSLEEP\b|\bBENCHMARK\b|\bWAITFOR\b|\bDELAY\b)/i',
        '/[\'\"]\s*(--|#|\/\*)/i',
        '/<\s*script|javascript\s*:/i',
        '/\bxp_cmdshell\b|\bSYSTEM\b\s*\(/i',
    ];

    public function login(Request $request)
    {
        // ── 0. Detección proactiva de patrones de ataque (solo en el nick) ───────
        // No se revisa el password: una contraseña legítima puede contener
        // palabras como "or"/"and"/"delete" y produciría falsos positivos. El
        // nick, además, ya está restringido a [a-zA-Z0-9._-] por la validación.
        $rawNick = $request->input('nick', '');

        foreach (self::ATTACK_PATTERNS as $pattern) {
            if (preg_match($pattern, $rawNick)) {
                // Lockout TEMPORAL + registro para auditoría. No se hace ban
                // permanente automático: un falso positivo no debe dejar fuera a
                // una oficina entera tras NAT. El admin puede bloquear la IP
                // manualmente si confirma que es un ataque real.
                Cache::put('login_lockout:' . $request->ip(), true, now()->addMinutes(30));
                $this->logActivity(
                    'posible_hackeo',
                    "⚠️ ATAQUE DETECTADO — IP: {$request->ip()} — Patrón malicioso en el campo 'nick' del login",
                    'usuarios'
                );
                return response()->json(['message' => 'Solicitud rechazada.'], 403);
            }
        }

        // ── 1. Validar formato del input ─────────────────────────────────────────
        // Nick: solo alfanumérico + punto/guión/underscore, sin comillas ni caracteres especiales
        // Password: máximo 255 caracteres para evitar DoS contra bcrypt con strings enormes
        $request->validate([
            'nick'            => 'required|string|max:50|regex:/^[a-zA-Z0-9._-]+$/',
            'password'        => 'required|string|min:1|max:255',
            'turnstile_token' => 'required|string|max:2048',
        ], [
            'nick.regex'         => 'El usuario no puede contener comillas ni caracteres especiales.',
            'password.max'       => 'La contraseña introducida es demasiado larga.',
            'turnstile_token.max'=> 'Token de verificación inválido.',
        ]);

        // ── 2a. Verificar si la IP está en la lista de IPs bloqueadas permanentemente ─
        if (IpBloqueada::where('ip', $request->ip())->exists()) {
            $this->logActivity('login_blocked', "IP bloqueada intentó acceder: {$request->ip()}", 'usuarios');
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        // ── 2b. Lockout progresivo por IP ────────────────────────────────────────
        $lockoutKey     = 'login_lockout:'  . $request->ip();
        $attemptsKey    = 'login_attempts:' . $request->ip();
        $maxAttempts    = 3;   // 3 intentos antes del bloqueo
        $lockoutMinutes = 30;  // bloqueo temporal de 30 minutos

        if (Cache::has($lockoutKey)) {
            $this->logActivity('login_blocked', "IP en lockout temporal intentó acceder: {$request->ip()}", 'usuarios');
            return response()->json([
                'message' => 'Acceso temporalmente bloqueado. Intenta de nuevo más tarde o contacta al administrador.',
            ], 429);
        }

        // ── 3. Verificar Cloudflare Turnstile ────────────────────────────────────
        // Si TURNSTILE_SECRET_KEY no está configurada (ej. entorno local/dev),
        // se omite la verificación para no bloquear el desarrollo.
        $turnstileSecret = config('services.turnstile.secret');
        if ($turnstileSecret) {
            $turnstile = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret'   => $turnstileSecret,
                'response' => $request->turnstile_token,
                'remoteip' => $request->ip(),
            ]);

            if (!$turnstile->successful() || !$turnstile->json('success')) {
                $this->logActivity('login_failed', "Verificación Turnstile fallida desde IP: {$request->ip()}", 'usuarios');
                return response()->json([
                    'message' => 'La verificación de seguridad falló. Por favor, intenta de nuevo.',
                    'errors'  => ['turnstile' => ['Captcha inválido']],
                ], 422);
            }
        }

        // ── 4. Verificar credenciales ─────────────────────────────────────────────
        // Usamos Eloquent (prepared statements) → inmune a SQL injection por diseño
        $usuario = Usuario::where('nick', $request->nick)->first();

        if (!$usuario || !Hash::check($request->password, $usuario->password)) {
            $attempts = Cache::increment($attemptsKey);
            Cache::put($attemptsKey, $attempts, now()->addMinutes($lockoutMinutes));

            if ($attempts >= $maxAttempts) {
                // Lockout TEMPORAL por IP — se auto-libera en `lockoutMinutes`.
                // Ya NO se hace ban permanente de IP ni se desactiva la cuenta:
                //  - el ban permanente automático dejaba fuera a oficinas tras
                //    NAT por los errores de un solo usuario;
                //  - desactivar la cuenta habilitaba un DoS dirigido: fallar 3
                //    veces el login de un nick conocido lo dejaba inservible
                //    hasta intervención manual de un admin.
                // Si es un ataque real queda registrado para que el admin
                // bloquee la IP manualmente desde el panel.
                Cache::put($lockoutKey, true, now()->addMinutes($lockoutMinutes));
                Cache::forget($attemptsKey);

                $this->logActivity(
                    'login_blocked',
                    "Lockout temporal de {$lockoutMinutes} min — IP: {$request->ip()} tras {$maxAttempts} intentos fallidos" .
                    ($usuario ? " — Cuenta objetivo: {$usuario->nick}" : " — Nick inexistente: {$request->nick}"),
                    'usuarios',
                    $usuario?->id
                );

                return response()->json([
                    'message' => 'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.',
                ], 429);
            }

            $this->logActivity(
                'login_failed',
                "Credenciales inválidas desde IP: {$request->ip()} — Intento {$attempts}/{$maxAttempts}",
                'usuarios'
            );
            return response()->json([
                'message' => 'Usuario o contraseña incorrectos.',
            ], 401);
        }

        if (!$usuario->activo) {
            return response()->json(['message' => 'Esta cuenta se encuentra desactivada. Contacte al administrador.'], 403);
        }

        if ($usuario->temp && $usuario->temp_expira_en && now()->isAfter($usuario->temp_expira_en)) {
            $usuario->update(['activo' => false]);
            return response()->json(['message' => 'El acceso temporal de esta cuenta ha vencido. Contacte al administrador.'], 403);
        }

        // ── 5. Si ya hay una sesión activa con este usuario, se rechaza el
        // nuevo intento — antes dejaba entrar y le cerraba la sesión al que
        // ya estaba adentro, lo cual no corresponde (alguien podría estar
        // tipeando una cotización y quedarse afuera sin aviso). La sesión
        // existente queda intacta; quien intenta entrar de nuevo tiene que
        // esperar a que esa sesión se cierre (logout) o expire.
        $sesionActiva = $usuario->api_token
            && $usuario->token_expira_en
            && now()->isBefore($usuario->token_expira_en);

        if ($sesionActiva) {
            $this->logActivity(
                'sesion_duplicada_rechazada',
                "Intento de doble sesión rechazado para {$usuario->nick} — IP: {$request->ip()}",
                'usuarios',
                $usuario->id
            );

            return response()->json([
                'message' => 'Ya existe una sesión activa con este usuario. Cierra esa sesión o espera unos minutos e inténtalo de nuevo.',
            ], 409);
        }

        // ── 6. Login exitoso ──────────────────────────────────────────────────────
        Cache::forget($attemptsKey);
        Cache::forget($lockoutKey);

        $token     = bin2hex(random_bytes(40));
        $tokenHash = hash('sha256', $token);
        $usuario->update([
            'api_token'        => $tokenHash,
            'token_expira_en'  => now()->addMinutes((int) config('auth.token.idle_minutes', 30)),
            'token_created_at' => now(),
        ]);

        $this->logActivity('login', "Inicio de sesión exitoso — ID: {$usuario->id}", 'usuarios', $usuario->id);

        return response()->json([
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => [
                'nombre'   => $usuario->nombre,
                'nick'     => $usuario->nick,
                'cargo'    => $usuario->cargo,
                'genero'   => $usuario->genero,
                'tipo'     => $usuario->tipo,
                'permisos' => $usuario->permisos,
            ],
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string|max:128',
            'new_password' => 'required|string|min:8|max:128|confirmed',
        ]);

        $usuario = auth()->user();

        if (!Hash::check($request->current_password, $usuario->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['La contraseña actual es incorrecta.'],
            ]);
        }

        $usuario->update([
            'password' => Hash::make($request->new_password)
        ]);

        $this->logActivity('edit', "Usuario {$usuario->nick} cambió su contraseña", 'usuarios', $usuario->id);

        return response()->json(['message' => 'Contraseña actualizada correctamente.']);
    }

    public function logout(Request $request)
    {
        $token   = str_replace('Bearer ', '', $request->header('Authorization'));
        $usuario = Usuario::where('api_token', hash('sha256', $token))->first();

        if ($usuario) {
            $this->logActivity('logout', "Usuario {$usuario->nick} ha cerrado sesión", 'usuarios', $usuario->id);
            $usuario->update(['api_token' => null, 'token_expira_en' => null, 'token_created_at' => null]);
        }

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }

    /** Verifica que la contraseña ingresada coincide con la del usuario en sesión. */
    public function verifyPassword(Request $request)
    {
        $request->validate(['password' => 'required|string|max:128']);

        $token   = str_replace('Bearer ', '', $request->header('Authorization'));
        $usuario = Usuario::where('api_token', hash('sha256', $token))->first();

        if (!$usuario || !Hash::check($request->input('password'), $usuario->password)) {
            return response()->json(['error' => 'Contraseña incorrecta'], 401);
        }

        return response()->json(['ok' => true]);
    }
}
