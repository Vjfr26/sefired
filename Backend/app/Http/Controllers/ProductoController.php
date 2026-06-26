<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Rules\NoInjectionChars;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * CRUD de productos (coberturas de seguro) para el panel interno.
 *
 * Un "producto" en J&M es una cobertura que se puede contratar:
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
    use LogsActivity;

    /**
     * Lista todos los productos ordenados por nombre.
     * El orden alfabético facilita encontrar coberturas en el simulador.
     */
    public function index()
    {
        return response()->json(
            Producto::with('beneficios')->orderBy('nombre')->get()->map(fn($p) => $this->row($p))
        );
    }

    /**
     * Crea un nuevo producto en el catálogo de coberturas.
     * Todos los campos son obligatorios al crear un producto.
     * La moneda puede ser 'USD', 'BS' o 'EUR'.
     */
    public function store(Request $request)
    {
        $noInjection = new NoInjectionChars();

        $data = $request->validate([
            'parent_id'              => 'nullable|integer|exists:producto,id',
            'nombre'                 => ['required', 'string', 'max:150', $noInjection],
            'publicado'              => 'boolean',
            'codigo'                 => ['nullable', 'string', 'max:20', $noInjection],
            'tipo'                   => 'required|string|in:rcv,apov,alpd,ec,ep,vida,salud,hogar,accidentes,funeraria,otro',
            'categoria'              => 'nullable|string|in:vehicular,bienes,personas',
            'tipo_bien'              => 'nullable|string|in:vehiculo,inmueble,vida,bien,ninguno,bicicleta,mascota,embarcacion,equipo_electronico,joya',
            'permite_multiples_bienes' => 'boolean',
            'max_bienes'             => 'nullable|integer|min:1',
            'aplica_beneficiarios'   => 'boolean',
            'min_beneficiarios'      => 'nullable|integer|min:0',
            'max_beneficiarios'      => 'nullable|integer|min:0',
            'lleva_certificado'      => 'boolean',
            'tipo_calculo'           => 'required|string|in:fijo,por_plan,por_nivel,por_valor',
            'derecho_poliza'         => 'numeric|min:0',
            'descripcion'            => ['nullable', 'string', $noInjection],
            'prima'                  => 'numeric|min:0',
            'cobertura'              => 'numeric|min:0',
            'moneda'                 => 'required|string|in:USD,BS,EUR',
            'iva_aplica'             => 'boolean',
            'iva_porcentaje'         => 'nullable|numeric|min:0|max:100',
            'permite_mensualidades'  => 'boolean',
            'recargo_mensual_pct'    => 'nullable|numeric|min:0|max:100',
            'documentos_requeridos'  => 'nullable|array',
            'documentos_requeridos.*.nombre'      => ['required', 'string', 'max:100', $noInjection],
            'documentos_requeridos.*.obligatorio' => 'required|boolean',
        ]);

        $producto = Producto::create($data);

        $this->logActivity('Producto Creado', "Producto \"{$producto->nombre}\" creado", 'producto', auth()->id());

        return response()->json($this->row($producto), 201);
    }

    /**
     * Actualiza los datos de un producto existente.
     * Solo se modifican los campos enviados (el resto no se toca).
     */
    public function update(Request $request, $id)
    {
        $producto = Producto::findOrFail($id);

        $noInjection = new NoInjectionChars();

        $data = $request->validate([
            'parent_id'              => 'sometimes|nullable|integer|exists:producto,id',
            'nombre'                 => ['sometimes', 'required', 'string', 'max:150', $noInjection],
            'publicado'              => 'sometimes|boolean',
            'codigo'                 => ['nullable', 'string', 'max:20', $noInjection],
            'tipo'                   => 'sometimes|required|string|in:rcv,apov,alpd,ec,ep,vida,salud,hogar,accidentes,funeraria,otro',
            'categoria'              => 'nullable|string|in:vehicular,bienes,personas',
            'tipo_bien'              => 'sometimes|nullable|string|in:vehiculo,inmueble,vida,bien,ninguno,bicicleta,mascota,embarcacion,equipo_electronico,joya',
            'permite_multiples_bienes' => 'sometimes|boolean',
            'max_bienes'             => 'sometimes|nullable|integer|min:1',
            'aplica_beneficiarios'   => 'sometimes|boolean',
            'min_beneficiarios'      => 'sometimes|nullable|integer|min:0',
            'max_beneficiarios'      => 'sometimes|nullable|integer|min:0',
            'lleva_certificado'      => 'sometimes|boolean',
            'tipo_calculo'           => 'sometimes|required|string|in:fijo,por_plan,por_nivel,por_valor',
            'derecho_poliza'         => 'sometimes|numeric|min:0',
            'descripcion'            => ['nullable', 'string', $noInjection],
            'prima'                  => 'sometimes|numeric|min:0',
            'cobertura'              => 'sometimes|numeric|min:0',
            'moneda'                 => 'sometimes|required|string|in:USD,BS,EUR',
            'iva_aplica'             => 'sometimes|boolean',
            'iva_porcentaje'         => 'sometimes|nullable|numeric|min:0|max:100',
            'permite_mensualidades'  => 'sometimes|boolean',
            'recargo_mensual_pct'    => 'sometimes|nullable|numeric|min:0|max:100',
            'documentos_requeridos'  => 'nullable|array',
            'documentos_requeridos.*.nombre'      => ['required_with:documentos_requeridos', 'string', 'max:100', $noInjection],
            'documentos_requeridos.*.obligatorio' => 'required_with:documentos_requeridos|boolean',
        ]);

        $publicadoAnterior = $producto->publicado;
        $producto->update($data);

        if (array_key_exists('publicado', $data) && (bool) $publicadoAnterior !== (bool) $data['publicado']) {
            $this->logActivity(
                $data['publicado'] ? 'Producto Publicado' : 'Producto Despublicado',
                "Producto \"{$producto->nombre}\" " . ($data['publicado'] ? 'publicado en el portal público' : 'ocultado del portal público'),
                'producto',
                auth()->id()
            );
        } else {
            $this->logActivity('Producto Actualizado', "Producto \"{$producto->nombre}\" actualizado", 'producto', auth()->id());
        }

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

        $nombre = $producto->nombre;
        $producto->delete();

        $this->logActivity('Producto Eliminado', "Producto \"{$nombre}\" eliminado", 'producto', auth()->id());

        return response()->json(['message' => 'Producto eliminado correctamente']);
    }

    /**
     * Agrega un documento PDF al array de documentos del producto.
     * Cada producto puede tener múltiples documentos (IPID, FIPC, Nota Informativa, etc.).
     */
    public function uploadDocumento(Request $request, $id)
    {
        $producto = Producto::findOrFail($id);

        $noInjection = new NoInjectionChars();

        $request->validate([
            'documento' => 'required|file|mimes:pdf|max:10240',
            'nombre'    => ['required', 'string', 'max:100', $noInjection],
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

        $this->logActivity('Documento Agregado', "Producto \"{$producto->nombre}\" — doc \"{$request->input('nombre')}\"", 'producto', auth()->id());

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

        $documentos = collect($producto->documentos ?? []);

        // Verificar que el path pertenezca a este producto antes de borrar
        if (!$documentos->contains('path', $path)) {
            return response()->json(['error' => 'Documento no encontrado para este producto.'], 404);
        }

        $restantes = $documentos->reject(fn($d) => $d['path'] === $path)->values()->all();

        Storage::disk(config('filesystems.docs_disk'))->delete($path);
        $producto->update(['documentos' => $restantes ?: null]);

        $this->logActivity('Documento Eliminado', "Producto \"{$producto->nombre}\" — doc eliminado", 'producto', auth()->id());

        return response()->json(['mensaje' => 'Documento eliminado correctamente']);
    }

    private function formatDocumentos(array $docs): array
    {
        return array_map(fn($d) => [
            'nombre' => $d['nombre'],
            'path'   => $d['path'],
            'url'    => Storage::disk(config('filesystems.docs_disk'))->url($d['path']),
        ], $docs);
    }

    // ── Beneficios (lista de coberturas informativas del producto) ────────────

    public function agregarBeneficio(Request $request, $id)
    {
        $producto = Producto::findOrFail($id);

        $noInjection = new NoInjectionChars();
        $data = $request->validate([
            'descripcion' => ['required', 'string', 'max:100', $noInjection],
            'monto'       => 'required|numeric|min:0',
        ]);

        $beneficio = $producto->beneficios()->create($data);

        $this->logActivity('Beneficio Agregado', "Producto \"{$producto->nombre}\" — {$beneficio->descripcion}", 'producto', auth()->id());

        return response()->json($beneficio, 201);
    }

    public function actualizarBeneficio(Request $request, $id, $benId)
    {
        $producto   = Producto::findOrFail($id);
        $beneficio  = $producto->beneficios()->findOrFail($benId);

        $noInjection = new NoInjectionChars();
        $data = $request->validate([
            'descripcion' => ['sometimes', 'string', 'max:100', $noInjection],
            'monto'       => 'sometimes|numeric|min:0',
        ]);

        $beneficio->update($data);

        $this->logActivity('Beneficio Actualizado', "Producto \"{$producto->nombre}\" — {$beneficio->descripcion}", 'producto', auth()->id());

        return response()->json($beneficio);
    }

    public function eliminarBeneficio($id, $benId)
    {
        $producto = Producto::findOrFail($id);
        $beneficio = $producto->beneficios()->findOrFail($benId);
        $descripcion = $beneficio->descripcion;
        $beneficio->delete();

        $this->logActivity('Beneficio Eliminado', "Producto \"{$producto->nombre}\" — {$descripcion}", 'producto', auth()->id());

        return response()->json(null, 204);
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
            'parent_id'             => $p->parent_id,
            'codigo'                => $p->codigo,
            'nombre'                => $p->nombre,
            'publicado'             => (bool) $p->publicado,
            'tipo'                  => $p->tipo ?? 'otro',
            'tipo_bien'             => $p->tipo_bien ?? 'ninguno',
            'permite_multiples_bienes' => (bool) $p->permite_multiples_bienes,
            'max_bienes'            => $p->max_bienes,
            'aplica_beneficiarios'  => (bool) $p->aplica_beneficiarios,
            'min_beneficiarios'     => $p->min_beneficiarios,
            'max_beneficiarios'     => $p->max_beneficiarios,
            'lleva_certificado'     => (bool) $p->lleva_certificado,
            'categoria'             => $p->categoria,
            'tipo_calculo'          => $p->tipo_calculo ?? 'fijo',
            'derecho_poliza'        => (float) $p->derecho_poliza,
            'descripcion'           => $p->descripcion ?? '',
            'prima'                 => (float) $p->prima,
            'cobertura'             => (float) $p->cobertura,
            'moneda'                => $p->moneda,
            'iva_aplica'            => (bool) $p->iva_aplica,
            'iva_porcentaje'        => $p->iva_porcentaje !== null ? (float) $p->iva_porcentaje : null,
            'permite_mensualidades' => (bool) $p->permite_mensualidades,
            'recargo_mensual_pct'   => $p->recargo_mensual_pct !== null ? (float) $p->recargo_mensual_pct : null,
            'documentos'            => $this->formatDocumentos($p->documentos ?? []),
            'documentos_requeridos' => $p->documentos_requeridos ?? [],
            'beneficios'            => $p->beneficios->map(fn($b) => [
                'id'          => $b->id,
                'descripcion' => $b->descripcion,
                'monto'       => (float) $b->monto,
            ])->values(),
        ];
    }
}
