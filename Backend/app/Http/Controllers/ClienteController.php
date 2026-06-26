<?php

namespace App\Http\Controllers;

use App\Mail\BienvenidaMail;
use App\Mail\CambioClienteMail;
use App\Mail\ClienteBloqueadoMail;
use App\Mail\ClienteEliminadoMail;
use App\Models\BienAsegurado;
use App\Models\ClienteDocumento;
use App\Models\EmailLog;
use App\Models\IndicadorEconomico;
use App\Models\Persona;
use App\Models\Usuario;
use App\Models\Poliza;
use App\Rules\CedulaValida;
use App\Rules\CodigoPostalValido;
use App\Rules\NoInjectionChars;
use App\Rules\TelefonoValido;
use App\Support\Documento;
use App\Support\Moneda;
use App\Traits\LogsActivity;
use App\Traits\ScopesVendedor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

/**
 * CRUD de clientes (personas) para el panel interno.
 *
 * Tras eliminar la tabla `cliente` como capa de indirección, Persona
 * es el punto de entrada directo. Los campos activo y deleted_at
 * ahora viven en la propia tabla persona.
 */
class ClienteController extends Controller
{
    use LogsActivity, ScopesVendedor;

    /**
     * Búsqueda rápida de clientes para el wizard de cotización (Simulador) —
     * a propósito SIN el scope de "solo mis clientes" de index(): un
     * vendedor necesita saber si la persona YA es cliente de la empresa
     * (de cualquier asesor) para no duplicarla con una cédula repetida,
     * aunque no pueda gestionar el perfil completo de un cliente que no
     * es suyo. Devuelve solo lo necesario para identificarla y elegirla.
     */
    public function buscar(Request $request)
    {
        $noInjection = new NoInjectionChars();
        $data = $request->validate([
            'q' => ['required', 'string', 'min:1', 'max:50', $noInjection],
        ]);

        $personas = Persona::where(function ($query) use ($data) {
                $query->where('nombre', 'like', "%{$data['q']}%")
                      ->orWhere('cedula', 'like', "%{$data['q']}%");
            })
            ->orderBy('nombre')
            ->limit(8)
            ->get(['id', 'nombre', 'cedula', 'activo']);

        return response()->json($personas->map(fn ($p) => [
            'id'  => $p->id,
            'nom' => $p->nombre,
            'ci'  => $p->cedula,
            'est' => $p->activo ? 'Activo' : 'Bloqueado',
        ]));
    }

    /**
     * Lista los clientes. Admin, Oficina y cualquier usuario con el permiso
     * `clientes.view_all` ven todos. Los demás roles (vendedores) solo ven
     * los clientes con su propio vendedor_id — los que aún no tienen
     * vendedor asignado (leads del portal, datos previos a este campo) se
     * muestran a todos para no dejarlos huérfanos. Ver ScopesVendedor.
     */
    public function index()
    {
        $query = Persona::with(['solicitudes.polizas', 'solicitudes.producto', 'bienes', 'vendedor', 'documentos'])->withCount('documentos');
        $this->whereVendedorPropio($query);

        $personas = $query->get()
            ->map(function ($p) {
                $polizas = $p->solicitudes->flatMap->polizas;

                $activa  = $polizas->where('status', 'ACTIVA')->sortByDesc('fecha_emision')->first();
                $ultima  = $activa ?? $polizas->sortByDesc('fecha_emision')->first();
                $ultimaSolicitud = $ultima ? null : $p->solicitudes->sortByDesc('id')->first();

                if ($ultima) {
                    $pol      = $ultima->nro_contrato;
                    $vig      = $ultima->fecha_emision->format('d/m/Y') . ' – ' . $ultima->fecha_vencimiento->format('d/m/Y');
                    $prima    = Moneda::simbolo($ultima->monedaNativa()) . number_format($ultima->total, 2);
                    $polizaId = $ultima->id;
                } elseif ($ultimaSolicitud) {
                    $anno     = $ultimaSolicitud->fecha_solicitud?->format('Y') ?? now()->year;
                    $pol      = 'COT-' . $anno . '-' . str_pad($ultimaSolicitud->id, 5, '0', STR_PAD_LEFT);
                    $vig      = '—';
                    $monedaCot = Moneda::normalizar($ultimaSolicitud->moneda_producto ?? $ultimaSolicitud->producto?->moneda ?? 'USD');
                    $prima    = $ultimaSolicitud->total ? Moneda::simbolo($monedaCot) . number_format($ultimaSolicitud->total, 2) : '—';
                    $polizaId = null;
                } else {
                    $pol = '—'; $vig = '—'; $prima = '—'; $polizaId = null;
                }

                if (!$p->activo) {
                    $est = 'Bloqueado';
                } elseif ($activa) {
                    $est = 'Activo';
                } elseif ($ultima) {
                    $est = 'Inactivo';
                } elseif ($ultimaSolicitud) {
                    $est = $ultimaSolicitud->status;
                } else {
                    $est = 'Inactivo';
                }

                $monedaProducto = $ultima
                    ? $ultima->monedaNativa()
                    : Moneda::normalizar($ultimaSolicitud?->moneda_producto ?? $ultimaSolicitud?->producto?->moneda ?? 'USD');
                $row = $this->formatRow($p, $est, $pol, $vig, $prima, $polizaId, $monedaProducto);
                $row['fecha_vencimiento_iso'] = $ultima?->fecha_vencimiento?->format('Y-m-d');
                $row['dias_vencimiento']      = $ultima?->fecha_vencimiento
                    ? (int) now()->diffInDays($ultima->fecha_vencimiento, false)
                    : null;
                $row['poliza_status']         = $ultima?->status;
                $row['documentos_faltantes']  = $this->tieneDocumentosFaltantes($p);
                return $row;
            });

        return response()->json($personas);
    }

