<?php

namespace App\Mail;

use App\Models\Factura;
use App\Support\Moneda;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FacturaMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Factura $factura, public string $clienteNombre) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Recibo ' . $this->factura->numero . ' | J&M Seguros',
        );
    }

    public function content(): Content
    {
        $f = $this->factura;
        $monedaNativa  = $f->poliza?->monedaNativa() ?? 'USD';

        return new Content(
            view: 'emails.factura',
            with: [
                'accentColor'   => '#001463',
                'badgeColor'    => '#6366f1',
                'badgeText'     => 'Recibo de Pago',
                'logoUrl'       => url('logo-sinfondo.png'),
                'clienteNombre' => $this->clienteNombre,
                'nroFactura'    => $f->numero,
                'nroPoliza'     => $f->poliza?->nro_contrato ?? '—',
                'fechaFactura'  => $f->fecha_factura?->format('d/m/Y'),
                'formaPago'     => $f->forma_pago,
                'moneda'        => $f->moneda ?? 'USD',
                'referencia'    => $f->referencia,
                'valorPrincipal' => number_format((float) $f->valor, 2),
                'monedaNativa'  => $monedaNativa,
                'simboloNativo' => Moneda::simbolo($monedaNativa),
            ],
        );
    }
}
