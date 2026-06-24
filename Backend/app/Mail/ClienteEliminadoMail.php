<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ClienteEliminadoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $nombre,
        public string $cedula,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Cuenta eliminada | La Venezolana de Seguros y Vida');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.cliente-eliminado',
            with: [
                'accentColor' => '#64748b',
                'badgeColor'  => '#64748b',
                'badgeText'   => 'Cuenta Eliminada',
                'logoUrl'     => url('logo-sinfondo.png'),
                'nombre'      => $this->nombre,
                'cedula'      => $this->cedula,
                'fecha'       => now()->format('d/m/Y H:i'),
            ],
        );
    }
}
