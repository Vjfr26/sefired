<?php

namespace App\Exports;

use App\Exports\Concerns\HasSelectableColumns;
use Illuminate\Support\Collection;

/**
 * Exportación del Reporte de Oficinas.
 * Datos de desempeño agrupados por sede con fila total. Columnas personalizables.
 */
class OficinasExport extends BaseExport
{
    use HasSelectableColumns;

    protected Collection $rows;

    /**
     * @param Collection $rows  Colección de arrays con claves: ofi, ag, pol, prima, pct, est
     */
    public function __construct(Collection $rows, ?array $columns = null)
    {
        $this->rows = $rows;
        $this->initColumns($columns);
    }

    public function title(): string
    {
        return 'Oficinas';
    }

    public function columnDefs(): array
    {
        return [
            'ofi'   => 'Oficina',
            'ag'    => 'Agentes',
            'pol'   => 'Pólizas',
            'prima' => 'Prima (USD)',
            'pct'   => 'Participación (%)',
            'est'   => 'Estado',
        ];
    }

    public function collection(): Collection
    {
        return $this->rows;
    }

    protected function mapAssoc($row): array
    {
        return [
            'ofi'   => $row['ofi'],
            'ag'    => $row['ag'],
            'pol'   => $row['pol'],
            'prima' => $row['prima'],
            'pct'   => $row['pct'],
            'est'   => $row['est'],
        ];
    }

    protected function afterSheet($sheet, $spreadsheet): void
    {
        // Solo resalta la fila TOTAL cuando la columna Oficina está incluida
        // (es donde vive la etiqueta "TOTAL").
        if (!in_array('ofi', $this->columnKeys(), true)) {
            return;
        }
        $highestRow = $sheet->getHighestRow();
        $lastCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($this->headings()));

        $totalCell = $sheet->getCell("A{$highestRow}")->getValue();
        if ($totalCell === 'TOTAL') {
            $sheet->getStyle("A{$highestRow}:{$lastCol}{$highestRow}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 11],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'DBEAFE'],
                ],
            ]);
        }
    }
}
