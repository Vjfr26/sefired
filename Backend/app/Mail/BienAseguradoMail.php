<?php

namespace App\Mail;

use App\Models\BienAsegurado;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BienAseguradoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public BienAsegurado $bien,
        public string        $accion,   // 'registrado' | 'actualizado' | 'eliminado'
        public string        $nombre,   // nombre del titular
    ) {}

    public function envelope(): Envelope
    {
        $label = match ($this->accion) {
            'registrado'  => 'Bien asegurado registrado',
            'actualizado' => 'Datos de bien asegurado actualizados',
            'eliminado'   => 'Bien asegurado eliminado',
            default       => 'Notificación de bien asegurado',
        };

        return new Envelope(subject: $label . ' — La Venezolana de Seguros y Vida');
    }

    public function content(): Content
    {
        $attrs = $this->bien->atributos ?? [];
        $ref   = match ($this->bien->tipo) {
            'vehiculo'  => implode(' · ', array_filter([$attrs['placa'] ?? null, $attrs['marca'] ?? null, $attrs['modelo'] ?? null, $attrs['anio'] ?? null])),
            'inmueble'  => $attrs['descripcion'] ?? $this->bien->descripcion ?? '—',
            default     => $this->bien->descripcion ?? '—',
        };

        $icon = match ($this->accion) {
            'registrado'  => '🛡️',
            'actualizado' => '✏️',
            'eliminado'   => '🗑️',
            default       => 'ℹ️',
        };

        $color = match ($this->accion) {
            'registrado'  => '#059669',
            'actualizado' => '#ea580c',
            'eliminado'   => '#dc2626',
            default       => '#001463',
        };

        return new Content(
            view: 'emails.bien-asegurado',
            with: [
                'accentColor' => $color,
                'badgeColor'  => $color,
                'badgeText'   => ucfirst("Bien {$this->accion}"),
                'nombre'      => $this->nombre,
                'accion'      => $this->accion,
                'tipo'        => ucfirst($this->bien->tipo ?? 'bien'),
                'referencia'  => $ref ?: '—',
                'icon'        => $icon,
                'fecha'       => now()->format('d/m/Y H:i'),
            ],
        );
    }
}
