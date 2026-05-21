<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use Illuminate\Http\Request;

/**
 * CRUD de productos (coberturas de seguro) para el panel interno.
 *
 * Un "producto" en Sefired es una cobertura que se puede contratar:
 * por ejemplo "Casco Pérdida Total", "Responsabilidad Civil Voluntaria", etc.
 * Cada producto tiene una prima (costo anual) y una cobertura (suma máxima asegurada).
 *
 * Tabla: producto (id, nombre, descripcion, prima, cobertura, moneda)
 *
 * Rutas registradas en routes/api.php (prefijo /api):
 *   GET    /api/productos          → lista ordenada alfabéticamente
 *   POST   /api/productos          → crear nuevo producto
 *   PUT    /api/productos/{id}     → editar producto existente
 *   DELETE /api/productos/{id}     → eliminar (bloqueado si tiene pólizas asociadas)
 */
class ProductoController extends Controller
{
    /**
     * Lista todos los productos ordenados por nombre.
     * El orden alfabético facilita encontrar coberturas en el simulador.
     */
    public function index()
    {
        return response()->json(
            Producto::orderBy('nombre')->get()->map(fn($p) => $this->row($p))
        );
    }

    /**
     * Crea un nuevo producto en el catálogo de coberturas.
     * Todos los campos son obligatorios al crear un producto.
     * La moneda puede ser 'USD', 'BS' o 'EUR'.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre'      => 'required|string|max:150',
            'descripcion' => 'required|string',
            'prima'       => 'required|numeric|min:0',
            'cobertura'   => 'required|numeric|min:0',
            'moneda'      => 'required|string|in:USD,BS,EUR',
        ]);

        $producto = Producto::create($data);

        return response()->json($this->row($producto), 201);
    }

    /**
     * Actualiza los datos de un producto existente.
     * Solo se modifican los campos enviados (el resto no se toca).
     */
    public function update(Request $request, $id)
    {
        $producto = Producto::findOrFail($id);

        $data = $request->validate([
            'nombre'      => 'sometimes|required|string|max:150',
            'descripcion' => 'sometimes|required|string',
            'prima'       => 'sometimes|required|numeric|min:0',
            'cobertura'   => 'sometimes|required|numeric|min:0',
            'moneda'      => 'sometimes|required|string|in:USD,BS,EUR',
        ]);

        $producto->update($data);

        // fresh() recarga el modelo de la base de datos para obtener los valores actualizados
        return response()->json($this->row($producto->fresh()));
    }

    /**
     * Elimina un producto del catálogo.
     *
     * Se bloquea si el producto tiene pólizas asociadas para preservar el
     * historial comercial. Si se eliminara el producto, las pólizas antiguas
     * quedarían sin referencia a su tipo de cobertura.
     */
    public function destroy($id)
    {
        $producto = Producto::with('polizas')->findOrFail($id);

        if ($producto->polizas->isNotEmpty()) {
            return response()->json(
                ['error' => 'No se puede eliminar un producto con pólizas asociadas.'],
                409
            );
        }

        $producto->delete();

        return response()->json(['message' => 'Producto eliminado correctamente']);
    }

    /**
     * Construye el objeto de respuesta que espera el frontend para cada producto.
     * Los campos numéricos se convierten explícitamente a float para evitar que
     * lleguen como strings al JSON cuando la columna es DECIMAL en MySQL.
     */
    private function row(Producto $p): array
    {
        return [
            'id'          => $p->id,
            'nombre'      => $p->nombre,
            'descripcion' => $p->descripcion ?? '',
            'prima'       => (float) $p->prima,
            'cobertura'   => (float) $p->cobertura,
            'moneda'      => $p->moneda,
        ];
    }
}
