<?php

namespace App\Services;

use App\Exports\ExternalReportExport;
use App\Exports\VentasExport;
use App\Models\Poliza;
use Illuminate\Support\Facades\Storage;

/**
 * Genera los archivos Excel de los reportes externos e internos y los deja
 * guardados en disco. Usado tanto por la ejecución manual ("Ejecutar ahora")
 * como por el comando programado que envía por correo a los destinatarios.
 */
class ReporteGeneratorService
{
    /** @return array{path: string, filename: string, size: int} */
    public function generarExterno(): array
    {
        $policies = Poliza::with(['solicitud.persona', 'solicitud.bien', 'producto'])
            ->orderBy('fecha_emision', 'desc')
            ->get();

        $filename = 'reporte_externo_' . now()->format('Ymd_His') . '.xlsx';
        $path     = 'reportes_externos/' . $filename;
        (new ExternalReportExport($policies))->store($path);

        return ['path' => $path, 'filename' => $filename, 'size' => Storage::disk('public')->size($path)];
    }

    /** @return array{path: string, filename: string, size: int} */
    public function generarInterno(): array
    {
        $policies = Poliza::with(['vendedor', 'producto'])
            ->orderBy('fecha_emision', 'desc')
            ->get();

        $filename = 'reporte_interno_' . now()->format('Ymd_His') . '.xlsx';
        $path     = 'reportes_internos/' . $filename;
        (new VentasExport($policies))->store($path);

        return ['path' => $path, 'filename' => $filename, 'size' => Storage::disk('public')->size($path)];
    }
}
