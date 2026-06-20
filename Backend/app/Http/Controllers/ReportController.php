<?php

namespace App\Http\Controllers;

use App\Mail\ReporteAdjuntoMail;
use App\Models\EmailLog;
use App\Models\Log;
use App\Models\Usuario;
use App\Models\Persona;
use App\Models\BienAsegurado;
use App\Models\Poliza;
use App\Models\ReporteExternoProgramacion;
use App\Models\ReporteInternoProgramacion;
use App\Models\Solicitud;
use App\Models\UnderwritingEvaluacion;
use App\Rules\NoInjectionChars;
use App\Services\ReporteGeneratorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use App\Exports\ExternalReportExport;
use App\Exports\VentasExport;
use App\Exports\OficinasExport;
use App\Exports\PersonalExport;
use App\Exports\InternalReportExport;

class ReportController extends Controller
{
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

        $query = Log::with('usuario:id,nombre')->orderBy('created_at', 'desc');

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

        $policies = $query->get()->map(function ($p) {
            $sol  = $p->solicitud;
            $bien = $sol?->bien;
            $attr = $bien?->atributos ?? [];
            $marca    = $attr['marca'] ?? '—';
            $modelo   = $attr['modelo'] ?? '—';
            $anio     = $attr['anio'] ?? '—';
            $vehiculo = $marca !== '—' ? "{$marca} {$modelo} ({$anio})" : '—';
            $placa    = $bien?->placa_idx ?? $attr['placa'] ?? '—';

            $inicio = $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '—';
            $fin    = $p->fecha_vencimiento ? $p->fecha_vencimiento->format('d/m/Y') : '—';

            return [
                'id'                => $p->id,
                'nro_contrato'      => $p->nro_contrato,
                'tomador'           => $sol?->nombre_tomador ?? $sol?->persona?->nombre ?? '—',
                'ci_tomador'        => $sol?->ci_tomador ?? $sol?->persona?->cedula ?? '—',
                'vehiculo'          => $vehiculo,
                'placa'             => $placa,
                'fecha_emision'     => $inicio,
                'fecha_vencimiento' => $fin,
                'vigencia'          => "{$inicio} - {$fin}",
                'total'             => (float) $p->total,
                'producto'          => $p->producto?->nombre ?? '—',
            ];
        });

