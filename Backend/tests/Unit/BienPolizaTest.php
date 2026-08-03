<?php

namespace Tests\Unit;

use App\Support\BienPoliza;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Normalización de placa y lectura de atributos. El rescate del serial desde
 * el bien gemelo necesita BD y se verifica con el reporte.
 */
class BienPolizaTest extends TestCase
{
    /** @return array<string, array{0: ?string, 1: string}> */
    public static function placas(): array
    {
        return [
            'limpia'                => ['AB123CD', 'AB123CD'],
            'punto al inicio'       => ['.AB123CD', 'AB123CD'],
            'punto al final'        => ['AB123CD.', 'AB123CD'],
            'puntos a ambos lados'  => ['.AB123CD.', 'AB123CD'],
            'varios puntos'         => ['..AB123CD', 'AB123CD'],
            'punto y espacio'       => ['08AA3GW .', '08AA3GW'],
            'con guion'             => ['AB-123-CD', 'AB123CD'],
            'minúsculas'            => ['ab123cd', 'AB123CD'],
            'espacios alrededor'    => ['  AB123CD  ', 'AB123CD'],
            'vacía'                 => ['', ''],
            'nula'                  => [null, ''],
        ];
    }

    #[DataProvider('placas')]
    public function test_normaliza_la_placa(?string $placa, string $esperada): void
    {
        $this->assertSame($esperada, BienPoliza::placaNormalizada($placa));
    }

    public function test_valor_toma_la_primera_clave_con_contenido(): void
    {
        $attrs = ['serial_carroceria' => 'ABC123', 'serialCarroceria' => 'VIEJO'];

        $this->assertSame('ABC123', BienPoliza::valor($attrs, 'serial_carroceria', 'serialCarroceria'));
    }

    public function test_valor_cae_al_alias_camel(): void
    {
        // Atributos de otra época del sistema.
        $attrs = ['serialCarroceria' => 'ABC123'];

        $this->assertSame('ABC123', BienPoliza::valor($attrs, 'serial_carroceria', 'serialCarroceria'));
    }

    public function test_valor_ignora_vacios(): void
    {
        // El `??` de antes daba '' por bueno y dejaba la celda en blanco.
        $attrs = ['serial_carroceria' => '   ', 'serialCarroceria' => 'ABC123'];

        $this->assertSame('ABC123', BienPoliza::valor($attrs, 'serial_carroceria', 'serialCarroceria'));
    }

    public function test_valor_sin_ninguna_clave(): void
    {
        $this->assertSame('', BienPoliza::valor(['marca' => 'FIAT'], 'serial_carroceria', 'serialCarroceria'));
    }
}
