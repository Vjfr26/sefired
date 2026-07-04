<?php

namespace App\Console\Commands;

use App\Mail\ReporteAdjuntoMail;
use App\Models\EmailLog;
use App\Models\ReporteExternoProgramacion;
use App\Services\ReporteGeneratorService;
use App\Traits\ResuelveAdjuntosReporte;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

/**
 * Revisa todos los destinatarios activos de "Reportes Externos" y, para cada
 * uno cuya frecuencia individual ya esté cumplida, genera el Excel
 * correspondiente y se lo envía por correo.
 *
 * Se ejecuta cada 15 minutos (ver routes/console.php). El archivo se genera
 * UNA sola vez por programación con destinatarios pendientes (no uno por
 * destinatario) para no recalcular el mismo reporte varias veces.
 */
class SendReportesProgramados extends Command
{
    use ResuelveAdjuntosReporte;

    protected $signature   = 'reportes:enviar-programados';
    protected $description = 'Envía por correo el reporte externo a los destinatarios cuya frecuencia ya se cumplió';

    public function handle(ReporteGeneratorService $generator): void
    {
        $this->procesar(
            ReporteExternoProgramacion::with('destinatarios')->where('activo', true)->get(),
            fn($prog) => $generator->generarExterno($prog->columnas),
            'reportes_externos_historial',
            'reporte_externo',
        );

        $this->info('Revisión de reportes programados completada.');
    }

    /**
     * @param \Illuminate\Support\Collection<int, ReporteExternoProgramacion> $programaciones
     * @param callable(ReporteExternoProgramacion): array{path: string, filename: string, size: int} $generar
     */
    private function procesar($programaciones, callable $generar, string $tablaHistorial, string $tipoEmailLog): void
    {
        foreach ($programaciones as $prog) {
            $pendientes = $prog->destinatarios
                ->filter(fn($d) => $d->activo && $d->estaPendiente($prog->hora));

            if ($pendientes->isEmpty()) {
                continue;
            }

            try {
                $archivo = $generar($prog);
            } catch (\Throwable $e) {
                $this->error("No se pudo generar \"{$prog->nombre}\": {$e->getMessage()}");
                continue;
            }

            DB::table($tablaHistorial)->insert([
                'nombre_reporte'   => $prog->nombre . ' — ' . now()->format('d/m/Y H:i'),
                'fecha_generacion' => now(),
                'archivo_path'     => $archivo['path'],
                'size'             => $archivo['size'],
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);

            $adjuntosExtra = $this->resolverAdjuntosExtra($prog);

            foreach ($pendientes as $destinatario) {
                try {
                    Mail::to($destinatario->email)->send(new ReporteAdjuntoMail(
                        $prog->nombre,
                        $archivo['path'],
                        $archivo['filename'],
                        $destinatario->frecuencia,
                        $adjuntosExtra,
                    ));
                    $destinatario->update(['ultimo_envio' => now()]);
                    EmailLog::registrar(tipo: $tipoEmailLog, destinatario: $destinatario->email, asunto: $prog->nombre);
                } catch (\Throwable $e) {
                    EmailLog::registrar(tipo: $tipoEmailLog, destinatario: $destinatario->email, asunto: $prog->nombre, status: 'error', errorMsg: $e->getMessage());
                }
            }

            $this->info("\"{$prog->nombre}\" enviado a {$pendientes->count()} destinatario(s).");
        }
    }
}
