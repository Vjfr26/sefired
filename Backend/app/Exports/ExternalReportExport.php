<?php

namespace App\Exports;

use App\Models\Poliza;
use App\Support\BienPoliza;
use App\Support\CuadroCoberturas;
use App\Support\Moneda;
use App\Support\NombreSplitter;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;

/**
 * Exportación del Reporte Externo (carga masiva para Superintendencia).
 * Estructura de 48 columnas: 13 del tomador (A–M), 13 del asegurado (N–Z)
 * y 22 de la póliza/vehículo (AA–AV).
 */
class ExternalReportExport extends BaseExport
{
    protected Collection $policies;
    protected ?string $templatePath;
    protected ?array $columns;   // claves seleccionadas (en orden); null = todas
    protected string $moneda;    // moneda de salida de los montos (USD|BS|EUR)
    protected float $tasaUsd;
    protected float $tasaEur;

    public function __construct(Collection $policies, ?array $columns = null, string $moneda = 'USD', float $tasaUsd = 0, float $tasaEur = 0)
    {
        $this->policies = $policies;
        $this->templatePath = $this->findTemplatePath();
        $this->moneda  = Moneda::normalizar($moneda);
        $this->tasaUsd = $tasaUsd;
        $this->tasaEur = $tasaEur;

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

    /** Definición canónica de las 48 columnas (clave => encabezado), en orden. */
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
            // Bloque del ASEGURADO (N–Z): mismos 13 campos del tomador. La
            // estructura oficial los pide aparte porque tomador y asegurado
            // no siempre son la misma persona.
            'nacionalidad_asegurado'     => 'Nacionalida Asegurado',
            'cedula_asegurado'           => 'Cedula/Rif Asegurado',
            'primer_nombre_asegurado'    => 'Primer Nombre Asegurado',
            'segundo_nombre_asegurado'   => 'Segundo Nombre Asegurado',
            'primer_apellido_asegurado'  => 'Primer Apellido Asegurado',
            'segundo_apellido_asegurado' => 'Segundo Apellido Asegurado',
            'fecha_nacimiento_asegurado' => 'Fecha Nacimiento Asegurado',
            'sexo_asegurado'             => 'Sexo Asegurado',
            'direccion_asegurado'        => 'Direccion Asegurado',
            'ciudad_asegurado'           => 'Ciudad Asegurado',
            'estado_asegurado'           => 'Estado Asegurado',
            'telefono_asegurado'         => 'Telefono Asegurado',
            'correo_asegurado'           => 'Correo Asegurado',
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

        // Mismo snapshot que arma el PDF: incluye lo heredado de la póliza
        // predecesora en renovaciones viejas.
        $snapshot = CuadroCoberturas::snapshot($p);

        // Datos del tomador
        $tomadorNombreFull = $snapshot['tomador']['nombre'] ?? $sol?->nombre_tomador ?? $pers?->nombre ?? '';
        $tomadorCiFull = $snapshot['tomador']['ci'] ?? $sol?->ci_tomador ?? $pers?->cedula ?? '';
        $parsedCi = $this->parseCiAndRif($tomadorCiFull);
        $splitName = NombreSplitter::desglose($tomadorNombreFull);

        $tomadorNacimiento = ($pers && $pers->nacimiento)
            ? (is_string($pers->nacimiento) ? date('d/m/Y', strtotime($pers->nacimiento)) : $pers->nacimiento->format('d/m/Y'))
            : '01/01/1980';
        $tomadorSexo = $pers?->sexo ? (str_starts_with(strtolower($pers->sexo), 'f') ? 'F' : 'M') : 'M';
        // Dirección y teléfono corregidos en "Editar Póliza" quedan en el
        // snapshot; sin corrección, los del cliente en vivo.
        $tomadorDireccion = $this->primero($snapshot['tomador']['direccion'] ?? null, $pers?->direccion) ?? 'Caracas';
        $tomadorCiudad = $pers?->ciudad ?? 'Caracas';
        $tomadorEstado = $pers?->estado ?? 'Distrito Capital';
        $tomadorTelefono = $this->primero($snapshot['tomador']['telefono'] ?? null, $pers?->celular, $pers?->telefono) ?? '02120000000';
        $tomadorCorreo = $pers?->correo ?? 'correo@ejemplo.com';

        // ── Datos del asegurado ───────────────────────────────────────────
        // Casi siempre ES el tomador y su bloque repite los mismos datos.
        // Cuando es otra persona, de él solo se capturan nombre, cédula,
        // dirección y teléfono (ver Solicitud): nacimiento, sexo y correo se
        // dejan VACÍOS, porque copiar los del tomador sería declararle a la
        // Superintendencia datos de alguien más.
        $asegNombreFull = $this->primero(
            $snapshot['asegurado']['nombre'] ?? null,
            $p->asegurado_nombre,
            $sol?->asegurado_nombre,
        ) ?? $tomadorNombreFull;
        $asegCiFull = $this->primero(
            $snapshot['asegurado']['ci'] ?? null,
            $p->asegurado_ci,
            $sol?->asegurado_ci,
        ) ?? $tomadorCiFull;
        $parsedCiAseg  = $this->parseCiAndRif($asegCiFull);
        $splitNameAseg = NombreSplitter::desglose($asegNombreFull);

        // El asegurado es el propio tomador cuando comparten cédula (o cuando
        // no se registró una cédula distinta para él).
        $mismoTomador = $parsedCiAseg['numero'] === '' || $parsedCiAseg['numero'] === $parsedCi['numero'];

        // Dirección y teléfono propios; sin ellos hereda los del tomador
        // (mismo criterio que el PDF de la póliza). Ciudad y estado van con
        // la dirección: solo se exportan si la dirección es la del tomador.
        $asegDireccionPropia = $this->primero(
            $snapshot['asegurado']['direccion'] ?? null,
            $sol?->asegurado_direccion,
        );
        $asegTelefonoPropio = $this->primero(
            $snapshot['asegurado']['telefono'] ?? null,
            $sol?->asegurado_telefono,
        );
        $heredaDireccion = $mismoTomador || $asegDireccionPropia === null;

        $asegDireccion = $asegDireccionPropia ?? $tomadorDireccion;
        $asegTelefono  = $asegTelefonoPropio ?? $tomadorTelefono;
        $asegCiudad    = $heredaDireccion ? $tomadorCiudad : '';
        $asegEstado    = $heredaDireccion ? $tomadorEstado : '';
        $asegNacimiento = $mismoTomador ? $tomadorNacimiento : '';
        $asegSexo       = $mismoTomador ? $tomadorSexo : '';
        $asegCorreo     = $mismoTomador ? $tomadorCorreo : '';

        // Datos del vehículo: las correcciones hechas en "Editar Póliza" viven
        // en el snapshot y mandan campo por campo; el bien vivo rellena el
        // resto. Antes se leía solo el bien vivo y ninguna corrección de placa
        // o de datos del vehículo llegaba al reporte.
        $attrs = BienPoliza::datos($p, $snapshot)['atributos'];
        $marca = $attrs['marca'] ?? 'TOYOTA';
        $modelo = $attrs['modelo'] ?? 'COROLLA';
        $anio = $attrs['anio'] ?? 2015;
        // La placa va SIN los puntos y espacios que la migración le agregó a
        // los duplicados de renovación para esquivar el índice único: al
        // regulador se le declara la placa real, no la ensuciada.
        // De los atributos ya fusionados, no de placa_idx: esa columna es un
        // espejo del bien VIVO y se comía la corrección del snapshot.
        $placa = BienPoliza::placaNormalizada(BienPoliza::valor($attrs, 'placa') ?: ($bien?->placa_idx ?? ''));
        $color = $attrs['color'] ?? 'BLANCO';
        $traccion = '4X2';
        // El serial de esos duplicados quedó vacío (el índice único tampoco
        // dejaba repetirlo), así que se toma del bien gemelo — mismo dueño y
        // misma placa. Ver BienPoliza.
        $serialCarroceria = BienPoliza::serialCarroceria($attrs, $bien) ?: '—';
        $serialMotor = BienPoliza::valor($attrs, 'serial_motor', 'serialMotor') ?: '—';
        $tipoVehiculo = $attrs['tipo'] ?? 'SEDAN';
        $uso = $attrs['uso'] ?? 'PARTICULAR';
        $puestos = $attrs['puestos'] ?? 5;

        // Datos de la póliza
        $nroPoliza = $p->nro_contrato;
        $inicioVigencia = $p->fecha_emision ? (is_string($p->fecha_emision) ? date('d/m/Y', strtotime($p->fecha_emision)) : $p->fecha_emision->format('d/m/Y')) : now()->format('d/m/Y');
        $finVigencia = $p->fecha_vencimiento ? (is_string($p->fecha_vencimiento) ? date('d/m/Y', strtotime($p->fecha_vencimiento)) : $p->fecha_vencimiento->format('d/m/Y')) : now()->addYear()->format('d/m/Y');
        // ── Sumas aseguradas y prima ──────────────────────────────────────
        // Salen de la MISMA cascada que imprime el cuadro del PDF: antes el
        // Excel declaraba `cobertura_dolares`, que está en 0 en casi toda la
        // cartera migrada y repetía el mismo número en las dos columnas.
        $cobs      = $snapshot['coberturas'] ?? [];
        // Para ubicar la tarifa por nombre de nivel ("tipo / clase") el PDF usa
        // el bien del snapshot y cae al vivo — mismo orden acá.
        $attrsSnap = $snapshot['bien']['atributos'] ?? $attrs;
        $tarifa    = CuadroCoberturas::tarifa($p, $snapshot, $cobs, $attrsSnap);
        $tipoCal   = $snapshot['producto']['tipo_calculo'] ?? $p->producto?->tipo_calculo ?? 'fijo';
        // La estructura de una tarifa viva la define el tipo de cálculo ACTUAL
        // del producto (pudo cambiar desde la emisión) — igual que el PDF.
        if ($tarifa['viva']) $tipoCal = $p->producto?->tipo_calculo ?? $tipoCal;
        $renglones = CuadroCoberturas::renglones($p, $snapshot, $cobs, $tarifa['datos'], $tipoCal, $bien?->tipo);
        $sumas     = CuadroCoberturas::sumasCosasPersonas($renglones);

        // La moneda de origen es la NATIVA de la póliza (la congelada al
        // emitir), no la que el producto tenga hoy. Y la conversión usa la
        // tasa de emisión de la póliza, que es la que congeló sus montos —
        // con la tasa del día el Excel no cuadraba con ningún PDF. Solo los
        // montos que salen de una tarifa cargada hoy van a la tasa de hoy,
        // porque así los imprime el documento.
        $tgt          = $this->moneda;
        $nativa       = $p->monedaNativa();
        $factorPoliza = $this->factor($nativa, $tgt, (float) $p->tasa_emision, (float) $p->tasa_emision_eur);
        $factorHoy    = $this->factor($nativa, $tgt, 0, 0);
        $factorSumas  = ($sumas['de_tarifa'] && $tarifa['viva']) ? $factorHoy : $factorPoliza;

        $sumaCosas    = round($sumas['cosas'] * $factorSumas, 2);
        $sumaPersonas = round($sumas['personas'] * $factorSumas, 2);
        $primaAnual   = round((float) $p->total * $factorPoliza, 2);
        // Sin tasa para convertir, la fila se queda en su moneda nativa y lo
        // declara en la columna MONEDA (mismo criterio que el PDF): es
        // preferible a exportar un monto convertido con una tasa inventada.
        $moneda = ($factorPoliza === 1.0 && $nativa !== $tgt) ? $nativa : $tgt;
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
            'nacionalidad_asegurado'     => $parsedCiAseg['nacionalidad'],
            'cedula_asegurado'           => $parsedCiAseg['numero'],
            'primer_nombre_asegurado'    => $splitNameAseg['primer_nombre'],
            'segundo_nombre_asegurado'   => $splitNameAseg['segundo_nombre'],
            'primer_apellido_asegurado'  => $splitNameAseg['primer_apellido'],
            'segundo_apellido_asegurado' => $splitNameAseg['segundo_apellido'],
            'fecha_nacimiento_asegurado' => $asegNacimiento,
            'sexo_asegurado'             => $asegSexo,
            'direccion_asegurado'        => $asegDireccion,
            'ciudad_asegurado'           => $asegCiudad,
            'estado_asegurado'           => $asegEstado,
            'telefono_asegurado'         => $asegTelefono,
            'correo_asegurado'           => $asegCorreo,
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
     * Factor para pasar un monto de la moneda nativa de la póliza a la del
     * export. Sin tasa propia (las pólizas viejas quedaron con el default
     * 1.0 = "sin tasa") usa la del día; sin ninguna, deja el monto como está
     * en vez de convertirlo con una tasa inventada.
     */
    private function factor(string $desde, string $hasta, float $tasaUsd = 0, float $tasaEur = 0): float
    {
        if (Moneda::normalizar($desde) === Moneda::normalizar($hasta)) return 1.0;
        if ($tasaUsd <= 1) $tasaUsd = $this->tasaUsd;
        if ($tasaEur <= 1) $tasaEur = $this->tasaEur;

        $f = Moneda::convertir(1.0, $desde, $hasta, $tasaUsd, $tasaEur);

        return $f > 0 ? $f : 1.0;
    }

    /** Primer valor no vacío ('' incluido: los snapshots viejos lo usan por null). */
    private function primero(...$valores): ?string
    {
        foreach ($valores as $v) {
            if ($v !== null && trim((string) $v) !== '') {
                return (string) $v;
            }
        }
        return null;
    }

    /** Letra de columna de una clave (null si no está en la selección). */
    private function letraColumna(string $key): ?string
    {
        $i = array_search($key, $this->columnKeys(), true);
        return $i === false ? null : Coordinate::stringFromColumnIndex($i + 1);
    }

    /**
     * Sobreescribe build() para soportar la plantilla de carga masiva.
     */
    protected function build(): Spreadsheet
    {
        // La cascada de coberturas gasta 3 consultas por póliza (tarifa y
        // póliza predecesora). En un export de la cartera completa son cientos
        // de miles: se resuelven en bloque y se memorizan mientras dura este
        // archivo. El memo se apaga al terminar para no arrastrar tarifas
        // viejas a la siguiente petición.
        CuadroCoberturas::precargarPredecesores($this->policies);
        BienPoliza::precargarSeriales($this->policies);

        try {
            // La plantilla oficial es de 48 columnas fijas: solo se usa cuando
            // NO se personalizó. Si el usuario quitó columnas, se genera un
            // Excel propio.
            if ($this->templatePath && $this->columns === null) {
                return $this->buildFromTemplate();
            }

            return parent::build();
        } finally {
            CuadroCoberturas::memoriza(false);
            BienPoliza::olvidar();
        }
    }

    /**
     * Genera el Excel a partir de la plantilla existente.
     */
    protected function buildFromTemplate(): Spreadsheet
    {
        $spreadsheet = IOFactory::load($this->templatePath);
        $sheet = $spreadsheet->getActiveSheet();

        // El bloque "Asegurado" (N–Z) de la plantilla ya se llena con los
        // datos del asegurado — antes se eliminaba y el archivo salía con
        // solo 35 columnas, sin esos datos.
        $keys      = $this->columnKeys();
        $ultimaCol = Coordinate::stringFromColumnIndex(count($keys));
        // RECIBO se escribe como fórmula que copia el N° de póliza.
        $colPoliza = $this->letraColumna('numero_poliza');

        $rowIndex = 2;
        $data = $this->collection();

        foreach ($data as $row) {
            $mapped = $this->map($row);

            foreach ($mapped as $colIndex => $value) {
                $colLetter = Coordinate::stringFromColumnIndex($colIndex + 1);
                $cell = $sheet->getCell($colLetter . $rowIndex);
                $key  = $keys[$colIndex];

                if ($key === 'recibo' && $colPoliza) {
                    $cell->setValue('=' . $colPoliza . $rowIndex);
                } elseif (in_array($key, self::NUMERICAS, true) && is_numeric($value)) {
                    $cell->setValue((float)$value);
                } else {
                    $cell->setValueExplicit((string) $value, DataType::TYPE_STRING);
                }
            }

            if ($rowIndex > 2) {
                $sheet->duplicateStyle($sheet->getStyle("A2:{$ultimaCol}2"), "A{$rowIndex}:{$ultimaCol}{$rowIndex}");
            }
            $rowIndex++;
        }

        // Limpiar filas sobrantes de la plantilla
        $highestRow = $sheet->getHighestRow();
        if ($highestRow >= $rowIndex) {
            $sheet->removeRow($rowIndex, $highestRow - $rowIndex + 1);
        }

        // La plantilla oficial trae sus celdas en formato "General": los
        // montos perdían los céntimos (5000.00 se veía "5000").
        $this->formatearMontos($sheet);

        return $spreadsheet;
    }

    /** Claves de columnas monetarias — llevan formato con céntimos (#,##0.00). */
    private const MONETARIAS = ['suma_cosas', 'suma_personas', 'prima_anual'];

    /** Claves que van como número en el Excel, no como texto. */
    private const NUMERICAS = ['anio', 'puestos', 'suma_cosas', 'suma_personas', 'prima_anual', 'codigo_intermediario'];

    /**
     * Formato con dos decimales a las columnas de montos. Sin esto Excel usa
     * el formato "General" y los céntimos desaparecen (5000.00 → "5000").
     */
    private function formatearMontos($sheet): void
    {
        $highestRow = $sheet->getHighestRow();
        if ($highestRow < 2) return;

        foreach ($this->columnKeys() as $i => $key) {
            if (!in_array($key, self::MONETARIAS, true)) continue;
            $col = Coordinate::stringFromColumnIndex($i + 1);
            $sheet->getStyle("{$col}2:{$col}{$highestRow}")
                  ->getNumberFormat()->setFormatCode('#,##0.00');
        }
    }

    /**
     * Para la generación sin plantilla: formato de montos + fórmula RECIBO.
     */
    protected function afterSheet($sheet, $spreadsheet): void
    {
        $this->formatearMontos($sheet);

        // Solo en formato completo la columna RECIBO es la fórmula que copia
        // el N° de póliza. En formato personalizado el valor de RECIBO ya
        // viene en los datos.
        if ($this->columns !== null) {
            return;
        }
        $colRecibo = $this->letraColumna('recibo');
        $colPoliza = $this->letraColumna('numero_poliza');
        if (!$colRecibo || !$colPoliza) {
            return;
        }
        $highestRow = $sheet->getHighestRow();
        for ($r = 2; $r <= $highestRow; $r++) {
            $sheet->getCell($colRecibo . $r)->setValue('=' . $colPoliza . $r);
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
}
