<?php

namespace App\Http\Controllers;

use App\Mail\BienAseguradoMail;
use App\Models\BienAsegurado;
use App\Models\BienPersonaRol;
use App\Models\EmailLog;
use App\Models\Persona;
use App\Rules\NoInjectionChars;
use App\Traits\LogsActivity;
use App\Traits\ScopesVendedor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

/**
 * CRUD de bienes asegurados.
 *
 * Un bien asegurado es cualquier cosa que puede ser objeto de una póliza:
 * vehículo, inmueble, vida, bien genérico, etc.
 * El tipo se discrimina con `tipo` y los datos específicos van en `atributos` JSON.
 *
 * Rutas:
 *   GET    /api/bienes                → lista bienes del sistema
 *   GET    /api/bienes/{id}           → detalle con roles de personas
 *   POST   /api/bienes                → registrar nuevo bien
 *   PUT    /api/bienes/{id}           → actualizar bien
 *   DELETE /api/bienes/{id}           → eliminar (soft)
 *   POST   /api/bienes/{id}/personas  → agregar persona con rol al bien
 *   DELETE /api/bienes/{id}/personas/{rolId} → quitar rol
 */
class BienAseguradoController extends Controller
{
    use LogsActivity, ScopesVendedor;

    public function index(Request $request)
    {
        // Facetas para los desplegables de filtro (tipos y clases de vehículo).
        // Se resuelven con consultas DISTINCT baratas — no cargan filas completas.
        if ($request->boolean('facets')) {
            $tipos  = BienAsegurado::query()->select('tipo')->distinct()->orderBy('tipo')->pluck('tipo')->filter()->values();
            $clases = BienAsegurado::query()->where('tipo', 'vehiculo')
                ->selectRaw("JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.clase')) AS clase")
                ->distinct()->pluck('clase')->filter()->sort()->values();

            // Conteos por tipo para las tarjetas: sobre TODA la DB (mismo universo
            // con_poliza/vendedor que la lista), no sobre la página visible.
            $base = BienAsegurado::query();
            if ($this->esRolRestringido()) {
                $base->whereHas('persona', fn($q) => $this->whereVendedorPropio($q));
            }
            if ($request->boolean('con_poliza')) {
                $base->where(fn($q) => $q->has('polizaBienes')->orHas('solicitudes.polizas'));
            }
            $totalBienes = (clone $base)->count();
            $vehiculos   = (clone $base)->where('tipo', 'vehiculo')->count();
            $inmuebles   = (clone $base)->where('tipo', 'inmueble')->count();
            return response()->json([
                'tipos'   => $tipos,
                'clases'  => $clases,
                'resumen' => [
                    'total'    => $totalBienes,
                    'vehiculo' => $vehiculos,
                    'inmueble' => $inmuebles,
                    'otros'    => $totalBienes - $vehiculos - $inmuebles,
                ],
            ]);
        }

        $query = BienAsegurado::with(['persona.vendedor', 'roles.persona', 'solicitudes.polizas', 'polizaBienes.poliza'])
            ->orderByDesc('created_at');

        // Un vendedor solo ve los bienes de SUS clientes — igual que en
        // ClienteController::index(). Admin/Oficina ven todo.
        if ($this->esRolRestringido()) {
            $query->whereHas('persona', fn($q) => $this->whereVendedorPropio($q));
        }

        // La página de Bienes solo lista bienes asociados a una póliza (regla:
        // todo bien debe tener póliza). Los bienes "sueltos" de cotizaciones aún
        // no emitidas son borradores y no se muestran aquí. El selector de
        // "agregar bien a póliza" (que filtra por persona_id) sí los necesita,
        // por eso el filtro es opt-in con ?con_poliza=1.
        //
        // Un bien puede estar vinculado a su póliza de dos formas: por el pivot
        // poliza_bienes (modelo multi-bien actual) o por su solicitud (emisiones
        // antiguas / de un solo bien). Se aceptan AMBAS para no dejar fuera
        // bienes asegurados —típicamente inmuebles y otros tipos emitidos por el
        // flujo viejo— que sí tienen póliza pero no entrada en el pivot.
        if ($request->boolean('con_poliza')) {
            $query->where(function ($q) {
                $q->has('polizaBienes')->orHas('solicitudes.polizas');
            });
        }

        if ($request->filled('tipo')) {
            if ($request->input('tipo') === 'otros') {
                $query->whereNotIn('tipo', ['vehiculo', 'inmueble']);
            } else {
                $query->where('tipo', $request->tipo);
            }
        }
        if ($request->filled('clase')) {
            $query->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.clase')) = ?", [$request->input('clase')]);
        }
        if ($request->filled('persona_id')) {
            $query->where('persona_id', $request->persona_id);
        }

        // Búsqueda servidor: por placa (índice), marca/modelo (JSON) o dueño.
        if ($request->filled('search')) {
            $s = trim((string) $request->input('search'));
            $query->where(function ($q) use ($s) {
                $q->where('placa_idx', 'like', "%{$s}%")
                  ->orWhereRaw("JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.marca'))  LIKE ?", ["%{$s}%"])
                  ->orWhereRaw("JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.modelo')) LIKE ?", ["%{$s}%"])
                  ->orWhereHas('persona', fn ($p) => $p->where('nombre', 'like', "%{$s}%")
                                                       ->orWhere('cedula', 'like', "%{$s}%"));
            });
        }

        // Modo paginado (opt-in): con ?page o ?per_page se devuelve SOLO esa página
        // { data, total, page, per_page }. Sin esos parámetros se conserva el
        // comportamiento anterior (lista completa) — lo usan selectores como el de
        // "agregar bien a póliza" (?persona_id=…), que traen pocos registros.
        if ($request->filled('page') || $request->filled('per_page')) {
            $perPage = min(max((int) $request->input('per_page', 50), 1), 200);
            $p = $query->paginate($perPage);
            return response()->json([
                'data'     => collect($p->items())->map(fn ($b) => $this->formatBien($b))->all(),
                'total'    => $p->total(),
                'page'     => $p->currentPage(),
                'per_page' => $p->perPage(),
            ]);
        }

        return response()->json(
            $query->get()->map(fn($b) => $this->formatBien($b))
        );
    }

