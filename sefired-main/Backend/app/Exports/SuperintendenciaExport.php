<?php

namespace App\Exports;

use Illuminate\Support\Collection;

/**
 * Exportación del Reporte de Superintendencia (SUDEASEG).
 * Datos agrupados por ramo/producto con fila total.
 */
class SuperintendenciaExport extends BaseExport
{
    protected Collection $rows;

    /**
     * @param Collection $rows  Colección de arrays con claves: ramo, pol, prima, rc, can, bs2
     */
    public function __construct(Collection $rows)
    {
        $this->rows = $rows;
    }

    public function title(): string
    {
        return 'Superintendencia';
    }

    public function headings(): array
    {
        return ['Ramo', 'Pólizas', 'Prima (USD)', 'RC Obligatoria', 'Canceladas', 'Prima (Bs)'];
    }

    public function collection(): Collection
    {
        return $this->rows;
    }

    public function map($row): array
    {
        return [
            $row['ramo'],
            $row['pol'],
            $row['prima'],
            $row['rc'],
            $row['can'],
            $row['bs2'],
        ];
    }

    /**
     * Resalta la fila TOTAL en negrita.
     */
    protected function afterSheet($sheet, $spreadsheet): void
    {
        $highestRow = $sheet->getHighestRow();
        $lastCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($this->headings()));

        // La última fila debería ser TOTAL
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
