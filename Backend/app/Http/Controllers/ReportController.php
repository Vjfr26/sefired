<?php

namespace App\Http\Controllers;

use App\Mail\ReporteAdjuntoMail;
use App\Models\AuditLog;
use App\Models\Comision;
use App\Models\EmailLog;
use App\Models\IndicadorEconomico;
use App\Models\IpBloqueada;
use App\Models\Log;
use App\Models\Oficina;
use App\Models\Usuario;
use App\Models\Persona;
use App\Models\BienAsegurado;
use App\Models\Poliza;
use App\Models\RetiroEfectivo;
use App\Models\ReporteExternoProgramacion;
use App\Models\ReporteInternoProgramacion;
use App\Models\Solicitud;
use App\Models\UnderwritingEvaluacion;
use App\Models\Venta;
use App\Rules\NoInjectionChars;
use App\Services\ReporteGeneratorService;
use App\Support\CodigoPoliza;
use App\Support\Moneda;
use App\Support\PermisosPorRol;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use App\Exports\ExternalReportExport;
use App\Exports\VentasExport;
use App\Exports\OficinasExport;
use App\Exports\OficinasPagosExport;
use App\Exports\UsuariosMetricsExport;
use App\Exports\UsuarioPolizasExport;
use App\Exports\ClientesMetricsExport;

class ReportController extends Controller
{
    use \App\Traits\ResuelveAdjuntosReporte, \App\Traits\LogsActivity;

    // ── LOGS ─────────────────────────────────────────────────────────────────────

    public function getLogs(Request $request)
    {
        $noInjection = new NoInjectionChars();

        $request->validate([
            'usuario_id' => 'nullable|integer|exists:usuarios,id',
            'accion'     => ['nullable', 'string', 'max:100', $noInjection],
            'desde'      => 'nullable|date',
            'hasta'      => 'nullable|date|after_or_equal:desde',
        ]);

        $query = Log::with('usuario:id,nombre,nick')->orderBy('created_at', 'desc');

        if ($request->filled('usuario_id')) {
            $query->where('usuario_id', (int) $request->usuario_id);
        }
        if ($request->filled('accion')) {
            $query->where('accion', 'like', '%' . $request->accion . '%');
        }
        if ($request->filled('desde')) {
            $query->whereDate('created_at', '>=', $request->desde);
        }
        if ($request->filled('hasta')) {
            $query->whereDate('created_at', '<=', $request->hasta);
        }

        // Sin paginar server-side: el listado de auditoría usa el mismo patrón
        // que el resto de las listas (DataTable pagina/filtra del lado del
        // cliente). Se limita a los 2000 más recientes como tope de seguridad.
        return response()->json(['data' => $query->limit(2000)->get()]);
    }

    /**
     * Historial de cambios campo a campo (creating/updated/deleted) que se
     * registra automáticamente vía AuditObserver para Solicitud, Póliza,
     * Factura y Producto — complementa los logs descriptivos de getLogs()
     * con el detalle exacto de qué cambió en cada registro.
     */
    public function getAuditLog(Request $request)
    {
        $noInjection = new NoInjectionChars();

        $request->validate([
            'modelo'     => ['nullable', 'string', 'max:80', $noInjection],
            'usuario_id' => 'nullable|integer|exists:usuarios,id',
            'desde'      => 'nullable|date',
            'hasta'      => 'nullable|date|after_or_equal:desde',
        ]);

        $query = AuditLog::with('usuario:id,nombre,nick')->orderBy('created_at', 'desc');

        if ($request->filled('modelo')) {
            $query->where('modelo', $request->modelo);
        }
        if ($request->filled('usuario_id')) {
            $query->where('usuario_id', (int) $request->usuario_id);
        }
        if ($request->filled('desde')) {
            $query->whereDate('created_at', '>=', $request->desde);
        }
        if ($request->filled('hasta')) {
            $query->whereDate('created_at', '<=', $request->hasta);
        }

        return response()->json(['data' => $query->limit(2000)->get()]);
    }

    /**
     * IPs bloqueadas (intentos de login fallidos, patrones de ataque
     * detectados, o bloqueo manual al desactivar un usuario). Existían en BD
     * y bloqueaban accesos reales, pero no había forma de verlas ni de
     * desbloquear una IP bloqueada por error (ej. IP de oficina compartida).
     */
    public function getIpsBloqueadas()
    {
        $ips = IpBloqueada::with('usuario:id,nombre')->orderByDesc('created_at')->get();

        return response()->json(['data' => $ips]);
    }

    public function unbloquearIp($id)
    {
        $ip = IpBloqueada::findOrFail($id);
        $direccion = $ip->ip;
        $ip->delete();

        $this->logActivity('IP Desbloqueada', "IP {$direccion} desbloqueada manualmente", 'ip_bloqueada', auth()->id());

        return response()->json(['message' => 'IP desbloqueada correctamente']);
    }

    /**
     * Historial de correos enviados por el sistema (bienvenida, pólizas,
     * facturas, recordatorios, reportes programados, etc.). Se registra vía
     * EmailLog::registrar() en cada Mail::queue(), pero hasta ahora no tenía
     * ningún endpoint que lo expusiera al panel.
     */
    public function getEmailLogs(Request $request)
    {
        $noInjection = new NoInjectionChars();

        $request->validate([
            'tipo'   => ['nullable', 'string', 'max:60', $noInjection],
            'status' => 'nullable|string|in:enviado,error',
            'desde'  => 'nullable|date',
            'hasta'  => 'nullable|date|after_or_equal:desde',
        ]);

        $query = EmailLog::with(['persona:id,nombre', 'poliza:id,nro_contrato'])->orderBy('sent_at', 'desc');

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('desde')) {
            $query->whereDate('sent_at', '>=', $request->desde);
        }
        if ($request->filled('hasta')) {
            $query->whereDate('sent_at', '<=', $request->hasta);
        }

