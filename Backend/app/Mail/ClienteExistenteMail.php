<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ClienteExistenteMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $nombre,
        public bool $tienePoliza,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->tienePoliza
                ? 'Ya cuentas con una póliza activa — La Venezolana de Seguros y Vida'
                : 'Ya estás en nuestro sistema — La Venezolana de Seguros y Vida',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.cliente-existente',
            with: [
                'accentColor'  => '#001463',
                'badgeColor'   => '#0ea5e9',
                'badgeText'    => 'Cliente Existente',
                'logoUrl'      => url('logo-sinfondo.png'),
                'nombre'       => $this->nombre,
                'tienePoliza'  => $this->tienePoliza,
            ],
        );
    }
}
