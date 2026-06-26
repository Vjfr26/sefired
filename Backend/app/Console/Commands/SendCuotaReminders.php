<?php

namespace App\Console\Commands;

use App\Mail\CuotaReminderMail;
use App\Models\Cuota;
use App\Models\EmailLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * Recordatorios de cobro de cuotas mensuales: avisa 7/5/3/1 días antes del
 * vencimiento de cada cuota pendiente, y marca como VENCIDA (notificando una
 * sola vez) las cuotas impagas cuya fecha ya pasó.
 *
 * Solo actúa sobre cuotas de pólizas ACTIVA/VENCIDA (no ANULADA/RENOVADA).
 */
class SendCuotaReminders extends Command
{
    protected $signature   = 'correos:cuotas';
    protected $description  = 'Recordatorios de cuotas mensuales (7/5/3/1 días antes) y aviso de cuota vencida';

    private const HITOS = [7, 5, 3, 1];

    public function handle(): void
    {
        $hoy = now()->toDateString();

        // 1) Cuotas impagas ya vencidas → marcar VENCIDA y avisar una vez.
        $vencidas = Cuota::whereIn('status', ['PENDIENTE', 'PARCIAL'])
            ->whereDate('fecha_vencimiento', '<', $hoy)
            ->with('poliza.solicitud.persona')
            ->get();

        foreach ($vencidas as $cuota) {
            $cuota->update(['status' => 'VENCIDA']);
            if (!in_array($cuota->poliza?->status, ['ACTIVA', 'VENCIDA'], true)) {
                continue;
            }
            $correo = $cuota->poliza?->solicitud?->persona?->correo;
            if ($correo) {
                $this->enviar($cuota, 0, 'cuota_vencida', $correo);
            }
        }

        // 2) Recordatorios por vencer en los hitos configurados.
        foreach (self::HITOS as $dias) {
            $fecha = now()->addDays($dias)->toDateString();
            $cuotas = Cuota::whereIn('status', ['PENDIENTE', 'PARCIAL'])
                ->whereDate('fecha_vencimiento', $fecha)
                ->whereHas('poliza', fn($q) => $q->whereIn('status', ['ACTIVA', 'VENCIDA']))
                ->with('poliza.solicitud.persona')
                ->get();

            foreach ($cuotas as $cuota) {
                $correo = $cuota->poliza?->solicitud?->persona?->correo;
                if ($correo) {
                    $this->enviar($cuota, $dias, 'cuota_reminder_' . $dias . 'd', $correo);
                }
            }
        }

        $this->info('Recordatorios de cuotas procesados para ' . $hoy);
    }

    private function enviar(Cuota $cuota, int $dias, string $tipo, string $correo): void
    {
        try {
            Mail::to($correo)->send(new CuotaReminderMail($cuota, $dias));
            EmailLog::registrar(
                tipo: $tipo,
                destinatario: $correo,
                asunto: $dias <= 0 ? 'Cuota vencida' : "Cuota vence en {$dias} días",
                personaId: $cuota->poliza?->solicitud?->persona_id,
                polizaId: $cuota->poliza_id,
            );
        } catch (\Throwable $e) {
            EmailLog::registrar(
                tipo: $tipo,
                destinatario: $correo,
                asunto: 'Error',
                personaId: $cuota->poliza?->solicitud?->persona_id,
                polizaId: $cuota->poliza_id,
                status: 'error',
                errorMsg: $e->getMessage(),
            );
        }
    }
}
