<?php

namespace App\Mail;

use App\Models\SolicitudContacto;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** Notificación interna al asesor/técnico cuando un cliente pide ser contactado desde el chatbot. */
class SolicitudContactoInternaMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public SolicitudContacto $solicitud) {}

    public function envelope(): Envelope
    {
        $tipo = $this->solicitud->destino === 'tecnico' ? 'Soporte técnico' : 'Asesor';

        return new Envelope(
            subject: "Nueva solicitud de contacto ({$tipo}) | J&M Seguros",
        );
    }

    public function content(): Content
    {
        $motivoLabels = [
            'cotizar'   => 'Cotizar un seguro nuevo',
            'poliza'    => 'Consultar sobre mi póliza',
            'siniestro' => 'Reportar un siniestro',
            'tecnico'   => 'Problema técnico con el sitio',
        ];

        return new Content(
            view: 'emails.contacto-interno',
            with: [
                'accentColor'  => '#0f172a',
                'badgeColor'   => '#334155',
                'badgeText'    => 'Notificación interna',
                'logoUrl'      => url('logo-sinfondo.png'),
                'email'        => $this->solicitud->email,
                'motivoLabel'  => $motivoLabels[$this->solicitud->motivo] ?? $this->solicitud->motivo,
                'destinoLabel' => $this->solicitud->destino === 'tecnico' ? 'Soporte técnico' : 'Asesor comercial',
                'fecha'        => $this->solicitud->created_at?->format('d/m/Y H:i') ?? now()->format('d/m/Y H:i'),
                'ip'           => $this->solicitud->ip,
            ],
        );
    }
}
