<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Persona;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * CRUD de clientes para el panel interno.
 *
 * Estructura de datos:
 *   cliente → persona (datos personales: cedula, nombre, telefono, correo)
 *   cliente → solicitudes → polizas (historial de pólizas contratadas)
 *
 * Rutas registradas en routes/api.php (prefijo /api, sin CSRF):
 *   GET    /api/clientes
 *   POST   /api/clientes
 *   PUT    /api/clientes/{id}
 *   DELETE /api/clientes/{id}
 */
class ClienteController extends Controller
{
    /**
     * Lista todos los clientes con el resumen de su última póliza.
     *
     * La cadena de relaciones es: cliente → solicitudes → polizas.
     * flatMap aplana las pólizas de todas las solicitudes de un cliente
     * para poder buscar la más reciente sin importar cuántas solicitudes tenga.
     *
     * Estado del cliente:
     *   - "Activo"   → tiene al menos una póliza con status = 'ACTIVA'
     *   - "Inactivo" → no tiene pólizas activas (puede tener vencidas)
     */
    public function index()
    {
        $clientes = Cliente::with(['persona', 'solicitudes.polizas'])
            ->get()
            ->map(function ($c) {
                // Aplana todas las pólizas oficiales del cliente
                $polizas = $c->solicitudes->flatMap->polizas;

                $activa = $polizas->where('status', 'ACTIVA')->sortByDesc('fecha_emision')->first();
                $ultima = $activa ?? $polizas->sortByDesc('fecha_emision')->first();

                // Si no hay póliza oficial, buscar la solicitud más reciente
                $ultimaSolicitud = $ultima ? null : $c->solicitudes->sortByDesc('id')->first();

                // Número y vigencia mostrados en tabla
                if ($ultima) {
                    $pol   = $ultima->nro_contrato;
                    $vig   = $ultima->fecha_emision->format('d/m/Y') . ' – ' . $ultima->fecha_vencimiento->format('d/m/Y');
                    $prima = '$' . number_format($ultima->total, 2);
                    $polizaId = $ultima->id;
                } elseif ($ultimaSolicitud) {
                    $anno  = $ultimaSolicitud->fecha_solicitud?->format('Y') ?? now()->year;
                    $pol   = 'COT-' . $anno . '-' . str_pad($ultimaSolicitud->id, 5, '0', STR_PAD_LEFT);
                    $vig   = '—';
                    $prima = $ultimaSolicitud->total ? '$' . number_format($ultimaSolicitud->total, 2) : '—';
                    $polizaId = null;
                } else {
                    $pol      = '—';
                    $vig      = '—';
                    $prima    = '—';
                    $polizaId = null;
                }

                // Estado visible: prioriza póliza activa, luego solicitud más reciente
                if (!$c->activo) {
                    $est = 'Bloqueado';
                } elseif ($activa) {
                    $est = 'Activo';
                } elseif ($ultima) {
                    $est = 'Inactivo';
                } elseif ($ultimaSolicitud) {
                    $est = $ultimaSolicitud->status; // 'En Revisión', 'Aprobado', 'Rechazado'
                } else {
                    $est = 'Inactivo';
                }

                $p = $c->persona;
                return [
                    // ── Campos de visualización en tabla ──
                    'id'    => $c->id,
                    'nom'   => $p->nombre,
                    'ci'    => $p->cedula,
                    // celular tiene prioridad sobre teléfono fijo para mostrar en tabla
                    'tel'   => $p->celular ?? $p->telefono ?? '—',
                    'email' => $p->correo ?? '—',
                    'activo' => (bool) $c->activo,
                    'est'      => $est,
                    'poliza_id' => $polizaId,
                    'pol'   => $pol,
                    'vig'   => $vig,
                    'prima' => $prima,

                    // ── Campos completos de persona para pre-llenar el formulario de edición ──
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
                ];
            });

        return response()->json($clientes);
    }

