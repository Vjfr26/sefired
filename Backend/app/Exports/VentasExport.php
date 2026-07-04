<?php

namespace App\Exports;

use App\Exports\Concerns\HasSelectableColumns;
use App\Models\Poliza;
use Illuminate\Support\Collection;

/**
 * Exportación del Reporte de Ventas y Comisiones.
 * Incluye dos secciones: ventas del período y comisiones agrupadas por vendedor.
 * Las columnas de la hoja "Ventas" son personalizables (la hoja "Comisiones"
 * es un resumen fijo).
 */
class VentasExport extends BaseExport
{
    use HasSelectableColumns;

    protected Collection $policies;

    public function __construct(Collection $policies, ?array $columns = null)
    {
        $this->policies = $policies;
        $this->initColumns($columns);
    }

    public function title(): string
    {
        return 'Ventas y Comisiones';
    }

    public function columnDefs(): array
    {
        return [
            'fecha'           => 'Fecha',
            'poliza'          => 'Póliza',
            'agente'          => 'Agente',
            'producto'        => 'Producto',
            'prima_usd'       => 'Prima (USD)',
            'prima_bs'        => 'Prima (Bs)',
            'estado'          => 'Estado',
            'comision_usd'    => 'Comisión (USD)',
            'estado_comision' => 'Estado Comisión',
        ];
    }

    public function collection(): Collection
    {
        return $this->policies;
    }

    protected function mapAssoc($p): array
    {
        return [
            'fecha'           => $p->fecha_emision ? $p->fecha_emision->format('d/m/Y') : '—',
            'poliza'          => $p->nro_contrato,
            'agente'          => $p->vendedor?->nombre ?? '—',
            'producto'        => $p->producto?->nombre ?? '—',
            'prima_usd'       => (float)$p->total,
            'prima_bs'        => (float)($p->total_bs ?? 0),
            'estado'          => $p->status === 'ACTIVA' ? 'Vigente' : ($p->status === 'ANULADA' ? 'Anulada' : ($p->status ?? '—')),
            'comision_usd'    => $p->comision ? (float) $p->comision->monto : null,
            'estado_comision' => $p->comision?->status ?? '—',
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

        $comHeaders = ['Beneficiario', 'Rol', 'Pólizas', 'Base (USD)', 'Tasa', 'Comisión Generada', 'Comisión Pagada', 'Comisión Pendiente'];
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

            $base       = (float) $pols->sum('total');
            $tasa       = \App\Models\Comision::tasaParaUsuario($vendedor);
            $sumEstado  = fn (?string $status) => round((float) $pols->sum(
                fn ($p) => ($p->comision && (!$status || $p->comision->status === $status)) ? (float) $p->comision->monto : 0
            ), 2);

            $comSheet->setCellValue([1, $rowIndex], $vendedor->nombre);
            $comSheet->setCellValue([2, $rowIndex], $vendedor->cargo);
            $comSheet->setCellValue([3, $rowIndex], $pols->count());
            $comSheet->setCellValue([4, $rowIndex], $base);
            $comSheet->setCellValue([5, $rowIndex], ($tasa * 100) . '%');
            $comSheet->setCellValue([6, $rowIndex], $sumEstado(null));
            $comSheet->setCellValue([7, $rowIndex], $sumEstado('PAGADA'));
            $comSheet->setCellValue([8, $rowIndex], $sumEstado('PENDIENTE'));
            $rowIndex++;
        }

        foreach ($comSheet->getColumnIterator() as $col) {
            $comSheet->getColumnDimension($col->getColumnIndex())->setAutoSize(true);
        }

        // Volver a la primera hoja activa
        $spreadsheet->setActiveSheetIndex(0);
    }
}