    public function store(Request $request)
    {
        $request->merge(['cedula' => Documento::normalizarCedula($request->input('cedula'))]);

        $noInjection = new NoInjectionChars();
        $data = $request->validate([
            'nombre'        => ['required', 'string', 'max:120', $noInjection],
            'cedula'        => ['required', 'string', 'max:20', 'unique:persona,cedula', new CedulaValida()],
            'condicion'     => ['required', 'string', 'max:40', $noInjection],
            'sexo'          => ['required', 'string', 'max:15', $noInjection],
            'nacimiento'    => 'required|date',
            'nacionalidad'  => ['required', 'string', 'max:30', $noInjection],
            'telefono'      => ['nullable', 'string', 'max:20', new TelefonoValido()],
            'celular'       => ['nullable', 'string', 'max:20', new TelefonoValido()],
            'correo'        => 'required|email|max:100',
            'estado'        => ['required', 'string', 'max:70', $noInjection],
            'ciudad'        => ['required', 'string', 'max:60', $noInjection],
            'codigo_postal' => ['nullable', 'string', 'max:10', new CodigoPostalValido()],
            'direccion'     => ['required', 'string', $noInjection],
            'profesion'     => ['nullable', 'string', 'max:50', $noInjection],
            'actividad'     => ['nullable', 'string', 'max:50', $noInjection],
        ]);

        foreach (['nombre','cedula','condicion','sexo','nacionalidad','estado','ciudad',
                  'codigo_postal','direccion','profesion','actividad'] as $field) {
            if (isset($data[$field])) $data[$field] = strip_tags(trim($data[$field]));
        }

        $data['activo']      = true;
        $data['vendedor_id'] = auth()->id();
        $persona = Persona::create($data);

        $this->logActivity('crear_cliente', "Cliente {$persona->nombre} (CI {$persona->cedula}) registrado", 'persona', auth()->id());

        if ($persona->correo) {
            try {
                Mail::to($persona->correo)->queue(new BienvenidaMail($persona));
                EmailLog::registrar('bienvenida', $persona->correo, 'Bienvenido/a a LA VENEZOLANA DE SEGUROS Y VIDA C.A.', $persona->id);
            } catch (\Throwable) {}
        }

        return response()->json(
            $this->formatRow($persona, 'Inactivo', '—', '—', '—', null),
            201
        );
    }

