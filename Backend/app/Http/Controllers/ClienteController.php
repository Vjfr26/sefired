<?php

namespace App\Http\Controllers;

use App\Mail\BienvenidaMail;
use App\Mail\CambioClienteMail;
use App\Mail\ClienteBloqueadoMail;
use App\Models\BienAsegurado;
use App\Models\ClienteDocumento;
use App\Models\EmailLog;
use App\Models\IndicadorEconomico;
use App\Models\Persona;
use App\Models\Poliza;
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

                $row = $this->formatRow($p, $est, $pol, $vig, $prima, $polizaId);
                $row['fecha_vencimiento_iso'] = $ultima?->fecha_vencimiento?->format('Y-m-d');
                $row['dias_vencimiento']      = $ultima?->fecha_vencimiento
                    ? (int) now()->diffInDays($ultima->fecha_vencimiento, false)
                    : null;
                $row['poliza_status']         = $ultima?->status;
                return $row;
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

        if ($persona->correo) {
            try {
                Mail::to($persona->correo)->queue(new BienvenidaMail($persona));
                EmailLog::registrar('bienvenida', $persona->correo, 'Bienvenido/a a J&M Seguros', $persona->id);
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
            'solicitudes.producto',
            'solicitudes.bien',
        ])->findOrFail($id);

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
                        'fecha_emision'         => $poliza->fecha_emision->format('d/m/Y'),
                        'fecha_vencimiento'     => $poliza->fecha_vencimiento->format('d/m/Y'),
                        'fecha_vencimiento_iso' => $poliza->fecha_vencimiento->format('Y-m-d'),
                        'fecha_sort'            => $poliza->fecha_emision->format('Y-m-d'),
                        'total'                 => (float) $poliza->total,
                        'total_bs'              => (float) $poliza->total_bs,
                        'tasa_emision'          => $tasaUsd,
                        'tasa_emision_eur'      => $tasaEur,
                        'moneda'                => $poliza->moneda ?? 'USD',
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