    public function show($id)
    {
        $bien = BienAsegurado::with(['persona.vendedor', 'roles.persona', 'solicitudes.producto', 'solicitudes.polizas', 'polizaBienes.poliza'])
            ->findOrFail($id);

        if ($bien->persona) {
            $this->assertAccesoCliente($bien->persona);
        }

        return response()->json($this->formatBien($bien, true));
    }

    public function store(Request $request)
    {
        $noInjection = new NoInjectionChars();

        $data = $request->validate([
            'persona_id'      => 'nullable|integer|exists:persona,id',
            'tipo'            => ['required', 'string', 'max:30', $noInjection],
            'atributos'       => 'nullable|array',
            'valor_declarado' => 'nullable|numeric|min:0',
            'descripcion'     => ['nullable', 'string', 'max:200', $noInjection],
            'observaciones'   => ['nullable', 'string', 'max:1000', $noInjection],
        ]);

        if (!empty($data['persona_id'])) {
            // Crear el bien a asegurar es parte de la emisión de una nueva
            // póliza: se permite para el cliente de otro vendedor (vender a
            // clientes ajenos). El resto de acciones sobre bienes sigue scoped.
            $this->assertAccesoCliente(Persona::findOrFail($data['persona_id']), permitirVenta: true);
        }

        // La placa tiene índice ÚNICO en BD (placa_idx, columna generada) que
        // incluye filas soft-borradas: sin este manejo el INSERT revienta con
        // 500 al reusar la placa de un bien existente o eliminado.
        $placa = strtoupper(trim((string) ($data['atributos']['placa'] ?? '')));
        if ($placa !== '') {
            $existente = BienAsegurado::withTrashed()->whereRaw('UPPER(placa_idx) = ?', [$placa])->first();
            if ($existente && $existente->trashed()) {
                // Bien previamente eliminado: se restaura con los datos nuevos.
                $existente->restore();
                $existente->update([...$data, 'created_by' => auth()->id()]);
                $this->logActivity('crear_bien', "Bien [{$existente->tipo}] reactivado (estaba eliminado) — ID {$existente->id}");
                return response()->json($this->formatBien($existente->fresh('persona')), 201);
            }
            if ($existente) {
                // Se reutiliza si es del mismo cliente, no tiene dueño, o su
                // dueño fue eliminado (bien huérfano que ocupa la placa). El
                // cotizador crea bienes SIN persona_id (se vinculan luego por
                // la solicitud), así que el reuso de huérfanos no exige dueño.
                $duenoActivo = $existente->persona_id !== null && $existente->persona !== null;
                $mismoDueno  = !empty($data['persona_id']) && (int) $existente->persona_id === (int) $data['persona_id'];
                // Borrador: bien sin ninguna póliza (ni directa ni vía
                // solicitud emitida) — no aparece en el listado de Bienes y
                // puede reasignarse sin conflicto real.
                $esBorrador = !$existente->polizaBienes()->exists()
                    && !$existente->solicitudes()->has('polizas')->exists();
                if (!$duenoActivo || $mismoDueno || $esBorrador) {
                    if (!empty($data['persona_id']) && (int) $existente->persona_id !== (int) $data['persona_id']) {
                        $existente->update(['persona_id' => $data['persona_id']]);
                    }
                    return response()->json($this->formatBien($existente->fresh('persona')), 200);
                }
                $dueno = $existente->persona?->nombre;
                return response()->json([
                    'error' => "La placa {$placa} ya está registrada" . ($dueno ? " a nombre de {$dueno}" : '') . '.',
                ], 422);
            }
        }

        $bien = BienAsegurado::create([
            ...$data,
            'created_by' => auth()->id(),
        ]);

        $this->logActivity('crear_bien', "Bien [{$bien->tipo}] registrado — ID {$bien->id}");

        $personaBien = $bien->fresh('persona')->persona;
        if ($personaBien?->correo) {
            try {
                Mail::to($personaBien->correo)->queue(new BienAseguradoMail($bien, 'registrado', $personaBien->nombre));
                EmailLog::registrar('bien_registrado', $personaBien->correo, 'Bien asegurado registrado', $personaBien->id);
            } catch (\Throwable) {}
        }

        return response()->json($this->formatBien($bien->fresh('persona')), 201);
    }