    public function update(Request $request, $id)
    {
        $persona = Persona::findOrFail($id);
        $this->assertAccesoCliente($persona);

        if ($request->filled('cedula')) {
            $request->merge(['cedula' => Documento::normalizarCedula($request->input('cedula'))]);
        }

        $noInjection = new NoInjectionChars();
        $data = $request->validate([
            'nombre'        => ['sometimes', 'required', 'string', 'max:120', $noInjection],
            'cedula'        => ['sometimes', 'required', 'string', 'max:20', 'unique:persona,cedula,' . $persona->id, new CedulaValida()],
            'condicion'     => ['sometimes', 'required', 'string', 'max:40', $noInjection],
            'sexo'          => ['sometimes', 'required', 'string', 'max:15', $noInjection],
            'nacimiento'    => 'sometimes|required|date',
            'nacionalidad'  => ['sometimes', 'required', 'string', 'max:30', $noInjection],
            'telefono'      => ['nullable', 'string', 'max:20', new TelefonoValido()],
            'celular'       => ['nullable', 'string', 'max:20', new TelefonoValido()],
            'correo'        => 'sometimes|required|email|max:100',
            'estado'        => ['sometimes', 'required', 'string', 'max:70', $noInjection],
            'ciudad'        => ['sometimes', 'required', 'string', 'max:60', $noInjection],
            'codigo_postal' => ['nullable', 'string', 'max:10', new CodigoPostalValido()],
            'direccion'     => ['sometimes', 'required', 'string', $noInjection],
            'profesion'     => ['nullable', 'string', 'max:50', $noInjection],
            'actividad'     => ['nullable', 'string', 'max:50', $noInjection],
        ]);

        foreach (['nombre','cedula','condicion','sexo','nacionalidad','estado','ciudad',
                  'codigo_postal','direccion','profesion','actividad'] as $field) {
            if (isset($data[$field])) $data[$field] = strip_tags(trim($data[$field]));
        }

        // Etiquetas legibles para el correo de notificación
        $etiquetas = [
            'nombre'        => 'Nombre completo',
            'cedula'        => 'Cédula / RIF',
            'condicion'     => 'Estado Civil',
            'sexo'          => 'Sexo',
            'nacimiento'    => 'Fecha de Nacimiento',
            'nacionalidad'  => 'Nacionalidad',
            'telefono'      => 'Teléfono',
            'celular'       => 'Celular',
            'correo'        => 'Correo Electrónico',
            'estado'        => 'Estado',
            'ciudad'        => 'Ciudad',
            'codigo_postal' => 'Código Postal',
            'direccion'     => 'Dirección',
            'profesion'     => 'Profesión',
            'actividad'     => 'Actividad Económica',
        ];

        // Capturar qué cambia ANTES de persistir
        $correoAnterior = $persona->correo;
        $cambios = [];
        foreach ($data as $campo => $nuevoValor) {
            $valorAnterior = $persona->getAttribute($campo);
            if ((string) $valorAnterior !== (string) $nuevoValor) {
                $cambios[$etiquetas[$campo] ?? $campo] = [
                    'anterior' => (string) ($valorAnterior ?? ''),
                    'nuevo'    => (string) ($nuevoValor ?? ''),
                ];
            }
        }

        $persona->update($data);

        if (!empty($cambios)) {
            $detalle = implode('; ', array_map(
                fn($campo, $c) => "{$campo}: '{$c['anterior']}' → '{$c['nuevo']}'",
                array_keys($cambios), $cambios
            ));
            $this->logActivity('editar_cliente', "Cliente {$persona->nombre} — {$detalle}", 'persona', auth()->id());
        }

        // Enviar notificación si hubo cambios y existe correo
        if (!empty($cambios)) {
            $correoNuevo  = $persona->fresh()->correo;
            $cambioCorrElectoral = isset($data['correo']) && $data['correo'] !== $correoAnterior;

            // Notificar al correo NUEVO (o actual si no cambió)
            if ($correoNuevo) {
                try {
                    Mail::to($correoNuevo)->queue(new CambioClienteMail(
                        nombre: $persona->nombre,
                        cambios: $cambios,
                        esCambioCorreo: $cambioCorrElectoral,
                    ));
                    EmailLog::registrar('cambio_cliente', $correoNuevo, 'Datos actualizados', $persona->id);
                } catch (\Throwable) {}
            }

            // Si cambió el correo, avisar también al correo ANTERIOR
            if ($cambioCorrElectoral && $correoAnterior && $correoAnterior !== $correoNuevo) {
                try {
                    Mail::to($correoAnterior)->queue(new CambioClienteMail(
                        nombre: $persona->nombre,
                        cambios: $cambios,
                        esCambioCorreo: true,
                    ));
                    EmailLog::registrar('cambio_correo_aviso', $correoAnterior, 'Aviso cambio de correo', $persona->id);
                } catch (\Throwable) {}
            }
        }

        return response()->json(['message' => 'Cliente actualizado correctamente']);
    }

