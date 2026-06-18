<?php

namespace App\Mail;

use App\Models\Solicitud;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CotizacionMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Solicitud $solicitud) {}

    public function envelope(): Envelope
    {
        $nro = 'COT-' . ($this->solicitud->fecha_solicitud?->format('Y') ?? now()->year)
             . '-' . str_pad($this->solicitud->id, 5, '0', STR_PAD_LEFT);

        return new Envelope(
            subject: 'Su simulación de seguro ' . $nro . ' | J&M Seguros',
        );
    }

    public function content(): Content
    {
        $sol  = $this->solicitud;
        $cobs = is_array($sol->coberturas) ? $sol->coberturas : [];

        // Tasas BCV y montos en Bs. y EUR
        $tasaUsd = (float) ($cobs['tasaBCV'] ?? 0);
        $tasaEur = (float) ($cobs['tasaEUR'] ?? 0);
        $primaBs  = $tasaUsd > 1 ? number_format((float) $sol->total * $tasaUsd, 2) : null;
        $primaEur = ($tasaEur > 1 && $tasaUsd > 0) ? number_format((float) $sol->total * $tasaUsd / $tasaEur, 2) : null;

        // Suma asegurada
        $cobertura = number_format((float) ($cobs['valor_mercado'] ?? $sol->producto?->cobertura ?? 0), 2);

        // Coberturas detalladas (nombres de coberturas incluidas)
        $coberturasDetalle = $this->extractCoberturas($cobs, $sol->producto?->tipo_calculo);

        // Referencia del bien
        $bien    = $sol->bien;
        $attrs   = $bien?->atributos ?? [];
        $bienRef = $attrs['placa']
            ?? (isset($attrs['marca'], $attrs['modelo']) ? "{$attrs['marca']} {$attrs['modelo']}" : null)
            ?? $bien?->descripcion
            ?? '—';

        return new Content(
            view: 'emails.cotizacion',
            with: [
                'accentColor'       => '#4c1d95',
                'badgeColor'        => '#7c3aed',
                'badgeText'         => 'Simulación de Seguro',
                'logoUrl'           => url('logo-sinfondo.png'),
                'tomadorNombre'     => $sol->nombre_tomador ?? $sol->persona?->nombre ?? '—',
                'ciTomador'         => $sol->ci_tomador     ?? $sol->persona?->cedula  ?? '—',
                'fecha'             => $sol->fecha_solicitud?->format('d/m/Y') ?? now()->format('d/m/Y'),
                'productoNombre'    => $sol->producto?->nombre ?? '—',
                'bienRef'           => $bienRef,
                'primaUsd'          => number_format((float) $sol->total, 2),
                'primaBs'           => $primaBs,
                'primaEur'          => $primaEur,
                'tasaBcv'           => $tasaUsd > 1 ? number_format($tasaUsd, 2) : null,
                'tasaEur'           => $tasaEur > 1 ? number_format($tasaEur, 2) : null,
                'cobertura'         => $cobertura,
                'coberturasDetalle' => $coberturasDetalle,
            ],
        );
    }

    private function extractCoberturas(array $cobs, ?string $tipoCal): array
    {
        $lista = [];

        if ($tipoCal === 'por_plan' || $tipoCal === 'fijo') {
            $tarifa = $cobs['tarifa']['datos'] ?? [];
            $mapa   = [
                'muerte_accidental' => 'Muerte Accidental',
                'invalidez'         => 'Invalidez Permanente',
                'medicos'           => 'Gastos Médicos',
                'funerarios'        => 'Gastos Funerarios',
                'suma_persona'      => 'Suma por Persona',
                'suma_cosa'         => 'Suma por Cosa',
            ];
            foreach ($mapa as $key => $label) {
                if (!empty($tarifa[$key])) {
                    $lista[] = $label . ': $' . number_format((float)($tarifa[$key]['suma'] ?? $tarifa[$key]), 2);
                }
            }
        } elseif ($tipoCal === 'por_valor') {
            $lista[] = 'Responsabilidad Civil Obligatoria (RCV)';
            $lista[] = 'Cobertura: $' . number_format((float)($cobs['valor_mercado'] ?? 0), 2) . ' USD';
        }

        return $lista;
    }
}
