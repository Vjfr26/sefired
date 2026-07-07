<?php

namespace App\Console\Commands;

use App\Mail\RenovacionReminderMail;
use App\Models\EmailLog;
use App\Models\Poliza;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * Bloquea automáticamente las pólizas ACTIVAS cuya fecha_vencimiento ya
 * pasó, pasándolas a status='VENCIDA'. Antes nada hacía esta transición —
 * una póliza vencida se quedaba en ACTIVA para siempre en la base de datos
 * (solo se veía "vencida" si alguien miraba la fecha a mano), y por eso el
 * hito "-1 día" de SendRenovacionReminders (que solo busca pólizas con
 * status='VENCIDA') nunca encontraba nada y jamás se disparaba.
 *
 * Debe correr ANTES de correos:renovacion en el scheduler para que ese
 * comando ya no necesite el hito "ya venció" — este lo cubre directamente,
 * notificando en el mismo paso en que hace el cambio de estado.
 */
class MarcarPolizasVencidas extends Command
{
    protected $signature   = 'polizas:marcar-vencidas';
    protected $description = 'Pasa a VENCIDA las pólizas activas cuya fecha de vencimiento ya pasó y notifica al cliente';

    public function handle(): void
    {
        $polizas = Poliza::where('status', 'ACTIVA')
            ->whereDate('fecha_vencimiento', '<', now()->toDateString())
            ->with('solicitud.persona')
            ->get();

        $procesadas = 0;

        foreach ($polizas as $poliza) {
            $poliza->update(['status' => 'VENCIDA']);
            $procesadas++;

            // La cotización pasa a 'vencida' solo si esta es su póliza más
            // reciente — si ya fue renovada (hay una póliza posterior), la
            // solicitud sigue reflejando la vigente.
            $sol = $poliza->solicitud;
            if ($sol && $sol->status === 'emitida'
                && !Poliza::where('solicitud_id', $sol->id)->where('id', '>', $poliza->id)->exists()) {
                $sol->update(['status' => 'vencida']);
            }

            $correo = $poliza->solicitud?->persona?->correo;
            if (!$correo) continue;

            $diasVencida = (int) now()->diffInDays($poliza->fecha_vencimiento, false);

            try {
                Mail::to($correo)->send(new RenovacionReminderMail($poliza, $diasVencida));
                EmailLog::registrar(
                    tipo: 'poliza_vencida_bloqueada',
                    destinatario: $correo,
                    asunto: 'Póliza vencida',
                    personaId: $poliza->solicitud?->persona?->id,
                    polizaId: $poliza->id,
                );
            } catch (\Throwable $e) {
                EmailLog::registrar(
                    tipo: 'poliza_vencida_bloqueada',
                    destinatario: $correo,
                    asunto: 'Error',
                    personaId: $poliza->solicitud?->persona?->id,
                    polizaId: $poliza->id,
                    status: 'error',
                    errorMsg: $e->getMessage(),
                );
            }
        }

        $this->info("Pólizas marcadas como VENCIDA: {$procesadas}");
    }
}
