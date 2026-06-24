<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DocumentoClienteMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $nombre,
        public string $docNombre,
        public string $accion, // 'subido' | 'eliminado'
    ) {}

    public function envelope(): Envelope
    {
        $asunto = $this->accion === 'subido'
            ? 'Nuevo documento en su expediente | La Venezolana de Seguros y Vida'
            : 'Documento eliminado de su expediente | La Venezolana de Seguros y Vida';

        return new Envelope(subject: $asunto);
    }

    public function content(): Content
    {
        $accent = $this->accion === 'subido' ? '#0ea5e9' : '#f97316';

        return new Content(
            view: 'emails.documento-cliente',
            with: [
                'accentColor' => $accent,
                'badgeColor'  => $accent,
                'badgeText'   => $this->accion === 'subido' ? 'Documento Subido' : 'Documento Eliminado',
                'logoUrl'     => url('logo-sinfondo.png'),
                'nombre'      => $this->nombre,
                'docNombre'   => $this->docNombre,
                'accion'      => $this->accion,
                'fecha'       => now()->format('d/m/Y H:i'),
            ],
        );
    }
}
