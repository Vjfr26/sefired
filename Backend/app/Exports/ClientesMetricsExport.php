<?php

namespace App\Exports;

use App\Exports\Concerns\HasSelectableColumns;
use Illuminate\Support\Collection;

/**
 * Exportación de Métricas de Clientes — una fila por cliente con TODOS sus
 * datos individuales y completos (contacto, ubicación, conteo de bienes/pólizas
 * y prima total). Columnas personalizables (todo o selección).
 */
class ClientesMetricsExport extends BaseExport
{
    use HasSelectableColumns;

    protected Collection $rows;

    /**
     * @param Collection $rows Filas con las claves de columnDefs() + campos de orden.
     */
    public function __construct(Collection $rows, ?array $columns = null)
    {
        $this->rows = $rows;
        $this->initColumns($columns);
    }

    public function title(): string
    {
        return 'Metricas de Clientes';
    }

    public function columnDefs(): array
    {
        return [
            'ced'           => 'Cédula / RIF',
            'nom'           => 'Nombre Completo',
            'cor'           => 'Correo',
            'tel'           => 'Teléfono',
            'cel'           => 'Celular',
            'dir'           => 'Dirección',
            'ciudad'        => 'Ciudad',
            'estado_region' => 'Estado',
            'reg'           => 'Fecha de Registro',
            'bienes'        => 'N° de Bienes',
            'marcas'        => 'Marcas',
            'pol'           => 'N° de Pólizas',
            'pol_act'       => 'Pólizas Activas',
            'prox_venc'     => 'Próx. Vencimiento',
            'prima'         => 'Prima Total (USD)',
            'est'           => 'Estado del Cliente',
        ];
    }

    public function collection(): Collection
    {
        return $this->rows;
    }

    protected function mapAssoc($row): array
    {
        return [
            'ced'           => $row['ced'],
            'nom'           => $row['nom'],
            'cor'           => $row['cor'],
            'tel'           => $row['tel'],
            'cel'           => $row['cel'],
            'dir'           => $row['dir'],
            'ciudad'        => $row['ciudad'],
            'estado_region' => $row['estado_region'],
            'reg'           => $row['reg'],
            'bienes'        => $row['bienes'],
            'marcas'        => $row['marcas'],
            'pol'           => $row['pol'],
            'pol_act'       => $row['pol_act'],
            'prox_venc'     => $row['prox_venc'],
            'prima'         => $row['prima'],
            'est'           => $row['est'],
        ];
    }
}
