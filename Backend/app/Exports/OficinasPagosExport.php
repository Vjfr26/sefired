<?php

namespace App\Exports;

use App\Exports\Concerns\HasSelectableColumns;
use Illuminate\Support\Collection;

/**
 * Exportación del Reporte de Pólizas Cobradas por Forma de Pago, por oficina.
 * Columnas personalizables (todo o selección).
 */
class OficinasPagosExport extends BaseExport
{
    use HasSelectableColumns;

    protected Collection $rows;

    /**
     * @param Collection $rows  Colección de arrays con claves: ofi, forma_pago, pol, prima
     */
    public function __construct(Collection $rows, ?array $columns = null)
    {
        $this->rows = $rows;
        $this->initColumns($columns);
    }

    public function title(): string
    {
        return 'Pólizas cobradas';
    }

    public function columnDefs(): array
    {
        return [
            'ofi'        => 'Oficina',
            'forma_pago' => 'Forma de Pago',
            'pol'        => 'Pólizas Cobradas',
            'prima'      => 'Prima (USD)',
        ];
    }

    public function collection(): Collection
    {
        return $this->rows;
    }

    protected function mapAssoc($row): array
    {
        return [
            'ofi'        => $row['ofi'],
            'forma_pago' => $row['forma_pago'],
            'pol'        => $row['pol'],
            'prima'      => $row['prima'],
        ];
    }
}