    public function update(Request $request, $id)
    {
        $bien = BienAsegurado::with('persona')->findOrFail($id);
        if ($bien->persona) {
            $this->assertAccesoCliente($bien->persona);
        }

        $noInjection = new NoInjectionChars();

        $data = $request->validate([
            'persona_id'      => 'sometimes|nullable|integer|exists:persona,id',
            'tipo'            => ['sometimes', 'string', 'max:30', $noInjection],
            'atributos'       => 'sometimes|nullable|array',
            'valor_declarado' => 'sometimes|nullable|numeric|min:0',
            'descripcion'     => ['sometimes', 'nullable', 'string', 'max:200', $noInjection],
            'observaciones'   => ['sometimes', 'nullable', 'string', 'max:1000', $noInjection],
        ]);

        // Si se reasigna a otra persona, esa persona también debe estar
        // dentro de la cartera del vendedor actual — si no, cualquiera
        // podía "mudar" un bien propio al cliente de otro vendedor.
        if (!empty($data['persona_id']) && $data['persona_id'] !== $bien->persona_id) {
            $this->assertAccesoCliente(Persona::findOrFail($data['persona_id']));
        }

        $antes = $this->snapshotAntes($bien);
        $bien->update($data);

        $this->logActivity('actualizar_bien', "Bien ID {$bien->id} — " . $this->describirCambios($bien, $antes));

        $personaBien = $bien->fresh('persona')->persona;
        if ($personaBien?->correo) {
            try {
                Mail::to($personaBien->correo)->queue(new BienAseguradoMail($bien, 'actualizado', $personaBien->nombre));
                EmailLog::registrar('bien_actualizado', $personaBien->correo, 'Bien asegurado actualizado', $personaBien->id);
            } catch (\Throwable) {}
        }

        return response()->json($this->formatBien($bien->fresh('persona')));
    }

    public function destroy($id)
    {
        $bien = BienAsegurado::with('persona')->findOrFail($id);
        if ($bien->persona) {
            $this->assertAccesoCliente($bien->persona);
        }
        $bien->delete();

        $this->logActivity('eliminar_bien', "Bien ID {$id} eliminado");

        return response()->json(null, 204);
    }