    public function toggle(Request $request, $id)
    {
        $persona        = Persona::findOrFail($id);
        $this->assertAccesoCliente($persona);
        $bloqueando     = (bool) $persona->activo; // si estaba activo, lo estamos bloqueando

        $persona->activo = !$persona->activo;

        if ($bloqueando) {
            $motivo = trim($request->input('motivo', ''));
            $persona->motivo_bloqueo = $motivo ?: null;
        } else {
            $persona->motivo_bloqueo = null;
        }

        $persona->save();

        $msg = $persona->activo ? 'Cliente activado correctamente' : 'Cliente bloqueado correctamente';

        $this->logActivity(
            $bloqueando ? 'bloquear_cliente' : 'activar_cliente',
            "Cliente {$persona->nombre} (CI {$persona->cedula}) " . ($bloqueando ? "bloqueado — motivo: " . ($persona->motivo_bloqueo ?? 'sin especificar') : 'activado'),
            'persona',
            auth()->id()
        );

        if ($persona->correo) {
            try {
                Mail::to($persona->correo)->queue(
                    new ClienteBloqueadoMail($persona, !$persona->activo, $bloqueando ? $persona->motivo_bloqueo : null)
                );
                EmailLog::registrar(
                    tipo: $bloqueando ? 'cliente_bloqueado' : 'cliente_activado',
                    destinatario: $persona->correo,
                    asunto: $bloqueando ? 'Cuenta suspendida' : 'Cuenta reactivada',
                    personaId: $persona->id,
                );
            } catch (\Throwable) {}
        }

        return response()->json(['message' => $msg, 'activo' => (bool) $persona->activo]);
    }

