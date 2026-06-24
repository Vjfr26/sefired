<?php

namespace App\Mail;

use App\Models\Poliza;
use App\Support\Moneda;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use SimpleSoftwareIO\QrCode\Generator as QrGenerator;

class PolizaEmitidaMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Poliza $poliza)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Póliza Emitida — ' . $this->poliza->nro_contrato . ' | J&M Seguros',
        );
    }

    public function content(): Content
    {
        $pol = $this->poliza;
        $snap = $pol->snapshot_datos ?? [];
        $attrs = $snap['bien']['atributos'] ?? [];
        $persona = $pol->solicitud?->persona;

        $bienRef = $attrs['placa']
            ?? $attrs['descripcion']
            ?? ($snap['bien']['tipo'] ?? '—');

        try {
            $qrUrl = url('/ver/' . urlencode($pol->nro_contrato));
            $qrSvg = app(QrGenerator::class)->format('svg')->size(120)->generate($qrUrl);
            $qrCode = 'data:image/svg+xml;base64,' . base64_encode((string) $qrSvg);
        } catch (\Throwable) {
            $qrCode = null;
        }

        // Si la póliza es de pago mensual, lo que el cliente acaba de pagar es
        // SOLO la primera cuota — mostrar la prima anual completa como si
        // fuera lo pagado era engañoso. Se agrega el desglose real.
        $esMensual = $pol->frecuencia_pago === 'Mensual';
        $recargoPct = $esMensual ? (float) ($pol->producto?->recargo_mensual_pct ?? 0) : 0;
        $cuotaMensual = $esMensual
            ? round(((float) $pol->total / 12) * (1 + $recargoPct / 100), 2)
            : null;
        $proximaCuota = $esMensual ? $pol->fecha_emision?->copy()->addMonth()->format('d/m/Y') : null;

        $monedaNativa = $pol->monedaNativa();
        $simbolo      = Moneda::simbolo($monedaNativa);

        return new Content(
            view: 'emails.poliza-emitida',
            with: [
                'accentColor' => '#001463',
                'badgeColor' => '#0ea5e9',
                'badgeText' => 'Póliza Emitida',
                'logoUrl' => url('logo-sinfondo.png'),
                'tomadorNombre' => $snap['tomador']['nombre'] ?? $persona?->nombre ?? '—',
                'aseguradoNombre' => $snap['asegurado']['nombre'] ?? $persona?->nombre ?? '—',
                'nroContrato'     => $pol->nro_contrato,
                'producto'        => $snap['producto']['nombre'] ?? $pol->producto?->nombre ?? '—',
                'bienRef'         => $bienRef,
                'fechaEmision'    => $pol->fecha_emision?->format('d/m/Y'),
                'fechaVencimiento'=> $pol->fecha_vencimiento?->format('d/m/Y'),
                'primaPrincipal'  => number_format((float) $pol->total, 2),
                'monedaNativa'    => $monedaNativa,
                'simboloNativo'   => $simbolo,
                'verificarUrl'    => url('/ver/' . $pol->nro_contrato),
                'qrCode'          => $qrCode,
                'esMensual'       => $esMensual,
                'frecuenciaPago'  => $pol->frecuencia_pago ?? 'Anual',
                'cuotaMensual'    => $cuotaMensual !== null ? number_format($cuotaMensual, 2) : null,
                'proximaCuota'    => $proximaCuota,
            ],
        );
    }

    public function attachments(): array
    {
        $pol = $this->poliza;

        try {
            $snap = $pol->snapshot_datos ?? [];
            $attrs = $snap['bien']['atributos'] ?? [];
            $ci = $snap['asegurado']['ci'] ?? $pol->asegurado_ci ?? '';
            $placa = strtoupper($attrs['placa'] ?? '');

            $qrUrl = url('/ver/' . urlencode($pol->nro_contrato));
            $qrSvg = app(QrGenerator::class)->format('svg')->size(150)->errorCorrection('H')->generate($qrUrl);
            $qrCode = 'data:image/svg+xml;base64,' . base64_encode((string) $qrSvg);
        } catch (\Throwable) {
            $qrCode = null;
        }

        // El template necesita estas 3 variables además de poliza/qrCode —
        // faltaban aquí (solo se pasaban en PolizaController::pdf/pdfPublico)
        // y rompían la generación del PDF adjunto en CADA correo de emisión.
        $bienesAdicionales = $pol->bienesAdicionales();
        $numeroRecibo = $pol->numeroRecibo();
        $esRenovacion = $pol->esRenovacion();

        $pdf = Pdf::loadView('poliza-pdf', [
            'poliza' => $pol,
            'qrCode' => $qrCode,
            'bienesAdicionales' => $bienesAdicionales,
            'numeroRecibo' => $numeroRecibo,
            'esRenovacion' => $esRenovacion,
        ])->setPaper('letter', 'portrait');
        $filename = 'poliza-' . str_replace(['/', ' '], '-', $pol->nro_contrato) . '.pdf';

        return [
            Attachment::fromData(fn() => $pdf->output(), $filename)
                ->withMime('application/pdf'),
        ];
    }
}