    /** Agregar una persona con un rol al bien */
    public function agregarPersona(Request $request, $id)
    {
        $bien = BienAsegurado::with('persona')->findOrFail($id);
        if ($bien->persona) {
            $this->assertAccesoCliente($bien->persona);
        }

        $noInjection = new NoInjectionChars();

        $data = $request->validate([
            'persona_id' => 'required|integer|exists:persona,id',
            'rol'        => ['required', 'string', 'max:30', $noInjection],
            'datos'      => 'nullable|array',
        ]);

        $this->assertAccesoCliente(Persona::findOrFail($data['persona_id']));

        $rol = BienPersonaRol::create([
            'bien_asegurado_id' => $bien->id,
            'persona_id'        => $data['persona_id'],
            'rol'               => $data['rol'],
            'datos'             => $data['datos'] ?? null,
        ]);

        return response()->json([
            'id'         => $rol->id,
            'persona_id' => $rol->persona_id,
            'rol'        => $rol->rol,
            'datos'      => $rol->datos,
        ], 201);
    }

    /** Quitar una persona/rol del bien */
    public function quitarPersona($id, $rolId)
    {
        $rol = BienPersonaRol::where('bien_asegurado_id', $id)->findOrFail($rolId);

        $bien = BienAsegurado::with('persona')->find($id);
        if ($bien?->persona) {
            $this->assertAccesoCliente($bien->persona);
        }

        $rol->delete();

        return response()->json(null, 204);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private function formatBien(BienAsegurado $b, bool $full = false): array
    {
        $out = [
            'id'              => $b->id,
            'tipo'            => $b->tipo,
            'atributos'       => $b->atributos,
            'valor_declarado' => $b->valor_declarado,
            'descripcion'     => $b->descripcion,
            'observaciones'   => $b->observaciones,
            'persona'         => $b->persona ? [
                'id'              => $b->persona->id,
                'nombre'          => $b->persona->nombre,
                'cedula'          => $b->persona->cedula,
                'vendedor_nombre' => $b->persona->vendedor?->nombre,
            ] : null,
            'roles'           => $b->roles->map(fn($r) => [
                'id'      => $r->id,
                'rol'     => $r->rol,
                'datos'   => $r->datos,
                'persona' => $r->persona ? [
                    'id'     => $r->persona->id,
                    'nombre' => $r->persona->nombre,
                    'cedula' => $r->persona->cedula,
                ] : null,
            ])->values(),
            'created_at'      => $b->created_at?->toDateTimeString(),
        ];

        // Incluir fechas de la póliza vigente (o última) asociada al bien.
        // La póliza que cubre el bien es la del pivot poliza_bienes — el mismo
        // vínculo autoritativo que usa Clientes para su N° de póliza. Antes se
        // derivaba de la solicitud del bien, que podía ser otra póliza (o
        // ninguna) cuando el bien se agregó a una póliza ya emitida, mostrando
        // un número distinto al de Clientes. La solicitud queda solo de respaldo.
        $polizas = $b->polizaBienes->map->poliza->filter();
        if ($polizas->isEmpty()) {
            $polizas = $b->solicitudes->flatMap->polizas;
        }
        if ($polizas->isNotEmpty()) {
            $activa  = $polizas->where('status', 'ACTIVA')->sortByDesc('fecha_emision')->first();
            $polVig  = $activa ?? $polizas->sortByDesc('fecha_emision')->first();
            if ($polVig) {
                $out['poliza_id']             = $polVig->id;
                $out['poliza_nro']            = $polVig->nro_contrato;
                $out['poliza_status']         = $polVig->status;
                $out['poliza_persona_id']     = $b->persona_id;
                $out['poliza_fecha_emision']  = $polVig->fecha_emision?->format('d/m/Y');
                $out['poliza_fecha_venc']     = $polVig->fecha_vencimiento?->format('d/m/Y');
                $out['poliza_venc_iso']       = $polVig->fecha_vencimiento?->format('Y-m-d');
                $out['dias_vencimiento']      = $polVig->fecha_vencimiento
                    ? (int) now()->diffInDays($polVig->fecha_vencimiento, false)
                    : null;
            }
        }

        if ($full) {
            $out['solicitudes'] = $b->solicitudes->map(fn($s) => [
                'id'       => $s->id,
                'status'   => $s->status,
                'producto' => $s->producto?->nombre,
                'total'    => $s->total,
            ])->values();
        }

        return $out;
    }
}