        return response()->json(['data' => $query->limit(2000)->get()]);
    }

    // ── STATS ────────────────────────────────────────────────────────────────────

    public function getStats()
    {
        $solCounts = Solicitud::selectRaw("
            COUNT(*) as total,
            SUM(status = 'en_revision') as en_revision,
            SUM(status = 'aprobado')    as aprobado,
            SUM(status = 'emitida')     as emitida,
            SUM(status = 'rechazado')   as rechazado
        ")->first();

        $polCounts = Poliza::selectRaw("
            SUM(status = 'ACTIVA')   as activas,
            SUM(status = 'VENCIDA')  as vencidas,
            SUM(status = 'ANULADA')  as anuladas
        ")->first();

        $uwCounts = UnderwritingEvaluacion::selectRaw("
            SUM(resultado = 'pendiente')  as pendiente,
            SUM(resultado = 'observado')  as observado
        ")->first();

        return response()->json([
            'total_usuarios'           => Usuario::count(),
            'usuarios_activos'         => Usuario::where('activo', true)->count(),
            'total_clientes'           => Persona::count(),
            'logs_hoy'                 => Log::whereDate('created_at', today())->count(),
            'total_cotizaciones'       => (int) $solCounts->total,
            'cotizaciones_en_revision' => (int) $solCounts->en_revision,
            'cotizaciones_aprobadas'   => (int) $solCounts->aprobado,
            'cotizaciones_emitidas'    => (int) $solCounts->emitida,
            'cotizaciones_rechazadas'  => (int) $solCounts->rechazado,
            'polizas_activas'          => (int) $polCounts->activas,
            'polizas_vencidas'         => (int) $polCounts->vencidas,
            'polizas_anuladas'         => (int) $polCounts->anuladas,
            'underwriting_pendiente'   => (int) $uwCounts->pendiente,
            'underwriting_observado'   => (int) $uwCounts->observado,
            'ventas_este_mes'          => Venta::whereMonth('fecha_venta', now()->month)->whereYear('fecha_venta', now()->year)->count(),
        ]);
    }

    // ── REPORTE EXTERNO (SUDEASEG carga masiva) ───────────────────────────────────

    public function getExternalReportPolicies(Request $request)
    {
        $query = Poliza::with(['solicitud.persona', 'solicitud.bien', 'producto'])
            ->orderBy('fecha_emision', 'desc');

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_emision', '<=', $request->fecha_fin);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nro_contrato', 'like', "%{$search}%")
                  ->orWhereHas('solicitud', function ($sq) use ($search) {
                      $sq->where('nombre_tomador', 'like', "%{$search}%")
                         ->orWhere('ci_tomador', 'like', "%{$search}%")
                         ->orWhereHas('persona', function ($pq) use ($search) {
                             $pq->where('nombre', 'like', "%{$search}%")
                                ->orWhere('cedula', 'like', "%{$search}%");
                         })
                         ->orWhereHas('bien', function ($bq) use ($search) {
                             $bq->where('placa_idx', 'like', "%{$search}%");
                         });
                  });
            });
        }

        // PAGINADO: ~50 por página (antes cargaba todas las pólizas del rango → OOM).
        $perPage   = min(max((int) $request->input('per_page', 50), 1), 200);
        $paginator = $query->paginate($perPage);
        $policies = $paginator->getCollection()->map(function ($p) {
            $sol  = $p->solicitud;
            $bien = $sol?->bien;
            $attr = $bien?->atributos ?? [];
            $placa = $bien?->placa_idx ?? $attr['placa'] ?? '—';

            // No toda póliza cubre un vehículo (puede ser inmueble u otro
            // bien, o ninguno — vida, salud, accidentes, funeraria). Antes
            // esta columna solo sabía describir vehículos y quedaba en "—"
            // para todo lo demás, aunque sí hubiera un bien real asociado.
            $bienDesc = match ($bien?->tipo) {
                'vehiculo' => 'Vehículo — ' . ($attr['marca'] ?? '—') . ' ' . ($attr['modelo'] ?? '—') . ' (' . ($attr['anio'] ?? '—') . ')',
                'inmueble' => 'Inmueble' . (!empty($attr['direccion']) ? " — {$attr['direccion']}" : ''),
                null       => '—',
                default    => ucfirst($bien->tipo) . (!empty($bien->descripcion) ? " — {$bien->descripcion}" : ''),
            };

            $inicio = $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '—';
            $fin    = $p->fecha_vencimiento ? $p->fecha_vencimiento->format('d/m/Y') : '—';

            return [
                'id'                => $p->id,
                'nro_contrato'      => $p->nro_contrato,
                'tomador'           => $sol?->nombre_tomador ?? $sol?->persona?->nombre ?? '—',
                'ci_tomador'        => $sol?->ci_tomador ?? $sol?->persona?->cedula ?? '—',
                'bien'              => $bienDesc,
                'placa'             => $placa,
                'fecha_emision'     => $inicio,
                'fecha_vencimiento' => $fin,
                'vigencia'          => "{$inicio} - {$fin}",
                'total'             => round($this->totalUsd($p), 2),
                'producto'          => $p->producto?->nombre ?? '—',
            ];
        });

        return response()->json([
            'data'     => $policies,
            'total'    => $paginator->total(),
            'page'     => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
        ]);
    }

    public function exportExternalReport(Request $request)
    {
        // El Excel se arma completo en memoria (PhpSpreadsheet): con miles de
        // pólizas los límites por defecto del hosting (memoria/tiempo) matan
        // la petición con 500 antes de responder.
        ini_set('memory_limit', '1024M');
        set_time_limit(300);

        $query = Poliza::with(['solicitud.persona', 'solicitud.bien', 'producto'])
            ->orderBy('fecha_emision', 'desc');

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_emision', '<=', $request->fecha_fin);
        }
        if ($request->filled('ignored_ids') && is_array($request->ignored_ids)) {
            $query->whereNotIn('id', $request->ignored_ids);
        }

        $policies = $query->get();
        $columnas = $request->input('columnas');
        // Moneda de salida elegida por el usuario (USD|BS|EUR). Se convierte con
        // la tasa BCV de hoy (misma lógica que el resto de reportes en Bs).
        $moneda   = $request->input('moneda', 'USD');
        $tasaUsd  = (float) (IndicadorEconomico::usd()->orderByDesc('fecha')->orderByDesc('fecha_registro')->value('valor') ?? 0);
        $tasaEur  = (float) (IndicadorEconomico::eur()->orderByDesc('fecha')->orderByDesc('fecha_registro')->value('valor') ?? 0);
        $filename = 'reporte_externo_' . now()->format('Ymd_His') . '.xlsx';
        return (new ExternalReportExport($policies, is_array($columnas) && count($columnas) ? $columnas : null, $moneda, $tasaUsd, $tasaEur))->download($filename);
    }

    public function getExternalReportSchedules()
    {
        $programaciones = ReporteExternoProgramacion::with('destinatarios')->orderBy('id')->get();
        return response()->json($this->decorarConDocumentosInfo($programaciones));
    }

    public function saveExternalReportSchedules(Request $request)
    {
        $request->validate([
            'schedules'                              => 'array',
            'schedules.*.nombre'                     => 'required|string|max:100',
            'schedules.*.hora'                        => 'required|string',
            'schedules.*.destinatarios.*.email'      => 'required|email|max:150',
            'schedules.*.destinatarios.*.frecuencia' => 'required|string|in:diario,semanal,mensual,trimestral',
            'schedules.*.documentos_adicionales'           => 'nullable|array',
            'schedules.*.documentos_adicionales.*.path'    => 'required_with:schedules.*.documentos_adicionales|string',
            'schedules.*.documentos_adicionales.*.nombre'  => 'required_with:schedules.*.documentos_adicionales|string',
            'schedules.*.cliente_documento_ids'            => 'nullable|array',
            'schedules.*.cliente_documento_ids.*'          => 'integer|exists:cliente_documentos,id',
            'schedules.*.columnas'                         => 'nullable|array',
            'schedules.*.columnas.*'                       => 'string|max:60',
        ]);

        $this->upsertProgramaciones($request->input('schedules', []), ReporteExternoProgramacion::class);

        return response()->json(['message' => 'OK']);
    }

    public function getExternalReportHistory()
    {
        return response()->json(
            DB::table('reportes_externos_historial')
                ->orderBy('fecha_generacion', 'desc')
                ->get()
        );
    }

    public function runExternalReportSchedule(Request $request, ReporteGeneratorService $generator)
    {
        $scheduleId = $request->input('schedule_id');
        $schedule   = $scheduleId ? ReporteExternoProgramacion::find($scheduleId) : null;
        // El Excel respeta las columnas configuradas en la programación (si tiene).
        $archivo = $generator->generarExterno($schedule?->columnas);

        $nombre = $schedule ? $schedule->nombre : 'Reporte Externo';
        $id = DB::table('reportes_externos_historial')->insertGetId([
            'nombre_reporte'   => $nombre . ' — ' . now()->format('d/m/Y H:i'),
            'fecha_generacion' => now(),
            'archivo_path'     => $archivo['path'],
            'size'             => $archivo['size'],
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $enviados = $schedule
            ? $this->enviarADestinatarios($schedule, $archivo, 'reporte_externo')
            : 0;

        return response()->json(['message' => 'OK', 'id' => $id, 'enviados' => $enviados]);
    }

    public function downloadExternalReport($id)
    {
        $record = DB::table('reportes_externos_historial')->find($id);
        if (!$record) {
            return response()->json(['error' => 'Archivo no encontrado'], 404);
        }
        if (!Storage::disk(config('filesystems.docs_disk'))->exists($record->archivo_path)) {
            return response()->json(['error' => 'Archivo no disponible en servidor'], 404);
        }
        return Storage::disk(config('filesystems.docs_disk'))->download($record->archivo_path);
    }

    /**
     * Crea/actualiza/elimina las programaciones y sus destinatarios a partir
     * del arreglo completo enviado por el frontend (reemplaza al antiguo
     * TRUNCATE + reinsert, que borraba los destinatarios en cada guardado).
     */
    /**
     * Suma `total` de un grupo de pólizas convirtiendo cada una a USD según
     * su moneda nativa (vía tasa_emision/tasa_emision_eur del día en que se
     * emitió) — sin esto, sumar `total` directo mezclaría unidades distintas
     * si hay pólizas en USD, EUR y Bs en el mismo grupo.
     */
    /**
     * Prima de UNA póliza expresada en USD según su moneda nativa y las tasas
     * del día de emisión. Todo monto que el frontend de Reportes vaya a
     * multiplicar por la tasa BCV de hoy (helper enBs) debe salir de aquí —
     * mandar $p->total crudo infla ×tasa las pólizas denominadas en Bs.
     */
    private function totalUsd($p): float
    {
        // Pólizas migradas/viejas quedaron con tasa_emision en el default 1.0
        // (= "sin tasa registrada"): convertir con 1 dejaría el monto en Bs
        // haciéndose pasar por USD (inflación ×tasa al mostrarlo en Bs.).
        // Para esas se usa la tasa BCV del día.
        $tasaUsd = (float) $p->tasa_emision;
        $tasaEur = (float) $p->tasa_emision_eur;
        if ($tasaUsd <= 1 || $tasaEur <= 1) {
            [$usdHoy, $eurHoy] = $this->tasasHoy();
            if ($tasaUsd <= 1) $tasaUsd = $usdHoy;
            if ($tasaEur <= 1) $tasaEur = $eurHoy;
        }

        return Moneda::aUsd((float) $p->total, $p->monedaNativa(), $tasaUsd, $tasaEur);
    }

    /** Tasas BCV del día (USD, EUR), memoizadas — totalUsd corre por póliza. */
    private ?array $tasasHoy = null;

    private function tasasHoy(): array
    {
        return $this->tasasHoy ??= [
            (float) (IndicadorEconomico::usd()->orderByDesc('fecha')->orderByDesc('fecha_registro')->value('valor') ?? 0),
            (float) (IndicadorEconomico::eur()->orderByDesc('fecha')->orderByDesc('fecha_registro')->value('valor') ?? 0),
        ];
    }

    private function sumTotalUsd($policies): float
    {
        return (float) $policies->sum(fn($p) => $this->totalUsd($p));
    }

    private function upsertProgramaciones(array $schedules, string $modelClass): void
    {
        DB::transaction(function () use ($schedules, $modelClass) {
            $incomingIds = [];

            foreach ($schedules as $s) {
                $prog = !empty($s['id']) ? $modelClass::find($s['id']) : null;
                if (!$prog) $prog = new $modelClass();

                $prog->nombre = $s['nombre'] ?? 'Reporte';
                $prog->hora   = $s['hora']   ?? '08:00';
                $prog->activo = (bool) ($s['activo'] ?? true);
                if ($modelClass === ReporteInternoProgramacion::class) {
                    $prog->tipo = $s['tipo'] ?? 'ventas';
                }
                if ($modelClass === ReporteExternoProgramacion::class) {
                    // Columnas del Excel para esta programación. Vacío/ausente =
                    // todas (NULL), igual que la descarga manual sin selección.
                    $cols = $s['columnas'] ?? null;
                    $prog->columnas = is_array($cols) && count($cols) ? array_values($cols) : null;
                }
                $prog->documentos_adicionales = $s['documentos_adicionales'] ?? [];
                $prog->cliente_documento_ids  = $s['cliente_documento_ids'] ?? [];
                $prog->save();
                $incomingIds[] = $prog->id;

                $destIncomingIds = [];
                foreach (($s['destinatarios'] ?? []) as $d) {
                    if (empty($d['email'])) continue;

                    $dest = !empty($d['id']) ? $prog->destinatarios()->find($d['id']) : null;
                    if (!$dest) $dest = $prog->destinatarios()->make();

                    $dest->email      = $d['email'];
                    $dest->frecuencia = $d['frecuencia'] ?? 'diario';
                    $dest->activo     = (bool) ($d['activo'] ?? true);
                    $dest->save();
                    $destIncomingIds[] = $dest->id;
                }
                $prog->destinatarios()->whereNotIn('id', $destIncomingIds)->delete();
            }

            // whereNotIn(...)->delete() es un reemplazo completo: cualquier
            // programación que no venga en el payload se borra sin soft-delete.
            // Se deja registro de cuántas se mantuvieron/borraron para poder
            // reconstruir qué pasó si algún día se guarda un payload incompleto.
            $eliminadas = $modelClass::whereNotIn('id', $incomingIds)->count();
            $modelClass::whereNotIn('id', $incomingIds)->delete();

            $tipoLabel = $modelClass === ReporteInternoProgramacion::class ? 'internas' : 'externas';
            $this->logActivity(
                'Programaciones de Reportes Guardadas',
                "Programaciones {$tipoLabel}: " . count($incomingIds) . " guardadas, {$eliminadas} eliminadas (reemplazo completo)",
                'reportes_programaciones',
                auth()->id()
            );
        });
    }

    /**
     * Envía de inmediato el reporte ya generado a todos los destinatarios
     * activos de la programación (usado por el botón "Ejecutar ahora" —
     * a diferencia del envío automático, ignora si su frecuencia ya estaba
     * cumplida o no).
     *
     * @param array{path: string, filename: string, size: int} $archivo
     */
    private function enviarADestinatarios($schedule, array $archivo, string $tipoEmailLog): int
    {
        $adjuntosExtra = $this->resolverAdjuntosExtra($schedule);
        $enviados = 0;
        foreach ($schedule->destinatarios()->where('activo', true)->get() as $destinatario) {
            try {
                Mail::to($destinatario->email)->send(
                    new ReporteAdjuntoMail($schedule->nombre, $archivo['path'], $archivo['filename'], $destinatario->frecuencia, $adjuntosExtra)
                );
                $destinatario->update(['ultimo_envio' => now()]);
                EmailLog::registrar(tipo: $tipoEmailLog, destinatario: $destinatario->email, asunto: $schedule->nombre);
                $enviados++;
            } catch (\Throwable $e) {
                EmailLog::registrar(tipo: $tipoEmailLog, destinatario: $destinatario->email, asunto: $schedule->nombre, status: 'error', errorMsg: $e->getMessage());
            }
        }
        return $enviados;
    }

    /**
     * Sube un archivo suelto para adjuntarlo a una programación de reportes
     * (interna o externa). Devuelve {nombre, path} para guardarlo en
     * documentos_adicionales al hacer Guardar Configuración.
     */
    public function uploadReporteAdjunto(Request $request)
    {
        $request->validate([
            'archivo' => 'required|file|max:10240',
        ]);

        $file = $request->file('archivo');
        $path = $file->store('reportes_adjuntos', config('filesystems.docs_disk'));

        return response()->json([
            'nombre' => $file->getClientOriginalName(),
            'path'   => $path,
            'mime'   => $file->getClientMimeType(),
        ]);
    }

    // ── VENTAS Y COMISIONES ───────────────────────────────────────────────────────

    public function getVentasComisiones(Request $request)
    {
        $noInjection = new NoInjectionChars();
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
            'search'       => ['nullable', 'string', 'max:100', $noInjection],
        ]);

        $query = Poliza::with(['vendedor', 'producto', 'comision']);

        $user = auth()->user();
        if ($user && !PermisosPorRol::tiene($user, 'reportes', 'view_ventas_todos')) {
            $query->where('vendedor_id', $user->id);
        }

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_emision', '<=', $request->fecha_fin);
        }

        $policies = $query->orderBy('fecha_emision', 'desc')->get();

        if ($request->filled('search')) {
            $search = mb_strtolower($request->search);
            $policies = $policies->filter(fn ($p) =>
                str_contains(mb_strtolower((string) $p->nro_contrato), $search) ||
                str_contains(mb_strtolower((string) $p->vendedor?->nombre), $search) ||
                str_contains(mb_strtolower((string) $p->producto?->nombre), $search)
            )->values();
        }

        // Cada venta queda vinculada a su comisión (1 a 1) — el botón de
        // pagado/pendiente en la pestaña actúa sobre comision_id, no sobre
        // la póliza, así que ambas vistas (ventas y comisiones) siempre
        // reflejan el mismo registro.
        // Conversión a Bs. con la tasa BCV de HOY (no la de emisión): la comisión
        // se paga hoy, así que se valora a la tasa del día de consulta.
        $tasaUsdHoy = (float) (IndicadorEconomico::usd()->orderByDesc('fecha')->orderByDesc('fecha_registro')->first()?->valor ?? 0);
        $tasaEurHoy = (float) (IndicadorEconomico::eur()->orderByDesc('fecha')->orderByDesc('fecha_registro')->first()?->valor ?? 0);

        // Comisión en Bs. = prima en Bs × tasa_pct / 100.  Se calcula directo
        // desde la prima convertida a Bs (sin pasar por el monto en USD de la
        // tabla comision) para evitar la pérdida de precisión que causa el
        // redondeo a 2 decimales en USD — en primas pequeñas en Bs el monto
        // USD puede quedar en 0.00 y la reconversión devuelve 0.
        $comisionBs = fn ($p) => $p->comision
            ? round(Moneda::aBs((float) $p->total, $p->monedaNativa(), $tasaUsdHoy, $tasaEurHoy) * (float) $p->comision->tasa_pct / 100, 2)
            : null;

        $ventas = $policies->map(function ($p) use ($comisionBs, $tasaUsdHoy, $tasaEurHoy) {
            return [
                'id'                  => $p->id,
                'fecha'               => $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '—',
                'pol'                 => $p->nro_contrato,
                'agente'              => $p->vendedor?->nombre ?? '—',
                'tipo'                => $p->producto?->nombre ?? '—',
                'prima'               => round($this->totalUsd($p), 2),
                'prima_bs'            => round(Moneda::aBs((float) $p->total, $p->monedaNativa(), $tasaUsdHoy, $tasaEurHoy), 2),
                'est'                 => $p->status === 'ACTIVA' ? 'Vigente' : ($p->status === 'ANULADA' ? 'Anulada' : $p->status),
                'comision_id'         => $p->comision?->id,
                'comision_monto'      => $p->comision ? (float) $p->comision->monto : null,
                'comision_bs'         => $comisionBs($p),
                'comision_tasa_pct'   => $p->comision ? (float) $p->comision->tasa_pct : null,
                'comision_status'     => $p->comision?->status,
                'comision_fecha_pago' => $p->comision?->fecha_pago?->format('d/m/Y'),
                'comision_observacion'=> $p->comision?->observacion,
            ];
        })->values();

        // Resumen general — totales agregados de las ventas visibles para
        // este usuario (todas, o solo las propias) en el período/filtro
        // actual, para el bloque de "lo pagado / lo pendiente" global. El
        // desglose por vendedor se movió a la pestaña Personal.
        $sumComisionBs = function ($status = null) use ($policies, $comisionBs) {
            return round($policies->sum(function ($p) use ($status, $comisionBs) {
                if (!$p->comision) return 0;
                if ($status && $p->comision->status !== $status) return 0;
                return $comisionBs($p) ?? 0;
            }), 2);
        };
        $generadaBs   = $sumComisionBs();
        $pagadaBs     = $sumComisionBs('PAGADA');
        $pendienteBs  = $sumComisionBs('PENDIENTE');

        return response()->json([
            'ventas'      => $ventas,
            'resumen'     => [
                // Se mantienen los totales en USD (compatibilidad) y se agregan en Bs.
                'comision_generada'     => $this->sumComision($policies),
                'comision_pagada'       => $this->sumComision($policies, 'PAGADA'),
                'comision_pendiente'    => $this->sumComision($policies, 'PENDIENTE'),
                'comision_generada_bs'  => $generadaBs,
                'comision_pagada_bs'    => $pagadaBs,
                'comision_pendiente_bs' => $pendienteBs,
                'pct_pagado'            => $generadaBs > 0 ? round($pagadaBs / $generadaBs * 100, 1) : 0,
            ],
        ]);
    }

    public function exportVentas(Request $request)
    {
        $query = Poliza::with(['vendedor', 'producto', 'comision']);
        $user = auth()->user();
        if ($user && !PermisosPorRol::tiene($user, 'reportes', 'view_ventas_todos')) {
            $query->where('vendedor_id', $user->id);
        }
        if ($request->filled('fecha_inicio')) $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        if ($request->filled('fecha_fin'))    $query->whereDate('fecha_emision', '<=', $request->fecha_fin);

        $policies = $query->orderBy('fecha_emision', 'desc')->get();

        // Mismo filtro de texto que la vista en pantalla — sin esto, exportar
        // mientras se busca un agente/póliza específico descargaba el reporte
        // completo del rango de fechas, ignorando lo que se ve filtrado.
        if ($request->filled('search')) {
            $search = mb_strtolower((string) $request->search);
            $policies = $policies->filter(fn ($p) =>
                str_contains(mb_strtolower((string) $p->nro_contrato), $search) ||
                str_contains(mb_strtolower((string) $p->vendedor?->nombre), $search) ||
                str_contains(mb_strtolower((string) $p->producto?->nombre), $search)
            )->values();
        }

        return (new VentasExport($policies, $request->input('columnas')))
            ->download('reporte_ventas_' . now()->format('Ymd_His') . '.xlsx');
    }

    // ── OFICINAS ─────────────────────────────────────────────────────────────────

    /**
     * Usuarios afiliados por sede (sede NULL = Sede Central) — mismo criterio
     * que el modal getOficinaUsuarios, para que la columna "Agentes" cuadre
     * con lo que ese modal lista. Antes se contaban solo los vendedores CON
     * pólizas en el rango, por eso la tabla decía "1" y el modal mostraba 7.
     */
    private function agentesPorSede(): \Illuminate\Support\Collection
    {
        return \App\Models\Usuario::query()
            ->selectRaw("COALESCE(sede, 'Sede Central') as sede_n, COUNT(*) as n")
            ->groupBy('sede_n')
            ->pluck('n', 'sede_n');
    }

    /**
     * Filas del reporte de oficinas: pólizas del período agrupadas por la
     * sede del vendedor, MÁS las oficinas del catálogo (tabla `oficina`) que
     * aún no tienen pólizas — una sede recién creada aparece de una vez con
     * sus agentes y todo en cero. Compartido por getOficinas y exportOficinas.
     */
    private function oficinasReportRows(Request $request): array
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
        ]);

        $query = Poliza::with(['vendedor']);
        if ($request->filled('fecha_inicio')) $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        if ($request->filled('fecha_fin'))    $query->whereDate('fecha_emision', '<=', $request->fecha_fin);

        $policies     = $query->get();
        $totalPremium = $this->sumTotalUsd($policies);
        $agentes      = $this->agentesPorSede();
        $rows = [];
        $tAg = 0; $tPol = 0; $tPri = 0;
        $sedesConPolizas = [];

        foreach ($policies->groupBy(fn ($p) => $p->vendedor?->sede ?? 'Sede Central') as $sede => $pols) {
            $ag  = (int) ($agentes[$sede] ?? 0);
            $po  = $pols->count();
            $pr  = $this->sumTotalUsd($pols);
            $pct = $totalPremium > 0 ? round(($pr / $totalPremium) * 100, 1) . '%' : '0%';

            $rows[] = ['ofi' => $sede, 'ag' => $ag, 'pol' => $po, 'prima' => $pr, 'pct' => $pct, 'est' => 'Activa'];
            $tAg += $ag; $tPol += $po; $tPri += $pr;
            $sedesConPolizas[CodigoPoliza::normalizar($sede)] = true;
        }

        foreach (Oficina::orderBy('nombre')->get() as $oficina) {
            if (isset($sedesConPolizas[CodigoPoliza::normalizar($oficina->nombre)])) continue;
            $ag = (int) ($agentes[$oficina->nombre] ?? 0);
            $rows[] = ['ofi' => $oficina->nombre, 'ag' => $ag, 'pol' => 0, 'prima' => 0, 'pct' => '0%', 'est' => 'Activa'];
            $tAg += $ag;
        }

        if (!empty($rows)) {
            $rows[] = ['ofi' => 'TOTAL', 'ag' => $tAg, 'pol' => $tPol, 'prima' => $tPri, 'pct' => $tPol > 0 ? '100%' : '0%', 'est' => ''];
        }

        return $rows;
    }

    public function getOficinas(Request $request)
    {
        return response()->json($this->oficinasReportRows($request));
    }

    /** Usuarios afiliados a una oficina/sede — para el modal del reporte de oficinas. */
    public function getOficinaUsuarios(Request $request)
    {
        $sede = $request->query('sede');
        $q = \App\Models\Usuario::query();
        if ($sede === null || $sede === '' || $sede === 'Sede Central') {
            $q->whereNull('sede');
        } else {
            $q->where('sede', $sede);
        }
        $usuarios = $q->orderBy('nombre')->get(['id', 'nombre', 'nick', 'cargo', 'tipo', 'activo']);

        return response()->json($usuarios->map(fn ($u) => [
            'id'     => $u->id,
            'nombre' => $u->nombre,
            'nick'   => $u->nick,
            'cargo'  => $u->cargo,
            'tipo'   => $u->tipo,
            'activo' => (bool) $u->activo,
        ]));
    }

    public function exportOficinas(Request $request)
    {
        return (new OficinasExport(collect($this->oficinasReportRows($request)), $request->input('columnas')))
            ->download('reporte_oficinas_' . now()->format('Ymd_His') . '.xlsx');
    }

    /** Pólizas cobradas por oficina, desglosadas por forma de pago. */
    private function oficinasPagosRows(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
        ]);

        $query = Poliza::with(['vendedor']);
        if ($request->filled('fecha_inicio')) $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        if ($request->filled('fecha_fin'))    $query->whereDate('fecha_emision', '<=', $request->fecha_fin);

        $policies = $query->get();

        $fechaInicio = $request->input('fecha_inicio');
        $fechaFin    = $request->input('fecha_fin');
        $retiros = ($fechaInicio && $fechaFin)
            ? RetiroEfectivo::where('fecha_inicio', $fechaInicio)->where('fecha_fin', $fechaFin)->get()
                ->keyBy(fn ($r) => $r->sede . '||' . $r->forma_pago)
            : collect();

        $grouped = $policies->groupBy(fn ($p) => ($p->vendedor?->sede ?? 'Sede Central') . '||' . ($p->pago ?: 'Sin especificar'));

        $rows = $grouped->map(function ($pols, $key) use ($retiros) {
            [$ofi, $formaPago] = explode('||', $key, 2);
            $row = [
                'ofi'        => $ofi,
                'forma_pago' => $formaPago,
                'pol'        => $pols->count(),
                'prima'      => $this->sumTotalUsd($pols),
            ];

            if (str_contains(mb_strtolower($formaPago), 'efectivo')) {
                $retiro = $retiros->get($ofi . '||' . $formaPago);
                $row['retiro_id']         = $retiro?->id;
                $row['retirado']          = (bool) ($retiro?->retirado ?? false);
                $row['notas']             = $retiro?->notas;
                $row['documento_nombre']  = $retiro?->documento_nombre;
                $row['documento_url']     = $retiro?->documento_path
                    ? Storage::disk(config('filesystems.docs_disk'))->url($retiro->documento_path)
                    : null;
            }

            return $row;
        })->sortBy(fn ($r) => $r['ofi'] . '|' . $r['forma_pago'])->values();

        return $rows;
    }

    public function marcarRetiroEfectivo(Request $request)
    {
        $noInjection = new NoInjectionChars();
        $data = $request->validate([
            'sede'         => ['required', 'string', 'max:60', $noInjection],
            'forma_pago'   => ['required', 'string', 'max:35', $noInjection],
            'fecha_inicio' => 'required|date',
            'fecha_fin'    => 'required|date|after_or_equal:fecha_inicio',
            'retirado'     => 'required|boolean',
            'notas'        => ['nullable', 'string', 'max:1000', $noInjection],
            'documento'    => 'nullable|file|max:10240',
        ]);

        $retiro = RetiroEfectivo::firstOrNew([
            'sede'         => $data['sede'],
            'forma_pago'   => $data['forma_pago'],
            'fecha_inicio' => $data['fecha_inicio'],
            'fecha_fin'    => $data['fecha_fin'],
        ]);

        if ($request->hasFile('documento')) {
            if ($retiro->documento_path) {
                Storage::disk(config('filesystems.docs_disk'))->delete($retiro->documento_path);
            }
            $file = $request->file('documento');
            $retiro->documento_path   = $file->store('retiros_efectivo', config('filesystems.docs_disk'));
            $retiro->documento_nombre = $file->getClientOriginalName();
        }

        if (array_key_exists('notas', $data)) {
            $retiro->notas = $data['notas'];
        }

        $retiro->retirado     = $data['retirado'];
        $retiro->usuario_id   = auth()->id();
        $retiro->fecha_marcado = now();
        $retiro->save();

        return response()->json([
            ...$retiro->toArray(),
            'documento_url' => $retiro->documento_path ? Storage::disk(config('filesystems.docs_disk'))->url($retiro->documento_path) : null,
        ]);
    }

    public function getOficinasPagos(Request $request)
    {
        return response()->json($this->oficinasPagosRows($request));
    }

    public function exportOficinasPagos(Request $request)
    {
        return (new OficinasPagosExport($this->oficinasPagosRows($request), $request->input('columnas')))
            ->download('reporte_oficinas_pagos_' . now()->format('Ymd_His') . '.xlsx');
    }

    // ── PERSONAL ─────────────────────────────────────────────────────────────────

    // ── REPORTE DE USUARIOS ───────────────────────────────────────────────────────

    public function getUsuariosReport(Request $request)
    {
        $user = auth()->user();
        if ($user && !PermisosPorRol::tiene($user, 'reportes', 'view_metrics_personal_todos')) {
            // Sin el permiso "ver de todos", se ignora cualquier usuario_id
            // recibido y se fuerza al propio — evita que alguien con acceso
            // restringido vea las métricas de otro asesor manipulando el parámetro.
            $request->merge(['usuario_id' => $user->id]);
        }

        $noInjection = new NoInjectionChars();

        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
            'usuario_id'   => 'nullable|integer|exists:usuarios,id',
            'search'       => ['nullable', 'string', 'max:100', $noInjection],
        ]);

        $fechaInicio = $request->filled('fecha_inicio') ? $request->fecha_inicio : now()->startOfMonth()->toDateString();
        $fechaFin    = $request->filled('fecha_fin')    ? $request->fecha_fin    : now()->toDateString();

        if ($request->filled('usuario_id')) {
            $usuario  = Usuario::findOrFail($request->usuario_id);
            $policies = Poliza::with(['producto', 'solicitud.persona', 'comision'])
                ->where('vendedor_id', $usuario->id)
                ->whereBetween('fecha_emision', [$fechaInicio, $fechaFin])
                ->orderBy('fecha_emision', 'desc')
                ->get();

            $totalPremium = $this->sumTotalUsd($policies);

            return response()->json([
                'usuario' => [
                    'id'     => $usuario->id,
                    'nombre' => $usuario->nombre,
                    'nick'   => $usuario->nick,
                    'cargo'  => $usuario->cargo,
                    'sede'   => $usuario->sede,
                    'activo' => $usuario->activo,
                ],
                'stats' => [
                    'total_polizas'      => $policies->count(),
                    'total_prima'        => $totalPremium,
                    'total_prima_bs'     => (float) $policies->sum('total_bs'),
                    'primas_por_moneda'  => $this->primasPorMoneda($policies),
                    'comision_generada'  => $this->sumComision($policies),
                    'comision_pagada'    => $this->sumComision($policies, 'PAGADA'),
                    'comision_pendiente' => $this->sumComision($policies, 'PENDIENTE'),
                    'polizas_activas'    => $policies->where('status', 'ACTIVA')->count(),
                    'polizas_anuladas'   => $policies->where('status', 'ANULADA')->count(),
                ],
                'polizas' => $policies->map(function ($p) {
                    return [
                        'id'                   => $p->id,
                        'fecha_emision'        => $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '—',
                        'fecha_vencimiento'    => $p->fecha_vencimiento ? $p->fecha_vencimiento->format('d/m/Y') : '—',
                        'nro_contrato'         => $p->nro_contrato,
                        'cliente_nombre'       => $p->solicitud?->persona?->nombre ?? $p->asegurado_nombre ?? '—',
                        'producto_nombre'      => $p->producto?->nombre ?? '—',
                        'total'                => (float) $p->total,
                        'moneda_producto'      => $p->monedaNativa(),
                        'status'               => $p->status,
                        'comision_id'          => $p->comision?->id,
                        'comision_monto'       => $p->comision ? (float) $p->comision->monto : null,
                        'comision_status'      => $p->comision?->status,
                        'comision_fecha_pago'  => $p->comision?->fecha_pago?->format('d/m/Y'),
                        'comision_observacion' => $p->comision?->observacion,
                    ];
                }),
            ]);
        }

        // Listado de vendedores con KPIs
        $vendedoresQuery = Usuario::whereIn('cargo', ['Agente', 'Supervisor'])
            ->orWhereExists(function ($q) {
                $q->select(DB::raw(1))->from('poliza')->whereColumn('poliza.vendedor_id', 'usuarios.id');
            });

        if ($request->filled('search')) {
            $search = $request->search;
            $vendedoresQuery->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('nick', 'like', "%{$search}%")
                  ->orWhere('cargo', 'like', "%{$search}%");
            });
        }

        $rows = $vendedoresQuery->get()->map(function ($v) use ($fechaInicio, $fechaFin) {
            $policies     = Poliza::with('comision')->where('vendedor_id', $v->id)->whereBetween('fecha_emision', [$fechaInicio, $fechaFin])->get();
            $totalPremium = $this->sumTotalUsd($policies);
            return [
                'id'                      => $v->id,
                'nom'                     => $v->nombre,
                'tipo'                    => $v->tipo,    // para el avatar en la tabla
                'genero'                  => $v->genero,  // para el avatar en la tabla
                'rol'                     => $v->cargo,
                'ofi'                     => $v->sede ?? 'Sede Central',
                'pol'                     => $policies->count(),
                'prima'                   => $totalPremium,
                'com_gen'                 => $this->sumComision($policies),
                'com_pagada'              => $this->sumComision($policies, 'PAGADA'),
                'com_pend'                => $this->sumComision($policies, 'PENDIENTE'),
                'comision_ids_pendientes' => $policies->filter(fn ($p) => $p->comision?->status === 'PENDIENTE')->pluck('comision.id')->values(),
                'est'                     => $v->activo ? 'Activo' : 'Inactivo',
            ];
        })->values();

        if ($rows->isNotEmpty()) {
            $rows->push([
                'id'         => null,
                'nom'        => 'TOTAL',
                'rol'        => '',
                'ofi'        => '',
                'pol'        => $rows->sum('pol'),
                'prima'      => round($rows->sum('prima'), 2),
                'com_gen'    => round($rows->sum('com_gen'), 2),
                'com_pagada' => round($rows->sum('com_pagada'), 2),
                'com_pend'   => round($rows->sum('com_pend'), 2),
                'est'        => '',
            ]);
        }

        return response()->json($rows);
    }

    /** Suma de comision.monto de un grupo de pólizas, opcionalmente filtrado por status. */
    private function sumComision($policies, ?string $status = null): float
    {
        return round((float) $policies->sum(function ($p) use ($status) {
            if (!$p->comision) return 0;
            if ($status && $p->comision->status !== $status) return 0;
            return (float) $p->comision->monto;
        }), 2);
    }

    /**
     * Desglosa la prima por moneda nativa SIN convertir — a diferencia de
     * sumTotalUsd(), que normaliza todo a USD para sumar pólizas de
     * distinta moneda en un único total comparable.
     */
    private function primasPorMoneda($policies): array
    {
        $out = [];
        foreach ($policies->groupBy(fn ($p) => $p->monedaNativa()) as $moneda => $pols) {
            $out[$moneda] = [
                'monto'   => round((float) $pols->sum('total'), 2),
                'polizas' => $pols->count(),
            ];
        }
        return $out;
    }

    /** Marca una comisión como pagada o la revierte a pendiente. */
    /**
     * Marca una comisión como pagada (flujo normal, un solo sentido:
     * PENDIENTE → PAGADA). Revertir una ya pagada a pendiente es una
     * corrección de errores y requiere el permiso `revertir_comisiones`
     * (por defecto solo Admin) — no es parte del flujo normal de cobro.
     */
    public function marcarComision(Request $request, $id)
    {
        $data = $request->validate([
            'status'      => 'required|string|in:PAGADA,PENDIENTE',
            'observacion' => ['nullable', 'string', 'max:500', new NoInjectionChars()],
        ]);

        $comision = Comision::findOrFail($id);

        if ($data['status'] === 'PENDIENTE' && $comision->status === 'PAGADA') {
            if (!PermisosPorRol::tiene(auth()->user(), 'reportes', 'revertir_comisiones')) {
                return response()->json(['message' => 'No tiene permiso para revertir una comisión pagada.'], 403);
            }
        }

        $comision->update([
            'status'      => $data['status'],
            'fecha_pago'  => $data['status'] === 'PAGADA' ? now()->toDateString() : null,
            'pagado_por'  => $data['status'] === 'PAGADA' ? auth()->id() : null,
            // La observación es la nota del pago; al revertir a pendiente se limpia.
            'observacion' => $data['status'] === 'PAGADA' ? ($data['observacion'] ?? null) : null,
        ]);

        $this->logActivity(
            'Comisión Actualizada',
            "Comisión #{$comision->id} (póliza {$comision->poliza?->nro_contrato}) → {$data['status']}",
            'comision',
            auth()->id()
        );

        return response()->json([
            'id'          => $comision->id,
            'status'      => $comision->status,
            'fecha_pago'  => $comision->fecha_pago?->format('d/m/Y'),
            'observacion' => $comision->observacion,
        ]);
    }

    /**
     * Pago por lotes: marca como PAGADA todas las comisiones pendientes de
     * la lista recibida. El frontend ya verificó la contraseña del usuario
     * (POST /api/user/verify-password) antes de llamar este endpoint — acá
     * no se vuelve a pedir, igual que el resto de las acciones sensibles
     * de la app (ver ConfirmActionModal). Si el usuario no tiene
     * `view_ventas_todos`/`view_metrics_personal_todos`, solo puede pagar
     * comisiones de sus propias pólizas, sin importar qué ids le manden —
     * evita que alguien con `manage_comisiones` pero sin visibilidad de
     * "todos" pague comisiones de otro vendedor.
     */
    public function pagarLoteComisiones(Request $request)
    {
        $data = $request->validate([
            'comision_ids'   => 'required|array|min:1',
            'comision_ids.*' => 'integer',
            'observacion'    => 'nullable|string|max:500',
        ]);

        $user = auth()->user();
        $puedeVerTodos = PermisosPorRol::tiene($user, 'reportes', 'view_ventas_todos')
            || PermisosPorRol::tiene($user, 'reportes', 'view_metrics_personal_todos');

        $query = Comision::whereIn('id', $data['comision_ids'])->where('status', 'PENDIENTE');
        if (!$puedeVerTodos) {
            $query->where('vendedor_id', $user->id);
        }
        $comisiones = $query->get();

        foreach ($comisiones as $c) {
            $c->update([
                'status'      => 'PAGADA',
                'fecha_pago'  => now()->toDateString(),
                'pagado_por'  => $user->id,
                'observacion' => $data['observacion'] ?? null,
            ]);
        }

        if ($comisiones->isNotEmpty()) {
            $this->logActivity(
                'Pago de Comisiones por Lote',
                "Se marcaron {$comisiones->count()} comisiones como pagadas: " . $comisiones->pluck('id')->implode(', '),
                'comision',
                $user->id
            );
        }

        return response()->json([
            'pagadas' => $comisiones->count(),
            'ids'     => $comisiones->pluck('id'),
        ]);
    }

    public function exportUsuariosReport(Request $request)
    {
        $user = auth()->user();
        if ($user && !PermisosPorRol::tiene($user, 'reportes', 'view_metrics_personal_todos')) {
            $request->merge(['usuario_id' => $user->id]);
        }

        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
            'usuario_id'   => 'nullable|integer|exists:usuarios,id',
        ]);

        $fechaInicio = $request->filled('fecha_inicio') ? $request->fecha_inicio : now()->startOfMonth()->toDateString();
        $fechaFin    = $request->filled('fecha_fin')    ? $request->fecha_fin    : now()->toDateString();

        if ($request->filled('usuario_id')) {
            $usuario = Usuario::findOrFail($request->usuario_id);
            $rows = Poliza::with(['producto', 'solicitud.persona', 'comision'])
                ->where('vendedor_id', $usuario->id)
                ->whereBetween('fecha_emision', [$fechaInicio, $fechaFin])
                ->orderBy('fecha_emision', 'desc')
                ->get()
                ->map(fn ($p) => [
                    'fecha_emision'       => $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '—',
                    'nro_contrato'        => $p->nro_contrato,
                    'cliente_nombre'      => $p->solicitud?->persona?->nombre ?? $p->asegurado_nombre ?? '—',
                    'producto_nombre'     => $p->producto?->nombre ?? '—',
                    'total'               => (float) $p->total,
                    'moneda_producto'     => $p->monedaNativa(),
                    'status'              => $p->status,
                    'comision_monto'      => $p->comision ? (float) $p->comision->monto : null,
                    'comision_status'     => $p->comision?->status,
                    'comision_fecha_pago' => $p->comision?->fecha_pago?->format('d/m/Y'),
                ]);

            return (new UsuarioPolizasExport($rows, $usuario->nombre, $request->input('columnas')))
                ->download('metricas_personal_' . str_replace(' ', '_', $usuario->nombre) . '_' . now()->format('Ymd_His') . '.xlsx');
        }

        $vendedoresQuery = Usuario::whereIn('cargo', ['Agente', 'Supervisor'])
            ->orWhereExists(function ($q) {
                $q->select(DB::raw(1))->from('poliza')->whereColumn('poliza.vendedor_id', 'usuarios.id');
            });

        $rows = $vendedoresQuery->get()->map(function ($v) use ($fechaInicio, $fechaFin) {
            $policies     = Poliza::with('comision')->where('vendedor_id', $v->id)->whereBetween('fecha_emision', [$fechaInicio, $fechaFin])->get();
            $totalPremium = $this->sumTotalUsd($policies);
            return [
                'nom'        => $v->nombre,
                'rol'        => $v->cargo,
                'ofi'        => $v->sede ?? 'Sede Central',
                'pol'        => $policies->count(),
                'prima'      => $totalPremium,
                'com_gen'    => $this->sumComision($policies),
                'com_pagada' => $this->sumComision($policies, 'PAGADA'),
                'com_pend'   => $this->sumComision($policies, 'PENDIENTE'),
                'est'        => $v->activo ? 'Activo' : 'Inactivo',
            ];
        })->values();

        if ($rows->isNotEmpty()) {
            $rows->push([
                'nom' => 'TOTAL', 'rol' => '', 'ofi' => '',
                'pol' => $rows->sum('pol'),
                'prima' => round($rows->sum('prima'), 2),
                'com_gen' => round($rows->sum('com_gen'), 2),
                'com_pagada' => round($rows->sum('com_pagada'), 2),
                'com_pend' => round($rows->sum('com_pend'), 2),
                'est' => '',
            ]);
        }

        return (new UsuariosMetricsExport($rows, $request->input('columnas')))
            ->download('metricas_personal_' . now()->format('Ymd_His') . '.xlsx');
    }

    // ── REPORTE DE CLIENTES ───────────────────────────────────────────────────────

    public function getClientesReport(Request $request)
    {
        $noInjection = new NoInjectionChars();

        $request->validate([
            'fecha_inicio'   => 'nullable|date',
            'fecha_fin'      => 'nullable|date|after_or_equal:fecha_inicio',
            'persona_id'     => 'nullable|integer|exists:persona,id',
            'search'         => ['nullable', 'string', 'max:100', $noInjection],
            'filtro'         => 'nullable|string|in:por_vencer,mas_polizas,por_bienes,activos,bloqueados',
            'marca'          => ['nullable', 'string', 'max:100', $noInjection],
            'modelo'         => ['nullable', 'string', 'max:100', $noInjection],
            'min_bienes'     => 'nullable|integer|min:0',
            'max_bienes'     => 'nullable|integer|min:0',
            'estado_poliza'  => 'nullable|string|in:ACTIVA,VENCIDA,ANULADA',
            'min_prima'      => 'nullable|numeric|min:0',
            'max_prima'      => 'nullable|numeric|min:0',
        ]);

        $fechaInicio = $request->filled('fecha_inicio') ? $request->fecha_inicio : now()->startOfMonth()->toDateString();
        $fechaFin    = $request->filled('fecha_fin')    ? $request->fecha_fin    : now()->toDateString();

        // ── Detalle de un cliente específico ─────────────────────────────────────
        if ($request->filled('persona_id')) {
            $persona = Persona::findOrFail($request->persona_id);
            $bienes  = BienAsegurado::where('persona_id', $persona->id)->where('tipo', 'vehiculo')->get();
            $policies = Poliza::with(['producto', 'solicitud'])
                ->whereHas('solicitud', fn ($q) => $q->where('persona_id', $persona->id))
                ->orderBy('fecha_emision', 'desc')
                ->get();

            return response()->json([
                'cliente' => [
                    'id'             => $persona->id,
                    'nombre'         => $persona->nombre,
                    'cedula'         => $persona->cedula,
                    'correo'         => $persona->correo ?? '—',
                    'telefono'       => $persona->telefono ?? '—',
                    'celular'        => $persona->celular ?? '—',
                    'direccion'      => $persona->direccion ?? '—',
                    'estado'         => $persona->estado ?? '—',
                    'ciudad'         => $persona->ciudad ?? '—',
                    'fecha_creacion' => $persona->fecha_creacion ? $persona->fecha_creacion->format('d/m/Y H:i') : '—',
                    'activo'         => $persona->activo,
                ],
                'vehiculos' => $bienes->map(function ($b) {
                    $attr = $b->atributos ?? [];
                    return [
                        'id'               => $b->id,
                        'placa'            => $b->placa_idx ?? $attr['placa'] ?? '—',
                        'marca'            => $attr['marca'] ?? '—',
                        'modelo'           => $attr['modelo'] ?? '—',
                        'anio'             => $attr['anio'] ?? '—',
                        'color'            => $attr['color'] ?? '—',
                        'uso'              => $attr['uso'] ?? '—',
                        'tipo'             => $attr['tipo'] ?? '—',
                        'serial_carroceria'=> $attr['serial_carroceria'] ?? '—',
                        'serial_motor'     => $attr['serial_motor'] ?? '—',
                    ];
                }),
                'polizas' => $policies->map(function ($p) {
                    return [
                        'id'                => $p->id,
                        'nro_contrato'      => $p->nro_contrato,
                        'fecha_emision'     => $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '—',
                        'fecha_vencimiento' => $p->fecha_vencimiento ? $p->fecha_vencimiento->format('d/m/Y') : '—',
                        'producto'          => $p->producto?->nombre ?? '—',
                        'total'             => round($this->totalUsd($p), 2),
                        'status'            => $p->status,
                    ];
                }),
            ]);
        }

        // ── Estadísticas agregadas ────────────────────────────────────────────────
        $stats = [
            'nuevos_clientes'    => Persona::whereBetween('fecha_creacion', [$fechaInicio . ' 00:00:00', $fechaFin . ' 23:59:59'])->count(),
            'total_clientes'     => Persona::count(),
            'clientes_activos'   => Persona::whereHas('solicitudes.polizas', fn ($q) => $q->where('status', 'ACTIVA'))->count(),
            'total_polizas'      => Poliza::whereBetween('fecha_emision', [$fechaInicio, $fechaFin])->count(),
            'polizas_por_vencer' => Poliza::where('status', 'ACTIVA')->whereBetween('fecha_vencimiento', [now()->toDateString(), now()->addDays(30)->toDateString()])->count(),
        ];

        // ── Opciones para filtros (marcas/modelos) ────────────────────────────────
        // Se toman del catálogo de vehículos, que es la fuente de verdad con
        // casing consistente. Antes se derivaban de atributos.marca de los bienes,
        // donde el mismo modelo podía estar guardado con distinto casing
        // (p.ej. "Chevrolet" y "CHEVROLET") y salía duplicado en el filtro.
        $catalogoPath = storage_path('app/public/modelos_vehiculos.json');
        $catalogo = is_file($catalogoPath) ? (json_decode(file_get_contents($catalogoPath), true) ?: []) : [];

        $fuenteMarcas = !empty($catalogo)
            ? collect($catalogo)
            // Respaldo si el catálogo está vacío: derivar de los bienes.
            : BienAsegurado::where('tipo', 'vehiculo')->get()
                ->map(fn ($b) => ['marca' => $b->atributos['marca'] ?? null, 'modelo' => $b->atributos['modelo'] ?? null]);

        // Deduplica sin distinguir mayúsculas/minúsculas (una sola "Chevrolet").
        $marcas = $fuenteMarcas->pluck('marca')->filter()
            ->unique(fn ($m) => mb_strtoupper(trim((string) $m)))
            ->sortBy(fn ($m) => mb_strtoupper((string) $m))
            ->values()
            ->all();

        $modelos = $fuenteMarcas
            ->filter(fn ($i) => !empty($i['marca']) && !empty($i['modelo']))
            ->groupBy('marca')
            ->map(fn ($g) => $g->pluck('modelo')->filter()
                ->unique(fn ($m) => mb_strtoupper(trim((string) $m)))
                ->sortBy(fn ($m) => mb_strtoupper((string) $m))
                ->values()->all())
            ->all();

        $filtros_opciones = ['marcas' => $marcas, 'modelos' => $modelos];

        // ── Listado con filtros (PAGINADO: ~50 clientes por página) ───────────────
        $filtro    = $request->input('filtro');
        $perPage   = min(max((int) $request->input('per_page', 50), 1), 200);
        $paginator = $this->clientesFiltrados($request)->orderBy('nombre')->paginate($perPage);

        $rows = $paginator->getCollection()->map(function ($c) {
            $polizas       = $c->solicitudes->flatMap->polizas;
            $bienes        = $c->bienes; // todos los tipos de bien (vehículo, inmueble, etc.)
            $polizasActivas = $polizas->where('status', 'ACTIVA');

            $proxVenc     = $polizasActivas->filter(fn ($p) => $p->fecha_vencimiento !== null)->sortBy('fecha_vencimiento')->first();
            $proxVencFecha = $proxVenc?->fecha_vencimiento ? $proxVenc->fecha_vencimiento->format('d/m/Y') : '—';
            $proxVencSort  = $proxVenc?->fecha_vencimiento ? $proxVenc->fecha_vencimiento->toDateString() : '9999-12-31';

            $marcasCliente = $bienes->map(fn ($b) => $b->atributos['marca'] ?? null)->filter()->unique()->values()->implode(', ');
            $dir           = collect([$c->direccion, $c->ciudad, $c->estado])->filter()->implode(', ');

            return [
                'id'             => $c->id,
                'ced'            => $c->cedula ?? '—',
                'nom'            => $c->nombre ?? '—',
                'cor'            => $c->correo ?? '—',
                'tel'            => $c->celular ?? $c->telefono ?? '—',
                'dir'            => $dir ?: '—',
                'reg'            => $c->fecha_creacion ? $c->fecha_creacion->format('d/m/Y') : '—',
                'bienes'         => $bienes->count(),
                'marcas'         => $marcasCliente ?: '—',
                'pol'            => $polizas->count(),
                'pol_act'        => $polizasActivas->count(),
                'prox_venc'      => $proxVencFecha,
                'prox_venc_sort' => $proxVencSort,
                'prima'          => round($this->sumTotalUsd($polizas), 2),
                'est'            => $c->activo ? 'Activo' : 'Bloqueado',
            ];
        });

        $rows = $this->filtrarClientesPorConteos($rows, $request);

        if ($filtro === 'por_vencer') {
            $rows = $rows->sortBy('prox_venc_sort')->values();
        } elseif ($filtro === 'mas_polizas') {
            $rows = $rows->sortByDesc('pol')->values();
        } elseif ($filtro === 'por_bienes') {
            $rows = $rows->sortByDesc('bienes')->values();
        } else {
            $rows = $rows->values();
        }

        return response()->json([
            'stats'            => $stats,
            'clientes'         => $rows,
            'total'            => $paginator->total(),
            'page'             => $paginator->currentPage(),
            'per_page'         => $paginator->perPage(),
            'filtros_opciones' => $filtros_opciones,
        ]);
    }

    /**
     * Aplica al query de clientes los mismos filtros del reporte (búsqueda,
     * filtro rápido, marca/modelo del bien y estado de póliza). Compartido por
     * el listado en pantalla y la exportación a Excel.
     */
    private function clientesFiltrados(Request $request): \Illuminate\Database\Eloquent\Builder
    {
        $clientesQuery = Persona::with(['bienes', 'solicitudes.polizas']);

        if ($request->filled('search')) {
            $search = $request->search;
            $clientesQuery->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('cedula', 'like', "%{$search}%")
                  ->orWhere('correo', 'like', "%{$search}%")
                  ->orWhere('telefono', 'like', "%{$search}%")
                  ->orWhere('celular', 'like', "%{$search}%");
            });
        }

        $filtro = $request->input('filtro');
        if ($filtro === 'activos') {
            $clientesQuery->where('activo', true);
        } elseif ($filtro === 'bloqueados') {
            $clientesQuery->where('activo', false);
        } elseif ($filtro === 'por_vencer') {
            $clientesQuery->whereHas('solicitudes.polizas', function ($q) {
                $q->where('status', 'ACTIVA')
                  ->whereBetween('fecha_vencimiento', [now()->toDateString(), now()->addDays(30)->toDateString()]);
            });
        }

        // Coincidencia sin distinguir mayúsculas: los JSON de MySQL comparan de
        // forma binaria (sensible a mayúsculas), por eso se normaliza con UPPER()
        // en ambos lados — si no, elegir "Chevrolet" no encontraba los bienes
        // guardados como "CHEVROLET".
        if ($request->filled('marca')) {
            $clientesQuery->whereHas('bienes', function ($q) use ($request) {
                $q->where('tipo', 'vehiculo')
                  ->whereRaw("UPPER(JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.marca'))) = UPPER(?)", [$request->marca]);
            });
        }
        if ($request->filled('modelo')) {
            $clientesQuery->whereHas('bienes', function ($q) use ($request) {
                $q->where('tipo', 'vehiculo')
                  ->whereRaw("UPPER(JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.modelo'))) = UPPER(?)", [$request->modelo]);
            });
        }
        if ($request->filled('estado_poliza')) {
            $clientesQuery->whereHas('solicitudes.polizas', fn ($q) => $q->where('status', $request->estado_poliza));
        }

        // Devuelve el QUERY (no ->get()): el listado en pantalla lo pagina para no
        // cargar 52k clientes con relaciones en memoria; el export hace ->get().
        return $clientesQuery;
    }

    /** Filtros post-query sobre conteos calculados (bienes/prima min-max). */
    private function filtrarClientesPorConteos(\Illuminate\Support\Collection $rows, Request $request): \Illuminate\Support\Collection
    {
        if ($request->filled('min_bienes')) {
            $rows = $rows->filter(fn ($r) => $r['bienes'] >= (int) $request->min_bienes);
        }
        if ($request->filled('max_bienes')) {
            $rows = $rows->filter(fn ($r) => $r['bienes'] <= (int) $request->max_bienes);
        }
        if ($request->filled('min_prima')) {
            $rows = $rows->filter(fn ($r) => $r['prima'] >= (float) $request->min_prima);
        }
        if ($request->filled('max_prima')) {
            $rows = $rows->filter(fn ($r) => $r['prima'] <= (float) $request->max_prima);
        }
        return $rows;
    }

    /**
     * Exporta el reporte de clientes a Excel: una fila por cliente con TODOS
     * sus datos individuales y completos (tabla gigante). Respeta los mismos
     * filtros que la pantalla y permite elegir columnas.
     */
    public function exportClientesReport(Request $request)
    {
        $noInjection = new NoInjectionChars();
        $request->validate([
            'search'        => ['nullable', 'string', 'max:100', $noInjection],
            'filtro'        => 'nullable|string|in:por_vencer,mas_polizas,por_bienes,activos,bloqueados',
            'marca'         => ['nullable', 'string', 'max:100', $noInjection],
            'modelo'        => ['nullable', 'string', 'max:100', $noInjection],
            'min_bienes'    => 'nullable|integer|min:0',
            'max_bienes'    => 'nullable|integer|min:0',
            'estado_poliza' => 'nullable|string|in:ACTIVA,VENCIDA,ANULADA',
            'min_prima'     => 'nullable|numeric|min:0',
            'max_prima'     => 'nullable|numeric|min:0',
            'columnas'      => 'nullable|array',
        ]);

        $filtro   = $request->input('filtro');
        $clientes = $this->clientesFiltrados($request)->get();

        $rows = $clientes->map(function ($c) {
            $polizas        = $c->solicitudes->flatMap->polizas;
            $bienes         = $c->bienes;
            $polizasActivas = $polizas->where('status', 'ACTIVA');

            $proxVenc      = $polizasActivas->filter(fn ($p) => $p->fecha_vencimiento !== null)->sortBy('fecha_vencimiento')->first();
            $proxVencFecha = $proxVenc?->fecha_vencimiento ? $proxVenc->fecha_vencimiento->format('d/m/Y') : '—';
            $proxVencSort  = $proxVenc?->fecha_vencimiento ? $proxVenc->fecha_vencimiento->toDateString() : '9999-12-31';
            $marcasCliente = $bienes->map(fn ($b) => $b->atributos['marca'] ?? null)->filter()->unique()->values()->implode(', ');

            return [
                'ced'            => $c->cedula ?? '—',
                'nom'            => $c->nombre ?? '—',
                'cor'            => $c->correo ?? '—',
                'tel'            => $c->telefono ?? '—',
                'cel'            => $c->celular ?? '—',
                'dir'            => $c->direccion ?? '—',
                'ciudad'         => $c->ciudad ?? '—',
                'estado_region'  => $c->estado ?? '—',
                'reg'            => $c->fecha_creacion ? $c->fecha_creacion->format('d/m/Y') : '—',
                'bienes'         => $bienes->count(),
                'marcas'         => $marcasCliente ?: '—',
                'pol'            => $polizas->count(),
                'pol_act'        => $polizasActivas->count(),
                'prox_venc'      => $proxVencFecha,
                'prox_venc_sort' => $proxVencSort,
                'prima'          => round($this->sumTotalUsd($polizas), 2),
                'est'            => $c->activo ? 'Activo' : 'Bloqueado',
            ];
        });

        $rows = $this->filtrarClientesPorConteos($rows, $request);

        if ($filtro === 'por_vencer') {
            $rows = $rows->sortBy('prox_venc_sort')->values();
        } elseif ($filtro === 'mas_polizas') {
            $rows = $rows->sortByDesc('pol')->values();
        } elseif ($filtro === 'por_bienes') {
            $rows = $rows->sortByDesc('bienes')->values();
        } else {
            $rows = $rows->sortBy('nom')->values();
        }

        return (new ClientesMetricsExport($rows, $request->input('columnas')))
            ->download('metricas_clientes_' . now()->format('Ymd_His') . '.xlsx');
    }

    // ── REPORTE DE VEHÍCULOS ──────────────────────────────────────────────────────

    public function getVehiculosReport(Request $request)
    {
        $noInjection = new NoInjectionChars();

        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
            'placa'        => ['nullable', 'string', 'max:20', $noInjection],
            'search'       => ['nullable', 'string', 'max:100', $noInjection],
            'tipo_veh'     => ['nullable', 'string', 'max:50', $noInjection],
        ]);

        $fechaInicio = $request->filled('fecha_inicio') ? $request->fecha_inicio : now()->startOfMonth()->toDateString();
        $fechaFin    = $request->filled('fecha_fin')    ? $request->fecha_fin    : now()->toDateString();

        // ── Detalle de un vehículo por placa ─────────────────────────────────────
        if ($request->filled('placa')) {
            $bien = BienAsegurado::with(['persona'])
                ->where('tipo', 'vehiculo')
                ->where('placa_idx', strtoupper($request->placa))
                ->firstOrFail();

            $polizas = Poliza::with(['producto', 'vendedor'])
                ->whereHas('solicitud', fn ($q) => $q->where('bien_asegurado_id', $bien->id))
                ->orderBy('fecha_emision', 'desc')
                ->get();

            $attr = $bien->atributos ?? [];
            return response()->json([
                'vehiculo' => [
                    'id'                => $bien->id,
                    'placa'             => $bien->placa_idx ?? $attr['placa'] ?? '—',
                    'marca'             => $attr['marca'] ?? '—',
                    'modelo'            => $attr['modelo'] ?? '—',
                    'anio'              => $attr['anio'] ?? '—',
                    'color'             => $attr['color'] ?? '—',
                    'uso'               => $attr['uso'] ?? '—',
                    'tipo'              => $attr['tipo'] ?? '—',
                    'serial_carroceria' => $attr['serial_carroceria'] ?? '—',
                    'serial_motor'      => $attr['serial_motor'] ?? '—',
                ],
                'propietario' => [
                    'id'     => $bien->persona?->id,
                    'nombre' => $bien->persona?->nombre ?? '—',
                    'cedula' => $bien->persona?->cedula ?? '—',
                ],
                'historial' => $polizas->map(function ($p) {
                    return [
                        'id'                => $p->id,
                        'nro_contrato'      => $p->nro_contrato,
                        'fecha_emision'     => $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '—',
                        'fecha_vencimiento' => $p->fecha_vencimiento ? $p->fecha_vencimiento->format('d/m/Y') : '—',
                        'producto'          => $p->producto?->nombre ?? '—',
                        'vendedor'          => $p->vendedor?->nombre ?? '—',
                        'total'             => round($this->totalUsd($p), 2),
                        'status'            => $p->status,
                    ];
                }),
            ]);
        }

        // ── Estadísticas agregadas ────────────────────────────────────────────────
        $vehiculosAsegurados = DB::table('poliza')
            ->join('solicitud', 'poliza.solicitud_id', '=', 'solicitud.id')
            ->join('bien_asegurado', function ($join) {
                $join->on('bien_asegurado.id', '=', 'solicitud.bien_asegurado_id')
                     ->where('bien_asegurado.tipo', 'vehiculo');
            })
            ->whereBetween('poliza.fecha_emision', [$fechaInicio, $fechaFin])
            ->whereNull('poliza.deleted_at')
            ->whereNull('solicitud.deleted_at')
            ->whereNull('bien_asegurado.deleted_at')
            ->distinct('solicitud.bien_asegurado_id')
            ->count('solicitud.bien_asegurado_id');

        $aseguradosEstaSemana = DB::table('poliza')
            ->join('solicitud', 'poliza.solicitud_id', '=', 'solicitud.id')
            ->join('bien_asegurado', function ($join) {
                $join->on('bien_asegurado.id', '=', 'solicitud.bien_asegurado_id')
                     ->where('bien_asegurado.tipo', 'vehiculo');
            })
            ->whereBetween('poliza.fecha_emision', [now()->subDays(7)->toDateString(), now()->toDateString()])
            ->whereNull('poliza.deleted_at')
            ->whereNull('solicitud.deleted_at')
            ->whereNull('bien_asegurado.deleted_at')
            ->distinct('solicitud.bien_asegurado_id')
            ->count('solicitud.bien_asegurado_id');

        $distribucionTipo = BienAsegurado::where('tipo', 'vehiculo')
            ->selectRaw("COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.tipo')), 'null'), JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.tipo_carroceria'))) as tipo_veh, COUNT(*) as total")
            ->groupBy('tipo_veh')
            ->get()
            ->filter(fn($r) => $r->tipo_veh !== null)
            ->pluck('total', 'tipo_veh')
            ->all();

        $distribucionUso = BienAsegurado::where('tipo', 'vehiculo')
            ->selectRaw("JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.uso')) as uso, COUNT(*) as total")
            ->groupBy('uso')
            ->get()
            ->filter(fn($r) => $r->uso !== null && $r->uso !== 'null')
            ->pluck('total', 'uso')
            ->all();

        $stats = [
            'vehiculos_asegurados_periodo' => $vehiculosAsegurados,
            'asegurados_esta_semana'       => $aseguradosEstaSemana,
            'distribucion_tipo'            => $distribucionTipo,
            'distribucion_uso'             => $distribucionUso,
        ];

        // ── Listado de vehículos ──────────────────────────────────────────────────
        $bienesQuery = BienAsegurado::where('tipo', 'vehiculo')
            ->with(['persona', 'solicitudes.polizas']);

        if ($request->filled('search')) {
            $search = $request->search;
            $bienesQuery->where(function ($q) use ($search) {
                $q->where('placa_idx', 'like', "%{$search}%")
                  ->orWhereRaw("JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.marca')) LIKE ?", ["%{$search}%"])
                  ->orWhereRaw("JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.modelo')) LIKE ?", ["%{$search}%"])
                  ->orWhereHas('persona', fn ($pq) => $pq->where('nombre', 'like', "%{$search}%"));
            });
        }

        // Mismo cálculo que distribucion_tipo arriba: el tipo puede venir en
        // 'tipo' o, en bienes más viejos, en 'tipo_carroceria'.
        if ($request->filled('tipo_veh')) {
            $bienesQuery->whereRaw(
                "COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.tipo')), 'null'), JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.tipo_carroceria'))) = ?",
                [$request->tipo_veh]
            );
        }

        // PAGINADO: ~50 vehículos por página (antes cargaba 44k con relaciones → OOM).
        $perPage   = min(max((int) $request->input('per_page', 50), 1), 200);
        $paginator = $bienesQuery->orderByDesc('id')->paginate($perPage);

        $rows = $paginator->getCollection()->map(function ($v) {
            $attr     = $v->atributos ?? [];
            $polizas  = $v->solicitudes->flatMap->polizas;
            $activa   = $polizas->where('status', 'ACTIVA')->isNotEmpty();
            $ultima   = $polizas->sortByDesc('fecha_emision')->first();

            return [
                'id'  => $v->id,
                'pla' => $v->placa_idx ?? $attr['placa'] ?? '—',
                'mar' => $attr['marca'] ?? '—',
                'mod' => $attr['modelo'] ?? '—',
                'ani' => $attr['anio'] ?? '—',
                'col' => $attr['color'] ?? '—',
                'tip' => $attr['tipo'] ?? $attr['tipo_carroceria'] ?? '—',
                'pro' => $v->persona?->nombre ?? '—',
                'est' => $activa ? 'Asegurado' : 'Sin Seguro',
                'pol' => $ultima?->nro_contrato ?? '—',
            ];
        });

        return response()->json([
            'stats'     => $stats,
            'vehiculos' => $rows,
            'total'     => $paginator->total(),
            'page'      => $paginator->currentPage(),
            'per_page'  => $paginator->perPage(),
        ]);
    }
}
