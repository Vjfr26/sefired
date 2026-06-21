<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

/**
 * Envía un reporte ya generado (Excel) como adjunto a un destinatario
 * configurado en una programación de reportes externos o internos.
 */
class ReporteAdjuntoMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param array<int, array{path: string, nombre: string, mime?: ?string}> $adjuntosExtra
     *        Documentos adicionales a incluir junto al reporte: archivos
     *        sueltos subidos para esta programación y/o documentos ya
     *        existentes de un cliente (cliente_documentos).
     */
    public function __construct(
        public string $nombreReporte,
        public string $archivoPath,
        public string $archivoNombre,
        public string $frecuencia,
        public array $adjuntosExtra = [],
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->nombreReporte . ' — J&M Seguros',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.reporte-adjunto',
            with: [
                'accentColor'    => '#001463',
                'badgeColor'     => '#6366f1',
                'badgeText'      => 'Reporte Automático',
                'logoUrl'        => url('logo-sinfondo.png'),
                'nombreReporte'  => $this->nombreReporte,
                'frecuencia'     => $this->frecuencia,
                'fecha'          => now()->format('d/m/Y H:i'),
            ],
        );
    }

    public function attachments(): array
    {
        $attachments = [
            Attachment::fromData(
                fn() => Storage::disk('public')->get($this->archivoPath),
                $this->archivoNombre,
            )->withMime('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        ];

        foreach ($this->adjuntosExtra as $extra) {
            if (!Storage::disk('public')->exists($extra['path'])) {
                continue;
            }
            $attachment = Attachment::fromData(
                fn() => Storage::disk('public')->get($extra['path']),
                $extra['nombre'],
            );
            if (!empty($extra['mime'])) {
                $attachment = $attachment->withMime($extra['mime']);
            }
            $attachments[] = $attachment;
        }

        return $attachments;
    }
}
