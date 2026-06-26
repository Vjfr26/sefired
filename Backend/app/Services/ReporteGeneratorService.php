<?php

namespace App\Services;

use App\Exports\ExternalReportExport;
use App\Models\Poliza;
use Illuminate\Support\Facades\Storage;

/**
 * Genera el archivo Excel del reporte externo y lo deja guardado en disco.
 * Usado tanto por la ejecución manual ("Ejecutar ahora") como por el comando
 * programado que envía por correo a los destinatarios.
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

        return ['path' => $path, 'filename' => $filename, 'size' => Storage::disk(config('filesystems.docs_disk'))->size($path)];
    }
}
