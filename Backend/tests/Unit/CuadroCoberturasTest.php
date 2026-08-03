<?php

namespace Tests\Unit;

use App\Support\CuadroCoberturas;
use PHPUnit\Framework\TestCase;

/**
 * Reparto de los renglones del cuadro en las dos columnas que pide la carga
 * masiva. La cascada que produce los renglones necesita BD (tarifas, póliza
 * predecesora) y se verifica contra el PDF; acá se prueba el reparto puro.
 */
class CuadroCoberturasTest extends TestCase
{
    /** @return list<array{clave: string, label: string, monto: float, de_tarifa: bool}> */
    private function renglones(array ...$pares): array
    {
        return array_map(
            fn ($p) => ['clave' => $p[0], 'label' => $p[1], 'monto' => (float) $p[2], 'de_tarifa' => $p[3] ?? false],
            $pares
        );
    }

    public function test_separa_cosas_y_personas_por_clave(): void
    {
        $r = $this->renglones(
            ['suma_persona', 'Daños a Personas', 2997],
            ['suma_cosa', 'Daños a Cosas', 3753],
        );

        $this->assertSame(
            ['cosas' => 3753.0, 'personas' => 2997.0, 'de_tarifa' => false],
            CuadroCoberturas::sumasCosasPersonas($r)
        );
    }

    public function test_separa_por_el_nombre_del_renglon(): void
    {
        // Renglones nombrados a mano en el tarifario: la clave no dice nada,
        // pero el nombre visible sí.
        $r = $this->renglones(
            ['rc_1', 'Responsabilidad Civil por Cosas', 900, true],
            ['rc_2', 'Responsabilidad Civil por Personas', 800, true],
        );

        $this->assertSame(
            ['cosas' => 900.0, 'personas' => 800.0, 'de_tarifa' => true],
            CuadroCoberturas::sumasCosasPersonas($r)
        );
    }

    public function test_sin_separacion_ambas_llevan_la_suma_mayor(): void
    {
        // RCV por nivel: el cuadro del PDF muestra un solo monto.
        $r = $this->renglones(['suma', 'Doble Cabina / PICK-UP', 4382, true]);

        $this->assertSame(
            ['cosas' => 4382.0, 'personas' => 4382.0, 'de_tarifa' => true],
            CuadroCoberturas::sumasCosasPersonas($r)
        );
    }

    public function test_plan_sin_cosas_ni_personas_usa_la_cobertura_principal(): void
    {
        $r = $this->renglones(
            ['medicos', 'Gastos Médicos', 11198, true],
            ['muerte_accidental', 'Muerte Accidental', 55990, true],
            ['funerarios', 'Gastos Funerarios', 11198, true],
        );

        $this->assertSame(
            ['cosas' => 55990.0, 'personas' => 55990.0, 'de_tarifa' => true],
            CuadroCoberturas::sumasCosasPersonas($r)
        );
    }

    public function test_solo_una_de_las_dos_se_replica_en_la_otra(): void
    {
        $r = $this->renglones(['suma_cosa', 'Daños a Cosas', 3753]);

        $this->assertSame(
            ['cosas' => 3753.0, 'personas' => 3753.0, 'de_tarifa' => false],
            CuadroCoberturas::sumasCosasPersonas($r)
        );
    }

    public function test_sin_renglones_da_cero(): void
    {
        $this->assertSame(
            ['cosas' => 0.0, 'personas' => 0.0, 'de_tarifa' => false],
            CuadroCoberturas::sumasCosasPersonas([])
        );
    }
}
