<?php

namespace App\Mail;

use App\Models\Poliza;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PolizaRenovadaMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Poliza $polizaNueva,
        public Poliza $polizaAnterior,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Póliza renovada — ' . $this->polizaNueva->nro_contrato . ' | J&M Seguros',
        );
    }

    public function content(): Content
    {
        $snap   = $this->polizaNueva->snapshot_datos ?? [];
        $nombre = $snap['tomador']['nombre']
               ?? $this->polizaNueva->asegurado_nombre
               ?? $this->polizaNueva->solicitud?->persona?->nombre
               ?? '—';

        $bienRef = $snap['bien']['atributos']['placa']
                ?? $snap['bien']['descripcion']
                ?? $this->polizaNueva->solicitud?->bien?->atributos['placa']
                ?? '—';

        return new Content(
            view: 'emails.poliza-renovada',
            with: [
                'accentColor'      => '#0ea5e9',
                'badgeColor'       => '#0ea5e9',
                'badgeText'        => 'Póliza Renovada',
                'tomadorNombre'    => $nombre,
                'nroNuevo'         => $this->polizaNueva->nro_contrato,
                'nroAnterior'      => $this->polizaAnterior->nro_contrato,
                'bienRef'          => $bienRef,
                'producto'         => $this->polizaNueva->producto?->nombre ?? '—',
                'fechaEmision'     => $this->polizaNueva->fecha_emision->format('d/m/Y'),
                'fechaVencimiento' => $this->polizaNueva->fecha_vencimiento->format('d/m/Y'),
                'prima'            => number_format((float) $this->polizaNueva->total, 2),
            ],
        );
    }
}
