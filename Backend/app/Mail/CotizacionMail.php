<?php

namespace App\Mail;

use App\Models\Solicitud;
use App\Support\Moneda;
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
        return new Envelope(
            subject: 'Su simulación de seguro ' . $this->nroCotizacion() . ' | J&M Seguros',
        );
    }

    private function nroCotizacion(): string
    {
        return 'COT-' . ($this->solicitud->fecha_solicitud?->format('Y') ?? now()->year)
             . '-' . str_pad((string) $this->solicitud->id, 5, '0', STR_PAD_LEFT);
    }

    /** Traduce el status interno (pendiente|en_revision|aprobado|rechazado|emitida|...) a una etiqueta clara para el cliente. */
    private function statusLabel(?string $status): array
    {
        $norm = strtolower(str_replace([' ', '-'], '_', (string) $status));
        return match (true) {
            str_contains($norm, 'emitid')   => ['Emitida',              '#16a34a'],
            str_contains($norm, 'aprobad')  => ['Aprobada',             '#16a34a'],
            str_contains($norm, 'rechazad') => ['Rechazada',            '#dc2626'],
            str_contains($norm, 'anulad')   => ['Anulada',              '#dc2626'],
            default                          => ['Pendiente de revisión', '#d97706'],
        };
    }

    public function content(): Content
    {
        $sol  = $this->solicitud;
        $cobs = is_array($sol->coberturas) ? $sol->coberturas : [];

        // Moneda nativa del producto — el total/cobertura de la solicitud
        // está denominado en ella, nunca asumida en USD.
        $monedaNativa = Moneda::normalizar($sol->moneda_producto ?? $sol->producto?->moneda ?? 'USD');
        $simbolo      = Moneda::simbolo($monedaNativa);

        // Suma asegurada
        $cobertura = number_format((float) ($cobs['valor_mercado'] ?? $sol->producto?->cobertura ?? 0), 2);

        // Coberturas detalladas (nombres de coberturas incluidas)
        $coberturasDetalle = $this->extractCoberturas($cobs, $sol->producto?->tipo_calculo, $simbolo);

        // Referencia del bien
        $bien    = $sol->bien;
        $attrs   = $bien?->atributos ?? [];
        $bienRef = $attrs['placa']
            ?? (isset($attrs['marca'], $attrs['modelo']) ? "{$attrs['marca']} {$attrs['modelo']}" : null)
            ?? $bien?->descripcion
            ?? '—';

        [$statusLabel, $statusColor] = $this->statusLabel($sol->status);

        return new Content(
            view: 'emails.cotizacion',
            with: [
                'accentColor'       => '#4c1d95',
                'badgeColor'        => '#7c3aed',
                'badgeText'         => 'Simulación de Seguro',
                'logoUrl'           => url('logo-sinfondo.png'),
                'nroCotizacion'     => $this->nroCotizacion(),
                'statusLabel'       => $statusLabel,
                'statusColor'       => $statusColor,
                'tomadorNombre'     => $sol->nombre_tomador ?? $sol->persona?->nombre ?? '—',
                'ciTomador'         => $sol->ci_tomador     ?? $sol->persona?->cedula  ?? '—',
                'fecha'             => $sol->fecha_solicitud?->format('d/m/Y') ?? now()->format('d/m/Y'),
                'telefono'          => $cobs['telefono']  ?? $sol->persona?->telefono ?? null,
                'correoCliente'     => $cobs['email']     ?? $sol->persona?->correo   ?? null,
                'ciudad'            => $cobs['ciudad']    ?? $sol->persona?->ciudad   ?? null,
                'direccion'         => $cobs['direccion'] ?? $sol->persona?->direccion ?? null,
                'estadoVe'          => $cobs['estado_ve'] ?? $sol->persona?->estado   ?? null,
                'productoNombre'    => $sol->producto?->nombre ?? '—',
                'productoDescripcion' => $sol->producto?->descripcion ?? null,
                'bienRef'           => $bienRef,
                'primaPrincipal'    => number_format((float) $sol->total, 2),
                'monedaNativa'      => $monedaNativa,
                'simboloNativo'     => $simbolo,
                'cobertura'         => $simbolo . $cobertura . ' ' . $monedaNativa,
                'coberturasDetalle' => $coberturasDetalle,
            ],
        );
    }

    private function extractCoberturas(array $cobs, ?string $tipoCal, string $simbolo): array
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
                    $lista[] = $label . ': ' . $simbolo . number_format((float)($tarifa[$key]['suma'] ?? $tarifa[$key]), 2);
                }
            }
        } elseif ($tipoCal === 'por_valor') {
            $lista[] = 'Responsabilidad Civil Obligatoria (RCV)';
            $lista[] = 'Cobertura: ' . $simbolo . number_format((float)($cobs['valor_mercado'] ?? 0), 2);
        }

        return $lista;
    }
}
