<?php

namespace App\Mail;

use App\Models\Poliza;
use App\Support\Moneda;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RenovacionReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Poliza $poliza, public int $diasRestantes) {}

    public function envelope(): Envelope
    {
        $asunto = $this->diasRestantes <= 0
            ? 'Su póliza ha vencido — ' . $this->poliza->nro_contrato
            : 'Recordatorio: su póliza vence en ' . $this->diasRestantes . ' día(s) | La Venezolana de Seguros y Vida';

        return new Envelope(subject: $asunto);
    }

    public function content(): Content
    {
        $pol  = $this->poliza;
        $snap = $pol->snapshot_datos ?? [];
        $attrs = $snap['bien']['atributos'] ?? [];

        $badge  = $this->diasRestantes <= 0 ? 'Póliza Vencida' : 'Recordatorio de Renovación';
        $accent = $this->diasRestantes <= 0 ? '#dc2626' : '#f59e0b';
        $monedaNativa = $pol->monedaNativa();

        return new Content(
            view: 'emails.renovacion-reminder',
            with: [
                'accentColor'      => $accent,
                'badgeColor'       => $accent,
                'badgeText'        => $badge,
                'logoUrl'          => url('logo-sinfondo.png'),
                'tomadorNombre'    => $snap['tomador']['nombre'] ?? $pol->asegurado_nombre ?? '—',
                'nroContrato'      => $pol->nro_contrato,
                'producto'         => $snap['producto']['nombre'] ?? $pol->producto?->nombre ?? '—',
                'bienRef'          => $attrs['placa'] ?? $attrs['descripcion'] ?? '—',
                'fechaVencimiento' => $pol->fecha_vencimiento?->format('d/m/Y'),
                'primaPrincipal'   => number_format((float) $pol->total, 2),
                'monedaNativa'     => $monedaNativa,
                'simboloNativo'    => Moneda::simbolo($monedaNativa),
                'diasRestantes'    => $this->diasRestantes,
                'telefonoOficina'  => '04148299562',
            ],
        );
    }
}
