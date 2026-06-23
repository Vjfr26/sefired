<?php

namespace App\Exports;

use Illuminate\Support\Collection;

/**
 * Exportación del detalle de pólizas de un asesor específico (Métricas de
 * Personal filtrado por usuario), con su comisión y estado individual.
 */
class UsuarioPolizasExport extends BaseExport
{
    protected Collection $rows;
    protected string $nombreAsesor;

    /**
     * @param Collection $rows  Filas con claves: fecha_emision, nro_contrato, cliente_nombre,
     *                          producto_nombre, total, moneda_producto, status, comision_monto,
     *                          comision_status, comision_fecha_pago
     */
    public function __construct(Collection $rows, string $nombreAsesor)
    {
        $this->rows         = $rows;
        $this->nombreAsesor = $nombreAsesor;
    }

    public function title(): string
    {
        return mb_substr('Polizas - ' . $this->nombreAsesor, 0, 31);
    }

    public function headings(): array
    {
        return ['Fecha Emisión', 'Póliza', 'Cliente', 'Producto', 'Prima', 'Moneda', 'Estado Póliza', 'Comisión', 'Estado Comisión', 'Fecha Pago'];
    }

    public function collection(): Collection
    {
        return $this->rows;
    }

    public function map($row): array
    {
        return [
            $row['fecha_emision'],
            $row['nro_contrato'],
            $row['cliente_nombre'],
            $row['producto_nombre'],
            $row['total'],
            $row['moneda_producto'],
            $row['status'],
            $row['comision_monto'] ?? '—',
            $row['comision_status'] ?? '—',
            $row['comision_fecha_pago'] ?? '—',
        ];
    }
}
