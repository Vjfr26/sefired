<?php

namespace App\Http\Controllers;

use App\Models\BienAsegurado;
use App\Models\BienPersonaRol;
use App\Models\Persona;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

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
    use LogsActivity;

    public function index(Request $request)
    {
        $query = BienAsegurado::with(['persona', 'roles.persona'])
            ->orderByDesc('created_at');

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }
        if ($request->filled('persona_id')) {
            $query->where('persona_id', $request->persona_id);
        }

        return response()->json(
            $query->get()->map(fn($b) => $this->formatBien($b))
        );
    }

    public function show($id)
    {
        $bien = BienAsegurado::with(['persona', 'roles.persona', 'solicitudes.producto'])
            ->findOrFail($id);

        return response()->json($this->formatBien($bien, true));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'persona_id'      => 'nullable|integer|exists:persona,id',
            'tipo'            => 'required|string|max:30',
            'atributos'       => 'nullable|array',
            'valor_declarado' => 'nullable|numeric|min:0',
            'descripcion'     => 'nullable|string|max:200',
        ]);

        $bien = BienAsegurado::create([
            ...$data,
            'created_by' => auth()->id(),
        ]);

        $this->logActivity('crear_bien', "Bien [{$bien->tipo}] registrado — ID {$bien->id}");

        return response()->json($this->formatBien($bien->fresh('persona')), 201);
    }

    public function update(Request $request, $id)
    {
        $bien = BienAsegurado::findOrFail($id);

        $data = $request->validate([
            'persona_id'      => 'sometimes|nullable|integer|exists:persona,id',
            'tipo'            => 'sometimes|string|max:30',
            'atributos'       => 'sometimes|nullable|array',
            'valor_declarado' => 'sometimes|nullable|numeric|min:0',
            'descripcion'     => 'sometimes|nullable|string|max:200',
        ]);

        $bien->update($data);

        $this->logActivity('actualizar_bien', "Bien ID {$bien->id} actualizado");

        return response()->json($this->formatBien($bien->fresh('persona')));
    }

    public function destroy($id)
    {
        $bien = BienAsegurado::findOrFail($id);
        $bien->delete();

        $this->logActivity('eliminar_bien', "Bien ID {$id} eliminado");

        return response()->json(null, 204);
    }

    /** Agregar una persona con un rol al bien */
    public function agregarPersona(Request $request, $id)
    {
        $bien = BienAsegurado::findOrFail($id);

        $data = $request->validate([
            'persona_id' => 'required|integer|exists:persona,id',
            'rol'        => 'required|string|max:30',
            'datos'      => 'nullable|array',
        ]);

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
            'persona'         => $b->persona ? [
                'id'     => $b->persona->id,
                'nombre' => $b->persona->nombre,
                'cedula' => $b->persona->cedula,
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
