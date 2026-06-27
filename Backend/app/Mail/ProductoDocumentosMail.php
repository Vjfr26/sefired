<?php

namespace App\Mail;

use App\Models\Persona;
use App\Models\Producto;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Envía al cliente los documentos de su tipo de póliza (producto), adjuntos
 * en PDF. Solo se le mandan los documentos que aún no había recibido (el
 * llamador ya filtra los pendientes — ver App\Support\EnvioDocumentosProducto).
 */
class ProductoDocumentosMail extends Mailable
{
    use Queueable, SerializesModels;

    /** @param array<int,array{nombre:string,path:string}> $docs */
    public function __construct(
        public Persona $persona,
        public Producto $producto,
        public array $docs,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Documentos de su póliza ' . $this->producto->nombre . ' | LA VENEZOLANA DE SEGUROS Y VIDA C.A.',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.producto-documentos',
            with: [
                'nombre'   => $this->persona->nombre,
                'producto' => $this->producto->nombre,
                'docs'     => $this->docs,
                'fecha'    => now()->format('d/m/Y'),
            ],
        );
    }

    /** @return array<int,Attachment> */
    public function attachments(): array
    {
        $disk = config('filesystems.docs_disk');

        return collect($this->docs)
            ->filter(fn ($d) => !empty($d['path']))
            ->map(fn ($d) => Attachment::fromStorageDisk($disk, $d['path'])
                ->as((($d['nombre'] ?? 'documento') ?: 'documento') . '.pdf')
                ->withMime('application/pdf'))
            ->values()
            ->all();
    }
}
