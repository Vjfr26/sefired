<?php

namespace App\Services;

use App\Exports\ExternalReportExport;
use App\Models\IndicadorEconomico;
use App\Models\Poliza;
use Illuminate\Support\Facades\Storage;

/**
 * Genera el archivo Excel del reporte externo y lo deja guardado en disco.
 * Usado tanto por la ejecución manual ("Ejecutar ahora") como por el comando
 * programado que envía por correo a los destinatarios.
 *
 * Cubre SIEMPRE un día: la carga masiva se declara por jornada, y así cada
 * envío lleva lo emitido ese día en vez de repetir la cartera completa.
 */
class ReporteGeneratorService
{
    /**
     * @param array<int, string>|null $columnas Columnas a incluir (mismas claves
     *        que la descarga manual). NULL o vacío = todas.
     * @param string $moneda Moneda de salida de los montos (USD|BS|EUR).
     * @param string|null $dia Día a declarar (Y-m-d). Por defecto, hoy.
     * @return array{path: string, filename: string, size: int}
     */
    public function generarExterno(?array $columnas = null, string $moneda = 'USD', ?string $dia = null): array
    {
        // El reporte programado declara LO EMITIDO EN EL DÍA: se ejecuta a
        // diario y cada corrida cubre su propia jornada. Antes exportaba la
        // cartera entera en cada envío — 120.558 pólizas — y el comando moría
        // sin memoria con "exit code 255" en el log, sin avisar a nadie.
        $dia = $dia ?: now()->toDateString();

        $query = Poliza::with(['solicitud.persona', 'solicitud.bien', 'producto'])
            ->whereDate('fecha_emision', $dia)
            ->orderBy('fecha_emision', 'desc');

        // Red de seguridad por si algún día se le pasa un rango más ancho.
        $maximo = (int) config('reportes.max_polizas_export', 20000);
        $total  = (clone $query)->count();
        if ($total > $maximo) {
            throw new \RuntimeException(
                "El reporte externo del {$dia} abarca {$total} pólizas y el máximo por archivo es {$maximo}. "
                . 'Sube REPORTE_EXTERNO_MAX_POLIZAS junto con la memoria del proceso.'
            );
        }

        $policies = $query->get();

        // Las tasas del día son el respaldo para las pólizas que no tienen la
        // suya congelada. Sin ellas los montos en otra moneda salían en cero.
        $tasaUsd = (float) (IndicadorEconomico::usd()->orderByDesc('fecha')->orderByDesc('fecha_registro')->value('valor') ?? 0);
        $tasaEur = (float) (IndicadorEconomico::eur()->orderByDesc('fecha')->orderByDesc('fecha_registro')->value('valor') ?? 0);

        // El nombre lleva el día DECLARADO (no el de generación): quien reciba
        // el correo sabe qué jornada cubre el archivo. La hora evita pisar
        // otro archivo si se regenera el mismo día.
        $filename = 'reporte_externo_' . str_replace('-', '', $dia) . '_' . now()->format('His') . '.xlsx';
        $path     = 'reportes_externos/' . $filename;
        (new ExternalReportExport(
            $policies,
            is_array($columnas) && count($columnas) ? array_values($columnas) : null,
            $moneda,
            $tasaUsd,
            $tasaEur,
        ))->store($path);

        return ['path' => $path, 'filename' => $filename, 'size' => Storage::disk(config('filesystems.docs_disk'))->size($path)];
    }
}
