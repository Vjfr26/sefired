<?php

namespace App\Http\Controllers;

use App\Mail\CotizacionMail;
use App\Mail\CotizacionStatusMail;
use App\Mail\PolizaEmitidaMail;
use App\Mail\FacturaMail;
use App\Models\EmailLog;
use App\Models\Comision;
use App\Models\Solicitud;
use App\Models\Persona;
use App\Models\BienAsegurado;
use App\Models\Poliza;
use App\Models\PolizaBien;
use App\Models\Factura;
use App\Models\Venta;
use App\Rules\CedulaValida;
use App\Rules\NoInjectionChars;
use App\Rules\TelefonoValido;
use App\Services\WorkflowService;
use App\Support\CodigoPoliza;
use App\Support\EnvioDocumentosProducto;
use App\Support\Mensualidades;
use App\Support\Documento;
use App\Support\Moneda;
use App\Traits\LogsActivity;
use App\Traits\ScopesVendedor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

/**
 * Gestión de cotizaciones/solicitudes de seguro.
 *
 * Una cotización (Solicitud con status != null) recorre el ciclo:
 *   En Revisión → Aprobado → Emitida (póliza generada)
 *                          → Rechazado
 *
 * Rutas en routes/api.php:
 *   GET  /api/cotizaciones        → listado de todas las cotizaciones
 *   POST /api/cotizaciones        → guardar nueva cotización del simulador
 *   PUT  /api/cotizaciones/{id}   → actualizar status de una cotización
 */
class SolicitudController extends Controller
{
    use LogsActivity, ScopesVendedor;

