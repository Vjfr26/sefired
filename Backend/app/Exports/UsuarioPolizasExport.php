<?php

namespace App\Exports;

use App\Exports\Concerns\HasSelectableColumns;
use Illuminate\Support\Collection;

/**
 * Exportación del detalle de pólizas de un asesor específico (Métricas de
 * Personal filtrado por usuario), con su comisión y estado individual.
 * Columnas personalizables (todo o selección).
 */
class UsuarioPolizasExport extends BaseExport
{
    use HasSelectableColumns;

    protected Collection $rows;
    protected string $nombreAsesor;

    /**
     * @param Collection $rows  Filas con claves: fecha_emision, nro_contrato, cliente_nombre,
     *                          producto_nombre, total, moneda_producto, status, comision_monto,
     *                          comision_status, comision_fecha_pago
     */
    public function __construct(Collection $rows, string $nombreAsesor, ?array $columns = null)
    {
        $this->rows         = $rows;
        $this->nombreAsesor = $nombreAsesor;
        $this->initColumns($columns);
    }

    public function title(): string
    {
        return mb_substr('Polizas - ' . $this->nombreAsesor, 0, 31);
    }

    public function columnDefs(): array
    {
        return [
            'fecha_emision'       => 'Fecha Emisión',
            'nro_contrato'        => 'Póliza',
            'cliente_nombre'      => 'Cliente',
            'producto_nombre'     => 'Producto',
            'total'               => 'Prima',
            'moneda_producto'     => 'Moneda',
            'status'              => 'Estado Póliza',
            'comision_monto'      => 'Comisión',
            'comision_status'     => 'Estado Comisión',
            'comision_fecha_pago' => 'Fecha Pago',
        ];
    }

    public function collection(): Collection
    {
        return $this->rows;
    }

    protected function mapAssoc($row): array
    {
        return [
            'fecha_emision'       => $row['fecha_emision'],
            'nro_contrato'        => $row['nro_contrato'],
            'cliente_nombre'      => $row['cliente_nombre'],
            'producto_nombre'     => $row['producto_nombre'],
            'total'               => $row['total'],
            'moneda_producto'     => $row['moneda_producto'],
            'status'              => $row['status'],
            'comision_monto'      => $row['comision_monto'] ?? '—',
            'comision_status'     => $row['comision_status'] ?? '—',
            'comision_fecha_pago' => $row['comision_fecha_pago'] ?? '—',
        ];
    }
}
