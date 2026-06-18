<?php

namespace App\Mail;

use App\Models\SolicitudContacto;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** Correo de confirmación enviado al cliente que pidió ser contactado desde el chatbot. */
class SolicitudContactoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public SolicitudContacto $solicitud) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Recibimos tu solicitud de contacto | J&M Seguros',
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
            view: 'emails.contacto-cliente',
            with: [
                'accentColor'  => '#4c1d95',
                'badgeColor'   => '#7c3aed',
                'badgeText'    => 'Solicitud de contacto',
                'logoUrl'      => url('logo-sinfondo.png'),
                'motivoLabel'  => $motivoLabels[$this->solicitud->motivo] ?? $this->solicitud->motivo,
                'esTecnico'    => $this->solicitud->destino === 'tecnico',
                'fecha'        => $this->solicitud->created_at?->format('d/m/Y H:i') ?? now()->format('d/m/Y H:i'),
            ],
        );
    }
}
