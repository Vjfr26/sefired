<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CambioClienteMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $nombre,
        public array  $cambios,        // ['Campo' => ['anterior' => X, 'nuevo' => Y]]
        public bool   $esCambioCorreo = false,
    ) {}

    public function envelope(): Envelope
    {
        $asunto = $this->esCambioCorreo
            ? 'Aviso: cambio de correo electrónico en su cuenta | La Venezolana de Seguros y Vida'
            : 'Actualización de datos en su expediente | La Venezolana de Seguros y Vida';

        return new Envelope(subject: $asunto);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.cambio-cliente',
            with: [
                'accentColor'   => '#ea580c',
                'badgeColor'    => $this->esCambioCorreo ? '#dc2626' : '#f97316',
                'badgeText'     => $this->esCambioCorreo ? 'Cambio de Correo' : 'Datos Actualizados',
                'logoUrl'       => url('logo-sinfondo.png'),
                'nombre'        => $this->nombre,
                'cambios'       => $this->cambios,
                'esCambioCorreo'=> $this->esCambioCorreo,
                'fechaCambio'   => now()->format('d/m/Y H:i'),
            ],
        );
    }
}