        return response()->json($policies);
    }

    public function exportExternalReport(Request $request)
    {
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
        $filename = 'reporte_externo_' . now()->format('Ymd_His') . '.xlsx';
        return (new ExternalReportExport($policies))->download($filename);
    }

    public function getExternalReportSchedules()
    {
        return response()->json(
            ReporteExternoProgramacion::with('destinatarios')->orderBy('id')->get()
        );
    }

    public function saveExternalReportSchedules(Request $request)
    {
        $request->validate([
            'schedules'                          => 'array',
            'schedules.*.nombre'                 => 'required|string|max:100',
            'schedules.*.hora'                    => 'required|string',
            'schedules.*.destinatarios.*.email'      => 'required|email|max:150',
            'schedules.*.destinatarios.*.frecuencia' => 'required|string|in:diario,semanal,mensual,trimestral',
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
        $archivo = $generator->generarExterno();
        $scheduleId = $request->input('schedule_id');
        $schedule   = $scheduleId ? ReporteExternoProgramacion::find($scheduleId) : null;

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
        if (!Storage::disk('public')->exists($record->archivo_path)) {
            return response()->json(['error' => 'Archivo no disponible en servidor'], 404);
        }
        return Storage::disk('public')->download($record->archivo_path);
    }

    /**
     * Crea/actualiza/elimina las programaciones y sus destinatarios a partir
     * del arreglo completo enviado por el frontend (reemplaza al antiguo
     * TRUNCATE + reinsert, que borraba los destinatarios en cada guardado).
     */
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

            $modelClass::whereNotIn('id', $incomingIds)->delete();
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
        $enviados = 0;
        foreach ($schedule->destinatarios()->where('activo', true)->get() as $destinatario) {
            try {
                Mail::to($destinatario->email)->send(
                    new ReporteAdjuntoMail($schedule->nombre, $archivo['path'], $archivo['filename'], $destinatario->frecuencia)
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

    // ── VENTAS Y COMISIONES ───────────────────────────────────────────────────────

    public function getVentasComisiones(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
        ]);

        $query = Poliza::with(['vendedor', 'producto']);

        $user = auth()->user();
        if ($user && str_starts_with((string) $user->tipo, 'Vendedor')) {
            $query->where('vendedor_id', $user->id);
        }

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_emision', '<=', $request->fecha_fin);
        }

        $policies = $query->orderBy('fecha_emision', 'desc')->get();

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

        $comisiones = [];
        foreach ($policies->groupBy('vendedor_id') as $vendedorId => $pols) {
            $vendedor = $pols->first()->vendedor;
            if (!$vendedor) continue;
            $base  = (float) $pols->sum('total');
            $tasa  = strtolower($vendedor->cargo) === 'agente' ? 0.10 : 0.05;
            $comisiones[] = [
                'id'   => $vendedor->id,
                'ben'  => $vendedor->nombre,
                'rol'  => $vendedor->cargo,
                'pol'  => $pols->count(),
                'base' => $base,
                'tasa' => ($tasa * 100) . '%',
                'com'  => round($base * $tasa, 2),
                'est'  => 'Pendiente',
            ];
        }

        return response()->json(['ventas' => $ventas, 'comisiones' => $comisiones]);
    }

    public function exportVentas(Request $request)
    {
        $query = Poliza::with(['vendedor', 'producto']);
        $user = auth()->user();
        if ($user && str_starts_with((string) $user->tipo, 'Vendedor')) {
            $query->where('vendedor_id', $user->id);
        }
        if ($request->filled('fecha_inicio')) $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        if ($request->filled('fecha_fin'))    $query->whereDate('fecha_emision', '<=', $request->fecha_fin);

        return (new VentasExport($query->orderBy('fecha_emision', 'desc')->get()))
            ->download('reporte_ventas_' . now()->format('Ymd_His') . '.xlsx');
    }

    // ── OFICINAS ─────────────────────────────────────────────────────────────────

    public function getOficinas(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
        ]);

        $query = Poliza::with(['vendedor']);
        if ($request->filled('fecha_inicio')) $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        if ($request->filled('fecha_fin'))    $query->whereDate('fecha_emision', '<=', $request->fecha_fin);

        $policies     = $query->get();
        $totalPremium = (float) $policies->sum('total');
        $rows = [];
        $tAg = 0; $tPol = 0; $tPri = 0;

        foreach ($policies->groupBy(fn ($p) => $p->vendedor?->sede ?? 'Sede Central') as $sede => $pols) {
            $ag  = count($pols->pluck('vendedor_id')->unique()->filter()->toArray());
            $po  = $pols->count();
            $pr  = (float) $pols->sum('total');
            $pct = $totalPremium > 0 ? round(($pr / $totalPremium) * 100, 1) . '%' : '0%';

            $rows[] = ['ofi' => $sede, 'ag' => $ag, 'pol' => $po, 'prima' => $pr, 'pct' => $pct, 'est' => 'Activa'];
            $tAg += $ag; $tPol += $po; $tPri += $pr;
        }

        if ($tPol > 0) {
            $rows[] = ['ofi' => 'TOTAL', 'ag' => $tAg, 'pol' => $tPol, 'prima' => $tPri, 'pct' => '100%', 'est' => ''];
        }

        return response()->json($rows);
    }

    public function exportOficinas(Request $request)
    {
        $query = Poliza::with(['vendedor']);
        if ($request->filled('fecha_inicio')) $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        if ($request->filled('fecha_fin'))    $query->whereDate('fecha_emision', '<=', $request->fecha_fin);

        $policies  = $query->get();
        $totalPrem = (float) $policies->sum('total');
        $rows = collect();
        $tAg = 0; $tPol = 0; $tPri = 0;

        foreach ($policies->groupBy(fn ($p) => $p->vendedor?->sede ?? 'Sede Central') as $sede => $pols) {
            $ag  = count($pols->pluck('vendedor_id')->unique()->filter()->toArray());
            $po  = $pols->count();
            $pr  = (float) $pols->sum('total');
            $pct = $totalPrem > 0 ? round(($pr / $totalPrem) * 100, 1) . '%' : '0%';
            $rows->push(['ofi' => $sede, 'ag' => $ag, 'pol' => $po, 'prima' => $pr, 'pct' => $pct, 'est' => 'Activa']);
            $tAg += $ag; $tPol += $po; $tPri += $pr;
        }
        if ($tPol > 0) {
            $rows->push(['ofi' => 'TOTAL', 'ag' => $tAg, 'pol' => $tPol, 'prima' => $tPri, 'pct' => '100%', 'est' => '']);
        }

        return (new OficinasExport($rows))
            ->download('reporte_oficinas_' . now()->format('Ymd_His') . '.xlsx');
    }

    // ── PERSONAL ─────────────────────────────────────────────────────────────────

    public function getPersonal(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
        ]);

        $query = Poliza::with(['vendedor']);
        if ($request->filled('fecha_inicio')) $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        if ($request->filled('fecha_fin'))    $query->whereDate('fecha_emision', '<=', $request->fecha_fin);

        $policies = $query->get();
        $grouped  = $policies->groupBy('vendedor_id');
        $rows     = [];

        foreach ($grouped as $vendedorId => $pols) {
            $vendedor = $pols->first()->vendedor;
            if (!$vendedor) continue;
            $pr   = (float) $pols->sum('total');
            $tasa = strtolower($vendedor->cargo) === 'agente' ? 0.10 : 0.05;
            $rows[] = ['nom' => $vendedor->nombre, 'rol' => $vendedor->cargo, 'ofi' => $vendedor->sede, 'pol' => $pols->count(), 'prima' => $pr, 'com' => round($pr * $tasa, 2), 'est' => $vendedor->activo ? 'Activo' : 'Inactivo'];
        }

        $ids = array_keys($grouped->toArray());
        foreach (Usuario::whereNotIn('id', $ids)->whereIn('cargo', ['Agente', 'Supervisor'])->get() as $ov) {
            $rows[] = ['nom' => $ov->nombre, 'rol' => $ov->cargo, 'ofi' => $ov->sede, 'pol' => '—', 'prima' => '—', 'com' => '—', 'est' => $ov->activo ? 'Activo' : 'Inactivo'];
        }

        return response()->json($rows);
    }

    public function exportPersonal(Request $request)
    {
        $query = Poliza::with(['vendedor']);
        if ($request->filled('fecha_inicio')) $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        if ($request->filled('fecha_fin'))    $query->whereDate('fecha_emision', '<=', $request->fecha_fin);

        $policies = $query->get();
        $grouped  = $policies->groupBy('vendedor_id');
        $rows     = collect();

        foreach ($grouped as $vid => $pols) {
            $v = $pols->first()->vendedor;
            if (!$v) continue;
            $pr   = (float) $pols->sum('total');
            $tasa = strtolower($v->cargo) === 'agente' ? 0.10 : 0.05;
            $rows->push(['nom' => $v->nombre, 'rol' => $v->cargo, 'ofi' => $v->sede, 'pol' => $pols->count(), 'prima' => $pr, 'com' => round($pr * $tasa, 2), 'est' => $v->activo ? 'Activo' : 'Inactivo']);
        }

        $ids = array_keys($grouped->toArray());
        foreach (Usuario::whereNotIn('id', $ids)->whereIn('cargo', ['Agente', 'Supervisor'])->get() as $ov) {
            $rows->push(['nom' => $ov->nombre, 'rol' => $ov->cargo, 'ofi' => $ov->sede, 'pol' => '—', 'prima' => '—', 'com' => '—', 'est' => $ov->activo ? 'Activo' : 'Inactivo']);
        }

        return (new PersonalExport($rows))
            ->download('reporte_personal_' . now()->format('Ymd_His') . '.xlsx');
    }

    // ── PROGRAMACIONES INTERNAS ───────────────────────────────────────────────────

    public function getInternalSchedules()
    {
        return response()->json(
            ReporteInternoProgramacion::with('destinatarios')->orderBy('id')->get()
        );
    }

    public function saveInternalSchedules(Request $request)
    {
        $request->validate([
            'schedules'                              => 'array',
            'schedules.*.nombre'                     => 'required|string|max:100',
            'schedules.*.hora'                        => 'required|string',
            'schedules.*.destinatarios.*.email'      => 'required|email|max:150',
            'schedules.*.destinatarios.*.frecuencia' => 'required|string|in:diario,semanal,mensual,trimestral',
        ]);

        $this->upsertProgramaciones($request->input('schedules', []), ReporteInternoProgramacion::class);

        return response()->json(['message' => 'OK']);
    }

    public function getInternalHistory()
    {
        return response()->json(
            DB::table('reportes_internos_historial')
                ->orderBy('fecha_generacion', 'desc')
                ->get()
        );
    }

    public function runInternalSchedule(Request $request, ReporteGeneratorService $generator)
    {
        $archivo = $generator->generarInterno();
        $scheduleId = $request->input('schedule_id');
        $schedule   = $scheduleId ? ReporteInternoProgramacion::find($scheduleId) : null;

        $nombre = $schedule ? $schedule->nombre : 'Reporte Interno';
        $id = DB::table('reportes_internos_historial')->insertGetId([
            'nombre_reporte'   => $nombre . ' — ' . now()->format('d/m/Y H:i'),
            'fecha_generacion' => now(),
            'archivo_path'     => $archivo['path'],
            'size'             => $archivo['size'],
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $enviados = $schedule
            ? $this->enviarADestinatarios($schedule, $archivo, 'reporte_interno')
            : 0;

        return response()->json(['message' => 'OK', 'id' => $id, 'enviados' => $enviados]);
    }

    public function downloadInternalReport($id)
    {
        $record = DB::table('reportes_internos_historial')->find($id);
        if (!$record) {
            return response()->json(['error' => 'Archivo no encontrado'], 404);
        }
        if (!Storage::disk('public')->exists($record->archivo_path)) {
            return response()->json(['error' => 'Archivo no disponible en servidor'], 404);
        }
        return Storage::disk('public')->download($record->archivo_path);
    }

    // ── REPORTE DE USUARIOS ───────────────────────────────────────────────────────

    public function getUsuariosReport(Request $request)
    {
        $user = auth()->user();
        if ($user && str_starts_with((string) $user->tipo, 'Vendedor')) {
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
            $policies = Poliza::with(['producto', 'solicitud.persona'])
                ->where('vendedor_id', $usuario->id)
                ->whereBetween('fecha_emision', [$fechaInicio, $fechaFin])
                ->orderBy('fecha_emision', 'desc')
                ->get();

            $totalPremium = (float) $policies->sum('total');
            $tasa         = strtolower($usuario->cargo) === 'agente' ? 0.10 : 0.05;

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
                    'total_polizas'     => $policies->count(),
                    'total_prima'       => $totalPremium,
                    'total_prima_bs'    => (float) $policies->sum('total_bs'),
                    'comision_estimada' => round($totalPremium * $tasa, 2),
                    'polizas_activas'   => $policies->where('status', 'ACTIVA')->count(),
                    'polizas_anuladas'  => $policies->where('status', 'ANULADA')->count(),
                ],
                'polizas' => $policies->map(function ($p) {
                    return [
                        'id'                 => $p->id,
                        'fecha_emision'      => $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '—',
                        'fecha_vencimiento'  => $p->fecha_vencimiento ? $p->fecha_vencimiento->format('d/m/Y') : '—',
                        'nro_contrato'       => $p->nro_contrato,
                        'cliente_nombre'     => $p->solicitud?->persona?->nombre ?? $p->asegurado_nombre ?? '—',
                        'producto_nombre'    => $p->producto?->nombre ?? '—',
                        'total'              => (float) $p->total,
                        'status'             => $p->status,
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
            $policies     = Poliza::where('vendedor_id', $v->id)->whereBetween('fecha_emision', [$fechaInicio, $fechaFin])->get();
            $totalPremium = (float) $policies->sum('total');
            $tasa         = strtolower($v->cargo) === 'agente' ? 0.10 : 0.05;
            return [
                'id'    => $v->id,
                'nom'   => $v->nombre,
                'rol'   => $v->cargo,
                'ofi'   => $v->sede ?? 'Sede Central',
                'pol'   => $policies->count(),
                'prima' => $totalPremium,
                'com'   => round($totalPremium * $tasa, 2),
                'est'   => $v->activo ? 'Activo' : 'Inactivo',
            ];
        });

        return response()->json($rows);
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
            'filtro'         => 'nullable|string|in:por_vencer,mas_polizas,por_vehiculos,activos,bloqueados',
            'marca'          => ['nullable', 'string', 'max:100', $noInjection],
            'modelo'         => ['nullable', 'string', 'max:100', $noInjection],
            'min_vehiculos'  => 'nullable|integer|min:0',
            'max_vehiculos'  => 'nullable|integer|min:0',
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
                        'total'             => (float) $p->total,
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

        // ── Opciones para filtros (marcas/modelos desde atributos JSON) ───────────
        $marcas = BienAsegurado::where('tipo', 'vehiculo')
            ->selectRaw("DISTINCT JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.marca')) as marca")
            ->whereRaw("JSON_EXTRACT(atributos, '$.marca') IS NOT NULL")
            ->orderBy('marca')
            ->pluck('marca')
            ->filter()
            ->values()
            ->all();

        $modelosRaw = BienAsegurado::where('tipo', 'vehiculo')
            ->selectRaw("JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.marca')) as marca, JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.modelo')) as modelo")
            ->whereRaw("JSON_EXTRACT(atributos, '$.modelo') IS NOT NULL")
            ->get();

        $modelos = $modelosRaw
            ->groupBy('marca')
            ->map(fn ($g) => $g->pluck('modelo')->unique()->filter()->sort()->values()->all())
            ->all();

        $filtros_opciones = ['marcas' => $marcas, 'modelos' => $modelos];

        // ── Listado con filtros ───────────────────────────────────────────────────
        $clientesQuery = Persona::with([
            'bienes'  => fn ($q) => $q->where('tipo', 'vehiculo'),
            'solicitudes.polizas',
        ]);

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

        if ($request->filled('marca')) {
            $clientesQuery->whereHas('bienes', function ($q) use ($request) {
                $q->where('tipo', 'vehiculo')
                  ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.marca')) = ?", [$request->marca]);
            });
        }
        if ($request->filled('modelo')) {
            $clientesQuery->whereHas('bienes', function ($q) use ($request) {
                $q->where('tipo', 'vehiculo')
                  ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.modelo')) = ?", [$request->modelo]);
            });
        }
        if ($request->filled('estado_poliza')) {
            $clientesQuery->whereHas('solicitudes.polizas', fn ($q) => $q->where('status', $request->estado_poliza));
        }

        $clientes = $clientesQuery->get();

        $rows = $clientes->map(function ($c) {
            $polizas       = $c->solicitudes->flatMap->polizas;
            $bienes        = $c->bienes; // ya filtrado por tipo='vehiculo' en eager load
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
                'veh'            => $bienes->count(),
                'marcas'         => $marcasCliente ?: '—',
                'pol'            => $polizas->count(),
                'pol_act'        => $polizasActivas->count(),
                'prox_venc'      => $proxVencFecha,
                'prox_venc_sort' => $proxVencSort,
                'prima'          => (float) $polizas->sum('total'),
                'est'            => $c->activo ? 'Activo' : 'Bloqueado',
            ];
        });

        // Filtros post-query sobre conteos calculados
        if ($request->filled('min_vehiculos')) {
            $rows = $rows->filter(fn ($r) => $r['veh'] >= (int) $request->min_vehiculos);
        }
        if ($request->filled('max_vehiculos')) {
            $rows = $rows->filter(fn ($r) => $r['veh'] <= (int) $request->max_vehiculos);
        }
        if ($request->filled('min_prima')) {
            $rows = $rows->filter(fn ($r) => $r['prima'] >= (float) $request->min_prima);
        }
        if ($request->filled('max_prima')) {
            $rows = $rows->filter(fn ($r) => $r['prima'] <= (float) $request->max_prima);
        }

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

    // ── REPORTE DE VEHÍCULOS ──────────────────────────────────────────────────────

    public function getVehiculosReport(Request $request)
    {
        $noInjection = new NoInjectionChars();

        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
            'placa'        => ['nullable', 'string', 'max:20', $noInjection],
            'search'       => ['nullable', 'string', 'max:100', $noInjection],
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
                        'total'             => (float) $p->total,
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

        $rows = $bienesQuery->get()->map(function ($v) {
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
                'pro' => $v->persona?->nombre ?? '—',
                'est' => $activa ? 'Asegurado' : 'Sin Seguro',
                'pol' => $ultima?->nro_contrato ?? '—',
            ];
        });

        return response()->json(['stats' => $stats, 'vehiculos' => $rows]);
    }
}
