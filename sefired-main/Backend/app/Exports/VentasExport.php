<?php

namespace App\Exports;

use App\Models\Poliza;
use Illuminate\Support\Collection;

/**
 * Exportación del Reporte de Ventas y Comisiones.
 * Incluye dos secciones: ventas del período y comisiones agrupadas por vendedor.
 */
class VentasExport extends BaseExport
{
    protected Collection $policies;

    public function __construct(Collection $policies)
    {
        $this->policies = $policies;
    }

    public function title(): string
    {
        return 'Ventas y Comisiones';
    }

    public function headings(): array
    {
        return ['Fecha', 'Póliza', 'Agente', 'Producto', 'Prima (USD)', 'Prima (Bs)', 'Estado'];
    }

    public function collection(): Collection
    {
        return $this->policies;
    }

    public function map($p): array
    {
        return [
            $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '—',
            $p->nro_contrato,
            $p->vendedor?->nombre ?? '—',
            $p->producto?->nombre ?? '—',
            (float)$p->total,
            (float)($p->total_bs ?? 0),
            $p->estatus === 'ACTIVA' ? 'Vigente' : ($p->estatus === 'ANULADA' ? 'Anulada' : ($p->status ?? $p->estatus ?? '—')),
        ];
    }

    /**
     * Agrega la hoja de Comisiones después de la de Ventas.
     */
    protected function afterSheet($sheet, $spreadsheet): void
    {
        // Crear segunda hoja: Comisiones
        $comSheet = $spreadsheet->createSheet();
        $comSheet->setTitle('Comisiones');

        $comHeaders = ['Beneficiario', 'Rol', 'Pólizas', 'Base (USD)', 'Tasa', 'Comisión (USD)', 'Estado'];
        foreach ($comHeaders as $i => $h) {
            $comSheet->setCellValue([$i + 1, 1], $h);
        }

        // Estilo de encabezados
        $lastCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($comHeaders));
        $comSheet->getStyle("A1:{$lastCol}1")->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '1E3A5F']],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
        ]);

        // Agrupar por vendedor
        $grouped = $this->policies->groupBy('vendedor_id');
        $rowIndex = 2;

        foreach ($grouped as $vendedorId => $pols) {
            $vendedor = $pols->first()->vendedor;
            if (!$vendedor) continue;

            $base = (float)$pols->sum('total');
            $tasa = strtolower($vendedor->cargo) === 'agente' ? 0.10 : 0.05;
            $comision = $base * $tasa;

            $comSheet->setCellValue([1, $rowIndex], $vendedor->nombre);
            $comSheet->setCellValue([2, $rowIndex], $vendedor->cargo);
            $comSheet->setCellValue([3, $rowIndex], $pols->count());
            $comSheet->setCellValue([4, $rowIndex], $base);
            $comSheet->setCellValue([5, $rowIndex], ($tasa * 100) . '%');
            $comSheet->setCellValue([6, $rowIndex], $comision);
            $comSheet->setCellValue([7, $rowIndex], 'Pendiente');
            $rowIndex++;
        }

        foreach ($comSheet->getColumnIterator() as $col) {
            $comSheet->getColumnDimension($col->getColumnIndex())->setAutoSize(true);
        }

        // Volver a la primera hoja activa
        $spreadsheet->setActiveSheetIndex(0);
    }
}