    /**
     * Lista las cotizaciones ordenadas de más reciente a más antigua.
     * Incluye datos del cliente (nombre, cédula) y del vendedor.
     *
     * Admin y Oficina ven todas las cotizaciones (gestionan la cartera
     * completa). Los demás roles (vendedores) solo ven las que ellos
     * mismos crearon — nunca las de otros vendedores ni los leads del
     * portal público (que no tienen vendedor_id asignado).
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // Filtros (status/producto/fechas/búsqueda) aplicables a una query dada.
        $aplicarFiltros = function ($q) use ($request) {
            $status = $request->input('status');
            if ($status && $status !== 'Todos') {
                // El histórico migrado quedó como 'En Revisión'; el chip nuevo usa
                // 'en_revision'. Se aceptan ambos para que el filtro no salga vacío.
                if ($status === 'en_revision') {
                    $q->whereIn('status', ['en_revision', 'En Revisión']);
                } else {
                    $q->where('status', $status);
                }
            }
            if ($request->filled('producto_id')) {
                $q->where('producto_id', $request->input('producto_id'));
            }
            if ($request->filled('fecha_inicio')) $q->whereDate('fecha_solicitud', '>=', $request->input('fecha_inicio'));
            if ($request->filled('fecha_fin'))    $q->whereDate('fecha_solicitud', '<=', $request->input('fecha_fin'));
            if ($request->filled('search')) {
                $s = trim($request->input('search'));
                $q->where(function ($w) use ($s) {
                    $w->whereHas('persona', fn ($p) => $p->where('nombre', 'like', "%{$s}%")->orWhere('cedula', 'like', "%{$s}%"))
                      ->orWhereHas('bien', fn ($b) => $b->where('placa_idx', 'like', "%{$s}%"));
                    if (ctype_digit($s)) $w->orWhere('id', (int) $s);
                });
            }
        };

        // Resumen para los chips/contadores: cuenta sobre toda la DB (no la página).
        if ($request->boolean('resumen')) {
            $base = Solicitud::query();
            if ($this->esRolRestringido()) $base->where('vendedor_id', $user->id);
            return response()->json([
                'total'       => (clone $base)->count(),
                'pendiente'   => (clone $base)->where('status', 'pendiente')->count(),
                'en_revision' => (clone $base)->whereIn('status', ['en_revision', 'En Revisión'])->count(),
                'aprobado'    => (clone $base)->where('status', 'aprobado')->count(),
                'emitida'     => (clone $base)->where('status', 'emitida')->count(),
                'vencida'     => (clone $base)->where('status', 'vencida')->count(),
                'rechazado'   => (clone $base)->where('status', 'rechazado')->count(),
            ]);
        }

        $query = Solicitud::with(['persona', 'producto', 'bien', 'vendedor', 'polizas'])
            ->orderByDesc('fecha_solicitud')
            ->orderByDesc('id');
        if ($this->esRolRestringido()) {
            $query->where('vendedor_id', $user->id);
        }
        $aplicarFiltros($query);

        // Paginado (opt-in): las relaciones se cargan solo para las ~20 filas de la
        // página, no para las 125k solicitudes migradas → rápido y sin OOM.
        if ($request->filled('page') || $request->filled('per_page')) {
            $perPage = min(max((int) $request->input('per_page', 20), 1), 200);
            $p = $query->paginate($perPage);
            return response()->json([
                'data'     => $p->getCollection()->map(fn ($s) => $this->formatRow($s))->values(),
                'total'    => $p->total(),
                'page'     => $p->currentPage(),
                'per_page' => $p->perPage(),
            ]);
        }

        // Compat: lista completa (llamadas antiguas sin parámetros de paginación).
        return response()->json($query->get()->map(fn ($s) => $this->formatRow($s))->values());
    }

    /**
     * Guarda una cotización generada por el simulador.
     *
     * El campo `coberturas` almacena el JSON completo de la simulación:
     * items seleccionados, tasa BCV, subtotales, IVA y total final.
     * Permite reconstruir el desglose en cualquier momento.
     */
    public function store(Request $request)
    {
        $noInjection = new NoInjectionChars();

        if ($request->filled('ci_tomador')) $request->merge(['ci_tomador' => Documento::normalizarCedula($request->input('ci_tomador'))]);
        if ($request->filled('asegurado_ci')) $request->merge(['asegurado_ci' => Documento::normalizarCedula($request->input('asegurado_ci'))]);

        $data = $request->validate([
            'persona_id'        => 'nullable|integer|exists:persona,id',
            'bien_asegurado_id' => 'nullable|integer|exists:bien_asegurado,id',
            'producto_id'       => 'nullable|integer|exists:producto,id',
            'tarifario_id'      => 'nullable|integer|exists:tarifario,id',
            'total'             => 'required|numeric|min:0',
            'total_bs'          => 'required|numeric|min:0',
            'fecha_solicitud'   => 'required|date',
            'coberturas'        => 'required|array',
            'nombre_tomador'    => ['nullable', 'string', 'max:120', $noInjection],
            'ci_tomador'        => ['nullable', 'string', 'max:20', new CedulaValida()],
            'asegurado_nombre'  => ['nullable', 'string', 'max:120', $noInjection],
            'asegurado_ci'      => ['nullable', 'string', 'max:20', new CedulaValida()],
            'asegurado_telefono'  => ['nullable', 'string', 'max:30', new TelefonoValido()],
            'asegurado_direccion' => ['nullable', 'string', 'max:255', $noInjection],
        ]);

        // Emisión de nueva póliza: se permite registrar la solicitud para el
        // cliente de otro vendedor (vender a clientes ajenos). La venta se
        // acredita igual a quien la registra (vendedor_id = auth()->id()).
        $this->assertAccesoReferencias($data, permitirVenta: true);

        $data['vendedor_id'] = auth()->id();
        // Toda cotización nace en 'pendiente' (nadie la ha evaluado ni emitido).
        // El botón de underwriting está disponible desde este estado y su
        // evaluación es la que la mueve (observación → en_revision; aprobada sin
        // observación → aprobado; rechazada → rechazado).
        $data['status']      = 'pendiente';
        $data['fuente']      = 'interno';
        // Moneda nativa derivada del producto, no confiada al cliente — así
        // total/total_bs se interpretan correctamente en todo el flujo posterior.
        $data['moneda_producto'] = Moneda::normalizar(
            \App\Models\Producto::find($data['producto_id'] ?? null)?->moneda ?? 'USD'
        );

        $solicitud = Solicitud::create($data);
        $solicitud->load(['persona', 'producto', 'bien']);

        // Vincula el bien a su titular si aún no lo estaba. Los bienes creados
        // como lead del portal nacen sin persona_id (no había cliente aún);
        // cuando la cotización interna reutiliza ese bien con un cliente ya
        // seleccionado, sin esto el bien queda huérfano y en la pantalla de
        // Bienes sale sin titular ni vendedor.
        if ($solicitud->persona_id && $solicitud->bien && $solicitud->bien->persona_id === null) {
            $solicitud->bien->update(['persona_id' => $solicitud->persona_id]);
        }

        $ref = $solicitud->asegurado_nombre ?? $solicitud->nombre_tomador ?? "solicitud #{$solicitud->id}";
        $this->logActivity(
            'Cotización Creada',
            "Cotización #{$solicitud->id} — {$ref}",
            'solicitud',
            auth()->id()
        );

        // Enviar simulación por correo al cliente si tiene correo registrado
        $correo = $solicitud->persona?->correo;
        if ($correo) {
            try {
                Mail::to($correo)->queue(new CotizacionMail($solicitud));
                EmailLog::registrar(
                    tipo: 'cotizacion',
                    destinatario: $correo,
                    asunto: 'Simulación de seguro',
                    personaId: $solicitud->persona_id,
                );
            } catch (\Throwable) {}
        }

        return response()->json($this->formatRow($solicitud), 201);
    }

