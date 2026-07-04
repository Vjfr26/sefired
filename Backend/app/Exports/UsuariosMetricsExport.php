<?php

namespace App\Exports;

use App\Exports\Concerns\HasSelectableColumns;
use Illuminate\Support\Collection;

/**
 * Exportación de Métricas de Personal (listado de vendedores), incluyendo
 * el desglose de comisión generada/pagada/pendiente y la fila TOTAL.
 * Columnas personalizables (todo o selección).
 */
class UsuariosMetricsExport extends BaseExport
{
    use HasSelectableColumns;

    protected Collection $rows;

    /**
     * @param Collection $rows  Filas con claves: nom, rol, ofi, pol, prima, com_gen, com_pagada, com_pend, est
     */
    public function __construct(Collection $rows, ?array $columns = null)
    {
        $this->rows = $rows;
        $this->initColumns($columns);
    }

    public function title(): string
    {
        return 'Metricas de Personal';
    }

    public function columnDefs(): array
    {
        return [
            'nom'        => 'Nombre',
            'rol'        => 'Cargo',
            'ofi'        => 'Sede',
            'pol'        => 'Pólizas',
            'prima'      => 'Prima (USD)',
            'com_gen'    => 'Comisión Generada',
            'com_pagada' => 'Comisión Pagada',
            'com_pend'   => 'Comisión Pendiente',
            'est'        => 'Estado',
        ];
    }

    public function collection(): Collection
    {
        return $this->rows;
    }

    protected function mapAssoc($row): array
    {
        return [
            'nom'        => $row['nom'],
            'rol'        => $row['rol'],
            'ofi'        => $row['ofi'],
            'pol'        => $row['pol'],
            'prima'      => $row['prima'],
            'com_gen'    => $row['com_gen'],
            'com_pagada' => $row['com_pagada'],
            'com_pend'   => $row['com_pend'],
            'est'        => $row['est'],
        ];
    }
}