    public function polizas($id)
    {
        $persona = Persona::with([
            'solicitudes.polizas.producto',
            'solicitudes.polizas.vendedor',
            'solicitudes.producto',
            'solicitudes.bien',
        ])->findOrFail($id);
        $this->assertAccesoCliente($persona);

        $polizas = $persona->solicitudes
            ->flatMap(function ($solicitud) {
                $bien = $solicitud->bien;
                $attr = $bien?->atributos ?? [];

                return $solicitud->polizas->map(function ($poliza) use ($solicitud, $bien, $attr) {
                    [$tasaUsd, $tasaEur] = $this->tasasParaPoliza($poliza);
                    return [
                        'id'                    => $poliza->id,
                        'nro_contrato'          => $poliza->nro_contrato,
                        'bien_tipo'             => $bien?->tipo ?? '—',
                        'bien_ref'              => $attr['placa'] ?? $attr['descripcion'] ?? '—',
                        'producto'              => $poliza->producto?->nombre ?? '—',
                        'producto_permite_multiples_bienes' => (bool) $poliza->producto?->permite_multiples_bienes,
                        'producto_max_bienes'               => $poliza->producto?->max_bienes,
                        'producto_aplica_beneficiarios'     => (bool) $poliza->producto?->aplica_beneficiarios,
                        'producto_max_beneficiarios'        => $poliza->producto?->max_beneficiarios,
                        'producto_permite_mensualidades'    => (bool) $poliza->producto?->permite_mensualidades,
                        'producto_recargo_mensual_pct'      => $poliza->producto?->recargo_mensual_pct,
                        'frecuencia_pago'                   => $poliza->frecuencia_pago,
                        'vendedor_id'           => $poliza->vendedor_id,
                        'vendedor_nombre'       => $poliza->vendedor?->nombre ?? '—',
                        'fecha_emision'         => $poliza->fecha_emision->format('d/m/Y'),
                        'fecha_vencimiento'     => $poliza->fecha_vencimiento->format('d/m/Y'),
                        'fecha_vencimiento_iso' => $poliza->fecha_vencimiento->format('Y-m-d'),
                        'fecha_sort'            => $poliza->fecha_emision->format('Y-m-d'),
                        'total'                 => (float) $poliza->total,
                        'total_bs'              => (float) $poliza->total_bs,
                        'tasa_emision'          => $tasaUsd,
                        'tasa_emision_eur'      => $tasaEur,
                        'moneda'                => $poliza->moneda ?? 'USD',
                        'moneda_producto'       => $poliza->monedaNativa(),
                        'cobertura_dolares'     => (float) $poliza->cobertura_dolares,
                        'cobertura_bs'          => (float) $poliza->cobertura_bs,
                        'pago'                  => $poliza->pago,
                        'status'                => $poliza->status,
                        'sede'                  => $poliza->sede_poliza ?? '—',
                        'nro_venezolana'        => $poliza->nro_venezolana,
                        'papeleria'             => $poliza->papeleria,
                        'bien_atributos'        => $attr,
                        'producto_documentos'   => array_map(
                            fn($d) => [
                                'nombre' => $d['nombre'],
                                'url'    => Storage::disk('public')->url($d['path']),
                            ],
                            $poliza->producto?->documentos ?? []
                        ),
                    ];
                });
            });

        $rechazadas = $persona->solicitudes
            ->where('status', 'rechazado')
            ->map(function ($sol) {
                $bien = $sol->bien;
                $attr = $bien?->atributos ?? [];
                $anno = $sol->fecha_solicitud?->format('Y') ?? now()->year;
                $nro  = 'COT-' . $anno . '-' . str_pad($sol->id, 5, '0', STR_PAD_LEFT);

                return [
                    'id'                    => null,
                    'solicitud_id'          => $sol->id,
                    'nro_contrato'          => $nro,
                    'bien_tipo'             => $bien?->tipo ?? '—',
                    'bien_ref'              => $attr['placa'] ?? $attr['descripcion'] ?? '—',
                    'producto'              => $sol->producto?->nombre ?? '—',
                    'fecha_emision'         => $sol->fecha_solicitud?->format('d/m/Y') ?? '—',
                    'fecha_vencimiento'     => '—',
                    'fecha_vencimiento_iso' => null,
                    'fecha_sort'            => $sol->fecha_solicitud?->format('Y-m-d') ?? '0000-00-00',
                    'total'                 => (float) $sol->total,
                    'total_bs'              => (float) $sol->total_bs,
                    'cobertura_dolares'     => 0,
                    'cobertura_bs'          => 0,
                    'pago'                  => '—',
                    'status'                => 'RECHAZADA',
                    'sede'                  => '—',
                    'bien_atributos'        => $attr,
                    'producto_documentos'   => [],
                ];
            });

        return response()->json(
            $polizas->concat($rechazadas)->sortByDesc('fecha_sort')->values()
        );
    }

    public function solicitudes($id)
    {
        $persona = Persona::with(['solicitudes.producto'])->findOrFail($id);
        $this->assertAccesoCliente($persona);

        $solicitudes = $persona->solicitudes
            ->sortByDesc(fn($s) => [$s->fecha_solicitud?->format('Y-m-d'), $s->id])
            ->map(function ($s) {
                $nro  = 'COT-' . ($s->fecha_solicitud?->format('Y') ?? now()->year) . '-' . str_pad($s->id, 5, '0', STR_PAD_LEFT);
                $cobs = is_array($s->coberturas) ? $s->coberturas : [];
                return [
                    'id'             => $s->id,
                    'nro'            => $nro,
                    'bien_ref'       => $s->bien?->atributos['placa'] ?? $s->bien?->descripcion ?? '—',
                    'bien_tipo'      => $s->bien?->tipo ?? '—',
                    'producto'       => $s->producto?->nombre ?? '—',
                    'total'          => (float) $s->total,
                    'total_bs'       => (float) $s->total_bs,
                    'moneda_producto' => Moneda::normalizar($s->moneda_producto ?? $s->producto?->moneda ?? 'USD'),
                    'status'         => $s->status ?? 'en_revision',
                    'fecha'          => $s->fecha_solicitud?->format('d/m/Y') ?? '—',
                    'nombre_tomador' => $s->nombre_tomador,
                    'ci_tomador'     => $s->ci_tomador,
                    'coberturas'     => $cobs,
                ];
            })
            ->values();

        return response()->json($solicitudes);
    }

