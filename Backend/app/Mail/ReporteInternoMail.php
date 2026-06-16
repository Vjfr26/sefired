<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReporteInternoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public array $stats) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reporte Interno Semanal — ' . now()->format('d/m/Y') . ' | J&M Seguros',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.reporte-interno',
            with: array_merge($this->stats, [
                'accentColor' => '#0f172a',
                'badgeColor'  => '#334155',
                'badgeText'   => 'Reporte Interno',
                'logoUrl'     => url('logo-sinfondo.png'),
            ]),
        );
    }
}
