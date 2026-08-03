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
 */
class ReporteGeneratorService
{
    /**
     * @param array<int, string>|null $columnas Columnas a incluir (mismas claves
     *        que la descarga manual). NULL o vacío = todas.
     * @param string $moneda Moneda de salida de los montos (USD|BS|EUR).
     * @return array{path: string, filename: string, size: int}
     */
    public function generarExterno(?array $columnas = null, string $moneda = 'USD'): array
    {
        $policies = Poliza::with(['solicitud.persona', 'solicitud.bien', 'producto'])
            ->orderBy('fecha_emision', 'desc')
            ->get();

        // Las tasas del día son el respaldo para las pólizas que no tienen la
        // suya congelada. Sin ellas los montos en otra moneda salían en cero.
        $tasaUsd = (float) (IndicadorEconomico::usd()->orderByDesc('fecha')->orderByDesc('fecha_registro')->value('valor') ?? 0);
        $tasaEur = (float) (IndicadorEconomico::eur()->orderByDesc('fecha')->orderByDesc('fecha_registro')->value('valor') ?? 0);

        $filename = 'reporte_externo_' . now()->format('Ymd_His') . '.xlsx';
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
