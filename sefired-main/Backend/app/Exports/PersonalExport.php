<?php

namespace App\Exports;

use Illuminate\Support\Collection;

/**
 * Exportación del Reporte de Personal.
 * Desempeño de vendedores/agentes con pólizas, primas y comisiones.
 */
class PersonalExport extends BaseExport
{
    protected Collection $rows;

    /**
     * @param Collection $rows  Colección de arrays con claves: nom, rol, ofi, pol, prima, com, est
     */
    public function __construct(Collection $rows)
    {
        $this->rows = $rows;
    }

    public function title(): string
    {
        return 'Personal';
    }

    public function headings(): array
    {
        return ['Nombre', 'Rol', 'Oficina', 'Pólizas', 'Prima (USD)', 'Comisión (USD)', 'Estado'];
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
            $row['com'],
            $row['est'],
        ];
    }
}
