<?php

namespace App\Mail;

use App\Models\Persona;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BienvenidaMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Persona $persona) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '¡Bienvenido/a a LA VENEZOLANA DE SEGUROS Y VIDA C.A.!',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.bienvenida',
            with: [
                'accentColor' => '#10b981',
                'badgeColor'  => '#10b981',
                'badgeText'   => 'Nuevo Cliente',
                'logoUrl'     => url('logo-sinfondo.png'),
                'nombre'      => $this->persona->nombre,
                'cedula'      => $this->persona->cedula,
                'clienteId'   => $this->persona->id,
            ],
        );
    }
}
