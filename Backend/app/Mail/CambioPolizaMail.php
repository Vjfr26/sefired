<?php

namespace App\Mail;

use App\Models\Poliza;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CambioPolizaMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Poliza  $poliza,
        public array   $cambios,       // ['Campo' => ['anterior' => X, 'nuevo' => Y]]
        public string  $modificadoPor,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Actualización en póliza ' . $this->poliza->nro_contrato . ' | J&M Seguros',
        );
    }

    public function content(): Content
    {
        $snap = $this->poliza->snapshot_datos ?? [];

        return new Content(
            view: 'emails.cambio-poliza',
            with: [
                'accentColor'   => '#ea580c',
                'badgeColor'    => '#f97316',
                'badgeText'     => 'Modificación de Póliza',
                'logoUrl'       => url('logo-sinfondo.png'),
                'tomadorNombre' => $snap['tomador']['nombre'] ?? $this->poliza->asegurado_nombre ?? '—',
                'nroContrato'   => $this->poliza->nro_contrato,
                'cambios'       => $this->cambios,
                'modificadoPor' => $this->modificadoPor,
                'fechaCambio'   => now()->format('d/m/Y H:i'),
            ],
        );
    }
}
