<?php

namespace App\Http\Controllers;

use App\Mail\CotizacionMail;
use App\Mail\SolicitudContactoInternaMail;
use App\Mail\SolicitudContactoMail;
use App\Models\BienAsegurado;
use App\Models\IndicadorEconomico;
use App\Models\Persona;
use App\Models\Poliza;
use App\Models\Producto;
use App\Models\Solicitud;
use App\Models\SolicitudContacto;
use App\Rules\NoInjectionChars;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class PortalController extends Controller
{
    /* ─────────────────────────────────────────────────────────────
       GET /api/portal/productos
       Devuelve sólo los productos de nivel superior (sin parent).
       Incluye si tiene sub-tipos y los documentos requeridos.
    ───────────────────────────────────────────────────────────── */
    public function productos()
    {
        return response()->json(
            Producto::whereNull('parent_id')
                ->orderBy('nombre')
                ->get()
                ->map(fn($p) => $this->mapProducto($p, true))
        );
    }

    /* ─────────────────────────────────────────────────────────────
       GET /api/portal/productos/{id}/subtipos
       Devuelve los sub-tipos del producto indicado.
    ───────────────────────────────────────────────────────────── */
    public function subtipos($id)
    {
        $producto = Producto::findOrFail($id);

        return response()->json(
            $producto->subtipos()
                ->orderBy('nombre')
                ->get()
                ->map(fn($p) => $this->mapProducto($p, false))
        );
    }

    /* ─────────────────────────────────────────────────────────────
       GET /api/portal/tasas
       Tasa BCV (USD/EUR) vigente — para mostrar el precio en Bs/USD/EUR
       en el simulador, tal como lo exige la normativa cambiaria venezolana.
    ───────────────────────────────────────────────────────────── */
    public function tasas()
    {
        $usd = IndicadorEconomico::usd()->orderByDesc('fecha')->orderByDesc('fecha_registro')->first();
        $eur = IndicadorEconomico::eur()->orderByDesc('fecha')->orderByDesc('fecha_registro')->first();

        return response()->json([
            'usd'    => $usd ? (float) $usd->valor : null,
            'eur'    => $eur ? (float) $eur->valor : null,
            'fecha'  => $usd?->fecha?->format('d/m/Y'),
            'fuente' => 'https://www.bcv.org.ve/',
        ]);
    }

    /* ─────────────────────────────────────────────────────────────
       POST /api/portal/verificar
    ───────────────────────────────────────────────────────────── */
    public function verificarCliente(Request $request)
    {
        $request->validate(['cedula' => 'required|string|max:20']);

        $cedula = strtoupper(preg_replace('/[^A-Z0-9]/i', '', trim($request->cedula)));

        $persona = Persona::whereRaw(
            "UPPER(REPLACE(REPLACE(REPLACE(cedula, '-', ''), '.', ''), ' ', '')) = ?",
            [$cedula]
        )->first();

        if (!$persona) {
            return response()->json(['existe' => false, 'tiene_poliza' => false]);
        }

        $tienePoliza = Poliza::whereHas('solicitud', fn($q) => $q->where('persona_id', $persona->id))
            ->where('status', 'ACTIVA')
            ->exists();

        // Solo confirma existencia y estado de póliza — no expone nombre al público
        return response()->json([
            'existe'       => true,
            'tiene_poliza' => $tienePoliza,
        ]);
    }

    /* ─────────────────────────────────────────────────────────────
       POST /api/portal/cotizacion
       Acepta multipart/form-data (con archivos) o JSON.
    ───────────────────────────────────────────────────────────── */
    public function cotizar(Request $request)
    {
        // 1. Verificar Turnstile
        $turnstileSecret = config('services.turnstile.secret');
        if ($turnstileSecret) {
            $turnstile = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret'   => $turnstileSecret,
                'response' => $request->input('_turnstile', ''),
                'remoteip' => $request->ip(),
            ]);
            if (!$turnstile->successful() || !$turnstile->json('success')) {
                return response()->json([
                    'message' => 'Verificación de seguridad fallida. Recarga la página e inténtalo de nuevo.',
                ], 422);
            }
        }

        // 2. Validar campos
        // Nota: Eloquent/el query builder ya parametriza todas las consultas
        // (no hay riesgo real de inyección SQL), pero igual se rechazan
        // comillas, punto y coma, backtick, < >, backslash y "--" en los
        // campos de texto libre por política explícita — mismo set de
        // caracteres que ya filtra el frontend en sanitizeInput().
        $noInjectionChars = new NoInjectionChars();
        $data = $request->validate([
            // Datos del cliente
            'nombre_completo'     => ['required', 'string', 'max:200', $noInjectionChars],
            'cedula'              => 'required|string|max:20',
            'telefono'            => ['required', 'string', 'max:30', $noInjectionChars],
            'email'               => 'required|email|max:120|confirmed',
            'estado'              => ['required', 'string', 'max:60', $noInjectionChars],
            'ciudad'              => ['required', 'string', 'max:80', $noInjectionChars],
            'direccion'           => ['required', 'string', 'max:200', $noInjectionChars],
            'sexo'                => 'required|string|max:10',
            'condicion'           => ['required', 'string', 'max:30', $noInjectionChars],
            'nacimiento'          => 'required|date|before_or_equal:' . now()->subYears(18)->toDateString(),
            'nacionalidad'        => ['required', 'string', 'max:40', $noInjectionChars],
            // Producto seleccionado
            'producto_id'         => 'nullable|integer|exists:producto,id',
            'subtipo_id'          => 'nullable|integer|exists:producto,id',
            'tipo_seguro'         => ['nullable', 'string', 'max:100', $noInjectionChars],
            'prima_estimada'      => 'nullable|numeric|min:0',
            // Datos vehículo
            'placa'               => ['nullable', 'string', 'max:15', $noInjectionChars],
            'marca'               => ['nullable', 'string', 'max:50', $noInjectionChars],
            'modelo'              => ['nullable', 'string', 'max:80', $noInjectionChars],
            'año'                 => 'nullable|string|max:4',
            'color'               => ['nullable', 'string', 'max:40', $noInjectionChars],
            'uso'                 => ['nullable', 'string', 'max:50', $noInjectionChars],
            'valor_mercado'       => 'nullable|numeric|min:0',
            // Datos bien genérico
            'bien_tipo'           => ['nullable', 'string', 'max:60', $noInjectionChars],
            'bien_descripcion'    => ['nullable', 'string', 'max:200', $noInjectionChars],
            'bien_valor'          => 'nullable|numeric|min:0',
            'bien_direccion'      => ['nullable', 'string', 'max:200', $noInjectionChars],
            // Documentos adjuntos
            'documentos'          => 'nullable|array|max:10',
            'documentos.*'        => 'nullable|file|max:8192|mimes:pdf,jpg,jpeg,png,webp',
            'documentos_nombres'  => 'nullable|array',
            'documentos_nombres.*'=> ['nullable', 'string', 'max:100', $noInjectionChars],
        ]);

        // 3. Normalizar cédula, nombre, teléfono y correo para comparar duplicados
        $cedula      = strtoupper(preg_replace('/[^A-Z0-9]/i', '', trim($data['cedula'])));
        $nombre      = trim($data['nombre_completo']);
        $telefono    = preg_replace('/\D/', '', $data['telefono']);
        $correoNorm  = strtolower(trim($data['email']));

        // 4. No se permiten solicitudes de alguien que ya es cliente — se
        // verifica por cédula, nombre, teléfono O correo (cualquier
        // coincidencia cuenta, no solo todas a la vez).
        $persona = Persona::where(function ($q) use ($cedula, $nombre, $telefono, $correoNorm) {
            $q->whereRaw(
                "UPPER(REPLACE(REPLACE(REPLACE(cedula, '-', ''), '.', ''), ' ', '')) = ?",
                [$cedula]
            )
            ->orWhereRaw("LOWER(TRIM(nombre)) = LOWER(TRIM(?))", [$nombre])
            ->orWhereRaw("REGEXP_REPLACE(telefono, '[^0-9]', '') = ?", [$telefono])
            ->orWhereRaw("REGEXP_REPLACE(celular, '[^0-9]', '') = ?", [$telefono])
            ->orWhereRaw('LOWER(correo) = ?', [$correoNorm]);
        })->first();

        if ($persona) {
            $tienePoliza = Poliza::whereHas(
                'solicitud',
                fn($q) => $q->where('persona_id', $persona->id)
            )->where('status', 'ACTIVA')->exists();

            return response()->json([
                'match'        => true,
                'tiene_poliza' => $tienePoliza,
            ]);
        }

        // 4b. Deduplicación por cédula, nombre, teléfono o correo en leads existentes
        $leadExistente = Solicitud::where(function ($q) use ($cedula, $nombre, $telefono, $correoNorm) {
            $q->whereRaw(
                "UPPER(REPLACE(REPLACE(REPLACE(ci_tomador, '-', ''), '.', ''), ' ', '')) = ?",
                [$cedula]
            )
            ->orWhereRaw("LOWER(TRIM(nombre_tomador)) = LOWER(TRIM(?))", [$nombre])
            ->orWhereRaw("REGEXP_REPLACE(JSON_UNQUOTE(JSON_EXTRACT(coberturas, '$.telefono')), '[^0-9]', '') = ?", [$telefono])
            ->orWhereRaw("LOWER(JSON_UNQUOTE(JSON_EXTRACT(coberturas, '$.email'))) = ?", [$correoNorm]);
        })->exists();

        if ($leadExistente) {
            return response()->json([
                'match'        => true,
                'tiene_poliza' => false,
            ]);
        }

        // 5. Guardar documentos adjuntos
        $docPaths = [];
        if ($request->hasFile('documentos')) {
            $slug = preg_replace('/[^A-Z0-9]/i', '_', $cedula);
            foreach ($request->file('documentos') as $i => $file) {
                if (!$file || !$file->isValid()) continue;
                $docNombre = $data['documentos_nombres'][$i] ?? "documento_{$i}";
                $path      = $file->store("portal/{$slug}", 'public');
                $docPaths[] = [
                    'nombre' => $docNombre,
                    'path'   => $path,
                    'mime'   => $file->getMimeType(),
                    'size'   => $file->getSize(),
                ];
            }
        }

        // 6. Determinar producto efectivo y su tipo_bien
        $productoEfectivoId = $data['subtipo_id'] ?? $data['producto_id'] ?? null;
        $producto   = $productoEfectivoId ? Producto::find($productoEfectivoId) : null;
        $tipoBien   = $producto?->tipo_bien ?? 'ninguno';

        // 6b. La dirección del bien es obligatoria cuando el producto la requiere
        // (no aplica a vehículo, que usa placa/marca/modelo en vez de dirección)
        if (in_array($tipoBien, ['inmueble', 'bien'], true) && empty($data['bien_direccion'] ?? null)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'bien_direccion' => 'La dirección del bien es obligatoria.',
            ]);
        }

        // 7. Crear bien_asegurado según tipo del producto
        $bienId = null;
        if ($tipoBien !== 'ninguno') {
            $atributos = match ($tipoBien) {
                'vehiculo' => array_filter([
                    'placa'          => $data['placa']         ?? null,
                    'marca'          => $data['marca']         ?? null,
                    'modelo'         => $data['modelo']        ?? null,
                    'anio'           => $data['año']           ?? null,
                    'color'          => $data['color']         ?? null,
                    'uso'            => $data['uso']           ?? null,
                    'valor_mercado'  => $data['valor_mercado'] ?? null,
                ], fn($v) => $v !== null),
                'inmueble', 'bien' => array_filter([
                    'subtipo'        => $data['bien_tipo']        ?? null,
                    'descripcion'    => $data['bien_descripcion'] ?? null,
                    'valor'          => $data['bien_valor']       ?? null,
                    'direccion'      => $data['bien_direccion']   ?? null,
                ], fn($v) => $v !== null),
                default => [],
            };

            $bien   = BienAsegurado::create([
                'tipo'            => $tipoBien,
                'atributos'       => $atributos ?: null,
                'valor_declarado' => $data['prima_estimada'] ?? null,
                'descripcion'     => $data['bien_descripcion'] ?? ($data['placa'] ?? null),
            ]);
            $bienId = $bien->id;
        }

        // 7b. Tasa BCV vigente (USD/EUR) — se guarda junto al lead para que el
        // correo de confirmación muestre el monto también en Bs. y EUR.
        $tasaUsd = (float) (IndicadorEconomico::usd()->orderByDesc('fecha')->orderByDesc('fecha_registro')->first()?->valor ?? 0);
        $tasaEur = (float) (IndicadorEconomico::eur()->orderByDesc('fecha')->orderByDesc('fecha_registro')->first()?->valor ?? 0);

        // 8. Crear lead (Solicitud pendiente)
        $solicitud = Solicitud::create([
            'nombre_tomador'    => $nombre,
            'ci_tomador'        => $data['cedula'],
            'bien_asegurado_id' => $bienId,
            'producto_id'       => $productoEfectivoId,
            'status'            => 'pendiente',
            'fuente'            => 'portal',
            'fecha_solicitud'   => now()->toDateString(),
            'total'             => $data['prima_estimada'] ?? 0,
            'coberturas'        => [
                'telefono'        => $data['telefono'],
                'email'           => $data['email'],
                'estado_ve'       => $data['estado']         ?? null,
                'ciudad'          => $data['ciudad'],
                'direccion'       => $data['direccion']      ?? null,
                'sexo'            => $data['sexo']           ?? null,
                'condicion'       => $data['condicion']      ?? null,
                'nacimiento'      => $data['nacimiento']     ?? null,
                'nacionalidad'    => $data['nacionalidad']   ?? null,
                'tipo_seguro'     => $data['tipo_seguro']    ?? null,
                'prima_estimada'  => $data['prima_estimada'] ?? null,
                'documentos'      => $docPaths,
                'subtipo_id'      => $data['subtipo_id']     ?? null,
                'tasaBCV'         => $tasaUsd,
                'tasaEUR'         => $tasaEur,
                'valor_mercado'   => $data['valor_mercado']  ?? ($data['bien_valor'] ?? null),
            ],
        ]);

        // 9. Enviar correo de confirmación al cliente — si falla, no debe
        // tumbar la solicitud (el lead ya quedó guardado de todas formas).
        try {
            Mail::to($data['email'])->queue(new CotizacionMail($solicitud));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['match' => false], 201);
    }

    /* ─────────────────────────────────────────────────────────────
       POST /api/portal/contacto
       El chatbot del portal usa esto cuando el cliente pide ser
       contactado: envía confirmación al cliente + aviso interno
       al asesor o técnico, según el motivo elegido.
    ───────────────────────────────────────────────────────────── */
    public function contacto(Request $request)
    {
        $data = $request->validate([
            'email'  => 'required|email|max:120',
            'motivo' => 'required|string|in:' . implode(',', SolicitudContacto::MOTIVOS),
        ]);

        // Anti-spam: evita que el mismo correo reciba confirmaciones repetidas
        // en pocos minutos (además del throttle por IP de la ruta).
        $correoNorm = strtolower(trim($data['email']));
        $cooldownKey = 'contacto_cooldown:' . $correoNorm;
        if (Cache::has($cooldownKey)) {
            return response()->json([
                'message' => 'Ya recibimos una solicitud con este correo hace muy poco. Espera unos minutos antes de enviar otra.',
            ], 429);
        }
        Cache::put($cooldownKey, true, now()->addMinutes(2));

        $destino = SolicitudContacto::destinoParaMotivo($data['motivo']);

        $solicitud = SolicitudContacto::create([
            'email'   => $data['email'],
            'motivo'  => $data['motivo'],
            'destino' => $destino,
            'ip'      => $request->ip(),
        ]);

        // El correo al cliente y al staff no debe tumbar la respuesta si falla.
        try {
            Mail::to($data['email'])->queue(new SolicitudContactoMail($solicitud));
        } catch (\Throwable $e) {
            report($e);
        }

        try {
            $destinatarios = $destino === 'tecnico'
                ? config('mail.soporte_destinatarios', [])
                : config('mail.asesor_destinatarios', []);

            foreach ($destinatarios as $correoInterno) {
                Mail::to($correoInterno)->queue(new SolicitudContactoInternaMail($solicitud));
            }
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['ok' => true], 201);
    }

    /* ─── helper privado ─────────────────────────────────────── */
    private function mapProducto(Producto $p, bool $conSubtiposFlag): array
    {
        $map = [
            'id'                   => $p->id,
            'nombre'               => $p->nombre,
            'tipo'                 => $p->tipo,
            'tipo_calculo'         => $p->tipo_calculo,
            'categoria'            => $p->categoria,
            'descripcion'          => $p->descripcion,
            'prima'                => (float) $p->prima,
            'derecho_poliza'       => (float) $p->derecho_poliza,
            'tipo_bien'            => $p->tipo_bien ?? 'ninguno',
            'documentos_requeridos'=> $p->documentos_requeridos ?? [],
        ];

        if ($conSubtiposFlag) {
            $map['tiene_subtipos'] = $p->subtipos()->exists();
        }

        return $map;
    }
}