    /**
     * Actualiza una cotización. Permite cambiar el estado o editar todos los campos
     * del simulador si la cotización aún no ha sido emitida.
     */
    public function update(Request $request, $id)
    {
        $solicitud = Solicitud::findOrFail($id);
        $this->assertAccesoSolicitud($solicitud);

        if ($solicitud->status === 'emitida') {
            return response()->json(['error' => 'No se puede editar una cotización ya emitida.'], 409);
        }

        $noInjection = new NoInjectionChars();

        if ($request->filled('ci_tomador')) $request->merge(['ci_tomador' => Documento::normalizarCedula($request->input('ci_tomador'))]);
        if ($request->filled('asegurado_ci')) $request->merge(['asegurado_ci' => Documento::normalizarCedula($request->input('asegurado_ci'))]);

        $data = $request->validate([
            'status'            => 'sometimes|in:en_revision,rechazado,pendiente',
            'persona_id'        => 'sometimes|integer|exists:persona,id',
            'bien_asegurado_id' => 'nullable|integer|exists:bien_asegurado,id',
            'producto_id'       => 'nullable|integer|exists:producto,id',
            'tarifario_id'      => 'nullable|integer|exists:tarifario,id',
            'total'             => 'sometimes|numeric|min:0',
            'total_bs'          => 'sometimes|numeric|min:0',
            'fecha_solicitud'   => 'sometimes|date',
            'coberturas'        => 'sometimes|array',
            'nombre_tomador'    => ['nullable', 'string', 'max:120', $noInjection],
            'ci_tomador'        => ['nullable', 'string', 'max:20', new CedulaValida()],
            'asegurado_nombre'  => ['nullable', 'string', 'max:120', $noInjection],
            'asegurado_ci'      => ['nullable', 'string', 'max:20', new CedulaValida()],
            'asegurado_telefono'  => ['nullable', 'string', 'max:30', new TelefonoValido()],
            'asegurado_direccion' => ['nullable', 'string', 'max:255', $noInjection],
        ]);

        $this->assertAccesoReferencias($data);

        // Si cambia el producto, la moneda nativa del total también cambia.
        if (array_key_exists('producto_id', $data)) {
            $data['moneda_producto'] = Moneda::normalizar(
                \App\Models\Producto::find($data['producto_id'])?->moneda ?? 'USD'
            );
        }

        // Validar transición de estado antes de persistir
        if (isset($data['status'])) {
            WorkflowService::assertSolicitud($solicitud->status, $data['status']);
        }

        $statusAnterior = $solicitud->status;
        $solicitud->update($data);

        $logMsg = isset($data['status'])
            ? "Cotización #{$id} → {$data['status']}"
            : "Cotización #{$id} actualizada";

        $this->logActivity('Cotización Actualizada', $logMsg, 'solicitud', auth()->id());

        // Notificar al cliente cuando la cotización cambia a aprobada o rechazada
        if (isset($data['status']) && in_array($data['status'], ['aprobado', 'rechazado']) && $data['status'] !== $statusAnterior) {
            $correo = $solicitud->persona?->correo;
            if ($correo) {
                try {
                    Mail::to($correo)->queue(new CotizacionStatusMail($solicitud->fresh('persona', 'producto'), $data['status']));
                    EmailLog::registrar(
                        'cotizacion_' . $data['status'],
                        $correo,
                        $data['status'] === 'aprobado' ? 'Cotización aprobada' : 'Cotización rechazada',
                        $solicitud->persona_id
                    );
                } catch (\Throwable) {}
            }
        }

        return response()->json(['message' => 'Cotización actualizada correctamente']);
    }

    /**
     * Emite una cotización: crea la Póliza y la Factura de forma automática.
     *
     * Solo puede emitirse si el status es 'aprobado' o 'en_revision'.
     * El nro_contrato y número de factura se auto-generan a partir del ID de póliza.
     *
     * Campos requeridos: pago, sede. Opcional: referencia.
     */
    public function emitir(Request $request, $id)
    {
        $solicitud = Solicitud::findOrFail($id);
        $this->assertAccesoSolicitud($solicitud);

        if ($solicitud->status === 'emitida') {
            return response()->json(['error' => 'Esta cotización ya fue emitida.'], 409);
        }

        // Solo se puede emitir desde 'aprobado' — sin esto, era posible emitir
        // una póliza directo desde 'en_revision' o 'rechazado', saltándose la
        // evaluación de underwriting por completo.
        WorkflowService::assertSolicitud($solicitud->status, 'emitida');

        $pago   = $this->validarPagoRequest($request);
        $result = $this->emitirConPago($solicitud, $pago);

        return response()->json([
            'message'      => 'Póliza y recibo generados correctamente',
            'nro_contrato' => $result['nro_contrato'],
            'nro_factura'  => $result['nro_factura'],
        ], 201);
    }

