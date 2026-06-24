<?php

namespace App\Mail;

use App\Models\Solicitud;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CotizacionStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Solicitud $solicitud,
        public string    $nuevoStatus,   // 'aprobado' | 'rechazado'
        public ?string   $observacion = null,
    ) {}

    public function envelope(): Envelope
    {
        $asunto = match ($this->nuevoStatus) {
            'aprobado'  => 'Cotización aprobada — La Venezolana de Seguros y Vida',
            'rechazado' => 'Cotización rechazada — La Venezolana de Seguros y Vida',
            default     => 'Actualización de cotización — La Venezolana de Seguros y Vida',
        };

        return new Envelope(subject: $asunto);
    }

    public function content(): Content
    {
        $snap   = $this->solicitud->snapshot_datos ?? [];
        $nombre = $this->solicitud->persona?->nombre
               ?? $snap['tomador']['nombre']
               ?? $this->solicitud->nombre_tomador
               ?? '—';

        $anno  = $this->solicitud->fecha_solicitud?->format('Y') ?? now()->year;
        $nroCot = 'COT-' . $anno . '-' . str_pad($this->solicitud->id, 5, '0', STR_PAD_LEFT);

        return new Content(
            view: 'emails.cotizacion-status',
            with: [
                'accentColor' => $this->nuevoStatus === 'aprobado' ? '#059669' : '#dc2626',
                'badgeColor'  => $this->nuevoStatus === 'aprobado' ? '#059669' : '#dc2626',
                'badgeText'   => $this->nuevoStatus === 'aprobado' ? 'Cotización Aprobada' : 'Cotización Rechazada',
                'nombre'      => $nombre,
                'nroCot'      => $nroCot,
                'aprobado'    => $this->nuevoStatus === 'aprobado',
                'observacion' => $this->observacion,
                'producto'    => $this->solicitud->producto?->nombre ?? '—',
                'total'       => number_format((float) $this->solicitud->total, 2),
                'fecha'       => now()->format('d/m/Y'),
            ],
        );
    }
}
