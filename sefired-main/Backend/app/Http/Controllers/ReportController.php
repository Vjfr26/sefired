<?php

namespace App\Http\Controllers;

use App\Models\Log;
use App\Models\Usuario;
use App\Models\Cliente;
use App\Models\Poliza;
use App\Models\Solicitud;
use App\Models\UnderwritingEvaluacion;
use App\Models\Vehiculo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Exports\ExternalReportExport;
use App\Exports\VentasExport;
use App\Exports\SuperintendenciaExport;
use App\Exports\OficinasExport;
use App\Exports\PersonalExport;
use App\Exports\InternalReportExport;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ReportController extends Controller
{
    /**
     * Obtiene el historial de logs del sistema con filtros.
     */
    public function getLogs(Request $request)
    {
        $request->validate([
            'usuario_id' => 'nullable|integer|exists:usuarios,id',
            'accion'     => 'nullable|string|max:100',
            'desde'      => 'nullable|date',
            'hasta'      => 'nullable|date|after_or_equal:desde',
        ]);

        $query = Log::with('usuario:id,nombre')
            ->orderBy('created_at', 'desc');

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

        return response()->json($query->paginate(20));
    }

    /**
     * Obtiene estadísticas generales para el Dashboard.
     */
    public function getStats()
    {
        $stats = [
            'total_usuarios'           => Usuario::count(),
            'usuarios_activos'         => Usuario::where('activo', true)->count(),
            'total_clientes'           => Cliente::count(),
            'logs_hoy'                 => Log::whereDate('created_at', today())->count(),
            'total_cotizaciones'       => Solicitud::count(),
            'cotizaciones_en_revision' => Solicitud::where('status', 'En Revisión')->count(),
            'cotizaciones_aprobadas'   => Solicitud::where('status', 'Aprobado')->count(),
            'cotizaciones_emitidas'    => Solicitud::where('status', 'Emitida')->count(),
            'cotizaciones_rechazadas'  => Solicitud::where('status', 'Rechazado')->count(),
            'polizas_activas'          => Poliza::where('status', 'ACTIVA')->count(),
            'polizas_vencidas'         => Poliza::where('status', 'VENCIDA')->count(),
            'polizas_anuladas'         => Poliza::where('status', 'ANULADA')->count(),
            'underwriting_pendiente'   => UnderwritingEvaluacion::where('resultado', 'pendiente')->count(),
            'underwriting_observado'   => UnderwritingEvaluacion::where('resultado', 'observado')->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Obtiene el listado de pólizas listas para reportes externos con filtros.
     */
    public function getExternalReportPolicies(Request $request)
    {
        $query = Poliza::with([
            'solicitud.cliente.persona',
            'producto'
        ])->orderBy('fecha_emision', 'desc');

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_emision', '<=', $request->fecha_fin);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nro_contrato', 'like', "%{$search}%")
                  ->orWhereHas('solicitud', function($sq) use ($search) {
                      $sq->where('placa', 'like', "%{$search}%")
                        ->orWhere('nombre_tomador', 'like', "%{$search}%")
                        ->orWhere('ci_tomador', 'like', "%{$search}%")
                        ->orWhereHas('cliente.persona', function($pq) use ($search) {
                            $pq->where('nombre', 'like', "%{$search}%")
                              ->orWhere('cedula', 'like', "%{$search}%");
                        });
                  });
            });
        }

        $policies = $query->get()->map(function($p) {
            $sol = $p->solicitud;
            $veh = null;
            if ($sol && $sol->placa) {
                $veh = \App\Models\Vehiculo::with('modeloVehiculo')->where('placa', $sol->placa)->first();
            }
            $marca = $veh?->modeloVehiculo?->marca ?? '—';
            $modelo = $veh?->modeloVehiculo?->modelo ?? '—';
            $anio = $veh?->anio ?? '—';
            $vehiculo = $marca !== '—' ? "{$marca} {$modelo} ({$anio})" : '—';

            $inicio = $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '—';
            $fin = $p->fecha_vencimiento ? $p->fecha_vencimiento->format('d/m/Y') : '—';

            return [
                'id' => $p->id,
                'nro_contrato' => $p->nro_contrato,
                'tomador' => $sol?->nombre_tomador ?? $sol?->cliente?->persona?->nombre ?? '—',
                'ci_tomador' => $sol?->ci_tomador ?? $sol?->cliente?->persona?->cedula ?? '—',
                'vehiculo' => $vehiculo,
                'placa' => $sol?->placa ?? '—',
                'fecha_emision' => $inicio,
                'fecha_vencimiento' => $fin,
                'vigencia' => "{$inicio} - {$fin}",
                'total' => (float)$p->total,
                'producto' => $p->producto?->nombre ?? '—',
            ];
        });

        return response()->json($policies);
    }

    /**
     * Exporta las pólizas seleccionadas como un archivo Excel (XLSX) con formato de carga masiva.
     */
    public function exportExternalReport(Request $request)
    {
        $query = Poliza::with([
            'solicitud.cliente.persona',
            'producto'
        ])->orderBy('fecha_emision', 'desc');

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
        $filename = 'reporte_externo_' . now()->format('Ymd_His') . '.xlsx';

        $export = new ExternalReportExport($policies);
        return $export->download($filename);
    }

    /**
     * Obtiene las programaciones de reportes externos.
     */
    public function getExternalReportSchedules()
    {
        $schedules = DB::table('reportes_externos_programaciones')->get();
        return response()->json($schedules);
    }

    /**
     * Guarda la configuración de las programaciones.
     */
    public function saveExternalReportSchedules(Request $request)
    {
        $request->validate([
            'schedules' => 'required|array',
            'schedules.*.id' => 'required|integer|exists:reportes_externos_programaciones,id',
            'schedules.*.activo' => 'required|boolean',
            'schedules.*.hora' => 'required|string',
        ]);

        foreach ($request->schedules as $sched) {
            DB::table('reportes_externos_programaciones')
                ->where('id', $sched['id'])
                ->update([
                    'activo' => $sched['activo'],
                    'hora' => $sched['hora'],
                    'updated_at' => now(),
                ]);
        }

        return response()->json(['message' => 'Configuración guardada correctamente']);
    }

    /**
     * Obtiene el historial de reportes externos generados automáticamente.
     */
    public function getExternalReportHistory()
    {
        $history = DB::table('reportes_externos_historial')
            ->orderBy('fecha_generacion', 'desc')
            ->get();
        return response()->json($history);
    }

    /**
     * Ejecuta manualmente una programación de reporte externo.
     */
    public function runExternalReportSchedule(Request $request)
    {
        $request->validate([
            'schedule_id' => 'required|integer|exists:reportes_externos_programaciones,id',
        ]);

        $schedule = DB::table('reportes_externos_programaciones')->where('id', $request->schedule_id)->first();

        // Determinar rango de fecha basado en la frecuencia
        $fechaFin = now();
        if ($schedule->frecuencia === 'diario') {
            $fechaInicio = now()->subDay();
        } elseif ($schedule->frecuencia === 'semanal') {
            $fechaInicio = now()->subWeek();
        } else {
            $fechaInicio = now()->subMonth();
        }

        // Consultar pólizas emitidas en el rango
        $policies = Poliza::with([
            'solicitud.cliente.persona',
            'producto'
        ])
        ->whereBetween('fecha_emision', [$fechaInicio->toDateString(), $fechaFin->toDateString()])
        ->get();

        $filename = 'reporte_' . strtolower($schedule->frecuencia) . '_' . now()->format('Ymd_His') . '.xlsx';

        // Guardar archivo en storage/app/public/reportes_externos
        $directory = 'reportes_externos';
        if (!Storage::disk('public')->exists($directory)) {
            Storage::disk('public')->makeDirectory($directory);
        }
        
        $path = $directory . '/' . $filename;
        $export = new ExternalReportExport($policies);
        $export->store($path, 'public');
        $size = Storage::disk('public')->size($path);

        // Registrar en historial
        DB::table('reportes_externos_historial')->insert([
            'nombre_reporte' => "Generación automática (" . ucfirst($schedule->frecuencia) . ")",
            'fecha_generacion' => now(),
            'archivo_path' => $path,
            'size' => $size,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Actualizar último envío
        DB::table('reportes_externos_programaciones')
            ->where('id', $schedule->id)
            ->update(['ultimo_envio' => now()]);

        return response()->json(['message' => 'Reporte ejecutado y guardado con éxito']);
    }

    /**
     * Descarga un reporte específico del historial.
     */
    public function downloadExternalReport($id)
    {
        $report = DB::table('reportes_externos_historial')->where('id', $id)->first();
        if (!$report || !Storage::disk('public')->exists($report->archivo_path)) {
            return response()->json(['error' => 'Archivo no encontrado'], 404);
        }

        $fullPath = Storage::disk('public')->path($report->archivo_path);
        $extension = strtolower(pathinfo($report->archivo_path, PATHINFO_EXTENSION));
        
        $contentType = $extension === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv; charset=UTF-8';

        if (ob_get_length()) {
            ob_end_clean();
        }

        return response()->download($fullPath, basename($report->archivo_path), [
            'Content-Type' => $contentType
        ]);
    }

    /**
     * Helper para obtener la ruta del archivo plantilla.
     */
    private function getTemplatePath()
    {
        $paths = [
            base_path('ESTRUCTURA_ARCH_MASIVA.xlsx'),
            base_path('../BD/ESTRUCTURA ARCHIVO CARG MASIVA.xlsx'),
            base_path('BD/ESTRUCTURA ARCHIVO CARG MASIVA.xlsx'),
        ];
        foreach ($paths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }
        return null;
    }

    /**
     * Parsea la Cédula/RIF venezolana en Nacionalidad y Número.
     */
    /**
     * Obtiene ventas y comisiones del período con filtros de fecha.
     */
    public function getVentasComisiones(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
        ]);

        $query = Poliza::with(['vendedor', 'producto']);

        $user = auth()->user();
        if ($user && (str_starts_with($user->tipo, 'Vendedor') || $user->tipo === 'Vendedor')) {
            $query->where('vendedor_id', $user->id);
        }

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_emision', '<=', $request->fecha_fin);
        }

        $policies = $query->orderBy('fecha_emision', 'desc')->get();

        // 1. Ventas del período
        $ventas = $policies->map(function ($p) {
            return [
                'id'     => $p->id,
                'fecha'  => $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '—',
                'pol'    => $p->nro_contrato,
                'agente' => $p->vendedor?->nombre ?? '—',
                'tipo'   => $p->producto?->nombre ?? '—',
                'prima'  => (float) $p->total,
                'est'    => $p->status === 'ACTIVA' ? 'Vigente' : ($p->status === 'ANULADA' ? 'Anulada' : $p->status),
            ];
        });

        // 2. Comisiones del período
        $comisionesGrouped = $policies->groupBy('vendedor_id');
        $comisiones = [];

        foreach ($comisionesGrouped as $vendedorId => $pols) {
            $vendedor = $pols->first()->vendedor;
            if (!$vendedor) continue;

            $base = $pols->sum('total');
            $tasa = strtolower($vendedor->cargo) === 'agente' ? 0.10 : 0.05;
            $comisionVal = $base * $tasa;

            $comisiones[] = [
                'id'   => $vendedor->id,
                'ben'  => $vendedor->nombre,
                'rol'  => $vendedor->cargo,
                'pol'  => $pols->count(),
                'base' => (float)$base,
                'tasa' => ($tasa * 100) . '%',
                'com'  => (float)$comisionVal,
                'est'  => 'Pendiente' // por defecto
            ];
        }

        return response()->json([
            'ventas' => $ventas,
            'comisiones' => $comisiones,
        ]);
    }

    /**
     * Obtiene estadísticas agrupadas para Superintendencia.
     */
    public function getSuperintendencia(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
        ]);

        $query = Poliza::with(['producto']);

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_emision', '<=', $request->fecha_fin);
        }

        $policies = $query->get();

        // Estadísticas de cabecera
        $totalPolicies = $policies->count();
        $totalPremium = (float)$policies->sum('total');
        $rcPolicies = $policies->filter(fn($p) => $p->producto?->tipo === 'rcv')->count();
        $cancellations = $policies->filter(fn($p) => $p->status === 'ANULADA')->count();

        // Filas agrupadas por producto (ramo)
        $grouped = $policies->groupBy('producto_id');
        $rows = [];
        $totalPol = 0;
        $totalPri = 0;
        $totalRc = 0;
        $totalCan = 0;
        $totalBsSum = 0;

        foreach ($grouped as $prodId => $pols) {
            $prod = $pols->first()->producto;
            $nombre = $prod?->nombre ?? 'Sin Ramo';
            $polsCount = $pols->count();
            $primaSum = (float)$pols->sum('total');
            $rcCount = $pols->filter(fn($p) => $prod?->tipo === 'rcv')->count();
            $canCount = $pols->filter(fn($p) => $p->status === 'ANULADA')->count();
            $bsSum = (float)$pols->sum('total_bs');

            $rows[] = [
                'ramo'  => $nombre,
                'pol'   => $polsCount,
                'prima' => $primaSum,
                'rc'    => $rcCount,
                'can'   => $canCount,
                'bs2'   => $bsSum
            ];

            $totalPol += $polsCount;
            $totalPri += $primaSum;
            $totalRc += $rcCount;
            $totalCan += $canCount;
            $totalBsSum += $bsSum;
        }

        // Agregar fila total
        if ($totalPol > 0) {
            $rows[] = [
                'ramo'  => 'TOTAL',
                'pol'   => $totalPol,
                'prima' => $totalPri,
                'rc'    => $totalRc,
                'can'   => $totalCan,
                'bs2'   => $totalBsSum
            ];
        }

        return response()->json([
            'stats' => [
                'polizas_emitidas' => $totalPolicies,
                'prima_total'      => $totalPremium,
                'rc_obligatoria'   => $rcPolicies,
                'cancelaciones'    => $cancellations
            ],
            'rows' => $rows
        ]);
    }

    /**
     * Obtiene reporte del desempeño de las oficinas.
     */
    public function getOficinas(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
        ]);

        $query = Poliza::with(['vendedor']);

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_emision', '<=', $request->fecha_fin);
        }

        $policies = $query->get();
        $totalPremium = (float)$policies->sum('total');

        // Agrupar por la sede del vendedor
        $grouped = $policies->groupBy(function($p) {
            return $p->vendedor?->sede ?? 'Sede Central';
        });

        $rows = [];
        $totalAg = 0;
        $totalPol = 0;
        $totalPri = 0;

        foreach ($grouped as $sede => $pols) {
            $vendedorIds = $pols->pluck('vendedor_id')->unique()->filter()->toArray();
            $agentsCount = count($vendedorIds);
            $polsCount = $pols->count();
            $primaSum = (float)$pols->sum('total');
            $pct = $totalPremium > 0 ? (($primaSum / $totalPremium) * 100) : 0;

            $rows[] = [
                'ofi'   => $sede,
                'ag'    => $agentsCount,
                'pol'   => $polsCount,
                'prima' => $primaSum,
                'pct'   => round($pct, 1) . '%',
                'est'   => 'Activa'
            ];

            $totalAg += $agentsCount;
            $totalPol += $polsCount;
            $totalPri += $primaSum;
        }

        if ($totalPol > 0) {
            $rows[] = [
                'ofi'   => 'TOTAL',
                'ag'    => $totalAg,
                'pol'   => $totalPol,
                'prima' => $totalPri,
                'pct'   => '100%',
                'est'   => ''
            ];
        }

        return response()->json($rows);
    }

    /**
     * Obtiene reporte del desempeño del personal (vendedores).
     */
    public function getPersonal(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
        ]);

        $query = Poliza::with(['vendedor']);

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_emision', '<=', $request->fecha_fin);
        }

        $policies = $query->get();

        // Agrupar por vendedor_id
        $grouped = $policies->groupBy('vendedor_id');
        $rows = [];

        foreach ($grouped as $vendedorId => $pols) {
            $vendedor = $pols->first()->vendedor;
            if (!$vendedor) continue;

            $polsCount = $pols->count();
            $primaSum = (float)$pols->sum('total');
            $tasa = strtolower($vendedor->cargo) === 'agente' ? 0.10 : 0.05;
            $comision = $primaSum * $tasa;

            $rows[] = [
                'nom'   => $vendedor->nombre,
                'rol'   => $vendedor->cargo,
                'ofi'   => $vendedor->sede,
                'pol'   => $polsCount,
                'prima' => $primaSum,
                'com'   => (float)$comision,
                'est'   => $vendedor->activo ? 'Activo' : 'Inactivo'
            ];
        }

        // Agregar también supervisores u otros usuarios del sistema que no hayan hecho ventas directas pero deba mostrarse su estado
        $vendedorIdsConVentas = array_keys($grouped->toArray());
        $otrosVendedores = Usuario::whereNotIn('id', $vendedorIdsConVentas)->whereIn('cargo', ['Agente', 'Supervisor'])->get();
        foreach ($otrosVendedores as $ov) {
            $rows[] = [
                'nom'   => $ov->nombre,
                'rol'   => $ov->cargo,
                'ofi'   => $ov->sede,
                'pol'   => '—',
                'prima' => '—',
                'com'   => '—',
                'est'   => $ov->activo ? 'Activo' : 'Inactivo'
            ];
        }

        return response()->json($rows);
    }

    /**
     * Exporta el reporte de ventas y comisiones a Excel.
     */
    public function exportVentas(Request $request)
    {
        $query = Poliza::with(['vendedor', 'producto']);

        $user = auth()->user();
        if ($user && (str_starts_with($user->tipo, 'Vendedor') || $user->tipo === 'Vendedor')) {
            $query->where('vendedor_id', $user->id);
        }

        if ($request->filled('fecha_inicio')) $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        if ($request->filled('fecha_fin'))    $query->whereDate('fecha_emision', '<=', $request->fecha_fin);

        $policies = $query->orderBy('fecha_emision', 'desc')->get();
        return (new VentasExport($policies))->download('reporte_ventas_' . now()->format('Ymd_His') . '.xlsx');
    }

    /**
     * Exporta el reporte de Superintendencia a Excel.
     */
    public function exportSuperintendencia(Request $request)
    {
        $query = Poliza::with(['producto']);
        if ($request->filled('fecha_inicio')) $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        if ($request->filled('fecha_fin'))    $query->whereDate('fecha_emision', '<=', $request->fecha_fin);

        $policies = $query->get();
        $grouped = $policies->groupBy('producto_id');
        $rows = collect();
        $tPol = 0; $tPri = 0; $tRc = 0; $tCan = 0; $tBs = 0;

        foreach ($grouped as $prodId => $pols) {
            $prod = $pols->first()->producto;
            $p = $pols->count(); $pr = (float)$pols->sum('total');
            $rc = $pols->filter(fn($x) => $prod?->tipo === 'rcv')->count();
            $ca = $pols->filter(fn($x) => $x->estatus === 'ANULADA')->count();
            $bs = (float)$pols->sum('total_bs');
            $rows->push(['ramo'=>$prod?->nombre??'Sin Ramo','pol'=>$p,'prima'=>$pr,'rc'=>$rc,'can'=>$ca,'bs2'=>$bs]);
            $tPol+=$p; $tPri+=$pr; $tRc+=$rc; $tCan+=$ca; $tBs+=$bs;
        }
        if ($tPol > 0) $rows->push(['ramo'=>'TOTAL','pol'=>$tPol,'prima'=>$tPri,'rc'=>$tRc,'can'=>$tCan,'bs2'=>$tBs]);

        return (new SuperintendenciaExport($rows))->download('reporte_superintendencia_' . now()->format('Ymd_His') . '.xlsx');
    }

    /**
     * Exporta el reporte de oficinas a Excel.
     */
    public function exportOficinas(Request $request)
    {
        $query = Poliza::with(['vendedor']);
        if ($request->filled('fecha_inicio')) $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        if ($request->filled('fecha_fin'))    $query->whereDate('fecha_emision', '<=', $request->fecha_fin);

        $policies = $query->get();
        $totalPrem = (float)$policies->sum('total');
        $grouped = $policies->groupBy(fn($p) => $p->vendedor?->sede ?? 'Sede Central');
        $rows = collect();
        $tAg = 0; $tPol = 0; $tPri = 0;

        foreach ($grouped as $sede => $pols) {
            $ag = count($pols->pluck('vendedor_id')->unique()->filter()->toArray());
            $po = $pols->count(); $pr = (float)$pols->sum('total');
            $pct = $totalPrem > 0 ? round(($pr/$totalPrem)*100,1).'%' : '0%';
            $rows->push(['ofi'=>$sede,'ag'=>$ag,'pol'=>$po,'prima'=>$pr,'pct'=>$pct,'est'=>'Activa']);
            $tAg+=$ag; $tPol+=$po; $tPri+=$pr;
        }
        if ($tPol > 0) $rows->push(['ofi'=>'TOTAL','ag'=>$tAg,'pol'=>$tPol,'prima'=>$tPri,'pct'=>'100%','est'=>'']);

        return (new OficinasExport($rows))->download('reporte_oficinas_' . now()->format('Ymd_His') . '.xlsx');
    }

    /**
     * Exporta el reporte de personal a Excel.
     */
    public function exportPersonal(Request $request)
    {
        $query = Poliza::with(['vendedor']);
        if ($request->filled('fecha_inicio')) $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        if ($request->filled('fecha_fin'))    $query->whereDate('fecha_emision', '<=', $request->fecha_fin);

        $policies = $query->get();
        $grouped = $policies->groupBy('vendedor_id');
        $rows = collect();

        foreach ($grouped as $vid => $pols) {
            $v = $pols->first()->vendedor;
            if (!$v) continue;
            $pr = (float)$pols->sum('total');
            $t = strtolower($v->cargo) === 'agente' ? 0.10 : 0.05;
            $rows->push(['nom'=>$v->nombre,'rol'=>$v->cargo,'ofi'=>$v->sede,'pol'=>$pols->count(),'prima'=>$pr,'com'=>(float)($pr*$t),'est'=>$v->activo?'Activo':'Inactivo']);
        }

        $ids = array_keys($grouped->toArray());
        foreach (Usuario::whereNotIn('id', $ids)->whereIn('cargo', ['Agente','Supervisor'])->get() as $ov) {
            $rows->push(['nom'=>$ov->nombre,'rol'=>$ov->cargo,'ofi'=>$ov->sede,'pol'=>'—','prima'=>'—','com'=>'—','est'=>$ov->activo?'Activo':'Inactivo']);
        }

        return (new PersonalExport($rows))->download('reporte_personal_' . now()->format('Ymd_His') . '.xlsx');
    }

    /**
     * Obtiene programaciones de reportes automáticos internos.
     */
    public function getInternalSchedules()
    {
        $schedules = DB::table('reportes_internos_programaciones')->get();
        return response()->json($schedules);
    }

    /**
     * Guarda la configuración de las programaciones internas.
     */
    public function saveInternalSchedules(Request $request)
    {
        $request->validate([
            'schedules' => 'required|array',
            'schedules.*.id' => 'required|integer|exists:reportes_internos_programaciones,id',
            'schedules.*.activo' => 'required|boolean',
            'schedules.*.hora' => 'required|string',
        ]);

        foreach ($request->schedules as $sched) {
            DB::table('reportes_internos_programaciones')
                ->where('id', $sched['id'])
                ->update([
                    'activo' => $sched['activo'],
                    'hora' => $sched['hora'],
                    'updated_at' => now(),
                ]);
        }

        return response()->json(['message' => 'Configuración guardada correctamente']);
    }

    /**
     * Obtiene historial de reportes internos generados.
     */
    public function getInternalHistory()
    {
        $history = DB::table('reportes_internos_historial')
            ->orderBy('fecha_generacion', 'desc')
            ->get();
        return response()->json($history);
    }

    /**
     * Ejecuta manualmente un reporte interno y genera un archivo simulado.
     */
    public function runInternalSchedule(Request $request)
    {
        $request->validate([
            'schedule_id' => 'required|integer|exists:reportes_internos_programaciones,id',
        ]);

        $schedule = DB::table('reportes_internos_programaciones')->where('id', $request->schedule_id)->first();

        $filename = 'reporte_interno_' . strtolower(str_replace(' ', '_', $schedule->nombre)) . '_' . now()->format('Ymd_His') . '.xlsx';
        $directory = 'reportes_internos';
        if (!Storage::disk('public')->exists($directory)) {
            Storage::disk('public')->makeDirectory($directory);
        }
        
        $path = $directory . '/' . $filename;

        $fechaInicio = now();
        if ($schedule->frecuencia === 'diario') {
            $fechaInicio = now()->subDay();
        } elseif ($schedule->frecuencia === 'semanal') {
            $fechaInicio = now()->subWeek();
        } elseif ($schedule->frecuencia === 'quincenal') {
            $fechaInicio = now()->subDays(15);
        } else {
            $fechaInicio = now()->subMonth();
        }

        $headers = [];
        $rows = collect();

        if ($schedule->id == 1 || $schedule->id == 2) {
            // Reporte de Ventas
            $headers = ['Fecha Emisión', 'Póliza', 'Agente', 'Producto', 'Prima (USD)', 'Prima (Bs)', 'Estado'];
            $policies = Poliza::with(['vendedor', 'producto'])
                ->whereBetween('fecha_emision', [$fechaInicio->toDateString(), now()->toDateString()])
                ->get();
            foreach ($policies as $p) {
                $rows->push([
                    $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '',
                    $p->nro_contrato,
                    $p->vendedor?->nombre ?? '',
                    $p->producto?->nombre ?? '',
                    (float)$p->total,
                    (float)$p->total_bs,
                    $p->status
                ]);
            }
        } elseif ($schedule->id == 3) {
            // Superintendencia / SUDEASEG
            $headers = ['Ramo', 'Pólizas', 'Prima USD', 'RC Obligatoria', 'Canceladas', 'Prima Bs'];
            $policies = Poliza::with(['producto'])
                ->whereBetween('fecha_emision', [$fechaInicio->toDateString(), now()->toDateString()])
                ->get();
            $grouped = $policies->groupBy('producto_id');
            foreach ($grouped as $prodId => $pols) {
                $prod = $pols->first()->producto;
                $rows->push([
                    $prod?->nombre ?? 'Sin Ramo',
                    $pols->count(),
                    (float)$pols->sum('total'),
                    $pols->filter(fn($p) => $prod?->tipo === 'rcv')->count(),
                    $pols->filter(fn($p) => $p->status === 'ANULADA')->count(),
                    (float)$pols->sum('total_bs')
                ]);
            }
        } elseif ($schedule->id == 4) {
            // Próximas a vencer
            $headers = ['Póliza', 'Cliente', 'Cédula', 'Teléfono', 'Fecha Emisión', 'Fecha Vencimiento', 'Estado'];
            $policies = Poliza::with(['solicitud.cliente.persona'])
                ->whereBetween('fecha_vencimiento', [now()->toDateString(), now()->addDays(30)->toDateString()])
                ->get();
            foreach ($policies as $p) {
                $pers = $p->solicitud?->cliente?->persona;
                $rows->push([
                    $p->nro_contrato,
                    $pers?->nombre ?? '',
                    $pers?->cedula ?? '',
                    $pers?->celular ?? $pers?->telefono ?? '',
                    $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '',
                    $p->fecha_vencimiento ? $p->fecha_vencimiento->format('d/m/Y') : '',
                    $p->status
                ]);
            }
        } elseif ($schedule->id == 5) {
            // Reporte de comisiones
            $headers = ['Beneficiario', 'Rol', 'Pólizas', 'Base (USD)', 'Tasa', 'Comisión (USD)', 'Estado'];
            $policies = Poliza::with(['vendedor'])
                ->whereBetween('fecha_emision', [$fechaInicio->toDateString(), now()->toDateString()])
                ->get();
            $grouped = $policies->groupBy('vendedor_id');
            foreach ($grouped as $vendedorId => $pols) {
                $vendedor = $pols->first()->vendedor;
                if (!$vendedor) continue;
                $base = $pols->sum('total');
                $tasa = strtolower($vendedor->cargo) === 'agente' ? 0.10 : 0.05;
                $comisionVal = $base * $tasa;
                $rows->push([
                    $vendedor->nombre,
                    $vendedor->cargo,
                    $pols->count(),
                    (float)$base,
                    ($tasa * 100) . '%',
                    (float)$comisionVal,
                    'Pendiente'
                ]);
            }
        } else {
            // Reporte de cobranza pendiente
            $headers = ['Póliza', 'Cliente', 'Fecha Emisión', 'Total USD', 'Pago', 'Estado'];
            $policies = Poliza::with(['solicitud.cliente.persona'])
                ->whereBetween('fecha_emision', [$fechaInicio->toDateString(), now()->toDateString()])
                ->get();
            foreach ($policies as $p) {
                $rows->push([
                    $p->nro_contrato,
                    $p->solicitud?->cliente?->persona?->nombre ?? '',
                    $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '',
                    (float)$p->total,
                    $p->pago,
                    $p->status
                ]);
            }
        }

        $export = new InternalReportExport($headers, $rows, $schedule->nombre);
        $export->store($path, 'public');
        $size = Storage::disk('public')->size($path);

        DB::table('reportes_internos_historial')->insert([
            'nombre_reporte' => $schedule->nombre,
            'fecha_generacion' => now(),
            'archivo_path' => $path,
            'size' => $size,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('reportes_internos_programaciones')
            ->where('id', $schedule->id)
            ->update(['ultimo_envio' => now()]);

        return response()->json(['message' => 'Reporte interno ejecutado con éxito']);
    }

    /**
     * Descarga un archivo de reporte interno del historial.
     */
    public function downloadInternalReport($id)
    {
        $report = DB::table('reportes_internos_historial')->where('id', $id)->first();
        if (!$report || !Storage::disk('public')->exists($report->archivo_path)) {
            return response()->json(['error' => 'Archivo no encontrado'], 404);
        }

        $fullPath = Storage::disk('public')->path($report->archivo_path);
        
        if (ob_get_length()) {
            ob_end_clean();
        }

        return response()->download($fullPath, basename($report->archivo_path), [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]);
    }

    /**
     * Obtiene el reporte de desempeño y métricas de los usuarios (vendedores).
     */
    public function getUsuariosReport(Request $request)
    {
        $user = auth()->user();
        if ($user && (str_starts_with($user->tipo, 'Vendedor') || $user->tipo === 'Vendedor')) {
            $request->merge(['usuario_id' => $user->id]);
        }

        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
            'usuario_id'   => 'nullable|integer|exists:usuarios,id',
            'search'       => 'nullable|string|max:100',
        ]);

        $fechaInicio = $request->filled('fecha_inicio') ? $request->fecha_inicio : now()->startOfMonth()->toDateString();
        $fechaFin = $request->filled('fecha_fin') ? $request->fecha_fin : now()->toDateString();

        if ($request->filled('usuario_id')) {
            $usuario = Usuario::findOrFail($request->usuario_id);
            $policiesQuery = Poliza::with(['producto', 'solicitud.cliente.persona'])
                ->where('vendedor_id', $usuario->id)
                ->whereBetween('fecha_emision', [$fechaInicio, $fechaFin])
                ->orderBy('fecha_emision', 'desc');

            $policies = $policiesQuery->get();

            $totalPremium = (float)$policies->sum('total');
            $totalPremiumBs = (float)$policies->sum('total_bs');
            $tasa = strtolower($usuario->cargo) === 'agente' ? 0.10 : 0.05;
            $commission = $totalPremium * $tasa;

            $stats = [
                'total_polizas' => $policies->count(),
                'total_prima' => $totalPremium,
                'total_prima_bs' => $totalPremiumBs,
                'comision_estimada' => $commission,
                'polizas_activas' => $policies->where('status', 'ACTIVA')->count(),
                'polizas_anuladas' => $policies->where('status', 'ANULADA')->count(),
            ];

            $polizasData = $policies->map(function($p) {
                return [
                    'id' => $p->id,
                    'fecha_emision' => $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '—',
                    'fecha_vencimiento' => $p->fecha_vencimiento ? $p->fecha_vencimiento->format('d/m/Y') : '—',
                    'nro_contrato' => $p->nro_contrato,
                    'cliente_nombre' => $p->solicitud?->cliente?->persona?->nombre ?? $p->asegurado_nombre ?? '—',
                    'producto_nombre' => $p->producto?->nombre ?? '—',
                    'total' => (float)$p->total,
                    'status' => $p->status,
                ];
            });

            return response()->json([
                'usuario' => [
                    'id' => $usuario->id,
                    'nombre' => $usuario->nombre,
                    'nick' => $usuario->nick,
                    'cargo' => $usuario->cargo,
                    'sede' => $usuario->sede,
                    'activo' => $usuario->activo,
                ],
                'stats' => $stats,
                'polizas' => $polizasData,
            ]);
        }

        // Listado de usuarios vendedores con KPIs agregados
        $vendedoresQuery = Usuario::whereIn('cargo', ['Agente', 'Supervisor'])
            ->orWhereExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('poliza')
                    ->whereColumn('poliza.vendedor_id', 'usuarios.id');
            });

        if ($request->filled('search')) {
            $search = $request->search;
            $vendedoresQuery->where(function($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('nick', 'like', "%{$search}%")
                  ->orWhere('cargo', 'like', "%{$search}%");
            });
        }

        $vendedores = $vendedoresQuery->get();

        $rows = $vendedores->map(function($v) use ($fechaInicio, $fechaFin) {
            $policies = Poliza::where('vendedor_id', $v->id)
                ->whereBetween('fecha_emision', [$fechaInicio, $fechaFin])
                ->get();

            $totalPremium = (float)$policies->sum('total');
            $tasa = strtolower($v->cargo) === 'agente' ? 0.10 : 0.05;
            $commission = $totalPremium * $tasa;

            return [
                'id' => $v->id,
                'nom' => $v->nombre,
                'rol' => $v->cargo,
                'ofi' => $v->sede ?? 'Sede Central',
                'pol' => $policies->count(),
                'prima' => $totalPremium,
                'com' => $commission,
                'est' => $v->activo ? 'Activo' : 'Inactivo',
            ];
        });

        return response()->json($rows);
    }

    /**
     * Obtiene el reporte y métricas de clientes.
     */
    public function getClientesReport(Request $request)
    {
        $request->validate([
            'fecha_inicio'   => 'nullable|date',
            'fecha_fin'      => 'nullable|date|after_or_equal:fecha_inicio',
            'cliente_id'     => 'nullable|integer|exists:cliente,id',
            'search'         => 'nullable|string|max:100',
            'filtro'         => 'nullable|string|in:por_vencer,mas_polizas,por_vehiculos,activos,bloqueados',
            'marca'          => 'nullable|string|max:100',
            'modelo'         => 'nullable|string|max:100',
            'min_vehiculos'  => 'nullable|integer|min:0',
            'max_vehiculos'  => 'nullable|integer|min:0',
            'estado_poliza'  => 'nullable|string|in:ACTIVA,VENCIDA,ANULADA',
            'min_prima'      => 'nullable|numeric|min:0',
            'max_prima'      => 'nullable|numeric|min:0',
        ]);

        $fechaInicio = $request->filled('fecha_inicio') ? $request->fecha_inicio : now()->startOfMonth()->toDateString();
        $fechaFin = $request->filled('fecha_fin') ? $request->fecha_fin : now()->toDateString();

        // ── Detalle de un cliente específico ─────────────────────────
        if ($request->filled('cliente_id')) {
            $cliente = Cliente::with('persona')->findOrFail($request->cliente_id);
            $vehiculos = Vehiculo::with('modeloVehiculo')->where('cliente_id', $cliente->id)->get();
            
            // Pólizas asociadas mediante solicitudes del cliente
            $policies = Poliza::with(['producto', 'solicitud'])
                ->whereHas('solicitud', function($q) use ($cliente) {
                    $q->where('cliente_id', $cliente->id);
                })
                ->orderBy('fecha_emision', 'desc')
                ->get();

            return response()->json([
                'cliente' => [
                    'id' => $cliente->id,
                    'nombre' => $cliente->persona?->nombre ?? '—',
                    'cedula' => $cliente->persona?->cedula ?? '—',
                    'correo' => $cliente->persona?->correo ?? '—',
                    'telefono' => $cliente->persona?->telefono ?? '—',
                    'celular' => $cliente->persona?->celular ?? '—',
                    'direccion' => $cliente->persona?->direccion ?? '—',
                    'estado' => $cliente->persona?->estado ?? '—',
                    'ciudad' => $cliente->persona?->ciudad ?? '—',
                    'fecha_creacion' => $cliente->persona?->fecha_creacion ? $cliente->persona->fecha_creacion->format('d/m/Y H:i') : '—',
                    'activo' => $cliente->activo,
                ],
                'vehiculos' => $vehiculos->map(function($v) {
                    return [
                        'id' => $v->id,
                        'placa' => $v->placa,
                        'marca' => $v->modeloVehiculo?->marca ?? '—',
                        'modelo' => $v->modeloVehiculo?->modelo ?? '—',
                        'anio' => $v->anio ?? '—',
                        'color' => $v->color ?? '—',
                        'uso' => $v->uso ?? '—',
                        'tipo' => $v->tipo ?? '—',
                        'serial_carroceria' => $v->serial_carroceria ?? '—',
                        'serial_motor' => $v->serial_motor ?? '—',
                    ];
                }),
                'polizas' => $policies->map(function($p) {
                    return [
                        'id' => $p->id,
                        'nro_contrato' => $p->nro_contrato,
                        'fecha_emision' => $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '—',
                        'fecha_vencimiento' => $p->fecha_vencimiento ? $p->fecha_vencimiento->format('d/m/Y') : '—',
                        'producto' => $p->producto?->nombre ?? '—',
                        'total' => (float)$p->total,
                        'status' => $p->estatus,
                    ];
                })
            ]);
        }

        // ── Estadísticas agregadas ──────────────────────────────────
        $nuevosClientes = Cliente::whereHas('persona', function($q) use ($fechaInicio, $fechaFin) {
            $q->whereBetween('fecha_creacion', [$fechaInicio . ' 00:00:00', $fechaFin . ' 23:59:59']);
        })->count();

        $totalClientes = Cliente::count();

        $clientesActivos = Cliente::whereHas('solicitudes.polizas', function($q) {
            $q->where('status', 'ACTIVA');
        })->count();

        $totalPolizas = Poliza::whereBetween('fecha_emision', [$fechaInicio, $fechaFin])->count();

        // Contar pólizas próximas a vencer (30 días)
        $polizasPorVencer = Poliza::where('status', 'ACTIVA')
            ->whereBetween('fecha_vencimiento', [now()->toDateString(), now()->addDays(30)->toDateString()])
            ->count();

        $stats = [
            'nuevos_clientes'   => $nuevosClientes,
            'total_clientes'    => $totalClientes,
            'clientes_activos'  => $clientesActivos,
            'total_polizas'     => $totalPolizas,
            'polizas_por_vencer' => $polizasPorVencer,
        ];

        // ── Opciones dinámicas para filtros (marcas/modelos) ────────
        $marcas = DB::table('modelo_vehiculo')
            ->select('marca')
            ->distinct()
            ->whereNotNull('marca')
            ->orderBy('marca')
            ->pluck('marca')
            ->all();

        $modelosQuery = DB::table('modelo_vehiculo')
            ->select('marca', 'modelo')
            ->whereNotNull('modelo')
            ->orderBy('modelo');
        if ($request->filled('marca')) {
            $modelosQuery->where('marca', $request->marca);
        }
        $modelos = $modelosQuery->get()->groupBy('marca')->map(fn($group) => $group->pluck('modelo')->all())->all();

        $filtros_opciones = [
            'marcas'  => $marcas,
            'modelos' => $modelos,
        ];

        // ── Listado de clientes con filtros ─────────────────────────
        $clientesQuery = Cliente::with(['persona', 'vehiculos.modeloVehiculo', 'solicitudes.polizas']);

        // Búsqueda por texto
        if ($request->filled('search')) {
            $search = $request->search;
            $clientesQuery->whereHas('persona', function($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('cedula', 'like', "%{$search}%")
                  ->orWhere('correo', 'like', "%{$search}%")
                  ->orWhere('telefono', 'like', "%{$search}%")
                  ->orWhere('celular', 'like', "%{$search}%");
            });
        }

        // Filtro por estado del cliente (activos/bloqueados)
        $filtro = $request->input('filtro');
        if ($filtro === 'activos') {
            $clientesQuery->where('activo', true);
        } elseif ($filtro === 'bloqueados') {
            $clientesQuery->where('activo', false);
        } elseif ($filtro === 'por_vencer') {
            // Solo clientes que tienen al menos una póliza activa próxima a vencer
            $clientesQuery->whereHas('solicitudes.polizas', function($q) {
                $q->where('status', 'ACTIVA')
                  ->whereBetween('fecha_vencimiento', [now()->toDateString(), now()->addDays(30)->toDateString()]);
            });
        }

        // Filtro por marca de vehículo
        if ($request->filled('marca')) {
            $clientesQuery->whereHas('vehiculos.modeloVehiculo', function($q) use ($request) {
                $q->where('marca', $request->marca);
            });
        }

        // Filtro por modelo de vehículo
        if ($request->filled('modelo')) {
            $clientesQuery->whereHas('vehiculos.modeloVehiculo', function($q) use ($request) {
                $q->where('modelo', $request->modelo);
            });
        }

        // Filtro por estado de póliza
        if ($request->filled('estado_poliza')) {
            $clientesQuery->whereHas('solicitudes.polizas', function($q) use ($request) {
                $q->where('status', $request->estado_poliza);
            });
        }

        $clientes = $clientesQuery->get();

        // ── Mapear datos completos por cliente ──────────────────────
        $rows = $clientes->map(function($c) {
            $polizas = $c->solicitudes->flatMap->polizas;
            $vehiculos = $c->vehiculos;
            $polizasActivas = $polizas->where('status', 'ACTIVA');

            // Próximo vencimiento: la póliza activa con la fecha más cercana a vencer
            $proxVenc = $polizasActivas
                ->filter(fn($p) => $p->fecha_vencimiento !== null)
                ->sortBy('fecha_vencimiento')
                ->first();
            $proxVencFecha = $proxVenc?->fecha_vencimiento ? $proxVenc->fecha_vencimiento->format('d/m/Y') : '—';
            // Para ordenamiento en frontend (ISO string)
            $proxVencSort = $proxVenc?->fecha_vencimiento ? $proxVenc->fecha_vencimiento->toDateString() : '9999-12-31';

            // Marcas de los vehículos del cliente (para mostrar)
            $marcasCliente = $vehiculos->map(fn($v) => $v->modeloVehiculo?->marca)->filter()->unique()->values()->implode(', ');

            // Dirección compuesta
            $dir = collect([
                $c->persona?->direccion,
                $c->persona?->ciudad,
                $c->persona?->estado
            ])->filter()->implode(', ');

            return [
                'id'        => $c->id,
                'ced'       => $c->persona?->cedula ?? '—',
                'nom'       => $c->persona?->nombre ?? '—',
                'cor'       => $c->persona?->correo ?? '—',
                'tel'       => $c->persona?->celular ?? $c->persona?->telefono ?? '—',
                'dir'       => $dir ?: '—',
                'reg'       => $c->persona?->fecha_creacion ? $c->persona->fecha_creacion->format('d/m/Y') : '—',
                'veh'       => $vehiculos->count(),
                'marcas'    => $marcasCliente ?: '—',
                'pol'       => $polizas->count(),
                'pol_act'   => $polizasActivas->count(),
                'prox_venc' => $proxVencFecha,
                'prox_venc_sort' => $proxVencSort,
                'prima'     => (float)$polizas->sum('total'),
                'est'       => $c->activo ? 'Activo' : 'Bloqueado',
            ];
        });

        // ── Filtros post-query (basados en conteos calculados) ──────
        // Filtro por rango de vehículos
        if ($request->filled('min_vehiculos')) {
            $rows = $rows->filter(fn($r) => $r['veh'] >= (int)$request->min_vehiculos);
        }
        if ($request->filled('max_vehiculos')) {
            $rows = $rows->filter(fn($r) => $r['veh'] <= (int)$request->max_vehiculos);
        }

        // Filtro por rango de prima
        if ($request->filled('min_prima')) {
            $rows = $rows->filter(fn($r) => $r['prima'] >= (float)$request->min_prima);
        }
        if ($request->filled('max_prima')) {
            $rows = $rows->filter(fn($r) => $r['prima'] <= (float)$request->max_prima);
        }

        // ── Ordenamiento por filtro rápido ──────────────────────────
        if ($filtro === 'por_vencer') {
            $rows = $rows->sortBy('prox_venc_sort')->values();
        } elseif ($filtro === 'mas_polizas') {
            $rows = $rows->sortByDesc('pol')->values();
        } elseif ($filtro === 'por_vehiculos') {
            $rows = $rows->sortByDesc('veh')->values();
        } else {
            $rows = $rows->values();
        }

        return response()->json([
            'stats'            => $stats,
            'clientes'         => $rows,
            'filtros_opciones' => $filtros_opciones,
        ]);
    }

    /**
     * Obtiene el reporte y métricas de vehículos.
     */
    public function getVehiculosReport(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
            'placa'        => 'nullable|string|max:20',
            'search'       => 'nullable|string|max:100',
        ]);

        $fechaInicio = $request->filled('fecha_inicio') ? $request->fecha_inicio : now()->startOfMonth()->toDateString();
        $fechaFin = $request->filled('fecha_fin') ? $request->fecha_fin : now()->toDateString();

        if ($request->filled('placa')) {
            $vehiculo = Vehiculo::with(['modeloVehiculo', 'cliente.persona'])->where('placa', $request->placa)->firstOrFail();
            
            // Historial de solicitudes/pólizas para la placa
            $policies = Poliza::with(['producto', 'solicitud.vendedor'])
                ->whereHas('solicitud', function($q) use ($vehiculo) {
                    $q->where('placa', $vehiculo->placa);
                })
                ->orderBy('fecha_emision', 'desc')
                ->get();

            return response()->json([
                'vehiculo' => [
                    'id' => $vehiculo->id,
                    'placa' => $vehiculo->placa,
                    'marca' => $vehiculo->modeloVehiculo?->marca ?? '—',
                    'modelo' => $vehiculo->modeloVehiculo?->modelo ?? '—',
                    'anio' => $vehiculo->anio ?? '—',
                    'color' => $vehiculo->color ?? '—',
                    'uso' => $vehiculo->uso ?? '—',
                    'tipo' => $vehiculo->tipo ?? '—',
                    'serial_carroceria' => $vehiculo->serial_carroceria ?? '—',
                    'serial_motor' => $vehiculo->serial_motor ?? '—',
                ],
                'propietario' => [
                    'id' => $vehiculo->cliente?->id,
                    'nombre' => $vehiculo->cliente?->persona?->nombre ?? '—',
                    'cedula' => $vehiculo->cliente?->persona?->cedula ?? '—',
                ],
                'historial' => $policies->map(function($p) {
                    return [
                        'id' => $p->id,
                        'nro_contrato' => $p->nro_contrato,
                        'fecha_emision' => $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '—',
                        'fecha_vencimiento' => $p->fecha_vencimiento ? $p->fecha_vencimiento->format('d/m/Y') : '—',
                        'producto' => $p->producto?->nombre ?? '—',
                        'vendedor' => $p->solicitud?->vendedor?->nombre ?? '—',
                        'total' => (float)$p->total,
                        'status' => $p->status,
                    ];
                })
            ]);
        }

        // Estadísticas agregadas
        // Vehículos con pólizas emitidas en el período
        $vehiculosAsegurados = Poliza::whereBetween('fecha_emision', [$fechaInicio, $fechaFin])
            ->whereHas('solicitud', function($q) {
                $q->whereNotNull('placa');
            })
            ->get()
            ->pluck('solicitud.placa')
            ->unique()
            ->count();

        // Vehículos asegurados en los últimos 7 días
        $aseguradosEstaSemana = Poliza::whereBetween('fecha_emision', [now()->subDays(7)->toDateString(), now()->toDateString()])
            ->whereHas('solicitud', function($q) {
                $q->whereNotNull('placa');
            })
            ->get()
            ->pluck('solicitud.placa')
            ->unique()
            ->count();

        // Distribución por Tipo y Uso de todos los vehículos
        $distribucionTipo = DB::table('vehiculo')
            ->select('tipo', DB::raw('count(*) as total'))
            ->groupBy('tipo')
            ->get()
            ->pluck('total', 'tipo')
            ->all();

        $distribucionUso = DB::table('vehiculo')
            ->select('uso', DB::raw('count(*) as total'))
            ->groupBy('uso')
            ->get()
            ->pluck('total', 'uso')
            ->all();

        $stats = [
            'vehiculos_asegurados_periodo' => $vehiculosAsegurados,
            'asegurados_esta_semana' => $aseguradosEstaSemana,
            'distribucion_tipo' => $distribucionTipo,
            'distribucion_uso' => $distribucionUso,
        ];

        // Listado general de vehículos
        $vehiculosQuery = Vehiculo::with(['modeloVehiculo', 'cliente.persona', 'solicitudes.polizas']);

        if ($request->filled('search')) {
            $search = $request->search;
            $vehiculosQuery->where(function($q) use ($search) {
                $q->where('placa', 'like', "%{$search}%")
                  ->orWhere('color', 'like', "%{$search}%")
                  ->orWhereHas('modeloVehiculo', function($mq) use ($search) {
                      $mq->where('marca', 'like', "%{$search}%")
                        ->orWhere('modelo', 'like', "%{$search}%");
                  })
                  ->orWhereHas('cliente.persona', function($pq) use ($search) {
                      $pq->where('nombre', 'like', "%{$search}%");
                  });
            });
        }

        $vehiculos = $vehiculosQuery->get();

        $rows = $vehiculos->map(function($v) {
            // Un vehículo está activo si tiene alguna póliza activa
            $polizas = $v->solicitudes->flatMap->polizas;
            $seguroActivo = $polizas->where('status', 'ACTIVA')->isNotEmpty();
            $ultimaPoliza = $polizas->sortByDesc('fecha_emision')->first();

            return [
                'id' => $v->id,
                'pla' => $v->placa,
                'mar' => $v->modeloVehiculo?->marca ?? '—',
                'mod' => $v->modeloVehiculo?->modelo ?? '—',
                'ani' => $v->anio ?? '—',
                'col' => $v->color ?? '—',
                'pro' => $v->cliente?->persona?->nombre ?? '—',
                'est' => $seguroActivo ? 'Asegurado' : 'Sin Seguro',
                'pol' => $ultimaPoliza?->nro_contrato ?? '—',
            ];
        });

        return response()->json([
            'stats' => $stats,
            'vehiculos' => $rows
        ]);
    }

    private function parseCiAndRif($ci)
    {
        $ci = trim(str_replace([' ', '.', ','], '', $ci));
        if (preg_match('/^([VEJGVEJ])[-_]?(\d+)$/i', $ci, $matches)) {
            return [
                'nacionalidad' => strtoupper($matches[1]),
                'numero' => $matches[2]
            ];
        }
        return [
            'nacionalidad' => 'V',
            'numero' => preg_replace('/\D/', '', $ci)
        ];
    }

    /**
     * Separa el nombre completo en primer nombre, segundo nombre, primer apellido y segundo apellido.
     */
    private function splitNameHelper($fullName)
    {
        $parts = array_values(array_filter(explode(' ', trim(preg_replace('/\s+/', ' ', $fullName)))));
        $count = count($parts);
        
        $primerNombre = '';
        $segundoNombre = '';
        $primerApellido = '';
        $segundoApellido = '';
        
        if ($count === 1) {
            $primerNombre = $parts[0];
        } elseif ($count === 2) {
            $primerNombre = $parts[0];
            $primerApellido = $parts[1];
        } elseif ($count === 3) {
            $primerNombre = $parts[0];
            $primerApellido = $parts[1];
            $segundoApellido = $parts[2];
        } elseif ($count >= 4) {
            $primerNombre = $parts[0];
            $segundoNombre = $parts[1];
            $primerApellido = $parts[2];
            $segundoApellido = implode(' ', array_slice($parts, 3));
        }
        
        return [
            'primer_nombre' => $primerNombre,
            'segundo_nombre' => $segundoNombre,
            'primer_apellido' => $primerApellido,
            'segundo_apellido' => $segundoApellido,
        ];
    }
}
