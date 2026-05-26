<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
            'nombre'                 => 'required|string|max:150',
            'codigo'                 => 'nullable|string|max:20',
            'tipo'                   => 'required|string|in:rcv,apov,alpd,ec,ep,vida,salud,hogar,accidentes,funeraria,otro',
            'categoria'              => 'nullable|string|in:vehicular,bienes,personas',
            'requiere_vehiculo'      => 'boolean',
            'tipo_calculo'           => 'required|string|in:fijo,por_plan,por_nivel,por_valor',
            'derecho_poliza'         => 'numeric|min:0',
            'descripcion'            => 'nullable|string',
            'prima'                  => 'numeric|min:0',
            'cobertura'              => 'numeric|min:0',
            'moneda'                 => 'required|string|in:USD,BS,EUR',
            'documentos_requeridos'  => 'nullable|array',
            'documentos_requeridos.*.nombre'      => 'required|string|max:100',
            'documentos_requeridos.*.obligatorio' => 'required|boolean',
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
            'nombre'                 => 'sometimes|required|string|max:150',
            'codigo'                 => 'nullable|string|max:20',
            'tipo'                   => 'sometimes|required|string|in:rcv,apov,alpd,ec,ep,vida,salud,hogar,accidentes,funeraria,otro',
            'categoria'              => 'nullable|string|in:vehicular,bienes,personas',
            'requiere_vehiculo'      => 'sometimes|boolean',
            'tipo_calculo'           => 'sometimes|required|string|in:fijo,por_plan,por_nivel,por_valor',
            'derecho_poliza'         => 'sometimes|numeric|min:0',
            'descripcion'            => 'nullable|string',
            'prima'                  => 'sometimes|numeric|min:0',
            'cobertura'              => 'sometimes|numeric|min:0',
            'moneda'                 => 'sometimes|required|string|in:USD,BS,EUR',
            'documentos_requeridos'  => 'nullable|array',
            'documentos_requeridos.*.nombre'      => 'required_with:documentos_requeridos|string|max:100',
            'documentos_requeridos.*.obligatorio' => 'required_with:documentos_requeridos|boolean',
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
     * Agrega un documento PDF al array de documentos del producto.
     * Cada producto puede tener múltiples documentos (IPID, FIPC, Nota Informativa, etc.).
     */
    public function uploadDocumento(Request $request, $id)
    {
        $producto = Producto::findOrFail($id);

        $request->validate([
            'documento' => 'required|file|mimes:pdf|max:10240',
            'nombre'    => 'required|string|max:100',
        ]);

        $filename = uniqid('doc_') . '.pdf';
        $path     = $request->file('documento')->storeAs(
            "productos/{$id}",
            $filename,
            'public'
        );

        $documentos   = $producto->documentos ?? [];
        $documentos[] = ['nombre' => trim($request->input('nombre')), 'path' => $path];

        $producto->update(['documentos' => $documentos]);

        return response()->json([
            'mensaje'    => 'Documento subido correctamente',
            'documentos' => $this->formatDocumentos($documentos),
        ]);
    }

    /**
     * Elimina un documento específico del array por su path.
     */
    public function deleteDocumento(Request $request, $id)
    {
        $producto = Producto::findOrFail($id);
        $path     = $request->input('path');

        $documentos = collect($producto->documentos ?? [])
            ->reject(fn($d) => $d['path'] === $path)
            ->values()
            ->all();

        Storage::disk('public')->delete($path);
        $producto->update(['documentos' => $documentos ?: null]);

        return response()->json(['mensaje' => 'Documento eliminado correctamente']);
    }

    private function formatDocumentos(array $docs): array
    {
        return array_map(fn($d) => [
            'nombre' => $d['nombre'],
            'path'   => $d['path'],
            'url'    => Storage::disk('public')->url($d['path']),
        ], $docs);
    }

    /**
     * Importa la tabla de tasas desde un CSV con cabecera.
     * El CSV puede tener cualquier columna — se almacena como JSON array of objects.
     * El separador puede ser coma o tabulador (auto-detectado).
     */
    public function uploadTasas(Request $request, $id)
    {
        $producto = Producto::findOrFail($id);

        $request->validate([
            'tasas' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $lines = file(
            $request->file('tasas')->getRealPath(),
            FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES
        );

        if (empty($lines)) {
            return response()->json(['error' => 'El archivo CSV está vacío'], 422);
        }

        // Auto-detectar separador: si la primera línea tiene más tabs que comas, usar tab
        $firstLine = $lines[0];
        $sep = substr_count($firstLine, "\t") > substr_count($firstLine, ',') ? "\t" : ',';

        $headers = array_map('trim', str_getcsv(array_shift($lines), $sep));

        $rows = [];
        foreach ($lines as $line) {
            $values = array_map('trim', str_getcsv($line, $sep));
            if (count($values) !== count($headers)) continue;
            $rows[] = array_combine($headers, $values);
        }

        $producto->update(['tasas' => $rows]);

        return response()->json([
            'mensaje' => 'Tasas cargadas correctamente',
            'count'   => count($rows),
        ]);
    }

    /**
     * Borra la tabla de tasas de un producto.
     */
    public function deleteTasas($id)
    {
        $producto = Producto::findOrFail($id);
        $producto->update(['tasas' => null]);
        return response()->json(['mensaje' => 'Tasas eliminadas correctamente']);
    }

    /**
     * Construye el objeto de respuesta que espera el frontend para cada producto.
     * Los campos numéricos se convierten explícitamente a float para evitar que
     * lleguen como strings al JSON cuando la columna es DECIMAL en MySQL.
     */
    private function row(Producto $p): array
    {
        return [
            'id'                    => $p->id,
            'codigo'                => $p->codigo,
            'nombre'                => $p->nombre,
            'tipo'                  => $p->tipo ?? 'alpd',
            'categoria'             => $p->categoria,
            'requiere_vehiculo'     => (bool) $p->requiere_vehiculo,
            'tipo_calculo'          => $p->tipo_calculo ?? 'fijo',
            'derecho_poliza'        => (float) $p->derecho_poliza,
            'descripcion'           => $p->descripcion ?? '',
            'prima'                 => (float) $p->prima,
            'cobertura'             => (float) $p->cobertura,
            'moneda'                => $p->moneda,
            'documentos'            => $this->formatDocumentos($p->documentos ?? []),
            'documentos_requeridos' => $p->documentos_requeridos ?? [],
            'tasas'                 => $p->tasas,
        ];
    }
}
