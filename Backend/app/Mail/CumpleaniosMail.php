<?php

namespace App\Mail;

use App\Models\Persona;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CumpleaniosMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Persona $persona) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: '¡Feliz Cumpleaños! 🎂 LA VENEZOLANA DE SEGUROS Y VIDA C.A.');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.cumpleanios',
            with: [
                'accentColor' => '#db2777',
                'badgeColor'  => '#ec4899',
                'badgeText'   => '¡Feliz Cumpleaños!',
                'logoUrl'     => url('logo-sinfondo.png'),
                'nombre'      => $this->persona->nombre,
            ],
        );
    }
}