    /**
     * Crea un nuevo cliente.
     *
     * El diseño separa "persona" (datos generales reutilizables) de "cliente"
     * (rol dentro del sistema). Primero se crea la persona y luego se le asigna
     * el rol de cliente enlazándola mediante persona_id.
     *
     * La cédula debe ser única en la tabla persona; se valida aquí para devolver
     * un error claro antes de llegar a la DB.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre'        => 'required|string|max:120',
            'cedula'        => 'required|string|max:20|unique:persona,cedula',
            'condicion'     => 'required|string|max:40',
            'sexo'          => 'required|string|max:15',
            'nacimiento'    => 'required|date',
            'nacionalidad'  => 'required|string|max:30',
            'telefono'      => 'nullable|string|max:20',
            'celular'       => 'nullable|string|max:20',
            'correo'        => 'required|email|max:100',
            'estado'        => 'required|string|max:70',
            'ciudad'        => 'required|string|max:60',
            'codigo_postal' => 'nullable|string|max:10',
            'direccion'     => 'required|string',
            'profesion'     => 'nullable|string|max:50',
            'actividad'     => 'nullable|string|max:50',
        ]);

        // Sanitización: elimina etiquetas HTML de campos de texto libre para prevenir XSS en PDFs
        foreach (['nombre','cedula','condicion','sexo','nacionalidad','estado','ciudad',
                  'codigo_postal','direccion','profesion','actividad'] as $field) {
            if (isset($data[$field])) {
                $data[$field] = strip_tags(trim($data[$field]));
            }
        }

        $persona = Persona::create($data);
        $cliente = Cliente::create(['persona_id' => $persona->id, 'activo' => true]);

        // El nuevo cliente arranca sin pólizas: est = Inactivo, pol/vig/prima = '—'
        return response()->json([
            'id'            => $cliente->id,
            'nom'           => $persona->nombre,
            'ci'            => $persona->cedula,
            'tel'           => $persona->celular ?? $persona->telefono ?? '—',
            'email'         => $persona->correo ?? '—',
            'activo'        => true,
            'est'           => 'Inactivo',
            'pol'           => '—',
            'vig'           => '—',
            'prima'         => '—',
            'nombre'        => $persona->nombre,
            'cedula'        => $persona->cedula,
            'condicion'     => $persona->condicion,
            'sexo'          => $persona->sexo,
            'nacimiento'    => $persona->nacimiento?->format('Y-m-d'),
            'nacionalidad'  => $persona->nacionalidad,
            'telefono'      => $persona->telefono,
            'celular'       => $persona->celular,
            'correo'        => $persona->correo,
            'estado'        => $persona->estado,
            'ciudad'        => $persona->ciudad,
            'codigo_postal' => $persona->codigo_postal,
            'direccion'     => $persona->direccion,
            'profesion'     => $persona->profesion,
            'actividad'     => $persona->actividad,
        ], 201);
    }

    /**
     * Actualiza los datos personales de un cliente.
     *
     * Solo se modifican los campos enviados en la request (PATCH semántico con PUT).
     * array_key_exists en lugar de isset() para permitir vaciar campos opcionales
     * enviando null explícitamente.
     *
     * La validación unique excluye la propia persona del cliente para que pueda
     * guardar sin cambiar su cédula (unique:tabla,columna,id_a_ignorar).
     */
    public function update(Request $request, $id)
    {
        $cliente = Cliente::with('persona')->findOrFail($id);

        $data = $request->validate([
            'nombre'        => 'sometimes|required|string|max:120',
            // Excluye el persona_id actual para no conflictar consigo mismo
            'cedula'        => 'sometimes|required|string|max:20|unique:persona,cedula,' . $cliente->persona_id,
            'condicion'     => 'sometimes|required|string|max:40',
            'sexo'          => 'sometimes|required|string|max:15',
            'nacimiento'    => 'sometimes|required|date',
            'nacionalidad'  => 'sometimes|required|string|max:30',
            'telefono'      => 'nullable|string|max:20',
            'celular'       => 'nullable|string|max:20',
            'correo'        => 'sometimes|required|email|max:100',
            'estado'        => 'sometimes|required|string|max:70',
            'ciudad'        => 'sometimes|required|string|max:60',
            'codigo_postal' => 'nullable|string|max:10',
            'direccion'     => 'sometimes|required|string',
            'profesion'     => 'nullable|string|max:50',
            'actividad'     => 'nullable|string|max:50',
        ]);

        // Sanitización: elimina etiquetas HTML de campos de texto libre para prevenir XSS en PDFs
        foreach (['nombre','cedula','condicion','sexo','nacionalidad','estado','ciudad',
                  'codigo_postal','direccion','profesion','actividad'] as $field) {
            if (isset($data[$field])) {
                $data[$field] = strip_tags(trim($data[$field]));
            }
        }

        $allowed = ['nombre','cedula','condicion','sexo','nacimiento','nacionalidad',
                    'telefono','celular','correo','estado','ciudad',
                    'codigo_postal','direccion','profesion','actividad'];

        $update = array_intersect_key($data, array_flip($allowed));

        $cliente->persona->update($update);

        return response()->json(['message' => 'Cliente actualizado correctamente']);
    }

