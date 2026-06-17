<?php

namespace App\Http\Controllers;

use App\Models\BienAsegurado;
use App\Models\Persona;
use App\Models\Poliza;
use App\Models\Producto;
use App\Models\Solicitud;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
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
        $data = $request->validate([
            // Datos del cliente
            'nombre_completo'     => 'required|string|max:200',
            'cedula'              => 'required|string|max:20',
            'telefono'            => 'required|string|max:30',
            'email'               => 'nullable|email|max:120',
            'estado'              => 'nullable|string|max:60',
            'ciudad'              => 'required|string|max:80',
            'direccion'           => 'nullable|string|max:200',
            'sexo'                => 'nullable|string|max:10',
            'condicion'           => 'nullable|string|max:30',
            'nacimiento'          => 'nullable|date|before_or_equal:' . now()->subYears(18)->toDateString(),
            'nacionalidad'        => 'nullable|string|max:40',
            // Producto seleccionado
            'producto_id'         => 'nullable|integer|exists:producto,id',
            'subtipo_id'          => 'nullable|integer|exists:producto,id',
            'tipo_seguro'         => 'nullable|string|max:100',
            'prima_estimada'      => 'nullable|numeric|min:0',
            // Datos vehículo
            'placa'               => 'nullable|string|max:15',
            'marca'               => 'nullable|string|max:50',
            'modelo'              => 'nullable|string|max:80',
            'año'                 => 'nullable|string|max:4',
            'color'               => 'nullable|string|max:40',
            'uso'                 => 'nullable|string|max:50',
            'valor_mercado'       => 'nullable|numeric|min:0',
            // Datos bien genérico
            'bien_tipo'           => 'nullable|string|max:60',
            'bien_descripcion'    => 'nullable|string|max:200',
            'bien_valor'          => 'nullable|numeric|min:0',
            'bien_direccion'      => 'nullable|string|max:200',
            // Documentos adjuntos
            'documentos'          => 'nullable|array|max:10',
            'documentos.*'        => 'nullable|file|max:8192|mimes:pdf,jpg,jpeg,png,webp',
            'documentos_nombres'  => 'nullable|array',
            'documentos_nombres.*'=> 'nullable|string|max:100',
        ]);

        // 3. Normalizar cédula y nombre
        $cedula = strtoupper(preg_replace('/[^A-Z0-9]/i', '', trim($data['cedula'])));
        $nombre = trim($data['nombre_completo']);

        // 4. Verificar si ya existe como cliente
        $persona = Persona::where(function ($q) use ($cedula, $nombre) {
            $q->whereRaw(
                "UPPER(REPLACE(REPLACE(REPLACE(cedula, '-', ''), '.', ''), ' ', '')) = ?",
                [$cedula]
            )->orWhereRaw("LOWER(TRIM(nombre)) = LOWER(TRIM(?))", [$nombre]);
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

        // 4b. Deduplicación por cédula en leads existentes
        $leadExistente = Solicitud::whereRaw(
            "UPPER(REPLACE(REPLACE(REPLACE(ci_tomador, '-', ''), '.', ''), ' ', '')) = ?",
            [$cedula]
        )->exists();

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

        // 8. Crear lead (Solicitud pendiente)
        Solicitud::create([
            'nombre_tomador'    => $nombre,
            'ci_tomador'        => $data['cedula'],
            'bien_asegurado_id' => $bienId,
            'producto_id'       => $productoEfectivoId,
            'status'            => 'pendiente',
            'fuente'            => 'portal',
            'fecha_solicitud'   => now()->toDateString(),
            'coberturas'        => [[
                'telefono'        => $data['telefono'],
                'email'           => $data['email']          ?? null,
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
            ]],
        ]);

        return response()->json(['match' => false], 201);
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