    public function facturas($id)
    {
        $persona = Persona::with([
            'solicitudes.polizas.facturas.usuario',
            'solicitudes.polizas.producto',
        ])->findOrFail($id);
        $this->assertAccesoCliente($persona);

        $facturas = $persona->solicitudes
            ->flatMap(fn($sol) => $sol->polizas)
            ->flatMap(function ($poliza) {
                return $poliza->facturas->map(function ($f) use ($poliza) {
                    [$tasaUsd, $tasaEur] = $this->tasasParaPoliza($poliza);
                    return [
                        'id'              => $f->id,
                        'numero'          => $f->numero,
                        'sede'            => $f->sede,
                        'fecha_factura'   => $f->fecha_factura->format('d/m/Y'),
                        'fecha_sort'      => $f->fecha_factura->format('Y-m-d'),
                        'valor'           => (float) $f->valor,
                        'valor_bs'        => (float) $f->valor_bs,
                        'tasa_emision'    => $tasaUsd,
                        'tasa_emision_eur' => $tasaEur,
                        'moneda'          => $f->moneda ?? $poliza->moneda ?? 'USD',
                        'moneda_producto' => $poliza->monedaNativa(),
                        'forma_pago'      => $f->forma_pago,
                        'referencia'      => $f->referencia ?? '—',
                        'cajero'          => $f->usuario?->nombre ?? '—',
                        'poliza_nro'      => $poliza->nro_contrato,
                        'poliza_bien'     => $poliza->solicitud?->bien?->atributos['placa']
                                        ?? $poliza->solicitud?->bien?->descripcion ?? '—',
                        'poliza_producto' => $poliza->producto?->nombre ?? '—',
                        'poliza_status'   => $poliza->status,
                        'iva_aplica'      => (bool) $poliza->producto?->iva_aplica,
                        'iva_porcentaje'  => $poliza->producto?->iva_porcentaje !== null ? (float) $poliza->producto->iva_porcentaje : null,
                    ];
                });
            })
            ->sortByDesc('fecha_sort')
            ->values();

        return response()->json($facturas);
    }

    /**
     * Reasigna el vendedor (dueño) de un cliente. Acción interna gobernada por
     * el permiso clientes.reasignar — sin assertAccesoCliente, porque el punto
     * es justamente poder mover un cliente entre vendedores.
     */
    public function reasignarVendedor(Request $request, $id)
    {
        $persona = Persona::findOrFail($id);

        $data = $request->validate([
            'vendedor_id' => 'required|integer|exists:usuario,id',
        ]);

        $vendedor = Usuario::findOrFail($data['vendedor_id']);
        if (!$vendedor->activo) {
            return response()->json(['error' => 'El usuario seleccionado está inactivo.'], 422);
        }

        $anterior = $persona->vendedor_id;
        $persona->update(['vendedor_id' => $vendedor->id]);

        $this->logActivity(
            'reasignar_vendedor',
            "Cliente {$persona->nombre} reasignado a {$vendedor->nombre} (antes vendedor #" . ($anterior ?? '—') . ')',
            'persona',
            auth()->id()
        );

        return response()->json(['ok' => true, 'vendedor_nombre' => $vendedor->nombre]);
    }

