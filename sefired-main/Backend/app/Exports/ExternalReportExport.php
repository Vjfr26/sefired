<?php

namespace App\Exports;

use App\Models\Poliza;
use App\Models\Vehiculo;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;

/**
 * Exportación del Reporte Externo (carga masiva para Superintendencia).
 * Estructura de 35 columnas con formato específico.
 */
class ExternalReportExport extends BaseExport
{
    protected Collection $policies;
    protected ?string $templatePath;

    public function __construct(Collection $policies)
    {
        $this->policies = $policies;
        $this->templatePath = $this->findTemplatePath();
    }

    public function title(): string
    {
        return 'Reporte Externo';
    }

    public function headings(): array
    {
        return [
            'Nacionalida Tomador', 'Cedula/Rif Tomador', 'Primer Nombre Tomador', 'Segundo Nombre Tomador',
            'Primer Apellido Tomador', 'Segundo Apellido Tomador', 'Fecha Nacimiento', 'Sexo',
            'Direccion', 'Ciudad', 'Estado', 'Telefono', 'Correo',
            'Marca', 'Modelo', 'Año', 'Placa', 'Color', 'TRACCION',
            'Serial Carroceria', 'Serial Motor', 'Tipo de Vehiculo', 'Uso', 'Cantidad de Puestos',
            'Numero de Poliza', 'Inicio Vigencia', 'Fin de Vigencia', 'Suma Asegurada Daños a Cosas',
            'Suma Asegurada daños a personas', 'Prima Anual', 'MONEDA', 'NAC REFERIDOR',
            'RIF REFERIDOR', 'CODIGO INTERMEDIARIO', 'RECIBO'
        ];
    }

    public function collection(): Collection
    {
        return $this->policies;
    }

    public function map($p): array
    {
        $sol = $p->solicitud;
        $cli = $sol?->cliente;
        $pers = $cli?->persona;

        $veh = null;
        if ($sol && $sol->placa) {
            $veh = Vehiculo::with('modeloVehiculo')->where('placa', $sol->placa)->first();
        }

        $snapshot = is_array($p->snapshot_datos) ? $p->snapshot_datos : null;

        // Datos del tomador
        $tomadorNombreFull = $snapshot['tomador']['nombre'] ?? $sol?->nombre_tomador ?? $pers?->nombre ?? '';
        $tomadorCiFull = $snapshot['tomador']['ci'] ?? $sol?->ci_tomador ?? $pers?->cedula ?? '';
        $parsedCi = $this->parseCiAndRif($tomadorCiFull);
        $splitName = $this->splitNameHelper($tomadorNombreFull);

        $tomadorNacimiento = ($pers && $pers->nacimiento)
            ? (is_string($pers->nacimiento) ? date('d/m/Y', strtotime($pers->nacimiento)) : $pers->nacimiento->format('d/m/Y'))
            : '01/01/1980';
        $tomadorSexo = $pers?->sexo ? (str_starts_with(strtolower($pers->sexo), 'f') ? 'F' : 'M') : 'M';
        $tomadorDireccion = $pers?->direccion ?? 'Caracas';
        $tomadorCiudad = $pers?->ciudad ?? 'Caracas';
        $tomadorEstado = $pers?->estado ?? 'Distrito Capital';
        $tomadorTelefono = $pers?->celular ?? $pers?->telefono ?? '02120000000';
        $tomadorCorreo = $pers?->correo ?? 'correo@ejemplo.com';

        // Datos del vehículo
        $marca = $veh?->modeloVehiculo?->marca ?? 'TOYOTA';
        $modelo = $veh?->modeloVehiculo?->modelo ?? 'COROLLA';
        $anio = $veh?->anio ?? 2015;
        $placa = $sol?->placa ?? $veh?->placa ?? '';
        $color = $veh?->color ?? 'BLANCO';
        $traccion = '4X2';
        $serialCarroceria = $veh?->serial_carroceria ?? '—';
        $serialMotor = $veh?->serial_motor ?? '—';
        $tipoVehiculo = $veh?->tipo ?? 'SEDAN';
        $uso = $veh?->uso ?? 'PARTICULAR';
        $puestos = $veh?->puestos ?? 5;

        // Datos de la póliza
        $nroPoliza = $p->nro_contrato;
        $inicioVigencia = $p->fecha_emision ? (is_string($p->fecha_emision) ? date('d/m/Y', strtotime($p->fecha_emision)) : $p->fecha_emision->format('d/m/Y')) : now()->format('d/m/Y');
        $finVigencia = $p->fecha_vencimiento ? (is_string($p->fecha_vencimiento) ? date('d/m/Y', strtotime($p->fecha_vencimiento)) : $p->fecha_vencimiento->format('d/m/Y')) : now()->addYear()->format('d/m/Y');
        $sumaCosas = (float)$p->cobertura_dolares;
        $sumaPersonas = (float)$p->cobertura_dolares;
        $primaAnual = (float)$p->total;
        $moneda = $p->producto?->moneda ?? 'USD';
        $nacReferidor = 'V';
        $rifReferidor = '';
        $codIntermediario = $p->vendedor_id ?? 1;

        return [
            $parsedCi['nacionalidad'],
            $parsedCi['numero'],
            $splitName['primer_nombre'],
            $splitName['segundo_nombre'],
            $splitName['primer_apellido'],
            $splitName['segundo_apellido'],
            $tomadorNacimiento,
            $tomadorSexo,
            $tomadorDireccion,
            $tomadorCiudad,
            $tomadorEstado,
            $tomadorTelefono,
            $tomadorCorreo,
            $marca,
            $modelo,
            $anio,
            $placa,
            $color,
            $traccion,
            $serialCarroceria,
            $serialMotor,
            $tipoVehiculo,
            $uso,
            $puestos,
            $nroPoliza,
            $inicioVigencia,
            $finVigencia,
            $sumaCosas,
            $sumaPersonas,
            $primaAnual,
            $moneda,
            $nacReferidor,
            $rifReferidor,
            $codIntermediario,
            '' // RECIBO — se configura como fórmula en afterSheet
        ];
    }

