<?php

namespace App\Exports;

use Illuminate\Support\Collection;

/**
 * Exportación genérica para reportes internos automáticos.
 * Acepta encabezados y datos dinámicos para cualquier tipo de reporte interno.
 */
class InternalReportExport extends BaseExport
{
    protected array $headers;
    protected Collection $data;
    protected string $sheetTitle;

    /**
     * @param array      $headers     Array de strings para los encabezados
     * @param Collection $data        Colección de arrays asociativos con los datos
     * @param string     $sheetTitle  Título de la hoja
     */
    public function __construct(array $headers, Collection $data, string $sheetTitle = 'Reporte')
    {
        $this->headers = $headers;
        $this->data = $data;
        $this->sheetTitle = $sheetTitle;
    }

    public function title(): string
    {
        return $this->sheetTitle;
    }

    public function headings(): array
    {
        return $this->headers;
    }

    public function collection(): Collection
    {
        return $this->data;
    }

    public function map($row): array
    {
        // Si es un array, retornamos los valores en orden
        if (is_array($row)) {
            return array_values($row);
        }

        // Si es un objeto, extraemos los valores correspondientes a los headers
        return collect($this->headers)->map(function ($header) use ($row) {
            return $row->{$header} ?? '';
        })->toArray();
    }
}
