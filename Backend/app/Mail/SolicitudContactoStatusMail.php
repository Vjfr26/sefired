<?php

namespace App\Mail;

use App\Models\SolicitudContacto;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Notifica al cliente cuando su solicitud de contacto (capturada por el
 * chatbot del portal) cambia de estado desde el panel interno:
 *  - atendida   → un asesor la revisó
 *  - reabierta  → pasó de atendida a pendiente otra vez
 *  - pendiente  → vuelve/queda en cola de atención
 */
class SolicitudContactoStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public SolicitudContacto $solicitud,
        public bool $atendida,           // true = atendida; false = pendiente
        public bool $reabierta = false,  // pendiente que venía de "atendido"
    ) {}

    public function envelope(): Envelope
    {
        $asunto = $this->atendida
            ? 'Su solicitud de contacto fue atendida | LA VENEZOLANA DE SEGUROS Y VIDA C.A.'
            : ($this->reabierta
                ? 'Su solicitud de contacto fue reabierta | LA VENEZOLANA DE SEGUROS Y VIDA C.A.'
                : 'Su solicitud de contacto está pendiente | LA VENEZOLANA DE SEGUROS Y VIDA C.A.');

        return new Envelope(subject: $asunto);
    }

    public function content(): Content
    {
        $motivos = [
            'cotizar'   => 'Cotización',
            'poliza'    => 'Póliza',
            'siniestro' => 'Siniestro',
            'tecnico'   => 'Soporte técnico',
        ];

        return new Content(
            view: 'emails.contacto-status',
            with: [
                'atendida'       => $this->atendida,
                'reabierta'      => $this->reabierta,
                'motivo'         => $motivos[$this->solicitud->motivo] ?? ucfirst((string) ($this->solicitud->motivo ?? '—')),
                'fechaSolicitud' => $this->solicitud->created_at?->format('d/m/Y') ?? '—',
                'fecha'          => now()->format('d/m/Y H:i'),
            ],
        );
    }
}
