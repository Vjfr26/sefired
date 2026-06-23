<?php

namespace App\Exports;

use Illuminate\Support\Collection;

/**
 * Exportación de Métricas de Personal (listado de vendedores), incluyendo
 * el desglose de comisión generada/pagada/pendiente y la fila TOTAL.
 */
class UsuariosMetricsExport extends BaseExport
{
    protected Collection $rows;

    /**
     * @param Collection $rows  Filas con claves: nom, rol, ofi, pol, prima, com_gen, com_pagada, com_pend, est
     */
    public function __construct(Collection $rows)
    {
        $this->rows = $rows;
    }

    public function title(): string
    {
        return 'Metricas de Personal';
    }

    public function headings(): array
    {
        return ['Nombre', 'Cargo', 'Sede', 'Pólizas', 'Prima (USD)', 'Comisión Generada', 'Comisión Pagada', 'Comisión Pendiente', 'Estado'];
    }

    public function collection(): Collection
    {
        return $this->rows;
    }

    public function map($row): array
    {
        return [
            $row['nom'],
            $row['rol'],
            $row['ofi'],
            $row['pol'],
            $row['prima'],
            $row['com_gen'],
            $row['com_pagada'],
            $row['com_pend'],
            $row['est'],
        ];
    }
}