    /**
     * Activa o desactiva un cliente (toggle del campo activo).
     *
     * Un cliente desactivado aparece como "Bloqueado" en el panel y no puede
     * operar, aunque sus pólizas y datos se conservan intactos.
     */
    public function toggle($id)
    {
        $cliente = Cliente::findOrFail($id);
        $cliente->activo = !$cliente->activo;
        $cliente->save();

        $msg = $cliente->activo ? 'Cliente activado correctamente' : 'Cliente desactivado correctamente';
        return response()->json(['message' => $msg, 'activo' => (bool) $cliente->activo]);
    }

    /**
     * Devuelve el historial completo de pólizas de un cliente.
     *
     * La cadena de relaciones es: cliente → solicitudes → polizas → producto.
     * La placa del vehículo se obtiene de la solicitud (solicitud.placa).
     * Las pólizas se devuelven ordenadas de más reciente a más antigua.
     */
    public function polizas($id)
    {
        $cliente = Cliente::with([
            'solicitudes.polizas.producto',
            'solicitudes.producto',
            'vehiculos.modeloVehiculo',
        ])->findOrFail($id);

        // Pólizas emitidas (solicitudes con polizas en la tabla poliza)
        $polizas = $cliente->solicitudes
            ->flatMap(function ($solicitud) use ($cliente) {
                $veh = $cliente->vehiculos->firstWhere('placa', $solicitud->placa);

                return $solicitud->polizas->map(function ($poliza) use ($solicitud, $veh) {
                    return [
                        'id'                    => $poliza->id,
                        'nro_contrato'          => $poliza->nro_contrato,
                        'placa'                 => $solicitud->placa,
                        'producto'              => $poliza->producto->nombre ?? '—',
                        'fecha_emision'         => $poliza->fecha_emision->format('d/m/Y'),
                        'fecha_vencimiento'     => $poliza->fecha_vencimiento->format('d/m/Y'),
                        'fecha_vencimiento_iso' => $poliza->fecha_vencimiento->format('Y-m-d'),
                        'fecha_sort'            => $poliza->fecha_emision->format('Y-m-d'),
                        'total'                 => (float) $poliza->total,
                        'total_bs'              => (float) $poliza->total_bs,
                        'cobertura_dolares'     => (float) $poliza->cobertura_dolares,
                        'cobertura_bs'          => (float) $poliza->cobertura_bs,
                        'pago'                  => $poliza->pago,
                        'tipo'                  => $poliza->tipo,
                        'status'                => $poliza->status,
                        'sede'                  => $poliza->sede_poliza ?? '—',
                        'veh_marca'             => $veh?->modeloVehiculo?->marca ?? '—',
                        'veh_modelo'            => $veh?->modeloVehiculo?->modelo ?? '—',
                        'veh_anio'              => $veh?->anio   ?? '—',
                        'veh_tipo'              => $veh?->tipo   ?? '—',
                        'veh_color'             => $veh?->color  ?? '—',
                        'veh_serial_carroceria' => $veh?->serial_carroceria ?? '—',
                        'veh_serial_motor'      => $veh?->serial_motor ?? '—',
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

        // Solicitudes rechazadas: no tienen póliza pero deben aparecer en el historial
        $rechazadas = $cliente->solicitudes
            ->where('status', 'Rechazado')
            ->map(function ($sol) use ($cliente) {
                $veh = $cliente->vehiculos->firstWhere('placa', $sol->placa);
                $anno = $sol->fecha_solicitud?->format('Y') ?? now()->year;
                $nro  = 'COT-' . $anno . '-' . str_pad($sol->id, 5, '0', STR_PAD_LEFT);

                return [
                    'id'                    => null,
                    'solicitud_id'          => $sol->id,
                    'nro_contrato'          => $nro,
                    'placa'                 => $sol->placa,
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
                    'tipo'                  => '—',
                    'status'                => 'RECHAZADA',
                    'sede'                  => '—',
                    'veh_marca'             => $veh?->modeloVehiculo?->marca ?? '—',
                    'veh_modelo'            => $veh?->modeloVehiculo?->modelo ?? '—',
                    'veh_anio'              => $veh?->anio   ?? '—',
                    'veh_tipo'              => $veh?->tipo   ?? '—',
                    'veh_color'             => $veh?->color  ?? '—',
                    'veh_serial_carroceria' => $veh?->serial_carroceria ?? '—',
                    'veh_serial_motor'      => $veh?->serial_motor ?? '—',
                    'producto_documentos'   => [],
                ];
            });

        $all = $polizas->concat($rechazadas)->sortByDesc('fecha_sort')->values();

        return response()->json($all);
    }

    /**
     * Devuelve todas las cotizaciones (solicitudes) de un cliente, con cualquier estado.
     * Incluye: En Revisión, Aprobado, Emitida, Rechazado.
     */
    public function solicitudes($id)
    {
        $cliente = Cliente::with(['solicitudes.producto'])->findOrFail($id);

        $solicitudes = $cliente->solicitudes
            ->sortByDesc(fn($s) => [$s->fecha_solicitud?->format('Y-m-d'), $s->id])
            ->map(function ($s) {
                $nro = 'COT-' . ($s->fecha_solicitud?->format('Y') ?? now()->year) . '-' . str_pad($s->id, 5, '0', STR_PAD_LEFT);
                $cobs = is_array($s->coberturas) ? $s->coberturas : [];
                return [
                    'id'             => $s->id,
                    'nro'            => $nro,
                    'placa'          => $s->placa,
                    'producto'       => $s->producto?->nombre ?? '—',
                    'total'          => (float) $s->total,
                    'total_bs'       => (float) $s->total_bs,
                    'status'         => $s->status ?? 'En Revisión',
                    'fecha'          => $s->fecha_solicitud?->format('d/m/Y') ?? '—',
                    'nombre_tomador' => $s->nombre_tomador,
                    'ci_tomador'     => $s->ci_tomador,
                    'coberturas'     => $cobs,
                ];
            })
            ->values();

        return response()->json($solicitudes);
    }

    /**
     * Devuelve todas las facturas emitidas para las pólizas de un cliente.
     * La cadena es: cliente → solicitudes → polizas → facturas.
     * Se devuelven ordenadas de más reciente a más antigua.
     */
    public function facturas($id)
    {
        $cliente = Cliente::with([
            'solicitudes.polizas.facturas.usuario',
            'solicitudes.polizas.producto',
        ])->findOrFail($id);

        $facturas = $cliente->solicitudes
            ->flatMap(fn($sol) => $sol->polizas)
            ->flatMap(function ($poliza) use ($cliente) {
                return $poliza->facturas->map(function ($f) use ($poliza) {
                    return [
                        'id'             => $f->id,
                        'numero'         => $f->numero,
                        'sede'           => $f->sede,
                        'fecha_factura'  => $f->fecha_factura->format('d/m/Y'),
                        'fecha_sort'     => $f->fecha_factura->format('Y-m-d'),
                        'valor'          => (float) $f->valor,
                        'valor_bs'       => (float) $f->valor_bs,
                        'forma_pago'     => $f->forma_pago,
                        'referencia'     => $f->referencia ?? '—',
                        'cajero'         => $f->usuario?->nombre ?? '—',
                        'poliza_nro'     => $poliza->nro_contrato,
                        'poliza_placa'   => $poliza->solicitud?->placa ?? '—',
                        'poliza_producto'=> $poliza->producto?->nombre ?? '—',
                        'poliza_status'  => $poliza->status,
                    ];
                });
            })
            ->sortByDesc('fecha_sort')
            ->values();

        return response()->json($facturas);
    }

    /**
     * Elimina un cliente y su persona asociada.
     *
     * Se bloquea la eliminación si el cliente tiene solicitudes registradas
     * para preservar el historial de pólizas y facturas (integridad referencial).
     *
     * Se elimina la persona después del cliente porque la FK cliente→persona
     * tiene onDelete('cascade') en dirección contraria: si se elimina la persona
     * primero, el cascade borraría el cliente automáticamente, pero también podría
     * afectar a tomadores o conductores que compartan el mismo persona_id.
     */
    public function destroy($id)
    {
        $cliente = Cliente::with('solicitudes')->findOrFail($id);

        // Protege el historial: no se pueden borrar clientes con pólizas emitidas
        if ($cliente->solicitudes->isNotEmpty()) {
            return response()->json(
                ['error' => 'No se puede eliminar un cliente con solicitudes o pólizas activas.'],
                409
            );
        }

        $personaId = $cliente->persona_id;
        $cliente->delete();
        Persona::destroy($personaId); // solo si no tiene otros roles (tomador, conductor)

        return response()->json(['message' => 'Cliente eliminado correctamente']);
    }
}
