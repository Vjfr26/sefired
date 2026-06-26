<?php

namespace App\Mail;

use App\Models\Cuota;
use App\Support\Moneda;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Recordatorio de cobro de una cuota mensual (y aviso de cuota vencida).
 */
class CuotaReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Cuota $cuota, public int $diasRestantes) {}

    public function envelope(): Envelope
    {
        $nro = $this->cuota->poliza?->nro_contrato ?? '';
        $asunto = $this->diasRestantes <= 0
            ? "Cuota vencida — póliza {$nro}"
            : 'Recordatorio: su cuota vence en ' . $this->diasRestantes . ' día(s) | LA VENEZOLANA DE SEGUROS Y VIDA C.A.';

        return new Envelope(subject: $asunto);
    }

    public function content(): Content
    {
        $cuota = $this->cuota;
        $pol   = $cuota->poliza;
        $snap  = $pol?->snapshot_datos ?? [];
        $monedaNativa = $pol?->monedaNativa() ?? 'USD';
        $vencida = $this->diasRestantes <= 0;

        return new Content(
            view: 'emails.cuota-reminder',
            with: [
                'accentColor'      => $vencida ? '#dc2626' : '#f59e0b',
                'badgeColor'       => $vencida ? '#dc2626' : '#f59e0b',
                'badgeText'        => $vencida ? 'Cuota Vencida' : 'Recordatorio de Cuota',
                'tomadorNombre'    => $snap['tomador']['nombre'] ?? $pol?->asegurado_nombre ?? '—',
                'nroContrato'      => $pol?->nro_contrato ?? '—',
                'numeroCuota'      => $cuota->numero,
                'montoCuota'       => number_format($cuota->saldo(), 2),
                'fechaVencimiento' => $cuota->fecha_vencimiento?->format('d/m/Y'),
                'monedaNativa'     => $monedaNativa,
                'simboloNativo'    => Moneda::simbolo($monedaNativa),
                'diasRestantes'    => $this->diasRestantes,
            ],
        );
    }
}