    public function destroy($id)
    {
        $persona = Persona::with('solicitudes')->findOrFail($id);
        $this->assertAccesoCliente($persona);

        if ($persona->solicitudes->isNotEmpty()) {
            return response()->json(
                ['error' => 'No se puede eliminar un cliente con solicitudes o pólizas activas.'],
                409
            );
        }

        if ($persona->correo) {
            try {
                Mail::to($persona->correo)->queue(new ClienteEliminadoMail($persona->nombre, $persona->cedula));
                EmailLog::registrar('cliente_eliminado', $persona->correo, 'Cuenta eliminada', $persona->id);
            } catch (\Throwable) {}
        }

        $this->logActivity('eliminar_cliente', "Cliente {$persona->nombre} (CI {$persona->cedula}) eliminado", 'persona', auth()->id());

        $persona->delete();

        return response()->json(['message' => 'Cliente eliminado correctamente']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Devuelve [tasa_usd, tasa_eur] para una póliza dada.
     * Orden de preferencia:
     *   1. Columna tasa_emision / tasa_emision_eur de la póliza (si > 1)
     *   2. snapshot_datos['tasa_emision'] o snapshot_datos['tasa_bcv'] (si > 1)
     *   3. Registro de indicador_economico más reciente ≤ fecha_emision
     */
    /** Cache en memoria por request: fecha → [usd, eur] para evitar N+1 en listados */
    private array $tasasCache = [];

    private function tasasParaPoliza(\App\Models\Poliza $poliza): array
    {
        $snap  = $poliza->snapshot_datos ?? [];
        $fecha = $poliza->fecha_emision->format('Y-m-d');

        // USD — primero desde la póliza o snapshot
        $usd = (float) ($poliza->tasa_emision ?? 0);
        if ($usd <= 1) {
            $usd = max((float) ($snap['tasa_emision'] ?? 0), (float) ($snap['tasa_bcv'] ?? 0));
        }

        // EUR — primero desde la póliza
        $eur = (float) ($poliza->tasa_emision_eur ?? 0);

        // Solo consulta DB si ambas faltan; cachea por fecha para evitar repetir la query
        if ($usd <= 1 || $eur <= 1) {
            if (!isset($this->tasasCache[$fecha])) {
                $rows = IndicadorEconomico::whereIn('tipo', ['USD', 'EUR'])
                    ->where('fecha', '<=', $fecha)
                    ->orderByDesc('fecha')
                    ->get(['tipo', 'valor', 'fecha'])
                    ->groupBy('tipo')
                    ->map(fn($g) => (float) $g->first()->valor);

                $this->tasasCache[$fecha] = [
                    'usd' => $rows->get('USD', 0),
                    'eur' => $rows->get('EUR', 0),
                ];
            }

            if ($usd <= 1) $usd = $this->tasasCache[$fecha]['usd'];
            if ($eur <= 1) $eur = $this->tasasCache[$fecha]['eur'];
        }

        return [$usd, $eur];
    }

    /**
     * Antes el ícono de "faltan documentos" se mostraba con solo mirar si
     * documentos_count era 0 — aparecía incluso en clientes cuyo producto no
     * pide ningún documento. Ahora compara los documentos que el/los
     * producto(s) de sus solicitudes realmente exigen (obligatorio=true)
     * contra los que ya subió, por nombre. Las solicitudes rechazadas no
     * cuentan (no llegaron a generar una obligación real de subir nada).
     */
    private function tieneDocumentosFaltantes(Persona $p): bool
    {
        $requeridos = $p->solicitudes
            ->where('status', '!=', 'rechazado')
            ->pluck('producto.documentos_requeridos')
            ->filter()
            ->flatten(1)
            ->filter(fn($d) => !empty($d['obligatorio']))
            ->pluck('nombre')
            ->unique();

        if ($requeridos->isEmpty()) {
            return false;
        }

        $subidos = $p->documentos->pluck('nombre');

        return $requeridos->contains(fn($nombre) => !$subidos->contains($nombre));
    }

    private function formatRow(Persona $p, string $est, string $pol, string $vig, string $prima, ?int $polizaId, string $monedaProducto = 'USD'): array
    {
        return [
            'id'            => $p->id,
            'nom'           => $p->nombre,
            'ci'            => $p->cedula,
            'tel'           => $p->celular ?? $p->telefono ?? '—',
            'email'         => $p->correo ?? '—',
            'activo'        => (bool) $p->activo,
            'vendedor_id'   => $p->vendedor_id,
            'vendedor_nombre' => $p->vendedor?->nombre ?? null,
            'documentos_count' => $p->documentos_count ?? 0,
            'motivo_bloqueo' => $p->motivo_bloqueo,
            'est'           => $est,
            'poliza_id'     => $polizaId,
            'pol'           => $pol,
            'vig'           => $vig,
            'prima'         => $prima,
            'moneda_producto' => $monedaProducto,
            'nombre'        => $p->nombre,
            'cedula'        => $p->cedula,
            'condicion'     => $p->condicion,
            'sexo'          => $p->sexo,
            'nacimiento'    => $p->nacimiento?->format('Y-m-d'),
            'nacionalidad'  => $p->nacionalidad,
            'telefono'      => $p->telefono,
            'celular'       => $p->celular,
            'correo'        => $p->correo,
            'estado'        => $p->estado,
            'ciudad'        => $p->ciudad,
            'codigo_postal' => $p->codigo_postal,
            'direccion'     => $p->direccion,
            'profesion'     => $p->profesion,
            'actividad'     => $p->actividad,
            'fecha_registro' => $p->fecha_creacion?->format('d/m/Y'),
        ];
    }
}
