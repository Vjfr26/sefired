<?php

namespace App\Http\Controllers;

use App\Models\IndicadorEconomico;
use App\Models\Poliza;
use App\Models\Producto;
use App\Models\Solicitud;
use App\Rules\NoInjectionChars;
use App\Support\EnvioDocumentosProducto;
use App\Support\Moneda;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
     * Lista todos los productos ordenados por "más vendido".
     * El ranking se basa en pólizas emitidas y no anuladas, para que en el
     * simulador/emisión las coberturas más contratadas aparezcan primero.
     * Empates y productos sin ventas caen al orden alfabético por nombre.
     */
    public function index()
    {
        return response()->json(
            Producto::with('beneficios')
                ->withCount(['polizas as ventas_count' => fn($q) => $q->where('status', '!=', 'ANULADA')])
                ->orderByDesc('ventas_count')
                ->orderBy('nombre')
                ->get()
                ->map(fn($p) => $this->row($p))
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
            'descripcion'            => ['nullable', 'string', 'max:1000', $noInjection],
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
            // Renglones de "Coberturas / Sumas Aseguradas" del cuadro póliza
            // (PDF). Los montos de cada renglón se fijan por tarifa.
            'coberturas_pdf'          => 'nullable|array',
            'coberturas_pdf.*.key'    => ['required', 'string', 'max:80', $noInjection],
            'coberturas_pdf.*.label'  => ['required', 'string', 'max:80', $noInjection],
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
            'descripcion'            => ['nullable', 'string', 'max:1000', $noInjection],
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
            'coberturas_pdf'          => 'sometimes|nullable|array',
            'coberturas_pdf.*.key'    => ['required_with:coberturas_pdf', 'string', 'max:80', $noInjection],
            'coberturas_pdf.*.label'  => ['required_with:coberturas_pdf', 'string', 'max:80', $noInjection],
        ]);

        $publicadoAnterior = $producto->publicado;
        $monedaAnterior    = $producto->moneda;
        $producto->update($data);

        // Si se envía la moneda del producto, re-etiquetar TODAS sus
        // cotizaciones y pólizas cuya moneda difiera — incluidas las emitidas.
        // El negocio maneja una sola moneda por producto (cero mezcla en
        // documentos): dejar emitidas con la moneda vieja producía listados y
        // PDFs "en bolívares". Se compara por fila (no contra la moneda
        // anterior del producto) para que re-guardar el producto también
        // corrija datos históricos mal etiquetados.
        $cotizacionesActualizadas = 0;
        $polizasActualizadas      = 0;
        if (array_key_exists('moneda', $data)) {
            $cotizacionesActualizadas = $this->propagarMonedaACotizaciones($producto, $data['moneda']);
            $polizasActualizadas      = $this->propagarMonedaAPolizas($producto, $data['moneda']);
        }

        if (array_key_exists('publicado', $data) && (bool) $publicadoAnterior !== (bool) $data['publicado']) {
            $this->logActivity(
                $data['publicado'] ? 'Producto Publicado' : 'Producto Despublicado',
                "Producto \"{$producto->nombre}\" " . ($data['publicado'] ? 'publicado en el portal público' : 'ocultado del portal público'),
                'producto',
                auth()->id()
            );
        } else {
            $detalle = "Producto \"{$producto->nombre}\" actualizado";
            if ($cotizacionesActualizadas > 0 || $polizasActualizadas > 0) {
                $detalle .= " — moneda {$data['moneda']} propagada a {$cotizacionesActualizadas} cotización(es) y {$polizasActualizadas} póliza(s)";
            }
            $this->logActivity('Producto Actualizado', $detalle, 'producto', auth()->id());
        }

        // fresh() recarga el modelo de la base de datos para obtener los valores actualizados
        $resp = $this->row($producto->fresh());
        $resp['cotizaciones_actualizadas'] = $cotizacionesActualizadas;
        $resp['polizas_actualizadas']      = $polizasActualizadas;
        return response()->json($resp);
    }

    /** Tasas BCV del día (USD, EUR) para recalcular equivalentes en Bs. */
    private function tasasDelDia(): array
    {
        $usd = (float) (IndicadorEconomico::usd()->orderByDesc('fecha')->orderByDesc('fecha_registro')->value('valor') ?? 0);
        $eur = (float) (IndicadorEconomico::eur()->orderByDesc('fecha')->orderByDesc('fecha_registro')->value('valor') ?? 0);

        return [$usd, $eur];
    }

    /**
     * Condición SQL "la moneda de la fila NO es la moneda dada" — normaliza
     * en la propia consulta (mayúsculas, sin puntos/espacios, sinónimos) para
     * poder re-etiquetar con UN solo UPDATE masivo. Iterar fila por fila (como
     * se hacía antes) moría por timeout con cientos de miles de cotizaciones
     * en el hosting compartido → el guardar producto devolvía 500.
     */
    private function whereMonedaDistinta($query, string $columna, string $moneda)
    {
        $sinonimos = match ($moneda) {
            'BS'    => "'BS','BOLIVAR','BOLIVARES'",
            'EUR'   => "'EUR','EURO','EUROS'",
            default => "'USD','DOLAR','DOLARES'",
        };
        // NULL normaliza a USD (igual que Moneda::normalizar).
        $col = "UPPER(REPLACE(REPLACE(COALESCE({$columna}, 'USD'), '.', ''), ' ', ''))";

        return $query->whereRaw("{$col} NOT IN ({$sinonimos})");
    }

    /** Factor moneda→Bs con las tasas del día (0 si no hay tasa registrada). */
    private function factorABs(string $moneda): float
    {
        [$usd, $eur] = $this->tasasDelDia();

        return $moneda === 'EUR' ? $eur : ($moneda === 'USD' ? $usd : 1.0);
    }

    /**
     * Re-etiqueta la moneda del producto en TODAS sus cotizaciones cuya
     * moneda difiera (incluidas emitidas/rechazadas — el producto tiene una
     * sola moneda y los documentos no mezclan monedas). El monto en moneda
     * nativa (total) se conserva tal cual — solo se reetiqueta la moneda,
     * igual que la prima del producto, que tampoco cambia de número al
     * cambiar su moneda. El total en bolívares (total_bs) sí se recalcula
     * con la tasa BCV del día para que el equivalente quede coherente.
     *
     * Nota: el JSON `coberturas` de cada fila NO se toca — todo el sistema
     * lee la moneda desde la columna moneda_producto (y las tasas desde
     * tasa_bcv/indicadores), y editar el JSON obligaba a iterar fila por
     * fila, que es justo lo que mataba la petición.
     *
     * @return int  Cantidad de cotizaciones actualizadas.
     */
    private function propagarMonedaACotizaciones(Producto $producto, string $monedaNueva): int
    {
        $moneda = Moneda::normalizar($monedaNueva);
        $factor = $this->factorABs($moneda);

        return $this->whereMonedaDistinta(Solicitud::where('producto_id', $producto->id), 'moneda_producto', $moneda)
            ->update([
                'moneda_producto' => $moneda,
                'total_bs'        => DB::raw('ROUND(total * ' . $factor . ', 2)'),
            ]);
    }

    /**
     * Re-etiqueta la moneda del producto en sus pólizas cuya moneda difiera.
     *
     * Igual que con las cotizaciones: el monto nativo (total/cobertura) no
     * cambia de número, solo su etiqueta; los equivalentes en Bs. se
     * recalculan con la tasa del día. snapshot_datos no se toca: los PDFs
     * resuelven la moneda vía Poliza::monedaNativa(), que lee PRIMERO la
     * columna moneda_producto (el snapshot es solo respaldo cuando la
     * columna está en NULL, y acá queda siempre asignada).
     *
     * @return int  Cantidad de pólizas actualizadas.
     */
    private function propagarMonedaAPolizas(Producto $producto, string $monedaNueva): int
    {
        $moneda = Moneda::normalizar($monedaNueva);
        $factor = $this->factorABs($moneda);

        return $this->whereMonedaDistinta(Poliza::where('producto_id', $producto->id), 'moneda_producto', $moneda)
            ->update([
                'moneda_producto' => $moneda,
                'total_bs'        => DB::raw('ROUND(total * ' . $factor . ', 2)'),
                'cobertura_bs'    => DB::raw('ROUND(cobertura_dolares * ' . $factor . ', 2)'),
            ]);
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
            config('filesystems.docs_disk')
        );

        $documentos   = $producto->documentos ?? [];
        $documentos[] = ['nombre' => trim($request->input('nombre')), 'path' => $path];

        $producto->update(['documentos' => $documentos]);

        $this->logActivity('Documento Agregado', "Producto \"{$producto->nombre}\" — doc \"{$request->input('nombre')}\"", 'producto', auth()->id());

        // Enviar el documento (y cualquier otro pendiente) por correo a los
        // clientes con póliza ACTIVA de este producto que aún no lo tengan.
        // No debe romper la subida si el envío falla.
        $notificados = 0;
        try {
            $notificados = EnvioDocumentosProducto::aClientesDelProducto($producto->fresh());
        } catch (\Throwable $e) {
            Log::warning('Envío de documentos de producto falló: ' . $e->getMessage());
        }

        return response()->json([
            'mensaje'     => 'Documento subido correctamente',
            'documentos'  => $this->formatDocumentos($documentos),
            'notificados' => $notificados,
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
            'coberturas_pdf'        => $p->coberturas_pdf ?? [],
            'beneficios'            => $p->beneficios->map(fn($b) => [
                'id'          => $b->id,
                'descripcion' => $b->descripcion,
                'monto'       => (float) $b->monto,
            ])->values(),
        ];
    }
}
