<?php

namespace App\Http\Controllers;

use App\Models\Tarifario;
use App\Models\Producto;
use App\Rules\NoInjectionChars;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

/**
 * CRUD de tarifas por producto.
 *
 * Cada producto tiene N filas en `tarifario`, una por plan/nivel/categoría.
 * El campo `datos` (JSON) varía según producto.tipo_calculo:
 *   fijo     → { categoria, dependencia, suma_persona, prima_persona, suma_cosa, prima_cosa, prima_anual }
 *   por_plan → { plan, muerte_accidental:{suma,prima}, invalidez:{suma,prima}, medicos:{suma,prima}, funerarios:{suma,prima} }
 *   por_nivel→ { nivel, suma, prima }
 *   por_valor→ { tasa_pct }
 *
 * Rutas (ver api.php):
 *   GET  /api/productos/{id}/tarifario         → lista tarifas del producto
 *   POST /api/productos/{id}/tarifario         → crear tarifa
 *   PUT  /api/tarifario/{id}                   → actualizar tarifa
 *   DELETE /api/tarifario/{id}                 → eliminar tarifa
 */
class TarifarioController extends Controller
{
    use LogsActivity;

    /**
     * Lista las tarifas de un producto.
     * Por defecto solo las vigentes. Con ?historial=1 incluye las archivadas.
     */
    public function index(Request $request, $productoId)
    {
        $producto = Producto::findOrFail($productoId);

        $query = Tarifario::where('producto_id', $productoId)->orderBy('nombre');

        if (!$request->boolean('historial')) {
            $query->whereIn('estado', ['vigente', 'borrador']);
        }

        $tarifas = $query->get()->map(fn($t) => $this->row($t));

        return response()->json([
            'producto'     => [
                'id'           => $producto->id,
                'nombre'       => $producto->nombre,
                'tipo_calculo' => $producto->tipo_calculo,
            ],
            'tarifario' => $tarifas,
        ]);
    }

    /** Crea una nueva tarifa para el producto. */
    public function store(Request $request, $productoId)
    {
        Producto::findOrFail($productoId);

        $noInjection = new NoInjectionChars();

        $data = $request->validate([
            'nombre'  => ['required', 'string', 'max:100', $noInjection],
            'subtipo' => ['nullable', 'string', 'max:50', $noInjection],
            'datos'   => 'required|array',
            'activo'  => 'boolean',
        ]);

        $data['producto_id'] = $productoId;
        $data['activo']      = $data['activo'] ?? true;

        $tarifa = Tarifario::create($data);

        $this->logActivity('Tarifario Creado', "Tarifa #{$tarifa->id} — {$tarifa->nombre}", 'tarifario', auth()->id());

        return response()->json($this->row($tarifa), 201);
    }

    /**
     * Actualiza una tarifa.
     *
     * Si cambian los `datos` (las tasas/primas), se crea una NUEVA VERSIÓN:
     *   1. La versión actual pasa a estado='archivado' con vigencia_hasta=hoy.
     *   2. Se crea una fila nueva con version+1, parent_id apuntando a la anterior.
     * Las pólizas ya emitidas siguen referenciando la versión original.
     *
     * Cambios de nombre/subtipo/activo se aplican en el mismo registro (no son tasas).
     */
    public function update(Request $request, $id)
    {
        $tarifa = Tarifario::findOrFail($id);

        $noInjection = new NoInjectionChars();

        $data = $request->validate([
            'nombre'  => ['sometimes', 'required', 'string', 'max:100', $noInjection],
            'subtipo' => ['nullable', 'string', 'max:50', $noInjection],
            'datos'   => 'sometimes|required|array',
            'activo'  => 'sometimes|boolean',
        ]);

        // Si cambian los datos tarifarios → generar nueva versión
        if (isset($data['datos'])) {
            $hoy = now()->toDateString();

            // Archivar versión actual
            $tarifa->update([
                'estado'         => 'archivado',
                'vigencia_hasta' => $hoy,
                'activo'         => false,
            ]);

            // Crear versión nueva
            $nueva = Tarifario::create([
                'producto_id'    => $tarifa->producto_id,
                'nombre'         => $data['nombre']  ?? $tarifa->nombre,
                'subtipo'        => $data['subtipo'] ?? $tarifa->subtipo,
                'datos'          => $data['datos'],
                'activo'         => $data['activo']  ?? true,
                'version'        => $tarifa->version + 1,
                'parent_id'      => $tarifa->id,
                'estado'         => 'vigente',
                'vigencia_desde' => $hoy,
                'vigencia_hasta' => null,
                'creado_por'     => auth()->id(),
            ]);

            $this->logActivity(
                'Tarifario Versionado',
                "Tarifa #{$tarifa->id} archivada → nueva versión #{$nueva->id} (v{$nueva->version})",
                'tarifario',
                auth()->id()
            );

            return response()->json($this->row($nueva), 201);
        }

        // Solo metadata (nombre, subtipo, activo): edición en lugar
        $tarifa->update($data);
        $this->logActivity('Tarifario Actualizado', "Tarifa #{$id} — {$tarifa->nombre}", 'tarifario', auth()->id());

        return response()->json($this->row($tarifa->fresh()));
    }

    /** Elimina una tarifa (solo si no está referenciada en solicitudes activas). */
    public function destroy($id)
    {
        $tarifa = Tarifario::withCount('solicitudes')->findOrFail($id);

        if ($tarifa->solicitudes_count > 0) {
            return response()->json(
                ['error' => 'No se puede eliminar una tarifa con solicitudes asociadas.'],
                409
            );
        }

        $tarifa->delete();

        return response()->json(['message' => 'Tarifa eliminada correctamente']);
    }

    private function row(Tarifario $t): array
    {
        return [
            'id'             => $t->id,
            'producto_id'    => $t->producto_id,
            'nombre'         => $t->nombre,
            'subtipo'        => $t->subtipo,
            'datos'          => $t->datos,
            'activo'         => (bool) $t->activo,
            'version'        => $t->version ?? 1,
            'estado'         => $t->estado ?? 'vigente',
            'vigencia_desde' => $t->vigencia_desde?->toDateString(),
            'vigencia_hasta' => $t->vigencia_hasta?->toDateString(),
            'parent_id'      => $t->parent_id,
            'created_at'     => $t->created_at?->toDateTimeString(),
        ];
    }
}