    /**
     * Valida y normaliza el payload de pago (formas/montos/moneda/tasas). Lo
     * usan tanto la emisión directa como el registro de pago del vendedor.
     */
    private function validarPagoRequest(Request $request): array
    {
        $noInjection = new NoInjectionChars();

        $data = $request->validate([
            'tasa_bcv'          => 'required|numeric|min:0.0001',
            'tasa_eur'          => 'nullable|numeric|min:0.0001',
            'frecuencia_pago'   => 'nullable|string|in:Mensual,Anual',
            'pagos'             => 'required|array|min:1',
            'pagos.*.forma'     => ['required', 'string', 'max:30', $noInjection],
            'pagos.*.moneda'    => 'required|string|in:USD,EUR,Bs.',
            'pagos.*.monto'     => 'required|numeric|min:0.01',
            'pagos.*.referencia'=> ['nullable', 'string', 'max:100', $noInjection],
        ]);

        return [
            'pagos'           => $data['pagos'],
            'tasa_bcv'        => (float) $data['tasa_bcv'],
            'tasa_eur'        => isset($data['tasa_eur']) && $data['tasa_eur'] > 0 ? (float) $data['tasa_eur'] : (float) $data['tasa_bcv'],
            'frecuencia_pago' => $data['frecuencia_pago'] ?? 'Anual',
        ];
    }

    /**
     * NUEVO FLUJO — el pago lo registra el VENDEDOR antes de la evaluación de
     * la oficina. Guarda el pago en la solicitud y la mueve a 'en_revision'
     * para que administración lo verifique y apruebe (ahí se genera la póliza).
     */
    public function registrarPago(Request $request, $id)
    {
        $solicitud = Solicitud::with('producto')->findOrFail($id);
        $this->assertAccesoSolicitud($solicitud);

        if ($solicitud->status === 'emitida') {
            return response()->json(['error' => 'Esta cotización ya fue emitida.'], 409);
        }
        if (!in_array($solicitud->status, ['pendiente', 'en_revision'], true)) {
            return response()->json(['error' => 'Solo se puede registrar el pago de una cotización pendiente o en revisión.'], 422);
        }

        $pago = $this->validarPagoRequest($request);
        $this->validarMontoPago($solicitud, $pago);

        $pago['registrado_por'] = auth()->id();
        $pago['registrado_en']  = now()->toDateTimeString();

        // pendiente → en_revision (si ya estaba en_revision, solo se re-guarda el pago).
        if ($solicitud->status === 'pendiente') {
            WorkflowService::assertSolicitud($solicitud->status, 'en_revision');
            $solicitud->status = 'en_revision';
        }
        $solicitud->pago_datos = $pago;
        $solicitud->save();

        $this->logActivity(
            'Pago Registrado',
            "Pago registrado para cotización #{$solicitud->id} — enviada a evaluación de la oficina",
            'solicitud',
            auth()->id()
        );

        return response()->json(['message' => 'Pago registrado. La cotización pasó a evaluación de la oficina.'], 200);
    }

    /**
     * Verifica que el monto pagado esté dentro del rango permitido (desde la
     * primera cuota mensual hasta el total financiado / anual). Lanza 422 si no.
     */
    public function validarMontoPago(Solicitud $solicitud, array $pago): void
    {
        $solicitud->loadMissing('producto');
        $monedaNativa = Moneda::normalizar($solicitud->moneda_producto ?? $solicitud->producto?->moneda ?? 'USD');
        $tasaBcv = (float) $pago['tasa_bcv'];
        $tasaEur = isset($pago['tasa_eur']) && $pago['tasa_eur'] > 0 ? (float) $pago['tasa_eur'] : $tasaBcv;

        $totalPoliza = (float) $solicitud->total;
        $totalPagado = 0.0;
        foreach ($pago['pagos'] as $p) {
            $totalPagado += Moneda::convertir((float) $p['monto'], $p['moneda'], $monedaNativa, $tasaBcv, $tasaEur);
        }

        $frecuencia     = $pago['frecuencia_pago'] ?? 'Anual';
        $permiteMensual = (bool) ($solicitud->producto?->permite_mensualidades);
        $recargoPct     = (float) ($solicitud->producto?->recargo_mensual_pct ?? 0);
        $esMensual      = $frecuencia === 'Mensual' && $permiteMensual;
        $montoMinimo    = $esMensual ? Mensualidades::montoCuota($totalPoliza, $recargoPct) : $totalPoliza;
        $montoMaximo    = $esMensual ? Mensualidades::totalFinanciado($totalPoliza, $recargoPct) : $totalPoliza;

        // Comparación en centavos con tolerancia ±0.10 para absorber redondeos de conversión.
        $pagCents = (int) floor($totalPagado * 100 + 1e-6);
        $minCents = (int) round($montoMinimo * 100);
        $maxCents = (int) round($montoMaximo * 100);
        if ($pagCents < $minCents) {
            throw ValidationException::withMessages(['pago' => sprintf(
                'El pago (%s%.2f %s) es menor a %s (%s%.2f %s).',
                Moneda::simbolo($monedaNativa), round($totalPagado, 2), Moneda::etiqueta($monedaNativa),
                $esMensual ? 'la primera cuota mensual' : 'el total de la póliza',
                Moneda::simbolo($monedaNativa), $montoMinimo, Moneda::etiqueta($monedaNativa)
            )]);
        }
        if ($pagCents > $maxCents + 10) {
            throw ValidationException::withMessages(['pago' => sprintf(
                'El pago (%s%.2f %s) supera el %s (%s%.2f %s).',
                Moneda::simbolo($monedaNativa), round($totalPagado, 2), Moneda::etiqueta($monedaNativa),
                $esMensual ? 'total financiado de las 12 cuotas' : 'total anual de la póliza',
                Moneda::simbolo($monedaNativa), $montoMaximo, Moneda::etiqueta($monedaNativa)
            )]);
        }
    }

