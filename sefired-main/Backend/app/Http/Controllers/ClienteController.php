<?php

namespace App\Http\Controllers;

use App\Models\BienAsegurado;
use App\Models\ClienteDocumento;
use App\Models\Persona;
use App\Models\Poliza;
use Illuminate\Http\Request;
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
    public function index()
    {
        $personas = Persona::with(['solicitudes.polizas', 'bienes'])
            ->get()
            ->map(function ($p) {
                $polizas = $p->solicitudes->flatMap->polizas;

                $activa  = $polizas->where('status', 'ACTIVA')->sortByDesc('fecha_emision')->first();
                $ultima  = $activa ?? $polizas->sortByDesc('fecha_emision')->first();
                $ultimaSolicitud = $ultima ? null : $p->solicitudes->sortByDesc('id')->first();

                if ($ultima) {
                    $pol      = $ultima->nro_contrato;
                    $vig      = $ultima->fecha_emision->format('d/m/Y') . ' – ' . $ultima->fecha_vencimiento->format('d/m/Y');
                    $prima    = '$' . number_format($ultima->total, 2);
                    $polizaId = $ultima->id;
                } elseif ($ultimaSolicitud) {
                    $anno     = $ultimaSolicitud->fecha_solicitud?->format('Y') ?? now()->year;
                    $pol      = 'COT-' . $anno . '-' . str_pad($ultimaSolicitud->id, 5, '0', STR_PAD_LEFT);
                    $vig      = '—';
                    $prima    = $ultimaSolicitud->total ? '$' . number_format($ultimaSolicitud->total, 2) : '—';
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

                return $this->formatRow($p, $est, $pol, $vig, $prima, $polizaId);
            });

        return response()->json($personas);
    }

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

        foreach (['nombre','cedula','condicion','sexo','nacionalidad','estado','ciudad',
                  'codigo_postal','direccion','profesion','actividad'] as $field) {
            if (isset($data[$field])) $data[$field] = strip_tags(trim($data[$field]));
        }

        $data['activo'] = true;
        $persona = Persona::create($data);

        return response()->json(
            $this->formatRow($persona, 'Inactivo', '—', '—', '—', null),
            201
        );
    }

    public function update(Request $request, $id)
    {
        $persona = Persona::findOrFail($id);

        $data = $request->validate([
            'nombre'        => 'sometimes|required|string|max:120',
            'cedula'        => 'sometimes|required|string|max:20|unique:persona,cedula,' . $persona->id,
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

        foreach (['nombre','cedula','condicion','sexo','nacionalidad','estado','ciudad',
                  'codigo_postal','direccion','profesion','actividad'] as $field) {
            if (isset($data[$field])) $data[$field] = strip_tags(trim($data[$field]));
        }

        $persona->update($data);

        return response()->json(['message' => 'Cliente actualizado correctamente']);
    }

    public function toggle($id)
    {
        $persona = Persona::findOrFail($id);
        $persona->activo = !$persona->activo;
        $persona->save();

        $msg = $persona->activo ? 'Cliente activado correctamente' : 'Cliente desactivado correctamente';
        return response()->json(['message' => $msg, 'activo' => (bool) $persona->activo]);
    }

    public function polizas($id)
    {
        $persona = Persona::with([
            'solicitudes.polizas.producto',
            'solicitudes.producto',
            'solicitudes.bien',
        ])->findOrFail($id);

        $polizas = $persona->solicitudes
            ->flatMap(function ($solicitud) {
                $bien = $solicitud->bien;
                $attr = $bien?->atributos ?? [];

                return $solicitud->polizas->map(function ($poliza) use ($solicitud, $bien, $attr) {
                    return [
                        'id'                    => $poliza->id,
                        'nro_contrato'          => $poliza->nro_contrato,
                        'bien_tipo'             => $bien?->tipo ?? '—',
                        'bien_ref'              => $attr['placa'] ?? $attr['descripcion'] ?? '—',
                        'producto'              => $poliza->producto?->nombre ?? '—',
                        'fecha_emision'         => $poliza->fecha_emision->format('d/m/Y'),
                        'fecha_vencimiento'     => $poliza->fecha_vencimiento->format('d/m/Y'),
                        'fecha_vencimiento_iso' => $poliza->fecha_vencimiento->format('Y-m-d'),
                        'fecha_sort'            => $poliza->fecha_emision->format('Y-m-d'),
                        'total'                 => (float) $poliza->total,
                        'total_bs'              => (float) $poliza->total_bs,
                        'cobertura_dolares'     => (float) $poliza->cobertura_dolares,
                        'cobertura_bs'          => (float) $poliza->cobertura_bs,
                        'pago'                  => $poliza->pago,
                        'status'                => $poliza->status,
                        'sede'                  => $poliza->sede_poliza ?? '—',
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

        $facturas = $persona->solicitudes
            ->flatMap(fn($sol) => $sol->polizas)
            ->flatMap(function ($poliza) {
                return $poliza->facturas->map(function ($f) use ($poliza) {
                    return [
                        'id'              => $f->id,
                        'numero'          => $f->numero,
                        'sede'            => $f->sede,
                        'fecha_factura'   => $f->fecha_factura->format('d/m/Y'),
                        'fecha_sort'      => $f->fecha_factura->format('Y-m-d'),
                        'valor'           => (float) $f->valor,
                        'valor_bs'        => (float) $f->valor_bs,
                        'forma_pago'      => $f->forma_pago,
                        'referencia'      => $f->referencia ?? '—',
                        'cajero'          => $f->usuario?->nombre ?? '—',
                        'poliza_nro'      => $poliza->nro_contrato,
                        'poliza_bien'     => $poliza->solicitud?->bien?->atributos['placa']
                                        ?? $poliza->solicitud?->bien?->descripcion ?? '—',
                        'poliza_producto' => $poliza->producto?->nombre ?? '—',
                        'poliza_status'   => $poliza->status,
                    ];
                });
            })
            ->sortByDesc('fecha_sort')
            ->values();

        return response()->json($facturas);
    }

    public function destroy($id)
    {
        $persona = Persona::with('solicitudes')->findOrFail($id);

        if ($persona->solicitudes->isNotEmpty()) {
            return response()->json(
                ['error' => 'No se puede eliminar un cliente con solicitudes o pólizas activas.'],
                409
            );
        }

        $persona->delete();

        return response()->json(['message' => 'Cliente eliminado correctamente']);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private function formatRow(Persona $p, string $est, string $pol, string $vig, string $prima, ?int $polizaId): array
    {
        return [
            'id'            => $p->id,
            'nom'           => $p->nombre,
            'ci'            => $p->cedula,
            'tel'           => $p->celular ?? $p->telefono ?? '—',
            'email'         => $p->correo ?? '—',
            'activo'        => (bool) $p->activo,
            'est'           => $est,
            'poliza_id'     => $polizaId,
            'pol'           => $pol,
            'vig'           => $vig,
            'prima'         => $prima,
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
    }
}
