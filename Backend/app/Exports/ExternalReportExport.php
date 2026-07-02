<?php

namespace App\Exports;

use App\Models\Poliza;
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
    protected ?array $columns;   // claves seleccionadas (en orden); null = todas

    public function __construct(Collection $policies, ?array $columns = null)
    {
        $this->policies = $policies;
        $this->templatePath = $this->findTemplatePath();

        // Solo claves válidas, en el orden canónico. Si están TODAS, se deja
        // null para usar la plantilla oficial (formato de la Superintendencia).
        $todas = array_keys($this->columnDefs());
        if (is_array($columns) && count($columns) > 0) {
            $sel = array_values(array_filter($todas, fn ($k) => in_array($k, $columns, true)));
            $this->columns = (count($sel) === count($todas)) ? null : $sel;
        } else {
            $this->columns = null;
        }
    }

    /** Definición canónica de las 35 columnas (clave => encabezado), en orden. */
    public function columnDefs(): array
    {
        return [
            'nacionalidad_tomador' => 'Nacionalida Tomador',
            'cedula_tomador'       => 'Cedula/Rif Tomador',
            'primer_nombre'        => 'Primer Nombre Tomador',
            'segundo_nombre'       => 'Segundo Nombre Tomador',
            'primer_apellido'      => 'Primer Apellido Tomador',
            'segundo_apellido'     => 'Segundo Apellido Tomador',
            'fecha_nacimiento'     => 'Fecha Nacimiento',
            'sexo'                 => 'Sexo',
            'direccion'            => 'Direccion',
            'ciudad'               => 'Ciudad',
            'estado'               => 'Estado',
            'telefono'             => 'Telefono',
            'correo'               => 'Correo',
            'marca'                => 'Marca',
            'modelo'               => 'Modelo',
            'anio'                 => 'Año',
            'placa'                => 'Placa',
            'color'                => 'Color',
            'traccion'             => 'TRACCION',
            'serial_carroceria'    => 'Serial Carroceria',
            'serial_motor'         => 'Serial Motor',
            'tipo_vehiculo'        => 'Tipo de Vehiculo',
            'uso'                  => 'Uso',
            'puestos'              => 'Cantidad de Puestos',
            'numero_poliza'        => 'Numero de Poliza',
            'inicio_vigencia'      => 'Inicio Vigencia',
            'fin_vigencia'         => 'Fin de Vigencia',
            'suma_cosas'           => 'Suma Asegurada Daños a Cosas',
            'suma_personas'        => 'Suma Asegurada daños a personas',
            'prima_anual'          => 'Prima Anual',
            'moneda'               => 'MONEDA',
            'nac_referidor'        => 'NAC REFERIDOR',
            'rif_referidor'        => 'RIF REFERIDOR',
            'codigo_intermediario' => 'CODIGO INTERMEDIARIO',
            'recibo'               => 'RECIBO',
        ];
    }

    /** Claves a exportar, en orden (todas si no se personalizó). */
    private function columnKeys(): array
    {
        return $this->columns ?? array_keys($this->columnDefs());
    }

    public function title(): string
    {
        return 'Reporte Externo';
    }

    public function headings(): array
    {
        $defs = $this->columnDefs();
        return array_map(fn ($k) => $defs[$k], $this->columnKeys());
    }

    public function collection(): Collection
    {
        return $this->policies;
    }

    public function map($p): array
    {
        $vals = $this->mapAssoc($p);
        return array_map(fn ($k) => $vals[$k] ?? '', $this->columnKeys());
    }

    /** Todos los valores por clave (mismas claves y orden que columnDefs). */
    private function mapAssoc($p): array
    {
        $sol = $p->solicitud;
        $pers = $sol?->persona;
        $bien = $sol?->bien;

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

        // Datos del vehículo desde BienAsegurado.atributos
        $attrs = $bien?->atributos ?? [];
        $marca = $attrs['marca'] ?? 'TOYOTA';
        $modelo = $attrs['modelo'] ?? 'COROLLA';
        $anio = $attrs['anio'] ?? 2015;
        $placa = $bien?->placa_idx ?? $attrs['placa'] ?? '';
        $color = $attrs['color'] ?? 'BLANCO';
        $traccion = '4X2';
        $serialCarroceria = $attrs['serial_carroceria'] ?? '—';
        $serialMotor = $attrs['serial_motor'] ?? '—';
        $tipoVehiculo = $attrs['tipo'] ?? 'SEDAN';
        $uso = $attrs['uso'] ?? 'PARTICULAR';
        $puestos = $attrs['puestos'] ?? 5;

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
            'nacionalidad_tomador' => $parsedCi['nacionalidad'],
            'cedula_tomador'       => $parsedCi['numero'],
            'primer_nombre'        => $splitName['primer_nombre'],
            'segundo_nombre'       => $splitName['segundo_nombre'],
            'primer_apellido'      => $splitName['primer_apellido'],
            'segundo_apellido'     => $splitName['segundo_apellido'],
            'fecha_nacimiento'     => $tomadorNacimiento,
            'sexo'                 => $tomadorSexo,
            'direccion'            => $tomadorDireccion,
            'ciudad'               => $tomadorCiudad,
            'estado'               => $tomadorEstado,
            'telefono'             => $tomadorTelefono,
            'correo'               => $tomadorCorreo,
            'marca'                => $marca,
            'modelo'               => $modelo,
            'anio'                 => $anio,
            'placa'                => $placa,
            'color'                => $color,
            'traccion'             => $traccion,
            'serial_carroceria'    => $serialCarroceria,
            'serial_motor'         => $serialMotor,
            'tipo_vehiculo'        => $tipoVehiculo,
            'uso'                  => $uso,
            'puestos'              => $puestos,
            'numero_poliza'        => $nroPoliza,
            'inicio_vigencia'      => $inicioVigencia,
            'fin_vigencia'         => $finVigencia,
            'suma_cosas'           => $sumaCosas,
            'suma_personas'        => $sumaPersonas,
            'prima_anual'          => $primaAnual,
            'moneda'               => $moneda,
            'nac_referidor'        => $nacReferidor,
            'rif_referidor'        => $rifReferidor,
            'codigo_intermediario' => $codIntermediario,
            // Con la plantilla, RECIBO se pone como fórmula (=Y). Sin plantilla
            // (formato personalizado), lleva el N° de póliza directamente.
            'recibo'               => $nroPoliza,
        ];
    }

    /**
     * Sobreescribe build() para soportar la plantilla de carga masiva.
     */
    protected function build(): Spreadsheet
    {
        // La plantilla oficial es de 35 columnas fijas: solo se usa cuando NO se
        // personalizó. Si el usuario quitó columnas, se genera un Excel propio.
        if ($this->templatePath && $this->columns === null) {
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
        // Solo en formato completo la columna RECIBO es la fórmula =Y (col 35).
        // En formato personalizado el valor de RECIBO ya viene en los datos.
        if ($this->columns !== null) {
            return;
        }
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