    /**
     * Genera la póliza + recibo a partir de un pago ya validado. La usan tanto
     * la emisión directa (emitir) como la aprobación de underwriting.
     */
    public function emitirConPago(Solicitud $solicitud, array $pago): array
    {
        $solicitud->load(['persona', 'producto', 'tarifario', 'bien']);
        $this->validarMontoPago($solicitud, $pago);

        $cobs    = is_array($solicitud->coberturas) ? $solicitud->coberturas : [];
        $hoy     = now()->toDateString();
        $venc    = now()->addYear()->toDateString();
        $tasaBcv = (float) $pago['tasa_bcv'];
        $tasaEur = isset($pago['tasa_eur']) && $pago['tasa_eur'] > 0 ? (float) $pago['tasa_eur'] : $tasaBcv;

        // Moneda en la que está denominado el total de esta solicitud — la
        // del producto contratado, no la moneda en la que el cliente pague.
        $monedaNativa = Moneda::normalizar($solicitud->moneda_producto ?? $solicitud->producto?->moneda ?? 'USD');

        $totalPoliza  = (float) $solicitud->total;
        $totalPagado  = 0.0;
        foreach ($pago['pagos'] as $p) {
            $totalPagado += Moneda::convertir((float) $p['monto'], $p['moneda'], $monedaNativa, $tasaBcv, $tasaEur);
        }

        $frecuencia     = $pago['frecuencia_pago'] ?? 'Anual';
        $permiteMensual = (bool) ($solicitud->producto?->permite_mensualidades);
        $recargoPct     = (float) ($solicitud->producto?->recargo_mensual_pct ?? 0);
        $esMensual      = $frecuencia === 'Mensual' && $permiteMensual;

        // Resumen de formas de pago para el campo string
        $pagoResumen = collect($pago['pagos'])
            ->map(fn($p) => $p['forma'] . ' ' . $p['moneda'])
            ->join(' / ');

        $moneda      = $pago['pagos'][0]['moneda'] ?? 'USD';

        // Sede desde el usuario autenticado o fallback
        $sede = auth()->user()?->sede ?? 'Principal';

        // cobertura_dolares: para productos por_valor (RCV) es el valor de mercado del vehículo;
        // para los demás tipos (fijo, por_plan, por_nivel) es la suma asegurada del producto.
        $tipoCal          = $solicitud->producto?->tipo_calculo;
        $coberturaDolares = ($tipoCal === 'por_valor')
            ? (float) ($cobs['valor_mercado'] ?? 0)
            : (float) ($solicitud->producto?->cobertura ?? 0);
        $totalUsd    = (float) $solicitud->total;
        $totalBs     = round(Moneda::aBs($totalUsd, $monedaNativa, $tasaBcv, $tasaEur), 2);
        $coberturaBS = round(Moneda::aBs($coberturaDolares, $monedaNativa, $tasaBcv, $tasaEur), 2);

        // Asegurado: si se indicó una persona diferente al tomador, se usa esa; si no, el tomador mismo.
        // Dirección/teléfono propios del asegurado son opcionales — si no se
        // indicaron porque es la misma persona (o no se conocen aparte), se
        // heredan los del tomador.
        $aseguradoNombre    = $solicitud->asegurado_nombre    ?? $solicitud->nombre_tomador ?? null;
        $aseguradoCi        = $solicitud->asegurado_ci        ?? $solicitud->ci_tomador     ?? null;
        $aseguradoTelefono  = $solicitud->asegurado_telefono  ?? null;
        $aseguradoDireccion = $solicitud->asegurado_direccion ?? null;

        // Snapshot inmutable: datos tal como existían al momento de emisión
        // (incluye teléfono/dirección para que no cambien si el cliente
        // actualiza sus datos después de emitida la póliza).
        $snapshot = [
            'tomador' => [
                'nombre'    => $solicitud->nombre_tomador ?? $solicitud->persona?->nombre,
                'ci'        => $solicitud->ci_tomador     ?? $solicitud->persona?->cedula,
                'telefono'  => $solicitud->persona?->celular ?? $solicitud->persona?->telefono,
                'direccion' => $solicitud->persona?->direccion,
            ],
            'asegurado' => [
                'nombre'    => $aseguradoNombre,
                'ci'        => $aseguradoCi,
                'telefono'  => $aseguradoTelefono,
                'direccion' => $aseguradoDireccion,
            ],
            'producto' => $solicitud->producto ? [
                'id'           => $solicitud->producto->id,
                'nombre'       => $solicitud->producto->nombre,
                'tipo'         => $solicitud->producto->tipo,
                'tipo_calculo' => $solicitud->producto->tipo_calculo,
                'cobertura'    => $solicitud->producto->cobertura,
                'moneda'       => $monedaNativa,
            ] : null,
            'tarifario' => $solicitud->tarifario ? [
                'id'      => $solicitud->tarifario->id,
                'nombre'  => $solicitud->tarifario->nombre,
                'version' => $solicitud->tarifario->version,
                'datos'   => $solicitud->tarifario->datos,
            ] : null,
            'coberturas'       => $cobs,
            'tasa_bcv'         => (float) ($cobs['tasaBCV'] ?? 1),
            'tasa_emision'     => $tasaBcv,
            'tasa_emision_eur' => $tasaEur,
            'moneda'           => $moneda,
            'pagos'            => $pago['pagos'],
            'bien'             => $solicitud->bien ? [
                'id'            => $solicitud->bien->id,
                'tipo'          => $solicitud->bien->tipo,
                'atributos'     => $solicitud->bien->atributos,
                'observaciones' => $solicitud->bien->observaciones,
            ] : null,
            'fecha_emision' => $hoy,
            'total_usd'     => $totalUsd,
            'total_bs'      => $totalBs,
        ];

        $result = DB::transaction(function () use ($solicitud, $pago, $hoy, $venc, $coberturaDolares, $coberturaBS, $aseguradoNombre, $aseguradoCi, $snapshot, $tasaBcv, $tasaEur, $totalUsd, $totalBs, $moneda, $monedaNativa, $pagoResumen, $sede, $frecuencia, $esMensual, $recargoPct, $totalPagado) {
            $poliza = Poliza::create([
                'nro_contrato'         => 'TMP-' . uniqid(),
                'solicitud_id'         => $solicitud->id,
                'producto_id'          => $solicitud->producto_id ?? null,
                'total'                => $totalUsd,
                'total_bs'             => $totalBs,
                'moneda_producto'      => $monedaNativa,
                'tasa_emision'         => $tasaBcv,
                'tasa_emision_eur'     => $tasaEur,
                'cobertura_dolares'    => $coberturaDolares,
                'cobertura_bs'         => $coberturaBS,
                'asegurado_nombre'     => $aseguradoNombre,
                'asegurado_ci'         => $aseguradoCi,
                'pago'                 => $pagoResumen,
                'frecuencia_pago'      => $frecuencia,
                'moneda'               => $moneda,
                'tipo'                 => 'Individual',
                'fecha_emision'        => $hoy,
                'fecha_vencimiento'    => $venc,
                'sede_poliza'          => $sede,
                'vendedor_id'          => $solicitud->vendedor_id ?? auth()->id(),
                'status'               => 'ACTIVA',
                'snapshot_datos'       => $snapshot,
                'tarifario_version_id' => $solicitud->tarifario_id,
            ]);

            $nroContrato = CodigoPoliza::generar(
                $sede,
                $solicitud->persona?->estado,
                $poliza->producto_id,
                CodigoPoliza::INDICADOR_NUEVO,
                $poliza->id
            );
            $nroFactura  = CodigoPoliza::codigoRecibo($nroContrato);

            $poliza->update(['nro_contrato' => $nroContrato]);

            // Comisión del vendedor por esta póliza — sin vendedor no hay a quién pagarle.
            if ($poliza->vendedor_id) {
                $baseUsd = Moneda::aUsd($totalUsd, $monedaNativa, $tasaBcv, $tasaEur);
                $tasaPct = Comision::tasaParaUsuario($poliza->vendedor) * 100;
                Comision::create([
                    'poliza_id'      => $poliza->id,
                    'vendedor_id'    => $poliza->vendedor_id,
                    'base_usd'       => round($baseUsd, 2),
                    'tasa_pct'       => $tasaPct,
                    'monto'          => round($baseUsd * $tasaPct / 100, 2),
                    'fecha_generada' => $hoy,
                ]);
            }

            // El bien original de la solicitud queda registrado en poliza_bienes
            // con certificado=NULL (cubierto bajo el propio nro_contrato).
            // Si más adelante se agregan bienes adicionales a esta póliza,
            // esos sí recibirán un certificado propio.
            if ($solicitud->bien_asegurado_id) {
                // Red de seguridad: vincula el bien a su titular si aún no lo
                // estaba (leads del portal nacen sin persona_id) — así la póliza
                // aparece con titular y vendedor en la pantalla de Bienes.
                if ($solicitud->persona_id) {
                    BienAsegurado::where('id', $solicitud->bien_asegurado_id)
                        ->whereNull('persona_id')
                        ->update(['persona_id' => $solicitud->persona_id]);
                }

                PolizaBien::create([
                    'poliza_id'         => $poliza->id,
                    'bien_asegurado_id' => $solicitud->bien_asegurado_id,
                    'certificado'       => null,
                    'cobertura_dolares' => $coberturaDolares,
                    'cobertura_bs'      => $coberturaBS,
                    'created_by'        => auth()->id(),
                ]);
            }

            if ($esMensual) {
                // Pago mensual: se generan las 12 cuotas (total financiado =
                // prima * (1+recargo%)) y se aplica el cobro inicial, que emite
                // el recibo y marca las cuotas cubiertas (la 1ª y las adelantadas).
                Mensualidades::generarCuotas($poliza, (float) $totalUsd, $recargoPct, $hoy);
                $factura = Mensualidades::aplicarPago(
                    $poliza, (float) $totalPagado, $pagoResumen, $moneda,
                    $pago['pagos'][0]['referencia'] ?? null, $tasaBcv, $tasaEur, auth()->id(), $sede
                );
                $nroFactura = $factura?->numero ?? $nroFactura;
            } else {
                Factura::create([
                    'numero'        => $nroFactura,
                    'sede'          => $sede,
                    'fecha_factura' => $hoy,
                    'poliza_id'     => $poliza->id,
                    'valor'         => $totalUsd,
                    'valor_bs'      => $totalBs,
                    'forma_pago'    => $pagoResumen,
                    'moneda'        => $moneda,
                    'referencia'    => $pago['pagos'][0]['referencia'] ?? null,
                    'usuario_id'    => auth()->id(),
                ]);
            }

            $solicitud->update(['status' => 'emitida']);

            // El vendedor del cliente es el que lo registra/atiende —el de la
            // cotización—, nunca el usuario que emite si es distinto. Solo se
            // asigna cuando el cliente aún no tenía vendedor (ej. lead del
            // portal sin asignar); si ya tiene, no se toca.
            if ($solicitud->persona && $solicitud->persona->vendedor_id === null && $solicitud->vendedor_id !== null) {
                $solicitud->persona->update(['vendedor_id' => $solicitud->vendedor_id]);
            }

            // Registro de venta — un renglón por póliza emitida, para reportes
            // de comisiones/desempeño por vendedor y producto.
            Venta::create([
                'usuario_id'  => $solicitud->vendedor_id ?? auth()->id(),
                'producto_id' => $solicitud->producto_id,
                'fecha_venta' => $hoy,
            ]);

            return ['nro_contrato' => $nroContrato, 'nro_factura' => $nroFactura];
        });

        $this->logActivity(
            'Póliza Emitida',
            "Póliza {$result['nro_contrato']} emitida para cotización #{$solicitud->id}",
            'poliza',
            auth()->id()
        );

        // Correos — se despachan en cola para no bloquear el request
        $polizaEmitida = Poliza::with(['solicitud.persona', 'producto'])
            ->where('nro_contrato', $result['nro_contrato'])->first();
        $facturaEmitida = Factura::with('poliza')
            ->where('numero', $result['nro_factura'])->first();
        $correo = $solicitud->persona?->correo;

        if ($correo && $polizaEmitida) {
            try {
                Mail::to($correo)->queue(new PolizaEmitidaMail($polizaEmitida));
                EmailLog::registrar('poliza_emitida', $correo, 'Póliza emitida ' . $result['nro_contrato'],
                    $solicitud->persona?->id, $polizaEmitida->id);
            } catch (\Throwable) {}
        }
        if ($correo && $facturaEmitida) {
            try {
                Mail::to($correo)->queue(new FacturaMail($facturaEmitida, $solicitud->persona?->nombre ?? ''));
                EmailLog::registrar('factura', $correo, 'Recibo ' . $result['nro_factura'],
                    $solicitud->persona?->id, $polizaEmitida?->id);
            } catch (\Throwable) {}
        }

        // Documentos del tipo de póliza (producto): al cliente nuevo se le envían
        // todos; si ya tenía pólizas de ese producto, solo los que le falten.
        if ($polizaEmitida?->solicitud?->persona && $polizaEmitida->producto) {
            EnvioDocumentosProducto::paraPersona(
                $polizaEmitida->solicitud->persona,
                $polizaEmitida->producto,
                $polizaEmitida->id
            );
        }

        return $result;
    }