    /**
     * Sobreescribe build() para soportar la plantilla de carga masiva.
     */
    protected function build(): Spreadsheet
    {
        if ($this->templatePath) {
            return $this->buildFromTemplate();
        }

        return parent::build();
    }

    /**
     * Genera el Excel a partir de la plantilla existente.
     */
    protected function buildFromTemplate(): Spreadsheet
    {
        $spreadsheet = IOFactory::load($this->templatePath);
        $sheet = $spreadsheet->getActiveSheet();

        // Eliminar columnas de "Asegurado" (N a Z) para 35 columnas
        $sheet->removeColumn('N', 13);

        $rowIndex = 2;
        $data = $this->collection();

        foreach ($data as $row) {
            $mapped = $this->map($row);

            foreach ($mapped as $colIndex => $value) {
                $colLetter = Coordinate::stringFromColumnIndex($colIndex + 1);
                $cell = $sheet->getCell($colLetter . $rowIndex);
                $colNum = $colIndex + 1;
                $isNumericColumn = in_array($colNum, [16, 24, 28, 29, 30, 34]);

                // Columna RECIBO = fórmula
                if ($colNum === 35) {
                    $cell->setValue('=Y' . $rowIndex);
                } elseif ($isNumericColumn && is_numeric($value)) {
                    $cell->setValue((float)$value);
                } else {
                    $cell->setValueExplicit($value, DataType::TYPE_STRING);
                }
            }

            if ($rowIndex > 2) {
                $sheet->duplicateStyle($sheet->getStyle('A2:AI2'), 'A' . $rowIndex . ':AI' . $rowIndex);
            }
            $rowIndex++;
        }

        // Limpiar filas sobrantes de la plantilla
        $highestRow = $sheet->getHighestRow();
        if ($highestRow >= $rowIndex) {
            $sheet->removeRow($rowIndex, $highestRow - $rowIndex + 1);
        }

        return $spreadsheet;
    }

    /**
     * Para la generación sin plantilla, aplicar la fórmula RECIBO.
     */
    protected function afterSheet($sheet, $spreadsheet): void
    {
        $highestRow = $sheet->getHighestRow();
        for ($r = 2; $r <= $highestRow; $r++) {
            $sheet->getCell('AI' . $r)->setValue('=Y' . $r);
        }
    }

    private function findTemplatePath(): ?string
    {
        $paths = [
            base_path('ESTRUCTURA_ARCH_MASIVA.xlsx'),
            base_path('../BD/ESTRUCTURA ARCHIVO CARG MASIVA.xlsx'),
            base_path('BD/ESTRUCTURA ARCHIVO CARG MASIVA.xlsx'),
        ];
        foreach ($paths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }
        return null;
    }

    private function parseCiAndRif($ci): array
    {
        $ci = trim(str_replace([' ', '.', ','], '', $ci));
        if (preg_match('/^([VEJGVEJ])[-_]?(\d+)$/i', $ci, $matches)) {
            return [
                'nacionalidad' => strtoupper($matches[1]),
                'numero' => $matches[2]
            ];
        }
        return [
            'nacionalidad' => 'V',
            'numero' => preg_replace('/\D/', '', $ci)
        ];
    }

    private function splitNameHelper($fullName): array
    {
        $parts = array_values(array_filter(explode(' ', trim(preg_replace('/\s+/', ' ', $fullName)))));
        $count = count($parts);

        $primerNombre = '';
        $segundoNombre = '';
        $primerApellido = '';
        $segundoApellido = '';

        if ($count === 1) {
            $primerNombre = $parts[0];
        } elseif ($count === 2) {
            $primerNombre = $parts[0];
            $primerApellido = $parts[1];
        } elseif ($count === 3) {
            $primerNombre = $parts[0];
            $primerApellido = $parts[1];
            $segundoApellido = $parts[2];
        } elseif ($count >= 4) {
            $primerNombre = $parts[0];
            $segundoNombre = $parts[1];
            $primerApellido = $parts[2];
            $segundoApellido = implode(' ', array_slice($parts, 3));
        }

        return [
            'primer_nombre' => $primerNombre,
            'segundo_nombre' => $segundoNombre,
            'primer_apellido' => $primerApellido,
            'segundo_apellido' => $segundoApellido,
        ];
    }
}
