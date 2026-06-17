<?php

namespace App\Exports;

use Illuminate\Support\Collection;

/**
 * Exportación del Reporte de Oficinas.
 * Datos de desempeño agrupados por sede con fila total.
 */
class OficinasExport extends BaseExport
{
    protected Collection $rows;

    /**
     * @param Collection $rows  Colección de arrays con claves: ofi, ag, pol, prima, pct, est
     */
    public function __construct(Collection $rows)
    {
        $this->rows = $rows;
    }

    public function title(): string
    {
        return 'Oficinas';
    }

    public function headings(): array
    {
        return ['Oficina', 'Agentes', 'Pólizas', 'Prima (USD)', 'Participación (%)', 'Estado'];
    }

    public function collection(): Collection
    {
        return $this->rows;
    }

    public function map($row): array
    {
        return [
            $row['ofi'],
            $row['ag'],
            $row['pol'],
            $row['prima'],
            $row['pct'],
            $row['est'],
        ];
    }

    protected function afterSheet($sheet, $spreadsheet): void
    {
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
