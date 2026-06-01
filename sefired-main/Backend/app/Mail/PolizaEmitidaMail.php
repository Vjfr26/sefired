<?php

namespace App\Mail;

use App\Models\Poliza;
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

    public function __construct(public Poliza $poliza) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Póliza Emitida — ' . $this->poliza->nro_contrato . ' | J&M Seguros',
        );
    }

    public function content(): Content
    {
        $pol     = $this->poliza;
        $snap    = $pol->snapshot_datos ?? [];
        $attrs   = $snap['bien']['atributos'] ?? [];
        $persona = $pol->solicitud?->persona;

        $bienRef = $attrs['placa']
            ?? $attrs['descripcion']
            ?? ($snap['bien']['tipo'] ?? '—');

        try {
            $qrUrl  = rtrim(env('POLIZA_QR_BASE_URL', 'https://lavenezolanadeseguros.com.ve/qr.php'), '/')
                    . '?poliza=' . urlencode($pol->nro_contrato);
            $qrSvg  = app(QrGenerator::class)->format('svg')->size(120)->generate($qrUrl);
            $qrCode = 'data:image/svg+xml;base64,' . base64_encode((string) $qrSvg);
        } catch (\Throwable) {
            $qrCode = null;
        }

        return new Content(
            view: 'emails.poliza-emitida',
            with: [
                'accentColor'     => '#001463',
                'badgeColor'      => '#0ea5e9',
                'badgeText'       => 'Póliza Emitida',
                'logoUrl'         => url('logo-sinfondo.png'),
                'tomadorNombre'   => $snap['tomador']['nombre'] ?? $persona?->nombre ?? '—',
                'aseguradoNombre' => $snap['asegurado']['nombre'] ?? $persona?->nombre ?? '—',
                'nroContrato'     => $pol->nro_contrato,
                'producto'        => $snap['producto']['nombre'] ?? $pol->producto?->nombre ?? '—',
                'bienRef'         => $bienRef,
                'fechaEmision'    => $pol->fecha_emision?->format('d/m/Y'),
                'fechaVencimiento'=> $pol->fecha_vencimiento?->format('d/m/Y'),
                'primaDolares'    => number_format((float) $pol->total, 2),
                'tasaEmision'     => number_format((float) ($pol->tasa_emision ?? 0), 4),
                'totalBs'         => number_format((float) $pol->total_bs, 2),
                'verificarUrl'    => url('/verificar/' . $pol->nro_contrato),
                'qrCode'          => $qrCode,
            ],
        );
    }

    public function attachments(): array
    {
        $pol = $this->poliza;

        try {
            $snap  = $pol->snapshot_datos ?? [];
            $attrs = $snap['bien']['atributos'] ?? [];
            $ci    = $snap['asegurado']['ci'] ?? $pol->asegurado_ci ?? '';
            $placa = strtoupper($attrs['placa'] ?? '');

            $qrUrl  = rtrim(env('POLIZA_QR_BASE_URL', 'https://lavenezolanadeseguros.com.ve/qr.php'), '/')
                    . '?poliza=' . urlencode($pol->nro_contrato)
                    . '&cedula=' . urlencode($ci)
                    . '&placa='  . urlencode($placa);
            $qrSvg  = app(QrGenerator::class)->format('svg')->size(150)->errorCorrection('H')->generate($qrUrl);
            $qrCode = 'data:image/svg+xml;base64,' . base64_encode((string) $qrSvg);
        } catch (\Throwable) {
            $qrCode = null;
        }

        $pdf      = Pdf::loadView('poliza-pdf', compact('pol', 'qrCode')
                         + ['poliza' => $pol])->setPaper('letter', 'portrait');
        $filename = 'poliza-' . str_replace(['/', ' '], '-', $pol->nro_contrato) . '.pdf';

        return [
            Attachment::fromData(fn() => $pdf->output(), $filename)
                ->withMime('application/pdf'),
        ];
    }
}
