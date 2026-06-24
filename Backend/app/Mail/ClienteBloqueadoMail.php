<?php

namespace App\Mail;

use App\Models\Persona;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ClienteBloqueadoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Persona $persona,
        public bool    $bloqueado,
        public ?string $motivo = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: ($this->bloqueado ? 'Cuenta suspendida' : 'Cuenta reactivada') . ' | LA VENEZOLANA DE SEGUROS Y VIDA C.A.',
        );
    }

    public function content(): Content
    {
        $accent = $this->bloqueado ? '#dc2626' : '#10b981';

        return new Content(
            view: 'emails.cliente-bloqueado',
            with: [
                'accentColor' => $accent,
                'badgeColor'  => $accent,
                'badgeText'   => $this->bloqueado ? 'Cuenta Suspendida' : 'Cuenta Reactivada',
                'logoUrl'     => url('logo-sinfondo.png'),
                'nombre'      => $this->persona->nombre,
                'bloqueado'   => $this->bloqueado,
                'motivo'      => $this->motivo,
            ],
        );
    }
}
