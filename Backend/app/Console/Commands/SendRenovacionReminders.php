<?php

namespace App\Console\Commands;

use App\Mail\RenovacionReminderMail;
use App\Models\EmailLog;
use App\Models\Poliza;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendRenovacionReminders extends Command
{
    protected $signature   = 'correos:renovacion';
    protected $description = 'Envía recordatorios de renovación según los hitos configurados';

    // Días antes del vencimiento en los que se envía recordatorio:
    // 1 semana, 5 días, 3 días y 1 día antes.
    // El aviso de "ya venció" lo manda polizas:marcar-vencidas en el mismo paso
    // en que bloquea la póliza (ver ese comando).
    private const HITOS = [7, 5, 3, 1];

    public function handle(): void
    {
        $hoy = now()->toDateString();

        foreach (self::HITOS as $dias) {
            $fechaObjetivo = now()->addDays($dias)->toDateString();

            $polizas = Poliza::where('status', 'ACTIVA')
                ->whereDate('fecha_vencimiento', $fechaObjetivo)
                ->with('solicitud.persona')
                ->get();

            foreach ($polizas as $poliza) {
                $correo = $poliza->solicitud?->persona?->correo;
                if (!$correo) continue;

                try {
                    Mail::to($correo)->send(new RenovacionReminderMail($poliza, $dias));
                    EmailLog::registrar(
                        tipo: 'renovacion_reminder_' . $dias . 'd',
                        destinatario: $correo,
                        asunto: $dias === 0 ? 'Vence hoy' : "Vence en {$dias} días",
                        personaId: $poliza->solicitud?->persona?->id,
                        polizaId: $poliza->id,
                    );
                } catch (\Throwable $e) {
                    EmailLog::registrar(
                        tipo: 'renovacion_reminder_' . $dias . 'd',
                        destinatario: $correo,
                        asunto: "Error",
                        personaId: $poliza->solicitud?->persona?->id,
                        polizaId: $poliza->id,
                        status: 'error',
                        errorMsg: $e->getMessage(),
                    );
                }
            }
        }

        $this->info('Recordatorios de renovación procesados para ' . $hoy);
    }
}