    /**
     * Elimina una cotización (solo si no tiene pólizas emitidas).
     */
    public function destroy($id)
    {
        $solicitud = Solicitud::with('polizas')->findOrFail($id);
        $this->assertAccesoSolicitud($solicitud);

        if ($solicitud->polizas->isNotEmpty()) {
            return response()->json(
                ['error' => 'No se puede eliminar una cotización con pólizas emitidas.'],
                409
            );
        }

        $solicitud->delete();

        return response()->json(['message' => 'Cotización eliminada correctamente']);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    /**
     * Un vendedor solo puede operar sobre SUS cotizaciones — igual que el
     * filtro ya aplicado en index(). A diferencia de Persona, aquí NO se
     * permite vendedor_id null (esos son leads del portal sin reclamar,
     * fuera del alcance de un vendedor hasta que Admin/Oficina los asigne,
     * o que se le otorgue el permiso `clientes.view_all`).
     */
    private function assertAccesoSolicitud(Solicitud $solicitud): void
    {
        $user = auth()->user();
        if ($this->esRolRestringido() && $solicitud->vendedor_id !== $user->id) {
            abort(403, 'No tienes acceso a esta cotización.');
        }
    }

    /**
     * Corta con 403 si persona_id o bien_asegurado_id (cuando vienen en el
     * payload de store/update) no pertenecen al vendedor actual — sin esto,
     * un vendedor podía apuntar su propia cotización al cliente de otro
     * vendedor solo cambiando el ID en la petición.
     */
    private function assertAccesoReferencias(array $data, bool $permitirVenta = false): void
    {
        if (!empty($data['persona_id'])) {
            $this->assertAccesoCliente(Persona::findOrFail($data['persona_id']), $permitirVenta);
        }
        if (!empty($data['bien_asegurado_id'])) {
            $bien = BienAsegurado::with('persona')->findOrFail($data['bien_asegurado_id']);
            if ($bien->persona) {
                $this->assertAccesoCliente($bien->persona, $permitirVenta);
            }
        }
    }

    private function formatRow(Solicitud $s): array
    {
        $cobs     = is_array($s->coberturas) ? $s->coberturas : [];
        $total    = (float) $s->total;
        $totalBs  = (float) $s->total_bs;
        $tasaBcv  = $cobs['tasaBCV'] ?? null;

        $nombre = $s->nombre_tomador ?? $s->persona?->nombre ?? '—';
        $ci     = $s->ci_tomador     ?? $s->persona?->cedula  ?? '—';

        // Número de cotización: COT-YYYY-XXXXX
        $nro = 'COT-' . $s->fecha_solicitud?->format('Y') . '-' . str_pad($s->id, 5, '0', STR_PAD_LEFT);

        return [
            'id'                => $s->id,
            'nro'               => $nro,
            'persona_id'        => $s->persona_id,
            'nombre'            => $nombre,
            'ci'                => $ci,
            'bien_asegurado_id' => $s->bien_asegurado_id,
            'bien_tipo'         => $s->bien?->tipo,
            'bien_atributos'    => $s->bien?->atributos,
            'bien_observaciones' => $s->bien?->observaciones,
            'producto_id'       => $s->producto_id,
            'producto'          => $s->producto?->nombre ?? '—',
            'moneda_producto'   => Moneda::normalizar($s->moneda_producto ?? $s->producto?->moneda ?? 'USD'),
            'tarifario_id'      => $s->tarifario_id,
            'total'             => $total,
            'total_bs'          => $totalBs,
            'tasa_bcv'          => $tasaBcv,
            'fuente'            => $s->fuente ?? 'interno',
            'poliza_id'         => $s->polizas->first()?->id,
            'status'            => $s->status ?? 'en_revision',
            'pago_datos'        => $s->pago_datos,
            'fecha'             => $s->fecha_solicitud?->format('d/m/Y') ?? '—',
            'fecha_iso'         => $s->fecha_solicitud?->format('Y-m-d'),
            'coberturas'        => $cobs,
            'asegurado_nombre'    => $s->asegurado_nombre,
            'asegurado_ci'        => $s->asegurado_ci,
            'asegurado_telefono'  => $s->asegurado_telefono,
            'asegurado_direccion' => $s->asegurado_direccion,
            'vendedor_id'       => $s->vendedor_id,
            'vendedor_nombre'   => $s->vendedor?->nombre ?? ($s->fuente === 'portal' ? 'Lead del portal' : '—'),
        ];
    }
}
