<?php

namespace App\Exports;

use Illuminate\Support\Collection;

/**
 * Exportación del Reporte de Pólizas Cobradas por Forma de Pago, por oficina.
 */
class OficinasPagosExport extends BaseExport
{
    protected Collection $rows;

    /**
     * @param Collection $rows  Colección de arrays con claves: ofi, forma_pago, pol, prima
     */
    public function __construct(Collection $rows)
    {
        $this->rows = $rows;
    }

    public function title(): string
    {
        return 'Pólizas cobradas';
    }

    public function headings(): array
    {
        return ['Oficina', 'Forma de Pago', 'Pólizas Cobradas', 'Prima (USD)'];
    }

    public function collection(): Collection
    {
        return $this->rows;
    }

    public function map($row): array
    {
        return [
            $row['ofi'],
            $row['forma_pago'],
            $row['pol'],
            $row['prima'],
        ];
    }
}
