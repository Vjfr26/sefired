<?php

namespace App\Exports;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Storage;

/**
 * Clase base para exportaciones Excel usando PhpSpreadsheet.
 * Proporciona una interfaz limpia similar a Maatwebsite\Excel.
 */
abstract class BaseExport
{
    /**
     * Retorna los encabezados de la hoja.
     */
    abstract public function headings(): array;

    /**
     * Retorna la colección de datos a exportar.
     */
    abstract public function collection(): Collection;

    /**
     * Mapea cada fila de datos a un array de celdas.
     */
    abstract public function map($row): array;

    /**
     * Título de la hoja.
     */
    public function title(): string
    {
        return 'Reporte';
    }

    /**
     * Genera la descarga HTTP directa del archivo Excel.
     */
    public function download(string $filename): StreamedResponse
    {
        return response()->streamDownload(function () {
            if (ob_get_level()) {
                ob_end_clean();
            }
            $spreadsheet = $this->build();
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
            $spreadsheet->disconnectWorksheets();
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Guarda el archivo Excel en un disco de Storage y retorna el contenido binario.
     */
    public function store(string $path, ?string $disk = null): string
    {
        $disk = $disk ?? config('filesystems.docs_disk');
        $spreadsheet = $this->build();
        $writer = new Xlsx($spreadsheet);

        ob_start();
        $writer->save('php://output');
        $content = ob_get_clean();

        $spreadsheet->disconnectWorksheets();

        Storage::disk($disk)->put($path, $content);

        return $content;
    }

    /**
     * Retorna el contenido binario del Excel sin guardar.
     */
    public function raw(): string
    {
        $spreadsheet = $this->build();
        $writer = new Xlsx($spreadsheet);

        ob_start();
        $writer->save('php://output');
        $content = ob_get_clean();

        $spreadsheet->disconnectWorksheets();

        return $content;
    }

    /**
     * Construye el Spreadsheet completo.
     */
    protected function build(): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle(mb_substr($this->title(), 0, 31));

        $headings = $this->headings();
        $data = $this->collection();

        // Escribir encabezados
        foreach ($headings as $colIndex => $heading) {
            $sheet->setCellValue([($colIndex + 1), 1], $heading);
        }

        // Estilo de encabezados
        $lastCol = Coordinate::stringFromColumnIndex(count($headings));
        $headerRange = "A1:{$lastCol}1";
        $sheet->getStyle($headerRange)->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1E3A5F']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'D1D5DB']]],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(28);

        // Escribir datos
        $rowIndex = 2;
        foreach ($data as $row) {
            $mapped = $this->map($row);
            foreach ($mapped as $colIndex => $value) {
                $colNum = $colIndex + 1;
                if (is_numeric($value) && !is_string($value)) {
                    $sheet->setCellValue([$colNum, $rowIndex], $value);
                } else {
                    $sheet->setCellValue([$colNum, $rowIndex], $value);
                }
            }

            // Estilo alterno de filas
            if ($rowIndex % 2 === 0) {
                $rowRange = "A{$rowIndex}:{$lastCol}{$rowIndex}";
                $sheet->getStyle($rowRange)->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F8FAFC']],
                ]);
            }

            $rowIndex++;
        }

        // Bordes para toda la tabla
        if ($rowIndex > 2) {
            $dataRange = "A1:{$lastCol}" . ($rowIndex - 1);
            $sheet->getStyle($dataRange)->applyFromArray([
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E5E7EB']]],
            ]);
        }

        // Auto-ajustar anchos de columna
        foreach ($sheet->getColumnIterator() as $col) {
            $sheet->getColumnDimension($col->getColumnIndex())->setAutoSize(true);
        }

        // Aplicar estilos adicionales definidos en la subclase
        $this->afterSheet($sheet, $spreadsheet);

        return $spreadsheet;
    }

    /**
     * Hook para aplicar estilos adicionales después de generar la hoja.
     * Subclases pueden sobreescribirlo.
     */
    protected function afterSheet($sheet, $spreadsheet): void
    {
        // No-op por defecto
    }
}
