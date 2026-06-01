<?php

namespace App\Console\Commands;

use App\Mail\ReporteInternoMail;
use App\Models\EmailLog;
use App\Models\Factura;
use App\Models\Persona;
use App\Models\Poliza;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendReporteInterno extends Command
{
    protected $signature   = 'correos:reporte-interno';
    protected $description = 'Envía el reporte interno semanal a los administradores';

    public function handle(): void
    {
        $desde = now()->subWeek()->startOfWeek()->toDateString();
        $hasta = now()->subWeek()->endOfWeek()->toDateString();

        $stats = [
            'semanaDesde'      => date('d/m/Y', strtotime($desde)),
            'semanaHasta'      => date('d/m/Y', strtotime($hasta)),
            'polizasEmitidas'  => Poliza::whereBetween('fecha_emision', [$desde, $hasta])->count(),
            'facturasEmitidas' => Factura::whereBetween('fecha_factura', [$desde, $hasta])->count(),
            'clientesNuevos'   => Persona::whereBetween('fecha_creacion', [$desde . ' 00:00:00', $hasta . ' 23:59:59'])->count(),
            'primaTotalUsd'    => number_format(Poliza::whereBetween('fecha_emision', [$desde, $hasta])->sum('total'), 2),
            'primaTotalBs'     => number_format(Poliza::whereBetween('fecha_emision', [$desde, $hasta])->sum('total_bs'), 2),
            'polizasPorVencer' => Poliza::where('status', 'ACTIVA')->whereBetween('fecha_vencimiento', [now()->toDateString(), now()->addDays(30)->toDateString()])->count(),
            'polizasVencidas'  => Poliza::where('status', 'VENCIDA')->count(),
        ];

        $destinatarios = config('mail.reporte_interno_destinatarios',
            [env('MAIL_FROM_ADDRESS')]);

        foreach ((array) $destinatarios as $email) {
            try {
                Mail::to($email)->send(new ReporteInternoMail($stats));
                EmailLog::registrar(tipo: 'reporte_interno', destinatario: $email, asunto: 'Reporte semanal');
            } catch (\Throwable $e) {
                EmailLog::registrar(tipo: 'reporte_interno', destinatario: $email, asunto: 'Error', status: 'error', errorMsg: $e->getMessage());
            }
        }

        $this->info('Reporte interno enviado.');
    }
}
